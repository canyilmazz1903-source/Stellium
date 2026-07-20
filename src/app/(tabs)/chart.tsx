import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Dimensions, ActivityIndicator, Pressable, Modal, Alert, Platform } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCosmicCalendarStore } from '@/store/cosmicCalendarStore';
import GlassCard from '@/components/glass/GlassCard';
import { getZodiacSign } from '@/utils/astronomy';
import { fetchFullChartAnalysis, ChartAnalysisResult } from '@/api/gemini';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withDelay, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { composePlanetInSign, computeElementBalance } from '@/utils/interpretations';

// Collapsible section wrapper so the chart page reads as an organized index
// instead of one endless scroll.
function ChartSection({ title, emoji, isOpen, onToggle, children }: {
  title: string;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartSectionCard}>
      <Pressable onPress={onToggle} style={styles.chartSectionHeader}>
        <View style={styles.chartSectionTitleRow}>
          <Text style={styles.chartSectionEmoji}>{emoji}</Text>
          <Text style={styles.chartSectionTitle}>{title}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#D4AF37" />
      </Pressable>
      {isOpen && <View style={styles.chartSectionContent}>{children}</View>}
    </View>
  );
}

const BIG_THREE_INTERPRETATIONS: Record<string, {
  sun: { archetype: string; ego: string; advice: string };
  moon: { archetype: string; shadow: string; advice: string };
  asc: { archetype: string; persona: string; advice: string };
}> = {
  'Koç': {
    sun: {
      archetype: 'Öncü Savaşçı',
      ego: 'Güneşiniz Koç burcundayken yaşam enerjiniz bağımsızlık, cesaret ve sabırsızlıkla doludur. Hayatta öncü rol oynamak, inisiyatif almak ve kendi yolunuzu korkusuzca çizmek sizin temel yaşam amacınızdır. Yönetici gezegeniniz Mars, size durdurulamaz bir irade gücü ve mücadeleci bir karakter bahşeder.',
      advice: 'Yaşam yolculuğunuzda sabırsızlığınızı dengelemeli, başkalarının sınırlarına saygı duymayı öğrenmelisiniz. Enerjinizi ani öfke patlamaları yerine yapıcı liderlik alanlarına kanalize edin.'
    },
    moon: {
      archetype: 'Ateşli Ruh',
      shadow: 'Ayınız Koç burcundayken iç dünyanız son derece tez canlı, tutkulu ve tepkiseldir. Sezgisel olarak kısıtlanmak ve bekletilmek sizi en çok huzursuz eden şeylerdir. Hislerinizi anında ve filtresizce dışa vurma eğilimindesinizdir.',
      advice: 'Duygusal tepkilerinizle aranıza kısa bir mesafe koymayı öğrenin. Anlık kararlar vermeden önce derin nefes alarak içsel dengenizi koruyun.'
    },
    asc: {
      archetype: 'Dinamik Öncü',
      persona: 'Yükselen Koç olarak dış dünyaya sunduğunuz sosyal duruş cesur, enerjik, dinamik ve doğrudan bir karakterdir. İnsanlar sizi kararlı, açık sözlü ve ilk adımı atmaktan çekinmeyen biri olarak görür.',
      advice: 'Sosyal ilişkilerinizde bazen aşırı sabırsız veya sert algılanmamak adına diplomasiden ve yumuşak diyaloglardan faydalanın.'
    }
  },
  'Boğa': {
    sun: {
      archetype: 'Yaratıcı Muhafız',
      ego: 'Güneşiniz Boğa burcundayken karakteriniz güven, istikrar, estetik ve üretkenlik odaklıdır. Hayatta kalıcı değerler inşa etmek, konfor alanınızı korumak ve doğanın ritmiyle uyumlanmak en temel amacınızdır. Yönetici gezegeniniz Venüs, size sanatsal bir zarafet, sadakat ve huzur verir.',
      advice: 'Değişimlere karşı gösterdiğiniz aşırı direnci (inatçılık) esnetmeyi öğrenin. Güvenlik ihtiyacınızın sizi konfor alanınıza hapsetmesine izin vermeyin.'
    },
    moon: {
      archetype: 'Huzur Arayan',
      shadow: 'Ayınız Boğa burcundayken duygusal dengeniz son derece sağlam, sakin ve sabırlıdır. Duygusal huzuru maddi güvencede, sakinlikte ve bedensel konforda bulursunuz. Yaşamınızda ani değişimlerden hoşlanmazsınız.',
      advice: 'Maddi varlıklara ve insanlara aşırı bağımlılık geliştirmek yerine, kendi manevi değer duygunuzu ve iç huzurunuzu büyütün.'
    },
    asc: {
      archetype: 'Güven Limanı',
      persona: 'Yükselen Boğa olarak dış dünyaya yansıttığınız imaj sabırlı, sakin, güvenilir ve sarsılmaz bir duruştur. İnsanlar sizin yanınızda huzur bulur ve pratik zekanıza güvenir. Doğallık ve zarafet auranızın bir parçasıdır.',
      advice: 'Aşırı uyuşuk veya inatçı görünme eğilimini kırmak için yeniliklere ve değişimlere kapınızı aralayın.'
    }
  },
  'İkizler': {
    sun: {
      archetype: 'Bilgi Habercisi',
      ego: 'Güneşiniz İkizler burcundayken zihinsel aktivite, merak, iletişim ve bilgi akışı en yüksek seviyededir. Sürekli öğrenmek, fikir alışverişinde bulunmak ve sosyal bağlar kurmak en büyük gücünüzdür. Yönetici gezegeniniz Merkür, size kıvrak bir zeka ve hitabet yeteneği verir.',
      advice: 'Zihinsel yüzeysellikten ve odak dağınıklığından kaçınmak için derinleşmeye önem verin. Aynı anda çok fazla şey yapmak yerine enerjinizi odaklayın.'
    },
    moon: {
      archetype: 'Rasyonel Kalp',
      shadow: 'Ayınız İkizler burcundayken hislerinizi konuşarak, yazarak veya mantıksal analiz süzgecinden geçirerek anlamlandırma eğilimindesinizdir. Duygusal dünyanız zihinsel uyarımlarla beslenir; monotonluk ruhunuzu daraltabilir.',
      advice: 'Duygularınızı sadece düşünmeyin, onları bedeninizde hissetmeye ve kalbinizin mantık aramayan sesine kulak vermeye izin verin.'
    },
    asc: {
      archetype: 'Sosyal Kelebek',
      persona: 'Yükselen İkizler olarak dış dünyaya yansıttığınız imaj meraklı, konuşkan, sempatik ve hareketli bir profildir. İnsanlar sizi sosyal, hızlı düşünen ve dost canlısı olarak algılar.',
      advice: 'Sosyal duruşunuzun samimiyetsiz veya tutarsız olarak algılanmaması için derin bağlar kurmaya özen gösterin.'
    }
  },
  'Yengeç': {
    sun: {
      archetype: 'Şefkatli Koruyucu',
      ego: 'Güneşiniz Yengeç burcundayken empati, şefkat, aile bağları ve geçmişe bağlılık ön plandadır. Sevdiklerinizi korumak, kollamak ve duygusal güvenliği sağlamak en temel yaşam amacınızdır. Yönetici gezegeniniz Ay, size derin sezgiler ve hassas bir mizaç verir.',
      advice: 'Geçmişe ve nostaljiye aşırı tutunarak şimdiki anı kaçırmaktan kaçının. Başkalarını korumaya çalışırken kendi sınırlarınızı feda etmeyin.'
    },
    moon: {
      archetype: 'Duygusal Okyanus',
      shadow: 'Ayınız Yengeç burcundayken duygusal derinliğiniz, sezgileriniz ve sahiplenme duygunuz en üst seviyededir. Çevrenizdeki enerjilerden çok çabuk etkilenirsiniz; yuvanız ve sığınağınız sizin için ruhen hayati öneme sahiptir.',
      advice: 'Aşırı alınganlık göstermek yerine, kırılganlığınızı yapıcı bir şekilde ifade etmeyi deneyin. Ruhsal temizlik ritüellerine hayatınızda yer açın.'
    },
    asc: {
      archetype: 'Şefkatli Rehber',
      persona: 'Yükselen Yengeç olarak dış dünyaya gösterdiğiniz duruş duyarlı, koruyucu, sıcakkanlı ve sezgiseldir. İnsanlar size içini açmakta zorlanmaz; çevrenizde anaç/babaç bir koruma çemberi oluşturursunuz.',
      advice: 'Dış dünyaya karşı aşırı savunmacı veya mesafeli (sert kabuklu) görünmemek için içsel güveninizi geliştirin.'
    }
  },
  'Aslan': {
    sun: {
      archetype: 'Karizmatik Hükümdar',
      ego: 'Güneşiniz Aslan burcundayken cömertlik, karizma, yaratıcı liderlik ve sahnede olma arzusu ön plandadır. Kendi özgünlüğünü sergilemek, takdir edilmek ve çevresine ışık saçmak onun için esastır. Yönetici gezegeniniz Güneş, size yüksek özgüven ve yaşam enerjisi verir.',
      advice: 'Kibir, egoizm ve sürekli onaylanma ihtiyacından sıyrılıp içsel öz-değerinizi ve sessiz gücünüzü keşfedin.'
    },
    moon: {
      archetype: 'Cömert Yürek',
      shadow: 'Ayınız Aslan burcundayken duygusal olarak ilgi, sevilme ve özel hissetme arzusuyla dolusunuzdur. Gururunuz ve hisleriniz çok güçlüdür; sevdiklerinize karşı son derece koruyucu, cömert ve sadık bir tavır sergilersiniz.',
      advice: 'Sıradanlığı kabul etmenin ruhsal olgunluğun bir parçası olduğunu unutmayın. Başkalarının ışığını ve başarılarını da içtenlikle takdir edin.'
    },
    asc: {
      archetype: 'Göz Alıcı Işık',
      persona: 'Yükselen Aslan olarak dış dünyaya yansıttığınız imaj özgüvenli, karizmatik, canlı ve dikkat çekici bir duruştur. Girdiğiniz her ortamda liderlik vasıflarınız ve sıcak enerjinizle fark edilirsiniz.',
      advice: 'Dış duruşunuzun kibirli görünmemesi için samimi bir alçakgönüllülüğü benimseyin.'
    }
  },
  'Başak': {
    sun: {
      archetype: 'Detaycı Şifacı',
      ego: 'Güneşiniz Başak burcundayken analiz, düzen, faydalı olma, ustalık ve titizlik en önemli karakter özellikleridir. Hayatı organize etmek, detayları mükemmelleştirmek ve şifa/hizmet odaklı yaşamak yaşam amacınızdır. Yönetici gezegeniniz Merkür, size keskin bir mantık verir.',
      advice: 'Kendinizi ve çevrenizi aşırı eleştirmekten kaçının. Mükemmeliyetçilik arayışının hayatın doğal kusurlarını görmenizi engellemesine izin vermeyin.'
    },
    moon: {
      archetype: 'Hassas Düzenleyici',
      shadow: 'Ayınız Başak burcundayken duygusal huzuru hayatı planlayarak ve işe yarayarak bulursunuz. Endişeli ve detaycı bir iç dünyanız olabilir; başkalarına yardım etmek ruhunuzu en çok dinlendiren şeydir.',
      advice: 'Zihinsel endişelerinizin bedensel sağlığınızı etkilemesine izin vermeyin. Kontrol edemeyeceğiniz süreçleri serbest bırakmayı öğrenin.'
    },
    asc: {
      archetype: 'Titiz Gözlemci',
      persona: 'Yükselen Başak olarak dış dünyaya yansıttığınız imaj temiz, düzenli, mütevazı ve analitik bir duruştur. İnsanlar sizi detaylara önem veren, iş bitirici ve güvenilir biri olarak görür.',
      advice: 'Dış duruşunuzun aşırı çekingen veya mesafeli durmasını engellemek için duygusal sıcaklığınızı dışarıya daha fazla yansıtın.'
    }
  },
  'Terazi': {
    sun: {
      archetype: 'Zarif Peacemaker',
      ego: 'Güneşiniz Terazi burcundayken adalet, estetik, diplomasi, ilişkiler ve ahenk arayışı ön plandadır. Hayatta dengeleri korumak, ortaklıklar kurmak ve güzellikleri paylaşmak sizin temel amacınızdır. Yönetici gezegeniniz Venüs, size zarafet ve uzlaşma kabiliyeti verir.',
      advice: 'Çatışmalardan kaçmak adına kendi doğrularınızdan ödün vermeyin. Hayır demeyi öğrenmek ve kendi sınırlarınızı çizmek yaşam yolunuzda en önemli adımlardan biridir.'
    },
    moon: {
      archetype: 'Ahenkli Kalp',
      shadow: 'Ayınız Terazi burcundayken duygusal dengeniz ilişkilerinizdeki huzura doğrudan bağlıdır. Yalnız kalmaktan hoşmanmaz, çevrenizde ahenk ve adalet görmedikçe içsel olarak rahat edemezsiniz.',
      advice: 'İçsel dengenizin başkalarının onayına bağlı olmadığını kabul edin. Kendi kendinizle kalmanın gücünü keşfedin.'
    },
    asc: {
      archetype: 'Zarif Köprü',
      persona: 'Yükselen Terazi olarak dış dünyaya sunduğunuz maske son derece nazik, güler yüzlü, estetik açıdan dengeli ve çekicidir. İnsanlar sizi uyumlu ve kolay iletişim kurulan biri olarak algılar.',
      advice: 'Dış görünüşe ve başkalarının onayına odaklanırken kendi derin ve samimi duygularınızı bastırmayın.'
    }
  },
  'Akrep': {
    sun: {
      archetype: 'Mistik Simyacı',
      ego: 'Güneşiniz Akrep burcundayken derinlik, tutku, gizemleri çözme ve krizler vasıtasıyla dönüşme gücü ön plandadır. Yüzeysel olan hiçbir şey size hitap etmez; hayatın en gizli ve karanlık yönlerini aydınlatmak sizin amacınızdır. Yönetici gezegeniniz Mars, size direnç gücü verir.',
      advice: 'Kontrol ve güç arzusunu serbest bırakın. İnsanlara güvenmeyi ve affetmeyi öğrenmek, ruhsal enerjinizi en yüksek seviyeye taşıyacaktır.'
    },
    moon: {
      archetype: 'Derin Sezgi',
      shadow: 'Ayınız Akrep burcundayken duygusal dünyanız son derece yoğun, sezgisel ve ketumdur. Hislerinizi çok derinde saklar, kolay kolay güvenmezsiniz. Güçlü sezgileriniz sayesinde yalanları ve arkadan çevrilen işleri anında fark edersiniz.',
      advice: 'İçinizdeki şüpheciliği ve intikam duygusunu serbest bırakın. Kendi kendinizi sabote etme eğilimlerinizi fark ederek şifalandırın.'
    },
    asc: {
      archetype: 'Karizmatik Kalkan',
      persona: 'Yükselen Akrep olarak dış dünyaya gösterdiğiniz duruş karizmatik, gizemli, keskin gözlemlere sahip ve korunaklıdır. İnsanlar sizin gizemli havanızdan hem etkilenir hem de temkinli yaklaşır.',
      advice: 'Aşırı savunmacı veya tehditkar bir imaj çizmemek için çevrenize daha şeffaf ve güven verici yaklaşımlar sergileyin.'
    }
  },
  'Yay': {
    sun: {
      archetype: 'Bilge Kaşif',
      ego: 'Güneşiniz Yay burcundayken keşif, bilgelik arayışı, inançlar, iyimserlik ve özgürlük en temel karakter özellikleridir. Hayatın yüksek anlamını keşfetmek, sürekli seyahat etmek ve ufkunu genişletmek sizin amacınızdır. Yönetici gezegeniniz Jüpiter, size büyük bir şans ve iyimserlik verir.',
      advice: 'Aşırı iyimserliğin getirdiği dogmatizmden ve her şeyi ben bilirim tavrından kaçının. Gerçek bilgeliğin dinlemek olduğunu unutmayın.'
    },
    moon: {
      archetype: 'Gezgin Ruh',
      shadow: 'Ayınız Yay burcundayken iç dünyanız maceracı, neşeli ve sınırlara isyan eden bir yapıdadır. Zorluklar karşısında umudunuzu asla kaybetmez, her deneyimden felsefi bir ders çıkarmayı başarırsınız.',
      advice: 'Duygusal sorumluluklardan kaçmak yerine kriz anlarında kalmayı öğrenin. Bazen durmanın ve içe bakmanın da büyük bir keşif olduğunu fark edin.'
    },
    asc: {
      archetype: 'Pozitif Vizyoner',
      persona: 'Yükselen Yay olarak dış dünyaya sunduğunuz maske coşkulu, neşeli, açık fikirli ve dost canlısı bir profildir. İnsanlar sizi maceraperest, şanslı ve felsefi sohbetleri seven biri olarak görür.',
      advice: 'Sosyal imajınızın ciddiyetsiz veya her şeyi bilen biri gibi algılanmamasına dikkat edin.'
    }
  },
  'Oğlak': {
    sun: {
      archetype: 'Kozmik Mimar',
      ego: 'Güneşiniz Oğlak burcundayken disiplin, sorumluluk, ciddiyet, sabır ve yüksek hedefler ön plandadır. Hayatta kalıcı başarılar elde etmek, saygınlık kazanmak ve somut yapılar kurmak sizin amacınızdır. Yönetici gezegeniniz Satürn, size çelik gibi bir irade verir.',
      advice: 'Başarı ve statüye odaklanırken içsel duygu dünyanızı ve sevdiklerinizi ihmal etmeyin. Hayatın sadece görevlerden ibaret olmadığını kabul edin.'
    },
    moon: {
      archetype: 'Sabırlı Kaya',
      shadow: 'Ayınız Oğlak burcundayken duygularınızı kontrol altında tutma ve dışarıya yansıttığınızda zayıf görünme korkunuz vardır. Kendinize karşı son derece disiplinli, stoik ve sabırlı bir iç dünyanız vardır.',
      advice: 'Bazen zayıf ve muhtaç olmanın insani bir hak olduğunu kabul edin. Kendinize karşı daha yumuşak ve bağışlayıcı olun.'
    },
    asc: {
      archetype: 'Saygın Lider',
      persona: 'Yükselen Oğlak olarak dış dünyaya yansıttığınız imaj ciddi, olgun, mesafeli ve son derece profesyoneldir. İnsanlar sizi sarsılmaz, ağırbaşlı ve kontrolü elinde tutan biri olarak görür.',
      advice: 'Dış duruşunuzun aşırı soğuk ve erişilmez görünmemesi için samimiyetinizi dışarıya aktarmaya çalışın.'
    }
  },
  'Kova': {
    sun: {
      archetype: 'Özgür Vizyoner',
      ego: 'Güneşiniz Kova burcundayken özgünlük, bağımsızlık, entelektüel vizyon ve toplumsal konulara duyarlılık ön plandadır. Sınırları aşmak, yeni fikirler geliştirmek ve toplumsal ilerlemeye katkıda bulunmak en büyük amacınızdır. Yönetici gezegeniniz Satürn, size zihinsel kararlılık verir.',
      advice: 'Sırf farklı olmak adına marjinalleşmekten kaçının. Zihinsel vizyonlarınızı ve fikirlerinizi kalbinizin sıcaklığıyla buluşturun.'
    },
    moon: {
      archetype: 'Bağımsız Zihin',
      shadow: 'Ayınız Kova burcundayken duygusal bağımsızlığınıza son derece düşkünsünüzdür. Duygularınızı zihinselleştirip dışarıdan izleme eğiliminiz vardır; arkadaşlık ve dostluk bağları sizin için çok önemlidir.',
      advice: 'Başkalarıyla derin duygusal bağlar kurmanın özgürlüğünüzü kısıtlamadığını, aksine ruhunuzu zenginleştirdiğini fark edin.'
    },
    asc: {
      archetype: 'Sıra Dışı Deha',
      persona: 'Yükselen Kova olarak dış dünyaya gösterdiğiniz maske orijinal, arkadaş canlısı, entelektüel ve sıra dışı bir karakterdir. İnsanlar sizi vizyoner ve ön yargısız biri olarak algılar.',
      advice: 'Dış imajınızın aşırı mesafeli veya duygusuz görünmesini engellemek için birebir ilişkilerde empatiye yer verin.'
    }
  },
  'Balık': {
    sun: {
      archetype: 'Mistik Hayalperest',
      ego: 'Güneşiniz Balık burcundayken evrensel sevgi, teslimiyet, sanatsal ilham, güçlü sezgiler ve fedakarlık ön plandadır. Dünyanın sert gerçeklerinden ziyade manevi boyutlarla uyumlanmak ve bütünlüğü hissetmek sizin amacınızdır. Yönetici gezegeniniz Jüpiter, size engin bir hayal gücü verir.',
      advice: 'Gerçeklerden kaçma ve kurban psikolojisine sığınma eğiliminizle yüzleşin. Sınırlar koymayı ve hayatta topraklanmayı öğrenin.'
    },
    moon: {
      archetype: 'Sonsuz Şefkat',
      shadow: 'Ayınız Balık burcundayken ruhunuz aşırı duyarlı, psişik olarak geçirgen ve aşırı empatiktir. Başkalarının acılarını ve sevinçlerini kendi içinizde hisseder, rüyalarınız vasıtasıyla gelecekten mesajlar alabilirsiniz.',
      advice: 'Ruhsal sınırlarınızı korumak için koruma çalışmaları yapın. Kendi kendinizi kurban veya kurtarıcı rollerine hapsetmeyin.'
    },
    asc: {
      archetype: 'Eterik Arayıcı',
      persona: 'Yükselen Balık olarak dış dünyaya sunduğunuz maske son derece nazik, hayalperest, gizemli ve yumuşak bir auranın yansımasıdır. İnsanlar sizin yanınızda kendilerini güvende ve yargılanmamış hisseder.',
      advice: 'Hayatın pratik detaylarında kaybolmamak için kararlılık ve netlik maskesini de kuşanmayı öğrenin.'
    }
  }
};

const { width } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(width - 40, 320);
const CENTER = CANVAS_SIZE / 2;
const RADIUS = CANVAS_SIZE * 0.44;

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

const PLANET_NAME_TR: Record<string, string> = {
  Sun: 'Güneş',
  Moon: 'Ay',
  Mercury: 'Merkür',
  Venus: 'Venüs',
  Mars: 'Mars',
  Jupiter: 'Jüpiter',
  Saturn: 'Satürn',
  Uranus: 'Uranüs',
  Neptune: 'Neptün',
  Pluto: 'Plüton',
};

const PLANET_KEYWORDS: Record<string, { turkish: string; symbol: string; archetype: string; theme: string }> = {
  Mercury: { turkish: 'Merkür', symbol: '☿', archetype: 'Zihinsel Rehber', theme: 'iletişim tarzınızı, karar verme süreçlerinizi ve zihinsel ilgi alanlarınızı şekillendirir. Bilgiyi nasıl işlediğinizi gösterir.' },
  Venus: { turkish: 'Venüs', symbol: '♀', archetype: 'Değer ve Sevgi Elçisi', theme: 'ilişki modelinizi, sevgi dilinizi, estetik algınızı ve hayattan nasıl keyif aldığınızı gösterir. Maddi bolluk ve değer duygunuzla ilgilidir.' },
  Mars: { turkish: 'Mars', symbol: '♂', archetype: 'Eylem ve Güç Savaşçısı', theme: 'fiziksel enerjinizi, mücadele gücünüzü, tutkularınızı ve hedeflerinize ulaşmak için nasıl harekete geçtiğinizi temsil eder.' },
  Jupiter: { turkish: 'Jüpiter', symbol: '♃', archetype: 'Bilgelik ve Şans Yıldızı', theme: 'bolluk ve bereketin yaşamınızdaki kapılarını, gelişim alanlarınızı, inançlarınızı ve şanslı fırsatları nasıl çektiğinizi gösterir.' },
  Saturn: { turkish: 'Satürn', symbol: '♄', archetype: 'Zamanın ve Sınırlerin Efendisi', theme: 'öğrenmeniz gereken karmik dersleri, sorumluluk alanlarınızı, korkularınızı ve olgunlaşma yollarınızı gösterir.' },
  Uranus: { turkish: 'Uranüs', symbol: '♅', archetype: 'Devrimci ve Reformcu Deha', theme: 'özgürleşme ihtiyacınızı, yenilikçi fikirlerinizi, ani değişimleri ve nerede sıra dışı olduğunuzu simgeler.' },
  Neptune: { turkish: 'Neptün', symbol: '♆', archetype: 'İlham ve Teslimiyet Şairi', theme: 'hayal gücünüzü, spiritüel derinliğinizi, illüzyonları, sanatsal ilhamı ve evrensel bütünleşmeyi temsil eder.' },
  Pluto: { turkish: 'Plüton', symbol: '♇', archetype: 'Küllerinden Doğan Simyacı', theme: 'güç savaşlarını, derin dönüşüm süreçlerinizi, krizleri aşma potansiyelinizi ve bilinçaltının derinliklerini gösterir.' },
  Sun: { turkish: 'Güneş', symbol: '☉', archetype: 'Öncü Savaşçı / Yaşam Gücü', theme: 'temel kimliğinizi, egonuzu, iradenizi ve hayattaki ana yönünüzü gösterir.' },
  Moon: { turkish: 'Ay', symbol: '☽', archetype: 'Duygusal Besleyici / İç Dünyanız', theme: 'duygusal tepkilerinizi, bilinçaltınızı, alışkanlıklarınızı ve kendinizi nasıl güvende hissettiğinizi gösterir.' }
};

const SIGN_KEYWORDS: Record<string, string> = {
  'Koç': 'cesur, inisiyatif alan, sabırsız ve enerjik bir üslupla',
  'Boğa': 'sakin, kararlı, somut değerlere odaklı ve istikrarlı bir dille',
  'İkizler': 'meraklı, konuşkan, çok yönlü ve rasyonel bir yaklaşımla',
  'Yengeç': 'sezgisel, şefkatli, korumacı ve duygusal bir derinlikle',
  'Aslan': 'cömert, gururlu, sahne alan ve yaratıcı bir özgüvenle',
  'Başak': 'analitik, titiz, faydalı ve detaycı bir yaklaşımla',
  'Terazi': 'diplomatik, uyumlu, estetiğe ve adalete önem veren bir biçimde',
  'Akrep': 'tutkulu, gizemli, derin ve dönüştürücü bir güçle',
  'Yay': 'iyimser, maceracı, inançlı ve felsefi bir bakış açısıyla',
  'Oğlak': 'disiplinli, sabırlı, sorumluluk sahibi ve mesafeli bir ciddiyetle',
  'Kova': 'özgün, bağımsız, yenilikçi ve toplumsal bir vizyonla',
  'Balık': 'mistik, fedakar, hayal gücü yüksek ve teslimiyetçi bir hassasiyetle',
};

const HOUSE_KEYWORDS: Record<number, string> = {
  1: 'kişisel imajınız, dış dünyaya verdiğiniz ilk izlenim ve fiziksel canlılık alanında kendini gösterir.',
  2: 'maddi kaynaklarınız, kazanç yöntemleriniz ve kendi öz-değer duygunuz üzerinde etkili olur.',
  3: 'yakın çevre ilişkileriniz, kardeşleriniz, kısa yolculuklar ve günlük iletişim süreçlerinizde rol oynar.',
  4: 'yuvanız, aile kökleriniz, içsel sığınağınız ve bilinçaltı temelleriniz alanında çalışır.',
  5: 'yaratıcılığınız, aşk hayatınız, hobileriniz, çocuklarınız ve hayattan aldığınız keyif sahasını etkiler.',
  6: 'günlük rutinleriniz, çalışma ortamınız, sağlığınız ve başkalarına sunduğunuz hizmetler alanında belirleyicidir.',
  7: 'evlilik, ortaklıklar, yakın ikili ilişkileriniz ve açık düşmanlar evinde görünür hale gelir.',
  8: 'ortaklaşa kazançlar, miras, cinsellik, krizler ve küllerinden yeniden doğma süreçlerinde etkilidir.',
  9: 'yüksek öğrenim, yurt dışı seyahatler, felsefi inançlar ve yaşam vizyonu alanını aydınlatır.',
  10: 'toplumsal statünüz, kariyeriniz, hedefleriniz ve otorite figürleriyle olan ilişkilerinizi yönetir.',
  11: 'sosyal çevre, arkadaşlık grupları, toplumsal idealleriniz ve gelecek umutlarınız alanında aktiftir.',
  12: 'bilinçaltı sırlar, rüyalar, yalnızlık, spiritüel çalışmalar ve gizli düşmanlar boyutunda işler.',
};

export default function ChartScreen() {
  const { computedChart } = useAppStore();
  const { profile, isPremium } = useAuthStore();
  const { auraColors } = useCosmicCalendarStore();
  const router = useRouter();

  // Interactive Selection State
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  // AI Modal States
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReport, setAiReport] = useState<ChartAnalysisResult | string | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'bigThree' | 'mental' | 'love' | 'lessons'>('bigThree');

  // Accordion state: which analysis section is expanded (0 = Big Three open by default)
  const [openSection, setOpenSection] = useState<number | null>(0);
  const toggleSection = (idx: number) => setOpenSection(openSection === idx ? null : idx);

  // Background Aura Reanimated Config
  const color1 = useSharedValue('#B2F7EF');
  const color2 = useSharedValue('#EFF7F6');

  // Breathing effect values
  const breatheScale1 = useSharedValue(1);
  const breatheOpacity1 = useSharedValue(0.12);
  const breatheScale2 = useSharedValue(1.1);
  const breatheOpacity2 = useSharedValue(0.09);

  useEffect(() => {
    if (auraColors && auraColors.length >= 2) {
      color1.value = withTiming(auraColors[0], { duration: 2500 });
      color2.value = withTiming(auraColors[1], { duration: 2500 });
    }
  }, [auraColors]);

  useEffect(() => {
    // Start repeating breathing loop for Aura 1
    breatheScale1.value = withRepeat(
      withTiming(1.35, { duration: 7000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    breatheOpacity1.value = withRepeat(
      withTiming(0.24, { duration: 7000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );

    // Start repeating breathing loop for Aura 2 with a delay
    breatheScale2.value = withDelay(
      1800,
      withRepeat(
        withTiming(1.45, { duration: 8000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
        -1,
        true
      )
    );
    breatheOpacity2.value = withDelay(
      1800,
      withRepeat(
        withTiming(0.20, { duration: 8000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
        -1,
        true
      )
    );
  }, []);

  const animatedAuraStyle1 = useAnimatedStyle(() => ({
    backgroundColor: color1.value,
    transform: [{ scale: breatheScale1.value }],
    opacity: breatheOpacity1.value,
  }));

  const animatedAuraStyle2 = useAnimatedStyle(() => ({
    backgroundColor: color2.value,
    transform: [{ scale: breatheScale2.value }],
    opacity: breatheOpacity2.value,
  }));

  // 1. Calculate Fire/Earth/Air/Water element percentages
  const elementPercentages = useMemo(() => {
    if (!computedChart) return null;
    const elementCounts = { Ateş: 0, Toprak: 0, Hava: 0, Su: 0 };
    
    computedChart.planets.forEach((p) => {
      const sign = p.sign;
      if (['Koç', 'Aslan', 'Yay'].includes(sign)) elementCounts.Ateş++;
      else if (['Boğa', 'Başak', 'Oğlak'].includes(sign)) elementCounts.Toprak++;
      else if (['İkizler', 'Terazi', 'Kova'].includes(sign)) elementCounts.Hava++;
      else if (['Yengeç', 'Akrep', 'Balık'].includes(sign)) elementCounts.Su++;
    });

    const total = computedChart.planets.length;
    return {
      Ateş: total ? Math.round((elementCounts.Ateş / total) * 100) : 0,
      Toprak: total ? Math.round((elementCounts.Toprak / total) * 100) : 0,
      Hava: total ? Math.round((elementCounts.Hava / total) * 100) : 0,
      Su: total ? Math.round((elementCounts.Su / total) * 100) : 0,
    };
  }, [computedChart]);

  // 2. Format exact degrees, minutes & seconds (e.g. 15° Koç 32' 45")
  const formatPlanetDegree = (longitude: number, sign: string) => {
    const degInSign = longitude % 30;
    const deg = Math.floor(degInSign);
    const decimalMin = (degInSign - deg) * 60;
    const min = Math.floor(decimalMin);
    const sec = Math.floor((decimalMin - min) * 60);
    return `${deg}° ${sign} ${min}' ${String(sec).padStart(2, '0')}"`;
  };

  const getAspectDescription = (p1Name: string, p2Name: string, type: string) => {
    const isHarmonious = type === 'Trine' || type === 'Sextile';
    const pair1 = `${p1Name}-${p2Name}`;
    const pair2 = `${p2Name}-${p1Name}`;
    
    const harmoniousMap: Record<string, string> = {
      'Ay-Güneş': 'Ruh ve beden uyumu. Karakter bütünlüğü ve dengeli yaşam amaçları.',
      'Güneş-Merkür': 'Zihinsel yeteneklerini kendini ifade etmekte çok başarılı kullanır. Güçlü hitabet gücü.',
      'Güneş-Venüs': 'Zarif, çekici ve uyumlu mizaç. Sosyal ilişkilerde ve sanatta doğal şans.',
      'Güneş-Mars': 'Yüksek yaşam enerjisi, cesaret, kararlılık ve hedeflerine ulaşma gücü.',
      'Güneş-Jüpiter': 'Büyük şans, iyimserlik, yaşam coşkusu ve manevi koruma.',
      'Güneş-Satürn': 'Disiplin, olgunluk, uzun vadeli başarılar ve güçlü sorumluluk bilinci.',
      'Ay-Venüs': 'Sevecenlik, popülerlik, sanata düşkünlük ve sıcak aile ilişkileri.',
      'Ay-Mars': 'Duygusal cesaret, dürüstlük, yüksek tutku ve hızlı eyleme geçme gücü.',
      'Ay-Jüpiter': 'Cömertlik, duygusal bolluk, şans ve çevresindekilere yardım etme arzusu.',
      'Ay-Satürn': 'Duygusal olgunluk, sabır, sadakat ve güvenilirlik.',
      'Merkür-Venüs': 'Diplomatik dil, güzel konuşma, yazarlık yeteneği ve tatlı dilli mizaç.',
      'Merkür-Mars': 'Keskin zeka, hazırcevaplık, tartışma yeteneği ve hızlı düşünebilme.',
      'Merkür-Jüpiter': 'Geniş vizyon, felsefi derinlik, yabancı dillerde ve akademide başarı.',
      'Merkür-Satürn': 'Mantıklı, sistemli düşünme yeteneği, derin konsantrasyon ve kararlılık.',
      'Venüs-Mars': 'Tutkulu aşk ilişkileri, yüksek çekim gücü ve sanatsal üretim.',
      'Venüs-Jüpiter': 'Aşkta ve parada şans, cömertlik ve lüks yaşam sevgisi.',
      'Venüs-Satürn': 'İlişkilerde sadakat, ciddiyet, kalıcı evlilikler ve olgun partnerler.',
      'Jüpiter-Mars': 'Girişimcilik cesareti, risk alabilme yeteneği ve yüksek motivasyon.',
      'Mars-Satürn': 'Kontrollü güç, sabırlı eylem, dayanıklılık ve mühendislik yeteneği.'
    };

    const challengingMap: Record<string, string> = {
      'Ay-Güneş': 'İçsel çatışmalar, ebeveynler arası anlaşmazlıklar veya istekler ile duygular arası ikilem.',
      'Güneş-Mars': 'Öfke kontrolü sorunları, sabırsızlık ve otoriteyle çatışma eğilimi.',
      'Güneş-Jüpiter': 'Aşırı gurur, israf, abartılı beklentiler ve riskli adımlar.',
      'Güneş-Satürn': 'Öz güven eksikliği, hayat yolunda engellerle karşılaşma ve geciken başarılar.',
      'Ay-Merkür': 'Duygular ile mantık arasında sürekli gel-git yaşama. Kararsızlık.',
      'Ay-Mars': 'Çabuk sinirlenme, alınganlık, ani duygusal patlamalar ve sabırsızlık.',
      'Ay-Jüpiter': 'Duygusal israf, aşırı iyimserlik nedeniyle aldatılma veya aşırı yeme eğilimi.',
      'Ay-Satürn': 'Melankoli, yalnızlık hissi, anne ile soğuk ilişkiler ve duygularını bastırma.',
      'Merkür-Mars': 'Sivri dilli olmak, kalp kırma eğilimi, tartışmacı mizaç ve aceleci kararlar.',
      'Merkür-Jüpiter': 'Detayları gözden kaçırma, abartılı konuşmalar ve tutulmayan sözler.',
      'Merkür-Satürn': 'Kötümser düşünce yapısı, depresif eğilimler ve zihinsel blokajlar.',
      'Venüs-Mars': 'Aşkta kıskançlık, fırtınalı ve çatışmalı ilişkiler, ani ayrılıklar.',
      'Venüs-Jüpiter': 'İlişkilerde aşırı beklentiler, sadakatsizlik riskleri ve kontrolsüz harcamalar.',
      'Venüs-Satürn': 'Aşkta değersizlik hissi, soğuk ilişkiler, sevgiyi ifade edememe ve geciken evlilik.',
      'Jüpiter-Mars': 'Kontrolsüz öfke, aşırı risk alma ve yasalarla/otoritelerle sorun yaşama potansiyeli.',
      'Mars-Satürn': 'Baskılanmış öfke, zamanlama problemleri, kemik/eklem sağlığına dikkat etme gereği.'
    };

    const details = isHarmonious
      ? (harmoniousMap[pair1] || harmoniousMap[pair2])
      : (challengingMap[pair1] || challengingMap[pair2]);

    return details || `${p1Name} ile ${p2Name} arasındaki bu açı, iki gezegenin enerjilerinin hayat yolculuğunuzdaki etkileşimini gösterir.`;
  };

  // 3. Calculate natal aspects (conjunction, sextile, square, trine, opposition)
  const aspects = useMemo(() => {
    if (!computedChart) return [];
    const calculated: any[] = [];
    const orb = 6;
    const planets = computedChart.planets;

    const ASPECT_TYPES = [
      { type: 'Conjunction', angle: 0, label: 'Kavuşum', symbol: '☌', color: '#B2F7EF' },
      { type: 'Sextile', angle: 60, label: 'Sekstil', symbol: '⚹', color: '#C7F9CC' },
      { type: 'Square', angle: 90, label: 'Kare', symbol: '□', color: '#F8AD9D' },
      { type: 'Trine', angle: 120, label: 'Üçgen', symbol: '△', color: '#FEEAFA' },
      { type: 'Opposition', angle: 180, label: 'Karşıt', symbol: '☍', color: '#D8BBFF' },
    ];

    const planetNameTR: Record<string, string> = {
      Sun: 'Güneş',
      Moon: 'Ay',
      Mercury: 'Merkür',
      Venus: 'Venüs',
      Mars: 'Mars',
      Jupiter: 'Jüpiter',
      Saturn: 'Satürn',
      Uranus: 'Uranüs',
      Neptune: 'Neptün',
      Pluto: 'Plüton',
    };

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = planets[i];
        const p2 = planets[j];
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const aspectType of ASPECT_TYPES) {
          if (Math.abs(diff - aspectType.angle) <= orb) {
            calculated.push({
              p1Name: planetNameTR[p1.name] || p1.name,
              p2Name: planetNameTR[p2.name] || p2.name,
              type: aspectType.type,
              label: aspectType.label,
              symbol: aspectType.symbol,
              color: aspectType.color,
              diff: Number(diff.toFixed(1)),
            });
          }
        }
      }
    }
    return calculated;
  }, [computedChart]);

  // 4. Generate dynamic planet placements explanations (rich, composed text)
  const planetPlacements = useMemo(() => {
    if (!computedChart) return [];

    return computedChart.planets
      .filter(p => p.name !== 'Sun' && p.name !== 'Moon')
      .map(p => {
        const kw = PLANET_KEYWORDS[p.name];
        if (!kw) return null;

        const composed = composePlanetInSign(p.name, p.sign, p.house, p.retrograde);
        const signText = SIGN_KEYWORDS[p.sign] || 'kendine has bir üslupla';
        const houseText = HOUSE_KEYWORDS[p.house] || 'yaşam alanlarınızda etkili olur.';
        const legacy = `Astrolojide ${kw.turkish}, ${kw.theme} Gezegeninizin bu konumu, enerjisini ${signText} yansıtır ve özellikle ${houseText}`;

        return {
          name: kw.turkish,
          symbol: kw.symbol,
          placement: `${kw.turkish} ${p.sign} Burcunda (${p.house}. Ev)`,
          archetype: kw.archetype,
          retrograde: p.retrograde,
          degree: formatPlanetDegree(p.longitude, p.sign),
          description: composed ? `${legacy}\n\n${composed}` : legacy,
        };
      })
      .filter(Boolean);
  }, [computedChart]);

  // 4b. House cusp table + modality balance + element narrative (technical depth)
  const houseCusps = useMemo(() => {
    if (!computedChart) return [];
    return computedChart.houses.map((cusp, i) => {
      const signInfo = getZodiacSign(cusp);
      return {
        house: i + 1,
        sign: signInfo ? signInfo.turkish : '—',
        symbol: signInfo ? signInfo.symbol : '',
        degree: formatPlanetDegree(cusp, ''),
      };
    });
  }, [computedChart]);

  const balanceInfo = useMemo(() => {
    if (!computedChart) return null;
    return computeElementBalance(computedChart.planets);
  }, [computedChart]);

  const handleFetchAIAnalysis = async () => {
    if (!isPremium) {
      Alert.alert(
        'Elite Üyelik Gerekli',
        'Kapsamlı AI Harita Analizi yalnızca Stellium Elite üyelerimize özeldir. Elite üyelikle doğum haritanızın derin analizini yapabilirsiniz.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Üyeliği İncele', onPress: () => router.push('/settings') }
        ]
      );
      return;
    }

    if (!computedChart || !profile) return;

    setLoadingAI(true);
    setAiModalVisible(true);
    try {
      const response = await fetchFullChartAnalysis(profile.name || 'Kozmik Ruh', computedChart, aspects, profile.id);
      setAiReport(response);
    } catch (error) {
      console.warn('AI analysis error:', error);
      Alert.alert('Hata', 'Analiz raporu alınırken bir sorun oluştu. Lütfen tekrar deneyin.');
      setAiModalVisible(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const svgContent = useMemo(() => {
    if (!computedChart) return null;

    const { planets, houses, ascendant } = computedChart;

    const getCoordinates = (angleDegrees: number, radius: number) => {
      const adjustedAngle = angleDegrees - ascendant + 180;
      const angleRad = adjustedAngle * (Math.PI / 180);
      const x = CENTER + radius * Math.cos(angleRad);
      const y = CENTER + radius * Math.sin(angleRad);
      return { x, y };
    };

    const aspectLines: React.ReactNode[] = [];
    const orb = 6;
    const ASPECT_TYPES = [
      { type: 'Conjunction', angle: 0, isHarmonious: true },
      { type: 'Sextile', angle: 60, isHarmonious: true },
      { type: 'Square', angle: 90, isHarmonious: false },
      { type: 'Trine', angle: 120, isHarmonious: true },
      { type: 'Opposition', angle: 180, isHarmonious: false },
    ];

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = planets[i];
        const p2 = planets[j];
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const aspectType of ASPECT_TYPES) {
          if (Math.abs(diff - aspectType.angle) <= orb) {
            // Calculate coordinates at the inner boundary for aspect line drawing
            const p1AnglePos = getCoordinates(p1.longitude, RADIUS * 0.45);
            const p2AnglePos = getCoordinates(p2.longitude, RADIUS * 0.45);

            const isHarmonious = aspectType.isHarmonious;
            const strokeColor = isHarmonious ? 'rgba(0, 191, 255, 0.4)' : 'rgba(220, 20, 60, 0.4)';
            const isDashed = isHarmonious;

            aspectLines.push(
              <Line
                key={`aspect-line-${i}-${j}`}
                x1={p1AnglePos.x}
                y1={p1AnglePos.y}
                x2={p2AnglePos.x}
                y2={p2AnglePos.y}
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeDasharray={isDashed ? "3,3" : undefined}
              />
            );
          }
        }
      }
    }

    const houseLines = houses.map((houseDegree, idx) => {
      const pInner = getCoordinates(houseDegree, RADIUS * 0.45);
      const pOuter = getCoordinates(houseDegree, RADIUS);
      const isSelected = selectedHouse === idx + 1;
      return (
        <Line
          key={`house-${idx}`}
          x1={pInner.x}
          y1={pInner.y}
          x2={pOuter.x}
          y2={pOuter.y}
          stroke={isSelected ? "#D4AF37" : "rgba(255, 255, 255, 0.12)"}
          strokeWidth={isSelected ? "3.5" : (idx === 0 || idx === 9 ? "2" : "1")}
          onPress={() => {
            setSelectedHouse(isSelected ? null : idx + 1);
            setSelectedPlanet(null);
          }}
        />
      );
    });

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
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
      );
    }

    const zodiacSymbols = ZODIAC_ABBREVIATIONS.map((symbol, i) => {
      const midDeg = i * 30 + 15;
      const pos = getCoordinates(midDeg, RADIUS * 0.91);
      return (
        <SvgText
          key={`zodiac-symbol-${i}`}
          x={pos.x}
          y={pos.y + 4}
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Inter"
        >
          {symbol}
        </SvgText>
      );
    });

    const planetPoints = planets.map((p, idx) => {
      const symbol = PLANET_SYMBOLS[p.name] || '?';
      const radOffset = (idx % 2 === 0) ? 0.65 : 0.55;
      const pos = getCoordinates(p.longitude, RADIUS * radOffset);
      const isSelected = selectedPlanet === p.name;

      return (
        <G 
          key={`planet-${idx}`}
          onPress={() => {
            setSelectedPlanet(isSelected ? null : p.name);
            setSelectedHouse(null);
          }}
        >
          {isSelected && (
            <Circle
              cx={pos.x}
              cy={pos.y}
              r="14"
              fill="rgba(212, 175, 55, 0.25)"
              stroke="#D4AF37"
              strokeWidth="1"
            />
          )}
          <Circle
            cx={pos.x}
            cy={pos.y}
            r="4.5"
            fill={isSelected ? "#D4AF37" : "#ffffff"}
          />
          <SvgText
            x={pos.x}
            y={pos.y - 10}
            fill={isSelected ? "#D4AF37" : "#ffffff"}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="Inter"
          >
            {symbol}
          </SvgText>
        </G>
      );
    });

    return (
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="transparent" />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.82} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" fill="transparent" />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.45} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" fill="transparent" />
        {zodiacLines}
        {houseLines}
        {zodiacSymbols}
        {aspectLines}
        {planetPoints}
      </Svg>
    );
  }, [computedChart, selectedPlanet, selectedHouse]);

  const interpretations = useMemo(() => {
    if (!computedChart) return null;

    const sunPlanet = computedChart.planets.find(p => p.name === 'Sun');
    const moonPlanet = computedChart.planets.find(p => p.name === 'Moon');
    
    const sunSign = sunPlanet ? sunPlanet.sign : 'Koç';
    const moonSign = moonPlanet ? moonPlanet.sign : 'Koç';
    
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
    <View style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      {/* Background Ethereal Auras */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            opacity: 0.15,
          },
          animatedAuraStyle1
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 100,
            left: -100,
            width: 320,
            height: 320,
            borderRadius: 160,
            opacity: 0.12,
          },
          animatedAuraStyle2
        ]}
      />

      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Kozmik Harita</Text>
            <Text style={styles.subtitle}>Doğum Anınızdaki Gezegen Hizalanmaları</Text>
          </View>

          {computedChart ? (
            <View style={styles.chartContainer}>
              <View style={styles.wheelWrapper}>
                {svgContent}
              </View>

              {/* Interactive Detail Panel */}
              {selectedPlanet && (() => {
                const p = computedChart.planets.find(item => item.name === selectedPlanet);
                if (!p) return null;
                const symbol = PLANET_SYMBOLS[p.name] || '•';
                const nameTR = PLANET_NAME_TR[p.name] || p.name;
                
                const kw = PLANET_KEYWORDS[p.name];
                const themeText = kw ? kw.theme : 'yaşam yolculuğunuzda bu hayat alanını etkiler.';
                const signText = SIGN_KEYWORDS[p.sign] || 'kendine has bir üslupla';
                const houseText = HOUSE_KEYWORDS[p.house] || 'yaşam alanlarınızda etkili olur.';
                
                return (
                  <GlassCard style={styles.interactiveDetailsCard}>
                    <View style={styles.detailsHeader}>
                      <View style={styles.detailsHeaderLeft}>
                        <Text style={styles.detailsSymbol}>{symbol}</Text>
                        <View>
                          <Text style={styles.detailsTitle}>{nameTR} {p.sign} Burcunda</Text>
                          <Text style={styles.detailsSubtitle}>{p.house}. Ev | {formatPlanetDegree(p.longitude, p.sign)}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => setSelectedPlanet(null)} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    </View>
                    <Text style={styles.detailsBody}>
                      Astrolojide {nameTR}, {themeText} Gezegeninizin bu konumu, enerjisini {signText} yansıtır ve özellikle {houseText}
                    </Text>
                  </GlassCard>
                );
              })()}

              {selectedHouse && (() => {
                const houseNum = selectedHouse;
                const houseText = HOUSE_KEYWORDS[houseNum] || 'bu yaşam alanındaki konuları simgeler.';
                const houseTitle = houseNum === 1 ? '1. Ev (Yükselen / Ascendant)' :
                                   houseNum === 10 ? '10. Ev (Başucu Noktası / Midheaven)' : `${houseNum}. Ev`;
                
                const cuspDegree = computedChart.houses[houseNum - 1];
                const cuspSignInfo = getZodiacSign(cuspDegree);
                const cuspSign = cuspSignInfo ? cuspSignInfo.turkish : 'Koç';
                
                return (
                  <GlassCard style={styles.interactiveDetailsCard}>
                    <View style={styles.detailsHeader}>
                      <View style={styles.detailsHeaderLeft}>
                        <Text style={styles.detailsSymbol}>🏠</Text>
                        <View>
                          <Text style={styles.detailsTitle}>{houseTitle}</Text>
                          <Text style={styles.detailsSubtitle}>{cuspSign} Burcu Cusp Başlangıcı | {formatPlanetDegree(cuspDegree, cuspSign)}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => setSelectedHouse(null)} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    </View>
                    <Text style={styles.detailsBody}>
                      Bu ev başlangıcı yaşamınızda {houseText} Giriş derecesi {cuspSign} burcunda olduğu için bu hayat alanındaki deneyimlerinizi {cuspSign} enerjisiyle şekillendirirsiniz.
                    </Text>
                  </GlassCard>
                );
              })()}

              {/* AI Report Button */}
              <Pressable 
                onPress={handleFetchAIAnalysis}
                style={styles.aiButtonPressable}
              >
                <View style={styles.aiButton}>
                  <Ionicons name="sparkles" size={18} color="#0B0F19" style={{ marginRight: 6 }} />
                  <Text style={styles.aiButtonText}>Kapsamlı Harita Analizi (Gemini AI)</Text>
                </View>
              </Pressable>

              {/* Detailed Astrology Interpretations (accordion sections) */}
              <Text style={styles.sectionDividerTitle}>Derinlikli Astroloji Analizleri</Text>
              <ChartSection title="Üç Büyükler: Güneş • Ay • Yükselen" emoji="🌟" isOpen={openSection === 0} onToggle={() => toggleSection(0)}>
              {interpretations && (
                <View style={styles.interpretationsList}>
                  {/* Sun Interpretation Card */}
                  <GlassCard style={styles.interpretationCard}>
                    <View style={styles.interpHeaderRow}>
                      <Text style={styles.interpHeaderEmoji}>☀️</Text>
                      <View style={styles.interpHeaderDetails}>
                        <Text style={styles.interpPlacementTitle}>Güneş {interpretations.sun.sign} Burcunda ({interpretations.sun.house}. Ev)</Text>
                        <Text style={styles.interpArchetypeText}>Temsili Karakter: {interpretations.sun.archetype}</Text>
                      </View>
                    </View>
                    <Text style={styles.interpBodyText}>{interpretations.sun.ego}</Text>
                    <View style={styles.interpAdviceBox}>
                      <Text style={styles.interpAdviceTitle}>🔑 Gelişim & Yaşam Önerisi</Text>
                      <Text style={styles.interpAdviceText}>{interpretations.sun.advice}</Text>
                    </View>
                  </GlassCard>

                  {/* Moon Interpretation Card */}
                  <GlassCard style={styles.interpretationCard}>
                    <View style={styles.interpHeaderRow}>
                      <Text style={styles.interpHeaderEmoji}>☽</Text>
                      <View style={styles.interpHeaderDetails}>
                        <Text style={styles.interpPlacementTitle}>Ay {interpretations.moon.sign} Burcunda ({interpretations.moon.house}. Ev)</Text>
                        <Text style={styles.interpArchetypeText}>Temsili Karakter: {interpretations.moon.archetype}</Text>
                      </View>
                    </View>
                    <Text style={styles.interpBodyText}>{interpretations.moon.shadow}</Text>
                    <View style={styles.interpAdviceBox}>
                      <Text style={styles.interpAdviceTitle}>🔑 Duygusal Denge & Huzur Önerisi</Text>
                      <Text style={styles.interpAdviceText}>{interpretations.moon.advice}</Text>
                    </View>
                  </GlassCard>

                  {/* Ascendant Interpretation Card */}
                  <GlassCard style={styles.interpretationCard}>
                    <View style={styles.interpHeaderRow}>
                      <Text style={styles.interpHeaderEmoji}>✨</Text>
                      <View style={styles.interpHeaderDetails}>
                        <Text style={styles.interpPlacementTitle}>Yükselen {interpretations.asc.sign} Burcu</Text>
                        <Text style={styles.interpArchetypeText}>Temsili Karakter: {interpretations.asc.archetype}</Text>
                      </View>
                    </View>
                    <Text style={styles.interpBodyText}>{interpretations.asc.persona}</Text>
                    <View style={styles.interpAdviceBox}>
                      <Text style={styles.interpAdviceTitle}>🔑 Sosyal İlişkiler Önerisi</Text>
                      <Text style={styles.interpAdviceText}>{interpretations.asc.advice}</Text>
                    </View>
                  </GlassCard>
                </View>
              )}
              </ChartSection>

              <ChartSection title="Gezegen Yerleşimleri" emoji="🪐" isOpen={openSection === 1} onToggle={() => toggleSection(1)}>
                <View style={styles.interpretationsList}>
                  {/* Placements Cards for other Planets */}
                  {isPremium ? (
                    planetPlacements.map((p, idx) => p && (
                      <GlassCard key={idx} style={styles.interpretationCard}>
                        <View style={styles.interpHeaderRow}>
                          <Text style={styles.interpHeaderEmoji}>{p.symbol}</Text>
                          <View style={styles.interpHeaderDetails}>
                            <Text style={styles.interpPlacementTitle}>{p.placement} {p.retrograde ? ' ℞' : ''}</Text>
                            <Text style={styles.interpArchetypeText}>Temsili Karakter: {p.archetype} • {p.degree}</Text>
                          </View>
                        </View>
                        <Text style={styles.interpBodyText}>{p.description}</Text>
                      </GlassCard>
                    ))
                  ) : (
                    <GlassCard style={styles.lockedPlacementsCard}>
                      <Ionicons name="lock-closed" size={20} color="#ffffff" style={{ marginBottom: 8 }} />
                      <Text style={styles.lockedText}>
                        Merkür, Venüs, Mars ve diğer gezegen konumlarının derinlemesine analizleri Stellium Elite üyelerine özeldir.
                      </Text>
                      <Pressable onPress={() => router.push('/settings')} style={styles.unlockInlineBtn}>
                        <Text style={styles.unlockInlineText}>Tüm Gezegen Analizlerini Aç →</Text>
                      </Pressable>
                    </GlassCard>
                  )}
                </View>
              </ChartSection>

              {/* Natal Aspects Calculation Section */}
              <ChartSection title="Açı İlişkileri (Aspects)" emoji="📐" isOpen={openSection === 2} onToggle={() => toggleSection(2)}>
              <GlassCard style={styles.aspectsCard}>
                {isPremium ? (
                  aspects.length > 0 ? (
                    <View style={styles.aspectsList}>
                      {aspects.map((aspect, idx) => (
                        <View key={idx} style={styles.aspectItem}>
                          <View style={styles.aspectRow}>
                            <View style={styles.aspectLeft}>
                              <Text style={[styles.aspectSymbol, { color: aspect.color }]}>{aspect.symbol}</Text>
                              <Text style={styles.aspectText}>
                                {aspect.p1Name} <Text style={{ color: aspect.color }}>{aspect.label}</Text> {aspect.p2Name}
                              </Text>
                            </View>
                            <Text style={styles.aspectDiff}>({aspect.diff}°)</Text>
                          </View>
                          <Text style={styles.aspectDescriptionText}>
                            {getAspectDescription(aspect.p1Name, aspect.p2Name, aspect.aspectType || aspect.type)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noAspectsText}>Haritanızda majör açı ilişkisi bulunmuyor.</Text>
                  )
                ) : (
                  <View style={styles.lockedContainer}>
                    <Ionicons name="lock-closed" size={20} color="#ffffff" style={{ marginBottom: 6 }} />
                    <Text style={styles.lockedText}>Açı İlişkileri Stellium Elite Üyelerine Özeldir.</Text>
                    <Pressable onPress={() => router.push('/settings')} style={styles.unlockInlineBtn}>
                      <Text style={styles.unlockInlineText}>Elite Üyeliğe Geç →</Text>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
              </ChartSection>

              {/* Technical details: planet table, house cusps, balances */}
              <ChartSection title="Teknik Detaylar: Konumlar & Evler" emoji="📊" isOpen={openSection === 3} onToggle={() => toggleSection(3)}>
              <Text style={styles.techSubTitle}>Gezegen Konumları</Text>
              <GlassCard style={styles.planetTableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Gezegen</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Burç & Derece</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Ev</Text>
                </View>
                {computedChart.planets.map((p, idx) => {
                  const symbol = PLANET_SYMBOLS[p.name] || '•';
                  const planetNameTR = p.name === 'Sun' ? 'Güneş' :
                                       p.name === 'Moon' ? 'Ay' :
                                       p.name === 'Mercury' ? 'Merkür' :
                                       p.name === 'Venus' ? 'Venüs' :
                                       p.name === 'Mars' ? 'Mars' :
                                       p.name === 'Jupiter' ? 'Jüpiter' :
                                       p.name === 'Saturn' ? 'Satürn' :
                                       p.name === 'Uranus' ? 'Uranüs' :
                                       p.name === 'Neptune' ? 'Neptün' :
                                       p.name === 'Pluto' ? 'Plüton' : p.name;
                  return (
                    <View key={idx} style={[styles.tableRowGrid, idx % 2 === 1 && styles.tableRowGridAlt]}>
                      <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.tablePlanetSymbol}>{symbol}</Text>
                        <Text style={styles.tablePlanetName}>{planetNameTR}</Text>
                        {p.retrograde && <Text style={styles.tableRetro}>R</Text>}
                      </View>
                      <Text style={[styles.tableCellGrid, styles.tablePlanetSign, { flex: 1.6 }]}>
                        {formatPlanetDegree(p.longitude, p.sign)}
                      </Text>
                      <Text style={[styles.tableCellGrid, styles.tablePlanetHouse, { flex: 1, textAlign: 'right' }]}>
                        {p.house}. Ev
                      </Text>
                    </View>
                  );
                })}
              </GlassCard>

              {/* Sensitive points: Nodes, Chiron, Lilith, Fortuna */}
              {computedChart.points && computedChart.points.length > 0 && (
                <>
                  <Text style={styles.techSubTitle}>Özel Noktalar</Text>
                  <GlassCard style={styles.planetTableCard}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Nokta</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Burç & Derece</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Ev</Text>
                    </View>
                    {computedChart.points.map((pt, idx) => (
                      <View key={idx} style={[styles.tableRowGrid, idx % 2 === 1 && styles.tableRowGridAlt]}>
                        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.tablePlanetSymbol}>{pt.symbol}</Text>
                          <Text style={styles.tablePlanetName} numberOfLines={1}>{pt.turkish}{pt.approximate ? ' ~' : ''}</Text>
                        </View>
                        <Text style={[styles.tableCellGrid, styles.tablePlanetSign, { flex: 1.4 }]}>
                          {formatPlanetDegree(pt.longitude, pt.sign)}
                        </Text>
                        <Text style={[styles.tableCellGrid, styles.tablePlanetHouse, { flex: 0.8, textAlign: 'right' }]}>
                          {pt.house}. Ev
                        </Text>
                      </View>
                    ))}
                    <Text style={styles.tableFootnote}>~ Chiron konumu yaklaşık modelle hesaplanır (±1°).</Text>
                  </GlassCard>
                </>
              )}

              {/* Aspect patterns — the app's namesake */}
              {computedChart.patterns && computedChart.patterns.length > 0 && (
                <>
                  <Text style={styles.techSubTitle}>Açı Kalıpları</Text>
                  {computedChart.patterns.map((pat, idx) => (
                    <GlassCard key={idx} style={styles.patternCard}>
                      <Text style={styles.patternTitle}>✨ {pat.title}</Text>
                      <Text style={styles.patternMembers}>{pat.members.join(' • ')}</Text>
                      <Text style={styles.patternDetail}>{pat.detail}</Text>
                    </GlassCard>
                  ))}
                </>
              )}

              {/* House cusp table */}
              <Text style={styles.techSubTitle}>
                Ev Başlangıçları ({computedChart.houseSystem === 'placidus' ? 'Placidus' : computedChart.houseSystem === 'whole' ? 'Tam Burç' : 'Eşit Ev'})
              </Text>
              <GlassCard style={styles.planetTableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Ev</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Burç</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Derece</Text>
                </View>
                {houseCusps.map((h, idx) => (
                  <View key={idx} style={[styles.tableRowGrid, idx % 2 === 1 && styles.tableRowGridAlt]}>
                    <Text style={[styles.tableCellGrid, { flex: 1 }]}>{h.house}. Ev</Text>
                    <Text style={[styles.tableCellGrid, styles.tablePlanetSign, { flex: 1.4 }]}>{h.symbol} {h.sign}</Text>
                    <Text style={[styles.tableCellGrid, { flex: 1, textAlign: 'right' }]}>{h.degree}</Text>
                  </View>
                ))}
                {computedChart.polarFallback && (
                  <Text style={styles.tableFootnote}>Kutup enlemi nedeniyle Placidus yerine Tam Burç sistemi kullanıldı.</Text>
                )}
              </GlassCard>

              {/* Element Percentages Panel */}
              <Text style={styles.techSubTitle}>Element & Nitelik Dengesi</Text>
              <GlassCard style={styles.elementCard}>
                {elementPercentages && Object.entries(elementPercentages).map(([el, pct], idx) => {
                  const colors: Record<string, string> = {
                    Ateş: '#FF9E9E',
                    Toprak: '#A3E4D7',
                    Hava: '#AED6F1',
                    Su: '#D7BDE2'
                  };
                  const barColor = colors[el] || '#ffffff';
                  return (
                    <View key={idx} style={styles.elementRow}>
                      <View style={styles.elementLabelRow}>
                        <Text style={styles.elementLabel}>{el}</Text>
                        <Text style={[styles.elementPct, { color: barColor }]}>%{pct}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })}

                {balanceInfo && (
                  <View style={styles.modalityRow}>
                    {(Object.entries(balanceInfo.modalityCounts) as [string, number][]).map(([mod, count]) => (
                      <View key={mod} style={styles.modalityChip}>
                        <Text style={styles.modalityChipCount}>{count}</Text>
                        <Text style={styles.modalityChipLabel}>{mod}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {balanceInfo && (
                  <Text style={styles.balanceNarrative}>{balanceInfo.narrative}</Text>
                )}
              </GlassCard>
              </ChartSection>
            </View>
          ) : (
            <GlassCard style={styles.errorCard}>
              <Text style={styles.errorText}>
                Lütfen önce doğum haritanızı oluşturmak için profilinizi tamamlayın.
              </Text>
            </GlassCard>
          )}
        </ScrollView>

        {/* AI Report Full-Screen Modal */}
        <Modal
          visible={aiModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAiModalVisible(false)}
        >
          <View style={styles.modalBg}>
            <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kapsamlı Harita Analizi</Text>
                <Pressable onPress={() => setAiModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </Pressable>
              </View>

              {loadingAI ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Yıldız haritanız yapay zeka ile tahlil ediliyor...</Text>
                  <Text style={styles.loadingSubtext}>Bu işlem yaklaşık 10-15 saniye sürebilir.</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  {aiReport && typeof aiReport === 'object' ? (
                    <>
                      <View style={styles.tabContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                          <Pressable style={[styles.tabButton, activeTab === 'bigThree' && styles.tabButtonActive]} onPress={() => setActiveTab('bigThree')}>
                            <Text style={[styles.tabText, activeTab === 'bigThree' && styles.tabTextActive]}>Genel Mizaç</Text>
                          </Pressable>
                          <Pressable style={[styles.tabButton, activeTab === 'mental' && styles.tabButtonActive]} onPress={() => setActiveTab('mental')}>
                            <Text style={[styles.tabText, activeTab === 'mental' && styles.tabTextActive]}>Zihin & Analiz</Text>
                          </Pressable>
                          <Pressable style={[styles.tabButton, activeTab === 'love' && styles.tabButtonActive]} onPress={() => setActiveTab('love')}>
                            <Text style={[styles.tabText, activeTab === 'love' && styles.tabTextActive]}>Aşk & Bereket</Text>
                          </Pressable>
                          <Pressable style={[styles.tabButton, activeTab === 'lessons' && styles.tabButtonActive]} onPress={() => setActiveTab('lessons')}>
                            <Text style={[styles.tabText, activeTab === 'lessons' && styles.tabTextActive]}>Sınavlar & Gelecek</Text>
                          </Pressable>
                        </ScrollView>
                      </View>
                      
                      <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                        {activeTab === 'bigThree' && (
                          <View style={styles.reportSection}>
                            <Text style={styles.reportSectionTitle}>🪐 Yükselen, Güneş ve Ay Sentezi</Text>
                            <Text style={styles.modalReportText}>{aiReport.bigThree}</Text>
                          </View>
                        )}
                        {activeTab === 'mental' && (
                          <View style={styles.reportSection}>
                            <Text style={styles.reportSectionTitle}>🧠 Zihinsel Kapasite ve İletişim</Text>
                            <Text style={styles.modalReportText}>{aiReport.mentalAndCommunication}</Text>
                            
                            <Text style={styles.reportSectionTitle}>🔥 İrade Gücü ve Mücadele</Text>
                            <Text style={styles.modalReportText}>{aiReport.willpowerAndStruggle}</Text>
                          </View>
                        )}
                        {activeTab === 'love' && (
                          <View style={styles.reportSection}>
                            <Text style={styles.reportSectionTitle}>❤️ Sevgi Dili ve Finansal Bereket</Text>
                            <Text style={styles.modalReportText}>{aiReport.loveAndFinance}</Text>
                          </View>
                        )}
                        {activeTab === 'lessons' && (
                          <View style={styles.reportSection}>
                            <Text style={styles.reportSectionTitle}>⚠️ Satürn Dersleri ve Sınavlar</Text>
                            <Text style={styles.modalReportText}>{aiReport.saturnLessons}</Text>
                            
                            <Text style={styles.reportSectionTitle}>🚨 Güncel Riskler</Text>
                            <Text style={styles.modalReportText}>{aiReport.currentRisks}</Text>

                            <Text style={styles.reportSectionTitle}>🗓️ Yakın Dönem Projeksiyonu</Text>
                            <Text style={styles.modalReportText}>{aiReport.projection}</Text>

                            <Text style={styles.reportSectionTitle}>🔮 Uzun Vadeli Strateji</Text>
                            <Text style={styles.modalReportText}>{aiReport.longTerm}</Text>
                          </View>
                        )}
                      </ScrollView>
                    </>
                  ) : (
                    <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                      {aiReport ? (
                        <Text style={styles.modalReportText}>{typeof aiReport === 'string' ? aiReport : 'Hata'}</Text>
                      ) : (
                        <Text style={styles.modalReportText}>Analiz yüklenemedi. Lütfen tekrar deneyin.</Text>
                      )}
                    </ScrollView>
                  )}
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'InterBold',
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  wheelWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  aiButtonPressable: {
    width: '100%',
    marginBottom: 24,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37', // Premium Gold
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  aiButtonText: {
    color: '#0B0F19', // Deep dark navy theme color
    fontFamily: 'InterBold',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionDividerTitle: {
    fontFamily: 'InterBold',
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 24,
    marginBottom: 12,
  },
  elementCard: {
    width: '100%',
    padding: 18,
    gap: 14,
    marginBottom: 10,
  },
  elementRow: {
    width: '100%',
  },
  elementLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  elementLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  elementPct: {
    fontFamily: 'InterBold',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  table: {
    width: '100%',
    gap: 8,
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
    color: '#ffffff',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  planetName: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planetSign: {
    fontFamily: 'Inter',
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  planetHouse: {
    fontFamily: 'Inter',
    fontSize: 13.5,
    color: '#ffffff',
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  retroBadge: {
    color: '#FF7B72',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 123, 114, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 114, 0.25)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  aspectsCard: {
    width: '100%',
    padding: 16,
  },
  aspectsList: {
    gap: 10,
  },
  aspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aspectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aspectSymbol: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  aspectText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  aspectDiff: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  noAspectsText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  aspectItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  aspectDescriptionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
    paddingLeft: 30,
    lineHeight: 16,
  },
  planetTableCard: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontFamily: 'InterBold',
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '700',
  },
  tableRowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowGridAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableCellGrid: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF0',
  },
  tablePlanetSymbol: {
    fontSize: 14,
  },
  tablePlanetName: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tableRetro: {
    fontFamily: 'InterBold',
    fontSize: 9,
    color: '#FF7B72',
    backgroundColor: 'rgba(255, 123, 114, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 123, 114, 0.25)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    fontWeight: '700',
  },
  tablePlanetSign: {
    color: '#8B949E',
  },
  tablePlanetHouse: {
    color: '#D4AF37',
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
  interpretationsList: {
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  interpretationCard: {
    padding: 16,
  },
  interpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  interpHeaderEmoji: {
    fontSize: 22,
    color: '#ffffff',
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  interpHeaderDetails: {
    flex: 1,
  },
  interpPlacementTitle: {
    fontFamily: 'InterBold',
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  interpArchetypeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  interpBodyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 19,
    marginBottom: 12,
  },
  interpAdviceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeftWidth: 2,
    borderLeftColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
  },
  interpAdviceTitle: {
    fontFamily: 'InterBold',
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  interpAdviceText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontFamily: 'InterBold',
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontFamily: 'InterBold',
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    textAlign: 'center',
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  modalReportText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
  },
  lockedContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  unlockInlineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  unlockInlineText: {
    fontFamily: 'InterBold',
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedPlacementsCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactiveDetailsCard: {
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsSymbol: {
    fontSize: 28,
    color: '#D4AF37',
    marginRight: 8,
  },
  detailsTitle: {
    fontFamily: 'InterBold',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  detailsSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  detailsBody: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 22,
    color: '#E6EDF0',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
  reportSection: {
    gap: 8,
  },
  reportSectionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 16,
    marginBottom: 4,
  },
  chartSectionCard: {
    backgroundColor: '#12161F',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  chartSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  chartSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chartSectionEmoji: {
    fontSize: 17,
  },
  chartSectionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F6FC',
    flex: 1,
  },
  chartSectionContent: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  techSubTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  modalityChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalityChipCount: {
    fontFamily: 'InterBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
  },
  modalityChipLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balanceNarrative: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#E6EDF0',
    lineHeight: 20,
    marginTop: 12,
  },
  tableFootnote: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 8,
    lineHeight: 14,
  },
  patternCard: {
    marginBottom: 10,
    padding: 14,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
  },
  patternTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  patternMembers: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 3,
  },
  patternDetail: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF0',
    lineHeight: 18,
    marginTop: 8,
  },
});
