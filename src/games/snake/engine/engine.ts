import { DIRS, OPPOSITE, chooseRivalDir } from './ai';
import {
  APPLE_POINTS,
  BASE_TICK,
  COMBO_WINDOW,
  DROP_EVERY,
  DROP_TTL,
  EFFECT_TICKS,
  GRID,
  HAZARD_BATCH,
  HAZARD_CAP,
  HAZARD_EVERY,
  MAGNET_RADIUS,
  MAX_COMBO,
  MIN_TICK,
  RAMP_PER_APPLE,
  RIVAL_BOUNTY,
  RIVAL_RESPAWN_TICKS,
  RIVAL_START_LENGTH,
  SHRINK_AMOUNT,
  SLOW_FACTOR,
  START_LENGTH,
  TIME_ATTACK_MS,
  TIME_BONUS_MS,
  cellKey,
} from './constants';
import { LEVELS, arenaWalls, levelQuota } from './levels';
import { randInt, pick } from './rng';
import type {
  DeathCause,
  Dir,
  GameState,
  Hud,
  Mode,
  PowerKind,
  Vec,
} from './types';

const ALL_POWERS: PowerKind[] = ['slow', 'ghost', 'magnet', 'double', 'shrink'];

/** Time Attack runs hotter with two apples on the board at once. */
function foodCount(mode: Mode): number {
  return mode === 'timeAttack' ? 2 : 1;
}

export function hasEffect(s: GameState, kind: PowerKind): boolean {
  return s.effects.some((e) => e.kind === kind && e.ticks > 0);
}

/** Milliseconds this tick should last, after ramp and slow-mo. */
export function tickInterval(s: GameState): number {
  let ms = BASE_TICK - s.apples * RAMP_PER_APPLE;
  if (s.mode === 'maze') ms -= s.level * 4;
  ms = Math.max(MIN_TICK, ms);
  if (hasEffect(s, 'slow')) ms *= SLOW_FACTOR;
  return ms;
}

/** Every cell nothing new should be spawned on. */
function occupied(s: GameState): Set<number> {
  const set = new Set<number>(s.walls);
  for (const p of s.snake) set.add(cellKey(p.x, p.y));
  if (s.rival) for (const p of s.rival) set.add(cellKey(p.x, p.y));
  for (const f of s.food) set.add(cellKey(f.x, f.y));
  for (const d of s.drops) set.add(cellKey(d.pos.x, d.pos.y));
  for (const p of s.portals) {
    set.add(cellKey(p.a.x, p.a.y));
    set.add(cellKey(p.b.x, p.b.y));
  }
  return set;
}

/**
 * A uniformly random free cell. Builds the free list rather than rejection
 * sampling, so a nearly full board still terminates.
 */
function freeCell(s: GameState, taken = occupied(s)): Vec | null {
  const free: Vec[] = [];
  for (let y = 0; y < s.gridH; y++) {
    for (let x = 0; x < s.gridW; x++) {
      if (!taken.has(cellKey(x, y))) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[randInt(s, free.length)];
}

function refillFood(s: GameState): void {
  const want = foodCount(s.mode);
  const taken = occupied(s);
  while (s.food.length < want) {
    const cell = freeCell(s, taken);
    if (!cell) return;
    taken.add(cellKey(cell.x, cell.y));
    s.food.push(cell);
  }
}

function spawnDrop(s: GameState): void {
  const cell = freeCell(s);
  if (!cell) return;
  s.drops.push({ kind: pick(s, ALL_POWERS), pos: cell, ttl: DROP_TTL });
}

function spawnHazards(s: GameState): void {
  if (s.walls.size >= HAZARD_CAP + 4 * GRID) return;
  const head = s.snake[0];

  for (let n = 0; n < HAZARD_BATCH; n++) {
    const taken = occupied(s);
    const candidates: Vec[] = [];

    for (let y = 1; y < s.gridH - 1; y++) {
      for (let x = 1; x < s.gridW - 1; x++) {
        if (taken.has(cellKey(x, y))) continue;
        // Never drop a block on top of the player.
        if (Math.abs(x - head.x) + Math.abs(y - head.y) < 5) continue;
        // Avoid walling off pockets: skip cells already hemmed in.
        let neighbours = 0;
        for (const d of Object.values(DIRS)) {
          if (s.walls.has(cellKey(x + d.x, y + d.y))) neighbours++;
        }
        if (neighbours >= 3) continue;
        candidates.push({ x, y });
      }
    }

    if (candidates.length === 0) return;
    const cell = candidates[randInt(s, candidates.length)];
    s.walls.add(cellKey(cell.x, cell.y));
    s.events.push({ t: 'hazard', pos: cell });
  }
}

function placeSnake(start: Vec): Vec[] {
  const body: Vec[] = [];
  for (let i = 0; i < START_LENGTH; i++) body.push({ x: start.x - i, y: start.y });
  return body;
}

function spawnRival(s: GameState): void {
  // Put the rival as far from the player as a free cell allows.
  const taken = occupied(s);
  const head = s.snake[0];
  let best: Vec | null = null;
  let bestDist = -1;

  for (let y = 1; y < s.gridH - 1; y++) {
    for (let x = 1; x < s.gridW - 1; x++) {
      if (taken.has(cellKey(x, y))) continue;
      // Needs room behind it for a body.
      let ok = true;
      for (let i = 0; i < RIVAL_START_LENGTH; i++) {
        if (taken.has(cellKey(x + i, y)) || x + i >= s.gridW - 1) ok = false;
      }
      if (!ok) continue;
      const dist = Math.abs(x - head.x) + Math.abs(y - head.y);
      if (dist > bestDist) {
        bestDist = dist;
        best = { x, y };
      }
    }
  }

  if (!best) return;
  const body: Vec[] = [];
  for (let i = 0; i < RIVAL_START_LENGTH; i++) body.push({ x: best.x + i, y: best.y });
  s.rival = body;
  s.rivalDir = 'left';
  s.rivalRespawn = 0;
}

export function createGame(mode: Mode, seed = Date.now() >>> 0, level = 0): GameState {
  const isMaze = mode === 'maze';
  const layout = isMaze ? LEVELS[level % LEVELS.length] : null;
  const start = layout ? layout.start : { x: Math.floor(GRID / 2), y: Math.floor(GRID / 2) };

  const s: GameState = {
    mode,
    status: 'playing',
    tick: 0,
    gridW: GRID,
    gridH: GRID,
    snake: placeSnake(start),
    dir: 'right',
    queue: [],
    pendingGrowth: 0,
    food: [],
    drops: [],
    effects: [],
    walls: layout ? new Set(layout.walls) : arenaWalls(),
    portals: layout ? layout.portals.map((p) => ({ a: { ...p.a }, b: { ...p.b } })) : [],
    rival: null,
    rivalDir: 'left',
    rivalRespawn: 0,
    score: 0,
    apples: 0,
    combo: 0,
    comboTicks: 0,
    level,
    levelGoal: isMaze ? levelQuota(level) : 0,
    timeLeft: mode === 'timeAttack' ? TIME_ATTACK_MS : 0,
    deathCause: null,
    rngState: seed | 0,
    events: [],
  };

  refillFood(s);
  if (mode === 'rival') spawnRival(s);
  return s;
}

/** Carries score and apples into the next maze layout. */
export function advanceLevel(s: GameState): void {
  s.level += 1;
  const layout = LEVELS[s.level % LEVELS.length];
  s.walls = new Set(layout.walls);
  s.portals = layout.portals.map((p) => ({ a: { ...p.a }, b: { ...p.b } }));
  s.snake = placeSnake(layout.start);
  s.dir = 'right';
  s.queue = [];
  s.pendingGrowth = 0;
  s.food = [];
  s.drops = [];
  s.effects = [];
  s.combo = 0;
  s.comboTicks = 0;
  s.levelGoal = levelQuota(s.level);
  s.status = 'playing';
  refillFood(s);
}

/**
 * Buffers a direction. The buffer is what stops the classic reversal death:
 * pressing Up then Left inside one tick while moving right used to commit
 * both, folding the head straight into the neck.
 */
export function queueDir(s: GameState, dir: Dir): void {
  if (s.queue.length >= 3) return;
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (dir === last || dir === OPPOSITE[last]) return;
  s.queue.push(dir);
}

function applyPower(s: GameState, kind: PowerKind, pos: Vec): void {
  s.events.push({ t: 'power', kind, pos });

  if (kind === 'shrink') {
    const target = Math.max(START_LENGTH, s.snake.length - SHRINK_AMOUNT);
    s.snake.length = target;
    return;
  }

  const existing = s.effects.find((e) => e.kind === kind);
  if (existing) existing.ticks = EFFECT_TICKS[kind];
  else s.effects.push({ kind, ticks: EFFECT_TICKS[kind] });
}

function die(s: GameState, cause: DeathCause, pos: Vec): void {
  s.status = 'over';
  s.deathCause = cause;
  s.events.push({ t: 'death', pos, cause });
}

function eatAt(s: GameState, index: number, pos: Vec): void {
  s.food.splice(index, 1);
  s.apples += 1;
  s.pendingGrowth += 1;

  s.combo = s.comboTicks > 0 ? Math.min(s.combo + 1, MAX_COMBO) : 1;
  s.comboTicks = COMBO_WINDOW;

  const multiplier = Math.max(1, s.combo) * (hasEffect(s, 'double') ? 2 : 1);
  const gained = APPLE_POINTS * multiplier;
  s.score += gained;
  s.events.push({ t: 'eat', pos, gained, combo: s.combo });

  if (s.mode === 'timeAttack') s.timeLeft += TIME_BONUS_MS;
  if (s.mode === 'maze') s.levelGoal = Math.max(0, s.levelGoal - 1);
  if (s.apples % DROP_EVERY === 0) spawnDrop(s);
  if (s.mode === 'endless' && s.apples % HAZARD_EVERY === 0) spawnHazards(s);
}

function moveRival(s: GameState): void {
  if (!s.rival) {
    if (s.rivalRespawn > 0) {
      s.rivalRespawn -= 1;
      if (s.rivalRespawn === 0) spawnRival(s);
    }
    return;
  }

  const blocked = new Set<number>(s.walls);
  for (const p of s.snake) blocked.add(cellKey(p.x, p.y));
  // The rival's own tail vacates this tick, so it is not an obstacle.
  for (let i = 0; i < s.rival.length - 1; i++) {
    blocked.add(cellKey(s.rival[i].x, s.rival[i].y));
  }

  const head = s.rival[0];
  const dir = chooseRivalDir(
    s.gridW,
    s.gridH,
    blocked,
    head,
    s.rivalDir,
    s.food,
    s.rival.length,
  );

  if (!dir) {
    downRival(s, head);
    return;
  }

  s.rivalDir = dir;
  const next = { x: head.x + DIRS[dir].x, y: head.y + DIRS[dir].y };

  for (const p of s.portals) {
    if (p.a.x === next.x && p.a.y === next.y) {
      next.x = p.b.x;
      next.y = p.b.y;
      break;
    }
    if (p.b.x === next.x && p.b.y === next.y) {
      next.x = p.a.x;
      next.y = p.a.y;
      break;
    }
  }

  // Ran into the player: the rival is the one that goes down.
  if (s.snake.some((p) => p.x === next.x && p.y === next.y)) {
    downRival(s, next);
    return;
  }

  s.rival.unshift(next);
  const idx = s.food.findIndex((f) => f.x === next.x && f.y === next.y);
  if (idx >= 0) {
    s.food.splice(idx, 1);
    refillFood(s);
  } else {
    s.rival.pop();
  }
}

function downRival(s: GameState, pos: Vec): void {
  s.rival = null;
  s.rivalRespawn = RIVAL_RESPAWN_TICKS;
  s.score += RIVAL_BOUNTY;
  s.events.push({ t: 'rivalDown', pos });
}

/**
 * Advances the simulation one tick. Mutates `s` in place: the loop keeps game
 * state in a ref and publishes a separate HUD snapshot, so React never sees
 * this object and does not need it to be immutable.
 */
export function step(s: GameState): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;

  s.tick += 1;

  // One committed direction change per tick, validated against the direction
  // actually being travelled.
  while (s.queue.length) {
    const next = s.queue.shift()!;
    if (next === s.dir || next === OPPOSITE[s.dir]) continue;
    s.dir = next;
    break;
  }

  const ghost = hasEffect(s, 'ghost');
  const from = s.snake[0];
  const delta = DIRS[s.dir];
  let hx = from.x + delta.x;
  let hy = from.y + delta.y;

  if (ghost) {
    hx = (hx + s.gridW) % s.gridW;
    hy = (hy + s.gridH) % s.gridH;
  } else if (hx < 0 || hy < 0 || hx >= s.gridW || hy >= s.gridH) {
    die(s, 'wall', { x: from.x, y: from.y });
    return;
  }

  for (const p of s.portals) {
    if (p.a.x === hx && p.a.y === hy) {
      s.events.push({ t: 'portal', from: { x: hx, y: hy }, to: { ...p.b } });
      hx = p.b.x;
      hy = p.b.y;
      break;
    }
    if (p.b.x === hx && p.b.y === hy) {
      s.events.push({ t: 'portal', from: { x: hx, y: hy }, to: { ...p.a } });
      hx = p.a.x;
      hy = p.a.y;
      break;
    }
  }

  const head: Vec = { x: hx, y: hy };

  if (!ghost && s.walls.has(cellKey(hx, hy))) {
    die(s, 'wall', head);
    return;
  }

  // The tail cell frees up this tick unless something is still being digested
  // or an apple is about to be eaten, so a tight turn onto it is legal.
  const eatingNow = s.food.some((f) => f.x === hx && f.y === hy);
  const tailStays = eatingNow || s.pendingGrowth > 0;
  const bodyLimit = tailStays ? s.snake.length : s.snake.length - 1;

  if (!ghost) {
    for (let i = 0; i < bodyLimit; i++) {
      if (s.snake[i].x === hx && s.snake[i].y === hy) {
        die(s, 'self', head);
        return;
      }
    }
    if (s.rival && s.rival.some((p) => p.x === hx && p.y === hy)) {
      die(s, 'rival', head);
      return;
    }
  }

  s.snake.unshift(head);

  const direct = s.food.findIndex((f) => f.x === hx && f.y === hy);
  if (direct >= 0) eatAt(s, direct, { x: hx, y: hy });

  if (hasEffect(s, 'magnet')) {
    for (let i = s.food.length - 1; i >= 0; i--) {
      const f = s.food[i];
      if (
        Math.abs(f.x - hx) <= MAGNET_RADIUS &&
        Math.abs(f.y - hy) <= MAGNET_RADIUS
      ) {
        eatAt(s, i, { x: f.x, y: f.y });
      }
    }
  }

  if (s.pendingGrowth > 0) s.pendingGrowth -= 1;
  else s.snake.pop();

  const dropIdx = s.drops.findIndex((d) => d.pos.x === hx && d.pos.y === hy);
  if (dropIdx >= 0) {
    const drop = s.drops[dropIdx];
    s.drops.splice(dropIdx, 1);
    applyPower(s, drop.kind, drop.pos);
  }

  refillFood(s);

  if (s.mode === 'rival') moveRival(s);

  // Head-on with the rival kills the player; the rival is the hazard here.
  if (s.rival && s.rival[0].x === hx && s.rival[0].y === hy && !ghost) {
    die(s, 'rival', head);
    return;
  }

  for (let i = s.effects.length - 1; i >= 0; i--) {
    s.effects[i].ticks -= 1;
    if (s.effects[i].ticks <= 0) s.effects.splice(i, 1);
  }

  for (let i = s.drops.length - 1; i >= 0; i--) {
    s.drops[i].ttl -= 1;
    if (s.drops[i].ttl <= 0) s.drops.splice(i, 1);
  }

  if (s.comboTicks > 0) {
    s.comboTicks -= 1;
    if (s.comboTicks === 0) s.combo = 0;
  }

  if (s.mode === 'timeAttack') {
    s.timeLeft -= tickInterval(s);
    if (s.timeLeft <= 0) {
      s.timeLeft = 0;
      die(s, 'time', head);
      return;
    }
  }

  if (s.mode === 'maze' && s.levelGoal === 0) {
    s.status = 'levelComplete';
    s.events.push({ t: 'levelUp', level: s.level + 1 });
  }
}

export function toHud(s: GameState): Hud {
  return {
    status: s.status,
    mode: s.mode,
    score: s.score,
    apples: s.apples,
    combo: s.combo,
    level: s.level,
    levelGoal: s.levelGoal,
    timeLeft: s.timeLeft,
    length: s.snake.length,
    rivalLength: s.rival ? s.rival.length : 0,
    effects: s.effects.map((e) => ({ ...e })),
    deathCause: s.deathCause,
  };
}
