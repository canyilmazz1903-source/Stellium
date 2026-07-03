import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { Session, User } from '@supabase/supabase-js';
import { getCurrentEntitlement, initPurchases } from '../services/purchases';

const PREMIUM_CACHE_KEY = 'stellium_is_premium';
const SHADOW_UNLOCK_DATE_KEY = 'stellium_shadow_unlock_date';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

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
    AsyncStorage.setItem(PREMIUM_CACHE_KEY, isPremium ? '1' : '0').catch(() => {});
  },
  unlockDailyShadow: () => {
    set({ hasUnlockedDailyShadow: true });
    AsyncStorage.setItem(SHADOW_UNLOCK_DATE_KEY, todayStr()).catch(() => {});
  },
  initialize: async () => {
    try {
      // Hydrate premium/shadow-unlock state from local cache first so the UI
      // doesn't flash "free" on every cold start while the network settles.
      const [cachedPremium, unlockDate] = await Promise.all([
        AsyncStorage.getItem(PREMIUM_CACHE_KEY),
        AsyncStorage.getItem(SHADOW_UNLOCK_DATE_KEY),
      ]);
      set({
        isPremium: cachedPremium === '1',
        hasUnlockedDailyShadow: unlockDate === todayStr(),
      });

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

      // Reconcile with RevenueCat once it's configured; falls back silently
      // to the cached/demo value when no API key has been set up yet.
      await initPurchases();
      const entitled = await getCurrentEntitlement();
      if (entitled !== null) {
        set({ isPremium: entitled });
        AsyncStorage.setItem(PREMIUM_CACHE_KEY, entitled ? '1' : '0').catch(() => {});
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
