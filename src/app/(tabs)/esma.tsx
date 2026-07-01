import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Keyboard, Vibration, Pressable } from 'react-native';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';
import GlassCard from '@/components/glass/GlassCard';
import { computePersonalEbced } from '@/utils/ebced';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

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

  // Reanimated shared values for background aura colors
  const breatheScale1 = useSharedValue(1);
  const breatheOpacity1 = useSharedValue(0.12);
  const breatheScale2 = useSharedValue(1);
  const breatheOpacity2 = useSharedValue(0.08);

  useEffect(() => {
    breatheScale1.value = withRepeat(
      withTiming(1.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    breatheOpacity1.value = withRepeat(
      withTiming(0.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    breatheScale2.value = withRepeat(
      withTiming(1.3, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    breatheOpacity2.value = withRepeat(
      withTiming(0.16, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedAuraStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale1.value }],
      opacity: breatheOpacity1.value,
    };
  });

  const animatedAuraStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale2.value }],
      opacity: breatheOpacity2.value,
    };
  });

  return (
    <View style={styles.mainWrapper}>
      {/* Dynamic Auric Gradient Background */}
      <Animated.View 
        style={[
          styles.auricBackground,
          {
            backgroundColor: '#B2F7EF',
            top: -150,
            right: -150,
            width: 400,
            height: 400,
            borderRadius: 200,
          },
          animatedAuraStyle1
        ]}
      />
      <Animated.View 
        style={[
          styles.auricBackground,
          {
            backgroundColor: '#EFF7F6',
            bottom: -100,
            left: -100,
            width: 360,
            height: 360,
            borderRadius: 180,
          },
          animatedAuraStyle2
        ]}
      />
      
      {/* BlurView to make the aura soft and ethereal */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Ebced & Esma Saatleri</Text>
          <Text style={styles.subtitle}>İsimlerin Sayısal Rezonansı ve Zikir Saatleri</Text>
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
                  style={styles.selectEsmaBtn}
                >
                  <Text style={styles.selectEsmaBtnText}>Bu Esmayı Zikirmatik İçin Seç</Text>
                </Pressable>
              )}
            </GlassCard>

            {/* Kozmik Zikirmatik Panel */}
            <View style={styles.zikirmatikCard}>
              <Text style={styles.zikirmatikHeader}>🔮 Kozmik Zikirmatik</Text>
              
              <Text style={styles.zikirmatikSub}>
                Seçili Esma: <Text style={{ color: '#D4AF37', fontWeight: '700' }}>{targetEsma?.name || 'Seçilmedi'}</Text> (Hedef: {targetEsma?.ebced || 0})
              </Text>

              {/* Tap Box */}
              <Pressable
                onPress={() => {
                  setZikirCount(prev => prev + 1);
                }}
                style={({ pressed }) => [
                  styles.tapBox,
                  pressed && { backgroundColor: 'rgba(212, 175, 55, 0.16)' }
                ]}
              >
                <Text style={styles.tapBoxCount}>{zikirCount}</Text>
                <Text style={styles.tapBoxTapText}>ARTIRMAK İÇİN DOKUNUN</Text>
              </Pressable>

              {/* Progress and resets */}
              <View style={styles.resetRow}>
                <Pressable 
                  onPress={() => setZikirCount(0)}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    pressed && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}
                >
                  <Text style={styles.resetBtnText}>Sıfırla</Text>
                </Pressable>

                <Text style={styles.progressPercentText}>
                  Tamamlanan: %{targetEsma?.ebced ? Math.min(100, Math.round((zikirCount / targetEsma.ebced) * 100)) : 0}
                </Text>
              </View>

              {targetEsma?.ebced && zikirCount >= targetEsma.ebced && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✨ Zikir Tamamlandı! Ağzınıza Sağlık.</Text>
                </View>
              )}
            </View>

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
  </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  auricBackground: {
    position: 'absolute',
    opacity: 0.12,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 6,
  },
  archetypePlanet: {
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginTop: 8,
  },
  sectionSubTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#F0F6FC',
    fontWeight: '600',
    marginTop: 8,
  },
  primaryEsmaCard: {
    padding: 20,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  esmaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  esmaName: {
    fontFamily: 'Inter',
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
    backgroundColor: '#161B22',
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
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
  selectEsmaBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  selectEsmaBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },

  // Zikirmatik Card
  zikirmatikCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  zikirmatikHeader: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#F0F6FC',
    fontWeight: '700',
    marginBottom: 12,
  },
  zikirmatikSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tapBox: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  tapBoxCount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  tapBoxTapText: {
    color: '#D4AF37',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 6,
  },
  resetRow: {
    width: '100%',
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  resetBtnText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  progressPercentText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  completedBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },

  // Alternatives
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
    fontFamily: 'Inter',
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
