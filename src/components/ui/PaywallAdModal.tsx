import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '@/store/authStore';

const LAVENDER = '#D7BDE2';

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
  title = 'Elite Kozmik Rehberlik',
  description = 'Kozmik haritanızın derinliklerine inmek ve tüm astrolojik analizlerin kilidini açmak için Stellium Elite üyesi olun.'
}: PaywallAdModalProps) {
  const { setPremium } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    // Simüle edilmiş satın alma işlemi (App Store / RevenueCat bağlanana kadar)
    setTimeout(() => {
      setLoading(false);
      setPremium(true);
      onSuccess();
      onClose();
      Alert.alert(
        'Tebrikler!',
        'Stellium Elite aboneliğiniz başarıyla başlatıldı. Sınırsız kozmik rehberliğin tadını çıkarın.',
        [{ text: 'Devam Et' }]
      );
    }, 1500);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={({pressed}) => [styles.closeBtn, pressed && {opacity: 0.7}]}>
              <Ionicons name="close" size={24} color="#8B949E" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={32} color={LAVENDER} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#D4AF37" />
                <Text style={styles.loadingText}>Abonelik işleminiz gerçekleştiriliyor...</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  onPress={handleSubscribe}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 }
                  ]}
                >
                  <Ionicons name="star" size={16} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Stellium Elite'e Geç (₺99/ay)</Text>
                </Pressable>
                
                <Text style={styles.footerText}>
                  İstediğiniz zaman iptal edebilirsiniz. Tüm elit analizler ve günlük transit yorumları sınırsız açılır.
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    paddingTop: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(215, 189, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(215, 189, 226, 0.3)',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 22,
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter',
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
