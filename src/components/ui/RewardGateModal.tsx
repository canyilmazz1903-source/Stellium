import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GatedFeature, unlockFeatureWithAd } from '@/services/adGate';

const GOLD = '#D4AF37';

interface RewardGateModalProps {
  visible: boolean;
  onClose: () => void;
  feature: GatedFeature;
  title: string;
  description: string;
  onUnlocked: () => void; // called after a successful unlock (ad watched OR ad unavailable)
}

// The app's single monetization gate: one rewarded ad opens the feature for
// the whole day. No subscriptions, no purchases.
export default function RewardGateModal({
  visible,
  onClose,
  feature,
  title,
  description,
  onUnlocked,
}: RewardGateModalProps) {
  const [loading, setLoading] = useState(false);

  const handleWatch = async () => {
    setLoading(true);
    try {
      const outcome = await unlockFeatureWithAd(feature);
      setLoading(false);
      if (outcome.unlocked) {
        onClose();
        if (outcome.adUnavailable) {
          Alert.alert('Açıldı', 'Reklam şu an yüklenemedi; özellik yine de bugünlük açıldı. İyi keşifler!');
        }
        onUnlocked();
      } else {
        Alert.alert('Reklam Tamamlanmadı', 'Özelliği açmak için reklamı sonuna kadar izlemeniz yeterli.');
      }
    } catch (e) {
      setLoading(false);
      console.warn('Reward gate error:', e);
      onClose();
      onUnlocked(); // asla çıkmaz sokak bırakma
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={24} color="#8B949E" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="play-circle" size={34} color={GOLD} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={GOLD} />
                <Text style={styles.loadingText}>Reklam yükleniyor...</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable onPress={handleWatch} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
                  <Ionicons name="play" size={16} color="#0B0F19" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Reklam İzle, Bugünlük Aç</Text>
                </Pressable>
                <Text style={styles.footerText}>
                  Stellium tamamen ücretsizdir. Tek bir kısa reklam, bu özelliği gün boyu açar — yarın yeni bir gün, yeni bir reklam.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161B22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    padding: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 20,
    color: GOLD,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    height: 48,
    borderRadius: 14,
    width: '100%',
  },
  primaryBtnText: {
    fontFamily: 'InterBold',
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 15,
  },
});
