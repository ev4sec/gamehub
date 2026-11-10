import type { Level, Problem, Track } from './types';
import type { PyRunner } from '../runner/types';

/** Line endings and trailing spaces are noise; everything else must match. */
export function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

/**
 * The code and answer a predict level shows on a given visit. Visit 0 is the
 * level as written; later visits walk the variants and wrap around.
 */
export function problemFor(level: Level, visit: number): Problem {
  const variants = level.variants ?? [];
  const slot = visit % (variants.length + 1);
  if (slot === 0) {
    return {
      code: level.code,
      answer: level.answer ?? '',
      mistakes: level.mistakes ?? [],
      explain: level.explain,
    };
  }
  const v = variants[slot - 1];
  return { code: v.code, answer: v.answer, mistakes: v.mistakes ?? [], explain: v.explain };
}

/**
 * The order choices are shown in on a given visit. Rotated rather than
 * shuffled so a test can say what it will be, and so the right answer is not
 * always in the position it was memorized in.
 */
export function choiceOrder(count: number, visit: number): number[] {
  const shift = count === 0 ? 0 : visit % count;
  return Array.from({ length: count }, (_, i) => (i + shift) % count);
}

export type LineMark = 'match' | 'differs' | 'extra';

export interface PredictVerdict {
  pass: boolean;
  /** Why it is wrong, without giving the answer away. Empty on a pass. */
  notes: string[];
  /** One mark per line the player typed. */
  marks: LineMark[];
  /** How many lines Python prints. */
  expectedLines: number;
}

function stripQuotes(line: string): string {
  return line.replace(/^(['"])(.*)\1$/, '$2');
}

/** The few words that differ between the two languages when a miss is explained. */
const WORDING: Record<Track, { subject: string; call: string; caps: string; list: string }> = {
  python: {
    subject: 'Python prints',
    call: 'print',
    caps: 'Python writes True, False and None with a capital.',
    list: 'list',
  },
  ts: {
    subject: 'This logs',
    call: 'console.log',
    caps: 'JavaScript writes true, false, null and undefined in lowercase.',
    list: 'array',
  },
};

export function gradePredict(problem: Problem, typed: string, track: Track = 'python'): PredictVerdict {
  const words = WORDING[track];
  const want = normalize(problem.answer);
  const got = normalize(typed);
  const wantLines = want.split('\n');
  const gotLines = got === '' ? [] : got.split('\n');
  const marks: LineMark[] = gotLines.map((line, i) =>
    i >= wantLines.length ? 'extra' : line === wantLines[i] ? 'match' : 'differs',
  );
  const base = { marks, expectedLines: wantLines.length };

  if (got === want) return { pass: true, notes: [], ...base };
  if (got === '') {
    return { pass: false, notes: ['Type what you think it prints, then check.'], ...base };
  }

  const known = problem.mistakes.find((m) => normalize(m.answer) === got);
  if (known) return { pass: false, notes: [known.why], ...base };

  const notes: string[] = [];
  if (gotLines.length !== wantLines.length) {
    const n = wantLines.length;
    notes.push(
      `${words.subject} ${n} ${n === 1 ? 'line' : 'lines'} here. You typed ${gotLines.length}. Count how many times ${words.call} runs.`,
    );
  }

  // Where the first wrong line is goes out as `marks`, not as a sentence: the
  // screen draws it line by line, and saying it twice would bury the rest.

  // Each of these is a real habit worth naming, and none reveals the answer
  // to anyone who did not already have it.
  if (normalize(gotLines.map(stripQuotes).join('\n')) === want) {
    notes.push(`The values are right. ${words.call} shows text without the quotes around it.`);
  } else if (got.toLowerCase() === want.toLowerCase()) {
    notes.push(`Right apart from capitalization. ${words.caps}`);
  } else if (got.replace(/\s+/g, '') === want.replace(/\s+/g, '')) {
    notes.push(`Right apart from spacing. Look at where the spaces go, such as after each comma in ${words.list === 'list' ? 'a list' : 'an array'}.`);
  }

  if (notes.length === 0) {
    notes.push('Go through the code one line at a time and write down what each name holds.');
  }
  return { pass: false, notes, ...base };
}

export interface ChoiceVerdict {
  pass: boolean;
  /** Why the picked choice is wrong. Empty on a pass. */
  why: string;
}

/** `picked` is an index into `level.choices`, not into the order on screen. */
export function gradeChoice(level: Level, picked: number): ChoiceVerdict {
  if (level.correct === picked) return { pass: true, why: '' };
  return { pass: false, why: level.whyNot?.[picked] ?? '' };
}

export interface TestResult {
  /** The call that was run, or 'Output' when the code's own output is graded. */
  label: string;
  pass: boolean;
  expected: string;
  got: string;
  /** Python's error for this test, when it raised. */
  error: string;
  /** Line of the player's code the error came from. 0 when it was not in their code. */
  errorLine: number;
}

export interface WriteVerdict {
  pass: boolean;
  /** Set when a forbid rule stopped the code from running at all. */
  blocked: string;
  /** Set when a run never finished. Later tests are skipped. */
  timedOut: boolean;
  results: TestResult[];
  /** What the last run printed. */
  output: string;
}

export async function gradeWrite(
  level: Level,
  code: string,
  runner: PyRunner,
): Promise<WriteVerdict> {
  for (const rule of level.forbid ?? []) {
    if (code.includes(rule.text)) {
      return { pass: false, blocked: rule.why, timedOut: false, results: [], output: '' };
    }
  }

  const results: TestResult[] = [];
  const ownLines = code.split('\n').length;
  let output = '';
  for (const t of level.tests ?? []) {
    const label = t.call === '' ? 'Output' : t.call;
    const want = normalize(t.expect);
    const run = await runner.run(`${code}\n${t.call}`);
    output = run.stdout;

    // A hung run costs a whole interpreter restart. One is enough to make the
    // point; the remaining tests would only hang the same way.
    if (run.timedOut) {
      return { pass: false, blocked: '', timedOut: true, results, output };
    }

    const got = normalize(run.stdout);
    results.push({
      label,
      pass: run.error === '' && got === want,
      expected: want,
      got,
      error: run.error,
      // The test call is appended after the player's code, so a line past the
      // end of theirs is ours and would point at nothing they can see.
      errorLine: run.errorLine <= ownLines ? run.errorLine : 0,
    });
  }

  return {
    pass: results.length > 0 && results.every((r) => r.pass),
    blocked: '',
    timedOut: false,
    results,
    output,
  };
}
