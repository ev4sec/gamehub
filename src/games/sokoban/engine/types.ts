export type Dir = 'up' | 'down' | 'left' | 'right';

export type Status = 'playing' | 'solved';

export interface Level {
  name: string;
  /**
   * Standard Sokoban notation, one character per cell.
   * `#` wall, ` ` floor, `.` goal, `$` box, `*` box on a goal,
   * `@` player, `+` player standing on a goal.
   */
  rows: string[];
}

/** One move, kept so it can be taken back. */
export interface Step {
  dx: number;
  dy: number;
  /** Whether this move also shifted a box, which undo has to put back. */
  pushed: boolean;
}

export type GameEvent =
  | { t: 'move' }
  | { t: 'push' }
  | { t: 'blocked' }
  | { t: 'undo' }
  | { t: 'reset' }
  | { t: 'solved'; moves: number; pushes: number };

export interface GameState {
  levelIndex: number;
  name: string;
  width: number;
  height: number;

  /** Indexed [y][x]. Neither changes once the level is built. */
  walls: boolean[][];
  goals: boolean[][];

  /** Cell indices, `y * width + x`. */
  boxes: Set<number>;
  player: { x: number; y: number };

  moves: number;
  pushes: number;
  status: Status;

  /**
   * Every move, in order. Sokoban is a game about taking things back, so the
   * history is unbounded rather than the single step 2048 keeps.
   */
  history: Step[];

  events: GameEvent[];
}

export interface Hud {
  levelIndex: number;
  name: string;
  moves: number;
  pushes: number;
  status: Status;
  boxes: number;
  onGoal: number;
  canUndo: boolean;
  /** A box shoved into a corner it can never leave. */
  stuck: boolean;
}
