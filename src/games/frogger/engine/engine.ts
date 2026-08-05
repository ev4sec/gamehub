import {
  BUBBLE_MS,
  COLS,
  DIVE_MS,
  DT,
  HOME_COLS,
  HOP_TICKS,
  LEVEL_TICKS,
  MODE_META,
  POINTS_FORWARD,
  POINTS_HOME,
  POINTS_LEVEL,
  POINTS_PER_SECOND,
  READY_TICKS,
  ROW_HOMES,
  ROW_START,
  TICK_MS,
} from './constants';
import { buildLanes } from './lanes';
import type { Dir, GameState, Hud, Lane, Mode } from './types';

/**
 * Frogger's rules.
 *
 * The board is discrete and its occupants are one float per lane, so nothing
 * here iterates a list of vehicles. Whether a point is covered is a modulo test
 * against the lane's repeating pattern, which is exact at any speed and cannot
 * drift over a long run the way accumulated per-vehicle positions do.
 */

/** The pattern repeats every this many cells. */
function period(lane: Lane): number {
  return lane.span + lane.gap;
}

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

/**
 * Is `x`, in cell coordinates, sitting on an occupant of this lane?
 *
 * `phase` slides the whole pattern, so travelling left is the same computation
 * as travelling right with the sign folded into how phase advances.
 */
export function covers(lane: Lane, x: number): boolean {
  return wrap(x - lane.phase, period(lane)) < lane.span;
}

/** A diving lane is underwater for the last stretch of each cycle. */
export function submerged(lane: Lane, elapsedMs: number): boolean {
  if (!lane.diveCycleMs) return false;
  const at = wrap(elapsedMs + (lane.diveOffsetMs ?? 0), lane.diveCycleMs);
  return at >= lane.diveCycleMs - DIVE_MS;
}

/** True while the bubbles are up, which is the only warning a dive gets. */
export function aboutToDive(lane: Lane, elapsedMs: number): boolean {
  if (!lane.diveCycleMs) return false;
  const at = wrap(elapsedMs + (lane.diveOffsetMs ?? 0), lane.diveCycleMs);
  const dives = lane.diveCycleMs - DIVE_MS;
  return at >= dives - BUBBLE_MS && at < dives;
}

export function laneAt(s: GameState, row: number): Lane | undefined {
  return s.lanes.find((l) => l.row === row);
}

function resetFrog(s: GameState): void {
  s.frog.col = Math.floor(COLS / 2);
  s.frog.row = ROW_START;
  s.frog.carry = 0;
  s.frog.hopTicks = 0;
  s.frog.fromCol = s.frog.col;
  s.frog.fromRow = s.frog.row;
  s.bestRow = ROW_START;
  s.timeLeftMs = s.timeLimitMs;
}

export function createGame(mode: Mode, level = 1, seed = 1): GameState {
  const meta = MODE_META[mode];

  const s: GameState = {
    mode,
    status: 'ready',
    level,
    lanes: buildLanes(mode, level),
    frog: {
      col: Math.floor(COLS / 2),
      row: ROW_START,
      carry: 0,
      hopTicks: 0,
      fromCol: Math.floor(COLS / 2),
      fromRow: ROW_START,
    },
    homes: HOME_COLS.map(() => false),
    lives: meta.lives,
    score: 0,
    bestRow: ROW_START,
    timeLeftMs: meta.timeMs,
    timeLimitMs: meta.timeMs,
    holdTicks: READY_TICKS,
    elapsedMs: 0,
    rngState: seed,
    events: [],
  };

  return s;
}

function loseLife(s: GameState, how: 'squashed' | 'drowned' | 'timeout'): void {
  s.events.push({ t: how });
  s.lives -= 1;

  if (s.lives <= 0) {
    s.status = 'over';
    s.events.push({ t: 'over' });
    return;
  }

  resetFrog(s);
  s.status = 'ready';
  s.holdTicks = READY_TICKS;
}

/** Points for the seconds left on the clock, which rewards a decisive crossing. */
function homeBonus(s: GameState): number {
  return Math.floor(s.timeLeftMs / 1000) * POINTS_PER_SECOND;
}

function reachHome(s: GameState, bay: number): void {
  s.homes[bay] = true;
  const scale = MODE_META[s.mode].scoreScale;
  const points = Math.round((POINTS_HOME + homeBonus(s)) * scale);
  s.score += points;
  s.events.push({ t: 'home', bay, points });

  if (s.homes.every(Boolean)) {
    s.score += Math.round(POINTS_LEVEL * scale);
    s.status = 'levelComplete';
    s.holdTicks = LEVEL_TICKS;
    s.events.push({ t: 'levelComplete', level: s.level });
    return;
  }

  resetFrog(s);
  s.status = 'ready';
  s.holdTicks = READY_TICKS;
}

/**
 * Advances to the next level, keeping the score and lives. Called from the hold
 * countdown or by a player who has finished reading the tally.
 */
export function nextLevel(s: GameState): void {
  if (s.status !== 'levelComplete') return;

  s.level += 1;
  s.lanes = buildLanes(s.mode, s.level);
  s.homes = s.homes.map(() => false);
  resetFrog(s);
  s.status = 'ready';
  s.holdTicks = READY_TICKS;
}

export function hop(s: GameState, dir: Dir): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;

  const frog = s.frog;
  // The carry is resolved into the cell before the hop, so a frog that has
  // drifted most of a cell on a log lands where it looks like it is, not where
  // it started the ride.
  const fromCol = Math.round(frog.col + frog.carry);
  const fromRow = frog.row;

  let col = fromCol;
  let row = fromRow;
  if (dir === 'up') row -= 1;
  else if (dir === 'down') row += 1;
  else if (dir === 'left') col -= 1;
  else col += 1;

  if (col < 0 || col >= COLS || row > ROW_START || row < ROW_HOMES) {
    s.events.push({ t: 'blocked' });
    return;
  }

  frog.fromCol = fromCol;
  frog.fromRow = fromRow;
  frog.col = col;
  frog.row = row;
  frog.carry = 0;
  frog.hopTicks = HOP_TICKS;
  s.events.push({ t: 'hop' });

  if (row < s.bestRow) {
    s.score += Math.round(
      POINTS_FORWARD * (s.bestRow - row) * MODE_META[s.mode].scoreScale,
    );
    s.bestRow = row;
  }

  if (row === ROW_HOMES) {
    const bay = HOME_COLS.indexOf(col);
    // The far bank is a wall except at the bays. Landing between them is the
    // classic mistake and it has to cost, or the top row stops being a target.
    if (bay < 0 || s.homes[bay]) loseLife(s, 'drowned');
    else reachHome(s, bay);
    return;
  }

  // The hop is resolved against the world it landed in immediately rather than
  // next tick, so stepping into a car is a collision and not a near miss.
  settleRow(s);
}

/** Applies whatever the frog's current row does to it. */
function settleRow(s: GameState): void {
  if (s.status !== 'playing') return;

  const frog = s.frog;
  const lane = laneAt(s, frog.row);
  if (!lane) return;

  const at = frog.col + frog.carry + 0.5;

  if (lane.kind === 'road') {
    if (covers(lane, at)) loseLife(s, 'squashed');
    return;
  }

  const afloat = covers(lane, at) && !submerged(lane, s.elapsedMs);
  if (!afloat) loseLife(s, 'drowned');
}

export function step(s: GameState): void {
  s.events.length = 0;

  if (s.status === 'ready' || s.status === 'levelComplete') {
    s.holdTicks -= 1;
    if (s.holdTicks > 0) return;
    if (s.status === 'ready') s.status = 'playing';
    else nextLevel(s);
    return;
  }

  if (s.status !== 'playing') return;

  s.elapsedMs += TICK_MS;
  if (s.frog.hopTicks > 0) s.frog.hopTicks -= 1;

  for (const lane of s.lanes) {
    lane.phase = wrap(lane.phase + lane.dir * lane.speed * DT, period(lane));
  }

  const frog = s.frog;
  const lane = laneAt(s, frog.row);

  // Riding. The frog moves at exactly the lane's speed, which is why the ride
  // is a carry on the cell rather than a re-derived position: a log and its
  // passenger can never disagree about where they are.
  if (lane && lane.kind === 'river' && covers(lane, frog.col + frog.carry + 0.5)) {
    frog.carry += lane.dir * lane.speed * DT;
    while (frog.carry >= 0.5) {
      frog.col += 1;
      frog.carry -= 1;
    }
    while (frog.carry < -0.5) {
      frog.col -= 1;
      frog.carry += 1;
    }

    if (frog.col + frog.carry < -0.25 || frog.col + frog.carry > COLS - 0.75) {
      loseLife(s, 'drowned');
      return;
    }
  }

  settleRow(s);
  if (s.status !== 'playing') return;

  s.timeLeftMs -= TICK_MS;
  if (s.timeLeftMs <= 0) {
    s.timeLeftMs = 0;
    s.events.push({ t: 'timeout' });
    loseLife(s, 'timeout');
  }
}

export function togglePause(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'playing') s.status = 'paused';
  else if (s.status === 'paused') s.status = 'playing';
}

/** Ends the ready banner or the level tally early. */
export function skipHold(s: GameState): void {
  s.events.length = 0;
  if (s.status === 'ready') {
    s.status = 'playing';
    s.holdTicks = 0;
  } else if (s.status === 'levelComplete') {
    nextLevel(s);
  }
}

export function hudOf(s: GameState): Hud {
  return {
    mode: s.mode,
    status: s.status,
    level: s.level,
    score: s.score,
    lives: s.lives,
    homes: s.homes.slice(),
    // Quantized to whole seconds here rather than in the component. The HUD
    // signature is built from this, and a raw millisecond count would push a
    // React render every single tick.
    secondsLeft: Math.ceil(s.timeLeftMs / 1000),
    timeFraction: s.timeLimitMs === 0 ? 0 : s.timeLeftMs / s.timeLimitMs,
    row: s.frog.row,
  };
}
