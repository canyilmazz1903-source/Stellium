// Faz 4 acceptance tests: dictionary-based ebced values, transliterator
// ambiguity flags, mod-system derivations, menzil boundaries, esma dataset.

import {
  calculateEbced,
  calculateEbcedDetailed,
  getSingleDigitReduction,
  getYildiznameSystems,
  ESMA_DATABASE,
  selectEsmasForProfile,
} from '../src/utils/ebced';
import { EBCED_NAME_DICTIONARY } from '../src/data/ebcedNames';
import { menzilFromLongitude } from '../src/utils/menazil';
import { MENAZIL } from '../src/data/menazilData';

describe('Ebced dictionary (H8 acceptance)', () => {
  test.each([
    ['Ahmed', 53],
    ['Ahmet', 53],
    ['Muhammed', 92],
    ['Mehmet', 92],
    ['Fatma', 135],
    ['Fatima', 135],
    ['Ayşe', 386],
    ['Ali', 110],
    ['Osman', 661],
    ['Zeynep', 69],
    ['Mustafa', 229],
    ['Hatice', 622],
    ['Meryem', 290],
    ['Elif', 111],
  ])('%s = %d (Arapça imlâdan)', (name, expected) => {
    expect(calculateEbced(name)).toBe(expected);
    const det = calculateEbcedDetailed(name);
    expect(det.source).toBe('dictionary');
    expect(det.ambiguous).toBe(false);
  });

  test('lookup is case/locale insensitive (Turkish İ/i)', () => {
    expect(calculateEbced('AHMET')).toBe(53);
    expect(calculateEbced('  ayşe ')).toBe(386);
  });

  test('dictionary has no zero/negative values and a healthy size', () => {
    const entries = Object.values(EBCED_NAME_DICTIONARY);
    expect(entries.length).toBeGreaterThan(120);
    for (const e of entries) {
      expect(e.value).toBeGreaterThan(0);
      expect(e.arabic.length).toBeGreaterThan(0);
    }
  });
});

describe('Transliterator fallback with ambiguity transparency', () => {
  test('unknown name falls back to transliteration and flags ambiguous letters', () => {
    const det = calculateEbcedDetailed('Zotan'); // uydurma isim: z + t belirsiz
    expect(det.source).toBe('transliteration');
    expect(det.ambiguous).toBe(true);
    expect(det.ambiguousLetters).toEqual(expect.arrayContaining(['z', 't']));
    expect(det.value).toBeGreaterThan(0);
  });

  test('unambiguous made-up name is not flagged', () => {
    const det = calculateEbcedDetailed('Lale'); // l,a,e → tek karşılık
    expect(det.source).toBe('transliteration');
    expect(det.ambiguous).toBe(false);
  });
});

describe('Yıldızname mod systems (12/9/7/4)', () => {
  test('classical derivations from a known total', () => {
    // Ahmed(53) + Fatma(135) = 188
    const sys = getYildiznameSystems(188);
    expect(sys.mod12.remainder).toBe(8);
    expect(sys.mod12.sign).toBe('Akrep');
    expect(sys.mod9.root).toBe(getSingleDigitReduction(188)); // 8
    expect(sys.mod7.remainder).toBe(6);
    expect(sys.mod7.planet).toBe('Venüs');
    expect(sys.mod4.remainder).toBe(4);
    expect(sys.mod4.name).toBe('Balgamî');
    expect(sys.mod4.element).toBe('Su');
  });

  test('remainder 0 maps to the last slot (klasik usul)', () => {
    const sys = getYildiznameSystems(84); // 84 % 12 = 0 → 12 → Balık; %7=0→7→Satürn; %4=0→4→Balgamî
    expect(sys.mod12.sign).toBe('Balık');
    expect(sys.mod7.planet).toBe('Satürn');
    expect(sys.mod4.name).toBe('Balgamî');
  });
});

describe('Esmâ-ül Hüsnâ dataset', () => {
  test('contains the full 99 names, unique, with positive ebced values', () => {
    expect(ESMA_DATABASE).toHaveLength(99);
    const names = new Set(ESMA_DATABASE.map(e => e.name));
    expect(names.size).toBe(99);
    for (const e of ESMA_DATABASE) {
      expect(e.ebced).toBeGreaterThan(0);
      expect(e.day).toBeTruthy();
      expect(e.element).toBeTruthy();
      expect(e.category).toBeTruthy();
    }
  });

  test.each([
    ['Yâ Latîf', 129],
    ['Yâ Vedûd', 20],
    ['Yâ Fettâh', 489],
    ['Yâ Rezzâk', 308],
    ['Yâ Selâm', 131],
    ['Yâ Kuddûs', 170],
    ['Yâ Rahmân', 298],
  ])('%s = %d', (name, val) => {
    const e = ESMA_DATABASE.find(x => x.name === name);
    expect(e).toBeDefined();
    expect(e!.ebced).toBe(val);
  });

  test('three-factor matcher prefers element + hour-planet alignment', () => {
    const { primary } = selectEsmasForProfile(129, 'Toprak', 'Venus');
    expect(primary.planet).toBe('Venus');
    const res = selectEsmasForProfile(129);
    expect(res.alternatives).toHaveLength(3);
  });
});

describe('Menazil-i Kamer (28 lunar mansions)', () => {
  test('dataset integrity: 28 mansions in canonical order', () => {
    expect(MENAZIL).toHaveLength(28);
    expect(MENAZIL[0].name).toBe('Şeratan');
    expect(MENAZIL[2].name).toBe('Süreyya');
    expect(MENAZIL[27].name).toBe('Reşa');
    MENAZIL.forEach((m, i) => expect(m.index).toBe(i + 1));
  });

  test('longitude → mansion boundaries (span = 12°51\'25.7")', () => {
    expect(menzilFromLongitude(0).index).toBe(1);
    expect(menzilFromLongitude(12.85).index).toBe(1);   // hâlâ 1. menzil
    expect(menzilFromLongitude(12.86).index).toBe(2);   // sınırın hemen ötesi
    expect(menzilFromLongitude(180).index).toBe(15);    // 180/12.857 = 14.0 → 15. menzil
    expect(menzilFromLongitude(359.9).index).toBe(28);
    expect(menzilFromLongitude(360).index).toBe(1);     // normalize
  });
});
