import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initializeAuth: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  initializeAuth: async () => {
    try {
      // Check active session robustly
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session fetch error:", error);
        // Script Purificador: Destrucción física de tokens corruptos en el navegador del cliente
        if (error.message.includes('Refresh Token Not Found') || error.status === 400 || error.status === 401) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore signout errors if session is already dead
          }
          
          // Barrido agresivo de la caché del navegador para claves de Supabase
          Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('auth-session')) {
              window.localStorage.removeItem(key);
            }
          });
        }
        set({ session: null, user: null, isLoading: false });
        return;
      }

      set({ session, user: session?.user ?? null, isLoading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          set({ session, user: session?.user ?? null });
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          set({ session: null, user: null });
        }
      });
    } catch (err) {
      console.error("Critical auth initialization error:", err);
      set({ session: null, user: null, isLoading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
