import { readSave, writeSave as writeNamespaced } from '../../platform/save';

/** Matches the registry id, so sokoban data lives under `gamehub.sokoban.v1`. */
const GAME_ID = 'sokoban';

export interface Best {
  moves: number;
  pushes: number;
}

export interface SaveData {
  /** Keyed by level index, as a string because that is what JSON gives back. */
  bests: Record<string, Best>;
  sound: boolean;
}

const EMPTY: SaveData = { bests: {}, sound: true };

/** Always merged against defaults; the stored shape is never trusted. */
export function loadSave(): SaveData {
  const parsed = readSave(GAME_ID) as Partial<SaveData> | null;
  if (!parsed) return { ...EMPTY, bests: {} };
  return { ...EMPTY, ...parsed, bests: { ...(parsed.bests ?? {}) } };
}

export function writeSave(data: SaveData): void {
  writeNamespaced(GAME_ID, data);
}

export function bestFor(data: SaveData, levelIndex: number): Best | null {
  return data.bests[String(levelIndex)] ?? null;
}

export function solvedCount(data: SaveData): number {
  return Object.keys(data.bests).length;
}

/**
 * Folds a solved level into the save.
 *
 * Fewer moves wins, and pushes break the tie. Both are recorded because
 * Sokoban players optimise for one or the other and the pair is the score.
 */
export function recordSolve(
  data: SaveData,
  levelIndex: number,
  result: Best,
): { next: SaveData; isBest: boolean } {
  const previous = bestFor(data, levelIndex);
  const isBest =
    !previous ||
    result.moves < previous.moves ||
    (result.moves === previous.moves && result.pushes < previous.pushes);

  if (!isBest) return { next: data, isBest: false };

  return {
    next: { ...data, bests: { ...data.bests, [String(levelIndex)]: result } },
    isBest: true,
  };
}
