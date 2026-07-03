import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

interface LibrarySectionProps {
  title: string;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function LibrarySection({ title, emoji, isOpen, onToggle, children }: LibrarySectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={18} 
          color="#D4AF37" 
        />
      </Pressable>
      {isOpen && (
        <View style={styles.sectionContent}>
          <View style={styles.divider} />
          {children}
        </View>
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const [openSection, setOpenSection] = useState<number | null>(0); // First open by default

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
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
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Kozmik Kütüphane</Text>
          <Text style={styles.subtitle}>Astroloji, Ebced ve Mistik Ritüeller Sözlüğü</Text>
        </View>

        <View style={styles.content}>
          {/* Section 1: Zodiac Signs */}
          <LibrarySection
            title="Zodyak Rehberi (12 Burç)"
            emoji="✨"
            isOpen={openSection === 0}
            onToggle={() => toggleSection(0)}
          >
            <Text style={styles.introText}>
              Zodyak'taki 12 burç, dört element (Ateş, Toprak, Hava, Su) ve üç nitelik (Öncü, Sabit, Değişken) kombinasyonundan oluşan özgün göksel enerjileri temsil eder:
            </Text>
            
            <View style={styles.signList}>
              <View style={[styles.signItem, { borderLeftColor: '#F87171' }]}>
                <Text style={[styles.signTitleText, { color: '#FCA5A5' }]}>♈ Koç (Ateş / Öncü / Mars):</Text>
                <Text style={styles.signBodyText}>İnisiyatif alma, cesaret, liderlik ve saf yaşam enerjisi. Yeni başlangıçlar yapma dürtüsünü yönetir.</Text>
              </View>
              
              <View style={[styles.signItem, { borderLeftColor: '#34D399' }]}>
                <Text style={[styles.signTitleText, { color: '#6EE7B7' }]}>♉ Boğa (Toprak / Sabit / Venüs):</Text>
                <Text style={styles.signBodyText}>Maddi ve manevi köklenme, üretkenlik, istikrar arayışı ve estetik değer yaratma yeteneği.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#38BDF8' }]}>
                <Text style={[styles.signTitleText, { color: '#7DD3FC' }]}>♊ İkizler (Hava / Değişken / Merkür):</Text>
                <Text style={styles.signBodyText}>Zihinsel merak, iletişim hızı, bilgi toplama ve yayma gücü. Çift karakterli ve esnek mizaç.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#818CF8' }]}>
                <Text style={[styles.signTitleText, { color: '#A5B4FC' }]}>♋ Yengeç (Su / Öncü / Ay):</Text>
                <Text style={styles.signBodyText}>Duygusal derinlik, empati, şefkat, yuva ve aile bağları. Koruyucu ve besleyici enerji.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#FBBF24' }]}>
                <Text style={[styles.signTitleText, { color: '#FCD34D' }]}>♌ Aslan (Ateş / Sabit / Güneş):</Text>
                <Text style={styles.signBodyText}>Yaratıcılık, cömertlik, kendini gururla ifade etme gücü ve liderlik karizması.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#4ADE80' }]}>
                <Text style={[styles.signTitleText, { color: '#86EFAC' }]}>♍ Başak (Toprak / Değişken / Merkür):</Text>
                <Text style={styles.signBodyText}>Analitik zeka, titizlik, pratik çözümler üretme, hizmet etme sevgisi ve bedensel şifa enerjisi.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#F472B6' }]}>
                <Text style={[styles.signTitleText, { color: '#F9A8D4' }]}>♎ Terazi (Hava / Öncü / Venüs):</Text>
                <Text style={styles.signBodyText}>Uyum, adalet, estetik algı, ikili ilişkilerde denge kurma arzusu ve diplomatik zeka.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#C084FC' }]}>
                <Text style={[styles.signTitleText, { color: '#D8B4FE' }]}>♏ Akrep (Su / Sabit / Mars & Plüton):</Text>
                <Text style={styles.signBodyText}>Krizleri dönüştürme gücü, derin sezgiler, tutku, gizem ve manevi yenilenme kapasitesi.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#FBBF24' }]}>
                <Text style={[styles.signTitleText, { color: '#FCD34D' }]}>♐ Yay (Ateş / Değişken / Jüpiter):</Text>
                <Text style={styles.signBodyText}>İnançlar, yüksek felsefe, keşif arzusu, vizyonerlik ve sınırları aşan özgürlük tutkusu.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#2DD4BF' }]}>
                <Text style={[styles.signTitleText, { color: '#5EEAD4' }]}>♑ Oğlak (Toprak / Öncü / Satürn):</Text>
                <Text style={styles.signBodyText}>Disiplin, sorumluluk, zamanın getirdiği olgunluk, kariyer hedefleri ve kalıcı yapılar kurma azmi.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#22D3EE' }]}>
                <Text style={[styles.signTitleText, { color: '#67E8F9' }]}>♒ Kova (Hava / Sabit / Satürn & Uranüs):</Text>
                <Text style={styles.signBodyText}>Özgün zeka, kolektif vizyonlar, bağımsızlık, yenilikçi ve reformcu bakış açısı.</Text>
              </View>

              <View style={[styles.signItem, { borderLeftColor: '#60A5FA' }]}>
                <Text style={[styles.signTitleText, { color: '#93C5FD' }]}>♓ Balık (Su / Değişken / Jüpiter & Neptün):</Text>
                <Text style={styles.signBodyText}>Sonsuz empati, evrensel şefkat, mistik derinlik, ilahi teslimiyet ve güçlü hayal gücü.</Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 2: Celestial Bodies */}
          <LibrarySection
            title="Astrolojide Gezegenler"
            emoji="🪐"
            isOpen={openSection === 1}
            onToggle={() => toggleSection(1)}
          >
            <Text style={styles.introText}>
              Gezegenler, ruhumuzun farklı dinamiklerini, yeteneklerini ve yaşam alanlarındaki motivasyonlarını simgeler:
            </Text>

            <View style={styles.signList}>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#FCD34D' }]}>☀️ Güneş (Güneş):</Text>
                <Text style={styles.signBodyText}>Öz kimlik, irade, yaşam enerjisi ve bilinçli benlik hedeflerini temsil eder.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#A5B4FC' }]}>🌙 Ay (Ay):</Text>
                <Text style={styles.signBodyText}>Duygusal ihtiyaçlar, sezgiler, bilinçaltı ve günün enerjisel ritimlerini yönetir.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#7DD3FC' }]}>💬 Merkür (Utarit):</Text>
                <Text style={styles.signBodyText}>Zeka, mantık, iletişim, eğitim yetenekleri and geleneksel Ebced kodlamalarıyla ilişkilidir.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#F9A8D4' }]}>💞 Venüs (Zühre):</Text>
                <Text style={styles.signBodyText}>Aşk, ikili ilişkiler, değerler, güzellik algısı, finansal bereket ve cazibeyi simgeler.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#FCA5A5' }]}>🔥 Mars (Merih):</Text>
                <Text style={styles.signBodyText}>Eyleme geçme gücü, hırs, cesaret, fiziksel dayanıklılık ve mücadele enerjisi.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#FCD34D' }]}>🌟 Jüpiter (Müşteri):</Text>
                <Text style={styles.signBodyText}>Bolluk, şans, büyüme, bilgelik arayışı ve maddi/manevi genişleme fırsatları.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#5EEAD4' }]}>🪐 Satürn (Zühal):</Text>
                <Text style={styles.signBodyText}>Disiplin, sınırlar, karma, sorumluluklar, zamanın getirdiği sınavlar ve sabır.</Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 3: Astrological Houses */}
          <LibrarySection
            title="Yaşam Alanları (12 Ev)"
            emoji="🏠"
            isOpen={openSection === 2}
            onToggle={() => toggleSection(2)}
          >
            <Text style={styles.introText}>
              Haritadaki 12 ev, doğum anındaki gökyüzünün yerel ufkuna göre bölünmesidir ve hayatın hangi sahnelerinde enerjimizi harcayacağımızı belirler:
            </Text>

            <View style={styles.signList}>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>1. Ev (Yükselen / ASC):</Text>
                <Text style={styles.signBodyText}>Karakter yapısı, dış dünyaya sunulan maske, ilk intiba ve fiziksel mizaç.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>2. Ev:</Text>
                <Text style={styles.signBodyText}>Finansal kaynaklar, kazançlar, maddi güvence ve kişisel öz-değer duygusu.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>3. Ev:</Text>
                <Text style={styles.signBodyText}>Yakın çevre, kardeşler, mantıksal zihin, ilk eğitim süreçleri ve kısa seyahatler.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>4. Ev:</Text>
                <Text style={styles.signBodyText}>Aile, kökler, çocukluk temelleri, ev ve iç dünyadaki en gizli sığınak alanı.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>5. Ev:</Text>
                <Text style={styles.signBodyText}>Yaratıcılık, aşk ilişkileri, çocuklar, hobiler, oyunlar ve yaşamdan alınan zevk.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>6. Ev:</Text>
                <Text style={styles.signBodyText}>Günlük çalışma rutinleri, iş ortamı, evcil hayvanlar ve fiziksel beden sağlığı.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>7. Ev (Alçalan / DSC):</Text>
                <Text style={styles.signBodyText}>Evlilik, ciddi ortaklıklar, açık düşmanlar ve ikili ilişkilerde denge.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>8. Ev:</Text>
                <Text style={styles.signBodyText}>Miras, eşin parası, krizler, ölüm, manevi dönüşüm, cinsellik ve okült ilimler.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>9. Ev:</Text>
                <Text style={styles.signBodyText}>Uzak seyahatler, yabancı kültürler, yüksek eğitim, felsefe, din ve vizyonlar.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>10. Ev (Başucu Noktası / MC):</Text>
                <Text style={styles.signBodyText}>Kariyer, toplumsal statü, başarı, otorite ve hayattaki nihai zirve noktası.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>11. Ev:</Text>
                <Text style={styles.signBodyText}>Sosyal gruplar, dernekler, dostluklar, insanlığa faydalı hedefler ve dilekler.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={styles.houseTitleText}>12. Ev:</Text>
                <Text style={styles.signBodyText}>Bilinçaltı okyanusu, rüyalar, gizli düşmanlar, inziva, manevi arınma ve teslimiyet.</Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 4: Ebced, Yildizname & Rituals */}
          <LibrarySection
            title="Ebced, Yıldızname ve Ritüel İlimleri"
            emoji="📜"
            isOpen={openSection === 3}
            onToggle={() => toggleSection(3)}
          >
            <Text style={styles.sectionSubtitleText}>Ebced Hesabı Nedir?</Text>
            <Text style={styles.sectionBodyParagraph}>
              Ebced, Arap alfabesindeki harflerin sayısal değerlerini temel alan kadim bir matematik sistemidir. İsimlerin sayısal titreşimi hesaplanarak kişinin kader kodları, uyumlu zikir sayıları ve karakter mizaçları üzerinde incelemeler yapılır. Her ismin evrende bir sayısal rezonansı bulunur.
            </Text>

            <Text style={styles.sectionSubtitleText}>Yıldızname Nedir?</Text>
            <Text style={styles.sectionBodyParagraph}>
              Yıldızname, kişinin adı ve anne adının Ebced değerlerinin toplanıp 12'ye bölünmesiyle hesaplanan geleneksel bir Doğu analizidir. Çıkan kalan sayıya göre kişinin yıldız burcu, yönetici yıldızı (gezegeni), uğurlu günü, rengi ve manevi koruma esmaları belirlenir. Fal değildir; isim enerjileriyle gezegen saatlerinin uyumlandırılması ilmidir.
            </Text>

            <Text style={styles.sectionSubtitleText}>Gezegen Günleri ve Zikir Bağlantısı</Text>
            <Text style={styles.sectionBodyParagraph}>
              Kadim ilimlere göre haftanın her günü bir gezegenin enerjisiyle rezonanstadır:
              {"\n"}• Pazar: Güneş (Saygınlık, liderlik - Ya Cami)
              {"\n"}• Pazartesi: Ay (Sezgi, aile, arınma - Ya Kuddüs)
              {"\n"}• Salı: Mars (Cesaret, eylem - Ya Fettah)
              {"\n"}• Çarşamba: Merkür (Zihin, ticaret - Ya Alim)
              {"\n"}• Perşembe: Jüpiter (Bolluk, şans - Ya Rezzak)
              {"\n"}• Cuma: Venüs (Sevgi, muhabbet - Ya Vedud)
              {"\n"}• Cumartesi: Satürn (Disiplin, koruma - Ya Selam)
            </Text>

            <Text style={styles.sectionSubtitleText}>Ay Döngüsü ve Kozmik Biyohacking Ritüelleri</Text>
            <Text style={styles.sectionBodyParagraph}>
              Ay'ın evrelerine göre hayatınızı optimize edebilirsiniz:
              {"\n"}• Yeni Ay (Niyet): Adaçayı veya üzerlik otu yakarak mekansal arınma yapın. Yeni kararlar ve niyetler belirleyin.
              {"\n"}• Büyüyen Ay (Gelişim): Vücudu besleyin, saç kesimi yaptırın (saçı gürleştirir), vitamin takviyeleri alın.
              {"\n"}• Dolunay (Zirve & Arınma): Vücutta ödem birikebileceğinden bol su tüketin. Akşam ellerinizi kaya tuzlu suyla yıkayarak negatif enerjileri boşaltın.
              {"\n"}• Küçülen Ay (Temizlik & Detoks): Evde derin temizlik yapın, epilasyon yaptırın (etkisi daha kalıcı olur) ve toksin atmak için bitki çayları için.
            </Text>
          </LibrarySection>

          {/* Section 5: Aspects */}
          <LibrarySection
            title="Açılar (Gezegen İlişkileri)"
            emoji="📐"
            isOpen={openSection === 4}
            onToggle={() => toggleSection(4)}
          >
            <Text style={styles.introText}>
              Açılar, gezegenlerin haritada birbirleriyle kurduğu geometrik ilişkilerdir. Transit, sinastri ve doğum haritası yorumlarının temelini oluştururlar; iki gezegenin enerjisinin uyumlu mu yoksa gergin mi aktığını gösterirler:
            </Text>

            <View style={styles.signList}>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#FCD34D' }]}>☌ Kavuşum (0°):</Text>
                <Text style={styles.signBodyText}>İki gezegen yan yana gelir ve enerjileri birleşir. Güçlü bir odak ve yeni başlangıç noktasıdır; birleşen gezegenlerin doğasına göre yapıcı veya yoğun olabilir.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#86EFAC' }]}>△ Üçgen (120°):</Text>
                <Text style={styles.signBodyText}>En uyumlu ve akıcı açıdır. Gezegenler arasında doğal bir yetenek, şans ve kolaylık akışı yaratır. Çaba gerektirmeden gelen armağanları simgeler.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#93C5FD' }]}>⚹ Sekstil (60°):</Text>
                <Text style={styles.signBodyText}>Fırsat ve olanak açısıdır. Uyumludur ancak potansiyeli açığa çıkarmak için küçük bir çaba ister. Öğrenme ve gelişim kapıları aralar.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#FCA5A5' }]}>□ Kare (90°):</Text>
                <Text style={styles.signBodyText}>Gerilim ve mücadele açısıdır. İçsel/dışsal çatışmalar, engeller ve harekete geçiren baskılar yaratır. Aşıldığında en büyük gelişim ve karakter gücünü getirir.</Text>
              </View>
              <View style={styles.signItemTextOnly}>
                <Text style={[styles.signTitleText, { color: '#F0ABFC' }]}>☍ Karşıt (180°):</Text>
                <Text style={styles.signBodyText}>Kutuplaşma ve denge sınavıdır. Gezegenler tam karşı karşıyadır; genellikle ilişkiler ve dış olaylar yoluyla farkındalık getirir. Orta yolu bulmayı öğretir.</Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitleText}>Orb (Etki Alanı) Nedir?</Text>
            <Text style={styles.sectionBodyParagraph}>
              Bir açının tam dereceden sapma toleransına "orb" denir. Örneğin 90°'ye 2-3 derece yakınlıktaki bir kare açı hâlâ etkilidir. Orb ne kadar dar (tam dereceye yakın) ise açının etkisi o kadar güçlü ve belirgin hissedilir.
            </Text>
          </LibrarySection>
        </View>
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
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  sectionContent: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  introText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF0',
    lineHeight: 22,
    marginBottom: 16,
  },
  signList: {
    gap: 14,
  },
  signItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  signItemTextOnly: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
  },
  signTitleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  houseTitleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 4,
  },
  signBodyText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 18,
  },
  sectionSubtitleText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 12,
    marginBottom: 6,
  },
  sectionBodyParagraph: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 18,
    marginBottom: 14,
  },
});
