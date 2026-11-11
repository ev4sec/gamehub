import { easeOut, fillRound, lerp, stage, STAGE_H, STAGE_W } from './paint';
import type { PreviewSpec } from './driver';

/**
 * A file of code as plain bars, with a highlight that moves from part to part
 * and names each one. That is the whole of what the game does, so it is the
 * whole of the picture.
 */

const YELLOW = '#fde047';
const HOLD = 2000;
const GLIDE = 240;

/** Each line as [length, indent], in fractions of the stage width. Null is a blank line. */
const LINES: ([number, number] | null)[] = [
  [0.34, 0],
  [0.28, 0],
  null,
  [0.46, 0],
  [0.4, 1],
  [0.52, 1],
  [0.3, 2],
  [0.36, 1],
  [0.22, 0],
];

// The top fifth of a tile is covered by its chips, so the file starts below them.
const TOP = 20;
const PITCH = (STAGE_H - TOP) / 9.7;
const BAR_H = PITCH * 0.36;
const LEFT = STAGE_W * 0.12;
const INDENT = STAGE_W * 0.05;

interface Stop {
  label: string;
  /** First and last line, counting from 0. */
  from: number;
  to: number;
  /** A token on the first line, as x fractions of the stage, instead of whole lines. */
  token?: [number, number];
}

const STOPS: Stop[] = [
  { label: 'IMPORT', from: 0, to: 1 },
  { label: 'FUNCTION', from: 3, to: 7 },
  { label: 'PARAMETER', from: 3, to: 3, token: [0.25, 0.4] },
];

function top(line: number): number {
  return TOP + PITCH * line;
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    const at = Math.floor(t / HOLD) % STOPS.length;
    const stop = STOPS[at];
    const prev = STOPS[(at + STOPS.length - 1) % STOPS.length];
    const k = easeOut(Math.min(1, (t % HOLD) / GLIDE));

    // The band glides from where the last part was to where this one is.
    const bandTop = lerp(top(prev.from), top(stop.from), k) - PITCH * 0.3;
    const bandBottom = lerp(top(prev.to), top(stop.to), k) + PITCH * 0.66;
    const bandLeft = STAGE_W * 0.09;

    g.fillStyle = 'rgba(253,224,71,0.10)';
    g.fillRect(bandLeft, bandTop, STAGE_W * 0.85, bandBottom - bandTop);
    g.fillStyle = YELLOW;
    g.fillRect(bandLeft, bandTop, 1.2, bandBottom - bandTop);

    LINES.forEach((line, i) => {
      if (!line) return;
      const y = top(i);
      g.fillStyle = 'rgba(100,116,139,0.6)';
      g.fillRect(STAGE_W * 0.05, y, 2, BAR_H);
      const lit = y >= bandTop && y <= bandBottom;
      fillRound(
        g,
        LEFT + line[1] * INDENT,
        y,
        line[0] * STAGE_W,
        BAR_H,
        BAR_H / 2,
        lit ? 'rgba(241,245,249,0.85)' : 'rgba(148,163,184,0.38)',
      );
    });

    if (stop.token && k > 0.5) {
      const [x0, x1] = stop.token;
      const y = top(stop.from);
      g.fillStyle = 'rgba(253,224,71,0.32)';
      g.fillRect(x0 * STAGE_W, y - 1.5, (x1 - x0) * STAGE_W, BAR_H + 3);
      g.fillStyle = YELLOW;
      g.fillRect(x0 * STAGE_W, y + BAR_H + 1, (x1 - x0) * STAGE_W, 0.8);
    }

    g.font = '700 5.5px ui-sans-serif, system-ui, sans-serif';
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    const textW = stop.label.length * 3.6 + 6;
    const pillRight = STAGE_W * 0.92;
    // Inside the band's lower corner, clear of the chips above it.
    const pillTop = bandBottom - 9.5;
    fillRound(g, pillRight - textW, pillTop, textW, 8, 4, YELLOW);
    g.fillStyle = '#020617';
    g.fillText(stop.label, pillRight - 3, pillTop + 4.2);
  });
}

export const codereaderPreview: PreviewSpec = {
  paint,
  periodMs: HOLD * STOPS.length,
  // Holds on the function, the stop that shows the most structure.
  stillMs: HOLD + 1000,
};
