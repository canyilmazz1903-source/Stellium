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
    <GlassCard style={styles.sectionCard}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Kozmik Kütüphane</Text>
          <Text style={styles.subtitle}>Astroloji ve Analitik Psikoloji Sözlüğü</Text>
        </View>

        <View style={styles.content}>
          {/* Section 1: Zodiac Signs */}
          <LibrarySection
            title="Zodyak Arketipleri (12 Burç)"
            emoji="✨"
            isOpen={openSection === 0}
            onToggle={() => toggleSection(0)}
          >
            <Text style={styles.introText}>
              Burçlar, insan psişesindeki evrensel kalıpları (arketipleri) temsil eden sembolik enerjilerdir:
            </Text>
            
            <View style={styles.signList}>
              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♈ Koç (Savaşçı / The Warrior):</Text>
                <Text style={styles.signBodyText}>Ego inisiyatifi, saf irade, bağımsızlık ve öncülük dürtüsü. Bireyleşme yolunda cesurca adım atma enerjisi.</Text>
              </View>
              
              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♉ Boğa (Muhafız / The Builder):</Text>
                <Text style={styles.signBodyText}>Maddi ve manevi köklenme, üretkenlik, doğayla uyum ve kalıcı değer yaratma isteği. İstikrar arayışı.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♊ İkizler (Haberci / The Messenger):</Text>
                <Text style={styles.signBodyText}>Entelektüel merak, bilgi toplama ve yayma, zihinsel esneklik, zıtlıklar arasında köprü kurma gücü.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♋ Yengeç (Besleyici / The Nurturer):</Text>
                <Text style={styles.signBodyText}>Duygusal kökler, aile bağı, şefkat, empati yeteneği. Hassas iç dünyayı koruma ve büyütme enerjisi.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♌ Aslan (Hükümdar / The Sovereign):</Text>
                <Text style={styles.signBodyText}>Yaratıcı cömertlik, parıldama, kendini cesurca sahneleme, içsel bütünlüğü ve krallığı gururla sergileme.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♍ Başak (Şifacı / The Analyst):</Text>
                <Text style={styles.signBodyText}>Analitik saflaştırma, faydalı olma, ustalık ve zanaat. Kusursuz bir düzen ararken esnekliği öğrenme.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♎ Terazi (Dengeleyici / The Peacemaker):</Text>
                <Text style={styles.signBodyText}>Uyum, adalet, estetik algı, ilişkilerdeki denge. "Ben" ve "Biz" arasındaki diplomatik köprü.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♏ Akrep (Dönüştürücü / The Alchemist):</Text>
                <Text style={styles.signBodyText}>Kişisel gölgelerle yüzleşme, ölüm-yeniden doğum krizleri, derin sezgiler ve ruhsal simya (transformation).</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♐ Yay (Kaşif / The Seeker):</Text>
                <Text style={styles.signBodyText}>Yüksek anlam, felsefi arayış, inançlar, vizyonerlik ve özgürlük tutkusu. Yaşamın bilgeliğine seyahat.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♑ Oğlak (Yönetici / The Architect):</Text>
                <Text style={styles.signBodyText}>Toplumsal inşa, sorumluluk, disiplin, zamanın sınırlarını kabul ederek kalıcı ve saygın yapılar kurma.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♒ Kova (Devrimci / The Reformer):</Text>
                <Text style={styles.signBodyText}>Kolektif bilinç, özgünlük, bağımsız zihin, hümanist idealler ve sınırları aşan devrimci vizyonlar.</Text>
              </View>

              <View style={styles.signItem}>
                <Text style={styles.signTitleText}>♓ Balık (Mistik / The Dreamer):</Text>
                <Text style={styles.signBodyText}>Sonsuz teslimiyet, evrensel şefkat, kolektif bilinçdışı okyanusunda kaybolmadan birliği ve şifayı deneyimleme.</Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 2: Four Elements */}
          <LibrarySection
            title="Dört Element ve Psikolojik Fonksiyonlar"
            emoji="🔥"
            isOpen={openSection === 1}
            onToggle={() => toggleSection(1)}
          >
            <Text style={styles.introText}>
              Astrolojideki dört temel element, Carl Jung'un tanımladığı dört temel psikolojik fonksiyonla (algı kapısıyla) kusursuz bir uyum içindedir:
            </Text>

            <View style={styles.elementList}>
              <View style={styles.elementItem}>
                <Text style={styles.elementTitleText}>🔥 Ateş Elementi - SEZGİ (Intuition):</Text>
                <Text style={styles.signBodyText}>
                  Koç, Aslan, Yay. Gelecek olasılıklarını anında yakalama, ilham, eyleme geçme dürtüsü ve içgüdüsel bilme yeteneğidir. Mantıksal çıkarımlarla değil, vizyonlarla hareket eder.
                </Text>
              </View>

              <View style={styles.elementItem}>
                <Text style={styles.elementTitleText}>🌳 Toprak Elementi - DUYUM (Sensation):</Text>
                <Text style={styles.signBodyText}>
                  Boğa, Başak, Oğlak. Beş duyu organıyla algılanabilen somut gerçekliği, şimdiki anı ve pratik yaşamı temsil eder. Ayakları yere basan, rasyonel ve gerçekçi algıdır.
                </Text>
              </View>

              <View style={styles.elementItem}>
                <Text style={styles.elementTitleText}>💨 Hava Elementi - DÜŞÜNME (Thinking):</Text>
                <Text style={styles.signBodyText}>
                  İkizler, Terazi, Kova. Olayları objektif analiz etme, kavramlaştırma, mantık süzgecinden geçirme ve dilsel iletişim kurma fonksiyonudur. Tarafsız kararlar verir.
                </Text>
              </View>

              <View style={styles.elementItem}>
                <Text style={styles.elementTitleText}>💧 Su Elementi - HİSSETME (Feeling):</Text>
                <Text style={styles.signBodyText}>
                  Yengeç, Akrep, Balık. Durumların veya insanların manevi ve sübjektif değerini ölçer. Empati, duygusal rezonans, şefkat ve içsel derinlik vasıtasıyla hayatı anlamlandırır.
                </Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 3: Twelve Houses */}
          <LibrarySection
            title="Yaşam Alanları (12 Ev)"
            emoji="🏠"
            isOpen={openSection === 2}
            onToggle={() => toggleSection(2)}
          >
            <Text style={styles.introText}>
              Haritadaki 12 Ev, psikolojik potansiyellerimizin hayatın hangi somut sahnelerinde (ilişki, kariyer, iç dünya vb.) deneyimleneceğini gösterir:
            </Text>

            <View style={styles.houseGrid}>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>1. Ev (Persona / Yükselen):</Text>
                <Text style={styles.houseBodyText}>Dış dünyaya yansıttığımız maske, ilk intiba ve fiziksel duruş.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>2. Ev (Maddi ve Öz-Değerler):</Text>
                <Text style={styles.houseBodyText}>Finansal kaynaklarımız ve kendimize atfettiğimiz içsel değer.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>3. Ev (Gündelik Zihin & İletişim):</Text>
                <Text style={styles.houseBodyText}>Kısa seyahatler, kardeşler, mantıksal zihin ve temel iletişim.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>4. Ev (Bilinçdışı Kökler / Yuva):</Text>
                <Text style={styles.houseBodyText}>Aile geçmişi, childluk temelleri ve bilinçdışının en derin tabanı.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>5. Ev (Yaratıcılık & İçsel Çocuk):</Text>
                <Text style={styles.houseBodyText}>Aşk, sahne, hobiler, oyunlar ve egonun saf neşeyle kendini ifadesi.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>6. Ev (Hizmet, Sağlık & Rutinler):</Text>
                <Text style={styles.houseBodyText}>Günlük çalışma, fiziksel beden sağlığı ve pratik iş bitiricilik.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>7. Ev (Gölge Yansıtmaları / İlişkiler):</Text>
                <Text style={styles.houseBodyText}>Evlilik, ortaklıklar ve kendi içimizde fark etmediğimiz ötekiler.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>8. Ev (Krizler & Kolektif Dönüşüm):</Text>
                <Text style={styles.houseBodyText}>Miras, krizler, ölüm, cinsellik ve derin psikolojik dönüşüm.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>9. Ev (Felsefe, Yüksek Bilgi & İnanç):</Text>
                <Text style={styles.houseBodyText}>Uzak seyahatler, üniversite eğitimi, yaşam inançları ve ahlak.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>10. Ev (Toplumsal Rol / MC):</Text>
                <Text style={styles.houseBodyText}>Kariyer, saygınlık, toplumsal zirve ve bireyleşme meyvesi.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>11. Ev (Ortak Vizyonlar & Dostluk):</Text>
                <Text style={styles.houseBodyText}>Sosyal gruplar, dernekler, insanlık idealleri ve ümitlerimiz.</Text>
              </View>
              <View style={styles.houseItem}>
                <Text style={styles.houseTitleText}>12. Ev (İnziva & Bilinçdışı Okyanusu):</Text>
                <Text style={styles.houseBodyText}>Rüyalar, bastırılmış korkular, kolektif hafıza ve ilahi teslimiyet.</Text>
              </View>
            </View>
          </LibrarySection>

          {/* Section 4: Jungian Astrology */}
          <LibrarySection
            title="Bireyleşme ve Astroloji Manifestosu"
            emoji="📜"
            isOpen={openSection === 3}
            onToggle={() => toggleSection(3)}
          >
            <Text style={styles.manifestoTitle}>Gökyüzündeki Aynanın Psikolojisi</Text>
            <Text style={styles.manifestoParagraph}>
              Carl Gustav Jung, hastalarının rüyalarını ve psikolojik krizlerini anlamak için astroloji haritalarından sıklıkla faydalanmıştır. Ona göre astroloji, insanlığın kolektif bilinçdışındaki arketipleri (evrensel psikolojik dinamikleri) gökyüzüne yansıttığı binlerce yıllık eşsiz bir yansıtma (projeksiyon) alanıdır.
            </Text>
            <Text style={styles.manifestoParagraph}>
              Bir doğum haritası (Natal Chart), ruhumuzun parçalanmış durumunu simgeleyen bir mandaladır. Haritadaki gezegenler (Güneş, Ay, Mars vb.) iç dünyamızdaki farklı alt kişilikleri ve enerjileri temsil eder. Bireyleşme (Individuation) süreci, bu farklı gezegenlerin fısıldadığı arketipsel ihtiyaçları bilince çıkarıp birbirleriyle savaştırmadan tek bir merkezde (Self / Öz-Benlik) bütünleştirmektir.
            </Text>
            <Text style={styles.manifestoParagraph}>
              Astrologic uygulamasının amacı, göksel sembolleri fal veya kehanet olarak değil, kendi içinizdeki gölge (Shadow), anima, animus ve persona dengesini gözlemleyebileceğiniz psikolojik bir ayna olarak kullanmanızı sağlamaktır. Ritimleri fark ettiğinizde, gökyüzünün dışsal bir güç olmadığını, kendi içinizin bir yansıması olduğunu keşfedeceksiniz.
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
    backgroundColor: '#0D1117',
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
    fontFamily: 'Cinzel',
    fontSize: 15,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  sectionContent: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
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
    borderLeftColor: 'rgba(212, 175, 55, 0.4)',
  },
  signTitleText: {
    fontFamily: 'Cinzel',
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 4,
  },
  signBodyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  elementList: {
    gap: 14,
  },
  elementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D4AF37',
  },
  elementTitleText: {
    fontFamily: 'Cinzel',
    fontSize: 13.5,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 6,
  },
  houseGrid: {
    gap: 12,
  },
  houseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 10,
  },
  houseTitleText: {
    fontFamily: 'Cinzel',
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 4,
  },
  houseBodyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  manifestoTitle: {
    fontFamily: 'Cinzel',
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  manifestoParagraph: {
    fontFamily: 'Inter',
    fontSize: 13.5,
    color: '#8B949E',
    lineHeight: 21,
    marginBottom: 14,
  },
});
