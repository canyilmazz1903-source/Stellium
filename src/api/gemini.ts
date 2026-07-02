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
  const fallbackReport = `**🪐 1. Harita Potansiyeliniz ve Güçlü/Zayıf Konumlar**
Haritanızdaki Güneş ve Jüpiter yerleşimleri, kariyerinizde liderlik vasıflarınızı ve şans kanallarınızı aktif kılıyor. Merkür'ün konumu zihinsel kapasitenizin yüksek olduğunu gösterse de Satürn'ün zorlayıcı açıları bazı konularda sorumlulukların gecikmeyle gelebileceğine işaret ediyor.

**🏠 2. Yaşam Alanlarındaki Ev Yansımaları**
Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve liderlik gücünüzü sergilemenizi desteklemekte. Jüpiter'in para evinize yaptığı olumlu temaslar ise önümüzdeki günlerde maddi kazanç kapılarını aralayabilir.

**⚠️ 3. Dikkat Edilmesi Gereken Riskler ve Gelişim Alanları**
Mars'ın 12. ev transiti içsel gerilimlere ve uykusuzluğa neden olabilir. Bu süreçte aceleci kararlar almaktan, trafikte veya riskli fiziksel aktivitelerde dikkatsiz davranmaktan kaçınmalısınız.

**🔮 4. Kozmik Fırsatlar ve Gelecek Projeksiyonu**
Önümüzdeki yeni ay döngüsü, hayatınızda yepyeni niyetler ve başlangıçlar için mükemmel bir zemin hazırlıyor. Kararlılıkla atacağınız adımlar uzun vadede kalıcı meyveler verecektir.`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt1 = `
[SYSTEM INSTRUCTION]
Sen geleneksel astroloji, gökyüzü transitleri ve gezegen ev konumları konusunda uzman kıdemli bir elit astrologsun. Görevin, kullanıcının doğum haritasındaki gezegen yerleşimlerini ve ev sistemini tahlil ederek detaylı bir karakter ve yaşam potansiyeli raporu oluşturmaktır.

[WRITING RULES]
1. Analiz dili mistik, bilge, son derece açıklayıcı ve pratik olmalıdır. Açı ve yerleşimlerin hayatta tam olarak neye sebep olduğunu (neden-sonuç ilişkilerini) derinlemesine açıkla.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

Kullanıcı: "${name}", Burç: "${zodiacSign}"
Doğum Haritası Gezegen Yerleşimleri: ${JSON.stringify(planets)}
Doğum Haritası Ev Başlangıç Dereceleri: ${JSON.stringify(houses)}

Rapor Bölümleri:
**🪐 1. Harita Potansiyeliniz ve Güçlü/Zayıf Konumlar**
Gezegenlerinizin haritanızdaki konumlarını detaylıca tahlil et, hangi alanlarda doğal yeteneklere sahip olduğunuzu, hangi alanların zayıf kaldığını ve bunun hayatınızdaki pratik sonuçlarını açıkla.

**🏠 2. Yaşam Alanlarındaki Ev Yansımaları**
Ev başlangıç çizgileri ve gezegenlerin ev yerleşimlerini yaşam alanları bazında detaylandırarak bu enerjilerin kariyer, ilişkiler ve finansal hayatınıza yansımalarını yorumla.
  `;

  const prompt2 = `
[SYSTEM INSTRUCTION]
Sen geleneksel astroloji, gökyüzü transitleri ve gezegen ev konumları konusunda uzman kıdemli bir elit astrologsun. Görevin, kullanıcının doğum haritasındaki gezegen yerleşimlerini ve ev sistemini tahlil ederek gelecek dönem risklerini ve kozmik fırsatları içeren bir projeksiyon rehberi hazırlamaktır.

[WRITING RULES]
1. Analiz dili bilge, uyarıcı, pratik ve son derece yol gösterici olmalıdır. Yakın ve orta vadeli önemli tarihler, kaçınılması gereken zamanlar ve eylem planları içermelidir.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

Kullanıcı: "${name}", Burç: "${zodiacSign}"
Doğum Haritası Gezegen Yerleşimleri: ${JSON.stringify(planets)}

Rapor Bölümleri:
**⚠️ 3. Dikkat Edilmesi Gereken Riskler ve Gelişim Alanları**
Gelecek dönemde nerede zorlanabileceğinizi, hangi konularda sabırlı ve temkinli olmanız gerektiğini, retro ve zorlu transit dönemlerindeki riskleri detaylandır.

**🔮 4. Kozmik Fırsatlar ve Gelecek Projeksiyonu**
Yükselen şanslarınızı, önümüzdeki dönemde (özellikle önümüzdeki 3-6 aylık kritik tarih aralıkları vererek) hangi dönemlerde eyleme geçmeniz gerektiğini ve hayatı nasıl optimize edebileceğinizi anlat.
  `;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt1 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt2 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    ]);

    const text1 = res1.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const text2 = res2.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text1 && !text2) {
      return fallbackReport;
    }

    return `${text1.trim()}\n\n${text2.trim()}`;
  } catch (error) {
    console.warn('Error fetching transit analysis concurrently:', error);
    return fallbackReport;
  }
}

export async function fetchSynastryAnalysis(
  p1Name: string,
  p1Sign: string,
  p1Planets: any[],
  p2Name: string,
  p2Planets: any[]
): Promise<string> {
  const fallbackReport = `**❤️ 1. Karşılıklı Çekim ve Aşk Uyumunuz**
Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. Venüs'ün karşılıklı uyumlu konumları sayesinde aranızdaki sevgi dili oldukça akıcı ve romantik.

**🗣️ 2. İletişim ve Zihinsel Ortaklık**
Merkür etkileşimleri ise zihinsel uyumunuzu ve sohbet kalitenizi üst seviyeye taşıyor. Birlikteyken zamanın nasıl geçtiğini anlamayacak kadar akıcı sohbetler yapabilirsiniz.

**⚠️ 3. Uyuşmazlıklar ve Sürtüşme Noktaları (Farklılıklar)**
Ancak Satürn ve Mars arasındaki gergin açılar, zaman zaman otorite savaşları ve sabırsızlık getirebilir. İnatlaşma ve birbirinizi kontrol etme isteği ilişkinin en büyük sınavıdır. Bazı konularda beklentilerinizin farklı olduğunu fark edebilirsiniz.

**🔮 4. Uyum Artırma Rehberi (Nasıl Daha Uyumlu Olunur?)**
Uyumunuzu artırmak için birbirinizin kişisel alanlarına saygı göstermeli ve öfkelendiğiniz anlarda sessiz kalmayı seçerek Mars'ın yıkıcı enerjisini yumuşatmalısınız. Venüs saatlerinde yapacağınız romantik jestler aranızdaki sevgiyi tazeleyecektir.`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt1 = `
[SYSTEM INSTRUCTION]
Sen ilişki astrolojisi ve doğum haritası uyumu konusunda uzman elit kıdemli bir astrologsun. Görevin, iki kişinin doğum haritası verilerini ve gezegen etkileşimlerini (sinastri) karşılaştırarak aşk, romantizm ve zihinsel uyum analizini çıkarmaktır.

[WRITING RULES]
1. Analiz dili bilge, derinlemesine açıklayıcı ve son derece doyurucu olmalıdır. Gezegen açılarının aralarında tam olarak neye sebep olduğunu (neden-sonuç ilişkilerini) detaylıca tahlil et.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

1. Kişi: "${p1Name}", Güneş Burcu: "${p1Sign}", Gezegenleri: ${JSON.stringify(p1Planets)}
2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}

Rapor Bölümleri:
**❤️ 1. Karşılıklı Çekim ve Aşk Uyumunuz**
Güneş, Ay, Venüs ve Mars etkileşimleri üzerinden aranızdaki romantik çekimi, sadakat bağını ve ruhsal uyumu detaylandır. Neden uyumlu olduğunuzu açıklayan detaylar ver.

**🗣️ 2. İletişim ve Zihinsel Ortaklık**
Merkür açılarının aranızdaki konuşma diline, fikir birliğine, ortak ilgi alanlarına ve anlaşma kolaylığına etkisini derinlemesine yorumla.
  `;

  const prompt2 = `
[SYSTEM INSTRUCTION]
Sen ilişki astrolojisi ve doğum haritası uyumu konusunda uzman elit kıdemli bir astrologsun. Görevin, iki kişinin doğum haritası verilerini ve gezegen etkileşimlerini (sinastri) karşılaştırarak uyuşmazlıklar, ego savaşları ve uyum artırma stratejilerini içeren bir rehber hazırlamaktır.

[WRITING RULES]
1. Analiz dili yol gösterici, pratik ve son derece yapıcı olmalıdır. Gezegenlerin zorlayıcı açılarının nelere sebep olduğunu ve bunların nasıl iyileştirilebileceğini pratik tavsiyelerle açıkla.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

1. Kişi: "${p1Name}", Gezegenleri: ${JSON.stringify(p1Planets)}
2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}

Rapor Bölümleri:
**⚠️ 3. Uyuşmazlıklar ve Sürtüşme Noktaları (Farklılıklar)**
Hangi gezegen etkileşimlerinin (Satürn kısıtlamaları, Plüton kontrol savaşları, Mars öfkesi vb.) gerilim, kıskançlık, ego çatışması veya iletişim kopukluğu yaratabileceğini net bir şekilde açıkla. Hangi özelliklerinizin uyuşmadığını belirt.

**🔮 4. Uyum Artırma Rehberi (Nasıl Daha Uyumlu Olunur?)**
Bu harita doğrultusunda, aranızdaki sevgiyi büyütmek ve pürüzleri gidermek için birbirinize nasıl yaklaşmanız gerektiğine dair pratik ve kozmik tavsiyeler ver.
  `;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt1 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt2 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    ]);

    const text1 = res1.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const text2 = res2.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text1 && !text2) {
      return fallbackReport;
    }

    return `${text1.trim()}\n\n${text2.trim()}`;
  } catch (error) {
    console.warn('Error fetching synastry analysis concurrently:', error);
    return fallbackReport;
  }
}

export async function fetchYildiznameAnalysis(
  name: string,
  motherName: string,
  totalEbced: number,
  sign: string,
  element: string
): Promise<string> {
  const fallbackReport = `**⭐ 1. İsim Ebced Şifresi ve Kader Temaları**
Sevgili ${name}, anne adınız olan ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}. Bu ebced rezonansı, hayat yolculuğunuzda önemli dönüm noktalarında ilahi yardımlar alacağınızı gösterir.

**🔥 2. Yıldız Burcu ve Element Mizacı**
Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, karakterinizde güçlü bir liderlik arzusu ve kararlılık yaratırken, elementinizin sıcaklığı çevrenize ilham ve güven vermenizi sağlıyor.

**⚠️ 3. Manevi Engeller ve Dikkat Edilmesi Gerekenler**
Yıldızınız yüksek olduğu için nazara ve kem gözlerin negatif enerjilerine karşı oldukça hassassınız. Zaman zaman nedensiz yorgunluklar veya işlerinizde ani tıkanıklıklar yaşayabilirsiniz. Sağlıkta ise sindirim sistemi ve baş bölgelerinizi aşırı stresten korumalısınız.

**🛡️ 4. Manevi Koruma ve Esma Rehberi**
Bu tıkanıklıkları aşmak ve kendinizi korumak için her gün düzenli olarak Felak ve Nas surelerini okumanız, ayrıca adınıza özel rezonans sağlayan 'Ya Hafiz' ve 'Ya Latif' esmalarını zikretmeniz manevi koruma kalkanınızı maksimuma çıkaracaktır.`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt1 = `
[SYSTEM INSTRUCTION]
Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve Havas ilmi konusunda derin bilgi sahibi uzman kıdemli bir yıldızname müneccimisin. Görevin, kullanıcının isim ebced rezonansını ve yıldız burcu mizaç potansiyellerini detaylıca tahlil etmektir.

[WRITING RULES]
1. Analiz dili mistik, bilge, son derece edebi ve sarmalayıcı olmalıdır. Kader çizgilerini, element mizaçlarını, bu mizaçların hayattaki yansımalarını ve olayları detaylıca açıkla.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

Kullanıcının adı: "${name}"
Annesinin adı: "${motherName}"
Toplam Ebced Değeri: ${totalEbced}
Hesaplanan Yıldızname Burcu: "${sign}"
Element: "${element}"

Rapor Bölümleri:
**⭐ 1. İsim Ebced Şifresi ve Kader Temaları**
Kullanıcının isminin ve anne isminin ebced rezonansının hayat yolculuğundaki etkilerini, kader çizgisine getirdiği şans ve sınavları açıkla.

**🔥 2. Yıldız Burcu ve Element Mizacı**
Hesaplanan yıldız burcu ve elementin fiziksel, zihinsel ve ruhsal yapısına etkisini mistik bir dille tahlil et.
  `;

  const prompt2 = `
[SYSTEM INSTRUCTION]
Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve Havas ilmi konusunda derin bilgi sahibi uzman kıdemli bir yıldızname müneccimisin. Görevin, kullanıcının yıldızname verilerine göre manevi engellerini, nazara yatkınlığını ve esma koruma reçetesini detaylandırmaktır.

[WRITING RULES]
1. Analiz dili bilge, koruyucu, yol gösterici ve son derece yapıcı olmalıdır. Önerilen esma ve duaların okuma sayıları ve şekillerini detaylıca belirt.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 2 ana bölüm halinde yapılandır.

Kullanıcının adı: "${name}"
Hesaplanan Yıldızname Burcu: "${sign}"

Rapor Bölümleri:
**⚠️ 3. Manevi Engeller ve Dikkat Edilmesi Gerekenler**
Kişinin yaşamında karşılaşabileceği manevi engelleri, yıldız düşüklüğü durumlarını, nazara açıklık durumunu, sağlıkta hassas olabilecek organlarını veya süreçlerini detaylandır.

**🛡️ 4. Manevi Koruma ve Esma Rehberi**
Nazar, tıkanıklık ve engelleri aşmak için kullanıcının düzenli okuması gereken koruyucu esmaları (ebced sayı rezonanslarına göre adetleriyle), duaları ve ruhsal arınma tavsiyelerini belirt.
  `;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt1 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt2 }] }] })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    ]);

    const text1 = res1.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const text2 = res2.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text1 && !text2) {
      return fallbackReport;
    }

    return `${text1.trim()}\n\n${text2.trim()}`;
  } catch (error) {
    console.warn('Error fetching yildizname analysis concurrently:', error);
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

export async function fetchFullChartAnalysis(
  name: string,
  birthChart: ComputedChart,
  aspects: any[]
): Promise<string> {
  const fallbackReport = `**🪐 1. Genel Mizaç ve Element Dengesi**
Güneş, Ay ve Yükselen yerleşimleriniz, kendinizi ifade etme ve hayatı deneyimleme biçiminizde güçlü bir denge kurmanızı sağlıyor. Ateş elementinin yüksekliği size doğal bir cesaret verirken, su elementinin derinliği sezgilerinizi güçlendiriyor.

**🧠 2. Zihinsel Kapasite ve İletişim Dili**
Zihniniz son derece aktif ve öğrenmeye açık. Fikirlerinizi aktarırken net ve doğrudan bir iletişim tarzını benimsiyorsunuz. Kararlarınızda analitik davranmaya özen gösteriyorsunuz.

**❤️ 3. İlişkiler, Sevgi Dili ve Finansal Bereket**
Venüs yerleşimi ve açılarına göre ilişkilerinizde güven ve derinliği ön planda tutuyorsunuz. Finansal konularda sezgileriniz size rehberlik ediyor ve kalıcı kazançlar üretme potansiyeline sahipsiniz.

**🔥 4. İrade Gücü, Tutku ve Mücadele Tarzı**
Mars konumunuz, hedeflerinize kararlılıkla yürüdüğünüzü gösteriyor. Zorluklarla karşılaştığınızda pes etmek yerine, stratejik ve dayanıklı bir şekilde mücadele etmeyi seçiyorsunuz.

**⚠️ 5. Hayat Sınavları, Engeller ve Satürn Dersleri**
Satürn yerleşiminiz, disiplin ve sabır gerektiren sınavlardan geçerek olgunlaşacağınızı vurguluyor. Hayatınızdaki engeller, aslında sizi kalıcı ve köklü başarılara hazırlayan manevi basamaklardır.

**🗓️ 6. Yakın Dönem Projeksiyonu ve Önemli Kozmik Tarihler**
Önümüzdeki 3 aylık süreçte (Ör: Temmuz - Eylül dönemi), özellikle yeni ay fazlarında (her ayın ilk haftası) yeni projelere odaklanın. Ay küçülürken (ayın son 10 günü) yeni anlaşmalardan ve riskli yatırımlardan kaçının.

**🚨 7. Mevcut Dönemde Dikkat Edilmesi Gereken Riskler**
Şu sıralar sabırsızlık ve aceleci iletişim nedeniyle ikili ilişkilerde gerginlikler yaşayabilirsiniz. Kararlarınızı alırken en az 24 saat düşünmeniz ve zihinsel sakinliği korumanız önerilir.

**🔮 8. İlerisi İçin Stratejik Yaşam Planlama ve Uzun Vadeli Uyarılar**
Uzun vadede kemik ve diş sağlığınıza özen göstermelisiniz. Finansal yatırımlarınızda gayrimenkul ve toprak gibi kalıcı değerlere yönelmek Satürn'ün zorlayıcı etkilerini koruyucu bir kalkana dönüştürecektir.`;

  if (!GEMINI_API_KEY) {
    return fallbackReport;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt1 = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, Keldani numerolojisini ve klasik/modern astroloji metodolojilerini birleştiren elit bir Astroloji Profesörüsün. Görevin, kullanıcının natal harita verilerini, element dağılımlarını, niteliklerini sentezleyerek adeta bir kitap bölümü niteliğinde, son derece kapsamlı ve derin bir mizaç raporu oluşturmaktır.

[WRITING RULES]
1. Analiz dili mistik, bilge, sarmalayıcı ama aynı zamanda bilimsel, analitik ve psikolojik olmalıdır.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 4 ana bölüm halinde yapılandır.

Kullanıcının Adı: "${name}"
Doğum Haritası Gezegen Konumları ve Evleri:
${JSON.stringify(birthChart.planets)}
Doğum Haritası Ev Başlangıç Dereceleri:
${JSON.stringify(birthChart.houses)}

Rapor Bölümleri:
**🪐 1. Genel Mizaç ve Element Dengesi**
Yükselen, Güneş ve Ay konumları ile element dengesinin sentezi. Temel karakter özellikleri, ruhsal potansiyeli ve dünyaya geliş amacı.

**🧠 2. Zihinsel Kapasite ve İletişim Dili**
Merkür konumuna ve açılarına göre zekası, öğrenme ve karar verme yapısı, iletişim üslubu. Zihinsel tıkanıklıkları nasıl aşabileceği.

**❤️ 3. İlişkiler, Sevgi Dili ve Finansal Bereket**
Venüs yerleşimi ve açılarına göre ilişkilerdeki beklentileri, sevgi dili, finansal değerleri ve bereketi hayatına çekme potansiyeli.

**🔥 4. İrade Gücü, Tutku ve Mücadele Tarzı**
Mars konumuna göre motivasyon kaynakları, kriz anlarındaki tavrı, engelleri aşma tarzı ve fiziksel enerjiyi doğru kullanma biçim.
  `;

  const prompt2 = `
[SYSTEM INSTRUCTION]
Sen; İsviçre Efemerisi hassasiyetine vakıf, gökyüzü transitleri ve gezegen açı yerleşimleri konusunda uzman bir Astroloji Profesörüsün. Görevin, kullanıcının açı ilişkilerini ve Satürn konumunu tahlil ederek yakın ve uzun vadeli bir kozmik planlama stratejisi hazırlamaktır.

[WRITING RULES]
1. Analiz dili bilge, uyarıcı, pratik ve son derece yol gösterici olmalıdır.
2. Metin içi yapılandırmada başlıklar ve anahtar kelimeler için **kalın metin** kullan. Bölümler arasına çift satır boşluk ekle.
3. Raporu tam 4 ana bölüm halinde yapılandır.

Kullanıcının Adı: "${name}"
Doğum Haritası Gezegen Konumları:
${JSON.stringify(birthChart.planets)}
Haritadaki Gezegenler Arası Açı İlişkileri:
${JSON.stringify(aspects)}

Rapor Bölümleri:
**⚠️ 5. Hayat Sınavları, Engeller ve Satürn Dersleri**
Satürn yerleşimine ve gezegenler arasındaki majör açılara (kavuşum, kare, karşıt vb.) göre hayatındaki karmik zorluklar, aşması gereken engeller ve manevi olgunlaşma yolları.

**🗓️ 6. Yakın Dönem Projeksiyonu ve Önemli Kozmik Tarihler**
Önümüzdeki 6 aylık süreçte (Ör: Temmuz - Aralık 2026 dönemi) hangi dönemlerde, hangi tarihlerde eyleme geçmesi gerektiği, hangi günlerde imza, ortaklık veya büyük adımlardan kaçınması gerektiğine dair spesifik tarih aralıkları ve kozmik projeksiyon.

**🚨 7. Mevcut Dönemde Dikkat Edilmesi Gereken Riskler**
Kullanıcının bugünlerde hayatında en çok hangi konularda temkinli olması gerektiği (Ör: borçlanma, acele kararlar, öfke patlamaları, sakarlıklar vb.) ve koruyucu adımlar.

**🔮 8. İlerisi İçin Stratejik Yaşam Planlama ve Uzun Vadeli Uyarılar**
Gelecek yıllarda dikkat edilmesi gereken uzun vadeli kozmik riskler, sağlıkta hassas olabilecek organlar/dönemler ve hayatını planlarken kullanabileceği altın kurallar.
  `;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt1 }] }]
        })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt2 }] }]
        })
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    ]);

    const text1 = res1.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const text2 = res2.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text1 && !text2) {
      return fallbackReport;
    }

    return `${text1.trim()}\n\n${text2.trim()}`;
  } catch (error) {
    console.warn('Error fetching full birth chart analysis concurrently:', error);
    return fallbackReport;
  }
}

