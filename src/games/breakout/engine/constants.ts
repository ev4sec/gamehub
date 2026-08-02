import type { Mode, PowerKind } from './types';

/**
 * The playfield is in world units, not pixels. The renderer scales to whatever
 * the canvas happens to be, so the physics never changes with the window size.
 */
export const FIELD_W = 800;
export const FIELD_H = 600;

export const TICK_MS = 16;
export const DT = TICK_MS / 1000;

export const BALL_R = 8;
export const BASE_SPEED = 340;
export const MAX_SPEED = 920;
/**
 * A floor on how flat a bounce can be, as a fraction of the ball's speed. Two
 * of these matter: without it a ball can end up travelling almost exactly
 * sideways and rattle between the walls forever, and a ball that leaves the
 * paddle too flat never comes back down.
 */
export const MIN_VY_RATIO = 0.28;
/** Ball speed multiplier applied each time a level is cleared. */
export const LEVEL_SPEEDUP = 1.06;

export const PADDLE_W = 104;
export const PADDLE_WIDE_W = 168;
export const PADDLE_H = 14;
export const PADDLE_Y = 548;
export const PADDLE_SPEED = 640;
/** How far off centre a paddle hit can throw the ball, in radians. */
export const MAX_DEFLECT = 1.05;

export const BRICK_COLS = 10;
export const BRICK_ROWS = 8;
export const BRICK_W = 72;
export const BRICK_H = 26;
export const BRICK_GAP = 4;
export const BRICK_TOP = 76;
export const BRICK_LEFT = (FIELD_W - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP)) / 2;

export const DROP_SPEED = 165;
export const DROP_CHANCE = 0.11;

/** How long each power-up lasts, in ticks. `multi` and `extra` are instant. */
export const EFFECT_TICKS: Record<PowerKind, number> = {
  wide: 620,
  slow: 420,
  sticky: 520,
  multi: 0,
  extra: 0,
};

export const POWER_META: Record<PowerKind, { label: string; glyph: string; color: string }> = {
  wide: { label: 'Wide', glyph: '↔', color: '#38bdf8' },
  multi: { label: 'Multi', glyph: '✦', color: '#c084fc' },
  slow: { label: 'Slow', glyph: '◷', color: '#4ade80' },
  sticky: { label: 'Sticky', glyph: '⊙', color: '#fbbf24' },
  extra: { label: 'Life', glyph: '♥', color: '#fb7185' },
};

export const DROPPABLE: PowerKind[] = ['wide', 'multi', 'slow', 'sticky', 'extra'];

export const MODE_META: Record<Mode, { label: string; blurb: string; lives: number }> = {
  classic: {
    label: 'Classic',
    lives: 3,
    blurb: 'Five authored levels, three lives, and power-ups that drop.',
  },
  endless: {
    label: 'Endless',
    lives: 3,
    blurb: 'Layouts built on the fly, getting denser and faster forever.',
  },
  sudden: {
    label: 'Sudden',
    lives: 1,
    blurb: 'The same five levels with a single ball. No second chances.',
  },
};

export const MODES: Mode[] = ['classic', 'endless', 'sudden'];

/** Brick tiers by letter, used by the authored layouts and the generator. */
export const TIERS: Record<string, { hp: number; points: number; color: string }> = {
  a: { hp: 1, points: 50, color: '#38bdf8' },
  b: { hp: 1, points: 70, color: '#4ade80' },
  c: { hp: 2, points: 110, color: '#facc15' },
  d: { hp: 2, points: 140, color: '#fb923c' },
  e: { hp: 3, points: 200, color: '#f43f5e' },
};

export const SOLID_COLOR = '#64748b';

export function speedOf(vx: number, vy: number): number {
  return Math.hypot(vx, vy);
}
