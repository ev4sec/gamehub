import type { Dir, GhostName, Mode } from './types';

export const TICK_MS = 16;
export const DT = TICK_MS / 1000;

/** Tiles per second. Everything else in the game is timed against these. */
export const PAC_SPEED = 8;
export const GHOST_SPEED = 7.4;
export const FRIGHTENED_SPEED = 4.6;
/** Eyes going home move fast, so a chain does not stall the run. */
export const EATEN_SPEED = 17;
/** Ghosts are slowed in the tunnel, which is what makes it a refuge. */
export const TUNNEL_SPEED = 4;

export const READY_TICKS = 110;
export const DYING_TICKS = 90;
export const LEVEL_TICKS = 120;

/**
 * How long a turn stays queued. Long enough that pressing early works, short
 * enough that a turn you gave up on does not fire a corridor later.
 */
export const TURN_BUFFER_TICKS = 44;

export const DOT_POINTS = 10;
export const PELLET_POINTS = 50;
/** 200, 400, 800, 1600 within one pellet, exactly as the cabinet does it. */
export const GHOST_POINTS = [200, 400, 800, 1600];
export const EXTRA_LIFE_POINTS = 10000;

/** Scatter and chase, in ticks, then chase forever once the list runs out. */
export const PHASES = [
  { mode: 'scatter' as const, ticks: 7 * 62 },
  { mode: 'chase' as const, ticks: 20 * 62 },
  { mode: 'scatter' as const, ticks: 7 * 62 },
  { mode: 'chase' as const, ticks: 20 * 62 },
  { mode: 'scatter' as const, ticks: 5 * 62 },
  { mode: 'chase' as const, ticks: 20 * 62 },
  { mode: 'scatter' as const, ticks: 5 * 62 },
];

/** Fright shortens as the levels climb, and eventually stops being a rescue. */
export function frightTicksFor(mode: Mode, level: number): number {
  const base = MODE_META[mode].frightSeconds;
  return Math.max(1 * 62, Math.round((base - (level - 1) * 0.5) * 62));
}

/** The corner each ghost retreats to when scattering. */
export const SCATTER_TARGETS: Record<GhostName, { x: number; y: number }> = {
  blinky: { x: 25, y: 0 },
  pinky: { x: 2, y: 0 },
  inky: { x: 27, y: 30 },
  clyde: { x: 0, y: 30 },
};

export const GHOST_START: Record<GhostName, { x: number; y: number; penned: boolean }> = {
  blinky: { x: 13, y: 11, penned: false },
  pinky: { x: 13, y: 14, penned: true },
  inky: { x: 11, y: 14, penned: true },
  clyde: { x: 16, y: 14, penned: true },
};

/** Staggered so the pen empties over the first few seconds, not all at once. */
export const GHOST_RELEASE: Record<GhostName, number> = {
  blinky: 0,
  pinky: 90,
  inky: 260,
  clyde: 460,
};

export const GHOST_NAMES: GhostName[] = ['blinky', 'pinky', 'inky', 'clyde'];

/**
 * The order legal turns are considered in. It is not arbitrary: preferring up,
 * then left, then down, then right is what produces the original's movement,
 * and changing it changes how every ghost feels.
 */
export const DIR_ORDER: Dir[] = ['up', 'left', 'down', 'right'];

export const DELTA: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const MODE_META: Record<
  Mode,
  { label: string; blurb: string; lives: number; pace: number; frightSeconds: number }
> = {
  classic: {
    label: 'Classic',
    blurb: 'Three lives, four ghosts, and six seconds of courage a pellet.',
    lives: 3,
    pace: 1,
    frightSeconds: 6,
  },
  rush: {
    label: 'Rush',
    blurb: 'Faster ghosts and half the fright. They learn your corners.',
    lives: 3,
    pace: 1.18,
    frightSeconds: 3,
  },
  gentle: {
    label: 'Gentle',
    blurb: 'Five lives, slower ghosts, and ten seconds to make them count.',
    lives: 5,
    pace: 0.85,
    frightSeconds: 10,
  },
};

export const MODES: Mode[] = ['classic', 'rush', 'gentle'];

/** Ghosts get quicker with the level, and then stop. */
export function paceFor(mode: Mode, level: number): number {
  return MODE_META[mode].pace * Math.min(1.35, 1 + 0.05 * (level - 1));
}

export const COLORS = {
  wall: '#2563eb',
  wallShadow: '#1e3a8a',
  field: '#020617',
  dot: '#e2e8f0',
  pellet: '#fdba74',
  hero: '#fb923c',
  gate: '#94a3b8',
  frightened: '#1d4ed8',
  frightenedEdge: '#f8fafc',
  eyes: '#f8fafc',
  ghosts: {
    blinky: '#fb7185',
    pinky: '#f472b6',
    inky: '#38bdf8',
    clyde: '#a3e635',
  } as Record<GhostName, string>,
};
