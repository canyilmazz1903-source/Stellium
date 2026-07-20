// AI layer 2.0 — "hesap konuşur, model yorumlar".
// Every request carries fully computed chart/sky data (built in utils/, never
// by the model), every response is zod-validated (H10), the model chain is
// centralized in prompts/common.ts (H9), and the Supabase cache respects
// valid_until so transit reports can no longer go stale (H3).

import type { ComputedChart } from '@/store/appStore';
import { supabase } from './supabase';
import { getZodiacSign, HOUSE_SYSTEM_LABELS } from '@/utils/astronomy';
import {
  composeNatalFallback,
  composeSynastryFallback,
  composeTransitFallback,
  SIGN_TRAITS,
} from '@/utils/interpretations';
import { computeTransitContacts, computeCurrentTransits } from '@/utils/transits';
import { synastryAspects, houseOverlays, compositeChart } from '@/utils/synastry';
import { currentMenzil, menzilLine } from '@/utils/menazil';
import {
  MODEL_CHAIN,
  DailySchema,
  TransitSchema,
  SynastrySchema,
  YildiznameSchema,
  NatalSchema,
  serializeChart,
} from './prompts/common';
import {
  buildDailyPrompt,
  buildTransitPrompt,
  buildSynastryPrompt,
  buildNatalPrompt,
  buildYildiznamePrompt,
} from './prompts/builders';
import type { z } from 'zod';

const rawKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_KEY = (rawKey.trim() === '' ||
  rawKey.toLowerCase().includes('placeholder') ||
  rawKey.toLowerCase().includes('your_') ||
  rawKey.toLowerCase().includes('todo') ||
  rawKey.toLowerCase().includes('api_key')) ? '' : rawKey;

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

function tryParseJson(text: string): any | null {
  try {
    const cleaned = text.replace(/^```json/m, '').replace(/```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// JSON call with zod validation + one corrective retry (H10).
async function callGeminiValidated<T>(prompt: string, schema: z.ZodType<T>): Promise<T | null> {
  const first = await callGemini(prompt, true);
  if (!first) return null;

  let parsed = tryParseJson(first);
  let check = parsed !== null ? schema.safeParse(parsed) : null;
  if (check && check.success) return check.data;

  // One corrective round: tell the model exactly what went wrong.
  const corrective =
    prompt +
    `\n\n[DÜZELTME] Önceki çıktın şema doğrulamasından geçmedi` +
    `${check && !check.success ? ` (${check.error.issues.slice(0, 3).map(i => i.path.join('.') + ': ' + i.message).join('; ')})` : ''}. ` +
    `İstenen anahtarların TAMAMINI içeren, her alanı dolu, SADECE ham JSON döndür.`;
  const second = await callGemini(corrective, true);
  if (!second) return null;
  parsed = tryParseJson(second);
  if (parsed === null) return null;
  const check2 = schema.safeParse(parsed);
  return check2.success ? check2.data : null;
}

// ---------- Cache (H2/H3 discipline) ----------

async function getCachedAnalysis(profileId: string | undefined, analysisType: string) {
  if (!profileId) return null;
  try {
    const { data, error } = await supabase
      .from('chart_analysis_sections')
      .select('content, valid_until, model_version')
      .eq('profile_id', profileId)
      .eq('analysis_type', analysisType)
      .eq('section_key', 'full_report')
      .single();
    if (error || !data) return null;

    // H3: expired entries are dead entries.
    if (data.valid_until && new Date(data.valid_until).getTime() < Date.now()) {
      return null;
    }
    // Model retirement invalidates indefinite caches (natal etc.).
    if (data.model_version && !MODEL_CHAIN.includes(data.model_version)) {
      return null;
    }
    return data.content;
  } catch (e) {
    console.warn('Cache read error', e);
  }
  return null;
}

function endOfLocalDayISO(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

async function saveCachedAnalysis(
  profileId: string | undefined,
  analysisType: string,
  content: any,
  modelVersion: string,
  validUntil: string | null
) {
  if (!profileId) return;
  try {
    const { error } = await supabase
      .from('chart_analysis_sections')
      .upsert({
        profile_id: profileId,
        analysis_type: analysisType,
        section_key: 'full_report',
        content,
        model_version: modelVersion,
        valid_until: validUntil,
      }, { onConflict: 'profile_id,analysis_type,section_key' });
    if (error) console.warn('Cache save db error', error);
  } catch (e) {
    console.warn('Cache save error', e);
  }
}

// ---------- Chart serialization helper ----------

function chartToCtx(chart: ComputedChart, dstNote?: boolean) {
  return {
    planets: chart.planets,
    ascendantSign: getZodiacSign(chart.ascendant)?.turkish,
    midheavenSign: getZodiacSign(chart.midheaven)?.turkish,
    houseSystem: chart.houseSystem ? HOUSE_SYSTEM_LABELS[chart.houseSystem] : undefined,
    points: chart.points?.map(p => ({ turkish: p.turkish, sign: p.sign, house: p.house })),
    aspects: chart.aspects,
    patterns: chart.patterns?.map(p => ({ title: p.title, members: p.members })),
    // Trust layer: DST context flows to every prompt automatically
    dstNote: dstNote ?? chart.dstCorrected,
  };
}

// ---------- Daily horoscope (H6: full natal + real sky context) ----------

export interface HoroscopeResponse {
  general: string;
  love: string;
  career: string;
  shadowSelf: string; // Used for "Kozmik Ritüel & Zikir"
}

function moonPhaseName(): string {
  const transits = computeCurrentTransits();
  const sun = transits.find(t => t.name === 'Sun')!;
  const moon = transits.find(t => t.name === 'Moon')!;
  let diff = moon.longitude - sun.longitude;
  if (diff < 0) diff += 360;
  if (diff >= 352.5 || diff < 7.5) return 'Yeni Ay';
  if (diff < 82.5) return 'Hilal (Büyüyen)';
  if (diff < 97.5) return 'İlk Dördün';
  if (diff < 172.5) return 'Şişkin Ay (Büyüyen)';
  if (diff < 187.5) return 'Dolunay';
  if (diff < 262.5) return 'Şişkin Ay (Küçülen)';
  if (diff < 277.5) return 'Son Dördün';
  return 'Balsamik Ay (Küçülen)';
}

function buildHoroscopeFallback(name: string, zodiacSign: string): HoroscopeResponse {
  const traits = SIGN_TRAITS[zodiacSign];
  const transits = computeCurrentTransits();
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
  birthPlace: string,
  chart?: ComputedChart | null,
  dstNote?: boolean
): Promise<HoroscopeResponse> {
  const fallback = buildHoroscopeFallback(name, zodiacSign);

  const { transits, contacts } = chart
    ? computeTransitContacts(chart.planets, chart.ascendant, chart.midheaven)
    : { transits: computeCurrentTransits(), contacts: [] };

  const prompt = buildDailyPrompt({
    name,
    zodiacSign,
    chart: chart ? chartToCtx(chart, dstNote) : null,
    transits,
    contacts,
    moonPhaseName: moonPhaseName(),
    menzilLine: menzilLine(currentMenzil()),
  });

  const parsed = await callGeminiValidated(prompt, DailySchema);
  if (!parsed) return fallback;

  return {
    general: parsed.general_analysis,
    love: parsed.love_and_relationships,
    career: parsed.career_and_manifest,
    shadowSelf: `**Kozmik Titreşim:** ${parsed.cosmic_vibe}\n\n**Ritüel: ${parsed.ritual_of_the_day.title}**\n${parsed.ritual_of_the_day.instructions}`,
  };
}

// ---------- Transit ----------

export interface TransitAnalysisResult {
  potentials: string;
  houseReflections: string;
  risks: string;
  opportunities: string;
}

export async function fetchTransitAnalysis(
  name: string,
  zodiacSign: string,
  chart: ComputedChart,
  profileId?: string
): Promise<TransitAnalysisResult | string> {
  const cached = await getCachedAnalysis(profileId, 'transit');
  if (cached) return cached as TransitAnalysisResult;

  const { transits, contacts } = computeTransitContacts(chart.planets, chart.ascendant, chart.midheaven);
  const fallbackReport = composeTransitFallback(name, chart.planets, transits.map(t => ({ name: t.name, sign: t.sign })));

  const prompt = buildTransitPrompt({ name, zodiacSign, chart: chartToCtx(chart), transits, contacts });
  const parsed = await callGeminiValidated(prompt, TransitSchema);
  if (parsed) {
    // H3: a transit reading is only valid until the end of the local day.
    await saveCachedAnalysis(profileId, 'transit', parsed, MODEL_CHAIN[0], endOfLocalDayISO());
    return parsed;
  }

  return fallbackReport;
}

// ---------- Synastry ----------

export interface SynastryAnalysisResult {
  loveAndAttraction: string;
  communication: string;
  friction: string;
  harmonyGuide: string;
}

export async function fetchSynastryAnalysis(
  p1Name: string,
  p1Sign: string,
  p1Chart: ComputedChart,
  p2Name: string,
  p2Chart: ComputedChart,
  cacheKey?: string
): Promise<SynastryAnalysisResult | string> {
  const cached = await getCachedAnalysis(cacheKey, 'synastry');
  if (cached) return cached as SynastryAnalysisResult;

  const fallbackReport = composeSynastryFallback(p1Name, p1Chart.planets, p2Name, p2Chart.planets);

  const interAspects = synastryAspects(p1Chart.planets, p2Chart.planets);
  const overlays = [
    ...houseOverlays(p2Chart.planets, p1Chart.houses, '2.', '1.'),
    ...houseOverlays(p1Chart.planets, p2Chart.houses, '1.', '2.'),
  ];
  const composite = compositeChart(p1Chart.planets, p2Chart.planets);

  const prompt = buildSynastryPrompt({
    p1Name,
    p2Name,
    p1Chart: chartToCtx(p1Chart),
    p2Planets: p2Chart.planets.map(p => ({ name: p.name, sign: p.sign, house: p.house })),
    interAspects,
    overlays,
    composite,
  });

  const parsed = await callGeminiValidated(prompt, SynastrySchema);
  if (parsed) {
    await saveCachedAnalysis(cacheKey, 'synastry', parsed, MODEL_CHAIN[0], null);
    return parsed;
  }

  return fallbackReport;
}

// ---------- Yıldızname ----------

export interface YildiznameAnalysisResult {
  ebcedDestiny: string;
  elementTemperament: string;
  spiritualObstacles: string;
  protectionEsma: string;
}

function buildYildiznameFallback(name: string, motherName: string, totalEbced: number, sign: string, element: string): YildiznameAnalysisResult {
  const traits = SIGN_TRAITS[sign];
  const reduced = ((totalEbced - 1) % 9) + 1;

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
  cacheKey?: string,
  birthMenzilLine?: string
): Promise<YildiznameAnalysisResult | string> {
  const cached = await getCachedAnalysis(cacheKey, 'yildizname');
  if (cached) return cached as YildiznameAnalysisResult;

  const fallbackReport = buildYildiznameFallback(name, motherName, totalEbced, sign, element);

  const prompt = buildYildiznamePrompt({ name, motherName, totalEbced, sign, element, birthMenzilLine });
  const parsed = await callGeminiValidated(prompt, YildiznameSchema);
  if (parsed) {
    await saveCachedAnalysis(cacheKey, 'yildizname', parsed, MODEL_CHAIN[0], null);
    return parsed;
  }

  return fallbackReport;
}

// ---------- Daily shadows ----------

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

  const { contacts } = computeTransitContacts(birthChart.planets, birthChart.ascendant, birthChart.midheaven);
  const contactLines = contacts.slice(0, 6).map(c => `- ${c.description}`).join('\n');

  const prompt = `
[SYSTEM INSTRUCTION]
Sen; geleneksel astroloji, ruhsal gelişim ve karma astrolojisi konusunda uzman bir astrologsun. Aşağıda kullanıcının natal yerleşimleri ve BUGÜNÜN HESAPLANMIŞ transit temasları verilmiştir. Bugün yüzleşilmesi gereken gölge yanları ve ruhsal direnç noktalarını analiz et. En az 2 dolu paragraf yaz; SADECE verilen yerleşim/temaslara atıf yap ve pratik bir dönüştürme önerisiyle bitir. Sağlık konusunda kesin hüküm verme.

Kullanıcı Adı: "${name}"
Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
Transit Ay: ${moonSign} burcunda — Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}
${menzilLine(currentMenzil())}
BUGÜNÜN TEMASLARI:
${contactLines || '- Bugün dar orblu majör temas yok.'}
  `;

  const text = await callGemini(prompt, false);
  return text || fallback;
}

// ---------- Full natal analysis ----------

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
  _aspects: any[],
  profileId?: string
): Promise<ChartAnalysisResult | string> {
  const cached = await getCachedAnalysis(profileId, 'natal');
  if (cached) return cached as ChartAnalysisResult;

  const fallbackReport = composeNatalFallback(name, birthChart.planets);

  const prompt = buildNatalPrompt({ name, chart: chartToCtx(birthChart) });
  const parsed = await callGeminiValidated(prompt, NatalSchema);
  if (parsed) {
    await saveCachedAnalysis(profileId, 'natal', parsed, MODEL_CHAIN[0], null);
    return parsed;
  }

  return fallbackReport;
}

// Re-export for callers that need the serializer (e.g. debug screens)
export { serializeChart };
