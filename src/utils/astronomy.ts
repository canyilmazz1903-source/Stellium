// Astrology computation facade. Public API is kept stable for the whole app;
// internally everything now runs on the precision ephemeris (astronomy-engine,
// VSOP87-class, apparent positions of date) instead of the old simplified
// Kepler elements (which drifted up to ~0.5° on the Moon — enough to put a
// cusp-adjacent Moon or Ascendant in the wrong sign).
//
// The legacy engine lives in git history (pre-v1.4 astronomy.ts) and its
// golden replacement is verified by __tests__/ephemeris.test.ts.

import {
  bodyLongitude,
  bodySpeed,
  isRetrograde as ephIsRetrograde,
  daysSinceJ2000ToDate,
  meanObliquity,
  greenwichSiderealDeg,
  trueLunarNode,
  meanLunarNode,
  meanLilith,
  chironLongitude,
  sunRiseSet,
  isSunAboveHorizon,
} from './ephemeris';
import { computeHouses, HouseSystem, HOUSE_SYSTEM_LABELS } from './houseSystems';
import { detectPatterns, DetectedPattern } from './patterns';

export { HOUSE_SYSTEM_LABELS };
export type { HouseSystem, DetectedPattern };

// Normalize angle to [0, 360)
export function normalize360(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

// Convert date to day count since J2000.0 (kept as the app-wide time unit)
export function getJulianDaysSinceJ2000(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const jd = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + h / 24 - 730531.5;
  return jd;
}

// Zodiac Sign mapping
export const ZODIAC_SIGNS = [
  { name: 'Aries', turkish: 'Koç', symbol: '♈' },
  { name: 'Taurus', turkish: 'Boğa', symbol: '♉' },
  { name: 'Gemini', turkish: 'İkizler', symbol: '♊' },
  { name: 'Cancer', turkish: 'Yengeç', symbol: '♋' },
  { name: 'Leo', turkish: 'Aslan', symbol: '♌' },
  { name: 'Virgo', turkish: 'Başak', symbol: '♍' },
  { name: 'Libra', turkish: 'Terazi', symbol: '♎' },
  { name: 'Scorpio', turkish: 'Akrep', symbol: '♏' },
  { name: 'Sagittarius', turkish: 'Yay', symbol: '♐' },
  { name: 'Capricorn', turkish: 'Oğlak', symbol: '♑' },
  { name: 'Aquarius', turkish: 'Kova', symbol: '♒' },
  { name: 'Pisces', turkish: 'Balık', symbol: '♓' }
];

export function getZodiacSign(longitude: number) {
  const normalized = normalize360(longitude);
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

// Apparent geocentric ecliptic longitude of date (precision engine).
export function getPlanetLongitude(planet: string, d: number): number {
  return bodyLongitude(planet, daysSinceJ2000ToDate(d));
}

// Daily motion in deg/day; negative = retrograde.
export function getPlanetSpeed(planet: string, d: number): number {
  return bodySpeed(planet, daysSinceJ2000ToDate(d));
}

export function getIsRetrograde(planet: string, d: number): boolean {
  return ephIsRetrograde(planet, daysSinceJ2000ToDate(d));
}

// Legacy Equal-house helper kept for backward compatibility.
export function getHouseCusps(ramc: number, lat: number, obliquity: number) {
  const res = computeHouses(ramc, lat, obliquity, 'equal');
  return { ascendant: res.ascendant, midheaven: res.midheaven, houses: res.houses };
}

// Determine which house a longitude falls into (full 12-house wrap-safe scan).
export function getPlanetHouse(longitude: number, houses: number[]): number {
  const norm = normalize360(longitude);
  for (let i = 0; i < 12; i++) {
    const cuspCurrent = houses[i];
    const cuspNext = houses[(i + 1) % 12];
    if (cuspNext > cuspCurrent) {
      if (norm >= cuspCurrent && norm < cuspNext) return i + 1;
    } else {
      // Wraps around the 0° Aries boundary
      if (norm >= cuspCurrent || norm < cuspNext) return i + 1;
    }
  }
  return 12;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  aspectType: string;
  aspectTypeTurkish: string;
  orb: number;
  exactAngle: number;
  isApplying: boolean;
}

// Aspect catalogue including minors, each with a base orb.
const ASPECT_DEFS = [
  { name: 'Conjunction', turkish: 'Kavuşum', angle: 0, orb: 7 },
  { name: 'SemiSextile', turkish: 'Yarım Altmışlık', angle: 30, orb: 2 },
  { name: 'SemiSquare', turkish: 'Yarım Kare', angle: 45, orb: 2 },
  { name: 'Sextile', turkish: 'Altmışlık', angle: 60, orb: 5 },
  { name: 'Quintile', turkish: 'Beşlik (Quintil)', angle: 72, orb: 1.5 },
  { name: 'Square', turkish: 'Kare', angle: 90, orb: 6 },
  { name: 'Trine', turkish: 'Üçgen', angle: 120, orb: 6 },
  { name: 'Sesquiquadrate', turkish: 'Seskikare', angle: 135, orb: 2 },
  { name: 'Quincunx', turkish: 'Yüzelli (Quincunx)', angle: 150, orb: 2.5 },
  { name: 'Opposition', turkish: 'Karşıt', angle: 180, orb: 7 },
];

const LIGHTS = ['Sun', 'Moon'];
const OUTERS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

// Variable orb: wider for the lights, tighter between slow outer planets.
export function getOrb(p1: string, p2: string, aspectAngle: number): number {
  const def = ASPECT_DEFS.find(a => a.angle === aspectAngle);
  let orb = def ? def.orb : 3;
  if (LIGHTS.includes(p1) || LIGHTS.includes(p2)) orb += 1.5;
  if (OUTERS.includes(p1) && OUTERS.includes(p2)) orb = Math.max(1, orb - 1);
  return orb;
}

type PlanetLike = { name: string; longitude: number; speed?: number };

export function calculateAspects(planets: PlanetLike[], d: number): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const def of ASPECT_DEFS) {
        const orbLimit = getOrb(p1.name, p2.name, def.angle);
        const orb = Math.abs(diff - def.angle);
        if (orb <= orbLimit) {
          // Applying/separating from actual daily speeds (linear extrapolation)
          const s1 = p1.speed ?? getPlanetSpeed(p1.name, d);
          const s2 = p2.speed ?? getPlanetSpeed(p2.name, d);
          const f1 = p1.longitude + s1 * 0.1;
          const f2 = p2.longitude + s2 * 0.1;
          let futureDiff = Math.abs(f1 - f2);
          if (futureDiff > 180) futureDiff = 360 - futureDiff;
          const isApplying = Math.abs(futureDiff - def.angle) < orb;

          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspectType: def.name,
            aspectTypeTurkish: def.turkish,
            orb: Number(orb.toFixed(2)),
            exactAngle: def.angle,
            isApplying,
          });
        }
      }
    }
  }
  return aspects;
}

export interface ChartPoint {
  name: string;         // 'NorthNode' | 'SouthNode' | 'Chiron' | 'Lilith' | 'Fortuna'
  turkish: string;
  symbol: string;
  longitude: number;
  sign: string;
  house: number;
  approximate?: boolean; // Chiron carries ±1° model accuracy
}

// Main natal chart computation.
export function computeNatalChart(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number, // decimal hours supported (e.g. 5.5 for India)
  houseSystem: HouseSystem = 'placidus'
) {
  // 1. UTC instant of birth
  const local = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const utcDate = new Date(local.getTime() - timezoneOffsetHours * 3600000);
  const d = getJulianDaysSinceJ2000(utcDate);

  // 2. Houses from apparent sidereal time + mean obliquity
  const ramc = normalize360(greenwichSiderealDeg(utcDate) + longitude);
  const obliquity = meanObliquity(utcDate);
  const houseRes = computeHouses(ramc, latitude, obliquity, houseSystem);
  const { ascendant, midheaven, houses } = houseRes;

  // 3. Planets with speed + retro from the precision engine
  const planetsList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const planets = planetsList.map((name) => {
    const lon = bodyLongitude(name, utcDate);
    const speed = bodySpeed(name, utcDate);
    const sign = getZodiacSign(lon);
    return {
      name,
      longitude: lon,
      sign: sign.turkish,
      house: getPlanetHouse(lon, houses),
      retrograde: name !== 'Sun' && name !== 'Moon' && speed < 0,
      speed: Number(speed.toFixed(4)),
    };
  });

  const aspects = calculateAspects(planets, d);

  // 4. Sensitive points
  const sunLon = planets[0].longitude;
  const moonLon = planets[1].longitude;
  const isDayBirth = isSunAboveHorizon(utcDate, latitude, longitude);

  const nodeLon = trueLunarNode(utcDate);
  const southLon = normalize360(nodeLon + 180);
  const chironLon = chironLongitude(utcDate);
  const lilithLon = meanLilith(utcDate);
  // Pars Fortuna: day = ASC + Moon − Sun; night = ASC + Sun − Moon
  const fortunaLon = normalize360(
    isDayBirth ? ascendant + moonLon - sunLon : ascendant + sunLon - moonLon
  );

  const mkPoint = (name: string, turkish: string, symbol: string, lon: number, approximate = false): ChartPoint => ({
    name, turkish, symbol,
    longitude: lon,
    sign: getZodiacSign(lon).turkish,
    house: getPlanetHouse(lon, houses),
    approximate,
  });

  const points: ChartPoint[] = [
    mkPoint('NorthNode', 'Kuzey Ay Düğümü', '☊', nodeLon),
    mkPoint('SouthNode', 'Güney Ay Düğümü', '☋', southLon),
    mkPoint('Chiron', 'Chiron', '⚷', chironLon, true),
    mkPoint('Lilith', 'Lilith (Kara Ay)', '⚸', lilithLon),
    mkPoint('Fortuna', 'Şans Noktası', '⊗', fortunaLon),
  ];

  // 5. Aspect patterns (the app's namesake stellium included)
  const patterns = detectPatterns(planets);

  return {
    planets,
    houses,
    ascendant,
    midheaven,
    aspects,
    points,
    patterns,
    houseSystem: houseRes.system,
    polarFallback: houseRes.polarFallback,
    isDayBirth,
    meanNode: meanLunarNode(utcDate),
  };
}

// Solar chart for unknown birth times: computed at local noon, houses are
// Whole Sign counted from the SUN's sign (Sun = 1st house, classical solar
// chart). ASC/MC are meaningless without a time and must be hidden by the UI
// (timeUnknown flag). Honest degradation instead of silently-wrong houses.
export function computeSolarChart(
  year: number,
  month: number,
  day: number,
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number
) {
  const chart = computeNatalChart(year, month, day, 12, 0, latitude, longitude, timezoneOffsetHours, 'whole');
  const sun = chart.planets.find(p => p.name === 'Sun')!;
  const sunSignStart = Math.floor(normalize360(sun.longitude) / 30) * 30;
  const houses = Array.from({ length: 12 }, (_, i) => normalize360(sunSignStart + i * 30));

  const planets = chart.planets.map(p => ({ ...p, house: getPlanetHouse(p.longitude, houses) }));
  const points = chart.points.map(pt => ({ ...pt, house: getPlanetHouse(pt.longitude, houses) }));

  return {
    ...chart,
    planets,
    points,
    houses,
    houseSystem: 'whole' as HouseSystem,
    timeUnknown: true,
  };
}

export interface PlanetaryHour {
  hourIndex: number;
  label: string;
  planetName: string;
  planetSymbol: string;
  meaning: string;
  isNight: boolean;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
}

const PLANET_DETAILS: Record<string, { turkish: string; symbol: string; meaning: string }> = {
  Sun: { turkish: 'Güneş', symbol: '☀️', meaning: 'Öz güven, liderlik, kariyer ve benlik ifadesi.' },
  Moon: { turkish: 'Ay', symbol: '🌙', meaning: 'Duygular, sezgiler, aile ve içsel arınma.' },
  Mercury: { turkish: 'Merkür', symbol: '☿', meaning: 'Zihinsel faaliyetler, iletişim, yazışma ve ticaret.' },
  Venus: { turkish: 'Venüs', symbol: '♀', meaning: 'Aşk, ilişkiler, sevgi frekansı, bakım ve para.' },
  Mars: { turkish: 'Mars', symbol: '♂', meaning: 'Eyleme geçme, cesaret, spor ve fiziksel işler.' },
  Jupiter: { turkish: 'Jüpiter', symbol: '♃', meaning: 'Bolluk, bereket, şans kapıları ve yüksek bilgelik.' },
  Saturn: { turkish: 'Satürn', symbol: '♄', meaning: 'Disiplin, sınırlar, koruma ve sabır gerektiren işler.' }
};

// Planetary hours from REAL sunrise/sunset (astronomy-engine horizon search,
// includes refraction) — this is what makes the esma/zikir windows trustworthy.
export function calculatePlanetaryHours(
  latitude: number,
  longitude: number,
  date: Date
): PlanetaryHour[] {
  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const rs = sunRiseSet(latitude, longitude, localMidnight);

  // Polar / search-failure fallback: symmetric 06-18 approximation
  let sunriseDate = rs.sunrise ?? new Date(localMidnight.getTime() + 6 * 3600000);
  let sunsetDate = rs.sunset ?? new Date(localMidnight.getTime() + 18 * 3600000);
  let nextSunriseDate = rs.nextSunrise ?? new Date(sunriseDate.getTime() + 24 * 3600000);

  // Guard pathological ordering
  if (sunsetDate.getTime() <= sunriseDate.getTime()) {
    sunsetDate = new Date(sunriseDate.getTime() + 12 * 3600000);
  }
  if (nextSunriseDate.getTime() <= sunsetDate.getTime()) {
    nextSunriseDate = new Date(sunriseDate.getTime() + 24 * 3600000);
  }

  const dayHourMs = (sunsetDate.getTime() - sunriseDate.getTime()) / 12;
  const nightHourMs = (nextSunriseDate.getTime() - sunsetDate.getTime()) / 12;

  const CHALDEAN_DESCENDING = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sunday=0...
  const dayRuler = DAY_RULERS[date.getDay()];
  const startIndex = CHALDEAN_DESCENDING.indexOf(dayRuler);

  const hoursList: PlanetaryHour[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunriseDate.getTime() + i * dayHourMs);
    const end = new Date(sunriseDate.getTime() + (i + 1) * dayHourMs);
    const planet = CHALDEAN_DESCENDING[(startIndex + i) % 7];
    const details = PLANET_DETAILS[planet] || PLANET_DETAILS['Sun'];
    hoursList.push({
      hourIndex: i,
      label: `${formatTime(start)} - ${formatTime(end)}`,
      planetName: details.turkish,
      planetSymbol: details.symbol,
      meaning: details.meaning,
      isNight: false,
      isActive: now >= start && now < end,
      startTime: start,
      endTime: end,
    });
  }

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunsetDate.getTime() + i * nightHourMs);
    const end = new Date(sunsetDate.getTime() + (i + 1) * nightHourMs);
    const planet = CHALDEAN_DESCENDING[(startIndex + 12 + i) % 7];
    const details = PLANET_DETAILS[planet] || PLANET_DETAILS['Sun'];
    hoursList.push({
      hourIndex: 12 + i,
      label: `${formatTime(start)} - ${formatTime(end)}`,
      planetName: details.turkish,
      planetSymbol: details.symbol,
      meaning: details.meaning,
      isNight: true,
      isActive: now >= start && now < end,
      startTime: start,
      endTime: end,
    });
  }

  return hoursList;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------- Time zone handling (Turkey historical table + IANA) ----------

function getLastSundayOfMonth(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const dayOfWeek = lastDay.getUTCDay();
  return lastDay.getUTCDate() - dayOfWeek;
}

export function getTurkeyHistoricalOffset(date: Date): number {
  const year = date.getUTCFullYear();

  if (year > 2016) {
    return 3;
  }

  if (year === 2016) {
    const dstStart = Date.UTC(2016, 2, 27, 1, 0, 0); // March 27, 2016 01:00 UTC
    return (date.getTime() >= dstStart) ? 3 : 2;
  }

  if (year >= 1985 && year <= 2015) {
    const lastSundayMarch = getLastSundayOfMonth(year, 2);
    const dstStart = Date.UTC(year, 2, lastSundayMarch, 1, 0, 0);

    let lastSundayOctober = getLastSundayOfMonth(year, 9);
    let dstEndMonth = 9;
    let dstEndDay = lastSundayOctober;
    if (year === 2015) {
      dstEndMonth = 10;
      dstEndDay = 8;
    }

    const dstEnd = Date.UTC(year, dstEndMonth, dstEndDay, 1, 0, 0);

    if (date.getTime() >= dstStart && date.getTime() < dstEnd) {
      return 3;
    } else {
      return 2;
    }
  }

  if (year >= 1973 && year < 1985) {
    const lastSundayMarch = getLastSundayOfMonth(year, 2);
    const dstStart = Date.UTC(year, 2, lastSundayMarch, 1, 0, 0);
    const lastSundayOctober = getLastSundayOfMonth(year, 9);
    const dstEnd = Date.UTC(year, 9, lastSundayOctober, 1, 0, 0);
    return (date.getTime() >= dstStart && date.getTime() < dstEnd) ? 3 : 2;
  }

  return 2;
}

// Minute-precision offset in decimal hours (H4 fix: India +5.5, Iran +3.5...).
export function getTimezoneOffset(timezone: string, date: Date): number {
  const cleanTz = timezone ? timezone.trim() : '';
  if (cleanTz === 'Europe/Istanbul' || cleanTz === 'Turkey' || !cleanTz) {
    return getTurkeyHistoricalOffset(date);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const partValues: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        partValues[part.type] = Number(part.value);
      }
    }

    const targetUtc = Date.UTC(
      partValues.year,
      partValues.month - 1,
      partValues.day,
      partValues.hour === 24 ? 0 : partValues.hour,
      partValues.minute,
      partValues.second
    );

    const offset = (targetUtc - date.getTime()) / 3600000;
    return isNaN(offset) ? 3 : offset;
  } catch (e) {
    return 3; // Fallback to GMT+3 (Turkey)
  }
}

// ---------- DST transparency (trust layer) ----------

export interface TimezoneDecision {
  offsetHours: number;
  dstActive: boolean;
  ruleLabel: string;
  isTurkeyRule: boolean;
}

// Human-readable explanation of the timezone/DST decision applied to a birth
// instant — powers the "why is my Ascendant different elsewhere?" trust UI.
export function explainTimezoneDecision(date: Date, timezone: string): TimezoneDecision {
  const cleanTz = timezone ? timezone.trim() : '';
  const isTurkey = cleanTz === 'Europe/Istanbul' || cleanTz === 'Turkey' || !cleanTz;

  if (isTurkey) {
    const offset = getTurkeyHistoricalOffset(date);
    const year = date.getUTCFullYear();

    if (year > 2016 || (year === 2016 && offset === 3 && date.getTime() >= Date.UTC(2016, 8, 8))) {
      return {
        offsetHours: 3, dstActive: false, isTurkeyRule: true,
        ruleLabel: 'Türkiye kalıcı GMT+3 dönemi (Eylül 2016 sonrası; yaz saati uygulaması kaldırıldı)',
      };
    }
    if (year >= 1985) {
      return {
        offsetHours: offset, dstActive: offset === 3, isTurkeyRule: true,
        ruleLabel: offset === 3
          ? 'Türkiye 1985–2016 yaz saati dönemi: Mart son Pazar – Ekim son Pazar arası GMT+3'
          : 'Türkiye 1985–2016 kış saati: GMT+2 (yaz saati pasif)',
      };
    }
    if (year >= 1973) {
      return {
        offsetHours: offset, dstActive: offset === 3, isTurkeyRule: true,
        ruleLabel: offset === 3
          ? 'Türkiye 1973–1984 yaz saati dönemi: GMT+3'
          : 'Türkiye 1973–1984 kış saati: GMT+2',
      };
    }
    return {
      offsetHours: 2, dstActive: false, isTurkeyRule: true,
      ruleLabel: '1973 öncesi Türkiye: standart GMT+2 (düzenli yaz saati uygulaması yok)',
    };
  }

  const offset = getTimezoneOffset(cleanTz, date);
  const sign = offset >= 0 ? '+' : '−';
  const abs = Math.abs(offset);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  const offStr = mm > 0 ? `${sign}${hh}:${String(mm).padStart(2, '0')}` : `${sign}${hh}`;
  return {
    offsetHours: offset, dstActive: false, isTurkeyRule: false,
    ruleLabel: `${cleanTz} bölgesi, IANA saat dilimi veritabanına göre GMT${offStr} (dakika hassasiyetinde)`,
  };
}
