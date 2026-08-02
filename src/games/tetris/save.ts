import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import type { Mode } from './engine/types';

/** Matches the registry id, so tetris data lives under `gamehub.tetris.v1`. */
const GAME_ID = 'tetris';

export interface SaveData {
  /**
   * Marathon and Ultra store a score, where more is better. Sprint stores a
   * finishing time in milliseconds, where less is better. Zero means no result
   * yet in either case, which is why nothing here compares against a default
   * of zero without checking the mode first.
   */
  bests: Record<Mode, number>;
  lifetimeLines: number;
  runs: number;
  sound: boolean;
}

const EMPTY: SaveData = {
  bests: { marathon: 0, sprint: 0, ultra: 0 },
  lifetimeLines: 0,
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
  lines: number;
  timeMs: number;
  /** Sprint only: whether the forty lines were actually finished. */
  completed: boolean;
}

export function recordRun(data: SaveData, run: RunResult): { next: SaveData; isBest: boolean } {
  const previous = data.bests[run.mode] ?? 0;
  let best = previous;
  let isBest = false;

  if (run.mode === 'sprint') {
    // An abandoned sprint has no time worth keeping, however far it got.
    if (run.completed) {
      isBest = previous === 0 || run.timeMs < previous;
      if (isBest) best = run.timeMs;
    }
  } else {
    isBest = run.score > previous;
    if (isBest) best = run.score;
  }

  const next: SaveData = {
    ...data,
    bests: { ...data.bests, [run.mode]: best },
    lifetimeLines: data.lifetimeLines + run.lines,
    runs: data.runs + 1,
  };

  return { next, isBest };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  const padded = seconds < 10 ? `0${seconds.toFixed(2)}` : seconds.toFixed(2);
  return `${minutes}:${padded}`;
}

/** The one place that knows a sprint best is a clock and the others are scores. */
export function formatBest(mode: Mode, value: number): string {
  if (!value) return '—';
  return mode === 'sprint' ? formatDuration(value) : value.toLocaleString();
}
