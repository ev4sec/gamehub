import { Clock, Home, Pause, Play, Trophy } from 'lucide-react';
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

  // Three carriers, not one. Colour alone would fail a player who cannot
  // separate lime from amber, so the clock icon appears and the numeral is
  // always there beside the bar.
  const urgent = hud.timeFraction < 0.1;
  const low = hud.timeFraction < 0.25;
  const barColor = urgent ? '#fb7185' : low ? '#fbbf24' : '#a3e635';

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-lime-300" />
          <Stat
            label="Best"
            value={best.toLocaleString()}
            tone="text-amber-300"
            icon={<Trophy size={12} />}
          />
        </div>

        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Level" value={String(hud.level)} tone="text-slate-200" />

          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Lives</div>
            <div
              className="flex items-center gap-1 text-xl font-bold text-lime-400"
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

      <div className="mt-2 flex h-7 items-center gap-3">
        {low && <Clock size={12} className="shrink-0 text-amber-300" aria-hidden />}
        <span
          className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800"
          aria-label={`${hud.secondsLeft} seconds left`}
          role="img"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${Math.max(0, Math.min(1, hud.timeFraction)) * 100}%`,
              background: barColor,
            }}
            aria-hidden
          />
        </span>
        <span className="shrink-0 tabular-nums text-xs text-slate-400">
          {hud.secondsLeft}s
        </span>
        <span className="flex shrink-0 items-center gap-1" aria-label="bays filled">
          {hud.homes.map((filled, i) => (
            <span
              key={i}
              className={`block h-2 w-2 rounded-full ${
                filled ? 'bg-lime-300' : 'border border-slate-600'
              }`}
            />
          ))}
        </span>
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
