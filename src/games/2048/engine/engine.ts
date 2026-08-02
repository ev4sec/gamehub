import { rand, randInt } from '../../../platform/rng';
import { FOUR_CHANCE, MODE_META, STARTING_TILES } from './constants';
import type { Dir, GameState, Hud, Mode, Snapshot, Tile } from './types';

/**
 * The whole game, with no clock anywhere in it.
 *
 * Nothing here advances by itself: state changes only when `move`, `undo` or
 * `restart` is called. That is the point of putting this game in the hub third.
 * If the platform had assumed every game ticks, this is where it would have
 * shown, and `platform/loop` would have had to be something a game is handed
 * rather than something a game opts into.
 */

function occupancy(s: GameState): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: s.size }, () =>
    Array<Tile | null>(s.size).fill(null),
  );
  // `fading` is deliberately not consulted: those tiles are already gone.
  for (const t of s.tiles) grid[t.y][t.x] = t;
  return grid;
}

function emptyCells(s: GameState): { x: number; y: number }[] {
  const grid = occupancy(s);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < s.size; y++) {
    for (let x = 0; x < s.size; x++) {
      if (!grid[y][x]) cells.push({ x, y });
    }
  }
  return cells;
}

function spawnTile(s: GameState): Tile | null {
  const cells = emptyCells(s);
  if (cells.length === 0) return null;

  const spot = cells[randInt(s, cells.length)];
  const value = rand(s) < FOUR_CHANCE ? 4 : 2;
  const tile: Tile = {
    id: s.nextId++,
    value,
    x: spot.x,
    y: spot.y,
    isNew: true,
    merged: false,
  };
  s.tiles.push(tile);
  s.events.push({ t: 'spawn', value });
  return tile;
}

/**
 * Reads one row or column in the order tiles travel for this direction, so the
 * merge scan below is always a plain left-to-right walk regardless of `dir`.
 */
function readLine(grid: (Tile | null)[][], size: number, dir: Dir, i: number): (Tile | null)[] {
  const line: (Tile | null)[] = [];
  for (let j = 0; j < size; j++) {
    if (dir === 'left') line.push(grid[i][j]);
    else if (dir === 'right') line.push(grid[i][size - 1 - j]);
    else if (dir === 'up') line.push(grid[j][i]);
    else line.push(grid[size - 1 - j][i]);
  }
  return line;
}

/** The inverse of `readLine`: where slot `j` of line `i` actually sits. */
function positionFor(dir: Dir, size: number, i: number, j: number): { x: number; y: number } {
  if (dir === 'left') return { x: j, y: i };
  if (dir === 'right') return { x: size - 1 - j, y: i };
  if (dir === 'up') return { x: i, y: j };
  return { x: i, y: size - 1 - j };
}

function snapshot(s: GameState): Snapshot {
  return {
    tiles: s.tiles.map((t) => ({ ...t })),
    score: s.score,
    moves: s.moves,
    status: s.status,
    reachedGoal: s.reachedGoal,
  };
}

export function canMove(s: GameState): boolean {
  const grid = occupancy(s);
  for (let y = 0; y < s.size; y++) {
    for (let x = 0; x < s.size; x++) {
      const tile = grid[y][x];
      if (!tile) return true;
      const right = x + 1 < s.size ? grid[y][x + 1] : null;
      const down = y + 1 < s.size ? grid[y + 1][x] : null;
      if (right && right.value === tile.value) return true;
      if (down && down.value === tile.value) return true;
    }
  }
  return false;
}

export function highestTile(s: GameState): number {
  return s.tiles.reduce((best, t) => Math.max(best, t.value), 0);
}

/**
 * Plays one move. Returns whether the board actually changed; a move that
 * changes nothing is not a move, so it costs no turn and spawns no tile.
 */
export function move(s: GameState, dir: Dir): boolean {
  s.events = [];
  if (s.status === 'over') return false;

  // Last move's leftovers go now, not on render, so nothing stale can be
  // mistaken for a live tile. Flags are cleared before the snapshot is taken
  // so an undo does not restore a spawn animation along with the position.
  s.fading = [];
  for (const t of s.tiles) {
    t.isNew = false;
    t.merged = false;
  }

  const previous = snapshot(s);

  const grid = occupancy(s);
  const survivors: Tile[] = [];
  /** Each consumed tile paired with the tile that ate it, for the slide. */
  const consumed: { eaten: Tile; eater: Tile }[] = [];
  let changed = false;
  let gained = 0;

  for (let i = 0; i < s.size; i++) {
    const line = readLine(grid, s.size, dir, i);
    const packed = line.filter((t): t is Tile => t !== null);

    const result: Tile[] = [];
    let k = 0;
    while (k < packed.length) {
      const tile = packed[k];
      const neighbour = packed[k + 1];
      // A tile merges at most once per move, which is why this consumes both
      // and steps past them rather than folding the result back into the scan.
      if (neighbour && neighbour.value === tile.value) {
        tile.value *= 2;
        tile.merged = true;
        gained += tile.value;
        consumed.push({ eaten: neighbour, eater: tile });
        s.events.push({ t: 'merge', value: tile.value });
        changed = true;
        result.push(tile);
        k += 2;
      } else {
        result.push(tile);
        k += 1;
      }
    }

    result.forEach((tile, j) => {
      const spot = positionFor(dir, s.size, i, j);
      if (tile.x !== spot.x || tile.y !== spot.y) changed = true;
      tile.x = spot.x;
      tile.y = spot.y;
      survivors.push(tile);
    });
  }

  if (!changed) {
    // Nothing moved: put back exactly what was there and charge nothing.
    s.tiles = previous.tiles;
    s.events.push({ t: 'blocked' });
    return false;
  }

  // Consumed tiles travel to their eater's landing square before vanishing.
  // Paired at merge time rather than matched by value afterwards, because two
  // merges in one move can easily produce the same number.
  for (const { eaten, eater } of consumed) {
    eaten.x = eater.x;
    eaten.y = eater.y;
  }

  s.tiles = survivors;
  s.fading = consumed.map(({ eaten }) => eaten);
  s.score += gained;
  s.moves += 1;
  s.undo = previous;
  s.events.push({ t: 'move', dir });

  spawnTile(s);

  if (!s.reachedGoal && highestTile(s) >= s.goal) {
    s.reachedGoal = true;
    s.status = 'won';
    s.events.push({ t: 'win' });
  }

  if (!canMove(s)) {
    s.status = 'over';
    s.events.push({ t: 'over' });
  }

  return true;
}

/** Takes back the last move. One deep, and spent once used. */
export function undoMove(s: GameState): boolean {
  const previous = s.undo;
  if (!previous) return false;

  s.events = [];
  s.tiles = previous.tiles.map((t) => ({ ...t }));
  s.fading = [];
  s.score = previous.score;
  s.moves = previous.moves;
  s.status = previous.status;
  s.reachedGoal = previous.reachedGoal;
  s.undo = null;
  s.events.push({ t: 'undo' });
  return true;
}

/** Carries on after the goal tile, keeping the win on the record. */
export function keepPlaying(s: GameState): void {
  if (s.status === 'won') s.status = 'playing';
}

export function createGame(mode: Mode, seed: number = Date.now()): GameState {
  const meta = MODE_META[mode];
  const s: GameState = {
    mode,
    size: meta.size,
    goal: meta.goal,
    tiles: [],
    fading: [],
    score: 0,
    moves: 0,
    status: 'playing',
    reachedGoal: false,
    rngState: seed | 0,
    nextId: 1,
    undo: null,
    events: [],
  };

  for (let i = 0; i < STARTING_TILES; i++) spawnTile(s);
  s.events = [];
  return s;
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    size: s.size,
    goal: s.goal,
    score: s.score,
    moves: s.moves,
    highest: highestTile(s),
    canUndo: s.undo !== null,
    reachedGoal: s.reachedGoal,
  };
}
