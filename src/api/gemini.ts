import { ComputedChart } from '@/store/appStore';
import { supabase } from './supabase';

const rawKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_KEY = (rawKey.trim() === '' || 
  rawKey.toLowerCase().includes('placeholder') || 
  rawKey.toLowerCase().includes('your_') || 
  rawKey.toLowerCase().includes('todo') || 
  rawKey.toLowerCase().includes('api_key')) ? '' : rawKey;

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

export interface HoroscopeResponse {
  general: string;
  love: string;
  career: string;
  shadowSelf: string; // Used for "Kozmik Ritüel & Zikir"
}

export async function fetchDailyHoroscope(
  name: string,
  zodiacSign: string,
  birthDate: string,
  birthPlace: string
): Promise<HoroscopeResponse> {
  if (!GEMINI_API_KEY) {
    // Traditional fallback if key is not configured yet
    return {
      general: `Sevgili ${name}, bugün gökyüzünde Güneş ve Ay açıları hayat enerjinizi yükseltiyor. ${zodiacSign} burcundaki hareketlilik, kişisel hedeflerinizde ve günlük girişimlerinizde size ekstra motivasyon ve kararlılık sağlayacak. Gökyüzünün ritmiyle uyumlanmaya çalışın.`,
      love: "İlişkilerinizde Venüs ve Mars'ın olumlu açıları sayesinde uyum ve çekim gücünüz artıyor. Sevdiklerinizle açık ve içten bir iletişim kurmak, aranızdaki bağları derinleştirmek için harika bir gün.",
      career: "Kariyerinizde bolluk ve bereket kapılarını aralamak için Jüpiter'in desteğini hissedebilirsiniz. İş ortaklıklarında veya yeni projelerde şanslı fırsatlarla karşılaşabilirsiniz; somut adımlar atmaktan çekinmeyin.",
      shadowSelf: "Bugünün Ay evresine özel olarak; akşam saatlerinde evinizde adaçayı veya üzerlik otu yakarak enerjisel bir temizlik yapabilirsiniz. Günün kozmik frekansı ile rezonans kurmak için 129 defa 'Ya Latif' zikrini çekmeniz tavsiye edilir."
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerine dayanarak yüzeysel olmaktan uzak, edebi derinliği yüksek, felsefi ve son derece detaylı analizler üretmektir.

[STRICT OUTPUT FORMAT RULES]
1. Asla "Bugün şanslısınız" veya "Para gelebilir" gibi klişe, falcı ağzı cümleler kurma. Bunun yerine transitlerin ruhsal izdüşümlerini, ev yerleşimlerinin olumlu ve olumsuz yönlerini analiz et.
2. Çıktı dilin mistik, bilge, sarmalayıcı ama aynı zamanda bilimsel ve analitik olmalıdır.
3. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasını net ayır.
4. Çıktıyı kesinlikle aşağıdaki JSON şemasında belirtilen anahtarlarla eksiksiz döndür. Tek bir karakter bile şema dışına çıkmamalıdır.

Kullanıcının adı: "${name}"
Öz Burcu: "${zodiacSign}"
Doğum Parametreleri: ${birthDate} - ${birthPlace}

JSON Çıktı Şeması:
{
  "cosmic_vibe": "Günün kozmik özeti (Mistik ve metaforik 1 cümle)",
  "general_analysis": "En az 3 paragraftan oluşan felsefi ve psikolojik günlük analiz.",
  "love_and_relationships": "Derinlemesine bağ ve ilişki dinamikleri yorumu (2 paragraf).",
  "career_and_manifest": "Kariyer, finans ve eylem planı tavsiyeleri (2 paragraf).",
  "ritual_of_the_day": {
    "title": "Günün Ritüeli Başlığı",
    "instructions": "Adım adım uygulanacak, elemente uygun majikal/psikolojik ritüel veya meditasyon."
  }
}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned code: ${response.status}`);
    }

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(jsonText.trim());
    
    return {
      general: parsed.general_analysis || parsed.general || '',
      love: parsed.love_and_relationships || parsed.love || '',
      career: parsed.career_and_manifest || parsed.career || '',
      shadowSelf: `**Kozmik Titreşim:** ${parsed.cosmic_vibe || 'Mistik dengelenme'}\n\n**Ritüel: ${parsed.ritual_of_the_day?.title || 'Kozmik Bağlantı'}**\n${parsed.ritual_of_the_day?.instructions || 'Derin nefes meditasyonu yapın.'}`
    };
  } catch (error) {
    console.warn('Error fetching daily horoscope from Gemini:', error);
    return {
      general: `Sevgili ${name}, bugün gökyüzünde Güneş ve Ay açıları hayat enerjinizi yükseltiyor. ${zodiacSign} burcundaki hareketlilik, kişisel hedeflerinizde ve günlük girişimlerinizde size ekstra motivasyon ve kararlılık sağlayacak. Gökyüzünün ritmiyle uyumlanmaya çalışın.`,
      love: "İlişkilerinizde Venüs ve Mars'ın olumlu açıları sayesinde uyum ve çekim gücünüz artıyor. Sevdiklerinizle açık ve içten bir iletişim kurmak, aranızdaki bağları derinleştirmek için harika bir gün.",
      career: "Kariyerinizde bolluk ve bereket kapılarını aralamak için Jüpiter'in desteğini hissedebilirsiniz. İş ortaklıklarında veya yeni projelerde şanslı fırsatlarla karşılaşabilirsiniz; somut adımlar atmaktan çekinmeyin.",
      shadowSelf: "Bugünün Ay evresine özel olarak; akşam saatlerinde evinizde adaçayı veya üzerlik otu yakarak enerjisel bir temizlik yapabilirsiniz. Günün kozmik frekansı ile rezonans kurmak için 129 defa 'Ya Latif' zikrini çekmeniz tavsiye edilir."
    };
  }
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

  const fallbackReport = `**🌟 1. Genel Etkiler...**\nTransit analizi şu anda yüklenemedi.`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen transit gökyüzü açılarını ve natal haritayı kıyaslayan elit bir astroloji profesörüsün.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.

JSON Şeması:
{
  "potentials": "Gezegen transitlerinin genel olarak açığa çıkardığı gizli potansiyeller...",
  "houseReflections": "Transitlerin evlere göre yansımaları (Kariyer, aşk, para)...",
  "risks": "Önümüzdeki günlerde dikkat edilmesi gereken sert transit açıları ve kriz ihtimalleri...",
  "opportunities": "Değerlendirilmesi gereken kadersel fırsatlar ve şanslı günler..."
}

Kullanıcı: "${name}", Burç: "${zodiacSign}"
Gezegen Konumları: ${JSON.stringify(planets)}
Bugünün Gökyüzü: Gezegenler sürekli hareket halinde, buna göre yukarıdaki kişinin natal yerleşimlerine olan mevcut transit etkilerini yorumla.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    jsonText = jsonText.replace(/^```json/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.potentials && parsed.risks) {
      await saveCachedAnalysis(profileId, 'transit', parsed, 'gemini-1.5-pro');
      return parsed as TransitAnalysisResult;
    }
    
    return fallbackReport;
  } catch (error) {
    console.warn('Error fetching transit analysis:', error);
    return fallbackReport;
  }
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

  const fallbackReport = `**❤️ 1. Karşılıklı Çekim...**\nUyum analizi başarısız oldu...`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
[SYSTEM INSTRUCTION]
Sen ilişki astrolojisi ve harita sinastrisi uyumu konusunda elit bir astrologsun.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    jsonText = jsonText.replace(/^```json/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.loveAndAttraction && parsed.harmonyGuide) {
      await saveCachedAnalysis(cacheKey, 'synastry', parsed, 'gemini-1.5-pro');
      return parsed as SynastryAnalysisResult;
    }
    
    return fallbackReport;
  } catch (error) {
    console.warn('Error fetching synastry analysis:', error);
    return fallbackReport;
  }
}

export interface YildiznameAnalysisResult {
  ebcedDestiny: string;
  elementTemperament: string;
  spiritualObstacles: string;
  protectionEsma: string;
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

  const fallbackReport = `**⭐ 1. İsim Ebced Şifresi...**\nHata oluştu...`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
[SYSTEM INSTRUCTION]
Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve Havas ilmi konusunda uzman bir müneccimisin.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde paragraf ve **kalın metin** kullanabilirsin.

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    jsonText = jsonText.replace(/^```json/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.ebcedDestiny && parsed.protectionEsma) {
      await saveCachedAnalysis(cacheKey, 'yildizname', parsed, 'gemini-1.5-pro');
      return parsed as YildiznameAnalysisResult;
    }
    
    return fallbackReport;
  } catch (error) {
    console.warn('Error fetching yildizname analysis:', error);
    return fallbackReport;
  }
}

export async function fetchDailyShadows(
  name: string,
  birthChart: ComputedChart,
  moonSign: string,
  moonPhase: 'waxing' | 'waning'
): Promise<string> {
  const mars = birthChart.planets.find(p => p.name === 'Mars') || { sign: 'Koç', house: 1 };
  const saturn = birthChart.planets.find(p => p.name === 'Saturn') || { sign: 'Oğlak', house: 10 };

  if (!GEMINI_API_KEY) {
    return `Sevgili ${name}, bugün gökyüzünde transit yapan Ay'ın (${moonSign} burcunda, ${moonPhase === 'waxing' ? 'Büyüyen' : 'Küçülen'} evrede) natal haritanızdaki Mars (${mars.sign}, ${mars.house}. Ev) ve Satürn (${saturn.sign}, ${saturn.house}. Ev) ile kurduğu gerilimli kontaklar, bastırılmış dürtülerinizi veya yetersizlik korkularınızı yüzeye çıkarabilir. İçinizdeki direnç noktalarını gözlemleyin; öfkenizi dışa yansıtmak yerine, bu enerjiyi içsel sınırlarınızı belirlemek ve disiplin kazanmak için dönüştürün.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen; geleneksel astroloji, ruhsal gelişim ve karma astrolojisi konusunda uzman bir astrologsun. Kullanıcının günlük gökyüzü transitlerini ve natal haritasındaki gezegen yerleşimlerini karşılaştırarak, bugün yüzleşmesi gereken olası gölge yanlarını ve ruhsal direnç noktalarını analiz et.

Kullanıcı Adı: "${name}"
Doğum Haritası Konumları:
- Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
- Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
Mevcut Transit Gökyüzü:
- Transit Ay: ${moonSign} burcunda
- Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned code: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.warn('Error fetching daily shadows:', error);
    return `Sevgili ${name}, bugün gökyüzünde transit yapan Ay'ın (${moonSign} burcunda) natal haritanızdaki Mars ve Satürn ile kurduğu kontaklar, bastırılmış dürtülerinizi veya yetersizlik korkularınızı yüzeye çıkarabilir. İçinizdeki direnç noktalarını gözlemleyin; öfkenizi dışa yansıtmak yerine, bu enerjiyi içsel sınırlarınızı belirlemek ve disiplin kazanmak için dönüştürün.`;
  }
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

  const fallbackReport = `**🪐 1. Genel Mizaç ve Element Dengesi**\nGüneş, Ay ve Yükselen yerleşimleriniz...\n\n**🧠 2. Zihinsel Kapasite...**\nZihniniz son derece aktif...`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Kullanıcının natal harita verilerini sentezleyerek derin bir mizaç raporu oluşturacaksın.

[STRICT OUTPUT FORMAT RULES]
Aşağıdaki anahtarlarla tam olarak bir JSON objesi dönmelisin. ASLA markdown formatında (örneğin \`\`\`json) sarmalama. Doğrudan ham JSON döndür. Bölümlerin içeriğinde kendi içinde **kalın** ve paragraf kullanabilirsin.

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Safety cleanup in case the model wraps in markdown
    jsonText = jsonText.replace(/^```json/m, '').replace(/```$/m, '').trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.bigThree && parsed.saturnLessons) {
      await saveCachedAnalysis(profileId, 'natal', parsed, 'gemini-1.5-pro');
      return parsed as ChartAnalysisResult;
    }
    
    return fallbackReport;
  } catch (error) {
    console.warn('Error fetching full birth chart analysis:', error);
    return fallbackReport;
  }
}

