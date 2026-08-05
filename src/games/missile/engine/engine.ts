import { rand, randInt } from '../../../platform/rng';
import {
  AMMO_BONUS,
  BATTERY_HALF_W,
  BLAST_FADE,
  BLAST_GROW,
  BLAST_HOLD,
  BLAST_LIFE,
  BLAST_R,
  BOMBER_SPEED,
  BOMBER_Y_MAX,
  BOMBER_Y_MIN,
  BONUS_CITY_POINTS,
  CITY_BONUS,
  CITY_HALF_W,
  DT,
  FIELD_H,
  FIELD_W,
  GROUND_BLAST_R,
  GROUND_Y,
  INTERCEPTOR_SPEED,
  KILL_POINTS,
  LAYOUTS,
  READY_TICKS,
  SMART_DODGE_ACCEL,
  SMART_DODGE_R,
  SMART_MAX_VX,
  TALLY_TICKS,
  TICK_MS,
  WAVE_COLORS,
  bombersFor,
  multiplierFor,
  smartChanceFor,
  spawnIntervalFor,
  splitterChanceFor,
  threatSpeedFor,
  threatsFor,
} from './constants';
import type {
  Battery,
  Blast,
  City,
  GameState,
  Hud,
  Interceptor,
  Mode,
  ThreatKind,
} from './types';

/**
 * Missile Command's rules, with no DOM and no canvas anywhere in the file.
 *
 * Everything here is deterministic given a seed, which is what lets the engine
 * suite play whole waves in plain node and assert on the outcome rather than on
 * a screenshot.
 */

function nextId(s: GameState): number {
  s.nextId += 1;
  return s.nextId;
}

export function createGame(mode: Mode, seed = 1): GameState {
  const layout = LAYOUTS[mode];

  const cities: City[] = layout.cities.map((x, i) => ({ id: i + 1, x, alive: true }));
  const batteries: Battery[] = layout.batteries.map((x, i) => ({
    id: i + 1,
    x,
    ammo: layout.ammo,
    alive: true,
  }));

  const state: GameState = {
    mode,
    status: 'ready',
    wave: 1,
    cities,
    batteries,
    threats: [],
    bombers: [],
    interceptors: [],
    blasts: [],
    score: 0,
    towardBonus: 0,
    pending: threatsFor(mode, 1),
    spawnIn: spawnIntervalFor(mode, 1),
    pendingBombers: bombersFor(mode, 1),
    bomberIn: 180,
    tally: null,
    holdTicks: READY_TICKS,
    elapsedMs: 0,
    rngState: seed,
    nextId: 0,
    events: [],
  };

  return state;
}

/** Everything alive that a falling missile is willing to aim at. */
function targets(s: GameState): number[] {
  const xs: number[] = [];
  for (const c of s.cities) if (c.alive) xs.push(c.x);
  for (const b of s.batteries) if (b.alive) xs.push(b.x);
  return xs;
}

function pickTargetX(s: GameState): number {
  const xs = targets(s);
  if (xs.length === 0) return rand(s) * FIELD_W;
  return xs[randInt(s, xs.length)];
}

function spawnThreat(s: GameState, from?: { x: number; y: number }): void {
  const speed = threatSpeedFor(s.mode, s.wave);
  const sx = from ? from.x : rand(s) * FIELD_W;
  const sy = from ? from.y : 0;
  const tx = pickTargetX(s);

  let kind: ThreatKind = 'missile';
  // Rolled in this order because a smart bomb is the rarer and later of the
  // two; rolling the splitter first would swallow most of its chances.
  if (!from && rand(s) < smartChanceFor(s.mode, s.wave)) kind = 'smart';
  else if (!from && rand(s) < splitterChanceFor(s.mode, s.wave)) kind = 'splitter';

  const dx = tx - sx;
  const dy = GROUND_Y - sy;
  const len = Math.hypot(dx, dy) || 1;

  s.threats.push({
    id: nextId(s),
    kind,
    sx,
    sy,
    x: sx,
    y: sy,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    tx,
    splitY: kind === 'splitter' ? 180 + rand(s) * 140 : null,
    color: WAVE_COLORS[(s.wave - 1) % WAVE_COLORS.length],
  });
}

function spawnBomber(s: GameState): void {
  const fromLeft = rand(s) < 0.5;
  s.bombers.push({
    id: nextId(s),
    x: fromLeft ? -30 : FIELD_W + 30,
    y: BOMBER_Y_MIN + rand(s) * (BOMBER_Y_MAX - BOMBER_Y_MIN),
    vx: fromLeft ? BOMBER_SPEED : -BOMBER_SPEED,
    dropIn: 40 + randInt(s, 50),
  });
}

function spawnBlast(s: GameState, x: number, y: number, hostile: boolean, chain: number): void {
  s.blasts.push({
    id: nextId(s),
    x,
    y,
    r: 0,
    maxR: hostile ? GROUND_BLAST_R : BLAST_R,
    age: 0,
    hostile,
    chain,
  });
  s.events.push({ t: 'blast' });
}

function addScore(s: GameState, points: number): void {
  s.score += points;
  if (s.mode === 'survival') return;

  s.towardBonus += points;
  while (s.towardBonus >= BONUS_CITY_POINTS) {
    s.towardBonus -= BONUS_CITY_POINTS;
    const dead = s.cities.find((c) => !c.alive);
    // With every city standing the award is banked as score and nothing else.
    // Dropping the remainder instead would quietly punish a clean run.
    if (!dead) continue;
    dead.alive = true;
    s.events.push({ t: 'bonusCity' });
  }
}

/** Applied once, when a hostile blast is born, rather than every tick it lives. */
function damageGround(s: GameState, x: number): void {
  for (const c of s.cities) {
    if (!c.alive) continue;
    if (Math.abs(c.x - x) <= GROUND_BLAST_R + CITY_HALF_W * 0.35) {
      c.alive = false;
      s.events.push({ t: 'cityLost' });
    }
  }
  for (const b of s.batteries) {
    if (!b.alive) continue;
    if (Math.abs(b.x - x) <= GROUND_BLAST_R + BATTERY_HALF_W * 0.35) {
      b.alive = false;
      b.ammo = 0;
      s.events.push({ t: 'baseLost' });
    }
  }
}

function releaseWave(s: GameState): void {
  if (s.pending > 0) {
    s.spawnIn -= 1;
    if (s.spawnIn <= 0) {
      spawnThreat(s);
      s.pending -= 1;
      const base = spawnIntervalFor(s.mode, s.wave);
      s.spawnIn = Math.max(6, base - randInt(s, Math.max(1, Math.floor(base / 3))));
    }
  }

  if (s.pendingBombers > 0) {
    s.bomberIn -= 1;
    if (s.bomberIn <= 0) {
      spawnBomber(s);
      s.pendingBombers -= 1;
      s.bomberIn = 220 + randInt(s, 160);
    }
  }
}

function moveThreats(s: GameState): void {
  for (let i = s.threats.length - 1; i >= 0; i--) {
    const t = s.threats[i];

    if (t.kind === 'smart') {
      // Sidesteps the nearest live blast. It only ever gains lateral speed, so
      // a dodging bomb still falls at the wave's rate and cannot stall forever.
      let nearest: Blast | null = null;
      let best = SMART_DODGE_R;
      for (const b of s.blasts) {
        if (b.hostile) continue;
        const d = Math.hypot(b.x - t.x, b.y - t.y);
        if (d < best) {
          best = d;
          nearest = b;
        }
      }
      if (nearest) {
        const away = t.x >= nearest.x ? 1 : -1;
        t.vx = Math.max(-SMART_MAX_VX, Math.min(SMART_MAX_VX, t.vx + away * SMART_DODGE_ACCEL * DT));
      }
    }

    t.x += t.vx * DT;
    t.y += t.vy * DT;

    if (t.splitY !== null && t.y >= t.splitY) {
      t.splitY = null;
      for (let k = 0; k < 2; k++) {
        spawnThreat(s, { x: t.x, y: t.y });
        const child = s.threats[s.threats.length - 1];
        // The child inherits the split point as its origin so the trail forks
        // from where the break happened rather than from the top of the screen.
        child.sx = t.x;
        child.sy = t.y;
      }
    }

    if (t.y >= GROUND_Y) {
      s.threats.splice(i, 1);
      spawnBlast(s, t.x, GROUND_Y, true, 0);
      damageGround(s, t.x);
      continue;
    }

    // A dodging smart bomb can walk itself off the side of the field.
    if (t.x < -40 || t.x > FIELD_W + 40) {
      s.threats.splice(i, 1);
    }
  }
}

function moveBombers(s: GameState): void {
  for (let i = s.bombers.length - 1; i >= 0; i--) {
    const b = s.bombers[i];
    b.x += b.vx * DT;
    b.dropIn -= 1;

    if (b.dropIn <= 0 && b.x > 0 && b.x < FIELD_W) {
      spawnThreat(s, { x: b.x, y: b.y });
      b.dropIn = 70 + randInt(s, 70);
    }

    if (b.x < -60 || b.x > FIELD_W + 60) s.bombers.splice(i, 1);
  }
}

function moveInterceptors(s: GameState): void {
  for (let i = s.interceptors.length - 1; i >= 0; i--) {
    const m = s.interceptors[i];
    const dx = m.tx - m.x;
    const dy = m.ty - m.y;
    const remaining = Math.hypot(dx, dy);
    const stepLen = INTERCEPTOR_SPEED * DT;

    if (remaining <= stepLen) {
      s.interceptors.splice(i, 1);
      spawnBlast(s, m.tx, m.ty, false, 0);
      continue;
    }

    m.x += m.vx * DT;
    m.y += m.vy * DT;
  }
}

function advanceBlasts(s: GameState): void {
  for (let i = s.blasts.length - 1; i >= 0; i--) {
    const b = s.blasts[i];
    b.age += 1;

    if (b.age <= BLAST_GROW) b.r = b.maxR * (b.age / BLAST_GROW);
    else if (b.age <= BLAST_GROW + BLAST_HOLD) b.r = b.maxR;
    else b.r = b.maxR * (1 - (b.age - BLAST_GROW - BLAST_HOLD) / BLAST_FADE);

    if (b.age >= BLAST_LIFE) s.blasts.splice(i, 1);
  }
}

/**
 * Kills, and the chains they set off.
 *
 * Only the player's blasts destroy anything in the air. A ground hit is already
 * the worst outcome on the board and does not also get to clear the sky.
 */
function resolveHits(s: GameState): void {
  const mult = multiplierFor(s.wave);
  // Snapshotted because a kill pushes a new blast onto the same array. Those
  // start at zero radius and could not hit anything this tick anyway, so
  // walking into them would only be a way to be wrong later.
  const active = s.blasts.slice();

  for (const b of active) {
    if (b.hostile) continue;

    for (let i = s.threats.length - 1; i >= 0; i--) {
      const t = s.threats[i];
      if (Math.hypot(t.x - b.x, t.y - b.y) > b.r) continue;

      s.threats.splice(i, 1);
      const points = KILL_POINTS[t.kind] * mult;
      addScore(s, points);
      s.events.push({ t: 'kill', kind: t.kind, points, chained: b.chain > 0 });
      spawnBlast(s, t.x, t.y, false, b.chain + 1);
    }

    for (let i = s.bombers.length - 1; i >= 0; i--) {
      const p = s.bombers[i];
      if (Math.hypot(p.x - b.x, p.y - b.y) > b.r) continue;

      s.bombers.splice(i, 1);
      const points = KILL_POINTS.bomber * mult;
      addScore(s, points);
      s.events.push({ t: 'kill', kind: 'bomber', points, chained: b.chain > 0 });
      spawnBlast(s, p.x, p.y, false, b.chain + 1);
    }
  }
}

function waveIsClear(s: GameState): boolean {
  return (
    s.pending === 0 &&
    s.pendingBombers === 0 &&
    s.threats.length === 0 &&
    s.bombers.length === 0 &&
    s.interceptors.length === 0 &&
    s.blasts.length === 0
  );
}

function endWave(s: GameState): void {
  const mult = multiplierFor(s.wave);
  const ammo = s.batteries.reduce((n, b) => n + (b.alive ? b.ammo : 0), 0);
  const cities = s.cities.filter((c) => c.alive).length;
  const points = (ammo * AMMO_BONUS + cities * CITY_BONUS) * mult;

  s.tally = { ammo, cities, points };
  addScore(s, points);
  s.status = 'waveComplete';
  s.holdTicks = TALLY_TICKS;
  s.events.push({ t: 'waveComplete', wave: s.wave });
}

export function nextWave(s: GameState): void {
  if (s.status !== 'waveComplete') return;

  s.wave += 1;
  s.tally = null;

  // Batteries come back with the wave; cities do not. That asymmetry is the
  // whole shape of the game: ammo is a per-wave resource and cities are the
  // score you are actually defending.
  const layout = LAYOUTS[s.mode];
  for (const b of s.batteries) {
    b.alive = true;
    b.ammo = layout.ammo;
  }

  s.pending = threatsFor(s.mode, s.wave);
  s.spawnIn = spawnIntervalFor(s.mode, s.wave);
  s.pendingBombers = bombersFor(s.mode, s.wave);
  s.bomberIn = 180;
  s.status = 'ready';
  s.holdTicks = READY_TICKS;
}

function checkOver(s: GameState): void {
  if (s.cities.some((c) => c.alive)) return;
  s.status = 'over';
  s.events.push({ t: 'over' });
}

export function step(s: GameState): void {
  s.events.length = 0;

  if (s.status === 'ready' || s.status === 'waveComplete') {
    s.holdTicks -= 1;
    if (s.holdTicks > 0) return;
    if (s.status === 'ready') s.status = 'playing';
    else nextWave(s);
    return;
  }

  if (s.status !== 'playing') return;

  s.elapsedMs += TICK_MS;

  releaseWave(s);
  moveThreats(s);
  moveBombers(s);
  moveInterceptors(s);
  advanceBlasts(s);
  resolveHits(s);

  checkOver(s);
  if (s.status === 'playing' && waveIsClear(s)) endWave(s);
}

/**
 * Fires at a point. The battery is chosen for the player: whichever live one
 * with ammo is nearest the target horizontally. That is what makes the game
 * work with one thumb, and it costs a desktop player nothing.
 */
export function fireAt(s: GameState, x: number, y: number): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;

  const tx = Math.max(8, Math.min(FIELD_W - 8, x));
  const ty = Math.max(16, Math.min(GROUND_Y - 24, y));

  let chosen: Battery | null = null;
  let best = Infinity;
  for (const b of s.batteries) {
    if (!b.alive || b.ammo <= 0) continue;
    const d = Math.abs(b.x - tx);
    if (d < best) {
      best = d;
      chosen = b;
    }
  }

  if (!chosen) {
    s.events.push({ t: 'dryFire' });
    return;
  }

  chosen.ammo -= 1;

  const sx = chosen.x;
  const sy = GROUND_Y - 18;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;

  const shot: Interceptor = {
    id: nextId(s),
    sx,
    sy,
    x: sx,
    y: sy,
    vx: (dx / len) * INTERCEPTOR_SPEED,
    vy: (dy / len) * INTERCEPTOR_SPEED,
    tx,
    ty,
  };
  s.interceptors.push(shot);
  s.events.push({ t: 'fire' });
}

export function togglePause(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'playing') s.status = 'paused';
  else if (s.status === 'paused') s.status = 'playing';
}

/** Skips the rest of the ready banner or the tally, for a player who is done reading. */
export function skipHold(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'ready') {
    s.status = 'playing';
    s.holdTicks = 0;
  } else if (s.status === 'waveComplete') {
    nextWave(s);
  }
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    wave: s.wave,
    score: s.score,
    cities: s.cities.filter((c) => c.alive).length,
    ammo: s.batteries.reduce((n, b) => n + (b.alive ? b.ammo : 0), 0),
    batteries: s.batteries.map((b) => ({ ammo: b.ammo, alive: b.alive })),
    incoming: s.threats.length + s.pending + s.bombers.length + s.pendingBombers,
    tally: s.tally,
  };
}

/** Exposed for the renderer so it never has to import the field constants twice. */
export const FIELD = { w: FIELD_W, h: FIELD_H, groundY: GROUND_Y };
