// Golden test set for the precision ephemeris core (Faz 1 acceptance).
// Anchors are physically documented instants (equinoxes, solstices, eclipse
// maxima, node crossings) rather than copied software output, so they verify
// the APPARENT-of-date frame independently of any other ephemeris vendor.

import {
  getPlanetLongitude,
  getPlanetSpeed,
  getIsRetrograde,
  getJulianDaysSinceJ2000,
  getTimezoneOffset,
  getTurkeyHistoricalOffset,
  explainTimezoneDecision,
  computeNatalChart,
  getPlanetHouse,
  calculateAspects,
  getOrb,
  calculatePlanetaryHours,
} from '../src/utils/astronomy';
import { trueLunarNode, meanLunarNode, sunRiseSet, meanLilith, chironLongitude } from '../src/utils/ephemeris';
import { computeHouses } from '../src/utils/houseSystems';
import { detectPatterns } from '../src/utils/patterns';
import { SearchMoonNode, MakeTime } from 'astronomy-engine';

const d = (iso: string) => getJulianDaysSinceJ2000(new Date(iso));

const angularDiff = (a: number, b: number) => {
  const x = Math.abs(a - b) % 360;
  return Math.min(x, 360 - x);
};

describe('Sun: apparent longitude of date at documented equinox/solstice instants', () => {
  // Sun moves ~0.04°/hour, so ±0.1° tolerance covers minute-level timing.
  const cases: [string, number][] = [
    ['2000-03-20T07:35:00Z', 0],    // vernal equinox 2000
    ['2000-06-21T01:48:00Z', 90],   // June solstice 2000
    ['2020-03-20T03:50:00Z', 0],    // vernal equinox 2020
    ['2024-03-20T03:06:00Z', 0],    // vernal equinox 2024
  ];
  test.each(cases)('%s → Sun at %d°', (iso, expected) => {
    const lon = getPlanetLongitude('Sun', d(iso));
    expect(angularDiff(lon, expected)).toBeLessThan(0.1);
  });
});

describe('Moon: exact syzygy at eclipse maxima (external physical anchors)', () => {
  test('1999-08-11 11:03 UTC total solar eclipse (Turkey) → Moon conjunct Sun', () => {
    const t = d('1999-08-11T11:03:00Z');
    expect(angularDiff(getPlanetLongitude('Moon', t), getPlanetLongitude('Sun', t))).toBeLessThan(0.6);
  });
  test('2024-04-08 18:18 UTC total solar eclipse → Moon conjunct Sun', () => {
    const t = d('2024-04-08T18:18:00Z');
    expect(angularDiff(getPlanetLongitude('Moon', t), getPlanetLongitude('Sun', t))).toBeLessThan(0.6);
  });
  test('2019-01-21 05:12 UTC total lunar eclipse → Moon opposite Sun', () => {
    const t = d('2019-01-21T05:12:00Z');
    const sep = angularDiff(getPlanetLongitude('Moon', t), getPlanetLongitude('Sun', t));
    expect(Math.abs(sep - 180)).toBeLessThan(0.6);
  });
});

describe('Lunar nodes', () => {
  test('true node matches Moon longitude at an actual node crossing (kind-aware)', () => {
    // astronomy-engine finds the crossing instant; at that instant the Moon
    // sits on the ascending node (kind=1) or descending node (kind=-1).
    const evt = SearchMoonNode(MakeTime(new Date('2024-01-01T00:00:00Z')));
    const when = evt.time.date;
    const nodeLon = trueLunarNode(when);
    const moonLon = getPlanetLongitude('Moon', getJulianDaysSinceJ2000(when));
    const expected = (evt.kind as number) === 1 ? nodeLon : (nodeLon + 180) % 360;
    expect(angularDiff(expected, moonLon)).toBeLessThan(1.5);
  });

  test('true node absolute anchors: Aries mid-2024, Taurus early-2023', () => {
    // Documented ingress: true node entered Aries July 2023, Pisces Jan 2025.
    const n2024 = trueLunarNode(new Date('2024-06-01T00:00:00Z'));
    expect(Math.floor(n2024 / 30)).toBe(0); // Aries
    expect(n2024).toBeGreaterThan(8);
    expect(n2024).toBeLessThan(20); // ~14° Aries
    const n2023 = trueLunarNode(new Date('2023-01-01T00:00:00Z'));
    expect(Math.floor(n2023 / 30)).toBe(1); // Taurus
  });

  test('mean node stays within ~1.8° of true node and regresses', () => {
    const t1 = new Date('2020-06-01T00:00:00Z');
    const t2 = new Date('2020-09-01T00:00:00Z');
    expect(angularDiff(meanLunarNode(t1), trueLunarNode(t1))).toBeLessThan(2.5);
    // Node moves backwards ~0.053°/day → ~-4.9° over 92 days
    const delta = ((meanLunarNode(t2) - meanLunarNode(t1) + 540) % 360) - 180;
    expect(delta).toBeLessThan(-4);
    expect(delta).toBeGreaterThan(-6);
  });
});

describe('Lilith & Chiron sanity', () => {
  test('mean Lilith advances ~40.7°/year', () => {
    const l1 = meanLilith(new Date('2020-01-01T00:00:00Z'));
    const l2 = meanLilith(new Date('2021-01-01T00:00:00Z'));
    const delta = ((l2 - l1 + 540) % 360) - 180;
    expect(delta).toBeGreaterThan(38);
    expect(delta).toBeLessThan(43);
  });

  test('Chiron lands in the documented sign for era anchors', () => {
    // Chiron ingressed Aries in 2018/2019 and stays through the 2020s.
    const lon2025 = chironLongitude(new Date('2025-06-01T00:00:00Z'));
    expect(Math.floor(lon2025 / 30)).toBe(0); // Aries
    // Perihelion era (1996) — Chiron was traversing Libra ~1995-1996.
    const lon1996 = chironLongitude(new Date('1996-02-14T00:00:00Z'));
    expect([6, 7]).toContain(Math.floor(lon1996 / 30)); // Libra (or early Scorpio tolerance)
  });
});

describe('Retrograde detection & speeds (precision engine)', () => {
  test('Mercury shows 3-5 retro windows of 15-30 days in ~13 months', () => {
    // Scan daily speeds for 400 days
    const start = getJulianDaysSinceJ2000(new Date('2024-01-01T00:00:00Z'));
    let windows = 0;
    let inRetro = false;
    let runLength = 0;
    let runStart = -1;
    const lengths: number[] = [];
    for (let i = 0; i < 400; i++) {
      const retro = getIsRetrograde('Mercury', start + i);
      if (retro) {
        if (!inRetro) { inRetro = true; runStart = i; }
        runLength++;
      } else if (inRetro) {
        // A window that began on day 0 is truncated by the scan boundary
        // (Mercury was already retro at the start) — skip it for the
        // duration assertion but it still isn't a "full" window.
        if (runStart > 0) {
          windows++;
          lengths.push(runLength);
        }
        runLength = 0;
        inRetro = false;
      }
    }
    expect(windows).toBeGreaterThanOrEqual(3);
    expect(windows).toBeLessThanOrEqual(5);
    for (const len of lengths) {
      expect(len).toBeGreaterThanOrEqual(15);
      expect(len).toBeLessThanOrEqual(30);
    }
  });

  test('Sun speed ≈ 1°/day; Moon 11-15°/day; Sun/Moon never retrograde', () => {
    const t = d('2023-05-05T12:00:00Z');
    expect(getPlanetSpeed('Sun', t)).toBeGreaterThan(0.9);
    expect(getPlanetSpeed('Sun', t)).toBeLessThan(1.05);
    const moonSpeed = getPlanetSpeed('Moon', t);
    expect(moonSpeed).toBeGreaterThan(11);
    expect(moonSpeed).toBeLessThan(15.5);
    expect(getIsRetrograde('Sun', t)).toBe(false);
    expect(getIsRetrograde('Moon', t)).toBe(false);
  });
});

describe('Timezone offsets (H4: minute precision)', () => {
  test('India +5:30, Kabul +4:30 (no rounding to whole hours)', () => {
    const date = new Date('1995-04-10T12:00:00Z');
    expect(getTimezoneOffset('Asia/Kolkata', date)).toBeCloseTo(5.5, 5);
    expect(getTimezoneOffset('Asia/Kabul', date)).toBeCloseTo(4.5, 5);
  });

  test('Turkey historical table branches', () => {
    expect(getTurkeyHistoricalOffset(new Date('1990-07-15T12:00:00Z'))).toBe(3); // DST
    expect(getTurkeyHistoricalOffset(new Date('1990-01-15T12:00:00Z'))).toBe(2); // winter
    expect(getTurkeyHistoricalOffset(new Date('2020-01-15T12:00:00Z'))).toBe(3); // permanent +3
    expect(getTurkeyHistoricalOffset(new Date('1975-07-15T12:00:00Z'))).toBe(3); // 73-84 DST
    expect(getTurkeyHistoricalOffset(new Date('1960-07-15T12:00:00Z'))).toBe(2); // pre-73
  });

  test('explainTimezoneDecision covers every Turkey rule branch (Faz 6 acceptance)', () => {
    const jul90 = explainTimezoneDecision(new Date('1990-07-15T12:00:00Z'), 'Europe/Istanbul');
    expect(jul90.offsetHours).toBe(3);
    expect(jul90.dstActive).toBe(true);
    expect(jul90.ruleLabel).toContain('1985');

    const jan90 = explainTimezoneDecision(new Date('1990-01-15T12:00:00Z'), 'Europe/Istanbul');
    expect(jan90.offsetHours).toBe(2);
    expect(jan90.dstActive).toBe(false);

    const now = explainTimezoneDecision(new Date('2022-05-05T12:00:00Z'), 'Europe/Istanbul');
    expect(now.offsetHours).toBe(3);
    expect(now.dstActive).toBe(false);
    expect(now.ruleLabel).toContain('kalıcı');

    const y75 = explainTimezoneDecision(new Date('1975-07-15T12:00:00Z'), 'Europe/Istanbul');
    expect(y75.ruleLabel).toContain('1973');

    const y60 = explainTimezoneDecision(new Date('1960-07-15T12:00:00Z'), 'Europe/Istanbul');
    expect(y60.ruleLabel).toContain('1973 öncesi');

    const india = explainTimezoneDecision(new Date('1995-04-10T12:00:00Z'), 'Asia/Kolkata');
    expect(india.isTurkeyRule).toBe(false);
    expect(india.offsetHours).toBeCloseTo(5.5, 5);
  });
});

describe('Ascendant: physical sunrise identity', () => {
  test('at real sunrise the Sun sits on the Ascendant (Istanbul & New York)', () => {
    const places: [number, number][] = [
      [41.0082, 28.9784],   // Istanbul
      [40.7128, -74.006],   // New York
    ];
    for (const [lat, lon] of places) {
      const rs = sunRiseSet(lat, lon, new Date('2023-04-15T00:00:00Z'));
      expect(rs.sunrise).not.toBeNull();
      const sunrise = rs.sunrise as Date;
      // Build a chart exactly at sunrise (UTC input → offset 0)
      const chart = computeNatalChart(
        sunrise.getUTCFullYear(), sunrise.getUTCMonth() + 1, sunrise.getUTCDate(),
        sunrise.getUTCHours(), sunrise.getUTCMinutes(), lat, lon, 0, 'placidus'
      );
      const sunLon = chart.planets.find(p => p.name === 'Sun')!.longitude;
      // Refraction (~0.57°) + solar radius (~0.27°) push visible sunrise
      // early; near the horizon 1° altitude maps to up to ~2.5° of ecliptic
      // longitude depending on the ecliptic's angle → ≤3° tolerance.
      expect(angularDiff(chart.ascendant, sunLon)).toBeLessThan(3);

      // Sect flips across sunrise: 30 min after → day birth; 30 min before → night.
      // (At visible sunrise itself the geometric center is still ~0.8° below
      // the horizon due to refraction, so we test clear of the boundary.)
      const after = new Date(sunrise.getTime() + 30 * 60000);
      const chartAfter = computeNatalChart(
        after.getUTCFullYear(), after.getUTCMonth() + 1, after.getUTCDate(),
        after.getUTCHours(), after.getUTCMinutes(), lat, lon, 0, 'placidus'
      );
      expect(chartAfter.isDayBirth).toBe(true);
      const before = new Date(sunrise.getTime() - 30 * 60000);
      const chartBefore = computeNatalChart(
        before.getUTCFullYear(), before.getUTCMonth() + 1, before.getUTCDate(),
        before.getUTCHours(), before.getUTCMinutes(), lat, lon, 0, 'placidus'
      );
      expect(chartBefore.isDayBirth).toBe(false);
    }
  });
});

describe('House systems', () => {
  const ramc = 123.456;
  const lat = 41.0082;
  const obl = 23.44;

  test('Placidus: cusp1=ASC, cusp10=MC, opposites 180° apart, cyclic order', () => {
    const res = computeHouses(ramc, lat, obl, 'placidus');
    expect(res.houses[0]).toBeCloseTo(res.ascendant, 6);
    expect(res.houses[9]).toBeCloseTo(res.midheaven, 6);
    for (let i = 0; i < 6; i++) {
      expect(angularDiff(res.houses[i], res.houses[i + 6])).toBeCloseTo(180, 4);
    }
    // Cusps must advance monotonically around the circle
    for (let i = 0; i < 12; i++) {
      const step = ((res.houses[(i + 1) % 12] - res.houses[i] + 360) % 360);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(120);
    }
    expect(res.polarFallback).toBe(false);
  });

  test('Whole Sign: cusps at 0° of consecutive signs starting from ASC sign', () => {
    const res = computeHouses(ramc, lat, obl, 'whole');
    expect(res.houses[0] % 30).toBeCloseTo(0, 6);
    expect(Math.floor(res.ascendant / 30)).toBe(Math.floor(res.houses[0] / 30));
    for (let i = 0; i < 12; i++) {
      expect(((res.houses[(i + 1) % 12] - res.houses[i] + 360) % 360)).toBeCloseTo(30, 6);
    }
  });

  test('polar latitude falls back from Placidus to Whole Sign with flag', () => {
    const res = computeHouses(ramc, 70, obl, 'placidus');
    expect(res.polarFallback).toBe(true);
    expect(res.houses[0] % 30).toBeCloseTo(0, 6);
  });

  test('getPlanetHouse covers the 12th-house wrap segment (H12)', () => {
    const houses = Array.from({ length: 12 }, (_, i) => (300 + i * 30) % 360);
    // Cusp12 = 270 + ... houses[11] = (300+330)%360 = 270; wait: houses[0]=300...houses[11]=(300+330)%360=270
    // Point at 285° lies between cusp12 (270) and cusp1 (300) → house 12
    expect(getPlanetHouse(285, houses)).toBe(12);
    // Point just after cusp1
    expect(getPlanetHouse(301, houses)).toBe(1);
  });
});

describe('Aspect engine 2.0', () => {
  test('orb matrix: lights widen, outer pairs tighten', () => {
    expect(getOrb('Sun', 'Mars', 90)).toBeGreaterThan(getOrb('Mars', 'Venus', 90));
    expect(getOrb('Jupiter', 'Saturn', 90)).toBeLessThan(getOrb('Mars', 'Venus', 90));
  });

  test('detects minor aspects (quincunx) and applying from speeds', () => {
    const planets = [
      { name: 'Sun', longitude: 10, speed: 1 },
      { name: 'Saturn', longitude: 161, speed: 0.03 }, // 151° separation → quincunx orb 1
    ];
    const aspects = calculateAspects(planets, 0);
    const q = aspects.find(a => a.aspectType === 'Quincunx');
    expect(q).toBeDefined();
    // Sun gains ~0.97°/day on Saturn, separation 151 → moving toward exact 150? No: growing gap 151→ separation increases? Sun at 10 moving to 11 → separation 150 → approaching exact → applying
    expect(q!.isApplying).toBe(true);
  });
});

describe('Pattern detection (H7: the app is named Stellium)', () => {
  test('finds a sign stellium with ≥3 planets', () => {
    const planets = [
      { name: 'Sun', longitude: 35, sign: 'Boğa', house: 1 },
      { name: 'Mercury', longitude: 42, sign: 'Boğa', house: 1 },
      { name: 'Venus', longitude: 55, sign: 'Boğa', house: 2 },
      { name: 'Mars', longitude: 200, sign: 'Terazi', house: 6 },
    ];
    const patterns = detectPatterns(planets);
    const st = patterns.find(p => p.type === 'stellium-sign');
    expect(st).toBeDefined();
    expect(st!.title).toContain('Boğa');
    expect(st!.members).toHaveLength(3);
  });

  test('finds a T-square', () => {
    const planets = [
      { name: 'Sun', longitude: 0, sign: 'Koç', house: 1 },
      { name: 'Saturn', longitude: 180, sign: 'Terazi', house: 7 },
      { name: 'Mars', longitude: 90, sign: 'Yengeç', house: 4 },
    ];
    const patterns = detectPatterns(planets);
    expect(patterns.some(p => p.type === 't-square')).toBe(true);
  });

  test('finds a grand trine', () => {
    const planets = [
      { name: 'Moon', longitude: 5, sign: 'Koç', house: 1 },
      { name: 'Jupiter', longitude: 125, sign: 'Aslan', house: 5 },
      { name: 'Venus', longitude: 245, sign: 'Yay', house: 9 },
    ];
    const patterns = detectPatterns(planets);
    expect(patterns.some(p => p.type === 'grand-trine')).toBe(true);
  });
});

describe('Natal chart integration (H4 regression: half-hour zone)', () => {
  test('Delhi birth with +5.5 offset differs from rounded +5/+6 charts', () => {
    const mk = (off: number) => computeNatalChart(1990, 3, 15, 8, 30, 28.6139, 77.209, off, 'placidus');
    const exact = mk(5.5);
    const roundedUp = mk(6);
    // 30 minutes of clock error shifts the ASC by several degrees
    expect(angularDiff(exact.ascendant, roundedUp.ascendant)).toBeGreaterThan(3);
    expect(exact.planets).toHaveLength(10);
    expect(exact.points!.length).toBeGreaterThanOrEqual(5);
    // Fortuna formula flips correctly by sect
    const fortuna = exact.points!.find(p => p.name === 'Fortuna')!;
    const asc = exact.ascendant;
    const sun = exact.planets.find(p => p.name === 'Sun')!.longitude;
    const moon = exact.planets.find(p => p.name === 'Moon')!.longitude;
    const expected = exact.isDayBirth
      ? (asc + moon - sun + 720) % 360
      : (asc + sun - moon + 720) % 360;
    expect(angularDiff(fortuna.longitude, expected)).toBeLessThan(0.01);
  });
});

describe('Planetary hours from real sunrise (H5)', () => {
  test('24 hours, first day-hour starts at engine sunrise, ruler matches weekday', () => {
    const date = new Date(2024, 6, 7, 12, 0, 0); // a Sunday (local)
    const hours = calculatePlanetaryHours(41.0082, 28.9784, date);
    expect(hours).toHaveLength(24);
    // Sunday's first hour belongs to the Sun (Chaldean rule)
    expect(hours[0].planetName).toBe('Güneş');
    // Start must match the real astronomical sunrise for that local day
    const midnight = new Date(2024, 6, 7, 0, 0, 0);
    const rs = sunRiseSet(41.0082, 28.9784, midnight);
    expect(rs.sunrise).not.toBeNull();
    expect(Math.abs(hours[0].startTime.getTime() - (rs.sunrise as Date).getTime())).toBeLessThan(60000);
    // Day and night each split into 12
    expect(hours.filter(h => !h.isNight)).toHaveLength(12);
    expect(hours.filter(h => h.isNight)).toHaveLength(12);
  });
});
