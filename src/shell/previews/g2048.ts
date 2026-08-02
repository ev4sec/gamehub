import { easeOut, fillRound, lerp, stage } from './paint';
import { FIELD, TILES } from './palette';
import type { PreviewSpec } from './driver';

const SIZE = 4;
const CELL = 16;
const GAP = 2;
const BOARD = SIZE * CELL + (SIZE - 1) * GAP;
const ORIGIN_X = (160 - BOARD) / 2;
const ORIGIN_Y = (90 - BOARD) / 2;

const PERIOD = 5400;
const SLIDE_MS = 160;
const POP_MS = 200;

/** The two moves this loop plays, and when each one starts. */
const MOVE_A = 900;
const MOVE_B = 2700;

interface Tile {
  x: number;
  y: number;
  v: number;
}

interface Mover {
  from: [number, number];
  to: [number, number];
  v: number;
}

/** Opening board: a tidy top row, and a pair of 32s lined up to merge. */
const STATE_0: Tile[] = [
  { x: 0, y: 0, v: 2 }, { x: 1, y: 0, v: 4 }, { x: 2, y: 0, v: 8 }, { x: 3, y: 0, v: 16 },
  { x: 0, y: 1, v: 32 }, { x: 1, y: 1, v: 32 },
  { x: 0, y: 2, v: 64 },
  { x: 0, y: 3, v: 2 }, { x: 1, y: 3, v: 4 },
];

/** Left: the 32s become a 64, directly above the one already there. */
const A_MOVERS: Mover[] = [{ from: [1, 1], to: [0, 1], v: 32 }];
const STATE_1: Tile[] = [
  { x: 0, y: 0, v: 2 }, { x: 1, y: 0, v: 4 }, { x: 2, y: 0, v: 8 }, { x: 3, y: 0, v: 16 },
  { x: 0, y: 1, v: 64 },
  { x: 0, y: 2, v: 64 },
  { x: 0, y: 3, v: 2 }, { x: 1, y: 3, v: 4 },
];
const A_POPS: [number, number][] = [[0, 1]];

/** Up: the two 64s make the 128, and the loose 4s pair off alongside. */
const B_MOVERS: Mover[] = [
  { from: [0, 2], to: [0, 1], v: 64 },
  { from: [0, 3], to: [0, 2], v: 2 },
  { from: [1, 3], to: [1, 0], v: 4 },
];
const STATE_2: Tile[] = [
  { x: 0, y: 0, v: 2 }, { x: 1, y: 0, v: 8 }, { x: 2, y: 0, v: 8 }, { x: 3, y: 0, v: 16 },
  { x: 0, y: 1, v: 128 },
  { x: 0, y: 2, v: 2 },
];
const B_POPS: [number, number][] = [[0, 1], [1, 0]];

function px(x: number): number {
  return ORIGIN_X + x * (CELL + GAP);
}

function py(y: number): number {
  return ORIGIN_Y + y * (CELL + GAP);
}

function drawTile(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: number,
  scale = 1,
): void {
  const style = TILES[v] ?? { bg: '#f8fafc', fg: '#0f172a' };
  const inset = (CELL * (1 - scale)) / 2;

  fillRound(g, x + inset, y + inset, CELL * scale, CELL * scale, 2.5, style.bg);

  g.fillStyle = style.fg;
  g.font = `700 ${v >= 100 ? 6 : 7.5}px system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(v), x + CELL / 2, y + CELL / 2 + 0.5);
}

/** Tiles that hold still through a move, given the movers that do not. */
function stationary(state: Tile[], movers: Mover[]): Tile[] {
  return state.filter((t) => !movers.some((m) => m.from[0] === t.x && m.from[1] === t.y));
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    fillRound(g, ORIGIN_X - 3, ORIGIN_Y - 3, BOARD + 6, BOARD + 6, 4, '#0f172a');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        fillRound(g, px(x), py(y), CELL, CELL, 2.5, FIELD.panel);
      }
    }

    const phase = (start: number) => (t - start) / SLIDE_MS;

    const sliding = (start: number, state: Tile[], movers: Mover[]) => {
      const k = easeOut(phase(start));
      for (const tile of stationary(state, movers)) {
        drawTile(g, px(tile.x), py(tile.y), tile.v);
      }
      for (const m of movers) {
        drawTile(
          g,
          lerp(px(m.from[0]), px(m.to[0]), k),
          lerp(py(m.from[1]), py(m.to[1]), k),
          m.v,
        );
      }
    };

    const resting = (state: Tile[], pops: [number, number][], since: number) => {
      for (const tile of state) {
        const popped = pops.some(([x, y]) => x === tile.x && y === tile.y);
        const k = popped ? Math.min(1, since / POP_MS) : 1;
        // A short overshoot on anything that just merged, matching the game.
        const scale = popped ? 1 + 0.16 * Math.sin(k * Math.PI) : 1;
        drawTile(g, px(tile.x), py(tile.y), tile.v, scale);
      }
    };

    if (t < MOVE_A) {
      resting(STATE_0, [], Infinity);
    } else if (t < MOVE_A + SLIDE_MS) {
      sliding(MOVE_A, STATE_0, A_MOVERS);
    } else if (t < MOVE_B) {
      resting(STATE_1, A_POPS, t - MOVE_A - SLIDE_MS);
    } else if (t < MOVE_B + SLIDE_MS) {
      sliding(MOVE_B, STATE_1, B_MOVERS);
    } else {
      resting(STATE_2, B_POPS, t - MOVE_B - SLIDE_MS);
    }
  });
}

export const game2048Preview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // The finished board, with the 128 it just made.
  stillMs: 4200,
};
