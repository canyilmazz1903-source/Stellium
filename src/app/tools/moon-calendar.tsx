import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/glass/GlassCard';
import PaywallAdModal from '@/components/ui/PaywallAdModal';
import { useAuthStore } from '@/store/authStore';
import { computeMoonCalendar, MOON_SIGN_GUIDANCE } from '@/utils/cosmicTools';
import { getJulianDaysSinceJ2000, getPlanetLongitude } from '@/utils/astronomy';
import { menzilFromLongitude, menzilGuidance } from '@/utils/menazil';

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const FREE_VISIBLE_DAYS = 7;

export default function MoonCalendarScreen() {
  const { isPremium } = useAuthStore();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const fullCalendar = useMemo(() => computeMoonCalendar(30), []);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  // Free tier: one week visible (check back daily); Elite: full month.
  const calendar = isPremium ? fullCalendar : fullCalendar.slice(0, FREE_VISIBLE_DAYS);
  const keyEvents = fullCalendar.filter(d => d.isNewMoon || d.isFullMoon);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {keyEvents.length > 0 && (
            isPremium ? (
              <View style={styles.eventsRow}>
                {keyEvents.map((d, i) => (
                  <View key={i} style={[styles.eventBadge, d.isFullMoon ? styles.fullMoonBadge : styles.newMoonBadge]}>
                    <Text style={styles.eventBadgeSymbol}>{d.isFullMoon ? '🌕' : '🌑'}</Text>
                    <Text style={styles.eventBadgeTitle}>{d.isFullMoon ? 'Dolunay' : 'Yeni Ay'}</Text>
                    <Text style={styles.eventBadgeDate}>
                      {d.date.getDate()} {MONTHS_TR[d.date.getMonth()]} • {d.moonSign}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable onPress={() => setPaywallVisible(true)} style={styles.eventsRow}>
                {keyEvents.map((d, i) => (
                  <View key={i} style={[styles.eventBadge, d.isFullMoon ? styles.fullMoonBadge : styles.newMoonBadge]}>
                    <Text style={styles.eventBadgeSymbol}>{d.isFullMoon ? '🌕' : '🌑'}</Text>
                    <Text style={styles.eventBadgeTitle}>{d.isFullMoon ? 'Dolunay' : 'Yeni Ay'}</Text>
                    <Text style={styles.eventBadgeDate}>🔒 Tarihi Elite ile gör</Text>
                  </View>
                ))}
              </Pressable>
            )
          )}

          <Text style={styles.sectionTitle}>{isPremium ? 'Önümüzdeki 30 Gün' : 'Önümüzdeki 7 Gün'}</Text>
          {calendar.map((d, idx) => {
            const isExpanded = expandedIdx === idx;
            const isEvent = d.isNewMoon || d.isFullMoon;
            const menzil = menzilFromLongitude(getPlanetLongitude('Moon', getJulianDaysSinceJ2000(d.date)));
            return (
              <Pressable key={idx} onPress={() => setExpandedIdx(isExpanded ? null : idx)}>
                <GlassCard style={[
                  styles.dayCard,
                  d.isToday ? styles.todayCard : null,
                  isEvent ? styles.eventCard : null,
                ]}>
                  <View style={styles.dayRow}>
                    <View style={styles.dateCol}>
                      <Text style={[styles.dayNum, d.isToday && { color: '#D4AF37' }]}>{d.date.getDate()}</Text>
                      <Text style={styles.monthText}>{MONTHS_TR[d.date.getMonth()]}</Text>
                    </View>
                    <Text style={styles.phaseSymbol}>{d.phaseSymbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.phaseName}>
                        {d.phaseName}
                        {d.isToday ? '  •  BUGÜN' : ''}
                      </Text>
                      <Text style={styles.signText}>{d.signSymbol} Ay {d.moonSign} burcunda • {WEEKDAYS_TR[d.date.getDay()]}</Text>
                      <Text style={styles.menzilText}>☾ {menzil.index}. Menzil: {menzil.name} — {menzil.natureTR}</Text>
                    </View>
                    {isEvent && (
                      <View style={styles.eventTag}>
                        <Text style={styles.eventTagText}>{d.isFullMoon ? 'DOLUNAY' : 'YENİ AY'}</Text>
                      </View>
                    )}
                  </View>
                  {isExpanded && (
                    <Text style={styles.guidanceText}>
                      {MOON_SIGN_GUIDANCE[d.moonSign] || 'Ay bu burçta kendine has bir ritim taşır.'}
                      {'\n\n☾ '}{menzilGuidance(menzil)}
                      {d.isNewMoon ? '\n\n🌑 Yeni Ay: Niyet tohumları ekmek, yeni başlangıçlar planlamak ve sayfa açmak için ayın en güçlü günü.' : ''}
                      {d.isFullMoon ? '\n\n🌕 Dolunay: Tamamlanma, hasat ve bırakma günü. Şükran pratiği ve enerji temizliği için idealdir.' : ''}
                    </Text>
                  )}
                </GlassCard>
              </Pressable>
            );
          })}

          {!isPremium && (
            <GlassCard style={styles.lockedCard}>
              <Ionicons name="lock-closed" size={22} color="#D4AF37" style={{ marginBottom: 8 }} />
              <Text style={styles.lockedTitle}>Ayın kalan {30 - FREE_VISIBLE_DAYS} günü Elite üyelere özel</Text>
              <Text style={styles.lockedDesc}>
                Yeni Ay & Dolunay tarihlerini, tüm burç geçişlerini ve 30 günlük Ay rehberliğini tek bakışta görün —
                her gün tek tek kontrol etmek zorunda kalmayın.
              </Text>
              <Pressable onPress={() => setPaywallVisible(true)} style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>Tüm Takvimi Aç →</Text>
              </Pressable>
            </GlassCard>
          )}

          <Text style={styles.footerNote}>
            Satıra dokunarak o günün Ay rehberliğini açabilirsiniz. Hesaplamalar cihazınızda yapılır.
          </Text>
        </ScrollView>
      </SafeAreaView>

      <PaywallAdModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {}}
        title="Ay Takvimi — Elite"
        description="30 günlük Ay evreleri, tüm burç geçişleri ve kesin Yeni Ay & Dolunay tarihleri Stellium Elite ile otomatik önünüzde. Elite üyelikte ayrıca hiç reklam görmezsiniz."
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
  eventsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  eventBadge: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  newMoonBadge: {
    backgroundColor: 'rgba(178, 247, 239, 0.05)',
    borderColor: 'rgba(178, 247, 239, 0.25)',
  },
  fullMoonBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.07)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  eventBadgeSymbol: {
    fontSize: 22,
  },
  eventBadgeTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#F0F6FC',
    marginTop: 4,
  },
  eventBadgeDate: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 12,
  },
  dayCard: {
    marginBottom: 8,
    padding: 12,
  },
  todayCard: {
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  eventCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateCol: {
    alignItems: 'center',
    width: 36,
  },
  dayNum: {
    fontFamily: 'InterBold',
    fontSize: 17,
    fontWeight: '700',
    color: '#F0F6FC',
  },
  monthText: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#8B949E',
    textTransform: 'uppercase',
  },
  phaseSymbol: {
    fontSize: 22,
  },
  phaseName: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F6FC',
  },
  signText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 2,
  },
  menzilText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.75)',
    marginTop: 2,
  },
  eventTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  eventTagText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
  },
  guidanceText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF0',
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerNote: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 12,
  },
  lockedCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 8,
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
