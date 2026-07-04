// Local, network-free cosmic tools: retrograde period scanner, 30-day moon
// calendar and the deterministic daily card. All pure math on top of the
// existing astronomy engine.

import { getJulianDaysSinceJ2000, getPlanetLongitude, getZodiacSign } from './astronomy';
import { planetNameTR } from './interpretations';

// ---------- Retrograde calendar ----------

export interface RetroPeriod {
  planet: string;
  planetTR: string;
  symbol: string;
  startDate: Date;
  endDate: Date | null; // null = still retrograde at scan horizon
  isActive: boolean;    // retro right now
  signAtStart: string;
}

const RETRO_SYMBOLS: Record<string, string> = {
  Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃',
  Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

// Daily longitude delta with wraparound; negative = retrograde motion.
function dailyDelta(planet: string, jd: number): number {
  const lon1 = getPlanetLongitude(planet, jd);
  const lon2 = getPlanetLongitude(planet, jd + 1);
  return ((lon2 - lon1 + 540) % 360) - 180;
}

// Scan the next `days` days (plus a lookback so an in-progress retro gets its
// real start date) and return every retrograde window per planet.
export function computeRetroPeriods(daysAhead = 400, lookbackDays = 90): RetroPeriod[] {
  const periods: RetroPeriod[] = [];
  const now = new Date();
  const jdToday = getJulianDaysSinceJ2000(now);

  for (const planet of Object.keys(RETRO_SYMBOLS)) {
    let inRetro = false;
    let start: number | null = null;

    for (let offset = -lookbackDays; offset <= daysAhead; offset++) {
      const jd = jdToday + offset;
      const retro = dailyDelta(planet, jd) < 0;

      if (retro && !inRetro) {
        inRetro = true;
        start = offset;
      } else if (!retro && inRetro) {
        inRetro = false;
        // Only keep windows that end today or later (skip fully-past ones)
        if (start !== null && offset >= 0) {
          periods.push(buildPeriod(planet, now, jdToday, start, offset));
        }
        start = null;
      }
    }
    // Still retro at the end of the horizon
    if (inRetro && start !== null) {
      periods.push(buildPeriod(planet, now, jdToday, start, null));
    }
  }

  periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return periods;
}

function buildPeriod(planet: string, now: Date, jdToday: number, startOffset: number, endOffset: number | null): RetroPeriod {
  const startDate = new Date(now.getTime() + startOffset * 86400000);
  const endDate = endOffset !== null ? new Date(now.getTime() + endOffset * 86400000) : null;
  const signAtStart = getZodiacSign(getPlanetLongitude(planet, jdToday + startOffset)).turkish;
  return {
    planet,
    planetTR: planetNameTR(planet),
    symbol: RETRO_SYMBOLS[planet],
    startDate,
    endDate,
    isActive: startOffset <= 0 && (endOffset === null || endOffset > 0),
    signAtStart,
  };
}

export function formatTurkishDate(date: Date): string {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Traditional guidance shown per retro planet.
export const RETRO_MEANINGS: Record<string, { theme: string; advice: string }> = {
  Mercury: {
    theme: 'İletişim, teknoloji, sözleşmeler ve seyahat aksaklıkları',
    advice: 'Önemli imzaları ve büyük teknoloji alışverişlerini mümkünse retro sonrasına erteleyin. "Yeniden" ekiyle başlayan işler (yeniden gözden geçirme, yeniden bağlantı kurma, revize etme) için ise altın dönemdir.',
  },
  Venus: {
    theme: 'İlişkiler, değerler, estetik ve finans gözden geçirmesi',
    advice: 'Eski aşklar ve geçmiş ilişki temaları yüzeye çıkabilir. Büyük estetik operasyonları ve gösterişli alımlar için ideal zaman değildir; kalbinizin gerçek değerlerini sorgulamak için idealdir.',
  },
  Mars: {
    theme: 'Enerji, motivasyon ve girişim gücünde içe dönüş',
    advice: 'Yeni büyük girişimler başlatmak yerine mevcut projeleri güçlendirin. Bastırılmış öfkeler yüzeye çıkabilir; sporla ve bilinçli nefesle enerjiyi dönüştürün.',
  },
  Jupiter: {
    theme: 'İnançlar, büyüme planları ve fırsatların iç değerlendirmesi',
    advice: 'Dış genişleme yavaşlar, iç bilgelik büyür. Eğitim ve felsefi konularda derinleşmek, büyüme stratejinizi gözden geçirmek için verimli bir dönemdir.',
  },
  Saturn: {
    theme: 'Sorumluluklar, yapılar ve sınırların yeniden inşası',
    advice: 'Hayatınızdaki yapıların (iş, düzen, taahhütler) ne kadar sağlam olduğu test edilir. Temeli zayıf olanı onarmak için bilinçli çaba gösterin; sağlam olan güçlenerek çıkar.',
  },
  Uranus: {
    theme: 'Özgürlük ihtiyacının ve ani değişimlerin içselleştirilmesi',
    advice: 'Değişim isteğiniz içe döner: dış devrimler yerine iç devrimler dönemi. Hangi alışkanlıkların sizi gerçekten kısıtladığını görmek için güçlü bir farkındalık penceresi.',
  },
  Neptune: {
    theme: 'Hayaller, sezgiler ve ruhsal arayışın berraklaşması',
    advice: 'İllüzyonlar incelir: kimi ve neyi idealize ettiğinizi daha net görürsünüz. Rüya günlüğü tutmak ve meditasyon bu dönemde olağanüstü verimlidir.',
  },
  Pluto: {
    theme: 'Derin dönüşüm süreçlerinin iç katmanlarda işlenmesi',
    advice: 'Güç, kontrol ve bırakma temaları iç dünyanızda işlenir. Psikolojik gölge çalışması ve terapi için yılın en derin kazı dönemidir.',
  },
};

// ---------- 30-day Moon calendar ----------

export interface MoonCalendarDay {
  date: Date;
  moonSign: string;
  signSymbol: string;
  phaseName: string;
  phaseSymbol: string;
  isNewMoon: boolean;
  isFullMoon: boolean;
  isToday: boolean;
}

function phaseFromElongation(diff: number): { name: string; symbol: string } {
  if (diff >= 352.5 || diff < 7.5) return { name: 'Yeni Ay', symbol: '🌑' };
  if (diff < 82.5) return { name: 'Hilal (Büyüyen)', symbol: '🌒' };
  if (diff < 97.5) return { name: 'İlk Dördün', symbol: '🌓' };
  if (diff < 172.5) return { name: 'Şişkin Ay (Büyüyen)', symbol: '🌔' };
  if (diff < 187.5) return { name: 'Dolunay', symbol: '🌕' };
  if (diff < 262.5) return { name: 'Şişkin Ay (Küçülen)', symbol: '🌖' };
  if (diff < 277.5) return { name: 'Son Dördün', symbol: '🌗' };
  return { name: 'Balsamik Ay (Küçülen)', symbol: '🌘' };
}

export function computeMoonCalendar(days = 30): MoonCalendarDay[] {
  const result: MoonCalendarDay[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Pre-compute daily elongations (one extra day each side for exact
  // new/full moon detection via local minima/maxima of phase distance).
  const elongations: number[] = [];
  for (let i = -1; i <= days; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const jd = getJulianDaysSinceJ2000(d);
    let diff = getPlanetLongitude('Moon', jd) - getPlanetLongitude('Sun', jd);
    if (diff < 0) diff += 360;
    elongations.push(diff);
  }

  const distTo = (angle: number, target: number) => {
    const d = Math.abs(angle - target) % 360;
    return Math.min(d, 360 - d);
  };

  for (let i = 0; i < days; i++) {
    const date = new Date(today.getTime() + i * 86400000);
    const jd = getJulianDaysSinceJ2000(date);
    const moonLon = getPlanetLongitude('Moon', jd);
    const signInfo = getZodiacSign(moonLon);
    const el = elongations[i + 1];
    const phase = phaseFromElongation(el);

    // Exact event day = local minimum of distance to 0° (new) / 180° (full)
    const newDist = distTo(el, 0);
    const isNewMoon = newDist < 7 && newDist <= distTo(elongations[i], 0) && newDist <= distTo(elongations[i + 2], 0);
    const fullDist = distTo(el, 180);
    const isFullMoon = fullDist < 7 && fullDist <= distTo(elongations[i], 180) && fullDist <= distTo(elongations[i + 2], 180);

    result.push({
      date,
      moonSign: signInfo.turkish,
      signSymbol: signInfo.symbol,
      phaseName: phase.name,
      phaseSymbol: phase.symbol,
      isNewMoon,
      isFullMoon,
      isToday: i === 0,
    });
  }
  return result;
}

// Guidance per moon sign for the calendar detail rows.
export const MOON_SIGN_GUIDANCE: Record<string, string> = {
  'Koç': 'Enerji yüksek, sabır düşük: fiziksel aktivite ve cesur başlangıçlar için uygun; önemli tartışmaları ertelemek akıllıca.',
  'Boğa': 'Konfor, bereket ve duyusal keyif günü: finansal planlama, bahçe/ev işleri ve güzel yemekler için ideal.',
  'İkizler': 'Zihin hızlanır: yazışmalar, kısa yolculuklar, öğrenme ve sosyal bağlantılar akışta.',
  'Yengeç': 'Duygular derinleşir: aile, ev ve iç dünya ile ilgilenin; duygusal konuşmalar için doğal bir zemin.',
  'Aslan': 'Sahne sizin: yaratıcı projeler, kutlamalar ve görünür olmak isteyen işler için parlak bir gün.',
  'Başak': 'Detay ve düzen enerjisi: temizlik, sağlık rutinleri, planlama ve ince işçilik için mükemmel.',
  'Terazi': 'İlişki ve estetik günü: buluşmalar, anlaşmalar, sanat ve güzellik ritüelleri destekleniyor.',
  'Akrep': 'Derinlik ve dönüşüm: araştırma, gölge çalışması ve bırakma ritüelleri için güçlü bir frekans.',
  'Yay': 'Ufuk genişler: seyahat planları, eğitim, felsefi sohbetler ve iyimser girişimler için ideal.',
  'Oğlak': 'Disiplin ve hedef: kariyer adımları, uzun vadeli planlar ve ciddi görüşmeler için sağlam zemin.',
  'Kova': 'Yenilik ve topluluk: sıra dışı fikirler, arkadaş grupları ve teknolojik işler destekleniyor.',
  'Balık': 'Sezgi ve şefkat: meditasyon, sanat, rüya çalışması ve dinlenme için akışkan bir gün.',
};

// ---------- Daily Card (Günün Kartı) ----------

export interface DailyCard {
  title: string;
  emoji: string;
  message: string;
  ritual: string;
}

const DAILY_CARDS: DailyCard[] = [
  { title: 'Yıldız Tohumu', emoji: '🌱', message: 'Bugün attığınız en küçük adım, gelecekte gölgesinde dinleneceğiniz bir ağacın tohumudur. Küçüklüğüne aldanmayın.', ritual: 'Bugün tek bir küçük niyeti yazıya dökün ve görebileceğiniz bir yere koyun.' },
  { title: 'Altın Köprü', emoji: '🌉', message: 'Aranızda mesafe oluşan biriyle aranızdaki köprü hâlâ duruyor; ilk adımı bekliyor. Gurur, köprünün en pahalı gişesidir.', ritual: 'Uzun süredir konuşmadığınız birine kısa ve kalpten bir mesaj gönderin.' },
  { title: 'İç Pusula', emoji: '🧭', message: 'Dış sesler çoğaldığında iç pusulanız sussun diye değil, duyulsun diye oradadır. Bugün kararlarınızı ona danışın.', ritual: 'Bir karar öncesi 3 derin nefes alın ve bedeninizdeki ilk hissi not edin.' },
  { title: 'Dolunay Aynası', emoji: '🪞', message: 'Sizi başkalarında rahatsız eden şey, çoğu zaman kendi yansımanızın hatırlatıcısıdır. Ayna kırılmaz; bakılır.', ritual: 'Bugün sizi geren bir davranışı gördüğünüzde "bunun bendeki karşılığı ne?" diye sorun.' },
  { title: 'Bereket Kapısı', emoji: '🚪', message: 'Bolluk, kapıyı çalanı değil, kapıyı açık tutanı sever. Bugün cömertliğiniz döngüyü başlatır.', ritual: 'Karşılık beklemeden küçük bir iyilik yapın; akşam nasıl hissettiğinizi bir cümleyle yazın.' },
  { title: 'Satürn Taşı', emoji: '⛰️', message: 'Omzunuzdaki yük ceza değil, kas inşa eden ağırlıktır. Bugün taşıdığınız şey, yarın sizi taşıyacak.', ritual: 'Ertelediğiniz sorumluluklardan en küçüğünü bugün bitirin.' },
  { title: 'Merkür Kanadı', emoji: '🪽', message: 'Doğru kelime, doğru anda bir kapı anahtarıdır. Bugün sözlerinizin gücünü hafife almayın.', ritual: 'Bugün birine, hak ettiği halde hiç söylenmemiş bir takdiri iletin.' },
  { title: 'Ay Suyu', emoji: '💧', message: 'Duygular bastırılınca sel, akıtılınca nehir olur. Bugün hissettiklerinize kanal açın.', ritual: 'Akşam 5 dakika, sansürsüz duygu dökümü yazın; sonra kağıdı katlayıp kaldırın.' },
  { title: 'Güneş Tacı', emoji: '👑', message: 'Işığınızı kısarak kimseyi aydınlatamazsınız. Bugün görünür olmaktan çekinmeyin; sahne utangaçları da sever.', ritual: 'Bugün bir ortamda fikrinizi ilk siz söyleyin.' },
  { title: 'Kuzey Düğümü', emoji: '🧶', message: 'Konfor alanınızın sınırında sizi bekleyen bir ders var. Rahatsızlık, büyümenin ilk selamıdır.', ritual: 'Bugün sizi hafifçe zorlayan bir şeye bilerek "evet" deyin.' },
  { title: 'Venüs Gülü', emoji: '🌹', message: 'Güzellik aramakla değil, fark etmekle çoğalır. Bugün dünya size güzelliğini gösterme yarışında.', ritual: 'Gün içinde 3 güzel detayın fotoğrafını çekin veya not edin.' },
  { title: 'Plüton Küllüğü', emoji: '🔥', message: 'Bitmesi gereken şeyi zarafetle bitirmek de bir sanattır. Kül, toprağın en eski gübresidir.', ritual: 'Artık size hizmet etmeyen bir alışkanlığı bugün tek seferliğine yapmayın.' },
  { title: 'Jüpiter Rüzgarı', emoji: '🌬️', message: 'Şans, hazırlığın rüzgarla buluştuğu andır. Bugün yelkeninizi açık tutun; rüzgar programlara bakmaz.', ritual: 'Bugün karşınıza çıkan beklenmedik bir fırsata en az 10 dakika ciddiyetle bakın.' },
  { title: 'Gece Feneri', emoji: '🏮', message: 'Karanlık dönemler yolun bittiğini değil, fenerinizi yakma vaktinin geldiğini söyler. İçinizdeki ışık yakıt ister: umut.', ritual: 'Bugün sizi gerçekten iyi hissettiren bir şeye bilinçli olarak 20 dakika ayırın.' },
  { title: 'Terazi Dili', emoji: '⚖️', message: 'Her "evet"iniz bir şeye "hayır"dır. Bugün dengenizi başkalarının beklentisine değil, kendi terazinize göre kurun.', ritual: 'Bugün istemediğiniz bir şeye nazikçe ama net bir şekilde "hayır" deyin.' },
  { title: 'Kova Anahtarı', emoji: '🗝️', message: 'Herkes gibi düşünmek güvenli, kendiniz gibi düşünmek özgürleştiricidir. Aykırı fikriniz bugün birinin kapısını açabilir.', ritual: 'Bugün alışılmış bir işi kasıtlı olarak farklı bir yolla yapın.' },
];

// Deterministic daily pick: same user + same day = same card.
export function getDailyCard(name: string, date = new Date()): DailyCard {
  const seedStr = `${name.toLowerCase()}_${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return DAILY_CARDS[hash % DAILY_CARDS.length];
}
