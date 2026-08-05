import { check, expect, section } from '../checks';
import {
  BULLET_LIFE_TICKS,
  BULLET_SPEED,
  DT,
  FIELD_H,
  FIELD_W,
  MAX_BULLETS,
  MODES,
  MODE_META,
  ROCK_R,
  rocksForWave,
} from '../../src/games/asteroids/engine/constants';
import {
  createGame,
  fire,
  hudOf,
  hyperspace,
  setAim,
  setThrust,
  setTurn,
  step,
  togglePause,
  torusDistance,
  wrapDelta,
} from '../../src/games/asteroids/engine/engine';
import type { GameState, Mode } from '../../src/games/asteroids/engine/types';

/**
 * Asteroids' engine, in plain node.
 *
 * The seam is the whole point. A body at x = 1 and a body at x = W - 1 are two
 * units apart, and a naive distance test says they are a screen apart. Random
 * play almost never straddles the seam at the moment of a collision, so a soak
 * would run green for a very long time with that bug in it. It is therefore
 * tested directly, with bodies placed on the seam on purpose.
 */

interface Tally {
  shots: number;
  rocks: Record<1 | 2 | 3, number>;
  saucers: number;
  waves: number;
  shipsLost: number;
  hyperspaces: number;
}

function emptyTally(): Tally {
  return {
    shots: 0,
    rocks: { 1: 0, 2: 0, 3: 0 },
    saucers: 0,
    waves: 0,
    shipsLost: 0,
    hyperspaces: 0,
  };
}

/**
 * A competent pilot: turns toward the nearest rock through the wrap, fires when
 * it is lined up, and jumps out when something is about to hit it. Random
 * flying clears no waves at all, so a random soak would leave every check past
 * the first wave untouched.
 */
function autopilot(s: GameState, tally: Tally): void {
  if (s.status !== 'playing') return;

  const ship = s.ship;
  let target: { x: number; y: number; d: number } | null = null;

  for (const rock of s.rocks) {
    const d = torusDistance(ship.x, ship.y, rock.x, rock.y);
    if (!target || d < target.d) target = { x: rock.x, y: rock.y, d };
  }
  if (!target) return;

  // Anything this close is about to be a collision, and shooting it will not
  // stop the debris arriving.
  if (target.d < 70 && ship.invuln === 0) {
    hyperspace(s);
    for (const ev of s.events) if (ev.t === 'hyperspace') tally.hyperspaces += 1;
    return;
  }

  const heading = Math.atan2(
    wrapDelta(ship.y, target.y, FIELD_H),
    wrapDelta(ship.x, target.x, FIELD_W),
  );
  setAim(s, heading);

  const error = Math.abs(
    Math.atan2(Math.sin(heading - ship.angle), Math.cos(heading - ship.angle)),
  );
  if (error < 0.18) {
    fire(s);
    for (const ev of s.events) if (ev.t === 'fire') tally.shots += 1;
  }
}

function invariants(s: GameState, label: string): void {
  expect(s.ship.x >= 0 && s.ship.x < FIELD_W, `${label}: the ship stays inside the field`);
  expect(s.ship.y >= 0 && s.ship.y < FIELD_H, `${label}: and on the vertical too`);
  for (const rock of s.rocks) {
    expect(rock.x >= 0 && rock.x < FIELD_W, `${label}: rocks wrap rather than escape`);
    expect(rock.y >= 0 && rock.y < FIELD_H, `${label}: on both axes`);
    expect(rock.size >= 1 && rock.size <= 3, `${label}: rocks are one of three sizes`);
  }
  expect(
    s.bullets.filter((b) => !b.hostile).length <= MAX_BULLETS,
    `${label}: never more than four of the player's bullets in the air`,
  );
  expect(s.lives >= 0, `${label}: lives never go negative`);
}

function soak(mode: Mode, seed: number, maxTicks: number): Tally {
  const s = createGame(mode, seed);
  const tally = emptyTally();
  let ticks = 0;

  while (s.status !== 'over' && ticks < maxTicks) {
    autopilot(s, tally);
    step(s);
    ticks += 1;

    for (const ev of s.events) {
      if (ev.t === 'rock') tally.rocks[ev.size] += 1;
      else if (ev.t === 'saucer') tally.saucers += 1;
      else if (ev.t === 'wave') tally.waves += 1;
      else if (ev.t === 'shipLost') tally.shipsLost += 1;
    }

    if (ticks % 89 === 0) invariants(s, `${mode}/${seed}`);
  }

  invariants(s, `${mode}/${seed} final`);
  return tally;
}

export function asteroidsEngineChecks(): void {
  section('asteroids: the premise the collision test rests on');
  {
    // Asserted before anything else, in the spirit of Breakout's tunnelling
    // check: a bullet that travels further in one tick than the smallest rock
    // is wide can pass straight through it, and every collision test below
    // would then be quietly measuring nothing.
    const perTick = BULLET_SPEED * DT;
    const smallest = ROCK_R[1] * 2;
    console.log(
      `premise   bullet travels ${perTick.toFixed(1)} per tick, smallest rock is ${smallest} across`,
    );
    check(perTick < smallest, 'a bullet cannot step over the smallest rock in one tick');
    check(
      BULLET_SPEED * BULLET_LIFE_TICKS * DT < Math.max(FIELD_W, FIELD_H),
      'a bullet expires before it can lap the field and hit you from behind',
    );
  }

  section('asteroids: the wrap');
  {
    check(wrapDelta(1, FIELD_W - 1, FIELD_W) === -2, 'the short way round is the answer');
    check(wrapDelta(FIELD_W - 1, 1, FIELD_W) === 2, 'and it is signed the right way');
    check(wrapDelta(10, 20, FIELD_W) === 10, 'an ordinary separation is left alone');
    check(
      Math.abs(torusDistance(2, 2, FIELD_W - 2, FIELD_H - 2) - Math.hypot(4, 4)) < 1e-9,
      'opposite corners are close, because they are',
    );
  }

  section('asteroids: a bullet across the seam still hits');
  {
    const s = createGame('classic', 5);
    while (s.status === 'ready') step(s);
    s.rocks = [];
    s.saucer = null;
    s.bullets = [];

    // A rock just inside the left edge, a bullet just inside the right one,
    // travelling right. Without the wrap they are a whole screen apart and
    // this shot misses forever.
    s.rocks.push({
      id: 999,
      x: 6,
      y: FIELD_H / 2,
      vx: 0,
      vy: 0,
      r: ROCK_R[2],
      size: 2,
      spin: 0,
      angle: 0,
      shape: [1, 1, 1, 1, 1, 1, 1],
    });
    s.bullets.push({
      id: 998,
      x: FIELD_W - 6,
      y: FIELD_H / 2,
      vx: BULLET_SPEED,
      vy: 0,
      r: 3,
      life: 40,
      hostile: false,
    });

    let guard = 0;
    while (s.rocks.some((r) => r.id === 999) && guard < 40) {
      step(s);
      guard += 1;
    }
    check(guard < 40, 'a bullet crossing the seam reaches the rock on the other side');
    check(s.rocks.length === 2, 'and the medium rock it hit left two small ones behind');
  }

  section('asteroids: a ship on the seam is not safe');
  {
    const s = createGame('classic', 7);
    while (s.status === 'ready') step(s);
    s.ship.invuln = 0;
    s.ship.x = 4;
    s.ship.y = 10;
    s.rocks = [
      {
        id: 1,
        x: FIELD_W - 4,
        y: FIELD_H - 10,
        vx: 0,
        vy: 0,
        r: ROCK_R[3],
        size: 3,
        spin: 0,
        angle: 0,
        shape: [1, 1, 1, 1, 1, 1, 1],
      },
    ];
    const lives = s.lives;
    step(s);
    check(s.lives === lives - 1, 'a rock diagonally across both seams still hits the ship');
  }

  section('asteroids: splitting conserves');
  {
    const s = createGame('classic', 11);
    while (s.status === 'ready') step(s);
    s.rocks = [];
    s.bullets = [];
    s.saucer = null;

    for (const size of [3, 2] as const) {
      s.rocks = [
        {
          id: 1,
          x: FIELD_W / 2,
          y: 100,
          vx: 0,
          vy: 0,
          r: ROCK_R[size],
          size,
          spin: 0,
          angle: 0,
          shape: [1, 1, 1, 1, 1, 1, 1],
        },
      ];
      s.bullets = [
        {
          id: 2,
          x: FIELD_W / 2,
          y: 100,
          vx: 0,
          vy: 0,
          r: 3,
          life: 5,
          hostile: false,
        },
      ];
      step(s);
      check(s.rocks.length === 2, `a size ${size} rock yields exactly two`);
      check(
        s.rocks.every((r) => r.size === size - 1),
        `and both of them are size ${size - 1}`,
      );
    }

    s.rocks = [
      {
        id: 1,
        x: FIELD_W / 2,
        y: 100,
        vx: 0,
        vy: 0,
        r: ROCK_R[1],
        size: 1,
        spin: 0,
        angle: 0,
        shape: [1, 1, 1, 1, 1, 1, 1],
      },
    ];
    s.bullets = [
      { id: 2, x: FIELD_W / 2, y: 100, vx: 0, vy: 0, r: 3, life: 5, hostile: false },
    ];
    const wave = s.wave;
    step(s);
    check(s.wave === wave + 1, 'clearing the last rock is what ends the wave');
  }

  section('asteroids: the gun');
  {
    const s = createGame('classic', 13);
    while (s.status === 'ready') step(s);

    for (let i = 0; i < 12; i++) {
      fire(s);
      step(s);
    }
    check(
      s.bullets.filter((b) => !b.hostile).length <= MAX_BULLETS,
      'the four-shot limit holds under a held trigger',
    );

    const before = s.bullets.length;
    fire(s);
    check(s.bullets.length <= before + 1, 'and one press is at most one bullet');
  }

  section('asteroids: steering');
  {
    const s = createGame('classic', 17);
    while (s.status === 'ready') step(s);

    const angle = s.ship.angle;
    setTurn(s, 1);
    for (let i = 0; i < 10; i++) step(s);
    check(s.ship.angle > angle, 'turning right increases the heading');

    setTurn(s, 0);
    const held = s.ship.angle;
    for (let i = 0; i < 10; i++) step(s);
    check(s.ship.angle === held, 'and letting go holds it, rather than centring');

    // The stick sets a target, and the ship still has to turn to reach it.
    setAim(s, held + 1.2);
    step(s);
    check(s.ship.angle !== held && s.ship.angle < held + 1.2, 'the stick aims, it does not snap');

    setThrust(s, true);
    const speedBefore = Math.hypot(s.ship.vx, s.ship.vy);
    for (let i = 0; i < 10; i++) step(s);
    check(Math.hypot(s.ship.vx, s.ship.vy) > speedBefore, 'thrust accelerates');

    setThrust(s, false);
    const coasting = Math.hypot(s.ship.vx, s.ship.vy);
    for (let i = 0; i < 60; i++) step(s);
    const later = Math.hypot(s.ship.vx, s.ship.vy);
    check(later < coasting && later > 0, 'and letting go coasts rather than stopping dead');
  }

  section('asteroids: hyperspace');
  {
    const s = createGame('classic', 19);
    while (s.status === 'ready') step(s);
    setThrust(s, true);
    for (let i = 0; i < 30; i++) step(s);

    const where = `${s.ship.x},${s.ship.y}`;
    hyperspace(s);
    check(`${s.ship.x},${s.ship.y}` !== where, 'it moves the ship');
    check(s.ship.vx === 0 && s.ship.vy === 0, 'and drops the velocity with it');
    check(s.ship.invuln > 0, 'and buys a moment of protection');
  }

  section('asteroids: a lost ship waits for a clear field');
  {
    const s = createGame('classic', 23);
    while (s.status === 'ready') step(s);

    s.ship.invuln = 0;
    s.rocks = [
      {
        id: 1,
        x: s.ship.x,
        y: s.ship.y,
        vx: 0,
        vy: 0,
        r: ROCK_R[3],
        size: 3,
        spin: 0,
        angle: 0,
        shape: [1, 1, 1, 1, 1, 1, 1],
      },
    ];
    step(s);
    check(s.status === 'respawning', 'losing a ship goes to the respawn wait');

    // The rock is parked exactly where the ship would appear, so the game has
    // to refuse to place one until it drifts off, or give up and protect it.
    let guard = 0;
    while (s.status === 'respawning' && guard < 200) {
      step(s);
      guard += 1;
    }
    check(s.status === 'respawning', 'and it will not drop a ship into the rock that killed it');
  }

  section('asteroids: pause stops the field');
  {
    const s = createGame('classic', 29);
    while (s.status === 'ready') step(s);
    for (let i = 0; i < 40; i++) step(s);

    togglePause(s);
    const frozen = s.rocks.map((r) => `${r.x.toFixed(4)},${r.y.toFixed(4)}`).join('|');
    for (let i = 0; i < 40; i++) step(s);
    check(
      frozen === s.rocks.map((r) => `${r.x.toFixed(4)},${r.y.toFixed(4)}`).join('|'),
      'nothing drifts while paused',
    );

    togglePause(s);
    for (let i = 0; i < 10; i++) step(s);
    check(
      frozen !== s.rocks.map((r) => `${r.x.toFixed(4)},${r.y.toFixed(4)}`).join('|'),
      'and drifts again once resumed',
    );
  }

  section('asteroids: the opening board');
  for (const mode of MODES) {
    const s = createGame(mode, 1);
    check(s.lives === MODE_META[mode].lives, `${mode} starts with its own hull count`);
    check(s.rocks.length === rocksForWave(mode, 1), `${mode} fills its first wave`);
    check(
      s.rocks.every((r) => r.size === 3),
      `${mode} opens with large rocks only`,
    );
    check(hudOf(s).status === 'ready', `${mode} opens on its banner`);
  }

  section('asteroids: soak');
  {
    const total = emptyTally();
    for (const mode of MODES) {
      for (const seed of [3, 11, 29, 47]) {
        const t = soak(mode, seed, 50000);
        total.shots += t.shots;
        total.saucers += t.saucers;
        total.waves += t.waves;
        total.shipsLost += t.shipsLost;
        total.hyperspaces += t.hyperspaces;
        for (const size of [1, 2, 3] as const) total.rocks[size] += t.rocks[size];
      }
    }

    console.log(
      `soak      ${total.shots} shots, rocks broken ${total.rocks[3]}/${total.rocks[2]}/${total.rocks[1]} ` +
        `(large/medium/small), ${total.saucers} saucers, ${total.waves} waves, ` +
        `${total.shipsLost} ships lost, ${total.hyperspaces} jumps`,
    );

    check(total.waves > MODES.length * 4, 'the soak actually cleared waves');
    check(total.shipsLost > 0, 'the soak actually lost ships, so the hazards are live');
    for (const size of [1, 2, 3] as const) {
      check(total.rocks[size] > 0, `the soak broke rocks of size ${size}`);
    }
    check(total.saucers > 0, 'the soak actually met a saucer');
  }
}
