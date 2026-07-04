import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import GlassCard from '@/components/glass/GlassCard';
import { computeMoonCalendar, MOON_SIGN_GUIDANCE } from '@/utils/cosmicTools';

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function MoonCalendarScreen() {
  const calendar = useMemo(() => computeMoonCalendar(30), []);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const keyEvents = calendar.filter(d => d.isNewMoon || d.isFullMoon);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {keyEvents.length > 0 && (
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
          )}

          <Text style={styles.sectionTitle}>Önümüzdeki 30 Gün</Text>
          {calendar.map((d, idx) => {
            const isExpanded = expandedIdx === idx;
            const isEvent = d.isNewMoon || d.isFullMoon;
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
                      {d.isNewMoon ? '\n\n🌑 Yeni Ay: Niyet tohumları ekmek, yeni başlangıçlar planlamak ve sayfa açmak için ayın en güçlü günü.' : ''}
                      {d.isFullMoon ? '\n\n🌕 Dolunay: Tamamlanma, hasat ve bırakma günü. Şükran pratiği ve enerji temizliği için idealdir.' : ''}
                    </Text>
                  )}
                </GlassCard>
              </Pressable>
            );
          })}

          <Text style={styles.footerNote}>
            Satıra dokunarak o günün Ay rehberliğini açabilirsiniz. Hesaplamalar cihazınızda yapılır.
          </Text>
        </ScrollView>
      </SafeAreaView>
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
});
