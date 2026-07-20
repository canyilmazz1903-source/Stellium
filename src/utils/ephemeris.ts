// Precision ephemeris core built on astronomy-engine (VSOP87-class accuracy,
// pure JS, Expo-compatible). All longitudes are APPARENT geocentric ecliptic
// of date (true equinox, aberration included) — the astrological standard.
//
// This module is pure and deterministic: no network, no state. The rest of
// the app consumes it through utils/astronomy.ts, whose public API is kept
// stable so UI code does not change.

import {
  Body,
  MakeTime,
  GeoVector,
  Ecliptic,
  SunPosition,
  EclipticGeoMoon,
  SiderealTime,
  Observer,
  SearchRiseSet,
  HelioVector,
  RotateState,
  Rotation_EQJ_ECL,
  GeoMoonState,
  Rotation_EQJ_ECT,
  type AstroTime,
} from 'astronomy-engine';

export const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

export function daysSinceJ2000ToDate(d: number): Date {
  return new Date(J2000_EPOCH_MS + d * 86400000);
}

export function dateToDaysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000_EPOCH_MS) / 86400000;
}

export function norm360(a: number): number {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}

const BODY_MAP: Record<string, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

// Apparent geocentric ecliptic longitude of date for any supported body.
export function bodyLongitude(name: string, date: Date): number {
  const time = MakeTime(date);
  if (name === 'Sun') return SunPosition(time).elon;
  if (name === 'Moon') return EclipticGeoMoon(time).lon;
  const body = BODY_MAP[name];
  if (!body) return 0;
  // GeoVector with aberration → J2000 equatorial; Ecliptic() converts to
  // TRUE ecliptic of date (nutation included) per astronomy-engine ≥2.1.
  return Ecliptic(GeoVector(body, time, true)).elon;
}

// Daily motion in degrees/day (negative = retrograde).
export function bodySpeed(name: string, date: Date): number {
  const h = 0.5; // days; central difference
  const l1 = bodyLongitude(name, new Date(date.getTime() - h * 86400000));
  const l2 = bodyLongitude(name, new Date(date.getTime() + h * 86400000));
  return (((l2 - l1 + 540) % 360) - 180) / (2 * h);
}

export function isRetrograde(name: string, date: Date): boolean {
  if (name === 'Sun' || name === 'Moon') return false;
  return bodySpeed(name, date) < 0;
}

// Mean obliquity of the ecliptic (Meeus); nutation term is negligible for
// house work (< 0.003°).
export function meanObliquity(date: Date): number {
  const T = dateToDaysSinceJ2000(date) / 36525;
  return 23.43929111 - 0.0130041667 * T - 1.6389e-7 * T * T + 5.0361e-7 * T * T * T;
}

// Apparent sidereal time at Greenwich, in degrees.
export function greenwichSiderealDeg(date: Date): number {
  return norm360(SiderealTime(MakeTime(date)) * 15);
}

// ---------- Lunar nodes ----------

// True (osculating) node: ascending node of the Moon's instantaneous orbit,
// from the geocentric state vector rotated into the ecliptic frame of date.
export function trueLunarNode(date: Date): number {
  const time = MakeTime(date);
  const stateEqj = GeoMoonState(time);
  const rot = Rotation_EQJ_ECT(time);
  const s = RotateState(rot, stateEqj);
  // Angular momentum h = r × v in ecliptic coords
  const hx = s.y * s.vz - s.z * s.vy;
  const hy = s.z * s.vx - s.x * s.vz;
  // Ascending node vector n = ẑ × h = (-hy, hx, 0)
  return norm360((Math.atan2(hx, -hy) * 180) / Math.PI);
}

// Mean node (Meeus): smooth secular motion, no osculating wobble.
export function meanLunarNode(date: Date): number {
  const T = dateToDaysSinceJ2000(date) / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441);
}

// ---------- Mean Black Moon Lilith (mean lunar apogee) ----------

export function meanLilith(date: Date): number {
  const T = dateToDaysSinceJ2000(date) / 36525;
  // Meeus mean lunar perigee longitude + 180° = mean apogee
  const perigee = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T * T * T * T) / 18999000;
  return norm360(perigee + 180);
}

// ---------- Chiron (approximate Kepler solution) ----------
//
// Osculating elements anchored at the well-documented 1996-02-14 perihelion
// (JD 2450128.5, q≈8.43 AU). Saturn perturbations are not modeled, so treat
// accuracy as ±1° within 1950–2050 — clearly labeled approximate in UI copy.
const CHIRON = {
  a: 13.678,        // AU
  e: 0.3831,
  i: 6.94,          // deg
  node: 209.38,     // Ω, ecliptic J2000
  peri: 339.55,     // ω
  Tp: 2450128.5,    // JD of perihelion (1996-02-14)
  n: 360 / (Math.pow(13.678, 1.5) * 365.25), // deg/day
};

function solveKeplerE(M: number, e: number): number {
  const Mrad = (M * Math.PI) / 180;
  let E = Mrad;
  for (let k = 0; k < 20; k++) {
    const delta = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return E;
}

export function chironLongitude(date: Date): number {
  const jd = dateToDaysSinceJ2000(date) + 2451545.0;
  const M = norm360(CHIRON.n * (jd - CHIRON.Tp));
  const E = solveKeplerE(M, CHIRON.e);
  const xv = CHIRON.a * (Math.cos(E) - CHIRON.e);
  const yv = CHIRON.a * Math.sqrt(1 - CHIRON.e * CHIRON.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const RAD = Math.PI / 180;
  const cosN = Math.cos(CHIRON.node * RAD);
  const sinN = Math.sin(CHIRON.node * RAD);
  const argLat = v + CHIRON.peri * RAD;
  const cosU = Math.cos(argLat);
  const sinU = Math.sin(argLat);
  const cosI = Math.cos(CHIRON.i * RAD);

  // Heliocentric ecliptic-J2000 position of Chiron
  const xh = r * (cosN * cosU - sinN * sinU * cosI);
  const yh = r * (sinN * cosU + cosN * sinU * cosI);
  const zh = r * sinU * Math.sin(CHIRON.i * RAD);

  // Earth heliocentric position in the same frame
  const earthEqj = HelioVector(Body.Earth, MakeTime(date));
  const rotEcl = Rotation_EQJ_ECL();
  const ex = rotEcl.rot[0][0] * earthEqj.x + rotEcl.rot[1][0] * earthEqj.y + rotEcl.rot[2][0] * earthEqj.z;
  const ey = rotEcl.rot[0][1] * earthEqj.x + rotEcl.rot[1][1] * earthEqj.y + rotEcl.rot[2][1] * earthEqj.z;

  // Geocentric = helio(body) − helio(earth)
  const gx = xh - ex;
  const gy = yh - ey;
  let lon = norm360(Math.atan2(gy, gx) / RAD);

  // Precess J2000 longitude to equinox of date (general precession ~1.397°/cy)
  const T = dateToDaysSinceJ2000(date) / 36525;
  lon = norm360(lon + 1.39697 * T);
  return lon;
}

// ---------- Sunrise / sunset (real horizon events) ----------

export interface RiseSetTimes {
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null;
}

export function sunRiseSet(latitude: number, longitude: number, localMidnight: Date): RiseSetTimes {
  const obs = new Observer(latitude, longitude, 0);
  const start = MakeTime(localMidnight);
  const rise = SearchRiseSet(Body.Sun, obs, +1, start, 1.2);
  const set = rise ? SearchRiseSet(Body.Sun, obs, -1, rise, 1.2) : SearchRiseSet(Body.Sun, obs, -1, start, 1.2);
  const nextRise = rise ? SearchRiseSet(Body.Sun, obs, +1, rise.AddDays(0.1), 1.5) : null;
  return {
    sunrise: rise ? rise.date : null,
    sunset: set ? set.date : null,
    nextSunrise: nextRise ? nextRise.date : null,
  };
}

// Is the Sun above the local horizon (day birth)?
export function isSunAboveHorizon(date: Date, latitude: number, longitude: number): boolean {
  // Use hour angle geometry via sidereal time and Sun position (fast, no search)
  const time = MakeTime(date);
  const sun = SunPosition(time);
  const RAD = Math.PI / 180;
  const eps = meanObliquity(date) * RAD;
  const lam = sun.elon * RAD;
  // Ecliptic → equatorial
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const lstDeg = norm360(greenwichSiderealDeg(date) + longitude);
  const H = norm360(lstDeg - (ra / RAD)) * RAD; // hour angle
  const phi = latitude * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  return alt > 0;
}
