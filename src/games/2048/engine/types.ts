export type Mode = 'classic' | 'petite' | 'grand';

export type Dir = 'up' | 'down' | 'left' | 'right';

/** `won` is reachable and playable through: hitting the goal does not stop the run. */
export type Status = 'playing' | 'won' | 'over';

export interface Tile {
  /** Stable across moves, so the view can animate a tile from where it was. */
  id: number;
  value: number;
  x: number;
  y: number;
  /** Spawned by the move just played. */
  isNew: boolean;
  /** Produced by a merge in the move just played. */
  merged: boolean;
}

/** One move's worth of undo. Deep enough to restore, cheap enough to keep. */
export interface Snapshot {
  tiles: Tile[];
  score: number;
  moves: number;
  status: Status;
  reachedGoal: boolean;
}

export type GameEvent =
  | { t: 'move'; dir: Dir }
  | { t: 'merge'; value: number }
  | { t: 'spawn'; value: number }
  | { t: 'blocked' }
  | { t: 'undo' }
  | { t: 'win' }
  | { t: 'over' };

export interface GameState {
  mode: Mode;
  size: number;
  goal: number;

  tiles: Tile[];
  /**
   * Tiles consumed by a merge on the last move. They are not on the board and
   * never count for occupancy; they exist only so the view can slide them into
   * the merge before they vanish.
   */
  fading: Tile[];

  score: number;
  moves: number;
  status: Status;
  /** Sticky: the goal stays reached even after the player continues past it. */
  reachedGoal: boolean;

  rngState: number;
  nextId: number;

  undo: Snapshot | null;

  events: GameEvent[];
}

export interface Hud {
  mode: Mode;
  status: Status;
  size: number;
  goal: number;
  score: number;
  moves: number;
  highest: number;
  canUndo: boolean;
  reachedGoal: boolean;
}
