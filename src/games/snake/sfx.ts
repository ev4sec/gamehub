import { audio } from '../../platform/audio';
import type { PowerKind } from './engine/types';

/**
 * Snake's sound vocabulary, built on the shared synthesis primitive. The
 * meanings live here rather than in the platform because "eat" and "rival down"
 * are snake's concepts and no other game should inherit them.
 */
export const sfx = {
  set enabled(on: boolean) {
    audio.enabled = on;
  },
  get enabled(): boolean {
    return audio.enabled;
  },

  unlock(): void {
    audio.unlock();
  },

  ui(): void {
    audio.ui();
  },

  eat(combo: number): void {
    const base = 520 + Math.min(combo, 8) * 62;
    audio.tone(base, 0.09, 'square', 0.7, base * 1.5);
  },

  power(kind: PowerKind): void {
    const roots: Record<PowerKind, number> = {
      slow: 300,
      ghost: 520,
      magnet: 400,
      double: 620,
      shrink: 460,
    };
    const root = roots[kind];
    audio.tone(root, 0.1, 'triangle', 0.6);
    audio.tone(root * 1.26, 0.1, 'triangle', 0.6, undefined, 0.06);
    audio.tone(root * 1.5, 0.16, 'triangle', 0.6, undefined, 0.12);
  },

  portal(): void {
    audio.tone(240, 0.22, 'sine', 0.5, 1200);
  },

  rivalDown(): void {
    audio.tone(420, 0.3, 'sawtooth', 0.5, 90);
    audio.noise(0.25, 0.4);
  },

  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      audio.tone(f, 0.18, 'triangle', 0.6, undefined, i * 0.08);
    });
  },

  death(): void {
    audio.tone(300, 0.55, 'sawtooth', 0.7, 55);
    audio.noise(0.4, 0.5);
  },
};
