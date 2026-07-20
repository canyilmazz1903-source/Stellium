// Ebced motoru 2.0 (H8 çözümü).
// Katman 1: isim sözlüğü (Arapça imlâdan kesin değer) — tek doğruluk kaynağı.
// Katman 2: sözlükte olmayan isimler için fonetik çevirici; tı/ta, sin/sad/se,
// ze/zel/dad/zı gibi çok karşılıklı harflerde BELİRSİZLİK BAYRAĞI kaldırır ve
// alternatif değerleri açıkça listeler (belirsizliği gizlemek yerine kullanıcıya
// şeffaf sunmak, gelenek bilen kitlede güven yaratır).

import { lookupEbcedName } from '@/data/ebcedNames';

// Türkçe fonetik → ebced varsayılan haritası (çevirici katmanı).
// Çok karşılıklı harflerin varsayılanı ve alternatifleri ayrı tutulur.
const DEFAULT_MAP: Record<string, number> = {
  a: 1, â: 1, e: 1,            // elif
  b: 2, p: 2,                  // be (pe → be)
  c: 3, ç: 3, j: 3,            // cim
  d: 4,                        // dal
  h: 5,                        // he (bağlama göre ha=8; alternatif hı=600)
  v: 6, o: 6, ö: 6, u: 6, ü: 6, w: 6, // vav
  z: 7,                        // ze (alternatif: zel 700, dad 800, zı 900)
  t: 400,                      // te (alternatif: tı 9)
  i: 10, ı: 10, y: 10,         // ye
  k: 20, g: 20,                // kef / gef
  ğ: 1000,                     // gayn
  l: 30,
  m: 40,
  n: 50,
  s: 60,                       // sin (alternatif: sad 90, se 500)
  f: 80,
  q: 100,                      // kaf
  r: 200,
  ş: 300,
  x: 600,
};

// Belirsiz harfler ve alternatif değerleri (çeviricinin şeffaflık katmanı)
const AMBIGUOUS: Record<string, { default: number; alternatives: { value: number; letter: string }[] }> = {
  t: { default: 400, alternatives: [{ value: 9, letter: 'tı (ط)' }] },
  s: { default: 60, alternatives: [{ value: 90, letter: 'sad (ص)' }, { value: 500, letter: 'se (ث)' }] },
  z: { default: 7, alternatives: [{ value: 700, letter: 'zel (ذ)' }, { value: 800, letter: 'dad (ض)' }, { value: 900, letter: 'zı (ظ)' }] },
  h: { default: 5, alternatives: [{ value: 8, letter: 'ha (ح)' }, { value: 600, letter: 'hı (خ)' }] },
  k: { default: 20, alternatives: [{ value: 100, letter: 'kaf (ق)' }] },
};

function transliterateLetter(char: string, prevChar?: string): number {
  const c = char.toLowerCase();
  if (c === 'h') {
    // Ahmet/Mahmut tipi kalın ünlü sonrası h → geleneksel olarak ha (8)
    if (prevChar && ['a', 'o', 'u', 'ı'].includes(prevChar.toLowerCase())) return 8;
    return 5;
  }
  return DEFAULT_MAP[c] || 0;
}

export interface EbcedResult {
  value: number;
  source: 'dictionary' | 'transliteration';
  arabic?: string;
  note?: string;
  ambiguous: boolean;
  ambiguousLetters: string[]; // hangi harfler çok karşılıklı
}

// Detaylı hesap: önce sözlük, yoksa çevirici + belirsizlik raporu.
export function calculateEbcedDetailed(name: string): EbcedResult {
  const dict = lookupEbcedName(name);
  if (dict) {
    return {
      value: dict.value,
      source: 'dictionary',
      arabic: dict.arabic,
      note: dict.note,
      ambiguous: false,
      ambiguousLetters: [],
    };
  }

  const clean = name.trim();
  let total = 0;
  const ambiguousLetters = new Set<string>();
  for (let i = 0; i < clean.length; i++) {
    const prev = i > 0 ? clean[i - 1] : undefined;
    const c = clean[i].toLowerCase();
    total += transliterateLetter(clean[i], prev);
    if (AMBIGUOUS[c]) ambiguousLetters.add(c);
  }

  return {
    value: total,
    source: 'transliteration',
    ambiguous: ambiguousLetters.size > 0,
    ambiguousLetters: Array.from(ambiguousLetters),
  };
}

// Geriye dönük uyumlu basit API (sözlük öncelikli).
export function calculateEbced(name: string): number {
  return calculateEbcedDetailed(name).value;
}

// Reduce a number to a single digit (1-9)
export function getSingleDigitReduction(num: number): number {
  if (num <= 0) return 9;
  let temp = num;
  while (temp > 9) {
    temp = String(temp).split('').reduce((sum, char) => sum + parseInt(char, 10), 0);
  }
  return temp;
}

// ---------- Tali yıldızname sistemleri (mod 12 / 9 / 7 / 4) ----------

const SIGNS_TR = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];

// Haftanın günü sırasına göre gezegen tabı (geleneksel gün hükümdarları)
const MOD7_PLANETS = [
  { planet: 'Güneş', theme: 'itibar, liderlik ve öz güç' },
  { planet: 'Ay', theme: 'sezgi, duyarlılık ve halk içinde sevilme' },
  { planet: 'Mars', theme: 'cesaret, mücadele ve girişim gücü' },
  { planet: 'Merkür', theme: 'zeka, ticaret ve ifade yeteneği' },
  { planet: 'Jüpiter', theme: 'bereket, ilim ve genişleme' },
  { planet: 'Venüs', theme: 'muhabbet, sanat ve cazibe' },
  { planet: 'Satürn', theme: 'sabır, derinlik ve dayanıklılık' },
];

// Ahlat-ı Erbaa (dört hılt) — mod 4 mizaç sistemi
const MOD4_TEMPERAMENTS = [
  {
    name: 'Safravî', element: 'Ateş', quality: 'Sıcak & Kuru (hararet-yübuset)',
    description: 'Geleneksel öğretiye göre safravî mizaç; atılgan, hızlı karar veren, önder ruhlu bir tabiattır. Dengede tutulması gereken yönü öfke ve aceleciliktir; serinletici, sakinleştirici rutinler (su kenarı, geç saatte hafif yemek) bu mizacın ilacıdır.',
  },
  {
    name: 'Sevdavî', element: 'Toprak', quality: 'Soğuk & Kuru (bürudet-yübuset)',
    description: 'Geleneksel öğretiye göre sevdavî mizaç; derin düşünen, temkinli, hafızası kuvvetli bir tabiattır. Dengede tutulması gereken yönü kaygı ve içe kapanmadır; hareket, güneş ışığı ve paylaşım bu mizacı dengeler.',
  },
  {
    name: 'Demevî', element: 'Hava', quality: 'Sıcak & Nemli (hararet-rutubet)',
    description: 'Geleneksel öğretiye göre demevî mizaç; neşeli, sosyal, kanı sıcak bir tabiattır. Dengede tutulması gereken yönü dağınıklık ve aşırılıktır; düzenli uyku ve ölçülülük bu mizacın terazisidir.',
  },
  {
    name: 'Balgamî', element: 'Su', quality: 'Soğuk & Nemli (bürudet-rutubet)',
    description: 'Geleneksel öğretiye göre balgamî mizaç; sakin, sabırlı, barışçıl bir tabiattır. Dengede tutulması gereken yönü atalet ve erteleme eğilimidir; ısındırıcı hareket ve net hedefler bu mizacı canlandırır.',
  },
];

export interface YildiznameSystems {
  mod12: { remainder: number; sign: string };
  mod9: { root: number };
  mod7: { remainder: number; planet: string; theme: string };
  mod4: { remainder: number; name: string; element: string; quality: string; description: string };
}

// Klasik yıldızname çıkarımları: toplam ebced değerinden dört ayrı geleneksel
// sistem. Kalan 0, o sistemin son basamağı sayılır (klasik usul).
export function getYildiznameSystems(totalEbced: number): YildiznameSystems {
  const m12 = totalEbced % 12 === 0 ? 12 : totalEbced % 12;
  const m7 = totalEbced % 7 === 0 ? 7 : totalEbced % 7;
  const m4 = totalEbced % 4 === 0 ? 4 : totalEbced % 4;
  return {
    mod12: { remainder: m12, sign: SIGNS_TR[m12 - 1] },
    mod9: { root: getSingleDigitReduction(totalEbced) },
    mod7: { remainder: m7, ...MOD7_PLANETS[m7 - 1] },
    mod4: { remainder: m4, ...MOD4_TEMPERAMENTS[m4 - 1] },
  };
}

// ---------- 99 Esmâ-ül Hüsnâ veri seti ----------
// Değerler harf-harf ebced toplamıdır; gezegen/gün eşleşmesi ve niyet
// kategorisi geleneksel yaygın tasnife göredir.

export interface Esma {
  arabic: string;
  name: string;
  meaning: string;
  ebced: number;
  planet: string;
  day: string;
  hour: string;
  element?: string;
  category?: string;
}

const PLANET_HOUR_TR: Record<string, { day: string; hour: string; element: string }> = {
  Sun: { day: 'Pazar', hour: 'Güneş Saati', element: 'Ateş' },
  Moon: { day: 'Pazartesi', hour: 'Kamer (Ay) Saati', element: 'Su' },
  Mars: { day: 'Salı', hour: 'Merih (Mars) Saati', element: 'Ateş' },
  Mercury: { day: 'Çarşamba', hour: 'Utarit (Merkür) Saati', element: 'Hava' },
  Jupiter: { day: 'Perşembe', hour: 'Müşteri (Jüpiter) Saati', element: 'Hava' },
  Venus: { day: 'Cuma', hour: 'Zühre (Venüs) Saati', element: 'Toprak' },
  Saturn: { day: 'Cumartesi', hour: 'Zühal (Satürn) Saati', element: 'Toprak' },
};

function esma(name: string, arabic: string, ebced: number, meaning: string, planet: string, category: string): Esma {
  const ph = PLANET_HOUR_TR[planet] || PLANET_HOUR_TR.Sun;
  return { name, arabic, ebced, meaning, planet, day: ph.day, hour: ph.hour, element: ph.element, category };
}

export const ESMA_DATABASE: Esma[] = [
  esma('Yâ Rahmân', 'الرحمن', 298, 'Dünyada her canlıya merhamet eden.', 'Sun', 'şifa'),
  esma('Yâ Rahîm', 'الرحيم', 258, 'Ahirette müminlere rahmet eden.', 'Venus', 'şifa'),
  esma('Yâ Melik', 'الملك', 90, 'Mutlak hükümdar.', 'Sun', 'güç'),
  esma('Yâ Kuddûs', 'القدوس', 170, 'Her eksiklikten münezzeh, arındıran.', 'Saturn', 'koruma'),
  esma('Yâ Selâm', 'السلام', 131, 'Esenlik veren, selamete çıkaran.', 'Sun', 'huzur'),
  esma("Yâ Mü'min", 'المؤمن', 136, 'Güven veren, emniyet sağlayan.', 'Moon', 'koruma'),
  esma('Yâ Müheymin', 'المهيمن', 145, 'Koruyup gözeten.', 'Jupiter', 'koruma'),
  esma('Yâ Azîz', 'العزيز', 94, 'Mağlup edilemez izzet sahibi.', 'Mars', 'güç'),
  esma('Yâ Cebbâr', 'الجبار', 206, 'Kırıkları onaran, dilediğini yaptıran.', 'Mars', 'güç'),
  esma('Yâ Mütekebbir', 'المتكبر', 662, 'Büyüklük yalnız kendine ait olan.', 'Mars', 'güç'),
  esma('Yâ Hâlık', 'الخالق', 731, 'Yoktan yaratan.', 'Sun', 'bereket'),
  esma('Yâ Bâri', 'البارئ', 213, 'Kusursuz ve uyumlu yaratan.', 'Mercury', 'şifa'),
  esma('Yâ Musavvir', 'المصور', 336, 'Her şeye suret veren.', 'Venus', 'sanat'),
  esma('Yâ Gaffâr', 'الغفار', 1281, 'Günahları tekrar tekrar bağışlayan.', 'Jupiter', 'af'),
  esma('Yâ Kahhâr', 'القهار', 306, 'Her şeye galip gelen.', 'Mars', 'güç'),
  esma('Yâ Vehhâb', 'الوهاب', 14, 'Karşılıksız bol veren.', 'Venus', 'rızık'),
  esma('Yâ Rezzâk', 'الرزاق', 308, 'Rızıkları yaratan ve ulaştıran.', 'Jupiter', 'rızık'),
  esma('Yâ Fettâh', 'الفتاح', 489, 'Kapıları ve kısmetleri açan.', 'Jupiter', 'rızık'),
  esma('Yâ Alîm', 'العليم', 150, 'Her şeyi bilen.', 'Mercury', 'ilim'),
  esma('Yâ Kâbıd', 'القابض', 903, 'Daraltan, sıkan (hikmetle).', 'Saturn', 'denge'),
  esma('Yâ Bâsıt', 'الباسط', 72, 'Genişleten, ferahlatan.', 'Jupiter', 'rızık'),
  esma('Yâ Hâfıd', 'الخافض', 1481, 'Alçaltan (zalimleri).', 'Saturn', 'adalet'),
  esma('Yâ Râfi', 'الرافع', 351, 'Yükselten.', 'Sun', 'itibar'),
  esma('Yâ Muizz', 'المعز', 117, 'İzzet ve şeref veren.', 'Sun', 'itibar'),
  esma('Yâ Müzill', 'المذل', 770, 'Zillete düşüren (zulmü).', 'Saturn', 'adalet'),
  esma('Yâ Semî', 'السميع', 180, 'Her sesi işiten.', 'Mercury', 'dua'),
  esma('Yâ Basîr', 'البصير', 302, 'Her şeyi gören.', 'Sun', 'dua'),
  esma('Yâ Hakem', 'الحكم', 68, 'Hükmeden, son kararı veren.', 'Jupiter', 'adalet'),
  esma('Yâ Adl', 'العدل', 104, 'Mutlak adil.', 'Saturn', 'adalet'),
  esma('Yâ Latîf', 'اللطيف', 129, 'İnceliklerle lütfeden.', 'Venus', 'huzur'),
  esma('Yâ Habîr', 'الخبير', 812, 'Her şeyin iç yüzünden haberdar.', 'Mercury', 'ilim'),
  esma('Yâ Halîm', 'الحليم', 88, 'Cezada acele etmeyen, yumuşak davranan.', 'Moon', 'huzur'),
  esma('Yâ Azîm', 'العظيم', 1020, 'Azamet sahibi.', 'Jupiter', 'güç'),
  esma('Yâ Gafûr', 'الغفور', 1286, 'Çok bağışlayan.', 'Jupiter', 'af'),
  esma('Yâ Şekûr', 'الشكور', 526, 'Az amele çok karşılık veren.', 'Venus', 'bereket'),
  esma('Yâ Aliyy', 'العلي', 110, 'Yüceler yücesi.', 'Sun', 'itibar'),
  esma('Yâ Kebîr', 'الكبير', 232, 'Büyüklükte eşsiz.', 'Sun', 'güç'),
  esma('Yâ Hafîz', 'الحفيظ', 998, 'Koruyup muhafaza eden.', 'Saturn', 'koruma'),
  esma('Yâ Mukît', 'المقيت', 550, 'Her canlının azığını veren.', 'Moon', 'rızık'),
  esma('Yâ Hasîb', 'الحسيب', 80, 'Hesaba çeken, kâfi gelen.', 'Mercury', 'denge'),
  esma('Yâ Celîl', 'الجليل', 73, 'Celal ve ululuk sahibi.', 'Mars', 'güç'),
  esma('Yâ Kerîm', 'الكريم', 270, 'Cömertlik sahibi.', 'Jupiter', 'bereket'),
  esma('Yâ Rakîb', 'الرقيب', 312, 'Her an gözetleyen.', 'Moon', 'koruma'),
  esma('Yâ Mücîb', 'المجيب', 55, 'Dualara icabet eden.', 'Venus', 'dua'),
  esma('Yâ Vâsi', 'الواسع', 137, 'İlmi ve rahmeti geniş.', 'Jupiter', 'bereket'),
  esma('Yâ Hakîm', 'الحكيم', 78, 'Hikmet sahibi.', 'Mercury', 'ilim'),
  esma('Yâ Vedûd', 'الودود', 20, 'Seven ve sevilen.', 'Venus', 'muhabbet'),
  esma('Yâ Mecîd', 'المجيد', 57, 'Şanı yüce.', 'Sun', 'itibar'),
  esma('Yâ Bâis', 'الباعث', 573, 'Ölüleri dirilten, harekete geçiren.', 'Mars', 'canlanma'),
  esma('Yâ Şehîd', 'الشهيد', 319, 'Her şeye şahit.', 'Sun', 'hakikat'),
  esma('Yâ Hakk', 'الحق', 108, 'Mutlak gerçek.', 'Sun', 'hakikat'),
  esma('Yâ Vekîl', 'الوكيل', 66, 'Kendine güvenilen, işleri üstlenen.', 'Moon', 'tevekkül'),
  esma('Yâ Kaviyy', 'القوي', 116, 'Sonsuz güç sahibi.', 'Mars', 'güç'),
  esma('Yâ Metîn', 'المتين', 500, 'Sarsılmaz sağlamlıkta.', 'Saturn', 'güç'),
  esma('Yâ Veliyy', 'الولي', 46, 'Dost ve yardımcı.', 'Moon', 'muhabbet'),
  esma('Yâ Hamîd', 'الحميد', 62, 'Övgüye layık.', 'Venus', 'şükür'),
  esma('Yâ Muhsî', 'المحصي', 148, 'Her şeyi tek tek bilen/sayan.', 'Mercury', 'ilim'),
  esma('Yâ Mübdi', 'المبدئ', 57, 'İlk defa yaratan.', 'Sun', 'başlangıç'),
  esma('Yâ Muîd', 'المعيد', 124, 'Yeniden dirilten, iade eden.', 'Moon', 'canlanma'),
  esma('Yâ Muhyî', 'المحيي', 68, 'Hayat veren.', 'Sun', 'şifa'),
  esma('Yâ Mümît', 'المميت', 490, 'Ölümü yaratan.', 'Saturn', 'dönüşüm'),
  esma('Yâ Hayy', 'الحي', 18, 'Ezelî ve ebedî diri.', 'Sun', 'canlanma'),
  esma('Yâ Kayyûm', 'القيوم', 156, 'Her şeyi ayakta tutan.', 'Saturn', 'denge'),
  esma('Yâ Vâcid', 'الواجد', 14, 'Dilediğini bulan, hiçbir şeye muhtaç olmayan.', 'Jupiter', 'bereket'),
  esma('Yâ Mâcid', 'الماجد', 48, 'Kerem ve şanı bol.', 'Sun', 'itibar'),
  esma('Yâ Vâhid', 'الواحد', 19, 'Tek ve benzersiz.', 'Sun', 'hakikat'),
  esma('Yâ Ehad', 'الأحد', 13, 'Mutlak bir.', 'Sun', 'hakikat'),
  esma('Yâ Samed', 'الصمد', 134, 'Her şeyin kendisine muhtaç olduğu.', 'Saturn', 'tevekkül'),
  esma('Yâ Kâdir', 'القادر', 305, 'Her şeye gücü yeten.', 'Mars', 'güç'),
  esma('Yâ Muktedir', 'المقتدر', 744, 'Kudretiyle her şeyi düzenleyen.', 'Mars', 'güç'),
  esma('Yâ Mukaddim', 'المقدم', 184, 'Öne alan, ilerleten.', 'Mars', 'başlangıç'),
  esma('Yâ Muahhir', 'المؤخر', 846, 'Ertelen, geride bırakan (hikmetle).', 'Saturn', 'denge'),
  esma('Yâ Evvel', 'الأول', 37, 'Başlangıcı olmayan ilk.', 'Sun', 'başlangıç'),
  esma('Yâ Âhir', 'الآخر', 801, 'Sonu olmayan son.', 'Saturn', 'dönüşüm'),
  esma('Yâ Zâhir', 'الظاهر', 1106, 'Varlığı apaçık olan.', 'Sun', 'hakikat'),
  esma('Yâ Bâtın', 'الباطن', 62, 'Gizliliklerin sahibi.', 'Moon', 'sır'),
  esma('Yâ Vâlî', 'الوالي', 47, 'Yöneten, idare eden.', 'Sun', 'itibar'),
  esma('Yâ Müteâlî', 'المتعالي', 551, 'Yüceliği aşkın olan.', 'Jupiter', 'itibar'),
  esma('Yâ Berr', 'البر', 202, 'İyiliği bol.', 'Venus', 'bereket'),
  esma('Yâ Tevvâb', 'التواب', 409, 'Tevbeleri kabul eden.', 'Jupiter', 'af'),
  esma('Yâ Müntekim', 'المنتقم', 630, 'Zulmün karşılığını veren.', 'Mars', 'adalet'),
  esma('Yâ Afüvv', 'العفو', 156, 'Affı çok olan.', 'Venus', 'af'),
  esma('Yâ Raûf', 'الرؤوف', 292, 'Çok şefkatli.', 'Moon', 'şifa'),
  esma('Yâ Mâlikü’l-Mülk', 'مالك الملك', 212, 'Mülkün gerçek sahibi.', 'Sun', 'rızık'),
  esma('Yâ Zü’l-Celâli ve’l-İkrâm', 'ذو الجلال والاكرام', 1100, 'Celal ve ikram sahibi.', 'Jupiter', 'itibar'),
  esma('Yâ Muksit', 'المقسط', 209, 'Adaletle hükmeden.', 'Saturn', 'adalet'),
  esma('Yâ Câmi', 'الجامع', 114, 'Dilediğini bir araya getiren.', 'Venus', 'muhabbet'),
  esma('Yâ Ganiyy', 'الغني', 1060, 'Hiçbir şeye muhtaç olmayan zengin.', 'Jupiter', 'rızık'),
  esma('Yâ Mugnî', 'المغني', 1100, 'Zenginlik veren.', 'Jupiter', 'rızık'),
  esma('Yâ Mâni', 'المانع', 161, 'Kötülüğe engel olan.', 'Saturn', 'koruma'),
  esma('Yâ Dârr', 'الضار', 1001, 'Hikmetle zarar yaratmaya kadir olan.', 'Saturn', 'denge'),
  esma('Yâ Nâfi', 'النافع', 201, 'Fayda veren.', 'Venus', 'şifa'),
  esma('Yâ Nûr', 'النور', 256, 'Kâinatı nurlandıran.', 'Sun', 'hidayet'),
  esma('Yâ Hâdî', 'الهادي', 20, 'Doğru yola ulaştıran.', 'Moon', 'hidayet'),
  esma('Yâ Bedî', 'البديع', 86, 'Örneksiz yaratan.', 'Venus', 'sanat'),
  esma('Yâ Bâkî', 'الباقي', 113, 'Varlığı sonsuz.', 'Saturn', 'süreklilik'),
  esma('Yâ Vâris', 'الوارث', 707, 'Her şeyin son sahibi.', 'Moon', 'süreklilik'),
  esma('Yâ Reşîd', 'الرشيد', 514, 'Doğru yolu gösteren.', 'Mercury', 'hidayet'),
  esma('Yâ Sabûr', 'الصبور', 298, 'Sonsuz sabır sahibi.', 'Saturn', 'huzur'),
];

// Ebced yakınlığına göre eski basit eşleme (geriye dönük uyumluluk)
export function getMatchingEsmas(ebcedValue: number): Esma[] {
  return [...ESMA_DATABASE].sort((a, b) => {
    const diffA = Math.abs(a.ebced - ebcedValue);
    const diffB = Math.abs(b.ebced - ebcedValue);
    return diffA - diffB;
  });
}

// Üç faktörlü esma eşleştirme: ebced kökü uyumu + element uyumu + (varsa)
// aktif gezegen saati uyumu. Skor eşitse ebced yakınlığı belirler.
export function selectEsmasForProfile(
  ebcedValue: number,
  element?: string,
  activeHourPlanet?: string
): { primary: Esma; alternatives: Esma[] } {
  const root = getSingleDigitReduction(ebcedValue);
  const scored = ESMA_DATABASE.map((e) => {
    let score = 0;
    if (getSingleDigitReduction(e.ebced) === root) score += 2;
    if (element && e.element === element) score += 2;
    if (activeHourPlanet && e.planet === activeHourPlanet) score += 3;
    return { e, score, closeness: Math.abs(e.ebced - ebcedValue) };
  });
  scored.sort((a, b) => (b.score - a.score) || (a.closeness - b.closeness));
  return { primary: scored[0].e, alternatives: scored.slice(1, 4).map(s => s.e) };
}

// Numeroloji arketipleri (mevcut API korunur)
export const NUMEROLOGY_ARCHETYPES = [
  { digit: 1, planet: 'Sun (Güneş)', element: 'Ateş', trait: 'Liderlik, yaratıcılık, ego, irade gücü' },
  { digit: 2, planet: 'Moon (Ay)', element: 'Su', trait: 'Empati, sezgisellik, duygusal derinlik, şefkat' },
  { digit: 3, planet: 'Jupiter (Jüpiter)', element: 'Hava', trait: 'Bilgelik, şans, bolluk, genişleme, felsefe' },
  { digit: 4, planet: 'Uranus (Uranüs)', element: 'Toprak', trait: 'Özgünlük, devrim, analitik zeka, disiplin' },
  { digit: 5, planet: 'Mercury (Merkür)', element: 'Hava', trait: 'İletişim, kıvrak zeka, merak, adaptasyon' },
  { digit: 6, planet: 'Venus (Venüs)', element: 'Toprak/Hava', trait: 'Estetik, aşk, uyum, çekim gücü, sanat' },
  { digit: 7, planet: 'Neptune (Neptün)', element: 'Su', trait: 'Mistisizm, maneviyat, hayal gücü, fedakarlık' },
  { digit: 8, planet: 'Saturn (Satürn)', element: 'Toprak', trait: 'Karma, sorumluluk, sabır, otorite, dayanıklılık' },
  { digit: 9, planet: 'Mars (Mars)', element: 'Ateş', trait: 'Cesaret, tutku, eylem, mücadele ruhu' }
];

export function getNumerologyArchetype(digit: number) {
  const index = (digit - 1) % 9;
  return NUMEROLOGY_ARCHETYPES[index];
}

// Core function to compile Name Analysis (API korunur, detay zenginleşti)
export function computePersonalEbced(name: string) {
  const detailed = calculateEbcedDetailed(name);
  const ebced = detailed.value;
  const reduction = getSingleDigitReduction(ebced);
  const archetype = getNumerologyArchetype(reduction);
  const matches = getMatchingEsmas(ebced);

  return {
    ebced,
    reduction,
    archetype,
    primaryEsma: matches[0],
    alternativeEsmas: matches.slice(1, 4),
    detailed,
  };
}
