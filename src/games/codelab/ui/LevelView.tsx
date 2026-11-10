import {
  ArrowLeft,
  ArrowRight,
  Bug,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  Eye,
  Lightbulb,
  Lock,
  Play,
  StepForward,
  X,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  choiceOrder,
  gradeChoice,
  gradePredict,
  gradeWrite,
  normalize,
  problemFor,
  type PredictVerdict,
  type WriteVerdict,
} from '../engine/grade';
import { INTERVALS, MAX_BOX, waitText, type Card, type Outcome } from '../engine/review';
import type { Level, LevelKind, Track } from '../engine/types';
import type { InspectResult, PyRunner, RunResult, TraceResult } from '../runner/types';
import { CodeBlock } from './CodeBlock';
import { Inspector } from './Inspector';
import { Pips } from './Pips';
import { PredictGrid, TestList } from './Results';
import { Tracer } from './Tracer';

interface Props {
  level: Level;
  track: Track;
  /** Completed visits before this one. Picks the variant and the choice order. */
  visit: number;
  /** Solved before. The lesson starts folded away. */
  returning: boolean;
  index: number;
  total: number;
  /** Set while walking the review queue. */
  review: { pos: number; total: number } | null;
  /** Review state before this visit. */
  card: Card | undefined;
  getRunner: () => PyRunner;
  /** Records the solve and hands back where the level now stands. */
  onSolved: (hintsUsed: number, outcome: Outcome) => Card;
  onNext: (() => void) | null;
  onSkip: (() => void) | null;
  onBack: () => void;
}

type Miss =
  | { kind: 'note'; heading: string; notes: string[] }
  | { kind: 'predict'; verdict: PredictVerdict; typed: string[] }
  | { kind: 'write'; verdict: WriteVerdict };

interface Solve {
  outcome: Outcome;
  reasons: string[];
  before: number | undefined;
  after: Card;
  revealed: boolean;
}

/** Failed checks a write or fix level allows before the solve stops counting as unaided. */
const FREE_WRITE_MISSES = 1;
/** Failed checks before the answer is offered. */
const MISSES_BEFORE_REVEAL = 3;

const KIND_LABEL: Record<LevelKind, string> = {
  predict: 'Predict',
  write: 'Write',
  fix: 'Fix',
  locate: 'Locate',
  read: 'Read',
};

const BTN =
  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50';
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em]';

function nearest(el: HTMLElement | null): void {
  el?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
}

export function LevelView({
  level,
  track,
  visit,
  returning,
  index,
  total,
  review,
  card,
  getRunner,
  onSolved,
  onNext,
  onSkip,
  onBack,
}: Props) {
  const isCode = level.kind === 'write' || level.kind === 'fix';
  const isChoice = level.kind === 'locate' || level.kind === 'read';
  const py = track === 'python';
  // Stepping through relies on Python's own tracing hook. There is no equal on the other track.
  const canStep = !isChoice && py;
  const mainName = level.fileName ?? (level.files ? (py ? 'main.py' : 'main.ts') : undefined);
  const problem = problemFor(level, visit);
  const order = choiceOrder(level.choices?.length ?? 0, visit);
  const variant = level.kind === 'predict' && problem.code !== level.code;

  const [typed, setTyped] = useState('');
  const [code, setCode] = useState(level.code);
  const [picked, setPicked] = useState<number | null>(null);
  const [ruledOut, setRuledOut] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [misses, setMisses] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [miss, setMiss] = useState<Miss | null>(null);
  const [solve, setSolve] = useState<Solve | null>(null);
  const [passed, setPassed] = useState<WriteVerdict | null>(null);
  const [ran, setRan] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(!returning);
  const [lessonReread, setLessonReread] = useState(false);
  const [ranEarly, setRanEarly] = useState(false);
  const [steppedEarly, setSteppedEarly] = useState(false);
  const [referenceShown, setReferenceShown] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [trace, setTrace] = useState<{ code: string; result: TraceResult | null } | null>(null);
  const [step, setStep] = useState(0);

  const promptId = useId();
  const title = useRef<HTMLHeadingElement | null>(null);
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const stepBtn = useRef<HTMLButtonElement | null>(null);
  const nextBtn = useRef<HTMLButtonElement | null>(null);
  const badBlock = useRef<HTMLDivElement | null>(null);
  const goodBlock = useRef<HTMLDivElement | null>(null);

  const [afterClose, setAfterClose] = useState<
    { focus: 'opener' } | { focus: 'line'; line: number } | null
  >(null);

  // Where focus goes once the trace is gone. Done after the render that
  // removes it, because until then the editor it may point at is not mounted.
  useEffect(() => {
    if (!afterClose) return;
    if (afterClose.focus === 'opener') {
      stepBtn.current?.focus();
      return;
    }
    const ta = editor.current;
    if (!ta) return;
    const lines = ta.value.split('\n');
    const start = lines.slice(0, afterClose.line - 1).reduce((n, l) => n + l.length + 1, 0);
    ta.focus();
    ta.setSelectionRange(start, start + (lines[afterClose.line - 1]?.length ?? 0));
  }, [afterClose]);

  const won = solve !== null;
  // Predict only: the tools that show the answer stay shut until one has been committed to.
  const locked = level.kind === 'predict' && !won && misses === 0;

  // Start at the top, on the title. Not on the answer box: on a phone that
  // would open the keyboard over the code before it has been read.
  useEffect(() => {
    title.current?.focus();
  }, []);

  useEffect(() => {
    if (miss) nearest(badBlock.current);
  }, [miss, attempt]);

  useEffect(() => {
    if (!solve) return;
    if (nextBtn.current) nextBtn.current.focus({ preventScroll: true });
    else goodBlock.current?.focus({ preventScroll: true });
    nearest(goodBlock.current);
  }, [solve]);

  const win = (opts: { revealed?: boolean; missesNow?: number } = {}) => {
    if (won) return;
    const missCount = opts.missesNow ?? misses;
    const reasons: string[] = [];
    if (opts.revealed) reasons.push('You looked at the answer.');
    else if (isCode ? missCount > FREE_WRITE_MISSES : missCount > 0) {
      reasons.push(isCode ? 'It took more than two checks.' : 'It took more than one check.');
    }
    if (referenceShown) reasons.push('You looked at the reference solution.');
    if (hints > 0) reasons.push(hints === 1 ? 'You used a hint.' : 'You used hints.');
    if (lessonReread) reasons.push('You reread the lesson first.');
    if (ranEarly && steppedEarly) reasons.push('You ran and stepped through the code before your answer was right.');
    else if (ranEarly) reasons.push('You ran the code before your answer was right.');
    else if (steppedEarly) reasons.push('You stepped through the code before your answer was right.');

    const outcome: Outcome = reasons.length === 0 ? 'clean' : 'assisted';
    const after = onSolved(hints, outcome);
    setMiss(null);
    setSolve({ outcome, reasons, before: card?.box, after, revealed: opts.revealed ?? false });
  };

  const fail = (next: Miss, counts: boolean) => {
    setMiss(next);
    setAttempt((a) => a + 1);
    if (counts) setMisses((m) => m + 1);
  };

  const check = async () => {
    if (busy || won) return;

    if (level.kind === 'predict') {
      const verdict = gradePredict(problem, typed, track);
      if (verdict.pass) return win();
      if (normalize(typed) === '') {
        return fail({ kind: 'note', heading: verdict.notes[0], notes: [] }, false);
      }
      return fail({ kind: 'predict', verdict, typed: normalize(typed).split('\n') }, true);
    }

    if (isCode) {
      setBusy(true);
      const verdict = await gradeWrite(level, code, getRunner());
      setBusy(false);
      if (verdict.pass) {
        setPassed(verdict);
        return win();
      }
      return fail({ kind: 'write', verdict }, true);
    }

    if (picked === null) return fail({ kind: 'note', heading: 'Pick an answer first.', notes: [] }, false);
    const verdict = gradeChoice(level, picked);
    if (verdict.pass) return win();
    setRuledOut((r) => (r.includes(picked) ? r : [...r, picked]));
    fail({ kind: 'note', heading: 'Not that one.', notes: verdict.why ? [verdict.why] : [] }, true);
  };

  const run = async () => {
    if (busy || locked) return;
    if (level.kind === 'predict' && !won) setRanEarly(true);
    setBusy(true);
    setRan(await getRunner().run(isCode ? code : problem.code));
    setBusy(false);
  };

  /** Write levels define a function and stop; the first test's call gives the trace something to follow. */
  const traceSource = (): string => {
    if (!isCode) return problem.code;
    const call = level.tests?.[0]?.call ?? '';
    return call === '' ? code : `${code.replace(/\s+$/, '')}\n\n${call}`;
  };

  const openTrace = async () => {
    if (locked) return;
    if (level.kind === 'predict' && !won) setSteppedEarly(true);
    const source = traceSource();
    setTracing(true);
    // Unchanged code picks up where it was left; changed code starts over.
    if (trace?.code === source && trace.result) return;
    setStep(0);
    setTrace({ code: source, result: null });
    const result = await getRunner().trace(source);
    setTrace((t) => (t?.code === source ? { code: source, result } : t));
  };

  const closeTrace = () => {
    setTracing(false);
    setAfterClose({ focus: 'opener' });
  };

  const goToLine = (line: number) => {
    setTracing(false);
    setAfterClose({ focus: 'line', line });
  };

  const reveal = () => {
    if (isCode) setReferenceShown(true);
    else win({ revealed: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void check();
    }
    if (e.key === 'Tab' && isCode && (e.target as HTMLElement).tagName === 'TEXTAREA' && !e.shiftKey) {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const { selectionStart: s, selectionEnd: en } = ta;
      setCode(`${code.slice(0, s)}    ${code.slice(en)}`);
      requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
    }
  };

  /** Arrow keys walk the choices and select as they go, the way a radio group does. */
  const onChoiceKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (dir === undefined) return;
    const buttons = [...e.currentTarget.querySelectorAll('button')];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const to = (at + dir + buttons.length) % buttons.length;
    buttons[to].focus();
    setPicked(order[to]);
  };

  const inspect = (name: string): Promise<InspectResult> => getRunner().inspect(name);
  const inspector = level.inspect ? <Inspector initial={level.inspect} inspect={inspect} /> : null;

  const lesson = (
    <section id="lesson" aria-label="Concept" className="mb-5 space-y-2 text-sm leading-relaxed text-slate-300">
      {level.concept.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">In the wild. </span>
        {level.wild}
      </p>
    </section>
  );

  const tracer = tracing && trace && (
    <Tracer
      code={trace.code}
      fileName={mainName}
      own={isCode}
      trace={trace.result}
      step={step}
      onStep={setStep}
      onClose={closeTrace}
    />
  );

  const showReveal = !won && misses >= MISSES_BEFORE_REVEAL && !isChoice && !(isCode && referenceShown);
  const nextLabel = !review ? 'Next level' : review.pos + 1 < review.total ? 'Next in review' : 'Finish review';

  return (
    <div className="w-full max-w-3xl px-4 py-8 sm:px-6" onKeyDown={onKeyDown}>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <ArrowLeft size={12} />
          All levels
        </button>
        {onSkip && !won && (
          <button
            onClick={onSkip}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Skip for now
          </button>
        )}
      </div>

      <header className="mb-5">
        <p className="text-xs uppercase tracking-widest text-indigo-300">
          {review
            ? `Review ${review.pos + 1} of ${review.total}`
            : `${isCode ? 'Practice' : 'Level'} ${index + 1} of ${total}`}{' '}
          ·{' '}
          {KIND_LABEL[level.kind]}
        </p>
        <h1
          ref={title}
          tabIndex={-1}
          data-level-title
          className="text-3xl font-black tracking-tight text-slate-100 focus:outline-none"
        >
          {level.title}
        </h1>
        {returning && (
          <p data-revisit className="mt-1 text-xs text-slate-400">
            {variant
              ? 'You solved this before. This time the code is a variant, so the answer may differ.'
              : 'You solved this before.'}
          </p>
        )}
      </header>

      {returning && (
        <button
          onClick={() => {
            setLessonOpen((o) => !o);
            if (!won) setLessonReread(true);
          }}
          aria-expanded={lessonOpen}
          aria-controls="lesson"
          className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-left hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            lessonOpen ? 'mb-3' : 'mb-5'
          }`}
        >
          <span>
            <span className="block text-sm font-semibold text-slate-200">
              {lessonOpen ? 'Hide the lesson' : 'Show the lesson'}
            </span>
            {!lessonOpen && <span className="block text-xs text-slate-400">Try it from memory first.</span>}
          </span>
          {lessonOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      )}
      {lessonOpen && lesson}

      {level.kind === 'fix' && (
        <div className="mb-3 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3">
          <p className={`${LABEL} flex items-center gap-1.5 text-slate-400`}>
            <Bug size={12} aria-hidden="true" className="text-rose-300" />
            Bug report
          </p>
          <p className="mt-1 text-sm text-slate-200">{level.prompt.replace(/^Bug report: /, '').replace(/ Fix it\.$/, '')}</p>
        </div>
      )}

      <h2 id={promptId} className="mb-2 text-base font-bold text-indigo-200">
        {level.kind === 'fix' ? 'Find the bug and fix it.' : level.prompt}
      </h2>

      {!isCode && (
        <div className="mb-3 space-y-3">
          {tracer || <CodeBlock code={problem.code} name={mainName} />}
          {level.files?.map((f) => (
            <CodeBlock key={f.name} code={f.code} name={f.name} />
          ))}
        </div>
      )}

      {isCode &&
        (tracer || (
          <textarea
            ref={editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Your code"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            rows={Math.max(8, code.split('\n').length + 1)}
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          />
        ))}

      {isChoice && inspector && <div className="mb-3">{inspector}</div>}

      {level.kind === 'predict' && (
        <>
          <p className={`${LABEL} mb-1 text-slate-400`}>{py ? 'What it prints' : 'What it logs'}</p>
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="What it prints"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            rows={Math.max(3, problem.answer.split('\n').length + 1)}
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          />
        </>
      )}

      {isChoice && (
        <div
          role="radiogroup"
          aria-labelledby={promptId}
          onKeyDown={onChoiceKey}
          className="mb-3 grid gap-2"
        >
          {order.map((original) => {
            const out = ruledOut.includes(original);
            const on = picked === original;
            return (
              <button
                key={original}
                role="radio"
                aria-checked={on}
                data-choice={original}
                onClick={() => setPicked(original)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  on && !out
                    ? 'border-indigo-400 bg-indigo-400/10 text-slate-100'
                    : out
                      ? 'border-rose-400/40 bg-slate-800/40 text-slate-300'
                      : 'border-slate-700/70 bg-slate-800/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>{level.choices?.[original]}</span>
                {out && (
                  <span className={`${LABEL} ml-auto inline-flex shrink-0 items-center gap-1 text-rose-300`}>
                    <X size={12} aria-hidden="true" />
                    Ruled out
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => void check()}
          disabled={busy || won}
          className={`${BTN} border-indigo-400/70 bg-indigo-400/10 text-indigo-100 hover:bg-indigo-400/20`}
        >
          {busy ? 'Working...' : 'Check answer'}
        </button>
        {!isChoice && (
          <>
            <button
              onClick={() => void run()}
              disabled={busy}
              aria-disabled={locked || undefined}
              aria-describedby={locked ? 'run-lock' : undefined}
              className={
                locked
                  ? `${BTN} cursor-not-allowed border-slate-800 text-slate-500`
                  : `${BTN} border-slate-700 text-slate-200 hover:border-slate-500`
              }
            >
              {locked ? <Lock size={14} /> : <Play size={14} />}
              {isCode ? 'Run my code' : 'Run it for real'}
            </button>
            {canStep && <button
              ref={stepBtn}
              onClick={() => void (tracing ? closeTrace() : openTrace())}
              aria-disabled={locked || undefined}
              aria-describedby={locked ? 'run-lock' : undefined}
              aria-expanded={tracing}
              aria-controls="trace"
              className={
                locked
                  ? `${BTN} cursor-not-allowed border-slate-800 text-slate-500`
                  : `${BTN} border-slate-700 text-slate-200 hover:border-slate-500`
              }
            >
              {locked ? <Lock size={14} /> : <StepForward size={14} />}
              {isCode ? 'Step through my code' : 'Step through'}
            </button>}
          </>
        )}
        {hints < level.hints.length && !won && (
          <button
            onClick={() => setHints((h) => h + 1)}
            className={`${BTN} border-slate-700 text-slate-300 hover:border-amber-400/60`}
          >
            <Lightbulb size={14} />
            Hint ({hints}/{level.hints.length})
          </button>
        )}
        {showReveal && (
          <button onClick={reveal} className={`${BTN} border-slate-700 text-slate-300 hover:border-amber-400/60`}>
            <Eye size={14} />
            {isCode ? 'Show a reference solution' : 'Show the answer'}
          </button>
        )}
      </div>

      {level.kind === 'predict' && !won && (
        <p id="run-lock" className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
          {locked ? (
            <>
              <Lock size={12} aria-hidden="true" className="shrink-0" />
              {py ? 'Run and Step through unlock' : 'Run unlocks'} after you check an answer.
            </>
          ) : (
            py ? 'Run and Step through are open now.' : 'Run is open now.'
          )}
        </p>
      )}

      {miss && !won && (
        <div
          key={attempt}
          ref={badBlock}
          role="status"
          data-feedback="bad"
          className="mb-3 rounded-xl border border-rose-400/50 bg-rose-400/10 p-4 text-sm text-rose-100"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CircleX size={16} aria-hidden="true" className="shrink-0 text-rose-300" />
            {miss.kind === 'note' && miss.heading}
            {miss.kind === 'predict' && (py ? 'Not what Python prints.' : 'Not what this logs.')}
            {miss.kind === 'write' &&
              (miss.verdict.blocked !== ''
                ? 'Not run.'
                : `Tests passing: ${miss.verdict.results.filter((r) => r.pass).length} of ${level.tests?.length ?? 0}.`)}
          </p>
          {miss.kind === 'note' && miss.notes.map((n) => <p key={n} className="mt-1">{n}</p>)}
          {miss.kind === 'write' && miss.verdict.blocked !== '' && <p className="mt-1">{miss.verdict.blocked}</p>}
          {miss.kind === 'predict' && (
            <>
              {miss.verdict.notes.map((n) => (
                <p key={n} className="mt-1">
                  {n}
                </p>
              ))}
              {(miss.verdict.expectedLines > 1 || miss.typed.length > 1) && (
                <PredictGrid typed={miss.typed} verdict={miss.verdict} subject={py ? 'Python prints' : 'This logs'} />
              )}
            </>
          )}
        </div>
      )}

      {solve && (
        <div
          ref={goodBlock}
          role="status"
          data-feedback="good"
          data-outcome={solve.outcome}
          tabIndex={-1}
          className="mb-3 rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-sm focus:outline-none"
        >
          <p className="flex items-center gap-2 font-semibold text-emerald-100">
            <CircleCheck size={16} aria-hidden="true" className="shrink-0 text-emerald-300" />
            {solve.outcome === 'clean' ? 'Solved without help.' : 'Solved with help.'}
          </p>
          {solve.reasons.length > 0 && <p className="mt-1 text-slate-200">{solve.reasons.join(' ')}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <Pips strength={solve.after.box} from={solve.before ?? 0} large />
            <span>
              Strength {solve.after.box} of {MAX_BOX}
              {solve.before !== undefined && solve.before !== solve.after.box
                ? `, ${solve.after.box > solve.before ? 'up' : 'down'} from ${solve.before}.`
                : '.'}{' '}
              Next review in {waitText(INTERVALS[solve.after.box])}.
            </span>
          </p>
          {solve.revealed && (
            <>
              <p className={`${LABEL} mt-3 text-emerald-300`}>The answer</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-black/40 p-3 font-mono text-[13px] text-slate-100">
                {problem.answer}
              </pre>
            </>
          )}
          <div className="mt-3 border-t border-emerald-400/20 pt-3">
            <p className={`${LABEL} text-emerald-300`}>Why</p>
            <p className="mt-1 leading-relaxed text-slate-100">{problem.explain}</p>
          </div>
        </div>
      )}

      {isCode && !won && miss?.kind === 'write' && miss.verdict.blocked === '' && (
        <TestList results={miss.verdict.results} timedOut={miss.verdict.timedOut} onGoToLine={goToLine} />
      )}
      {isCode && won && passed && <TestList results={passed.results} timedOut={false} onGoToLine={goToLine} />}

      {isCode && level.solution && (won || referenceShown) && (
        <details open={!won} className="group mb-3 rounded-xl border border-slate-800 bg-slate-900/40">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 [&::-webkit-details-marker]:hidden">
            Compare with a reference solution
            <ChevronDown size={16} aria-hidden="true" className="group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-800 p-3">
            <p className="mb-2 text-xs text-slate-400">
              {won
                ? 'Yours passed the same tests. Different code can be just as right.'
                : 'Read it, then write your own version. Copying it in teaches less than typing it out.'}
            </p>
            <CodeBlock code={level.solution} name="reference.py" />
          </div>
        </details>
      )}

      {won && onNext && (
        <button
          ref={nextBtn}
          onClick={onNext}
          className={`${BTN} mb-5 border-emerald-400/60 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20`}
        >
          {nextLabel}
          <ArrowRight size={14} />
        </button>
      )}

      {hints > 0 && !won && (
        <ul className="mb-3 space-y-1 text-sm text-amber-200">
          {level.hints.slice(0, hints).map((h) => (
            <li key={h}>Hint: {h}</li>
          ))}
        </ul>
      )}

      {ran && (
        <div data-run-output className="mb-3">
          <p className={`${LABEL} mb-1 text-slate-400`}>{py ? 'Python printed' : 'It logged'}</p>
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/40 p-3 font-mono text-[13px] text-slate-200">
            {ran.timedOut
              ? 'Timed out. Is there a loop that never ends?'
              : `${ran.stdout || '(nothing)'}${
                  ran.error ? `\n${ran.errorLine > 0 ? `Line ${ran.errorLine}: ` : ''}${ran.error}` : ''
                }`}
          </pre>
        </div>
      )}

      {/* Only where there is something to look up. On a level with no imports
          the panel is a question with no subject. */}
      {!isChoice && inspector}

      <p className="mt-4 hidden text-xs text-slate-400 sm:block">
        Ctrl+Enter checks your answer.
        {canStep && ' In the trace, the arrow keys step and Escape closes it.'}
      </p>
    </div>
  );
}
