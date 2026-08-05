import { fitWorld, sizeCanvas } from '../../platform/canvas';
import {
  COLORS,
  COLS,
  HOME_COLS,
  HOP_TICKS,
  RIVER_BOTTOM,
  RIVER_TOP,
  ROAD_BOTTOM,
  ROAD_TOP,
  ROWS,
  ROW_HOMES,
} from './engine/constants';
import { aboutToDive, submerged } from './engine/engine';
import type { GameState, Lane } from './engine/types';

const MIN_CSS_PX = 200;

/** Cars are coloured by lane, so a player learns a lane by its traffic. */
function carColor(lane: Lane): string {
  return COLORS.cars[lane.row % COLORS.cars.length];
}

export class Renderer {
  private ctx: CanvasRenderingContext2D | null;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private reduceMotion = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  /** The hop arc and the water shimmer are decoration; the hop itself is not. */
  setReducedMotion(on: boolean): void {
    this.reduceMotion = on;
  }

  resize(): void {
    const size = sizeCanvas(this.canvas, {
      minCssWidth: MIN_CSS_PX,
      minCssHeight: MIN_CSS_PX * (ROWS / COLS),
    });
    const fit = fitWorld(size, COLS, ROWS);
    this.scale = fit.scale;
    this.offsetX = fit.offsetX;
    this.offsetY = fit.offsetY;
  }

  draw(s: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.bands(ctx);
    this.bays(ctx, s);
    for (const lane of s.lanes) this.lane(ctx, s, lane);
    this.frog(ctx, s);

    ctx.restore();
  }

  private bands(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLORS.bank;
    ctx.fillRect(0, 0, COLS, ROWS);

    ctx.fillStyle = COLORS.river;
    ctx.fillRect(0, RIVER_TOP, COLS, RIVER_BOTTOM - RIVER_TOP + 1);
    ctx.fillStyle = COLORS.riverEdge;
    ctx.fillRect(0, RIVER_TOP, COLS, 0.06);
    ctx.fillRect(0, RIVER_BOTTOM + 1 - 0.06, COLS, 0.06);

    ctx.fillStyle = COLORS.road;
    ctx.fillRect(0, ROAD_TOP, COLS, ROAD_BOTTOM - ROAD_TOP + 1);

    // Lane dashes, so six lanes of asphalt read as six lanes.
    ctx.fillStyle = COLORS.lane;
    for (let row = ROAD_TOP + 1; row <= ROAD_BOTTOM; row++) {
      for (let x = 0.2; x < COLS; x += 0.8) ctx.fillRect(x, row - 0.02, 0.4, 0.04);
    }
  }

  private bays(ctx: CanvasRenderingContext2D, s: GameState): void {
    HOME_COLS.forEach((col, i) => {
      ctx.strokeStyle = COLORS.home;
      ctx.lineWidth = 0.07;
      ctx.strokeRect(col + 0.08, ROW_HOMES + 0.12, 0.84, 0.76);

      if (!s.homes[i]) return;
      ctx.fillStyle = COLORS.frog;
      ctx.beginPath();
      ctx.arc(col + 0.5, ROW_HOMES + 0.5, 0.28, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private lane(ctx: CanvasRenderingContext2D, s: GameState, lane: Lane): void {
    const period = lane.span + lane.gap;
    const down = submerged(lane, s.elapsedMs);
    const warning = aboutToDive(lane, s.elapsedMs);

    // Only the instances of the repeating pattern that can be seen are drawn.
    const first = Math.floor((-lane.span - lane.phase) / period);
    const last = Math.ceil((COLS - lane.phase) / period);

    for (let k = first; k <= last; k++) {
      const x = lane.phase + k * period;
      const y = lane.row;

      if (lane.occupant === 'car' || lane.occupant === 'truck') {
        ctx.fillStyle = carColor(lane);
        ctx.fillRect(x + 0.08, y + 0.18, lane.span - 0.16, 0.64);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(x + 0.18, y + 0.3, lane.span - 0.36, 0.2);
        continue;
      }

      if (lane.occupant === 'log') {
        ctx.fillStyle = COLORS.log;
        ctx.fillRect(x + 0.04, y + 0.16, lane.span - 0.08, 0.68);
        ctx.fillStyle = COLORS.logGrain;
        ctx.fillRect(x + 0.04, y + 0.44, lane.span - 0.08, 0.08);
        continue;
      }

      // Turtles. Underwater they keep an outline, so the lane never becomes a
      // blank stretch the player has to remember the shape of.
      ctx.globalAlpha = down ? 0.4 : 1;
      for (let i = 0; i < lane.span; i++) {
        const cx = x + i + 0.5;
        if (down) {
          ctx.strokeStyle = COLORS.turtle;
          ctx.lineWidth = 0.06;
          ctx.beginPath();
          ctx.arc(cx, y + 0.5, 0.32, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = COLORS.turtle;
          ctx.beginPath();
          ctx.arc(cx, y + 0.5, 0.36, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.turtleShell;
          ctx.beginPath();
          ctx.arc(cx, y + 0.5, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // The dive warning is a marker, not a flash. A blinking tell would be
        // the one carrier of the state and would vanish under reduced motion.
        if (warning) {
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.lineWidth = 0.05;
          ctx.beginPath();
          ctx.arc(cx, y + 0.22, 0.1, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  private frog(ctx: CanvasRenderingContext2D, s: GameState): void {
    const frog = s.frog;
    let x = frog.col + frog.carry + 0.5;
    let y = frog.row + 0.5;
    let lift = 0;

    if (frog.hopTicks > 0 && !this.reduceMotion) {
      const k = 1 - frog.hopTicks / HOP_TICKS;
      x = frog.fromCol + 0.5 + (x - (frog.fromCol + 0.5)) * k;
      y = frog.fromRow + 0.5 + (y - (frog.fromRow + 0.5)) * k;
      // A small arc off the ground. Nothing about the rules depends on it.
      lift = Math.sin(k * Math.PI) * 0.12;
    }

    ctx.fillStyle = COLORS.frog;
    ctx.strokeStyle = COLORS.frogEdge;
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.arc(x, y - lift, 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.frogEye;
    ctx.beginPath();
    ctx.arc(x - 0.13, y - lift - 0.12, 0.075, 0, Math.PI * 2);
    ctx.arc(x + 0.13, y - lift - 0.12, 0.075, 0, Math.PI * 2);
    ctx.fill();
  }
}
