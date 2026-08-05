import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * The maze chase's sounds.
 *
 * The dot alternates between two pitches, which is what turns two hundred and
 * forty identical events into the chirping rhythm the cabinet is remembered
 * for. Playing one note would be correct and would sound like a fault.
 */
let dotToggle = false;

export const sfx = {
  dot(): void {
    dotToggle = !dotToggle;
    audio.tone(dotToggle ? 330 : 247, 0.035, 'square', 0.16);
  },
  pellet(): void {
    [196, 262, 330].forEach((f, i) =>
      audio.tone(f, 0.1, 'triangle', 0.28, undefined, i * 0.05),
    );
  },
  ghost(chain: number): void {
    const base = 420 * Math.pow(1.28, Math.min(chain - 1, 3));
    audio.tone(base, 0.09, 'square', 0.3, base * 1.6);
  },
  eaten(): void {
    [392, 330, 262, 196, 147].forEach((f, i) =>
      audio.tone(f, 0.16, 'sawtooth', 0.3, undefined, i * 0.11),
    );
  },
  extraLife(): void {
    [659, 880, 1319].forEach((f, i) =>
      audio.tone(f, 0.12, 'triangle', 0.32, undefined, i * 0.07),
    );
  },
  levelComplete(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      audio.tone(f, 0.14, 'square', 0.32, undefined, i * 0.08),
    );
  },
  over(): void {
    [294, 233, 175, 131].forEach((f, i) =>
      audio.tone(f, 0.3, 'sawtooth', 0.3, undefined, i * 0.15),
    );
  },
};

export function playFor(events: readonly GameEvent[]): void {
  for (const ev of events) {
    switch (ev.t) {
      case 'dot':
        sfx.dot();
        break;
      case 'pellet':
        sfx.pellet();
        break;
      case 'ghost':
        sfx.ghost(ev.chain);
        break;
      case 'eaten':
        sfx.eaten();
        break;
      case 'extraLife':
        sfx.extraLife();
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
