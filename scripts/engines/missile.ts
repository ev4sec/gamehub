import { check, expect, section } from '../checks';
import {
  BLAST_LIFE,
  INTERCEPTOR_SPEED,
  LAYOUTS,
  MODES,
  threatsFor,
} from '../../src/games/missile/engine/constants';
import {
  createGame,
  fireAt,
  hudOf,
  step,
  togglePause,
} from '../../src/games/missile/engine/engine';
import type { GameState, Mode } from '../../src/games/missile/engine/types';

/**
 * Missile Command's engine, in plain node.
 *
 * The soak is judged by what it executed, not by whether it threw. A run that
 * clears no waves proves nothing about waves, and a run that loses no cities
 * proves nothing about the losing condition, so both are asserted on the tally
 * rather than assumed from a green result.
 */

interface Tally {
  spawned: number;
  killed: number;
  citiesLost: number;
  basesLost: number;
  wavesCleared: number;
  bonusCities: number;
  shots: number;
  dryFires: number;
}

function emptyTally(): Tally {
  return {
    spawned: 0,
    killed: 0,
    citiesLost: 0,
    basesLost: 0,
    wavesCleared: 0,
    bonusCities: 0,
    shots: 0,
    dryFires: 0,
  };
}

/**
 * A competent player, not a random one. It leads the target by solving for the
 * flight time twice, and shoots at each threat once so it does not simply empty
 * the batteries into the sky. Random tapping clears no waves, which is the same
 * trap the Tetris soak already documents.
 */
function autopilot(s: GameState, shotAt: Set<number>, tally: Tally): void {
  if (s.status !== 'playing') return;

  const open = s.threats.filter((t) => !shotAt.has(t.id) && t.y > 40);
  if (open.length === 0) return;
  const target = open.reduce((a, b) => (b.y > a.y ? b : a));

  let lead = 0.5;
  for (let i = 0; i < 3; i++) {
    const px = target.x + target.vx * lead;
    const py = target.y + target.vy * lead;
    lead = Math.hypot(px - 400, py - 542) / INTERCEPTOR_SPEED;
  }

  shotAt.add(target.id);
  const armed = s.batteries.reduce((n, b) => n + (b.alive ? b.ammo : 0), 0);
  fireAt(s, target.x + target.vx * lead, target.y + target.vy * lead);

  for (const ev of s.events) {
    if (ev.t === 'fire') tally.shots += 1;
    if (ev.t === 'dryFire') {
      tally.dryFires += 1;
      // The only honest reason to refuse a shot. A refusal with ammo still on
      // the board would mean the battery choice, not the ammo, turned it down.
      expect(armed === 0, 'a shot is only ever refused when every battery is dry');
    }
  }
}

function invariants(s: GameState, label: string): void {
  for (const b of s.batteries) {
    expect(b.ammo >= 0, `${label}: ammo never goes negative`);
    expect(!b.alive ? b.ammo === 0 : true, `${label}: a destroyed battery holds no ammo`);
  }
  for (const blast of s.blasts) {
    expect(blast.age <= BLAST_LIFE, `${label}: a blast never outlives its span`);
    expect(blast.r >= -0.001 && blast.r <= blast.maxR + 0.001, `${label}: blast radius in range`);
  }
  expect(s.score >= 0, `${label}: score never goes negative`);
  expect(s.cities.length === LAYOUTS[s.mode].cities.length, `${label}: cities are never added`);
}

function soak(mode: Mode, seed: number, maxTicks: number): Tally {
  const s = createGame(mode, seed);
  const shotAt = new Set<number>();
  const tally = emptyTally();
  let ticks = 0;

  while (s.status !== 'over' && ticks < maxTicks) {
    const before = s.threats.length;
    step(s);
    ticks += 1;

    // Spawns are counted off the array rather than off an event, because a
    // splitter breaking up adds threats that were never announced.
    if (s.threats.length > before) tally.spawned += s.threats.length - before;

    for (const ev of s.events) {
      if (ev.t === 'kill') tally.killed += 1;
      else if (ev.t === 'cityLost') tally.citiesLost += 1;
      else if (ev.t === 'baseLost') tally.basesLost += 1;
      else if (ev.t === 'waveComplete') tally.wavesCleared += 1;
      else if (ev.t === 'bonusCity') tally.bonusCities += 1;
    }

    if (ticks % 5 === 0) autopilot(s, shotAt, tally);
    if (ticks % 97 === 0) invariants(s, `${mode}/${seed}`);
  }

  invariants(s, `${mode}/${seed} final`);
  return tally;
}

export function missileEngineChecks(): void {
  section('missile: the opening board');
  for (const mode of MODES) {
    const s = createGame(mode, 1);
    const layout = LAYOUTS[mode];
    check(s.cities.length === layout.cities.length, `${mode} lays out its cities`);
    check(
      s.batteries.every((b) => b.ammo === layout.ammo),
      `${mode} arms every battery`,
    );
    check(s.status === 'ready', `${mode} opens on the wave banner, not mid-air`);
    check(s.pending === threatsFor(mode, 1), `${mode} queues wave one`);
  }

  section('missile: firing');
  {
    const s = createGame('classic', 3);
    while (s.status === 'ready') step(s);

    const armed = hudOf(s).ammo;
    fireAt(s, 400, 200);
    check(hudOf(s).ammo === armed - 1, 'a shot costs exactly one missile');
    check(s.interceptors.length === 1, 'a shot puts one interceptor in the air');

    // The nearest battery with ammo is chosen for the player, which is the
    // whole reason this game works with one thumb.
    const near = createGame('classic', 3);
    while (near.status === 'ready') step(near);
    fireAt(near, 60, 200);
    check(
      near.batteries[0].ammo < near.batteries[1].ammo,
      'the shot comes from the battery nearest the target',
    );

    const dry = createGame('classic', 3);
    while (dry.status === 'ready') step(dry);
    for (const b of dry.batteries) b.ammo = 0;
    fireAt(dry, 400, 200);
    check(
      dry.events.some((e) => e.t === 'dryFire') && dry.interceptors.length === 0,
      'firing with every battery dry is refused, not borrowed against',
    );
  }

  section('missile: an interceptor reaches its mark and detonates');
  {
    const s = createGame('classic', 5);
    while (s.status === 'ready') step(s);
    fireAt(s, 400, 300);

    let guard = 0;
    while (s.interceptors.length > 0 && guard < 600) {
      step(s);
      guard += 1;
    }
    check(guard < 600, 'the interceptor arrives rather than flying forever');
    check(
      s.blasts.some((b) => !b.hostile),
      'arriving turns it into a blast',
    );

    const blast = s.blasts.find((b) => !b.hostile)!;
    const grown = blast.r;
    for (let i = 0; i < 25; i++) step(s);
    check(blast.r > grown, 'the blast grows');

    guard = 0;
    while (s.blasts.includes(blast) && guard < BLAST_LIFE + 20) {
      step(s);
      guard += 1;
    }
    check(!s.blasts.includes(blast), 'and then it is gone, rather than lingering');
  }

  section('missile: pause stops the sky');
  {
    const s = createGame('classic', 9);
    while (s.status === 'ready') step(s);
    for (let i = 0; i < 200; i++) step(s);

    togglePause(s);
    const frozen = s.threats.map((t) => `${t.x.toFixed(4)},${t.y.toFixed(4)}`).join('|');
    for (let i = 0; i < 60; i++) step(s);
    const after = s.threats.map((t) => `${t.x.toFixed(4)},${t.y.toFixed(4)}`).join('|');
    check(frozen === after, 'nothing moves while paused');

    togglePause(s);
    for (let i = 0; i < 30; i++) step(s);
    check(
      s.threats.map((t) => `${t.x.toFixed(4)},${t.y.toFixed(4)}`).join('|') !== after,
      'and moves again when resumed',
    );
  }

  section('missile: an undefended field falls');
  {
    const s = createGame('classic', 5);
    let ticks = 0;
    while (s.status !== 'over' && ticks < 60000) {
      step(s);
      ticks += 1;
    }
    check(s.status === 'over', 'with no defense at all the run ends');
    check(
      s.cities.every((c) => !c.alive),
      'and it ends because every city is gone, not for some other reason',
    );
  }

  section('missile: soak');
  {
    const total = emptyTally();
    for (const mode of MODES) {
      for (const seed of [3, 11, 29, 47]) {
        const t = soak(mode, seed, 40000);
        for (const key of Object.keys(total) as (keyof Tally)[]) total[key] += t[key];
      }
    }

    console.log(
      `soak      ${total.spawned} launched, ${total.killed} intercepted, ` +
        `${total.shots} shots fired, ${total.wavesCleared} waves held, ` +
        `${total.citiesLost} cities lost, ${total.basesLost} batteries lost`,
    );

    // Both halves matter. Waves cleared with no cities lost would mean the test
    // player is perfect and the losing condition went unexercised; cities lost
    // with no waves cleared would mean it never got past the first minute.
    check(total.wavesCleared > 0, 'the soak actually held waves');
    check(total.citiesLost > 0, 'the soak actually lost cities');
    check(total.killed > 0, 'the soak actually intercepted things');
    // Not a defect. A wave eventually launches more warheads than the
    // batteries hold, splitters included, and that pressure is the game. What
    // matters is that it happened at all, so the ammo limit is doing work.
    check(total.dryFires > 0, `the soak ran batteries dry ${total.dryFires} times, so ammo binds`);
  }
}
