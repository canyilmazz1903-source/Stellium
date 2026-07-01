import { getJulianDaysSinceJ2000, getPlanetLongitude, getZodiacSign } from './astronomy';

export interface AlmanacAdvice {
  beauty: string;
  health: string;
  auraColors: string[];
}

export function getLunarAlmanacAdvice(
  moonLongitude: number,
  sunLongitude: number,
  moonSignTurkish: string
): AlmanacAdvice {
  // 1. Calculate Moon Phase and Elongation
  let elongation = moonLongitude - sunLongitude;
  if (elongation < 0) elongation += 360;

  const phase: 'waxing' | 'waning' = (elongation >= 0 && elongation < 180) ? 'waxing' : 'waning';
  const isFullMoon = Math.abs(elongation - 180) <= 10;
  const isNewMoon = elongation <= 10 || elongation >= 350;

  // Water signs: Yengeç, Akrep, Balık
  const isWaterSign = ['Yengeç', 'Akrep', 'Balık'].includes(moonSignTurkish);
  const isEarthSign = ['Boğa', 'Başak', 'Oğlak'].includes(moonSignTurkish);
  const isFireSign = ['Koç', 'Aslan', 'Yay'].includes(moonSignTurkish);
  const isAirSign = ['İkizler', 'Terazi', 'Kova'].includes(moonSignTurkish);

  // 2. Determine Saç & Güzellik (Beauty) advice
  let beauty = '';
  if (phase === 'waxing') {
    if (moonSignTurkish === 'Aslan' || moonSignTurkish === 'Başak') {
      beauty = 'Ay Aslan/Başak burcunda ve büyüyen fazda. Saç kesimi ve bakımı için en ideal dönemdir; saç köklerini güçlendirir ve daha hızlı uzamasını sağlar.';
    } else if (moonSignTurkish === 'Boğa' || moonSignTurkish === 'Terazi') {
      beauty = 'Ay Boğa/Terazi burcunda ve büyüyen fazda. Cilt bakımı, besleyici maskeler ve estetik dokunuşlar için mükemmel bir zamanlama. Nem dengesini korumaya odaklanın.';
    } else {
      beauty = 'Büyüyen Ay fazı, cildin ve saçın besleyici maddeleri en hızlı emdiği dönemdir. Vitamin maskeleri ve doğal yağ terapileri uygulamak için harika bir gündesiniz.';
    }
  } else {
    // waning phase
    if (moonSignTurkish === 'Akrep' || moonSignTurkish === 'Oğlak') {
      beauty = 'Ay küçülen fazda ve Akrep/Oğlak burcunda. İstenmeyen tüylerden kurtulmak (epilasyon) ve derin gözenek peelingi için en verimli gündesiniz. Etkisi daha kalıcı olacaktır.';
    } else {
      beauty = 'Küçülen Ay arınma ve temizlik enerjisi taşır. Cilt temizliği, ölü hücrelerden arınma ve tırnak bakımı (manikür/pedikür) için son derece uygundur.';
    }
  }

  // 3. Determine Sağlık & Detoks (Health) advice
  let health = '';
  if (isFullMoon) {
    health = 'Bugün Dolunay enerjisi var. Beden su tutmaya ve ödem yapmaya oldukça meyillidir. Tuz tüketimini minimuma indirin ve sıvı tüketimini artırın.';
  } else if (isNewMoon) {
    health = 'Bugün Yeni Ay enerjisi hakim. Bedensel ve zihinsel detoks için en güçlü gündesiniz. Hafif sebze yemekleri veya sıvı diyetiyle sindirim sisteminizi dinlendirin.';
  } else if (isWaterSign) {
    health = 'Ay Su elementinde seyrediyor. Böbrekleri yormayacak bitki çayları (özellikle rezene veya mısır püskülü) tüketin; vücuttan ödem atmak ve sıvı detoksu yapmak için ideal enerji.';
  } else if (phase === 'waxing') {
    health = 'Büyüyen Ay fazında beden besinleri daha hızlı depolar. Ağır ve şekerli gıdalar yerine mineral ve vitamin yönünden zengin, taze sebze ve meyveler tüketmeye çalışın.';
  } else {
    // waning
    health = 'Küçülen Ay fazında beden terleme ve boşaltım yoluyla toksinleri çok daha rahat atar. Sauna, bitki çayları ve hafif kardiyo egzersizleri ile bedensel arınmayı destekleyin.';
  }

  // 4. Determine Aura Gradient colors based on element
  let auraColors: string[] = [];
  if (isFireSign) {
    // Lavender to Rose / Soft Pink Aura
    auraColors = ['#D8B4F8', '#FBC7D4'];
  } else if (isEarthSign) {
    // Sage Green to Cream
    auraColors = ['#C1E1C1', '#F5F5DC'];
  } else if (isAirSign) {
    // Soft Sky Blue to Lilac
    auraColors = ['#B2F7EF', '#EFF7F6'];
  } else {
    // Water sign: Deep Lilac to Peach
    auraColors = ['#E8D3FF', '#FFE5B4'];
  }

  return { beauty, health, auraColors };
}

export interface CosmicCareRating {
  stars: number;
  label: string;
  advice: string;
}

export interface CosmicCareRatings {
  haircut: CosmicCareRating;
  epilation: CosmicCareRating;
  skincare: CosmicCareRating;
  detox: CosmicCareRating;
}

export function calculateCosmicCare(
  moonLongitude: number,
  sunLongitude: number,
  moonSignTurkish: string
): CosmicCareRatings {
  let elongation = moonLongitude - sunLongitude;
  if (elongation < 0) elongation += 360;
  const phase: 'waxing' | 'waning' = (elongation >= 0 && elongation < 180) ? 'waxing' : 'waning';
  
  const isWaterSign = ['Yengeç', 'Akrep', 'Balık'].includes(moonSignTurkish);
  const isEarthSign = ['Boğa', 'Başak', 'Oğlak'].includes(moonSignTurkish);

  // 1. Haircut
  let haircutStars = 3;
  let haircutLabel = 'Orta';
  let haircutAdvice = 'Rutin saç kesimleri yapılabilir. Saçın yapısında belirgin bir değişim olmaz.';
  if (isWaterSign) {
    haircutStars = 1;
    haircutLabel = 'Kaçının';
    haircutAdvice = `Ay ${moonSignTurkish} (Su) burcundayken saç kesimi tavsiye edilmez, saçlar formunu kaybedebilir.`;
  } else if (phase === 'waxing') {
    if (moonSignTurkish === 'Aslan' || moonSignTurkish === 'Başak') {
      haircutStars = 5;
      haircutLabel = 'Mükemmel';
      haircutAdvice = `Ay ${moonSignTurkish} burcunda ve Büyüyen fazda! Saç kesimi için en ideal gündesiniz. Saçı gürleştirir ve hızlı uzatır.`;
    } else {
      haircutStars = 4;
      haircutLabel = 'Çok İyi';
      haircutAdvice = 'Büyüyen Ay fazında yapılan saç kesimleri saçların daha hızlı ve canlı uzamasını sağlar.';
    }
  } else {
    // waning phase
    if (moonSignTurkish === 'Aslan' || moonSignTurkish === 'Başak') {
      haircutStars = 4;
      haircutLabel = 'İyi';
      haircutAdvice = `Ay ${moonSignTurkish} burcunda küçülüyor. Saç kesimi için uygundur; saçları kalınlaştırır ve saç köklerini güçlendirir.`;
    } else {
      haircutStars = 3;
      haircutLabel = 'Orta';
      haircutAdvice = 'Küçülen Ay fazında saçlar daha yavaş uzar. Saç şeklini korumak ve uçları temizlemek için uygundur.';
    }
  }

  // 2. Epilation
  let epilationStars = 2;
  let epilationLabel = 'Uygun Değil';
  let epilationAdvice = 'Büyüyen Ay fazında kıl kökleri beslendiği için tüy alımı yapılması önerilmez, çabuk uzayabilir.';
  if (phase === 'waning') {
    if (moonSignTurkish === 'Oğlak' || moonSignTurkish === 'Başak') {
      epilationStars = 5;
      epilationLabel = 'Mükemmel';
      epilationAdvice = `Ay ${moonSignTurkish} burcunda küçülüyor. Epilasyon için en etkili zaman! Tüyler çok daha geç çıkar ve kökler zayıflar.`;
    } else if (isWaterSign) {
      epilationStars = 3;
      epilationLabel = 'Orta';
      epilationAdvice = 'Küçülen Ay fazında tüy alımı yapılabilir ancak su burçlarında etki maksimum değildir.';
    } else {
      epilationStars = 4;
      epilationLabel = 'Çok İyi';
      epilationAdvice = 'Küçülen Ay fazındasınız. Kökten alınan epilasyon ve ağda işlemlerinin etkisi uzun sürecektir.';
    }
  } else {
    // waxing phase
    if (moonSignTurkish === 'Oğlak' || moonSignTurkish === 'Başak') {
      epilationStars = 3;
      epilationLabel = 'Orta';
      epilationAdvice = 'Büyüyen faz olmasına rağmen Oğlak/Başak burçlarının kök kurutucu etkisi nedeniyle tüy alımı yapılabilir.';
    }
  }

  // 3. Skincare
  let skincareStars = 3;
  let skincareLabel = 'Orta';
  let skincareAdvice = 'Cildin genel temizliği ve günlük nemlendirici bakımı yapılabilir.';
  if (phase === 'waxing') {
    if (moonSignTurkish === 'Boğa' || moonSignTurkish === 'Terazi') {
      skincareStars = 5;
      skincareLabel = 'Mükemmel';
      skincareAdvice = `Ay ${moonSignTurkish} (Venüs) burcunda ve Büyüyor. Cilde nem veren besleyici maskeler, serumlar ve bakımlar için en iyi zaman.`;
    } else {
      skincareStars = 4;
      skincareLabel = 'Çok İyi';
      skincareAdvice = 'Büyüyen Ay fazında cilt emilimi yüksektir. Nem maskeleri ve vitamin bakımları çok faydalı olur.';
    }
  } else {
    // waning phase
    if (moonSignTurkish === 'Başak' || moonSignTurkish === 'Oğlak' || moonSignTurkish === 'Boğa') {
      skincareStars = 5;
      skincareLabel = 'Mükemmel';
      skincareAdvice = `Ay ${moonSignTurkish} burcunda küçülüyor. Sivilce temizliği, derin gözenek peelingi ve arındırma maskeleri için en iyi gün.`;
    } else {
      skincareStars = 4;
      skincareLabel = 'Çok İyi';
      skincareAdvice = 'Küçülen Ay fazı arınma enerjisidir. Ciltteki ölü hücreleri temizlemek ve peeling yapmak için idealdir.';
    }
  }

  // 4. Detox
  let detoxStars = 3;
  let detoxLabel = 'Orta';
  let detoxAdvice = 'Sindirim sistemini yormayacak hafif gıdalarla beslenmek yararlıdır.';
  
  const isFullMoon = Math.abs(elongation - 180) <= 12;
  const isNewMoon = elongation <= 12 || elongation >= 348;

  if (isNewMoon) {
    detoxStars = 5;
    detoxLabel = 'Mükemmel';
    detoxAdvice = 'Yeni Ay enerjisiyle bedeni sıfırlama zamanı! Kısa süreli sıvı detoksu veya hafif sebze diyetiyle toksin atımı mükemmel çalışır.';
  } else if (isFullMoon) {
    detoxStars = 5;
    detoxLabel = 'Mükemmel';
    detoxAdvice = 'Dolunay enerjisi! Vücut su tutmaya eğilimlidir. Ödem atmak için tuzdan uzak durun, bol su ve sıvı ağırlıklı beslenin.';
  } else if (phase === 'waning') {
    if (moonSignTurkish === 'Başak' || moonSignTurkish === 'Akrep') {
      detoxStars = 5;
      detoxLabel = 'Mükemmel';
      detoxAdvice = `Ay ${moonSignTurkish} burcunda ve Küçülüyor. Vücuttan ödem atma, sauna, ter atma ve detoks çayları için en iyi zaman.`;
    } else {
      detoxStars = 4;
      detoxLabel = 'Çok İyi';
      detoxAdvice = 'Küçülen Ay fazında beden toksinleri ve ödemi kolayca dışarı atar. Arınma kürleri ve diyetler hızla sonuç verir.';
    }
  } else {
    // waxing
    if (moonSignTurkish === 'Başak' || moonSignTurkish === 'Akrep') {
      detoxStars = 4;
      detoxLabel = 'Çok İyi';
      detoxAdvice = 'Büyüyen faz olmasına rağmen Başak/Akrep burçlarının arındırıcı etkisiyle detoks çayları içilebilir.';
    }
  }

  return {
    haircut: { stars: haircutStars, label: haircutLabel, advice: haircutAdvice },
    epilation: { stars: epilationStars, label: epilationLabel, advice: epilationAdvice },
    skincare: { stars: skincareStars, label: skincareLabel, advice: skincareAdvice },
    detox: { stars: detoxStars, label: detoxLabel, advice: detoxAdvice },
  };
}

export interface CosmicCareProjectionWindow {
  formattedRange: string;
  stars: number;
  label: string;
}

export interface CosmicCareProjection {
  haircut: CosmicCareProjectionWindow[];
  epilation: CosmicCareProjectionWindow[];
  skincare: CosmicCareProjectionWindow[];
  detox: CosmicCareProjectionWindow[];
}

export function getCosmicCareProjections(): CosmicCareProjection {
  const today = new Date();
  
  const dailyRatings: {
    haircut: { date: Date; stars: number; label: string }[];
    epilation: { date: Date; stars: number; label: string }[];
    skincare: { date: Date; stars: number; label: string }[];
    detox: { date: Date; stars: number; label: string }[];
  } = {
    haircut: [],
    epilation: [],
    skincare: [],
    detox: []
  };

  // Calculate ratings for the next 30 days
  for (let i = 0; i < 30; i++) {
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + i);
    futureDate.setHours(12, 0, 0, 0); // avoid dst boundary errors

    const jd = getJulianDaysSinceJ2000(futureDate);
    const sunLon = getPlanetLongitude('Sun', jd);
    const moonLon = getPlanetLongitude('Moon', jd);
    const moonSignInfo = getZodiacSign(moonLon);
    const moonSignTurkish = moonSignInfo.turkish;

    const care = calculateCosmicCare(moonLon, sunLon, moonSignTurkish);

    dailyRatings.haircut.push({ date: futureDate, stars: care.haircut.stars, label: care.haircut.label });
    dailyRatings.epilation.push({ date: futureDate, stars: care.epilation.stars, label: care.epilation.label });
    dailyRatings.skincare.push({ date: futureDate, stars: care.skincare.stars, label: care.skincare.label });
    dailyRatings.detox.push({ date: futureDate, stars: care.detox.stars, label: care.detox.label });
  }

  const formatTurkishDate = (date: Date): string => {
    const day = date.getDate();
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  };

  const groupWindows = (days: { date: Date; stars: number; label: string }[]): CosmicCareProjectionWindow[] => {
    const windows: CosmicCareProjectionWindow[] = [];
    const idealDays = days.filter(d => d.stars >= 4);

    let currentWindow: { start: Date; end: Date; maxStars: number; label: string } | null = null;

    for (const day of idealDays) {
      if (!currentWindow) {
        currentWindow = { start: day.date, end: day.date, maxStars: day.stars, label: day.label };
      } else {
        const diffTime = Math.abs(day.date.getTime() - currentWindow.end.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          currentWindow.end = day.date;
          if (day.stars > currentWindow.maxStars) {
            currentWindow.maxStars = day.stars;
            currentWindow.label = day.label;
          }
        } else {
          windows.push({
            formattedRange: currentWindow.start.getTime() === currentWindow.end.getTime()
              ? formatTurkishDate(currentWindow.start)
              : `${formatTurkishDate(currentWindow.start)} - ${formatTurkishDate(currentWindow.end)}`,
            stars: currentWindow.maxStars,
            label: currentWindow.label
          });
          currentWindow = { start: day.date, end: day.date, maxStars: day.stars, label: day.label };
        }
      }
    }

    if (currentWindow) {
      windows.push({
        formattedRange: currentWindow.start.getTime() === currentWindow.end.getTime()
          ? formatTurkishDate(currentWindow.start)
          : `${formatTurkishDate(currentWindow.start)} - ${formatTurkishDate(currentWindow.end)}`,
        stars: currentWindow.maxStars,
        label: currentWindow.label
      });
    }

    return windows;
  };

  return {
    haircut: groupWindows(dailyRatings.haircut),
    epilation: groupWindows(dailyRatings.epilation),
    skincare: groupWindows(dailyRatings.skincare),
    detox: groupWindows(dailyRatings.detox)
  };
}
