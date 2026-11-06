/**
 * Code Lab engine invariants that need no Python.
 *
 * Whether the answers are *right* is the job of `npm run verify:levels`, which
 * runs them in a real interpreter. This covers the rest: the data is shaped so
 * the UI can always render it, and the pure graders agree with the data.
 */
import { gradeChoice, gradePredict, normalize } from '../../src/games/codelab/engine/grade';
import { LEVELS, WORLDS, levelsIn } from '../../src/games/codelab/engine/levels';
import { check, expect } from '../checks';

export function codelabEngineChecks(): void {
  const worldIds = new Set(WORLDS.map((w) => w.id));
  const seen = new Set<string>();

  for (const level of LEVELS) {
    expect(!seen.has(level.id), `${level.id}: id is unique`);
    seen.add(level.id);
    expect(worldIds.has(level.world), `${level.id}: world exists`);
    expect(level.hints.length > 0, `${level.id}: has hints`);
    expect(level.explain.length > 0, `${level.id}: has an explanation`);
    expect(!/\u2014/.test(JSON.stringify(level)), `${level.id}: no em dash in prose`);

    if (level.kind === 'predict') {
      expect(level.answer !== undefined, `${level.id}: predict has an answer`);
      expect(gradePredict(level, level.answer ?? ''), `${level.id}: its own answer grades correct`);
      expect(!gradePredict(level, 'definitely wrong'), `${level.id}: a wrong answer grades wrong`);
    }
    if (level.kind === 'write') {
      expect((level.tests?.length ?? 0) > 0, `${level.id}: write has tests`);
      expect(level.solution !== undefined, `${level.id}: write has a solution`);
    }
    if (level.kind === 'locate' || level.kind === 'read') {
      const n = level.choices?.length ?? 0;
      expect(n >= 2, `${level.id}: has choices`);
      expect(gradeChoice(level, level.correct ?? -1), `${level.id}: its correct index grades correct`);
      expect(!gradeChoice(level, -1), `${level.id}: no pick grades wrong`);
    }
  }

  for (const w of WORLDS) {
    expect(levelsIn(w.id).length > 0, `world ${w.id} has levels`);
  }

  check(normalize('a  \r\nb \n') === 'a\nb', 'normalize strips trailing space and CRLF');
  check(normalize('\n\n x\n') === 'x', 'normalize trims blank edges');
}
