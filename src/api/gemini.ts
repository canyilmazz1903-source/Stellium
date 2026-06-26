import { ComputedChart } from '@/store/appStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

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
    Sen geleneksel ve modern astroloji, Ay evreleri, ebced hesapları, zikir saatleri ve kozmik ritüeller konusunda uzman, son derece bilgili mistik bir astrologsun.
    Kullanıcının adı: "${name}"
    Zodyak Burcu: "${zodiacSign}"
    Doğum Parametreleri: ${birthDate} - ${birthPlace}
    
    Lütfen bu kullanıcı için klasik astroloji detaylarını (Güneş/Ay transitleri, günün gezegen saatleri vb.) ve ebced zikirlerini harmanlayan, merak uyandırıcı ve günlük girişi teşvik eden zengin bir yorum yaz. Carl Jung veya psikolojik/Jungcu terimler (anima, animus, gölge vb.) kesinlikle kullanma. Doğrudan geleneksel astroloji, yıldız hareketleri ve manevi/kozmik ritüeller odaklı olsun.
    
    Yazacağın yanıtı SADECE aşağıdaki JSON formatında döndür, ekstra hiçbir açıklama veya markdown bloğu yazma:
    {
      "general": "Bugünün detaylı genel astrolojik enerjisi, gezegen konumları ve yapılması gereken günlük işler (maksimum 4 cümle)",
      "love": "Bugünün aşk ve ilişki enerjileri, Venüs/Mars etkileri, partnerle uyum veya çekim tavsiyeleri (maksimum 3 cümle)",
      "career": "Kariyer, bereket, bolluk kapıları, finansal durumlar ve iş hayatındaki fırsatlar (maksimum 3 cümle)",
      "shadowSelf": "Bugünün Ay evresine (yeni ay, dolunay vb.) uygun yapılacak ev/beden ritüeli (adaçayı, niyet vb.) ve günün enerjisine özel 1 adet Esma-ül Hüsna (zikir adı ve geleneksel ebced zikir adedi ile birlikte) (maksimum 3 cümle)"
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
    Sen analitik psikoloji (Carl Jung) ve psikolojik astroloji konusunda uzmanlaşmış derinlikli bir astrologsun.
    Kullanıcı Adı: "${name}"
    Doğum Haritası Konumları:
    - Natal Mars: ${mars.sign} burcunda, ${mars.house}. evde
    - Natal Satürn: ${saturn.sign} burcunda, ${saturn.house}. evde
    Mevcut Transit Gökyüzü:
    - Transit Ay: ${moonSign} burcunda
    - Ay Fazı: ${moonPhase === 'waxing' ? 'Büyüyen Ay' : 'Küçülen Ay'}
    
    Lütfen transit Ay'ın natal Mars ve Satürn üzerindeki etkisine dayanarak, kullanıcının bugün yaşayabileceği psikolojik tetiklenmeleri, ego savunma mekanizmalarını veya yansıttığı gölge (shadow) yönlerini tahlil et. 
    Analizinde Jungiyen terminoloji (örn. gölge entegrasyonu, bastırılmış öfke, projeksiyon, içsel dirençler) kullanarak, farkındalık kazandıran ve bu tetiklenmeleri nasıl yönetebileceğine dair pratik bir öneri sunan kısa bir yorum yaz.
    Yorum son derece samimi, derinlikli ve akıcı olsun. Maksimum 3-4 cümle olsun. Türkçe yaz.
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
    Sen profesyonel, bilge ve son derece bilgili geleneksel ve modern psikolojik bir astrologsun.
    Kullanıcının Adı: "${name}"
    Doğum Haritası Gezegen Konumları ve Evleri:
    ${JSON.stringify(birthChart.planets)}
    Haritadaki Gezegenler Arası Açı İlişkileri:
    ${JSON.stringify(aspects)}
    
    Lütfen kullanıcı için 5 ayrı paragraftan oluşan kapsamlı bir Doğum Haritası Analizi yaz. Her paragraf şu başlıkları derinlemesine tahlil etmelidir:
    1. **Genel Mizaç ve Yaşam Yolu:** Yükselen ve Güneş yerleşimlerine göre temel karakter yapısı ve hayattaki nihai amacı.
    2. **Zihinsel Yapı ve İletişim:** Merkür konumuna göre zekası, karar verme mekanizması ve kendini ifade etme stili.
    3. **Aşk, Değerler ve Bolluk:** Venüs yerleşimine göre ikili ilişkilerdeki beklentileri, sevgi dili ve finansal bereket potansiyeli.
    4. **Mücadele Gücü ve Eylem:** Mars konumuna göre motivasyon kaynakları, engellerle nasıl başa çıktığı ve irade gücü.
    5. **Kader Haritasındaki Açılar ve Sınavlar (Satürn):** Satürn yerleşimine ve gezegenler arasındaki majör açılara (kavuşum, kare, karşıt vb.) göre hayatındaki karmik zorluklar, aşması gereken engeller ve manevi olgunlaşma yolları.
    
    Analizin son derece kişiselleştirilmiş, akıcı, merak uyandırıcı ve edebi bir dilde olsun. Klişe burç yorumlarının ötesine geçip derinlemesine bir hayat rehberi sun. Türkçe yaz.
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

