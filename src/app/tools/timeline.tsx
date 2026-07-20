import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/glass/GlassCard';
import PaywallAdModal from '@/components/ui/PaywallAdModal';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { getTimezoneOffset } from '@/utils/astronomy';
import {
  computeProgressions,
  computeProfection,
  computeFirdaria,
  computeEclipses,
  findSolarReturn,
  isMoonVoidOfCourse,
  findBestDates,
  ElectionalIntent,
  ElectionalWindow,
} from '@/utils/predictions';
import { computeRetroPeriods, formatTurkishDate } from '@/utils/cosmicTools';

const INTENTS: { key: ElectionalIntent; label: string; emoji: string }[] = [
  { key: 'başlangıç', label: 'İş / Başlangıç', emoji: '🚀' },
  { key: 'evlilik', label: 'Evlilik / Nişan', emoji: '💍' },
  { key: 'taşınma', label: 'Taşınma / Ev', emoji: '🏠' },
  { key: 'sağlık', label: 'Sağlık / Tedavi', emoji: '🌿' },
  { key: 'alışveriş', label: 'Alışveriş', emoji: '🛍️' },
  { key: 'yolculuk', label: 'Yolculuk', emoji: '✈️' },
];

export default function TimelineScreen() {
  const { profile, isPremium } = useAuthStore();
  const { computedChart } = useAppStore();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [intent, setIntent] = useState<ElectionalIntent>('başlangıç');
  const [electional, setElectional] = useState<ElectionalWindow[] | null>(null);
  const [electionalLoading, setElectionalLoading] = useState(false);

  // Birth instant (UTC) from profile — needed by progression/profection/firdaria
  const birthUtc = useMemo(() => {
    if (!profile?.birth_date || !profile?.birth_time) return null;
    try {
      const [y, m, d] = profile.birth_date.split('-').map(Number);
      const [h, min] = profile.birth_time.split(':').map(Number);
      const local = new Date(y, m - 1, d, h, min);
      const off = getTimezoneOffset(profile.timezone || 'Europe/Istanbul', local);
      return new Date(Date.UTC(y, m - 1, d, h, min) - off * 3600000);
    } catch {
      return null;
    }
  }, [profile]);

  const predictions = useMemo(() => {
    if (!isPremium || !birthUtc || !computedChart) return null;
    try {
      const prog = computeProgressions(birthUtc, computedChart.houses);
      const prof = computeProfection(birthUtc, computedChart.ascendant);
      const fird = computeFirdaria(prog.ageYears, computedChart.isDayBirth ?? true);
      const natalSun = computedChart.planets.find(p => p.name === 'Sun')!;
      const [, bm, bd] = (profile!.birth_date as string).split('-').map(Number);
      const now = new Date();
      let sr = findSolarReturn(natalSun.longitude, now.getFullYear(), bm, bd);
      if (sr.getTime() < now.getTime() - 15 * 86400000) {
        sr = findSolarReturn(natalSun.longitude, now.getFullYear() + 1, bm, bd);
      }
      const eclipses = computeEclipses(computedChart.planets, computedChart.houses, 24)
        .filter(e => e.date.getTime() > Date.now() - 7 * 86400000);
      const voc = isMoonVoidOfCourse(new Date());
      const retros = computeRetroPeriods(90).filter(p => p.isActive || p.startDate.getTime() < Date.now() + 90 * 86400000);
      return { prog, prof, fird, sr, eclipses, voc, retros };
    } catch (e) {
      console.warn('Prediction computation failed:', e);
      return null;
    }
  }, [isPremium, birthUtc, computedChart, profile]);

  const runElectional = () => {
    setElectionalLoading(true);
    // Heavy scan (30 days × hourly VoC) — defer a tick so the spinner paints
    setTimeout(() => {
      try {
        setElectional(findBestDates(intent, 30));
      } catch (e) {
        console.warn('Electional scan failed:', e);
      } finally {
        setElectionalLoading(false);
      }
    }, 50);
  };

  if (!isPremium) {
    return (
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <GlassCard style={styles.lockedCard}>
              <Ionicons name="lock-closed" size={26} color="#D4AF37" style={{ marginBottom: 10 }} />
              <Text style={styles.lockedTitle}>Kozmik Zamanlama & Öngörü Paneli</Text>
              <Text style={styles.lockedDesc}>
                Niyetinize göre en uygun tarihleri bulan seçim astrolojisi motoru, tutulma takvimi, yıllık profeksiyon,
                firdaria dönemleri, progres Ay ve Güneş Dönüşü haritanız — hepsi gerçek astronomik hesapla, Stellium Elite'e özel.
              </Text>
              <Pressable onPress={() => setPaywallVisible(true)} style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>Elite ile Aç →</Text>
              </Pressable>
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
        <PaywallAdModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onSuccess={() => {}}
          title="Kozmik Zamanlama — Elite"
          description="Seçim astrolojisi motoru, tutulma takvimi, profeksiyon, firdaria ve Güneş Dönüşü analizi Stellium Elite üyelerine özeldir. Elite üyelikte ayrıca hiç reklam görmezsiniz."
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Kozmik Zamanlama — electional engine */}
          <Text style={styles.sectionTitle}>🧭 Kozmik Zamanlama</Text>
          <GlassCard style={styles.card}>
            <Text style={styles.cardDesc}>
              Niyetinizi seçin; motor önümüzdeki 30 günü Ay fazı, 28 menzil, boşlukta Ay ve günün açılarıyla puanlayıp en uygun 3 günü önerir.
            </Text>
            <View style={styles.intentGrid}>
              {INTENTS.map((it) => (
                <Pressable
                  key={it.key}
                  onPress={() => { setIntent(it.key); setElectional(null); }}
                  style={[styles.intentChip, intent === it.key && styles.intentChipActive]}
                >
                  <Text style={styles.intentEmoji}>{it.emoji}</Text>
                  <Text style={[styles.intentLabel, intent === it.key && { color: '#0B0F19' }]}>{it.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={runElectional} style={styles.runBtn} disabled={electionalLoading}>
              {electionalLoading
                ? <ActivityIndicator size="small" color="#0B0F19" />
                : <Text style={styles.runBtnText}>En Uygun 3 Günü Hesapla</Text>}
            </Pressable>

            {electional && electional.map((w, i) => (
              <View key={i} style={styles.electionalRow}>
                <View style={styles.electionalRank}><Text style={styles.electionalRankText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.electionalDate}>{formatTurkishDate(w.date)} — Ay {w.moonSign}, {w.menzilName} menzili</Text>
                  <Text style={styles.electionalReasons}>{w.reasons.join(' • ')}</Text>
                </View>
                <Text style={styles.electionalScore}>{w.score > 0 ? `+${w.score}` : w.score}</Text>
              </View>
            ))}
          </GlassCard>

          {predictions ? (
            <>
              {/* Bugünün durumu */}
              <Text style={styles.sectionTitle}>📍 Şu An</Text>
              <GlassCard style={styles.card}>
                <Text style={styles.rowTitle}>
                  {predictions.voc.voc ? '🌫️ Ay şu an BOŞLUKTA (void-of-course)' : '✅ Ay şu an boşlukta değil'}
                </Text>
                <Text style={styles.rowDesc}>
                  {predictions.voc.voc
                    ? `Yeni girişim ve imzalar için Ay'ın ${predictions.voc.signChangeAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} civarındaki burç değişimini beklemek klasik öğretinin tavsiyesidir.`
                    : `Ay bir sonraki burcuna ${predictions.voc.signChangeAt.toLocaleDateString('tr-TR')} ${predictions.voc.signChangeAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibarıyla geçecek.`}
                </Text>
              </GlassCard>

              {/* Yıllık teknikler */}
              <Text style={styles.sectionTitle}>🗓️ Yıllık Döngüleriniz</Text>
              <GlassCard style={styles.card}>
                <Text style={styles.rowTitle}>Profeksiyon Yılı: {predictions.prof.house}. Ev ({predictions.prof.sign})</Text>
                <Text style={styles.rowDesc}>
                  {predictions.prof.age} yaş yılınız {predictions.prof.theme} temalarına adanmış durumda. Yıl lordunuz: {predictions.prof.yearLord} — bu gezegenin transit hâli, yılınızın havasını belirler.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.rowTitle}>Firdaria: {predictions.fird.majorLord} dönemi{predictions.fird.subLord ? ` / ${predictions.fird.subLord} alt dönemi` : ''}</Text>
                <Text style={styles.rowDesc}>
                  Pers dönem sistemine göre {predictions.fird.majorStartAge}–{predictions.fird.majorEndAge} yaş aralığınız {predictions.fird.majorLord} yönetiminde.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.rowTitle}>Güneş Dönüşü: {formatTurkishDate(predictions.sr)}</Text>
                <Text style={styles.rowDesc}>
                  {predictions.sr.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} — Güneş'in natal konumuna saniye hassasiyetiyle döndüğü an. Yeni yaş yılınızın haritası bu anda kurulur.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.rowTitle}>Progres Ay: {predictions.prog.progressedMoon.sign} ({predictions.prog.progressedMoon.house}. ev)</Text>
                <Text style={styles.rowDesc}>
                  ~2.5 yıllık duygusal ikliminiz {predictions.prog.progressedMoon.sign} tonunda. Bir sonraki burç değişimi ~{predictions.prog.nextMoonSignChangeYears.toFixed(1)} yıl sonra; bir sonraki progres Yeni Ay (büyük iç sıfırlama) ~{predictions.prog.nextProgressedNewMoonYears.toFixed(1)} yıl sonra.
                </Text>
              </GlassCard>

              {/* Tutulmalar */}
              <Text style={styles.sectionTitle}>🌒 Tutulma Takvimi (24 ay)</Text>
              {predictions.eclipses.slice(0, 8).map((e, i) => (
                <GlassCard key={i} style={styles.eclipseCard}>
                  <Text style={styles.rowTitle}>
                    {e.type === 'lunar' ? '🌕' : '🌑'} {e.kind} {e.type === 'lunar' ? 'Ay' : 'Güneş'} Tutulması — {formatTurkishDate(e.date)}
                  </Text>
                  <Text style={styles.rowDesc}>
                    {e.sign} burcunda{e.natalHouse ? `, sizin ${e.natalHouse}. evinizde` : ''}
                    {e.contactedNatal ? ` — natal ${e.contactedNatal} gezegeninize temas ediyor: bu tutulma sizin için kişisel bir dönüm vurgusu taşır.` : '.'}
                  </Text>
                </GlassCard>
              ))}

              {/* 90 gün retro istasyonları */}
              <Text style={styles.sectionTitle}>🔁 90 Gün İçindeki Retro Hareketleri</Text>
              {predictions.retros.length === 0 ? (
                <GlassCard style={styles.card}><Text style={styles.rowDesc}>Önümüzdeki 90 günde retro istasyonu yok.</Text></GlassCard>
              ) : predictions.retros.map((r, i) => (
                <GlassCard key={i} style={styles.eclipseCard}>
                  <Text style={styles.rowTitle}>{r.symbol} {r.planetTR} {r.isActive ? 'retrosu sürüyor' : 'retroya giriyor'}</Text>
                  <Text style={styles.rowDesc}>
                    {formatTurkishDate(r.startDate)} — {r.endDate ? formatTurkishDate(r.endDate) : 'devam ediyor'} ({r.signAtStart} burcunda)
                  </Text>
                </GlassCard>
              ))}
            </>
          ) : (
            <GlassCard style={styles.card}>
              <Text style={styles.rowDesc}>Öngörü panelleri için doğum tarihi ve saati kayıtlı bir profil gerekir.</Text>
            </GlassCard>
          )}

          <Text style={styles.footerNote}>
            Tüm tarihler cihazınızda astronomik formüllerle hesaplanır; yapay zeka tarih üretmez.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0B0F19' },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#D4AF37',
    marginBottom: 10, marginTop: 8,
  },
  card: { marginBottom: 16, padding: 16 },
  cardDesc: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', lineHeight: 18, marginBottom: 12 },
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  intentChip: {
    flexBasis: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  intentChipActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  intentEmoji: { fontSize: 18 },
  intentLabel: { fontFamily: 'Inter', fontSize: 10, fontWeight: '700', color: '#F0F6FC', marginTop: 4, textAlign: 'center' },
  runBtn: {
    backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginBottom: 4,
  },
  runBtnText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '700', color: '#0B0F19' },
  electionalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12,
  },
  electionalRank: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  electionalRankText: { fontFamily: 'InterBold', fontSize: 13, fontWeight: '700', color: '#D4AF37' },
  electionalDate: { fontFamily: 'Inter', fontSize: 13, fontWeight: '700', color: '#F0F6FC' },
  electionalReasons: { fontFamily: 'Inter', fontSize: 10, color: '#8B949E', marginTop: 2, lineHeight: 14 },
  electionalScore: { fontFamily: 'InterBold', fontSize: 15, fontWeight: '700', color: '#D4AF37' },
  rowTitle: { fontFamily: 'Inter', fontSize: 13, fontWeight: '700', color: '#F0F6FC' },
  rowDesc: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', lineHeight: 18, marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  eclipseCard: { marginBottom: 10, padding: 14 },
  footerNote: {
    fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', marginTop: 12, lineHeight: 15,
  },
  lockedCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 18, marginTop: 20 },
  lockedTitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#F0F6FC', textAlign: 'center', marginBottom: 8 },
  lockedDesc: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  unlockBtn: { backgroundColor: '#D4AF37', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 11 },
  unlockBtnText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '700', color: '#0B0F19' },
});
