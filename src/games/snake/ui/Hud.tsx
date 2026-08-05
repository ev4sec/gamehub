import { Home, Pause, Play, Trophy } from 'lucide-react';
import { EFFECT_TICKS, POWER_META } from '../engine/constants';
import type { Hud as HudModel } from '../engine/types';
import type { SaveData } from '../save';

interface Props {
  hud: HudModel;
  save: SaveData;
  onPause: () => void;
  onQuit: () => void;
}

function formatClock(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  const seconds = Math.floor(total);
  const tenths = Math.floor((total - seconds) * 10);
  return `${seconds}.${tenths}`;
}

export function Hud({ hud, save, onPause, onQuit }: Props) {
  const best = save.bests[hud.mode] ?? 0;
  const paused = hud.status === 'paused';
  const lowTime = hud.mode === 'timeAttack' && hud.timeLeft < 10_000;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-emerald-300" />
          <Stat
            label="Best"
            value={Math.max(best, hud.score).toLocaleString()}
            tone="text-amber-300"
            icon={<Trophy size={12} />}
          />
          {hud.combo > 1 && (
            <Stat label="Combo" value={`x${hud.combo}`} tone="text-fuchsia-300" />
          )}
        </div>

        <div className="flex items-end gap-3 sm:gap-5">
          {hud.mode === 'timeAttack' && (
            <Stat
              label="Time"
              value={formatClock(hud.timeLeft)}
              tone={lowTime ? 'text-red-400 animate-pulse motion-reduce:animate-none' : 'text-sky-300'}
            />
          )}
          {hud.mode === 'maze' && (
            <>
              <Stat label="Level" value={String(hud.level + 1)} tone="text-sky-300" />
              <Stat label="To clear" value={String(hud.levelGoal)} tone="text-slate-200" />
            </>
          )}
          {hud.mode === 'rival' && (
            <Stat
              label="Rival"
              value={hud.rivalLength > 0 ? String(hud.rivalLength) : '—'}
              tone="text-sky-300"
            />
          )}
          {hud.mode === 'endless' && (
            <Stat label="Length" value={String(hud.length)} tone="text-slate-200" />
          )}

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

      <div className="mt-3 flex h-7 flex-wrap items-center gap-2">
        {hud.effects.map((effect) => {
          const meta = POWER_META[effect.kind];
          const total = EFFECT_TICKS[effect.kind] || 1;
          const remaining = Math.max(0, effect.ticks / total);
          return (
            <span
              key={effect.kind}
              className="relative flex items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              <span
                className="absolute inset-y-0 left-0 opacity-20 transition-[width] duration-100"
                style={{ background: meta.color, width: `${remaining * 100}%` }}
                aria-hidden
              />
              <span className="relative" aria-hidden>
                {meta.glyph}
              </span>
              <span className="relative">{meta.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
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
