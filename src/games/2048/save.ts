import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so this data lives under `gamehub.2048.v1`. */
const GAME_ID = '2048';

export interface SaveData {
  bests: Record<Mode, number>;
  /** Biggest tile ever made, in any mode. The number players actually quote. */
  bestTile: number;
  runs: number;
  sound: boolean;
}

const EMPTY: SaveData = {
  bests: { classic: 0, petite: 0, grand: 0 },
  bestTile: 0,
  runs: 0,
  sound: true,
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
  highest: number;
}

export function recordRun(data: SaveData, run: RunResult): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  const isBest = run.score > previous;

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: Math.max(previous, run.score) },
    bestTile: Math.max(data.bestTile, run.highest),
    runs: data.runs + 1,
  };

  return { next, isBest };
}
