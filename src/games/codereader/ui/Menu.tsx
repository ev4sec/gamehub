import { ArrowLeft, ArrowRight, BookOpenText, Check } from 'lucide-react';
import { EXIT_LABEL } from '../../../platform/game';
import { MAX_BOX, dueIds, nextDue, waitText } from '../../../platform/spacedReview';
import { LESSONS, STAGES, lessonsIn, termsMet } from '../engine/course';
import type { SaveData } from '../save';
import { Pips } from './Pips';
import { LABEL, LANG_NAME, PRIMARY, RING, SECONDARY } from './shared';

interface Props {
  save: SaveData;
  now: number;
  /** Where to put the keyboard back: a lesson id, or 'guide' after the field guide. */
  lastId: string | null;
  onOpen: (lessonId: string) => void;
  onReview: () => void;
  onGuide: () => void;
  onExit: () => void;
}

const ORDER = LESSONS.map((l) => l.id);

export function Menu({ save, now, lastId, onOpen, onReview, onGuide, onExit }: Props) {
  const solved = new Set(save.solved);
  const done = LESSONS.filter((l) => solved.has(l.id)).length;
  const upNext = LESSONS.find((l) => !solved.has(l.id));
  const due = dueIds(save.cards, ORDER, now);
  const upcoming = nextDue(save.cards, now);
  const anyDue = due.length > 0;
  const met = termsMet(save.solved).length;

  const stageDone = (id: string) => lessonsIn(id).every((l) => solved.has(l.id));
  // The stage the next unfinished lesson is in. With everything finished there is none.
  const currentStage = upNext ? STAGES.findIndex((s) => s.id === upNext.stage) : -1;
  const latestDone = [...STAGES].reverse().find((s) => stageDone(s.id));
  const initial = lastId ?? (anyDue ? 'review' : 'continue');

  return (
    // One grid for the whole screen: the shell's arrow keys only look at the first one they find.
    <div data-nav-grid className="w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-5xl font-black tracking-tight text-yellow-200">Code Reader</h1>
        <span className="rounded-full border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
          In development
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        A guided course in reading code. Each lesson shows you a real file and names its parts, then
        asks you to find them yourself. Nothing here asks you to write code.
      </p>

      {anyDue && (
        <button
          data-review-due={due.length}
          data-nav-initial={initial === 'review' ? '' : undefined}
          onClick={onReview}
          className={`mt-4 flex w-full items-center justify-between gap-4 rounded-xl border border-yellow-300/70 bg-yellow-300/10 px-5 py-4 text-left transition hover:bg-yellow-300/20 ${RING}`}
        >
          <span>
            <span className={`${LABEL} block text-yellow-200`}>Due for review</span>
            <span className="block text-4xl font-black tabular-nums text-slate-100">{due.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-100">
            Start review
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>
      )}
      {!anyDue && done > 0 && (
        <div data-review-idle className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-3">
          <p className={`${LABEL} text-slate-400`}>Review</p>
          <p className="text-sm text-slate-300">
            Nothing is due.
            {upcoming !== null && ` The next review is in ${waitText(upcoming - now)}.`}
          </p>
        </div>
      )}

      <div data-position className="mt-4 rounded-xl border border-slate-700/70 bg-slate-800/40 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`${LABEL} text-slate-400`}>Your position</p>
          <p className="text-xs tabular-nums text-slate-400">
            {done} of {LESSONS.length} lessons
          </p>
        </div>
        {upNext ? (
          <>
            <p className="mt-1 text-2xl font-black tracking-tight text-slate-100">
              Stage {currentStage + 1} <span className="text-slate-500">of {STAGES.length}</span>
            </p>
            <p className="text-sm font-semibold text-yellow-200">{STAGES[currentStage].title}</p>
          </>
        ) : (
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-100">
            All {STAGES.length} stages done
          </p>
        )}
        <ol aria-hidden="true" className="mt-3 flex gap-1">
          {STAGES.map((s, i) => (
            <li
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                stageDone(s.id)
                  ? 'bg-yellow-300'
                  : i === currentStage
                    ? 'bg-slate-950 ring-1 ring-yellow-300'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </ol>
        {latestDone && (
          <p data-can-now className="mt-3 flex gap-2 text-sm text-slate-200">
            <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" />
            {latestDone.canNow}
          </p>
        )}
        {upNext && (
          <button
            data-continue
            data-nav-initial={initial === 'continue' ? '' : undefined}
            onClick={() => onOpen(upNext.id)}
            className={`${anyDue ? SECONDARY : PRIMARY} mt-4 w-full`}
          >
            {done === 0 ? 'Start' : 'Continue'}: {upNext.title}
          </button>
        )}
      </div>

      {met > 0 && (
        <button
          data-field-guide
          data-nav-initial={initial === 'guide' ? '' : undefined}
          onClick={onGuide}
          className={`mt-3 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-800/40 px-4 py-2.5 text-left hover:border-yellow-300/60 hover:bg-slate-800/80 ${RING}`}
        >
          <span className="flex items-center gap-3">
            <BookOpenText size={18} aria-hidden="true" className="text-yellow-200" />
            <span>
              <span className="block text-sm font-semibold text-slate-100">Field guide</span>
              <span className="block text-xs text-slate-400">
                {met} {met === 1 ? 'term' : 'terms'} you have met
              </span>
            </span>
          </span>
          <ArrowRight size={16} aria-hidden="true" className="text-slate-400" />
        </button>
      )}

      <ol aria-label="The path" className="mt-10">
        {STAGES.map((stage, i) => {
          const lessons = lessonsIn(stage.id);
          const finished = lessons.filter((l) => solved.has(l.id)).length;
          const state = finished === lessons.length ? 'done' : i === currentStage ? 'current' : 'upcoming';
          return (
            <li key={stage.id} data-stage={stage.id} data-stage-state={state} className="relative pb-8 pl-11 last:pb-0">
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-[13px] top-8 w-0.5 ${
                    state === 'done' ? 'bg-yellow-300/50' : 'bg-slate-800'
                  }`}
                />
              )}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                  state === 'done'
                    ? 'bg-yellow-300 text-slate-950'
                    : state === 'current'
                      ? 'bg-slate-950 text-yellow-200 ring-2 ring-yellow-300'
                      : 'bg-slate-950 text-slate-400 ring-1 ring-slate-600'
                }`}
              >
                {state === 'done' ? <Check size={14} /> : i + 1}
              </span>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-100">
                  <span className="sr-only">Stage {i + 1}: </span>
                  {stage.title}
                  {state !== 'upcoming' && (
                    <span className="sr-only">{state === 'done' ? ', done' : ', in progress'}</span>
                  )}
                </h2>
                <span
                  className={`text-xs uppercase tracking-widest tabular-nums ${
                    state === 'done' ? 'text-yellow-200' : 'text-slate-400'
                  }`}
                >
                  {finished}/{lessons.length}
                </span>
              </div>
              {state === 'done' ? (
                <p data-can-now className="mt-2 flex gap-2 text-sm text-slate-200">
                  <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" />
                  {stage.canNow}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-400">{stage.blurb}</p>
              )}
              <ul className="mt-3 grid gap-2">
                {lessons.map((lesson) => {
                  const isDone = solved.has(lesson.id);
                  const strength = save.cards[lesson.id]?.box ?? 0;
                  const isNext = lesson.id === upNext?.id;
                  return (
                    <li key={lesson.id}>
                      <button
                        data-lesson={lesson.id}
                        data-up-next={isNext ? '' : undefined}
                        data-nav-initial={initial === lesson.id ? '' : undefined}
                        onClick={() => onOpen(lesson.id)}
                        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-slate-800/40 px-4 py-2.5 text-left transition hover:border-yellow-300/60 hover:bg-slate-800/80 ${RING} ${
                          isNext ? 'border-yellow-300/60' : 'border-slate-700/70'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-100">{lesson.title}</span>
                          <span className="block text-[11px] uppercase tracking-widest text-slate-400">
                            {LANG_NAME[lesson.lang]} · {lesson.tour ? 'Guided' : 'Unguided'}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          {isNext && (
                            <span className={`${LABEL} rounded-full border border-yellow-300/60 px-2 py-0.5 text-yellow-200`}>
                              Up next
                            </span>
                          )}
                          {due.includes(lesson.id) && (
                            <span className={`${LABEL} rounded-full bg-yellow-300/15 px-2 py-0.5 text-yellow-100`}>
                              Due
                            </span>
                          )}
                          {isDone && <Pips strength={strength} />}
                          <span className="sr-only">
                            {isDone ? `Finished, strength ${strength} of ${MAX_BOX}` : 'Not finished yet'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">How it works.</span> Every lesson is one real
        piece of code. A guided lesson opens with a tour that names each part, then asks you to find
        and name those parts yourself. Later lessons leave the tour out. Finished lessons come back
        for review on a schedule, and the four bars beside each one show how well it is holding.
        Nothing leaves your machine.
      </div>

      <button
        onClick={onExit}
        aria-label={EXIT_LABEL}
        className={`mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white ${RING}`}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to all games
      </button>
    </div>
  );
}
