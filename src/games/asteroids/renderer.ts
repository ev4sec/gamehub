import { fitWorld, sizeCanvas } from '../../platform/canvas';
import { COLORS, FIELD_H, FIELD_W, SHIP_R } from './engine/constants';
import type { GameState, Rock } from './engine/types';

const MIN_CSS_PX = 200;

/**
 * White line art, with the accent kept for the things the player emits: the
 * thrust flame, their own bullets, the shield. That split is what makes a
 * crowded field readable at a glance, because everything coloured is yours.
 *
 * Wrapping is drawn as well as simulated. A rock straddling the seam is painted
 * twice, once on each side, so a player can see the half that is about to
 * arrive rather than having it appear out of nothing.
 */
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
      minCssHeight: MIN_CSS_PX * (FIELD_H / FIELD_W),
    });
    const fit = fitWorld(size, FIELD_W, FIELD_H);
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
    ctx.lineJoin = 'round';

    for (const rock of s.rocks) this.echo(ctx, rock.x, rock.y, rock.r, () => this.rock(ctx, rock));

    for (const bullet of s.bullets) {
      ctx.fillStyle = bullet.hostile ? '#fca5a5' : COLORS.bullet;
      this.echo(ctx, bullet.x, bullet.y, 6, () => {
        ctx.beginPath();
        ctx.arc(0, 0, bullet.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (s.saucer) {
      const saucer = s.saucer;
      this.echo(ctx, saucer.x, saucer.y, saucer.r, () => this.saucer(ctx, saucer.r));
    }

    if (s.status === 'playing' || s.status === 'paused' || s.status === 'ready') {
      this.echo(ctx, s.ship.x, s.ship.y, SHIP_R * 2, () => this.ship(ctx, s));
    }

    ctx.restore();
  }

  /**
   * Draws something once for every side of the seam it overlaps. Nine positions
   * is the complete set on a torus, and the guard keeps it to one draw for the
   * overwhelming majority of bodies that are nowhere near an edge.
   */
  private echo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    draw: () => void,
  ): void {
    const xs = [0];
    const ys = [0];
    if (x < radius) xs.push(FIELD_W);
    else if (x > FIELD_W - radius) xs.push(-FIELD_W);
    if (y < radius) ys.push(FIELD_H);
    else if (y > FIELD_H - radius) ys.push(-FIELD_H);

    for (const dx of xs) {
      for (const dy of ys) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        draw();
        ctx.restore();
      }
    }
  }

  private rock(ctx: CanvasRenderingContext2D, rock: Rock): void {
    // Rotation is decoration and nothing else reads it, so it is the first
    // thing to go when motion is refused. The rock still travels.
    if (!this.reduceMotion) ctx.rotate(rock.angle);

    ctx.strokeStyle = COLORS.rock;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    rock.shape.forEach((k, i) => {
      const a = (i / rock.shape.length) * Math.PI * 2;
      const px = Math.cos(a) * rock.r * k;
      const py = Math.sin(a) * rock.r * k;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
  }

  private saucer(ctx: CanvasRenderingContext2D, r: number): void {
    ctx.strokeStyle = COLORS.saucer;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(-r * 0.45, -r * 0.4);
    ctx.lineTo(r * 0.45, -r * 0.4);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.45, r * 0.4);
    ctx.lineTo(-r * 0.45, r * 0.4);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.4);
    ctx.lineTo(-r * 0.2, -r * 0.8);
    ctx.lineTo(r * 0.2, -r * 0.8);
    ctx.lineTo(r * 0.45, -r * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
  }

  private ship(ctx: CanvasRenderingContext2D, s: GameState): void {
    const ship = s.ship;
    ctx.rotate(ship.angle);

    ctx.strokeStyle = COLORS.ship;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_R, 0);
    ctx.lineTo(-SHIP_R * 0.75, -SHIP_R * 0.7);
    ctx.lineTo(-SHIP_R * 0.4, 0);
    ctx.lineTo(-SHIP_R * 0.75, SHIP_R * 0.7);
    ctx.closePath();
    ctx.stroke();

    // Flickering the flame is a look, not information. Held steady when motion
    // is refused, which still says "thrusting" perfectly well.
    const flameOn = this.reduceMotion || Math.floor(s.elapsedMs / 48) % 3 !== 2;
    if (ship.thrusting && flameOn) {
      ctx.strokeStyle = COLORS.thrust;
      ctx.beginPath();
      ctx.moveTo(-SHIP_R * 0.55, -SHIP_R * 0.35);
      ctx.lineTo(-SHIP_R * 1.35, 0);
      ctx.lineTo(-SHIP_R * 0.55, SHIP_R * 0.35);
      ctx.stroke();
    }

    if (ship.invuln > 0) {
      ctx.rotate(-ship.angle);
      ctx.strokeStyle = COLORS.shield;
      // Under reduced motion the ring is drawn heavier and held, so the state
      // is carried by weight rather than by a pulse nobody asked for.
      ctx.globalAlpha = this.reduceMotion
        ? 1
        : 0.4 + 0.6 * Math.abs(Math.sin(s.elapsedMs / 260));
      ctx.lineWidth = this.reduceMotion ? 3 : 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, SHIP_R * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }
}
