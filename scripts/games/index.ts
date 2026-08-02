import { snakeDeepChecks } from './snake-ui';
import { tetrisDeepChecks } from './tetris-ui';
import { game2048DeepChecks } from './2048-ui';
import { breakoutDeepChecks } from './breakout-ui';

/**
 * Per-game deep UI checks, keyed by registry id.
 *
 * A game with no entry here still gets the generic pass in ui-smoke: it must
 * mount from the hub and it must be possible to leave. Adding a game without
 * adding a deep script is allowed, and ui-smoke says so out loud rather than
 * quietly reporting a pass that covered almost nothing.
 */
export const deepChecks: Record<string, () => Promise<void>> = {
  snake: snakeDeepChecks,
  tetris: tetrisDeepChecks,
  '2048': game2048DeepChecks,
  breakout: breakoutDeepChecks,
};
