import {
  BATTERY_HALF_W,
  BLAST_GROW,
  BLAST_LIFE,
  CITY_HALF_W,
  FIELD_H,
  FIELD_W,
  GROUND_Y,
} from './engine/constants';
import { fitWorld, sizeCanvas, toWorld } from '../../platform/canvas';
import type { GameState } from './engine/types';

/**
 * A floor for the backing size. A hidden element and jsdom both report a zero
 * bounding rect, and without this the canvas is sized 0x0 and every draw
 * silently does nothing. Breakout carries the same guard for the same reason.
 */
const MIN_WIDTH_PX = 200;

/** City silhouettes, as fractions of the city's half width and height. */
const SKYLINE: [number, number, number][] = [
  [-0.9, 0.42, 0.55],
  [-0.36, 0.34, 0.95],
  [0.06, 0.3, 0.7],
  [0.5, 0.4, 1],
];

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  resize(): void {
    const size = sizeCanvas(this.canvas, {
      minCssWidth: MIN_WIDTH_PX,
      minCssHeight: MIN_WIDTH_PX * (FIELD_H / FIELD_W),
    });
    const fit = fitWorld(size, FIELD_W, FIELD_H);
    this.scale = fit.scale;
    this.offsetX = fit.offsetX;
    this.offsetY = fit.offsetY;
  }

  draw(s: GameState, reticle: { x: number; y: number } | null): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.sky(ctx);
    this.ground(ctx, s);
    this.trails(ctx, s);
    this.bombers(ctx, s);
    this.blasts(ctx, s);
    if (reticle) this.reticle(ctx, reticle);

    ctx.restore();
  }

  private sky(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0b1120');
    grad.addColorStop(1, '#111c33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD_W, GROUND_Y);
  }

  private ground(ctx: CanvasRenderingContext2D, s: GameState): void {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, GROUND_Y, FIELD_W, FIELD_H - GROUND_Y);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, GROUND_Y, FIELD_W, 3);

    for (const city of s.cities) {
      // A destroyed city leaves rubble rather than nothing. An empty patch of
      // ground reads as "nothing was ever here", which loses the whole point.
      if (!city.alive) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(city.x - CITY_HALF_W * 0.7, GROUND_Y - 5, CITY_HALF_W * 1.4, 5);
        continue;
      }

      ctx.fillStyle = '#7dd3fc';
      for (const [cx, w, h] of SKYLINE) {
        const bw = w * CITY_HALF_W;
        const bh = h * 22;
        ctx.fillRect(city.x + cx * CITY_HALF_W, GROUND_Y - bh, bw, bh);
      }
    }

    for (const battery of s.batteries) {
      if (!battery.alive) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(battery.x - BATTERY_HALF_W * 0.6, GROUND_Y - 6, BATTERY_HALF_W * 1.2, 6);
        continue;
      }

      ctx.fillStyle = battery.ammo > 0 ? '#fb923c' : '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(battery.x - BATTERY_HALF_W, GROUND_Y);
      ctx.lineTo(battery.x, GROUND_Y - 30);
      ctx.lineTo(battery.x + BATTERY_HALF_W, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Ammo as a stack of pips on the emplacement. The HUD carries the number,
      // but during a wave the player is looking here, not there.
      ctx.fillStyle = '#fed7aa';
      for (let i = 0; i < battery.ammo; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        ctx.fillRect(battery.x - 14 + col * 6, GROUND_Y - 10 - row * 6, 4, 4);
      }
    }
  }

  private trails(ctx: CanvasRenderingContext2D, s: GameState): void {
    ctx.lineWidth = 2;

    for (const t of s.threats) {
      ctx.strokeStyle = t.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(t.sx, t.sy);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = t.kind === 'smart' ? '#ffffff' : t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.kind === 'missile' ? 3 : 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    for (const m of s.interceptors) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.beginPath();
      ctx.moveTo(m.sx, m.sy);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // The target cross stays up for the whole flight, so a player can fire
      // three shots in a second and still see where each of them is going.
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.beginPath();
      ctx.moveTo(m.tx - 5, m.ty);
      ctx.lineTo(m.tx + 5, m.ty);
      ctx.moveTo(m.tx, m.ty - 5);
      ctx.lineTo(m.tx, m.ty + 5);
      ctx.stroke();
    }
  }

  private bombers(ctx: CanvasRenderingContext2D, s: GameState): void {
    for (const b of s.bombers) {
      const dir = b.vx >= 0 ? 1 : -1;
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.moveTo(b.x + 16 * dir, b.y);
      ctx.lineTo(b.x - 12 * dir, b.y - 6);
      ctx.lineTo(b.x - 6 * dir, b.y);
      ctx.lineTo(b.x - 12 * dir, b.y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  private blasts(ctx: CanvasRenderingContext2D, s: GameState): void {
    for (const b of s.blasts) {
      if (b.r <= 0) continue;

      // Cycling the fill is what makes a detonation read as fire rather than as
      // a growing circle. It is driven off `age`, not off wall-clock time, so a
      // slow frame never desynchronizes it from the simulation.
      const phase = Math.floor(b.age / 4) % 3;
      const palette = b.hostile
        ? ['#f87171', '#fca5a5', '#7f1d1d']
        : ['#fef08a', '#fb923c', '#f8fafc'];

      ctx.globalAlpha = b.age > BLAST_GROW ? Math.max(0.25, 1 - b.age / BLAST_LIFE) : 1;
      ctx.fillStyle = palette[phase];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private reticle(ctx: CanvasRenderingContext2D, at: { x: number; y: number }): void {
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(at.x, at.y, 9, 0, Math.PI * 2);
    ctx.moveTo(at.x - 15, at.y);
    ctx.lineTo(at.x - 4, at.y);
    ctx.moveTo(at.x + 4, at.y);
    ctx.lineTo(at.x + 15, at.y);
    ctx.moveTo(at.x, at.y - 15);
    ctx.lineTo(at.x, at.y - 4);
    ctx.moveTo(at.x, at.y + 4);
    ctx.lineTo(at.x, at.y + 15);
    ctx.stroke();
  }

  /**
   * Maps a client point onto the playfield. This game is the only one in the
   * hub whose whole input is an absolute world coordinate, which is why the
   * shared helper returns a point rather than Breakout's single axis.
   */
  toWorld(clientX: number, clientY: number): { x: number; y: number } {
    return (
      toWorld(this.canvas, clientX, clientY, FIELD_W, FIELD_H) ?? {
        x: FIELD_W / 2,
        y: FIELD_H / 2,
      }
    );
  }
}
