import { check, expect, section } from '../checks';
import {
  DELTA,
  GHOST_NAMES,
  GHOST_POINTS,
  MODES,
  MODE_META,
  OPPOSITE,
} from '../../src/games/mazechase/engine/constants';
import {
  MAZE,
  MAZE_H,
  MAZE_W,
  PLAYER_START,
  TUNNEL_ROW,
  freshGrid,
  isWall,
  wrapX,
} from '../../src/games/mazechase/engine/maze';
import { canEnter, chooseGhostDir } from '../../src/games/mazechase/engine/ghosts';
import {
  createGame,
  hudOf,
  positionOf,
  setDir,
  step,
  togglePause,
} from '../../src/games/mazechase/engine/engine';
import type { Dir, GameState, Mode } from '../../src/games/mazechase/engine/types';

/**
 * The maze chase's engine, in plain node.
 *
 * The provable check comes first, in Sokoban's spirit: flood fill the maze and
 * assert every dot can be reached. An authored maze with one dot walled off is
 * a level that can never be finished, and the alternative to proving it here is
 * a player discovering it after twenty minutes of play.
 */

/** Every tile reachable from the player's start, walking as the player walks. */
function reachable(): boolean[][] {
  const grid = freshGrid();
  const seen: boolean[][] = Array.from({ length: MAZE_H }, () =>
    Array.from({ length: MAZE_W }, () => false),
  );

  const queue = [{ x: PLAYER_START.x, y: PLAYER_START.y }];
  seen[PLAYER_START.y][PLAYER_START.x] = true;

  while (queue.length > 0) {
    const at = queue.shift()!;
    for (const dir of ['up', 'down', 'left', 'right'] as Dir[]) {
      if (!canEnter(grid, at.x, at.y, dir, false)) continue;
      const d = DELTA[dir];
      const nx = wrapX(at.x + d.x);
      const ny = at.y + d.y;
      if (ny < 0 || ny >= MAZE_H || seen[ny][nx]) continue;
      seen[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  return seen;
}

/** Tiles a hunting ghost is close enough to that walking in is suicide. */
function dangerMap(s: GameState): boolean[][] {
  const danger: boolean[][] = Array.from({ length: MAZE_H }, () =>
    Array.from({ length: MAZE_W }, () => false),
  );

  for (const ghost of s.ghosts) {
    if (ghost.mode === 'frightened' || ghost.mode === 'eaten' || ghost.penned) continue;
    for (let y = 0; y < MAZE_H; y++) {
      for (let x = 0; x < MAZE_W; x++) {
        let dx = Math.abs(x - ghost.tx);
        if (dx > MAZE_W / 2) dx = MAZE_W - dx;
        if (Math.hypot(dx, y - ghost.ty) <= 3) danger[y][x] = true;
      }
    }
  }

  return danger;
}

/**
 * The direction that takes the player one step toward the nearest dot.
 *
 * It routes around hunting ghosts, and falls back to ignoring them when there
 * is no safe path. A driver that walked straight at the nearest dot regardless
 * died every few seconds, which made the soak a test of respawning rather than
 * a test of playing the game.
 */
function towardNearestDot(s: GameState, avoid: boolean): Dir | null {
  const danger = avoid ? dangerMap(s) : null;
  const from = { x: s.pac.tx, y: s.pac.ty };
  const seen: (Dir | null)[][] = Array.from({ length: MAZE_H }, () =>
    Array.from({ length: MAZE_W }, () => null as Dir | null),
  );
  const visited: boolean[][] = Array.from({ length: MAZE_H }, () =>
    Array.from({ length: MAZE_W }, () => false),
  );

  const queue = [from];
  visited[from.y][from.x] = true;

  while (queue.length > 0) {
    const at = queue.shift()!;
    const cell = s.grid[at.y][at.x];
    if ((cell === 'dot' || cell === 'pellet') && !(at.x === from.x && at.y === from.y)) {
      return seen[at.y][at.x];
    }

    for (const dir of ['up', 'left', 'down', 'right'] as Dir[]) {
      if (!canEnter(s.grid, at.x, at.y, dir, false)) continue;
      const d = DELTA[dir];
      const nx = wrapX(at.x + d.x);
      const ny = at.y + d.y;
      if (ny < 0 || ny >= MAZE_H || visited[ny][nx]) continue;
      if (danger?.[ny][nx]) continue;
      visited[ny][nx] = true;
      // The first step of the path is what the player actually needs.
      seen[ny][nx] = at.x === from.x && at.y === from.y ? dir : seen[at.y][at.x];
      queue.push({ x: nx, y: ny });
    }
  }

  return null;
}

function driveTowardDots(s: GameState): Dir | null {
  return towardNearestDot(s, true) ?? towardNearestDot(s, false);
}

interface Tally {
  dots: number;
  pellets: number;
  ghosts: number;
  deaths: number;
  levels: number;
}

function emptyTally(): Tally {
  return { dots: 0, pellets: 0, ghosts: 0, deaths: 0, levels: 0 };
}

function soak(mode: Mode, seed: number, maxTicks: number): Tally {
  const s = createGame(mode, 1, seed);
  const tally = emptyTally();
  const previousDir = new Map<string, Dir>();
  const previousMode = new Map<string, string>();
  let ticks = 0;

  for (const g of s.ghosts) {
    previousDir.set(g.name, g.dir);
    previousMode.set(g.name, g.mode);
  }

  while (s.status !== 'over' && ticks < maxTicks) {
    if (s.status === 'playing') {
      const dir = driveTowardDots(s);
      if (dir) setDir(s, dir);
    }

    step(s);
    ticks += 1;

    for (const ev of s.events) {
      if (ev.t === 'dot') tally.dots += 1;
      else if (ev.t === 'pellet') tally.pellets += 1;
      else if (ev.t === 'ghost') tally.ghosts += 1;
      else if (ev.t === 'eaten') tally.deaths += 1;
      else if (ev.t === 'levelComplete') tally.levels += 1;
    }

    for (const ghost of s.ghosts) {
      expect(ghost.offset >= 0 && ghost.offset < 1, `${mode}: a ghost's offset stays in range`);
      expect(
        !isWall(s.grid, ghost.tx, ghost.ty),
        `${mode}: a ghost never stands inside a wall`,
      );

      previousDir.set(ghost.name, ghost.dir);
      previousMode.set(ghost.name, ghost.mode);
    }

    expect(s.pac.offset >= 0 && s.pac.offset < 1, `${mode}: the player's offset stays in range`);
    expect(!isWall(s.grid, s.pac.tx, s.pac.ty), `${mode}: the player never enters a wall`);
    expect(s.dotsLeft >= 0, `${mode}: the dot count never goes negative`);
  }

  return tally;
}

export function mazechaseEngineChecks(): void {
  section('mazechase: the maze itself');
  {
    check(MAZE.length === MAZE_H, `the maze is ${MAZE_H} rows`);
    check(
      MAZE.every((row) => row.length === MAZE_W),
      `and every row is ${MAZE_W} wide`,
    );

    const grid = freshGrid();
    let dots = 0;
    let pellets = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell === 'dot') dots += 1;
        if (cell === 'pellet') pellets += 1;
      }
    }
    console.log(`maze      ${dots} dots and ${pellets} power pellets`);
    check(dots > 100, 'the maze is actually full of dots');
    check(pellets === 4, 'and carries exactly four power pellets');
  }

  section('mazechase: every dot can be reached, proved rather than sampled');
  {
    const seen = reachable();
    const grid = freshGrid();
    let stranded = 0;
    let orphanOpen = 0;

    for (let y = 0; y < MAZE_H; y++) {
      for (let x = 0; x < MAZE_W; x++) {
        const cell = grid[y][x];
        if ((cell === 'dot' || cell === 'pellet') && !seen[y][x]) stranded += 1;

        // An open tile with no open neighbour is a hole in the maze rather
        // than a corridor, and it means a typo in the authored rows.
        if (cell === 'open' || cell === 'dot' || cell === 'pellet') {
          const neighbours = (['up', 'down', 'left', 'right'] as Dir[]).filter((dir) =>
            canEnter(grid, x, y, dir, true),
          );
          if (neighbours.length === 0) orphanOpen += 1;
        }
      }
    }

    check(stranded === 0, `every dot is reachable from the start (${stranded} stranded)`);
    check(orphanOpen === 0, `no walkable tile is sealed off (${orphanOpen} found)`);
  }

  section('mazechase: the tunnel wraps');
  {
    const grid = freshGrid();
    check(!isWall(grid, 0, TUNNEL_ROW), 'the left mouth of the tunnel is open');
    check(!isWall(grid, MAZE_W - 1, TUNNEL_ROW), 'and so is the right one');
    check(
      canEnter(grid, 0, TUNNEL_ROW, 'left', false),
      'walking off the left edge is allowed',
    );
    check(wrapX(-1) === MAZE_W - 1, 'and it comes out on the far side');

    const s = createGame('classic', 1, 1);
    while (s.status === 'ready') step(s);
    s.pac.tx = 1;
    s.pac.ty = TUNNEL_ROW;
    s.pac.offset = 0;
    setDir(s, 'left');
    // Run a fixed stretch rather than looping on a position: the player starts
    // two tiles from the mouth, so a "keep going while x > 2" loop never runs
    // at all and the assertion after it would be checking the start tile.
    for (let i = 0; i < 40; i++) step(s);
    check(s.pac.tx > MAZE_W - 5, 'and the player really does come out the other side');
  }

  section('mazechase: a ghost never turns around on its own');
  {
    // Asserted against the decision function directly rather than inferred from
    // a soak. A mode change reverses a ghost and moves its tile in the same
    // breath, so watching a run tick by tick cannot tell a real reversal from
    // one the rules performed, and a check that cannot tell is worse than none.
    const s = createGame('classic', 1, 1);
    while (s.status === 'ready') step(s);

    const ghost = s.ghosts.find((g) => !g.penned)!;
    let tested = 0;
    let deadEnds = 0;
    let violations = 0;

    for (let y = 1; y < MAZE_H - 1; y++) {
      for (let x = 0; x < MAZE_W; x++) {
        if (isWall(s.grid, x, y)) continue;
        for (const dir of ['up', 'down', 'left', 'right'] as Dir[]) {
          ghost.tx = x;
          ghost.ty = y;
          ghost.dir = dir;
          ghost.offset = 0;

          for (const mode of ['scatter', 'chase'] as const) {
            ghost.mode = mode;
            const chosen = chooseGhostDir(s, ghost);
            tested += 1;

            if (chosen !== OPPOSITE[dir]) continue;
            const alternatives = (['up', 'down', 'left', 'right'] as Dir[]).filter(
              (d) => d !== OPPOSITE[dir] && canEnter(s.grid, x, y, d, true),
            );
            if (alternatives.length === 0) deadEnds += 1;
            else violations += 1;
          }
        }
      }
    }

    console.log(`turns     ${tested} decisions checked, ${deadEnds} forced by a dead end`);
    check(violations === 0, `a ghost only ever reverses at a dead end (${violations} did not)`);
    check(tested > 1000, 'and the check actually covered the maze');
  }

  section('mazechase: the four ghosts are four minds');
  {
    const s = createGame('classic', 1, 1);
    check(s.ghosts.length === 4, 'there are four of them');
    check(
      GHOST_NAMES.every((name) => s.ghosts.some((g) => g.name === name)),
      'and they are the four expected ones',
    );
    check(
      s.ghosts.filter((g) => g.penned).length === 3,
      'three start in the pen and one starts outside it',
    );
  }

  section('mazechase: eating');
  {
    const s = createGame('classic', 1, 3);
    while (s.status === 'ready') step(s);

    const before = s.dotsLeft;
    let guard = 0;
    while (s.dotsLeft === before && guard < 400) {
      const dir = driveTowardDots(s);
      if (dir) setDir(s, dir);
      step(s);
      guard += 1;
    }
    check(s.dotsLeft < before, 'moving over a dot eats it');
    check(s.score > 0, 'and scores for it');
  }

  section('mazechase: a pellet turns the board over');
  {
    const s = createGame('gentle', 1, 5);
    while (s.status === 'ready') step(s);

    // Placed on the pellet directly. Walking to one would be a test of the
    // pathfinder rather than of the rule.
    s.pac.tx = 1;
    s.pac.ty = 2;
    s.pac.offset = 0;
    s.grid[3][1] = 'pellet';
    s.pac.dir = 'down';
    setDir(s, 'down');

    let guard = 0;
    while (hudOf(s).ghostMode !== 'frightened' && guard < 60) {
      step(s);
      guard += 1;
    }
    check(hudOf(s).ghostMode === 'frightened', 'a pellet frightens the board');
    check(hudOf(s).frightSeconds > 0, 'and puts a countdown on it');
    check(
      s.ghosts.every((g) => g.mode === 'frightened' || g.mode === 'eaten'),
      'every ghost that was hunting is now running',
    );

    // The chain: 200, then 400, then 800, then 1600, within one pellet.
    const scoreBefore = s.score;
    const target = s.ghosts.find((g) => g.mode === 'frightened' && !g.penned)!;
    target.tx = s.pac.tx;
    target.ty = s.pac.ty;
    target.offset = 0;
    target.penned = false;
    step(s);
    check(s.score >= scoreBefore + GHOST_POINTS[0], 'catching a frightened ghost scores 200');
    check(target.mode === 'eaten', 'and sends it home as eyes');
  }

  section('mazechase: fright runs out');
  {
    const s = createGame('rush', 1, 7);
    while (s.status === 'ready') step(s);
    s.grid[s.pac.ty][s.pac.tx] = 'pellet';
    s.pac.offset = 0;
    setDir(s, s.pac.dir);
    let guard = 0;
    while (hudOf(s).ghostMode !== 'frightened' && guard < 200) {
      step(s);
      guard += 1;
    }

    guard = 0;
    while (hudOf(s).ghostMode === 'frightened' && guard < 2000) {
      step(s);
      guard += 1;
    }
    check(guard < 2000, 'fright ends rather than lasting forever');
    check(
      s.ghosts.every((g) => g.mode !== 'frightened'),
      'and every ghost goes back to hunting',
    );
  }

  section('mazechase: being caught');
  {
    const s = createGame('classic', 1, 11);
    while (s.status === 'ready') step(s);
    const lives = s.lives;

    const hunter = s.ghosts.find((g) => !g.penned)!;
    hunter.tx = s.pac.tx;
    hunter.ty = s.pac.ty;
    hunter.offset = 0;
    hunter.mode = 'chase';
    step(s);
    check(s.status === 'dying', 'walking into a hunting ghost is fatal');

    let guard = 0;
    while (s.status === 'dying' && guard < 200) {
      step(s);
      guard += 1;
    }
    check(s.lives === lives - 1, 'and it costs a life');
    check(s.status === 'ready', 'then the board resets for another try');
    check(s.pac.tx === PLAYER_START.x && s.pac.ty === PLAYER_START.y, 'from the start tile');
  }

  section('mazechase: clearing the board');
  {
    const s = createGame('gentle', 1, 13);
    while (s.status === 'ready') step(s);

    // Driven directly. Eating two hundred dots by hand would be a test of the
    // pathfinder, and the rule being checked is what happens at zero.
    for (let y = 0; y < MAZE_H; y++) {
      for (let x = 0; x < MAZE_W; x++) {
        if (s.grid[y][x] === 'dot' || s.grid[y][x] === 'pellet') s.grid[y][x] = 'open';
      }
    }
    s.dotsLeft = 0;
    step(s);
    check(s.status === 'levelComplete', 'the last dot ends the level');

    const level = s.level;
    let guard = 0;
    while (s.status === 'levelComplete' && guard < 400) {
      step(s);
      guard += 1;
    }
    check(s.level === level + 1, 'and the next level begins');
    check(s.dotsLeft > 100, 'with the dots put back');
  }

  section('mazechase: pause stops the chase');
  {
    const s = createGame('classic', 1, 17);
    while (s.status === 'ready') step(s);
    for (let i = 0; i < 60; i++) step(s);

    togglePause(s);
    const frozen = s.ghosts.map((g) => JSON.stringify(positionOf(g))).join('|');
    for (let i = 0; i < 60; i++) step(s);
    check(
      frozen === s.ghosts.map((g) => JSON.stringify(positionOf(g))).join('|'),
      'the ghosts hold still',
    );

    togglePause(s);
    for (let i = 0; i < 20; i++) step(s);
    check(
      frozen !== s.ghosts.map((g) => JSON.stringify(positionOf(g))).join('|'),
      'and start again when resumed',
    );
  }

  section('mazechase: the opening board');
  for (const mode of MODES) {
    const s = createGame(mode, 1, 1);
    check(s.lives === MODE_META[mode].lives, `${mode} starts with its own life count`);
    check(s.status === 'ready', `${mode} opens on its banner`);
    check(hudOf(s).frightSeconds === 0, `${mode} starts with nothing frightened`);
  }

  section('mazechase: soak');
  {
    const total = emptyTally();
    for (const mode of MODES) {
      for (const seed of [3, 11, 29]) {
        const t = soak(mode, seed, 45000);
        for (const key of Object.keys(total) as (keyof Tally)[]) total[key] += t[key];
      }
    }

    console.log(
      `soak      ${total.dots} dots, ${total.pellets} pellets, ${total.ghosts} ghosts eaten, ` +
        `${total.deaths} deaths, ${total.levels} levels cleared`,
    );

    check(total.dots > 500, `the soak ate ${total.dots} dots, so it played rather than died`);
    check(total.pellets > 0, 'the soak actually took power pellets');
    check(total.ghosts > 0, 'the soak actually caught frightened ghosts');
    check(total.deaths > 0, 'the soak actually got caught, so the ghosts are live');
  }
}
