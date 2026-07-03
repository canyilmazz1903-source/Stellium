import { Platform } from 'react-native';

// react-native-google-mobile-ads resolves its native module as soon as this
// file is imported. If the native module isn't linked in a given build for
// any reason, that resolution throws synchronously and can bring down the
// whole app before any try/catch in our own code even runs. Guard it with a
// plain require() (never a static import) so a missing/broken native module
// only disables ads for that session instead of crashing on launch.
let nativeAds: typeof import('react-native-google-mobile-ads') | null = null;
try {
  nativeAds = require('react-native-google-mobile-ads');
} catch (e) {
  console.warn('react-native-google-mobile-ads native module unavailable, ads disabled:', e);
}

export const adsAvailable = !!nativeAds;

function resolveUnitId(realIos: string | undefined, realAndroid: string | undefined, fallback: string) {
  const real = Platform.OS === 'ios' ? realIos : realAndroid;
  return real && real.length > 0 ? real : fallback;
}

// Falls back to Google's public test ad unit IDs until real AdMob ad units are
// added via .env (EXPO_PUBLIC_ADMOB_BANNER_IOS/ANDROID, _INTERSTITIAL_*, _REWARDED_*),
// same convention as the Supabase/Gemini/RevenueCat keys.
export const BANNER_UNIT_ID = nativeAds
  ? resolveUnitId(process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS, process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID, nativeAds.TestIds.BANNER)
  : '';
export const INTERSTITIAL_UNIT_ID = nativeAds
  ? resolveUnitId(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS, process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID, nativeAds.TestIds.INTERSTITIAL)
  : '';
export const REWARDED_UNIT_ID = nativeAds
  ? resolveUnitId(process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS, process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID, nativeAds.TestIds.REWARDED)
  : '';

let initialized = false;

export async function initAds() {
  if (!nativeAds || initialized) return;
  try {
    await nativeAds.default().initialize();
    initialized = true;
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

export function showInterstitial(): Promise<void> {
  if (!nativeAds) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const { InterstitialAd, AdEventType } = nativeAds!;
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
    } catch (e) {
      console.warn('Interstitial ad failed:', e);
      resolve();
    }
  });
}

export function showRewarded(onEarned: () => void): Promise<boolean> {
  if (!nativeAds) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const { RewardedAd, AdEventType, RewardedAdEventType } = nativeAds!;
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
    } catch (e) {
      console.warn('Rewarded ad failed:', e);
      resolve(false);
    }
  });
}
