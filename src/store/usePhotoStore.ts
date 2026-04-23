import { create } from 'zustand';
import { PhotoTemplate, PhotoData, DEFAULT_TEMPLATES } from '../types/photo';
import { GalleryPhoto, getSavedPhotos, savePhotoToGallery, deleteSavedPhoto } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

interface PhotoStore {
  templates: PhotoTemplate[];
  selectedTemplate: PhotoTemplate;
  photos: PhotoData[];
  galleryPhotos: GalleryPhoto[];
  editingImageUrl: string | null;
  cloudSyncInitialized: boolean;
  syncStatus: 'connecting' | 'synced' | 'error' | 'idle';
  showAllPhotos: boolean;
  
  setTemplates: (templates: PhotoTemplate[]) => void;
  setSelectedTemplate: (template: PhotoTemplate) => void;
  setPhotos: (photos: PhotoData[] | ((prev: PhotoData[]) => PhotoData[])) => void;
  setGalleryPhotos: (photos: GalleryPhoto[]) => void;
  setEditingImageUrl: (url: string | null) => void;
  setShowAllPhotos: (show: boolean) => void;
  
  loadPhotosForTemplate: (templateId: string) => void;
  savePhotosForTemplate: (templateId: string) => void;
  loadGalleryPhotos: () => Promise<void>;
  addPhotoToGallery: (compressedUrl: string, templateId: string) => Promise<GalleryPhoto | undefined>;
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
  syncStatus: 'idle',
  showAllPhotos: false,

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
  setShowAllPhotos: (showAllPhotos) => set({ showAllPhotos }),

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
      set({ galleryPhotos: saved, syncStatus: 'synced' });
      
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

  addPhotoToGallery: async (compressedUrl, templateId) => {
    try {
      const newPhoto = await savePhotoToGallery(compressedUrl, templateId);
      const updated = await getSavedPhotos();
      set({ galleryPhotos: updated });
      return newPhoto;
    } catch (e) {
      console.error('Failed to save photo to gallery', e);
      return undefined;
    }
  },

  removePhotoFromGallery: async (id, cloudPath) => {
    set({ syncStatus: 'connecting' });
    try {
      await deleteSavedPhoto(id, cloudPath);
      // Success, refresh from local only to avoid deep sync if not needed
      const updated = await getSavedPhotos();
      set((state) => ({ 
        galleryPhotos: updated,
        photos: state.photos.filter(p => p.id !== id),
        syncStatus: 'synced'
      }));
    } catch (e) {
      console.error('Failed to delete photo from gallery', e);
      set({ syncStatus: 'error' });
      // Still remove locally to keep UI consistent
      const updated = await getSavedPhotos();
      set((state) => ({ 
        galleryPhotos: updated,
        photos: state.photos.filter(p => p.id !== id)
      }));
    }
  },

  initializeCloudSync: () => {
    if (get().cloudSyncInitialized) return;
    
    let activeChannel: any = null;
    let retryTimeout: any = null;

    // Listen to changes in the cloud table
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      const machineId = user?.user_metadata?.kiosk_license?.hwid;

      if (!machineId) {
        if (activeChannel) {
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }
        set({ cloudSyncInitialized: false, syncStatus: 'idle' });
        return;
      }

      if (get().cloudSyncInitialized) return;
      set({ cloudSyncInitialized: true, syncStatus: 'connecting' });

      console.log('📡 Cobertura Realtime activada para HWID:', machineId);

      const setupChannel = (attempt = 0) => {
        if (attempt > 5) { // Reducido para no saturar, pero con backoff mayor
          console.error('❌ Reintentos Realtime pausados por fallos continuos.');
          set({ syncStatus: 'error' });
          return;
        }

        // Clean up previous channel properly
        if (activeChannel) {
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }

        if (retryTimeout) clearTimeout(retryTimeout);

        // Usemos un channel ID estable basado en machineId para evitar fugas
        const channelId = `gallery-sync-${machineId}`;
        
        const channel = supabase
          .channel(channelId)
          .on(
            'postgres_changes',
            {
              event: '*', 
              schema: 'public',
              table: 'kiosk_gallery_photos',
              filter: `machine_id=eq.${machineId}`
            },
            async (payload) => {
              console.log('🔥 Cambios detectados en Galería Nube:', payload.eventType, payload);
              // Optimistically sync or deep reload
              if (payload.eventType === 'INSERT') {
                 const newRow = payload.new;
                 if (!newRow || !newRow.id || !newRow.storage_path) {
                   await get().loadGalleryPhotos();
                   return;
                 }

                 const currentGallery = get().galleryPhotos;
                 if (currentGallery.some(p => p.id === newRow.id)) return;
                 
                 const { data: { publicUrl } } = supabase.storage
                   .from('gallery')
                   .getPublicUrl(newRow.storage_path);
                    
                 const incomingPhoto: GalleryPhoto = {
                   id: newRow.id,
                   timestamp: new Date(newRow.created_at).getTime(),
                   url: publicUrl,
                   cloudPath: newRow.storage_path,
                   templateId: newRow.template_id || 'default'
                 };
                 
                 set((state) => ({ 
                    galleryPhotos: [incomingPhoto, ...state.galleryPhotos].sort((a, b) => b.timestamp - a.timestamp),
                    syncStatus: 'synced'
                 }));
              } 
              else if (payload.eventType === 'DELETE') {
                 const oldRow = payload.old;
                 if (oldRow && oldRow.id) {
                    set((state) => ({
                      galleryPhotos: state.galleryPhotos.filter(p => p.id !== oldRow.id),
                      photos: state.photos.filter(p => p.id !== oldRow.id),
                      syncStatus: 'synced'
                    }));
                 } else {
                   await get().loadGalleryPhotos();
                 }
              } else {
                await get().loadGalleryPhotos();
              }
            }
          );

        activeChannel = channel;

        channel.subscribe(async (status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Suscripción Realtime establecida');
            await get().loadGalleryPhotos();
            set({ syncStatus: 'synced' });
          } 
          else if (status === 'CLOSED') {
            console.warn('⚠️ Canal Realtime cerrado.');
            const currentMachine = getAuthMachineId();
            if (currentMachine === machineId) {
              retryTimeout = setTimeout(() => setupChannel(attempt + 1), 5000);
            }
          } 
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const errorMsg = err?.message || 'Sin detalles (Posible firewall o tabla no configurada para Realtime)';
            console.error(`❌ Error en canal Realtime (${status}):`, errorMsg);
            set({ syncStatus: 'error' });
            
            // Backoff más agresivo para timeouts
            const backoff = Math.min(60000, 10000 * Math.pow(2, attempt));
            retryTimeout = setTimeout(() => setupChannel(attempt + 1), backoff);
          }
        }, 30000); // 30 segundos de timeout para ser muy tolerantes
      };

      // Helper to check current machine id safely
      const getAuthMachineId = () => {
        const { user } = useAuthStore.getState();
        return user?.user_metadata?.kiosk_license?.hwid;
      };

      setupChannel();
    });
  }
}));
