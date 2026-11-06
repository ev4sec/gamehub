import type { Level } from './types';
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

export function gradePredict(level: Level, typed: string): boolean {
  return level.answer !== undefined && normalize(typed) === normalize(level.answer);
}

export function gradeChoice(level: Level, picked: number): boolean {
  return level.correct === picked;
}

export interface WriteVerdict {
  pass: boolean;
  /** One entry per failed rule or test, written for the player. */
  messages: string[];
  /** What the run that decided the verdict printed. */
  output: string;
}

export async function gradeWrite(
  level: Level,
  code: string,
  runner: PyRunner,
): Promise<WriteVerdict> {
  for (const rule of level.forbid ?? []) {
    if (code.includes(rule.text)) return { pass: false, messages: [rule.why], output: '' };
  }

  let output = '';
  for (const t of level.tests ?? []) {
    const run = await runner.run(`${code}\n${t.call}`);
    output = run.stdout;

    if (run.timedOut) {
      return {
        pass: false,
        messages: ['The run took too long. Is there a loop that never ends?'],
        output,
      };
    }
    if (run.error !== '') return { pass: false, messages: [run.error], output };

    const got = normalize(run.stdout);
    const want = normalize(t.expect);
    if (got !== want) {
      const label = t.call === '' ? 'Output' : t.call;
      return {
        pass: false,
        messages: [`${label}\n  expected: ${want || '(nothing)'}\n  got:      ${got || '(nothing)'}`],
        output,
      };
    }
  }

  return { pass: true, messages: [], output };
}
