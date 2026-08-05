import {
  DELTA,
  DOT_POINTS,
  DT,
  DYING_TICKS,
  EATEN_SPEED,
  EXTRA_LIFE_POINTS,
  FRIGHTENED_SPEED,
  GHOST_NAMES,
  GHOST_POINTS,
  GHOST_RELEASE,
  GHOST_SPEED,
  GHOST_START,
  LEVEL_TICKS,
  MODE_META,
  OPPOSITE,
  PAC_SPEED,
  PELLET_POINTS,
  PHASES,
  READY_TICKS,
  TICK_MS,
  TUNNEL_SPEED,
  TURN_BUFFER_TICKS,
  frightTicksFor,
  paceFor,
} from './constants';
import { canEnter, chooseGhostDir } from './ghosts';
import {
  MAZE_H,
  PEN_DOOR,
  TUNNEL_ROW,
  PEN_INSIDE,
  PLAYER_START,
  countDots,
  freshGrid,
  wrapX,
} from './maze';
import type { Actor, Dir, GameState, Ghost, Hud, Mode } from './types';

/**
 * The maze chase's rules.
 *
 * An actor is a tile plus a fraction along its current direction, and a
 * direction is chosen only when a tile is reached. Everything else follows from
 * that: eating is a tile test, wall legality is a tile test, and the four
 * ghosts think eight times a second each rather than sixty.
 */

function makeActor(x: number, y: number, dir: Dir): Actor {
  return { tx: x, ty: y, dir, next: null, offset: 0 };
}

function makeGhosts(): Ghost[] {
  return GHOST_NAMES.map((name) => ({
    ...makeActor(GHOST_START[name].x, GHOST_START[name].y, name === 'blinky' ? 'left' : 'up'),
    name,
    mode: 'scatter' as const,
    frightTicks: 0,
    penned: GHOST_START[name].penned,
    releaseIn: GHOST_RELEASE[name],
  }));
}

/**
 * Turns an actor around, mid-corridor if need be.
 *
 * The tile has to move with the direction, and that is the whole subtlety.
 * An actor on tile 16 heading left with an offset of 0.1 is a tenth of the way
 * toward tile 15. Reversed, it is nine tenths of the way from tile 15 back to
 * tile 16, which means its tile is now 15. Flipping only the direction and the
 * offset leaves it claiming to be nine tenths of the way to tile 17, and if
 * tile 17 is a wall it walks straight into it on the next tick. That is exactly
 * how a mode change used to put a ghost inside the pen wall.
 */
function reverseActor(actor: Actor): void {
  if (actor.offset === 0) {
    actor.dir = OPPOSITE[actor.dir];
    return;
  }
  const d = DELTA[actor.dir];
  actor.tx = wrapX(actor.tx + d.x);
  actor.ty += d.y;
  actor.dir = OPPOSITE[actor.dir];
  actor.offset = 1 - actor.offset;
}

/** Where an actor actually is, in tile units, including its part-way offset. */
export function positionOf(actor: Actor): { x: number; y: number } {
  const d = DELTA[actor.dir];
  return { x: actor.tx + d.x * actor.offset, y: actor.ty + d.y * actor.offset };
}

export function createGame(mode: Mode, level = 1, seed = 1): GameState {
  const grid = freshGrid();

  return {
    mode,
    status: 'ready',
    level,
    grid,
    pac: makeActor(PLAYER_START.x, PLAYER_START.y, 'left'),
    ghosts: makeGhosts(),
    dotsLeft: countDots(grid),
    lives: MODE_META[mode].lives,
    score: 0,
    towardExtra: 0,
    chain: 0,
    phase: 0,
    phaseTicks: PHASES[0].ticks,
    frightTicks: 0,
    turnTicks: 0,
    holdTicks: READY_TICKS,
    elapsedMs: 0,
    rngState: seed,
    events: [],
  };
}

function addScore(s: GameState, points: number): void {
  s.score += points;
  s.towardExtra += points;
  while (s.towardExtra >= EXTRA_LIFE_POINTS) {
    s.towardExtra -= EXTRA_LIFE_POINTS;
    s.lives += 1;
    s.events.push({ t: 'extraLife' });
  }
}

/** The scatter or chase the schedule is currently on. */
function phaseMode(s: GameState): 'scatter' | 'chase' {
  return s.phase >= PHASES.length ? 'chase' : PHASES[s.phase].mode;
}

function canPacGo(s: GameState, dir: Dir): boolean {
  return canEnter(s.grid, s.pac.tx, s.pac.ty, dir, false);
}

/**
 * Queues a turn. A reversal is applied on the spot, because a player who has
 * changed their mind about a corridor should not have to reach the next tile to
 * act on it; anything else waits for a tile that allows it.
 */
export function setDir(s: GameState, dir: Dir): void {
  s.events.length = 0;
  if (s.status !== 'playing') return;

  const pac = s.pac;
  if (dir === OPPOSITE[pac.dir]) {
    reverseActor(pac);
    // Reversing consumes the buffer: whatever was queued was for the old
    // heading and firing it later would be a turn the player has forgotten.
    pac.next = null;
    return;
  }

  pac.next = dir;
  s.turnTicks = TURN_BUFFER_TICKS;
  if (pac.offset === 0) applyQueuedTurn(s);
}

function applyQueuedTurn(s: GameState): void {
  const pac = s.pac;
  if (!pac.next) return;
  if (!canPacGo(s, pac.next)) return;
  pac.dir = pac.next;
  pac.next = null;
}

function eatAt(s: GameState, x: number, y: number): void {
  const cell = s.grid[y]?.[x];
  if (cell === 'dot') {
    s.grid[y][x] = 'open';
    s.dotsLeft -= 1;
    addScore(s, DOT_POINTS);
    s.events.push({ t: 'dot' });
    return;
  }
  if (cell === 'pellet') {
    s.grid[y][x] = 'open';
    s.dotsLeft -= 1;
    addScore(s, PELLET_POINTS);
    s.events.push({ t: 'pellet' });
    frighten(s);
  }
}

function frighten(s: GameState): void {
  const ticks = frightTicksFor(s.mode, s.level);
  s.frightTicks = ticks;
  s.chain = 0;

  for (const ghost of s.ghosts) {
    if (ghost.mode === 'eaten') continue;
    ghost.mode = 'frightened';
    ghost.frightTicks = ticks;
    // Every ghost visibly turns around. It is the clearest signal in the game
    // that the board has changed hands.
    reverseActor(ghost);
  }
}

function movePac(s: GameState): void {
  const pac = s.pac;
  const speed = PAC_SPEED * paceFor(s.mode, s.level);

  if (s.turnTicks > 0) {
    s.turnTicks -= 1;
    if (s.turnTicks === 0) pac.next = null;
  }

  if (pac.offset === 0) applyQueuedTurn(s);
  if (!canPacGo(s, pac.dir)) {
    pac.offset = 0;
    return;
  }

  pac.offset += speed * DT;

  while (pac.offset >= 1) {
    const d = DELTA[pac.dir];
    pac.tx = wrapX(pac.tx + d.x);
    pac.ty += d.y;
    pac.offset -= 1;

    eatAt(s, pac.tx, pac.ty);
    applyQueuedTurn(s);

    if (!canPacGo(s, pac.dir)) {
      pac.offset = 0;
      break;
    }
  }
}

function ghostSpeed(s: GameState, ghost: Ghost): number {
  if (ghost.mode === 'eaten') return EATEN_SPEED;
  const pace = paceFor(s.mode, s.level);
  if (ghost.ty === TUNNEL_ROW) return TUNNEL_SPEED * pace;
  if (ghost.mode === 'frightened') return FRIGHTENED_SPEED * pace;
  return GHOST_SPEED * pace;
}

/** Everything a ghost decides, decided exactly once, on arriving at a tile. */
function onGhostArrive(s: GameState, ghost: Ghost): void {
  if (ghost.mode === 'eaten') {
    // In the shaft above the pen, on the way home. The column test is not
    // optional: without it, any eaten ghost that happened to be low in the maze
    // decided it had arrived and marked itself penned in open corridor, and
    // then followed the pen's exit script from entirely the wrong place.
    const inShaft =
      ghost.tx === PEN_DOOR.x && ghost.ty >= PEN_DOOR.y && ghost.ty <= PEN_INSIDE.y;

    if (inShaft) {
      if (ghost.ty === PEN_INSIDE.y) {
        ghost.mode = phaseMode(s);
        ghost.penned = true;
        ghost.releaseIn = 60;
        ghost.dir = 'up';
        ghost.offset = 0;
        return;
      }
      ghost.dir = 'down';
      return;
    }

    ghost.dir = chooseGhostDir(s, ghost);
    return;
  }

  if (ghost.penned) {
    // The scripted way out: line up with the door, then walk up through it.
    if (ghost.tx !== PEN_INSIDE.x) {
      ghost.dir = ghost.tx < PEN_INSIDE.x ? 'right' : 'left';
      return;
    }
    if (ghost.ty > PEN_DOOR.y) {
      ghost.dir = 'up';
      return;
    }
    ghost.penned = false;
    ghost.mode = phaseMode(s);
    // Chosen rather than assumed. Out of the door the corridor may run either
    // way, and picking a fixed direction is how a ghost ends up in a wall.
    ghost.dir = chooseGhostDir(s, ghost);
    return;
  }

  ghost.dir = chooseGhostDir(s, ghost);
}

function moveGhost(s: GameState, ghost: Ghost): void {
  if (ghost.penned && ghost.releaseIn > 0) {
    ghost.releaseIn -= 1;
    return;
  }

  ghost.offset += ghostSpeed(s, ghost) * DT;

  let guard = 0;
  while (ghost.offset >= 1 && guard < 8) {
    guard += 1;
    const d = DELTA[ghost.dir];
    ghost.tx = wrapX(ghost.tx + d.x);
    ghost.ty += d.y;
    ghost.offset -= 1;

    // A ghost forced off the board vertically would be a maze bug, not a rule.
    if (ghost.ty < 0) ghost.ty = 0;
    if (ghost.ty >= MAZE_H) ghost.ty = MAZE_H - 1;

    onGhostArrive(s, ghost);
  }
}

function separation(a: Actor, b: Actor): number {
  const pa = positionOf(a);
  const pb = positionOf(b);
  // The tunnel wraps, so the horizontal gap has to be measured the short way.
  let dx = pa.x - pb.x;
  if (dx > 14) dx -= 28;
  else if (dx < -14) dx += 28;
  return Math.hypot(dx, pa.y - pb.y);
}

function loseLife(s: GameState): void {
  s.status = 'dying';
  s.holdTicks = DYING_TICKS;
  s.events.push({ t: 'eaten' });
}

function resetPositions(s: GameState): void {
  s.pac = makeActor(PLAYER_START.x, PLAYER_START.y, 'left');
  s.ghosts = makeGhosts();
  s.chain = 0;
  s.frightTicks = 0;
  s.phase = 0;
  s.phaseTicks = PHASES[0].ticks;
  s.turnTicks = 0;
}

function resolveContact(s: GameState): void {
  for (const ghost of s.ghosts) {
    if (ghost.mode === 'eaten') continue;
    if (ghost.penned) continue;
    if (separation(s.pac, ghost) > 0.55) continue;

    if (ghost.mode === 'frightened') {
      const points = GHOST_POINTS[Math.min(s.chain, GHOST_POINTS.length - 1)];
      s.chain += 1;
      addScore(s, points);
      s.events.push({ t: 'ghost', points, chain: s.chain });
      ghost.mode = 'eaten';
      ghost.frightTicks = 0;
      continue;
    }

    loseLife(s);
    return;
  }
}

function advancePhases(s: GameState): void {
  if (s.frightTicks > 0) {
    // The schedule is suspended while the board is frightened, exactly as the
    // cabinet does it: fright is a pause in the pattern, not an overlay on it.
    s.frightTicks -= 1;

    for (const ghost of s.ghosts) {
      if (ghost.mode !== 'frightened') continue;
      ghost.frightTicks -= 1;
      if (ghost.frightTicks <= 0) ghost.mode = phaseMode(s);
    }

    if (s.frightTicks === 0) {
      for (const ghost of s.ghosts) {
        if (ghost.mode === 'frightened') ghost.mode = phaseMode(s);
      }
      s.chain = 0;
    }
    return;
  }

  if (s.phase >= PHASES.length) return;

  s.phaseTicks -= 1;
  if (s.phaseTicks > 0) return;

  s.phase += 1;
  s.phaseTicks = s.phase < PHASES.length ? PHASES[s.phase].ticks : 0;

  const next = phaseMode(s);
  for (const ghost of s.ghosts) {
    if (ghost.mode === 'eaten' || ghost.penned) continue;
    ghost.mode = next;
    // Every mode change turns the ghosts around. It is the only thing that
    // ever does, and it is what makes a scatter feel like the pressure lifting.
    reverseActor(ghost);
  }
}

export function nextLevel(s: GameState): void {
  if (s.status !== 'levelComplete') return;
  s.level += 1;
  s.grid = freshGrid();
  s.dotsLeft = countDots(s.grid);
  resetPositions(s);
  s.status = 'ready';
  s.holdTicks = READY_TICKS;
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

  if (s.status === 'dying') {
    s.holdTicks -= 1;
    if (s.holdTicks > 0) return;

    s.lives -= 1;
    if (s.lives <= 0) {
      s.status = 'over';
      s.events.push({ t: 'over' });
      return;
    }
    resetPositions(s);
    s.status = 'ready';
    s.holdTicks = READY_TICKS;
    return;
  }

  if (s.status !== 'playing') return;

  s.elapsedMs += TICK_MS;

  advancePhases(s);
  movePac(s);
  // Contact is checked twice, once either side of the ghosts moving. Checking
  // only afterwards lets a ghost and the player swap tiles in one tick and pass
  // straight through each other, which is a bug players notice immediately.
  resolveContact(s);
  if (s.status !== 'playing') return;

  for (const ghost of s.ghosts) moveGhost(s, ghost);
  resolveContact(s);
  if (s.status !== 'playing') return;

  if (s.dotsLeft === 0) {
    s.status = 'levelComplete';
    s.holdTicks = LEVEL_TICKS;
    s.events.push({ t: 'levelComplete', level: s.level });
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
  } else if (s.status === 'levelComplete') {
    nextLevel(s);
  }
}

export function hudOf(s: GameState): Hud {
  const frightening = s.frightTicks > 0;
  const total = frightTicksFor(s.mode, s.level);

  return {
    mode: s.mode,
    status: s.status,
    level: s.level,
    score: s.score,
    lives: s.lives,
    dotsLeft: s.dotsLeft,
    ghostMode: frightening ? 'frightened' : phaseMode(s),
    // Quantized here, not in the component. The HUD signature is built from
    // this, and a raw tick count would push a render sixty times a second.
    frightSeconds: Math.ceil(s.frightTicks / 62),
    frightFraction: total === 0 ? 0 : s.frightTicks / total,
  };
}
