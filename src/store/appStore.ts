import { create } from 'zustand';

export interface PlanetPosition {
  name: string;
  longitude: number;
  sign: string;
  house: number;
  retrograde: boolean;
}

export interface ComputedChart {
  planets: PlanetPosition[];
  houses: number[]; // Ecliptic longitude of 12 house cusps
  ascendant: number;
  midheaven: number;
}

interface AppState {
  isPremium: boolean;
  setPremium: (isPremium: boolean) => void;
  computedChart: ComputedChart | null;
  setComputedChart: (chart: ComputedChart | null) => void;
  dailyHoroscope: Record<string, string> | null; // e.g. { General: "...", Love: "..." }
  setDailyHoroscope: (horoscope: Record<string, string> | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPremium: false,
  setPremium: (isPremium) => {
    set({ isPremium });
    try {
      const authStore = require('./authStore').useAuthStore;
      if (authStore.getState().isPremium !== isPremium) {
        authStore.getState().setPremium(isPremium);
      }
    } catch (e) {
      console.warn('Syncing premium state warning:', e);
    }
  },
  computedChart: null,
  setComputedChart: (computedChart) => set({ computedChart }),
  dailyHoroscope: null,
  setDailyHoroscope: (dailyHoroscope) => set({ dailyHoroscope }),
}));
