import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so this lives under `gamehub.asteroids.v1`. */
const GAME_ID = 'asteroids';

export interface SaveData {
  bests: Record<Mode, number>;
  bestWave: number;
  lifetimeRocks: number;
  runs: number;
  sound: boolean;
  /** Swaps the two thumb zones. Two lines of state for a scheme that is
   *  otherwise unusable for a meaningful share of players. */
  leftHanded: boolean;
}

const EMPTY: SaveData = {
  bests: { classic: 0, storm: 0, lone: 0 },
  bestWave: 0,
  lifetimeRocks: 0,
  runs: 0,
  sound: true,
  leftHanded: false,
};

/** Always merged against defaults; the stored shape is never trusted. */
export function loadSave(): SaveData {
  const parsed = readSave(GAME_ID) as Partial<SaveData> | null;
  if (!parsed) return { ...EMPTY, bests: { ...EMPTY.bests } };
  return {
    ...EMPTY,
    ...parsed,
    bests: { ...EMPTY.bests, ...(parsed.bests ?? {}) },
  };
}

export function writeSave(data: SaveData): void {
  writeNamespaced(GAME_ID, data);
}

export interface RunResult {
  mode: Mode;
  score: number;
  wave: number;
  rocks: number;
}

export function recordRun(data: SaveData, run: RunResult): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  const isBest = run.score > previous;

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: Math.max(previous, run.score) },
    bestWave: Math.max(data.bestWave, run.wave),
    lifetimeRocks: data.lifetimeRocks + run.rocks,
    runs: data.runs + 1,
  };

  return { next, isBest };
}
