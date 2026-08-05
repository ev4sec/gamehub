export type Mode = 'classic' | 'rush' | 'gentle';

export type Status = 'ready' | 'playing' | 'paused' | 'dying' | 'levelComplete' | 'over';

export type Dir = 'up' | 'down' | 'left' | 'right';

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

/** Scatter and chase alternate on a schedule; frightened interrupts both. */
export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';

/**
 * An actor: a tile, a direction, and how far along that direction it has got.
 *
 * The fraction is the whole design. Wall legality and dot eating are tile
 * tests, exact and never a float comparison, and a direction is chosen only on
 * arrival at a tile. That is what makes four independent ghosts cost about
 * thirty AI evaluations a second between them instead of two hundred and forty.
 */
export interface Actor {
  tx: number;
  ty: number;
  dir: Dir;
  /** The turn the player has asked for, applied at the next tile that allows it. */
  next: Dir | null;
  /** 0 to 1 along `dir`, from the current tile toward the next one. */
  offset: number;
}

export interface Ghost extends Actor {
  name: GhostName;
  mode: GhostMode;
  /** Ticks of fright left on this ghost. Zero when it is not frightened. */
  frightTicks: number;
  /** True until it has left the pen for the first time. */
  penned: boolean;
  /** Ticks before it is released from the pen at the start of a life. */
  releaseIn: number;
}

export type GameEvent =
  | { t: 'dot' }
  | { t: 'pellet' }
  | { t: 'ghost'; points: number; chain: number }
  | { t: 'eaten' }
  | { t: 'extraLife' }
  | { t: 'levelComplete'; level: number }
  | { t: 'over' };

export interface GameState {
  mode: Mode;
  status: Status;
  level: number;

  grid: import('./maze').Cell[][];
  pac: Actor;
  ghosts: Ghost[];

  dotsLeft: number;
  lives: number;
  score: number;
  towardExtra: number;

  /** How many ghosts have been eaten on the current pellet, for the 200 to 1600. */
  chain: number;

  /** Index into the scatter and chase schedule, and ticks left in that phase. */
  phase: number;
  phaseTicks: number;
  /** Ticks of fright left overall, which is what the HUD chip counts down. */
  frightTicks: number;
  /**
   * Ticks the player's queued turn stays alive for. It lives on the state
   * rather than in the module so two games can never share one buffer, which a
   * suite that runs several soaks in one process would otherwise do.
   */
  turnTicks: number;

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
  dotsLeft: number;
  ghostMode: GhostMode;
  /** Whole seconds, quantized so the signature cannot churn every tick. */
  frightSeconds: number;
  frightFraction: number;
}
