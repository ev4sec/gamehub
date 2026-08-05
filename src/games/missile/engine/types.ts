export type Mode = 'classic' | 'blitz' | 'survival';

/**
 * `ready` is the pause before a wave launches, so the player can read what is
 * coming rather than losing a city to a missile that was already falling when
 * the screen appeared. `waveComplete` is the tally, which is a real state
 * because scoring the bonus takes time the simulation must not be running for.
 */
export type Status = 'ready' | 'playing' | 'paused' | 'waveComplete' | 'over';

/** What a falling thing is. Kept on the entity so the renderer needs no lookup. */
export type ThreatKind = 'missile' | 'splitter' | 'smart';

export interface City {
  id: number;
  x: number;
  alive: boolean;
}

export interface Battery {
  id: number;
  x: number;
  ammo: number;
  alive: boolean;
}

export interface Threat {
  id: number;
  kind: ThreatKind;
  /** Where it entered, kept so the renderer can draw the whole trail. */
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Ground point it is aimed at. Splitters re-aim their children. */
  tx: number;
  /** Altitude at which a splitter breaks up. Null once it has, or never had to. */
  splitY: number | null;
  /** Painted per wave so a screen full of trails still reads as layered. */
  color: string;
}

export interface Bomber {
  id: number;
  x: number;
  y: number;
  vx: number;
  /** Ticks until it drops its next missile. */
  dropIn: number;
}

export interface Interceptor {
  id: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
}

/**
 * An explosion. One shape covers both sides: the player's interceptors and the
 * ground hits an enemy missile makes when it lands. `hostile` only decides what
 * it is allowed to destroy and what color it is drawn.
 */
export interface Blast {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
  /** Counts up. The three phases are read off it rather than stored. */
  age: number;
  hostile: boolean;
  /**
   * How many kills deep the chain that produced this blast is. Zero means the
   * player fired it. The sound climbs with it, which is the only feedback a
   * six-missile chain gets while it is happening.
   */
  chain: number;
}

export type GameEvent =
  | { t: 'fire' }
  | { t: 'dryFire' }
  | { t: 'blast' }
  | { t: 'kill'; kind: ThreatKind | 'bomber'; points: number; chained: boolean }
  | { t: 'cityLost' }
  | { t: 'baseLost' }
  | { t: 'bonusCity' }
  | { t: 'waveComplete'; wave: number }
  | { t: 'over' };

export interface GameState {
  mode: Mode;
  status: Status;
  wave: number;

  cities: City[];
  batteries: Battery[];
  threats: Threat[];
  bombers: Bomber[];
  interceptors: Interceptor[];
  blasts: Blast[];

  score: number;
  /** Points scored toward the next free city, so the award is not re-triggered. */
  towardBonus: number;
  /** Threats still to be released this wave, and the countdown to the next one. */
  pending: number;
  spawnIn: number;
  /** Bombers still to be released this wave. */
  pendingBombers: number;
  bomberIn: number;

  /** Filled at the end of a wave and read by the tally overlay. */
  tally: { ammo: number; cities: number; points: number } | null;

  /** Ticks the `ready` and `waveComplete` pauses still have to run. */
  holdTicks: number;

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
  cities: number;
  ammo: number;
  /** Per battery, so the HUD can show which side of the screen is dry. */
  batteries: { ammo: number; alive: boolean }[];
  incoming: number;
  tally: { ammo: number; cities: number; points: number } | null;
}
