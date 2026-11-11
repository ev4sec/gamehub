/**
 * Code Reader engine invariants.
 *
 * The course is data, and the ways data goes wrong are quiet: a label that
 * points at the wrong line, a question with no right answer, a term nobody
 * defined. Each of those is checked here. Whether the snippets are valid code
 * is checked separately, by the real language tools, in `verify:levels`.
 */
import {
  GLOSSARY,
  LESSONS,
  STAGES,
  TERM_COUNT,
  choiceOrder,
  gradeChoice,
  gradeFind,
  lessonById,
  lessonsIn,
  linesOf,
  regionAt,
  regionsOf,
  resolve,
  termsMet,
} from '../../src/games/codereader/engine/course';
import type { Lesson } from '../../src/games/codereader/engine/types';
import { markSolved, type SaveData } from '../../src/games/codereader/save';
import { check, expect } from '../checks';

function dataChecks(): void {
  const ids = new Set<string>();
  const stageIds = STAGES.map((s) => s.id);

  for (const lesson of LESSONS) {
    const at = lesson.id;
    expect(!ids.has(at), `${at}: id is unique`);
    ids.add(at);
    expect(stageIds.includes(lesson.stage), `${at}: stage exists`);
    expect(lesson.intro.length > 0 && lesson.takeaway.length > 0, `${at}: has an intro and a takeaway`);
    expect(!/\u2014/.test(JSON.stringify(lesson)), `${at}: no em dash in prose`);

    let regions: ReturnType<typeof resolve>;
    try {
      regions = resolve(lesson);
    } catch (e) {
      expect(false, `${at}: ${(e as Error).message}`);
      continue;
    }
    const lineCount = linesOf(lesson.code).length;
    const regionIds = new Set(regions.map((r) => r.id));
    expect(regionIds.size === regions.length, `${at}: region ids are unique`);
    for (const r of regions) {
      expect(r.from >= 1 && r.last >= r.from && r.last <= lineCount, `${at}/${r.id}: lines are in range`);
      expect(GLOSSARY[r.term] !== undefined, `${at}/${r.id}: term ${r.term} is defined`);
      expect(r.note.length > 0 && r.kind.length > 0, `${at}/${r.id}: has a label and a note`);
    }

    expect(lesson.steps.length >= 3, `${at}: has at least three questions`);
    if (lesson.tour) expect(regions.length >= 3, `${at}: a walkthrough has something to walk through`);
    for (const [i, step] of lesson.steps.entries()) {
      if (step.kind === 'find') {
        const target = regions.find((r) => r.id === step.target);
        expect(target !== undefined, `${at} step ${i}: target exists`);
        if (!target) continue;
        expect(gradeFind(lesson, step, target.from).pass, `${at} step ${i}: the target line grades right`);
        // Some line outside the target must exist, or the question has no wrong answer.
        const outside = Array.from({ length: lineCount }, (_, n) => n + 1).filter(
          (n) => n < target.from || n > target.last,
        );
        expect(outside.length > 0, `${at} step ${i}: there is a line to get wrong`);
        for (const line of outside) {
          const verdict = gradeFind(lesson, step, line);
          expect(!verdict.pass && verdict.why.includes(step.miss), `${at} step ${i}: line ${line} is refused with a reason`);
        }
        continue;
      }
      if (step.kind === 'name') expect(regionIds.has(step.region), `${at} step ${i}: region exists`);
      if (step.kind === 'ask' && step.focus) expect(regionIds.has(step.focus), `${at} step ${i}: focus exists`);
      const right = step.choices.filter((c) => c.why === '');
      expect(right.length === 1, `${at} step ${i}: exactly one right choice`);
      expect(step.choices.length >= 3, `${at} step ${i}: at least three choices`);
      step.choices.forEach((c, n) => {
        const verdict = gradeChoice(step.choices, n);
        expect(verdict.pass === (c.why === ''), `${at} step ${i}: choice ${n} grades as written`);
      });
    }
  }

  for (const stage of STAGES) {
    expect(lessonsIn(stage.id).length >= 2, `stage ${stage.id} has at least two lessons`);
    expect(stage.canNow.length > 0, `stage ${stage.id} says what it unlocks`);
  }
  const order = LESSONS.map((l) => stageIds.indexOf(l.stage));
  check(order.every((n, i) => i === 0 || n >= order[i - 1]), 'lessons are listed in stage order');
  check(LESSONS.some((l) => !l.tour), 'some lessons drop the walkthrough');
  check(LESSONS.slice(0, 5).every((l) => l.tour), 'and the opening lessons all have one');

  const used = new Set(LESSONS.flatMap((l) => l.regions.map((r) => r.term)));
  check(Object.keys(GLOSSARY).every((k) => used.has(k)), 'every glossary term is taught by some lesson');
  check(TERM_COUNT === used.size && TERM_COUNT > 40, 'the term count matches what the lessons teach');
}

function behaviorChecks(): void {
  const lesson = lessonById('func-1') as Lesson;
  const regions = regionsOf(lesson);
  const param = regions.find((r) => r.id === 'param');
  check(param?.span !== undefined && lesson.code.split('\n')[param.from - 1].slice(...param.span) === 'port', 'a token region knows exactly which characters it covers');
  const body = regions.find((r) => r.id === 'body');
  check(body !== undefined && body.last > body.from, 'a range region spans several lines');

  const ret = regions.find((r) => r.id === 'ret');
  check(regionAt(regions, ret?.from ?? 0)?.id === 'ret', 'the most specific region wins where two overlap');

  const find = lesson.steps.find((s) => s.kind === 'find');
  if (find?.kind === 'find') {
    const wrong = gradeFind(lesson, find, 1);
    check(!wrong.pass && wrong.why.startsWith('Line 1 is part of the '), 'a wrong line is told what that line actually is');
  }

  let threw = false;
  try {
    resolve({ ...lesson, regions: [{ ...lesson.regions[0], at: 'no such text' }] });
  } catch {
    threw = true;
  }
  check(threw, 'an anchor that matches nothing fails loudly');
  threw = false;
  try {
    resolve({ ...lesson, regions: [{ ...lesson.regions[0], at: 'port', token: undefined }] });
  } catch {
    threw = true;
  }
  check(threw, 'and so does one that matches more than one line');

  check(choiceOrder(3, 0).join() === '0,1,2' && choiceOrder(3, 4).join() === '1,2,0', 'choices rotate by visit');

  check(termsMet([]).length === 0, 'the field guide starts empty');
  const first = termsMet(['file-1']);
  check(first.length > 0 && first.every((t) => t.lessonId === 'file-1'), 'solving a lesson adds its terms');
  check(first.every((t) => t.example.length > 0 && t.definition.length > 0), 'each with a definition and the code it was met on');
  const all = termsMet(LESSONS.map((l) => l.id));
  check(all.length === TERM_COUNT, 'solving everything fills the field guide');
  check(new Set(all.map((t) => t.key)).size === all.length, 'with each term listed once, where it was first met');

  const empty: SaveData = { solved: [], cards: {} };
  const once = markSolved(empty, 'file-1', 'assisted', 1000);
  const twice = markSolved(once, 'file-1', 'clean', 2000);
  check(once.cards['file-1'].box === 0 && twice.cards['file-1'].box === 1, 'a lesson with a miss starts at strength 0 and a clean pass moves it up');
  check(twice.solved.length === 1 && empty.solved.length === 0, 'without duplicating it or touching the save it was given');
}

export function codereaderEngineChecks(): void {
  dataChecks();
  behaviorChecks();
}
