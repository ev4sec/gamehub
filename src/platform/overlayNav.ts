import { useEffect } from 'react';

/**
 * Arrow-key navigation across the actions on whatever overlay is showing.
 *
 * Every game in the hub is played with the arrow keys, so when a sheet appears
 * over the board the player's hands are already on them. Reaching for Tab to
 * move between "Next level" and "Again" is not what anyone does, and the arrows
 * did nothing, so the highlight sat on the primary action and would not move.
 *
 * This is mounted once by the shell and does nothing at all until an overlay is
 * on screen, which it finds by attribute rather than by being handed a ref. The
 * overlays belong to nine separate games and the shell is forbidden from
 * importing any of them, so a marker in the DOM is the seam that already exists.
 *
 * Registered in the capture phase deliberately. Each game has its own window
 * keydown listener that swallows the arrows to move a piece, and capture runs
 * before those, so stopping propagation here is what keeps a sheet's navigation
 * from also steering the game underneath it.
 */

/** The attribute a game puts on its sheet to opt into this. */
export const OVERLAY_ATTR = 'data-overlay';

function actionsOf(): HTMLButtonElement[] {
  const sheet = document.querySelector(`[${OVERLAY_ATTR}]`);
  if (!sheet) return [];
  return [...sheet.querySelectorAll('button')].filter((b) => !b.disabled);
}

export function useOverlayNav(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const actions = actionsOf();
      // No sheet, or a sheet with nothing to press. Either way this is not our
      // key, and it has to reach the game untouched.
      if (actions.length === 0) return;

      const focused = actions.indexOf(document.activeElement as HTMLButtonElement);
      // Nothing focused yet means the primary action is the implicit selection,
      // because that is the one drawn as selected. So the first press of Right
      // moves off it rather than onto it, which is what a player expects when
      // they can already see which button is highlighted.
      const from = focused < 0 ? 0 : focused;

      // A sheet with one action has nothing to navigate between, and taking the
      // arrows there would cost something real: several games start a run when
      // the player presses a direction on the banner, and that has to keep
      // working. So the arrows are only claimed when there is a choice to make.
      let next: number | null = null;
      if (actions.length > 1) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = from + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = from - 1;
      }

      if (next !== null) {
        e.preventDefault();
        e.stopPropagation();
        const wrapped = (next + actions.length) % actions.length;
        actions[wrapped].focus();
        return;
      }

      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        // Clicked rather than left to the browser's own activation: the default
        // was suppressed a line ago, and doing it explicitly keeps this the
        // only path, so a focused button can never fire twice.
        actions[from].click();
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}
