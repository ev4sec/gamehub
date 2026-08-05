export type Mode = 'classic' | 'rush' | 'gentle';

/**
 * `ready` is the beat before a life starts moving, so a player who has just
 * died is not immediately run over by traffic that was already on top of them.
 */
export type Status = 'ready' | 'playing' | 'paused' | 'levelComplete' | 'over';

export type Dir = 'up' | 'down' | 'left' | 'right';

export type LaneKind = 'road' | 'river';

/** What the occupants of a lane are, which decides how they are drawn. */
export type Occupant = 'car' | 'truck' | 'log' | 'turtle';

/**
 * A lane, as one repeating pattern rather than a list of vehicles.
 *
 * The pattern is `span` cells of occupant followed by `gap` cells of nothing,
 * repeating forever in both directions. `phase` is how far the whole pattern
 * has slid, in cells, and it is the only thing that changes as the lane runs.
 * Whether any point is covered is then a modulo test: exact, drift-free, and
 * thirteen floats for a whole board instead of sixty moving objects.
 */
export interface Lane {
  row: number;
  kind: LaneKind;
  occupant: Occupant;
  /** 1 travels right, -1 travels left. */
  dir: 1 | -1;
  /** Cells per second, before the level multiplier. */
  speed: number;
  span: number;
  gap: number;
  /** Advances every tick, wrapped to `span + gap`. */
  phase: number;
  /**
   * Milliseconds in a turtle lane's dive cycle. Absent means it never dives.
   * The last `DIVE_MS` of each cycle is underwater, and the run-up before that
   * is telegraphed with bubbles rather than with a flash.
   */
  diveCycleMs?: number;
  /** Offset into the dive cycle, so two diving lanes are never in step. */
  diveOffsetMs?: number;
}

export interface Frog {
  /** The cell the frog is in. Always an integer. */
  col: number;
  row: number;
  /**
   * Sub-cell drift, only ever non-zero while riding. Kept apart from `col` so
   * that hopping stays exact and only the ride is continuous.
   */
  carry: number;
  /** Ticks left in the hop animation. Visual only; the move already happened. */
  hopTicks: number;
  /** Where the hop came from, so the renderer can draw the arc. */
  fromCol: number;
  fromRow: number;
}

export type GameEvent =
  | { t: 'hop' }
  | { t: 'blocked' }
  | { t: 'home'; bay: number; points: number }
  | { t: 'squashed' }
  | { t: 'drowned' }
  | { t: 'timeout' }
  | { t: 'levelComplete'; level: number }
  | { t: 'over' };

export interface GameState {
  mode: Mode;
  status: Status;
  level: number;

  lanes: Lane[];
  frog: Frog;
  /** One flag per home bay, left to right. */
  homes: boolean[];

  lives: number;
  score: number;
  /** The furthest row reached this life, so forward progress scores once. */
  bestRow: number;

  /** Milliseconds left on this crossing. */
  timeLeftMs: number;
  timeLimitMs: number;

  /** Ticks the `ready` and `levelComplete` pauses still have to run. */
  holdTicks: number;

  elapsedMs: number;
  rngState: number;

  events: GameEvent[];
}

export interface Hud {
  mode: Mode;
  status: Status;
  level: number;
  score: number;
  lives: number;
  homes: boolean[];
  /** Whole seconds, quantized here so the HUD signature cannot churn per tick. */
  secondsLeft: number;
  /** Fraction of the crossing timer remaining, for the bar. */
  timeFraction: number;
  row: number;
}
