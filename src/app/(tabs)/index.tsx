import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Pressable, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { computeNatalChart, getPlanetLongitude, getJulianDaysSinceJ2000, calculatePlanetaryHours, PlanetaryHour, getTimezoneOffset } from '@/utils/astronomy';
import { HoroscopeResponse } from '@/api/gemini';
import GlassCard from '@/components/glass/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withDelay, Easing } from 'react-native-reanimated';
import { useCosmicCalendarStore } from '@/store/cosmicCalendarStore';
import PaywallAdModal from '@/components/ui/PaywallAdModal';
import { schedulePlanetaryHourNotifications } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const TURKISH_TO_ENGLISH_PLANET: Record<string, string> = {
  'Güneş': 'Sun',
  'Ay': 'Moon',
  'Merkür': 'Mercury',
  'Venüs': 'Venus',
  'Mars': 'Mars',
  'Jüpiter': 'Jupiter',
  'Satürn': 'Saturn'
};

const PLANETARY_HOURS_DEEP_INFO: Record<string, {
  name: string;
  symbol: string;
  energy: string;
  activities: string[];
  avoid: string[];
  spiritual: string;
  color: string;
}> = {
  Sun: {
    name: 'Güneş',
    symbol: '☀️',
    energy: 'Liderlik, parlama, yaşamsal canlılık, otorite ve öz güven.',
    activities: [
      'Kariyerinizle ilgili önemli görüşmeler yapmak.',
      'Yöneticilerden onay veya destek talep etmek.',
      'Sunum yapmak, sahneye çıkmak ve görünür olmak.',
      'Yeni ve büyük projelere ilk adımı atmak.'
    ],
    avoid: [
      'Aşırı gururlu veya bencilce davranmak.',
      'Eleştirilere tahammülsüzlük göstermek.',
      'Gölgede kalmayı tercih etmek.'
    ],
    spiritual: 'Ruhun öz bilinciyle ve yüksek benlikle hizalanma zamanıdır. Kalbinizin sesini duymak ve gerçek potansiyelinizi niyet etmek için harika bir andır.',
    color: '#F59E0B'
  },
  Moon: {
    name: 'Ay',
    symbol: '🌙',
    energy: 'Duygular, sezgiler, bilinçdışı, besleme ve evsel huzur.',
    activities: [
      'Meditasyon yapmak, dua etmek ve iç sesinizi dinlemek.',
      'Aile ziyaretleri yapmak, evinizi düzenlemek.',
      'Ruhsal/duygusal şifa çalışmaları gerçekleştirmek.',
      'Su ile ilgili arınma banyoları veya ritüelleri yapmak.'
    ],
    avoid: [
      'Önemli ticari anlaşmalara imza atmak.',
      'Mantıksal ve soğukkanlılık gerektiren riskli işlere girmek.',
      'Duygusal tepkilerle ani kararlar almak.'
    ],
    spiritual: 'Dişil enerjinin, teslimiyetin ve alıcılığın en yüksek olduğu saattir. Evrenden gelen ilhamları almak ve rüyalarınızı kaydetmek için idealdir.',
    color: '#60A5FA'
  },
  Mercury: {
    name: 'Merkür',
    symbol: '☿',
    energy: 'Zihinsel keskinlik, iletişim, ticaret, eğitim ve hız.',
    activities: [
      'Ders çalışmak, kitap okumak, yazı yazmak ve kod geliştirmek.',
      'E-postalar göndermek, önemli telefon görüşmeleri yapmak.',
      'Ticari pazarlıklar, sözleşme imzalamaları yapmak.',
      'Kısa seyahatleri organize etmek ve bilet almak.'
    ],
    avoid: [
      'Kafa karışıklığı varken dedikodulara dahil olmak.',
      'Detayları okumadan aceleyle onay vermek.',
      'Aynı anda çok fazla işe bölünmek.'
    ],
    spiritual: 'Zihinsel ağların ve enerjisel bağların kurulduğu andır. Fikirlerinizin gerçeğe dönüşmesi için zihinsel odaklanma ve netlik meditasyonu yapın.',
    color: '#34D399'
  },
  Venus: {
    name: 'Venüs',
    symbol: '♀',
    energy: 'Aşk, ilişkiler, güzellik, estetik, uyum ve bolluk.',
    activities: [
      'Romantik buluşmalar yapmak, eşinizle vakit geçirmek.',
      'Saç kesimi, cilt bakımı ve estetik müdahaleler yaptırmak.',
      'Sanatla ilgilenmek, dekorasyon yapmak ve giyim alışverişi.',
      'Kırgın olduğunuz kişilerle barışma adımları atmak.'
    ],
    avoid: [
      'Parasal konularda aşırı savurganlık ve lüks harcamalar.',
      'İlişkilerde aşırı alınganlık veya tembellik.'
    ],
    spiritual: 'Koşulsuz sevgi ve çekim yasasının en aktif çalıştığı andır. Hayatınıza sevgiyi, bolluğu ve güzelliği davet eden şükür ritüelleri için idealdir.',
    color: '#F472B6'
  },
  Mars: {
    name: 'Mars',
    symbol: '♂',
    energy: 'Cesaret, eylem, fiziksel güç, kararlılık ve mücadele.',
    activities: [
      'Ağır antrenmanlar, spor and fiziksel eylemler yapmak.',
      'Ertelediğiniz, cesaret gerektiren zorlu işleri bitirmek.',
      'Rekabetçi projelerde hakkınızı aramak veya hamle yapmak.',
      'Evinizde derin temizlik veya güç gerektiren işleri yapmak.'
    ],
    avoid: [
      'Öfke kontrolünü kaybedip tartışmalara girmek.',
      'Trafikte veya riskli durumlarda aceleci davranmak.',
      'Kazalara açık olabileceğiniz için dikkatsiz hareket etmek.'
    ],
    spiritual: 'İçsel savaşçıyı uyandırma ve ataleti (tembelliği) kırma vaktidir. Korkularınızın üzerine gitmek ve kararlılık göstermek için Mars enerjisini kullanın.',
    color: '#EF4444'
  },
  Jupiter: {
    name: 'Jüpiter',
    symbol: '♃',
    energy: 'Bolluk, şans, genişleme, maneviyat, felsefe ve bilgelik.',
    activities: [
      'Bolluk ve bereket duaları/ritüelleri yapmak.',
      'İhtiyacı olanlara bağışta bulunmak veya yardım etmek.',
      'Yeni bir eğitime başlamak, yabancı dillerle ilgilenmek.',
      'Geleceğe dair büyük hedefler belirlemek ve vizyon tahtası yapmak.'
    ],
    avoid: [
      'Aşırı iyimserlikle gereksiz finansal riskler almak.',
      'Kibre kapılıp altından kalkamayacağınız sözler vermek.'
    ],
    spiritual: 'Büyük İyicil gezegenin saatidir. Evrensel lütuf ve bereket kapılarının açık olduğuna inanarak, niyetlerinizi en yüksek frekanstan yapın.',
    color: '#FBBF24'
  },
  Saturn: {
    name: 'Satürn',
    symbol: '♄',
    energy: 'Disiplin, sınırlar, zaman, dayanıklılık, sorumluluk ve karma.',
    activities: [
      'Uzun vadeli planlar yapmak, bütçe hazırlamak.',
      'Yarım kalmış, sabır gerektiren idari işleri toparlamak.',
      'Sınırlarınızı korumak ve hayır demeyi çalışmak.',
      'Yaşça büyük veya deneyimli kişilerden rehberlik almak.'
    ],
    avoid: [
      'Depresif ve karamsar düşünce kalıplarına girmek.',
      'Yeni bir işletme kurmak veya borç para vermek.'
    ],
    spiritual: 'Zamanın efendisinin saatidir. Sabır, sınırlar ve olgunlaşma sınavlarını temsil eder. Bu saatte yapılan çalışmalar kalıcı temeller kurar.',
    color: '#9CA3AF'
  }
};

export default function HomeScreen() {
  const { profile, isPremium, hasUnlockedDailyShadow } = useAuthStore();
  const { computedChart, setComputedChart, dailyHoroscope: horoscope, fetchHoroscope } = useAppStore();
  const [paywallVisible, setPaywallVisible] = useState(false);
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
    fetchShadows,
    cosmicCare,
    cosmicCareProjections
  } = useCosmicCalendarStore();

  useEffect(() => {
    if (auraColors && auraColors.length >= 2) {
      // Reanimated removed for stability
    }
  }, [auraColors]);


  // Calculated Almanac and shadows
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

  // Planetary Hours Modal State
  const [planetaryModalVisible, setPlanetaryModalVisible] = useState(false);
  const [selectedPlanetForDetail, setSelectedPlanetForDetail] = useState<string>('Sun');
  const [notifPreferences, setNotifPreferences] = useState<Record<string, boolean>>({
    Sun: true,
    Moon: true,
    Mercury: true,
    Venus: true,
    Mars: true,
    Jupiter: true,
    Saturn: true,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem('planetary_hour_notification_preferences');
        if (stored) {
          setNotifPreferences(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Error loading preferences:', e);
      }
    };
    loadPreferences();
  }, []);

  const togglePreference = async (planetName: string) => {
    const updated = {
      ...notifPreferences,
      [planetName]: !notifPreferences[planetName]
    };
    setNotifPreferences(updated);
    try {
      await AsyncStorage.setItem('planetary_hour_notification_preferences', JSON.stringify(updated));
      if (planetaryHours.length > 0) {
        await schedulePlanetaryHourNotifications(planetaryHours);
      }
    } catch (e) {
      console.warn('Error saving preferences:', e);
    }
  };

  const planetaryScrollRef = useRef<ScrollView>(null);
  const [planetaryHours, setPlanetaryHours] = useState<PlanetaryHour[]>([]);

  useEffect(() => {
    const lat = profile?.latitude || 41.0082;
    const lon = profile?.longitude || 28.9784;
    const hours = calculatePlanetaryHours(lat, lon, new Date());
    setPlanetaryHours(hours);
    if (hours.length > 0) {
      schedulePlanetaryHourNotifications(hours);
    }
  }, [profile]);

  useEffect(() => {
    if (planetaryHours.length > 0) {
      const activeIdx = planetaryHours.findIndex(h => h.isActive);
      if (activeIdx !== -1) {
        setTimeout(() => {
          planetaryScrollRef.current?.scrollTo({
            x: Math.max(0, activeIdx * 108 - 8), // 100 width + 8 gap
            animated: true
          });
        }, 300);
      }
    }
  }, [planetaryHours]);

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
        'Bu özellik yalnızca Stellium Elite üyelerine özeldir. Detaylı analizleri açmak için üye olabilirsiniz.',
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
    } else if (type === 'shadow') {
      setSelectedModalContent({
        title: '✨ ZİHİNSEL GÖLGELER & KOZMİK RİTÜEL',
        subtitle: 'Bilinçdışı Dirençler ve Günün Zikri',
        content: horoscope?.shadowSelf ? horoscope.shadowSelf : shadowsAdvice,
        advice: '🔮 Kozmik Esma Ritüeli:\nGökyüzünün bugünkü titreşimleriyle rezonansa girmek, negatif gözlerden ve enerjilerden korunmak adına bugün sessiz bir alanda meditasyon yapın.'
      });
    }
    setModalVisible(true);
  };

  const openCareDetailModal = (title: string, advice: string, projections?: any[]) => {
    let projectionText = '';
    if (projections && projections.length > 0) {
      projectionText = '\n\n🔮 En Uyumlu Gelecek Tarihler:\n' + projections.map(p => `• ${p.formattedRange} (${p.label})`).join('\n');
    }
    setSelectedModalContent({
      title: title,
      subtitle: 'Kozmik Bakım ve Güzellik Rehberliği',
      content: advice + projectionText,
      advice: 'Tavsiyeleri Ayın ritmine ve burç geçişlerine göre uygulayarak en yüksek kozmik verimi alabilirsiniz.'
    });
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
      const tzName = profile.timezone || 'Europe/Istanbul';

      // Dynamically calculate the historical timezone offset for this specific birth date
      const birthDateLocal = new Date(year, month - 1, day, hour, minute);
      const tzOffset = getTimezoneOffset(tzName, birthDateLocal);

      const chart = computeNatalChart(year, month, day, hour, minute, lat, lon, tzOffset);
      setComputedChart(chart);
    } catch (e) {
      console.warn('Error calculating natal chart:', e);
    }
  }, [profile, setComputedChart]);

  // 2. Fetch daily horoscope from Gemini
  useEffect(() => {
    if (!profile || !computedChart) return;

    const loadHoroscope = async () => {
      setLoadingHoroscope(true);
      try {
        const sun = computedChart.planets.find(p => p.name === 'Sun');
        const sunSign = sun ? sun.sign : 'Koç';

        await fetchHoroscope(
          profile.name || 'Gezgin',
          sunSign,
          profile.birth_date || '',
          profile.birth_place || ''
        );
      } catch (err) {
        console.warn('Error loading daily horoscope:', err);
      } finally {
        setLoadingHoroscope(false);
      }
    };

    loadHoroscope();
  }, [profile, computedChart, fetchHoroscope]);

  // 3. Compute current Moon Phase offline (handled inline via useMemo)

  const userSunSign = computedChart?.planets?.find(p => p.name === 'Sun')?.sign || 'Keşfedilmemiş';

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      {/* Static Background Aura circles */}
      <View
        style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 160,
            opacity: 0.15,
            backgroundColor: auraColors?.[0] || '#B2F7EF'
        }}
      />
      <View
        style={{
            position: 'absolute',
            bottom: 100,
            left: -100,
            width: 360,
            height: 360,
            borderRadius: 180,
            opacity: 0.12,
            backgroundColor: auraColors?.[1] || '#EFF7F6'
        }}
      />
      
      {/* BlurView to make the aura soft and ethereal */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Welcome Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Selam, {profile?.name || 'Kozmik Ruh'}</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {/* Live Planetary Hours Timeline */}
          <View style={styles.planetarySection}>
            <Text style={styles.sectionLabel}>⏱️ Canlı Gezegen Saatleri</Text>
            <ScrollView ref={planetaryScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {planetaryHours.map((hour, idx) => (
                <Pressable 
                  key={idx} 
                  onPress={() => {
                    const englishPlanet = TURKISH_TO_ENGLISH_PLANET[hour.planetName] || 'Sun';
                    setSelectedPlanetForDetail(englishPlanet);
                    setPlanetaryModalVisible(true);
                  }}
                  style={[
                    styles.hourChip,
                    hour.isActive && styles.hourChipActive,
                  ]}
                >
                  <Text style={styles.hourChipSymbol}>{hour.planetSymbol}</Text>
                  <Text style={[styles.hourChipName, hour.isActive && { color: '#FCD34D' }]}>{hour.planetName}</Text>
                  <Text style={styles.hourChipTime}>{hour.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {activeHour && (
              <Pressable 
                onPress={() => {
                  const englishPlanet = TURKISH_TO_ENGLISH_PLANET[activeHour.planetName] || 'Sun';
                  setSelectedPlanetForDetail(englishPlanet);
                  setPlanetaryModalVisible(true);
                }}
                style={styles.activeHourBar}
              >
                <Text style={styles.activeHourSymbol}>{activeHour.planetSymbol}</Text>
                <Text style={styles.activeHourText}>Şu An: {activeHour.planetName} Saati</Text>
                <Text style={styles.activeHourDot}>•</Text>
                <Text style={styles.activeHourMeaning} numberOfLines={1}>{activeHour.meaning}</Text>
              </Pressable>
            )}
          </View>

          {/* Moon + Sign Side-by-Side Row */}
          <View style={styles.dualCardRow}>
            <Pressable style={styles.dualCard} onPress={() => openDetailModal('moon')}>
              <Text style={styles.dualCardEmoji}>{moonPhaseInfo.symbol}</Text>
              <Text style={styles.dualCardLabel}>Ay Evresi</Text>
              <Text style={styles.dualCardValue}>{moonPhaseInfo.name}</Text>
              <Text style={styles.dualCardSub}>Ay {moonSign} Burcunda</Text>
            </Pressable>
            <Pressable style={styles.dualCard} onPress={() => openDetailModal('identity')}>
              <Text style={styles.dualCardEmoji}>✦</Text>
              <Text style={styles.dualCardLabel}>Kozmik Kimlik</Text>
              <Text style={styles.dualCardValue}>{userSunSign} Burcu</Text>
              {isPremium && <Text style={styles.eliteMicroBadge}>Elite</Text>}
            </Pressable>
          </View>

          {/* Kozmik Bakım Rehberi Card */}
          {cosmicCare && (
            <View style={styles.careCard}>
              <View style={styles.almanacHeaderRow}>
                <Text style={styles.almanacTitle}>✨ Kozmik Bakım Rehberi</Text>
              </View>
              <Text style={styles.almanacSubtitle}>Güzellik ve Bakım Rutinleriniz İçin Kozmik Zamanlama</Text>
              
              <View style={styles.careItemsList}>
                {/* Saç Kesimi */}
                <Pressable style={styles.careClickableItem} onPress={() => openCareDetailModal('💇‍♀️ Saç Kesimi & Bakımı', cosmicCare.haircut.advice, cosmicCareProjections?.haircut)}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>💇‍♀️ Saç Kesimi & Bakımı</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < cosmicCare.haircut.stars ? "star" : "star-outline"} size={13} color={i < cosmicCare.haircut.stars ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} style={{ marginRight: 2 }} />
                      ))}
                      <Text style={styles.careLabelText}>{cosmicCare.haircut.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Detaylı görünüm için tıkla →</Text>
                </Pressable>

                {/* Epilasyon */}
                <Pressable style={styles.careClickableItem} onPress={() => openCareDetailModal('🪒 Epilasyon', cosmicCare.epilation.advice, cosmicCareProjections?.epilation)}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>🪒 Epilasyon (Tüy Alımı)</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < cosmicCare.epilation.stars ? "star" : "star-outline"} size={13} color={i < cosmicCare.epilation.stars ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} style={{ marginRight: 2 }} />
                      ))}
                      <Text style={styles.careLabelText}>{cosmicCare.epilation.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Detaylı görünüm için tıkla →</Text>
                </Pressable>

                {/* Cilt Bakımı */}
                <Pressable style={styles.careClickableItem} onPress={() => openCareDetailModal('🧴 Cilt Bakımı', cosmicCare.skincare.advice, cosmicCareProjections?.skincare)}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>🧴 Cilt Bakımı & Peeling</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < cosmicCare.skincare.stars ? "star" : "star-outline"} size={13} color={i < cosmicCare.skincare.stars ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} style={{ marginRight: 2 }} />
                      ))}
                      <Text style={styles.careLabelText}>{cosmicCare.skincare.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Detaylı görünüm için tıkla →</Text>
                </Pressable>

                {/* Tırnak Bakımı */}
                <Pressable style={styles.careClickableItem} onPress={() => openCareDetailModal('💅 Tırnak Bakımı', cosmicCare.nails.advice, cosmicCareProjections?.nails)}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>💅 Tırnak Bakımı</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < cosmicCare.nails.stars ? "star" : "star-outline"} size={13} color={i < cosmicCare.nails.stars ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} style={{ marginRight: 2 }} />
                      ))}
                      <Text style={styles.careLabelText}>{cosmicCare.nails.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Detaylı görünüm için tıkla →</Text>
                </Pressable>

                {/* Masaj */}
                <Pressable style={styles.careClickableItem} onPress={() => openCareDetailModal('💆‍♀️ Masaj & Rahatlama', cosmicCare.massage.advice, cosmicCareProjections?.massage)}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>💆‍♀️ Masaj & Rahatlama</Text>
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < cosmicCare.massage.stars ? "star" : "star-outline"} size={13} color={i < cosmicCare.massage.stars ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} style={{ marginRight: 2 }} />
                      ))}
                      <Text style={styles.careLabelText}>{cosmicCare.massage.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Detaylı görünüm için tıkla →</Text>
                </Pressable>

                {/* Zihinsel Gölgeler */}
                <Pressable style={styles.careClickableItem} onPress={() => openDetailModal('shadow')}>
                  <View style={styles.careItemHeader}>
                    <Text style={styles.careItemTitle}>🌓 Zihinsel Gölgeler & Ritüel</Text>
                    <View style={styles.starsContainer}>
                      {isPremium || hasUnlockedDailyShadow ? (
                        <Text style={styles.careLabelText}>Erişime Açık</Text>
                      ) : (
                        <>
                          <Ionicons name="lock-closed" size={13} color="#D4AF37" style={{ marginRight: 2 }} />
                          <Text style={styles.careLabelText}>Stellium Elite</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.viewDetailText}>Kozmik esma ve günlük gölge analizi için tıkla →</Text>
                </Pressable>

              </View>
            </View>
          )}

          {/* Elite Services Section */}
          <Text style={styles.sectionTitle}>Elite Kozmik Servisler</Text>
          <View style={styles.servicesGrid}>
            <Pressable style={styles.serviceCard} onPress={() => handlePremiumNavigation('/premium/transit')}>
              <View style={styles.serviceIconWrap}>
                <Text style={styles.serviceIcon}>🌌</Text>
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceCardTitle}>Transit Analizi</Text>
                  {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>Gökyüzünün güncel hareketlerinin haritanıza yansımaları.</Text>
              </View>
            </Pressable>

            <Pressable style={styles.serviceCard} onPress={() => handlePremiumNavigation('/premium/synastry')}>
              <View style={styles.serviceIconWrap}>
                <Text style={styles.serviceIcon}>💞</Text>
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceCardTitle}>Sinastri Analizi</Text>
                  {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>İki haritanın karşılaştırmalı ilişki uyum analizi.</Text>
              </View>
            </Pressable>

            <Pressable style={styles.serviceCard} onPress={() => handlePremiumNavigation('/premium/yildizname')}>
              <View style={styles.serviceIconWrap}>
                <Text style={styles.serviceIcon}>📜</Text>
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceCardTitle}>Yıldızname Raporu</Text>
                  {!isPremium && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <Text style={styles.serviceDescription} numberOfLines={2}>Ebced hesabı ve mizaç elementleriyle mistik rehber.</Text>
              </View>
            </Pressable>
          </View>

          {/* Gemini Daily Forecast Section */}
          <Text style={styles.sectionTitle}>Bugünün Kozmik Yorumları</Text>
          
          {loadingHoroscope ? (
            <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
          ) : horoscope ? (
            <View style={styles.horoscopeGrid}>
              <Pressable onPress={() => openDetailModal('general')}>
                <View style={styles.forecastCard}>
                  <Text style={styles.forecastHeader}>☀️ Bireysel Yolculuk</Text>
                  <Text style={styles.forecastText} numberOfLines={3}>{horoscope.general}</Text>
                  <Text style={styles.detailLink}>Detaylı Analiz için Dokunun →</Text>
                </View>
              </Pressable>

              <Pressable onPress={() => openDetailModal('love')}>
                <View style={styles.forecastCard}>
                  <Text style={styles.forecastHeader}>💞 Yansımalar & İlişki</Text>
                  <Text style={styles.forecastText} numberOfLines={3}>{horoscope.love}</Text>
                  <Text style={styles.detailLink}>Detaylı Analiz için Dokunun →</Text>
                </View>
              </Pressable>

              <Pressable onPress={() => openDetailModal('career')}>
                <View style={styles.forecastCard}>
                  <Text style={styles.forecastHeader}>💼 Kariyer & Bereket</Text>
                  <Text style={styles.forecastText} numberOfLines={3}>{horoscope.career}</Text>
                  <Text style={styles.detailLink}>Detaylı Analiz için Dokunun →</Text>
                </View>
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

      {/* Gezegen Saatleri Detay ve Bildirim Modalı */}
      <Modal
        visible={planetaryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPlanetaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.planetaryModalContainer}>
            <View style={styles.planetaryModalHeader}>
              <Text style={styles.planetaryModalTitle}>🪐 Gezegen Saatleri & Alarm</Text>
              <Pressable 
                onPress={() => setPlanetaryModalVisible(false)}
                style={styles.planetaryModalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#8B949E" />
              </Pressable>
            </View>

            {/* Mode selection tabs */}
            <View style={styles.planetaryModalTabs}>
              <View style={[styles.planetaryModalTab, { borderBottomColor: '#D4AF37' }]}>
                <Text style={[styles.planetaryModalTabText, { color: '#D4AF37' }]}>Saatlerin Anlamları & Projeksiyon</Text>
              </View>
            </View>

            {/* Horizontal Planet selector inside modal */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planetSelectorScroll}>
                {Object.keys(PLANETARY_HOURS_DEEP_INFO).map((planetKey) => {
                  const planet = PLANETARY_HOURS_DEEP_INFO[planetKey];
                  const isSelected = selectedPlanetForDetail === planetKey;
                  return (
                    <Pressable 
                      key={planetKey}
                      onPress={() => setSelectedPlanetForDetail(planetKey)}
                      style={[
                        styles.planetSelectorChip,
                        isSelected && { borderColor: planet.color, backgroundColor: 'rgba(255,255,255,0.06)' }
                      ]}
                    >
                      <Text style={styles.planetSelectorChipSymbol}>{planet.symbol}</Text>
                      <Text style={[styles.planetSelectorChipName, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {planet.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Content Area */}
            <ScrollView style={styles.planetaryModalScroll} showsVerticalScrollIndicator={false}>
              {(() => {
                const planet = PLANETARY_HOURS_DEEP_INFO[selectedPlanetForDetail] || PLANETARY_HOURS_DEEP_INFO.Sun;
                const isNotificationEnabled = notifPreferences[selectedPlanetForDetail] !== false;
                
                // Calculate today's time range(s) for the selected planet
                const matchingHours = planetaryHours.filter(h => h.planetName === planet.name);
                const timesString = matchingHours.map(h => h.label).join('  |  ');
                
                return (
                  <View style={styles.planetDetailContent}>
                    
                    {/* Time Range Card */}
                    <View style={styles.timeRangeCard}>
                      <Ionicons name="time-outline" size={18} color="#D4AF37" />
                      <Text style={styles.timeRangeCardText}>
                        ⏰ Bugünün Saatleri: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{timesString || 'Hesaplanıyor...'}</Text>
                      </Text>
                    </View>

                    {/* Notification Toggle Row for this specific planet */}
                    <View style={styles.planetNotifToggleRow}>
                      <View style={styles.planetNotifToggleTexts}>
                        <Text style={styles.planetNotifToggleTitle}>{planet.name} Saati Bildirimi</Text>
                        <Text style={styles.planetNotifToggleDesc}>Bu gezegen saati her başladığında bildirim al.</Text>
                      </View>
                      <Pressable 
                        onPress={() => togglePreference(selectedPlanetForDetail)}
                        style={styles.notifToggleSwitch}
                      >
                        <Ionicons 
                          name={isNotificationEnabled ? "toggle" : "toggle-outline"} 
                          size={36} 
                          color={isNotificationEnabled ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} 
                        />
                      </Pressable>
                    </View>

                    {/* Energy description */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>✨ Kozmik Enerji Karakteri</Text>
                      <Text style={styles.detailSectionText}>{planet.energy}</Text>
                    </View>

                    {/* Recommended Activities */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>✅ Değerlendirilmesi Önerilen Konular</Text>
                      {planet.activities.map((act, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.bulletText}>{act}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Things to Avoid */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>⚠️ Kaçınılması Önerilen Durumlar</Text>
                      {planet.avoid.map((av, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.bulletText}>{av}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Spiritual depth */}
                    <View style={[styles.detailSection, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={styles.detailSectionTitle}>🧘 Manevi & Ezoterik Boyut</Text>
                      <Text style={styles.detailSectionText}>{planet.spiritual}</Text>
                    </View>

                  </View>
                );
              })()}
            </ScrollView>

            {/* Global Notifications Checklist Panel */}
            <View style={styles.globalNotificationsPanel}>
              <Text style={styles.globalNotifTitle}>🔔 Gezegen Saatleri Bildirim Listesi (Aç/Kapat)</Text>
              <View style={styles.globalNotifChecklist}>
                {Object.keys(PLANETARY_HOURS_DEEP_INFO).map((planetKey) => {
                  const planet = PLANETARY_HOURS_DEEP_INFO[planetKey];
                  const isEnabled = notifPreferences[planetKey] !== false;
                  const planetNameTR = planetKey === 'Sun' ? 'Güneş' :
                                       planetKey === 'Moon' ? 'Ay' :
                                       planetKey === 'Mercury' ? 'Merkür' :
                                       planetKey === 'Venus' ? 'Venüs' :
                                       planetKey === 'Mars' ? 'Mars' :
                                       planetKey === 'Jupiter' ? 'Jüpiter' :
                                       planetKey === 'Saturn' ? 'Satürn' : planet.name;
                  return (
                    <Pressable 
                      key={planetKey} 
                      onPress={() => togglePreference(planetKey)}
                      style={[
                        styles.globalNotifBadge,
                        isEnabled && { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' }
                      ]}
                    >
                      <Text style={[styles.globalNotifBadgeSymbol, { color: isEnabled ? '#D4AF37' : '#FFFFFF' }]}>
                        {planet.symbol}
                      </Text>
                      <Text style={[styles.globalNotifBadgeName, { color: isEnabled ? '#D4AF37' : '#8B949E' }]} numberOfLines={1}>
                        {planetNameTR}
                      </Text>
                      <Ionicons 
                        name={isEnabled ? "checkmark-circle" : "ellipse-outline"} 
                        size={11} 
                        color={isEnabled ? "#D4AF37" : "rgba(255, 255, 255, 0.2)"} 
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

          </View>
        </View>
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
    backgroundColor: '#0B0F19',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },

  // Header
  header: {
    marginBottom: 20,
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
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
  },

  // Section Labels & Titles
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // Planetary Hours
  planetarySection: {
    marginBottom: 20,
  },
  hourChip: {
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    backgroundColor: '#161B22',
    alignItems: 'center',
  },
  hourChipActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  hourChipSymbol: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  hourChipName: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#F0F6FC',
  },
  hourChipTime: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#8B949E',
    marginTop: 2,
  },
  activeHourBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  activeHourSymbol: {
    fontSize: 18,
    color: '#FCD34D',
    marginRight: 8,
  },
  activeHourText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#F0F6FC',
  },
  activeHourDot: {
    fontSize: 12,
    color: '#8B949E',
    marginHorizontal: 6,
  },
  activeHourMeaning: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#8B949E',
    flex: 1,
  },

  // Dual Card Row (Moon + Sign)
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dualCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  dualCardEmoji: {
    fontSize: 36,
    marginBottom: 8,
    color: '#D4AF37',
  },
  dualCardLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dualCardValue: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
  },
  dualCardSub: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 4,
  },
  eliteMicroBadge: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },

  // Services Grid (icon-based)
  servicesGrid: {
    gap: 10,
    marginBottom: 24,
  },
  serviceCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceIcon: {
    fontSize: 22,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  serviceCardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '700',
    flex: 1,
  },
  lockIcon: {
    fontSize: 13,
    color: '#8B949E',
    marginLeft: 6,
  },
  serviceDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 16,
  },

  // Forecast Cards
  horoscopeGrid: {
    gap: 12,
    marginBottom: 10,
  },
  forecastCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 14,
    padding: 16,
  },
  forecastHeader: {
    fontFamily: 'Cinzel',
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 6,
  },
  forecastText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    lineHeight: 19,
  },
  detailLink: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 10,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Utility
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: '#FF7B72',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
  careClickableItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewDetailText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.8)',
    marginTop: 8,
    textAlign: 'right',
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
  careCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  expandCardBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expandCardBtnText: {
    fontFamily: 'InterBold',
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '700',
  },
  careItemsList: {
    gap: 16,
  },
  careItemRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.05)',
    paddingBottom: 12,
  },
  careItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  careItemTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careLabelText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  careAdviceText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#F0F6FC',
    lineHeight: 18,
  },
  projectionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectionsTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  projectionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  projectionBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  projectionBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '500',
  },
  planetaryModalContainer: {
    backgroundColor: '#0F1420',
    width: '100%',
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 36 : 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  timeRangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  timeRangeCardText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  planetaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planetaryModalTitle: {
    fontFamily: 'Cinzel',
    fontSize: 17,
    color: '#D4AF37',
    fontWeight: '700',
  },
  planetaryModalCloseBtn: {
    padding: 4,
  },
  planetaryModalTabs: {
    flexDirection: 'row',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  planetaryModalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  planetaryModalTabText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
  },
  planetSelectorScroll: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 14,
  },
  planetSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 6,
  },
  planetSelectorChipSymbol: {
    fontSize: 14,
  },
  planetSelectorChipName: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  planetaryModalScroll: {
    flex: 1,
    marginBottom: 16,
  },
  planetDetailContent: {
    gap: 16,
  },
  planetNotifToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  planetNotifToggleTexts: {
    flex: 1,
    marginRight: 10,
  },
  planetNotifToggleTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F6FC',
  },
  planetNotifToggleDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 2,
  },
  notifToggleSwitch: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 14,
  },
  detailSectionTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSectionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#D4AF37',
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    lineHeight: 18,
  },
  globalNotificationsPanel: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalNotifTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  globalNotifChecklist: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  globalNotifBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    width: 44,
    gap: 3,
  },
  globalNotifBadgeSymbol: {
    fontSize: 14,
    textAlign: 'center',
  },
  globalNotifBadgeName: {
    fontFamily: 'Inter',
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});
