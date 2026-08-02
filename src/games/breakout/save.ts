import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so breakout data lives under `gamehub.breakout.v1`. */
const GAME_ID = 'breakout';

export interface SaveData {
  bests: Record<Mode, number>;
  /** Deepest Endless wave reached, which is the number that game is about. */
  bestWave: number;
  lifetimeBricks: number;
  runs: number;
  sound: boolean;
}

const EMPTY: SaveData = {
  bests: { classic: 0, endless: 0, sudden: 0 },
  bestWave: 0,
  lifetimeBricks: 0,
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
  bricks: number;
}

export function recordRun(data: SaveData, run: RunResult): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  const isBest = run.score > previous;

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: Math.max(previous, run.score) },
    bestWave: Math.max(data.bestWave, run.mode === 'endless' ? run.level + 1 : 0),
    lifetimeBricks: data.lifetimeBricks + run.bricks,
    runs: data.runs + 1,
  };

  return { next, isBest };
}
