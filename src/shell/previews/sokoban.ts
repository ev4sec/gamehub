import { easeOut, fillRound, lerp, stage } from './paint';
import { SOKOBAN } from './palette';
import type { PreviewSpec } from './driver';

const COLS = 7;
const ROWS = 5;
const CELL = 12;
const ORIGIN_X = (160 - COLS * CELL) / 2;
const ORIGIN_Y = (90 - ROWS * CELL) / 2;

const MOVE_MS = 700;
type Step = [number, number];

/**
 * Ten moves: round to the first crate, push it home, then walk across and do
 * the same to the second. Ten moves at 700ms is exactly the loop period, so the
 * warehouse resets on the beat.
 */
const MOVES: Step[] = [
  [0, -1], [1, 0], [1, 0], [1, 0],
  [0, 1], [-1, 0], [-1, 0], [0, 1],
  [1, 0], [1, 0],
];
const PERIOD = MOVES.length * MOVE_MS;

const GOALS: [number, number][] = [
  [5, 1],
  [5, 3],
];
const START_PLAYER: [number, number] = [1, 2];
const START_CRATES: [number, number][] = [
  [3, 1],
  [3, 3],
];

interface Snapshot {
  player: [number, number];
  crates: [number, number][];
}

/**
 * Replays the script up to `count` moves. Cheap enough to run every frame, and
 * it keeps the painter a pure function of time with no state to drift.
 */
function replay(count: number): Snapshot {
  const player: [number, number] = [...START_PLAYER];
  const crates = START_CRATES.map((c) => [...c] as [number, number]);

  for (let i = 0; i < count; i++) {
    const [dx, dy] = MOVES[i];
    const nx = player[0] + dx;
    const ny = player[1] + dy;
    const crate = crates.find((c) => c[0] === nx && c[1] === ny);
    if (crate) {
      crate[0] += dx;
      crate[1] += dy;
    }
    player[0] = nx;
    player[1] = ny;
  }

  return { player, crates };
}

function onGoal(x: number, y: number): boolean {
  return GOALS.some(([gx, gy]) => gx === x && gy === y);
}

function px(x: number): number {
  return ORIGIN_X + x * CELL;
}

function py(y: number): number {
  return ORIGIN_Y + y * CELL;
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    const index = Math.min(MOVES.length - 1, Math.floor(t / MOVE_MS));
    const k = easeOut((t % MOVE_MS) / (MOVE_MS * 0.62));

    const before = replay(index);
    const after = replay(index + 1);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const wall = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
        if (wall) fillRound(g, px(x) + 0.5, py(y) + 0.5, CELL - 1, CELL - 1, 1.5, SOKOBAN.wall);
      }
    }

    // Goal rings stay emerald: in the real board that colour means "goal",
    // not "Sokoban", so recolouring it here would misreport the game.
    g.strokeStyle = SOKOBAN.goal;
    g.globalAlpha = 0.7;
    g.lineWidth = 1;
    for (const [gx, gy] of GOALS) {
      g.beginPath();
      g.arc(px(gx) + CELL / 2, py(gy) + CELL / 2, 2.6, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;

    before.crates.forEach((crate, i) => {
      const target = after.crates[i];
      const x = lerp(px(crate[0]), px(target[0]), k);
      const y = lerp(py(crate[1]), py(target[1]), k);
      const home = onGoal(target[0], target[1]) && k > 0.75;

      // A crate seating on its marker gets a small settle, which is the beat
      // the whole loop is built around.
      const settle = home ? 1 + 0.12 * Math.sin(Math.min(1, (k - 0.75) / 0.25) * Math.PI) : 1;
      const s = (CELL - 2) * settle;
      const inset = (CELL - s) / 2;

      fillRound(g, x + inset, y + inset, s, s, 1.5, home ? SOKOBAN.home : SOKOBAN.crate);
      g.strokeStyle = home ? SOKOBAN.homeEdge : SOKOBAN.crateEdge;
      g.lineWidth = 0.8;
      g.strokeRect(x + inset + 0.4, y + inset + 0.4, s - 0.8, s - 0.8);
    });

    const x = lerp(px(before.player[0]), px(after.player[0]), k) + CELL / 2;
    const y = lerp(py(before.player[1]), py(after.player[1]), k) + CELL / 2;
    g.fillStyle = SOKOBAN.player;
    g.beginPath();
    g.arc(x, y, 3.6, 0, Math.PI * 2);
    g.fill();
  });
}

export const sokobanPreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // One crate already seated, the player lined up behind the second.
  stillMs: MOVE_MS * 8.5,
};
