import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * 2048's sounds. A merge is pitched by the tile it produced, so the board
 * audibly climbs as the run goes on; that is the one piece of feedback worth
 * having in a game with no clock to build tension on its own.
 */
export const sfx = {
  slide(): void {
    audio.tone(180, 0.05, 'triangle', 0.16, 240);
  },
  merge(value: number): void {
    const steps = Math.min(Math.log2(value), 12);
    audio.tone(180 * Math.pow(1.16, steps), 0.09, 'triangle', 0.3);
  },
  blocked(): void {
    audio.tone(90, 0.05, 'square', 0.12);
  },
  undo(): void {
    audio.tone(420, 0.07, 'triangle', 0.22, 300);
  },
  win(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      audio.tone(f, 0.18, 'triangle', 0.32, undefined, i * 0.09),
    );
  },
  over(): void {
    [294, 233, 175, 131].forEach((f, i) =>
      audio.tone(f, 0.26, 'sawtooth', 0.28, undefined, i * 0.13),
    );
  },
};

export function playFor(events: readonly GameEvent[]): void {
  let merged = false;
  for (const ev of events) {
    switch (ev.t) {
      case 'merge':
        // Only the largest merge of a move sounds, or a four-way clear is noise.
        if (!merged) {
          sfx.merge(ev.value);
          merged = true;
        }
        break;
      case 'move':
        if (!merged) sfx.slide();
        break;
      case 'blocked':
        sfx.blocked();
        break;
      case 'undo':
        sfx.undo();
        break;
      case 'win':
        sfx.win();
        break;
      case 'over':
        sfx.over();
        break;
    }
  }
}
