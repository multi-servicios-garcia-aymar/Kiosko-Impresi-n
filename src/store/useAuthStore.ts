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
      // 1. Initial robust fetch
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // If the error is a 'Refresh Token Not Found', it means the session is dead.
        if (error.message.includes('Refresh Token') || error.status === 400 || error.status === 401) {
          console.warn("Cleared dead active session");
          // Safely remove the invalid session from localStorage
          window.localStorage.removeItem('kiosko-auth-session');
          set({ session: null, user: null, isLoading: false });
          return;
        }
        
        console.error("Session fetch error:", error);
        set({ session: null, user: null, isLoading: false });
        return;
      }

      set({ session, user: session?.user ?? null, isLoading: false });

      // 2. Listen for auth changes
      supabase.auth.onAuthStateChange(async (event: any, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          set({ session, user: session?.user ?? null });
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          window.localStorage.removeItem('kiosko-auth-session');
          set({ session: null, user: null });
        } else if (event === 'INITIAL_SESSION') {
           // Provide fallback if still struggling with invalid token
           if (!session) {
             set({ session: null, user: null });
           }
        }
      });
      
    } catch (err) {
      console.error("Critical auth initialization error:", err);
      window.localStorage.removeItem('kiosko-auth-session');
      set({ session: null, user: null, isLoading: false });
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    } finally {
      window.localStorage.removeItem('kiosko-auth-session');
      set({ user: null, session: null });
    }
  },
}));
