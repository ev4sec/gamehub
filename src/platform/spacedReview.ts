/**
 * Spaced review, as Leitner boxes.
 *
 * Solving a level once proves it could be done with the lesson fresh on
 * screen. Whether it stuck is only known by asking again later, so every
 * solved level carries a strength and a time it is next due. A clean solve
 * moves it up a box and further out; anything else sends it back to the start
 * and brings it round again within the same sitting.
 */

export interface Card {
  /** 0 to MAX_BOX. How many clean solves in a row, capped. */
  box: number;
  /** Epoch milliseconds when this level is next worth asking. */
  due: number;
  /** Completed visits. Picks the variant and the choice order for the next one. */
  visits: number;
}

/** How a solve was reached. */
export type Outcome = 'clean' | 'assisted';

export const MAX_BOX = 4;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Wait before a level in each box is due again. Box 0 comes back the same sitting. */
export const INTERVALS = [10 * MINUTE, DAY, 3 * DAY, 7 * DAY, 21 * DAY];

export function record(card: Card | undefined, outcome: Outcome, now: number): Card {
  const visits = (card?.visits ?? 0) + 1;
  const box = outcome === 'clean' ? Math.min((card?.box ?? 0) + 1, MAX_BOX) : 0;
  return { box, due: now + INTERVALS[box], visits };
}

/** Ids due at `now`, the longest overdue first. */
export function dueIds(cards: Record<string, Card>, order: string[], now: number): string[] {
  return order
    .filter((id) => cards[id] !== undefined && cards[id].due <= now)
    .sort((a, b) => cards[a].due - cards[b].due);
}

/** A wait in words: minutes under an hour, hours under a day, then days. Rounded up. */
export function waitText(ms: number): string {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return unit(minutes, 'minute');
  const hours = Math.ceil(ms / (60 * MINUTE));
  if (hours < 24) return unit(hours, 'hour');
  return unit(Math.ceil(ms / DAY), 'day');
}

/** When the next card comes due, or null when nothing is scheduled. */
export function nextDue(cards: Record<string, Card>, now: number): number | null {
  const later = Object.values(cards)
    .map((c) => c.due)
    .filter((due) => due > now);
  return later.length === 0 ? null : Math.min(...later);
}
