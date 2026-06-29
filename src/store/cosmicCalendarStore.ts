import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJulianDaysSinceJ2000, getPlanetLongitude, getZodiacSign } from '@/utils/astronomy';
import { ComputedChart } from '@/store/appStore';
import { getLunarAlmanacAdvice } from '@/utils/lunarAlmanacHelper';
import { fetchDailyShadows } from '@/api/gemini';

interface CosmicCalendarState {
  moonPhase: 'waxing' | 'waning';
  moonSign: string;
  beautyAdvice: string;
  healthAdvice: string;
  shadowsAdvice: string;
  auraColors: string[];
  loadingShadows: boolean;
  calculateAlmanac: (birthChart: ComputedChart | null) => void;
  fetchShadows: (profileName: string, birthChart: ComputedChart | null) => Promise<void>;
}

export const useCosmicCalendarStore = create<CosmicCalendarState>((set, get) => ({
  moonPhase: 'waxing',
  moonSign: 'Koç',
  beautyAdvice: 'Yükleniyor...',
  healthAdvice: 'Yükleniyor...',
  shadowsAdvice: 'Gökyüzü transitleri ve zihinsel gölgeleriniz hesaplanıyor...',
  auraColors: ['#B2F7EF', '#EFF7F6'],
  loadingShadows: false,

  calculateAlmanac: (birthChart) => {
    const today = new Date();
    const d = getJulianDaysSinceJ2000(today);
    
    // Calculate current Sun and Moon longitudes
    const sunLon = getPlanetLongitude('Sun', d);
    const moonLon = getPlanetLongitude('Moon', d);
    const moonSignInfo = getZodiacSign(moonLon);
    const moonSignTurkish = moonSignInfo.turkish;

    const { beauty, health, auraColors } = getLunarAlmanacAdvice(moonLon, sunLon, moonSignTurkish);

    let elongation = moonLon - sunLon;
    if (elongation < 0) elongation += 360;
    const phase: 'waxing' | 'waning' = (elongation >= 0 && elongation < 180) ? 'waxing' : 'waning';

    set({
      moonPhase: phase,
      moonSign: moonSignTurkish,
      beautyAdvice: beauty,
      healthAdvice: health,
      auraColors: auraColors,
    });
  },

  fetchShadows: async (profileName, birthChart) => {
    if (!birthChart) return;
    const { moonSign, moonPhase } = get();
    
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `daily_shadows_advice_${todayStr}_${profileName}`;
    
    set({ loadingShadows: true });
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        set({ shadowsAdvice: cached, loadingShadows: false });
        return;
      }
      
      const shadows = await fetchDailyShadows(profileName, birthChart, moonSign, moonPhase);
      await AsyncStorage.setItem(cacheKey, shadows);
      set({ shadowsAdvice: shadows, loadingShadows: false });
    } catch (error) {
      console.warn('Error fetching shadows advice:', error);
      set({
        shadowsAdvice: 'Kozmik dalgalanmalar nedeniyle zihinsel gölge analizinize şu an erişilemiyor. İç gözleminizi sürdürün.',
        loadingShadows: false
      });
    }
  }
}));
