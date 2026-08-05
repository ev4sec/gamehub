import { Building2, Home, Pause, Play, Rocket, Trophy } from 'lucide-react';
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

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-rose-300" />
          <Stat
            label="Best"
            value={best.toLocaleString()}
            tone="text-amber-300"
            icon={<Trophy size={12} />}
          />
        </div>

        <div className="flex items-end gap-3 sm:gap-5">
          <Stat label="Wave" value={String(hud.wave)} tone="text-slate-200" />
          <Stat
            label="Inbound"
            value={String(hud.incoming)}
            tone={hud.incoming > 0 ? 'text-slate-300' : 'text-slate-600'}
          />

          <div>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
              <Building2 size={12} />
              Cities
            </div>
            <div
              className="text-xl font-bold tabular-nums text-sky-300"
              aria-label={`${hud.cities} cities standing`}
            >
              {hud.cities}
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
        Ammo per battery rather than one total. Which battery is dry decides
        which half of the sky the player can still defend, and a single number
        hides exactly that.
      */}
      <div className="mt-3 flex h-7 items-center gap-3 text-xs">
        <Rocket size={12} className="text-slate-500" aria-hidden />
        {hud.batteries.map((battery, i) => (
          <span
            key={i}
            className={`tabular-nums font-semibold ${
              !battery.alive
                ? 'text-slate-700 line-through'
                : battery.ammo === 0
                  ? 'text-rose-400'
                  : battery.ammo <= 3
                    ? 'text-amber-300'
                    : 'text-slate-300'
            }`}
            aria-label={
              battery.alive
                ? `battery ${i + 1}, ${battery.ammo} left`
                : `battery ${i + 1} destroyed`
            }
          >
            {battery.alive ? battery.ammo : '--'}
          </span>
        ))}
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
