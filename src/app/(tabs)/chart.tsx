import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppStore } from '@/store/appStore';
import GlassCard from '@/components/glass/GlassCard';
import { getZodiacSign } from '@/utils/astronomy';

const BIG_THREE_INTERPRETATIONS: Record<string, {
  sun: { archetype: string; ego: string; advice: string };
  moon: { archetype: string; shadow: string; advice: string };
  asc: { archetype: string; persona: string; advice: string };
}> = {
  'Koç': {
    sun: {
      archetype: 'Savaşçı (The Warrior)',
      ego: 'Güneş Koç burcundayken ego, bağımsızlık, cesaret ve öncülük vasıtasıyla kendini var eder. Bireyleşme yolculuğunuz, inisiyatif almayı ve engeller karşısında kendi özgün kimliğinizi korkusuzca savunmayı öğrenmeyi gerektirir. Kendinizi doğrudan eyleme geçerek ve risk alarak gerçekleştirirsiniz.',
      advice: 'Gelişiminiz için sabırsızlığınızı ve dürtüselliğinizi dengelemeli, başkalarının sınırlarına saygı duymayı öğrenmelisiniz. Enerjinizi yıkıcı bir öfke yerine, yaratıcı bir liderliğe dönüştürün.'
    },
    moon: {
      archetype: 'Ateşli Ruh (The Fiery Soul)',
      shadow: 'Ay Koç\'tayken duygusal dünyanız son derece hareketli, sabırsız ve tutkuludur. Bilinçdışınızda, kısıtlanma korkusu ve sürekli bir savunma mekanizması yatar. Duygularınızı anında ve filtresizce dışa vurma eğilimindesinizdir. İçsel çocuk hızlıca parlayıp sönebilir.',
      advice: 'Duygusal tepkilerinizle aranıza kısa bir mesafe koymayı öğrenin. Anlık öfke patlamalarının arkasındaki incinme korkusunu (gölgenizi) kabul edin.'
    },
    asc: {
      archetype: 'Öncü (The Pioneer)',
      persona: 'Yükselen Koç olarak dünyaya sunduğunuz maske (Persona) cesur, enerjik, dinamik ve doğrudan bir karakterdir. İnsanlar sizi kararlı, mücadeleci ve harekete geçmeye hazır biri olarak görür. Hayata karşı duruşunuz rekabetçidir.',
      advice: 'Persona\'nızın aşırı hırçın veya bencil görünmesini engellemek için diyalogda diplomasiye ve yumuşaklığa yer açın.'
    }
  },
  'Boğa': {
    sun: {
      archetype: 'Yaratıcı Muhafız (The Builder/Preserver)',
      ego: 'Güneş Boğa\'dayken ego, maddi-manevi istikrar, güzellik, köklenme ve üretkenlik arayışındadır. Bireyleşme yolculuğunuz, hayatta kalıcı değerler yaratmayı ve doğayla, duyularla uyum içinde yaşamayı öğrenmektir. Kararlılık ve güvenilirlik en güçlü yönlerinizdir.',
      advice: 'Değişime karşı gösterdiğiniz aşırı direnci (inatçılık) esnetin. Güvenlik ihtiyacınızın sizi konfor alanınıza hapsetmesine izin vermeyin.'
    },
    moon: {
      archetype: 'Huzur Arayan (The Inner Sanctuary)',
      shadow: 'Ay Boğa\'da yücelir; bu da duygusal dünyanızın oldukça dengeli, sakin ve bedensel konfora düşkün olduğunu gösterir. Bilinçdışınızda ani değişimlerden ve maddi kayıplardan duyulan derin bir endişe yatar. Duygusal gıdayı doğada ve dokunmada bulursunuz.',
      advice: 'Maddi varlıklara ve insanlara bağımlılık geliştirmek yerine, kendi içinizdeki manevi değer duygusunu büyütün.'
    },
    asc: {
      archetype: 'Güven Limanı (The Solid Presence)',
      persona: 'Yükselen Boğa olarak dış dünyaya yansıttığınız imaj sabırlı, sakin, estetik açıdan özenli ve sarsılmaz bir duruştur. İnsanlar sizin yanınızda huzur bulur ve pratik zekanıza güvenir. Doğallık ve zarafet maskenizin bir parçasıdır.',
      advice: 'Zaman zaman aşırı uyuşuk veya duyarsız görünme eğilimlerinizi kırmak için yeniliklere kapınızı aralayın.'
    }
  },
  'İkizler': {
    sun: {
      archetype: 'Haberci/Meraklı (The Messenger)',
      ego: 'Güneş İkizler\'deyken ego, bilgi toplama, iletişim, entelektüel merak ve adaptasyon yoluyla parlar. Bireyleşme yolculuğunuz, zıtlıklar arasındaki köprüleri kurmayı, bilgiyi yaymayı ve zihinsel esnekliği öğrenmektir. Kelimeler en büyük gücünüzdür.',
      advice: 'Zihinsel yüzeysellikten ve odak dağınıklığından kaçınmak için derinleşmeye önem verin. Aynı anda çok fazla şey yapmak yerine enerjinizi odaklayın.'
    },
    moon: {
      archetype: 'Rasyonel Zihin (The Thinking Heart)',
      shadow: 'Ay İkizler\'deyken duyguları rasyonalize etme ve entelektüel analiz süzgecinden geçirme eğiliminiz vardır. Bilinçdışı düzeyde, duyguların derin sularında boğulma korkusu yaşarsınız. Bu yüzden hislerinizi konuşarak hafifletmeye çalışırsınız.',
      advice: 'Duygularınızı sadece düşünmeyin, onları bedeninizde hissetmeye izin verin. Kalbinizin mantık aramayan sesine kulak verin.'
    },
    asc: {
      archetype: 'Sosyal Kelebek (The Spark of Wit)',
      persona: 'Dış dünyaya sunduğunuz maske meraklı, konuşkan, sempatik ve sürekli öğrenmeye açık bir profildir. İnsanlar sizi esprili, hızlı düşünen ve sosyal ilişkileri kolayca başlatan biri olarak algılar.',
      advice: 'Persona\'nızın samimiyetsiz veya tutarsız olarak algılanmaması için verdiğiniz sözleri tutmaya ve derin bağlar kurmaya özen gösterin.'
    }
  },
  'Yengeç': {
    sun: {
      archetype: 'Besleyici/Koruyucu (The Nurturer)',
      ego: 'Güneş Yengeç\'teyken ego, koruma, şefkat, aile bağları ve duygusal derinlik üzerinden kendini ifade eder. Bireyleşme yolculuğunuz, kendi hassasiyetinizi kabul edip onu bir zayıflık değil, şifa ve empati gücü olarak dünyaya sunmaktır.',
      advice: 'Geçmişe ve nostaljiye aşırı tutunarak şimdiki anı kaçırmaktan kaçının. Başkalarını korumaya çalışırken kendi sınırlarınızı feda etmeyin.'
    },
    moon: {
      archetype: 'Duygusal Okyanus (The Empathetic Well)',
      shadow: 'Ay kendi yönettiği Yengeç burcunda çok güçlüdür. Muazzam bir sezgisel güç, empati kabiliyeti ve yoğun duygusal dalgalanmalar verir. Bilinçdışınızda reddedilme ve korunmasız kalma korkusu yatar; bu yüzden sık sık kabuğunuza çekilirsiniz.',
      advice: 'Duygusal savunma kalkanlarınızı (aşırı alınganlık) aşarak, kırılganlığınızı yapıcı bir şekilde ifade etmeyi deneyin.'
    },
    asc: {
      archetype: 'Şefkatli Rehber (The Warm Host)',
      persona: 'Yükselen Yengeç olarak dış dünyaya gösterdiğiniz maske son derece duyarlı, koruyucu, sıcakkanlı ve sezgiseldir. İnsanlar size içini açmakta zorlanmaz. Çevrenizde anaç/babaç bir koruma çemberi oluşturursunuz.',
      advice: 'Dış dünyaya karşı aşırı savunmacı veya mesafeli (sert kabuklu) görünmemek için içsel güveninizi geliştirin.'
    }
  },
  'Aslan': {
    sun: {
      archetype: 'Hükümdar/Kahraman (The Sovereign)',
      ego: 'Güneş Aslan\'dayken ego, sahnede olmak, takdir edilmek, cömertlik ve yaratıcı liderlik vasıtasıyla parlar. Bireyleşme yolculuğunuz, kendi içsel krallığınızın hükümdarı olmayı öğrenmek ve ışığınızı başkalarını gölgede bırakmadan cömertçe paylaşmaktır.',
      advice: 'Kibir, egoizm ve sürekli onaylanma ihtiyacından (dışsal motivasyonlar) sıyrılıp içsel öz-değerinizi keşfedin.'
    },
    moon: {
      archetype: 'Gururlu Yürek (The Inner King/Queen)',
      shadow: 'Ay Aslan\'dayken duygusal dünyanız ilgi, sevilme ve özel hissetme arzusuyla doludur. Bilinçdışı düzeyde, görmezden gelinmek veya sıradan bulunmak en büyük gölgenizdir. Duygusal krizlerde dramatize etmeye meyillisinizdir.',
      advice: 'Sıradanlığı kabul etmenin ruhsal olgunluğun bir parçası olduğunu unutmayın. Başkalarının ışığını da takdir ederek egonuzu eğitin.'
    },
    asc: {
      archetype: 'Göz Alıcı Işık (The Creative Performer)',
      persona: 'Yükselen Aslan olarak dünyaya sunduğunuz maske özgüvenli, karizmatik, canlı ve dikkat çekici bir duruştur. İnsanlar sizi girdiniz her ortamda fark eder; liderlik vasıflarınız ve neşeli tavırlarınız ön plandadır.',
      advice: 'Persona\'nızın kibirli görünmemesi için samimi bir alçakgönüllülüğü benimseyin.'
    }
  },
  'Başak': {
    sun: {
      archetype: 'Şifacı/Analist (The Analyst/Alchemist)',
      ego: 'Güneş Başak\'tayken ego, faydalı olmak, düzen yaratmak, analiz ve ustalık vasıtasıyla kendini gerçekleştirir. Bireyleşme yolculuğunuz, kaosun içindeki düzeni bulmak, şifa vermek ve mükemmeliyetçiliği esneterek hayatın doğal kusurlarını kabul etmektir.',
      advice: 'Kendinizi ve çevrenizi aşırı eleştirmekten (hiper-kritik zihin) kaçının. Kusurların da bütünün (Self) bir parçası olduğunu unutmayın.'
    },
    moon: {
      archetype: 'Hassas Düzenleyici (The Structured Soul)',
      shadow: 'Ay Başak\'tayken duygusal huzuru hayatı kontrol altında tutarak, planlayarak ve işe yarayarak bulursunuz. Bilinçdışınızda başarısızlık ve düzensizlik korkusu yatar. Duygularınızı kontrol etmek için onları görevlere bölersiniz.',
      advice: 'Zihinsel endişelerinizin bedensel sağlığınızı (somatizasyon) etkilemesine izin vermeyin. Kontrol edemeyeceğiniz süreçleri serbest bırakmayı öğrenin.'
    },
    asc: {
      archetype: 'Titiz Gözlemci (The Silent Craftsman)',
      persona: 'Yükselen Başak olarak dış dünyaya yansıttığınız imaj temiz, düzenli, mütevazı, kibar ve analitiktir. İnsanlar sizi detaylara önem veren, iş bitirici ve güvenilir biri olarak görür.',
      advice: 'Persona\'nızın aşırı çekingen veya mesafeli durmasını engellemek için duygusal sıcaklığınızı dışarıya daha fazla yansıtın.'
    }
  },
  'Terazi': {
    sun: {
      archetype: 'Dengeleyici/Sanatçı (The Peacemaker)',
      ego: 'Güneş Terazi\'deyken ego, ilişkiler, adalet, estetik uyum ve denge kurma yoluyla parlar. Bireyleşme yolculuğunuz, kendi içsel merkezinizi kaybetmeden başkalarıyla uyumlanmayı başarmak ve hayatta adaleti savunmaktır.',
      advice: 'Çatışmalardan kaçmak adına kendi doğrularınızdan (gölge uyumluluk) ödün vermeyin. Hayır demeyi öğrenmek bireyselleşmenizin en önemli adımıdır.'
    },
    moon: {
      archetype: 'Ahenkli Kalp (The Diplomat)',
      shadow: 'Ay Terazi\'deyken yalnız kalma korkusu ve sürekli onaylanma ihtiyacı bilinçdışı motivasyonlarınızdır. Duygusal huzurunuz dışsal dengelere ve ilişkilerdeki huzura bağlıdır. Çatışma anlarında dengenizi kolayca yitirirsiniz.',
      advice: 'İçsel dengenizin başkalarının onayına bağlı olmadığını kabul edin. Kendi kendinizle kalmanın ve içsel çatışmalarınızın üstüne gitmenin gücünü keşfedin.'
    },
    asc: {
      archetype: 'Zarif Köprü (The Diplomatic Presence)',
      persona: 'Yükselen Terazi olarak dış dünyaya sunduğunuz maske son derece nazik, estetik açıdan dengeli, güler yüzlü ve çekicidir. İnsanlar sizi uyumlu ve uzlaşmacı biri olarak algılar.',
      advice: 'Dış görünüşe ve başkalarının ne düşündüğüne aşırı odaklanıp kendi derin duygularınızı maskelemeyin.'
    }
  },
  'Akrep': {
    sun: {
      archetype: 'Dönüştürücü/Simyacı (The Alchemist)',
      ego: 'Güneş Akrep\'teyken ego, krizler, dönüşüm, derin psikolojik sular ve gizemleri çözme vasıtasıyla kendini var eder. Bireyleşme yolculunuz, kendi karanlığınızla (Shadow) yüzleşip onu yüksek bir manevi güce dönüştürmektir (anka kuşu simgesi).',
      advice: 'Kontrol ve güç arzusunu serbest bırakın. İnsanlara güvenmeyi ve affetmeyi öğrenmek, ruhsal simyanızın anahtarıdır.'
    },
    moon: {
      archetype: 'Derin Kuyu (The Intense Seeker)',
      shadow: 'Ay Akrep\'te düşüştedir; bu da duygusal dünyanızın son derece yoğun, gizemli ve krizlere yatkın olduğunu gösterir. Bilinçdışınızda ihanete uğrama ve kontrolü kaybetme korkusu yatar. Duygularınızı çok derinde saklar, kolay kolay güvenmezsiniz.',
      advice: 'İçinizdeki şüpheciliği ve intikam duygusunu serbest bırakın. Kendi kendinizi sabote etme eğilimlerinizi fark ederek şifalandırın.'
    },
    asc: {
      archetype: 'Mistik Kalkan (The Magnetic Sentinel)',
      persona: 'Yükselen Akrep olarak dış dünyaya gösterdiğiniz maske karizmatik, gizemli, keskin gözlemlere sahip ve korunaklıdır. İnsanlar sizin gizemli havanızdan hem etkilenir hem de temkinli yaklaşır.',
      advice: 'Aşırı savunmacı veya tehditkar bir imaj çizmemek için çevrenize daha şeffaf ve güven verici yaklaşımlar sergileyin.'
    }
  },
  'Yay': {
    sun: {
      archetype: 'Kaşif/Filozof (The Seeker/Philosopher)',
      ego: 'Güneş Yay\'dayken ego, keşif, bilgelik arayışı, inançlar ve özgürlük vasıtasıyla kendini gerçekleştirir. Bireyleşme yolculuğunuz, hayatın yüksek anlamını keşfetmek, farklı kültürleri ve felsefeleri bütünleştirerek zihni genişletmektir.',
      advice: 'Aşırı iyimserliğin getirdiği dogmatizmden ve fanatik fikirlerden (gölge öğretmen) kaçının. Gerçek bilgeliğin sorgulamak olduğunu unutmayın.'
    },
    moon: {
      archetype: 'Gezgin Ruh (The Optimistic Wanderer)',
      shadow: 'Ay Yay\'dayken iç dünyanız iyimser, neşeli ve sınırlara isyan eden bir yapıdadır. Bilinçdışınızda, duygusal sorumluluklardan kaçma ve daralma korkusu yatar. Kriz anlarında uzaklaşmayı veya durumu espriye vurmayı tercih edersiniz.',
      advice: 'Duygusal derinliklerden kaçmak yerine kriz anlarında kalmayı öğrenin. Bazen durmanın ve içe bakmanın da bir keşif olduğunu fark edin.'
    },
    asc: {
      archetype: 'Kozmik Vizyoner (The Friendly Guide)',
      persona: 'Yükselen Yay olarak dış dünyaya sunduğunuz maske coşkulu, neşeli, açık fikirli ve enerjik bir profildir. İnsanlar sizi maceraperest, şanslı ve felsefi sohbetleri seven biri olarak görür.',
      advice: 'Persona\'nızın ciddiyetsiz veya her şeyi bilen biri gibi algılanmamasına dikkat edin.'
    }
  },
  'Oğlak': {
    sun: {
      archetype: 'Yönetici/Mimar (The Builder of Order)',
      ego: 'Güneş Oğlak\'tayken ego, disiplin, sorumluluk, toplumsal inşa ve sabır vasıtasıyla parlar. Bireyleşme yolculuğunuz, dış dünyadaki otoriteyi kurarken içsel otoritenizi ve şefkatinizi de keşfetmek, dayanıklı bir yaşam inşa etmektir.',
      advice: 'Başarı ve statüye aşırı odaklanıp içsel duygu dünyanızı (Anima) kurutmayın. Hayatın sadece görevlerden ibaret olmadığını kabul edin.'
    },
    moon: {
      archetype: 'Sabırlı Kaya (The Stoic Guardian)',
      shadow: 'Ay Oğlak\'ta zarardadır; duyguları bastırma, aşırı sorumluluk üstlenme ve kendine karşı acımasız olma eğilimi verir. Bilinçdışınızda yetersizlik ve muhtaç duruma düşme korkusu yatar. Bu yüzden duygusal olarak mesafeli kalırsınız.',
      advice: 'Zayıf ve muhtaç olmanın insani bir hak olduğunu kabul edin. Kendinize karşı daha yumuşak ve bağışlayıcı olun.'
    },
    asc: {
      archetype: 'Saygın Lider (The Professional)',
      persona: 'Yükselen Oğlak olarak dış dünyaya yansıttığınız imaj ciddi, mesafeli, olgun ve son derece profesyoneldir. İnsanlar sizi güvenilir, saygın ve kontrolü elinde tutan biri olarak görür.',
      advice: 'Persona\'nızın aşırı soğuk ve erişilmez görünmemesi için samimiyetinizi dışarıya aktarmaya çalışın.'
    }
  },
  'Kova': {
    sun: {
      archetype: 'Devrimci/Vizyoner (The Reformer)',
      ego: 'Güneş Kova\'dayken ego, özgünlük, toplumsal vizyon, hümanizm ve bağımsızlık yoluyla parlar. Bireyleşme yolculuğunuz, kolektifin bir parçası olurken kendi benzersiz bireyselliğinizi korumak ve geleceğe yön vermektir.',
      advice: 'Sırf farklı olmak adına marjinalleşmekten (gölge isyancı) kaçının. Zihinsel vizyonlarınızı kalbin sıcaklığıyla buluşturun.'
    },
    moon: {
      archetype: 'Özgür Kuş (The Independent Mind)',
      shadow: 'Ay Kova\'dayken duygusal yakınlıktan ve bağımlılıktan kaçınma eğiliminiz vardır. Bilinçdışı düzeyde, duygusal olarak yutulma ve özgürlüğünü kaybetme korkusu yaşarsınız. Duyguları zihinselleştirip dışarıdan izlersiniz.',
      advice: 'Başkalarıyla derin duygusal bağlar kurmanın özgürlüğünüzü kısıtlamadığını, aksine sizi bütünleştirdiğini fark edin.'
    },
    asc: {
      archetype: 'Sıra Dışı Deha (The Altruistic Rebel)',
      persona: 'Yükselen Kova olarak dünyaya gösterdiğiniz maske orijinal, arkadaş canlısı, entelektüel ve toplumsal konulara duyarlı bir karakterdir. İnsanlar sizi vizyoner ve ön yargısız biri olarak görür.',
      advice: 'Persona\'nızın aşırı marjinal veya duygusuz görünmesini engellemek için birebir ilişkilerde empatiye yer verin.'
    }
  },
  'Balık': {
    sun: {
      archetype: 'Mistik/Hayalperest (The Mystic/Dreamer)',
      ego: 'Güneş Balık\'tayken ego, teslimiyet, evrensel sevgi, sanatsal ilham ve mistik birlik vasıtasıyla kendini gerçekleştirir. Bireyleşme yolculuğunuz, sınırların ötesindeki kolektif bilinçdışı sularında kaybolmadan kendi egonuzu koruyabilmektir.',
      advice: 'Gerçeklerden kaçma ve kurban psikolojisine (gölge kurban) sığınma eğiliminizle yüzleşin. Sınırlar koymayı ve hayatta topraklanmayı öğrenin.'
    },
    moon: {
      archetype: 'Sonsuz Şefkat (The Dreamer\'s Ocean)',
      shadow: 'Ay Balık\'tayken ruhunuz aşırı duyarlı, psişik olarak geçirgen ve aşırı empatiktir. Bilinçdışınızda, dünyanın sert gerçekleriyle yüzleşme korkusu ve evrensel bir acı yatar. Başkalarının enerjilerini sünger gibi çekersiniz.',
      advice: 'Ruhsal sınırlarınızı korumak için koruma çalışmaları yapın. Kendi kendinizi kurban/kurtarıcı rollerine hapsetmeyin.'
    },
    asc: {
      archetype: 'Büyülü Ruh (The Ethereal Seeker)',
      persona: 'Yükselen Balık olarak dış dünyaya sunduğunuz maske son derece kibar, hayalperest, sanatsal, yumuşak ve gizemlidir. İnsanlar sizin yanınızda yargılanmadıklarını hisseder; büyüleyici bir auranız vardır.',
      advice: 'Hayatın pratik detaylarında kaybolmamak için kararlılık ve netlik maskesini de kuşanmayı öğrenin.'
    }
  }
};


const { width } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(width - 40, 340);
const CENTER = CANVAS_SIZE / 2;
const RADIUS = CANVAS_SIZE * 0.45;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const ZODIAC_ABBREVIATIONS = [
  'Koç', 'Boğ', 'İki', 'Yen', 'Asl', 'Baş', 'Ter', 'Akr', 'Yay', 'Oğl', 'Kov', 'Bal'
];

export default function ChartScreen() {
  const { computedChart } = useAppStore();

  const svgContent = useMemo(() => {
    if (!computedChart) return null;

    const { planets, houses, ascendant } = computedChart;

    // Helper: Convert polar coordinates to rectangular coordinates
    // We add 180 degrees to place the Ascendant (0 angle) at the left horizon (9 o'clock position / 180° in standard trig coords)
    const getCoordinates = (angleDegrees: number, radius: number) => {
      const adjustedAngle = angleDegrees - ascendant + 180;
      const angleRad = adjustedAngle * (Math.PI / 180);
      const x = CENTER + radius * Math.cos(angleRad);
      const y = CENTER + radius * Math.sin(angleRad);
      return { x, y };
    };

    // Draw houses lines
    const houseLines = houses.map((houseDegree, idx) => {
      const pInner = getCoordinates(houseDegree, RADIUS * 0.45);
      const pOuter = getCoordinates(houseDegree, RADIUS);
      return (
        <Line
          key={`house-${idx}`}
          x1={pInner.x}
          y1={pInner.y}
          x2={pOuter.x}
          y2={pOuter.y}
          stroke="rgba(214, 175, 55, 0.25)"
          strokeWidth={idx === 0 || idx === 9 ? "2" : "1"} // Highlight ASC (1st) and MC (10th)
        />
      );
    });

    // Draw zodiac segment separation lines (every 30 degrees starting from 0)
    const zodiacLines = [];
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const pInner = getCoordinates(deg, RADIUS * 0.82);
      const pOuter = getCoordinates(deg, RADIUS);
      zodiacLines.push(
        <Line
          key={`zodiac-line-${i}`}
          x1={pInner.x}
          y1={pInner.y}
          x2={pOuter.x}
          y2={pOuter.y}
          stroke="rgba(212, 175, 55, 0.4)"
          strokeWidth="1"
        />
      );
    }

    // Draw zodiac symbols/text in the middle of each segment (every 15 degrees offset)
    const zodiacSymbols = ZODIAC_ABBREVIATIONS.map((symbol, i) => {
      const midDeg = i * 30 + 15;
      const pos = getCoordinates(midDeg, RADIUS * 0.91);
      return (
        <SvgText
          key={`zodiac-symbol-${i}`}
          x={pos.x}
          y={pos.y + 4} // Slight vertical offset to center text
          fill="#D4AF37"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          {symbol}
        </SvgText>
      );
    });

    // Draw planet points
    const planetPoints = planets.map((p, idx) => {
      const symbol = PLANET_SYMBOLS[p.name] || '?';
      // Stagger radius slightly if planets are very close to avoid overlay overlap
      const radOffset = (idx % 2 === 0) ? 0.65 : 0.55;
      const pos = getCoordinates(p.longitude, RADIUS * radOffset);

      return (
        <G key={`planet-${idx}`}>
          <Circle
            cx={pos.x}
            cy={pos.y}
            r="4"
            fill="#D4AF37"
          />
          <SvgText
            x={pos.x}
            y={pos.y - 8}
            fill="#F0F6FC"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            {symbol}
          </SvgText>
        </G>
      );
    });

    return (
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
        {/* Outer boundary circles */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#D4AF37" strokeWidth="1.5" fill="transparent" />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.82} stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1" fill="transparent" />
        
        {/* Inner core circle */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.45} stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1.5" fill="transparent" />

        {/* Division layers */}
        {zodiacLines}
        {houseLines}
        {zodiacSymbols}
        {planetPoints}
      </Svg>
    );
  }, [computedChart]);

  const interpretations = useMemo(() => {
    if (!computedChart) return null;

    const sunPlanet = computedChart.planets.find(p => p.name === 'Sun');
    const moonPlanet = computedChart.planets.find(p => p.name === 'Moon');
    
    const sunSign = sunPlanet ? sunPlanet.sign : 'Koç';
    const moonSign = moonPlanet ? moonPlanet.sign : 'Koç';
    
    // Calculate Ascendant sign name using getZodiacSign
    const ascSignInfo = getZodiacSign(computedChart.ascendant);
    const ascSign = ascSignInfo ? ascSignInfo.turkish : 'Koç';

    return {
      sun: {
        sign: sunSign,
        house: sunPlanet ? sunPlanet.house : 1,
        archetype: BIG_THREE_INTERPRETATIONS[sunSign]?.sun.archetype || 'Belirsiz',
        ego: BIG_THREE_INTERPRETATIONS[sunSign]?.sun.ego || '-',
        advice: BIG_THREE_INTERPRETATIONS[sunSign]?.sun.advice || '-'
      },
      moon: {
        sign: moonSign,
        house: moonPlanet ? moonPlanet.house : 1,
        archetype: BIG_THREE_INTERPRETATIONS[moonSign]?.moon.archetype || 'Belirsiz',
        shadow: BIG_THREE_INTERPRETATIONS[moonSign]?.moon.shadow || '-',
        advice: BIG_THREE_INTERPRETATIONS[moonSign]?.moon.advice || '-'
      },
      asc: {
        sign: ascSign,
        archetype: BIG_THREE_INTERPRETATIONS[ascSign]?.asc.archetype || 'Belirsiz',
        persona: BIG_THREE_INTERPRETATIONS[ascSign]?.asc.persona || '-',
        advice: BIG_THREE_INTERPRETATIONS[ascSign]?.asc.advice || '-'
      }
    };
  }, [computedChart]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Göksel Harita</Text>
          <Text style={styles.subtitle}>Doğum Anınızdaki Gezegen Yerleşimleri</Text>
        </View>

        {computedChart ? (
          <View style={styles.chartContainer}>
            <View style={styles.wheelWrapper}>
              {svgContent}
            </View>

            <Text style={styles.tableTitle}>Gezegen Konumları</Text>
            
            <View style={styles.table}>
              {computedChart.planets.map((p, idx) => {
                const symbol = PLANET_SYMBOLS[p.name] || '•';
                return (
                  <GlassCard key={idx} style={styles.tableRow}>
                    <View style={styles.rowMain}>
                      <Text style={styles.planetSymbol}>{symbol}</Text>
                      <Text style={styles.planetName}>
                        {p.name === 'Sun' ? 'Güneş' :
                         p.name === 'Moon' ? 'Ay' :
                         p.name === 'Mercury' ? 'Merkür' :
                         p.name === 'Venus' ? 'Venüs' :
                         p.name === 'Mars' ? 'Mars' :
                         p.name === 'Jupiter' ? 'Jüpiter' :
                         p.name === 'Saturn' ? 'Satürn' :
                         p.name === 'Uranus' ? 'Uranüs' :
                         p.name === 'Neptune' ? 'Neptün' :
                         p.name === 'Pluto' ? 'Plüton' : p.name}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.planetSign}>{p.sign}</Text>
                      <Text style={styles.planetHouse}>{p.house}. Ev</Text>
                      {p.retrograde && <Text style={styles.retroBadge}>R</Text>}
                    </View>
                  </GlassCard>
                );
              })}
            </View>

            <Text style={styles.sectionDividerTitle}>Derinlikli Psikolojik Analizler (Big Three)</Text>
            
            {interpretations && (
              <View style={styles.interpretationsList}>
                {/* Sun Interpretation Card */}
                <GlassCard style={styles.interpretationCard}>
                  <View style={styles.interpHeaderRow}>
                    <Text style={styles.interpHeaderEmoji}>☀️</Text>
                    <View style={styles.interpHeaderDetails}>
                      <Text style={styles.interpPlacementTitle}>Güneş {interpretations.sun.sign} Burcunda ({interpretations.sun.house}. Ev)</Text>
                      <Text style={styles.interpArchetypeText}>Arketip: {interpretations.sun.archetype}</Text>
                    </View>
                  </View>
                  <Text style={styles.interpBodyText}>{interpretations.sun.ego}</Text>
                  <View style={styles.interpAdviceBox}>
                    <Text style={styles.interpAdviceTitle}>🔑 Bireyleşme Tavsiyesi</Text>
                    <Text style={styles.interpAdviceText}>{interpretations.sun.advice}</Text>
                  </View>
                </GlassCard>

                {/* Moon Interpretation Card */}
                <GlassCard style={styles.interpretationCard}>
                  <View style={styles.interpHeaderRow}>
                    <Text style={styles.interpHeaderEmoji}>☽</Text>
                    <View style={styles.interpHeaderDetails}>
                      <Text style={styles.interpPlacementTitle}>Ay {interpretations.moon.sign} Burcunda ({interpretations.moon.house}. Ev)</Text>
                      <Text style={styles.interpArchetypeText}>Arketip: {interpretations.moon.archetype}</Text>
                    </View>
                  </View>
                  <Text style={styles.interpBodyText}>{interpretations.moon.shadow}</Text>
                  <View style={styles.interpAdviceBox}>
                    <Text style={styles.interpAdviceTitle}>🔑 Bilinçdışı & Gölge Entegrasyonu</Text>
                    <Text style={styles.interpAdviceText}>{interpretations.moon.advice}</Text>
                  </View>
                </GlassCard>

                {/* Ascendant Interpretation Card */}
                <GlassCard style={styles.interpretationCard}>
                  <View style={styles.interpHeaderRow}>
                    <Text style={styles.interpHeaderEmoji}>✨</Text>
                    <View style={styles.interpHeaderDetails}>
                      <Text style={styles.interpPlacementTitle}>Yükselen {interpretations.asc.sign} Burcu</Text>
                      <Text style={styles.interpArchetypeText}>Arketip: {interpretations.asc.archetype}</Text>
                    </View>
                  </View>
                  <Text style={styles.interpBodyText}>{interpretations.asc.persona}</Text>
                  <View style={styles.interpAdviceBox}>
                    <Text style={styles.interpAdviceTitle}>🔑 Persona Dengesi</Text>
                    <Text style={styles.interpAdviceText}>{interpretations.asc.advice}</Text>
                  </View>
                </GlassCard>
              </View>
            )}
          </View>
        ) : (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>
              Lütfen önce doğum haritanızı oluşturmak için profilinizi tamamlayın.
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  wheelWrapper: {
    backgroundColor: 'rgba(22, 27, 34, 0.4)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    marginBottom: 24,
  },
  tableTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  table: {
    width: '100%',
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetSymbol: {
    fontSize: 20,
    color: '#D4AF37',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  planetName: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planetSign: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  planetHouse: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#D4AF37',
    width: 45,
    textAlign: 'right',
  },
  retroBadge: {
    color: '#FF7B72',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 123, 114, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 114, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  errorCard: {
    padding: 24,
    marginTop: 40,
  },
  errorText: {
    color: '#FF7B72',
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  sectionDividerTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 30,
    marginBottom: 16,
  },
  interpretationsList: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  interpretationCard: {
    padding: 18,
  },
  interpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.12)',
    paddingBottom: 10,
  },
  interpHeaderEmoji: {
    fontSize: 24,
    color: '#D4AF37',
    fontWeight: '700',
    marginRight: 14,
    width: 36,
    textAlign: 'center',
  },
  interpHeaderDetails: {
    flex: 1,
  },
  interpPlacementTitle: {
    fontFamily: 'Cinzel',
    fontSize: 14,
    color: '#F0F6FC',
    fontWeight: '700',
  },
  interpArchetypeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
    fontStyle: 'italic',
  },
  interpBodyText: {
    fontFamily: 'Inter',
    fontSize: 13.5,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 14,
  },
  interpAdviceBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderLeftWidth: 2,
    borderLeftColor: '#D4AF37',
    padding: 12,
    borderRadius: 6,
  },
  interpAdviceTitle: {
    fontFamily: 'Cinzel',
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '700',
    marginBottom: 4,
  },
  interpAdviceText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF0',
    lineHeight: 16,
  },
});
