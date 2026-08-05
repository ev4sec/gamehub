import { rand, randInt } from '../../../platform/rng';
import {
  BULLET_LIFE_TICKS,
  BULLET_R,
  BULLET_SPEED,
  DRAG,
  DT,
  EXTRA_LIFE_POINTS,
  FIELD_H,
  FIELD_W,
  FIRE_COOLDOWN,
  INVULN_TICKS,
  MAX_BULLETS,
  MAX_SHIP_SPEED,
  MODE_META,
  READY_TICKS,
  RESPAWN_PATIENCE,
  RESPAWN_TICKS,
  ROCK_POINTS,
  ROCK_R,
  SAUCER_BULLET_SPEED,
  SAUCER_FIRE_TICKS,
  SAUCER_POINTS,
  SAUCER_R,
  SAUCER_SPEED,
  SHIP_R,
  SPAWN_CLEARANCE,
  THRUST_ACCEL,
  TICK_MS,
  TURN_RATE,
  rockSpeedFor,
  rocksForWave,
} from './constants';
import type { GameState, Hud, Mode, Rock, Ship } from './types';

/**
 * Asteroids' rules, on a torus.
 *
 * Everything about this engine follows from the wrap. A ship at x = 1 and a
 * rock at x = W - 1 are two units apart, not the width of the screen, and every
 * single distance test has to know that. There is exactly one function that
 * knows it, `wrapDelta`, and every test goes through it. Written any other way
 * this ships broken and no amount of soaking finds it, because random play
 * almost never straddles the seam at the moment of a collision.
 */

/** The shortest signed separation between two coordinates on a wrapped axis. */
export function wrapDelta(from: number, to: number, span: number): number {
  let d = to - from;
  if (d > span / 2) d -= span;
  else if (d < -span / 2) d += span;
  return d;
}

/** True distance between two points on the torus. */
export function torusDistance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(wrapDelta(ax, bx, FIELD_W), wrapDelta(ay, by, FIELD_H));
}

function wrapPosition(body: { x: number; y: number }): void {
  body.x = ((body.x % FIELD_W) + FIELD_W) % FIELD_W;
  body.y = ((body.y % FIELD_H) + FIELD_H) % FIELD_H;
}

function nextId(s: GameState): number {
  s.nextId += 1;
  return s.nextId;
}

/** A rock's outline, as per-vertex radii. Drawn by the renderer, owned here so
 *  a rock keeps the same silhouette for its whole life. */
function rockShape(s: GameState): number[] {
  const points = 9 + randInt(s, 4);
  const shape: number[] = [];
  for (let i = 0; i < points; i++) shape.push(0.72 + rand(s) * 0.42);
  return shape;
}

function makeShip(): Ship {
  return {
    x: FIELD_W / 2,
    y: FIELD_H / 2,
    vx: 0,
    vy: 0,
    r: SHIP_R,
    angle: -Math.PI / 2,
    thrusting: false,
    invuln: INVULN_TICKS,
  };
}

function spawnRock(s: GameState, size: 1 | 2 | 3, at?: { x: number; y: number }): void {
  const speed = rockSpeedFor(s.mode, s.wave) * (size === 3 ? 1 : size === 2 ? 1.3 : 1.7);
  const heading = rand(s) * Math.PI * 2;

  let x = at?.x ?? 0;
  let y = at?.y ?? 0;
  if (!at) {
    // Placed away from the middle, so a wave never opens on top of the ship.
    // Bounded rather than a bare do-while: an unbounded search against a seeded
    // generator is a hang waiting for the day someone widens the clearance.
    for (let attempt = 0; attempt < 60; attempt++) {
      x = rand(s) * FIELD_W;
      y = rand(s) * FIELD_H;
      if (torusDistance(x, y, FIELD_W / 2, FIELD_H / 2) >= SPAWN_CLEARANCE + ROCK_R[size]) break;
    }
  }

  s.rocks.push({
    id: nextId(s),
    x,
    y,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    r: ROCK_R[size],
    size,
    spin: (rand(s) - 0.5) * 2.2,
    angle: rand(s) * Math.PI * 2,
    shape: rockShape(s),
  });
}

function beginWave(s: GameState): void {
  const count = rocksForWave(s.mode, s.wave);
  for (let i = 0; i < count; i++) spawnRock(s, 3);
  s.saucerIn = 900 + randInt(s, 700);
  s.events.push({ t: 'wave', wave: s.wave });
}

export function createGame(mode: Mode, seed = 1): GameState {
  const s: GameState = {
    mode,
    status: 'ready',
    wave: 1,
    ship: makeShip(),
    rocks: [],
    bullets: [],
    saucer: null,
    lives: MODE_META[mode].lives,
    score: 0,
    towardExtra: 0,
    turn: 0,
    thrust: false,
    aim: null,
    saucerIn: 0,
    holdTicks: READY_TICKS,
    fireCooldown: 0,
    elapsedMs: 0,
    rngState: seed,
    nextId: 0,
    events: [],
  };

  beginWave(s);
  s.events.length = 0;
  return s;
}

function addScore(s: GameState, points: number): void {
  s.score += points;
  if (s.mode === 'lone') return;

  s.towardExtra += points;
  while (s.towardExtra >= EXTRA_LIFE_POINTS) {
    s.towardExtra -= EXTRA_LIFE_POINTS;
    s.lives += 1;
    s.events.push({ t: 'extraLife' });
  }
}

export function setTurn(s: GameState, turn: -1 | 0 | 1): void {
  s.turn = turn;
  // A keyboard turn takes the stick's target away, so the two never fight.
  if (turn !== 0) s.aim = null;
}

export function setThrust(s: GameState, on: boolean): void {
  s.thrust = on;
}

/** The touch stick's target heading, or null to hand steering back to the keys. */
export function setAim(s: GameState, heading: number | null): void {
  s.aim = heading;
}

export function fire(s: GameState): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;
  if (s.fireCooldown > 0) return;

  const mine = s.bullets.filter((b) => !b.hostile).length;
  if (mine >= MAX_BULLETS) return;

  const ship = s.ship;
  s.bullets.push({
    id: nextId(s),
    x: ship.x + Math.cos(ship.angle) * SHIP_R,
    y: ship.y + Math.sin(ship.angle) * SHIP_R,
    // The ship's own velocity is added, so shooting while running away is
    // genuinely worse than shooting while facing your target.
    vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
    vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED,
    r: BULLET_R,
    life: BULLET_LIFE_TICKS,
    hostile: false,
  });
  s.fireCooldown = FIRE_COOLDOWN;
  s.events.push({ t: 'fire' });
}

/**
 * The escape hatch. Somewhere else on the field, immediately, with a moment of
 * protection and no velocity. It cannot be aimed, which is what keeps it a last
 * resort rather than a way of travelling.
 */
export function hyperspace(s: GameState): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;

  const ship = s.ship;
  ship.x = rand(s) * FIELD_W;
  ship.y = rand(s) * FIELD_H;
  ship.vx = 0;
  ship.vy = 0;
  ship.invuln = Math.max(ship.invuln, 40);
  s.events.push({ t: 'hyperspace' });
}

function splitRock(s: GameState, rock: Rock): void {
  if (rock.size === 1) return;
  const size = (rock.size - 1) as 1 | 2;
  // Exactly two, every time. The wave only ends when the array empties, so a
  // split that produced a variable number would make that condition a lottery.
  for (let i = 0; i < 2; i++) spawnRock(s, size, { x: rock.x, y: rock.y });
}

function loseShip(s: GameState): void {
  s.lives -= 1;
  s.events.push({ t: 'shipLost', livesLeft: s.lives });

  if (s.lives <= 0) {
    s.status = 'over';
    s.events.push({ t: 'over' });
    return;
  }

  s.status = 'respawning';
  s.holdTicks = RESPAWN_TICKS;
  s.bullets = s.bullets.filter((b) => !b.hostile);
}

/** Is the middle of the field clear enough to put a ship back into it? */
export function spawnIsClear(s: GameState): boolean {
  for (const rock of s.rocks) {
    if (torusDistance(rock.x, rock.y, FIELD_W / 2, FIELD_H / 2) < SPAWN_CLEARANCE + rock.r) {
      return false;
    }
  }
  if (s.saucer && torusDistance(s.saucer.x, s.saucer.y, FIELD_W / 2, FIELD_H / 2) < SPAWN_CLEARANCE) {
    return false;
  }
  return true;
}

function respawn(s: GameState): void {
  s.ship = makeShip();
  s.turn = 0;
  s.thrust = false;
  s.aim = null;
  s.status = 'playing';
}

function moveShip(s: GameState): void {
  const ship = s.ship;

  if (s.aim !== null) {
    // Rotates toward the stick's heading at exactly the keyboard rate.
    const delta = Math.atan2(Math.sin(s.aim - ship.angle), Math.cos(s.aim - ship.angle));
    const step = TURN_RATE * DT;
    ship.angle += Math.abs(delta) <= step ? delta : Math.sign(delta) * step;
  } else if (s.turn !== 0) {
    ship.angle += s.turn * TURN_RATE * DT;
  }

  ship.thrusting = s.thrust;
  if (s.thrust) {
    ship.vx += Math.cos(ship.angle) * THRUST_ACCEL * DT;
    ship.vy += Math.sin(ship.angle) * THRUST_ACCEL * DT;
  }

  const drag = Math.max(0, 1 - DRAG * DT);
  ship.vx *= drag;
  ship.vy *= drag;

  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > MAX_SHIP_SPEED) {
    ship.vx = (ship.vx / speed) * MAX_SHIP_SPEED;
    ship.vy = (ship.vy / speed) * MAX_SHIP_SPEED;
  }

  ship.x += ship.vx * DT;
  ship.y += ship.vy * DT;
  wrapPosition(ship);

  if (ship.invuln > 0) ship.invuln -= 1;
}

function moveSaucer(s: GameState): void {
  if (!s.saucer) {
    s.saucerIn -= 1;
    if (s.saucerIn > 0 || s.rocks.length === 0) return;

    const small = rand(s) < Math.min(0.6, 0.15 + 0.06 * s.wave);
    const fromLeft = rand(s) < 0.5;
    s.saucer = {
      id: nextId(s),
      x: fromLeft ? 0 : FIELD_W,
      y: rand(s) * FIELD_H,
      vx: (fromLeft ? 1 : -1) * SAUCER_SPEED,
      vy: (rand(s) - 0.5) * 60,
      r: small ? SAUCER_R * 0.65 : SAUCER_R,
      small,
      fireIn: SAUCER_FIRE_TICKS,
    };
    s.events.push({ t: 'saucerSpawned' });
    return;
  }

  const saucer = s.saucer;
  saucer.x += saucer.vx * DT;
  saucer.y += saucer.vy * DT;
  wrapPosition(saucer);

  saucer.fireIn -= 1;
  if (saucer.fireIn <= 0) {
    saucer.fireIn = SAUCER_FIRE_TICKS;

    // A small saucer aims. A large one sprays, which is what makes the small
    // one worth being afraid of and the large one worth farming.
    let heading = rand(s) * Math.PI * 2;
    if (saucer.small && s.status === 'playing') {
      heading = Math.atan2(
        wrapDelta(saucer.y, s.ship.y, FIELD_H),
        wrapDelta(saucer.x, s.ship.x, FIELD_W),
      );
    }

    s.bullets.push({
      id: nextId(s),
      x: saucer.x,
      y: saucer.y,
      vx: Math.cos(heading) * SAUCER_BULLET_SPEED,
      vy: Math.sin(heading) * SAUCER_BULLET_SPEED,
      r: BULLET_R,
      life: BULLET_LIFE_TICKS + 20,
      hostile: true,
    });
  }
}

function moveRocksAndBullets(s: GameState): void {
  for (const rock of s.rocks) {
    rock.x += rock.vx * DT;
    rock.y += rock.vy * DT;
    rock.angle += rock.spin * DT;
    wrapPosition(rock);
  }

  for (let i = s.bullets.length - 1; i >= 0; i--) {
    const b = s.bullets[i];
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    wrapPosition(b);
    b.life -= 1;
    if (b.life <= 0) s.bullets.splice(i, 1);
  }
}

function resolveCollisions(s: GameState): void {
  const scale = MODE_META[s.mode].scoreScale;

  // Bullets against rocks and the saucer.
  for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
    const bullet = s.bullets[bi];
    if (bullet.hostile) continue;

    let hit = false;
    for (let ri = s.rocks.length - 1; ri >= 0; ri--) {
      const rock = s.rocks[ri];
      if (torusDistance(bullet.x, bullet.y, rock.x, rock.y) > rock.r + bullet.r) continue;

      s.rocks.splice(ri, 1);
      splitRock(s, rock);
      const points = Math.round(ROCK_POINTS[rock.size] * scale);
      addScore(s, points);
      s.events.push({ t: 'rock', size: rock.size, points });
      hit = true;
      break;
    }

    if (!hit && s.saucer) {
      const saucer = s.saucer;
      if (torusDistance(bullet.x, bullet.y, saucer.x, saucer.y) <= saucer.r + bullet.r) {
        const points = Math.round(SAUCER_POINTS * (saucer.small ? 2 : 1) * scale);
        addScore(s, points);
        s.events.push({ t: 'saucer', points });
        s.saucer = null;
        s.saucerIn = 900 + randInt(s, 900);
        hit = true;
      }
    }

    if (hit) s.bullets.splice(bi, 1);
  }

  if (s.status !== 'playing' || s.ship.invuln > 0) return;

  const ship = s.ship;

  for (const rock of s.rocks) {
    if (torusDistance(ship.x, ship.y, rock.x, rock.y) <= rock.r + ship.r * 0.7) {
      loseShip(s);
      return;
    }
  }

  for (let i = s.bullets.length - 1; i >= 0; i--) {
    const b = s.bullets[i];
    if (!b.hostile) continue;
    if (torusDistance(ship.x, ship.y, b.x, b.y) > b.r + ship.r * 0.7) continue;
    s.bullets.splice(i, 1);
    loseShip(s);
    return;
  }

  if (s.saucer && torusDistance(ship.x, ship.y, s.saucer.x, s.saucer.y) <= s.saucer.r + ship.r * 0.7) {
    loseShip(s);
  }
}

export function step(s: GameState): void {
  s.events.length = 0;

  if (s.status === 'ready') {
    s.holdTicks -= 1;
    if (s.holdTicks <= 0) s.status = 'playing';
    return;
  }

  if (s.status === 'respawning') {
    // The world keeps running while the player waits, which is what makes
    // waiting for a clear middle a real thing rather than a fixed delay.
    s.elapsedMs += TICK_MS;
    moveRocksAndBullets(s);
    moveSaucer(s);
    resolveCollisions(s);

    s.holdTicks -= 1;
    // Waiting for a clear middle is right, but waiting forever is not. Past the
    // patience limit the ship comes back anyway, on full spawn protection.
    if (s.holdTicks <= 0 && (spawnIsClear(s) || s.holdTicks < -RESPAWN_PATIENCE)) respawn(s);
    return;
  }

  if (s.status !== 'playing') return;

  s.elapsedMs += TICK_MS;
  if (s.fireCooldown > 0) s.fireCooldown -= 1;

  moveShip(s);
  moveRocksAndBullets(s);
  moveSaucer(s);
  resolveCollisions(s);

  if (s.status === 'playing' && s.rocks.length === 0) {
    s.wave += 1;
    s.bullets = [];
    s.saucer = null;
    beginWave(s);
  }
}

export function togglePause(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'playing') s.status = 'paused';
  else if (s.status === 'paused') s.status = 'playing';
}

export function skipHold(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'ready') {
    s.status = 'playing';
    s.holdTicks = 0;
  }
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    wave: s.wave,
    score: s.score,
    lives: s.lives,
    rocks: s.rocks.length,
    bullets: s.bullets.filter((b) => !b.hostile).length,
    saucer: s.saucer !== null,
  };
}
