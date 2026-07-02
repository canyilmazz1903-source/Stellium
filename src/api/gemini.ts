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

export async function fetchTransitAnalysis(
  name: string,
  zodiacSign: string,
  planets: any[],
  houses: number[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `**🪐 1. Harita Potansiyeliniz ve Güçlü/Zayıf Konumlar**\nHaritanızdaki Güneş ve Jüpiter yerleşimleri, kariyerinizde liderlik vasıflarınızı ve şans kanallarınızı aktif kılıyor. Merkür'ün konumu zihinsel kapasitenizin yüksek olduğunu gösterse de Satürn'ün zorlayıcı açıları bazı konularda sorumlulukların gecikmeyle gelebileceğine işaret ediyor.

**🏠 2. Yaşam Alanlarındaki Ev Yansımaları**
Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve liderlik gücünüzü sergilemenizi desteklemekte. Jüpiter'in para evinize yaptığı olumlu temaslar ise önümüzdeki günlerde maddi kazanç kapılarını aralayabilir.

**⚠️ 3. Dikkat Edilmesi Gereken Riskler ve Gelişim Alanları**
Mars'ın 12. ev transiti içsel gerilimlere ve uykusuzluğa neden olabilir. Bu süreçte aceleci kararlar almaktan, trafikte veya riskli fiziksel aktivitelerde dikkatsiz davranmaktan kaçınmalısınız.

**🔮 4. Kozmik Fırsatlar ve Gelecek Projeksiyonu**
Önümüzdeki yeni ay döngüsü, hayatınızda yepyeni niyetler ve başlangıçlar için mükemmel bir zemin hazırlıyor. Kararlılıkla atacağınız adımlar uzun vadede kalıcı meyveler verecektir.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen geleneksel astroloji, gökyüzü transitleri ve gezegen ev konumları konusunda uzman bir astrologsun.
    Kullanıcı: "${name}", Burç: "${zodiacSign}"
    Doğum Haritası Gezegen Yerleşimleri: ${JSON.stringify(planets)}
    Doğum Haritası Ev Başlangıç Dereceleri: ${JSON.stringify(houses)}
    
    Kullanıcı için detaylı bir transit ve gezegen yerleşimleri analizi yap.
    Analizi şu net başlıklarla ve son derece derinlemesine, doyurucu bir şekilde yapılandır:
    
    **🪐 1. Harita Potansiyeliniz ve Güçlü/Zayıf Konumlar**
    Gezegenlerinizin haritanızdaki konumlarını detaylıca tahlil et, hangi alanlarda doğal yeteneklere sahip olduğunuzu ve hangi alanların zayıf kaldığını açıkla.
    
    **🏠 2. Yaşam Alanlarındaki Ev Yansımaları**
    Ev başlangıç çizgileri ve gezegenlerin ev yerleşimlerini yaşam alanları bazında detaylandır.
    
    **⚠️ 3. Dikkat Edilmesi Gereken Riskler ve Gelişim Alanları**
    Gelecek dönemde nerede zorlanabileceğinizi, hangi konularda sabırlı ve temkinli olmanız gerektiğini anlat.
    
    **🔮 4. Kozmik Fırsatlar ve Gelecek Projeksiyonu**
    Yükselen şanslarınızı, hangi dönemlerde eyleme geçmeniz gerektiğini ve hayatı nasıl optimize edebileceğinizi anlat.
    
    Jungcu veya psikolojik terimler (anima, animus, gölge, bireyleşme vb.) kullanmaktan tamamen kaçın. Tamamen geleneksel göksel ilimler, yıldız hareketleri ve pratik astroloji bilgisi ver. Türkçe yaz.
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
    return `**🪐 1. Harita Potansiyeliniz ve Güçlü/Zayıf Konumlar**\nHaritanızdaki Güneş ve Jüpiter yerleşimleri, kariyerinizde liderlik vasıflarınızı ve şans kanallarınızı aktif kılıyor. Merkür'ün konumu zihinsel kapasitenizin yüksek olduğunu gösterse de Satürn'ün zorlayıcı açıları bazı konularda sorumlulukların gecikmeyle gelebileceğine işaret ediyor.

**🏠 2. Yaşam Alanlarındaki Ev Yansımaları**
Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve liderlik gücünüzü sergilemenizi desteklemekte. Jüpiter'in para evinize yaptığı olumlu temaslar ise önümüzdeki günlerde maddi kazanç kapılarını aralayabilir.

**⚠️ 3. Dikkat Edilmesi Gereken Riskler ve Gelişim Alanları**
Mars'ın 12. ev transiti içsel gerilimlere ve uykusuzluğa neden olabilir. Bu süreçte aceleci kararlar almaktan, trafikte veya riskli fiziksel aktivitelerde dikkatsiz davranmaktan kaçınmalısınız.

**🔮 4. Kozmik Fırsatlar ve Gelecek Projeksiyonu**
Önümüzdeki yeni ay döngüsü, hayatınızda yepyeni niyetler ve başlangıçlar için mükemmel bir zemin hazırlıyor. Kararlılıkla atacağınız adımlar uzun vadede kalıcı meyveler verecektir.`;
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
    return `**❤️ 1. Karşılıklı Çekim ve Aşk Uyumunuz**
Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. Venüs'ün karşılıklı uyumlu konumları sayesinde aranızdaki sevgi dili oldukça akıcı ve romantik.

**🗣️ 2. İletişim ve Zihinsel Ortaklık**
Merkür etkileşimleri ise zihinsel uyumunuzu ve sohbet kalitenizi üst seviyeye taşıyor. Birlikteyken zamanın nasıl geçtiğini anlamayacak kadar akıcı sohbetler yapabilirsiniz.

**⚠️ 3. Uyuşmazlıklar ve Sürtüşme Noktaları (Farklılıklar)**
Ancak Satürn ve Mars arasındaki gergin açılar, zaman zaman otorite savaşları ve sabırsızlık getirebilir. İnatlaşma ve birbirinizi kontrol etme isteği ilişkinin en büyük sınavıdır. Bazı konularda beklentilerinizin farklı olduğunu fark edebilirsiniz.

**🔮 4. Uyum Artırma Rehberi (Nasıl Daha Uyumlu Olunur?)**
Uyumunuzu artırmak için birbirinizin kişisel alanlarına saygı göstermeli ve öfkelendiğiniz anlarda sessiz kalmayı seçerek Mars'ın yıkıcı enerjisini yumuşatmalısınız. Venüs saatlerinde yapacağınız romantik jestler aranızdaki sevgiyi tazeleyecektir.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen ilişki astrolojisi ve doğum haritası uyumu konusunda uzman bir astrologsun.
    1. Kişi: "${p1Name}", Güneş Burcu: "${p1Sign}", Gezegenleri: ${JSON.stringify(p1Planets)}
    2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}
    
    Bu iki kişinin haritası arasındaki sinastri (uyum) analizini yap.
    Analizi şu net başlıklarla, son derece detaylı ve doyurucu bir şekilde yapılandır:
    
    **❤️ 1. Karşılıklı Çekim ve Aşk Uyumunuz**
    Güneş, Ay, Venüs ve Mars etkileşimleri üzerinden aranızdaki romantik çekimi, sadakat bağını ve ruhsal uyumu detaylandır. Neden uyumlu olduğunuzu açıklayan detaylar ver.
    
    **🗣️ 2. İletişim ve Zihinsel Ortaklık**
    Merkür açılarının aranızdaki konuşma diline, fikir birliğine ve anlaşma kolaylığına etkisini yorumla.
    
    **⚠️ 3. Uyuşmazlıklar ve Sürtüşme Noktaları (Farklılıklar)**
    Hangi gezegen etkileşimlerinin gerilim, kıskançlık, ego çatışması veya iletişim kopukluğu yaratabileceğini net bir şekilde açıkla. Hangi özelliklerinizin uyuşmadığını belirt.
    
    **🔮 4. Uyum Artırma Rehberi (Nasıl Daha Uyumlu Olunur?)**
    Bu harita doğrultusunda, aranızdaki sevgiyi büyütmek ve pürüzleri gidermek için birbirinize nasıl yaklaşmanız gerektiğine dair pratik ve kozmik tavsiyeler ver.
    
    Jungcu veya psikolojik terimler (anima, animus, gölge vb.) kullanmaktan tamamen kaçın. Tamamen klasik aşk ve uyum astrolojisi tahlili yap. Türkçe yaz.
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
    return `**❤️ 1. Karşılıklı Çekim ve Aşk Uyumunuz**
Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. Venüs'ün karşılıklı uyumlu konumları sayesinde aranızdaki sevgi dili oldukça akıcı ve romantik.

**🗣️ 2. İletişim ve Zihinsel Ortaklık**
Merkür etkileşimleri ise zihinsel uyumunuzu ve sohbet kalitenizi üst seviyeye taşıyor. Birlikteyken zamanın nasıl geçtiğini anlamayacak kadar akıcı sohbetler yapabilirsiniz.

**⚠️ 3. Uyuşmazlıklar ve Sürtüşme Noktaları (Farklılıklar)**
Ancak Satürn ve Mars arasındaki gergin açılar, zaman zaman otorite savaşları ve sabırsızlık getirebilir. İnatlaşma ve birbirinizi kontrol etme isteği ilişkinin en büyük sınavıdır. Bazı konularda beklentilerinizin farklı olduğunu fark edebilirsiniz.

**🔮 4. Uyum Artırma Rehberi (Nasıl Daha Uyumlu Olunur?)**
Uyumunuzu artırmak için birbirinizin kişisel alanlarına saygı göstermeli ve öfkelendiğiniz anlarda sessiz kalmayı seçerek Mars'ın yıkıcı enerjisini yumuşatmalısınız. Venüs saatlerinde yapacağınız romantik jestler aranızdaki sevgiyi tazeleyecektir.`;
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
    return `**⭐ 1. İsim Ebced Şifresi ve Kader Temaları**
Sevgili ${name}, anne adınız olan ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}. Bu ebced rezonansı, hayat yolculuğunuzda önemli dönüm noktalarında ilahi yardımlar alacağınızı gösterir.

**🔥 2. Yıldız Burcu ve Element Mizacı**
Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, karakterinizde güçlü bir liderlik arzusu ve kararlılık yaratırken, elementinizin sıcaklığı çevrenize ilham ve güven vermenizi sağlıyor.

**⚠️ 3. Manevi Engeller ve Dikkat Edilmesi Gerekenler**
Yıldızınız yüksek olduğu için nazara ve kem gözlerin negatif enerjilerine karşı oldukça hassassınız. Zaman zaman nedensiz yorgunluklar veya işlerinizde ani tıkanıklıklar yaşayabilirsiniz. Sağlıkta ise sindirim sistemi ve baş bölgelerinizi aşırı stresten korumalısınız.

**🛡️ 4. Manevi Koruma ve Esma Rehberi**
Bu tıkanıklıkları aşmak ve kendinizi korumak için her gün düzenli olarak Felak ve Nas surelerini okumanız, ayrıca adınıza özel rezonans sağlayan 'Ya Hafiz' ve 'Ya Latif' esmalarını zikretmeniz manevi koruma kalkanınızı maksimuma çıkaracaktır.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve havas ilmi konusunda derin bilgi sahibi uzman bir yıldızname müneccimisin.
    Kullanıcının adı: "${name}"
    Annesinin adı: "${motherName}"
    Toplam Ebced Değeri: ${totalEbced}
    Hesaplanan Yıldızname Burcu: "${sign}"
    Element: "${element}"
    
    Bu parametreler doğrultusunda kapsamlı, derin ve doyurucu bir Yıldızname analizi yaz.
    Analizi şu net başlıklarla yapılandır:
    
    **⭐ 1. İsim Ebced Şifresi ve Kader Temaları**
    Kullanıcının isminin ve anne isminin ebced rezonansının hayat yolculuğundaki etkilerini, kader çizgisine getirdiği şans ve sınavları açıkla.
    
    **🔥 2. Yıldız Burcu ve Element Mizacı**
    Hesaplanan yıldız burcu ve elementin fiziksel, zihinsel ve ruhsal yapısına etkisini mistik bir dille tahlil et.
    
    **⚠️ 3. Manevi Engeller ve Dikkat Edilmesi Gerekenler**
    Kişinin yaşamında karşılaşabileceği manevi engelleri, nazara açıklık durumunu, sağlıkta hassas olabilecek organlarını veya süreçlerini detaylandır.
    
    **🛡️ 4. Manevi Koruma ve Esma Rehberi**
    Nazar, tıkanıklık ve engelleri aşmak için kullanıcının düzenli okuması gereken koruyucu esmaları, duaları ve ruhsal arınma tavsiyelerini belirt.
    
    Jungcu veya modern batı psikolojisi terimlerinden tamamen uzak dur. Türkçe yaz.
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
    return `**⭐ 1. İsim Ebced Şifresi ve Kader Temaları**
Sevgili ${name}, anne adınız olan ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}. Bu ebced rezonansı, hayat yolculuğunuzda önemli dönüm noktalarında ilahi yardımlar alacağınızı gösterir.

**🔥 2. Yıldız Burcu ve Element Mizacı**
Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, karakterinizde güçlü bir liderlik arzusu ve kararlılık yaratırken, elementinizin sıcaklığı çevrenize ilham ve güven vermenizi sağlıyor.

**⚠️ 3. Manevi Engeller ve Dikkat Edilmesi Gerekenler**
Yıldızınız yüksek olduğu için nazara ve kem gözlerin negatif enerjilerine karşı oldukça hassassınız. Zaman zaman nedensiz yorgunluklar veya işlerinizde ani tıkanıklıklar yaşayabilirsiniz. Sağlıkta ise sindirim sistemi ve baş bölgelerinizi aşırı stresten korumalısınız.

**🛡️ 4. Manevi Koruma ve Esma Rehberi**
Bu tıkanıklıkları aşmak ve kendinizi korumak için her gün düzenli olarak Felak ve Nas surelerini okumanız, ayrıca adınıza özel rezonans sağlayan 'Ya Hafiz' ve 'Ya Latif' esmalarını zikretmeniz manevi koruma kalkanınızı maksimuma çıkaracaktır.`;
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
Sen; geleneksel astroloji, ruhsal gelişim ve karma astrolojisi konusunda uzmanlaşmış derinlikli bir astrologsun. Görevin, transit gök cisimlerinin gerilimli açılarını inceleyerek bireyin bugün yüzleşmesi gereken içsel engelleri, ruhsal gelişim fırsatlarını ve dönüştürülmesi gereken enerjileri tahlil etmektir.

[STRICT OUTPUT FORMAT RULES]
1. Çıktıyı kesinlikle aşağıdaki JSON şemasında belirtilen anahtarlarla eksiksiz döndür. Tek bir karakter bile şema dışına çıkmamalıdır.
2. Analiz dili bilge, ruhsal ve samimi olmalıdır. Ruhsal direnç noktalarını şefkatli bir şekilde açıkla.

Kullanıcı Adı: "${name}"
Doğum Haritası Konumları:
- Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
- Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
Mevcut Transit Gökyüzü:
- Transit Ay: ${moonSign} burcunda
- Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}

JSON Çıktı Şeması:
{
  "shadow_core": "Bugünkü krizin veya içsel blokajın ruhsal kökeni.",
  "jungian_analysis": "Ruhsal gelişim süreçlerini ve göksel etkileri açıklayan derin analiz (3 paragraf).",
  "confrontation_questions": [
    "Kullanıcının kendine sorması gereken farkındalık uyandırıcı soru 1",
    "Kullanıcının kendine sorması gereken farkındalık uyandırıcı soru 2",
    "Kullanıcının kendine sorması gereken farkındalık uyandırıcı soru 3"
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

    return `### 🌌 Bugünkü Ruhsal Odak\n${parsed.shadow_core}\n\n### 🧠 Göksel & Ruhsal Analiz\n${parsed.jungian_analysis}\n\n### 🔑 Kendinle Yüzleşme Soruları\n${questionsText}`;
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
    return `**🪐 1. Genel Mizaç, Kozmik Elementler ve Yaşam Yolu**
Güneş, Ay ve Yükselen yerleşimleriniz, kendinizi ifade etme ve hayatı deneyimleme biçiminizde güçlü bir denge kurmanızı sağlıyor. Ateş elementinin yüksekliği size doğal bir cesaret verirken, su elementinin derinliği sezgilerinizi güçlendiriyor.

**🧠 2. Zihinsel Yapı, Akıl ve İletişim**
Zihniniz son derece aktif ve öğrenmeye açık. Fikirlerinizi aktarırken net ve doğrudan bir iletişim tarzını benimsiyorsunuz. Kararlarınızda analitik davranmaya özen gösteriyorsunuz.

**❤️ 3. Aşk, Bağlar, Değerler ve Finansal Bereket**
Venüs yerleşimi ve açılarına göre ilişkilerinizde güven ve derinliği ön planda tutuyorsunuz. Finansal konularda sezgileriniz size rehberlik ediyor ve kalıcı kazançlar üretme potansiyeline sahipsiniz.

**🔥 4. Eylem, Tutku, Mücadele ve İrade Gücü**
Mars konumunuz, hedeflerinize kararlılıkla yürüdüğünüzü gösteriyor. Zorluklarla karşılaştığınızda pes etmek yerine, stratejik ve dayanıklı bir şekilde mücadele etmeyi seçiyorsunuz.

**⚠️ 5. Açı İlişkileri, Hayat Sınavları ve Olgunlaşma (Satürn)**
Satürn yerleşiminiz, disiplin ve sabır gerektiren sınavlardan geçerek olgunlaşacağınızı vurguluyor. Hayatınızdaki engeller, aslında sizi kalıcı ve köklü başarılara hazırlayan manevi basamaklardır.

**🗓️ 6. Kozmik Yaşam Planlama ve Günlük Strateji Rehberi**
Önemli ticari anlaşmaları ve yeni başlangıçları Merkür'ün temiz açılarında yapmaya özen gösterin. Enerjinizi korumak için Ay'ın küçülen fazlarında içsel temizlik yapın ve yeni ay fazlarında yeni projelerinizin tohumlarını atın.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerini, element dağılımlarını, niteliklerini ve gezegen açılarını sentezleyerek adeta bir kitap bölümü niteliğinde, son derece kapsamlı ve derin bir yaşam yolculuğu raporu oluşturmaktır.

[WRITING RULES]
1. Analiz dili mistik, bilge, sarmalayıcı ama aynı zamanda bilimsel, analitik ve psikolojik olmalıdır.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu net başlıklarla ve detaylı paragraflarla tam 6 bölüm halinde yapılandır.

Kullanıcının Adı: "${name}"
Doğum Haritası Gezegen Konumları ve Evleri:
${JSON.stringify(birthChart.planets)}
Doğum Haritası Ev Başlangıç Dereceleri:
${JSON.stringify(birthChart.houses)}
Haritadaki Gezegenler Arası Açı İlişkileri:
${JSON.stringify(aspects)}

Rapor Bölümleri:
**🪐 1. Genel Mizaç, Kozmik Elementler ve Yaşam Yolu**
Yükselen, Güneş ve Ay konumları ile element dengesinin sentezi. Temel karakter özellikleri, ruhsal potansiyeli ve dünyaya geliş amacı.

**🧠 2. Zihinsel Yapı, Akıl ve İletişim**
Merkür konumuna ve açılarına göre zekası, öğrenme ve karar verme yapısı, iletişim üslubu. Zihinsel tıkanıklıkları nasıl aşabileceği.

**❤️ 3. Aşk, Bağlar, Değerler ve Finansal Bereket**
Venüs yerleşimi ve açılarına göre ilişkilerdeki beklentileri, sevgi dili, finansal değerleri ve bereketi hayatına çekme potansiyeli.

**🔥 4. Eylem, Tutku, Mücadele ve İrade Gücü**
Mars konumuna göre motivasyon kaynakları, kriz anlarındaki tavrı, engelleri aşma tarzı ve fiziksel enerjiyi doğru kullanma biçimi.

**⚠️ 5. Açı İlişkileri, Hayat Sınavları ve Olgunlaşma (Satürn)**
Satürn yerleşimine ve gezegenler arasındaki majör açılara (kavuşum, kare, karşıt vb.) göre hayatındaki karmik zorluklar, aşması gereken engeller ve manevi olgunlaşma yolları.

**🗓️ 6. Kozmik Yaşam Planlama ve Günlük Strateji Rehberi**
Kullanıcının bu harita doğrultusunda hayatını, günlerini ve önemli kararlarını nasıl planlaması gerektiğine dair pratik astrolojik rehber. Eyleme geçme zamanları, imza atma, ortaklık kurma ve arınma dönemlerini belirleme stratejisi.
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
    return `**🪐 1. Genel Mizaç, Kozmik Elementler ve Yaşam Yolu**
Güneş, Ay ve Yükselen yerleşimleriniz, kendinizi ifade etme ve hayatı deneyimleme biçiminizde güçlü bir denge kurmanızı sağlıyor. Ateş elementinin yüksekliği size doğal bir cesaret verirken, su elementinin derinliği sezgilerinizi güçlendiriyor.

**🧠 2. Zihinsel Yapı, Akıl ve İletişim**
Zihniniz son derece aktif ve öğrenmeye açık. Fikirlerinizi aktarırken net ve doğrudan bir iletişim tarzını benimsiyorsunuz. Kararlarınızda analitik davranmaya özen gösteriyorsunuz.

**❤️ 3. Aşk, Bağlar, Değerler ve Finansal Bereket**
Venüs yerleşimi ve açılarına göre ilişkilerinizde güven ve derinliği ön planda tutuyorsunuz. Finansal konularda sezgileriniz size rehberlik ediyor ve kalıcı kazançlar üretme potansiyeline sahipsiniz.

**🔥 4. Eylem, Tutku, Mücadele ve İrade Gücü**
Mars konumunuz, hedeflerinize kararlılıkla yürüdüğünüzü gösteriyor. Zorluklarla karşılaştığınızda pes etmek yerine, stratejik ve dayanıklı bir şekilde mücadele etmeyi seçiyorsunuz.

**⚠️ 5. Açı İlişkileri, Hayat Sınavları ve Olgunlaşma (Satürn)**
Satürn yerleşiminiz, disiplin ve sabır gerektiren sınavlardan geçerek olgunlaşacağınızı vurguluyor. Hayatınızdaki engeller, aslında sizi kalıcı ve köklü başarılara hazırlayan manevi basamaklardır.

**🗓️ 6. Kozmik Yaşam Planlama ve Günlük Strateji Rehberi**
Önemli ticari anlaşmaları ve yeni başlangıçları Merkür'ün temiz açılarında yapmaya özen gösterin. Enerjinizi korumak için Ay'ın küçülen fazlarında içsel temizlik yapın ve yeni ay fazlarında yeni projelerinizin tohumlarını atın.`;
  }
}

