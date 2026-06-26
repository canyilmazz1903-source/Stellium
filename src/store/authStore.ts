import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  name?: string;
  birth_date?: string;  // YYYY-MM-DD
  birth_time?: string;  // HH:MM
  birth_place?: string; // Istanbul, Turkey
  latitude?: number;
  longitude?: number;
  timezone?: string;    // Europe/Istanbul
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremium: boolean;
  hasUnlockedDailyShadow: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setPremium: (isPremium: boolean) => void;
  unlockDailyShadow: () => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isPremium: false,
  hasUnlockedDailyShadow: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setPremium: (isPremium) => {
    set({ isPremium });
    try {
      const appStore = require('./appStore').useAppStore;
      if (appStore.getState().isPremium !== isPremium) {
        appStore.getState().setPremium(isPremium);
      }
    } catch (e) {
      console.warn('Syncing premium state warning:', e);
    }
  },
  unlockDailyShadow: () => set({ hasUnlockedDailyShadow: true }),
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          set({ profile });
        }
      }
    } catch (e) {
      console.warn('Supabase auth initialization warning:', e);
    } finally {
      set({ isLoading: false });
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout warning:', e);
    }
    set({ session: null, user: null, profile: null });
  },
}));
