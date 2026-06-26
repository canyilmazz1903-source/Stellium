import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { supabase } from '@/api/supabase';
import { searchLocation, getTimezoneForCoordinates, LocationSuggestion } from '@/api/location';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';
import GlassCard from '@/components/glass/GlassCard';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Birth parameters
  const [birthDate, setBirthDate] = useState<Date>(new Date(1995, 9, 25)); // Default test date
  const [birthTime, setBirthTime] = useState<Date>(new Date(1995, 9, 25, 12, 0));
  const [birthPlace, setBirthPlace] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  
  // Date/Time picker visibilities
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Location Search Suggestion state
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  
  const router = useRouter();

  // Search birth place
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
      setLoading(true);
      const tz = await getTimezoneForCoordinates(loc.latitude, loc.longitude);
      setTimezone(tz);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setBirthTime(selectedTime);
    }
  };

  const handleRegister = async () => {
    // Validations
    if (!name.trim()) return setError('Lütfen isminizi girin.');
    if (!email.trim()) return setError('Lütfen e-posta adresinizi girin.');
    if (password.length < 6) return setError('Şifreniz en az 6 karakter olmalıdır.');
    if (!birthPlace || latitude === null || longitude === null) return setError('Lütfen doğum yerinizi arayıp listeden seçin.');

    setError('');
    setLoading(true);

    try {
      // 1. Sign up User in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        // Format birth parameters
        const dateString = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = `${String(birthTime.getHours()).padStart(2, '0')}:${String(birthTime.getMinutes()).padStart(2, '0')}:00`; // HH:MM:SS
        
        // 2. Insert Profile Data into profiles table
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: name.trim(),
          birth_date: dateString,
          birth_time: timeString,
          birth_place: birthPlace,
          latitude,
          longitude,
          timezone: timezone || 'Europe/Istanbul'
        });

        if (profileError) {
          throw new Error(`Profil kaydı oluşturulurken hata: ${profileError.message}`);
        }
      } else {
        throw new Error('Kayıt başarısız oldu, kullanıcı oluşturulamadı.');
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={true}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>CosmicCore</Text>
          <Text style={styles.subtitle}>Yıldız Haritanızı Çıkarın</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Doğum Detayları</Text>

          <CosmicInput
            label="Tam İsim"
            placeholder="Kozmik İsim"
            value={name}
            onChangeText={setName}
          />

          <CosmicInput
            label="E-Posta Adresi"
            placeholder="isim@kozmik.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <CosmicInput
            label="Şifre (Min 6 Karakter)"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
              placeholder="İstanbul, İzmir vb. arayın..."
              value={birthPlace}
              onChangeText={handleLocationSearch}
            />
            {searchingLocation ? <Text style={styles.searchingText}>Aranıyor...</Text> : null}
            
            {/* Location Suggestions Dropdown */}
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

          {timezone ? (
            <Text style={styles.timezoneInfoText}>
              Koordinat: {latitude?.toFixed(4)}, {longitude?.toFixed(4)} | Zaman Dilimi: {timezone}
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <CosmicButton
            title={loading ? 'Haritanız Çiziliyor...' : 'Kaydol & Harita Çıkar'}
            onPress={handleRegister}
            disabled={loading}
            style={styles.button}
          />

          <CosmicButton
            title="Zaten Üyeyim (Giriş Yap)"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.loginLink}
          />
        </GlassCard>

        {/* Picker components (wrapped in clean slide-up Modals on iOS) */}
        {Platform.OS === 'ios' ? (
          <>
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalCloseText}>İptal</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalDoneText}>Tamam</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDatePickerChange}
                    maximumDate={new Date()}
                    textColor="#F0F6FC"
                  />
                </View>
              </View>
            </Modal>

            <Modal
              visible={showTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.modalCloseText}>İptal</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.modalDoneText}>Tamam</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={birthTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimePickerChange}
                    textColor="#F0F6FC"
                  />
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={handleDatePickerChange}
                maximumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={birthTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimePickerChange}
              />
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 32,
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 6,
    letterSpacing: 1,
  },
  card: {
    width: '100%',
  },
  cardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 20,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
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
    maxHeight: 200,
    overflow: 'scroll',
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
  timezoneInfoText: {
    color: '#8B949E',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  loginLink: {
    marginTop: 12,
  },
  errorText: {
    color: '#FF7B72',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalCloseText: {
    color: '#8B949E',
    fontFamily: 'Inter',
    fontSize: 16,
  },
  modalDoneText: {
    color: '#D4AF37',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
});
