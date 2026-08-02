export type Mode = 'classic' | 'endless' | 'sudden';

/**
 * `ready` is the ball resting on the paddle before a launch. It is a real
 * state rather than a flag because nothing should move during it, including
 * the power-up drops still falling from the last life.
 */
export type Status = 'ready' | 'playing' | 'paused' | 'levelComplete' | 'over' | 'cleared';

export type PowerKind = 'wide' | 'multi' | 'slow' | 'sticky' | 'extra';

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Resting on the paddle, waiting to be launched. Carries its offset. */
  stuckOffset: number | null;
}

export interface Brick {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  points: number;
  /** Never breaks and never counts toward clearing the level. */
  solid: boolean;
  /** Carried on the brick so the renderer needs no lookup back into the tiers. */
  color: string;
}

export interface Drop {
  id: number;
  kind: PowerKind;
  x: number;
  y: number;
}

export interface Paddle {
  x: number;
  w: number;
}

export type GameEvent =
  | { t: 'launch' }
  | { t: 'bounce'; surface: 'wall' | 'ceiling' | 'paddle' }
  | { t: 'brick'; points: number; destroyed: boolean }
  | { t: 'drop'; kind: PowerKind }
  | { t: 'power'; kind: PowerKind }
  | { t: 'lifeLost'; livesLeft: number }
  | { t: 'levelComplete'; level: number }
  | { t: 'over' }
  | { t: 'cleared' };

export interface GameState {
  mode: Mode;
  status: Status;
  level: number;

  paddle: Paddle;
  balls: Ball[];
  bricks: Brick[];
  drops: Drop[];

  lives: number;
  score: number;
  /** Bricks broken without losing the ball; resets on a life lost. */
  combo: number;

  /** Remaining ticks per active power-up. Absent means inactive. */
  effects: Partial<Record<PowerKind, number>>;

  held: { left: boolean; right: boolean };
  /** Set when a mouse or finger is steering; overrides the keys while present. */
  pointerX: number | null;

  elapsedMs: number;
  rngState: number;
  nextId: number;

  events: GameEvent[];
}

export interface Hud {
  mode: Mode;
  status: Status;
  level: number;
  score: number;
  lives: number;
  combo: number;
  balls: number;
  bricksLeft: number;
  effects: { kind: PowerKind; ticks: number }[];
}
