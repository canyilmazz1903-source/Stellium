// Ebced (Abjad) Turkish Phonetic Mapping Table
const EBCED_MAP: Record<string, number> = {
  a: 1, â: 1, e: 1, // Alif
  b: 2, p: 2,       // Ba / Pe (mapped to Ba)
  c: 3, ç: 3, j: 3, // Jim / Che (mapped to Jim)
  d: 4,             // Dal
  h: 5,             // Ha
  v: 6, o: 6, ö: 6, u: 6, ü: 6, // Waw
  z: 7,             // Zay
  h_hard: 8,        // Hha (commonly mapped to 8, we map normal h if needed)
  t: 400,           // Ta (sometimes 9 for Tta, but Ta 400 is common)
  i: 10, ı: 10, y: 10, // Ya
  k: 20, g: 20, ğ: 20, // Kaf / Gef (mapped to Kaf)
  l: 30,             // Lam
  m: 40,             // Mim
  n: 50,             // Nun
  s: 60,             // Sin
  f: 80,             // Fa
  ş: 300,            // Shin
  r: 200,            // Ra
  q: 100,            // Qaf
  x: 600, w: 6,      // Extra mappings
};

// Map letters phonetically for more accurate traditional Turkish Ebced
function getLetterEbced(char: string, prevChar?: string): number {
  const c = char.toLowerCase();
  
  // Specific phonetic rules
  if (c === 'h') {
    // If it's a hard h (e.g., Ahmet, Mahmut), traditionally Hha (8). Else Ha (5)
    if (prevChar && ['a', 'o', 'u'].includes(prevChar.toLowerCase())) {
      return 8;
    }
    return 5;
  }
  
  return EBCED_MAP[c] || 0;
}

// Calculate the total Ebced value of a name or word
export function calculateEbced(name: string): number {
  let total = 0;
  const cleanName = name.trim();
  
  for (let i = 0; i < cleanName.length; i++) {
    const prev = i > 0 ? cleanName[i - 1] : undefined;
    total += getLetterEbced(cleanName[i], prev);
  }
  
  return total;
}

// Reduce a number to a single digit (1-9) using numerology / Ebced calculations
export function getSingleDigitReduction(num: number): number {
  if (num <= 0) return 9;
  let temp = num;
  while (temp > 9) {
    temp = String(temp).split('').reduce((sum, char) => sum + parseInt(char, 10), 0);
  }
  return temp;
}

export interface Esma {
  arabic: string;
  name: string;
  meaning: string;
  ebced: number;
  planet: string;
  day: string;
  hour: string;
}

// Selected Esma-ul Husna database with planetary correlations
export const ESMA_DATABASE: Esma[] = [
  { name: "Yâ Latîf", arabic: "اللطيف", meaning: "Sonsuz lütuf ve ihsan sahibi, incelik gösteren.", ebced: 129, planet: "Venus", day: "Cuma", hour: "Zühre (Venüs) Saati" },
  { name: "Yâ Rahmân", arabic: "الرحمن", meaning: "Dünyada her canlıya merhamet eden, şefkat gösteren.", ebced: 298, planet: "Sun", day: "Pazar", hour: "Güneş Saati" },
  { name: "Yâ Rahîm", arabic: "الرحيم", meaning: "Ahirette sadece inananlara rahmet eden.", ebced: 258, planet: "Venus", day: "Cuma", hour: "Zühre (Venüs) Saati" },
  { name: "Yâ Melik", arabic: "الملك", meaning: "Bütün kâinatın mutlak sahibi ve hükümdarı.", ebced: 90, planet: "Mars", day: "Salı", hour: "Merih (Mars) Saati" },
  { name: "Yâ Kuddûs", arabic: "القدوس", meaning: "Her türlü eksiklikten uzak, mutlak temiz.", ebced: 170, planet: "Saturn", day: "Cumartesi", hour: "Zühal (Satürn) Saati" },
  { name: "Yâ Selâm", arabic: "السلام", meaning: "Kullarını selamete çıkaran, barışın kaynağı.", ebced: 131, planet: "Sun", day: "Pazar", hour: "Güneş Saati" },
  { name: "Yâ Mü'min", arabic: "المؤمن", meaning: "Gönüllere iman veren, emniyet sağlayan.", ebced: 136, planet: "Moon", day: "Pazartesi", hour: "Kamer (Ay) Saati" },
  { name: "Yâ Müheymin", arabic: "المهيمن", meaning: "Her şeyi koruyup gözeten, kâinatı yöneten.", ebced: 145, planet: "Jupiter", day: "Perşembe", hour: "Müşteri (Jüpiter) Saati" },
  { name: "Yâ Azîz", arabic: "العزيز", meaning: "İzzet sahibi, mağlup edilmesi imkânsız olan.", ebced: 94, planet: "Mars", day: "Salı", hour: "Merih (Mars) Saati" },
  { name: "Yâ Cebbâr", arabic: "الجبار", meaning: "Dilediğini zorla yaptıran, kırıkları onaran.", ebced: 206, planet: "Mars", day: "Salı", hour: "Merih (Mars) Saati" },
  { name: "Yâ Hâlık", arabic: "الخالق", meaning: "Yoktan var eden, yaratan.", ebced: 731, planet: "Sun", day: "Pazar", hour: "Güneş Saati" },
  { name: "Yâ Bâri", arabic: "البارئ", meaning: "Her şeyi kusursuz ve uyumlu yaratan.", ebced: 213, planet: "Mercury", day: "Çarşamba", hour: "Utarit (Merkür) Saati" },
  { name: "Yâ Vedûd", arabic: "الودود", meaning: "Sevmeye ve sevilmeye en layık olan, sevgiyi yaratan.", ebced: 20, planet: "Venus", day: "Cuma", hour: "Zühre (Venüs) Saati" },
  { name: "Yâ Nûr", arabic: "النور", meaning: "Kâinatı nurlandıran, doğru yolu gösteren.", ebced: 256, planet: "Jupiter", day: "Perşembe", hour: "Müşteri (Jüpiter) Saati" },
  { name: "Yâ Hâdî", arabic: "الهادي", meaning: "Hidayet veren, kullarını doğru yola ulaştıran.", ebced: 20, planet: "Moon", day: "Pazartesi", hour: "Kamer (Ay) Saati" },
  { name: "Yâ Şâfî", arabic: "الشافي", meaning: "Şifa veren, hastalıklara derman olan.", ebced: 391, planet: "Mercury", day: "Çarşamba", hour: "Utarit (Merkür) Saati" }
];

// Find matching Esma values based on the calculated Ebced.
// We find Esmas that have the closest Ebced value or numerical resonance.
export function getMatchingEsmas(ebcedValue: number): Esma[] {
  // Return Esmas sorted by closeness to the Ebced value
  return [...ESMA_DATABASE].sort((a, b) => {
    const diffA = Math.abs(a.ebced - ebcedValue);
    const diffB = Math.abs(b.ebced - ebcedValue);
    return diffA - diffB;
  });
}

// Map single digit numerology reduction to Astrological Archetypes (Zodiac / Planet)
export const NUMEROLOGY_ARCHETYPES = [
  { digit: 1, planet: "Sun (Güneş)", element: "Ateş", trait: "Liderlik, yaratıcılık, ego, irade gücü" },
  { digit: 2, planet: "Moon (Ay)", element: "Su", trait: "Empati, sezgisellik, duygusal derinlik, şefkat" },
  { digit: 3, planet: "Jupiter (Jüpiter)", element: "Hava", trait: "Bilgelik, şans, bolluk, genişleme, felsefe" },
  { digit: 4, planet: "Uranus (Uranüs)", element: "Toprak", trait: "Özgünlük, devrim, analitik zeka, disiplin" },
  { digit: 5, planet: "Mercury (Merkür)", element: "Hava", trait: "İletişim, kıvrak zeka, merak, adaptasyon" },
  { digit: 6, planet: "Venus (Venüs)", element: "Toprak/Hava", trait: "Estetik, aşk, uyum, çekim gücü, sanat" },
  { digit: 7, planet: "Neptune (Neptün)", element: "Su", trait: "Mistisizm, maneviyat, hayal gücü, fedakarlık" },
  { digit: 8, planet: "Saturn (Satürn)", element: "Toprak", trait: "Karma, sorumluluk, sabır, otorite, dayanıklılık" },
  { digit: 9, planet: "Mars (Mars)", element: "Ateş", trait: "Cesaret, tutku, eylem, mücadele ruhu" }
];

export function getNumerologyArchetype(digit: number) {
  const index = (digit - 1) % 9;
  return NUMEROLOGY_ARCHETYPES[index];
}

// Core function to compile Name Analysis
export function computePersonalEbced(name: string) {
  const ebced = calculateEbced(name);
  const reduction = getSingleDigitReduction(ebced);
  const archetype = getNumerologyArchetype(reduction);
  const matches = getMatchingEsmas(ebced);

  return {
    ebced,
    reduction,
    archetype,
    primaryEsma: matches[0],
    alternativeEsmas: matches.slice(1, 4)
  };
}
