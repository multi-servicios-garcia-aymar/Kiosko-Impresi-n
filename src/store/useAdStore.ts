import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AdMediaItem {
  url: string;
  type: 'image' | 'video';
  duration?: number;
}

export interface KioskAd {
  id: string;
  title: string;
  description?: string;
  image_url: string; // Primary thumbnail
  media_items?: AdMediaItem[];
  cta_text?: string;
  cta_url?: string;
  target_audience: 'all' | 'registered' | 'anonymous' | 'trial';
  placement: 'carousel' | 'sidebar' | 'overlay';
  display_mode: 'fade' | 'slide' | 'zoom';
  transition_delay?: number; // Time the animation lasts (ms)
  priority: number;
  is_active: boolean;
  display_duration: number;
  target_machine_id: string | null;
  created_at: string;
}

interface AdStore {
  ads: KioskAd[];
  isLoading: boolean;
  isInitialized: boolean;
  
  fetchAds: (machineId?: string) => Promise<void>;
  initializeAdSync: (machineId?: string) => void;
  createAd: (ad: Partial<KioskAd>) => Promise<void>;
  updateAd: (id: string, updates: Partial<KioskAd>) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
}

export const useAdStore = create<AdStore>((set, get) => ({
  ads: [],
  isLoading: false,
  isInitialized: false,

  fetchAds: async (machineId) => {
    set({ isLoading: true });
    try {
      console.log('🔍 Buscando anuncios para:', machineId || 'Global');
      let query = supabase
        .from('kiosk_ads')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (machineId) {
        query = query.or(`target_machine_id.is.null,target_machine_id.eq.${machineId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error de Supabase al buscar anuncios:', error);
        // Si el error es de columna inexistente, informamos pero no bloqueamos
        if (error.code === 'PGRST204') {
          console.warn('⚠️ El esquema de la base de datos no está sincronizado. Por favor ejectua el SQL Master en el Dashboard de Supabase.');
        }
        set({ ads: [] });
        return;
      }

      if (data) {
        console.log('✅ Anuncios cargados:', data.length);
        set({ ads: data as KioskAd[] });
      }
    } catch (e) {
      console.error('❌ Error inesperado cargando anuncios:', e);
      set({ ads: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  initializeAdSync: (machineId) => {
    if (get().isInitialized) return;

    console.log('📡 Sincronización Realtime de Publicidad activada');

    const channel = supabase
      .channel('kiosk-ads-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kiosk_ads' },
        (payload) => {
          console.log('🔥 Cambio en Publicidad detectado:', payload.eventType);
          // Refetch for simplicity and security (handling filtering server-side)
          get().fetchAds(machineId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción de Publicidad activa');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Timeout en suscripción de Publicidad. Reintentando en 10s...');
          setTimeout(() => {
            set({ isInitialized: false });
            get().initializeAdSync(machineId);
          }, 10000);
        }
      }, 20000);

    set({ isInitialized: true });
  },

  createAd: async (ad) => {
    try {
      const { error } = await supabase.from('kiosk_ads').insert(ad);
      if (error) throw error;
    } catch (e) {
      console.error('Error creating ad', e);
      throw e;
    }
  },

  updateAd: async (id, updates) => {
    try {
      const { error } = await supabase.from('kiosk_ads').update(updates).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error updating ad', e);
      throw e;
    }
  },

  deleteAd: async (id) => {
    try {
      const { error } = await supabase.from('kiosk_ads').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting ad', e);
      throw e;
    }
  }
}));
