/**
 * Mulberry32. Seeded so a run is reproducible from its seed, which makes
 * bugs in food placement and hazard spawning actually chaseable.
 */
export function nextRandom(state: number): { value: number; state: number } {
  const s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: s };
}

/** Advances `holder.rngState` in place and returns a float in [0, 1). */
export function rand(holder: { rngState: number }): number {
  const { value, state } = nextRandom(holder.rngState);
  holder.rngState = state;
  return value;
}

export function randInt(holder: { rngState: number }, maxExclusive: number): number {
  return Math.floor(rand(holder) * maxExclusive);
}

export function pick<T>(holder: { rngState: number }, items: readonly T[]): T {
  return items[randInt(holder, items.length)];
}
