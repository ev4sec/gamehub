export type Vec = { x: number; y: number };

export type Dir = 'up' | 'down' | 'left' | 'right';

export type Mode = 'endless' | 'timeAttack' | 'maze' | 'rival';

export type Status = 'playing' | 'paused' | 'over' | 'levelComplete';

export type PowerKind = 'slow' | 'ghost' | 'magnet' | 'double' | 'shrink';

export type DeathCause = 'wall' | 'self' | 'rival' | 'time';

export interface Portal {
  a: Vec;
  b: Vec;
}

/** A power-up sitting on the board, waiting to be picked up. */
export interface Drop {
  kind: PowerKind;
  pos: Vec;
  /** Ticks remaining before it despawns. */
  ttl: number;
}

/** A power-up the player has picked up and is currently under. */
export interface Effect {
  kind: PowerKind;
  ticks: number;
}

/**
 * Emitted by `step` so the renderer and audio layer can react to what
 * happened without re-deriving it by diffing state.
 */
export type GameEvent =
  | { t: 'eat'; pos: Vec; gained: number; combo: number }
  | { t: 'power'; kind: PowerKind; pos: Vec }
  | { t: 'portal'; from: Vec; to: Vec }
  | { t: 'death'; pos: Vec; cause: DeathCause }
  | { t: 'levelUp'; level: number }
  | { t: 'rivalDown'; pos: Vec }
  | { t: 'hazard'; pos: Vec };

export interface GameState {
  mode: Mode;
  status: Status;
  tick: number;

  gridW: number;
  gridH: number;

  snake: Vec[];
  dir: Dir;
  /** Buffered direction inputs, drained one per tick. */
  queue: Dir[];
  /** Ticks the tail should stay put, one per apple still being digested. */
  pendingGrowth: number;

  food: Vec[];
  drops: Drop[];
  effects: Effect[];

  /** Wall cells, keyed by `cellKey`. */
  walls: Set<number>;
  portals: Portal[];

  rival: Vec[] | null;
  rivalDir: Dir;
  /** Ticks until a downed rival respawns. */
  rivalRespawn: number;

  score: number;
  apples: number;
  combo: number;
  /** Ticks left in which another apple keeps the combo alive. */
  comboTicks: number;

  level: number;
  /** Apples still needed to clear the current maze level. */
  levelGoal: number;

  /** Milliseconds remaining, Time Attack only. */
  timeLeft: number;

  deathCause: DeathCause | null;
  rngState: number;
  events: GameEvent[];
}

/** A read-only snapshot handed to React, so the loop can stay out of state. */
export interface Hud {
  status: Status;
  mode: Mode;
  score: number;
  apples: number;
  combo: number;
  level: number;
  levelGoal: number;
  timeLeft: number;
  length: number;
  rivalLength: number;
  effects: Effect[];
  deathCause: DeathCause | null;
}
