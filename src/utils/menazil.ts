// Menazil-i Kamer: locate the Moon's current lunar mansion from its ecliptic
// longitude. Each mansion spans 360/28 = 12°51'25.7". Pure computation.

import { getJulianDaysSinceJ2000, getPlanetLongitude, normalize360 } from './astronomy';
import { MENAZIL, MenzilInfo } from '@/data/menazilData';

const MANSION_SPAN = 360 / 28;

export function menzilFromLongitude(moonLongitude: number): MenzilInfo {
  const idx = Math.floor(normalize360(moonLongitude) / MANSION_SPAN); // 0-27
  return MENAZIL[Math.min(idx, 27)];
}

export function currentMenzil(date = new Date()): MenzilInfo {
  const moonLon = getPlanetLongitude('Moon', getJulianDaysSinceJ2000(date));
  return menzilFromLongitude(moonLon);
}

// Compact one-line summary used in prompts and calendar rows.
export function menzilLine(m: MenzilInfo): string {
  return `Ay Menzili (Menazil-i Kamer): ${m.index}. menzil ${m.name} — ${m.natureTR}. ${m.theme}.`;
}

// Fuller guidance paragraph for UI detail views.
export function menzilGuidance(m: MenzilInfo): string {
  const good = m.goodFor.length ? `Uygun işler: ${m.goodFor.join(', ')}.` : '';
  const avoid = m.avoidFor.length ? ` Kaçınılması önerilenler: ${m.avoidFor.join(', ')}.` : '';
  return `${m.index}. Menzil ${m.name} (${m.arabicName}) — ${m.natureTR}. ${m.theme}. ${good}${avoid} Geleneksel öğretiye göre menzil enerjisi, o gün başlanan işlerin tabiatına sirayet eder.`;
}
