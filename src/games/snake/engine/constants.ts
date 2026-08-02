import type { PowerKind } from './types';

export const GRID = 24;

/** Milliseconds per tick at the start of a run. */
export const BASE_TICK = 132;
/** The fastest the game is ever allowed to get. */
export const MIN_TICK = 62;
/** Each apple shaves this many milliseconds off the tick. */
export const RAMP_PER_APPLE = 2.2;

export const START_LENGTH = 3;

/** Apples must be eaten within this many ticks of each other to build a combo. */
export const COMBO_WINDOW = 46;
export const MAX_COMBO = 8;
export const APPLE_POINTS = 10;
/** Awarded for taking down the rival snake. */
export const RIVAL_BOUNTY = 50;

/** One power-up drops every N apples. */
export const DROP_EVERY = 5;
export const DROP_TTL = 110;

/** In Endless, new hazard blocks appear every N apples. */
export const HAZARD_EVERY = 8;
export const HAZARD_BATCH = 2;
export const HAZARD_CAP = 44;

export const TIME_ATTACK_MS = 60_000;
/** Each apple buys back this much clock in Time Attack. */
export const TIME_BONUS_MS = 1_600;

export const RIVAL_RESPAWN_TICKS = 34;
export const RIVAL_START_LENGTH = 4;

/** Chebyshev radius the magnet vacuums food from. */
export const MAGNET_RADIUS = 2;
/** Segments removed by a shrink pickup. */
export const SHRINK_AMOUNT = 4;
/** The tick interval is multiplied by this while slow-mo is active. */
export const SLOW_FACTOR = 1.75;

export const EFFECT_TICKS: Record<PowerKind, number> = {
  slow: 55,
  ghost: 46,
  magnet: 62,
  double: 78,
  shrink: 0, // instant, never becomes an active effect
};

export const POWER_META: Record<
  PowerKind,
  { label: string; glyph: string; color: string; blurb: string }
> = {
  slow: { label: 'Slow-Mo', glyph: '⏱', color: '#38bdf8', blurb: 'Time thins out' },
  ghost: { label: 'Ghost', glyph: '👻', color: '#c084fc', blurb: 'Phase through everything' },
  magnet: { label: 'Magnet', glyph: '🧲', color: '#fb923c', blurb: 'Food comes to you' },
  double: { label: 'Double', glyph: '✕2', color: '#facc15', blurb: 'Every apple counts twice' },
  shrink: { label: 'Shrink', glyph: '✂', color: '#f472b6', blurb: 'Trim the tail' },
};

export const MODE_META: Record<
  string,
  { label: string; blurb: string; glyph: string }
> = {
  endless: {
    label: 'Endless',
    glyph: '∞',
    blurb: 'Open arena. Hazards creep in, the pace climbs, nothing stops it.',
  },
  timeAttack: {
    label: 'Time Attack',
    glyph: '⏱',
    blurb: 'Sixty seconds. Every apple buys a little more of them back.',
  },
  maze: {
    label: 'Maze',
    glyph: '⌘',
    blurb: 'Five hand-built layouts with portals. Clear the quota, move on.',
  },
  rival: {
    label: 'Rival',
    glyph: '⚔',
    blurb: 'A second snake wants the same apples. Only one of you is careful.',
  },
};

export const cellKey = (x: number, y: number): number => (x << 8) | y;
