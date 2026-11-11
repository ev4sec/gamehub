import { readSave, writeSave as writeNamespaced } from '../../platform/save';
import { MAX_BOX, record, type Card, type Outcome } from '../../platform/spacedReview';

/** Matches the registry id, so this data lives under `gamehub.codereader.v1`. */
const GAME_ID = 'codereader';

export interface SaveData {
  solved: string[];
  /** Review state per solved lesson. */
  cards: Record<string, Card>;
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
  if (!parsed) return { solved: [], cards: {} };

  const cards: Record<string, Card> = {};
  if (typeof parsed.cards === 'object' && parsed.cards !== null) {
    for (const [id, raw] of Object.entries(parsed.cards)) {
      const card = readCard(raw);
      if (card) cards[id] = card;
    }
  }
  // A lesson is solved exactly when it has a card, so the two cannot drift.
  const solved = Array.isArray(parsed.solved)
    ? parsed.solved.filter((s): s is string => typeof s === 'string' && cards[s] !== undefined)
    : [];
  return { solved, cards };
}

export function writeSave(data: SaveData): void {
  writeNamespaced(GAME_ID, data);
}

export function markSolved(data: SaveData, id: string, outcome: Outcome, now: number): SaveData {
  return {
    solved: data.solved.includes(id) ? data.solved : [...data.solved, id],
    cards: { ...data.cards, [id]: record(data.cards[id], outcome, now) },
  };
}
