import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { getJulianDaysSinceJ2000, getPlanetLongitude, getZodiacSign } from '@/utils/astronomy';
import { fetchTransitAnalysis } from '@/api/gemini';
import GlassCard from '@/components/glass/GlassCard';

const PLANET_TR: Record<string, string> = {
  Sun: 'Güneş',
  Moon: 'Ay',
  Mercury: 'Merkür',
  Venus: 'Venüs',
  Mars: 'Mars',
  Jupiter: 'Jüpiter',
  Saturn: 'Satürn',
  Uranus: 'Uranüs',
  Neptune: 'Neptün',
  Pluto: 'Plüton'
};

interface Aspect {
  natalPlanet: string;
  transitPlanet: string;
  aspectName: string;
  symbol: string;
  exactDiff: string;
}

function getTransitAspectDescription(transitPlanet: string, natalPlanet: string, aspectName: string): string {
  const p1 = transitPlanet;
  const p2 = natalPlanet;
  
  if (aspectName === 'Kavuşum') {
    return `Bu kavuşum enerjileri birleştirir. Transit ${p1} ve Natal ${p2} odak alanlarınızda yeni bir döngü başlatıyor. Güçlü bir odaklanma ve harekete geçme isteği getirir.`;
  }
  if (aspectName === 'Kare') {
    return `Bu kare açı içsel veya dışsal bir çatışma yaratır. Transit ${p1} ve Natal ${p2} konularında engeller, gecikmeler veya harekete geçmeye zorlayan baskılar yaşayabilirsiniz. Sabır ve disiplin gerektirir.`;
  }
  if (aspectName === 'Karşıt') {
    return `Bu karşıt açı kutuplaşma ve denge sınavı getirir. Transit ${p1} ile Natal ${p2} arasında bir gerilim veya ilişkiler yoluyla yansıyan farkındalıklar yaşayabilirsiniz. Orta yolu bulmalısınız.`;
  }
  if (aspectName === 'Üçgen') {
    return `Bu üçgen açı son derece destekleyici ve akıcı bir enerjidir. Transit ${p1} ile Natal ${p2} konularında şans kapılarını aralar, yeteneklerinizi sergilemenizi kolaylaştırır. Uyum ve genişleme getirir.`;
  }
  if (aspectName === 'Sekstil') {
    return `Bu sekstil açı fırsatlar ve uyumlu olanaklar sunar. Kendinizi göstermeniz için Transit ${p1} ve Natal ${p2} alanlarında yeni imkanlar doğabilir. Çaba gösterildiğinde kalıcı kazançlar getirir.`;
  }
  return 'Gökyüzü transitleri hayatınızdaki bu iki konunun bir araya gelerek farkındalık oluşturmasını sağlıyor.';
}

export default function TransitScreen() {
  const { profile } = useAuthStore();
  const { computedChart } = useAppStore();
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 1. Calculate transit planets for "now"
  const transitPlanets = useMemo(() => {
    const today = new Date();
    const jd = getJulianDaysSinceJ2000(today);
    const planetsList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    
    return planetsList.map((name) => {
      const lon = getPlanetLongitude(name, jd);
      const sign = getZodiacSign(lon);
      return {
        name,
        longitude: lon,
        sign: sign.turkish
      };
    });
  }, []);

  // 2. Compute aspects between transit and natal planets
  const activeAspects = useMemo(() => {
    if (!computedChart) return [];
    
    const aspectsList: Aspect[] = [];
    const aspectTypes = [
      { name: 'Kavuşum', angle: 0, symbol: '☌' },
      { name: 'Sekstil', angle: 60, symbol: '⚹' },
      { name: 'Kare', angle: 90, symbol: '□' },
      { name: 'Üçgen', angle: 120, symbol: '△' },
      { name: 'Karşıt', angle: 180, symbol: '☍' }
    ];
    const ORB = 6; // max 6 degrees orb

    for (const np of computedChart.planets) {
      for (const tp of transitPlanets) {
        let diff = Math.abs(np.longitude - tp.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const asp of aspectTypes) {
          if (Math.abs(diff - asp.angle) <= ORB) {
            aspectsList.push({
              natalPlanet: np.name === 'Sun' ? 'Güneş' :
                           np.name === 'Moon' ? 'Ay' :
                           np.name === 'Mercury' ? 'Merkür' :
                           np.name === 'Venus' ? 'Venüs' :
                           np.name === 'Mars' ? 'Mars' :
                           np.name === 'Jupiter' ? 'Jüpiter' :
                           np.name === 'Saturn' ? 'Satürn' :
                           np.name === 'Uranus' ? 'Uranüs' :
                           np.name === 'Neptune' ? 'Neptün' :
                           np.name === 'Pluto' ? 'Plüton' : np.name,
              transitPlanet: PLANET_TR[tp.name] || tp.name,
              aspectName: asp.name,
              symbol: asp.symbol,
              exactDiff: Math.abs(diff - asp.angle).toFixed(1)
            });
          }
        }
      }
    }
    return aspectsList;
  }, [computedChart, transitPlanets]);

  // 3. Fetch transit analysis from Gemini
  useEffect(() => {
    if (!profile || !computedChart) return;

    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const sun = computedChart.planets.find(p => p.name === 'Sun');
        const sunSign = sun ? sun.sign : 'Koç';

        const data = await fetchTransitAnalysis(
          profile.name || 'Kozmik Ruh',
          sunSign,
          computedChart.planets,
          computedChart.houses
        );
        setReport(data);
      } catch (err) {
        console.warn('Error loading transit report:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [profile, computedChart]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Gökyüzü transitleri hesaplanıyor...</Text>
        <Text style={styles.loadingSubtext}>Derin astrolojik rehberiniz kaleme alınıyor.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Transit explanation header */}
        <GlassCard style={styles.introCard}>
          <Text style={styles.introTitle}>Kozmik Akış</Text>
          <Text style={styles.introDesc}>
            Transit analiz, şu an gökyüzünde hareket eden gezegenlerin doğum anınızdaki gezegenlerle kurduğu açısal diyalogları inceler. Kendi bireyselleşme yolculuğunuzdaki güncel döngüleri fark etmenizi kolaylaştırır.
          </Text>
        </GlassCard>

        {/* Gemini Report Section (Moved to the Top) */}
        <Text style={styles.sectionTitle}>Derin Kozmik Transit Yorumu</Text>
        <GlassCard style={styles.reportCard}>
          <Text style={styles.reportTitle}>Rehberlik Raporu</Text>
          <Text style={styles.reportText}>{report}</Text>
        </GlassCard>

        {/* Aspects Section */}
        <Text style={styles.sectionTitle}>Göksel Açısal Diyaloglar</Text>
        <View style={styles.aspectsContainer}>
          {activeAspects.length > 0 ? (
            activeAspects.map((aspect, i) => (
              <GlassCard key={i} style={styles.aspectCard}>
                <View style={styles.aspectRow}>
                  <Text style={styles.aspectSymbol}>{aspect.symbol}</Text>
                  <View style={styles.aspectTextContainer}>
                    <Text style={styles.aspectBody}>
                      Transit <Text style={styles.highlightText}>{aspect.transitPlanet}</Text> ile Natal <Text style={styles.highlightText}>{aspect.natalPlanet}</Text> arasında
                    </Text>
                    <Text style={styles.aspectType}>
                      {aspect.aspectName} Açısı (Orb: {aspect.exactDiff}°)
                    </Text>
                    <Text style={styles.aspectDescText}>
                      {getTransitAspectDescription(aspect.transitPlanet, aspect.natalPlanet, aspect.aspectName)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ))
          ) : (
            <GlassCard style={styles.aspectCard}>
              <Text style={styles.noAspectText}>Şu an belirgin bir majör transit açısı bulunmuyor.</Text>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontFamily: 'Cinzel',
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  introCard: {
    marginBottom: 24,
    padding: 16,
  },
  introTitle: {
    fontFamily: 'Cinzel',
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  introDesc: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  aspectsContainer: {
    gap: 10,
    marginBottom: 28,
  },
  aspectCard: {
    padding: 12,
  },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aspectSymbol: {
    fontSize: 28,
    color: '#D4AF37',
    marginRight: 14,
    width: 32,
    textAlign: 'center',
  },
  aspectTextContainer: {
    flex: 1,
  },
  aspectBody: {
    fontFamily: 'Inter',
    color: '#F0F6FC',
    fontSize: 14,
  },
  highlightText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  aspectType: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
  },
  aspectDescText: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  noAspectText: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  reportCard: {
    padding: 20,
  },
  reportTitle: {
    fontFamily: 'Cinzel',
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 6,
  },
  reportText: {
    fontFamily: 'Inter',
    color: '#E6EDF0',
    fontSize: 15,
    lineHeight: 24,
  },
});
