import { cellKey } from './constants';
import type { Dir, Vec } from './types';

export const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const ORDER: Dir[] = ['up', 'right', 'down', 'left'];

interface Board {
  gridW: number;
  gridH: number;
  /** Every cell the rival must not enter. */
  blocked: Set<number>;
}

function inBounds(b: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < b.gridW && y < b.gridH;
}

function open(b: Board, x: number, y: number): boolean {
  return inBounds(b, x, y) && !b.blocked.has(cellKey(x, y));
}

/**
 * Breadth-first search from `head` to the nearest cell in `goals`.
 * Returns the direction of the first step along that path, or null if no
 * goal is reachable.
 */
function bfsStep(b: Board, head: Vec, goals: Vec[]): Dir | null {
  if (goals.length === 0) return null;

  const goalKeys = new Set(goals.map((g) => cellKey(g.x, g.y)));
  // Maps a visited cell to the direction of the very first step that led there.
  const firstStep = new Map<number, Dir>();
  const queue: Vec[] = [];

  for (const dir of ORDER) {
    const nx = head.x + DIRS[dir].x;
    const ny = head.y + DIRS[dir].y;
    if (!open(b, nx, ny)) continue;
    const k = cellKey(nx, ny);
    if (firstStep.has(k)) continue;
    firstStep.set(k, dir);
    if (goalKeys.has(k)) return dir;
    queue.push({ x: nx, y: ny });
  }

  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const step = firstStep.get(cellKey(cur.x, cur.y))!;
    for (const dir of ORDER) {
      const nx = cur.x + DIRS[dir].x;
      const ny = cur.y + DIRS[dir].y;
      if (!open(b, nx, ny)) continue;
      const k = cellKey(nx, ny);
      if (firstStep.has(k)) continue;
      firstStep.set(k, step);
      if (goalKeys.has(k)) return step;
      queue.push({ x: nx, y: ny });
    }
  }

  return null;
}

/** How many cells the rival could still reach if it stepped to (x, y). */
function reachable(b: Board, x: number, y: number, cap: number): number {
  if (!open(b, x, y)) return 0;
  const seen = new Set<number>([cellKey(x, y)]);
  const queue: Vec[] = [{ x, y }];

  for (let i = 0; i < queue.length && seen.size < cap; i++) {
    const cur = queue[i];
    for (const dir of ORDER) {
      const nx = cur.x + DIRS[dir].x;
      const ny = cur.y + DIRS[dir].y;
      if (!open(b, nx, ny)) continue;
      const k = cellKey(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny });
    }
  }

  return seen.size;
}

/**
 * Picks the rival's next direction: shortest path to food when one exists and
 * taking it does not immediately box the rival in, otherwise the move that
 * leaves it the most room. Returns null when every option is fatal.
 */
export function chooseRivalDir(
  gridW: number,
  gridH: number,
  blocked: Set<number>,
  head: Vec,
  currentDir: Dir,
  food: Vec[],
  rivalLength: number,
): Dir | null {
  const board: Board = { gridW, gridH, blocked };

  const legal = ORDER.filter((dir) => {
    if (dir === OPPOSITE[currentDir]) return false;
    return open(board, head.x + DIRS[dir].x, head.y + DIRS[dir].y);
  });
  if (legal.length === 0) return null;

  // Enough room to fit the whole body plus a little slack, or the rival is
  // walking into a pocket it cannot get back out of.
  const needed = rivalLength + 2;

  const hungry = bfsStep(board, head, food);
  if (hungry && legal.includes(hungry)) {
    const room = reachable(board, head.x + DIRS[hungry].x, head.y + DIRS[hungry].y, needed);
    if (room >= needed) return hungry;
  }

  let best: Dir | null = null;
  let bestRoom = -1;
  for (const dir of legal) {
    const room = reachable(board, head.x + DIRS[dir].x, head.y + DIRS[dir].y, needed * 3);
    if (room > bestRoom) {
      bestRoom = room;
      best = dir;
    }
  }

  return best;
}
