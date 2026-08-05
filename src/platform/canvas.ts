/**
 * Canvas sizing, shared by every game that draws.
 *
 * Three renderers had already written this and one of them had written it
 * wrong: Snake allocates the full device pixel ratio, so a phone at dpr 3 pays
 * 2.25x the fill rate of the other two on the most expensive renderer in the
 * project. Four more canvases are arriving, so the correct version moves here
 * once rather than being copied a fourth, fifth and sixth time.
 *
 * What this does not do is decide a drawing convention. A renderer may scale a
 * fixed world box or transform by the ratio and draw in CSS pixels; both are
 * fine and this returns the numbers for either.
 */

/**
 * Ratios above 2 buy nothing a player can see and cost fill rate quadratically.
 * Phones ship at 3 and 3.5.
 */
export const MAX_DPR = 2;

/**
 * A floor for the measured box. A hidden element and jsdom both report a zero
 * bounding rect, and without this the canvas is sized 0x0 and every draw
 * silently does nothing.
 */
export const MIN_CSS_PX = 200;

export interface CanvasSize {
  /** Backing-store pixels. */
  width: number;
  height: number;
  /** The measured CSS box, after the floor is applied. */
  cssWidth: number;
  cssHeight: number;
  /** The ratio actually applied, never above MAX_DPR. */
  dpr: number;
}

export interface SizeOptions {
  minCssWidth?: number;
  minCssHeight?: number;
  /**
   * A ceiling on backing-store area, in pixels. The hub's preview driver
   * already needs one; a full-bleed playfield on a large monitor wants the
   * same protection, and an area budget is the honest form of it because a
   * width cap says nothing about a tall canvas.
   */
  maxBackingPx?: number;
}

/**
 * Measures the element, floors a degenerate rect, caps the device pixel ratio
 * and resizes the backing store only when the value actually changes.
 *
 * That last part matters more than it looks: assigning `canvas.width` clears
 * the backing store even when the value is identical, and a ResizeObserver
 * fires on any layout pass. Unguarded, an unrelated reflow blanks the frame.
 *
 * Never touches `canvas.style`. CSS owns the layout size, and a renderer that
 * writes it fights the classes already on the element.
 */
export function sizeCanvas(canvas: HTMLCanvasElement, opts: SizeOptions = {}): CanvasSize {
  const rect = canvas.getBoundingClientRect();
  const minW = opts.minCssWidth ?? MIN_CSS_PX;
  const minH = opts.minCssHeight ?? MIN_CSS_PX;

  const cssWidth = Math.max(rect.width, minW);
  const cssHeight = Math.max(rect.height, minH);

  let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

  if (opts.maxBackingPx) {
    const area = cssWidth * cssHeight * dpr * dpr;
    if (area > opts.maxBackingPx) dpr *= Math.sqrt(opts.maxBackingPx / area);
  }

  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  return { width, height, cssWidth, cssHeight, dpr };
}

/** Letterboxes a fixed world box inside the backing store. */
export function fitWorld(
  size: CanvasSize,
  worldW: number,
  worldH: number,
): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(size.width / worldW, size.height / worldH);
  return {
    scale,
    offsetX: (size.width - worldW * scale) / 2,
    offsetY: (size.height - worldH * scale) / 2,
  };
}

/**
 * Client coordinates to world coordinates, for a world letterboxed by
 * `fitWorld`. Returns null on a zero rect, so a caller can tell "the element
 * has no box yet" from "the player tapped the top left corner".
 */
export function toWorld(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  worldW: number,
  worldH: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const size: CanvasSize = {
    width: canvas.width,
    height: canvas.height,
    cssWidth: rect.width,
    cssHeight: rect.height,
    dpr: 1,
  };
  const { scale, offsetX, offsetY } = fitWorld(size, worldW, worldH);

  const px = ((clientX - rect.left) / rect.width) * canvas.width;
  const py = ((clientY - rect.top) / rect.height) * canvas.height;

  return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
}
