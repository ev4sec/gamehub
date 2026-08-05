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
  /** One short line for the hub tile. Kept under 45 characters: the tile is
   *  mostly artwork, and anything longer wraps to three lines under it. */
  blurb: string;
  /**
   * The game's own identity colour, repeated here so the hub can use it without
   * importing the game. Used on the tile's hairline, glow, hover border, focus
   * outline and play pill, and nowhere else: five saturated panels on one page
   * is the noise this is meant to avoid.
   */
  accent: string;
  /** A lighter step of the same hue, for text that must clear contrast. */
  accentText: string;
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
    blurb: 'Steer, eat, grow. Four modes and a rival.',
    accent: '#34d399',
    accentText: '#6ee7b7',
    load: () => import('../games/snake').then((m) => m.default),
  },
  {
    id: 'tetris',
    title: 'Tetris',
    blurb: 'Seven-bag pieces, wall kicks, T-spins.',
    accent: '#22d3ee',
    accentText: '#67e8f9',
    load: () => import('../games/tetris').then((m) => m.default),
  },
  {
    id: '2048',
    title: '2048',
    blurb: 'Slide and merge. Three sizes, one undo.',
    accent: '#fbbf24',
    accentText: '#fcd34d',
    load: () => import('../games/2048').then((m) => m.default),
  },
  {
    id: 'breakout',
    title: 'Breakout',
    blurb: 'A paddle that aims. Five walls, or endless.',
    accent: '#38bdf8',
    accentText: '#7dd3fc',
    load: () => import('../games/breakout').then((m) => m.default),
  },
  {
    // Violet rather than the emerald its menu used to wear. Snake had the
    // stronger claim on emerald: there it is a skin id and a saved value, while
    // here it was three class names. Sokoban's board keeps its emerald goal
    // rings, because on the board that colour means "goal", not "Sokoban".
    id: 'sokoban',
    title: 'Sokoban',
    blurb: 'Six warehouses. Push every box home.',
    accent: '#a78bfa',
    accentText: '#c4b5fd',
    load: () => import('../games/sokoban').then((m) => m.default),
  },
  {
    // Rose rather than the orange the batteries wear on the field. On the
    // field orange means "this is yours to fire"; the tile needs the colour of
    // the thing coming down, which is what the game is actually about.
    id: 'missile',
    title: 'Missile Command',
    blurb: 'Six cities, one sky. Tap where it will be.',
    accent: '#fb7185',
    accentText: '#fda4af',
    load: () => import('../games/missile').then((m) => m.default),
  },
  {
    // Yellow-green, which is a long way from Snake's emerald in both hue and
    // lightness. Two green games on one page is only a problem if they are the
    // same green.
    id: 'frogger',
    title: 'Frogger',
    blurb: 'Dodge the traffic, ride the logs home.',
    accent: '#a3e635',
    accentText: '#bef264',
    load: () => import('../games/frogger').then((m) => m.default),
  },
  {
    // Vector-phosphor magenta. It sits nearer Sokoban's violet than any other
    // pair on the page, which is survivable for three reasons: fuchsia-400 is
    // far more saturated than that lavender, this game's field is white line
    // art so the hue appears only on what the player emits, and registry order
    // keeps the two tiles off the same row.
    id: 'asteroids',
    title: 'Asteroids',
    blurb: 'Thrust, turn, wrap. Every rock splits.',
    accent: '#e879f9',
    accentText: '#f0abfc',
    load: () => import('../games/asteroids').then((m) => m.default),
  },
  {
    // The genre's hero is yellow and 2048 already has it, so this steps one
    // notch to orange. Eighteen degrees understates the separation: the yellow
    // region of the wheel is perceptually compressed, and amber-400 reads as
    // gold where orange-400 reads as orange.
    id: 'mazechase',
    title: 'Maze Chase',
    blurb: 'Clear the dots. Four ghosts, four minds.',
    accent: '#fb923c',
    accentText: '#fdba74',
    load: () => import('../games/mazechase').then((m) => m.default),
  },
];

export function findGame(id: string): GameEntry | undefined {
  return games.find((g) => g.id === id);
}
