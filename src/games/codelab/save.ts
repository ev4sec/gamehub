import { readSave, writeSave as writeNamespaced } from '../../platform/save';

/** Matches the registry id, so this data lives under `gamehub.codelab.v1`. */
const GAME_ID = 'codelab';

export interface SaveData {
  solved: string[];
  /** Fewest hints ever opened on a level, so a level can show whether it was clean. */
  hints: Record<string, number>;
}

/** Always merged against defaults; the stored shape is never trusted. */
export function loadSave(): SaveData {
  const parsed = readSave(GAME_ID) as Partial<SaveData> | null;
  if (!parsed) return { solved: [], hints: {} };
  return {
    solved: Array.isArray(parsed.solved) ? parsed.solved.filter((s) => typeof s === 'string') : [],
    hints: typeof parsed.hints === 'object' && parsed.hints !== null ? { ...parsed.hints } : {},
  };
}

export function writeSave(data: SaveData): void {
  writeNamespaced(GAME_ID, data);
}

export function markSolved(data: SaveData, id: string, hintsUsed: number): SaveData {
  return {
    solved: data.solved.includes(id) ? data.solved : [...data.solved, id],
    hints: { ...data.hints, [id]: Math.min(data.hints[id] ?? hintsUsed, hintsUsed) },
  };
}
