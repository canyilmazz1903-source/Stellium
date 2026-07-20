// Menazil-i Kamer — the 28 Lunar Mansions of the classical Islamic/Turkish
// star-lore tradition. Original Turkish summaries written for this app from
// the classical literature's common themes (no quotations, no copyright risk).
//
// nature: 'sad' (auspicious) | 'nahs' (inauspicious) | 'mumtezic' (mixed)

export interface MenzilInfo {
  index: number;        // 1-28
  name: string;         // traditional name
  arabicName: string;
  nature: 'sad' | 'nahs' | 'mumtezic';
  natureTR: string;
  theme: string;        // one-line essence
  goodFor: string[];
  avoidFor: string[];
}

export const MENAZIL: MenzilInfo[] = [
  { index: 1, name: 'Şeratan', arabicName: 'الشرطان', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Başlangıç kıvılcımı ve öncülük enerjisi', goodFor: ['yolculuğa çıkmak', 'yeni işe başlamak', 'ilaç/tedaviye başlamak'], avoidFor: ['evlilik akdi', 'ortaklık kurmak'] },
  { index: 2, name: 'Butayn', arabicName: 'البطين', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Gizli hazineler ve iç zenginlik', goodFor: ['define/keşif işleri', 'nişan', 'inşaata başlamak'], avoidFor: ['deniz yolculuğu'] },
  { index: 3, name: 'Süreyya', arabicName: 'الثريا', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Bolluk, bereket ve topluluk şansı', goodFor: ['ticaret', 'seyahat', 'av/kazanç işleri', 'ilim meclisi'], avoidFor: ['su işleri', 'nikâh'] },
  { index: 4, name: 'Deberan', arabicName: 'الدبران', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Takip eden göz — hırs ve sınama', goodFor: ['düşmana karşı tedbir', 'sağlamlaştırma işleri'], avoidFor: ['evlilik', 'yeni başlangıç', 'ortaklık'] },
  { index: 5, name: "Hek'a", arabicName: 'الهقعة', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Kapı eşiği — geçiş ve karar anı', goodFor: ['öğrenime başlamak', 'kısa yolculuk'], avoidFor: ['büyük yatırım'] },
  { index: 6, name: "Hen'a", arabicName: 'الهنعة', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Uyum damgası ve yumuşama', goodFor: ['barışma', 'ilaç kullanımı', 'ev işlerine başlamak'], avoidFor: ['dava açmak'] },
  { index: 7, name: 'Zira', arabicName: 'الذراع', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Uzanan kol — talep ve kazanım', goodFor: ['istek/talep sunmak', 'ticaret', 'nişan-nikâh'], avoidFor: [] },
  { index: 8, name: 'Nesre', arabicName: 'النثرة', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Dağılma ve savrulma riski', goodFor: ['temizlik/arınma', 'zararlıdan kurtulma'], avoidFor: ['sözleşme', 'evlilik', 'yolculuk'] },
  { index: 9, name: 'Tarf', arabicName: 'الطرف', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Aslanın bakışı — sınayıcı dikkat', goodFor: ['iç muhasebe', 'gizli işlerin tamamlanması'], avoidFor: ['yeni girişim', 'ekim-dikim'] },
  { index: 10, name: 'Cebhe', arabicName: 'الجبهة', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Alnın açıklığı — itibar ve görünürlük', goodFor: ['makam işleri', 'evlilik', 'yüksek makama başvuru'], avoidFor: [] },
  { index: 11, name: 'Zübre', arabicName: 'الزبرة', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Aslanın yelesi — cesaret ve güç', goodFor: ['cesaret isteyen adımlar', 'giyim/kuşam', 'takı alımı'], avoidFor: ['su yolculuğu'] },
  { index: 12, name: 'Sarfe', arabicName: 'الصرفة', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Dönüm noktası — havanın değişimi', goodFor: ['bitirme/kapanış işleri', 'taşınma hazırlığı'], avoidFor: ['borç vermek'] },
  { index: 13, name: 'Avva', arabicName: 'العواء', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Bereketli uluma — kazançlı dönüş', goodFor: ['ekim-dikim', 'ticaret', 'yolculuk', 'nikâh'], avoidFor: [] },
  { index: 14, name: 'Simak', arabicName: 'السماك', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Yükseklerin yalnız yıldızı', goodFor: ['ilaç/tedavi', 'temele taş koymak'], avoidFor: ['evlilik', 'yolculuk'] },
  { index: 15, name: 'Gafr', arabicName: 'الغفر', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Örtme ve bağışlanma — yumuşak kapı', goodFor: ['helalleşme', 'nikâh', 'kuyu/su işleri'], avoidFor: ['silahlı işler'] },
  { index: 16, name: 'Zübana', arabicName: 'الزبانى', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Akrebin kıskacı — gerilim', goodFor: ['zararlıyla mücadele', 'cerrahi olmayan tedbir'], avoidFor: ['evlilik', 'ortaklık', 'yolculuk'] },
  { index: 17, name: 'İklil', arabicName: 'الإكليل', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Taç — bağlanma ve taahhüt', goodFor: ['bağlılık yenileme', 'koruma tedbirleri'], avoidFor: ['yeni ticaret'] },
  { index: 18, name: 'Kalb', arabicName: 'القلب', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Akrebin kalbi — yoğun duygu sınavı', goodFor: ['iç dönüşüm', 'bırakma çalışması'], avoidFor: ['evlilik', 'imza', 'borçlanma'] },
  { index: 19, name: 'Şevle', arabicName: 'الشولة', nature: 'nahs', natureTR: 'Nahs (dikkat)', theme: 'Akrebin iğnesi — keskin uç', goodFor: ['kararlı kesip atmalar'], avoidFor: ['ekim', 'evlilik', 'yolculuk'] },
  { index: 20, name: 'Neaim', arabicName: 'النعائم', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Su içen devekuşları — akış ve rızık', goodFor: ['ticaret', 'hayvan alımı', 'yolculuk'], avoidFor: [] },
  { index: 21, name: 'Belde', arabicName: 'البلدة', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Boş meydan — dinlenme ve alan', goodFor: ['dinlenme', 'planlama', 'inşaat başlangıcı'], avoidFor: ['evlilik', 'ödünç verme'] },
  { index: 22, name: "Sa'd-ı Zabih", arabicName: 'سعد الذابح', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Kurban eden — fedakârlıkla açılan yol', goodFor: ['tedavi', 'zor işi bitirmek'], avoidFor: ['ortaklık'] },
  { index: 23, name: "Sa'd-ı Bul'", arabicName: 'سعد بلع', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Yutan yıldız — hazım ve içselleştirme', goodFor: ['ilaç', 'borç kapatmak'], avoidFor: ['yeni borçlanma'] },
  { index: 24, name: "Sa'd-ı Suud", arabicName: 'سعد السعود', nature: 'sad', natureTR: "Sa'd (en uğurlu)", theme: 'Uğurların uğuru — yükseliş kapısı', goodFor: ['her hayırlı başlangıç', 'evlilik', 'ticaret', 'yolculuk'], avoidFor: [] },
  { index: 25, name: "Sa'd-ı Ahbiye", arabicName: 'سعد الأخبية', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Çadırların sırrı — korunan alan', goodFor: ['gizli/mahrem işler', 'koruma ritüelleri'], avoidFor: ['açık ilan/pazarlama'] },
  { index: 26, name: 'Fer-i Mukaddem', arabicName: 'الفرغ المقدم', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Ön kova — hazırlık bereketi', goodFor: ['evlilik hazırlığı', 'inşaat', 'ekim'], avoidFor: ['deniz yolculuğu'] },
  { index: 27, name: 'Fer-i Muahhar', arabicName: 'الفرغ المؤخر', nature: 'mumtezic', natureTR: 'Mümtezic (karışık)', theme: 'Arka kova — tamamlanan hazırlık', goodFor: ['ev işleri', 'birikim başlatmak'], avoidFor: ['dava'] },
  { index: 28, name: 'Reşa', arabicName: 'الرشاء', nature: 'sad', natureTR: "Sa'd (uğurlu)", theme: 'Kuyu ipi — derinden çekilen kısmet', goodFor: ['yolculuk', 'kayıp arama', 'ticaret', 'nikâh'], avoidFor: ['borç verme'] },
];
