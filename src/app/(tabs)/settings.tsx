import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/api/supabase';
import GlassCard from '@/components/glass/GlassCard';
import CosmicButton from '@/components/ui/CosmicButton';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { isPremium, setPremium } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handlePurchase = () => {
    setLoading(true);
    // Simulate RevenueCat billing trigger
    setTimeout(() => {
      setPremium(true);
      setLoading(false);
      Alert.alert(
        'Elite Üyelik Aktif',
        'Tebrikler! Cosmic Elite ailesine başarıyla katıldınız. Tüm kısıtlamalar kaldırıldı.',
        [{ text: 'Kozmik Yolculuğa Başla' }]
      );
    }, 1500);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Abonelik Yönetimi',
      'Aboneliğinizi dilediğiniz zaman App Store Hesap Ayarları üzerinden yönetebilir veya iptal edebilirsiniz.',
      [
        { text: 'Aboneliği Sonlandır', style: 'destructive', onPress: () => setPremium(false) },
        { text: 'Kapat', style: 'cancel' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı ve Tüm Verileri Sil',
      'Hesabınız, kayıtlı doğum haritanız ve zikir kayıtlarınız kalıcı olarak silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (user) {
                // Delete user's profile row in database
                const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                if (error) throw error;
              }
              // Sign out from Supabase (clears local session)
              await signOut();
            } catch (err: any) {
              Alert.alert('Hesap Silinemedi', err.message || 'Bir hata oluştu.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Oturumunuz kapatılacaktır. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar & Üyelik</Text>
          <Text style={styles.subtitle}>Hesabınızı ve Kozmik Aboneliğinizi Yönetin</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
        ) : (
          <View style={styles.content}>
            
            {/* User Profile Info Card */}
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Profil Bilgileri</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>İsim:</Text>
                <Text style={styles.infoValue}>{profile?.name || 'Kozmik Ruh'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-posta:</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doğum Yeri:</Text>
                <Text style={styles.infoValue}>{profile?.birth_place || '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doğum Zamanı:</Text>
                <Text style={styles.infoValue}>
                  {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('tr-TR') : '-'} | {profile?.birth_time || '-'}
                </Text>
              </View>
            </GlassCard>

            {/* Premium Paywall / Subscription Status Card */}
            <GlassCard style={[styles.card, isPremium && styles.premiumCard]}>
              <Text style={[styles.cardTitle, isPremium && styles.premiumTitle]}>
                {isPremium ? '🌟 Cosmic Elite Üyesi' : 'Upgrade to Cosmic Elite'}
              </Text>
              
              <Text style={styles.description}>
                {isPremium 
                  ? 'Aboneliğiniz aktif! Gemini destekli transit yorumları, detaylı Yıldızname ve Sinastri gibi tüm Elite özelliklere tam erişim hakkınız bulunmaktadır.'
                  : 'Carl Jung ekolünden ilham alan detaylı transit tahlillerine erişin, doğum haritanızın detaylı yıldızname ve ebced analizini çıkarın.'
                }
              </Text>

              {!isPremium ? (
                <View style={styles.benefitsList}>
                  <Text style={styles.benefitItem}>✓ Yapay Zeka Destekli Detaylı Transit Yorumları</Text>
                  <Text style={styles.benefitItem}>✓ Enerji Uyum Haritası (Sinastri)</Text>
                  <Text style={styles.benefitItem}>✓ Detaylı Esma Zikir Saatleri & Ebced Analizleri</Text>
                  <Text style={styles.benefitItem}>✓ Altın Yaldızlı Ay Evresi Widget Eklentileri</Text>
                </View>
              ) : null}

              <CosmicButton
                title={isPremium ? 'Aboneliği Yönet' : 'Kozmik Elite Katıl - 99.99 TL / Ay'}
                onPress={isPremium ? handleCancelSubscription : handlePurchase}
                style={styles.payButton}
              />
            </GlassCard>

            {/* Account Actions and App Store Compliance */}
            <View style={styles.actionGroup}>
              <CosmicButton
                title="Oturumu Kapat"
                onPress={handleSignOut}
                variant="outline"
                style={styles.actionButton}
              />
              
              <CosmicButton
                title="Hesabımı ve Verilerimi Kalıcı Olarak Sil"
                onPress={handleDeleteAccount}
                variant="ghost"
                textStyle={styles.deleteButtonText}
                style={styles.actionButton}
              />
            </View>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    gap: 20,
  },
  card: {
    padding: 20,
  },
  premiumCard: {
    borderColor: '#D4AF37', // Golden glow outline
  },
  cardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 8,
  },
  premiumTitle: {
    color: '#D4AF37',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  infoValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F0F6FC',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 20,
  },
  benefitItem: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#D4AF37',
  },
  payButton: {
    marginTop: 10,
  },
  actionGroup: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    width: '100%',
  },
  deleteButtonText: {
    color: '#FF7B72',
    fontSize: 14,
  },
  loader: {
    marginTop: 80,
  },
});
