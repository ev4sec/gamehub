import { ArrowLeft, Check, Volume2, VolumeX } from 'lucide-react';
import { LEVELS } from '../engine/levels';
import { bestFor, solvedCount, type SaveData } from '../save';
import { EXIT_LABEL } from '../../../platform/game';

interface Props {
  save: SaveData;
  onStart: (levelIndex: number) => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export function Menu({ save, onStart, onToggleSound, onExit }: Props) {
  const solved = solvedCount(save);

  return (
    <div className="w-full max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-violet-300">SOKOBAN</h1>
          <p className="mt-2 text-sm text-slate-400">
            {solved > 0
              ? `${solved} of ${LEVELS.length} levels solved.`
              : 'Push every box onto a marker. You can only push, never pull.'}
          </p>
        </div>
        <button
          onClick={onToggleSound}
          aria-label={save.sound ? 'Mute sound' : 'Unmute sound'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          {save.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((level, index) => {
          const best = bestFor(save, index);
          return (
            <li key={level.name}>
              <button
                onClick={() => onStart(index)}
                className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 p-4 text-left transition hover:border-violet-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-bold text-slate-100">
                    {index + 1}. {level.name}
                  </span>
                  {best && (
                    <span className="flex items-center gap-1 text-xs text-violet-300">
                      <Check size={12} />
                      {best.moves}
                    </span>
                  )}
                </div>
                <span className="mt-1 block text-xs text-slate-500">
                  {best ? `${best.moves} moves, ${best.pushes} pushes` : 'Not solved yet'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Controls.</span> Arrows or WASD
        walk and push. U takes back a move, and the history goes all the way to the
        start. R restarts the level, N moves on once it is solved, Escape leaves.
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
