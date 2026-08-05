import { Home, Pause, Play, Trophy } from 'lucide-react';
import type { Hud as HudModel } from '../engine/types';
import type { SaveData } from '../save';

interface Props {
  hud: HudModel;
  save: SaveData;
  onPause: () => void;
  onQuit: () => void;
}

export function Hud({ hud, save, onPause, onQuit }: Props) {
  const paused = hud.status === 'paused';
  const best = Math.max(save.bests[hud.mode] ?? 0, hud.score);
  const frightened = hud.ghostMode === 'frightened';

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-orange-300" />
          <Stat
            label="Best"
            value={best.toLocaleString()}
            tone="text-amber-300"
            icon={<Trophy size={12} />}
          />
        </div>

        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Level" value={String(hud.level)} tone="text-slate-200" />
          <Stat label="Dots" value={String(hud.dotsLeft)} tone="text-slate-400" />

          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Lives</div>
            <div
              className="flex items-center gap-1 text-xl font-bold text-orange-400"
              aria-label={`${hud.lives} lives left`}
            >
              {hud.lives > 4 ? (
                <>
                  <Pip />
                  <span className="tabular-nums">{hud.lives}</span>
                </>
              ) : (
                Array.from({ length: Math.max(0, hud.lives) }, (_, i) => <Pip key={i} />)
              )}
            </div>
          </div>

          <button
            onClick={onPause}
            aria-label={paused ? 'Resume' : 'Pause'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={onQuit}
            aria-label="Back to menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      {/*
        The same chip shape Snake and Breakout use for a power-up, on purpose.
        A fright timer is structurally a power-up timer, so it should look like
        one rather than being a fifth way of drawing the same idea.
      */}
      <div className="mt-2 flex h-7 items-center gap-2">
        {frightened && (
          <span
            className="relative flex items-center gap-1.5 overflow-hidden rounded-full border border-sky-300 px-2.5 py-1 text-xs font-medium text-sky-300"
            aria-label={`ghosts frightened for ${hud.frightSeconds} more seconds`}
          >
            <span
              className="absolute inset-y-0 left-0 bg-sky-300 opacity-20 transition-[width] duration-100"
              style={{ width: `${Math.max(0, Math.min(1, hud.frightFraction)) * 100}%` }}
              aria-hidden
            />
            <span className="relative" aria-hidden>
              !
            </span>
            <span className="relative">Fright</span>
            <span className="relative tabular-nums">{hud.frightSeconds}s</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Pip() {
  return <span className="block h-3 w-3 rounded-full bg-current" aria-hidden />;
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
