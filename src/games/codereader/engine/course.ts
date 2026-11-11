import { GLOSSARY } from './glossary';
import { LESSONS, STAGES } from './lessons';
import type { Choice, Lesson, Region, Step, Term } from './types';

export { GLOSSARY, LESSONS, STAGES };

export function linesOf(code: string): string[] {
  return code.replace(/\n$/, '').split('\n');
}

function lineWith(lines: string[], text: string, from: number, lesson: string, what: string): number {
  const hits = lines.map((l, i) => (l.includes(text) ? i + 1 : 0)).filter((n) => n >= from);
  if (hits.length !== 1) {
    throw new Error(`${lesson}: ${what} ${JSON.stringify(text)} matches ${hits.length} lines, not 1`);
  }
  return hits[0];
}

/** Works out where each of a lesson's regions sits. Throws on any anchor that is not exact. */
export function resolve(lesson: Lesson): Region[] {
  const lines = linesOf(lesson.code);
  return lesson.regions.map((r) => {
    const from = lineWith(lines, r.at, 1, lesson.id, `region ${r.id} starts at`);
    const last = r.to === undefined ? from : lineWith(lines, r.to, from, lesson.id, `region ${r.id} ends at`);
    if (r.token === undefined) return { ...r, from, last };
    const start = lines[from - 1].indexOf(r.token);
    if (start < 0 || last !== from) {
      throw new Error(`${lesson.id}: region ${r.id} token ${JSON.stringify(r.token)} is not on its line`);
    }
    return { ...r, from, last, span: [start, start + r.token.length] };
  });
}

const resolved = new Map<string, Region[]>();

/** Resolved once per lesson. The code never changes while the page is open. */
export function regionsOf(lesson: Lesson): Region[] {
  let regions = resolved.get(lesson.id);
  if (!regions) {
    regions = resolve(lesson);
    resolved.set(lesson.id, regions);
  }
  return regions;
}

/** The smallest region covering a line, which is the most specific thing to call it. */
export function regionAt(regions: Region[], line: number, except?: string): Region | undefined {
  return regions
    .filter((r) => r.id !== except && r.from <= line && line <= r.last)
    .sort((a, b) => a.last - a.from - (b.last - b.from) || (a.span ? -1 : 1))[0];
}

export interface Verdict {
  pass: boolean;
  /** Why it is wrong. Empty on a pass. */
  why: string;
}

/**
 * A wrong line is answered with what that line actually is, when the lesson
 * has a name for it, and then with the step's own pointer toward the right one.
 */
export function gradeFind(lesson: Lesson, step: Extract<Step, { kind: 'find' }>, line: number): Verdict {
  const regions = regionsOf(lesson);
  const target = regions.find((r) => r.id === step.target);
  if (target && target.from <= line && line <= target.last) return { pass: true, why: '' };
  const here = regionAt(regions, line, step.target);
  const whatItIs = here ? `Line ${line} is part of the ${here.kind.toLowerCase()}. ` : '';
  return { pass: false, why: `${whatItIs}${step.miss}` };
}

export function gradeChoice(choices: Choice[], picked: number): Verdict {
  const choice = choices[picked];
  if (!choice) return { pass: false, why: '' };
  return { pass: choice.why === '', why: choice.why };
}

/** Rotated per visit, so the right answer is not always where it was last time. */
export function choiceOrder(count: number, visit: number): number[] {
  const shift = count === 0 ? 0 : visit % count;
  return Array.from({ length: count }, (_, i) => (i + shift) % count);
}

export function lessonsIn(stage: string): Lesson[] {
  return LESSONS.filter((l) => l.stage === stage);
}

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export interface MetTerm extends Term {
  key: string;
  /** The line of code it was first pointed out on. */
  example: string;
  lessonId: string;
  lessonTitle: string;
}

/**
 * The field guide: every term from the lessons solved so far, in the order
 * the course introduces them, each with the line it was first met on.
 */
export function termsMet(solved: string[]): MetTerm[] {
  const met: MetTerm[] = [];
  const seen = new Set<string>();
  for (const lesson of LESSONS) {
    if (!solved.includes(lesson.id)) continue;
    const lines = linesOf(lesson.code);
    for (const region of regionsOf(lesson)) {
      const term = GLOSSARY[region.term];
      if (!term || seen.has(region.term)) continue;
      seen.add(region.term);
      met.push({
        ...term,
        key: region.term,
        example: region.token ?? lines[region.from - 1].trim(),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
      });
    }
  }
  return met;
}

/** How many distinct terms the whole course teaches. */
export const TERM_COUNT = new Set(LESSONS.flatMap((l) => l.regions.map((r) => r.term))).size;

/** The lesson that introduces a term, in course order. */
export function firstLessonFor(term: string): Lesson | undefined {
  return LESSONS.find((l) => l.regions.some((r) => r.term === term));
}
