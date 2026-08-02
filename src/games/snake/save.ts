import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so snake's data lives under `gamehub.snake.v1`. */
const GAME_ID = 'snake';

export interface SaveData {
  bests: Record<Mode, number>;
  /** Best maze level reached, for bragging rights on the menu. */
  bestLevel: number;
  lifetimeApples: number;
  runs: number;
  skin: string;
  sound: boolean;
}

const EMPTY: SaveData = {
  bests: { endless: 0, timeAttack: 0, maze: 0, rival: 0 },
  bestLevel: 0,
  lifetimeApples: 0,
  runs: 0,
  skin: 'emerald',
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
  apples: number;
  level: number;
}

/** Folds a finished run into the save file and reports whether it set a best. */
export function recordRun(
  data: SaveData,
  run: RunResult,
): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  const isBest = run.score > previous;

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: Math.max(previous, run.score) },
    bestLevel: Math.max(data.bestLevel, run.mode === 'maze' ? run.level : 0),
    lifetimeApples: data.lifetimeApples + run.apples,
    runs: data.runs + 1,
  };

  return { next, isBest };
}
