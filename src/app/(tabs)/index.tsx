import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Pressable, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { computeNatalChart, getPlanetLongitude, getJulianDaysSinceJ2000 } from '@/utils/astronomy';
import { fetchDailyHoroscope, HoroscopeResponse } from '@/api/gemini';
import GlassCard from '@/components/glass/GlassCard';

// Determine Moon phase name and symbol based on Sun and Moon elongations
function getMoonPhase(sunLon: number, moonLon: number) {
  let diff = moonLon - sunLon;
  if (diff < 0) diff += 360;

  if (diff >= 352.5 || diff < 7.5) return { name: 'Yeni Ay', symbol: '🌑' };
  if (diff >= 7.5 && diff < 82.5) return { name: 'Hilal (Büyüyen)', symbol: '🌒' };
  if (diff >= 82.5 && diff < 97.5) return { name: 'İlk Dördün', symbol: '🌓' };
  if (diff >= 97.5 && diff < 172.5) return { name: 'Şişkin Ay (Büyüyen)', symbol: '🌔' };
  if (diff >= 172.5 && diff < 187.5) return { name: 'Dolunay', symbol: '🌕' };
  if (diff >= 187.5 && diff < 262.5) return { name: 'Şişkin Ay (Küçülen)', symbol: '🌖' };
  if (diff >= 262.5 && diff < 277.5) return { name: 'Son Dördün', symbol: '🌗' };
  return { name: 'Balsamik Ay (Küçülen)', symbol: '🌘' };
}

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { computedChart, setComputedChart, isPremium } = useAppStore();
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [loadingHoroscope, setLoadingHoroscope] = useState(false);
  const router = useRouter();

  // Interactive Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalContent, setSelectedModalContent] = useState<{
    title: string;
    subtitle: string;
    content: string;
    advice?: string;
  } | null>(null);

  const moonPhaseInfo = useMemo(() => {
    const today = new Date();
    const jd = getJulianDaysSinceJ2000(today);
    const sunLon = getPlanetLongitude('Sun', jd);
    const moonLon = getPlanetLongitude('Moon', jd);
    return getMoonPhase(sunLon, moonLon);
  }, []);

  const handlePremiumNavigation = (route: string) => {
    if (isPremium) {
      router.push(route as any);
    } else {
      Alert.alert(
        'Elite Üyelik Gerekli',
        'Bu özellik yalnızca Cosmic Elite üyelerine özeldir. Detaylı analizleri açmak için üye olabilirsiniz.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Üyeliği İncele', onPress: () => router.push('/settings') }
        ]
      );
    }
  };

  const openDetailModal = (type: 'moon' | 'identity' | 'general' | 'love' | 'career' | 'shadow') => {
    if (type === 'moon') {
      setSelectedModalContent({
        title: `Güncel Ay Evresi: ${moonPhaseInfo.name} ${moonPhaseInfo.symbol}`,
        subtitle: 'Kolektif Ritimler ve Anima',
        content: `Bugün gökyüzünde Ay "${moonPhaseInfo.name}" evresindedir. Carl Jung psikolojisinde Ay, bilinçdışı dünyamız, rüyalar, duygusal ihtiyaçlar ve anima (içsel dişil enerji) ile sembolize edilir.\n\nAy evreleri, kolektif ruh halimizin dalgalanmalarını yansıtır. Doğal döngüleri fark etmek, egonun (Güneş) bilinçdışının derinliklerinden yükselen mesajları doğru entegre etmesine yardımcı olur.`,
        advice: 'Bugün duygusal ihtiyaçlarınızı bastırmak yerine onları gözlemleyin. İçe dönmek ve sakinleşmek için kendinize alan tanıyın. Rüyalarınıza ekstra dikkat edin.'
      });
    } else if (type === 'identity') {
      setSelectedModalContent({
        title: `Güneş Konumu: ${userSunSign} Burcu`,
        subtitle: 'Bireyleşme (Individuation) ve Ego Işığı',
        content: `Güneş, astrolojide benliğin ve bilincin özünü temsil eder. Carl Jung psikolojisinde bilinçli Ego'ya ve bireyselleşme (Individuation) sürecinin merkezine karşılık gelir.\n\nGüneş burcunuz olan ${userSunSign}, bu dünyada kendinizi gerçekleştirirken kuşanacağınız kahraman arketipidir. Bu yerleşim, iradenizi, yaratıcılığınızı ve ruhsal merkezinizi nerede aradığınızı gösterir.`,
        advice: 'Persona\'nızın (toplumsal maskelerinizin) sizi tanımlamasına izin vermeyin. Bugün Güneş burcunuzun en yaratıcı ve yapıcı özelliklerini sergileyen özgün bir eylem gerçekleştirin.'
      });
    } else if (type === 'general' && horoscope) {
      setSelectedModalContent({
        title: '☀️ Bireysel Yolculuk',
        subtitle: 'Ego ve Kahramanın Yolu',
        content: horoscope.general,
        advice: 'Günün Sorusu: Bugün aldığınız kararlarda kendi özgün iradeniz mi yoksa dış dünyanın sizden beklediği rol (Persona) mü baskındı?'
      });
    } else if (type === 'love' && horoscope) {
      setSelectedModalContent({
        title: '💞 Yansımalar & İlişki',
        subtitle: 'İlişkiler ve Anima/Animus Projeksiyonları',
        content: horoscope.love,
        advice: 'Günün Pratiği: Partnerinizde veya çevrenizde sizi aşırı kızdıran/hayran bırakan özellikleri düşünün. Bunlar kendi içinizdeki bastırılmış dişil (Anima) ya da eril (Animus) potansiyellerin yansıması (projeksiyonu) olabilir.'
      });
    } else if (type === 'career' && horoscope) {
      setSelectedModalContent({
        title: '💼 Kariyer & İrade',
        subtitle: 'Dış Dünya Rolleri ve Toplumsal Maske',
        content: horoscope.career,
        advice: 'Günün Dengesi: Toplumsal statünüzü ve sorumluluklarınızı (Persona) yönetirken, içsel benliğinizin özgürlüğünden ödün vermemeye özen gösterin.'
      });
    } else if (type === 'shadow' && horoscope) {
      setSelectedModalContent({
        title: '🌑 Gölge Entegrasyonu',
        subtitle: 'Kişisel Bilinçdışının Keşfi',
        content: horoscope.shadowSelf,
        advice: 'Günün Gölge Çalışması: Bugün kaçındığınız, yargıladığınız ya da kendinize yakıştıramadığınız bir duygunuzu (kıskançlık, öfke vb.) dürüstçe kabul edip onunla diyalog kurmayı deneyin.'
      });
    }
    setModalVisible(true);
  };

  // 1. Calculate birth chart dynamically from profile
  useEffect(() => {
    if (!profile || !profile.birth_date || !profile.birth_time) return;

    try {
      const [year, month, day] = profile.birth_date.split('-').map(Number);
      const [hour, minute] = profile.birth_time.split(':').map(Number);
      const lat = profile.latitude || 41.0082;
      const lon = profile.longitude || 28.9784;

      // Estimate timezone offset (standard GMT+3 for Turkey is common)
      const tzOffset = 3;

      const chart = computeNatalChart(year, month, day, hour, minute, lat, lon, tzOffset);
      setComputedChart(chart);
    } catch (e) {
      console.warn('Error calculating natal chart:', e);
    }
  }, [profile, setComputedChart]);

  // 2. Fetch daily Jungian horoscope from Gemini
  useEffect(() => {
    if (!profile || !computedChart) return;

    const loadHoroscope = async () => {
      setLoadingHoroscope(true);
      try {
        const sun = computedChart.planets.find(p => p.name === 'Sun');
        const sunSign = sun ? sun.sign : 'Koç';

        const data = await fetchDailyHoroscope(
          profile.name || 'Gezgin',
          sunSign,
          profile.birth_date || '',
          profile.birth_place || ''
        );
        setHoroscope(data);
      } catch (err) {
        console.warn('Error loading daily horoscope:', err);
      } finally {
        setLoadingHoroscope(false);
      }
    };

    loadHoroscope();
  }, [profile, computedChart]);

  // 3. Compute current Moon Phase offline (handled inline via useMemo)

  const userSunSign = computedChart?.planets?.find(p => p.name === 'Sun')?.sign || 'Keşfedilmemiş';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Selam, {profile?.name || 'Kozmik Ruh'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Current Moon Phase widget */}
        <Pressable onPress={() => openDetailModal('moon')}>
          <GlassCard style={styles.moonWidget}>
            <Text style={styles.moonSymbol}>{moonPhaseInfo.symbol}</Text>
            <View style={styles.moonDetails}>
              <Text style={styles.moonTitle}>Güncel Ay Evresi (Detay için dokunun)</Text>
              <Text style={styles.moonName}>{moonPhaseInfo.name}</Text>
            </View>
          </GlassCard>
        </Pressable>

        {/* User Sun Sign card */}
        <Pressable onPress={() => openDetailModal('identity')}>
          <GlassCard style={styles.signCard}>
            <View style={styles.row}>
              <Text style={styles.signTitle}>Kozmik Kimlik (Detay için dokunun)</Text>
              {isPremium && <Text style={styles.premiumBadge}>Elite</Text>}
            </View>
            <Text style={styles.signName}>{userSunSign} Burcu</Text>
            <Text style={styles.signDetails}>
              Haritanızdaki Güneş yerleşimi, bilinçli kimliğinizi ve ruhsal merkezlenme amacınızı (Jungian self) temsil eder.
            </Text>
          </GlassCard>
        </Pressable>

        {/* Elite Services Section */}
        <Text style={styles.sectionTitle}>Elite Kozmik Servisler</Text>
        <View style={styles.premiumServicesRow}>
          <Pressable
            style={styles.serviceCard}
            onPress={() => handlePremiumNavigation('/premium/transit')}
          >
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceEmoji}>🌌</Text>
              <Text style={styles.serviceCardTitle}>Transit Analizi</Text>
              {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
            <Text style={styles.serviceDescription}>
              Gökyüzünün güncel hareketlerinin doğum haritanıza olan psikolojik ve arketipsel yansımaları.
            </Text>
          </Pressable>

          <Pressable
            style={styles.serviceCard}
            onPress={() => handlePremiumNavigation('/premium/synastry')}
          >
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceEmoji}>💞</Text>
              <Text style={styles.serviceCardTitle}>Sinastri (İlişki Uyum)</Text>
              {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
            <Text style={styles.serviceDescription}>
              İki doğum haritasının karşılaştırmalı analiziyle ilişkideki derin Anima/Animus dengesi.
            </Text>
          </Pressable>

          <Pressable
            style={styles.serviceCard}
            onPress={() => handlePremiumNavigation('/premium/yildizname')}
          >
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceEmoji}>📜</Text>
              <Text style={styles.serviceCardTitle}>Yıldızname Raporu</Text>
              {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
            <Text style={styles.serviceDescription}>
              Geleneksel isim Ebced hesabı ve mizaç elementleriyle hazırlanan mistik rehber.
            </Text>
          </Pressable>
        </View>

        {/* Gemini Daily Forecast Section */}
        <Text style={styles.sectionTitle}>Bugünün Kozmik Yorumları</Text>
        
        {loadingHoroscope ? (
          <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
        ) : horoscope ? (
          <View style={styles.horoscopeGrid}>
            <Pressable onPress={() => openDetailModal('general')}>
              <GlassCard style={styles.forecastCard}>
                <Text style={styles.forecastHeader}>☀️ Bireysel Yolculuk</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.general}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>

            <Pressable onPress={() => openDetailModal('love')}>
              <GlassCard style={styles.forecastCard}>
                <Text style={styles.forecastHeader}>💞 Yansımalar & İlişki</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.love}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>

            <Pressable onPress={() => openDetailModal('career')}>
              <GlassCard style={styles.forecastCard}>
                <Text style={styles.forecastHeader}>💼 Kariyer & İrade</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.career}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>

            <Pressable onPress={() => openDetailModal('shadow')}>
              <GlassCard style={styles.forecastCard}>
                <Text style={styles.forecastHeader}>🌑 Gölge Entegrasyonu</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.shadowSelf}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.errorText}>Yorumlar yüklenirken bir sorun oluştu.</Text>
        )}
      </ScrollView>

      {/* Details Modal overlay */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedModalContent?.title}</Text>
              <Text style={styles.modalSubtitle}>{selectedModalContent?.subtitle}</Text>
              
              <View style={styles.modalDivider} />
              
              <Text style={styles.modalText}>{selectedModalContent?.content}</Text>
              
              {selectedModalContent?.advice && (
                <View style={styles.adviceContainer}>
                  <Text style={styles.adviceTitle}>💡 Jungcu Kozmik Öneri</Text>
                  <Text style={styles.adviceText}>{selectedModalContent.advice}</Text>
                </View>
              )}
            </ScrollView>
            
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 110, // Margin for tab bar overlap
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  moonWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  moonSymbol: {
    fontSize: 42,
    marginRight: 16,
  },
  moonDetails: {
    flex: 1,
  },
  moonTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  moonName: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginTop: 2,
  },
  signCard: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  signTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  signName: {
    fontFamily: 'Cinzel',
    fontSize: 22,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 10,
  },
  signDetails: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  horoscopeGrid: {
    gap: 16,
  },
  forecastCard: {
    padding: 16,
  },
  forecastHeader: {
    fontFamily: 'Cinzel',
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 8,
  },
  forecastText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: '#FF7B72',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter',
  },
  premiumServicesRow: {
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  serviceCardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '700',
    flex: 1,
  },
  lockIcon: {
    fontSize: 14,
    color: '#8B949E',
  },
  serviceDescription: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    width: '100%',
    maxHeight: '85%',
    padding: 24,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    marginVertical: 16,
  },
  modalText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F0F6FC',
    lineHeight: 22,
    marginBottom: 20,
  },
  adviceContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  adviceTitle: {
    fontFamily: 'Cinzel',
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 6,
  },
  adviceText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF0',
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#0D1117',
    fontWeight: '700',
  },
  detailLink: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
