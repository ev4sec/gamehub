/**
 * TypeScript to JavaScript for the lab's predict snippets, shared by the
 * generator and the verifier so the two cannot disagree about what "compiled"
 * means.
 */
import { transformSync } from 'esbuild';
import { problemFor } from '../src/games/codelab/engine/grade';
import { LEVELS, trackOf } from '../src/games/codelab/engine/levels';

export function compile(source: string): string {
  // Types are erased and nothing else is rewritten: the target is new enough
  // that what runs is line for line what the level shows.
  return transformSync(source, { loader: 'ts', target: 'es2022' }).code;
}

/** Every snippet a TypeScript predict level can show, keyed by its exact source. */
export function compileAll(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const level of LEVELS) {
    if (trackOf(level) !== 'ts' || level.kind !== 'predict') continue;
    const visits = (level.variants?.length ?? 0) + 1;
    for (let visit = 0; visit < visits; visit++) {
      const { code } = problemFor(level, visit);
      out[code] = compile(code);
    }
  }
  return out;
}
