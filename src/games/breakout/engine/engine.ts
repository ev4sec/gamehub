import { rand, randInt } from '../../../platform/rng';
import {
  BALL_R,
  BASE_SPEED,
  BRICK_COLS,
  BRICK_GAP,
  BRICK_H,
  BRICK_LEFT,
  BRICK_TOP,
  BRICK_W,
  DROPPABLE,
  DROP_CHANCE,
  DROP_SPEED,
  DT,
  EFFECT_TICKS,
  FIELD_H,
  FIELD_W,
  LEVEL_SPEEDUP,
  MAX_DEFLECT,
  MAX_SPEED,
  MIN_VY_RATIO,
  MODE_META,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_WIDE_W,
  PADDLE_Y,
  SOLID_COLOR,
  TICK_MS,
  TIERS,
  speedOf,
} from './constants';
import { LEVELS } from './levels';
import type { Ball, Brick, Drop, GameState, Hud, Mode, PowerKind } from './types';

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

/* ---------------------------------------------------------------------------
 * Level building
 * ------------------------------------------------------------------------ */

function brickAt(s: GameState, col: number, row: number, ch: string): Brick | null {
  if (ch === '.' || ch === ' ') return null;

  const x = BRICK_LEFT + col * (BRICK_W + BRICK_GAP);
  const y = BRICK_TOP + row * (BRICK_H + BRICK_GAP);
  const solid = ch === '#';
  const tier = TIERS[ch] ?? TIERS.a;

  return {
    id: s.nextId++,
    x,
    y,
    w: BRICK_W,
    h: BRICK_H,
    hp: solid ? Infinity : tier.hp,
    maxHp: solid ? Infinity : tier.hp,
    points: solid ? 0 : tier.points,
    solid,
    color: solid ? SOLID_COLOR : tier.color,
  };
}

function buildFromRows(s: GameState, rows: string[]): Brick[] {
  const bricks: Brick[] = [];
  rows.forEach((line, row) => {
    for (let col = 0; col < BRICK_COLS; col++) {
      const brick = brickAt(s, col, row, line[col] ?? '.');
      if (brick) bricks.push(brick);
    }
  });
  return bricks;
}

/** Endless layouts, seeded so a level can be replayed from its number. */
function generateRows(s: GameState, level: number): string[] {
  const rows = Math.min(4 + Math.floor(level / 2), 8);
  const letters = ['a', 'b', 'c', 'd', 'e'];
  const richness = Math.min(1 + Math.floor(level / 3), letters.length);
  const out: string[] = [];

  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < BRICK_COLS; col++) {
      const roll = rand(s);
      if (roll < 0.12 && level > 1 && row < rows - 1) line += '#';
      else if (roll < 0.24) line += '.';
      else line += letters[randInt(s, richness)];
    }
    out.push(line);
  }

  // A layout of nothing but solids can never be cleared, so guarantee at least
  // one breakable brick rather than trusting the dice.
  if (!out.some((line) => [...line].some((ch) => ch !== '#' && ch !== '.'))) {
    out[out.length - 1] = 'a'.repeat(BRICK_COLS);
  }
  return out;
}

function layoutFor(s: GameState, level: number): string[] {
  if (s.mode === 'endless') return generateRows(s, level);
  return LEVELS[Math.min(level, LEVELS.length - 1)].rows;
}

export function levelName(s: GameState): string {
  if (s.mode === 'endless') return `Wave ${s.level + 1}`;
  return LEVELS[Math.min(s.level, LEVELS.length - 1)].name;
}

/* ---------------------------------------------------------------------------
 * Balls
 * ------------------------------------------------------------------------ */

function restingBall(s: GameState, speedScale = 1): Ball {
  return {
    id: s.nextId++,
    x: s.paddle.x,
    y: PADDLE_Y - BALL_R,
    vx: 0,
    vy: -BASE_SPEED * speedScale,
    r: BALL_R,
    stuckOffset: 0,
  };
}

/**
 * Keeps a ball from travelling too flat, in either axis.
 *
 * A ball with almost no vertical speed rattles between the side walls without
 * ever threatening a brick or the paddle, and the run stops being a game
 * without ever ending. Speed is preserved; only the direction is nudged.
 */
function enforceAngle(b: Ball): void {
  const speed = speedOf(b.vx, b.vy);
  if (speed === 0) {
    b.vy = -BASE_SPEED;
    return;
  }
  const minVy = speed * MIN_VY_RATIO;
  if (Math.abs(b.vy) < minVy) {
    const sign = b.vy === 0 ? -1 : Math.sign(b.vy);
    b.vy = sign * minVy;
    const room = Math.sqrt(Math.max(0, speed * speed - b.vy * b.vy));
    b.vx = (b.vx < 0 ? -1 : 1) * room;
  }
}

function resolveWalls(s: GameState, b: Ball): void {
  if (b.x - b.r < 0) {
    b.x = b.r;
    b.vx = Math.abs(b.vx);
    s.events.push({ t: 'bounce', surface: 'wall' });
  } else if (b.x + b.r > FIELD_W) {
    b.x = FIELD_W - b.r;
    b.vx = -Math.abs(b.vx);
    s.events.push({ t: 'bounce', surface: 'wall' });
  }
  if (b.y - b.r < 0) {
    b.y = b.r;
    b.vy = Math.abs(b.vy);
    s.events.push({ t: 'bounce', surface: 'ceiling' });
  }
}

function resolvePaddle(s: GameState, b: Ball): void {
  if (b.vy <= 0) return;

  const half = s.paddle.w / 2;
  const left = s.paddle.x - half;
  const right = s.paddle.x + half;

  if (b.y + b.r < PADDLE_Y) return;
  if (b.y - b.r > PADDLE_Y + PADDLE_H) return;
  if (b.x + b.r < left || b.x - b.r > right) return;

  // Where on the paddle it landed decides the angle. This is the whole control
  // scheme of the game: the paddle aims, it does not merely block.
  const offset = clamp((b.x - s.paddle.x) / half, -1, 1);
  const speed = clamp(speedOf(b.vx, b.vy), BASE_SPEED, MAX_SPEED);
  const angle = -Math.PI / 2 + offset * MAX_DEFLECT;

  b.vx = Math.cos(angle) * speed;
  b.vy = Math.sin(angle) * speed;
  b.y = PADDLE_Y - b.r;
  enforceAngle(b);

  if (s.effects.sticky) b.stuckOffset = b.x - s.paddle.x;
  s.events.push({ t: 'bounce', surface: 'paddle' });
}

function damageBrick(s: GameState, brick: Brick): void {
  if (brick.solid) return;

  brick.hp -= 1;
  const destroyed = brick.hp <= 0;
  const points = destroyed ? brick.points + s.combo * 5 : Math.floor(brick.points / 3);
  s.score += points;
  if (destroyed) s.combo += 1;
  s.events.push({ t: 'brick', points, destroyed });

  if (!destroyed) return;

  if (rand(s) < DROP_CHANCE) {
    const kind = DROPPABLE[randInt(s, DROPPABLE.length)];
    s.drops.push({
      id: s.nextId++,
      kind,
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
    });
    s.events.push({ t: 'drop', kind });
  }
}

/**
 * Circle against axis-aligned box, resolved on the axis of shallower overlap.
 * At most one brick per substep: the substeps are short enough that a genuine
 * two-brick frame resolves as two separate substeps, and handling several at
 * once is how a ball ends up reflected twice and sent through the wall.
 */
function resolveBricks(s: GameState, b: Ball): void {
  for (const brick of s.bricks) {
    // Destroyed bricks are not swept from the array until the end of the tick,
    // so a later substep would otherwise hit and score the same brick again.
    if (!brick.solid && brick.hp <= 0) continue;

    const overlapX = b.r + brick.w / 2 - Math.abs(b.x - (brick.x + brick.w / 2));
    if (overlapX <= 0) continue;
    const overlapY = b.r + brick.h / 2 - Math.abs(b.y - (brick.y + brick.h / 2));
    if (overlapY <= 0) continue;

    if (overlapX < overlapY) {
      b.vx = -b.vx;
      b.x += b.vx > 0 ? overlapX : -overlapX;
    } else {
      b.vy = -b.vy;
      b.y += b.vy > 0 ? overlapY : -overlapY;
    }
    enforceAngle(b);
    damageBrick(s, brick);
    return;
  }
}

/* ---------------------------------------------------------------------------
 * Power-ups
 * ------------------------------------------------------------------------ */

function applyPower(s: GameState, kind: PowerKind): void {
  s.events.push({ t: 'power', kind });

  switch (kind) {
    case 'wide':
      s.effects.wide = EFFECT_TICKS.wide;
      s.paddle.w = PADDLE_WIDE_W;
      break;
    case 'slow':
      s.effects.slow = EFFECT_TICKS.slow;
      break;
    case 'sticky':
      s.effects.sticky = EFFECT_TICKS.sticky;
      break;
    case 'extra':
      s.lives += 1;
      break;
    case 'multi': {
      const spawned: Ball[] = [];
      for (const ball of s.balls) {
        if (ball.stuckOffset !== null) continue;
        const speed = speedOf(ball.vx, ball.vy) || BASE_SPEED;
        const base = Math.atan2(ball.vy, ball.vx);
        for (const turn of [-0.42, 0.42]) {
          spawned.push({
            id: s.nextId++,
            x: ball.x,
            y: ball.y,
            vx: Math.cos(base + turn) * speed,
            vy: Math.sin(base + turn) * speed,
            r: ball.r,
            stuckOffset: null,
          });
        }
      }
      for (const ball of spawned) enforceAngle(ball);
      s.balls.push(...spawned);
      break;
    }
  }
}

function tickEffects(s: GameState): void {
  for (const key of Object.keys(s.effects) as PowerKind[]) {
    const left = (s.effects[key] ?? 0) - 1;
    if (left > 0) {
      s.effects[key] = left;
      continue;
    }
    delete s.effects[key];
    if (key === 'wide') s.paddle.w = PADDLE_W;
    if (key === 'sticky') {
      // Anything still glued on when it lapses is released rather than frozen.
      for (const ball of s.balls) {
        if (ball.stuckOffset !== null) launchBall(s, ball);
      }
    }
  }
}

/* ---------------------------------------------------------------------------
 * Step
 * ------------------------------------------------------------------------ */

function movePaddle(s: GameState): void {
  const half = s.paddle.w / 2;
  if (s.pointerX !== null) {
    s.paddle.x = clamp(s.pointerX, half, FIELD_W - half);
    return;
  }
  const dir = (s.held.right ? 1 : 0) - (s.held.left ? 1 : 0);
  if (dir !== 0) s.paddle.x = clamp(s.paddle.x + dir * PADDLE_SPEED * DT, half, FIELD_W - half);
  else s.paddle.x = clamp(s.paddle.x, half, FIELD_W - half);
}

function carryStuckBalls(s: GameState): void {
  for (const b of s.balls) {
    if (b.stuckOffset === null) continue;
    const half = s.paddle.w / 2;
    b.x = clamp(s.paddle.x + b.stuckOffset, b.r, FIELD_W - b.r);
    b.x = clamp(b.x, s.paddle.x - half, s.paddle.x + half);
    b.y = PADDLE_Y - b.r;
  }
}

function moveBalls(s: GameState): void {
  const scale = s.effects.slow ? 0.68 : 1;
  const survivors: Ball[] = [];

  for (const b of s.balls) {
    if (b.stuckOffset !== null) {
      survivors.push(b);
      continue;
    }

    const speed = speedOf(b.vx, b.vy);
    const travel = speed * DT * scale;
    // The ball never advances more than a fraction of its own radius before
    // being tested again. Without this a fast ball steps clean over a brick,
    // which looks exactly like a collision bug and is impossible to reproduce
    // at ordinary speeds.
    const steps = Math.max(1, Math.ceil(travel / (b.r * 0.75)));
    const sub = (DT * scale) / steps;

    let lost = false;
    for (let i = 0; i < steps; i++) {
      b.x += b.vx * sub;
      b.y += b.vy * sub;

      resolveWalls(s, b);
      resolvePaddle(s, b);
      resolveBricks(s, b);

      if (b.y - b.r > FIELD_H) {
        lost = true;
        break;
      }
      if (b.stuckOffset !== null) break;
    }

    if (!lost) survivors.push(b);
  }

  s.balls = survivors;
}

function moveDrops(s: GameState): void {
  const half = s.paddle.w / 2;
  const kept: Drop[] = [];

  for (const drop of s.drops) {
    drop.y += DROP_SPEED * DT;

    const caught =
      drop.y >= PADDLE_Y - 6 &&
      drop.y <= PADDLE_Y + PADDLE_H + 6 &&
      drop.x >= s.paddle.x - half &&
      drop.x <= s.paddle.x + half;

    if (caught) {
      applyPower(s, drop.kind);
      continue;
    }
    if (drop.y < FIELD_H + 20) kept.push(drop);
  }

  s.drops = kept;
}

function loseLife(s: GameState): void {
  s.lives -= 1;
  s.combo = 0;
  s.drops = [];
  s.effects = {};
  s.paddle.w = PADDLE_W;
  s.events.push({ t: 'lifeLost', livesLeft: s.lives });

  if (s.lives <= 0) {
    s.status = 'over';
    s.events.push({ t: 'over' });
    return;
  }

  s.balls = [restingBall(s, Math.pow(LEVEL_SPEEDUP, s.level))];
  s.status = 'ready';
}

function breakableLeft(s: GameState): number {
  return s.bricks.filter((b) => !b.solid).length;
}

export function step(s: GameState): void {
  s.events = [];
  if (s.status === 'paused' || s.status === 'over' || s.status === 'cleared') return;
  if (s.status === 'levelComplete') return;

  s.elapsedMs += TICK_MS;
  movePaddle(s);

  if (s.status === 'ready') {
    carryStuckBalls(s);
    return;
  }

  tickEffects(s);
  carryStuckBalls(s);
  moveBalls(s);
  moveDrops(s);

  s.bricks = s.bricks.filter((b) => b.solid || b.hp > 0);

  if (breakableLeft(s) === 0) {
    s.status = 'levelComplete';
    s.events.push({ t: 'levelComplete', level: s.level });
    return;
  }

  if (s.balls.length === 0) loseLife(s);
}

/* ---------------------------------------------------------------------------
 * Input and lifecycle
 * ------------------------------------------------------------------------ */

function launchBall(s: GameState, b: Ball): void {
  // Capped here as well as on a paddle bounce, or deep Endless waves would
  // launch above the ceiling the rest of the engine assumes.
  const speed = Math.min(BASE_SPEED * Math.pow(LEVEL_SPEEDUP, s.level), MAX_SPEED);
  const offset = clamp((b.x - s.paddle.x) / (s.paddle.w / 2), -1, 1);
  const angle = -Math.PI / 2 + offset * (MAX_DEFLECT * 0.6);
  b.vx = Math.cos(angle) * speed;
  b.vy = Math.sin(angle) * speed;
  b.stuckOffset = null;
  enforceAngle(b);
}

export function launch(s: GameState): void {
  if (s.status === 'ready') s.status = 'playing';
  else if (s.status !== 'playing') return;

  for (const b of s.balls) {
    if (b.stuckOffset !== null) launchBall(s, b);
  }
  s.events.push({ t: 'launch' });
}

export function setHeld(s: GameState, key: 'left' | 'right', down: boolean): void {
  s.held[key] = down;
  // A key press means the player has taken over from the pointer.
  if (down) s.pointerX = null;
}

export function setPointer(s: GameState, x: number | null): void {
  s.pointerX = x;
}

export function togglePause(s: GameState): void {
  if (s.status === 'playing' || s.status === 'ready') {
    s.status = 'paused';
  } else if (s.status === 'paused') {
    // A ball still glued to the paddle means the run was waiting on a launch.
    s.status = s.balls.some((b) => b.stuckOffset !== null) ? 'ready' : 'playing';
  }
}

export function advanceLevel(s: GameState): void {
  if (s.status !== 'levelComplete') return;

  const next = s.level + 1;
  if (s.mode !== 'endless' && next >= LEVELS.length) {
    s.status = 'cleared';
    s.events.push({ t: 'cleared' });
    return;
  }

  s.level = next;
  s.bricks = buildFromRows(s, layoutFor(s, next));
  s.drops = [];
  s.effects = {};
  s.paddle.w = PADDLE_W;
  s.balls = [restingBall(s, Math.pow(LEVEL_SPEEDUP, next))];
  s.status = 'ready';
}

export function createGame(mode: Mode, seed: number = Date.now()): GameState {
  const s: GameState = {
    mode,
    status: 'ready',
    level: 0,
    paddle: { x: FIELD_W / 2, w: PADDLE_W },
    balls: [],
    bricks: [],
    drops: [],
    lives: MODE_META[mode].lives,
    score: 0,
    combo: 0,
    effects: {},
    held: { left: false, right: false },
    pointerX: null,
    elapsedMs: 0,
    rngState: seed | 0,
    nextId: 1,
    events: [],
  };

  s.bricks = buildFromRows(s, layoutFor(s, 0));
  s.balls = [restingBall(s)];
  s.events = [];
  return s;
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    level: s.level,
    score: s.score,
    lives: s.lives,
    combo: s.combo,
    balls: s.balls.length,
    bricksLeft: breakableLeft(s),
    effects: (Object.keys(s.effects) as PowerKind[])
      .filter((k) => (s.effects[k] ?? 0) > 0)
      .map((kind) => ({ kind, ticks: s.effects[kind] ?? 0 })),
  };
}
