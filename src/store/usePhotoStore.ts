import { create } from 'zustand';
import { PhotoTemplate, PhotoData, DEFAULT_TEMPLATES } from '../types/photo';
import { GalleryPhoto, getSavedPhotos, savePhotoToGallery, deleteSavedPhoto } from '../lib/storage';

interface PhotoStore {
  templates: PhotoTemplate[];
  selectedTemplate: PhotoTemplate;
  photos: PhotoData[];
  galleryPhotos: GalleryPhoto[];
  editingImageUrl: string | null;
  
  setTemplates: (templates: PhotoTemplate[]) => void;
  setSelectedTemplate: (template: PhotoTemplate) => void;
  setPhotos: (photos: PhotoData[] | ((prev: PhotoData[]) => PhotoData[])) => void;
  setGalleryPhotos: (photos: GalleryPhoto[]) => void;
  setEditingImageUrl: (url: string | null) => void;
  
  loadPhotosForTemplate: (templateId: string) => void;
  savePhotosForTemplate: (templateId: string) => void;
  loadGalleryPhotos: () => Promise<void>;
  addPhotoToGallery: (compressedUrl: string) => Promise<GalleryPhoto | undefined>;
  removePhotoFromGallery: (id: string) => Promise<void>;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  templates: DEFAULT_TEMPLATES,
  selectedTemplate: DEFAULT_TEMPLATES[0],
  photos: [],
  galleryPhotos: [],
  editingImageUrl: null,

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
    const savedPhotos = localStorage.getItem(`photo_state_${templateId}`);
    if (savedPhotos) {
      try {
        set({ photos: JSON.parse(savedPhotos) });
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
    localStorage.setItem(`photo_state_${templateId}`, JSON.stringify(photos));
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
            croppedUrl: validPhotosMap.get(p.id)!.url // Fallback, assume cropped is original if blob died (complex crop persistence omitted for simplicity, but guarantees UI doesn't break)
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

  removePhotoFromGallery: async (id) => {
    try {
      await deleteSavedPhoto(id);
      const updated = await getSavedPhotos();
      set((state) => ({ 
        galleryPhotos: updated,
        photos: state.photos.filter(p => p.id !== id) // Remove from active print queue!
      }));
    } catch (e) {
      console.error('Failed to delete photo from gallery', e);
    }
  }
}));
