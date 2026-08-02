import { BOARD_H, BOARD_W, BUFFER_H, COLORS, SHAPES, VISIBLE_H } from './engine/constants';
import { ghostY } from './engine/engine';
import type { GameState } from './engine/types';

/**
 * A floor for the backing size. A hidden element and jsdom both report a zero
 * bounding rect, and without this the canvas is sized 0x0, every draw silently
 * does nothing, and the game looks dead rather than broken.
 */
const MIN_WIDTH_PX = 200;

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private cell = 0;
  private originX = 0;
  private originY = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const cssWidth = Math.max(rect.width, MIN_WIDTH_PX);
    const cssHeight = Math.max(rect.height, MIN_WIDTH_PX * (VISIBLE_H / BOARD_W));

    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.cell = Math.min(this.width / BOARD_W, this.height / VISIBLE_H);
    this.originX = (this.width - this.cell * BOARD_W) / 2;
    this.originY = (this.height - this.cell * VISIBLE_H) / 2;
  }

  private block(x: number, y: number, color: string, alpha: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const cell = this.cell;
    const inset = Math.max(1, cell * 0.06);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);

    // A lighter top edge so the stack reads as blocks rather than a flat wash.
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + inset, y + inset, cell - inset * 2, Math.max(1, cell * 0.12));
    ctx.globalAlpha = 1;
  }

  private outline(x: number, y: number, color: string): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const cell = this.cell;
    const inset = Math.max(1, cell * 0.1);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, cell * 0.07);
    ctx.strokeRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);
    ctx.globalAlpha = 1;
  }

  draw(s: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const { width, height, cell, originX, originY } = this;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(originX, originY, cell * BOARD_W, cell * VISIBLE_H);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= BOARD_W; x++) {
      ctx.moveTo(originX + x * cell, originY);
      ctx.lineTo(originX + x * cell, originY + VISIBLE_H * cell);
    }
    for (let y = 0; y <= VISIBLE_H; y++) {
      ctx.moveTo(originX, originY + y * cell);
      ctx.lineTo(originX + BOARD_W * cell, originY + y * cell);
    }
    ctx.stroke();

    // The settled stack. Buffer rows are deliberately never drawn.
    for (let y = BUFFER_H; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        const kind = s.board[y][x];
        if (!kind) continue;
        this.block(originX + x * cell, originY + (y - BUFFER_H) * cell, COLORS[kind], 1);
      }
    }

    const piece = s.current;
    if (!piece) return;

    if (s.status === 'playing' || s.status === 'paused') {
      const landing = ghostY(s);
      if (landing !== piece.y) {
        for (const [ox, oy] of SHAPES[piece.kind][piece.rot]) {
          const y = landing + oy;
          if (y < BUFFER_H) continue;
          this.outline(
            originX + (piece.x + ox) * cell,
            originY + (y - BUFFER_H) * cell,
            COLORS[piece.kind],
          );
        }
      }
    }

    for (const [ox, oy] of SHAPES[piece.kind][piece.rot]) {
      const y = piece.y + oy;
      if (y < BUFFER_H) continue;
      this.block(
        originX + (piece.x + ox) * cell,
        originY + (y - BUFFER_H) * cell,
        COLORS[piece.kind],
        1,
      );
    }
  }
}
