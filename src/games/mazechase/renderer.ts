import { fitWorld, sizeCanvas } from '../../platform/canvas';
import { COLORS, DELTA } from './engine/constants';
import { positionOf } from './engine/engine';
import { MAZE_H, MAZE_W } from './engine/maze';
import type { Actor, GameState, Ghost } from './engine/types';

const MIN_CSS_PX = 200;

/**
 * The board, drawn in tile units.
 *
 * Sprites are drawn at 1.6 times a cell and overhang their corridor, exactly as
 * the original does. At the size this board reaches on a phone a sprite drawn
 * at one cell is under ten pixels across, which is not a face, and the overhang
 * is what buys the difference.
 */
const SPRITE = 0.8;

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private reduceMotion = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  setReducedMotion(on: boolean): void {
    this.reduceMotion = on;
  }

  resize(): void {
    const size = sizeCanvas(this.canvas, {
      minCssWidth: MIN_CSS_PX,
      minCssHeight: MIN_CSS_PX * (MAZE_H / MAZE_W),
    });
    const fit = fitWorld(size, MAZE_W, MAZE_H);
    this.scale = fit.scale;
    this.offsetX = fit.offsetX;
    this.offsetY = fit.offsetY;
  }

  draw(s: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = COLORS.field;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.maze(ctx, s);
    for (const ghost of s.ghosts) this.ghost(ctx, s, ghost);
    if (s.status !== 'dying' && s.status !== 'levelComplete') this.hero(ctx, s);

    ctx.restore();
  }

  private maze(ctx: CanvasRenderingContext2D, s: GameState): void {
    for (let y = 0; y < MAZE_H; y++) {
      for (let x = 0; x < MAZE_W; x++) {
        const cell = s.grid[y][x];

        if (cell === 'wall') {
          ctx.fillStyle = COLORS.wallShadow;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x + 0.06, y + 0.06, 0.88, 0.88);
          continue;
        }

        if (cell === 'gate') {
          ctx.fillStyle = COLORS.gate;
          ctx.fillRect(x, y + 0.44, 1, 0.12);
          continue;
        }

        if (cell === 'dot') {
          ctx.fillStyle = COLORS.dot;
          ctx.beginPath();
          ctx.arc(x + 0.5, y + 0.5, 0.11, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        if (cell === 'pellet') {
          // Pulsing is decoration, and the pellet still has to be plainly not a
          // dot when motion is refused. So under reduced motion it is drawn at
          // full size with a ring, and size and ring carry it instead.
          const pulse = this.reduceMotion
            ? 0.35
            : 0.3 + 0.05 * Math.sin(s.elapsedMs / 220);
          ctx.fillStyle = COLORS.pellet;
          ctx.beginPath();
          ctx.arc(x + 0.5, y + 0.5, pulse, 0, Math.PI * 2);
          ctx.fill();

          if (this.reduceMotion) {
            ctx.strokeStyle = COLORS.pellet;
            ctx.lineWidth = 0.05;
            ctx.beginPath();
            ctx.arc(x + 0.5, y + 0.5, 0.44, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  private hero(ctx: CanvasRenderingContext2D, s: GameState): void {
    const at = positionOf(s.pac);
    const facing = Math.atan2(DELTA[s.pac.dir].y, DELTA[s.pac.dir].x);

    // The mouth cycle is a look. Held open at a fixed angle when motion is
    // refused, which still says which way the hero is pointing.
    const open = this.reduceMotion
      ? 0.42
      : 0.42 * Math.abs(Math.sin(s.elapsedMs / 90));

    ctx.save();
    ctx.translate(at.x + 0.5, at.y + 0.5);
    ctx.rotate(facing);
    ctx.fillStyle = COLORS.hero;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, SPRITE, open, Math.PI * 2 - open);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private ghost(ctx: CanvasRenderingContext2D, s: GameState, ghost: Ghost): void {
    const at = positionOf(ghost);
    const cx = at.x + 0.5;
    const cy = at.y + 0.5;
    const r = SPRITE;

    if (ghost.mode === 'eaten') {
      this.eyes(ctx, cx, cy, ghost);
      return;
    }

    const frightened = ghost.mode === 'frightened';
    // The last two seconds are classically a 4Hz flash. That fails reduced
    // motion outright, so there the outline thickens instead and the HUD chip
    // carries the count.
    const ending = frightened && ghost.frightTicks < 124;
    const flashOn = !this.reduceMotion && ending && Math.floor(s.elapsedMs / 125) % 2 === 0;

    ctx.fillStyle = frightened
      ? flashOn
        ? COLORS.frightenedEdge
        : COLORS.frightened
      : COLORS.ghosts[ghost.name];

    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.12, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r * 0.75);

    // The skirt, and the silhouette tell. Inky's has four points where the
    // others have three, and Clyde's is flat, so the four are told apart by
    // shape as well as by colour.
    const points = ghost.name === 'inky' ? 4 : 3;
    if (ghost.name === 'clyde') {
      ctx.lineTo(cx - r, cy + r * 0.75);
    } else {
      for (let i = 0; i < points * 2; i++) {
        const t = 1 - (i + 1) / (points * 2);
        ctx.lineTo(cx - r + 2 * r * t, cy + r * (i % 2 === 0 ? 0.4 : 0.75));
      }
    }
    ctx.closePath();
    ctx.fill();

    if (frightened) {
      ctx.strokeStyle = COLORS.frightenedEdge;
      ctx.lineWidth = this.reduceMotion && ending ? 0.14 : 0.05;
      ctx.stroke();
    }

    // The crest and the horns, drawn on top so they read at small sizes.
    if (ghost.name === 'blinky' && !frightened) {
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 1.3);
      ctx.lineTo(cx + r * 0.28, cy - r * 0.85);
      ctx.lineTo(cx - r * 0.28, cy - r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    if (ghost.name === 'pinky' && !frightened) {
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(cx - r * 0.6, cy - r * 1.2, r * 0.22, r * 0.4);
      ctx.fillRect(cx + r * 0.38, cy - r * 1.2, r * 0.22, r * 0.4);
    }

    if (frightened) {
      ctx.fillStyle = COLORS.frightenedEdge;
      ctx.fillRect(cx - r * 0.45, cy - r * 0.2, r * 0.25, r * 0.25);
      ctx.fillRect(cx + r * 0.2, cy - r * 0.2, r * 0.25, r * 0.25);
      return;
    }

    this.eyes(ctx, cx, cy, ghost);
  }

  /** Eyes always look the way the ghost is travelling. It is the single most
   *  useful readability cue in this genre and it costs two circles. */
  private eyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, ghost: Actor): void {
    const d = DELTA[ghost.dir];
    const r = SPRITE;

    for (const side of [-1, 1]) {
      const ex = cx + side * r * 0.33;
      const ey = cy - r * 0.15;
      ctx.fillStyle = COLORS.eyes;
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(ex + d.x * r * 0.12, ey + d.y * r * 0.12, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
