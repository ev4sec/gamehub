/**
 * The fixed-timestep driver, offered to games that want a clock.
 *
 * It is a utility, not a requirement. A turn-based game renders on state change
 * and should never start one of these, which is why the registry does not ask a
 * game for a `step` function and the shell does not run a loop on its behalf.
 *
 * The accumulator is the point. Ticking off raw frame deltas makes simulation
 * speed depend on refresh rate; this keeps the tick interval honest and lets the
 * renderer interpolate between ticks with `alpha`.
 */

/** Frames after a tab switch can be huge; never fast-forward more than this. */
const MAX_FRAME_MS = 100;
/** Ceiling on catch-up ticks per frame, so a slow frame cannot spiral. */
const MAX_CATCHUP = 4;

export interface LoopHooks {
  /** False while paused, finished, or otherwise not simulating. */
  running: () => boolean;
  /** Current tick length in ms. Re-read after every tick, so it can change. */
  interval: () => number;
  /** Advance the simulation exactly one tick. */
  tick: () => void;
  /**
   * Draw. `alpha` is the fraction of the way to the next tick, 1 when not
   * running. `dt` is the clamped frame delta, for time-based visual effects.
   */
  draw: (alpha: number, dt: number) => void;
  /** Called once per frame in which at least one tick happened. */
  onTicked?: () => void;
}

/** Starts the loop and returns the function that stops it. */
export function startLoop(hooks: LoopHooks): () => void {
  let raf = 0;
  let last = performance.now();
  let acc = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(now - last, MAX_FRAME_MS);
    last = now;

    let ticked = false;
    let interval = hooks.interval();

    if (hooks.running()) {
      acc += dt;
      let guard = 0;
      while (acc >= interval && hooks.running() && guard < MAX_CATCHUP) {
        guard += 1;
        hooks.tick();
        acc -= interval;
        interval = hooks.interval();
        ticked = true;
      }
      if (guard >= MAX_CATCHUP) acc = 0;
    } else {
      acc = 0;
    }

    const alpha = hooks.running() ? Math.min(1, acc / interval) : 1;
    hooks.draw(alpha, dt);

    if (ticked) hooks.onTicked?.();
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
