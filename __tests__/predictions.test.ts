// Faz 5 acceptance tests: prediction engines against physical/known anchors.

import {
  computeProgressions,
  computeProfection,
  computeFirdaria,
  computeEclipses,
  findSolarReturn,
  isMoonVoidOfCourse,
  findBestDates,
} from '../src/utils/predictions';
import { getJulianDaysSinceJ2000, getPlanetLongitude } from '../src/utils/astronomy';

describe('Solar Return', () => {
  test('Sun returns to natal longitude within arc-seconds near the birthday', () => {
    const birth = new Date('1990-07-15T07:30:00Z');
    const natalSun = getPlanetLongitude('Sun', getJulianDaysSinceJ2000(birth));
    const sr = findSolarReturn(natalSun, 2025, 7, 15);
    const srSun = getPlanetLongitude('Sun', getJulianDaysSinceJ2000(sr));
    let diff = Math.abs(srSun - natalSun);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(0.001); // ≈ ±1.5 dakika zaman hassasiyeti
    // Return lands within ±2 days of the birthday
    expect(Math.abs(sr.getTime() - Date.UTC(2025, 6, 15))).toBeLessThan(2.5 * 86400000);
  });
});

describe('Eclipse calendar (NASA catalog anchors)', () => {
  test('finds the 2024-04-08 total solar and 2025-03-14 total lunar eclipses', () => {
    // Search window anchored in the past via a fixed clock offset:
    // computeEclipses uses Date.now(), so instead verify the underlying
    // search by asking for a wide window from a mocked "now".
    const realNow = Date.now;
    try {
      (Date as any).now = () => new Date('2024-01-15T00:00:00Z').getTime();
      const events = computeEclipses(null, null, 18);
      const solar20240408 = events.find(e => e.type === 'solar' && Math.abs(e.date.getTime() - Date.UTC(2024, 3, 8, 18, 18)) < 86400000);
      expect(solar20240408).toBeDefined();
      const lunar20250314 = events.find(e => e.type === 'lunar' && Math.abs(e.date.getTime() - Date.UTC(2025, 2, 14, 7, 0)) < 86400000);
      expect(lunar20250314).toBeDefined();
      // Chronological order
      for (let i = 1; i < events.length; i++) {
        expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
      }
    } finally {
      (Date as any).now = realNow;
    }
  });
});

describe('Profection & Firdaria', () => {
  test('profection: age mod 12 → house, whole-sign from ASC', () => {
    const birth = new Date('1990-07-15T07:30:00Z');
    const now = new Date('2026-07-20T12:00:00Z'); // 36 yaş
    const asc = 95; // Yengeç 5°
    const res = computeProfection(birth, asc, now);
    expect(res.age).toBe(36);
    expect(res.house).toBe(1); // 36 % 12 = 0 → 1. ev yılı
    expect(res.sign).toBe('Yengeç');
    expect(res.yearLord).toBe('Ay');
  });

  test('firdaria day-birth sequence and boundaries', () => {
    expect(computeFirdaria(5, true).majorLord).toBe('Güneş');    // 0-10 Güneş
    expect(computeFirdaria(12, true).majorLord).toBe('Venüs');   // 10-18 Venüs
    expect(computeFirdaria(20, true).majorLord).toBe('Merkür');  // 18-31 Merkür
    expect(computeFirdaria(5, false).majorLord).toBe('Ay');      // gece: 0-9 Ay
    const withSub = computeFirdaria(5, true);
    expect(withSub.subLord).toBeTruthy();
    expect(computeFirdaria(71, true).majorLord).toContain('Düğüm'); // 70-73 K.Düğüm
    expect(computeFirdaria(71, true).subLord).toBeNull();
  });

  test('progressions: progressed Moon ~13°/year, sign change within 2.5y', () => {
    const birth = new Date('1990-07-15T07:30:00Z');
    const houses = Array.from({ length: 12 }, (_, i) => i * 30);
    const res = computeProgressions(birth, houses, new Date('2026-07-20T12:00:00Z'));
    expect(res.ageYears).toBeGreaterThan(35.9);
    expect(res.ageYears).toBeLessThan(36.1);
    expect(res.nextMoonSignChangeYears).toBeGreaterThan(0);
    expect(res.nextMoonSignChangeYears).toBeLessThan(2.6);
    expect(res.nextProgressedNewMoonYears).toBeGreaterThan(0);
    expect(res.nextProgressedNewMoonYears).toBeLessThan(31);
  });
});

describe('Void-of-course Moon', () => {
  test('returns a sign-change time within ~2.7 days and a boolean', () => {
    const res = isMoonVoidOfCourse(new Date('2024-06-10T12:00:00Z'));
    expect(typeof res.voc).toBe('boolean');
    const hours = (res.signChangeAt.getTime() - Date.UTC(2024, 5, 10, 12)) / 3600000;
    expect(hours).toBeGreaterThan(0);
    expect(hours).toBeLessThan(66); // Ay bir burçta en fazla ~2.7 gün kalır
  });
});

describe('Electional engine', () => {
  test('returns top-3 scored windows with reasons', () => {
    const res = findBestDates('başlangıç', 10); // kısa pencere: test hızı
    expect(res).toHaveLength(3);
    expect(res[0].score).toBeGreaterThanOrEqual(res[1].score);
    expect(res[1].score).toBeGreaterThanOrEqual(res[2].score);
    for (const w of res) {
      expect(w.menzilName).toBeTruthy();
      expect(w.moonSign).toBeTruthy();
      expect(Array.isArray(w.reasons)).toBe(true);
    }
  });
});
