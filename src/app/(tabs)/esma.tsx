import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Keyboard, Vibration, Pressable } from 'react-native';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';
import GlassCard from '@/components/glass/GlassCard';
import { computePersonalEbced } from '@/utils/ebced';

export default function EsmaScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [zikirCount, setZikirCount] = useState(0);
  const [targetEsma, setTargetEsma] = useState<any>(null);

  const handleCalculate = () => {
    if (!inputText.trim()) return;
    
    Keyboard.dismiss();
    setLoading(true);

    try {
      const computed = computePersonalEbced(inputText);
      setResult(computed);
      setZikirCount(0);
      setTargetEsma(computed.primaryEsma);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Ebced & Esma Saatleri</Text>
          <Text style={styles.subtitle}>İsimlerin Sayısal Resonansı ve Zikir Saatleri</Text>
        </View>

        {/* Input Card */}
        <GlassCard style={styles.inputCard}>
          <CosmicInput
            label="Analiz Edilecek İsim veya Kelime"
            placeholder="İsminizi yazın (Ör. Ahmet, Can...)"
            value={inputText}
            onChangeText={setInputText}
          />
          <CosmicButton
            title={loading ? 'Hesaplanıyor...' : 'Ebced Hesapla'}
            onPress={handleCalculate}
            disabled={loading}
          />
        </GlassCard>

        {/* Results Section */}
        {result ? (
          <View style={styles.resultsContainer}>
            
            {/* Ebced Value & Numerology Card */}
            <GlassCard style={styles.numericCard}>
              <View style={styles.numericValueRow}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueTitle}>Ebced Değeri</Text>
                  <Text style={styles.valueText}>{result.ebced}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.valueItem}>
                  <Text style={styles.valueTitle}>Sayısal Sadeleşme</Text>
                  <Text style={styles.valueText}>{result.reduction}</Text>
                </View>
              </View>

              <Text style={styles.archetypeTitle}>Sayısal Arketip Analizi</Text>
              <Text style={styles.archetypePlanet}>{result.archetype.planet}</Text>
              <Text style={styles.archetypeInfo}>
                <Text style={styles.boldText}>Element: </Text>{result.archetype.element}
              </Text>
              <Text style={styles.archetypeInfo}>
                <Text style={styles.boldText}>Karakteristik: </Text>{result.archetype.trait}
              </Text>
            </GlassCard>

            {/* Primary Esma Card */}
            <Text style={styles.sectionTitle}>Uyumlu Zikir Rezonansı</Text>
            <GlassCard style={styles.primaryEsmaCard}>
              <View style={styles.esmaTitleRow}>
                <Text style={styles.esmaName}>{result.primaryEsma.name}</Text>
                <Text style={styles.esmaArabic}>{result.primaryEsma.arabic}</Text>
              </View>
              
              <Text style={styles.esmaMeaning}>{result.primaryEsma.meaning}</Text>

              <View style={styles.esmaDetailsGrid}>
                <View style={styles.esmaDetailItem}>
                  <Text style={styles.esmaDetailTitle}>Okuma Adedi</Text>
                  <Text style={styles.esmaDetailText}>{result.primaryEsma.ebced}</Text>
                </View>
                <View style={styles.esmaDetailItem}>
                  <Text style={styles.esmaDetailTitle}>Günü</Text>
                  <Text style={styles.esmaDetailText}>{result.primaryEsma.day}</Text>
                </View>
                <View style={styles.esmaDetailItem}>
                  <Text style={styles.esmaDetailTitle}>Kozmik Saat</Text>
                  <Text style={styles.esmaDetailText}>{result.primaryEsma.planet}</Text>
                </View>
              </View>
              <Text style={styles.esmaHourDescription}>{result.primaryEsma.hour} saatlerinde okunması geleneksel olarak tavsiye edilir.</Text>
              
              {targetEsma?.name !== result.primaryEsma.name && (
                <Pressable 
                  onPress={() => {
                    setTargetEsma(result.primaryEsma);
                    setZikirCount(0);
                  }}
                  className="mt-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 active:bg-amber-400/20 items-center"
                >
                  <Text className="text-amber-300 text-xs font-bold font-sans">Bu Esmayı Zikirmatik İçin Seç</Text>
                </Pressable>
              )}
            </GlassCard>

            {/* Kozmik Zikirmatik Panel */}
            <GlassCard className="mt-4 p-5 rounded-3xl border border-white/10 bg-white/5 items-center">
              <Text className="text-white font-bold text-base font-sans mb-3">🔮 Kozmik Zikirmatik</Text>
              
              <Text className="text-white/60 text-xs font-semibold font-sans mb-4 text-center">
                Seçili Esma: <Text className="text-amber-300 font-bold">{targetEsma?.name || 'Seçilmedi'}</Text> (Hedef: {targetEsma?.ebced || 0})
              </Text>

              {/* Glowing Circle Button */}
              <Pressable
                onPress={() => {
                  Vibration.vibrate(45);
                  setZikirCount(prev => prev + 1);
                }}
                className="w-32 h-32 rounded-full border-4 border-amber-400/40 bg-amber-400/5 items-center justify-center shadow-lg shadow-amber-400/20 active:bg-amber-400/10 mb-4"
              >
                <Text className="text-white text-3xl font-extrabold font-sans">{zikirCount}</Text>
                <Text className="text-white/40 text-[9px] uppercase font-bold tracking-wider mt-1">Dokun</Text>
              </Pressable>

              {/* Progress and resets */}
              <View className="w-full px-4 flex-row justify-between items-center mt-2">
                <Pressable 
                  onPress={() => setZikirCount(0)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/10"
                >
                  <Text className="text-white/70 text-xs font-bold font-sans">Sıfırla</Text>
                </Pressable>

                <Text className="text-amber-300 text-xs font-bold font-sans">
                  Tamamlanan: %{targetEsma?.ebced ? Math.min(100, Math.round((zikirCount / targetEsma.ebced) * 100)) : 0}
                </Text>
              </View>

              {targetEsma?.ebced && zikirCount >= targetEsma.ebced && (
                <View className="mt-4 bg-emerald-400/10 border border-emerald-400/30 px-4 py-2.5 rounded-2xl w-full items-center">
                  <Text className="text-emerald-300 text-xs font-bold font-sans">✨ Zikir Tamamlandı! Ağzınıza Sağlık.</Text>
                </View>
              )}
            </GlassCard>

            {/* Alternative Esma List */}
            <Text style={styles.sectionSubTitle}>Resone Olan Diğer Esma Eşleşmeleri</Text>
            <View style={styles.alternativesList}>
              {result.alternativeEsmas.map((esma: any, idx: number) => (
                <GlassCard key={idx} style={styles.alternativeCard}>
                  <View style={styles.alternativeHeaderRow}>
                    <Text style={styles.alternativeName}>{esma.name}</Text>
                    <Text style={styles.alternativeArabic}>{esma.arabic}</Text>
                  </View>
                  <Text style={styles.alternativeMeaning}>{esma.meaning}</Text>
                  <View style={styles.alternativeDetails}>
                    <Text style={styles.alternativeDetailText}>Adet: {esma.ebced} | Gün: {esma.day}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>

          </View>
        ) : null}
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
    textAlign: 'center',
  },
  inputCard: {
    marginBottom: 24,
  },
  resultsContainer: {
    gap: 20,
  },
  numericCard: {
    padding: 20,
  },
  numericValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  valueItem: {
    alignItems: 'center',
  },
  valueTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  valueText: {
    fontFamily: 'Cinzel',
    fontSize: 28,
    color: '#D4AF37',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  archetypeTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 6,
  },
  archetypePlanet: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 8,
  },
  archetypeInfo: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 6,
    lineHeight: 20,
  },
  boldText: {
    color: '#F0F6FC',
    fontWeight: '600',
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginTop: 8,
  },
  sectionSubTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#F0F6FC',
    fontWeight: '600',
    marginTop: 8,
  },
  primaryEsmaCard: {
    padding: 20,
    borderColor: '#D4AF37', // Highlight primary Esma with a solid gold border
  },
  esmaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  esmaName: {
    fontFamily: 'Cinzel',
    fontSize: 22,
    color: '#D4AF37',
    fontWeight: '700',
  },
  esmaArabic: {
    fontSize: 24,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  esmaMeaning: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
  },
  esmaDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(22, 27, 34, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  esmaDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  esmaDetailTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginBottom: 4,
  },
  esmaDetailText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '700',
  },
  esmaHourDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  alternativesList: {
    gap: 12,
  },
  alternativeCard: {
    padding: 16,
  },
  alternativeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '700',
  },
  alternativeArabic: {
    fontSize: 18,
    color: '#F0F6FC',
  },
  alternativeMeaning: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
    marginBottom: 8,
  },
  alternativeDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.08)',
    paddingTop: 6,
  },
  alternativeDetailText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#D4AF37',
  },
});
