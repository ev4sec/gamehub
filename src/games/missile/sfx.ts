import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Missile Command's sounds.
 *
 * The kill tone climbs with the chain depth rather than with the score. A chain
 * is the one thing in this game that happens faster than the player can read
 * the HUD, so it is the one thing the audio has to carry on its own.
 */
export const sfx = {
  fire(): void {
    audio.tone(220, 0.06, 'square', 0.2, 660);
  },
  dryFire(): void {
    audio.tone(90, 0.07, 'square', 0.18);
  },
  blast(): void {
    audio.noise(0.14, 0.32);
  },
  kill(chained: boolean, depth: number): void {
    const step = chained ? Math.min(depth, 10) : 0;
    audio.tone(380 * Math.pow(1.09, step), 0.07, 'triangle', 0.3);
  },
  cityLost(): void {
    audio.noise(0.3, 0.5);
    audio.tone(150, 0.42, 'sawtooth', 0.3, 60);
  },
  baseLost(): void {
    audio.noise(0.22, 0.42);
    audio.tone(190, 0.3, 'sawtooth', 0.26, 90);
  },
  bonusCity(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      audio.tone(f, 0.13, 'triangle', 0.32, undefined, i * 0.06),
    );
  },
  waveComplete(): void {
    [440, 554, 659, 880].forEach((f, i) =>
      audio.tone(f, 0.14, 'square', 0.3, undefined, i * 0.07),
    );
  },
  over(): void {
    [262, 208, 156, 117].forEach((f, i) =>
      audio.tone(f, 0.3, 'sawtooth', 0.3, undefined, i * 0.15),
    );
  },
};

/**
 * A tick can contain a dozen kills in one chain, and a dozen simultaneous tones
 * is noise rather than feedback. The chain is counted and played as a single
 * rising run instead, which is also what a player hears in the arcade cabinet.
 */
export function playFor(events: readonly GameEvent[]): void {
  let chainDepth = 0;
  let kills = 0;
  let blasts = 0;

  for (const ev of events) {
    switch (ev.t) {
      case 'fire':
        sfx.fire();
        break;
      case 'dryFire':
        sfx.dryFire();
        break;
      case 'blast':
        blasts += 1;
        break;
      case 'kill':
        kills += 1;
        if (ev.chained) chainDepth += 1;
        break;
      case 'cityLost':
        sfx.cityLost();
        break;
      case 'baseLost':
        sfx.baseLost();
        break;
      case 'bonusCity':
        sfx.bonusCity();
        break;
      case 'waveComplete':
        sfx.waveComplete();
        break;
      case 'over':
        sfx.over();
        break;
    }
  }

  // One noise burst however many detonations landed together, so a chain
  // reaction does not turn into a wall of white noise.
  if (blasts > 0) sfx.blast();
  for (let i = 0; i < Math.min(kills, 6); i++) {
    sfx.kill(chainDepth > 0, chainDepth + i);
  }
}
