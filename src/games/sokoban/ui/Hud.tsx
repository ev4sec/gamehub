import { Home, RotateCcw, Undo2, Trophy } from 'lucide-react';
import type { Hud as HudModel } from '../engine/types';
import { bestFor, type SaveData } from '../save';

interface Props {
  hud: HudModel;
  save: SaveData;
  onUndo: () => void;
  onReset: () => void;
  onQuit: () => void;
}

export function Hud({ hud, save, onUndo, onReset, onQuit }: Props) {
  const best = bestFor(save, hud.levelIndex);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-5">
          <Stat label="Moves" value={String(hud.moves)} tone="text-slate-100" />
          <Stat label="Pushes" value={String(hud.pushes)} tone="text-slate-300" />
          <Stat
            label="Boxes"
            value={`${hud.onGoal}/${hud.boxes}`}
            tone={hud.onGoal === hud.boxes ? 'text-emerald-300' : 'text-amber-300'}
          />
          {best && (
            <Stat
              label="Best"
              value={`${best.moves}`}
              tone="text-sky-300"
              icon={<Trophy size={12} />}
            />
          )}
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={onUndo}
            disabled={!hud.canUndo}
            aria-label="Undo the last move"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition enabled:hover:border-slate-500 enabled:hover:text-white disabled:opacity-30"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onReset}
            aria-label="Restart the level"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onQuit}
            aria-label="Back to menu"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex h-5 items-center gap-2 text-xs">
        <span className="text-slate-500">{hud.name}</span>
        {hud.stuck && (
          <span className="rounded-full border border-rose-500/60 px-2 py-0.5 text-rose-300">
            A box is wedged in a corner. Undo, or restart the level.
          </span>
        )}
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
