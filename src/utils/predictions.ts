// Öngörü teknikleri paketi (Faz 5) — tamamı saf, deterministik hesap.
// AI'ya tarih uydurtmak yerine bu motorlar gerçek tarihleri üretir.

import {
  SearchLunarEclipse,
  NextLunarEclipse,
  SearchGlobalSolarEclipse,
  NextGlobalSolarEclipse,
  MakeTime,
} from 'astronomy-engine';
import {
  getJulianDaysSinceJ2000,
  getPlanetLongitude,
  getPlanetSpeed,
  getZodiacSign,
  getPlanetHouse,
  normalize360,
} from './astronomy';
import { menzilFromLongitude } from './menazil';
import { planetNameTR } from './interpretations';

const DAY_MS = 86400000;

// ---------- 1. Sekonder Progresyon (1 gün = 1 yıl) ----------

export interface ProgressionResult {
  ageYears: number;
  progressedSun: { longitude: number; sign: string };
  progressedMoon: { longitude: number; sign: string; house: number };
  // Progres Ay ~2.5 yılda burç değiştirir; bir sonraki değişim tahmini
  nextMoonSignChangeYears: number;
  // Bir sonraki progres Yeni Ay'a kalan yıl (yaklaşık)
  nextProgressedNewMoonYears: number;
}

export function computeProgressions(birthUtc: Date, natalHouses: number[], now = new Date()): ProgressionResult {
  const ageYears = (now.getTime() - birthUtc.getTime()) / (365.2425 * DAY_MS);
  // 1 yıl = 1 gün: progres an = doğum + yaş(gün)
  const progressedDate = new Date(birthUtc.getTime() + ageYears * DAY_MS);
  const d = getJulianDaysSinceJ2000(progressedDate);

  const sunLon = getPlanetLongitude('Sun', d);
  const moonLon = getPlanetLongitude('Moon', d);
  const moonSpeed = getPlanetSpeed('Moon', d); // deg per progressed-day = deg per year

  const degToNextSign = 30 - (moonLon % 30);
  const nextMoonSignChangeYears = degToNextSign / Math.max(moonSpeed, 1);

  let elong = moonLon - sunLon;
  if (elong < 0) elong += 360;
  const relSpeed = moonSpeed - 1; // prog Güneş ~1°/yıl
  const nextProgressedNewMoonYears = (360 - elong) / Math.max(relSpeed, 1);

  return {
    ageYears,
    progressedSun: { longitude: sunLon, sign: getZodiacSign(sunLon).turkish },
    progressedMoon: { longitude: moonLon, sign: getZodiacSign(moonLon).turkish, house: getPlanetHouse(moonLon, natalHouses) },
    nextMoonSignChangeYears,
    nextProgressedNewMoonYears,
  };
}

// ---------- 2. Solar Return (Güneş Dönüşü) ----------

// Güneş'in natal boylamına döndüğü anı Newton iterasyonuyla bulur (< 1 dk).
export function findSolarReturn(natalSunLongitude: number, aroundYear: number, birthMonth: number, birthDay: number): Date {
  let t = new Date(Date.UTC(aroundYear, birthMonth - 1, birthDay, 12, 0, 0));
  for (let i = 0; i < 12; i++) {
    const d = getJulianDaysSinceJ2000(t);
    const lon = getPlanetLongitude('Sun', d);
    let diff = natalSunLongitude - lon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-5) break;
    const speed = getPlanetSpeed('Sun', d); // ~0.985°/gün
    t = new Date(t.getTime() + (diff / speed) * DAY_MS);
  }
  return t;
}

// ---------- 3. Yıllık Profeksiyon ----------

const SIGN_RULERS_TR: Record<string, string> = {
  'Koç': 'Mars', 'Boğa': 'Venüs', 'İkizler': 'Merkür', 'Yengeç': 'Ay',
  'Aslan': 'Güneş', 'Başak': 'Merkür', 'Terazi': 'Venüs', 'Akrep': 'Mars',
  'Yay': 'Jüpiter', 'Oğlak': 'Satürn', 'Kova': 'Satürn', 'Balık': 'Jüpiter',
};

export interface ProfectionResult {
  age: number;
  house: number;         // yılın evi (1-12)
  sign: string;          // Whole Sign: ASC burcundan itibaren
  yearLord: string;      // yıl lordu (TR)
  theme: string;
}

const HOUSE_THEMES = [
  'kimlik, beden ve yeni bir kişisel döngü',
  'gelir, kaynaklar ve öz değer',
  'iletişim, eğitim, kardeşler ve yakın çevre',
  'ev, aile, kökler ve iç dünya',
  'aşk, yaratıcılık ve çocuklar',
  'sağlık rutinleri, iş düzeni ve hizmet',
  'evlilik, ortaklıklar ve birebir ilişkiler',
  'dönüşüm, ortak kaynaklar ve derin yüzleşmeler',
  'inançlar, yüksek öğrenim ve uzak ufuklar',
  'kariyer, statü ve toplumsal görünürlük',
  'dostluklar, topluluklar ve gelecek vizyonu',
  'ruhsal arınma, kapanışlar ve iç hazırlık',
];

export function computeProfection(birthDate: Date, ascendantLongitude: number, now = new Date()): ProfectionResult {
  let age = now.getFullYear() - birthDate.getFullYear();
  const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (now < thisYearBirthday) age -= 1;

  const house = (age % 12) + 1;
  const ascSignIndex = Math.floor(normalize360(ascendantLongitude) / 30);
  const signIndex = (ascSignIndex + house - 1) % 12;
  const SIGNS = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];
  const sign = SIGNS[signIndex];

  return {
    age,
    house,
    sign,
    yearLord: SIGN_RULERS_TR[sign],
    theme: HOUSE_THEMES[house - 1],
  };
}

// ---------- 4. Firdaria (Pers dönemleri) ----------

const FIRDARIA_DAY: [string, number][] = [
  ['Güneş', 10], ['Venüs', 8], ['Merkür', 13], ['Ay', 9], ['Satürn', 11], ['Jüpiter', 12], ['Mars', 7],
  ['Kuzey Ay Düğümü', 3], ['Güney Ay Düğümü', 2],
];
const FIRDARIA_NIGHT: [string, number][] = [
  ['Ay', 9], ['Satürn', 11], ['Jüpiter', 12], ['Mars', 7], ['Güneş', 10], ['Venüs', 8], ['Merkür', 13],
  ['Kuzey Ay Düğümü', 3], ['Güney Ay Düğümü', 2],
];

export interface FirdariaResult {
  majorLord: string;
  majorStartAge: number;
  majorEndAge: number;
  subLord: string | null; // düğüm dönemlerinde alt dönem yoktur
  cycleAge: number;       // 75 yıllık döngü içindeki yaş
}

export function computeFirdaria(ageYears: number, isDayBirth: boolean): FirdariaResult {
  const table = isDayBirth ? FIRDARIA_DAY : FIRDARIA_NIGHT;
  const cycleAge = ageYears % 75;

  let acc = 0;
  for (const [lord, years] of table) {
    if (cycleAge < acc + years) {
      const within = cycleAge - acc;
      let subLord: string | null = null;
      if (!lord.includes('Düğüm')) {
        // Alt dönemler: 7 gezegen, majör lorddan başlayarak eşit bölünür
        const planets = table.filter(([l]) => !l.includes('Düğüm')).map(([l]) => l);
        const startIdx = planets.indexOf(lord);
        const subLen = years / 7;
        const subIdx = Math.min(6, Math.floor(within / subLen));
        subLord = planets[(startIdx + subIdx) % 7];
      }
      return { majorLord: lord, majorStartAge: acc, majorEndAge: acc + years, subLord, cycleAge };
    }
    acc += years;
  }
  return { majorLord: table[0][0], majorStartAge: 0, majorEndAge: table[0][1], subLord: table[0][0], cycleAge };
}

// ---------- 5. Tutulma Takvimi ----------

export interface EclipseEvent {
  type: 'lunar' | 'solar';
  kind: string;             // penumbral/partial/total/annular
  date: Date;
  longitude: number;        // tutulmanın ekliptik boylamı (Ay/Güneş)
  sign: string;
  natalHouse: number | null;
  contactedNatal: string | null; // 3° içinde temas eden natal gezegen (TR)
}

const KIND_TR: Record<string, string> = {
  penumbral: 'Yarı Gölgeli', partial: 'Parçalı', total: 'Tam', annular: 'Halkalı',
};

export function computeEclipses(
  natalPlanets: { name: string; longitude: number }[] | null,
  natalHouses: number[] | null,
  monthsAhead = 24
): EclipseEvent[] {
  const events: EclipseEvent[] = [];
  const start = new Date(Date.now() - 30 * DAY_MS);
  const end = new Date(Date.now() + monthsAhead * 30.44 * DAY_MS);

  const annotate = (type: 'lunar' | 'solar', kind: string, date: Date): EclipseEvent => {
    const d = getJulianDaysSinceJ2000(date);
    const lon = type === 'lunar' ? getPlanetLongitude('Moon', d) : getPlanetLongitude('Sun', d);
    let contacted: string | null = null;
    if (natalPlanets) {
      let best = 3.5;
      for (const p of natalPlanets) {
        let diff = Math.abs(normalize360(lon) - normalize360(p.longitude));
        if (diff > 180) diff = 360 - diff;
        const near = Math.min(diff, Math.abs(diff - 180)); // kavuşum veya karşıt temas
        if (near < best) { best = near; contacted = planetNameTR(p.name); }
      }
    }
    return {
      type, kind: KIND_TR[kind] || kind, date,
      longitude: lon,
      sign: getZodiacSign(lon).turkish,
      natalHouse: natalHouses ? getPlanetHouse(lon, natalHouses) : null,
      contactedNatal: contacted,
    };
  };

  try {
    let lunar = SearchLunarEclipse(MakeTime(start));
    while (lunar.peak.date <= end) {
      events.push(annotate('lunar', lunar.kind as string, lunar.peak.date));
      lunar = NextLunarEclipse(lunar.peak);
    }
  } catch (e) { console.warn('Lunar eclipse search failed:', e); }

  try {
    let solar = SearchGlobalSolarEclipse(MakeTime(start));
    while (solar.peak.date <= end) {
      events.push(annotate('solar', solar.kind as string, solar.peak.date));
      solar = NextGlobalSolarEclipse(solar.peak);
    }
  } catch (e) { console.warn('Solar eclipse search failed:', e); }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

// ---------- 6. Boşlukta Ay (Void-of-Course) ----------

const VOC_ASPECTS = [0, 60, 90, 120, 180];
const VOC_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

// Ay'ın t anındaki bir sonraki tam açısı ve burç değişimi karşılaştırılır.
// Sonraki tam açı burç değişiminden SONRAYSA Ay şu an boşluktadır.
export function isMoonVoidOfCourse(date = new Date()): { voc: boolean; signChangeAt: Date } {
  const d0 = getJulianDaysSinceJ2000(date);
  const moonLon0 = getPlanetLongitude('Moon', d0);
  const currentSignIdx = Math.floor(normalize360(moonLon0) / 30);

  // Burç değişim anını saatlik tarama + ikiye bölme ile bul
  let lo = 0, hi = 0;
  for (let h = 1; h <= 72; h++) {
    const lon = getPlanetLongitude('Moon', d0 + h / 24);
    if (Math.floor(normalize360(lon) / 30) !== currentSignIdx) { hi = h; lo = h - 1; break; }
  }
  let signChangeH = hi;
  for (let i = 0; i < 12 && hi > lo; i++) {
    const mid = (lo + hi) / 2;
    const lon = getPlanetLongitude('Moon', d0 + mid / 24);
    if (Math.floor(normalize360(lon) / 30) !== currentSignIdx) { hi = mid; } else { lo = mid; }
    signChangeH = hi;
  }
  const signChangeAt = new Date(date.getTime() + signChangeH * 3600000);

  // Burç değişiminden önce tam açı var mı? (saatlik delta işaret değişimi)
  const deltas = (h: number) => {
    const dm = getPlanetLongitude('Moon', d0 + h / 24);
    return VOC_PLANETS.map((p) => {
      const dp = getPlanetLongitude(p, d0 + h / 24);
      let sep = Math.abs(normalize360(dm) - normalize360(dp));
      if (sep > 180) sep = 360 - sep;
      return VOC_ASPECTS.map(a => sep - a);
    });
  };

  let prev = deltas(0);
  for (let h = 1; h <= Math.ceil(signChangeH); h++) {
    const cur = deltas(Math.min(h, signChangeH));
    for (let p = 0; p < prev.length; p++) {
      for (let a = 0; a < VOC_ASPECTS.length; a++) {
        if (Math.sign(prev[p][a]) !== Math.sign(cur[p][a]) && Math.abs(prev[p][a]) < 8) {
          return { voc: false, signChangeAt }; // burç bitmeden tam açı yapacak
        }
      }
    }
    prev = cur;
  }
  return { voc: true, signChangeAt };
}

// ---------- 7. Seçim Astrolojisi ("Kozmik Zamanlama") ----------

export type ElectionalIntent = 'başlangıç' | 'evlilik' | 'taşınma' | 'sağlık' | 'alışveriş' | 'yolculuk';

const INTENT_KEYWORDS: Record<ElectionalIntent, string[]> = {
  'başlangıç': ['başlamak', 'girişim', 'iş'],
  'evlilik': ['evlilik', 'nikâh', 'nişan'],
  'taşınma': ['taşınma', 'ev', 'inşaat'],
  'sağlık': ['tedavi', 'ilaç', 'sağlık'],
  'alışveriş': ['ticaret', 'alım', 'kazanç', 'takı'],
  'yolculuk': ['yolculuk', 'seyahat'],
};

export interface ElectionalWindow {
  date: Date;
  score: number;
  reasons: string[];
  menzilName: string;
  moonSign: string;
}

export function findBestDates(intent: ElectionalIntent, daysAhead = 30): ElectionalWindow[] {
  const results: ElectionalWindow[] = [];
  const keywords = INTENT_KEYWORDS[intent];

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(Date.now() + i * DAY_MS);
    date.setHours(12, 0, 0, 0);
    const d = getJulianDaysSinceJ2000(date);
    const moonLon = getPlanetLongitude('Moon', d);
    const sunLon = getPlanetLongitude('Sun', d);
    const menzil = menzilFromLongitude(moonLon);
    const reasons: string[] = [];
    let score = 0;

    // Menzil tabiatı
    if (menzil.nature === 'sad') { score += 2; reasons.push(`${menzil.name} menzili uğurlu (sa'd)`); }
    else if (menzil.nature === 'nahs') { score -= 2; reasons.push(`${menzil.name} menzili dikkat ister (nahs)`); }

    // Menzil iş listesi ↔ niyet eşleşmesi
    const goodHit = menzil.goodFor.some(g => keywords.some(k => g.includes(k)));
    const badHit = menzil.avoidFor.some(g => keywords.some(k => g.includes(k)));
    if (goodHit) { score += 3; reasons.push('menzil bu niyet için özellikle uygun'); }
    if (badHit) { score -= 4; reasons.push('menzil bu niyet için kaçınılası'); }

    // Ay fazı: büyüyen Ay başlangıçları destekler
    let elong = moonLon - sunLon;
    if (elong < 0) elong += 360;
    if (elong > 10 && elong < 170) { score += 1; reasons.push('büyüyen Ay (başlangıç desteği)'); }
    if (elong >= 170 && elong <= 190) { score -= 1; reasons.push('Dolunay gerilimi'); }

    // Boşlukta Ay cezası
    const voc = isMoonVoidOfCourse(date);
    if (voc.voc) { score -= 3; reasons.push('Ay boşlukta (öğle saatinde)'); }

    // Ay'ın sert/yumuşak temasları (o günkü gökyüzü)
    for (const p of ['Saturn', 'Mars']) {
      const sep0 = sepTo(moonLon, getPlanetLongitude(p, d));
      if ([90, 180].some(a => Math.abs(sep0 - a) < 4)) { score -= 1; reasons.push(`Ay-${planetNameTR(p)} sert açı`); }
    }
    for (const p of ['Jupiter', 'Venus']) {
      const sep0 = sepTo(moonLon, getPlanetLongitude(p, d));
      if ([60, 120].some(a => Math.abs(sep0 - a) < 4)) { score += 1; reasons.push(`Ay-${planetNameTR(p)} destekleyici açı`); }
    }

    results.push({ date, score, reasons, menzilName: menzil.name, moonSign: getZodiacSign(moonLon).turkish });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

function sepTo(a: number, b: number): number {
  let s = Math.abs(normalize360(a) - normalize360(b));
  if (s > 180) s = 360 - s;
  return s;
}
