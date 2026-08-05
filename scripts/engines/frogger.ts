import { check, expect, section } from '../checks';
import {
  COLS,
  HOME_COLS,
  MODES,
  MODE_META,
  ROW_HOMES,
  ROW_START,
  speedMultiplier,
} from '../../src/games/frogger/engine/constants';
import { BASE_LANES, buildLanes } from '../../src/games/frogger/engine/lanes';
import {
  covers,
  createGame,
  hop,
  hudOf,
  laneAt,
  nextLevel,
  step,
  togglePause,
} from '../../src/games/frogger/engine/engine';
import type { Dir, GameState, Lane, Mode } from '../../src/games/frogger/engine/types';

/**
 * Frogger's engine, in plain node.
 *
 * The interesting check here is not a soak. Because every lane is one repeating
 * pattern, how long a cell is clear and how long it is covered are closed-form
 * numbers, so solvability can be proved for every level rather than sampled by
 * a random walk. A lane whose gap is narrower than the frog is an uncrossable
 * level, and without this the first person to find it is a player.
 */

/** Seconds a given cell is clear of traffic, once per pass. */
function clearWindow(speed: number, gap: number): number {
  return gap / speed;
}

/** Seconds a raft covers a given cell, once per pass. */
function rideWindow(speed: number, span: number): number {
  return span / speed;
}

/**
 * The floor. A hop is instantaneous, so what a player actually needs is enough
 * time to see the gap and commit to it. A third of a second is tight and
 * playable; anything under it is a level nobody can cross on purpose.
 */
const MIN_CLEAR_S = 0.33;
const MIN_RIDE_S = 0.5;

interface Tally {
  hops: number;
  homes: number;
  squashed: number;
  drowned: number;
  timeouts: number;
  levels: number;
}

function emptyTally(): Tally {
  return { hops: 0, homes: 0, squashed: 0, drowned: 0, timeouts: 0, levels: 0 };
}

/** Whether a lane covers `x` after `t` seconds, without simulating anything. */
function coversIn(lane: Lane, x: number, t: number): boolean {
  const period = lane.span + lane.gap;
  const phase = lane.phase + lane.dir * lane.speed * t;
  return covers({ ...lane, phase: ((phase % period) + period) % period }, x);
}

/** How long the decision has to stay true for, in seconds. */
const HORIZON = 0.35;

function roadSafe(lane: Lane, x: number): boolean {
  for (let t = 0; t <= HORIZON; t += 0.07) if (coversIn(lane, x, t)) return false;
  return true;
}

function riverSafe(lane: Lane, x: number): boolean {
  for (let t = 0; t <= HORIZON; t += 0.07) if (!coversIn(lane, x, t)) return false;
  return true;
}

function rowSafe(s: GameState, row: number, x: number): boolean {
  if (row < ROW_HOMES || row > ROW_START) return false;
  const lane = laneAt(s, row);
  if (!lane) return true;
  return lane.kind === 'road' ? roadSafe(lane, x) : riverSafe(lane, x);
}

/**
 * A cautious player, not a random one.
 *
 * Three things it has to do that a naive version does not, each of which was
 * the difference between a soak that crosses and one that drowns in the first
 * river lane: look far enough ahead that the decision is still true when it
 * lands, step sideways off a raft that is about to carry it off the board, and
 * line up with an open bay before it reaches the far bank rather than at it.
 */
function autopilot(s: GameState): Dir | null {
  if (s.status !== 'playing') return null;

  const frog = s.frog;
  const here = frog.col + frog.carry + 0.5;
  const targetRow = frog.row - 1;
  if (targetRow < ROW_HOMES) return null;

  // The far bank. Only the open bays are landings; everything else is a wall.
  if (targetRow === ROW_HOMES) {
    const open = HOME_COLS.filter((_, i) => !s.homes[i]);
    if (open.length === 0) return null;
    const col = Math.round(frog.col + frog.carry);
    if (open.includes(col)) return 'up';
    const want = open.reduce((a, b) => (Math.abs(b - col) < Math.abs(a - col) ? b : a));
    const dir: Dir = want > col ? 'right' : 'left';
    return rowSafe(s, frog.row, here + (want > col ? 1 : -1)) ? dir : null;
  }

  // Approaching the bank, line up with a bay while there is still room to.
  if (targetRow <= 2) {
    const open = HOME_COLS.filter((_, i) => !s.homes[i]);
    const col = Math.round(frog.col + frog.carry);
    if (open.length > 0 && !open.includes(col)) {
      const want = open.reduce((a, b) => (Math.abs(b - col) < Math.abs(a - col) ? b : a));
      const step = want > col ? 1 : -1;
      if (rowSafe(s, frog.row, here + step)) return want > col ? 'right' : 'left';
    }
  }

  if (rowSafe(s, targetRow, here)) return 'up';

  // Riding something that is about to run out, or about to leave the board.
  const lane = laneAt(s, frog.row);
  if (lane?.kind === 'river') {
    const leaving = here < 1.6 || here > COLS - 1.6;
    const ending = !coversIn(lane, here, HORIZON);
    if (leaving || ending) {
      const inward = here < COLS / 2 ? 1 : -1;
      if (rowSafe(s, frog.row, here + inward)) return inward > 0 ? 'right' : 'left';
      if (rowSafe(s, targetRow, here + inward)) return 'up';
    }
  }

  return null;
}

function soak(mode: Mode, seed: number, maxTicks: number): Tally {
  const s = createGame(mode, 1, seed);
  const tally = emptyTally();
  let ticks = 0;

  while (s.status !== 'over' && ticks < maxTicks) {
    step(s);
    ticks += 1;

    for (const ev of s.events) {
      if (ev.t === 'home') tally.homes += 1;
      else if (ev.t === 'squashed') tally.squashed += 1;
      else if (ev.t === 'drowned') tally.drowned += 1;
      else if (ev.t === 'timeout') tally.timeouts += 1;
      else if (ev.t === 'levelComplete') tally.levels += 1;
    }

    // About nine decisions a second, which is brisk but human.
    if (ticks % 7 === 0) {
      const dir = autopilot(s);
      if (dir) {
        hop(s, dir);
        tally.hops += 1;
        for (const ev of s.events) {
          if (ev.t === 'home') tally.homes += 1;
          else if (ev.t === 'squashed') tally.squashed += 1;
          else if (ev.t === 'drowned') tally.drowned += 1;
        }
      }
    }

    if (ticks % 61 === 0) {
      expect(s.frog.col >= -1 && s.frog.col <= COLS, 'the frog stays on the board');
      expect(s.frog.row >= ROW_HOMES && s.frog.row <= ROW_START, 'the frog stays in range');
      expect(s.lives >= 0, 'lives never go negative');
      expect(s.timeLeftMs >= 0, 'the clock never goes negative');
    }
  }

  return tally;
}

export function froggerEngineChecks(): void {
  section('frogger: every level is crossable, proved rather than sampled');
  {
    let worstClear = Infinity;
    let worstRide = Infinity;
    let checked = 0;

    for (const mode of MODES) {
      // Twenty levels is past where the speed multiplier stops climbing, so
      // this covers the hardest board the game can ever build.
      for (let level = 1; level <= 20; level++) {
        for (const lane of buildLanes(mode, level)) {
          checked += 1;
          if (lane.kind === 'road') {
            worstClear = Math.min(worstClear, clearWindow(lane.speed, lane.gap));
          } else {
            worstRide = Math.min(worstRide, rideWindow(lane.speed, lane.span));
          }
        }
      }
    }

    console.log(
      `windows   ${checked} lanes checked, tightest gap ${worstClear.toFixed(2)}s, ` +
        `shortest ride ${worstRide.toFixed(2)}s`,
    );
    check(worstClear >= MIN_CLEAR_S, `every road lane leaves at least ${MIN_CLEAR_S}s of gap`);
    check(worstRide >= MIN_RIDE_S, `every river lane offers at least ${MIN_RIDE_S}s of raft`);
  }

  section('frogger: the speed curve stops climbing');
  {
    check(speedMultiplier(1) === 1, 'level one runs at the authored speed');
    check(speedMultiplier(40) === speedMultiplier(200), 'the multiplier is capped, not unbounded');
    check(
      buildLanes('rush', 1)[0].speed > buildLanes('classic', 1)[0].speed,
      'Rush is genuinely faster than Classic',
    );
  }

  section('frogger: the opening board');
  for (const mode of MODES) {
    const s = createGame(mode, 1, 1);
    check(s.lives === MODE_META[mode].lives, `${mode} starts with its own life count`);
    check(s.frog.row === ROW_START, `${mode} starts the frog on the near bank`);
    check(s.homes.every((h) => !h), `${mode} starts with every bay empty`);
    check(s.lanes.length === BASE_LANES.length, `${mode} builds every lane`);
  }

  section('frogger: the first hop of a life is survivable');
  {
    // A car sitting on the column above the start cell makes the opening hop a
    // coin flip the player cannot read. This is the check that caught it.
    for (const mode of MODES) {
      const s = createGame(mode, 1, 1);
      const lane = laneAt(s, ROW_START - 1)!;
      const at = Math.floor(COLS / 2) + 0.5;
      check(!covers(lane, at), `${mode} opens with the cell above the frog clear`);
    }
  }

  section('frogger: filling every bay advances the level');
  {
    const s = createGame('gentle', 1, 31);
    while (s.status === 'ready') step(s);

    // Driven directly rather than played, because reaching five bays by hand
    // would make this a test of the autopilot instead of a test of the rule.
    for (let bay = 0; bay < HOME_COLS.length; bay++) {
      s.status = 'playing';
      s.frog.row = ROW_HOMES + 1;
      s.frog.col = HOME_COLS[bay];
      s.frog.carry = 0;
      hop(s, 'up');
    }

    check(s.homes.every(Boolean), 'all five bays fill');
    check(s.status === 'levelComplete', 'and the level ends');

    const level = s.level;
    nextLevel(s);
    check(s.level === level + 1, 'continuing moves to the next level');
    check(s.homes.every((h) => !h), 'and clears the bays again');
    check(s.frog.row === ROW_START, 'and puts the frog back on the near bank');
    check(
      s.lanes[0].speed > createGame('gentle', 1, 1).lanes[0].speed,
      'and the next level runs faster than the one before it',
    );
  }

  section('frogger: a bay already filled is not a second landing');
  {
    const s = createGame('gentle', 1, 37);
    while (s.status === 'ready') step(s);
    s.homes[0] = true;
    s.frog.row = ROW_HOMES + 1;
    s.frog.col = HOME_COLS[0];
    s.frog.carry = 0;
    const lives = s.lives;
    hop(s, 'up');
    check(s.lives === lives - 1, 'hopping into an occupied bay costs a life');
  }

  section('frogger: hopping');
  {
    const s = createGame('gentle', 1, 3);
    while (s.status === 'ready') step(s);

    const row = s.frog.row;
    hop(s, 'up');
    check(s.frog.row === row - 1, 'up moves one row toward the river');

    const col = s.frog.col;
    hop(s, 'left');
    check(s.frog.col === col - 1, 'left moves one column');

    // The board edge refuses rather than wrapping or clamping silently.
    const edge = createGame('gentle', 1, 3);
    while (edge.status === 'ready') step(edge);
    edge.frog.col = 0;
    hop(edge, 'left');
    check(
      edge.frog.col === 0 && edge.events.some((e) => e.t === 'blocked'),
      'the left edge is a wall, and says so',
    );

    const back = createGame('gentle', 1, 3);
    while (back.status === 'ready') step(back);
    hop(back, 'down');
    check(
      back.frog.row === ROW_START && back.events.some((e) => e.t === 'blocked'),
      'the near bank is the bottom of the board',
    );
  }

  section('frogger: forward progress scores once');
  {
    const s = createGame('classic', 1, 7);
    while (s.status === 'ready') step(s);

    hop(s, 'up');
    const gained = s.score;
    check(gained > 0, 'reaching a new row scores');

    hop(s, 'down');
    hop(s, 'up');
    check(s.score === gained, 'covering the same ground again does not score again');
  }

  section('frogger: the river drowns you and the road flattens you');
  {
    const water = createGame('gentle', 1, 11);
    while (water.status === 'ready') step(water);
    const lives = water.lives;

    // Put the frog in the river on a cell the lane's pattern is not covering.
    const lane = water.lanes.find((l) => l.kind === 'river')!;
    water.frog.row = lane.row;
    water.frog.carry = 0;
    for (let col = 0; col < COLS; col++) {
      if (!covers(lane, col + 0.5)) {
        water.frog.col = col;
        break;
      }
    }
    step(water);
    check(water.lives === lives - 1, 'standing on open water costs a life');

    const road = createGame('gentle', 1, 11);
    while (road.status === 'ready') step(road);
    const roadLane = road.lanes.find((l) => l.kind === 'road')!;
    road.frog.row = roadLane.row;
    road.frog.carry = 0;
    for (let col = 0; col < COLS; col++) {
      if (covers(roadLane, col + 0.5)) {
        road.frog.col = col;
        break;
      }
    }
    const roadLives = road.lives;
    step(road);
    check(road.lives === roadLives - 1, 'standing under a car costs a life');
  }

  section('frogger: a raft carries its passenger exactly');
  {
    const s = createGame('gentle', 1, 13);
    while (s.status === 'ready') step(s);

    const lane = s.lanes.find((l) => l.kind === 'river' && l.dir === 1)!;
    s.frog.row = lane.row;
    s.frog.carry = 0;
    // Centre of the pattern's covered stretch, so it stays aboard for a while.
    s.frog.col = Math.round(lane.phase + lane.span / 2 - 0.5);
    if (s.frog.col < 0) s.frog.col = 0;
    if (s.frog.col >= COLS) s.frog.col = COLS - 1;

    const before = s.frog.col + s.frog.carry;
    const ticks = 20;
    for (let i = 0; i < ticks; i++) if (s.status === 'playing') step(s);

    if (s.status === 'playing') {
      const moved = s.frog.col + s.frog.carry - before;
      const expected = lane.dir * lane.speed * (ticks * 0.016);
      check(
        Math.abs(moved - expected) < 0.02,
        'the frog drifts at exactly the lane speed, not near it',
      );
    } else {
      check(false, 'the frog stayed aboard long enough to measure the drift');
    }
  }

  section('frogger: the clock runs out');
  {
    const s = createGame('rush', 1, 17);
    while (s.status === 'ready') step(s);
    const lives = s.lives;

    s.timeLeftMs = 20;
    let guard = 0;
    while (s.lives === lives && guard < 400) {
      step(s);
      guard += 1;
    }
    check(s.lives === lives - 1, 'running the clock down costs a life');
  }

  section('frogger: pause stops the traffic');
  {
    const s = createGame('classic', 1, 19);
    while (s.status === 'ready') step(s);
    for (let i = 0; i < 60; i++) step(s);

    togglePause(s);
    const frozen = s.lanes.map((l) => l.phase.toFixed(5)).join('|');
    const clock = s.timeLeftMs;
    for (let i = 0; i < 60; i++) step(s);
    check(frozen === s.lanes.map((l) => l.phase.toFixed(5)).join('|'), 'lanes hold still');
    check(clock === s.timeLeftMs, 'and the clock holds with them');

    togglePause(s);
    for (let i = 0; i < 10; i++) step(s);
    check(frozen !== s.lanes.map((l) => l.phase.toFixed(5)).join('|'), 'and move again after');
  }

  section('frogger: the HUD quantizes its clock');
  {
    const s = createGame('classic', 1, 23);
    while (s.status === 'ready') step(s);
    const first = hudOf(s).secondsLeft;
    step(s);
    check(hudOf(s).secondsLeft === first, 'one tick does not move the displayed second');
    check(Number.isInteger(hudOf(s).secondsLeft), 'and what it shows is a whole second');
  }

  section('frogger: soak');
  {
    const total = emptyTally();
    for (const mode of MODES) {
      for (const seed of [3, 11, 29, 47]) {
        const t = soak(mode, seed, 60000);
        for (const key of Object.keys(total) as (keyof Tally)[]) total[key] += t[key];
      }
    }

    console.log(
      `soak      ${total.hops} hops, ${total.homes} frogs home, ${total.levels} levels cleared, ` +
        `${total.squashed} squashed, ${total.drowned} drowned, ${total.timeouts} timed out`,
    );

    check(total.hops > 0, 'the soak actually hopped');
    check(total.homes > 0, 'the soak actually got frogs home, so the far bank is reachable');
    check(
      total.squashed + total.drowned + total.timeouts > 0,
      'the soak actually died, so the hazards are live',
    );
  }
}
