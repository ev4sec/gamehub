import type { ComponentType } from 'react';
import type { GameProps } from './game';

/**
 * The registry is the single list of games the hub knows about.
 *
 * It is deliberately the only place a game is named. The hub page renders from
 * it and the smoke harness iterates it, so registering a game is what puts that
 * game under test. Nothing else should hold its own list.
 *
 * Note what a game is *not* asked for: no step function, no grid size, no
 * renderer. A game is just a component that mounts and knows how to leave. That
 * keeps a turn-based game with no clock as ordinary a tenant as a ticked one.
 */

export interface GameEntry {
  /** Stable key. Also the save namespace, so changing it orphans saved data. */
  id: string;
  title: string;
  /** One line for the hub card. */
  blurb: string;
  /**
   * Loads the game on selection rather than at startup, so one game's code does
   * not sit inside every other game's bundle.
   */
  load: () => Promise<ComponentType<GameProps>>;
}

export const games: GameEntry[] = [
  {
    id: 'snake',
    title: 'Snake',
    blurb:
      'Four modes, power-ups, portals, encroaching hazards and a rival snake that hunts the same apples you do.',
    load: () => import('../games/snake').then((m) => m.default),
  },
];

export function findGame(id: string): GameEntry | undefined {
  return games.find((g) => g.id === id);
}
