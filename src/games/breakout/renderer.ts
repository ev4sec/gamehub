import {
  FIELD_H,
  FIELD_W,
  PADDLE_H,
  PADDLE_Y,
  POWER_META,
} from './engine/constants';
import type { GameState } from './engine/types';

/**
 * A floor for the backing size. A hidden element and jsdom both report a zero
 * bounding rect, and without this the canvas is sized 0x0 and every draw
 * silently does nothing.
 */
const MIN_WIDTH_PX = 200;

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const cssWidth = Math.max(rect.width, MIN_WIDTH_PX);
    const cssHeight = Math.max(rect.height, MIN_WIDTH_PX * (FIELD_H / FIELD_W));

    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);

    // The playfield is in world units and never changes shape, so everything
    // is drawn through one uniform scale rather than being laid out per size.
    this.scale = Math.min(this.canvas.width / FIELD_W, this.canvas.height / FIELD_H);
    this.offsetX = (this.canvas.width - FIELD_W * this.scale) / 2;
    this.offsetY = (this.canvas.height - FIELD_H * this.scale) / 2;
  }

  draw(s: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    for (const brick of s.bricks) {
      const worn = brick.solid ? 1 : brick.hp / brick.maxHp;
      ctx.globalAlpha = brick.solid ? 1 : 0.45 + 0.55 * worn;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

      ctx.globalAlpha = brick.solid ? 0.35 : 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(brick.x, brick.y, brick.w, 3);
      ctx.globalAlpha = 1;

      if (brick.solid) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2);
      }
    }

    for (const drop of s.drops) {
      const meta = POWER_META[drop.kind];
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.glyph, drop.x, drop.y + 1);
    }

    const half = s.paddle.w / 2;
    ctx.fillStyle = s.effects.sticky ? '#fbbf24' : '#e2e8f0';
    ctx.fillRect(s.paddle.x - half, PADDLE_Y, s.paddle.w, PADDLE_H);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(s.paddle.x - half, PADDLE_Y + PADDLE_H - 4, s.paddle.w, 4);

    for (const ball of s.balls) {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Maps a client x coordinate onto the playfield, for pointer steering. */
  toWorldX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0) return FIELD_W / 2;
    return ((clientX - rect.left) / rect.width) * FIELD_W;
  }
}
