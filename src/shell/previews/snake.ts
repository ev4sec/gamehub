import { block, clamp, fillRound, stage } from './paint';
import { FIELD, SNAKE } from './palette';
import type { PreviewSpec } from './driver';

/** Cell size and origin, chosen so the circuit sits inside the safe crop area. */
const CELL = 10;
const ORIGIN_X = 20;
const ORIGIN_Y = 10;

const STEP_MS = 380;

/**
 * A closed twenty-cell circuit: the top edge, down the right, back along the
 * bottom, up the left. Closed on purpose, so the snake can walk it forever and
 * the loop closes exactly on a cell boundary.
 */
function circuit(): { c: number; r: number }[] {
  const path: { c: number; r: number }[] = [];
  for (let c = 2; c <= 8; c++) path.push({ c, r: 1 });
  for (let r = 2; r <= 5; r++) path.push({ c: 8, r });
  for (let c = 7; c >= 2; c--) path.push({ c, r: 5 });
  for (let r = 4; r >= 2; r--) path.push({ c: 2, r });
  return path;
}

const PATH = circuit();
const STEPS = PATH.length;
const PERIOD = STEPS * STEP_MS;

/** The two cells an apple appears on, in path order. */
const APPLES = [7, 15];

function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k, 0, 1)));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}

function cellX(c: number): number {
  return ORIGIN_X + c * CELL;
}

function cellY(r: number): number {
  return ORIGIN_Y + r * CELL;
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    const stepIndex = Math.floor(t / STEP_MS);
    const frac = (t % STEP_MS) / STEP_MS;
    const head = stepIndex % STEPS;

    // Grid dots, faint, so the field reads as a board rather than a void.
    g.fillStyle = FIELD.grid;
    for (let c = 0; c <= 11; c++) {
      for (let r = 0; r <= 6; r++) {
        g.fillRect(cellX(c) + CELL / 2 - 0.5, cellY(r) + CELL / 2 - 0.5, 1, 1);
      }
    }

    // Eaten apples lengthen the snake, and the length resets with the loop.
    const eaten = APPLES.filter((i) => head >= i).length;
    const length = 5 + eaten;

    /**
     * Each segment slides toward the cell in front of *it*, not in the
     * direction the head happens to be facing. Gliding the whole body by the
     * head's vector is the obvious version and it is wrong: at every corner the
     * tail is travelling along a different axis, so the body shears sideways
     * off its own track. This circuit turns four times in twenty cells, so that
     * mistake is visible almost continuously.
     */
    const segment = (i: number) => {
      const from = PATH[(head - i + STEPS * 2) % STEPS];
      const to = PATH[(head - i + 1 + STEPS * 2) % STEPS];
      return {
        x: cellX(from.c) + (cellX(to.c) - cellX(from.c)) * frac,
        y: cellY(from.r) + (cellY(to.r) - cellY(from.r)) * frac,
      };
    };

    const pending = APPLES.find((i) => head < i);
    if (pending !== undefined) {
      const cell = PATH[pending];
      g.fillStyle = SNAKE.apple;
      g.beginPath();
      g.arc(cellX(cell.c) + CELL / 2, cellY(cell.r) + CELL / 2, 3.2, 0, Math.PI * 2);
      g.fill();
    }

    // A ring pulse on the cell just eaten, for the 200ms after it happens.
    for (const index of APPLES) {
      const since = (head - index) * STEP_MS + t % STEP_MS;
      if (head < index || since > 200) continue;
      const k = since / 200;
      const cell = PATH[index];
      g.globalAlpha = 0.7 * (1 - k);
      g.strokeStyle = SNAKE.apple;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(cellX(cell.c) + CELL / 2, cellY(cell.r) + CELL / 2, 3.2 + k * 6, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }

    for (let i = length - 1; i >= 0; i--) {
      const pos = segment(i);
      const shade = mix(SNAKE.head, SNAKE.tail, i / Math.max(1, length - 1));
      block(g, pos.x + 1, pos.y + 1, CELL - 2, CELL - 2, shade, 2.5);
    }

    // A highlight on the head so the direction of travel is legible at a glance.
    const nose = segment(0);
    g.globalAlpha = 0.9;
    fillRound(g, nose.x + 3, nose.y + 3, CELL - 6, CELL - 6, 1.5, '#f0fdf4');
    g.globalAlpha = 1;
  });
}

export const snakePreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Mid-crawl along the top edge, with the first apple still ahead of it.
  stillMs: STEP_MS * 4.5,
};
