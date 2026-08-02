/**
 * Drawing helpers shared by the five preview painters.
 *
 * Painters are written against a fixed virtual stage rather than the real pixel
 * size, so the same art works at any tile size and the maths in each painter
 * stays readable. `stage` handles the scaling.
 */

export const STAGE_W = 160;
export const STAGE_H = 90;

/**
 * Clears the canvas and runs `draw` in virtual stage coordinates.
 *
 * Scaled to cover rather than fit, so a tile of any aspect ratio is filled
 * edge to edge with no letterboxing. Anything a painter puts outside the middle
 * of the stage can therefore be cropped: keep the subject within x 20..140.
 */
export function stage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const scale = Math.max(w / STAGE_W, h / STAGE_H);
  ctx.save();
  ctx.translate((w - STAGE_W * scale) / 2, (h - STAGE_H * scale) / 2);
  ctx.scale(scale, scale);
  draw(ctx);
  ctx.restore();
}

/**
 * A rounded rectangle built from arcs rather than `ctx.roundRect`, which is
 * recent enough that not every target has it, and which the headless suite's
 * stubbed context would silently swallow either way.
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/** A block with a lighter top edge, matching how the real renderers draw one. */
export function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  r = 1.4,
): void {
  fillRound(ctx, x, y, w, h, r, color);
  ctx.globalAlpha = 0.45;
  fillRound(ctx, x + w * 0.12, y + h * 0.1, w * 0.76, Math.max(0.6, h * 0.14), r * 0.6, '#ffffff');
  ctx.globalAlpha = 1;
}

export function clamp(v: number, low: number, high: number): number {
  return v < low ? low : v > high ? high : v;
}

/** Linear interpolation, for sliding a thing between two cells. */
export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** The project's standard ease-out, matching the UI transitions. */
export function easeOut(k: number): number {
  const t = clamp(k, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

/**
 * A triangle wave: rises from `low` to `high` and back over `period`, exactly
 * periodic so a painter built on it closes its loop with no bookkeeping.
 */
export function triangle(t: number, period: number, low: number, high: number): number {
  const phase = ((t % period) + period) % period;
  const half = period / 2;
  const k = phase < half ? phase / half : 1 - (phase - half) / half;
  return low + (high - low) * k;
}
