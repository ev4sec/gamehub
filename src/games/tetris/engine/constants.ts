import type { Mode, PieceKind, Rotation } from './types';

export const BOARD_W = 10;
export const VISIBLE_H = 20;
/** Rows above the visible field, where pieces spawn. Never drawn. */
export const BUFFER_H = 2;
export const BOARD_H = VISIBLE_H + BUFFER_H;

/**
 * The engine steps on a fixed 16ms tick and does its own millisecond
 * accounting on top. Gravity, lock delay and auto-repeat all need finer
 * resolution than one gravity step, so the tick cannot be the gravity interval.
 */
export const TICK_MS = 16;

export const KINDS: readonly PieceKind[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const PREVIEW_COUNT = 3;
/** The queue is topped up to this, so a preview never runs dry mid-draw. */
export const QUEUE_MIN = 7;

/** Delayed auto-shift: how long a held direction waits before repeating. */
export const DAS_MS = 150;
/** Auto-repeat rate once shifting has started. */
export const ARR_MS = 33;
/** Soft drop moves this many times faster than the current gravity. */
export const SOFT_DROP_FACTOR = 20;

export const LOCK_DELAY_MS = 500;
/** Moving or rotating refreshes the lock delay, but only this many times. */
export const MAX_LOCK_RESETS = 15;

export const SPRINT_LINES = 40;
export const ULTRA_MS = 120_000;

export const MODE_META: Record<Mode, { label: string; blurb: string }> = {
  marathon: {
    label: 'Marathon',
    blurb: 'Gravity rises every ten lines. Play until you top out.',
  },
  sprint: {
    label: 'Sprint',
    blurb: 'Forty lines, as fast as you can. The clock is the score.',
  },
  ultra: {
    label: 'Ultra',
    blurb: 'Two minutes. Score as much as the board will give you.',
  },
};

export const COLORS: Record<PieceKind, string> = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#f97316',
  O: '#facc15',
  S: '#4ade80',
  T: '#c084fc',
  Z: '#f43f5e',
};

/**
 * Cell offsets for each piece in each rotation, as [x, y] inside the piece's
 * bounding box. Written out per rotation rather than derived by rotating a
 * matrix, because SRS is defined by these exact occupancies and a generic
 * rotation gets S, Z and I subtly wrong.
 */
type Offsets = readonly (readonly [number, number])[];

export const SHAPES: Record<PieceKind, readonly Offsets[]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  O: [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};

/** Column each piece spawns at, so the piece straddles the middle. */
export const SPAWN_X: Record<PieceKind, number> = {
  I: 3,
  J: 3,
  L: 3,
  O: 4,
  S: 3,
  T: 3,
  Z: 3,
};

/**
 * SRS wall kicks, keyed `from>to`.
 *
 * The published tables are written with y pointing up. This board has y
 * pointing down, so every y here is the published value negated. Getting that
 * backwards is the classic SRS bug: rotations still work, they just kick into
 * the floor instead of over it.
 */
type Kicks = readonly (readonly [number, number])[];

const JLSTZ_KICKS: Record<string, Kicks> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

const I_KICKS: Record<string, Kicks> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const NO_KICKS: Kicks = [[0, 0]];

export function kicksFor(kind: PieceKind, from: Rotation, to: Rotation): Kicks {
  if (kind === 'O') return NO_KICKS;
  const key = `${from}>${to}`;
  const table = kind === 'I' ? I_KICKS : JLSTZ_KICKS;
  // A 180 has no published table; it simply succeeds or it does not.
  return table[key] ?? NO_KICKS;
}

/**
 * Gravity interval in ms for a level, from the guideline curve. Levels past
 * the table are all sub-frame anyway, so it bottoms out rather than hitting
 * zero and dividing by nothing.
 */
export function gravityMsFor(level: number): number {
  const n = Math.max(1, Math.min(level, 20));
  const seconds = Math.pow(0.8 - (n - 1) * 0.007, n - 1);
  return Math.max(TICK_MS, seconds * 1000);
}

/** Base line-clear scores, before the level multiplier. */
export const CLEAR_SCORES: Record<string, number> = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  'tspin-mini-none': 100,
  'tspin-mini-single': 200,
  'tspin-none': 400,
  'tspin-single': 800,
  'tspin-double': 1200,
  'tspin-triple': 1600,
};
