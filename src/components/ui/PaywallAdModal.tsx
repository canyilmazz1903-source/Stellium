import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import GlassCard from '../glass/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

// Ethereal Aura colors
const SAGE_GREEN = '#A3E4D7';
const LAVENDER = '#D7BDE2';

// Standard Google Rewarded Ad test unit IDs
const AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
}) || 'ca-app-pub-3940256099942544/1712485313';

interface PaywallAdModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function PaywallAdModal({
  visible,
  onClose,
  onSuccess,
  title = 'Zihinsel Gölge Analizi',
  description = 'Kozmik haritanızdaki sert açılardan kaynaklanan gölge yönlerinizi ve derin Jungiyen analizinizi keşfetmek için kilidi açın.'
}: PaywallAdModalProps) {
  const { unlockDailyShadow } = useAuthStore();
  const router = useRouter();
  
  // Ad states
  const [adLoading, setAdLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [simulatedLoad, setSimulatedLoad] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Dynamic import of AdMob to ensure absolute crash-proofing
  const [admobAPI, setAdmobAPI] = useState<any>(null);

  useEffect(() => {
    try {
      const ads = require('react-native-google-mobile-ads');
      setAdmobAPI(ads);
    } catch (e) {
      console.warn('AdMob package not fully loaded, using test simulation mode.');
    }
  }, []);

  // Set up AdMob Hook if API is available
  const rewardedHookResult = admobAPI?.useRewardedAd?.(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  const { isLoaded, isClosed, load, show, reward, error } = rewardedHookResult || {
    isLoaded: false,
    isClosed: false,
    load: () => {},
    show: () => {},
    reward: null,
    error: null,
  };

  // Load ad when visible
  useEffect(() => {
    if (visible && rewardedHookResult) {
      setIsAdLoaded(false);
      try {
        load();
      } catch (e) {
        console.warn('Failed to load AdMob ad:', e);
      }
    }
  }, [visible, load]);

  // Keep track of loaded state
  useEffect(() => {
    if (isLoaded) {
      setIsAdLoaded(true);
    }
  }, [isLoaded]);

  // Handle reward success from AdMob
  useEffect(() => {
    if (reward) {
      handleSuccessUnlock();
    }
  }, [reward]);

  // Handle ad close
  useEffect(() => {
    if (isClosed) {
      // Reload ad for next time
      try {
        load();
      } catch (e) {}
    }
  }, [isClosed, load]);

  // Alert error in dev mode
  useEffect(() => {
    if (error) {
      console.warn('AdMob error:', error);
    }
  }, [error]);

  const handleSuccessUnlock = () => {
    unlockDailyShadow();
    onSuccess();
    onClose();
  };

  const handleWatchAd = () => {
    if (isAdLoaded && rewardedHookResult) {
      try {
        show();
      } catch (e) {
        console.warn('Failed to show ad, falling back to simulation:', e);
        startSimulation();
      }
    } else {
      // Fallback: If ad isn't loaded yet or package is missing (simulator testing)
      startSimulation();
    }
  };

  const startSimulation = () => {
    setAdLoading(true);
    setSimulatedLoad(true);
    setSimulatedProgress(0);

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAdLoading(false);
            setSimulatedLoad(false);
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <GlassCard style={styles.modalCard}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.4)" />
          </Pressable>

          <View style={styles.content}>
            {/* Header Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={32} color={LAVENDER} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {adLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                {simulatedLoad ? (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <Text style={styles.loadingText}>Simüle Reklam İzleniyor (%{simulatedProgress})...</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${simulatedProgress}%` }]} />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.loadingText}>Reklam yükleniyor...</Text>
                )}
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
                    {isAdLoaded ? 'Video İzle ve Kilidi Aç' : 'Hızlı Video İzle (Test Modu)'}
                  </Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.footerText}>
              Abonelikle reklamları kaldırabilir ve tüm özelliklere sınırsız erişebilirsiniz.
            </Text>
          </View>
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
    fontSize: 18,
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
  },
});
