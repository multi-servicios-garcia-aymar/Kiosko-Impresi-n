import { create } from 'zustand';
import { PhotoTemplate, PhotoData, DEFAULT_TEMPLATES } from '../types/photo';
import { GalleryPhoto, getSavedPhotos, savePhotoToGallery, deleteSavedPhoto } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface PhotoStore {
  templates: PhotoTemplate[];
  selectedTemplate: PhotoTemplate;
  photos: PhotoData[];
  galleryPhotos: GalleryPhoto[];
  editingImageUrl: string | null;
  cloudSyncInitialized: boolean;
  
  setTemplates: (templates: PhotoTemplate[]) => void;
  setSelectedTemplate: (template: PhotoTemplate) => void;
  setPhotos: (photos: PhotoData[] | ((prev: PhotoData[]) => PhotoData[])) => void;
  setGalleryPhotos: (photos: GalleryPhoto[]) => void;
  setEditingImageUrl: (url: string | null) => void;
  
  loadPhotosForTemplate: (templateId: string) => void;
  savePhotosForTemplate: (templateId: string) => void;
  loadGalleryPhotos: () => Promise<void>;
  addPhotoToGallery: (compressedUrl: string) => Promise<GalleryPhoto | undefined>;
  removePhotoFromGallery: (id: string, cloudPath?: string) => Promise<void>;
  initializeCloudSync: () => void;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  templates: DEFAULT_TEMPLATES,
  selectedTemplate: DEFAULT_TEMPLATES[0],
  photos: [],
  galleryPhotos: [],
  editingImageUrl: null,
  cloudSyncInitialized: false,

  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setPhotos: (photosOrUpdater) => {
    if (typeof photosOrUpdater === 'function') {
      set((state) => ({ photos: photosOrUpdater(state.photos) }));
    } else {
      set({ photos: photosOrUpdater });
    }
  },
  
  setGalleryPhotos: (galleryPhotos) => set({ galleryPhotos }),
  setEditingImageUrl: (url) => set({ editingImageUrl: url }),

  loadPhotosForTemplate: (templateId) => {
    const savedPhotosStr = localStorage.getItem(`photo_state_${templateId}`);
    if (savedPhotosStr) {
      try {
        const dehydratedPhotos: PhotoData[] = JSON.parse(savedPhotosStr);
        const state = get();
        
        // Hydration: Restore the heavy Base64 URLs from the gallery memory
        const validPhotosMap = new Map(state.galleryPhotos.map(gp => [gp.id, gp]));
        const hydratedPhotos = dehydratedPhotos
          .filter(p => validPhotosMap.has(p.id)) // Ensure it wasn't deleted
          .map(p => ({
            ...p,
            originalUrl: validPhotosMap.get(p.id)!.url,
            croppedUrl: validPhotosMap.get(p.id)!.url // Fallback if crop was lost
          }));
          
        set({ photos: hydratedPhotos });
      } catch (e) {
        console.error('Failed to parse saved photos', e);
        set({ photos: [] });
      }
    } else {
      set({ photos: [] });
    }
  },

  savePhotosForTemplate: (templateId) => {
    const { photos } = get();
    // Dehydration: Strip the massive Base64 strings before saving to the 5MB localStorage limit
    const dehydratedPhotos = photos.map(p => ({
      ...p,
      originalUrl: '',
      croppedUrl: ''
    }));
    
    try {
      localStorage.setItem(`photo_state_${templateId}`, JSON.stringify(dehydratedPhotos));
    } catch (e) {
      console.error('Critical quota error during save', e);
    }
  },

  loadGalleryPhotos: async () => {
    try {
      const saved = await getSavedPhotos();
      set({ galleryPhotos: saved });
      
      // Auto-purge zombie photos from the current layout if they no longer exist in the DB,
      // and refresh their URLs just in case the stored ones were dead blob URLs.
      set((state) => {
        const validPhotosMap = new Map(saved.map(gp => [gp.id, gp]));
        const cleanPhotos = state.photos
          .filter(p => validPhotosMap.has(p.id))
          .map(p => ({
            ...p,
            originalUrl: validPhotosMap.get(p.id)!.url,
            croppedUrl: validPhotosMap.get(p.id)!.url 
          }));
        return { photos: cleanPhotos };
      });
    } catch (e) {
      console.error('Failed to load gallery photos', e);
    }
  },

  addPhotoToGallery: async (compressedUrl) => {
    try {
      const newPhoto = await savePhotoToGallery(compressedUrl);
      const updated = await getSavedPhotos();
      set({ galleryPhotos: updated });
      return newPhoto;
    } catch (e) {
      console.error('Failed to save photo to gallery', e);
      return undefined;
    }
  },

  removePhotoFromGallery: async (id, cloudPath) => {
    try {
      await deleteSavedPhoto(id, cloudPath);
      const updated = await getSavedPhotos();
      set((state) => ({ 
        galleryPhotos: updated,
        photos: state.photos.filter(p => p.id !== id) // Remove from active print queue!
      }));
    } catch (e) {
      console.error('Failed to delete photo from gallery', e);
    }
  },

  initializeCloudSync: () => {
    const state = get();
    if (state.cloudSyncInitialized) return;

    // Listen to changes in the cloud table
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const machineId = user?.user_metadata?.kiosk_license?.hwid;

      if (!machineId) return;

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT and DELETE
            schema: 'public',
            table: 'kiosk_gallery_photos',
            filter: `machine_id=eq.${machineId}`
          },
          (payload) => {
            console.log('Realtime sync payload received:', payload);
            // Re-fetch the gallery from the cloud exactly as it is to sync up
            get().loadGalleryPhotos();
          }
        )
        .subscribe();

      set({ cloudSyncInitialized: true });
    });
  }
}));
