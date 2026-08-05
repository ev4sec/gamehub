import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Frogger's sounds.
 *
 * The hop is the one a player hears hundreds of times in a run, so it is the
 * shortest and quietest thing here. Everything else is allowed to be louder
 * than it, which is what makes a death read as an event rather than as another
 * hop that happened to go wrong.
 */
export const sfx = {
  hop(): void {
    audio.tone(520, 0.045, 'square', 0.18, 700);
  },
  blocked(): void {
    audio.tone(140, 0.05, 'square', 0.12);
  },
  home(): void {
    [659, 784, 988, 1319].forEach((f, i) =>
      audio.tone(f, 0.12, 'triangle', 0.32, undefined, i * 0.06),
    );
  },
  squashed(): void {
    audio.noise(0.2, 0.45);
    audio.tone(160, 0.28, 'sawtooth', 0.3, 70);
  },
  drowned(): void {
    audio.tone(420, 0.3, 'sine', 0.28, 110);
    audio.noise(0.16, 0.24);
  },
  timeout(): void {
    [330, 262, 208].forEach((f, i) =>
      audio.tone(f, 0.2, 'square', 0.28, undefined, i * 0.11),
    );
  },
  levelComplete(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      audio.tone(f, 0.15, 'square', 0.32, undefined, i * 0.08),
    );
  },
  over(): void {
    [294, 233, 175, 131].forEach((f, i) =>
      audio.tone(f, 0.28, 'sawtooth', 0.3, undefined, i * 0.14),
    );
  },
};

export function playFor(events: readonly GameEvent[]): void {
  for (const ev of events) {
    switch (ev.t) {
      case 'hop':
        sfx.hop();
        break;
      case 'blocked':
        sfx.blocked();
        break;
      case 'home':
        sfx.home();
        break;
      case 'squashed':
        sfx.squashed();
        break;
      case 'drowned':
        sfx.drowned();
        break;
      case 'timeout':
        sfx.timeout();
        break;
      case 'levelComplete':
        sfx.levelComplete();
        break;
      case 'over':
        sfx.over();
        break;
    }
  }
}
