import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  initializeAuth: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  initializeAuth: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("Profile fetch error:", error);
          return null;
        }
        return data;
      };

      if (error) {
        if (error.message.includes('Refresh Token') || error.status === 400 || error.status === 401) {
          window.localStorage.removeItem('kiosko-auth-session');
          set({ session: null, user: null, profile: null, isLoading: false });
          return;
        }
        set({ session: null, user: null, profile: null, isLoading: false });
        return;
      }

      let profile = null;
      if (session?.user) {
        profile = await fetchProfile(session.user.id);
      }

      set({ session, user: session?.user ?? null, profile, isLoading: false });

      supabase.auth.onAuthStateChange(async (event: any, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          const profile = session?.user ? await fetchProfile(session.user.id) : null;
          set({ session, user: session?.user ?? null, profile });
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          window.localStorage.removeItem('kiosko-auth-session');
          set({ session: null, user: null, profile: null });
        } else if (event === 'INITIAL_SESSION') {
           if (!session) {
             set({ session: null, user: null, profile: null });
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
