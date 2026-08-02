/**
 * The registry is the single list of games the hub knows about.
 *
 * It is deliberately the only place a game is named. The hub page renders from
 * it and the smoke harness iterates it, so registering a game is what puts that
 * game under test. Nothing else should hold its own list.
 *
 * This shape is a starting point, not settled. It is expected to change once a
 * turn-based game is added, which is the case most likely to prove it wrong.
 */

export interface GameEntry {
  /** Stable key. Used for routing and as the save-file namespace, so changing it orphans saved data. */
  id: string;
  title: string;
  /** One line for the hub card. */
  blurb: string;
  /**
   * Loads the game module on selection rather than at startup, so one game's
   * code does not sit in every other game's bundle.
   */
  load: () => Promise<unknown>;
}

export const games: GameEntry[] = [];

export function findGame(id: string): GameEntry | undefined {
  return games.find((g) => g.id === id);
}
