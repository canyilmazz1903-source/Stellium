import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/glass/GlassCard';
import PaywallAdModal from '@/components/ui/PaywallAdModal';
import { useAuthStore } from '@/store/authStore';
import { computeRetroPeriods, formatTurkishDate, RETRO_MEANINGS } from '@/utils/cosmicTools';

export default function RetroCalendarScreen() {
  const { isPremium } = useAuthStore();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const periods = useMemo(() => computeRetroPeriods(400), []);
  const activeOnes = periods.filter(p => p.isActive);
  const upcoming = periods.filter(p => !p.isActive);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.introText}>
            Retro (geri hareket), bir gezegenin Dünya'dan bakıldığında gökyüzünde geriye gidiyor gibi görünmesidir.
            Astrolojide bu dönemler, o gezegenin yönettiği konuların dışa dönük ilerlemek yerine gözden geçirilmesi,
            onarılması ve içselleştirilmesi gereken zaman dilimleri olarak yorumlanır.
          </Text>

          {activeOnes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔴 Şu An Retroda</Text>
              {activeOnes.map((p, idx) => (
                <GlassCard key={`a-${idx}`} style={[styles.card, styles.activeCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.planetSymbol}>{p.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planetName}>{p.planetTR} Retrosu <Text style={styles.retroBadge}>℞ AKTİF</Text></Text>
                      <Text style={styles.dateRange}>
                        {formatTurkishDate(p.startDate)} — {p.endDate ? formatTurkishDate(p.endDate) : 'devam ediyor'}
                      </Text>
                      <Text style={styles.signInfo}>{p.signAtStart} burcunda başladı</Text>
                    </View>
                  </View>
                  {RETRO_MEANINGS[p.planet] && (
                    <>
                      <Text style={styles.themeText}>⚡ {RETRO_MEANINGS[p.planet].theme}</Text>
                      <Text style={styles.adviceText}>{RETRO_MEANINGS[p.planet].advice}</Text>
                    </>
                  )}
                </GlassCard>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>📅 Yaklaşan Retro Dönemleri</Text>
          {!isPremium ? (
            // Free tier sees only the live status above; forward planning
            // (upcoming windows with dates) is the Elite value.
            <GlassCard style={[styles.card, styles.lockedCard]}>
              <Ionicons name="lock-closed" size={22} color="#D4AF37" style={{ marginBottom: 8 }} />
              <Text style={styles.lockedTitle}>Önümüzdeki 13 ayın retro tarihleri Elite üyelere özel</Text>
              <Text style={styles.lockedDesc}>
                {upcoming.length} yaklaşan retro penceresi hesaplandı. Hangi gezegenin ne zaman retroya gireceğini önceden bilerek
                imza, seyahat ve yatırım planlarınızı kozmik takvime göre yapın.
              </Text>
              <Pressable onPress={() => setPaywallVisible(true)} style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>Retro Takvimini Aç →</Text>
              </Pressable>
            </GlassCard>
          ) : upcoming.length === 0 ? (
            <GlassCard style={styles.card}>
              <Text style={styles.adviceText}>Önümüzdeki dönemde hesaplanan yeni retro penceresi bulunmuyor.</Text>
            </GlassCard>
          ) : (
            upcoming.map((p, idx) => (
              <GlassCard key={`u-${idx}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.planetSymbol}>{p.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planetName}>{p.planetTR} Retrosu</Text>
                    <Text style={styles.dateRange}>
                      {formatTurkishDate(p.startDate)} — {p.endDate ? formatTurkishDate(p.endDate) : 'ufuk ötesi'}
                    </Text>
                    <Text style={styles.signInfo}>{p.signAtStart} burcunda başlayacak</Text>
                  </View>
                </View>
                {RETRO_MEANINGS[p.planet] && (
                  <Text style={styles.themeText}>⚡ {RETRO_MEANINGS[p.planet].theme}</Text>
                )}
              </GlassCard>
            ))
          )}

          <Text style={styles.footerNote}>
            Hesaplamalar cihazınızda astronomik formüllerle yapılır; retro başlangıç/bitiş günlerinde ±1 gün sapma olabilir.
          </Text>
        </ScrollView>
      </SafeAreaView>

      <PaywallAdModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {}}
        title="Retro Takvimi — Elite"
        description="Tüm gezegenlerin önümüzdeki 13 aylık retro başlangıç ve bitiş tarihlerine erişin, hayatınızı gökyüzüne göre önceden planlayın. Elite üyelikte ayrıca hiç reklam görmezsiniz."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  introText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  activeCard: {
    borderColor: 'rgba(248, 173, 157, 0.5)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  planetSymbol: {
    fontSize: 28,
    color: '#D4AF37',
  },
  planetName: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#F0F6FC',
  },
  retroBadge: {
    fontSize: 11,
    color: '#F8AD9D',
    fontWeight: '700',
  },
  dateRange: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 2,
  },
  signInfo: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 1,
  },
  themeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#E6EDF0',
    marginTop: 4,
  },
  adviceText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 18,
    marginTop: 6,
  },
  footerNote: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 15,
  },
  lockedCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  lockedTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F6FC',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  unlockBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  unlockBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F19',
  },
});
