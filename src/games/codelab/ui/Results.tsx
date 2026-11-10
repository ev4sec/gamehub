import { Check, Minus, Plus, X } from 'lucide-react';
import type { PredictVerdict, TestResult } from '../engine/grade';

const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em]';

type Tag = 'match' | 'differs' | 'missing' | 'extra' | 'unchecked';

const TAGS: Record<Exclude<Tag, 'unchecked'>, { icon: typeof Check; text: string; tone: string }> = {
  match: { icon: Check, text: 'Match', tone: 'text-emerald-300' },
  differs: { icon: X, text: 'Differs', tone: 'text-rose-300' },
  missing: { icon: Minus, text: 'Missing', tone: 'text-rose-300' },
  extra: { icon: Plus, text: 'Extra', tone: 'text-rose-300' },
};

interface GridProps {
  typed: string[];
  verdict: PredictVerdict;
  /** What to say on the row where a line should have been: 'Python prints', 'This logs'. */
  subject: string;
}

/**
 * The player's answer, marked line by line, up to the first line that is off.
 * Past that point nothing is marked: once one line is missing every later one
 * has shifted, and a row of red marks there would be describing the shift
 * rather than the player's reading of the code.
 */
export function PredictGrid({ typed, verdict, subject }: GridProps) {
  const firstOff = verdict.marks.findIndex((m) => m !== 'match');
  const rows: { tag: Tag; text: string | null }[] = typed.map((text, i) => ({
    tag: firstOff >= 0 && i > firstOff ? 'unchecked' : verdict.marks[i],
    text,
  }));
  // Everything typed matched, and Python goes on to print more.
  if (firstOff < 0 && typed.length < verdict.expectedLines) rows.push({ tag: 'missing', text: null });
  const uncompared = rows.some((r) => r.tag === 'unchecked');

  return (
    <>
      <p className={`${LABEL} mt-3 text-slate-400`}>Your answer, line by line</p>
      <ol className="mt-1 space-y-1">
        {rows.map((row, i) => {
          const tag = row.tag === 'unchecked' ? null : TAGS[row.tag];
          return (
            <li key={i} data-line-mark={row.tag} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3">
              <span className={`${LABEL} inline-flex items-center gap-1 font-sans ${tag?.tone ?? ''}`}>
                {tag && (
                  <>
                    <tag.icon size={12} aria-hidden="true" />
                    {tag.text}
                  </>
                )}
              </span>
              {row.text === null ? (
                <span className="text-[13px] italic text-slate-400">({subject} a line here)</span>
              ) : row.text === '' ? (
                <span className="text-[13px] italic text-slate-500">(blank line)</span>
              ) : (
                <span
                  className={`font-mono text-[13px] whitespace-pre-wrap wrap-anywhere ${
                    row.tag === 'match'
                      ? 'text-slate-300'
                      : row.tag === 'unchecked'
                        ? 'text-slate-400'
                        : 'text-slate-100'
                  }`}
                >
                  {row.text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {uncompared && (
        <p className="mt-1 text-xs text-slate-400">Lines after the first difference are not compared.</p>
      )}
    </>
  );
}

interface TestListProps {
  results: TestResult[];
  /** The run after the last listed test never finished. */
  timedOut: boolean;
  onGoToLine: (line: number) => void;
}

/** One row per test, in the order written. A pass is one line; a fail says what and where. */
export function TestList({ results, timedOut, onGoToLine }: TestListProps) {
  return (
    <ol aria-label="Test results" className="mb-3 space-y-2">
      {results.map((r, i) => (
        <li
          key={i}
          data-test-result={r.pass ? 'pass' : 'fail'}
          className={`rounded-lg border px-3 py-2 text-sm ${
            r.pass ? 'border-slate-800 bg-slate-900/40' : 'border-rose-400/40 bg-rose-400/5'
          }`}
        >
          <div className="flex items-baseline gap-2">
            {r.pass ? (
              <Check size={14} aria-hidden="true" className="shrink-0 translate-y-0.5 text-emerald-300" />
            ) : (
              <X size={14} aria-hidden="true" className="shrink-0 translate-y-0.5 text-rose-300" />
            )}
            <span className={`${LABEL} w-10 shrink-0 ${r.pass ? 'text-emerald-300' : 'text-rose-300'}`}>
              {r.pass ? 'Pass' : 'Fail'}
            </span>
            <code className="min-w-0 font-mono text-[13px] whitespace-pre-wrap text-slate-200 wrap-anywhere">
              {r.label === 'Output' ? "Your program's output" : r.label}
            </code>
          </div>
          {!r.pass && (
            <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 pl-6">
              <dt className={`${LABEL} pt-0.5 text-slate-400`}>Expected</dt>
              <dd className="font-mono text-[13px] whitespace-pre-wrap text-slate-100 wrap-anywhere">
                {r.expected || '(nothing)'}
              </dd>
              {r.error === '' ? (
                <>
                  <dt className={`${LABEL} pt-0.5 text-slate-400`}>Got</dt>
                  <dd className="font-mono text-[13px] whitespace-pre-wrap text-rose-100 wrap-anywhere">
                    {r.got || '(nothing)'}
                  </dd>
                </>
              ) : (
                <>
                  <dt className={`${LABEL} pt-0.5 text-slate-400`}>Error</dt>
                  <dd className="font-mono text-[13px] whitespace-pre-wrap text-rose-200 wrap-anywhere">
                    {r.errorLine > 0 ? `Line ${r.errorLine}: ` : ''}
                    {r.error}
                    {r.errorLine > 0 && (
                      <button
                        onClick={() => onGoToLine(r.errorLine)}
                        className="mt-1 flex min-h-11 items-center font-sans text-xs text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
                      >
                        Go to line {r.errorLine}
                      </button>
                    )}
                  </dd>
                </>
              )}
            </dl>
          )}
        </li>
      ))}
      {timedOut && (
        <li data-test-result="fail" className="rounded-lg border border-rose-400/40 bg-rose-400/5 px-3 py-2 text-sm text-rose-100">
          Timed out. Is there a loop that never ends? The remaining tests were not run.
        </li>
      )}
    </ol>
  );
}
