// Shared prompt infrastructure: model chain, grounding rules, zod schemas.
// "Hesap konuşur, model yorumlar" — the AI receives fully computed data and
// is explicitly forbidden from inventing positions.

import { z } from 'zod';

// H9: single source of truth for models. Speculative names removed; the env
// var allows hotfixing a newer model without an app release.
export const MODEL_CHAIN = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
].filter((m): m is string => !!m && m.length > 0);

// Every prompt carries this block — authority means verifiability.
export const GROUNDING_BLOCK = `
[GROUNDING — KESİN KURALLAR]
1. YALNIZCA sana bu promptta verilen konum/açı/derece/tarih verilerini kullan.
2. Verilmeyen hiçbir gezegen konumu, açı, ev veya derece UYDURMA ve zikretme.
3. Tarih ve dereceleri sana verildiği gibi aktar; kendi hesap yapmaya çalışma.
4. Emin olmadığın astronomik bilgiyi yazma; verilen listede yoksa yok say.
`;

// Content-language policy (App Store 5.0 alignment + responsible tone).
export const LANGUAGE_RULES_BLOCK = `
[İÇERİK DİLİ KURALLARI]
1. Sağlık ve finans konularında kesin hüküm dili kullanma ("kesin olacak" değil,
   "destekleyebilir", "gözlemleyin", "uzmanına danışın" çerçevesi).
2. Korku yaratma; zorlukları büyüme fırsatı diliyle çerçevele.
3. Çıktı dili Türkçe, ton: bilge, sarmalayıcı, analitik — falcı klişesi yasak.
`;

// ---------- zod schemas (H10: no unvalidated JSON reaches the UI) ----------

const longText = z.string().min(40);

export const DailySchema = z.object({
  cosmic_vibe: z.string().min(5),
  general_analysis: longText,
  love_and_relationships: longText,
  career_and_manifest: longText,
  ritual_of_the_day: z.object({
    title: z.string().min(2),
    instructions: z.string().min(20),
  }),
});
export type DailyResult = z.infer<typeof DailySchema>;

export const TransitSchema = z.object({
  potentials: longText,
  houseReflections: longText,
  risks: longText,
  opportunities: longText,
});
export type TransitResult = z.infer<typeof TransitSchema>;

export const SynastrySchema = z.object({
  loveAndAttraction: longText,
  communication: longText,
  friction: longText,
  harmonyGuide: longText,
});
export type SynastryResult = z.infer<typeof SynastrySchema>;

export const YildiznameSchema = z.object({
  ebcedDestiny: longText,
  elementTemperament: longText,
  spiritualObstacles: longText,
  protectionEsma: longText,
});
export type YildiznameResult = z.infer<typeof YildiznameSchema>;

export const NatalSchema = z.object({
  bigThree: longText,
  mentalAndCommunication: longText,
  loveAndFinance: longText,
  willpowerAndStruggle: longText,
  saturnLessons: longText,
  projection: longText,
  currentRisks: longText,
  longTerm: longText,
});
export type NatalResult = z.infer<typeof NatalSchema>;

// Compact chart serializer shared by the builders: turns computed data into
// a readable, unambiguous block for the model.
type PlanetLike = { name: string; sign: string; house: number; retrograde?: boolean; speed?: number };
type PointLike = { turkish: string; sign: string; house: number };

const TRP: Record<string, string> = {
  Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars',
  Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton',
};

export function serializeChart(opts: {
  planets: PlanetLike[];
  ascendantSign?: string;
  midheavenSign?: string;
  houseSystem?: string;
  points?: PointLike[];
  aspects?: { planet1: string; planet2: string; aspectTypeTurkish: string; orb: number; isApplying: boolean }[];
  patterns?: { title: string; members: string[] }[];
  dstNote?: boolean;
}): string {
  const lines: string[] = [];
  lines.push('NATAL GEZEGENLER:');
  for (const p of opts.planets) {
    lines.push(`- ${TRP[p.name] || p.name}: ${p.sign} burcunda, ${p.house}. evde${p.retrograde ? ', RETRO' : ''}${typeof p.speed === 'number' ? `, hız ${p.speed}°/gün` : ''}`);
  }
  if (opts.ascendantSign) lines.push(`- Yükselen (ASC): ${opts.ascendantSign}`);
  if (opts.midheavenSign) lines.push(`- Tepe Noktası (MC): ${opts.midheavenSign}`);
  if (opts.houseSystem) lines.push(`EV SİSTEMİ: ${opts.houseSystem}`);
  if (opts.points && opts.points.length) {
    lines.push('ÖZEL NOKTALAR:');
    for (const pt of opts.points) lines.push(`- ${pt.turkish}: ${pt.sign} burcunda, ${pt.house}. evde`);
  }
  if (opts.aspects && opts.aspects.length) {
    lines.push('NATAL AÇILAR (dar orb önce):');
    const sorted = [...opts.aspects].sort((a, b) => a.orb - b.orb).slice(0, 18);
    for (const a of sorted) {
      lines.push(`- ${TRP[a.planet1] || a.planet1} ${a.aspectTypeTurkish} ${TRP[a.planet2] || a.planet2} (orb ${a.orb}°, ${a.isApplying ? 'applying' : 'separating'})`);
    }
  }
  if (opts.patterns && opts.patterns.length) {
    lines.push('AÇI KALIPLARI:');
    for (const p of opts.patterns) lines.push(`- ${p.title}: ${p.members.join(', ')}`);
  }
  if (opts.dstNote) {
    lines.push('Not: doğum saati Türkiye tarihsel yaz saati kuralıyla düzeltilmiştir.');
  }
  return lines.join('\n');
}
