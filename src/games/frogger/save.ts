import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so this lives under `gamehub.frogger.v1`. */
const GAME_ID = 'frogger';

export interface SaveData {
  bests: Record<Mode, number>;
  /** Deepest level reached, which is the number this game is really about. */
  bestLevel: number;
  lifetimeHomes: number;
  runs: number;
  sound: boolean;
}

const EMPTY: SaveData = {
  bests: { classic: 0, rush: 0, gentle: 0 },
  bestLevel: 0,
  lifetimeHomes: 0,
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
  level: number;
  homes: number;
}

export function recordRun(data: SaveData, run: RunResult): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  const isBest = run.score > previous;

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: Math.max(previous, run.score) },
    bestLevel: Math.max(data.bestLevel, run.level),
    lifetimeHomes: data.lifetimeHomes + run.homes,
    runs: data.runs + 1,
  };

  return { next, isBest };
}
