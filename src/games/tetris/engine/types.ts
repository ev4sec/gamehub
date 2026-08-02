export type Mode = 'marathon' | 'sprint' | 'ultra';

export type PieceKind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

/** A board cell holds the kind that filled it, so colour survives the lock. */
export type Cell = PieceKind | null;

export type Rotation = 0 | 1 | 2 | 3;

/**
 * `cleared` is a win, `over` is a top-out. Sprint is the only mode that can
 * reach `cleared`, but the shell treats them the same way: the run is done.
 */
export type Status = 'playing' | 'paused' | 'over' | 'cleared';

export interface Piece {
  kind: PieceKind;
  rot: Rotation;
  /** Top-left of the piece's bounding box, in board cells. y grows downward. */
  x: number;
  y: number;
}

/**
 * Discrete, one-shot inputs. Sustained movement goes through `held` instead,
 * which is what drives auto-repeat; these are the single-cell nudges a tap or a
 * touch button sends.
 */
export type Action =
  | 'moveLeft'
  | 'moveRight'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'hardDrop'
  | 'hold';

export interface Held {
  left: boolean;
  right: boolean;
  softDrop: boolean;
}

export type ClearName = 'single' | 'double' | 'triple' | 'tetris';

export interface ClearEvent {
  t: 'clear';
  rows: number[];
  name: ClearName;
  tspin: 'none' | 'mini' | 'full';
  backToBack: boolean;
  combo: number;
  points: number;
}

export type GameEvent =
  | ClearEvent
  | { t: 'lock'; kind: PieceKind }
  | { t: 'move' }
  | { t: 'rotate'; kicked: boolean }
  | { t: 'hardDrop'; cells: number }
  | { t: 'hold' }
  | { t: 'levelUp'; level: number }
  | { t: 'over' }
  | { t: 'cleared' };

export interface GameState {
  mode: Mode;
  status: Status;

  /** Row-major, `BOARD_H` rows of `BOARD_W`. Rows 0..BUFFER_H-1 are hidden. */
  board: Cell[][];
  current: Piece | null;
  /** Upcoming pieces, refilled from the bag. Never shorter than PREVIEW_COUNT. */
  queue: PieceKind[];
  hold: PieceKind | null;
  /** Hold is once per piece; taking one locks it out until the next lock. */
  holdUsed: boolean;

  bag: PieceKind[];
  rngState: number;

  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  /** Pieces locked. Drives the pieces-per-second readout. */
  pieces: number;

  elapsedMs: number;
  /** Ultra only. Counts down; the run ends at zero. */
  timeLeftMs: number;

  /** Milliseconds banked toward the next gravity step. */
  gravityMs: number;
  /** Milliseconds the piece has been resting on a surface. */
  lockMs: number;
  /** Lock-delay resets spent on this piece, capped so it cannot be stalled. */
  lockResets: number;
  /** True once the piece has touched down at least once. */
  grounded: boolean;

  held: Held;
  /** Direction currently auto-repeating, with its charge in ms. */
  dasDir: -1 | 0 | 1;
  dasMs: number;
  arrMs: number;

  /** Set when the last successful action was a rotation, for T-spin scoring. */
  lastMoveWasRotation: boolean;
  /** True when that rotation used the final, most contorted kick offset. */
  lastKickWasLast: boolean;

  pending: Action[];
  /** Rebuilt every step. The UI reads it; nothing in the engine keeps it. */
  events: GameEvent[];
}

/** The flattened view the React layer renders. The engine owns nothing here. */
export interface Hud {
  mode: Mode;
  status: Status;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  pieces: number;
  elapsedMs: number;
  timeLeftMs: number;
  hold: PieceKind | null;
  next: PieceKind[];
  linesGoal: number;
}
