import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface KioskAd {
  id: string;
  title: string;
  image_url: string;
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
      let query = supabase
        .from('kiosk_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (machineId) {
        // Fetch ads that are either for this machine specifically or for ALL machines (null)
        query = query.or(`target_machine_id.is.null,target_machine_id.eq.${machineId}`);
      }

      const { data, error } = await query;

      if (!error && data) {
        set({ ads: data as KioskAd[] });
      }
    } catch (e) {
      console.error('Error fetching ads', e);
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
      .subscribe();

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
