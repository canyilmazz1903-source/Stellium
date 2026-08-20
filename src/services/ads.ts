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
// same convention as the Supabase/Gemini keys.
// ⚠️ PRODUCTION: real unit IDs MUST be set before the store build — shipping
// Google's test ads to production violates AdMob policy.
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

// Shows an interstitial. The load-timeout is CANCELLED the moment the ad
// loads — previously the 8s timer could fire while an ad was on screen and
// resolve the promise mid-show (bug). Resolves when closed/failed either way.
export function showInterstitial(): Promise<void> {
  if (!nativeAds) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const { InterstitialAd, AdEventType } = nativeAds!;
      let settled = false;
      let loadTimer: ReturnType<typeof setTimeout> | null = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (loadTimer) clearTimeout(loadTimer);
        unsubLoaded();
        unsubClosed();
        unsubError();
        resolve();
      };

      const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        // Ad is here: the timeout must no longer be able to cut the show short.
        if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
        try { ad.show(); } catch { finish(); }
      });
      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
      const unsubError = ad.addAdEventListener(AdEventType.ERROR, finish);

      ad.load();
      // Safety net ONLY for the loading phase (no fill / no network).
      loadTimer = setTimeout(finish, 10000);
    } catch (e) {
      console.warn('Interstitial ad failed:', e);
      resolve();
    }
  });
}

export interface RewardedResult {
  earned: boolean;   // user watched to completion and earned the reward
  adShown: boolean;  // an ad actually displayed
  failed: boolean;   // load/show failed (no fill, network...) — callers may
                     // choose to grant the unlock anyway (graceful fallback)
}

// Shows a rewarded ad. Same timeout fix as the interstitial: the load-timeout
// is cancelled on LOADED, so a slow-loading ad can no longer be resolved as
// "not earned" while the user is actually watching it.
export function showRewarded(onEarned?: () => void): Promise<RewardedResult> {
  if (!nativeAds) return Promise.resolve({ earned: false, adShown: false, failed: true });

  return new Promise((resolve) => {
    try {
      const { RewardedAd, AdEventType, RewardedAdEventType } = nativeAds!;
      let earned = false;
      let adShown = false;
      let failed = false;
      let settled = false;
      let loadTimer: ReturnType<typeof setTimeout> | null = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (loadTimer) clearTimeout(loadTimer);
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        unsubError();
        resolve({ earned, adShown, failed });
      };

      const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
        try {
          adShown = true;
          ad.show();
        } catch {
          failed = true;
          finish();
        }
      });
      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
        onEarned?.();
      });
      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        failed = true;
        finish();
      });

      ad.load();
      // Loading-phase safety net only.
      loadTimer = setTimeout(() => { failed = true; finish(); }, 10000);
    } catch (e) {
      console.warn('Rewarded ad failed:', e);
      resolve({ earned: false, adShown: false, failed: true });
    }
  });
}
