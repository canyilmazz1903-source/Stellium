import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyHoroscope, HoroscopeResponse } from '@/api/gemini';

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
  dailyHoroscope: HoroscopeResponse | null;
  setDailyHoroscope: (horoscope: HoroscopeResponse | null) => void;
  fetchHoroscope: (
    name: string,
    zodiacSign: string,
    birthDate: string,
    birthPlace: string
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
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
  fetchHoroscope: async (name, zodiacSign, birthDate, birthPlace) => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `daily_horoscope_${todayStr}_${name}`;

    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        set({ dailyHoroscope: JSON.parse(cached) });
        return;
      }

      // Fetch fresh data
      const data = await fetchDailyHoroscope(name, zodiacSign, birthDate, birthPlace);
      
      // Store in cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      set({ dailyHoroscope: data });
    } catch (error) {
      console.warn('Error fetching and caching daily horoscope:', error);
    }
  },
}));
