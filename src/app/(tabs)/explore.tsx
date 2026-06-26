import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/glass/GlassCard';

interface LibrarySectionProps {
  title: string;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function LibrarySection({ title, emoji, isOpen, onToggle, children }: LibrarySectionProps) {
  return (
    <GlassCard style={styles.sectionCard} className="border border-white/10 bg-white/5 mb-4">
      <Pressable onPress={onToggle} style={styles.sectionHeader} className="flex-row justify-between items-center">
        <View style={styles.headerTitleRow} className="flex-row items-center">
          <Text style={styles.sectionEmoji} className="text-xl mr-3">{emoji}</Text>
          <Text style={styles.sectionTitle} className="text-white font-bold text-base font-sans">{title}</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={18} 
          color="#D4AF37" 
        />
      </Pressable>
      {isOpen && (
        <View style={styles.sectionContent} className="mt-4">
          <View style={styles.divider} className="h-[1px] bg-white/10 mb-4" />
          {children}
        </View>
      )}
    </GlassCard>
  );
}

export default function ExploreScreen() {
  const [openSection, setOpenSection] = useState<number | null>(0); // First open by default

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header} className="mb-6 mt-4 items-center">
          <Text style={styles.title} className="text-white text-3xl font-extrabold tracking-tight">Kozmik Kütüphane</Text>
          <Text style={styles.subtitle} className="text-white/50 text-xs font-semibold uppercase tracking-wider mt-1">Astroloji, Ebced ve Mistik Ritüeller Sözlüğü</Text>
        </View>

        <View style={styles.content}>
          {/* Section 1: Zodiac Signs */}
          <LibrarySection
            title="Zodyak Rehberi (12 Burç)"
            emoji="✨"
            isOpen={openSection === 0}
            onToggle={() => toggleSection(0)}
          >
            <Text style={styles.introText} className="text-white/70 text-sm leading-relaxed mb-4">
              Zodyak'taki 12 burç, dört element (Ateş, Toprak, Hava, Su) ve üç nitelik (Öncü, Sabit, Değişken) kombinasyonundan oluşan özgün göksel enerjileri temsil eder:
            </Text>
            
            <View style={styles.signList} className="space-y-3">
              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-rose-400 mb-3">
                <Text style={styles.signTitleText} className="text-rose-300 font-bold text-sm font-sans">♈ Koç (Ateş / Öncü / Mars):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">İnisiyatif alma, cesaret, liderlik ve saf yaşam enerjisi. Yeni başlangıçlar yapma dürtüsünü yönetir.</Text>
              </View>
              
              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-emerald-400 mb-3">
                <Text style={styles.signTitleText} className="text-emerald-300 font-bold text-sm font-sans">♉ Boğa (Toprak / Sabit / Venüs):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Maddi ve manevi köklenme, üretkenlik, istikrar arayışı ve estetik değer yaratma yeteneği.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-sky-400 mb-3">
                <Text style={styles.signTitleText} className="text-sky-300 font-bold text-sm font-sans">♊ İkizler (Hava / Değişken / Merkür):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Zihinsel merak, iletişim hızı, bilgi toplama ve yayma gücü. Çift karakterli ve esnek mizaç.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-indigo-400 mb-3">
                <Text style={styles.signTitleText} className="text-indigo-300 font-bold text-sm font-sans">♋ Yengeç (Su / Öncü / Ay):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Duygusal derinlik, empati, şefkat, yuva ve aile bağları. Koruyucu ve besleyici enerji.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-amber-400 mb-3">
                <Text style={styles.signTitleText} className="text-amber-300 font-bold text-sm font-sans">♌ Aslan (Ateş / Sabit / Güneş):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Yaratıcılık, cömertlik, kendini gururla ifade etme gücü ve liderlik karizması.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-green-400 mb-3">
                <Text style={styles.signTitleText} className="text-green-300 font-bold text-sm font-sans">♍ Başak (Toprak / Değişken / Merkür):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Analitik zeka, titizlik, pratik çözümler üretme, hizmet etme sevgisi ve bedensel şifa enerjisi.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-pink-400 mb-3">
                <Text style={styles.signTitleText} className="text-pink-300 font-bold text-sm font-sans">♎ Terazi (Hava / Öncü / Venüs):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Uyum, adalet, estetik algı, ikili ilişkilerde denge kurma arzusu ve diplomatik zeka.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-purple-400 mb-3">
                <Text style={styles.signTitleText} className="text-purple-300 font-bold text-sm font-sans">♏ Akrep (Su / Sabit / Mars & Plüton):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Krizleri dönüştürme gücü, derin sezgiler, tutku, gizem ve manevi yenilenme kapasitesi.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-yellow-400 mb-3">
                <Text style={styles.signTitleText} className="text-yellow-300 font-bold text-sm font-sans">♐ Yay (Ateş / Değişken / Jüpiter):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">İnançlar, yüksek felsefe, keşif arzusu, vizyonerlik ve sınırları aşan özgürlük tutkusu.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-teal-400 mb-3">
                <Text style={styles.signTitleText} className="text-teal-300 font-bold text-sm font-sans">♑ Oğlak (Toprak / Öncü / Satürn):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Disiplin, sorumluluk, zamanın getirdiği olgunluk, kariyer hedefleri ve kalıcı yapılar kurma azmi.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-cyan-400 mb-3">
                <Text style={styles.signTitleText} className="text-cyan-300 font-bold text-sm font-sans">♒ Kova (Hava / Sabit / Satürn & Uranüs):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Özgün zeka, kolektif vizyonlar, bağımsızlık, yenilikçi ve reformcu bakış açısı.</Text>
              </View>

              <View style={styles.signItem} className="bg-white/5 p-3 rounded-xl border-l-2 border-l-blue-400">
                <Text style={styles.signTitleText} className="text-blue-300 font-bold text-sm font-sans">♓ Balık (Su / Değişken / Jüpiter & Neptün):</Text>
                <Text style={styles.signBodyText} className="text-white/60 text-xs leading-relaxed mt-1">Sonsuz empati, evrensel şefkat, mistik derinlik, ilahi teslimiyet ve güçlü hayal gücü.</Text>
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
            <Text style={styles.introText} className="text-white/70 text-sm leading-relaxed mb-4">
              Gezegenler, ruhumuzun farklı dinamiklerini, yeteneklerini ve yaşam alanlarındaki motivasyonlarını simgeler:
            </Text>

            <View className="space-y-3">
              <View className="mb-3">
                <Text className="text-amber-300 font-bold text-sm font-sans">☀️ Güneş (Güneş):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Öz kimlik, irade, yaşam enerjisi ve bilinçli benlik hedeflerini temsil eder.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-indigo-300 font-bold text-sm font-sans">🌙 Ay (Ay):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Duygusal ihtiyaçlar, sezgiler, bilinçaltı ve günün enerjisel ritimlerini yönetir.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-sky-300 font-bold text-sm font-sans">💬 Merkür (Utarit):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Zeka, mantık, iletişim, eğitim yetenekleri ve geleneksel Ebced kodlamalarıyla ilişkilidir.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-pink-300 font-bold text-sm font-sans">💞 Venüs (Zühre):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Aşk, ikili ilişkiler, değerler, güzellik algısı, finansal bereket ve cazibeyi simgeler.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-rose-300 font-bold text-sm font-sans">🔥 Mars (Merih):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Eyleme geçme gücü, hırs, cesaret, fiziksel dayanıklılık ve mücadele enerjisi.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-yellow-300 font-bold text-sm font-sans">🌟 Jüpiter (Müşteri):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Bolluk, şans, büyüme, bilgelik arayışı ve maddi/manevi genişleme fırsatları.</Text>
              </View>
              <View className="mb-3">
                <Text className="text-teal-300 font-bold text-sm font-sans">🪐 Satürn (Zühal):</Text>
                <Text className="text-white/60 text-xs leading-relaxed mt-1">Disiplin, sınırlar, karma, sorumluluklar, zamanın getirdiği sınavlar ve sabır.</Text>
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
            <Text style={styles.introText} className="text-white/70 text-sm leading-relaxed mb-4">
              Haritadaki 12 ev, doğum anındaki gökyüzünün yerel ufkuna göre bölünmesidir ve hayatın hangi sahnelerinde enerjimizi harcayacağımızı belirler:
            </Text>

            <View className="space-y-2">
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">1. Ev (Yükselen / ASC): </Text>Karakter yapısı, dış dünyaya sunulan maske, ilk intiba ve fiziksel mizaç.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">2. Ev: </Text>Finansal kaynaklar, kazançlar, maddi güvence ve kişisel öz-değer duygusu.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">3. Ev: </Text>Yakın çevre, kardeşler, mantıksal zihin, ilk eğitim süreçleri ve kısa seyahatler.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">4. Ev: </Text>Aile, kökler, çocukluk temelleri, ev ve iç dünyadaki en gizli sığınak alanı.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">5. Ev: </Text>Yaratıcılık, aşk ilişkileri, çocuklar, hobiler, oyunlar ve yaşamdan alınan zevk.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">6. Ev: </Text>Günlük çalışma rutinleri, iş ortamı, evcil hayvanlar ve fiziksel beden sağlığı.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">7. Ev (Alçalan / DSC): </Text>Evlilik, ciddi ortaklıklar, açık düşmanlar ve ikili ilişkilerde denge.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">8. Ev: </Text>Miras, eşin parası, krizler, ölüm, manevi dönüşüm, cinsellik ve okült ilimler.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">9. Ev: </Text>Uzak seyahatler, yabancı kültürler, yüksek eğitim, felsefe, din ve vizyonlar.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">10. Ev (Başucu Noktası / MC): </Text>Kariyer, toplumsal statü, başarı, otorite ve hayattaki nihai zirve noktası.</Text>
              <Text className="text-white/80 text-xs leading-relaxed mb-1"><Text className="text-amber-300 font-bold font-sans">11. Ev: </Text>Sosyal gruplar, dernekler, dostluklar, insanlığa faydalı hedefler ve dilekler.</Text>
              <Text className="text-white/80 text-xs leading-relaxed"><Text className="text-amber-300 font-bold font-sans">12. Ev: </Text>Bilinçaltı okyanusu, rüyalar, gizli düşmanlar, inziva, manevi arınma ve teslimiyet.</Text>
            </View>
          </LibrarySection>

          {/* Section 4: Ebced, Yildizname & Rituals */}
          <LibrarySection
            title="Ebced, Yıldızname ve Ritüel İlimleri"
            emoji="📜"
            isOpen={openSection === 3}
            onToggle={() => toggleSection(3)}
          >
            <Text className="text-amber-300 font-bold text-sm mb-2 font-sans">Ebced Hesabı Nedir?</Text>
            <Text className="text-white/60 text-xs leading-relaxed mb-4">
              Ebced, Arap alfabesindeki harflerin sayısal değerlerini temel alan kadim bir matematik sistemidir. İsimlerin sayısal titreşimi hesaplanarak kişinin kader kodları, uyumlu zikir sayıları ve karakter mizaçları üzerinde incelemeler yapılır. Her ismin evrende bir sayısal rezonansı bulunur.
            </Text>

            <Text className="text-amber-300 font-bold text-sm mb-2 font-sans">Yıldızname Nedir?</Text>
            <Text className="text-white/60 text-xs leading-relaxed mb-4">
              Yıldızname, kişinin adı ve anne adının Ebced değerlerinin toplanıp 12'ye bölünmesiyle hesaplanan geleneksel bir Doğu analizidir. Çıkan kalan sayıya göre kişinin yıldız burcu, yönetici yıldızı (gezegeni), uğurlu günü, rengi ve manevi koruma esmaları belirlenir. Fal değildir; isim enerjileriyle gezegen saatlerinin uyumlandırılması ilmidir.
            </Text>

            <Text className="text-amber-300 font-bold text-sm mb-2 font-sans">Gezegen Günleri ve Zikir Bağlantısı</Text>
            <Text className="text-white/60 text-xs leading-relaxed mb-4">
              Kadim ilimlere göre haftanın her günü bir gezegenin enerjisiyle rezonanstadır:
              {"\n"}• Pazar: Güneş (Saygınlık, liderlik - Ya Cami)
              {"\n"}• Pazartesi: Ay (Sezgi, aile, arınma - Ya Kuddüs)
              {"\n"}• Salı: Mars (Cesaret, eylem - Ya Fettah)
              {"\n"}• Çarşamba: Merkür (Zihin, ticaret - Ya Alim)
              {"\n"}• Perşembe: Jüpiter (Bolluk, şans - Ya Rezzak)
              {"\n"}• Cuma: Venüs (Sevgi, muhabbet - Ya Vedud)
              {"\n"}• Cumartesi: Satürn (Disiplin, koruma - Ya Selam)
            </Text>

            <Text className="text-amber-300 font-bold text-sm mb-2 font-sans">Ay Döngüsü ve Kozmik Biyohacking Ritüelleri</Text>
            <Text className="text-white/60 text-xs leading-relaxed">
              Ay'ın evrelerine göre hayatınızı optimize edebilirsiniz:
              {"\n"}• **Yeni Ay (Niyet):** Adaçayı veya üzerlik otu yakarak mekansal arınma yapın. Yeni kararlar ve niyetler belirleyin.
              {"\n"}• **Büyüyen Ay (Gelişim):** Vücudu besleyin, saç kesimi yaptırın (saçı gürleştirir), vitamin takviyeleri alın.
              {"\n"}• **Dolunay (Zirve & Arınma):** Vücutta ödem birikebileceğinden bol su tüketin. Akşam ellerinizi kaya tuzlu suyla yıkayarak negatif enerjileri boşaltın.
              {"\n"}• **Küçülen Ay (Temizlik & Detoks):** Evde derin temizlik yapın, epilasyon yaptırın (etkisi daha kalıcı olur) ve toksin atmak için bitki çayları için.
            </Text>
          </LibrarySection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Saf OLED Siyahı
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
    padding: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
  },
  signTitleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  signBodyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
});
