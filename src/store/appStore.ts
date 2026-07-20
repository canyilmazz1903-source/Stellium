import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyHoroscope, HoroscopeResponse } from '@/api/gemini';
import type { Aspect, ChartPoint, DetectedPattern, HouseSystem } from '@/utils/astronomy';

export interface PlanetPosition {
  name: string;
  longitude: number;
  sign: string;
  house: number;
  retrograde: boolean;
  speed?: number; // deg/day, negative while retrograde
}

export interface ComputedChart {
  planets: PlanetPosition[];
  houses: number[]; // Ecliptic longitude of 12 house cusps
  ascendant: number;
  midheaven: number;
  // Precision-engine extensions (all optional for backward compatibility)
  aspects?: Aspect[];
  points?: ChartPoint[];        // Nodes, Chiron, Lilith, Fortuna
  patterns?: DetectedPattern[]; // Stellium, T-square, Grand Trine...
  houseSystem?: HouseSystem;
  polarFallback?: boolean;
  isDayBirth?: boolean;
  meanNode?: number;
}

const HOUSE_SYSTEM_KEY = 'stellium_house_system';

interface AppState {
  computedChart: ComputedChart | null;
  setComputedChart: (chart: ComputedChart | null) => void;
  houseSystem: HouseSystem;
  setHouseSystem: (system: HouseSystem) => void;
  loadHouseSystem: () => Promise<void>;
  dailyHoroscope: HoroscopeResponse | null;
  setDailyHoroscope: (horoscope: HoroscopeResponse | null) => void;
  fetchHoroscope: (
    name: string,
    zodiacSign: string,
    birthDate: string,
    birthPlace: string,
    profileId?: string
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  computedChart: null,
  setComputedChart: (computedChart) => set({ computedChart }),
  houseSystem: 'placidus',
  setHouseSystem: (houseSystem) => {
    set({ houseSystem });
    AsyncStorage.setItem(HOUSE_SYSTEM_KEY, houseSystem).catch(() => {});
  },
  loadHouseSystem: async () => {
    try {
      const stored = await AsyncStorage.getItem(HOUSE_SYSTEM_KEY);
      if (stored === 'placidus' || stored === 'whole' || stored === 'equal') {
        set({ houseSystem: stored });
      }
    } catch {}
  },
  dailyHoroscope: null,
  setDailyHoroscope: (dailyHoroscope) => set({ dailyHoroscope }),
  fetchHoroscope: async (name, zodiacSign, birthDate, birthPlace, profileId) => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // H11 fix: key by profile id (two users with the same first name used to
    // collide); name kept as last-resort fallback for profile-less sessions.
    const cacheKey = `daily_horoscope_${todayStr}_${profileId || name}`;

    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        set({ dailyHoroscope: JSON.parse(cached) });
        return;
      }

      // Fetch fresh data — hand the AI the fully computed chart (H6)
      const data = await fetchDailyHoroscope(name, zodiacSign, birthDate, birthPlace, get().computedChart);

      // Store in cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      set({ dailyHoroscope: data });
    } catch (error) {
      console.warn('Error fetching and caching daily horoscope:', error);
    }
  },
}));
