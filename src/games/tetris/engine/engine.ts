import { shuffle } from '../../../platform/rng';
import {
  ARR_MS,
  BOARD_H,
  BOARD_W,
  BUFFER_H,
  CLEAR_SCORES,
  DAS_MS,
  KINDS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  PREVIEW_COUNT,
  QUEUE_MIN,
  SHAPES,
  SOFT_DROP_FACTOR,
  SPAWN_X,
  SPRINT_LINES,
  TICK_MS,
  ULTRA_MS,
  gravityMsFor,
  kicksFor,
} from './constants';
import type {
  Action,
  Cell,
  ClearName,
  GameState,
  Held,
  Hud,
  Mode,
  Piece,
  PieceKind,
  Rotation,
} from './types';

function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_H }, () => Array<Cell>(BOARD_W).fill(null));
}

/** Absolute board cells a piece occupies. The renderer and the tests share it. */
export function cellsOf(kind: PieceKind, rot: Rotation, x: number, y: number): [number, number][] {
  return SHAPES[kind][rot].map(([ox, oy]) => [x + ox, y + oy] as [number, number]);
}

/**
 * A cell counts as blocked when it is off the sides or below the floor, and as
 * free when it is above the board. Pieces spawn partly above the buffer, so
 * treating the sky as solid would top the game out on the first tick.
 */
function blocked(s: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_W || y >= BOARD_H) return true;
  if (y < 0) return false;
  return s.board[y][x] !== null;
}

function collides(s: GameState, kind: PieceKind, rot: Rotation, x: number, y: number): boolean {
  for (const [ox, oy] of SHAPES[kind][rot]) {
    if (blocked(s, x + ox, y + oy)) return true;
  }
  return false;
}

function pullFromBag(s: GameState): PieceKind {
  if (s.bag.length === 0) s.bag = shuffle(s, [...KINDS]);
  return s.bag.pop()!;
}

function topUpQueue(s: GameState): void {
  while (s.queue.length < QUEUE_MIN) s.queue.push(pullFromBag(s));
}

function resetPieceTimers(s: GameState): void {
  s.gravityMs = 0;
  s.lockMs = 0;
  s.lockResets = 0;
  s.grounded = false;
  s.lastMoveWasRotation = false;
  s.lastKickWasLast = false;
}

function topOut(s: GameState): void {
  s.status = 'over';
  s.events.push({ t: 'over' });
}

function place(s: GameState, kind: PieceKind): void {
  const piece: Piece = { kind, rot: 0, x: SPAWN_X[kind], y: 0 };
  s.current = piece;
  resetPieceTimers(s);
  if (collides(s, kind, 0, piece.x, piece.y)) topOut(s);
}

function spawn(s: GameState): void {
  topUpQueue(s);
  const kind = s.queue.shift()!;
  topUpQueue(s);
  place(s, kind);
  s.holdUsed = false;
}

function tryMove(s: GameState, dx: number, dy: number): boolean {
  const p = s.current;
  if (!p) return false;
  if (collides(s, p.kind, p.rot, p.x + dx, p.y + dy)) return false;
  p.x += dx;
  p.y += dy;
  return true;
}

function resting(s: GameState): boolean {
  const p = s.current;
  if (!p) return false;
  return collides(s, p.kind, p.rot, p.x, p.y + 1);
}

/**
 * Refreshes the lock delay after a move or rotation, but only so many times.
 * Without the cap, spinning a piece on the spot postpones the lock forever.
 */
function bumpLockDelay(s: GameState): void {
  if (!s.grounded) return;
  if (s.lockResets >= MAX_LOCK_RESETS) return;
  s.lockResets += 1;
  s.lockMs = 0;
}

function afterShift(s: GameState): void {
  s.lastMoveWasRotation = false;
  s.lastKickWasLast = false;
  bumpLockDelay(s);
  s.events.push({ t: 'move' });
}

function tryRotate(s: GameState, delta: number): boolean {
  const p = s.current;
  if (!p) return false;
  const from = p.rot;
  const to = (((from + delta) % 4) + 4) % 4 as Rotation;
  if (to === from) return false;

  const kicks = kicksFor(p.kind, from, to);
  for (let i = 0; i < kicks.length; i++) {
    const [kx, ky] = kicks[i];
    if (collides(s, p.kind, to, p.x + kx, p.y + ky)) continue;
    p.rot = to;
    p.x += kx;
    p.y += ky;
    s.lastMoveWasRotation = true;
    // The final offset is the contorted one; a T that needed it is always a
    // full T-spin, even when the corner test would only call it a mini.
    s.lastKickWasLast = kicks.length > 1 && i === kicks.length - 1;
    bumpLockDelay(s);
    s.events.push({ t: 'rotate', kicked: i > 0 });
    return true;
  }
  return false;
}

/** Corner indices, in the order [topLeft, topRight, bottomLeft, bottomRight]. */
const T_CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [0, 2],
  [2, 2],
];

/** The two corners the T's flat back does not face, per rotation. */
const T_FRONT: Record<Rotation, readonly [number, number]> = {
  0: [0, 1],
  1: [1, 3],
  2: [2, 3],
  3: [0, 2],
};

function detectTspin(s: GameState, p: Piece): 'none' | 'mini' | 'full' {
  if (p.kind !== 'T' || !s.lastMoveWasRotation) return 'none';

  const filled = T_CORNERS.map(([cx, cy]) => blocked(s, p.x + cx, p.y + cy));
  if (filled.filter(Boolean).length < 3) return 'none';

  const [a, b] = T_FRONT[p.rot];
  if ((filled[a] && filled[b]) || s.lastKickWasLast) return 'full';
  return 'mini';
}

const CLEAR_NAMES: readonly ClearName[] = ['single', 'double', 'triple', 'tetris'];

function scoreKey(tspin: 'none' | 'mini' | 'full', n: number): string {
  if (tspin === 'none') return CLEAR_NAMES[n - 1];
  // A mini that somehow clears two rows is scored as the real thing; the mini
  // table only covers the zero and one row cases.
  const prefix = tspin === 'mini' && n < 2 ? 'tspin-mini' : 'tspin';
  const suffix = n === 0 ? 'none' : CLEAR_NAMES[n - 1];
  return `${prefix}-${suffix}`;
}

/** Tetrises and every T-spin extend a back-to-back chain; nothing else does. */
function isDifficult(tspin: 'none' | 'mini' | 'full', n: number): boolean {
  return n > 0 && (n === 4 || tspin !== 'none');
}

function lockPiece(s: GameState): void {
  const p = s.current;
  if (!p) return;

  const tspin = detectTspin(s, p);
  const cells = cellsOf(p.kind, p.rot, p.x, p.y);
  for (const [cx, cy] of cells) {
    if (cy >= 0 && cy < BOARD_H) s.board[cy][cx] = p.kind;
  }
  s.pieces += 1;
  s.current = null;
  s.events.push({ t: 'lock', kind: p.kind });

  const rows: number[] = [];
  for (let y = 0; y < BOARD_H; y++) {
    if (s.board[y].every((c) => c !== null)) rows.push(y);
  }

  if (rows.length > 0) {
    // Filtered rather than spliced row by row: splicing ascending indices
    // shifts every later row up underneath the loop, so the second splice of a
    // double takes out the wrong line.
    const doomed = new Set(rows);
    s.board = s.board.filter((_, y) => !doomed.has(y));
    for (let i = 0; i < rows.length; i++) s.board.unshift(Array<Cell>(BOARD_W).fill(null));

    s.combo += 1;
    s.lines += rows.length;

    const difficult = isDifficult(tspin, rows.length);
    const chained = difficult && s.backToBack;
    const base = (CLEAR_SCORES[scoreKey(tspin, rows.length)] ?? 0) * s.level;
    const points = Math.floor(base * (chained ? 1.5 : 1)) + s.combo * 50 * s.level;

    s.score += points;
    // Any clear that is not difficult breaks the chain outright.
    s.backToBack = difficult;

    s.events.push({
      t: 'clear',
      rows,
      name: CLEAR_NAMES[rows.length - 1],
      tspin,
      backToBack: chained,
      combo: s.combo,
      points,
    });

    const level = Math.floor(s.lines / 10) + 1;
    if (level > s.level) {
      s.level = level;
      s.events.push({ t: 'levelUp', level });
    }

    if (s.mode === 'sprint' && s.lines >= SPRINT_LINES) {
      s.status = 'cleared';
      s.events.push({ t: 'cleared' });
      return;
    }
  } else {
    s.combo = -1;
    // A T-spin that clears nothing still scores, and still breaks no chain.
    if (tspin !== 'none') {
      s.score += (CLEAR_SCORES[scoreKey(tspin, 0)] ?? 0) * s.level;
    }
    // Locking a piece entirely above the visible field is a top-out, even
    // though nothing collided on the way down.
    if (cells.every(([, cy]) => cy < BUFFER_H)) {
      topOut(s);
      return;
    }
  }

  spawn(s);
}

function applyAction(s: GameState, action: Action): void {
  if (!s.current) return;

  switch (action) {
    case 'moveLeft':
      if (tryMove(s, -1, 0)) afterShift(s);
      break;
    case 'moveRight':
      if (tryMove(s, 1, 0)) afterShift(s);
      break;
    case 'rotateCW':
      tryRotate(s, 1);
      break;
    case 'rotateCCW':
      tryRotate(s, -1);
      break;
    case 'rotate180':
      tryRotate(s, 2);
      break;
    case 'hardDrop': {
      let dropped = 0;
      while (tryMove(s, 0, 1)) dropped += 1;
      s.score += dropped * 2;
      // A piece already flush with its landing keeps its rotation flag, so a
      // T-spin that is spun into place and immediately slammed still counts.
      if (dropped > 0) {
        s.lastMoveWasRotation = false;
        s.lastKickWasLast = false;
      }
      s.events.push({ t: 'hardDrop', cells: dropped });
      lockPiece(s);
      break;
    }
    case 'hold': {
      if (s.holdUsed) break;
      const outgoing = s.current.kind;
      const incoming = s.hold;
      s.hold = outgoing;
      if (incoming) place(s, incoming);
      else spawn(s);
      s.holdUsed = true;
      s.events.push({ t: 'hold' });
      break;
    }
  }
}

function handleShift(s: GameState): void {
  const dir: -1 | 0 | 1 = s.held.left && !s.held.right ? -1 : s.held.right && !s.held.left ? 1 : 0;

  if (dir === 0) {
    s.dasDir = 0;
    s.dasMs = 0;
    s.arrMs = 0;
    return;
  }

  // A fresh press moves once immediately; only then does the charge begin.
  if (dir !== s.dasDir) {
    s.dasDir = dir;
    s.dasMs = 0;
    s.arrMs = 0;
    if (tryMove(s, dir, 0)) afterShift(s);
    return;
  }

  s.dasMs += TICK_MS;
  if (s.dasMs < DAS_MS) return;

  s.arrMs += TICK_MS;
  while (s.arrMs >= ARR_MS) {
    s.arrMs -= ARR_MS;
    if (!tryMove(s, dir, 0)) break;
    afterShift(s);
  }
}

function handleGravity(s: GameState): void {
  if (!s.current) return;

  const base = gravityMsFor(s.level);
  const interval = s.held.softDrop ? Math.max(TICK_MS, base / SOFT_DROP_FACTOR) : base;

  s.gravityMs += TICK_MS;
  let dropped = 0;
  while (s.gravityMs >= interval) {
    s.gravityMs -= interval;
    if (!tryMove(s, 0, 1)) break;
    dropped += 1;
    s.lastMoveWasRotation = false;
    s.lastKickWasLast = false;
    // Falling to a new row earns the piece a fresh set of lock-delay resets.
    s.lockResets = 0;
  }
  if (dropped > 0 && s.held.softDrop) s.score += dropped;

  if (resting(s)) {
    if (!s.grounded) {
      s.grounded = true;
      s.lockMs = 0;
    }
    s.lockMs += TICK_MS;
    if (s.lockMs >= LOCK_DELAY_MS) lockPiece(s);
  } else {
    s.grounded = false;
    s.lockMs = 0;
  }
}

export function createGame(mode: Mode, seed: number = Date.now()): GameState {
  const s: GameState = {
    mode,
    status: 'playing',
    board: emptyBoard(),
    current: null,
    queue: [],
    hold: null,
    holdUsed: false,
    bag: [],
    rngState: seed | 0,
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    backToBack: false,
    pieces: 0,
    elapsedMs: 0,
    timeLeftMs: mode === 'ultra' ? ULTRA_MS : 0,
    gravityMs: 0,
    lockMs: 0,
    lockResets: 0,
    grounded: false,
    held: { left: false, right: false, softDrop: false },
    dasDir: 0,
    dasMs: 0,
    arrMs: 0,
    lastMoveWasRotation: false,
    lastKickWasLast: false,
    pending: [],
    events: [],
  };

  topUpQueue(s);
  spawn(s);
  s.events = [];
  return s;
}

/** Advances the simulation by exactly one `TICK_MS`. */
export function step(s: GameState): void {
  s.events = [];
  if (s.status !== 'playing') return;

  s.elapsedMs += TICK_MS;

  if (s.mode === 'ultra') {
    s.timeLeftMs = Math.max(0, s.timeLeftMs - TICK_MS);
    if (s.timeLeftMs === 0) {
      s.status = 'over';
      s.events.push({ t: 'over' });
      return;
    }
  }

  const actions = s.pending;
  s.pending = [];
  for (const action of actions) {
    applyAction(s, action);
    if (s.status !== 'playing') return;
  }

  handleShift(s);
  handleGravity(s);
}

export function queueAction(s: GameState, action: Action): void {
  if (s.status !== 'playing') return;
  s.pending.push(action);
}

export function setHeld(s: GameState, key: keyof Held, down: boolean): void {
  s.held[key] = down;
}

export function togglePause(s: GameState): void {
  if (s.status === 'playing') {
    s.status = 'paused';
    // Releases are not delivered while paused, so a key held at the moment of
    // pausing would otherwise still be held on resume.
    s.held = { left: false, right: false, softDrop: false };
    s.dasDir = 0;
  } else if (s.status === 'paused') {
    s.status = 'playing';
  }
}

/** How far the current piece would fall on a hard drop. */
export function ghostY(s: GameState): number {
  const p = s.current;
  if (!p) return 0;
  let y = p.y;
  while (!collides(s, p.kind, p.rot, p.x, y + 1)) y += 1;
  return y;
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    score: s.score,
    lines: s.lines,
    level: s.level,
    combo: s.combo,
    backToBack: s.backToBack,
    pieces: s.pieces,
    elapsedMs: s.elapsedMs,
    timeLeftMs: s.timeLeftMs,
    hold: s.hold,
    next: s.queue.slice(0, PREVIEW_COUNT),
    linesGoal: s.mode === 'sprint' ? SPRINT_LINES : 0,
  };
}
