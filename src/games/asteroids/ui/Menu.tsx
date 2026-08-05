import { ArrowLeft, Check, Volume2, VolumeX } from 'lucide-react';
import { MODES, MODE_META } from '../engine/constants';
import type { Mode } from '../engine/types';
import type { SaveData } from '../save';
import { EXIT_LABEL } from '../../../platform/game';

interface Props {
  save: SaveData;
  onStart: (mode: Mode) => void;
  onToggleSound: () => void;
  onToggleHanded: () => void;
  onExit: () => void;
}

export function Menu({ save, onStart, onToggleSound, onToggleHanded, onExit }: Props) {
  return (
    <div className="w-full max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-fuchsia-300">ASTEROIDS</h1>
          <p className="mt-2 text-sm text-slate-400">
            {save.runs > 0
              ? `${save.runs} run${save.runs === 1 ? '' : 's'}, ${save.lifetimeRocks.toLocaleString()} rocks broken, wave ${save.bestWave} at best.`
              : 'Nothing stops you but the rocks, and there is no edge to hide behind.'}
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

      <ul className="grid gap-3">
        {MODES.map((mode) => (
          <li key={mode}>
            <button
              onClick={() => onStart(mode)}
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5 text-left transition hover:border-fuchsia-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
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

      {/*
        The control diagram and the handedness toggle are shown only where they
        mean something. This is the one novel control scheme in the collection,
        so it gets explained rather than discovered.
      */}
      <div className="mt-8 hidden rounded-xl border border-slate-800 bg-slate-900/40 p-4 [@media(hover:none)]:block">
        <div className="flex items-center gap-4">
          <svg width="104" height="58" viewBox="0 0 104 58" aria-hidden focusable="false">
            <rect
              x="1"
              y="1"
              width="102"
              height="56"
              rx="7"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle cx="28" cy="34" r="14" fill="none" stroke="#e879f9" strokeWidth="1.5" />
            <circle cx="28" cy="34" r="5" fill="#e879f9" opacity="0.55" />
            <circle cx="76" cy="34" r="10" fill="none" stroke="#e879f9" strokeWidth="1.5" />
            <path d="M76 28 l5 12 l-5 -3 l-5 3 z" fill="#f0abfc" opacity="0.6" />
          </svg>
          <dl className="text-[10px] uppercase tracking-widest text-slate-500">
            <div className="flex gap-2">
              <dt className="text-slate-400">Left</dt>
              <dd>steer, push to thrust</dd>
            </div>
            <div className="mt-1 flex gap-2">
              <dt className="text-slate-400">Right</dt>
              <dd>tap or hold to fire</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={onToggleHanded}
          aria-label="Swap control sides"
          aria-pressed={save.leftHanded}
          className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
            save.leftHanded
              ? 'border-fuchsia-400 text-fuchsia-300'
              : 'border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          {save.leftHanded ? <Check size={14} /> : <span className="w-3.5" aria-hidden />}
          Left-handed
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Controls.</span> Left and right
        turn, up thrusts, space fires, shift jumps to hyperspace. P pauses, Escape
        leaves.
      </div>

      <button
        onClick={onExit}
        aria-label={EXIT_LABEL}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to all games
      </button>
    </div>
  );
}
