import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Pressable, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { computeNatalChart, getPlanetLongitude, getJulianDaysSinceJ2000, calculatePlanetaryHours, PlanetaryHour } from '@/utils/astronomy';
import { fetchDailyHoroscope, HoroscopeResponse } from '@/api/gemini';
import GlassCard from '@/components/glass/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useCosmicCalendarStore } from '@/store/cosmicCalendarStore';
import PaywallAdModal from '@/components/ui/PaywallAdModal';

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
  const { profile, isPremium, hasUnlockedDailyShadow } = useAuthStore();
  const { computedChart, setComputedChart } = useAppStore();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [loadingHoroscope, setLoadingHoroscope] = useState(false);
  const router = useRouter();

  const {
    moonPhase,
    moonSign,
    beautyAdvice,
    healthAdvice,
    shadowsAdvice,
    auraColors,
    calculateAlmanac,
    fetchShadows
  } = useCosmicCalendarStore();

  // Reanimated shared values for background aura colors
  const color1 = useSharedValue('#B2F7EF');
  const color2 = useSharedValue('#EFF7F6');

  useEffect(() => {
    if (auraColors && auraColors.length >= 2) {
      color1.value = withTiming(auraColors[0], { duration: 2500 });
      color2.value = withTiming(auraColors[1], { duration: 2500 });
    }
  }, [auraColors]);

  const animatedAuraStyle1 = useAnimatedStyle(() => {
    return {
      backgroundColor: color1.value,
    };
  });

  const animatedAuraStyle2 = useAnimatedStyle(() => {
    return {
      backgroundColor: color2.value,
    };
  });

  // Calculate Almanac and fetch shadows on chart load
  useEffect(() => {
    calculateAlmanac(computedChart);
    if (computedChart && profile) {
      fetchShadows(profile.name || 'Kozmik Ruh', computedChart);
    }
  }, [computedChart, profile, calculateAlmanac, fetchShadows]);

  // Interactive Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModalContent, setSelectedModalContent] = useState<{
    title: string;
    subtitle: string;
    content: string;
    advice?: string;
  } | null>(null);

  const [planetaryHours, setPlanetaryHours] = useState<PlanetaryHour[]>([]);

  useEffect(() => {
    const lat = profile?.latitude || 41.0082;
    const lon = profile?.longitude || 28.9784;
    const hours = calculatePlanetaryHours(lat, lon, new Date());
    setPlanetaryHours(hours);
  }, [profile]);

  const activeHour = useMemo(() => planetaryHours.find(h => h.isActive), [planetaryHours]);

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
    if (type === 'shadow' && !isPremium && !hasUnlockedDailyShadow) {
      setPaywallVisible(true);
      return;
    }
    if (type === 'moon') {
      setSelectedModalContent({
        title: `🌙 AY EVRESİ: ${moonPhaseInfo.name} ${moonPhaseInfo.symbol}`,
        subtitle: 'Göksel Ritimler ve Günlük Ay Rehberi',
        content: `Bugün gökyüzünde Ay, "${moonPhaseInfo.name}" evresindedir. Astrolojide Ay, duygusal durumumuzu, sezgilerimizi ve günlük ruhsal ritmimizi yönetir. Her evrenin kendine has kozmik frekansı vardır ve bu ritme uyumlanmak işlerinizin çok daha kolay akmasını sağlar.\n\n• Yeni Ay (Niyet): Tohum ekme, taze başlangıçlar ve niyet belirleme dönemidir. Zihinsel arınma için en uygun zamandır.\n• Büyüyen Ay (Eyleme Geçiş): Planları büyütme, harekete geçme ve kararlılık enerjisi taşır. Cesur adımlar atabilirsiniz.\n• Dolunay (Zirve): Tamamlanma, netleşme ve yüksek enerji dönemidir. Şükran duymak ve serbest bırakmak için idealdir.\n• Küçülen Ay (Arınma): Temizlik, detoks, gereksiz yüklerden ve zararlı alışkanlıklardan kurtulma vaktidir.`,
        advice: `🔮 Günlük Ay Ritüeli & Öneri:
1. Tuzlu Su Ritüeli: Akşam saatlerinde bir kase suya biraz deniz tuzu veya normal kaya tuzu ekleyip ellerinizi bu suyla yıkayarak günün tüm biriken stresini ve negatif enerjisini nötrleyin.
2. Zikir Esması: Ay enerjisini ve sezgilerinizi yükseltmek adına bugün 170 defa "Ya Kuddüs" (Arındıran) veya "Ya Selam" (Esenlik Veren) esmasını zikretmeniz tavsiye edilir.`
      });
    } else if (type === 'identity') {
      setSelectedModalContent({
        title: `☀️ GÜNEŞ BURCU: ${userSunSign} Burcu`,
        subtitle: 'Kozmik Kimlik, Mizaç ve Yaşam Amacı',
        content: `Güneş, astrolojide sizin yaşam gücünüzü, iradenizi, karakterinizin özünü ve dış dünyaya saçtığınız ışığı temsil eder. Burcunuz olan ${userSunSign}, haritanızın merkezidir.\n\nBurcunuzun elementi ve niteliği (Öncü, Sabit, Değişken) hayattaki temel motivasyon kaynağınızı ve olaylar karşısındaki tavrınızı belirler. Güneş'in bu güçlü konumu, yaşam yolculuğunuzda yeteneklerinizi sergilemeniz ve kendinizi gerçekleştirmeniz için size rehberlik eder.`,
        advice: `🔮 Burç Enerjinizi Yükseltme Önerisi:
Bugün Güneş burcunuzun güçlü yanlarını (Ateş ise cesaret ve hareket; Toprak ise kararlılık ve düzen; Hava ise iletişim ve bilgi; Su ise empati ve sezgi) ön plana çıkaracak işlere odaklanın. Ruhsal gücünüzü pekiştirmek için 99 defa "Ya Cami" (Bir Araya Getiren) veya 400 defa "Ya Vedud" (Sevgiyi Büyüten) esmasını zikredin.`
      });
    } else if (type === 'general' && horoscope) {
      setSelectedModalContent({
        title: '☀️ GÜNLÜK KOZMİK RİTİMLER',
        subtitle: 'Günün Astrolojik Analizi & Tavsiyeler',
        content: horoscope.general,
        advice: '🔮 Günlük Yaşam Önerisi:\nBugün işlerinizde acele etmek yerine sabırlı adımlarla ilerleyin. Akşam evinizde adaçayı veya üzerlik otu tütsüsü yakarak mekanın enerjisini tazeleyin.'
      });
    } else if (type === 'love' && horoscope) {
      setSelectedModalContent({
        title: '💞 AŞK, İLİŞKİLER VE ÇEKİM GÜCÜ',
        subtitle: 'Venüs & Mars Enerjileri',
        content: horoscope.love,
        advice: '🔮 Uyum & Sevgi Ritüeli:\nİkili ilişkilerinizde uyumu ve muhabbeti artırmak için bugün 400 defa "Ya Vedud" zikrini çekebilirsiniz. Avuç içinize süreceğiniz bir damla gül yağı veya üzerinizde taşıyacağınız pembe kuvars taşı, sevgi frekansınızı artıracaktır.'
      });
    } else if (type === 'career' && horoscope) {
      setSelectedModalContent({
        title: '💼 BEREKET, BOLLUK VE KARİYER',
        subtitle: 'Finansal Fırsatlar & Jüpiter Etkisi',
        content: horoscope.career,
        advice: '🔮 Bolluk & Bereket Ritüeli:\nİşlerinizin rast gitmesi ve bereketinizin artması için cüzdanınızda bir adet defne yaprağı taşıyın. Bolluk kapılarını açmak adına bugün 489 defa "Ya Fettah" (Kapıları Açan) ve 308 defa "Ya Rezzak" (Rızık Veren) esmasını zikredin.'
      });
    } else if (type === 'shadow' && horoscope) {
      setSelectedModalContent({
        title: '✨ GÜNLÜK RİTÜEL & ÖZEL ESMA',
        subtitle: 'Ay Döngüsü Rutinleri ve Günün Zikri',
        content: horoscope.shadowSelf,
        advice: '🔮 Kozmik Esma Ritüeli:\nGökyüzünün bugünkü titreşimleriyle rezonansa girmek, negatif gözlerden (nazar) ve enerjilerden korunmak adına bugün 129 defa "Ya Latif" (Lütufkar) zikrini çekin. Zikir çekerken sessiz bir alanda gözlerinizi kapatıp derin nefesler alın.'
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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Background Aura circles blurred */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -100,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 160,
            opacity: 0.15,
          },
          animatedAuraStyle1
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 100,
            left: -100,
            width: 360,
            height: 360,
            borderRadius: 180,
            opacity: 0.12,
          },
          animatedAuraStyle2
        ]}
      />
      
      {/* BlurView to make the aura soft and ethereal */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Welcome Header */}
          <View style={styles.header}>
            <Text style={styles.greeting} className="text-white text-3xl font-extrabold tracking-tight">Selam, {profile?.name || 'Kozmik Ruh'}</Text>
            <Text style={styles.dateText} className="text-white/50 text-xs font-semibold uppercase tracking-wider mt-1">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {/* Live Planetary Hours Timeline */}
          <View className="mb-6">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2.5 font-sans">⏱️ Canlı Gezegen Saatleri</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {planetaryHours.map((hour, idx) => (
                <View 
                  key={idx} 
                  className={`px-3 py-2.5 rounded-2xl border ${hour.isActive ? 'border-amber-400 bg-amber-400/10' : 'border-white/5 bg-white/5'} items-center`}
                  style={{ width: 105 }}
                >
                  <Text className="text-lg mb-0.5">{hour.planetSymbol}</Text>
                  <Text className={`text-[11px] font-bold font-sans ${hour.isActive ? 'text-amber-300' : 'text-white'}`}>{hour.planetName} Saati</Text>
                  <Text className="text-[9px] text-white/50 font-semibold font-sans mt-0.5">{hour.label}</Text>
                </View>
              ))}
            </ScrollView>
            {activeHour && (
              <GlassCard className="mt-3 p-3.5 rounded-2xl border border-white/5 bg-white/5 flex-row items-center">
                <Text className="text-2xl mr-3">{activeHour.planetSymbol}</Text>
                <View className="flex-1">
                  <Text className="text-white/90 text-xs font-bold font-sans">Şu An: {activeHour.planetName} Saati ({activeHour.label})</Text>
                  <Text className="text-white/50 text-[11px] font-sans mt-0.5 leading-relaxed">{activeHour.meaning}</Text>
                </View>
              </GlassCard>
            )}
          </View>

          {/* New Core Component: Lunar Lifestyle Almanac Card */}
          <GlassCard style={styles.almanacCard}>
            <View style={styles.almanacHeaderRow}>
              <Text style={styles.almanacTitle}>🌙 Kozmik Yaşam Takvimi</Text>
              <View style={styles.almanacBadge}>
                <Text style={styles.almanacBadgeText}>Almanak</Text>
              </View>
            </View>
            
            <Text style={styles.almanacSubtitle}>
              Ay {moonSign} Burcunda • {moonPhase === 'waxing' ? 'Büyüyen Ay Evresi' : 'Küçülen Ay Evresi'}
            </Text>

            <View style={styles.almanacBody}>
              <View style={styles.almanacItemRow}>
                <Text style={styles.almanacEmoji}>💇‍♀️</Text>
                <View style={styles.almanacItemContent}>
                  <Text style={styles.almanacSectionHeader}>Saç & Güzellik</Text>
                  {isPremium ? (
                    <Text style={styles.almanacAdviceText}>{beautyAdvice}</Text>
                  ) : (
                    <Pressable onPress={() => router.push('/settings')}>
                      <Text style={styles.almanacUnlockText}>🔒 Stellium Elite ile Kilidi Aç →</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.almanacItemRow}>
                <Text style={styles.almanacEmoji}>🍏</Text>
                <View style={styles.almanacItemContent}>
                  <Text style={styles.almanacSectionHeader}>Sağlık & Detoks</Text>
                  {isPremium ? (
                    <Text style={styles.almanacAdviceText}>{healthAdvice}</Text>
                  ) : (
                    <Pressable onPress={() => router.push('/settings')}>
                      <Text style={styles.almanacUnlockText}>🔒 Stellium Elite ile Kilidi Aç →</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.almanacItemRow}>
                <Text style={styles.almanacEmoji}>🌓</Text>
                <View style={styles.almanacItemContent}>
                  <Text style={styles.almanacSectionHeader}>Zihinsel Gölgeler</Text>
                  {isPremium || hasUnlockedDailyShadow ? (
                    <Text style={styles.almanacAdviceText}>{shadowsAdvice}</Text>
                  ) : (
                    <Pressable onPress={() => setPaywallVisible(true)}>
                      <Text style={styles.almanacUnlockText}>🔑 Reklam İzle veya Elite Olup Aç →</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </GlassCard>

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
                Haritanızdaki Güneş yerleşimi, öz kimliğinizi ve yaşam gücünüzün temel kozmik yansımasını temsil eder.
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
                <Text style={styles.forecastHeader}>💼 Kariyer & Bereket</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.career}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>

            <Pressable onPress={() => openDetailModal('shadow')}>
              <GlassCard style={styles.forecastCard}>
                <Text style={styles.forecastHeader}>✨ Günlük Ritüel & Zikir</Text>
                <Text style={styles.forecastText} numberOfLines={4}>{horoscope.shadowSelf}</Text>
                <Text style={styles.detailLink}>Detaylı Analiz & Tavsiyeler için Dokunun →</Text>
              </GlassCard>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.errorText}>Yorumlar yüklenirken bir sorun oluştu.</Text>
        )}
      </ScrollView>

      {/* Full Screen Details Modal overlay */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleContainer}>
                <Text style={styles.modalTitle}>{selectedModalContent?.title}</Text>
                <Text style={styles.modalSubtitle}>{selectedModalContent?.subtitle}</Text>
              </View>
              <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#D4AF37" />
              </Pressable>
            </View>
            
            <View style={styles.modalDivider} />
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>{selectedModalContent?.content}</Text>
              
              {selectedModalContent?.advice && (
                <View style={styles.adviceContainer}>
                  <Text style={styles.adviceTitle}>🔮 Günlük Ritüel & Zikir Önerisi</Text>
                  <Text style={styles.adviceText}>{selectedModalContent.advice}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <PaywallAdModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {
          Alert.alert("Başarılı", "Günlük gölge analizi kilidi açıldı!");
        }}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#E6EDF0',
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
    color: '#E6EDF0',
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
    color: '#E6EDF0',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  modalHeaderTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    marginVertical: 14,
  },
  modalText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#F0F6FC',
    lineHeight: 24,
    marginBottom: 20,
  },
  adviceContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  adviceTitle: {
    fontFamily: 'Cinzel',
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 8,
  },
  adviceText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    lineHeight: 20,
  },
  detailLink: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  almanacCard: {
    overflow: 'hidden',
    padding: 20,
  },
  almanacHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  almanacTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  almanacBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  almanacBadgeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  almanacSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  almanacBody: {
    gap: 16,
  },
  almanacItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  almanacEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  almanacItemContent: {
    flex: 1,
  },
  almanacSectionHeader: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  almanacAdviceText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#F0F6FC',
    marginTop: 4,
    lineHeight: 18,
  },
  almanacUnlockText: {
    color: '#F3E5AB',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
