import { audio } from '../../platform/audio';
import type { GameEvent } from './engine/types';

/**
 * Tetris's sound vocabulary, built on the platform's two synthesis primitives.
 * The platform knows how to make a tone; what a tone means is this game's
 * business, which is why none of these names appear in `platform/audio`.
 */
export const sfx = {
  move(): void {
    audio.tone(220, 0.03, 'square', 0.18);
  },
  rotate(): void {
    audio.tone(380, 0.04, 'square', 0.22);
  },
  hold(): void {
    audio.tone(520, 0.06, 'triangle', 0.3, 660);
  },
  hardDrop(): void {
    audio.noise(0.06, 0.35);
    audio.tone(140, 0.07, 'square', 0.3, 70);
  },
  lock(): void {
    audio.tone(180, 0.04, 'square', 0.2);
  },
  clear(rows: number, special: boolean): void {
    if (special) {
      // T-spins and tetrises get the fanfare; everything else gets a blip.
      [523, 659, 784, 1047].forEach((f, i) => audio.tone(f, 0.12, 'square', 0.35, undefined, i * 0.05));
      return;
    }
    const base = 440 + rows * 90;
    audio.tone(base, 0.09, 'square', 0.32, base * 1.5);
  },
  levelUp(): void {
    [392, 523, 659].forEach((f, i) => audio.tone(f, 0.14, 'triangle', 0.32, undefined, i * 0.07));
  },
  over(): void {
    [330, 262, 196, 147].forEach((f, i) => audio.tone(f, 0.24, 'sawtooth', 0.3, undefined, i * 0.12));
  },
  win(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      audio.tone(f, 0.16, 'square', 0.34, undefined, i * 0.08),
    );
  },
};

/** Maps one tick's events onto sounds, so the hook stays free of audio detail. */
export function playFor(events: readonly GameEvent[]): void {
  for (const ev of events) {
    switch (ev.t) {
      case 'move':
        sfx.move();
        break;
      case 'rotate':
        sfx.rotate();
        break;
      case 'hold':
        sfx.hold();
        break;
      case 'hardDrop':
        if (ev.cells > 0) sfx.hardDrop();
        break;
      case 'lock':
        sfx.lock();
        break;
      case 'clear':
        sfx.clear(ev.rows.length, ev.tspin !== 'none' || ev.rows.length === 4);
        break;
      case 'levelUp':
        sfx.levelUp();
        break;
      case 'over':
        sfx.over();
        break;
      case 'cleared':
        sfx.win();
        break;
    }
  }
}
