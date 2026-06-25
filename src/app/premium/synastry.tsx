import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, SafeAreaView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { computeNatalChart } from '@/utils/astronomy';
import { fetchSynastryAnalysis } from '@/api/gemini';
import { searchLocation, getTimezoneForCoordinates, LocationSuggestion } from '@/api/location';
import GlassCard from '@/components/glass/GlassCard';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';

interface SynastryAspect {
  p1Planet: string;
  p2Planet: string;
  aspectName: string;
  symbol: string;
  exactDiff: string;
  interpretation: string;
}

export default function SynastryScreen() {
  const { profile } = useAuthStore();
  const { computedChart } = useAppStore();

  // Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(1995, 9, 25));
  const [birthTime, setBirthTime] = useState<Date>(new Date(1995, 9, 25, 12, 0));
  const [birthPlace, setBirthPlace] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Date/Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location suggestions
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Result States
  const [analysisReport, setAnalysisReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [partnerChart, setPartnerChart] = useState<any>(null);

  const handleLocationSearch = async (text: string) => {
    setBirthPlace(text);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      setSearchingLocation(true);
      const results = await searchLocation(text);
      setSuggestions(results);
    } catch (err) {
      console.warn(err);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectLocation = async (loc: LocationSuggestion) => {
    setBirthPlace(loc.displayName);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setSuggestions([]);
    try {
      await getTimezoneForCoordinates(loc.latitude, loc.longitude);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setBirthTime(selectedTime);
  };

  // Compute aspects and scores
  const synastryResults = useMemo(() => {
    if (!computedChart || !partnerChart) return null;

    const aspects: SynastryAspect[] = [];
    const aspectTypes = [
      { name: 'Kavuşum', angle: 0, symbol: '☌', desc: 'Ruhsal birlik, yoğun enerji akışı.' },
      { name: 'Sekstil', angle: 60, symbol: '⚹', desc: 'Destekleyici iletişim, uyumlu işbirliği.' },
      { name: 'Kare', angle: 90, symbol: '□', desc: 'Geliştirici gerilim, gölge yönlerin çatışması.' },
      { name: 'Üçgen', angle: 120, symbol: '△', desc: 'Doğal akış, zahmetsiz sevgi ve anlayış.' },
      { name: 'Karşıt', angle: 180, symbol: '☍', desc: 'Ayna etkisi, zıt kutupların çekimi ve dengelenme.' }
    ];
    const ORB = 6;

    let totalAttraction = 50;
    let totalCommunication = 50;
    let totalKarma = 50;

    for (const p1 of computedChart.planets) {
      for (const p2 of partnerChart.planets) {
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const asp of aspectTypes) {
          if (Math.abs(diff - asp.angle) <= ORB) {
            aspects.push({
              p1Planet: p1.name,
              p2Planet: p2.name,
              aspectName: asp.name,
              symbol: asp.symbol,
              exactDiff: Math.abs(diff - asp.angle).toFixed(1),
              interpretation: `${p1.name} ve ${p2.name} arasında ${asp.name} açısı: ${asp.desc}`
            });

            // Adjust scores based on planets
            const isLovePlanet = ['Sun', 'Moon', 'Venus', 'Mars'].includes(p1.name) && ['Sun', 'Moon', 'Venus', 'Mars'].includes(p2.name);
            const isCommPlanet = p1.name === 'Mercury' || p2.name === 'Mercury';
            const isKarmaPlanet = ['Saturn', 'Pluto', 'Neptune'].includes(p1.name) || ['Saturn', 'Pluto', 'Neptune'].includes(p2.name);

            if (asp.name === 'Üçgen' || asp.name === 'Sekstil') {
              if (isLovePlanet) totalAttraction += 10;
              if (isCommPlanet) totalCommunication += 10;
              if (isKarmaPlanet) totalKarma += 8;
            } else if (asp.name === 'Kavuşum') {
              if (isLovePlanet) totalAttraction += 12;
              if (isCommPlanet) totalCommunication += 12;
              totalKarma += 6;
            } else {
              // Square/Oppose (tension points)
              if (isLovePlanet) totalAttraction -= 5;
              if (isCommPlanet) totalCommunication -= 6;
              totalKarma += 10; // Karma is built through tension
            }
          }
        }
      }
    }

    // Clamp scores
    const attraction = Math.min(98, Math.max(30, totalAttraction));
    const communication = Math.min(98, Math.max(30, totalCommunication));
    const karma = Math.min(98, Math.max(30, totalKarma));
    const overall = Math.round((attraction + communication + karma) / 3);

    return {
      aspects,
      scores: { overall, attraction, communication, karma }
    };
  }, [computedChart, partnerChart]);

  const handleCalculate = async () => {
    if (!partnerName.trim()) return Alert.alert('Hata', 'Lütfen partnerinizin adını girin.');
    if (!birthPlace || latitude === null || longitude === null) return Alert.alert('Hata', 'Lütfen partnerinizin doğum yerini seçin.');

    setLoading(true);
    try {
      const year = birthDate.getFullYear();
      const month = birthDate.getMonth() + 1;
      const day = birthDate.getDate();
      const hour = birthTime.getHours();
      const minute = birthTime.getMinutes();

      // Estimate timezone offset from longitude (15 degrees per hour)
      const tzOffset = Math.round(longitude / 15);

      const chart = computeNatalChart(year, month, day, hour, minute, latitude, longitude, tzOffset);
      setPartnerChart(chart);

      const userSun = computedChart?.planets?.find(p => p.name === 'Sun')?.sign || 'Koç';

      const analysis = await fetchSynastryAnalysis(
        profile?.name || 'Kozmik Ruh',
        userSun,
        computedChart?.planets || [],
        partnerName,
        chart.planets
      );

      setAnalysisReport(analysis);
      setIsCalculated(true);
    } catch (e) {
      console.warn(e);
      Alert.alert('Hata', 'Uyum analizi yapılırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPartnerName('');
    setBirthPlace('');
    setSuggestions([]);
    setIsCalculated(false);
    setPartnerChart(null);
    setAnalysisReport('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Haritalar Karşılaştırılıyor...</Text>
        <Text style={styles.loadingSubtext}>Çekim, İletişim ve Karma aksları analiz ediliyor.</Text>
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
                İki kişinin doğum haritaları arasındaki açıları karşılaştırarak romantik, zihinsel ve karmik uyumu hesaplayın.
              </Text>

              <CosmicInput
                label="Partnerin Adı"
                placeholder="İsim girin"
                value={partnerName}
                onChangeText={setPartnerName}
              />

              {/* Birth Date Picker Trigger */}
              <View style={styles.pickerFieldContainer}>
                <Text style={styles.label}>Doğum Tarihi</Text>
                <Pressable style={styles.pickerTrigger} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.pickerTriggerText}>
                    {birthDate.toLocaleDateString('tr-TR')}
                  </Text>
                </Pressable>
              </View>

              {/* Birth Time Picker Trigger */}
              <View style={styles.pickerFieldContainer}>
                <Text style={styles.label}>Doğum Saati</Text>
                <Pressable style={styles.pickerTrigger} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.pickerTriggerText}>
                    {birthTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>

              {/* Geocoding location search field */}
              <View style={styles.searchContainer}>
                <CosmicInput
                  label="Doğum Yeri (Şehir)"
                  placeholder="Şehir arayın..."
                  value={birthPlace}
                  onChangeText={handleLocationSearch}
                />
                {searchingLocation ? <Text style={styles.searchingText}>Aranıyor...</Text> : null}
                
                {suggestions.length > 0 ? (
                  <View style={styles.suggestionsBox}>
                    {suggestions.map((item, idx) => (
                      <Pressable
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(item)}
                      >
                        <Text style={styles.suggestionItemText}>{item.displayName}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <CosmicButton
                title="Kozmik Uyum Analizi Çıkar"
                onPress={handleCalculate}
                style={styles.calcButton}
              />
            </GlassCard>
          ) : (
            <View style={styles.resultsContainer}>
              {/* Compatibility Score Circle */}
              <GlassCard style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Genel Kozmik Uyum</Text>
                <Text style={styles.scorePercentage}>%{synastryResults?.scores.overall}</Text>
                <Text style={styles.scoreSub}>Aşk, Zihin ve Ruhsal Açıların Birleşimi</Text>
              </GlassCard>

              {/* Breakdown Bars */}
              <GlassCard style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>Uyum Detayları</Text>
                
                <View style={styles.barContainer}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>💞 Romantik Çekim</Text>
                    <Text style={styles.barVal}>%{synastryResults?.scores.attraction}</Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${synastryResults?.scores.attraction}%` }]} />
                  </View>
                </View>

                <View style={styles.barContainer}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>💬 Zihinsel & İletişim</Text>
                    <Text style={styles.barVal}>%{synastryResults?.scores.communication}</Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${synastryResults?.scores.communication}%` }]} />
                  </View>
                </View>

                <View style={styles.barContainer}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>🌀 Karmik Bağ & Büyüme</Text>
                    <Text style={styles.barVal}>%{synastryResults?.scores.karma}</Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${synastryResults?.scores.karma}%` }]} />
                  </View>
                </View>
              </GlassCard>

              {/* Aspects */}
              <Text style={styles.aspectsTitle}>Öne Çıkan Gezegen Etkileşimleri</Text>
              <View style={styles.aspectsList}>
                {synastryResults && synastryResults.aspects.length > 0 ? (
                  synastryResults.aspects.slice(0, 5).map((asp, idx) => (
                    <GlassCard key={idx} style={styles.aspectItemCard}>
                      <View style={styles.aspectHeader}>
                        <Text style={styles.aspectSymbol}>{asp.symbol}</Text>
                        <Text style={styles.aspectHeaderText}>
                          {asp.p1Planet} & {asp.p2Planet} {asp.aspectName} (Orb: {asp.exactDiff}°)
                        </Text>
                      </View>
                    </GlassCard>
                  ))
                ) : (
                  <GlassCard style={styles.aspectItemCard}>
                    <Text style={styles.noAspectText}>İki harita arasında majör bir açı bulunamadı. Genel çekim akışı sakindir.</Text>
                  </GlassCard>
                )}
              </View>

              {/* Gemini AI Synastry Report */}
              <Text style={styles.aspectsTitle}>Anima & Animus İlişki Rehberi</Text>
              <GlassCard style={styles.reportCard}>
                <Text style={styles.reportText}>{analysisReport}</Text>
              </GlassCard>

              <CosmicButton
                title="Yeni Bir Uyum Sorgula"
                onPress={handleReset}
                variant="outline"
                style={styles.resetButton}
              />
            </View>
          )}

          {/* Date Picker (Modal) */}
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={handleDatePickerChange}
              maximumDate={new Date()}
            />
          )}

          {/* Time Picker (Modal) */}
          {showTimePicker && (
            <DateTimePicker
              value={birthTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimePickerChange}
            />
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
    lineHeight: 20,
    marginBottom: 20,
  },
  label: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pickerFieldContainer: {
    marginBottom: 16,
    width: '100%',
  },
  pickerTrigger: {
    backgroundColor: 'rgba(22, 27, 34, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pickerTriggerText: {
    color: '#F0F6FC',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  searchContainer: {
    position: 'relative',
    width: '100%',
  },
  searchingText: {
    color: '#D4AF37',
    fontSize: 12,
    position: 'absolute',
    right: 12,
    top: 36,
  },
  suggestionsBox: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 16,
    zIndex: 10,
    maxHeight: 180,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  suggestionItemText: {
    color: '#F0F6FC',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  calcButton: {
    marginTop: 12,
  },
  resultsContainer: {
    gap: 24,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scoreTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#8B949E',
    fontWeight: '600',
  },
  scorePercentage: {
    fontFamily: 'Cinzel',
    fontSize: 54,
    color: '#D4AF37',
    fontWeight: '700',
    marginVertical: 10,
  },
  scoreSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  breakdownCard: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Cinzel',
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 16,
  },
  barContainer: {
    marginBottom: 16,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#F0F6FC',
  },
  barVal: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
  },
  barBackground: {
    backgroundColor: '#30363D',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#D4AF37',
    height: '100%',
    borderRadius: 4,
  },
  aspectsTitle: {
    fontFamily: 'Cinzel',
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  aspectsList: {
    gap: 10,
  },
  aspectItemCard: {
    padding: 14,
  },
  aspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aspectSymbol: {
    fontSize: 22,
    color: '#D4AF37',
    marginRight: 12,
  },
  aspectHeaderText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    flex: 1,
  },
  noAspectText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
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
