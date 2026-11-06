import { ArrowLeft, Check } from 'lucide-react';
import { EXIT_LABEL } from '../../../platform/game';
import { LEVELS, WORLDS, levelsIn } from '../engine/levels';
import type { SaveData } from '../save';

interface Props {
  save: SaveData;
  onOpen: (levelId: string) => void;
  onExit: () => void;
}

const KIND_LABEL = { predict: 'Predict', write: 'Write', locate: 'Locate', read: 'Read' } as const;

export function Menu({ save, onOpen, onExit }: Props) {
  const done = save.solved.length;
  const firstOpen = LEVELS.find((l) => !save.solved.includes(l.id));

  return (
    <div className="w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-5xl font-black tracking-tight text-indigo-300">Code Lab</h1>
          <span className="rounded-full border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
            In development
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Real Python, running for real. Predict what code does, finish code, and trace where
          every import comes from. {done > 0 ? `${done} of ${LEVELS.length} solved.` : ''}
        </p>
        {firstOpen && (
          <button
            onClick={() => onOpen(firstOpen.id)}
            className="mt-4 rounded-lg border border-indigo-400/60 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/20"
          >
            {done === 0 ? 'Start' : 'Continue'}: {firstOpen.title}
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {WORLDS.map((world) => {
          const levels = levelsIn(world.id);
          const solved = levels.filter((l) => save.solved.includes(l.id)).length;
          return (
            <section key={world.id} aria-label={world.title}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-100">{world.title}</h2>
                <span className="text-xs uppercase tracking-widest text-indigo-300">
                  {solved}/{levels.length}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate-500">{world.blurb}</p>
              <ul data-nav-grid className="grid gap-2">
                {levels.map((level) => {
                  const isDone = save.solved.includes(level.id);
                  return (
                    <li key={level.id}>
                      <button
                        data-level={level.id}
                        onClick={() => onOpen(level.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-800/40 px-4 py-3 text-left transition hover:border-indigo-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <span className="text-sm font-semibold text-slate-100">{level.title}</span>
                        <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
                          {KIND_LABEL[level.kind]}
                          {isDone && <Check size={14} className="text-emerald-300" aria-label="solved" />}
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

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">How it works.</span> Predict levels check
        your answer, then let you run the code to see Python agree. Write levels run your code
        against hidden tests. The first run starts Python in your browser, which takes a few
        seconds. Nothing leaves your machine.
      </div>

      <button
        onClick={onExit}
        aria-label={EXIT_LABEL}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to all games
      </button>
    </div>
  );
}
