import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { calculateEbced } from '@/utils/ebced';
import { fetchYildiznameAnalysis } from '@/api/gemini';
import GlassCard from '@/components/glass/GlassCard';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';

// Traditional Eastern/Arabic Zodiac Signs mapping for Yıldızname
const YILDIZNAME_SIGNS = [
  { name: 'Hamal (Koç)', element: 'Ateş', planet: 'Merih (Mars)', color: 'Kırmızı', day: 'Salı', meaning: 'Liderlik gücü, yüksek cesaret ve sabırsızlık.' },
  { name: 'Sevr (Boğa)', element: 'Toprak', planet: 'Zühre (Venüs)', color: 'Yeşil', day: 'Cuma', meaning: 'Güven arayışı, sanatsal yatkınlık ve sadakat.' },
  { name: 'Cevza (İkizler)', element: 'Hava', planet: 'Utarit (Merkür)', color: 'Mavi', day: 'Çarşamba', meaning: 'Zeka kıvraklığı, çift karakterlilik ve merak.' },
  { name: 'Seretan (Yengeç)', element: 'Su', planet: 'Kamer (Ay)', color: 'Beyaz', day: 'Pazartesi', meaning: 'Derin sezgisellik, aile bağları ve hassasiyet.' },
  { name: 'Esed (Aslan)', element: 'Ateş', planet: 'Güneş', color: 'Sarı / Altın', day: 'Pazar', meaning: 'Yaratıcılık, cömertlik ve merkezde olma dürtüsü.' },
  { name: 'Sümbüle (Başak)', element: 'Toprak', planet: 'Utarit (Merkür)', color: 'Gri', day: 'Çarşamba', meaning: 'Analitik zeka, titizlik ve hizmet etme sevgisi.' },
  { name: 'Mizan (Terazi)', element: 'Hava', planet: 'Zühre (Venüs)', color: 'Turkuaz', day: 'Cuma', meaning: 'Uyum ve denge arayışı, adalet duygusu ve estetik.' },
  { name: 'Akrep (Akrep)', element: 'Su', planet: 'Merih (Mars)', color: 'Koyu Kırmızı', day: 'Salı', meaning: 'Dönüştürücü güç, tutku ve gizemli olaylara ilgi.' },
  { name: 'Kavs (Yay)', element: 'Ateş', planet: 'Müşteri (Jüpiter)', color: 'Mor', day: 'Perşembe', meaning: 'Bilgelik arayışı, özgürlük aşkı ve neşeli mizaç.' },
  { name: 'Cedi (Oğlak)', element: 'Toprak', planet: 'Zühal (Satürn)', color: 'Siyah', day: 'Cumartesi', meaning: 'Disiplin, sorumluluk duygusu ve kariyer hedefleri.' },
  { name: 'Delv (Kova)', element: 'Hava', planet: 'Zühal (Satürn)', color: 'Lacivert', day: 'Cumartesi', meaning: 'Özgünlük, hümanist bakış açısı ve zihinsel bağımsızlık.' },
  { name: 'Hut (Balık)', element: 'Su', planet: 'Müşteri (Jüpiter)', color: 'Deniz Yeşili', day: 'Perşembe', meaning: 'Manevi derinlik, fedakarlık ve üstün hayal gücü.' }
];

export default function YildiznameScreen() {
  const { profile } = useAuthStore();

  // Input states
  const [userName, setUserName] = useState(profile?.name || '');
  const [motherName, setMotherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  // Computed states
  const [userEbced, setUserEbced] = useState(0);
  const [motherEbced, setMotherEbced] = useState(0);
  const [totalEbced, setTotalEbced] = useState(0);
  const [computedSign, setComputedSign] = useState<typeof YILDIZNAME_SIGNS[0] | null>(null);
  const [analysisReport, setAnalysisReport] = useState('');

  const handleCalculate = async () => {
    if (!userName.trim()) return Alert.alert('Hata', 'Lütfen adınızı girin.');
    if (!motherName.trim()) return Alert.alert('Hata', 'Lütfen annenizin adını girin.');

    setLoading(true);
    try {
      // Calculate Ebced values
      const pEbced = calculateEbced(userName);
      const mEbced = calculateEbced(motherName);
      const sum = pEbced + mEbced;

      // Traditional remainder calculation
      let remainder = sum % 12;
      if (remainder === 0) remainder = 12;

      const signIndex = remainder - 1;
      const sign = YILDIZNAME_SIGNS[signIndex];

      setUserEbced(pEbced);
      setMotherEbced(mEbced);
      setTotalEbced(sum);
      setComputedSign(sign);

      // Fetch deep AI report
      const analysis = await fetchYildiznameAnalysis(
        userName,
        motherName,
        sum,
        sign.name,
        sign.element
      );

      setAnalysisReport(analysis);
      setIsCalculated(true);
    } catch (e) {
      console.warn(e);
      Alert.alert('Hata', 'Yıldızname raporu oluşturulurken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMotherName('');
    setIsCalculated(false);
    setAnalysisReport('');
    setComputedSign(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Yıldızname Hesaplanıyor...</Text>
        <Text style={styles.loadingSubtext}>Ebced hesabı yapılıyor ve göksel rehberiniz yazılıyor.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={true}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={false}
        >

          {!isCalculated ? (
            <GlassCard style={styles.card}>
              <Text style={styles.cardDesc}>
                {"Yıldızname, geleneksel Doğu mistisizminde kişinin ismi ve anne ismi Ebced değerlerinin toplanıp 12'ye bölünmesiyle elde edilen mizaç tayin ve manevi koruma rehberidir."}
              </Text>

              <CosmicInput
                label="Adınız"
                placeholder="Adınızı girin"
                value={userName}
                onChangeText={setUserName}
              />

              <CosmicInput
                label="Anne Adı (Anne İsmi)"
                placeholder="Annenizin adını girin"
                value={motherName}
                onChangeText={setMotherName}
              />

              <CosmicButton
                title="Yıldızname Raporunu Hesapla"
                onPress={handleCalculate}
                style={styles.calcButton}
              />
            </GlassCard>
          ) : (
            <View style={styles.resultsContainer}>
              {/* Star Sign Card */}
              <GlassCard style={styles.signCard}>
                <Text style={styles.signLabel}>Hesaplanan Yıldız Burcu</Text>
                <Text style={styles.signName}>{computedSign?.name}</Text>
                <Text style={styles.signDesc}>{computedSign?.meaning}</Text>
              </GlassCard>

              {/* Ebced Details Grid */}
              <GlassCard style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Ebced Ayrıntıları</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kendi İsminizin Ebcedi:</Text>
                  <Text style={styles.detailVal}>{userEbced}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Anne İsminin Ebcedi:</Text>
                  <Text style={styles.detailVal}>{motherEbced}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Toplam Ebced Değeri:</Text>
                  <Text style={[styles.detailVal, styles.goldText]}>{totalEbced}</Text>
                </View>
              </GlassCard>

              {/* Planetary Rulers Card */}
              <GlassCard style={styles.rulersCard}>
                <Text style={styles.sectionTitle}>Mistik Parametreler</Text>
                
                <View style={styles.rulerRow}>
                  <View style={styles.rulerCol}>
                    <Text style={styles.rulerLabel}>Element</Text>
                    <Text style={styles.rulerVal}>{computedSign?.element}</Text>
                  </View>
                  <View style={styles.rulerCol}>
                    <Text style={styles.rulerLabel}>Yönetici Yıldız</Text>
                    <Text style={styles.rulerVal}>{computedSign?.planet}</Text>
                  </View>
                </View>

                <View style={styles.rulerRow}>
                  <View style={styles.rulerCol}>
                    <Text style={styles.rulerLabel}>Haftalık Gün</Text>
                    <Text style={styles.rulerVal}>{computedSign?.day}</Text>
                  </View>
                  <View style={styles.rulerCol}>
                    <Text style={styles.rulerLabel}>Uğurlu Renk</Text>
                    <Text style={styles.rulerVal}>{computedSign?.color}</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Gemini Report */}
              <Text style={styles.aspectsTitle}>Manevi Yıldızname Rehberliği</Text>
              <GlassCard style={styles.reportCard}>
                <Text style={styles.reportText}>{analysisReport}</Text>
              </GlassCard>

              <CosmicButton
                title="Yeni Bir Yıldızname Sorgula"
                onPress={handleReset}
                variant="outline"
                style={styles.resetButton}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
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
  card: {
    width: '100%',
    padding: 20,
  },
  cardDesc: {
    fontFamily: 'Inter',
    color: '#8B949E',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  calcButton: {
    marginTop: 12,
  },
  resultsContainer: {
    gap: 24,
  },
  signCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  signLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signName: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
    marginVertical: 10,
  },
  signDesc: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  detailsCard: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  detailVal: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  goldText: {
    color: '#D4AF37',
  },
  rulersCard: {
    padding: 20,
  },
  rulerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rulerCol: {
    width: '46%',
  },
  rulerLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rulerVal: {
    fontFamily: 'Cinzel',
    fontSize: 15,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  aspectsTitle: {
    fontFamily: 'Cinzel',
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  reportCard: {
    padding: 20,
  },
  reportText: {
    fontFamily: 'Inter',
    color: '#E6EDF0',
    fontSize: 15,
    lineHeight: 24,
  },
  resetButton: {
    marginTop: 10,
  },
});
