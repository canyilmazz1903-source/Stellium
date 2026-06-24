import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Pressable, Alert } from 'react-native';
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
          { text: 'Üyeliği İncele', onPress: () => router.navigate('/settings') }
        ]
      );
    }
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
        <GlassCard style={styles.moonWidget}>
          <Text style={styles.moonSymbol}>{moonPhaseInfo.symbol}</Text>
          <View style={styles.moonDetails}>
            <Text style={styles.moonTitle}>Güncel Ay Evresi</Text>
            <Text style={styles.moonName}>{moonPhaseInfo.name}</Text>
          </View>
        </GlassCard>

        {/* User Sun Sign card */}
        <GlassCard style={styles.signCard}>
          <View style={styles.row}>
            <Text style={styles.signTitle}>Kozmik Kimlik</Text>
            {isPremium && <Text style={styles.premiumBadge}>Elite</Text>}
          </View>
          <Text style={styles.signName}>{userSunSign} Burcu</Text>
          <Text style={styles.signDetails}>
            Haritanızdaki Güneş yerleşimi, bilinçli kimliğinizi ve ruhsal merkezlenme amacınızı (Jungian self) temsil eder.
          </Text>
        </GlassCard>

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
            <GlassCard style={styles.forecastCard}>
              <Text style={styles.forecastHeader}>☀️ Bireysel Yolculuk</Text>
              <Text style={styles.forecastText}>{horoscope.general}</Text>
            </GlassCard>

            <GlassCard style={styles.forecastCard}>
              <Text style={styles.forecastHeader}>💞 Yansımalar & İlişki</Text>
              <Text style={styles.forecastText}>{horoscope.love}</Text>
            </GlassCard>

            <GlassCard style={styles.forecastCard}>
              <Text style={styles.forecastHeader}>💼 Kariyer & İrade</Text>
              <Text style={styles.forecastText}>{horoscope.career}</Text>
            </GlassCard>

            <GlassCard style={styles.forecastCard}>
              <Text style={styles.forecastHeader}>🌑 Gölge Entegrasyonu</Text>
              <Text style={styles.forecastText}>{horoscope.shadowSelf}</Text>
            </GlassCard>
          </View>
        ) : (
          <Text style={styles.errorText}>Yorumlar yüklenirken bir sorun oluştu.</Text>
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
});
