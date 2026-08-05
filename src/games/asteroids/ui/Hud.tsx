import { Home, Pause, Play, Trophy } from 'lucide-react';
import type { Hud as HudModel } from '../engine/types';
import type { SaveData } from '../save';

interface Props {
  hud: HudModel;
  save: SaveData;
  onPause: () => void;
  onQuit: () => void;
}

/** Deliberately lean. This game is about the field, not about the readout. */
export function Hud({ hud, save, onPause, onQuit }: Props) {
  const paused = hud.status === 'paused';
  const best = Math.max(save.bests[hud.mode] ?? 0, hud.score);

  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="flex items-end gap-3 sm:gap-5">
        <Stat label="Score" value={hud.score.toLocaleString()} tone="text-fuchsia-300" />
        <Stat
          label="Best"
          value={best.toLocaleString()}
          tone="text-amber-300"
          icon={<Trophy size={12} />}
        />
      </div>

      <div className="flex items-end gap-3 sm:gap-5">
        <Stat label="Wave" value={String(hud.wave)} tone="text-slate-200" />
        <Stat label="Rocks" value={String(hud.rocks)} tone="text-slate-400" />

        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Ships</div>
          <div
            className="flex items-center gap-1 text-xl font-bold text-fuchsia-300"
            aria-label={`${hud.lives} ships left`}
          >
            {hud.lives > 5 ? (
              <>
                <ShipPip />
                <span className="tabular-nums">{hud.lives}</span>
              </>
            ) : (
              Array.from({ length: Math.max(0, hud.lives) }, (_, i) => <ShipPip key={i} />)
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
  );
}

/** The ship's own outline, so the count reads as ships rather than as hearts. */
function ShipPip() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden focusable="false">
      <path
        d="M6 0 L11 13 L6 10 L1 13 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
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
