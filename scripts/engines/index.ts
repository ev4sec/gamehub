import { snakeEngineChecks } from './snake';
import { tetrisEngineChecks } from './tetris';
import { twentyFortyEightEngineChecks } from './2048';
import { breakoutEngineChecks } from './breakout';
import { sokobanEngineChecks } from './sokoban';

/**
 * Per-game engine checks, keyed by registry id.
 *
 * The driver in smoke.ts walks the registry rather than this map, so a game
 * registered with no entry here is reported as untested rather than silently
 * skipped. Same principle as the UI suite: registering a game is what puts it
 * under test, and a gap has to announce itself.
 */
export const engineChecks: Record<string, () => void> = {
  snake: snakeEngineChecks,
  tetris: tetrisEngineChecks,
  '2048': twentyFortyEightEngineChecks,
  breakout: breakoutEngineChecks,
  sokoban: sokobanEngineChecks,
};
