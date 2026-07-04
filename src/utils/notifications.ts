import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

const TURKISH_TO_ENGLISH_PLANET: Record<string, string> = {
  'Güneş': 'Sun',
  'Ay': 'Moon',
  'Merkür': 'Mercury',
  'Venüs': 'Venus',
  'Mars': 'Mars',
  'Jüpiter': 'Jupiter',
  'Satürn': 'Saturn'
};

const PLANET_NOTIF_DETAILS: Record<string, { title: string; body: string }> = {
  Sun: {
    title: '☀️ Güneş Saati Başladı',
    body: 'Öz güven, kariyer adımları, liderlik ve kendi kimliğinizi parlatmak için harika bir an.'
  },
  Moon: {
    title: '🌙 Ay Saati Başladı',
    body: 'Sezgilerinizi dinlemek, dinlenmek, ailevi bağları güçlendirmek ve içsel çalışmalar için uygun zaman.'
  },
  Mercury: {
    title: '☿ Merkür Saati Başladı',
    body: 'Önemli kararlar almak, yazışmalar, ticaret, öğrenme ve zihinsel odaklanma için ideal süreç.'
  },
  Venus: {
    title: '♀ Venüs Saati Başladı',
    body: 'Aşk, güzellik ritüelleri, sosyalleşme, sanatsal ilham ve bolluk bilincini çağırmak için en uygun an.'
  },
  Mars: {
    title: '♂ Mars Saati Başladı',
    body: 'Fiziksel spor, cesaret gerektiren adımlar, motivasyon ve eyleme geçme gücüyle dolusunuz.'
  },
  Jupiter: {
    title: '♃ Jüpiter Saati Başladı',
    body: 'Bereket, şans kapılarını aralama, yüksek bilgelik, dua ve meditasyon çalışmaları için kozmik fırsat.'
  },
  Saturn: {
    title: '♄ Satürn Saati Başladı',
    body: 'Disiplin, planlama, sorumluluklar ve kalıcı/uzun vadeli işleri organize etmek için odaklanma vakti.'
  }
};

// ---------- Daily morning guidance notification ----------

const DAILY_GUIDANCE_PREF_KEY = 'daily_guidance_notification_enabled';
const DAILY_GUIDANCE_ID = 'daily-guidance';

export async function isDailyGuidanceEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DAILY_GUIDANCE_PREF_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function scheduleDailyGuidanceNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_GUIDANCE_ID,
      content: {
        title: '🌌 Bugünün Kozmik Rehberliği Hazır',
        body: 'Günlük burç yorumunuz, gezegen saatleri, Ay evresi ve bakım rehberiniz sizi bekliyor.',
        sound: true,
      },
      // Daily repeating trigger at 09:00 local time
      trigger: { type: 'daily', hour: 9, minute: 0 } as any,
    });
  } catch (e) {
    console.warn('Error scheduling daily guidance notification:', e);
  }
}

export async function setDailyGuidanceEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_GUIDANCE_PREF_KEY, enabled ? '1' : '0');
    if (enabled) {
      await scheduleDailyGuidanceNotification();
    } else {
      await Notifications.cancelScheduledNotificationAsync(DAILY_GUIDANCE_ID);
    }
  } catch (e) {
    console.warn('Error toggling daily guidance notification:', e);
  }
}

/**
 * Request notifications permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Schedules local notifications for upcoming planetary hours.
 * Clears old notifications first to prevent duplicates.
 */
export async function schedulePlanetaryHourNotifications(hours: any[]) {
  if (Platform.OS === 'web') return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  try {
    // Clear previously scheduled notifications to prevent duplicate alerts.
    // NOTE: this also wipes the daily guidance notification, so it is
    // re-scheduled right after if the user has it enabled.
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (await isDailyGuidanceEnabled()) {
      await scheduleDailyGuidanceNotification();
    }

    // Read preferences from AsyncStorage
    let preferences: Record<string, boolean> = { Sun: true, Moon: true, Mercury: true, Venus: true, Mars: true, Jupiter: true, Saturn: true };
    try {
      const stored = await AsyncStorage.getItem('planetary_hour_notification_preferences');
      if (stored) {
        preferences = JSON.parse(stored);
      }
    } catch (e) {
      console.warn(e);
    }

    const now = Date.now();
    // Filter hours starting in the future and matching enabled preferences
    const futureHours = hours.filter(h => {
      const startTime = new Date(h.startTime).getTime();
      const englishName = TURKISH_TO_ENGLISH_PLANET[h.planetName] || 'Sun';
      const isEnabled = preferences[englishName] !== false;
      return startTime > now && isEnabled;
    });

    // Schedule up to next 16 future hours to avoid hitting OS queuing limits
    const hoursToSchedule = futureHours.slice(0, 16);

    for (const hour of hoursToSchedule) {
      const englishName = TURKISH_TO_ENGLISH_PLANET[hour.planetName] || 'Sun';
      const details = PLANET_NOTIF_DETAILS[englishName] || {
        title: `${hour.planetSymbol} ${hour.planetName} Saati`,
        body: 'Gökyüzü transitleri ve gezegen enerjisiyle uyumlanma zamanı.'
      };

      const triggerDate = new Date(hour.startTime);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: details.title,
          body: details.body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate as any,
      });
    }
  } catch (error) {
    console.warn('Error scheduling planetary hours notifications:', error);
  }
}
