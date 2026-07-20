// Aspect pattern detection: the app is literally named after the stellium,
// so it had better find one. Pure functions over computed chart data.

export interface ChartPatternInput {
  name: string;
  longitude: number;
  sign: string;
  house: number;
}

export interface DetectedPattern {
  type: 'stellium-sign' | 'stellium-house' | 't-square' | 'grand-trine' | 'grand-cross' | 'yod' | 'kite';
  title: string;
  members: string[];
  detail: string;
}

const TR: Record<string, string> = {
  Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars',
  Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton',
};
const tr = (n: string) => TR[n] || n;

function sep(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function hasAspect(a: ChartPatternInput, b: ChartPatternInput, angle: number, orb: number): boolean {
  return Math.abs(sep(a.longitude, b.longitude) - angle) <= orb;
}

export function detectPatterns(planets: ChartPatternInput[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const P = planets;

  // --- Stellium by sign (≥3 planets in the same sign) ---
  const bySign = new Map<string, ChartPatternInput[]>();
  for (const p of P) {
    if (!bySign.has(p.sign)) bySign.set(p.sign, []);
    bySign.get(p.sign)!.push(p);
  }
  for (const [sign, members] of bySign) {
    if (members.length >= 3) {
      patterns.push({
        type: 'stellium-sign',
        title: `Stellium: ${sign}`,
        members: members.map(m => tr(m.name)),
        detail: `${members.map(m => tr(m.name)).join(', ')} — ${members.length} gezegen ${sign} burcunda toplanmış. Bu yoğunlaşma, ${sign} temalarını hayatınızın ana motoru yapar: bu burcun dersleri sıradan bir vurgu değil, kaderinizin ağırlık merkezidir.`,
      });
    }
  }

  // --- Stellium by house ---
  const byHouse = new Map<number, ChartPatternInput[]>();
  for (const p of P) {
    if (!byHouse.has(p.house)) byHouse.set(p.house, []);
    byHouse.get(p.house)!.push(p);
  }
  for (const [house, members] of byHouse) {
    if (members.length >= 3) {
      // Avoid duplicating an identical sign-stellium grouping
      const sameAsSign = patterns.some(pt => pt.type === 'stellium-sign' && pt.members.length === members.length && members.every(m => pt.members.includes(tr(m.name))));
      if (!sameAsSign) {
        patterns.push({
          type: 'stellium-house',
          title: `Stellium: ${house}. Ev`,
          members: members.map(m => tr(m.name)),
          detail: `${members.map(m => tr(m.name)).join(', ')} — ${members.length} gezegen ${house}. evde buluşmuş. Bu yaşam alanı sizin için tekrar eden, yoğun ve dönüştürücü bir sahnedir.`,
        });
      }
    }
  }

  // --- T-Square: two squares to a common apex + an opposition between the ends ---
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      if (!hasAspect(P[i], P[j], 180, 8)) continue;
      for (let k = 0; k < P.length; k++) {
        if (k === i || k === j) continue;
        if (hasAspect(P[k], P[i], 90, 7) && hasAspect(P[k], P[j], 90, 7)) {
          patterns.push({
            type: 't-square',
            title: `T-Kare (odak: ${tr(P[k].name)})`,
            members: [tr(P[i].name), tr(P[j].name), tr(P[k].name)],
            detail: `${tr(P[i].name)} ile ${tr(P[j].name)} karşıtlığının gerilimi ${tr(P[k].name)} üzerinde düğümleniyor. Bu klasik motor kalıbı, ${tr(P[k].name)} temalarında sürekli üretmeye iten yaratıcı bir baskı oluşturur.`,
          });
        }
      }
    }
  }

  // --- Grand Trine ---
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      for (let k = j + 1; k < P.length; k++) {
        if (hasAspect(P[i], P[j], 120, 7) && hasAspect(P[j], P[k], 120, 7) && hasAspect(P[i], P[k], 120, 7)) {
          patterns.push({
            type: 'grand-trine',
            title: 'Büyük Üçgen',
            members: [tr(P[i].name), tr(P[j].name), tr(P[k].name)],
            detail: `${tr(P[i].name)}, ${tr(P[j].name)} ve ${tr(P[k].name)} arasında kapalı bir uyum devresi. Yetenek kendiliğinden akar; bilinçli kullanılmazsa atalete de dönüşebilir.`,
          });
        }
      }
    }
  }

  // --- Grand Cross: two oppositions crossing with four squares ---
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      if (!hasAspect(P[i], P[j], 180, 8)) continue;
      for (let k = 0; k < P.length; k++) {
        if (k === i || k === j) continue;
        for (let l = k + 1; l < P.length; l++) {
          if (l === i || l === j) continue;
          if (
            hasAspect(P[k], P[l], 180, 8) &&
            hasAspect(P[i], P[k], 90, 7) && hasAspect(P[i], P[l], 90, 7) &&
            hasAspect(P[j], P[k], 90, 7) && hasAspect(P[j], P[l], 90, 7)
          ) {
            patterns.push({
              type: 'grand-cross',
              title: 'Büyük Kare',
              members: [tr(P[i].name), tr(P[j].name), tr(P[k].name), tr(P[l].name)],
              detail: 'Dört gezegen arasında çift karşıtlık ve dört kare: olağanüstü bir iç gerilim ve aynı ölçüde olağanüstü bir dayanıklılık kalıbı.',
            });
          }
        }
      }
    }
  }

  // --- Yod: two quincunxes to an apex + sextile between the base pair ---
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      if (!hasAspect(P[i], P[j], 60, 4)) continue;
      for (let k = 0; k < P.length; k++) {
        if (k === i || k === j) continue;
        if (hasAspect(P[k], P[i], 150, 3) && hasAspect(P[k], P[j], 150, 3)) {
          patterns.push({
            type: 'yod',
            title: `Yod — Kaderin Parmağı (odak: ${tr(P[k].name)})`,
            members: [tr(P[i].name), tr(P[j].name), tr(P[k].name)],
            detail: `${tr(P[k].name)} noktasına işaret eden bu nadir kalıp, hayatınızda "ayarlanması gereken" kadersel bir odak alanına işaret eder.`,
          });
        }
      }
    }
  }

  // --- Kite: grand trine + a planet opposing one corner, sextile to the others ---
  const grandTrines = patterns.filter(p => p.type === 'grand-trine');
  for (const gt of grandTrines) {
    const corners = P.filter(p => gt.members.includes(tr(p.name)));
    for (const tail of P) {
      if (gt.members.includes(tr(tail.name))) continue;
      const opposed = corners.find(c => hasAspect(tail, c, 180, 7));
      if (opposed && corners.filter(c => c !== opposed).every(c => hasAspect(tail, c, 60, 5))) {
        patterns.push({
          type: 'kite',
          title: `Uçurtma (uç: ${tr(tail.name)})`,
          members: [...gt.members, tr(tail.name)],
          detail: `Büyük Üçgen'in serbest akan yeteneği ${tr(tail.name)} ucuyla yön kazanıyor: potansiyeli somut hedefe çeviren nadir bir kalıp.`,
        });
      }
    }
  }

  // Deduplicate identical member sets of the same type
  const seen = new Set<string>();
  return patterns.filter(p => {
    const key = p.type + '|' + [...p.members].sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
