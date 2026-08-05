import type { Mode, ThreatKind } from './types';

/**
 * World units, not pixels, exactly as Breakout does it. The renderer scales the
 * field to whatever the canvas turned out to be, so a phone and a desktop run
 * the same simulation at the same speed and only the pixel density differs.
 */
export const FIELD_W = 800;
export const FIELD_H = 600;
export const GROUND_Y = 560;

export const TICK_MS = 16;
export const DT = TICK_MS / 1000;

/** How wide a city and a battery are, for both drawing and blast damage. */
export const CITY_HALF_W = 26;
export const BATTERY_HALF_W = 30;

/**
 * The two layouts. Survival gets its own rather than a subset of the classic
 * one: the six classic city slots are symmetric about the center battery, and
 * any three of them are not, which reads as damage before a shot is fired.
 */
export const LAYOUTS: Record<Mode, { cities: number[]; batteries: number[]; ammo: number }> = {
  classic: {
    cities: [140, 210, 280, 520, 590, 660],
    batteries: [56, 400, 744],
    ammo: 10,
  },
  blitz: {
    cities: [140, 210, 280, 520, 590, 660],
    batteries: [56, 400, 744],
    ammo: 10,
  },
  survival: {
    cities: [200, 400, 600],
    batteries: [56, 744],
    ammo: 8,
  },
};

export const MODE_META: Record<Mode, { label: string; blurb: string }> = {
  classic: {
    label: 'Classic',
    blurb: 'Six cities, three batteries, and a wave that never stops coming.',
  },
  blitz: {
    label: 'Blitz',
    blurb: 'The same field, twice the escalation, and points to match.',
  },
  survival: {
    label: 'Survival',
    blurb: 'Three cities, two batteries, no reinforcements. Last as long as you can.',
  },
};

export const MODES: Mode[] = ['classic', 'blitz', 'survival'];

/** Blitz counts every wave twice when it works out how hard to be. */
export function effectiveWave(mode: Mode, wave: number): number {
  return mode === 'blitz' ? wave * 2 : wave;
}

export const INTERCEPTOR_SPEED = 560;

/** Growth, hold and fade, in ticks. Read off `age` rather than stored. */
export const BLAST_GROW = 22;
export const BLAST_HOLD = 20;
export const BLAST_FADE = 26;
export const BLAST_LIFE = BLAST_GROW + BLAST_HOLD + BLAST_FADE;

export const BLAST_R = 54;
/**
 * Deliberately smaller than the player's. The cities sit 70 units apart, so a
 * ground hit centered on one of them has to stop short of its neighbor; a blast
 * that reached both would mean a single leak costs two cities, which is a
 * harsher game than the one this is.
 */
export const GROUND_BLAST_R = 32;

/** How close a blast has to be before a smart bomb starts sidestepping it. */
export const SMART_DODGE_R = 130;
export const SMART_DODGE_ACCEL = 210;
export const SMART_MAX_VX = 90;

export const BOMBER_Y_MIN = 90;
export const BOMBER_Y_MAX = 190;
export const BOMBER_SPEED = 105;

/** Ticks a wave banner and an end-of-wave tally stay up before play resumes. */
export const READY_TICKS = 70;
export const TALLY_TICKS = 130;

export const KILL_POINTS: Record<ThreatKind | 'bomber', number> = {
  missile: 25,
  splitter: 25,
  smart: 60,
  bomber: 100,
};

export const AMMO_BONUS = 5;
export const CITY_BONUS = 100;

/** A free city at every multiple of this, in Classic and Blitz only. */
export const BONUS_CITY_POINTS = 10000;

/** Trail colors, cycled by wave, so consecutive waves stay told apart. */
export const WAVE_COLORS = [
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#c084fc',
  '#f472b6',
];

export function multiplierFor(wave: number): number {
  return Math.min(6, 1 + Math.floor((wave - 1) / 2));
}

export function threatsFor(mode: Mode, wave: number): number {
  return Math.min(30, 8 + 2 * (effectiveWave(mode, wave) - 1));
}

export function threatSpeedFor(mode: Mode, wave: number): number {
  return Math.min(190, 42 + 5 * effectiveWave(mode, wave));
}

/** Ticks between releases. Later waves arrive in a heavier stream, not just faster. */
export function spawnIntervalFor(mode: Mode, wave: number): number {
  return Math.max(16, 74 - 3 * effectiveWave(mode, wave));
}

export function bombersFor(mode: Mode, wave: number): number {
  const eff = effectiveWave(mode, wave);
  if (eff < 4) return 0;
  return Math.min(3, Math.floor((eff - 1) / 3));
}

/** Chance a given release is a splitter, then a smart bomb. Checked in that order. */
export function splitterChanceFor(mode: Mode, wave: number): number {
  const eff = effectiveWave(mode, wave);
  if (eff < 3) return 0;
  return Math.min(0.34, 0.1 + 0.03 * (eff - 3));
}

export function smartChanceFor(mode: Mode, wave: number): number {
  const eff = effectiveWave(mode, wave);
  if (eff < 6) return 0;
  return Math.min(0.22, 0.05 + 0.02 * (eff - 6));
}
