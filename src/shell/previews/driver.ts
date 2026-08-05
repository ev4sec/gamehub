/**
 * The one animation driver behind every hub preview.
 *
 * One shared `requestAnimationFrame` rather than one per tile, because there is
 * exactly one place that has to decide whether a frame should exist at all:
 * is the tab hidden, is reduced motion on, is any tile actually on screen. Five
 * independent loops would be five copies of that decision and nothing able to
 * answer "should anything be scheduled right now", which is precisely what the
 * headless suite asserts.
 *
 * `platform/loop.ts` is deliberately not used. Its substance is a fixed-timestep
 * accumulator with catch-up ticks and an interpolation alpha, all of which exist
 * to keep a *simulation* honest against a variable refresh rate. A preview has
 * no simulation: each painter is a pure function of elapsed milliseconds, so
 * there is nothing to keep honest and `alpha` has no referent. Nothing here
 * runs a loop on a game's behalf; no game is mounted while the hub is up.
 */

export interface PreviewSpec {
  /** Pure: the same `tMs` must always paint the same picture. */
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number, tMs: number) => void;
  /** Loop length. `paint(t)` and `paint(t + periodMs)` are the same frame. */
  periodMs: number;
  /** The moment shown when motion is refused. Pick one that composes well. */
  stillMs: number;
}

interface Entry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  spec: PreviewSpec;
  dirty: boolean;
  visible: boolean;
  frames: number;
  /** True once this entry has been given its still frame under reduced motion. */
  stilled: boolean;
}

/** Ambient decoration; half the frames of a game, for no perceptible loss. */
const FPS = 30;
const FRAME_MS = 1000 / FPS;
/** Matches loop.ts: a frame after a tab switch must not fast-forward the art. */
const MAX_FRAME_MS = 100;
/** Only ever guards against a degenerate rect; below any real tile width. */
const MIN_CSS = 160;
/**
 * Five tiles at device-pixel-ratio 2 would be several megapixels cleared and
 * repainted thirty times a second. Preview art is blocky, so it survives being
 * drawn at 512 and scaled up far better than the hub survives that fill rate.
 */
const MAX_BACKING = 512;

const entries = new Set<Entry>();
const byCanvas = new WeakMap<HTMLCanvasElement, Entry>();

let raf = 0;
let elapsed = 0;
let acc = 0;
let last = 0;

let observer: IntersectionObserver | null = null;
let motion: MediaQueryList | null = null;
let attached = false;

function reducedMotion(): boolean {
  return motion?.matches === true;
}

function size(entry: Entry): void {
  const rect = entry.canvas.getBoundingClientRect();
  const cssW = Math.max(rect.width, MIN_CSS);
  const cssH = Math.max(rect.height, MIN_CSS);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.max(1, Math.min(dpr, MAX_BACKING / Math.max(cssW, cssH)));

  const w = Math.round(cssW * scale);
  const h = Math.round(cssH * scale);

  // Assigning width or height clears the surface and reallocates the backing
  // store even when the value has not changed, and a ResizeObserver can fire on
  // any layout pass. Without this guard every preview blanks at random.
  if (entry.canvas.width !== w) entry.canvas.width = w;
  if (entry.canvas.height !== h) entry.canvas.height = h;
}

function paintOne(entry: Entry, t: number): void {
  if (entry.dirty) {
    size(entry);
    entry.dirty = false;
  }
  const { width, height } = entry.canvas;
  if (width === 0 || height === 0) return;

  entry.spec.paint(entry.ctx, width, height, t);
  entry.frames += 1;
  // The suite cannot see pixels, so the paint leaves a countable trace. Same
  // idiom as 2048's data-moves.
  entry.canvas.setAttribute('data-preview-frame', String(entry.frames));
}

/**
 * Paints the entries that still need a still frame, and only those.
 *
 * `registerPreview` calls `ensureRunning`, which lands here when motion is
 * refused, so without the guard the n-th canvas to register repaints all n.
 * Measured at five previews that was thirty full-canvas paints where five were
 * needed; at nine it would be ninety, in one synchronous commit, on the
 * accessibility path of all things.
 */
function paintStills(): void {
  for (const entry of entries) {
    if (entry.stilled) continue;
    paintOne(entry, entry.spec.stillMs);
    entry.stilled = true;
  }
}

function anyVisible(): boolean {
  for (const entry of entries) {
    if (entry.visible) return true;
  }
  return false;
}

function frame(now: number): void {
  raf = requestAnimationFrame(frame);

  const dt = Math.min(now - last, MAX_FRAME_MS);
  last = now;
  acc += dt;
  if (acc < FRAME_MS) return;

  elapsed += acc;
  acc = 0;

  for (const entry of entries) {
    if (!entry.visible) continue;
    paintOne(entry, elapsed % entry.spec.periodMs);
  }
}

function stop(): void {
  if (raf === 0) return;
  cancelAnimationFrame(raf);
  raf = 0;
}

function ensureRunning(): void {
  if (reducedMotion()) {
    stop();
    paintStills();
    return;
  }
  // Motion is allowed again, so the still frames are no longer current. Cleared
  // here rather than in the media-query handler, which is the one place both
  // transitions pass through.
  for (const entry of entries) entry.stilled = false;
  if (raf !== 0) return;
  if (typeof document !== 'undefined' && document.hidden) return;
  if (!anyVisible()) return;

  last = typeof performance !== 'undefined' ? performance.now() : 0;
  acc = 0;
  raf = requestAnimationFrame(frame);
}

function onVisibility(): void {
  if (document.hidden) stop();
  else ensureRunning();
}

function onMotionChange(): void {
  if (reducedMotion()) {
    stop();
    paintStills();
  } else {
    ensureRunning();
  }
}

function attach(): void {
  if (attached) return;
  attached = true;

  document.addEventListener('visibilitychange', onVisibility);

  // jsdom has no matchMedia, and calling it unguarded throws outright rather
  // than returning undefined.
  if (typeof window.matchMedia === 'function') {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', onMotionChange);
  }

  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const entry = byCanvas.get(record.target as HTMLCanvasElement);
          if (entry) entry.visible = record.isIntersecting;
        }
        if (anyVisible()) ensureRunning();
        else stop();
      },
      { rootMargin: '200px', threshold: 0 },
    );
  }
}

function detach(): void {
  if (!attached) return;
  attached = false;

  document.removeEventListener('visibilitychange', onVisibility);
  motion?.removeEventListener('change', onMotionChange);
  motion = null;
  observer?.disconnect();
  observer = null;

  stop();
  elapsed = 0;
  acc = 0;
}

/** Registers a canvas and returns the function that removes it again. */
export function registerPreview(
  canvas: HTMLCanvasElement,
  spec: PreviewSpec,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const entry: Entry = {
    canvas,
    ctx,
    spec,
    dirty: true,
    // Assume visible until an observer says otherwise. A missing API must never
    // mean "nothing animates", or the headless suite would test nothing at all.
    visible: true,
    frames: 0,
    stilled: false,
  };

  attach();
  entries.add(entry);
  byCanvas.set(canvas, entry);
  observer?.observe(canvas);

  ensureRunning();

  return () => {
    observer?.unobserve(canvas);
    entries.delete(entry);
    byCanvas.delete(canvas);
    if (entries.size === 0) detach();
  };
}

/**
 * Marks a preview for re-measurement on the next painted frame.
 *
 * Under reduced motion there is no next frame, so the repaint has to happen
 * here or the canvas keeps a stale backing store against a changed CSS box and
 * shows stretched art until motion is allowed again. An orientation change or
 * a retracting URL bar is enough to trigger it.
 */
export function invalidateSize(canvas: HTMLCanvasElement): void {
  const entry = byCanvas.get(canvas);
  if (!entry) return;

  entry.dirty = true;
  if (!reducedMotion()) return;

  entry.stilled = false;
  paintOne(entry, entry.spec.stillMs);
  entry.stilled = true;
}
