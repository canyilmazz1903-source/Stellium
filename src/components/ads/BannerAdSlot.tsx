import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { BANNER_UNIT_ID, adsAvailable } from '@/services/ads';

// Never statically import react-native-google-mobile-ads here: if the native
// module isn't linked, resolving it at import time can crash the whole app
// before render. Load it lazily behind the same guard as services/ads.ts.
let BannerAd: any = null;
let BannerAdSize: any = null;
if (adsAvailable) {
  try {
    const nativeAds = require('react-native-google-mobile-ads');
    BannerAd = nativeAds.BannerAd;
    BannerAdSize = nativeAds.BannerAdSize;
  } catch (e) {
    console.warn('BannerAd component unavailable:', e);
  }
}

// Renders the home banner. isPremium is permanently false in the ads-only
// model; the check remains only for component compatibility.
export default function BannerAdSlot() {
  const isPremium = useAuthStore((s) => s.isPremium);
  if (isPremium || !BannerAd) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});
