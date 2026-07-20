// House system calculations: Placidus (Turkish community de-facto standard,
// default), Whole Sign (required by classical techniques / profections) and
// Equal House (legacy). Pure math, no dependencies beyond trig.

export type HouseSystem = 'placidus' | 'whole' | 'equal';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function norm360(a: number): number {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}

// Ascendant from RAMC (apparent sidereal time at the birthplace, in degrees),
// geographic latitude and obliquity. Standard quadrant-correct formula.
export function computeAscendant(ramc: number, lat: number, obliquity: number): number {
  const ramcRad = ramc * RAD;
  const latRad = lat * RAD;
  const oblRad = obliquity * RAD;
  const y = Math.cos(ramcRad);
  const x = -Math.sin(ramcRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
  return norm360(Math.atan2(y, x) * DEG);
}

export function computeMidheaven(ramc: number, obliquity: number): number {
  const ramcRad = ramc * RAD;
  const oblRad = obliquity * RAD;
  return norm360(Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(oblRad)) * DEG);
}

// Ecliptic longitude of the point whose right ascension is `ra` (both deg).
function eclipticLongitudeFromRA(ra: number, obliquity: number): number {
  const raRad = ra * RAD;
  const oblRad = obliquity * RAD;
  return norm360(Math.atan2(Math.sin(raRad), Math.cos(raRad) * Math.cos(oblRad)) * DEG);
}

function declinationFromLongitude(lon: number, obliquity: number): number {
  return Math.asin(Math.sin(obliquity * RAD) * Math.sin(lon * RAD)) * DEG;
}

// Placidus intermediate cusp via the classic semi-arc iteration.
// `f` = fraction of the semi-arc, `offset` = initial RA offset from RAMC,
// `nocturnal` selects the formula branch for cusps 2/3.
function placidusCusp(ramc: number, lat: number, obliquity: number, which: 11 | 12 | 2 | 3): number {
  const phi = lat * RAD;
  let ra = ramc + { 11: 30, 12: 60, 2: 120, 3: 150 }[which];

  for (let iter = 0; iter < 30; iter++) {
    const lon = eclipticLongitudeFromRA(ra, obliquity);
    const dec = declinationFromLongitude(lon, obliquity) * RAD;
    let cosSA = -Math.tan(phi) * Math.tan(dec);
    cosSA = Math.max(-1, Math.min(1, cosSA));
    const SA = Math.acos(cosSA) * DEG; // semi-diurnal arc

    let target: number;
    if (which === 11) target = ramc + SA / 3;
    else if (which === 12) target = ramc + (2 * SA) / 3;
    else if (which === 2) target = ramc + 60 + (2 * SA) / 3; // = RAMC + SA + NS/3
    else target = ramc + 120 + SA / 3; // cusp 3 = RAMC + SA + 2NS/3

    const delta = ((target - ra + 540) % 360) - 180;
    ra = ra + delta;
    if (Math.abs(delta) < 1e-5) break;
  }
  return eclipticLongitudeFromRA(ra, obliquity);
}

export interface HouseResult {
  ascendant: number;
  midheaven: number;
  houses: number[]; // 12 cusp longitudes, index 0 = 1st house
  system: HouseSystem;
  polarFallback: boolean; // true when Placidus degraded to Whole Sign near poles
}

export function computeHouses(
  ramc: number,
  lat: number,
  obliquity: number,
  system: HouseSystem = 'placidus'
): HouseResult {
  const ascendant = computeAscendant(ramc, lat, obliquity);
  const midheaven = computeMidheaven(ramc, obliquity);

  if (system === 'equal') {
    const houses = Array.from({ length: 12 }, (_, i) => norm360(ascendant + i * 30));
    return { ascendant, midheaven, houses, system, polarFallback: false };
  }

  if (system === 'whole' || Math.abs(lat) > 66) {
    // Whole Sign: cusp 1 = 0° of the ASC's sign
    const signStart = Math.floor(ascendant / 30) * 30;
    const houses = Array.from({ length: 12 }, (_, i) => norm360(signStart + i * 30));
    return {
      ascendant, midheaven, houses,
      system: system === 'whole' ? 'whole' : 'placidus',
      polarFallback: system !== 'whole',
    };
  }

  // Placidus
  const c11 = placidusCusp(ramc, lat, obliquity, 11);
  const c12 = placidusCusp(ramc, lat, obliquity, 12);
  const c2 = placidusCusp(ramc, lat, obliquity, 2);
  const c3 = placidusCusp(ramc, lat, obliquity, 3);

  const houses = new Array<number>(12);
  houses[0] = ascendant;            // 1
  houses[1] = c2;                   // 2
  houses[2] = c3;                   // 3
  houses[3] = norm360(midheaven + 180); // 4 (IC)
  houses[4] = norm360(c11 + 180);   // 5
  houses[5] = norm360(c12 + 180);   // 6
  houses[6] = norm360(ascendant + 180); // 7
  houses[7] = norm360(c2 + 180);    // 8
  houses[8] = norm360(c3 + 180);    // 9
  houses[9] = midheaven;            // 10
  houses[10] = c11;                 // 11
  houses[11] = c12;                 // 12

  return { ascendant, midheaven, houses, system: 'placidus', polarFallback: false };
}

export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  placidus: 'Placidus',
  whole: 'Tam Burç (Whole Sign)',
  equal: 'Eşit Ev',
};
