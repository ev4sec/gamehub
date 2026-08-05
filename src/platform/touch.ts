import type { PointerEvent, TouchEvent } from 'react';

/**
 * Touch recognizers, shared by every game that takes one.
 *
 * Behavior lives here; look does not. There is no component in this file, no
 * icon and no class name, because a d-pad's accent colour, icon set and grid
 * shape are design decisions that belong to each game. What belongs here is the
 * part that has to agree across games and would drift silently if it did not:
 * the swipe threshold, the diagonal tie-break, and the fact that a hold has to
 * be released on four different events rather than one.
 *
 * Three copies of the swipe recognizer already existed, and the third landed
 * while this was being written. That is the argument.
 */

/** Minimum travel, in CSS pixels, before a drag counts as a swipe. */
export const SWIPE_THRESHOLD = 24;

export type Swipe = 'up' | 'down' | 'left' | 'right';

function directionOf(dx: number, dy: number): Swipe {
  // Ties break toward the horizontal, matching what Snake and 2048 already do.
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

export interface SwipeOptions {
  threshold?: number;
  /**
   * Called when the finger lifts without ever crossing the threshold. Only some
   * games have a meaningful "forward", so this is opt-in: in Frogger a tap is
   * the hop the player wants four times out of five, and in a maze it means
   * nothing at all.
   */
  onTap?: () => void;
}

/**
 * The swipe recognizer, as props to spread onto an element.
 *
 * The direction resolves the moment travel crosses the threshold, during the
 * move, rather than when the finger lifts. In a ticked game the difference is
 * real: a 200ms swipe resolved on lift costs most of a tick at speed, which is
 * how Snake used to drop turns on a phone.
 *
 * Whatever element carries these should also carry `touch-none`. The handlers
 * usually sit on a container while only the canvas inside it has the class, and
 * a drag that begins in the margin can still scroll the page. jsdom cannot see
 * that, so nothing in the suites will ever tell you.
 */
export function swipeHandlers(
  onSwipe: (dir: Swipe) => void,
  options: SwipeOptions = {},
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
} {
  // Closed over rather than held in a ref: the handlers are recreated with the
  // component, and a gesture never outlives a render.
  const threshold = options.threshold ?? SWIPE_THRESHOLD;
  let origin: { x: number; y: number } | null = null;
  let spent = false;

  return {
    onTouchStart(e) {
      const t = e.touches[0];
      if (!t) return;
      origin = { x: t.clientX, y: t.clientY };
      spent = false;
    },
    onTouchMove(e) {
      if (!origin || spent) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - origin.x;
      const dy = t.clientY - origin.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      spent = true;
      onSwipe(directionOf(dx, dy));
    },
    onTouchEnd(e) {
      const start = origin;
      origin = null;
      // A gesture already resolved during the move must not fire twice.
      if (!start || spent) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) {
        options.onTap?.();
        return;
      }
      onSwipe(directionOf(dx, dy));
    },
  };
}

/**
 * Press-and-hold for one control.
 *
 * `onPointerLeave` and `onPointerCancel` are part of the contract, not extras.
 * A thumb that slides off a button never sends a pointerup, and without them
 * the input latches on and the piece keeps moving after the finger is gone.
 */
export function holdHandlers(onChange: (down: boolean) => void): {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
} {
  return {
    onPointerDown(e) {
      e.preventDefault();
      onChange(true);
    },
    onPointerUp: () => onChange(false),
    onPointerLeave: () => onChange(false),
    onPointerCancel: () => onChange(false),
  };
}

/**
 * A tap that fires on pointer-down rather than waiting for the synthetic click.
 * The delay before a click is small and it is still enough to read as a dropped
 * input when the thing you are steering is already moving.
 */
export function tapHandlers(onTap: () => void): {
  onPointerDown: (e: PointerEvent) => void;
} {
  return {
    onPointerDown(e) {
      e.preventDefault();
      onTap();
    },
  };
}
