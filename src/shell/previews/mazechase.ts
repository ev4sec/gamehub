import { stage } from './paint';
import { MAZECHASE } from './palette';
import type { PreviewSpec } from './driver';

/**
 * A fragment of corridor, the hero eating along it, and two ghosts closing from
 * either side. Eight cells wide is enough to read as a maze and few enough that
 * the dots are still dots at tile size.
 */

const PERIOD = 5000;
const CELL = 16;
const COLS = 10;
const LEFT = (160 - COLS * CELL) / 2;
const MID_Y = 45;

/** How far along the corridor the hero is, as a fraction of the loop. */
function heroX(t: number): number {
  return LEFT + ((t / PERIOD) * (COLS - 1) + 0.5) * CELL;
}

function wallBand(g: CanvasRenderingContext2D, y: number): void {
  g.fillStyle = MAZECHASE.wallShadow;
  g.fillRect(0, y, 160, CELL);
  g.fillStyle = MAZECHASE.wall;
  g.fillRect(0, y + 1.4, 160, CELL - 2.8);
}

function ghost(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  facing: number,
  points: number,
): void {
  const r = 6.2;
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y - r * 0.12, r, Math.PI, 0);
  g.lineTo(x + r, y + r * 0.75);
  for (let i = 0; i < points * 2; i++) {
    const k = 1 - (i + 1) / (points * 2);
    g.lineTo(x - r + 2 * r * k, y + r * (i % 2 === 0 ? 0.4 : 0.75));
  }
  g.closePath();
  g.fill();

  for (const side of [-1, 1]) {
    const ex = x + side * r * 0.33;
    const ey = y - r * 0.15;
    g.fillStyle = '#f8fafc';
    g.beginPath();
    g.arc(ex, ey, r * 0.3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1e3a8a';
    g.beginPath();
    g.arc(ex + facing * r * 0.13, ey, r * 0.15, 0, Math.PI * 2);
    g.fill();
  }
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    g.fillStyle = MAZECHASE.field;
    g.fillRect(0, 0, 160, 90);

    wallBand(g, MID_Y - CELL * 1.5);
    wallBand(g, MID_Y + CELL * 0.5);

    const hx = heroX(t);

    // Dots ahead of the hero only. The ones behind it have been eaten, which is
    // what makes the loop read as progress rather than as a shuttle.
    for (let i = 0; i < COLS; i++) {
      const x = LEFT + (i + 0.5) * CELL;
      if (x < hx + CELL * 0.4) continue;
      g.fillStyle = i === COLS - 2 ? MAZECHASE.pellet : MAZECHASE.dot;
      g.beginPath();
      g.arc(x, MID_Y, i === COLS - 2 ? 3.6 : 1.7, 0, Math.PI * 2);
      g.fill();
    }

    // Two ghosts, converging. The near one leads the hero, the far one follows.
    ghost(g, LEFT + COLS * CELL - 12 - ((t / PERIOD) * 26), MID_Y, MAZECHASE.blinky, -1, 3);
    ghost(g, hx - 30 - ((t / PERIOD) * 8), MID_Y, MAZECHASE.inky, 1, 4);

    const open = 0.42 * Math.abs(Math.sin(t / 90));
    g.save();
    g.translate(hx, MID_Y);
    g.fillStyle = MAZECHASE.hero;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, 6.6, open, Math.PI * 2 - open);
    g.closePath();
    g.fill();
    g.restore();
  });
}

export const mazechasePreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Hero mid-corridor with the pellet ahead and a ghost two cells out either side.
  stillMs: 2100,
};
