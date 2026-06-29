const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Normalize angle to [0, 360)
export function normalize360(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

// Convert date to Julian Day count since J2000.0 (January 1.5, 2000 UTC)
export function getJulianDaysSinceJ2000(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Formula from astronomical algorithms (valid for years 1901-2099)
  const jd = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + h / 24 - 730531.5;
  return jd;
}

// Zodiac Sign mapping
export const ZODIAC_SIGNS = [
  { name: 'Aries', turkish: 'Koç', symbol: '♈' },
  { name: 'Taurus', turkish: 'Boğa', symbol: '♉' },
  { name: 'Gemini', turkish: 'İkizler', symbol: '♊' },
  { name: 'Cancer', turkish: 'Yengeç', symbol: '♋' },
  { name: 'Leo', turkish: 'Aslan', symbol: '♌' },
  { name: 'Virgo', turkish: 'Başak', symbol: '♍' },
  { name: 'Libra', turkish: 'Terazi', symbol: '♎' },
  { name: 'Scorpio', turkish: 'Akrep', symbol: '♏' },
  { name: 'Sagittarius', turkish: 'Yay', symbol: '♐' },
  { name: 'Capricorn', turkish: 'Oğlak', symbol: '♑' },
  { name: 'Aquarius', turkish: 'Kova', symbol: '♒' },
  { name: 'Pisces', turkish: 'Balık', symbol: '♓' }
];

export function getZodiacSign(longitude: number) {
  const normalized = normalize360(longitude);
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

// Calculate the obliquity of the ecliptic
function getObliquity(d: number): number {
  return 23.4393 - 3.563e-7 * d;
}

// Solve Kepler's Equation: E - e * sin(E) = M
function solveKepler(M: number, e: number): number {
  const mRad = M * RAD;
  let E = mRad; // Initial guess
  for (let i = 0; i < 15; i++) {
    const delta = (E - e * Math.sin(E) - mRad) / (1 - e * Math.cos(E));
    E = E - delta;
    if (Math.abs(delta) < 1e-6) break;
  }
  return E;
}

// Compute heliocentric positions for a specific day count d
function getHeliocentricPlanet(planet: string, d: number) {
  let N = 0, i = 0, w = 0, a = 0, e = 0, M = 0;

  switch (planet) {
    case 'Mercury':
      N = 48.3313 + 3.24587e-5 * d;
      i = 7.0047 + 5.00e-8 * d;
      w = 29.1241 + 1.01444e-5 * d;
      a = 0.387098;
      e = 0.205635 + 5.59e-10 * d;
      M = 168.6562 + 4.0923344368 * d;
      break;
    case 'Venus':
      N = 76.6799 + 2.46590e-5 * d;
      i = 3.3946 + 2.75e-8 * d;
      w = 54.891 + 1.38374e-5 * d;
      a = 0.72333;
      e = 0.006773 - 1.302e-9 * d;
      M = 48.0052 + 1.6021302244 * d;
      break;
    case 'Mars':
      N = 49.5574 + 2.11081e-5 * d;
      i = 1.8497 - 1.78e-8 * d;
      w = 286.5016 + 2.92961e-5 * d;
      a = 1.523688;
      e = 0.093405 + 2.51e-9 * d;
      M = 18.6581 + 0.5240207766 * d;
      break;
    case 'Jupiter':
      N = 100.4542 + 2.76854e-5 * d;
      i = 1.303 - 1.55e-7 * d;
      w = 273.8777 + 1.64505e-5 * d;
      a = 5.20256;
      e = 0.048498 + 4.46e-9 * d;
      M = 19.895 + 0.0830853001 * d;
      break;
    case 'Saturn':
      N = 113.6655 + 2.3898e-5 * d;
      i = 2.4886 - 1.08e-7 * d;
      w = 339.3939 + 2.97661e-5 * d;
      a = 9.55475;
      e = 0.054163 - 3.67e-9 * d;
      M = 316.967 + 0.0334442282 * d;
      break;
    case 'Uranus':
      N = 74.0005 + 1.3978e-5 * d;
      i = 0.7733 + 1.9e-8 * d;
      w = 96.6612 + 3.0565e-5 * d;
      a = 19.18171 - 1.55e-8 * d;
      e = 0.047318 + 7.45e-9 * d;
      M = 142.5905 + 0.011725806 * d;
      break;
    case 'Neptune':
      N = 131.7806 + 3.0175e-5 * d;
      i = 1.77 - 2.55e-7 * d;
      w = 272.8461 - 6.02e-6 * d;
      a = 30.05826 + 3.313e-8 * d;
      e = 0.008606 + 2.15e-9 * d;
      M = 260.2471 + 0.005995147 * d;
      break;
    case 'Pluto':
      // Analytical Keplerian elements approximation for Pluto
      N = 110.30347 + 1.3983e-5 * d;
      i = 17.14175 + 1.1e-8 * d;
      w = 113.76329 + 3.2847e-5 * d;
      a = 39.481686 - 8.2e-8 * d;
      e = 0.248807 + 6.46e-9 * d;
      M = 14.882 + 0.0039644259 * d;
      break;
  }

  N = normalize360(N);
  w = normalize360(w);
  M = normalize360(M);

  const E = solveKepler(M, e);

  // Rectangular coordinates in orbital plane
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  // Heliocentric 3D coordinates
  const cosN = Math.cos(N * RAD);
  const sinN = Math.sin(N * RAD);
  const cosVw = Math.cos((v * DEG + w) * RAD);
  const sinVw = Math.sin((v * DEG + w) * RAD);
  const cosi = Math.cos(i * RAD);

  const xh = r * (cosN * cosVw - sinN * sinVw * cosi);
  const yh = r * (sinN * cosVw + cosN * sinVw * cosi);
  const zh = r * sinVw * Math.sin(i * RAD);

  return { xh, yh, zh };
}

// Compute geocentric coordinates for the Sun
function getGeocentricSun(d: number) {
  const w = normalize360(282.9404 + 4.70935e-5 * d);
  const e = 0.016709 - 1.151e-9 * d;
  const M = normalize360(356.047 + 0.9856002585 * d);

  const E = solveKepler(M, e);

  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);

  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const lon = normalize360(v * DEG + w);

  const xs = r * Math.cos(lon * RAD);
  const ys = r * Math.sin(lon * RAD);

  return { xs, ys, lon, r };
}

// Calculate Moon coordinates (Geocentric directly, with Sun perturbations)
function getGeocentricMoon(d: number) {
  const N = normalize360(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = normalize360(318.0634 + 0.1643573223 * d);
  const e = 0.0549;
  const M = normalize360(115.3654 + 13.0649929509 * d);

  const E = solveKepler(M, e);

  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);

  const v = Math.atan2(yv, xv);
  const r = 60.2666 * Math.sqrt(xv * xv + yv * yv); // Earth radii

  // Unperturbed geocentric ecliptic longitude/latitude
  const cosN = Math.cos(N * RAD);
  const sinN = Math.sin(N * RAD);
  const cosVw = Math.cos((v * DEG + w) * RAD);
  const sinVw = Math.sin((v * DEG + w) * RAD);
  const cosi = Math.cos(i * RAD);

  const xecl = r * (cosN * cosVw - sinN * sinVw * cosi);
  const yecl = r * (sinN * cosVw + cosN * sinVw * cosi);
  const zecl = r * sinVw * Math.sin(i * RAD);

  let lon = normalize360(Math.atan2(yecl, xecl) * DEG);
  let lat = Math.atan2(zecl, Math.sqrt(xecl * xecl + yecl * yecl)) * DEG;

  // Perturbations from the Sun (extremely important for the Moon)
  const Ls = normalize360(282.9404 + 4.70935e-5 * d + 356.047 + 0.9856002585 * d); // Sun mean longitude
  const Lm = normalize360(N + w + M); // Moon mean longitude
  const Ms = normalize360(356.047 + 0.9856002585 * d); // Sun mean anomaly
  const Mm = M; // Moon mean anomaly
  const D = normalize360(Lm - Ls); // Mean elongation of Moon
  const F = normalize360(Lm - N); // Moon argument of latitude

  // Apply primary perturbations
  const dLon = 
    -1.274 * Math.sin((Mm - 2 * D) * RAD) +
    0.658 * Math.sin(2 * D * RAD) -
    0.186 * Math.sin(Ms * RAD) -
    0.059 * Math.sin((2 * Mm - 2 * D) * RAD) -
    0.057 * Math.sin((Mm - 2 * D + Ms) * RAD) +
    0.053 * Math.sin((Mm + 2 * D) * RAD) +
    0.046 * Math.sin((2 * D - Ms) * RAD) +
    0.041 * Math.sin((Mm - Ms) * RAD) -
    0.035 * Math.sin(D * RAD) -
    0.031 * Math.sin((Mm + Ms) * RAD) -
    0.015 * Math.sin((2 * F - 2 * D) * RAD) +
    0.011 * Math.sin((Mm - 4 * D) * RAD);

  const dLat = 
    -0.173 * Math.sin((F - 2 * D) * RAD) -
    0.055 * Math.sin((F - 2 * D - Mm) * RAD) -
    0.046 * Math.sin((F - 2 * D + Mm) * RAD) +
    0.033 * Math.sin((F + 2 * D) * RAD) +
    0.017 * Math.sin((2 * Mm + F) * RAD);

  lon = normalize360(lon + dLon);
  lat = lat + dLat;

  return { lon, lat };
}

// Calculate geocentric longitude of a planet
export function getPlanetLongitude(planet: string, d: number): number {
  if (planet === 'Sun') {
    return getGeocentricSun(d).lon;
  }
  if (planet === 'Moon') {
    return getGeocentricMoon(d).lon;
  }

  const { xh, yh } = getHeliocentricPlanet(planet, d);
  const { xs, ys } = getGeocentricSun(d);

  // Translate to geocentric
  const xg = xh + xs;
  const yg = yh + ys;

  // Convert to ecliptic longitude
  const lon = normalize360(Math.atan2(yg, xg) * DEG);
  return lon;
}

// Check if a planet is retrograde by comparing longitude now vs 0.1 days later
export function getIsRetrograde(planet: string, d: number): boolean {
  if (planet === 'Sun' || planet === 'Moon') {
    return false; // Sun and Moon are never retrograde
  }
  const lon1 = getPlanetLongitude(planet, d - 0.05);
  const lon2 = getPlanetLongitude(planet, d + 0.05);
  
  let diff = lon2 - lon1;
  // Handle boundary wrapping
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return diff < 0;
}

// House cusps calculation using the Equal House system
export function getHouseCusps(ramc: number, lat: number, obliquity: number) {
  // Ascendant Calculation
  const ramcRad = ramc * RAD;
  const latRad = lat * RAD;
  const oblRad = obliquity * RAD;

  const y = Math.cos(ramcRad);
  const x = -Math.sin(ramcRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
  
  const ascendant = normalize360(Math.atan2(y, x) * DEG);
  
  // Midheaven (MC) Calculation
  const mc = normalize360(Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(oblRad)) * DEG);

  // In Equal House system, 1st House Cusp is the Ascendant.
  // Each subsequent cusp is exactly 30 degrees further.
  const houses: number[] = [];
  for (let i = 0; i < 12; i++) {
    houses.push(normalize360(ascendant + i * 30));
  }

  return { ascendant, midheaven: mc, houses };
}

// Determine which house a specific longitude falls into
export function getPlanetHouse(longitude: number, houses: number[]): number {
  const norm = normalize360(longitude);
  for (let i = 0; i < 11; i++) {
    const cuspCurrent = houses[i];
    const cuspNext = houses[i + 1];
    if (cuspNext > cuspCurrent) {
      if (norm >= cuspCurrent && norm < cuspNext) return i + 1;
    } else {
      // Wraps around 360 degrees boundary
      if (norm >= cuspCurrent || norm < cuspNext) return i + 1;
    }
  }
  return 12; // Default to 12th house if not caught in 1-11
}

// Main function to compute a full Natal Chart
export function computeNatalChart(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number // e.g. +3 for GMT+3
) {
  // 1. Calculate UTC Time
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const utcOffsetMs = timezoneOffsetHours * 60 * 60 * 1000;
  const utcDate = new Date(date.getTime() - utcOffsetMs);

  const d = getJulianDaysSinceJ2000(utcDate);

  // 2. Local Sidereal Time Calculation for Houses
  // Greenwich Mean Sidereal Time (GMST) at Julian Day d
  const gmst = normalize360((18.697374558 + 24.06570982441908 * d) * 15);
  // Local Sidereal Time (LST)
  const lst = normalize360(gmst + longitude);

  const obliquity = getObliquity(d);
  const { ascendant, midheaven, houses } = getHouseCusps(lst, latitude, obliquity);

  // 3. Compute Positions for all Bodies
  const planetsList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  const planets = planetsList.map((name) => {
    const lon = getPlanetLongitude(name, d);
    const sign = getZodiacSign(lon);
    const house = getPlanetHouse(lon, houses);
    const retrograde = getIsRetrograde(name, d);

    return {
      name,
      longitude: lon,
      sign: sign.turkish,
      house,
      retrograde
    };
  });

  return {
    planets,
    houses,
    ascendant,
    midheaven
  };
}

export interface PlanetaryHour {
  hourIndex: number;
  label: string;
  planetName: string;
  planetSymbol: string;
  meaning: string;
  isNight: boolean;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
}

const PLANET_DETAILS: Record<string, { turkish: string; symbol: string; meaning: string }> = {
  Sun: { turkish: 'Güneş', symbol: '☀️', meaning: 'Öz güven, liderlik, kariyer ve benlik ifadesi.' },
  Moon: { turkish: 'Ay', symbol: '🌙', meaning: 'Duygular, sezgiler, aile ve içsel arınma.' },
  Mercury: { turkish: 'Merkür', symbol: '☿', meaning: 'Zihinsel faaliyetler, iletişim, yazışma ve ticaret.' },
  Venus: { turkish: 'Venüs', symbol: '♀', meaning: 'Aşk, ilişkiler, sevgi frekansı, bakım ve para.' },
  Mars: { turkish: 'Mars', symbol: '♂', meaning: 'Eyleme geçme, cesaret, spor ve fiziksel işler.' },
  Jupiter: { turkish: 'Jüpiter', symbol: '♃', meaning: 'Bolluk, bereket, şans kapıları ve yüksek bilgelik.' },
  Saturn: { turkish: 'Satürn', symbol: '♄', meaning: 'Disiplin, sınırlar, koruma ve sabır gerektiren işler.' }
};

export function calculatePlanetaryHours(
  latitude: number,
  longitude: number,
  date: Date
): PlanetaryHour[] {
  // 1. Calculate Day of the Year
  const start = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // 2. Solar declination
  const latRad = latitude * (Math.PI / 180);
  const solarDecl = 23.45 * Math.sin((360 / 365) * (284 + dayOfYear) * (Math.PI / 180)) * (Math.PI / 180);

  // 3. Hour angle (clamped to prevent acos domain error in extreme latitudes)
  let cosH = -Math.tan(latRad) * Math.tan(solarDecl);
  cosH = Math.max(-1, Math.min(1, cosH));
  const H_rad = Math.acos(cosH);
  const H_hours = H_rad * (12 / Math.PI); // Half day length in hours

  // 4. Local solar transit (approx noon in UTC)
  // Local Mean Time of sunrise and sunset
  let sunriseDecimal = 12 - H_hours;
  let sunsetDecimal = 12 + H_hours;

  const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const sunriseDate = new Date(`${localDateStr}T00:00:00`);
  const sunsetDate = new Date(`${localDateStr}T00:00:00`);
  const nextSunriseDate = new Date(sunriseDate.getTime() + 24 * 60 * 60 * 1000);

  const sunriseHour = Math.floor(sunriseDecimal);
  const sunriseMin = Math.floor((sunriseDecimal - sunriseHour) * 60);
  sunriseDate.setHours(sunriseHour, sunriseMin, 0, 0);

  const sunsetHour = Math.floor(sunsetDecimal);
  const sunsetMin = Math.floor((sunsetDecimal - sunsetHour) * 60);
  sunsetDate.setHours(sunsetHour, sunsetMin, 0, 0);

  nextSunriseDate.setHours(sunriseHour, sunriseMin, 0, 0);

  // 5. Calculate day hour duration and night hour duration
  const dayDurationMs = sunsetDate.getTime() - sunriseDate.getTime();
  const nightDurationMs = nextSunriseDate.getTime() - sunsetDate.getTime();

  const dayHourMs = dayDurationMs / 12;
  const nightHourMs = nightDurationMs / 12;

  // 6. Day Rulers sequence (Chaldean Order reversed / descending)
  const CHALDEAN_DESCENDING = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sunday=0, Monday=1, ...
  
  const dayOfWeek = date.getDay();
  const dayRuler = DAY_RULERS[dayOfWeek];
  const startIndex = CHALDEAN_DESCENDING.indexOf(dayRuler);

  const hoursList: PlanetaryHour[] = [];
  const now = new Date();

  // Generate 12 Day Hours
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunriseDate.getTime() + i * dayHourMs);
    const end = new Date(sunriseDate.getTime() + (i + 1) * dayHourMs);
    const planet = CHALDEAN_DESCENDING[(startIndex + i) % 7];
    const details = PLANET_DETAILS[planet] || PLANET_DETAILS['Sun'];
    const isActive = now >= start && now < end;

    hoursList.push({
      hourIndex: i,
      label: `${formatTime(start)} - ${formatTime(end)}`,
      planetName: details.turkish,
      planetSymbol: details.symbol,
      meaning: details.meaning,
      isNight: false,
      isActive,
      startTime: start,
      endTime: end
    });
  }

  // Generate 12 Night Hours
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunsetDate.getTime() + i * nightHourMs);
    const end = new Date(sunsetDate.getTime() + (i + 1) * nightHourMs);
    const planet = CHALDEAN_DESCENDING[(startIndex + 12 + i) % 7];
    const details = PLANET_DETAILS[planet] || PLANET_DETAILS['Sun'];
    const isActive = now >= start && now < end;

    hoursList.push({
      hourIndex: 12 + i,
      label: `${formatTime(start)} - ${formatTime(end)}`,
      planetName: details.turkish,
      planetSymbol: details.symbol,
      meaning: details.meaning,
      isNight: true,
      isActive,
      startTime: start,
      endTime: end
    });
  }

  return hoursList;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
