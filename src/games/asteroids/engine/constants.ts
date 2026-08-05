import type { Mode } from './types';

/**
 * World units. Unlike every other game in the hub, the field wraps in both
 * axes, so there is no edge for the aspect ratio to be unfair about and the
 * playfield can fill whatever shape the screen turns out to be.
 */
export const FIELD_W = 1000;
export const FIELD_H = 750;

export const TICK_MS = 16;
export const DT = TICK_MS / 1000;

export const SHIP_R = 15;
export const TURN_RATE = 3.6;
export const THRUST_ACCEL = 340;
/** Space with a little friction, so a drifting ship is recoverable. */
export const DRAG = 0.55;
export const MAX_SHIP_SPEED = 430;

export const BULLET_SPEED = 620;
export const BULLET_LIFE_TICKS = 62;
export const BULLET_R = 3;
/** The classic limit. Without it the game is a hose and nothing is at stake. */
export const MAX_BULLETS = 4;
export const FIRE_COOLDOWN = 8;

export const SAUCER_R = 20;
export const SAUCER_SPEED = 150;
export const SAUCER_FIRE_TICKS = 78;
export const SAUCER_BULLET_SPEED = 380;

export const INVULN_TICKS = 110;
export const READY_TICKS = 60;
export const RESPAWN_TICKS = 70;
/** How long the game will wait for a clear middle before giving up on it. */
export const RESPAWN_PATIENCE = 260;
/** No ship is placed until the middle of the field is this clear. */
export const SPAWN_CLEARANCE = 120;

export const ROCK_R: Record<1 | 2 | 3, number> = { 3: 48, 2: 26, 1: 14 };
export const ROCK_POINTS: Record<1 | 2 | 3, number> = { 3: 20, 2: 50, 1: 100 };
export const SAUCER_POINTS = 200;

export const EXTRA_LIFE_POINTS = 10000;

export const MODE_META: Record<
  Mode,
  { label: string; blurb: string; lives: number; waveOffset: number; scoreScale: number }
> = {
  classic: {
    label: 'Classic',
    blurb: 'Three ships, four shots in the air, and a free one every 10,000.',
    lives: 3,
    waveOffset: 0,
    scoreScale: 1,
  },
  storm: {
    label: 'Storm',
    blurb: 'Every field starts three waves deep. Scores to match.',
    lives: 3,
    waveOffset: 3,
    scoreScale: 1.5,
  },
  lone: {
    label: 'One Ship',
    blurb: 'A single hull, no replacements, and double for everything.',
    lives: 1,
    waveOffset: 0,
    scoreScale: 2,
  },
};

export const MODES: Mode[] = ['classic', 'storm', 'lone'];

export function rocksForWave(mode: Mode, wave: number): number {
  return Math.min(11, 3 + wave + MODE_META[mode].waveOffset);
}

/** Rocks get quicker with the wave, and then stop, so the field stays readable. */
export function rockSpeedFor(mode: Mode, wave: number): number {
  const eff = wave + MODE_META[mode].waveOffset;
  return Math.min(120, 42 + 7 * (eff - 1));
}

export const COLORS = {
  ship: '#e2e8f0',
  thrust: '#e879f9',
  rock: '#cbd5e1',
  bullet: '#f0abfc',
  saucer: '#f0abfc',
  shield: '#f0abfc',
};
