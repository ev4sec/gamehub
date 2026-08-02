import { ArrowLeft, Lock, Trophy, Volume2, VolumeX } from 'lucide-react';
import { EXIT_LABEL } from '../../../platform/game';
import { MODE_META } from '../engine/constants';
import type { Mode } from '../engine/types';
import { SKINS, isUnlocked } from '../skins';
import type { SaveData } from '../save';

const MODES: Mode[] = ['endless', 'timeAttack', 'maze', 'rival'];

interface Props {
  save: SaveData;
  onStart: (mode: Mode) => void;
  onSetSkin: (id: string) => void;
  onToggleSound: () => void;
  /** Leaves snake entirely and returns to the hub. */
  onExit: () => void;
}

export function Menu({ save, onStart, onSetSkin, onToggleSound, onExit }: Props) {
  const nextSkin = SKINS.find((s) => !isUnlocked(s, save.lifetimeApples));

  return (
    <div className="w-full max-w-3xl px-4 py-8">
      <button
        onClick={onExit}
        aria-label={EXIT_LABEL}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200"
      >
        <ArrowLeft size={15} />
        All games
      </button>

      <header className="text-center mb-8">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
          SNAKE
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Four modes, five power-ups, one rival who does not miss.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => {
          const meta = MODE_META[mode];
          const best = save.bests[mode] ?? 0;
          return (
            <button
              key={mode}
              onClick={() => onStart(mode)}
              className="group text-left rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5 transition hover:border-emerald-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="text-2xl text-emerald-400" aria-hidden>
                    {meta.glyph}
                  </span>
                  <span className="text-lg font-bold text-slate-100">{meta.label}</span>
                </span>
                {best > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-300">
                    <Trophy size={13} />
                    {best.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{meta.blurb}</p>
            </button>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Skins
          </h2>
          <span className="text-xs text-slate-500">
            {nextSkin
              ? `${nextSkin.name} at ${nextSkin.unlockAt} apples (${save.lifetimeApples} eaten)`
              : `All unlocked • ${save.lifetimeApples} apples eaten`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SKINS.map((skin) => {
            const unlocked = isUnlocked(skin, save.lifetimeApples);
            const active = save.skin === skin.id;
            return (
              <button
                key={skin.id}
                disabled={!unlocked}
                onClick={() => onSetSkin(skin.id)}
                title={unlocked ? skin.name : `Unlocks at ${skin.unlockAt} apples`}
                className={[
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                  active
                    ? 'border-emerald-400 bg-emerald-400/10 text-slate-100'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500',
                  unlocked ? '' : 'cursor-not-allowed opacity-45',
                ].join(' ')}
              >
                <span className="flex -space-x-1" aria-hidden>
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/40"
                    style={{ background: skin.head }}
                  />
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/40"
                    style={{ background: skin.tail }}
                  />
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-black/40"
                    style={{ background: skin.food }}
                  />
                </span>
                {skin.name}
                {!unlocked && <Lock size={12} />}
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5 text-sm text-slate-400">
        <span>
          {save.runs} run{save.runs === 1 ? '' : 's'} played
          {save.bestLevel > 0 && ` • maze level ${save.bestLevel + 1} reached`}
        </span>
        <button
          onClick={onToggleSound}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 transition hover:border-slate-500"
        >
          {save.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {save.sound ? 'Sound on' : 'Sound off'}
        </button>
      </footer>

      <p className="mt-6 text-center text-xs text-slate-500">
        Arrows or WASD to steer &bull; Space to pause &bull; swipe on touch
      </p>
    </div>
  );
}
