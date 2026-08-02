/**
 * Tetris engine invariants.
 *
 * The soak is the cheap half. The valuable half is the hand-built boards below:
 * multi-row clears, SRS wall kicks, T-spin recognition and the lock-delay cap
 * are all places where an engine can look fine for thousands of random ticks
 * and still be wrong in the one situation a player actually sets up on purpose.
 */
import {
  createGame,
  ghostY,
  hudOf,
  queueAction,
  setHeld,
  step,
  togglePause,
} from '../../src/games/tetris/engine/engine';
import {
  BOARD_H,
  BOARD_W,
  KINDS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  SHAPES,
  SPRINT_LINES,
  TICK_MS,
  ULTRA_MS,
  gravityMsFor,
} from '../../src/games/tetris/engine/constants';
import type {
  Action,
  Cell,
  ClearEvent,
  GameState,
  Mode,
  PieceKind,
} from '../../src/games/tetris/engine/types';
import { rand } from '../../src/platform/rng';
import { expect } from '../checks';

function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_H }, () => Array<Cell>(BOARD_W).fill(null));
}

/** Fills a whole row apart from the listed columns. */
function fillRowExcept(s: GameState, y: number, gaps: number[]): void {
  for (let x = 0; x < BOARD_W; x++) {
    s.board[y][x] = gaps.includes(x) ? null : 'S';
  }
}

function clearEventOf(s: GameState): ClearEvent | undefined {
  return s.events.find((e): e is ClearEvent => e.t === 'clear');
}

function invariants(s: GameState, label: string): void {
  expect(s.board.length === BOARD_H, `${label}: board has ${s.board.length} rows`);
  for (let y = 0; y < s.board.length; y++) {
    expect(s.board[y].length === BOARD_W, `${label}: row ${y} is ${s.board[y].length} wide`);
    expect(
      !s.board[y].every((c) => c !== null),
      `${label}: a complete row survived at ${y}`,
    );
  }
}

/**
 * The current piece must never sit inside a filled cell or outside the well.
 *
 * Only while playing: a top-out is precisely the case where the spawned piece
 * does overlap the stack, and the engine keeps it there so the losing board can
 * be drawn.
 */
function pieceIsLegal(s: GameState, label: string): void {
  const p = s.current;
  if (!p || s.status !== 'playing') return;
  for (const [ox, oy] of SHAPES[p.kind][p.rot]) {
    const x = p.x + ox;
    const y = p.y + oy;
    expect(x >= 0 && x < BOARD_W, `${label}: piece column ${x} is outside the well`);
    expect(y < BOARD_H, `${label}: piece row ${y} is below the floor`);
    if (y >= 0 && y < BOARD_H && x >= 0 && x < BOARD_W) {
      expect(s.board[y][x] === null, `${label}: piece overlaps a filled cell at ${x},${y}`);
    }
  }
}

const ACTIONS: readonly Action[] = [
  'moveLeft',
  'moveRight',
  'rotateCW',
  'rotateCCW',
  'rotate180',
  'hardDrop',
  'hold',
];

/* ---------------------------------------------------------------------------
 * A placing AI, for the same reason snake's suite has one: random input tops
 * out in a few hundred ticks and never completes a row, so every path past the
 * lock (clears, combos, back-to-back, level-ups) goes unexecuted. This plays
 * well enough to reach them.
 * ------------------------------------------------------------------------ */

function fitsAt(board: Cell[][], kind: PieceKind, rot: number, x: number, y: number): boolean {
  for (const [ox, oy] of SHAPES[kind][rot]) {
    const cx = x + ox;
    const cy = y + oy;
    if (cx < 0 || cx >= BOARD_W || cy >= BOARD_H) return false;
    if (cy >= 0 && board[cy][cx] !== null) return false;
  }
  return true;
}

/** Where a piece dropped down this column would come to rest, if it fits. */
function landingY(board: Cell[][], kind: PieceKind, rot: number, x: number): number | null {
  let y = -4;
  if (!fitsAt(board, kind, rot, x, y)) return null;
  while (fitsAt(board, kind, rot, x, y + 1)) y += 1;
  return y;
}

function afterPlacing(
  board: Cell[][],
  kind: PieceKind,
  rot: number,
  x: number,
  y: number,
): { board: Cell[][]; lines: number } {
  const next = board.map((row) => [...row]);
  for (const [ox, oy] of SHAPES[kind][rot]) {
    const cy = y + oy;
    if (cy >= 0) next[cy][x + ox] = kind;
  }
  const kept = next.filter((row) => !row.every((c) => c !== null));
  const lines = BOARD_H - kept.length;
  while (kept.length < BOARD_H) kept.unshift(Array<Cell>(BOARD_W).fill(null));
  return { board: kept, lines };
}

/** The usual four-term stack heuristic: height, holes, bumpiness, lines. */
function heuristic(board: Cell[][], lines: number): number {
  const heights: number[] = [];
  let holes = 0;
  for (let x = 0; x < BOARD_W; x++) {
    let top = BOARD_H;
    for (let y = 0; y < BOARD_H; y++) {
      if (board[y][x] !== null) {
        top = y;
        break;
      }
    }
    heights.push(BOARD_H - top);
    for (let y = top + 1; y < BOARD_H; y++) {
      if (board[y][x] === null) holes += 1;
    }
  }
  const aggregate = heights.reduce((a, b) => a + b, 0);
  let bumpiness = 0;
  for (let i = 0; i + 1 < BOARD_W; i++) bumpiness += Math.abs(heights[i] - heights[i + 1]);

  return -0.510066 * aggregate + 0.760666 * lines - 0.35663 * holes - 0.184483 * bumpiness;
}

function bestPlacement(s: GameState): { rot: number; x: number } | null {
  const piece = s.current;
  if (!piece) return null;

  let best: { rot: number; x: number; score: number } | null = null;
  for (let rot = 0; rot < 4; rot++) {
    for (let x = -3; x <= BOARD_W; x++) {
      const y = landingY(s.board, piece.kind, rot, x);
      if (y === null) continue;
      const outcome = afterPlacing(s.board, piece.kind, rot, x, y);
      const score = heuristic(outcome.board, outcome.lines);
      if (!best || score > best.score) best = { rot, x, score };
    }
  }
  return best;
}

/**
 * Places one piece, in two ticks. The shift is queued after the rotation has
 * actually happened rather than alongside it, because a rotation that wall
 * kicks moves the piece sideways and the target column has to be measured from
 * where it ended up.
 */
function placeOnePiece(s: GameState): void {
  const target = bestPlacement(s);
  if (!target) {
    step(s);
    return;
  }

  const turns = ((target.rot - s.current!.rot) % 4 + 4) % 4;
  for (let i = 0; i < turns; i++) queueAction(s, 'rotateCW');
  step(s);

  if (s.status !== 'playing' || !s.current) return;

  const dx = target.x - s.current.x;
  const nudge: Action = dx < 0 ? 'moveLeft' : 'moveRight';
  for (let i = 0; i < Math.abs(dx); i++) queueAction(s, nudge);
  queueAction(s, 'hardDrop');
  step(s);
}

export function tetrisEngineChecks(): void {
  // 1. Random-input soak on every mode, with the board checked every tick.
  const modes: Mode[] = ['marathon', 'sprint', 'ultra'];
  for (const mode of modes) {
    let ticks = 0;
    let overs = 0;
    let clears = 0;
    let bestScore = 0;

    for (let run = 0; run < 12; run++) {
      const s = createGame(mode, 4242 + run * 9173);
      const holder = { rngState: 77 + run * 31 };
      let lastScore = 0;
      let lastLines = 0;

      for (let i = 0; i < 3000; i++) {
        const roll = rand(holder);
        if (roll < 0.18) queueAction(s, ACTIONS[Math.floor(rand(holder) * ACTIONS.length)]);
        setHeld(s, 'left', rand(holder) < 0.15);
        setHeld(s, 'right', rand(holder) < 0.15);
        setHeld(s, 'softDrop', rand(holder) < 0.25);

        step(s);
        ticks++;
        invariants(s, `${mode}:soak`);
        pieceIsLegal(s, `${mode}:soak`);

        expect(s.score >= lastScore, `${mode}: score went backwards`);
        expect(s.lines >= lastLines, `${mode}: line count went backwards`);
        lastScore = s.score;
        lastLines = s.lines;

        if (clearEventOf(s)) clears++;
        bestScore = Math.max(bestScore, s.score);
        if (s.status !== 'playing') {
          if (s.status === 'over') overs++;
          break;
        }
      }
    }
    console.log(
      `${mode.padEnd(9)} ${String(ticks).padStart(6)} ticks  ${String(overs).padStart(3)} top-outs  ` +
        `${String(clears).padStart(4)} clears  best score ${bestScore}`,
    );
  }

  // 1b. The same soak driven by a player that can actually stack, so the paths
  //     past the lock get executed instead of every run topping out first.
  {
    const tally: Record<string, number> = {};
    const bump = (k: string) => {
      tally[k] = (tally[k] ?? 0) + 1;
    };
    let bestScore = 0;
    let maxCombo = 0;
    let totalLines = 0;
    let placements = 0;

    for (const mode of modes) {
      for (let run = 0; run < 4; run++) {
        const s = createGame(mode, 8080 + run * 4441);
        for (let i = 0; i < 400 && s.status === 'playing'; i++) {
          placeOnePiece(s);
          placements += 1;
          invariants(s, `${mode}:ai`);
          pieceIsLegal(s, `${mode}:ai`);

          const clear = clearEventOf(s);
          if (clear) {
            bump(clear.name);
            if (clear.tspin !== 'none') bump(`tspin-${clear.tspin}`);
            if (clear.backToBack) bump('backToBack');
            maxCombo = Math.max(maxCombo, clear.combo);
          }
          for (const ev of s.events) {
            if (ev.t === 'levelUp') bump('levelUp');
          }
        }
        bestScore = Math.max(bestScore, s.score);
        totalLines += s.lines;
      }
    }

    console.log(
      `ai        ${placements} placements  ${totalLines} lines  best score ${bestScore}  ` +
        `longest combo ${maxCombo}`,
    );
    console.log('clears:   ' + JSON.stringify(tally));

    expect(totalLines > 100, `AI soak: only ${totalLines} lines cleared, the brain is not working`);
    expect((tally.levelUp ?? 0) > 0, 'AI soak: the level never went up');
    expect((tally.single ?? 0) > 0, 'AI soak: no single was ever cleared');
    expect(maxCombo >= 1, 'AI soak: never cleared on two consecutive pieces');
  }

  // 2. The randomiser is a real 7-bag: every aligned group of seven pieces
  //    contains each kind exactly once. A plain random picker passes a soak and
  //    fails this immediately.
  {
    const s = createGame('marathon', 31337);
    const order: PieceKind[] = [];
    for (let i = 0; i < 140; i++) {
      const kind = s.current?.kind;
      if (!kind) break;
      order.push(kind);
      queueAction(s, 'hardDrop');
      step(s);
      // Wiping the well keeps the run alive so the sequence can be sampled for
      // longer than a board's worth of pieces.
      s.board = emptyBoard();
      if (s.status !== 'playing') break;
    }

    expect(order.length >= 140, `bag test: only sampled ${order.length} pieces`);
    let bagsOk = true;
    for (let start = 0; start + 7 <= order.length; start += 7) {
      const group = new Set(order.slice(start, start + 7));
      if (group.size !== 7) bagsOk = false;
    }
    expect(bagsOk, 'bag test: a group of seven pieces was not one of each kind');
    console.log(`bag       ${order.length} pieces sampled, ${order.length / 7} complete bags`);
  }

  // 3. Rotating four times in open space is the identity.
  {
    for (const kind of KINDS) {
      const s = createGame('marathon', 11);
      s.board = emptyBoard();
      s.current = { kind, rot: 0, x: 3, y: 8 };
      const { x, y } = s.current;
      for (let i = 0; i < 4; i++) {
        queueAction(s, 'rotateCW');
        step(s);
      }
      expect(s.current!.rot === 0, `${kind}: four rotations did not return to rot 0`);
      expect(
        s.current!.x === x && s.current!.y === y,
        `${kind}: four rotations drifted to ${s.current!.x},${s.current!.y} from ${x},${y}`,
      );
    }
  }

  // 4. A vertical I flush with the left wall kicks clear of it rather than
  //    refusing to rotate. This is the offset table's sign convention under
  //    test: with y inverted it would kick into the floor instead.
  {
    const s = createGame('marathon', 12);
    s.board = emptyBoard();
    // rot 1 puts the bar in the box's third column, so x=-2 is column zero.
    s.current = { kind: 'I', rot: 1, x: -2, y: 8 };
    queueAction(s, 'rotateCW');
    step(s);
    expect(s.current!.rot === 2, 'wall kick: the I refused to rotate off the wall');
    expect(s.current!.x >= 0, `wall kick: the I stayed off-board at x=${s.current!.x}`);
    pieceIsLegal(s, 'wall kick');
  }

  // 5. A double clear removes both rows and drops everything above by two.
  //    Removing rows by splicing ascending indices passes a single and quietly
  //    fails here, because the first splice shifts the second row out from
  //    under the loop.
  {
    const s = createGame('marathon', 13);
    s.board = emptyBoard();
    fillRowExcept(s, 20, [0]);
    fillRowExcept(s, 21, [0]);
    s.board[19][5] = 'L';
    s.current = { kind: 'I', rot: 1, x: -2, y: 18 };

    queueAction(s, 'hardDrop');
    step(s);

    const ev = clearEventOf(s);
    expect(ev?.name === 'double', `double test: cleared '${ev?.name}' instead of a double`);
    expect(s.lines === 2, `double test: line count is ${s.lines}, expected 2`);
    expect(s.board.length === BOARD_H, `double test: board is now ${s.board.length} rows`);
    expect(s.board[21][5] === 'L', 'double test: the marker row did not fall two rows');
    expect(s.board[21][0] === 'I', 'double test: the I did not settle into the bottom row');
    expect(s.board[20][0] === 'I', 'double test: the I lost a cell on the way down');
  }

  // 6. A T rotated into a three-corner slot scores as a T-spin double, not as
  //    an ordinary double.
  {
    const s = createGame('marathon', 14);
    s.board = emptyBoard();
    fillRowExcept(s, 21, [2]);
    fillRowExcept(s, 20, [1, 2, 3]);
    // The overhang that gives the slot its third corner.
    s.board[19][3] = 'S';
    s.current = { kind: 'T', rot: 1, x: 1, y: 19 };

    queueAction(s, 'rotateCW');
    step(s);
    expect(s.current?.rot === 2, 'tspin test: the T did not rotate into the slot');

    queueAction(s, 'hardDrop');
    step(s);

    const ev = clearEventOf(s);
    expect(ev !== undefined, 'tspin test: nothing cleared');
    expect(ev?.tspin === 'full', `tspin test: graded '${ev?.tspin}', expected a full T-spin`);
    expect(ev?.name === 'double', `tspin test: cleared '${ev?.name}'`);
    // T-spin double at level one, first clear of the run: no combo, no chain.
    expect(ev?.points === 1200, `tspin test: scored ${ev?.points}, expected 1200`);
  }

  // 7. Hard drop lands exactly where the ghost says it will.
  {
    const s = createGame('marathon', 15);
    s.board = emptyBoard();
    // Gapped at the far column so the stack cannot complete a row and clear
    // itself out from under the piece being measured.
    fillRowExcept(s, 21, [9]);
    fillRowExcept(s, 20, [9]);
    s.current = { kind: 'O', rot: 0, x: 4, y: 0 };
    const landing = ghostY(s);

    queueAction(s, 'hardDrop');
    step(s);
    const drop = s.events.find((e) => e.t === 'hardDrop');
    expect(
      drop?.t === 'hardDrop' && drop.cells === landing,
      `ghost test: fell ${drop?.t === 'hardDrop' ? drop.cells : '?'} rows, ghost said ${landing}`,
    );
    expect(s.board[18][4] === 'O', 'ghost test: the O did not come to rest on the stack');
  }

  // 8. Hold swaps once per piece and refuses a second time until the next lock.
  {
    const s = createGame('marathon', 16);
    const first = s.current!.kind;
    queueAction(s, 'hold');
    step(s);
    expect(s.hold === first, `hold test: held ${s.hold}, expected ${first}`);
    const second = s.current!.kind;

    queueAction(s, 'hold');
    step(s);
    expect(s.hold === first, 'hold test: a second hold went through before a lock');
    expect(s.current!.kind === second, 'hold test: the piece changed on a refused hold');

    queueAction(s, 'hardDrop');
    step(s);
    const third = s.current!.kind;
    queueAction(s, 'hold');
    step(s);
    expect(s.hold === third, 'hold test: hold stayed locked out after a piece locked');
    expect(
      s.current!.kind === first,
      'hold test: the previously held piece did not come back out',
    );
  }

  // 9. A grounded piece does not lock on contact, and does lock once the delay
  //    is spent.
  {
    const s = createGame('marathon', 17);
    s.board = emptyBoard();
    s.current = { kind: 'O', rot: 0, x: 4, y: 20 };
    for (let i = 0; i < 5; i++) step(s);
    expect(s.pieces === 0, 'lock delay: the piece locked the moment it touched down');

    const budget = Math.ceil(LOCK_DELAY_MS / TICK_MS) + 4;
    for (let i = 0; i < budget && s.pieces === 0; i++) step(s);
    expect(s.pieces === 1, 'lock delay: the piece never locked');
  }

  // 10. Spinning on the spot cannot stall a piece forever. The O is the honest
  //     test: it rotates successfully every time without moving, so nothing but
  //     the reset cap can stop it.
  {
    const s = createGame('marathon', 18);
    s.board = emptyBoard();
    s.current = { kind: 'O', rot: 0, x: 4, y: 20 };
    let steps = 0;
    const ceiling = MAX_LOCK_RESETS * 4 + Math.ceil(LOCK_DELAY_MS / TICK_MS) + 40;
    while (s.pieces === 0 && steps < 400) {
      queueAction(s, 'rotateCW');
      step(s);
      steps++;
    }
    expect(s.pieces === 1, 'stall test: rotating on the spot postponed the lock forever');
    expect(steps <= ceiling, `stall test: took ${steps} ticks to lock, cap allows ${ceiling}`);
  }

  // 11. Sprint ends itself at forty lines.
  {
    const s = createGame('sprint', 19);
    s.board = emptyBoard();
    s.lines = SPRINT_LINES - 1;
    fillRowExcept(s, 21, [0]);
    s.current = { kind: 'I', rot: 1, x: -2, y: 18 };
    queueAction(s, 'hardDrop');
    step(s);
    expect(s.lines === SPRINT_LINES, `sprint test: finished on ${s.lines} lines`);
    expect(s.status === 'cleared', `sprint test: status is '${s.status}', expected 'cleared'`);
    expect(
      s.events.some((e) => e.t === 'cleared'),
      'sprint test: no cleared event was emitted',
    );
  }

  // 12. Ultra runs out of clock.
  {
    const s = createGame('ultra', 20);
    const needed = Math.ceil(ULTRA_MS / TICK_MS);
    for (let i = 0; i < needed && s.status === 'playing'; i++) step(s);
    expect(s.status === 'over', `ultra test: status is '${s.status}' after two minutes`);
    expect(s.timeLeftMs === 0, `ultra test: ${s.timeLeftMs}ms left on the clock`);
  }

  // 13. A well that cannot take another piece tops out rather than hanging.
  {
    const s = createGame('marathon', 21);
    s.board = emptyBoard();
    // Every row filled but one column, so nothing can ever clear.
    for (let y = 2; y < BOARD_H; y++) fillRowExcept(s, y, [0]);
    let steps = 0;
    while (s.status === 'playing' && steps < 2000) {
      queueAction(s, 'hardDrop');
      step(s);
      steps++;
    }
    expect(s.status === 'over', `top-out test: status is '${s.status}' on a full well`);
  }

  // 14. Gravity gets faster with level and never reaches zero.
  {
    let previous = Infinity;
    for (let level = 1; level <= 20; level++) {
      const ms = gravityMsFor(level);
      expect(ms > 0, `gravity: level ${level} has a non-positive interval`);
      expect(ms <= previous, `gravity: level ${level} is slower than level ${level - 1}`);
      previous = ms;
    }
    expect(gravityMsFor(1) > gravityMsFor(10), 'gravity: the curve is flat');
  }

  // 15. Pausing freezes the board and drops any keys that were down.
  {
    const s = createGame('marathon', 22);
    setHeld(s, 'left', true);
    togglePause(s);
    expect(s.status === 'paused', 'pause test: did not pause');
    expect(s.held.left === false, 'pause test: a held key survived the pause');

    const before = JSON.stringify(s.current);
    for (let i = 0; i < 120; i++) step(s);
    expect(JSON.stringify(s.current) === before, 'pause test: the piece moved while paused');
    expect(s.elapsedMs === 0, 'pause test: the clock ran while paused');

    togglePause(s);
    expect(s.status === 'playing', 'pause test: did not resume');
  }

  // 16. The HUD view matches the state it is built from.
  {
    const s = createGame('sprint', 23);
    const hud = hudOf(s);
    expect(hud.mode === 'sprint', 'hud: wrong mode');
    expect(hud.linesGoal === SPRINT_LINES, 'hud: sprint did not report its line goal');
    expect(hud.next.length === 3, `hud: ${hud.next.length} previews, expected 3`);
    expect(hud.hold === null, 'hud: something was already held on a fresh run');
  }
}
