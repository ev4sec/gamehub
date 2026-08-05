/**
 * Colours for the hub's preview art.
 *
 * Every value here is hand-copied from the game it depicts, and the source file
 * is named beside it. The duplication is deliberate: the hub imports no game
 * code, because a game's bundle must not ship inside the entry chunk. Lifting
 * these into the platform instead would make the platform own game aesthetics
 * and break "each game is self-contained", which is the larger debt of the two.
 *
 * If a game's palette changes and its preview looks wrong, the fix is here.
 */

/** From games/snake/skins.ts, the emerald skin. */
export const SNAKE = {
  head: '#86efac',
  tail: '#15803d',
  apple: '#f87171',
};

/** From games/tetris/engine/constants.ts, COLORS. */
export const TETRIS: Record<string, string> = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#f97316',
  O: '#facc15',
  S: '#4ade80',
  T: '#c084fc',
  Z: '#f43f5e',
};

/** From games/2048/engine/constants.ts, TILE_STYLES. */
export const TILES: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#1e293b', fg: '#e2e8f0' },
  4: { bg: '#27364b', fg: '#e2e8f0' },
  8: { bg: '#2563eb', fg: '#f8fafc' },
  16: { bg: '#4f46e5', fg: '#f8fafc' },
  32: { bg: '#7c3aed', fg: '#f8fafc' },
  64: { bg: '#a21caf', fg: '#f8fafc' },
  128: { bg: '#be185d', fg: '#f8fafc' },
};

/** From games/breakout/engine/constants.ts, TIERS a/b/c and the paddle. */
export const BREAKOUT = {
  rows: ['#38bdf8', '#4ade80', '#facc15'],
  paddle: '#e2e8f0',
  ball: '#f8fafc',
};

/** From games/sokoban/ui/Board.tsx. Goals stay emerald: there it means "goal". */
export const SOKOBAN = {
  wall: '#1e293b',
  goal: '#34d399',
  crate: '#f59e0b',
  crateEdge: '#fcd34d',
  home: '#10b981',
  homeEdge: '#6ee7b7',
  player: '#7dd3fc',
};

/** From games/missile/renderer.ts, and WAVE_COLORS in its engine constants. */
export const MISSILE = {
  trail: '#f87171',
  city: '#7dd3fc',
  battery: '#fb923c',
  ammo: '#fed7aa',
  interceptor: '#e2e8f0',
  blastCore: '#fef08a',
  blastEdge: '#fb923c',
  ground: '#1e293b',
};

/** From games/frogger/engine/constants.ts, COLORS. */
export const FROGGER = {
  road: '#0b1120',
  river: '#082f49',
  bank: '#1a2e05',
  frog: '#a3e635',
  frogEdge: '#365314',
  log: '#a16207',
  logGrain: '#713f12',
  cars: ['#f87171', '#38bdf8', '#fbbf24'],
};

/** From games/asteroids/engine/constants.ts, COLORS. */
export const ASTEROIDS = {
  ship: '#e2e8f0',
  thrust: '#e879f9',
  rock: '#cbd5e1',
  bullet: '#f0abfc',
};

/** From games/mazechase/engine/constants.ts, COLORS. */
export const MAZECHASE = {
  field: '#020617',
  wall: '#2563eb',
  wallShadow: '#1e3a8a',
  dot: '#e2e8f0',
  pellet: '#fdba74',
  hero: '#fb923c',
  blinky: '#fb7185',
  inky: '#38bdf8',
};

export const FIELD = {
  grid: 'rgba(148, 163, 184, 0.07)',
  panel: 'rgba(30, 41, 59, 0.5)',
};
