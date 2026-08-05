import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { MODES, MODE_META } from '../engine/constants';
import type { Mode } from '../engine/types';
import type { SaveData } from '../save';
import { EXIT_LABEL } from '../../../platform/game';

interface Props {
  save: SaveData;
  onStart: (mode: Mode) => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export function Menu({ save, onStart, onToggleSound, onExit }: Props) {
  return (
    <div className="w-full max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-sky-300">BREAKOUT</h1>
          <p className="mt-2 text-sm text-slate-400">
            {save.runs > 0
              ? `${save.runs} run${save.runs === 1 ? '' : 's'}, ${save.lifetimeBricks.toLocaleString()} bricks broken.`
              : 'The paddle aims. Where the ball lands on it decides where it goes.'}
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

      <ul data-nav-grid className="grid gap-3">
        {MODES.map((mode) => (
          <li key={mode}>
            <button
              onClick={() => onStart(mode)}
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5 text-left transition hover:border-sky-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-lg font-bold text-slate-100">
                  {MODE_META[mode].label}
                </span>
                <span className="text-xs uppercase tracking-widest text-amber-300">
                  {(save.bests[mode] ?? 0) > 0 ? (save.bests[mode] ?? 0).toLocaleString() : '—'}
                </span>
              </div>
              <span className="mt-1 block text-sm leading-relaxed text-slate-400">
                {MODE_META[mode].blurb}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Controls.</span> Move the mouse
        or drag to steer, or use the arrow keys. Space launches the ball and releases
        it when it is stuck. P pauses, Escape leaves.
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
