const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface HoroscopeResponse {
  general: string;
  love: string;
  career: string;
  shadowSelf: string; // Jungian Shadow theme
}

export async function fetchDailyHoroscope(
  name: string,
  zodiacSign: string,
  birthDate: string,
  birthPlace: string
): Promise<HoroscopeResponse> {
  if (!GEMINI_API_KEY) {
    // Premium fallback if key is not configured yet
    return {
      general: `Sevgili ${name}, bugün gökyüzünde Güneş ve Ay açıları, içsel dengeni bulmanı destekliyor. ${zodiacSign} burcundaki yerleşimler, kendi bireysel kahramanının yolculuğunda (Archetypal Hero's Journey) yeni bir kapı aralayabilir. Kendini gözlemle.`,
      love: "İlişkilerinde yansıtmalara (projection) dikkat et. Karşındakinde gördüğün eksiklikler, kendi içsel dünyandaki gölgelerin bir yansıması olabilir.",
      career: "İş hayatında yaratıcı dürtülerini açığa çıkarmak için uygun bir gün. Kendi otoriteni dış güçlere teslim etmeden, dengeli adımlar at.",
      shadowSelf: "Bugün içsel gölgenle yüzleşme günü. Seni huzursuz eden dürtülerin altındaki bastırılmış yaratıcı enerjileri keşfetmeye çalış."
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen Carl Jung ekolünden gelen, arketipler ve psikolojik derinliği olan uzman bir astrologsun.
    Kullanıcının adı: "${name}"
    Zodyak Burcu: "${zodiacSign}"
    Doğum Parametreleri: ${birthDate} - ${birthPlace}
    
    Lütfen bu kullanıcı için arketipsel, felsefi ve psikolojik derinliği olan günlük burç yorumu yaz.
    Klasik, sığ burç yorumlarından ("şanslı gününüz", "para gelecek" vb.) uzak dur.
    Onun yerine Jungian analitik psikoloji dokunuşlarıyla içsel keşif odaklı, edebi ve lüks bir dil kullan.
    
    Yazacağın yanıtı SADECE aşağıdaki JSON formatında döndür, ekstra hiçbir açıklama veya markdown bloğu yazma:
    {
      "general": "günlük genel arketipsel durum, bireysel yolculuk tavsiyeleri (maksimum 4 cümle)",
      "love": "ilişki dinamikleri, yansıtma ve anîma/anîmus dengesi analizi (maksimum 3 cümle)",
      "career": "çalışma hayatı, kendi otoritesini eline alma ve yaratıcı dürtülerin ifadesi (maksimum 3 cümle)",
      "shadowSelf": "kullanıcının bugün fark etmesi gereken gölge yönü (shadow self) ve bütünleşme tavsiyesi (maksimum 3 cümle)"
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
    
    return JSON.parse(jsonText.trim()) as HoroscopeResponse;
  } catch (error) {
    console.warn('Error fetching daily horoscope from Gemini:', error);
    // Fallback response
    return {
      general: `Sevgili ${name}, bugün gökyüzünde Güneş ve Ay açıları, içsel dengeni bulmanı destekliyor. ${zodiacSign} burcundaki yerleşimler, kendi bireysel kahramanının yolculuğunda (Archetypal Hero's Journey) yeni bir kapı aralayabilir. Kendini gözlemle.`,
      love: "İlişkilerinde yansıtmalara (projection) dikkat et. Karşındakinde gördüğün eksiklikler, kendi içsel dünyandaki gölgelerin bir yansıması olabilir.",
      career: "İş hayatında yaratıcı dürtülerini açığa çıkarmak için uygun bir gün. Kendi otoriteni dış güçlere teslim etmeden, dengeli adımlar at.",
      shadowSelf: "Bugün içsel gölgenle yüzleşme günü. Seni huzursuz eden dürtülerin altındaki bastırılmış yaratıcı enerjileri keşfetmeye çalış."
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
    return "Premium Transit Analizi: Şu anda gökyüzü transitleri natal yerleşimlerinizle uyumlu açılar oluşturuyor. Güneş'in 10. evinizden transiti, kariyer hedeflerinizde kendinizi daha net ifade etmenizi ve içsel gücünüzü sergilemenizi desteklemekte.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen derinlikli bir astrolog ve psikoterapistsin.
    Kullanıcı: "${name}", Burç: "${zodiacSign}"
    Doğum Haritası Gezegen Yerleşimleri: ${JSON.stringify(planets)}
    Doğum Haritası Ev Başlangıç Dereceleri: ${JSON.stringify(houses)}
    
    Kullanıcı için detaylı bir transit ve gezegen yerleşimleri analizi yap.
    Bu analizde:
    - Haritasındaki önemli gezegen yerleşimlerinin psikolojik karşılıklarını (Jungian arketipleri, gölge yönler, potansiyeller) açıkla.
    - Ev yerleşimlerinin hayat alanlarındaki yansımalarını derinlemesine tahlil et.
    - Ona bu harita doğrultusunda felsefi bir rehberlik sun.
    
    Yorumun akıcı, derin, edebi ve son derece kişiselleştirilmiş olsun. Maksimum 3 paragraf olsun.
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
    return "Gökyüzü transitlerinizin natal haritanız üzerindeki etkilerini hesaplarken geçici bir bağlantı sorunu yaşandı. Lütfen daha sonra tekrar deneyin.";
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
    return `Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. İlişkinizde iletişimsel uyum yüksek, ancak gölge yönlerinizin farkında olmak bağınızı güçlendirecektir.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen Carl Jung ekolünden ilham alan ilişki psikoterapisti ve derinlikli bir astrologsun.
    1. Kişi: "${p1Name}", Güneş Burcu: "${p1Sign}", Gezegenleri: ${JSON.stringify(p1Planets)}
    2. Kişi: "${p2Name}", Gezegenleri: ${JSON.stringify(p2Planets)}
    
    Bu iki kişinin haritası arasındaki sinastri (uyum) analizini yap.
    - Jungian arketipler (özellikle Anima ve Animus yansıtmaları) çerçevesinde ilişkiyi tahlil et.
    - Birbirlerinin hayatlarında hangi gelişim alanlarını tetiklediklerini (gölge entegrasyonu, kişisel büyüme) açıkla.
    - İlişkinin güçlü ve zayıf/karmik yönlerini edebi ve sofistike bir dille özetle.
    
    Yazacağın yorum akıcı, felsefi ve derin olsun. Maksimum 3 paragraf olsun. Türkçe yaz.
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
    return `Sevgili ${p1Name} ve ${p2Name}, haritalarınız arasındaki uyum analizi çıkarıldı. Güneş ve Ay yerleşimleriniz ruhsal planda güçlü bir çekim yaratıyor. İlişkinizde iletişimsel uyum yüksek, ancak gölge yönlerinizin farkında olmak bağınızı güçlendirecektir.`;
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
    return `Sevgili ${name}, anne adı ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}, Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, hayat yolculuğunuzda sezgilerinizin ve manevi rehberliğinizin ön planda olduğunu gösteriyor.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    Sen geleneksel Doğu mistisizmi, Ebced hesabı, yıldıznameler ve aynı zamanda batı psikolojisi konusunda derin bilgi sahibi mistik bir rehbersin.
    Kullanıcının adı: "${name}"
    Annesinin adı: "${motherName}"
    Toplam Ebced Değeri: ${totalEbced}
    Hesaplanan Yıldızname Burcu: "${sign}"
    Element: "${element}"
    
    Bu parametreler doğrultusunda kapsamlı ve derin bir Yıldızname analizi yaz.
    Analizde şunlara yer ver:
    - İsmin enerjisi, Ebced kodlamasının getirdiği kader temaları ve potansiyeller.
    - Yıldız Burcu ve Elementin yarattığı mizaç özellikleri (Geleneksel ve psikolojik derinliği olan bir dille).
    - Kullanıcının hayat yolculuğunda dikkat etmesi gereken manevi engeller ve bunlara karşı koruyucu öneriler.
    
    Yazacağın yorum sürükleyici, mistik, saygın ve edebi bir tonda olsun. Klasik batıl inanç klişelerinden uzak durup psikolojik bütünleşme tavsiyeleriyle zenginleştir. Maksimum 3 paragraf olsun. Türkçe yaz.
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
    return `Sevgili ${name}, anne adı ${motherName} ile hesaplanan geleneksel Yıldızname raporunuz oluşturuldu. Ebced değeriniz: ${totalEbced}, Yıldız burcunuz: ${sign}, Elementiniz: ${element}. Bu yerleşim, hayat yolculuğunuzda sezgilerinizin ve manevi rehberliğinizin ön planda olduğunu gösteriyor.`;
  }
}
