import { useEffect } from 'react';

/**
 * Keyboard navigation for everything that is not the game itself: the hub's
 * tiles, a game's mode list, and the actions on whatever overlay is showing.
 *
 * One listener, in the capture phase, mounted once by the shell. Capture is
 * load-bearing: every game registers its own window `keydown` in the bubble
 * phase to move a piece, so running first is what lets a sheet be navigated
 * without also steering the board underneath it.
 *
 * Surfaces opt in with an attribute rather than by handing over a ref. Nine
 * games own their own menus and overlays and the shell is forbidden from
 * importing any of them, so a marker in the DOM is the seam that already
 * exists, and a tenth game costs one attribute.
 */

/** A sheet whose actions are navigated in a line. */
export const OVERLAY_ATTR = 'data-overlay';
/** A group of choices navigated as a grid: hub tiles, mode cards. */
export const GRID_ATTR = 'data-nav-grid';
/** Where to land on the first keypress, if not the first item. */
export const INITIAL_ATTR = 'data-nav-initial';

type Move = 'prev' | 'next' | 'up' | 'down' | 'first' | 'last' | null;

function moveFor(e: KeyboardEvent): Move {
  switch (e.key) {
    case 'ArrowRight':
      return 'next';
    case 'ArrowLeft':
      return 'prev';
    case 'ArrowDown':
      return 'down';
    case 'ArrowUp':
      return 'up';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      return null;
  }
}

function buttonsIn(root: Element): HTMLButtonElement[] {
  return [...root.querySelectorAll('button')].filter((b) => !b.disabled);
}

/**
 * Groups items into rows by their vertical position.
 *
 * Read off the DOM rather than told the column count, because the column count
 * is a breakpoint away from being different and a hardcoded three is wrong at
 * every width but one. In a headless DOM every offsetTop is zero, so this
 * collapses to a single row and the arrows all move linearly, which is both
 * harmless and testable.
 */
function rowsOf(items: HTMLElement[]): HTMLElement[][] {
  const byTop = new Map<number, HTMLElement[]>();
  for (const item of items) {
    const row = byTop.get(item.offsetTop) ?? [];
    row.push(item);
    byTop.set(item.offsetTop, row);
  }
  return [...byTop.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

function clamp(n: number, max: number): number {
  return n < 0 ? 0 : n > max ? max : n;
}

/** The item a grid move lands on, or null when the move goes nowhere. */
function gridTarget(items: HTMLElement[], current: number, move: Move): HTMLElement | null {
  if (move === 'first') return items[0];
  if (move === 'last') return items[items.length - 1];

  const rows = rowsOf(items);

  // One row means there is no second axis, so every arrow walks the list. This
  // is the single-column case on a phone as well as the headless one.
  if (rows.length <= 1) {
    const step = move === 'next' || move === 'down' ? 1 : -1;
    return items[clamp(current + step, items.length - 1)];
  }

  if (move === 'next' || move === 'prev') {
    // Along the flat order, so running off the end of a row continues onto the
    // next rather than stopping dead at the edge.
    const step = move === 'next' ? 1 : -1;
    return items[clamp(current + step, items.length - 1)];
  }

  const item = items[current];
  const rowIndex = rows.findIndex((row) => row.includes(item));
  const column = rows[rowIndex].indexOf(item);
  const nextRow = rows[rowIndex + (move === 'down' ? 1 : -1)];
  if (!nextRow) return null;

  // A short final row keeps the column that exists rather than refusing to move.
  return nextRow[Math.min(column, nextRow.length - 1)];
}

export function useKeyboardNav(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // An overlay is modal over whatever is behind it, so it is asked first.
      const sheet = document.querySelector(`[${OVERLAY_ATTR}]`);
      if (sheet) {
        overlay(e, buttonsIn(sheet));
        return;
      }

      const grid = document.querySelector(`[${GRID_ATTR}]`);
      if (grid) navigate(e, grid, buttonsIn(grid));
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

function overlay(e: KeyboardEvent, actions: HTMLButtonElement[]): void {
  if (actions.length === 0) return;

  const focused = actions.indexOf(document.activeElement as HTMLButtonElement);
  // Nothing focused means the primary action is the implicit selection, since
  // that is the one drawn as selected. So the first press of Right moves off
  // it rather than onto it, which is what a player expects when they can
  // already see which button is highlighted.
  const from = focused < 0 ? 0 : focused;

  // A sheet with one action has nothing to navigate between, and several games
  // start a run when a direction is pressed on the opening banner. Claiming the
  // arrows there would break that, so they are only taken when there is a
  // choice to make.
  const move = actions.length > 1 ? moveFor(e) : null;
  if (move === 'next' || move === 'prev' || move === 'down' || move === 'up') {
    e.preventDefault();
    e.stopPropagation();
    const step = move === 'next' || move === 'down' ? 1 : -1;
    actions[(from + step + actions.length) % actions.length].focus();
    return;
  }

  if (e.key === 'Enter' || e.code === 'Space') {
    e.preventDefault();
    e.stopPropagation();
    // Clicked explicitly rather than left to the browser's own activation: the
    // default was suppressed a line ago, so this stays the only path and a
    // focused button can never fire twice.
    actions[from].click();
  }
}

function navigate(e: KeyboardEvent, grid: Element, items: HTMLButtonElement[]): void {
  if (items.length === 0) return;

  const current = items.indexOf(document.activeElement as HTMLButtonElement);
  const move = moveFor(e);

  if (move) {
    // Nothing focused yet, so the first press picks a starting point rather
    // than moving from one. Unlike an overlay there is no visually primary
    // tile, so landing on something is the whole of what was asked for, and the
    // hub marks the game played last as the best guess at where you were.
    if (current < 0) {
      e.preventDefault();
      e.stopPropagation();
      const initial = grid.querySelector<HTMLElement>(`[${INITIAL_ATTR}]`);
      (initial ?? items[0]).focus();
      return;
    }

    const target = gridTarget(items, current, move);
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();
    target.focus();
    return;
  }

  // Enter opens whatever is highlighted. A focused button would activate on its
  // own, so this is belt and braces, but it keeps activation on one path across
  // both surfaces and it is the only version a headless suite can drive.
  //
  // Gated on the focus already being inside the grid, and that guard is the
  // whole of why this is not simply `if (Enter)`: without it, pressing Enter
  // while the sound toggle is focused would move focus onto a game tile instead
  // of toggling the sound.
  if (current >= 0 && (e.key === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    e.stopPropagation();
    items[current].click();
  }
}
