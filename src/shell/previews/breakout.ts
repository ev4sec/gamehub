import { block, clamp, fillRound, stage, triangle } from './paint';
import { BREAKOUT } from './palette';
import type { PreviewSpec } from './driver';

const LEFT = 32;
const RIGHT = 128;
const TOP = 9;
const BOTTOM = 81;

const COLS = 8;
const ROWS = 3;
const BRICK_W = 11;
const BRICK_H = 5;
const BRICK_GAP = 1;
const WALL_X = LEFT + 0.5;
const WALL_Y = 13;

const PERIOD = 8000;
/**
 * The ball's path is two triangle waves rather than a simulation. Both periods
 * divide the loop exactly, so the ball returns to its start with no bookkeeping
 * and the whole painter stays a pure function of elapsed time.
 */
const X_PERIOD = 4000;
const Y_PERIOD = 1600;

const BALL_R = 1.8;
const PADDLE_W = 20;
const PADDLE_Y = 76;

/** Bricks are taken out on the beats where the ball is up at the wall. */
const BREAKS: { at: number; c: number; r: number }[] = [
  { at: 1600, c: 6, r: 0 },
  { at: 3200, c: 3, r: 0 },
  { at: 4800, c: 3, r: 1 },
  { at: 6400, c: 5, r: 1 },
];
const BREAK_MS = 180;

function ballX(t: number): number {
  return triangle(t, X_PERIOD, LEFT + 4, RIGHT - 4);
}

function ballY(t: number): number {
  return triangle(t, Y_PERIOD, WALL_Y + ROWS * (BRICK_H + BRICK_GAP) + 2, PADDLE_Y - 3);
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const gone = BREAKS.find((b) => b.c === c && b.r === r && t >= b.at);
        let scale = 1;
        if (gone) {
          const since = t - gone.at;
          if (since >= BREAK_MS) continue;
          scale = 1 - since / BREAK_MS;
        }
        const x = WALL_X + c * (BRICK_W + BRICK_GAP);
        const y = WALL_Y + r * (BRICK_H + BRICK_GAP);
        const inset = (1 - scale) / 2;
        g.globalAlpha = scale;
        block(
          g,
          x + BRICK_W * inset,
          y + BRICK_H * inset,
          BRICK_W * scale,
          BRICK_H * scale,
          BREAKOUT.rows[r],
          1.2,
        );
        g.globalAlpha = 1;
      }
    }

    // A short trail, so a small dot on a large tile still reads as travelling.
    for (let i = 3; i >= 1; i--) {
      g.globalAlpha = 0.1 * i;
      g.fillStyle = BREAKOUT.ball;
      g.beginPath();
      g.arc(ballX(t - i * 45), ballY(t - i * 45), BALL_R * (1 - i * 0.12), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    g.fillStyle = BREAKOUT.ball;
    g.beginPath();
    g.arc(ballX(t), ballY(t), BALL_R, 0, Math.PI * 2);
    g.fill();

    // The paddle trails the ball rather than tracking it exactly, so it reads
    // as being played rather than as a machine.
    const px = clamp(ballX(t - 150), LEFT + PADDLE_W / 2, RIGHT - PADDLE_W / 2);
    fillRound(g, px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, 2.5, 1.2, BREAKOUT.paddle);

    g.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(LEFT, TOP);
    g.lineTo(LEFT, BOTTOM);
    g.moveTo(RIGHT, TOP);
    g.lineTo(RIGHT, BOTTOM);
    g.stroke();
  });
}

export const breakoutPreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Wall part cleared, ball mid-flight with its trail, paddle chasing it.
  stillMs: 5200,
};
