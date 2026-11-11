import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import { MAX_BOX, record, type Card, type Outcome } from '../../platform/spacedReview';
import type { Track } from './engine/types';

/** Matches the registry id, so this data lives under `gamehub.codelab.v1`. */
const GAME_ID = 'codelab';

export interface SaveData {
  solved: string[];
  /** Fewest hints ever opened on a level, so a level can show whether it was clean. */
  hints: Record<string, number>;
  /** Review state per solved level. */
  cards: Record<string, Card>;
  /** The track the menu was last showing. */
  track: Track;
}

function readCard(raw: unknown): Card | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { box, due, visits } = raw as Record<string, unknown>;
  if (typeof box !== 'number' || typeof due !== 'number' || typeof visits !== 'number') return null;
  if (!Number.isFinite(box) || !Number.isFinite(due) || !Number.isFinite(visits)) return null;
  return {
    box: Math.max(0, Math.min(MAX_BOX, Math.floor(box))),
    due,
    visits: Math.max(0, Math.floor(visits)),
  };
}

/** Always merged against defaults; the stored shape is never trusted. */
export function loadSave(): SaveData {
  const parsed = readSave(GAME_ID) as Partial<SaveData> | null;
  if (!parsed) return { solved: [], hints: {}, cards: {}, track: 'python' };

  const solved = Array.isArray(parsed.solved)
    ? parsed.solved.filter((s) => typeof s === 'string')
    : [];
  const cards: Record<string, Card> = {};
  if (typeof parsed.cards === 'object' && parsed.cards !== null) {
    for (const [id, raw] of Object.entries(parsed.cards)) {
      const card = readCard(raw);
      if (card) cards[id] = card;
    }
  }
  // A level solved before review existed has never been asked twice. It is
  // due now, at the lowest strength that still counts as solved.
  for (const id of solved) {
    if (!cards[id]) cards[id] = { box: 1, due: 0, visits: 1 };
  }

  return {
    solved,
    hints: typeof parsed.hints === 'object' && parsed.hints !== null ? { ...parsed.hints } : {},
    cards,
    track: parsed.track === 'ts' ? 'ts' : 'python',
  };
}

export function writeSave(data: SaveData): void {
  writeNamespaced(GAME_ID, data);
}

export function markSolved(
  data: SaveData,
  id: string,
  hintsUsed: number,
  outcome: Outcome,
  now: number,
): SaveData {
  return {
    ...data,
    solved: data.solved.includes(id) ? data.solved : [...data.solved, id],
    hints: { ...data.hints, [id]: Math.min(data.hints[id] ?? hintsUsed, hintsUsed) },
    cards: { ...data.cards, [id]: record(data.cards[id], outcome, now) },
  };
}
