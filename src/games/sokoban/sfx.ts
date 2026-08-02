import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Sokoban's sounds, kept quiet and short. This is a game people play while
 * thinking, so nothing here rings out or lingers.
 */
export const sfx = {
  step(): void {
    audio.tone(160, 0.03, 'triangle', 0.12);
  },
  push(): void {
    audio.tone(110, 0.07, 'square', 0.2, 90);
  },
  blocked(): void {
    audio.tone(80, 0.04, 'square', 0.1);
  },
  undo(): void {
    audio.tone(400, 0.05, 'triangle', 0.16, 300);
  },
  reset(): void {
    audio.tone(260, 0.09, 'triangle', 0.18, 180);
  },
  solved(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      audio.tone(f, 0.16, 'triangle', 0.3, undefined, i * 0.08),
    );
  },
};

export function playFor(events: readonly GameEvent[]): void {
  for (const ev of events) {
    switch (ev.t) {
      case 'move':
        sfx.step();
        break;
      case 'push':
        sfx.push();
        break;
      case 'blocked':
        sfx.blocked();
        break;
      case 'undo':
        sfx.undo();
        break;
      case 'reset':
        sfx.reset();
        break;
      case 'solved':
        sfx.solved();
        break;
    }
  }
}
