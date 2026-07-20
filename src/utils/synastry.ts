// Synastry mathematics (pure): inter-aspect matrix between two charts,
// house overlays (whose planet lands in whose house), and the composite
// (midpoint) chart. All computed in TypeScript and handed to the AI as data.

import { getOrb, getPlanetHouse, getZodiacSign, normalize360 } from './astronomy';
import { formatDegree, planetNameTR } from './interpretations';

type P = { name: string; longitude: number; sign?: string; house?: number };

const MAJOR_ANGLES = [
  { angle: 0, tr: 'kavuşum' },
  { angle: 60, tr: 'altmışlık' },
  { angle: 90, tr: 'kare' },
  { angle: 120, tr: 'üçgen' },
  { angle: 180, tr: 'karşıt' },
];

export interface InterAspect {
  p1Planet: string; // TR
  p2Planet: string; // TR
  aspect: string;   // TR
  orb: number;
  description: string;
}

export function synastryAspects(p1Planets: P[], p2Planets: P[], maxOrb = 4): InterAspect[] {
  const out: InterAspect[] = [];
  for (const a of p1Planets) {
    for (const b of p2Planets) {
      let diff = Math.abs(normalize360(a.longitude) - normalize360(b.longitude));
      if (diff > 180) diff = 360 - diff;
      for (const def of MAJOR_ANGLES) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= Math.min(maxOrb, getOrb(a.name, b.name, def.angle))) {
          out.push({
            p1Planet: planetNameTR(a.name),
            p2Planet: planetNameTR(b.name),
            aspect: def.tr,
            orb: Number(orb.toFixed(2)),
            description: `1. kişinin ${planetNameTR(a.name)} gezegeni, 2. kişinin ${planetNameTR(b.name)} gezegenine ${def.tr} (orb ${orb.toFixed(1)}°)`,
          });
        }
      }
    }
  }
  out.sort((x, y) => x.orb - y.orb);
  return out;
}

export interface HouseOverlay {
  planet: string;   // TR
  house: number;
  description: string;
}

// Where person A's planets land in person B's houses.
export function houseOverlays(aPlanets: P[], bHouses: number[], aLabel: string, bLabel: string): HouseOverlay[] {
  return aPlanets.map((p) => {
    const house = getPlanetHouse(p.longitude, bHouses);
    return {
      planet: planetNameTR(p.name),
      house,
      description: `${aLabel} kişisinin ${planetNameTR(p.name)} gezegeni, ${bLabel} kişisinin ${house}. evine düşüyor`,
    };
  });
}

export interface CompositePosition {
  name: string;     // TR
  longitude: number;
  sign: string;
  degreeLabel: string;
}

// Composite chart via circular midpoints (shorter-arc method).
export function compositeChart(p1Planets: P[], p2Planets: P[]): CompositePosition[] {
  const out: CompositePosition[] = [];
  for (const a of p1Planets) {
    const b = p2Planets.find(x => x.name === a.name);
    if (!b) continue;
    let mid: number;
    const l1 = normalize360(a.longitude);
    const l2 = normalize360(b.longitude);
    let diff = l2 - l1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    mid = normalize360(l1 + diff / 2);
    out.push({
      name: planetNameTR(a.name),
      longitude: mid,
      sign: getZodiacSign(mid).turkish,
      degreeLabel: formatDegree(mid),
    });
  }
  return out;
}
