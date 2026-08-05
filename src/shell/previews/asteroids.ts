import { stage } from './paint';
import { ASTEROIDS } from './palette';
import type { PreviewSpec } from './driver';

/**
 * A wire ship turning slowly, two rocks drifting and wrapping, one bullet on
 * its way. Everything wraps on the stage exactly as it does in the game, drawn
 * twice near a seam so a rock arrives rather than appearing.
 */

const PERIOD = 8000;
const W = 160;
const H = 90;

interface Drifter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  points: number[];
}

const ROCKS: Drifter[] = [
  {
    x: 30,
    y: 24,
    vx: 9,
    vy: 4,
    r: 13,
    points: [1, 0.82, 1.1, 0.9, 1.05, 0.78, 1.12, 0.88, 0.95],
  },
  {
    x: 118,
    y: 62,
    vx: -7,
    vy: -5,
    r: 8,
    points: [0.9, 1.1, 0.85, 1.05, 0.95, 1.12, 0.88],
  },
];

const SHIP_X = 78;
const SHIP_Y = 46;
const BULLET_FROM = 1200;
const BULLET_MS = 1400;

function wrap(v: number, span: number): number {
  return ((v % span) + span) % span;
}

/** Draws once per side of the seam the body overlaps, as the game does. */
function echo(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  draw: () => void,
): void {
  const xs = x < r ? [0, W] : x > W - r ? [0, -W] : [0];
  const ys = y < r ? [0, H] : y > H - r ? [0, -H] : [0];
  for (const dx of xs) {
    for (const dy of ys) {
      g.save();
      g.translate(x + dx, y + dy);
      draw();
      g.restore();
    }
  }
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    g.lineJoin = 'round';

    for (const rock of ROCKS) {
      const x = wrap(rock.x + (rock.vx * t) / 1000, W);
      const y = wrap(rock.y + (rock.vy * t) / 1000, H);
      const spin = (t / 1000) * 0.35;

      echo(g, x, y, rock.r, () => {
        g.rotate(spin);
        g.strokeStyle = ASTEROIDS.rock;
        g.lineWidth = 1.1;
        g.beginPath();
        rock.points.forEach((k, i) => {
          const a = (i / rock.points.length) * Math.PI * 2;
          const px = Math.cos(a) * rock.r * k;
          const py = Math.sin(a) * rock.r * k;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        });
        g.closePath();
        g.stroke();
      });
    }

    // A slow turn to the right, so the ship is plainly under someone's hand.
    const angle = -Math.PI / 2 + Math.sin(t / 1400) * 0.7;

    if (t >= BULLET_FROM && t < BULLET_FROM + BULLET_MS) {
      const k = (t - BULLET_FROM) / BULLET_MS;
      const fired = -Math.PI / 2 + Math.sin(BULLET_FROM / 1400) * 0.7;
      const bx = wrap(SHIP_X + Math.cos(fired) * (10 + k * 120), W);
      const by = wrap(SHIP_Y + Math.sin(fired) * (10 + k * 120), H);

      g.fillStyle = ASTEROIDS.bullet;
      echo(g, bx, by, 3, () => {
        g.beginPath();
        g.arc(0, 0, 1.6, 0, Math.PI * 2);
        g.fill();
      });
    }

    g.save();
    g.translate(SHIP_X, SHIP_Y);
    g.rotate(angle);
    g.strokeStyle = ASTEROIDS.ship;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(9, 0);
    g.lineTo(-6.5, -6);
    g.lineTo(-3.5, 0);
    g.lineTo(-6.5, 6);
    g.closePath();
    g.stroke();

    // Thrust only on the half of the loop where the ship is turning hardest,
    // so the flame reads as a decision rather than as a light left on.
    if (Math.cos(t / 1400) > 0.35) {
      g.strokeStyle = ASTEROIDS.thrust;
      g.beginPath();
      g.moveTo(-5, -2.6);
      g.lineTo(-11.5, 0);
      g.lineTo(-5, 2.6);
      g.stroke();
    }
    g.restore();
  });
}

export const asteroidsPreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // Ship turned up and to the right, bullet most of the way to the near rock.
  stillMs: 2300,
};
