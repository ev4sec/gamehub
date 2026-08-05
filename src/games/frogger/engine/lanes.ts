import { DIVE_FROM_LEVEL, MODE_META, speedMultiplier } from './constants';
import type { Lane, Mode } from './types';

/**
 * The authored board.
 *
 * Speeds are cells per second at level one; `span` and `gap` are in cells and
 * never change, which is what keeps a lane crossable however fast it gets. The
 * clear window a player has is `gap / speed` seconds and the ride window is
 * `span / speed`, both of which the engine suite checks in closed form for
 * every level rather than hoping a soak stumbles into the bad one.
 */
const BASE: Omit<Lane, 'phase'>[] = [
  // The river, read from the median upward. Alternating directions, so a
  // crossing is a sequence of decisions rather than one long drift.
  { row: 5, kind: 'river', occupant: 'log', dir: 1, speed: 1.4, span: 3, gap: 3 },
  {
    row: 4,
    kind: 'river',
    occupant: 'turtle',
    dir: -1,
    speed: 1.9,
    span: 3,
    gap: 3,
    diveCycleMs: 5600,
    diveOffsetMs: 0,
  },
  { row: 3, kind: 'river', occupant: 'log', dir: 1, speed: 1, span: 4, gap: 4 },
  {
    row: 2,
    kind: 'river',
    occupant: 'turtle',
    dir: -1,
    speed: 1.8,
    span: 3,
    gap: 3,
    diveCycleMs: 6400,
    diveOffsetMs: 3100,
  },
  { row: 1, kind: 'river', occupant: 'log', dir: 1, speed: 1.6, span: 3, gap: 3 },

  // The road, read from the near bank upward. Trucks are the slow wide ones.
  { row: 12, kind: 'road', occupant: 'car', dir: -1, speed: 1.6, span: 1, gap: 4 },
  { row: 11, kind: 'road', occupant: 'car', dir: 1, speed: 2, span: 1, gap: 5 },
  { row: 10, kind: 'road', occupant: 'car', dir: -1, speed: 2.6, span: 1, gap: 6 },
  { row: 9, kind: 'road', occupant: 'truck', dir: 1, speed: 1.4, span: 2, gap: 5 },
  { row: 8, kind: 'road', occupant: 'car', dir: -1, speed: 3.2, span: 1, gap: 7 },
  { row: 7, kind: 'road', occupant: 'car', dir: 1, speed: 2.2, span: 1, gap: 4 },
];

/**
 * Starting phases, so a fresh board is not a row of vehicles in lockstep.
 *
 * The sixth entry is the near road lane, and it is 3 rather than 1 for a
 * specific reason: at 1 a car sat exactly on the column above the frog's start
 * cell, so the very first hop of a new life was into traffic with no way to
 * read it. The engine suite asserts that cell is clear at the opening.
 */
const OPENING_PHASE = [0, 1.5, 3, 0.5, 2.5, 3, 3.5, 2, 0, 4, 1.5];

export function buildLanes(mode: Mode, level: number): Lane[] {
  const pace = MODE_META[mode].pace * speedMultiplier(level);

  return BASE.map((lane, i) => ({
    ...lane,
    speed: lane.speed * pace,
    phase: OPENING_PHASE[i] % (lane.span + lane.gap),
    // Turtles float until the player has had two levels to learn the water.
    diveCycleMs: level >= DIVE_FROM_LEVEL ? lane.diveCycleMs : undefined,
  }));
}

/** The unscaled table, for the engine suite to reason about directly. */
export const BASE_LANES = BASE;
