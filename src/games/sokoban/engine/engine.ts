import { LEVELS } from './levels';
import type { Dir, GameState, Hud, Level, Step } from './types';

export const VECTORS: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function cellKey(width: number, x: number, y: number): number {
  return y * width + x;
}

export function cellXY(width: number, key: number): { x: number; y: number } {
  return { x: key % width, y: Math.floor(key / width) };
}

/**
 * Builds a level from its picture.
 *
 * Rows are padded to the widest one, so a layout written with trailing spaces
 * trimmed still produces a rectangular grid rather than an array with holes in
 * it that every later lookup has to guard against.
 */
export function buildLevel(level: Level, index: number): GameState {
  const width = Math.max(...level.rows.map((r) => r.length));
  const height = level.rows.length;

  const walls: boolean[][] = [];
  const goals: boolean[][] = [];
  const boxes = new Set<number>();
  let player = { x: 0, y: 0 };

  for (let y = 0; y < height; y++) {
    const row = level.rows[y].padEnd(width, ' ');
    walls.push([]);
    goals.push([]);
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      walls[y].push(ch === '#');
      goals[y].push(ch === '.' || ch === '*' || ch === '+');
      if (ch === '$' || ch === '*') boxes.add(cellKey(width, x, y));
      if (ch === '@' || ch === '+') player = { x, y };
    }
  }

  return {
    levelIndex: index,
    name: level.name,
    width,
    height,
    walls,
    goals,
    boxes,
    player,
    moves: 0,
    pushes: 0,
    status: 'playing',
    history: [],
    events: [],
  };
}

export function createGame(levelIndex: number): GameState {
  const index = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
  return buildLevel(LEVELS[index], index);
}

function isWall(s: GameState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= s.width || y >= s.height) return true;
  return s.walls[y][x];
}

function isGoal(s: GameState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= s.width || y >= s.height) return false;
  return s.goals[y][x];
}

export function boxesOnGoal(s: GameState): number {
  let count = 0;
  for (const key of s.boxes) {
    const { x, y } = cellXY(s.width, key);
    if (isGoal(s, x, y)) count += 1;
  }
  return count;
}

export function isSolved(s: GameState): boolean {
  return boxesOnGoal(s) === s.boxes.size;
}

/**
 * A box wedged into a corner of two walls can never be moved again, so unless
 * it is already home the level is lost. Reported rather than enforced: the
 * player is told, and decides whether to undo or start over.
 */
export function isStuck(s: GameState): boolean {
  for (const key of s.boxes) {
    const { x, y } = cellXY(s.width, key);
    if (isGoal(s, x, y)) continue;
    const vertical = isWall(s, x, y - 1) || isWall(s, x, y + 1);
    const horizontal = isWall(s, x - 1, y) || isWall(s, x + 1, y);
    if (vertical && horizontal) return true;
  }
  return false;
}

export function move(s: GameState, dir: Dir): boolean {
  s.events = [];
  if (s.status === 'solved') return false;

  const { x: dx, y: dy } = VECTORS[dir];
  const nx = s.player.x + dx;
  const ny = s.player.y + dy;

  if (isWall(s, nx, ny)) {
    s.events.push({ t: 'blocked' });
    return false;
  }

  let pushed = false;
  const ahead = cellKey(s.width, nx, ny);

  if (s.boxes.has(ahead)) {
    const bx = nx + dx;
    const by = ny + dy;
    // A box cannot be pushed into a wall, and one box cannot push another.
    if (isWall(s, bx, by) || s.boxes.has(cellKey(s.width, bx, by))) {
      s.events.push({ t: 'blocked' });
      return false;
    }
    s.boxes.delete(ahead);
    s.boxes.add(cellKey(s.width, bx, by));
    pushed = true;
    s.pushes += 1;
  }

  s.player = { x: nx, y: ny };
  s.moves += 1;
  s.history.push({ dx, dy, pushed });
  s.events.push(pushed ? { t: 'push' } : { t: 'move' });

  if (isSolved(s)) {
    s.status = 'solved';
    s.events.push({ t: 'solved', moves: s.moves, pushes: s.pushes });
  }

  return true;
}

export function undo(s: GameState): boolean {
  s.events = [];
  const step: Step | undefined = s.history.pop();
  if (!step) return false;

  if (step.pushed) {
    // The box is one step beyond the player; it comes back to where the
    // player is standing, and the player steps back out of the way.
    const from = cellKey(s.width, s.player.x + step.dx, s.player.y + step.dy);
    s.boxes.delete(from);
    s.boxes.add(cellKey(s.width, s.player.x, s.player.y));
    s.pushes -= 1;
  }

  s.player = { x: s.player.x - step.dx, y: s.player.y - step.dy };
  s.moves -= 1;
  s.status = 'playing';
  s.events.push({ t: 'undo' });
  return true;
}

export function reset(s: GameState): GameState {
  const fresh = createGame(s.levelIndex);
  fresh.events = [{ t: 'reset' }];
  return fresh;
}

export function levelCount(): number {
  return LEVELS.length;
}

export function hudOf(s: GameState): Hud {
  return {
    levelIndex: s.levelIndex,
    name: s.name,
    moves: s.moves,
    pushes: s.pushes,
    status: s.status,
    boxes: s.boxes.size,
    onGoal: boxesOnGoal(s),
    canUndo: s.history.length > 0,
    stuck: s.status === 'playing' && isStuck(s),
  };
}
