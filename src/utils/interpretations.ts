// Deterministic Turkish astrology interpretation library.
// Generates real, personalized multi-paragraph content from computed chart
// data with zero network dependency. Used both as the offline/fallback layer
// for the AI reports and as the technical detail source on the chart screen.

export interface SignTraits {
  element: 'Ateş' | 'Toprak' | 'Hava' | 'Su';
  modality: 'Öncü' | 'Sabit' | 'Değişken';
  ruler: string;
  keywords: string[];
  strengths: string;
  shadow: string;
}

export const SIGN_TRAITS: Record<string, SignTraits> = {
  'Koç': {
    element: 'Ateş', modality: 'Öncü', ruler: 'Mars',
    keywords: ['cesaret', 'girişkenlik', 'öncülük'],
    strengths: 'saf hayat gücü, hızlı karar alma ve engel tanımayan bir başlama enerjisi',
    shadow: 'sabırsızlık, düşünmeden harekete geçme ve öfkeyi kontrol etme sınavı',
  },
  'Boğa': {
    element: 'Toprak', modality: 'Sabit', ruler: 'Venüs',
    keywords: ['istikrar', 'sadakat', 'duyusallık'],
    strengths: 'sarsılmaz kararlılık, maddi dünyada güven inşa etme ve estetik zevk',
    shadow: 'inatçılık, değişime direnç ve konfor alanına aşırı bağlanma',
  },
  'İkizler': {
    element: 'Hava', modality: 'Değişken', ruler: 'Merkür',
    keywords: ['merak', 'iletişim', 'çok yönlülük'],
    strengths: 'kıvrak zeka, kelimelerle dans etme yeteneği ve sınırsız öğrenme iştahı',
    shadow: 'dağınık odak, yüzeysellik riski ve kararsızlık',
  },
  'Yengeç': {
    element: 'Su', modality: 'Öncü', ruler: 'Ay',
    keywords: ['duyarlılık', 'koruma', 'sezgi'],
    strengths: 'derin duygusal zeka, güçlü hafıza ve sevdiklerini sarmalayan şefkat',
    shadow: 'aşırı alınganlık, geçmişe takılı kalma ve duygusal savunmacılık',
  },
  'Aslan': {
    element: 'Ateş', modality: 'Sabit', ruler: 'Güneş',
    keywords: ['yaratıcılık', 'onur', 'liderlik'],
    strengths: 'doğal karizma, cömert bir kalp ve sahneyi aydınlatan yaratıcı ateş',
    shadow: 'onay bağımlılığı, gurur savaşları ve eleştiriye tahammülsüzlük',
  },
  'Başak': {
    element: 'Toprak', modality: 'Değişken', ruler: 'Merkür',
    keywords: ['analiz', 'hizmet', 'mükemmeliyet'],
    strengths: 'keskin detay algısı, pratik problem çözme ve şifacı bir hizmet bilinci',
    shadow: 'aşırı eleştirellik (önce kendine), evham ve mükemmeliyetçilik tuzağı',
  },
  'Terazi': {
    element: 'Hava', modality: 'Öncü', ruler: 'Venüs',
    keywords: ['denge', 'adalet', 'ortaklık'],
    strengths: 'diplomasi ustalığı, estetik zarafet ve ilişkilerde köprü kurma sanatı',
    shadow: 'kararsızlık, çatışmadan kaçmak için kendinden ödün verme',
  },
  'Akrep': {
    element: 'Su', modality: 'Sabit', ruler: 'Plüton/Mars',
    keywords: ['dönüşüm', 'derinlik', 'irade'],
    strengths: 'küllerinden doğma gücü, insan ruhunun derinliklerini okuma ve mutlak sadakat',
    shadow: 'kıskançlık, kontrol ihtiyacı ve affetmekte zorlanma',
  },
  'Yay': {
    element: 'Ateş', modality: 'Değişken', ruler: 'Jüpiter',
    keywords: ['özgürlük', 'bilgelik', 'iyimserlik'],
    strengths: 'ufku geniş bir vizyon, bulaşıcı iyimserlik ve anlam arayışında yorulmaz bir ruh',
    shadow: 'abartı eğilimi, taahhütten kaçınma ve patavatsızlık',
  },
  'Oğlak': {
    element: 'Toprak', modality: 'Öncü', ruler: 'Satürn',
    keywords: ['disiplin', 'başarı', 'sorumluluk'],
    strengths: 'dağları aşındıran sabır, stratejik akıl ve zirveye adanmış bir kararlılık',
    shadow: 'duyguları bastırma, iş bağımlılığı ve katı beklentiler',
  },
  'Kova': {
    element: 'Hava', modality: 'Sabit', ruler: 'Uranüs/Satürn',
    keywords: ['özgünlük', 'vizyon', 'toplumsallık'],
    strengths: 'çağının ötesinde fikirler, entelektüel bağımsızlık ve insanlık idealleri',
    shadow: 'duygusal mesafe, inatla aykırı olma ve aidiyetsizlik hissi',
  },
  'Balık': {
    element: 'Su', modality: 'Değişken', ruler: 'Neptün/Jüpiter',
    keywords: ['sezgi', 'şefkat', 'hayal gücü'],
    strengths: 'sınırsız empati, sanatsal ilham ve görünmez alemlerle doğal bağ',
    shadow: 'kaçış eğilimi, kurban psikolojisi ve sınır koyamama',
  },
};

// What each planet governs in a natal chart (TR narrative fragments).
export const PLANET_ROLES: Record<string, { emoji: string; domain: string; question: string }> = {
  Sun:     { emoji: '☀️', domain: 'öz kimliğinizi, yaşam amacınızı ve iradenizi', question: 'Ben kimim ve neyi aydınlatmak için buradayım?' },
  Moon:    { emoji: '🌙', domain: 'duygusal ihtiyaçlarınızı, iç güvenlik alanınızı ve sezgilerinizi', question: 'Kendimi ne zaman güvende ve beslenmiş hissederim?' },
  Mercury: { emoji: '☿', domain: 'düşünme biçiminizi, öğrenme stilinizi ve iletişim dilinizi', question: 'Dünyayı nasıl algılar ve kendimi nasıl ifade ederim?' },
  Venus:   { emoji: '♀', domain: 'sevme biçiminizi, estetik zevkinizi ve değer algınızı', question: 'Neyi güzel bulur, nasıl sever ve neye değer veririm?' },
  Mars:    { emoji: '♂', domain: 'harekete geçme gücünüzü, mücadele stilinizi ve arzularınızı', question: 'Ne için savaşır, enerjimi nereye akıtırım?' },
  Jupiter: { emoji: '♃', domain: 'büyüme alanlarınızı, şans kanallarınızı ve inanç sisteminizi', question: 'Hayat bana nereden genişleme ve bereket sunar?' },
  Saturn:  { emoji: '♄', domain: 'hayat derslerinizi, sorumluluk alanlarınızı ve olgunlaşma sürecinizi', question: 'Hangi sınavlardan geçerek ustalaşacağım?' },
  Uranus:  { emoji: '♅', domain: 'özgürleşme alanınızı ve sıra dışı yeteneklerinizi', question: 'Nerede kalıpları kırar, kendi yolumu açarım?' },
  Neptune: { emoji: '♆', domain: 'hayallerinizi, ruhsal arayışınızı ve ilham kaynaklarınızı', question: 'Neyle ruhsal olarak beslenirim, nerede sınırlarım erir?' },
  Pluto:   { emoji: '♇', domain: 'dönüşüm gücünüzü ve derin psikolojik temalarınızı', question: 'Hangi alanda ölüp yeniden doğarım?' },
};

export const HOUSE_MEANINGS: string[] = [
  'kimlik, beden ve dış dünyaya sunulan benlik',
  'maddi kaynaklar, kazanç ve öz değer',
  'iletişim, yakın çevre, kardeşler ve öğrenme',
  'ev, aile, kökler ve iç dünya',
  'aşk, yaratıcılık, çocuklar ve keyif',
  'günlük düzen, iş rutini, sağlık ve hizmet',
  'evlilik, ortaklıklar ve birebir ilişkiler',
  'dönüşüm, krizler, ortak kaynaklar ve gizli derinlikler',
  'yüksek öğrenim, inançlar, yabancı kültürler ve uzak yolculuklar',
  'kariyer, statü, toplumsal misyon',
  'arkadaşlıklar, topluluklar, idealler ve gelecek vizyonu',
  'bilinçaltı, inziva, ruhsal arınma ve görünmeyen süreçler',
];

const TURKISH_PLANET_NAMES: Record<string, string> = {
  Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars',
  Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton',
};

export function planetNameTR(name: string): string {
  return TURKISH_PLANET_NAMES[name] || name;
}

// Degree within the sign (0-29.99) from an ecliptic longitude.
export function degreeInSign(longitude: number): number {
  let lon = longitude % 360;
  if (lon < 0) lon += 360;
  return lon % 30;
}

export function formatDegree(longitude: number): string {
  const deg = degreeInSign(longitude);
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}'`;
}

// Compose a 2-3 sentence interpretation for a planet in a sign and house.
export function composePlanetInSign(planetName: string, signTr: string, house?: number, retrograde?: boolean): string {
  const role = PLANET_ROLES[planetName];
  const traits = SIGN_TRAITS[signTr];
  if (!role || !traits) return '';

  const tr = planetNameTR(planetName);
  let text = `${tr}, ${role.domain} ${signTr} burcunun ${traits.element.toLowerCase()} elementi ve ${traits.modality.toLowerCase()} niteliğiyle şekillendiriyor. `;
  text += `Bu yerleşim size ${traits.strengths} kazandırırken; gölge tarafında ${traits.shadow} konusunda farkındalık ister. `;
  if (house && house >= 1 && house <= 12) {
    text += `${house}. evdeki konumu, bu enerjinin en çok ${HOUSE_MEANINGS[house - 1]} alanında sahnelendiğini gösterir. `;
  }
  if (retrograde) {
    text += `Retro (geri hareket) konumu, bu temaların dışa dönük değil içe dönük işlendiğine; olgunlaşmanın iç gözlemle geldiğine işaret eder.`;
  }
  return text.trim();
}

export interface ElementBalance {
  counts: Record<'Ateş' | 'Toprak' | 'Hava' | 'Su', number>;
  modalityCounts: Record<'Öncü' | 'Sabit' | 'Değişken', number>;
  dominantElement: string;
  weakestElement: string;
  narrative: string;
}

const ELEMENT_NARRATIVES: Record<string, { strong: string; weak: string }> = {
  'Ateş': {
    strong: 'Haritanızda Ateş elementi baskın: hayata tutku, cesaret ve spontane bir eylem gücüyle yaklaşıyorsunuz. Sizi durağanlık yorar; ilham aldığınız anda harekete geçmek istersiniz.',
    weak: 'Ateş elementinin azlığı, motivasyonu dışarıdan beklemek yerine bilinçli olarak tutku ve heyecan üretmeyi öğrenmeniz gereken bir hayat temasına işaret eder.',
  },
  'Toprak': {
    strong: 'Toprak elementi güçlü: pratik zeka, maddi dünyada güven inşa etme ve somut sonuç alma kabiliyeti sizin doğal alanınız. Ayaklarınız yere sağlam basar.',
    weak: 'Toprak elementinin azlığı; rutin, beden ve maddi düzen konularında bilinçli çaba gerektirir. Fikirlerinizi somutlaştıracak yapılar kurmak sizin simyanızdır.',
  },
  'Hava': {
    strong: 'Hava elementi belirgin: fikirler, iletişim ve sosyal bağlantılar sizin oksijeniniz. Kavramlar arasında köprü kurar, çevrenize perspektif taşırsınız.',
    weak: 'Hava elementinin azlığı, duygu ve deneyimlerinizi kelimelere dökme ve olaylara mesafeden bakma pratiğinin size büyük denge kazandıracağını söyler.',
  },
  'Su': {
    strong: 'Su elementi derin akıyor: empati, sezgi ve duygusal zeka haritanızın ana damarı. Söylenmeyeni duyar, görünmeyeni hissedersiniz.',
    weak: 'Su elementinin azlığı, duyguların dilini bilinçli olarak öğrenmeyi — hissetmeye alan açmayı ve empatiyi bir kas gibi çalıştırmayı — hayat dersi yapar.',
  },
};

export function computeElementBalance(planets: { name: string; sign: string }[]): ElementBalance {
  const counts = { 'Ateş': 0, 'Toprak': 0, 'Hava': 0, 'Su': 0 } as ElementBalance['counts'];
  const modalityCounts = { 'Öncü': 0, 'Sabit': 0, 'Değişken': 0 } as ElementBalance['modalityCounts'];

  for (const p of planets) {
    const t = SIGN_TRAITS[p.sign];
    if (t) {
      counts[t.element]++;
      modalityCounts[t.modality]++;
    }
  }

  const sorted = (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const dominantElement = sorted[0][0];
  const weakestElement = sorted[sorted.length - 1][0];

  const modSorted = (Object.entries(modalityCounts) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const domMod = modSorted[0][0];
  const modNarr = domMod === 'Öncü'
    ? 'Öncü nitelik baskınlığı sizi başlatan, harekete geçiren kişi yapar; projeleri ateşlemek sizden, sürdürmek ekipten.'
    : domMod === 'Sabit'
      ? 'Sabit nitelik baskınlığı size olağanüstü bir dayanıklılık ve tamamlama gücü verir; başladığınız işi bitirirsiniz, ancak esneklik bilinçli çalışılmalı.'
      : 'Değişken nitelik baskınlığı size bukalemun gibi uyum yeteneği verir; değişen koşullar sizi korkutmaz, ancak köklenmek ve karar sabitlemek pratik ister.';

  const narrative = `${ELEMENT_NARRATIVES[dominantElement].strong}\n\n${ELEMENT_NARRATIVES[weakestElement].weak}\n\n${modNarr}`;

  return { counts, modalityCounts, dominantElement, weakestElement, narrative };
}

// ---------- Rich offline report composers (used as AI fallbacks) ----------

type PlanetLike = { name: string; sign: string; house?: number; retrograde?: boolean };

function findP(planets: PlanetLike[], name: string): PlanetLike | undefined {
  return planets.find(p => p.name === name);
}

export function composeNatalFallback(name: string, planets: PlanetLike[]) {
  const sun = findP(planets, 'Sun');
  const moon = findP(planets, 'Moon');
  const mercury = findP(planets, 'Mercury');
  const venus = findP(planets, 'Venus');
  const mars = findP(planets, 'Mars');
  const saturn = findP(planets, 'Saturn');
  const jupiter = findP(planets, 'Jupiter');
  const balance = computeElementBalance(planets as any);

  const bigThree =
    `Sevgili ${name}, haritanızın kalbinde ${sun ? `${sun.sign} burcundaki Güneş` : 'Güneş'} duruyor. ` +
    (sun ? composePlanetInSign('Sun', sun.sign, sun.house, sun.retrograde) + '\n\n' : '') +
    (moon ? composePlanetInSign('Moon', moon.sign, moon.house, moon.retrograde) + '\n\n' : '') +
    `**Element Dengesi:** ${balance.narrative}`;

  const mentalAndCommunication = mercury
    ? composePlanetInSign('Mercury', mercury.sign, mercury.house, mercury.retrograde) +
      `\n\nZihinsel gücünüzü en verimli kullanmanın yolu, ${SIGN_TRAITS[mercury.sign]?.keywords.join(', ') || 'doğal yeteneklerinizi'} temalarını günlük hayatınızda bilinçli araçlara dönüştürmekten geçiyor.`
    : 'Merkür konumu hesaplanamadı.';

  const loveAndFinance = venus
    ? composePlanetInSign('Venus', venus.sign, venus.house, venus.retrograde) +
      `\n\nİlişkilerde ve finansal kararlarda ${venus.sign} Venüs'ün doğasına uygun ortamlar — ${SIGN_TRAITS[venus.sign]?.strengths || 'değerlerinizle uyumlu alanlar'} — size hem huzur hem bereket getirir.`
    : 'Venüs konumu hesaplanamadı.';

  const willpowerAndStruggle = mars
    ? composePlanetInSign('Mars', mars.sign, mars.house, mars.retrograde)
    : 'Mars konumu hesaplanamadı.';

  const saturnLessons = saturn
    ? composePlanetInSign('Saturn', saturn.sign, saturn.house, saturn.retrograde) +
      `\n\nSatürn'ün sınavları ilk bakışta yavaşlatıcı görünse de, bu alandaki her disiplinli adım kalıcı bir ustalık taşına dönüşür. Satürn nerede zorluyorsa, hayat sizi orada usta yapmak istiyor demektir.`
    : 'Satürn konumu hesaplanamadı.';

  const projection = jupiter
    ? `Büyüme gezegeniniz Jüpiter ${jupiter.sign} burcunda${jupiter.house ? `, ${jupiter.house}. evde` : ''} yol alıyor. Önümüzdeki dönemde ${jupiter.house ? HOUSE_MEANINGS[(jupiter.house - 1) % 12] : 'genişleme alanlarınız'} ile ilgili fırsat kapılarını takip edin; Jüpiter'in dokunduğu alanda cömert davranmak bereketi çoğaltır. Büyüyen Ay dönemleri yeni girişimler, küçülen Ay dönemleri tamamlama ve arınma işleri için idealdir.`
    : 'Projeksiyon için Jüpiter konumu gereklidir.';

  const currentRisks =
    `${balance.weakestElement} elementinin haritanızdaki azlığı, bu dönemde en çok ${ELEMENT_NARRATIVES[balance.weakestElement].weak.toLowerCase()} ` +
    `Ayrıca ${saturn ? `Satürn'ün ${saturn.sign} temalarında (${SIGN_TRAITS[saturn.sign]?.shadow || 'sınav alanları'})` : 'Satürn temalarında'} aceleci kararlardan kaçının.`;

  const longTerm =
    `Uzun vadede haritanızın ana ödevi, ${balance.dominantElement} elementinin gücünü (${ELEMENT_NARRATIVES[balance.dominantElement].strong.split(':')[1]?.trim() || 'doğal yeteneklerinizi'}) ` +
    `${balance.weakestElement} elementinin dersleriyle dengelemek. Bu iki kutup arasında kurduğunuz her köprü, karakterinizi bir üst oktava taşır.`;

  return { bigThree, mentalAndCommunication, loveAndFinance, willpowerAndStruggle, saturnLessons, projection, currentRisks, longTerm };
}

export function composeTransitFallback(name: string, natalPlanets: PlanetLike[], transitPlanets: { name: string; sign: string }[]) {
  const tMoon = transitPlanets.find(p => p.name === 'Moon');
  const tSun = transitPlanets.find(p => p.name === 'Sun');
  const tSaturn = transitPlanets.find(p => p.name === 'Saturn');
  const tJupiter = transitPlanets.find(p => p.name === 'Jupiter');
  const nSun = findP(natalPlanets, 'Sun');

  const potentials =
    `Sevgili ${name}, şu anda gökyüzünde ${tSun ? `Güneş ${tSun.sign} burcunda` : 'Güneş yol alırken'}${tMoon ? `, Ay ise ${tMoon.sign} burcunda` : ''} ilerliyor. ` +
    (tMoon && SIGN_TRAITS[tMoon.sign] ? `Ay'ın ${tMoon.sign} enerjisi bugünlerde kolektif atmosfere ${SIGN_TRAITS[tMoon.sign].keywords.join(', ')} temalarını taşıyor; bu frekansı bilinçli kullananlar için ${SIGN_TRAITS[tMoon.sign].strengths} gündemde. ` : '') +
    (nSun ? `Sizin ${nSun.sign} Güneşiniz bu geçişleri özellikle kimlik ve irade alanında hisseder.` : '');

  const houseReflections = transitPlanets.slice(0, 7).map(tp => {
    const natal = natalPlanets.find(np => np.sign === tp.sign);
    const base = `**${planetNameTR(tp.name)}** şu an ${tp.sign} burcunda`;
    return natal
      ? `${base} — natal ${planetNameTR(natal.name)} gezegeninizle aynı burçta buluşuyor; ${natal.house ? `${natal.house}. evinizin (${HOUSE_MEANINGS[(natal.house - 1) % 12]}) gündemini aktive ediyor.` : 'bu temaları güçlendiriyor.'}`
      : `${base}; ${SIGN_TRAITS[tp.sign]?.keywords.join(' ve ') || 'bu burcun'} temalarını kolektif gündeme taşıyor.`;
  }).join('\n\n');

  const risks = tSaturn && SIGN_TRAITS[tSaturn.sign]
    ? `Satürn'ün ${tSaturn.sign} burcundaki seyri, kolektif olarak ${SIGN_TRAITS[tSaturn.sign].shadow} temalarında sınavlar getiriyor. Bu dönemde ${tSaturn.sign} temalı konularda (ör. ${SIGN_TRAITS[tSaturn.sign].keywords.join(', ')}) atılacak adımları sağlam zemine oturtun; kestirme yollar Satürn döneminde pahalıya mal olur.`
    : 'Sert açı dönemlerinde önemli imza ve yatırımları Ay boşlukta değilken planlamak kadim bir kuraldır.';

  const opportunities = tJupiter && SIGN_TRAITS[tJupiter.sign]
    ? `Jüpiter'in ${tJupiter.sign} burcundaki yolculuğu, ${SIGN_TRAITS[tJupiter.sign].keywords.join(', ')} alanlarında bereket kapıları aralıyor. ${SIGN_TRAITS[tJupiter.sign].strengths} — bu temalarla hizalanan girişimler Jüpiter'in rüzgarını arkasına alır. Büyüyen Ay günlerinde başlatın, Dolunay'da hasadı toplayın.`
    : 'Büyüyen Ay dönemleri başlangıçlar, Dolunay netleşme, küçülen Ay arınma için kozmik destek sunar.';

  return { potentials, houseReflections, risks, opportunities };
}

export function composeSynastryFallback(p1Name: string, p1Planets: PlanetLike[], p2Name: string, p2Planets: PlanetLike[]) {
  const g = (ps: PlanetLike[], n: string) => findP(ps, n);
  const pair = (a?: PlanetLike, b?: PlanetLike) => a && b && SIGN_TRAITS[a.sign] && SIGN_TRAITS[b.sign]
    ? { same: SIGN_TRAITS[a.sign].element === SIGN_TRAITS[b.sign].element, e1: SIGN_TRAITS[a.sign].element, e2: SIGN_TRAITS[b.sign].element, s1: a.sign, s2: b.sign }
    : null;

  const sun = pair(g(p1Planets, 'Sun'), g(p2Planets, 'Sun'));
  const moon = pair(g(p1Planets, 'Moon'), g(p2Planets, 'Moon'));
  const venusMars = pair(g(p1Planets, 'Venus'), g(p2Planets, 'Mars'));
  const mercury = pair(g(p1Planets, 'Mercury'), g(p2Planets, 'Mercury'));

  const harmonic = (e1: string, e2: string) =>
    e1 === e2 || (e1 === 'Ateş' && e2 === 'Hava') || (e1 === 'Hava' && e2 === 'Ateş') || (e1 === 'Toprak' && e2 === 'Su') || (e1 === 'Su' && e2 === 'Toprak');

  const loveAndAttraction =
    (sun ? `${p1Name}'in ${sun.s1} Güneşi ile ${p2Name}'in ${sun.s2} Güneşi ${harmonic(sun.e1, sun.e2) ? 'uyumlu elementlerde (' + sun.e1 + '-' + sun.e2 + ') akıyor: temel yaşam enerjileriniz birbirini besliyor, yan yana olmak doğal geliyor.' : 'farklı frekanslarda (' + sun.e1 + '-' + sun.e2 + ') titreşiyor: bu kutupluluk güçlü bir çekim de yaratabilir, sürtünme de — bilinçli yönetildiğinde birbirinizin eksik parçası olursunuz.'}` : '') +
    (venusMars ? `\n\nVenüs-Mars hattında ${harmonic(venusMars.e1, venusMars.e2) ? 'tutku ve şefkat dilleri uyumlu: romantik çekim kendiliğinden akar.' : 'farklı arzu dilleri konuşuluyor: birbirinizin sevgi dilini öğrenmek bu bağın simyası.'}` : '');

  const communication = mercury
    ? `${p1Name}'in ${mercury.s1} Merkürü ile ${p2Name}'in ${mercury.s2} Merkürü ${harmonic(mercury.e1, mercury.e2) ? 'benzer dalga boyunda: konuşmalarınız kolayca derinleşir, birbirinizi yarım cümleden anlarsınız.' : 'farklı düşünme stillerine sahip: biri sezgiyle, diğeri mantıkla konuşuyor olabilir. Dinleme pratiği bu köprünün harcıdır.'}`
    : 'Merkür verileri karşılaştırılamadı.';

  const friction = moon
    ? `Duygusal ihtiyaçlar katmanında ${p1Name}'in ${moon.s1} Ayı ile ${p2Name}'in ${moon.s2} Ayı ${harmonic(moon.e1, moon.e2) ? 'uyum içinde: birbirinizin iç dünyasına ev sahipliği yapabilirsiniz. Sürtünme daha çok dış stres kaynaklıdır.' : 'farklı güvenlik dilleri konuşuyor: biri yakınlıkla beslenirken diğeri alan isteyebilir. Bu farkı kusur değil, ritim farkı olarak görmek çatışmayı şefkate çevirir.'}`
    : 'Ay verileri karşılaştırılamadı.';

  const harmonyGuide =
    `Uyumun anahtarı üç pratikte: (1) Haftada bir, telefonsuz bir "burç sohbeti" — o hafta ikinizde de öne çıkan duyguları paylaşın. (2) Birbirinizin element ihtiyacına alan tanıyın${moon ? ` (${moon.e1} tarafı ${moon.e1 === 'Su' || moon.e1 === 'Toprak' ? 'sükunet ve süreklilik' : 'hareket ve yenilik'} ister)` : ''}. (3) Tartışma anında 90 saniye kuralı: kortizol dalgası geçmeden cevap vermeyin. Gökyüzü uyumu verili değil, inşa edilen bir sanattır.`;

  return { loveAndAttraction, communication, friction, harmonyGuide };
}
