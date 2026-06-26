import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ActivityIndicator, Platform, Alert, NativeModules } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import GlassCard from '../glass/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

// Ethereal Aura colors
const LAVENDER = '#D7BDE2';

// Standard Google Rewarded Ad test unit IDs
const AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
}) || 'ca-app-pub-3940256099942544/1712485313';

// Safely detect if AdMob native modules are linked & available (will be false in Expo Go)
const isAdMobAvailable = !!(
  NativeModules.RNGoogleMobileAdsModule ||
  NativeModules.RNGoogleMobileAdsRewardedModule ||
  NativeModules.RNGoogleMobileAdsConsentModule
);

// Safely try to require the AdMob hook, catching errors in non-prebuilt environments
let useRewardedAdHook: any = null;
if (isAdMobAvailable) {
  try {
    const googleAds = require('react-native-google-mobile-ads');
    useRewardedAdHook = googleAds.useRewardedAd;
  } catch (e) {
    console.warn('AdMob JS package missing or could not be loaded:', e);
  }
}

interface PaywallAdModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

// 1. Separate component for AdMob path to obey React Rules of Hooks
function AdMobContentWrapper({
  onClose,
  onSuccess,
  title,
  description,
  handleGoToSettings,
  startSimulation
}: any) {
  const { unlockDailyShadow } = useAuthStore();
  const [adLoading, setAdLoading] = useState(false);

  const { isLoaded, isClosed, load, show, reward } = useRewardedAdHook(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Load ad when component mounts
  useEffect(() => {
    try {
      load();
    } catch (e) {
      console.warn('AdMob load error:', e);
    }
  }, [load]);

  // Handle reward
  useEffect(() => {
    if (reward) {
      unlockDailyShadow();
      onSuccess();
      onClose();
    }
  }, [reward]);

  // Handle ad close
  useEffect(() => {
    if (isClosed) {
      try {
        load();
      } catch (e) {}
    }
  }, [isClosed, load]);

  const handleWatchAd = () => {
    if (isLoaded) {
      try {
        show();
      } catch (e) {
        console.warn('AdMob show error, running simulation:', e);
        startSimulation();
      }
    } else {
      // If ad failed to load, fall back to simulation to prevent blocking
      startSimulation();
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={32} color={LAVENDER} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {adLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.loadingText}>Reklam oynatılıyor...</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={handleGoToSettings}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Ionicons name="sparkles" size={16} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Stellium Elite'e Geç (Sınırsız)</Text>
          </Pressable>

          <Pressable
            onPress={handleWatchAd}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.8 }
            ]}
          >
            <Ionicons name="play" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>
              {isLoaded ? 'Video İzle ve Kilidi Aç' : 'Video Yükleniyor (Yedek Modu)'}
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footerText}>
        Abonelikle reklamları kaldırabilir ve tüm özelliklere sınırsız erişebilirsiniz.
      </Text>
    </View>
  );
}

// 2. Separate component for Simulator path (Expo Go fallback)
function SimulatedContentWrapper({
  onClose,
  onSuccess,
  title,
  description,
  handleGoToSettings,
  startSimulation,
  simulatedProgress,
  adLoading
}: any) {
  return (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={32} color={LAVENDER} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {adLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <View style={{ width: '100%', marginTop: 12 }}>
            <Text style={styles.loadingText}>Simüle Reklam İzleniyor (%{simulatedProgress})...</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${simulatedProgress}%` }]} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={handleGoToSettings}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Ionicons name="sparkles" size={16} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Stellium Elite'e Geç (Sınırsız)</Text>
          </Pressable>

          <Pressable
            onPress={startSimulation}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.8 }
            ]}
          >
            <Ionicons name="play" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>Video İzle ve Kilidi Aç (Simüle)</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footerText}>
        [Geliştirici/Test Modu] AdMob native paketi bağlı olmadığı için simülasyon modu aktiftir.
      </Text>
    </View>
  );
}

// 3. Main Modal component selecting the right path statically
export default function PaywallAdModal({
  visible,
  onClose,
  onSuccess,
  title = 'Zihinsel Gölge Analizi',
  description = 'Kozmik haritanızdaki sert açılardan kaynaklanan gölge yönlerinizi ve derin Jungiyen analizinizi keşfetmek için kilidi açın.'
}: PaywallAdModalProps) {
  const { unlockDailyShadow } = useAuthStore();
  const router = useRouter();
  
  const [adLoading, setAdLoading] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  const handleSuccessUnlock = () => {
    unlockDailyShadow();
    onSuccess();
    onClose();
  };

  const startSimulation = () => {
    setAdLoading(true);
    setSimulatedProgress(0);

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAdLoading(false);
            Alert.alert(
              'Tebrikler!',
              'Reklam başarıyla tamamlandı. Günlük analizinizin kilidi açıldı.',
              [{ text: 'Devam Et', onPress: handleSuccessUnlock }]
            );
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const handleGoToSettings = () => {
    onClose();
    router.push('/settings');
  };

  const renderContent = () => {
    if (isAdMobAvailable && useRewardedAdHook) {
      return (
        <AdMobContentWrapper
          onClose={onClose}
          onSuccess={onSuccess}
          title={title}
          description={description}
          handleGoToSettings={handleGoToSettings}
          startSimulation={startSimulation}
        />
      );
    }
    return (
      <SimulatedContentWrapper
        onClose={onClose}
        onSuccess={onSuccess}
        title={title}
        description={description}
        handleGoToSettings={handleGoToSettings}
        startSimulation={startSimulation}
        simulatedProgress={simulatedProgress}
        adLoading={adLoading}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        <GlassCard style={styles.modalCard}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.4)" />
          </Pressable>

          {renderContent()}
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingTop: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(215, 189, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'InterBold',
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    width: '100%',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 14,
    width: '100%',
  },
  primaryBtnText: {
    fontFamily: 'InterBold',
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    height: 48,
    borderRadius: 14,
    width: '100%',
  },
  secondaryBtnText: {
    fontFamily: 'Inter',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 8,
  },
});
