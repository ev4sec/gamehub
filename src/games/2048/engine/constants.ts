import type { Dir, Mode } from './types';

export const MODE_META: Record<Mode, { label: string; blurb: string; size: number; goal: number }> =
  {
    classic: {
      label: 'Classic',
      size: 4,
      goal: 2048,
      blurb: 'Four by four, and the tile everyone is here for.',
    },
    petite: {
      label: 'Petite',
      size: 3,
      goal: 1024,
      blurb: 'Three by three. Almost no room to be wrong in.',
    },
    grand: {
      label: 'Grand',
      size: 5,
      goal: 4096,
      blurb: 'Five by five, twice the target, a much longer game.',
    },
  };

export const MODES: Mode[] = ['classic', 'petite', 'grand'];

export const VECTORS: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Chance a spawned tile is a 4 rather than a 2. */
export const FOUR_CHANCE = 0.1;

/** Tiles placed at the start of a run. */
export const STARTING_TILES = 2;

/**
 * Palette by value. Anything past the table falls back to the top entry, so a
 * player who gets further than expected sees a colour rather than a blank.
 */
export const TILE_STYLES: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#1e293b', fg: '#e2e8f0' },
  4: { bg: '#27364b', fg: '#e2e8f0' },
  8: { bg: '#2563eb', fg: '#f8fafc' },
  16: { bg: '#4f46e5', fg: '#f8fafc' },
  32: { bg: '#7c3aed', fg: '#f8fafc' },
  64: { bg: '#a21caf', fg: '#f8fafc' },
  128: { bg: '#be185d', fg: '#f8fafc' },
  256: { bg: '#e11d48', fg: '#f8fafc' },
  512: { bg: '#ea580c', fg: '#f8fafc' },
  1024: { bg: '#d97706', fg: '#0f172a' },
  2048: { bg: '#facc15', fg: '#0f172a' },
  4096: { bg: '#22d3ee', fg: '#0f172a' },
  8192: { bg: '#4ade80', fg: '#0f172a' },
};

export const TOP_STYLE = { bg: '#f8fafc', fg: '#0f172a' };

export function styleFor(value: number): { bg: string; fg: string } {
  return TILE_STYLES[value] ?? TOP_STYLE;
}
