import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Flag,
  Route,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { INTERVALS, MAX_BOX, waitText, type Card, type Outcome } from '../../../platform/spacedReview';
import {
  GLOSSARY,
  STAGES,
  choiceOrder,
  firstLessonFor,
  gradeChoice,
  gradeFind,
  linesOf,
  regionsOf,
} from '../engine/course';
import type { Choice, Lesson, Region } from '../engine/types';
import { Code } from './Code';
import { Pips } from './Pips';
import { GO, LABEL, PRIMARY, RING, SECONDARY } from './shared';

export interface Solved {
  card: Card;
  /** This lesson was the last unfinished one in its stage. */
  stageDone: boolean;
}

interface Props {
  lesson: Lesson;
  /** Completed visits before this one. Rotates the order of choices. */
  visit: number;
  /** Finished before. The tour is skipped and offered instead. */
  returning: boolean;
  /** Where this lesson sits: "Stage 3 · Lesson 2 of 4". */
  place: { stage: number; lesson: number; of: number };
  review: { pos: number; total: number } | null;
  card: Card | undefined;
  onSolved: (outcome: Outcome) => Solved;
  /** Where the button on the finished lesson leads, and what it says. Null at the very end. */
  next: { label: string; go: () => void } | null;
  onSkip: (() => void) | null;
  onBack: () => void;
}

interface Feedback {
  tone: 'good' | 'bad';
  head: string;
  why: string;
  /** On a right answer about a piece of code: that piece, explained. */
  region?: Region;
}

interface Result {
  outcome: Outcome;
  reasons: string[];
  before: number | undefined;
  solved: Solved;
}

/** Above this length a choice no longer fits half the dock, and the step is laid out as a question. */
const COMPACT_CHOICE = 24;

function where(region: Region, parent: Region | null): string {
  const own = region.span
    ? `On line ${region.from}`
    : region.from === region.last
      ? `Line ${region.from}`
      : `Lines ${region.from} to ${region.last}`;
  return parent ? `${own} · inside lines ${parent.from} to ${parent.last}` : own;
}

/** The nearest region that wholly contains this one over more lines, if there is one. */
function parentOf(region: Region, regions: Region[]): Region | null {
  const size = (r: Region) => r.last - r.from;
  return (
    regions
      .filter((r) => r.id !== region.id && r.from <= region.from && r.last >= region.last && size(r) > size(region))
      .sort((a, b) => size(a) - size(b))[0] ?? null
  );
}

interface ExplainedProps {
  lesson: Lesson;
  region: Region;
  parent: Region | null;
  /** Reset whenever the part or step changes, so a lookup never follows the player to the next one. */
  open: boolean;
  onToggle: (open: boolean) => void;
}

/** A piece of code named and explained, with its general definition one tap away. */
function Explained({ lesson, region, parent, open, onToggle }: ExplainedProps) {
  const chip = useRef<HTMLButtonElement | null>(null);
  const term = GLOSSARY[region.term];
  const first = firstLessonFor(region.term);

  return (
    <div
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return;
        // Stopped here, or the same key press would also leave the lesson.
        e.preventDefault();
        e.stopPropagation();
        onToggle(false);
        chip.current?.focus();
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          ref={chip}
          data-kind-chip
          onClick={() => onToggle(!open)}
          aria-label={`${region.kind}: look it up in the field guide`}
          aria-expanded={open}
          aria-controls={`peek-${region.id}`}
          className={`relative inline-flex min-h-7 items-center gap-1.5 rounded-full border border-yellow-300/50 bg-yellow-300/10 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-200 after:absolute after:-inset-2 after:content-[''] hover:bg-yellow-300/20 ${RING}`}
        >
          {region.kind}
          <BookOpen size={12} aria-hidden="true" />
        </button>
        <span className="text-xs tabular-nums text-slate-400">{where(region, parent)}</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-100">{region.note}</p>
      {open && term && (
        <div
          id={`peek-${region.id}`}
          data-peek={region.term}
          className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3"
        >
          <p className={`${LABEL} text-slate-400`}>Field guide</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{term.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{term.definition}</p>
          {first && first.id !== lesson.id && (
            <p className="mt-1 text-xs text-slate-400">First met in {first.title}.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function LessonView({
  lesson,
  visit,
  returning,
  place,
  review,
  card,
  onSolved,
  next,
  onSkip,
  onBack,
}: Props) {
  const regions = useMemo(() => regionsOf(lesson), [lesson]);
  const lines = useMemo(() => linesOf(lesson.code), [lesson]);
  // The tour visits the parts in the order the author listed them, which is
  // reading order, not line order.
  const hasTour = lesson.tour && regions.length > 0;
  const steps = lesson.steps;

  const [phase, setPhase] = useState<'tour' | 'ask' | 'done'>(hasTour && !returning ? 'tour' : 'ask');
  const [part, setPart] = useState(0);
  const [q, setQ] = useState(0);
  const [replayed, setReplayed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [ruledOut, setRuledOut] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [peek, setPeek] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const promptId = useId();
  const title = useRef<HTMLHeadingElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const prompt = useRef<HTMLHeadingElement | null>(null);
  const nextBtn = useRef<HTMLButtonElement | null>(null);
  const doneBox = useRef<HTMLElement | null>(null);

  const step = steps[q];
  const order = step && step.kind !== 'find' ? choiceOrder(step.choices.length, visit) : [];
  const compact =
    step?.kind === 'name' && step.choices.every((c) => c.text.length <= COMPACT_CHOICE);
  // Find and short Name steps fit entirely in the dock. Anything wordier keeps
  // only its question there and lays the choices out below, where they can wrap.
  const inDock = step?.kind === 'find' || compact;

  const tourRegion = phase === 'tour' ? regions[part] : null;
  const marked =
    phase === 'tour'
      ? tourRegion
      : phase === 'ask' && step?.kind === 'name'
        ? (regions.find((r) => r.id === step.region) ?? null)
        : null;
  const context =
    phase === 'tour' && tourRegion
      ? parentOf(tourRegion, regions)
      : phase === 'ask' && step?.kind === 'ask' && step.focus
        ? (regions.find((r) => r.id === step.focus) ?? null)
        : null;

  useEffect(() => {
    title.current?.focus();
  }, []);

  // Each new question starts with focus where the answer will be given.
  useEffect(() => {
    if (phase !== 'ask') return;
    if (step?.kind === 'find') {
      root.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus({ preventScroll: true });
    } else if (compact) {
      root.current?.querySelector<HTMLElement>('[data-choice]')?.focus({ preventScroll: true });
    } else {
      prompt.current?.focus({ preventScroll: true });
    }
    // `step` and `compact` follow from `q`; listing them would refocus on every pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, q]);

  useEffect(() => {
    if (answered) nextBtn.current?.focus({ preventScroll: true });
  }, [answered]);

  useEffect(() => {
    if (!result) return;
    if (nextBtn.current) nextBtn.current.focus({ preventScroll: true });
    else doneBox.current?.focus({ preventScroll: true });
    doneBox.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
  }, [result]);

  const resetQuestion = () => {
    setPicked(null);
    setRuledOut([]);
    setAnswered(false);
    setFeedback(null);
    setPeek(false);
  };

  const tourTo = (to: number) => {
    setPeek(false);
    if (to < 0) return;
    if (to >= regions.length) {
      // A tour replayed from the finished lesson goes back to it, not to a question.
      setPhase(result ? 'done' : 'ask');
      return;
    }
    setPart(to);
  };

  const replayTour = () => {
    if (!result) setReplayed(true);
    setPart(0);
    setPeek(false);
    setPhase('tour');
  };

  const note = (head: string) => {
    setFeedback({ tone: 'bad', head, why: '' });
    setAttempt((a) => a + 1);
  };

  const check = () => {
    if (phase !== 'ask' || answered || !step) return;
    if (picked === null) return note(step.kind === 'find' ? 'Pick a line first.' : 'Pick an answer first.');

    const verdict = step.kind === 'find' ? gradeFind(lesson, step, picked) : gradeChoice(step.choices, picked);
    setAttempt((a) => a + 1);
    setPeek(false);
    if (verdict.pass) {
      const about =
        step.kind === 'find'
          ? regions.find((r) => r.id === step.target)
          : step.kind === 'name'
            ? regions.find((r) => r.id === step.region)
            : undefined;
      setAnswered(true);
      setFeedback({ tone: 'good', head: 'Right.', why: '', region: about });
      return;
    }
    setRuledOut((r) => (r.includes(picked) ? r : [...r, picked]));
    setMissed((m) => (m.includes(q) ? m : [...m, q]));
    setFeedback({
      tone: 'bad',
      head: step.kind === 'find' ? `Not line ${picked}.` : 'Not that one.',
      why: verdict.why,
    });
  };

  const advance = () => {
    if (q + 1 < steps.length) {
      setQ(q + 1);
      resetQuestion();
      return;
    }
    const reasons: string[] = [];
    if (missed.length > 0) {
      reasons.push(
        `You missed ${missed.length} of ${steps.length} questions on the first try.`,
      );
    }
    if (replayed) reasons.push('You replayed the tour first.');
    const outcome: Outcome = reasons.length === 0 ? 'clean' : 'assisted';
    setResult({ outcome, reasons, before: card?.box, solved: onSolved(outcome) });
    resetQuestion();
    setPhase('done');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      check();
      return;
    }
    if (phase !== 'tour' || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const target = e.target as HTMLElement;
    if (target.closest('[role="radiogroup"]') || target.tagName === 'INPUT') return;
    e.preventDefault();
    tourTo(part + (e.key === 'ArrowRight' ? 1 : -1));
  };

  /** Arrow keys walk the choices and select as they go, the way a radio group does. */
  const onChoiceKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (dir === undefined || answered) return;
    const buttons = [...e.currentTarget.querySelectorAll('button')];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const to = (at + dir + buttons.length) % buttons.length;
    buttons[to].focus();
    setPicked(order[to]);
  };

  const segments = (hasTour && !returning ? 1 : 0) + steps.length;
  const segmentAt =
    phase === 'done' ? segments : phase === 'tour' && !returning ? 0 : q + (hasTour && !returning ? 1 : 0);
  const stepLabel =
    phase === 'done' ? 'Done' : phase === 'tour' ? 'Tour' : `Question ${q + 1} of ${steps.length}`;
  const screenStep = phase === 'tour' ? 'tour' : phase === 'done' ? 'done' : (step?.kind ?? 'ask');
  const lastPart = part === regions.length - 1;
  const stage = STAGES[place.stage];

  const choices = (list: Choice[]) => (
    <div
      role="radiogroup"
      aria-labelledby={promptId}
      aria-disabled={answered || undefined}
      onKeyDown={onChoiceKey}
      className={compact ? 'mt-2 grid grid-cols-2 gap-2' : 'mt-3 grid gap-2'}
    >
      {order.map((original) => {
        const out = ruledOut.includes(original);
        const on = picked === original && !out;
        return (
          <button
            key={original}
            role="radio"
            aria-checked={on}
            data-choice={original}
            onClick={() => !answered && setPicked(original)}
            className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${RING} ${
              on
                ? 'border-yellow-300 bg-yellow-300/10 text-slate-100'
                : out
                  ? 'border-rose-400/40 text-slate-400 line-through decoration-rose-300/70'
                  : 'border-slate-700/70 bg-slate-800/40 text-slate-300 hover:border-slate-500'
            }`}
          >
            <span>{list[original].text}</span>
            {out && (
              <>
                <X size={12} aria-hidden="true" className="ml-auto shrink-0 text-rose-300" />
                <span className="sr-only">Ruled out</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );

  const feedbackBlock = feedback && (
    <div
      key={attempt}
      role="status"
      data-feedback={feedback.tone}
      className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
        feedback.tone === 'good'
          ? 'border-emerald-400/50 bg-emerald-400/10 text-slate-100'
          : 'border-rose-400/50 bg-rose-400/10 text-rose-100'
      }`}
    >
      <p className="flex items-start gap-2">
        {feedback.tone === 'good' ? (
          <CircleCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" />
        ) : (
          <CircleX size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-rose-300" />
        )}
        <span>
          <span className="font-semibold">{feedback.head}</span>
          {feedback.why && ` ${feedback.why}`}
        </span>
      </p>
      {feedback.region && (
        <div className="mt-2">
          <Explained
            lesson={lesson}
            region={feedback.region}
            parent={parentOf(feedback.region, regions)}
            open={peek}
            onToggle={setPeek}
          />
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="mt-2 flex items-center gap-3">
      {answered ? (
        <button ref={nextBtn} data-action="next" onClick={advance} className={`${GO} flex-1 sm:flex-none`}>
          {q + 1 < steps.length ? 'Next question' : 'Finish lesson'}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <>
          <button
            data-action="check"
            onClick={check}
            aria-disabled={picked === null || undefined}
            className={`${PRIMARY} flex-1 sm:flex-none`}
          >
            {step?.kind === 'find' && picked !== null ? `Check line ${picked}` : 'Check answer'}
          </button>
          {step?.kind === 'find' && picked === null && (
            <span className="text-xs text-slate-400">Pick a line in the code.</span>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      ref={root}
      data-lesson={lesson.id}
      data-step={screenStep}
      onKeyDown={onKeyDown}
      className="w-full max-w-3xl px-4 py-8 sm:px-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white ${RING}`}
        >
          <ArrowLeft size={12} aria-hidden="true" />
          All lessons
        </button>
        {onSkip && phase !== 'done' && (
          <button
            onClick={onSkip}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 text-xs text-slate-400 hover:text-slate-200 ${RING}`}
          >
            Skip for now
          </button>
        )}
      </div>

      <header className="mb-4">
        <p className="text-xs uppercase tracking-widest text-yellow-200">
          {review
            ? `Review ${review.pos + 1} of ${review.total}`
            : `Stage ${place.stage + 1} · Lesson ${place.lesson + 1} of ${place.of}`}
        </p>
        <h1
          ref={title}
          tabIndex={-1}
          data-lesson-title
          className="text-3xl font-black tracking-tight text-slate-100 focus:outline-none"
        >
          {lesson.title}
        </h1>
        {returning ? (
          <p data-revisit className="mt-1 text-xs text-slate-400">
            You finished this before.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">
            {lesson.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3">
          <ol aria-hidden="true" className="flex flex-1 gap-1">
            {Array.from({ length: segments }, (_, i) => (
              <li
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < segmentAt ? 'bg-slate-400' : i === segmentAt ? 'bg-yellow-300' : 'bg-slate-800'
                }`}
              />
            ))}
          </ol>
          <span data-step-label className="shrink-0 text-xs tabular-nums text-slate-400">
            {stepLabel}
          </span>
        </div>
      </header>

      {hasTour && returning && phase === 'ask' && (
        <button
          data-action="replay-tour"
          onClick={replayTour}
          className={`mb-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-left hover:border-slate-600 ${RING}`}
        >
          <span>
            <span className="block text-sm font-semibold text-slate-200">Replay the tour</span>
            <span className="block text-xs text-slate-400">Try the questions from memory first.</span>
          </span>
          <Route size={16} aria-hidden="true" className="text-slate-400" />
        </button>
      )}

      <Code
        fileName={lesson.fileName}
        lang={lesson.lang}
        lines={lines}
        active={marked}
        parent={context}
        find={
          phase === 'ask' && step?.kind === 'find'
            ? {
                promptId,
                selected: picked,
                ruledOut,
                solved: answered ? (regions.find((r) => r.id === step.target) ?? null) : null,
                onSelect: setPicked,
              }
            : null
        }
        callout={
          tourRegion && (
            <div
              data-callout={tourRegion.id}
              data-region-kind={tourRegion.kind}
              className="my-1 whitespace-normal border-y border-yellow-300/30 bg-slate-900 px-4 py-3 font-sans sm:mx-2 sm:rounded-lg sm:border"
            >
              <Explained
                lesson={lesson}
                region={tourRegion}
                parent={parentOf(tourRegion, regions)}
                open={peek}
                onToggle={setPeek}
              />
            </div>
          )
        }
      />

      {phase !== 'done' && (
        // The shell pads its scroll area by a rem. Without the negative offset
        // the dock stops short of the screen edge and code shows beneath it.
        <div
          data-dock
          data-dock-step={screenStep}
          className="sticky -bottom-4 z-10 -mx-4 mt-3 border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:mx-0 sm:rounded-t-xl sm:border-x"
        >
          {phase === 'tour' && tourRegion && (
            <>
              <div className="flex items-baseline justify-between text-xs">
                <span className={`${LABEL} text-yellow-200`}>Tour</span>
                <span data-tour-part={part + 1} data-tour-total={regions.length} className="tabular-nums text-slate-400">
                  Part {part + 1} of {regions.length}
                </span>
              </div>
              <div className="mt-1.5 flex gap-2">
                <button
                  data-action="tour-back"
                  onClick={() => tourTo(part - 1)}
                  aria-disabled={part === 0 || undefined}
                  className={`${SECONDARY} w-11 shrink-0 px-0 sm:w-auto sm:px-4`}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Back</span>
                </button>
                <button data-action="tour-next" onClick={() => tourTo(part + 1)} className={`${PRIMARY} flex-1 sm:flex-none`}>
                  {!lastPart ? 'Next' : result ? 'Close the tour' : returning ? 'Back to the questions' : 'Start the questions'}
                  {lastPart ? <ArrowRight size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                Part {part + 1} of {regions.length}. {tourRegion.kind}. {where(tourRegion, null)}. {tourRegion.note}
              </p>
            </>
          )}

          {phase === 'ask' && step && (
            <>
              <p className={`${LABEL} text-yellow-200`}>
                {step.kind === 'find' ? 'Find' : step.kind === 'name' ? 'Name' : 'Ask'}
              </p>
              <h2
                id={promptId}
                ref={prompt}
                tabIndex={-1}
                className="mt-0.5 text-sm font-bold leading-snug text-slate-100 focus:outline-none"
              >
                {step.kind === 'name' ? 'What is the marked part?' : step.prompt}
              </h2>
              {inDock && (
                <>
                  {step.kind !== 'find' && choices(step.choices)}
                  {feedbackBlock}
                  {actions}
                </>
              )}
            </>
          )}
        </div>
      )}

      {phase === 'ask' && step && step.kind !== 'find' && !inDock && (
        <div>
          {choices(step.choices)}
          {feedbackBlock}
          {actions}
        </div>
      )}

      {phase === 'ask' && (
        <p className="mt-4 hidden text-xs text-slate-400 sm:block">Ctrl+Enter checks your answer.</p>
      )}

      {result && phase === 'done' && (
        <>
          <section
            ref={doneBox}
            data-lesson-done
            data-outcome={result.outcome}
            tabIndex={-1}
            className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-sm focus:outline-none"
          >
            <p className="flex items-center gap-2 font-semibold text-emerald-100">
              <CircleCheck size={16} aria-hidden="true" className="shrink-0 text-emerald-300" />
              {result.outcome === 'clean' ? 'Lesson done without help.' : 'Lesson done with help.'}
            </p>
            {result.reasons.length > 0 && <p className="mt-1 text-slate-200">{result.reasons.join(' ')}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <Pips strength={result.solved.card.box} from={result.before ?? 0} large />
              <span>
                Strength {result.solved.card.box} of {MAX_BOX}
                {result.before !== undefined && result.before !== result.solved.card.box
                  ? `, ${result.solved.card.box > result.before ? 'up' : 'down'} from ${result.before}.`
                  : '.'}{' '}
                Next review in {waitText(INTERVALS[result.solved.card.box])}.
              </span>
            </p>
            <div className="mt-3 border-t border-emerald-400/20 pt-3">
              <p className={`${LABEL} text-emerald-300`}>Takeaway</p>
              <p className="mt-1 leading-relaxed text-slate-100">{lesson.takeaway}</p>
            </div>
          </section>

          {result.solved.stageDone && stage && (
            <div data-stage-done={stage.id} className="mt-4 rounded-xl border border-yellow-300/50 bg-slate-900 p-4">
              <p className={`${LABEL} flex items-center gap-1.5 text-yellow-200`}>
                <Flag size={12} aria-hidden="true" />
                Stage {place.stage + 1} of {STAGES.length} complete
              </p>
              <p className="mt-1 text-base font-semibold leading-snug text-slate-50">{stage.canNow}</p>
              {place.stage === STAGES.length - 1 && (
                <p className="mt-2 text-sm text-slate-300">
                  That is the whole path. Finished lessons keep coming back for review.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {next ? (
              <button ref={nextBtn} data-action="next" onClick={next.go} className={GO}>
                {next.label}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button ref={nextBtn} data-action="next" onClick={onBack} className={GO}>
                Back to all lessons
              </button>
            )}
            {hasTour && (
              <button data-action="replay-tour" onClick={replayTour} className={SECONDARY}>
                Replay the tour
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
