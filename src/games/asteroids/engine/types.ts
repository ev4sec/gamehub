export type Mode = 'classic' | 'storm' | 'lone';

/**
 * `respawning` is the pause after a ship is lost, held until the middle of the
 * field is clear. It is a real state because dropping a new ship into the rock
 * that killed the last one is the single cheapest way to lose three lives.
 */
export type Status = 'ready' | 'playing' | 'paused' | 'respawning' | 'over';

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export interface Ship extends Body {
  /** Radians, zero pointing right, increasing clockwise on the canvas. */
  angle: number;
  thrusting: boolean;
  /** Ticks of spawn protection remaining. */
  invuln: number;
}

export interface Rock extends Body {
  id: number;
  /** 3 large, 2 medium, 1 small. Splitting steps this down by one. */
  size: 1 | 2 | 3;
  /** Radians per second. Decoration only, and dropped under reduced motion. */
  spin: number;
  angle: number;
  /** The vertex radii that give this rock its own outline, in unit terms. */
  shape: number[];
}

export interface Bullet extends Body {
  id: number;
  /** Ticks left before it expires, which is what bounds the range. */
  life: number;
  /** Bullets from the saucer kill the player; the player's kill everything else. */
  hostile: boolean;
}

export interface Saucer extends Body {
  id: number;
  /** Small saucers aim; large ones spray. */
  small: boolean;
  fireIn: number;
}

export type GameEvent =
  | { t: 'fire' }
  | { t: 'thrust' }
  | { t: 'rock'; size: 1 | 2 | 3; points: number }
  | { t: 'saucer'; points: number }
  | { t: 'saucerSpawned' }
  | { t: 'hyperspace' }
  | { t: 'shipLost'; livesLeft: number }
  | { t: 'extraLife' }
  | { t: 'wave'; wave: number }
  | { t: 'over' };

export interface GameState {
  mode: Mode;
  status: Status;
  wave: number;

  ship: Ship;
  rocks: Rock[];
  bullets: Bullet[];
  saucer: Saucer | null;

  lives: number;
  score: number;
  /** Points banked toward the next extra ship. */
  towardExtra: number;

  /** Held input. -1 turns left, 1 turns right, 0 holds the heading. */
  turn: -1 | 0 | 1;
  thrust: boolean;
  /**
   * A heading the ship should rotate toward, set by the touch stick. Null means
   * the keyboard is steering. It is a target, not a teleport: the ship still
   * turns at its own rate, so anticipating your own rotation still matters.
   */
  aim: number | null;

  /** Ticks until the next saucer may appear. */
  saucerIn: number;
  /** Ticks of hold in `ready` and `respawning`. */
  holdTicks: number;
  /** Ticks until the gun will accept another shot. */
  fireCooldown: number;

  elapsedMs: number;
  rngState: number;
  nextId: number;

  events: GameEvent[];
}

export interface Hud {
  mode: Mode;
  status: Status;
  wave: number;
  score: number;
  lives: number;
  rocks: number;
  bullets: number;
  saucer: boolean;
}
