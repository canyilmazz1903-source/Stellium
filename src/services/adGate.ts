// Rewarded-ad feature gate: expensive (AI) or flagship features unlock for
// THE DAY by watching one rewarded ad. Unlocks persist in AsyncStorage with a
// per-day key, so one ad = one day of access per feature.
//
// Graceful fallback: if the ad fails to LOAD (no fill, no network — very
// common on fresh AdMob accounts and during App Review), the unlock is
// granted anyway. A user who watched nothing because we had nothing to show
// must never hit a dead end; App Review must never see a blocked feature.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { showRewarded } from './ads';

export type GatedFeature =
  | 'chart_ai'    // Kapsamlı AI harita analizi (Gemini maliyeti)
  | 'transit'     // AI transit raporu
  | 'synastry'    // AI sinastri raporu
  | 'yildizname'  // AI yıldızname raporu
  | 'timeline'    // Kozmik Zamanlama & öngörü paneli
  | 'moon_full'   // Ay takvimi tam 30 gün + tutulma/faz rozetleri
  | 'retro_full'  // Retro takvimi gelecek pencereler
  | 'shadow';     // Günlük gölge analizi

function todayKey(feature: GatedFeature): string {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return `reward_unlock_${feature}_${day}`;
}

export async function isFeatureUnlocked(feature: GatedFeature): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(todayKey(feature))) === '1';
  } catch {
    return false;
  }
}

export async function markFeatureUnlocked(feature: GatedFeature): Promise<void> {
  try {
    await AsyncStorage.setItem(todayKey(feature), '1');
  } catch {}
}

export interface UnlockOutcome {
  unlocked: boolean;
  viaAd: boolean;      // true = user actually earned it by watching
  adUnavailable: boolean; // true = granted because no ad could be shown
}

// Shows the rewarded ad and unlocks the feature for today.
// - earned → unlock
// - ad failed to load/show → unlock anyway (adUnavailable=true)
// - ad shown but user closed early without reward → NOT unlocked
export async function unlockFeatureWithAd(feature: GatedFeature): Promise<UnlockOutcome> {
  const result = await showRewarded();

  if (result.earned) {
    await markFeatureUnlocked(feature);
    return { unlocked: true, viaAd: true, adUnavailable: false };
  }

  if (!result.adShown || result.failed) {
    // Nothing was shown — grant access rather than dead-ending the user.
    await markFeatureUnlocked(feature);
    return { unlocked: true, viaAd: false, adUnavailable: true };
  }

  // Ad displayed but user bailed before earning the reward.
  return { unlocked: false, viaAd: false, adUnavailable: false };
}
