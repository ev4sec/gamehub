/**
 * Mulberry32, seeded so a run is reproducible from its seed.
 *
 * This sits in the platform because every game that wants shuffled input wants
 * the same thing: determinism a failing soak can be replayed from. Snake keeps
 * its own copy under `games/snake/engine/rng.ts`; that engine was ported in
 * whole and the rule for it is to move it rather than rewrite it, so it was
 * left alone instead of being rewired to point here.
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

/** In-place Fisher-Yates, so a shuffle is as reproducible as the rest. */
export function shuffle<T>(holder: { rngState: number }, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(holder, i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}
