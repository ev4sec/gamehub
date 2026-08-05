import type { Mode } from './types';

/**
 * Thirteen columns by fifteen rows. The row count is the constraint that
 * matters: the cell size is the board's height divided by it, and at fifteen
 * rows a phone with roughly 300px of board height still draws a 16px frog.
 * Sixteen rows would put it under the legibility floor.
 */
export const COLS = 13;
export const ROWS = 15;

export const TICK_MS = 16;
export const DT = TICK_MS / 1000;

export const ROW_HOMES = 0;
export const RIVER_TOP = 1;
export const RIVER_BOTTOM = 5;
export const ROW_MEDIAN = 6;
export const ROAD_TOP = 7;
export const ROAD_BOTTOM = 12;
export const ROW_START = 13;

/** The five bays, evenly spaced across the far bank. */
export const HOME_COLS = [0, 3, 6, 9, 12];

/** Ticks a hop takes to draw. The move itself is instantaneous. */
export const HOP_TICKS = 7;

/** Ticks the ready banner and the level tally hold. */
export const READY_TICKS = 45;
export const LEVEL_TICKS = 120;

/** A turtle lane's underwater stretch, and the warning before it. */
export const DIVE_MS = 1000;
export const BUBBLE_MS = 900;

export const POINTS_FORWARD = 10;
export const POINTS_HOME = 50;
export const POINTS_PER_SECOND = 10;
export const POINTS_LEVEL = 1000;

/** Speed climbs with the level and then stops, so a lane stays crossable. */
export const MAX_SPEED_MULTIPLIER = 2;

export function speedMultiplier(level: number): number {
  return Math.min(MAX_SPEED_MULTIPLIER, 1 + 0.12 * (level - 1));
}

export const MODE_META: Record<
  Mode,
  { label: string; blurb: string; lives: number; timeMs: number; pace: number; scoreScale: number }
> = {
  classic: {
    label: 'Classic',
    blurb: 'Three lives, thirty seconds a crossing, five bays to fill.',
    lives: 3,
    timeMs: 30000,
    pace: 1,
    scoreScale: 1,
  },
  rush: {
    label: 'Rush',
    blurb: 'Everything a quarter faster and ten seconds shorter. Worth more.',
    lives: 3,
    timeMs: 22000,
    pace: 1.25,
    scoreScale: 1.5,
  },
  gentle: {
    label: 'Gentle',
    blurb: 'Five lives, forty-five seconds, traffic that lets you think.',
    lives: 5,
    timeMs: 45000,
    pace: 0.8,
    scoreScale: 0.6,
  },
};

export const MODES: Mode[] = ['classic', 'rush', 'gentle'];

/** Turtles start diving here, not before. A first level should teach the water. */
export const DIVE_FROM_LEVEL = 3;

export const COLORS = {
  road: '#0b1120',
  lane: 'rgba(148, 163, 184, 0.18)',
  river: '#082f49',
  riverEdge: '#0c4a6e',
  bank: '#1a2e05',
  frog: '#a3e635',
  frogEdge: '#365314',
  frogEye: '#f8fafc',
  log: '#a16207',
  logGrain: '#713f12',
  turtle: '#10b981',
  turtleShell: '#065f46',
  home: '#a3e635',
  /** Deliberately not the accent: on this board the accent means "you". */
  cars: ['#f87171', '#38bdf8', '#fbbf24', '#e2e8f0', '#c084fc', '#fb923c'],
};
