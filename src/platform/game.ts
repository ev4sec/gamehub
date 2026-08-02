/**
 * The contract between the shell and a game.
 *
 * This lives apart from the registry on purpose. The registry imports every
 * game, and a game needs these values, so keeping them here is what stops the
 * two from importing each other in a cycle.
 */

export interface GameProps {
  /** Return to the hub. The game calls this; the shell decides what it means. */
  onExit: () => void;
}

/**
 * The one piece of UI every game owes the shell: a control that calls `onExit`,
 * labelled so it can be found by accessible name. The smoke harness drives it
 * for every registered game, so a game that omits it fails the generic pass
 * rather than stranding the player with no way back.
 */
export const EXIT_LABEL = 'back to all games';
