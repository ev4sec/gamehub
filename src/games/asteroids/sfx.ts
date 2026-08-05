import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Asteroids' sounds.
 *
 * The rock tones fall as the rocks get smaller, which is the opposite of the
 * usual arcade instinct and is right here: a big rock breaking is the low thud
 * that starts a sequence, and the small ones are the quick clicks that end it.
 */
export const sfx = {
  fire(): void {
    audio.tone(880, 0.05, 'square', 0.2, 420);
  },
  rock(size: 1 | 2 | 3): void {
    const base = size === 3 ? 150 : size === 2 ? 230 : 330;
    audio.noise(size === 3 ? 0.22 : 0.13, 0.35);
    audio.tone(base, 0.16, 'sawtooth', 0.26, base * 0.55);
  },
  saucer(): void {
    audio.noise(0.24, 0.4);
    [520, 380, 260].forEach((f, i) =>
      audio.tone(f, 0.14, 'square', 0.28, undefined, i * 0.06),
    );
  },
  saucerSpawned(): void {
    [660, 560].forEach((f, i) =>
      audio.tone(f, 0.18, 'triangle', 0.18, undefined, i * 0.16),
    );
  },
  hyperspace(): void {
    audio.tone(180, 0.24, 'sine', 0.24, 1400);
  },
  shipLost(): void {
    audio.noise(0.36, 0.5);
    audio.tone(220, 0.4, 'sawtooth', 0.3, 60);
  },
  extraLife(): void {
    [784, 988, 1319].forEach((f, i) =>
      audio.tone(f, 0.13, 'triangle', 0.32, undefined, i * 0.07),
    );
  },
  wave(): void {
    [330, 440, 587].forEach((f, i) =>
      audio.tone(f, 0.12, 'square', 0.24, undefined, i * 0.07),
    );
  },
  over(): void {
    [262, 208, 156, 117].forEach((f, i) =>
      audio.tone(f, 0.3, 'sawtooth', 0.3, undefined, i * 0.15),
    );
  },
};

export function playFor(events: readonly GameEvent[]): void {
  // A four-way split scores four rocks in one tick, and four simultaneous
  // bursts is mud. The largest one is played and the rest are counted.
  let biggest: 1 | 2 | 3 | 0 = 0;

  for (const ev of events) {
    switch (ev.t) {
      case 'fire':
        sfx.fire();
        break;
      case 'rock':
        if (ev.size > biggest) biggest = ev.size;
        break;
      case 'saucer':
        sfx.saucer();
        break;
      case 'saucerSpawned':
        sfx.saucerSpawned();
        break;
      case 'hyperspace':
        sfx.hyperspace();
        break;
      case 'shipLost':
        sfx.shipLost();
        break;
      case 'extraLife':
        sfx.extraLife();
        break;
      case 'wave':
        sfx.wave();
        break;
      case 'over':
        sfx.over();
        break;
    }
  }

  if (biggest > 0) sfx.rock(biggest as 1 | 2 | 3);
}
