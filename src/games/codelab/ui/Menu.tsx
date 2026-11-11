import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { EXIT_LABEL } from '../../../platform/game';
import { CORE, PRACTICE, TRACKS, WORLDS, coreIn, isPractice, levelsIn } from '../engine/levels';
import { MAX_BOX, dueIds, nextDue, waitText } from '../../../platform/spacedReview';
import type { LevelKind, Track } from '../engine/types';
import type { SaveData } from '../save';
import { Pips } from './Pips';

interface Props {
  save: SaveData;
  now: number;
  /** The level to put the keyboard back on, after returning from it. */
  lastId: string | null;
  onOpen: (levelId: string) => void;
  onTrack: (track: Track) => void;
  onReview: () => void;
  onExit: () => void;
}

const KIND_LABEL: Record<LevelKind, string> = {
  predict: 'Predict',
  write: 'Write',
  fix: 'Fix',
  locate: 'Locate',
  read: 'Read',
};

const ORDER = CORE.map((l) => l.id);
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em]';

export function Menu({ save, now, lastId, onOpen, onTrack, onReview, onExit }: Props) {
  const track = save.track;
  const path = coreIn(track);
  // Progress is counted in reading levels only. Practice solved on the side
  // is shown on its own rows and nowhere else.
  const done = path.filter((l) => save.solved.includes(l.id)).length;
  const firstOpen = path.find((l) => !save.solved.includes(l.id));
  // Hidden until asked for, unless the player has just come back from one.
  const [practice, setPractice] = useState(() => PRACTICE.some((l) => l.id === lastId));
  const due = dueIds(save.cards, ORDER, now);
  const upcoming = nextDue(save.cards, now);
  const anyDue = due.length > 0;
  // Where the first arrow press lands: back where the player just was, or else
  // on whatever this screen is asking for.
  const initial = lastId ?? (anyDue ? 'review' : 'continue');

  return (
    // One grid for the whole screen. The shell's arrow keys only ever look at
    // the first grid they find, so a grid per world left five worlds unreachable.
    <div data-nav-grid className="w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-5xl font-black tracking-tight text-indigo-300">Code Lab</h1>
          <span className="rounded-full border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
            In development
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Real code, running for real. Read it, say what it does, and learn the shapes you will
          be handed. Nothing here asks you to write any.{' '}
          {done > 0 ? `${done} of ${path.length} solved.` : ''}
        </p>

        <div role="group" aria-label="Language" className="mt-4 inline-flex rounded-lg border border-slate-700 p-0.5">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              data-track={t.id}
              aria-pressed={track === t.id}
              onClick={() => onTrack(t.id)}
              className={`min-h-11 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                track === t.id ? 'bg-indigo-400/15 text-indigo-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {anyDue && (
          <button
            data-review-due={due.length}
            data-nav-initial={initial === 'review' ? '' : undefined}
            onClick={onReview}
            className="mt-4 flex w-full items-center justify-between gap-4 rounded-xl border border-indigo-400/70 bg-indigo-400/10 px-5 py-4 text-left transition hover:bg-indigo-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span>
              <span className={`${LABEL} block text-indigo-300`}>Due for review</span>
              <span className="block text-4xl font-black tabular-nums text-slate-100">{due.length}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-100">
              Start review
              <ArrowRight size={16} />
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

        {firstOpen && (
          <button
            data-nav-initial={initial === 'continue' ? '' : undefined}
            onClick={() => onOpen(firstOpen.id)}
            className={
              anyDue
                ? 'mt-3 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
                : 'mt-4 rounded-lg border border-indigo-400/60 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
            }
          >
            {done === 0 ? 'Start' : 'Continue'}: {firstOpen.title}
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {WORLDS.filter((w) => w.track === track).map((world) => {
          const all = levelsIn(world.id);
          const reading = all.filter((l) => !isPractice(l));
          const levels = practice ? all : reading;
          const solved = reading.filter((l) => save.solved.includes(l.id)).length;
          return (
            <section key={world.id} aria-label={world.title}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-100">{world.title}</h2>
                <span className="text-xs uppercase tracking-widest text-indigo-300">
                  {solved}/{reading.length}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate-400">{world.blurb}</p>
              <ul className="grid gap-2">
                {levels.map((level) => {
                  const isDone = save.solved.includes(level.id);
                  const strength = save.cards[level.id]?.box ?? 0;
                  const isDue = due.includes(level.id);
                  return (
                    <li key={level.id}>
                      <button
                        data-level={level.id}
                        data-nav-initial={initial === level.id ? '' : undefined}
                        onClick={() => onOpen(level.id)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-800/40 px-4 py-2.5 text-left transition hover:border-indigo-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-100">{level.title}</span>
                          <span className="block text-[11px] uppercase tracking-widest text-slate-400">
                            {KIND_LABEL[level.kind]}
                            {isPractice(level) && ' · optional practice'}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          {isDue && (
                            <span className={`${LABEL} rounded-full bg-indigo-400/15 px-2 py-0.5 text-indigo-200`}>
                              Due
                            </span>
                          )}
                          {isDone && <Pips strength={strength} />}
                          <span className="sr-only">
                            {isDone ? `Solved, strength ${strength} of ${MAX_BOX}` : 'Not solved yet'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {track === 'python' && <button
        onClick={() => setPractice((p) => !p)}
        aria-expanded={practice}
        data-practice-toggle
        className="mt-6 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-left hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span>
          <span className="block text-sm font-semibold text-slate-200">
            {practice ? 'Hide writing practice' : 'Show writing practice'}
          </span>
          <span className="block text-xs text-slate-400">
            {PRACTICE.length} optional levels that ask you to write or repair code. They are not
            part of the path, the progress count or review.
          </span>
        </span>
        {practice ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">How it works.</span> Every level on the path
        shows you code and asks what it does. Predict levels ask for your answer before they let
        you run the code. On the Python track you can then step through it one line at a time.
        Solved levels from both tracks come back for review on a schedule, and the four bars beside
        each one show how well it is holding. The first Python run starts an interpreter in your
        browser, which takes a few seconds. Nothing leaves your machine.
      </div>

      <button
        onClick={onExit}
        aria-label={EXIT_LABEL}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <ArrowLeft size={14} />
        Back to all games
      </button>
    </div>
  );
}
