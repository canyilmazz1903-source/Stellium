import { Platform } from 'react-native';
import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

function resolveUnitId(realIos: string | undefined, realAndroid: string | undefined, fallback: string) {
  const real = Platform.OS === 'ios' ? realIos : realAndroid;
  return real && real.length > 0 ? real : fallback;
}

// Falls back to Google's public test ad unit IDs until real AdMob ad units are
// added via .env (EXPO_PUBLIC_ADMOB_BANNER_IOS/ANDROID, _INTERSTITIAL_*, _REWARDED_*),
// same convention as the Supabase/Gemini/RevenueCat keys.
export const BANNER_UNIT_ID = resolveUnitId(
  process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
  process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
  TestIds.BANNER
);
export const INTERSTITIAL_UNIT_ID = resolveUnitId(
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS,
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID,
  TestIds.INTERSTITIAL
);
export const REWARDED_UNIT_ID = resolveUnitId(
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS,
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID,
  TestIds.REWARDED
);

let initialized = false;

export async function initAds() {
  if (initialized) return;
  try {
    await mobileAds().initialize();
    initialized = true;
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

export function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubLoaded();
      unsubClosed();
      unsubError();
      resolve();
    };

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => ad.show());
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, finish);

    ad.load();
    // Safety net in case the ad never loads (no fill, no network, etc.)
    setTimeout(finish, 8000);
  });
}

export function showRewarded(onEarned: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      resolve(earned);
    };

    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
      onEarned();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, finish);

    ad.load();
    setTimeout(finish, 8000);
  });
}
