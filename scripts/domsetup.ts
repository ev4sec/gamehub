/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal browser environment for headless UI checks. Imported for its side
 * effects, and it must be imported before anything that touches `window`.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: false,
  url: 'http://localhost/',
});

const w = dom.window as any;

// A 2d context that swallows every call. We are checking wiring, not pixels.
const gradientStub = { addColorStop() {} };
w.HTMLCanvasElement.prototype.getContext = function getContext() {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      return () => gradientStub;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  });
};

w.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(w, 'devicePixelRatio', { value: 2, configurable: true });

// Hand-cranked animation frames, so the loop advances exactly when we say.
let clock = 0;
let nextHandle = 1;
const pending = new Map<number, (t: number) => void>();

w.requestAnimationFrame = (cb: (t: number) => void) => {
  const handle = nextHandle++;
  pending.set(handle, cb);
  return handle;
};
w.cancelAnimationFrame = (handle: number) => {
  pending.delete(handle);
};

const globals = [
  'window', 'document', 'navigator', 'HTMLElement', 'HTMLCanvasElement',
  'Element', 'Node', 'MouseEvent', 'KeyboardEvent', 'Event', 'PointerEvent',
  'requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver',
  'devicePixelRatio', 'localStorage', 'getComputedStyle',
];
for (const key of globals) {
  (globalThis as any)[key] = w[key];
}

// Deliberately not assigned onto the jsdom window: `performance` is a live
// accessor there and overwriting it sends jsdom's own impl into recursion.
(globalThis as any).performance = { now: () => clock };

/** Runs `count` animation frames, each advancing the clock by `dt` ms. */
export async function frames(count: number, dt = 16): Promise<void> {
  for (let i = 0; i < count; i++) {
    clock += dt;
    const due = [...pending.entries()];
    pending.clear();
    for (const [, cb] of due) cb(clock);
    await new Promise((r) => setTimeout(r, 0));
  }
}

/** Lets React flush state updates and effects. */
export async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

export function text(): string {
  return document.body.textContent ?? '';
}

/** Matches on visible text or, for the icon-only HUD buttons, aria-label. */
export function buttonWith(label: string): HTMLElement {
  const wanted = label.toLowerCase();
  const buttons = [...document.querySelectorAll('button')];
  const match = buttons.find((b) => {
    const label = `${b.textContent ?? ''} ${b.getAttribute('aria-label') ?? ''}`;
    return label.toLowerCase().includes(wanted);
  });
  if (!match) {
    throw new Error(
      `no button matching "${label}". Buttons present: ` +
        JSON.stringify(
          buttons.map((b) => b.textContent || b.getAttribute('aria-label') || '?'),
        ),
    );
  }
  return match as unknown as HTMLElement;
}

export function click(el: HTMLElement): void {
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
}

/**
 * Dispatched once, on the window. Firing at the document too would bubble up
 * and deliver the same keypress twice, which silently double-toggles pause.
 */
export function press(key: string, code?: string): void {
  w.dispatchEvent(
    new w.KeyboardEvent('keydown', { key, code: code ?? key, bubbles: true, cancelable: true }),
  );
}

/**
 * The matching key release. Games with sustained input (anything with auto
 * repeat) latch a direction on keydown and only drop it here, so a test that
 * only ever presses leaves the piece travelling for the rest of the run.
 */
export function release(key: string, code?: string): void {
  w.dispatchEvent(
    new w.KeyboardEvent('keyup', { key, code: code ?? key, bubbles: true, cancelable: true }),
  );
}

/** A press and its release, for input that is not meant to be held. */
export function tap(key: string, code?: string): void {
  press(key, code);
  release(key, code);
}
