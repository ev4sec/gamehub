import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Breakout's sounds. The brick tone climbs with the combo, so a long rally is
 * audible as well as visible; that is the only running feedback the game gives
 * for playing well, since the score is off to one side.
 */
export const sfx = {
  launch(): void {
    audio.tone(300, 0.08, 'square', 0.28, 620);
  },
  wall(): void {
    audio.tone(240, 0.03, 'square', 0.16);
  },
  paddle(): void {
    audio.tone(180, 0.05, 'square', 0.28, 260);
  },
  brick(combo: number): void {
    const step = Math.min(combo, 24);
    audio.tone(420 * Math.pow(1.03, step), 0.05, 'square', 0.3);
  },
  crack(): void {
    audio.tone(300, 0.04, 'sawtooth', 0.2);
  },
  drop(): void {
    audio.tone(660, 0.07, 'triangle', 0.24, 880);
  },
  power(): void {
    [523, 784, 1047].forEach((f, i) => audio.tone(f, 0.1, 'triangle', 0.3, undefined, i * 0.05));
  },
  lifeLost(): void {
    audio.noise(0.18, 0.4);
    audio.tone(200, 0.3, 'sawtooth', 0.28, 80);
  },
  levelComplete(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      audio.tone(f, 0.14, 'square', 0.32, undefined, i * 0.07),
    );
  },
  over(): void {
    [294, 233, 175, 131].forEach((f, i) =>
      audio.tone(f, 0.26, 'sawtooth', 0.3, undefined, i * 0.13),
    );
  },
  cleared(): void {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      audio.tone(f, 0.16, 'square', 0.34, undefined, i * 0.08),
    );
  },
};

export function playFor(events: readonly GameEvent[], combo: number): void {
  for (const ev of events) {
    switch (ev.t) {
      case 'launch':
        sfx.launch();
        break;
      case 'bounce':
        if (ev.surface === 'paddle') sfx.paddle();
        else sfx.wall();
        break;
      case 'brick':
        if (ev.destroyed) sfx.brick(combo);
        else sfx.crack();
        break;
      case 'drop':
        sfx.drop();
        break;
      case 'power':
        sfx.power();
        break;
      case 'lifeLost':
        sfx.lifeLost();
        break;
      case 'levelComplete':
        sfx.levelComplete();
        break;
      case 'over':
        sfx.over();
        break;
      case 'cleared':
        sfx.cleared();
        break;
    }
  }
}
