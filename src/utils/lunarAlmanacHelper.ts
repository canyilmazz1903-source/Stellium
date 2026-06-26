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
