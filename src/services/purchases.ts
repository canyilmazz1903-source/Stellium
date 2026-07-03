import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Stellium Elite entitlement identifier as configured in RevenueCat.
export const ELITE_ENTITLEMENT_ID = 'elite';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

let configured = false;

function getApiKey() {
  return Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
}

// Real billing is only active once a RevenueCat API key is supplied via .env
// (EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / _ANDROID), same as the Supabase/Gemini keys.
// Until then the app runs in demo mode so the UI can be built/tested without a RevenueCat account.
export function isPurchasesConfigured() {
  return getApiKey().length > 0;
}

export async function initPurchases() {
  if (!isPurchasesConfigured() || configured) return;
  try {
    await Purchases.configure({ apiKey: getApiKey() });
    configured = true;
  } catch (e) {
    console.warn('RevenueCat init failed, staying in demo mode:', e);
  }
}

export async function fetchEliteOffering() {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('Failed to fetch RevenueCat offerings:', e);
    return null;
  }
}

// Throws 'DEMO_MODE' when RevenueCat isn't configured yet so callers can fall back gracefully.
export async function purchasePackage(pkg: any): Promise<boolean> {
  if (!configured) throw new Error('DEMO_MODE');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID];
}

export async function restorePurchases(): Promise<boolean> {
  if (!configured) throw new Error('DEMO_MODE');
  const customerInfo = await Purchases.restorePurchases();
  return !!customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID];
}

export async function getCurrentEntitlement(): Promise<boolean | null> {
  if (!configured) return null;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID];
  } catch (e) {
    console.warn('Failed to read RevenueCat customer info:', e);
    return null;
  }
}
