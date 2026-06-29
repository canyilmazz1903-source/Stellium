import { ComputedChart } from '@/store/appStore';

const rawKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_KEY = (rawKey.trim() === '' || 
  rawKey.toLowerCase().includes('placeholder') || 
  rawKey.toLowerCase().includes('your_') || 
  rawKey.toLowerCase().includes('todo') || 
  rawKey.toLowerCase().includes('api_key')) ? '' : rawKey;

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
Sen; İsviçre Efemerisi hassasiyetine vakıf, Carl Jung'un psikolojik astroloji ekolünü, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerine dayanarak yüzeysel olmaktan uzak, edebi derinliği yüksek, felsefi, psikolojik ve son derece detaylı analizler üretmektir.

[STRICT OUTPUT FORMAT RULES]
1. Asla "Bugün şanslısınız" veya "Para gelebilir" gibi klişe, falcı ağzı cümleler kurma. Bunun yerine transitlerin psikolojik izdüşümlerini, ev yerleşimlerinin gölge ve ışık yönlerini analiz et.
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

export async function fetchTransitAnalysis(
  name: string,
  zodiacSign: string,
  planets: any[],
  houses: number[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "Gökyüzü Transit Analizi: Şu anda gökyüzü transitleri natal yerleşimlerinizle uyumlu açılar oluşturuyor. Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve liderlik gücünüzü sergilemenizi desteklemekte. Jüpiter'in para evinize yaptığı olumlu temaslar ise önümüzdeki günlerde maddi kazanç kapılarını aralayabilir.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen geleneksel astroloji, gökyüzü transitleri ve gezegen ev konumları konusunda uzman bir astrologsun.
    Kullanıcı: "${name}", Burç: "${zodiacSign}"
    Doğum Haritası Gezegen Yerleşimleri: ${JSON.stringify(planets)}
    Doğum Haritası Ev Başlangıç Dereceleri: ${JSON.stringify(houses)}
    
    Kullanıcı için detaylı bir transit ve gezegen yerleşimleri analizi yap.
    Bu analizde:
    - Haritasındaki önemli gezegen yerleşimlerinin astrolojik anlamlarını, güçlü ve zayıf konumlarını açıkla.
    - Ev yerleşimlerinin yaşam alanlarındaki yansımalarını detaylıca tahlil et.
    - Ona bu harita doğrultusunda geleceğe yönelik astrolojik tavsiyeler ve fırsatlar sun.
    - Jungcu veya psikolojik terimler (anima, animus, gölge, bireyleşme vb.) kullanmaktan tamamen kaçın. Tamamen geleneksel göksel ilimler, yıldız hareketleri ve pratik astroloji bilgisi ver.
    
    Yorumun akıcı, derin, merak uyandırıcı ve son derece kişiselleştirilmiş olsun. Maksimum 3 paragraf olsun.
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
    console.warn('Error fetching transit analysis:', error);
    return "Gökyüzü Transit Analizi: Şu anda gökyüzü transitleri natal yerleşimlerinizle uyumlu açılar oluşturuyor. Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve liderlik gücünüzü sergilemenizi desteklemekte. Jüpiter'in para evinize yaptığı olumlu temaslar ise önümüzdeki günlerde maddi kazanç kapılarını aralayabilir.";
  }
}

export async function fetchSynastryAnalysis(
  p1Name: string,
  p1Sign: string,
  p1Planets: any[],
  p2Name: string,
  p2Planets: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. Venüs'ün karşılıklı uyumlu konumları sayesinde aranızdaki sevgi dili oldukça akıcı ve romantik. Merkür etkileşimleri ise zihinsel uyumunuzu ve sohbet kalitenizi üst seviyeye taşıyor.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen ilişki astrolojisi ve doğum haritası uyumu konusunda uzman bir astrologsun.
    1. Kişi: "${p1Name}", Güneş Burcu: "${p1Sign}", Gezegenleri: ${JSON.stringify(p1Planets)}
    2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}
    
    Bu iki kişinin haritası arasındaki sinastri (uyum) analizini yap.
    - Gezegenlerin açısal temaslarını, aşk, iletişim, sadakat ve evlilik potansiyellerini tahlil et.
    - Karşılıklı çekim güçlerini, birbirlerinin haritasındaki ev yerleşimlerinin etkilerini açıkla.
    - İlişkinin güçlü ve zayıf/karmik yönlerini kozmik bir dille özetle.
    - Jungcu veya psikolojik terimler (anima, animus, gölge vb.) kullanmaktan tamamen kaçın. Tamamen klasik aşk ve uyum astrolojisi tahlili yap.
    
    Yazacağın yorum akıcı, derin ve ilişki odaklı olsun. Maksimum 3 paragraf olsun. Türkçe yaz.
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
    console.warn('Error fetching synastry analysis:', error);
    return `Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. Venüs'ün karşılıklı uyumlu konumları sayesinde aranızdaki sevgi dili oldukça akıcı ve romantik. Merkür etkileşimleri ise zihinsel uyumunuzu ve sohbet kalitenizi üst seviyeye taşıyor.`;
  }
}

export async function fetchYildiznameAnalysis(
  name: string,
  motherName: string,
  totalEbced: number,
  sign: string,
  element: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Sevgili ${name}, anne adı ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}, Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, hayat yolculuğunuzda yıldızınızın yüksek olduğunu ve manevi korumanızın güçlü olduğunu gösteriyor. Uğurlu gününüz ve zikir esmanız yaşam kalitenizi artıracaktır.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve havas ilmi konusunda derin bilgi sahibi uzman bir yıldızname müneccimisin.
    Kullanıcının adı: "${name}"
    Annesinin adı: "${motherName}"
    Toplam Ebced Değeri: ${totalEbced}
    Hesaplanan Yıldızname Burcu: "${sign}"
    Element: "${element}"
    
    Bu parametreler doğrultusunda kapsamlı ve derin bir Yıldızname analizi yaz.
    Analizde şunlara yer ver:
    - İsmin enerjisi, Ebced kodlamasının getirdiği kader temaları, esmaları ve potansiyeller.
    - Yıldız Burcu ve Elementin yarattığı mizaç özellikleri (Geleneksel ve mistik bir dille).
    - Kullanıcının hayat yolculuğunda dikkat etmesi gereken nazar, manevi engeller ve bunlara karşı koruyucu dualar/esmalar/öneriler.
    - Jungcu veya modern batı psikolojisi terimlerinden tamamen uzak dur.
    
    Yazacağın yorum sürükleyici, mistik, saygın ve edebi bir tonda olsun. Maksimum 3 paragraf olsun. Türkçe yaz.
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
    console.warn('Error fetching yildizname analysis:', error);
    return `Sevgili ${name}, anne adı ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}, Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, hayat yolculuğunuzda yıldızınızın yüksek olduğunu ve manevi korumanızın güçlü olduğunu gösteriyor. Uğurlu gününüz ve zikir esmanız yaşam kalitenizi artıracaktır.`;
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
Sen; analitik psikoloji (Carl Jung) ve psikolojik astroloji konusunda uzmanlaşmış derinlikli bir psikolog ve astrologsun. Görevin, transit gök cisimlerinin gerilimli açılarını inceleyerek bireyin bugün yüzleşmesi gereken bastırılmış dürtüleri, gölge yönlerini (Shadow Work) ve projeksiyonlarını tahlil etmektir.

[STRICT OUTPUT FORMAT RULES]
1. Çıktıyı kesinlikle aşağıdaki JSON şemasında belirtilen anahtarlarla eksiksiz döndür. Tek bir karakter bile şema dışına çıkmamalıdır.
2. Analiz dili akademik, Jungcu ve samimi olmalıdır. Bilinçaltı savunmalarını sarsıcı ama şefkatli bir şekilde açıkla.

Kullanıcı Adı: "${name}"
Doğum Haritası Konumları:
- Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
- Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
Mevcut Transit Gökyüzü:
- Transit Ay: ${moonSign} burcunda
- Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}

JSON Çıktı Şeması:
{
  "shadow_core": "Bugünkü krizin veya içsel blokajın psikolojik kökeni.",
  "jungian_analysis": "Bilinçaltı süreçleri açıklayan derin akademik metin (3 paragraf).",
  "confrontation_questions": [
    "Kullanıcının kendine sorması gereken sarsıcı ve dönüştürücü soru 1",
    "Kullanıcının kendine sorması gereken sarsıcı ve dönüştürücü soru 2",
    "Kullanıcının kendine sorması gereken sarsıcı ve dönüştürücü soru 3"
  ]
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

    const questionsText = Array.isArray(parsed.confrontation_questions)
      ? parsed.confrontation_questions.map((q: string) => `• ${q}`).join('\n')
      : '';

    return `### 🌌 Bugünkü Gölge Odağı\n${parsed.shadow_core}\n\n### 🧠 Jungcu Analiz\n${parsed.jungian_analysis}\n\n### 🔑 Kendinle Yüzleşme Soruları\n${questionsText}`;
  } catch (error) {
    console.warn('Error fetching shadows analysis from Gemini:', error);
    return `Sevgili ${name}, bugün gökyüzünde transit yapan Ay'ın (${moonSign} burcunda) natal haritanızdaki Mars ve Satürn ile kurduğu kontaklar, bastırılmış dürtülerinizi veya yetersizlik korkularınızı yüzeye çıkarabilir. İçinizdeki direnç noktalarını gözlemleyin; öfkenizi dışa yansıtmak yerine, bu enerjiyi içsel sınırlarınızı belirlemek ve disiplin kazanmak için dönüştürün.`;
  }
}

export async function fetchFullChartAnalysis(
  name: string,
  birthChart: ComputedChart,
  aspects: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Sevgili ${name}, doğum haritanızın detaylı analizi hazırlandı. Haritanızdaki Güneş, Ay ve Yükselen konumlarınız güçlü bir kişilik yapısına işaret ediyor. Kariyer ve ikili ilişkilerinizde kendi potansiyelinizi gerçekleştirmek için gezegenlerin uyumlu enerjilerini kullanabilir, Satürn'ün getirdiği sınavlarda olgunlaşarak kader yolunuzda emin adımlarla ilerleyebilirsiniz.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Carl Jung'un psikolojik astroloji ekolünü, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerini, element dağılımlarını, niteliklerini ve gezegen açılarını sentezleyerek adeta bir kitap bölümü niteliğinde, son derece kapsamlı ve derin bir yaşam yolculuğu raporu oluşturmaktır.

[WRITING RULES]
1. Analiz dili mistik, bilge, sarmalayıcı ama aynı zamanda bilimsel, analitik ve psikolojik olmalıdır.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan.
3. Raporu tam 5 paragraf halinde yapılandır ve her bir paragrafı aşağıdaki başlıklara göre derinlemesine tahlil et.

Kullanıcının Adı: "${name}"
Doğum Haritası Gezegen Konumları ve Evleri:
${JSON.stringify(birthChart.planets)}
Doğum Haritası Ev Başlangıç Dereceleri:
${JSON.stringify(birthChart.houses)}
Haritadaki Gezegenler Arası Açı İlişkileri:
${JSON.stringify(aspects)}

Rapor Bölümleri:
1. **Genel Mizaç, Kozmik Elementler ve Yaşam Yolu:** Yükselen, Güneş ve Ay konumları ile element dengesinin sentezi. Temel karakter ve yaşam amacı.
2. **Zihinsel Yapı, Akıl ve İletişim:** Merkür konumuna ve açılarına göre zekası, karar verme yapısı ve iletişim üslubu.
3. **Aşk, Bağlar, Değerler ve Finansal Bereket:** Venüs yerleşimi ve açılarına göre ilişkilerdeki beklentileri, sevgi dili ve maddi değerleri çekme potansiyeli.
4. **Eylem, Tutku, Mücadele ve İrade Gücü:** Mars konumuna göre motivasyon kaynakları, engelleri aşma tarzı ve fiziksel enerjiyi kullanma biçimi.
5. **Kader Haritasındaki Açılar, Sınavlar ve Olgunlaşma (Satürn):** Satürn yerleşimine ve gezegenler arasındaki majör açılara (kavuşum, kare, karşıt vb.) göre hayatındaki karmik zorluklar, aşması gereken engeller ve manevi olgunlaşma yolları.
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
    console.warn('Error fetching full birth chart analysis:', error);
    return `Sevgili ${name}, doğum haritanızın detaylı analizi hazırlandı. Haritanızdaki Güneş, Ay ve Yükselen konumlarınız güçlü bir kişilik yapısına işaret ediyor. Kariyer ve ikili ilişkilerinizde kendi potansiyelinizi gerçekleştirmek için gezegenlerin uyumlu enerjilerini kullanabilir, Satürn'ün getirdiği sınavlarda olgunlaşarak kader yolunuzda emin adımlarla ilerleyebilirsiniz.`;
  }
}

