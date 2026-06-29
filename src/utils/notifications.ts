import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

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
    // Clear previously scheduled notifications to prevent duplicate alerts
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = Date.now();
    // Filter hours starting in the future
    const futureHours = hours.filter(h => {
      const startTime = new Date(h.startTime).getTime();
      return startTime > now;
    });

    // Schedule up to next 16 future hours to avoid hitting OS queuing limits
    const hoursToSchedule = futureHours.slice(0, 16);

    for (const hour of hoursToSchedule) {
      const details = PLANET_NOTIF_DETAILS[hour.planetName] || {
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
