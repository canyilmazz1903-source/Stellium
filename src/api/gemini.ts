import type { ComputedChart } from '@/store/appStore';
import { supabase } from './supabase';
import { getJulianDaysSinceJ2000, getPlanetLongitude, getZodiacSign } from '@/utils/astronomy';
import {
  composeNatalFallback,
  composeSynastryFallback,
  composeTransitFallback,
  SIGN_TRAITS,
} from '@/utils/interpretations';

const rawKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_KEY = (rawKey.trim() === '' ||
  rawKey.toLowerCase().includes('placeholder') ||
  rawKey.toLowerCase().includes('your_') ||
  rawKey.toLowerCase().includes('todo') ||
  rawKey.toLowerCase().includes('api_key')) ? '' : rawKey;

// Gemini 1.5 models were RETIRED by Google (API returns 404), which silently
// broke every AI feature in this app. Use a fallback chain of current models
// so a single retirement can never kill the AI layer again. The env var lets
// us hotfix the model without an app release.
const MODEL_CHAIN = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
].filter((m): m is string => !!m && m.length > 0);

async function callGemini(prompt: string, wantJson: boolean): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  for (const model of MODEL_CHAIN) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            ...(wantJson ? { responseMimeType: 'application/json' } : {}),
            maxOutputTokens: 8192,
            temperature: 0.85,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini model ${model} returned HTTP ${response.status}, trying next model`);
        continue;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text.trim().length > 0) return text;
      console.warn(`Gemini model ${model} returned empty text, trying next model`);
    } catch (e) {
      console.warn(`Gemini model ${model} failed:`, e);
    }
  }
  return null;
}

async function callGeminiJSON(prompt: string): Promise<any | null> {
  const text = await callGemini(prompt, true);
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```json/m, '').replace(/```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Gemini JSON parse failed:', e);
    return null;
  }
}

// Cache Helpers
async function getCachedAnalysis(profileId: string | undefined, analysisType: string) {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from('chart_analysis_sections')
      .select('content')
      .eq('profile_id', profileId)
      .eq('analysis_type', analysisType)
      .eq('section_key', 'full_report')
      .single();
    if (!error && data) return data.content;
  } catch (e) {
    console.warn('Cache read error', e);
  }
  return null;
}

async function saveCachedAnalysis(profileId: string | undefined, analysisType: string, content: any, modelVersion: string) {
  if (!profileId) return;
  try {
    const { error } = await supabase
      .from('chart_analysis_sections')
      .upsert({
        profile_id: profileId,
        analysis_type: analysisType,
        section_key: 'full_report',
        content,
        model_version: modelVersion
      });
    if (error) console.warn('Cache save db error', error);
  } catch (e) {
    console.warn('Cache save error', e);
  }
}

// Compute today's transit planet signs locally (pure math, no network).
function computeTodayTransits(): { name: string; sign: string }[] {
  const jd = getJulianDaysSinceJ2000(new Date());
  return ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].map((name) => ({
    name,
    sign: getZodiacSign(getPlanetLongitude(name, jd)).turkish,
  }));
}

export interface HoroscopeResponse {
  general: string;
  love: string;
  career: string;
  shadowSelf: string; // Used for "Kozmik Ritüel & Zikir"
}

function buildHoroscopeFallback(name: string, zodiacSign: string): HoroscopeResponse {
  const traits = SIGN_TRAITS[zodiacSign];
  const transits = computeTodayTransits();
  const tMoon = transits.find(t => t.name === 'Moon');
  const moonTraits = tMoon ? SIGN_TRAITS[tMoon.sign] : undefined;

  return {
    general:
      `Sevgili ${name}, bugün Ay ${tMoon ? `${tMoon.sign} burcunda` : 'gökyüzünde'} ilerliyor${moonTraits ? ` ve kolektif atmosfere ${moonTraits.keywords.join(', ')} temalarını taşıyor` : ''}. ` +
      (traits ? `Sizin ${zodiacSign} doğanız — ${traits.strengths} — bu frekansla ${moonTraits && moonTraits.element === traits.element ? 'doğal bir uyum içinde; enerjiniz akışkan, girişimleriniz destekli' : 'yaratıcı bir gerilim içinde; bu farkı motivasyona çevirmek elinizde'}. ` : '') +
      `Gün içinde önünüze gelen küçük işaretlere dikkat edin: gökyüzü ritmiyle uyumlanan adımlar, zorlamayla açılmayan kapıları kendiliğinden aralar.`,
    love:
      (traits ? `${zodiacSign} kalbi bugün ${traits.keywords[0]} temasıyla titreşiyor. ` : '') +
      `İlişkilerde Venüs'ün yumuşatıcı etkisini davet etmek için açık ve savunmasız bir iletişim kurun; söylemek isteyip ertelediğiniz o cümle bugün karşılık bulabilir. ` +
      (moonTraits && (moonTraits.element === 'Su') ? `Ay'ın su elementindeki seyri duygusal derinliği artırıyor: yüzeysel sohbetler yerine kalpten konuşmalar için ideal bir gün.` : `Partnerinizin (veya hoşlandığınız kişinin) sevgi dilini bugün bilinçli gözlemleyin; küçük bir jest büyük kapı açar.`),
    career:
      `Kariyer cephesinde ${traits ? `${zodiacSign} burcunun ${traits.modality.toLowerCase()} niteliği` : 'doğal ritminiz'} bugün öne çıkıyor: ` +
      (traits?.modality === 'Öncü' ? `yeni bir işi başlatmak, ilk adımı atmak için gökyüzü sizden yana. Başlatın; momentum arkadan gelir.` :
       traits?.modality === 'Sabit' ? `başladığınız işleri derinleştirmek ve sağlamlaştırmak için güçlü bir gün. Yeni maceralar yerine eldeki değeri büyütün.` :
       `uyum yeteneğinizi kullanın: değişen koşullara herkesten hızlı adapte olmanız bugün size görünür bir avantaj sağlar.`) +
      ` Bereket, disiplinle buluştuğu noktada kalıcılaşır.`,
    shadowSelf:
      `**Kozmik Titreşim:** ${tMoon ? `Ay ${tMoon.sign} frekansında — ${moonTraits?.keywords.join(', ') || 'derin akışlar'} günü.` : 'Gökyüzü sizi iç gözleme çağırıyor.'}\n\n` +
      `**Günün Ritüeli:** Akşam saatlerinde 5 dakikanızı ayırın: bir kağıda bugün sizi en çok zorlayan duyguyu yazın ve karşısına bu duygunun size ne öğretmeye çalıştığını not edin. ` +
      `Ardından ${traits?.element === 'Ateş' ? 'bir mum yakıp niyetinizi aleve fısıldayın' : traits?.element === 'Su' ? 'ellerinizi akan suya tutup bırakma niyetinizi suya emanet edin' : traits?.element === 'Toprak' ? 'çıplak ayakla yere basıp üç derin nefesle topraklanın' : 'pencereyi açıp üç derin nefesle zihninizi havalandırın'}. Küçük ritüeller, büyük dönüşümlerin tohumudur.`,
  };
}

export async function fetchDailyHoroscope(
  name: string,
  zodiacSign: string,
  birthDate: string,
  birthPlace: string
): Promise<HoroscopeResponse> {
  const fallback = buildHoroscopeFallback(name, zodiacSign);

  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerine dayanarak yüzeysel olmaktan uzak, edebi derinliği yüksek, felsefi ve son derece detaylı analizler üretmektir.

[STRICT OUTPUT FORMAT RULES]
1. Asla "Bugün şanslısınız" veya "Para gelebilir" gibi klişe, falcı ağzı cümleler kurma. Bunun yerine transitlerin ruhsal izdüşümlerini, ev yerleşimlerinin olumlu ve olumsuz yönlerini analiz et.
2. Çıktı dilin mistik, bilge, sarmalayıcı ama aynı zamanda bilimsel ve analitik olmalıdır.
3. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasını net ayır.
4. Her ana bölüm EN AZ 2 dolu paragraf (bölüm başına minimum 120 kelime) olmalıdır. Kısa ve yüzeysel çıktı kabul edilmez.
5. Çıktıyı kesinlikle aşağıdaki JSON şemasında belirtilen anahtarlarla eksiksiz döndür.

Kullanıcının adı: "${name}"
Öz Burcu: "${zodiacSign}"
Doğum Parametreleri: ${birthDate} - ${birthPlace}
Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}

JSON Çıktı Şeması:
{
  "cosmic_vibe": "Günün kozmik özeti (Mistik ve metaforik 1 cümle)",
  "general_analysis": "En az 3 paragraftan oluşan felsefi ve psikolojik günlük analiz.",
  "love_and_relationships": "Derinlemesine bağ ve ilişki dinamikleri yorumu (en az 2 paragraf).",
  "career_and_manifest": "Kariyer, finans ve eylem planı tavsiyeleri (en az 2 paragraf).",
  "ritual_of_the_day": {
    "title": "Günün Ritüeli Başlığı",
    "instructions": "Adım adım uygulanacak, elemente uygun majikal/psikolojik ritüel veya meditasyon."
  }
}
  `;

  const parsed = await callGeminiJSON(prompt);
  if (!parsed) return fallback;

  return {
    general: parsed.general_analysis || parsed.general || fallback.general,
    love: parsed.love_and_relationships || parsed.love || fallback.love,
    career: parsed.career_and_manifest || parsed.career || fallback.career,
    shadowSelf: `**Kozmik Titreşim:** ${parsed.cosmic_vibe || 'Mistik dengelenme'}\n\n**Ritüel: ${parsed.ritual_of_the_day?.title || 'Kozmik Bağlantı'}**\n${parsed.ritual_of_the_day?.instructions || 'Derin nefes meditasyonu yapın.'}`
  };
}

export interface TransitAnalysisResult {
  potentials: string;
  houseReflections: string;
  risks: string;
  opportunities: string;
}

export async function fetchTransitAnalysis(
  name: string,
  zodiacSign: string,
  planets: any[],
  profileId?: string
): Promise<TransitAnalysisResult | string> {
  const cached = await getCachedAnalysis(profileId, 'transit');
  if (cached) return cached as TransitAnalysisResult;

  const transits = computeTodayTransits();
  const fallbackReport = composeTransitFallback(name, planets, transits);

  const prompt = `
[SYSTEM INSTRUCTION]
Sen transit gökyüzü açılarını ve natal haritayı kıyaslayan elit bir astroloji profesörüsün.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.
Her bölüm EN AZ 2-3 dolu paragraf (minimum 150 kelime) olmalıdır. Somut transit-natal temaslarına (hangi gezegen hangi natal gezegeni/evi tetikliyor) atıf yap; genel geçer laflardan kaçın.

JSON Şeması:
{
  "potentials": "Gezegen transitlerinin genel olarak açığa çıkardığı gizli potansiyeller...",
  "houseReflections": "Transitlerin evlere göre yansımaları (Kariyer, aşk, para)...",
  "risks": "Önümüzdeki günlerde dikkat edilmesi gereken sert transit açıları ve kriz ihtimalleri...",
  "opportunities": "Değerlendirilmesi gereken kadersel fırsatlar ve şanslı günler..."
}

Kullanıcı: "${name}", Burç: "${zodiacSign}"
Natal Gezegen Konumları: ${JSON.stringify(planets)}
BUGÜNÜN GERÇEK GÖKYÜZÜ (hesaplanmış transit konumları): ${JSON.stringify(transits)}
Bugünün tarihi: ${new Date().toLocaleDateString('tr-TR')}
Bu gerçek transit konumlarını natal yerleşimlerle kıyaslayarak yorumla.
  `;

  const parsed = await callGeminiJSON(prompt);
  if (parsed && parsed.potentials && parsed.risks) {
    await saveCachedAnalysis(profileId, 'transit', parsed, MODEL_CHAIN[0]);
    return parsed as TransitAnalysisResult;
  }

  return fallbackReport;
}

export interface SynastryAnalysisResult {
  loveAndAttraction: string;
  communication: string;
  friction: string;
  harmonyGuide: string;
}

export async function fetchSynastryAnalysis(
  p1Name: string,
  p1Sign: string,
  p1Planets: any[],
  p2Name: string,
  p2Planets: any[],
  cacheKey?: string
): Promise<SynastryAnalysisResult | string> {
  const cached = await getCachedAnalysis(cacheKey, 'synastry');
  if (cached) return cached as SynastryAnalysisResult;

  const fallbackReport = composeSynastryFallback(p1Name, p1Planets, p2Name, p2Planets);

  const prompt = `
[SYSTEM INSTRUCTION]
Sen ilişki astrolojisi ve harita sinastrisi uyumu konusunda elit bir astrologsun.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.
Her bölüm EN AZ 2-3 dolu paragraf (minimum 150 kelime) olmalıdır. İki haritanın SOMUT gezegen kombinasyonlarına (ör. birinin Venüs'ü ile diğerinin Mars'ı) atıf yaparak yaz; genel geçer uyum laflarından kaçın.

JSON Şeması:
{
  "loveAndAttraction": "Güneş, Ay, Venüs ve Mars etkileşimleri üzerinden romantik çekim...",
  "communication": "Merkür açılarının aranızdaki konuşma diline etkisi...",
  "friction": "Uyuşmazlıklar, sürtüşmeler, Satürn/Plüton ego savaşları...",
  "harmonyGuide": "Aranızdaki uyumu artırmak için pratik tavsiyeler..."
}

1. Kişi: "${p1Name}", Güneş: "${p1Sign}", Gezegenleri: ${JSON.stringify(p1Planets)}
2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}
  `;

  const parsed = await callGeminiJSON(prompt);
  if (parsed && parsed.loveAndAttraction && parsed.harmonyGuide) {
    await saveCachedAnalysis(cacheKey, 'synastry', parsed, MODEL_CHAIN[0]);
    return parsed as SynastryAnalysisResult;
  }

  return fallbackReport;
}

export interface YildiznameAnalysisResult {
  ebcedDestiny: string;
  elementTemperament: string;
  spiritualObstacles: string;
  protectionEsma: string;
}

function buildYildiznameFallback(name: string, motherName: string, totalEbced: number, sign: string, element: string): YildiznameAnalysisResult {
  const traits = SIGN_TRAITS[sign];
  const reduced = ((totalEbced - 1) % 9) + 1; // numerological root 1-9

  return {
    ebcedDestiny:
      `**${name}** isminin, anne adı **${motherName}** ile birlikte taşıdığı toplam Ebced değeri **${totalEbced}**. ` +
      `Bu sayının numerolojik kökü **${reduced}**: ${reduced <= 3 ? 'başlangıçların, yaratıcı ifadenin ve öncülüğün titreşimi. Kader çizginiz, yeni yollar açan ve arkasından gelenlere ışık tutan bir role işaret ediyor.' : reduced <= 6 ? 'denge, hizmet ve sorumluluğun titreşimi. Kader çizginiz, köprü kuran, iyileştiren ve düzen getiren bir role işaret ediyor.' : 'derinlik, bilgelik ve tamamlanmanın titreşimi. Kader çizginiz, görünenin ardındaki hakikati arayan ve bulduğunu paylaşan bir role işaret ediyor.'} ` +
      `Kadim yıldızname geleneğinde bu değer, isim enerjinizin ${sign} burcunun frekansıyla mühürlendiğini gösterir.`,
    elementTemperament: traits
      ? `Yıldızname burcunuz **${sign}**, elementiniz **${element}**. Bu mizaç size ${traits.strengths} bahşeder. ${traits.modality} niteliği, hayat olaylarına ${traits.modality === 'Öncü' ? 'başlatıcı ve yön verici' : traits.modality === 'Sabit' ? 'sabırlı ve tamamlayıcı' : 'uyumlu ve dönüştürücü'} bir tepki verdiğinizi söyler. Gölge tarafta ${traits.shadow} — bu temalar, isminizin size yüklediği hayat dersleridir.`
      : `Elementiniz ${element}; mizacınız bu elementin doğasıyla şekillenir.`,
    spiritualObstacles:
      `${element} elementi mizaçlar, geleneksel öğretide en çok ${element === 'Ateş' ? 'öfke ve acelecilik kapısından' : element === 'Su' ? 'aşırı duyarlılık ve enerji emiciliği kapısından' : element === 'Toprak' ? 'kaygı ve evham kapısından' : 'zihin dağınıklığı ve vesvese kapısından'} nazar ve enerjisel yorgunluğa açıktır. ` +
      `Kalabalık ve gerilimli ortamlardan sonra üzerinizde ağırlık, sebepsiz isteksizlik veya uyku düzensizliği hissediyorsanız, bu enerjisel temizlik ihtiyacının işaretidir. Düzenli arınma ritüelleri (tuz banyosu, tütsü, niyetli su) bu mizaç için süs değil ihtiyaçtır.`,
    protectionEsma:
      `Koruma ve dengelenme için geleneksel eşleştirme: ` +
      `${element === 'Ateş' ? '**Ya Selam** (esenlik, öfke ateşini serinletir) — günde 131 defa' : element === 'Su' ? '**Ya Kuddüs** (arındıran) — günde 170 defa' : element === 'Toprak' ? '**Ya Fettah** (kapıları açan, kaygıyı çözer) — günde 489 defa' : '**Ya Latif** (inceliklerle koruyan, zihni yatıştırır) — günde 129 defa'}. ` +
      `Ayrıca haftalık koruma için Cuma günü (Venüs saati) **Ya Vedud** zikri kalp merkezini güçlendirir. Zikir sayıları Ebced geleneğine göre esmanın kendi sayısal değeridir; düzenlilik, sayıdan daha önemlidir.`,
  };
}

export async function fetchYildiznameAnalysis(
  name: string,
  motherName: string,
  totalEbced: number,
  sign: string,
  element: string,
  cacheKey?: string
): Promise<YildiznameAnalysisResult | string> {
  const cached = await getCachedAnalysis(cacheKey, 'yildizname');
  if (cached) return cached as YildiznameAnalysisResult;

  const fallbackReport = buildYildiznameFallback(name, motherName, totalEbced, sign, element);

  const prompt = `
[SYSTEM INSTRUCTION]
Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve Havas ilmi konusunda uzman bir müneccimisin.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.
Her bölüm EN AZ 2 dolu paragraf (minimum 120 kelime) olmalıdır. Verilen Ebced değerine ve burca özgü SOMUT yorumlar yap.

JSON Şeması:
{
  "ebcedDestiny": "Kullanıcının isminin ve anne isminin ebced rezonansı, kader çizgisi...",
  "elementTemperament": "Yıldız burcu ve elementin mizaç potansiyelleri...",
  "spiritualObstacles": "Manevi engeller, nazara açıklık durumu, dikkat edilmesi gerekenler...",
  "protectionEsma": "Nazar ve engelleri aşmak için koruyucu esmalar (adetleriyle), dualar..."
}

Kullanıcı adı: "${name}"
Anne adı: "${motherName}"
Toplam Ebced Değeri: ${totalEbced}
Yıldızname Burcu: "${sign}"
Element: "${element}"
  `;

  const parsed = await callGeminiJSON(prompt);
  if (parsed && parsed.ebcedDestiny && parsed.protectionEsma) {
    await saveCachedAnalysis(cacheKey, 'yildizname', parsed, MODEL_CHAIN[0]);
    return parsed as YildiznameAnalysisResult;
  }

  return fallbackReport;
}

export async function fetchDailyShadows(
  name: string,
  birthChart: ComputedChart,
  moonSign: string,
  moonPhase: 'waxing' | 'waning'
): Promise<string> {
  const mars = birthChart.planets.find(p => p.name === 'Mars') || { sign: 'Koç', house: 1 };
  const saturn = birthChart.planets.find(p => p.name === 'Saturn') || { sign: 'Oğlak', house: 10 };

  const fallback =
    `Sevgili ${name}, bugün gökyüzünde transit yapan Ay'ın (${moonSign} burcunda, ${moonPhase === 'waxing' ? 'Büyüyen' : 'Küçülen'} evrede) natal haritanızdaki Mars (${mars.sign}, ${mars.house}. Ev) ve Satürn (${saturn.sign}, ${saturn.house}. Ev) ile kurduğu temaslar, bastırılmış dürtülerinizi veya yetersizlik korkularınızı yüzeye çıkarabilir. ` +
    `${SIGN_TRAITS[moonSign] ? `Ay'ın ${moonSign} frekansı özellikle ${SIGN_TRAITS[moonSign].shadow} temasını kolektif olarak tetikliyor. ` : ''}` +
    `İçinizdeki direnç noktalarını gözlemleyin; öfkenizi dışa yansıtmak yerine, bu enerjiyi içsel sınırlarınızı belirlemek ve disiplin kazanmak için dönüştürün. ${moonPhase === 'waning' ? 'Küçülen Ay, bırakma çalışmaları için güçlü bir müttefik: bugün bir alışkanlığı, bir kırgınlığı veya bir korkuyu bilinçli olarak serbest bırakın.' : 'Büyüyen Ay, niyet tohumları için verimli toprak: gölgenizin karşıtı olan erdemi (sabır, cesaret, şefkat) bugün bilinçli pratik edin.'}`;

  const prompt = `
[SYSTEM INSTRUCTION]
Sen; geleneksel astroloji, ruhsal gelişim ve karma astrolojisi konusunda uzman bir astrologsun. Kullanıcının günlük gökyüzü transitlerini ve natal haritasındaki gezegen yerleşimlerini karşılaştırarak, bugün yüzleşmesi gereken olası gölge yanlarını ve ruhsal direnç noktalarını analiz et. En az 2 dolu paragraf yaz; somut yerleşimlere atıf yap ve pratik bir dönüştürme önerisiyle bitir.

Kullanıcı Adı: "${name}"
Doğum Haritası Konumları:
- Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
- Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
Mevcut Transit Gökyüzü:
- Transit Ay: ${moonSign} burcunda
- Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}
  `;

  const text = await callGemini(prompt, false);
  return text || fallback;
}

export interface ChartAnalysisResult {
  bigThree: string;
  mentalAndCommunication: string;
  loveAndFinance: string;
  willpowerAndStruggle: string;
  saturnLessons: string;
  projection: string;
  currentRisks: string;
  longTerm: string;
}

export async function fetchFullChartAnalysis(
  name: string,
  birthChart: ComputedChart,
  aspects: any[],
  profileId?: string
): Promise<ChartAnalysisResult | string> {
  const cached = await getCachedAnalysis(profileId, 'natal');
  if (cached) return cached as ChartAnalysisResult;

  const fallbackReport = composeNatalFallback(name, birthChart.planets);

  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Kullanıcının natal harita verilerini sentezleyerek derin bir mizaç raporu oluşturacaksın.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde kendi içinde **kalın** ve paragraf kullanabilirsin.
Her bölüm EN AZ 2-3 dolu paragraf (minimum 150 kelime) olmalıdır. Verilen SOMUT yerleşimlere (gezegen/burç/ev/açı) isim vererek atıf yap; genel geçer burç yorumu yazma.

JSON Şeması:
{
  "bigThree": "Yükselen, Güneş ve Ay konumları ile element dengesinin sentezi...",
  "mentalAndCommunication": "Merkür konumuna ve açılarına göre zeka, öğrenme...",
  "loveAndFinance": "Venüs yerleşimi ve açılarına göre ilişkiler...",
  "willpowerAndStruggle": "Mars konumuna göre motivasyon kaynakları...",
  "saturnLessons": "Satürn yerleşimine ve açılara göre hayat sınavları...",
  "projection": "Önümüzdeki 6 aylık süreçte eyleme geçme, yatırım veya risk tarihleri...",
  "currentRisks": "Kullanıcının bugünlerde hayatında en çok temkinli olması gereken konular...",
  "longTerm": "Gelecek yıllarda dikkat edilmesi gereken uzun vadeli kozmik riskler..."
}

Kullanıcının Adı: "${name}"
Doğum Haritası Gezegenleri: ${JSON.stringify(birthChart.planets)}
Ev Başlangıçları: ${JSON.stringify(birthChart.houses)}
Gezegen Açıları: ${JSON.stringify(aspects)}
  `;

  const parsed = await callGeminiJSON(prompt);
  if (parsed && parsed.bigThree && parsed.saturnLessons) {
    await saveCachedAnalysis(profileId, 'natal', parsed, MODEL_CHAIN[0]);
    return parsed as ChartAnalysisResult;
  }

  return fallbackReport;
}
