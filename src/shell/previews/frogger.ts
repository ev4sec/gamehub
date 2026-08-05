import { easeOut, fillRound, stage } from './paint';
import { FROGGER } from './palette';
import type { PreviewSpec } from './driver';

/**
 * Three lanes of traffic, one lane of logs, and a frog working its way up
 * through them. Every lane is a scrolling pattern, which is the same idea the
 * real engine uses, arrived at here for the simpler reason that it makes a
 * seamless loop out of one modulo.
 */

const PERIOD = 6000;
const ROW_H = 18;

interface Band {
  y: number;
  kind: 'river' | 'road' | 'bank';
  dir: 1 | -1;
  speed: number;
  span: number;
  gap: number;
  color: string;
}

const BANDS: Band[] = [
  { y: 0, kind: 'river', dir: 1, speed: 14, span: 34, gap: 26, color: FROGGER.log },
  { y: ROW_H, kind: 'road', dir: -1, speed: 26, span: 16, gap: 34, color: FROGGER.cars[0] },
  { y: ROW_H * 2, kind: 'road', dir: 1, speed: 18, span: 22, gap: 40, color: FROGGER.cars[1] },
  { y: ROW_H * 3, kind: 'road', dir: -1, speed: 32, span: 16, gap: 46, color: FROGGER.cars[2] },
  { y: ROW_H * 4, kind: 'bank', dir: 1, speed: 0, span: 0, gap: 1, color: FROGGER.bank },
];

/** The frog's ladder: one hop a second, from the bank to the river and back. */
const HOP_MS = 1000;
const HOP_DRAW_MS = 140;
const LADDER = [4, 3, 3, 2, 1, 4];

function frogRow(t: number): { row: number; from: number; k: number } {
  const i = Math.floor(t / HOP_MS) % LADDER.length;
  const from = LADDER[(i - 1 + LADDER.length) % LADDER.length];
  const k = Math.min(1, (t % HOP_MS) / HOP_DRAW_MS);
  return { row: LADDER[i], from, k };
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    for (const band of BANDS) {
      g.fillStyle =
        band.kind === 'river'
          ? FROGGER.river
          : band.kind === 'road'
            ? FROGGER.road
            : FROGGER.bank;
      g.fillRect(0, band.y, 160, ROW_H);

      if (band.kind === 'bank') continue;

      const period = band.span + band.gap;
      const phase = ((band.dir * band.speed * t) / 1000) % period;

      for (let k = -1; k <= Math.ceil(160 / period) + 1; k++) {
        const x = phase + k * period;
        if (x > 170 || x + band.span < -10) continue;

        if (band.kind === 'river') {
          fillRound(g, x, band.y + 4, band.span, ROW_H - 8, 2, band.color);
          g.fillStyle = FROGGER.logGrain;
          g.fillRect(x + 2, band.y + ROW_H / 2 - 0.8, band.span - 4, 1.6);
        } else {
          fillRound(g, x, band.y + 4.5, band.span, ROW_H - 9, 1.8, band.color);
          g.fillStyle = 'rgba(15, 23, 42, 0.4)';
          g.fillRect(x + 3, band.y + 7, band.span - 6, 3.5);
        }
      }
    }

    // The five home bays across the top of the river band.
    g.strokeStyle = FROGGER.frog;
    g.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) g.strokeRect(6 + i * 31, 1.5, 18, 4);

    const { row, from, k } = frogRow(t);
    const y = ROW_H * (from + (row - from) * easeOut(k)) + ROW_H / 2;
    const lift = Math.sin(k * Math.PI) * 2.4;

    g.fillStyle = FROGGER.frog;
    g.strokeStyle = FROGGER.frogEdge;
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(80, y - lift, 5.2, 0, Math.PI * 2);
    g.fill();
    g.stroke();

    g.fillStyle = '#f8fafc';
    g.beginPath();
    g.arc(78, y - lift - 1.8, 1.1, 0, Math.PI * 2);
    g.arc(82, y - lift - 1.8, 1.1, 0, Math.PI * 2);
    g.fill();
  });
}

export const froggerPreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Frog on the middle road lane with a clear gap ahead of it.
  stillMs: 2400,
};
