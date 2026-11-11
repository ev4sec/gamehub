/**
 * Code Lab engine invariants that need no Python.
 *
 * Whether the answers are *right* is the job of `npm run verify:levels`, which
 * runs them in a real interpreter. This covers the rest: the data is shaped so
 * the UI can always render it, the pure graders agree with the data, wrong
 * answers get a reason, and the review schedule moves the way it claims to.
 */
import {
  choiceOrder,
  gradeChoice,
  gradePredict,
  gradeWrite,
  normalize,
  problemFor,
} from '../../src/games/codelab/engine/grade';
import {
  CORE,
  LEVELS,
  PRACTICE,
  TRACKS,
  WORLDS,
  coreIn,
  levelById,
  levelsIn,
  trackOf,
} from '../../src/games/codelab/engine/levels';
import { COMPILED } from '../../src/games/codelab/engine/tsCompiled';
import { formatLog } from '../../src/games/codelab/runner/jsConsole';
import { createJsRunner } from '../../src/games/codelab/runner/jsRunner';
import { INTERVALS, MAX_BOX, dueIds, nextDue, record } from '../../src/platform/spacedReview';
import type { Level } from '../../src/games/codelab/engine/types';
import type { PyRunner, RunResult } from '../../src/games/codelab/runner/types';
import { markSolved, type SaveData } from '../../src/games/codelab/save';
import { check, expect } from '../checks';

/** Answers each run from a script, so the write grader can be exercised without Python. */
function scriptedRunner(replies: Partial<RunResult>[]): PyRunner & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    run(code) {
      calls.push(code);
      const reply = replies[calls.length - 1] ?? {};
      return Promise.resolve({ stdout: '', error: '', errorLine: 0, timedOut: false, ...reply });
    },
    trace: () => Promise.reject(new Error('not used here')),
    inspect: () => Promise.reject(new Error('not used here')),
    dispose() {},
  };
}

function dataChecks(): void {
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
      const visits = (level.variants?.length ?? 0) + 1;
      for (let v = 0; v < visits; v++) {
        const problem = problemFor(level, v);
        expect(gradePredict(problem, problem.answer).pass, `${level.id}/${v}: its own answer grades correct`);
        const wrong = gradePredict(problem, 'definitely wrong');
        expect(!wrong.pass, `${level.id}/${v}: a wrong answer grades wrong`);
        expect(wrong.notes.length > 0, `${level.id}/${v}: a wrong answer gets a reason`);
        expect(!gradePredict(problem, '').pass, `${level.id}/${v}: an empty answer grades wrong`);
      }
      expect(
        problemFor(level, visits).code === level.code,
        `${level.id}: visits wrap back round to the original`,
      );
    }
    if (level.kind === 'write' || level.kind === 'fix') {
      expect((level.tests?.length ?? 0) > 0, `${level.id}: has tests`);
      expect(level.solution !== undefined, `${level.id}: has a solution`);
    }
    if (level.kind === 'locate' || level.kind === 'read') {
      const n = level.choices?.length ?? 0;
      expect(n >= 2, `${level.id}: has choices`);
      expect(gradeChoice(level, level.correct ?? -1).pass, `${level.id}: its correct index grades correct`);
      expect(!gradeChoice(level, -1).pass, `${level.id}: no pick grades wrong`);
      for (let i = 0; i < n; i++) {
        if (i === level.correct) continue;
        expect(gradeChoice(level, i).why.length > 0, `${level.id}: choice ${i} says why it is wrong`);
      }
    }
  }

  for (const w of WORLDS) {
    expect(levelsIn(w.id).length > 0, `world ${w.id} has levels`);
  }
  check(LEVELS.some((l) => l.kind === 'fix'), 'there are fix levels');
}

async function trackChecks(): Promise<void> {
  const split = TRACKS.map((t) => coreIn(t.id).length);
  check(split.every((n) => n > 0), 'every track has a reading path');
  check(split.reduce((a, b) => a + b, 0) === CORE.length, 'and the tracks divide the reading levels between them');
  check(PRACTICE.every((l) => trackOf(l) === 'python'), 'writing practice exists only on the Python track');
  check(
    LEVELS.filter((l) => trackOf(l) === 'ts' && l.kind === 'predict').every((l) => COMPILED[l.code] !== undefined),
    'every TypeScript predict level has a runnable form',
  );

  check(formatLog(['a', 1, true]) === 'a 1 true', 'logged values are joined by spaces, text unquoted');
  check(formatLog([[1, 'x'], { a: null }]) === "[ 1, 'x' ] { a: null }", 'arrays and objects are shown the way Node shows them');
  check(formatLog([[], {}, undefined]) === '[] {} undefined', 'including empty ones');

  const first = levelById('tsb-1') as Level;
  const run = await createJsRunner().run(first.code);
  check(run.error === '' && normalize(run.stdout) === normalize(first.answer ?? ''), 'a TypeScript level runs and logs its stored answer');
  const unknown = await createJsRunner().run('console.log(1)');
  check(unknown.error !== '' && unknown.stdout === '', 'code that is not one of the lab\'s own snippets is refused, not run');

  const ts = gradePredict({ code: '', answer: 'true\nnull', mistakes: [], explain: '' }, 'True', 'ts');
  check(ts.notes.some((n) => n.includes('This logs 2 lines') && n.includes('console.log')), 'a miss on the TypeScript track is explained in its own terms');
}

function predictChecks(): void {
  check(normalize('a  \r\nb \n') === 'a\nb', 'normalize strips trailing space and CRLF');
  check(normalize('\n\n x\n') === 'x', 'normalize trims blank edges');

  const first = problemFor(levelById('basics-1') as Level, 0);
  const known = gradePredict(first, '24');
  check(
    !known.pass && known.notes[0] === first.mistakes[0].why,
    'an anticipated wrong answer gets its own explanation',
  );

  const lines = { code: '', answer: 'ADA!\n3\na', mistakes: [], explain: '' };
  const short = gradePredict(lines, 'ADA!\n3');
  check(short.notes.some((n) => n.includes('prints 3 lines') && n.includes('typed 2')), 'a short answer is told the line count');
  check(short.marks.join() === 'match,match', 'lines that are right are marked right');

  const second = gradePredict(lines, 'ADA!\n4\na');
  check(second.marks.join() === 'match,differs,match', 'only the wrong line is marked wrong');
  check(second.notes.length > 0, 'and there is still something said about it');
  check(!second.notes.join(' ').includes('3'), 'without giving the answer away');

  const long = gradePredict(lines, 'ADA!\n3\na\nb');
  check(long.marks[3] === 'extra', 'a line past the end is marked extra');

  const quoted = gradePredict(lines, '"ADA!"\n3\n"a"');
  check(quoted.notes.some((n) => n.includes('without the quotes')), 'quoted text is recognized as a near miss');

  const cased = gradePredict({ ...lines, answer: 'True\nNone' }, 'true\nnone');
  check(cased.notes.some((n) => n.includes('capital')), 'wrong capitalization is recognized as a near miss');

  const spaced = gradePredict({ ...lines, answer: '[1, 2, 3]' }, '[1,2,3]');
  check(spaced.notes.some((n) => n.includes('spacing')), 'wrong spacing is recognized as a near miss');

  check(choiceOrder(3, 0).join() === '0,1,2', 'first visit shows choices as written');
  check(choiceOrder(3, 1).join() === '1,2,0', 'a later visit rotates them');
  check(choiceOrder(4, 6).slice().sort().join() === '0,1,2,3', 'a rotation still shows every choice once');
}

async function writeChecks(): Promise<void> {
  const level = levelById('functions-3') as Level;
  const tests = level.tests?.length ?? 0;

  const mixed = scriptedRunner([
    { stdout: 'True\n' },
    { stdout: 'True\n' },
    { stdout: 'True\n' },
    { stdout: 'False\n' },
    { stdout: '', error: 'TypeError: nope', errorLine: 2 },
  ]);
  const verdict = await gradeWrite(level, 'def is_valid_port(p):\n    return p > 0', mixed);
  check(!verdict.pass, 'a partly right answer fails');
  check(verdict.results.length === tests && mixed.calls.length === tests, 'every test runs, not only up to the first failure');
  check(verdict.results.map((r) => r.pass).join() === 'true,true,false,true,false', 'each test reports its own result');
  check(verdict.results[2].expected === 'False' && verdict.results[2].got === 'True', 'a failed test carries expected and got');
  check(verdict.results[4].error === 'TypeError: nope' && verdict.results[4].errorLine === 2, 'an error carries its line');

  const outside = scriptedRunner([{ error: 'NameError: x', errorLine: 9 }]);
  const far = await gradeWrite(level, 'pass', outside);
  check(far.results[0].errorLine === 0, 'an error raised in the appended test call claims no line');

  const hung = scriptedRunner([{ stdout: 'True\n' }, { timedOut: true }]);
  const stuck = await gradeWrite(level, 'x', hung);
  check(stuck.timedOut && !stuck.pass && hung.calls.length === 2, 'a hung run stops the remaining tests');

  const forbidden = scriptedRunner([]);
  const blocked = await gradeWrite(levelById('collections-3') as Level, 'def total(nums):\n    return sum(nums)', forbidden);
  check(blocked.blocked.length > 0 && forbidden.calls.length === 0, 'a forbidden shortcut is refused before anything runs');
}

function reviewChecks(): void {
  const t0 = 1_000_000;
  const first = record(undefined, 'clean', t0);
  check(first.box === 1 && first.due === t0 + INTERVALS[1] && first.visits === 1, 'a clean first solve lands in box 1');

  let card = first;
  for (let i = 0; i < 10; i++) card = record(card, 'clean', t0);
  check(card.box === MAX_BOX && card.due === t0 + INTERVALS[MAX_BOX], 'clean solves climb and stop at the top box');
  check(INTERVALS.every((gap, i) => i === 0 || gap > INTERVALS[i - 1]), 'each box waits longer than the one below');

  const dropped = record(card, 'assisted', t0);
  check(dropped.box === 0 && dropped.due === t0 + INTERVALS[0], 'an assisted solve drops to box 0 and comes back soon');
  check(dropped.visits === card.visits + 1, 'every solve counts as a visit');
  check(record(undefined, 'assisted', t0).box === 0, 'an assisted first solve starts at box 0');

  const cards = {
    a: { box: 1, due: t0 - 5, visits: 1 },
    b: { box: 2, due: t0 - 50, visits: 2 },
    c: { box: 1, due: t0 + 100, visits: 1 },
  };
  check(dueIds(cards, ['a', 'b', 'c', 'unsolved'], t0).join() === 'b,a', 'due levels come longest overdue first, and only solved ones');
  check(nextDue(cards, t0) === t0 + 100, 'the next due time is the nearest future one');
  check(nextDue({}, t0) === null, 'nothing scheduled means no next due time');

  const empty: SaveData = { solved: [], hints: {}, cards: {}, track: 'python' };
  const once = markSolved(empty, 'basics-1', 2, 'assisted', t0);
  const twice = markSolved(once, 'basics-1', 0, 'clean', t0);
  check(twice.solved.length === 1 && twice.hints['basics-1'] === 0, 'solving again does not duplicate, and keeps the fewest hints');
  check(twice.cards['basics-1'].box === 1 && twice.cards['basics-1'].visits === 2, 'and moves the card');
  check(once.cards['basics-1'].box === 0 && empty.solved.length === 0, 'without touching the save it was given');
}

export async function codelabEngineChecks(): Promise<void> {
  dataChecks();
  await trackChecks();
  predictChecks();
  await writeChecks();
  reviewChecks();
}
