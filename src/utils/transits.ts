// Transit → natal contact calculator (pure, deterministic).
// Produces the exact "which transit triggers which natal point today" list
// that gets handed to the AI — the model never has to guess sky positions.

import {
  getJulianDaysSinceJ2000,
  getPlanetLongitude,
  getPlanetSpeed,
  getZodiacSign,
  getOrb,
  normalize360,
} from './astronomy';
import { formatDegree, planetNameTR } from './interpretations';

export interface TransitPosition {
  name: string;
  nameTR: string;
  longitude: number;
  sign: string;
  degreeLabel: string;   // "12°34'"
  speed: number;
  retrograde: boolean;
}

export interface TransitContact {
  transitPlanet: string;      // TR name
  natalPoint: string;         // TR name
  aspect: string;             // TR aspect name
  angle: number;
  orb: number;                // degrees from exact
  applying: boolean;
  description: string;        // "Transit Satürn ♄ 12°Balık, natal Güneş'e kare, orb 1.2°, yaklaşıyor"
}

const MAJOR_ANGLES = [
  { angle: 0, tr: 'kavuşum' },
  { angle: 60, tr: 'altmışlık' },
  { angle: 90, tr: 'kare' },
  { angle: 120, tr: 'üçgen' },
  { angle: 180, tr: 'karşıt' },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

export function computeCurrentTransits(date = new Date()): TransitPosition[] {
  const d = getJulianDaysSinceJ2000(date);
  return ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].map((name) => {
    const lon = getPlanetLongitude(name, d);
    const speed = getPlanetSpeed(name, d);
    return {
      name,
      nameTR: planetNameTR(name),
      longitude: lon,
      sign: getZodiacSign(lon).turkish,
      degreeLabel: formatDegree(lon),
      speed: Number(speed.toFixed(4)),
      retrograde: name !== 'Sun' && name !== 'Moon' && speed < 0,
    };
  });
}

type NatalLike = { name: string; longitude: number; sign?: string };

// Contacts between today's sky and the natal chart, orb ≤ maxOrb (default 3°).
export function computeTransitContacts(
  natalPlanets: NatalLike[],
  natalAscendant?: number,
  natalMidheaven?: number,
  date = new Date(),
  maxOrb = 3
): { transits: TransitPosition[]; contacts: TransitContact[] } {
  const transits = computeCurrentTransits(date);

  const natalPoints: NatalLike[] = [...natalPlanets];
  if (typeof natalAscendant === 'number') natalPoints.push({ name: 'Ascendant', longitude: natalAscendant });
  if (typeof natalMidheaven === 'number') natalPoints.push({ name: 'Midheaven', longitude: natalMidheaven });

  const trName = (n: string) => n === 'Ascendant' ? 'Yükselen' : n === 'Midheaven' ? 'MC (Tepe Noktası)' : planetNameTR(n);

  const contacts: TransitContact[] = [];
  for (const t of transits) {
    for (const n of natalPoints) {
      let diff = Math.abs(normalize360(t.longitude) - normalize360(n.longitude));
      if (diff > 180) diff = 360 - diff;

      for (const def of MAJOR_ANGLES) {
        const orb = Math.abs(diff - def.angle);
        const limit = Math.min(maxOrb, getOrb(t.name, n.name === 'Ascendant' || n.name === 'Midheaven' ? 'Sun' : n.name, def.angle));
        if (orb <= limit) {
          // Applying: transit motion closes the gap (linear estimate)
          const futureLon = t.longitude + t.speed * 0.2;
          let fDiff = Math.abs(normalize360(futureLon) - normalize360(n.longitude));
          if (fDiff > 180) fDiff = 360 - fDiff;
          const applying = Math.abs(fDiff - def.angle) < orb;

          contacts.push({
            transitPlanet: t.nameTR,
            natalPoint: trName(n.name),
            aspect: def.tr,
            angle: def.angle,
            orb: Number(orb.toFixed(2)),
            applying,
            description:
              `Transit ${t.nameTR} ${PLANET_SYMBOLS[t.name] || ''} ${t.degreeLabel} ${t.sign}${t.retrograde ? ' (R)' : ''}, ` +
              `natal ${trName(n.name)} noktasına ${def.tr}, orb ${orb.toFixed(1)}°, ${applying ? 'yaklaşıyor (applying)' : 'ayrılıyor (separating)'}`,
          });
        }
      }
    }
  }

  // Tightest contacts first — the AI reads the most important ones on top
  contacts.sort((a, b) => a.orb - b.orb);
  return { transits, contacts };
}
