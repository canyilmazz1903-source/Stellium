import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/api/supabase';
import { searchLocation, getTimezoneForCoordinates, LocationSuggestion } from '@/api/location';
import GlassCard from '@/components/glass/GlassCard';
import CosmicButton from '@/components/ui/CosmicButton';
import CosmicInput from '@/components/ui/CosmicInput';

export default function SettingsScreen() {
  const { user, profile, signOut, isPremium, setPremium } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(1995, 9, 25));
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
  const [updateError, setUpdateError] = useState('');

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}.${month}.${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const startEditing = () => {
    setName(profile?.name || '');
    
    let dateObj = new Date(1995, 9, 25);
    if (profile?.birth_date) {
      const parts = profile.birth_date.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        dateObj = new Date(year, month - 1, day);
      }
    }
    setBirthDate(dateObj);
    
    let timeObj = new Date(1995, 9, 25, 12, 0);
    if (profile?.birth_time) {
      const parts = profile.birth_time.split(':');
      if (parts.length >= 2) {
        const [h, m] = parts.map(Number);
        timeObj.setHours(h);
        timeObj.setMinutes(m);
        timeObj.setSeconds(0);
      }
    }
    setBirthTime(timeObj);
    
    setBirthPlace(profile?.birth_place || '');
    setLatitude(profile?.latitude || null);
    setLongitude(profile?.longitude || null);
    setTimezone(profile?.timezone || null);
    setUpdateError('');
    setIsEditing(true);
  };

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

  const handleSaveSettings = async () => {
    if (!name.trim()) return setUpdateError('Lütfen isminizi girin.');
    if (!birthPlace || latitude === null || longitude === null) return setUpdateError('Lütfen doğum yerinizi seçin.');
    if (!user) return setUpdateError('Kullanıcı oturumu bulunamadı.');

    setLoading(true);
    setUpdateError('');
    try {
      const dateString = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeString = `${String(birthTime.getHours()).padStart(2, '0')}:${String(birthTime.getMinutes()).padStart(2, '0')}:00`; // HH:MM:SS
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          birth_date: dateString,
          birth_time: timeString,
          birth_place: birthPlace,
          latitude,
          longitude,
          timezone: timezone || 'Europe/Istanbul',
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh local authStore
      await useAuthStore.getState().initialize();
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (err: any) {
      setUpdateError(err.message || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handlePurchase = () => {
    setLoading(true);
    // Simulate RevenueCat billing trigger
    setTimeout(() => {
      setPremium(true);
      setLoading(false);
      Alert.alert(
        'Elite Üyelik Aktif',
        'Tebrikler! Cosmic Elite ailesine başarıyla katıldınız. Tüm kısıtlamalar kaldırıldı.',
        [{ text: 'Kozmik Yolculuğa Başla' }]
      );
    }, 1500);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Abonelik Yönetimi',
      'Aboneliğinizi dilediğiniz zaman App Store Hesap Ayarları üzerinden yönetebilir veya iptal edebilirsiniz.',
      [
        { text: 'Aboneliği Sonlandır', style: 'destructive', onPress: () => setPremium(false) },
        { text: 'Kapat', style: 'cancel' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı ve Tüm Verileri Sil',
      'Hesabınız, kayıtlı doğum haritanız ve zikir kayıtlarınız kalıcı olarak silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (user) {
                // Delete user's profile row in database
                const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                if (error) throw error;
              }
              // Sign out from Supabase (clears local session)
              await signOut();
            } catch (err: any) {
              Alert.alert('Hesap Silinemedi', err.message || 'Bir hata oluştu.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Oturumunuz kapatılacaktır. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={true}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Ayarlar & Üyelik</Text>
            <Text style={styles.subtitle}>Hesabınızı ve Kozmik Aboneliğinizi Yönetin</Text>
          </View>

          {loading && !isEditing ? (
            <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
          ) : (
            <View style={styles.content}>
              
              {/* User Profile Info Card */}
              <GlassCard style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.headerCardTitle}>Profil Bilgileri</Text>
                  {!isEditing && (
                    <Pressable onPress={startEditing} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>Düzenle</Text>
                    </Pressable>
                  )}
                </View>
                
                {!isEditing ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>İsim:</Text>
                      <Text style={styles.infoValue}>{profile?.name || 'Kozmik Ruh'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>E-posta:</Text>
                      <Text style={styles.infoValue}>{user?.email || '-'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Doğum Yeri:</Text>
                      <Text style={styles.infoValue}>{profile?.birth_place || '-'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Doğum Zamanı:</Text>
                      <Text style={styles.infoValue}>
                        {formatBirthDate(profile?.birth_date)} | {profile?.birth_time || '-'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.editForm}>
                    <CosmicInput
                      label="Tam İsim"
                      placeholder="İsim girin"
                      value={name}
                      onChangeText={setName}
                    />

                    {/* Birth Date Picker Trigger */}
                    <View style={styles.pickerFieldContainer}>
                      <Text style={styles.pickerLabel}>Doğum Tarihi</Text>
                      <Pressable style={styles.pickerTrigger} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.pickerTriggerText}>
                          {birthDate.toLocaleDateString('tr-TR')}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Birth Time Picker Trigger */}
                    <View style={styles.pickerFieldContainer}>
                      <Text style={styles.pickerLabel}>Doğum Saati</Text>
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

                    {updateError ? <Text style={styles.errorText}>{updateError}</Text> : null}

                    <View style={styles.editActions}>
                      <CosmicButton
                        title={loading ? 'Kaydediliyor...' : 'Kaydet'}
                        onPress={handleSaveSettings}
                        disabled={loading}
                        style={[styles.actionBtn, { flex: 1 }]}
                      />
                      <CosmicButton
                        title="Vazgeç"
                        onPress={handleCancelEditing}
                        variant="outline"
                        disabled={loading}
                        style={[styles.actionBtn, { flex: 1 }]}
                      />
                    </View>
                  </View>
                )}
              </GlassCard>

              {/* Premium Paywall / Subscription Status Card */}
              <GlassCard style={[styles.card, isPremium && styles.premiumCard]}>
                <Text style={[styles.cardTitle, isPremium && styles.premiumTitle]}>
                  {isPremium ? '🌟 Cosmic Elite Üyesi' : 'Upgrade to Cosmic Elite'}
                </Text>
                
                <Text style={styles.description}>
                  {isPremium 
                    ? 'Aboneliğiniz aktif! Gemini destekli göksel transit yorumları, detaylı Yıldızname ve Sinastri gibi tüm Elite özelliklere tam erişim hakkınız bulunmaktadır.'
                    : 'Günün kozmik ritimlerine ve yıldız hareketlerine dayalı detaylı tahlillere erişin, hayatınızı Ay evrelerine göre optimize edin ve derinlemesine ebced analizleri çıkarın.'
                  }
                </Text>

                {!isPremium ? (
                  <View style={styles.benefitsList}>
                    <Text style={styles.benefitItem}>✓ Yapay Zeka Destekli Detaylı Transit Yorumları</Text>
                    <Text style={styles.benefitItem}>✓ Enerji Uyum Haritası (Sinastri)</Text>
                    <Text style={styles.benefitItem}>✓ Detaylı Esma Zikir Saatleri & Ebced Analizleri</Text>
                    <Text style={styles.benefitItem}>✓ Altın Yaldızlı Ay Evresi Widget Eklentileri</Text>
                  </View>
                ) : null}

                <CosmicButton
                  title={isPremium ? 'Aboneliği Yönet' : 'Kozmik Elite Katıl - 99.99 TL / Ay'}
                  onPress={isPremium ? handleCancelSubscription : handlePurchase}
                  style={styles.payButton}
                />
              </GlassCard>

              {/* Account Actions and App Store Compliance */}
              <View style={styles.actionGroup}>
                <CosmicButton
                  title="Oturumu Kapat"
                  onPress={handleSignOut}
                  variant="outline"
                  style={styles.actionButton}
                />
                
                <CosmicButton
                  title="Hesabımı ve Verilerimi Kalıcı Olarak Sil"
                  onPress={handleDeleteAccount}
                  variant="ghost"
                  textStyle={styles.deleteButtonText}
                  style={styles.actionButton}
                />
              </View>

            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
    marginBottom: 24,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    gap: 20,
  },
  card: {
    padding: 20,
  },
  premiumCard: {
    borderColor: '#D4AF37', // Golden glow outline
  },
  cardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 8,
  },
  premiumTitle: {
    color: '#D4AF37',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  infoValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F0F6FC',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 20,
  },
  benefitItem: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#D4AF37',
  },
  payButton: {
    marginTop: 10,
  },
  actionGroup: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    width: '100%',
  },
  deleteButtonText: {
    color: '#FF7B72',
    fontSize: 14,
  },
  loader: {
    marginTop: 80,
  },
  // Editor Styles
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 8,
  },
  headerCardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  editBtnText: {
    fontFamily: 'Inter',
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  editForm: {
    gap: 12,
  },
  pickerLabel: {
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
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    marginTop: 0,
  },
  errorText: {
    color: '#FF7B72',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
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
    fontSize: 16,
    fontWeight: '600',
  },
});
