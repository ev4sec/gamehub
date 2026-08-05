import { asteroidsPreview } from './asteroids';
import { breakoutPreview } from './breakout';
import { froggerPreview } from './frogger';
import { game2048Preview } from './g2048';
import { mazechasePreview } from './mazechase';
import { missilePreview } from './missile';
import { snakePreview } from './snake';
import { sokobanPreview } from './sokoban';
import { tetrisPreview } from './tetris';
import type { PreviewSpec } from './driver';

/**
 * Hub preview art, keyed by registry id.
 *
 * None of these import from `src/games/`. The hub must not carry a game's code,
 * and an eslint rule on `src/shell/**` enforces it, so each painter is a small
 * hand-built impression of its game rather than the real engine driving a small
 * canvas. Colours are duplicated in `palette.ts` for the same reason.
 *
 * A game with no entry here simply renders no preview, and the UI smoke says so
 * out loud rather than quietly passing.
 */
export const previews: Record<string, PreviewSpec> = {
  snake: snakePreview,
  tetris: tetrisPreview,
  '2048': game2048Preview,
  breakout: breakoutPreview,
  sokoban: sokobanPreview,
  missile: missilePreview,
  frogger: froggerPreview,
  asteroids: asteroidsPreview,
  mazechase: mazechasePreview,
};

export type { PreviewSpec };
