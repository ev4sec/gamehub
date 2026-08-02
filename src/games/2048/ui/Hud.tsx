import { Home, RotateCcw, Undo2, Trophy } from 'lucide-react';
import type { Hud as HudModel } from '../engine/types';
import type { SaveData } from '../save';

interface Props {
  hud: HudModel;
  save: SaveData;
  onUndo: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function Hud({ hud, save, onUndo, onRestart, onQuit }: Props) {
  const best = Math.max(save.bests[hud.mode] ?? 0, hud.score);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-amber-300" />
          <Stat
            label="Best"
            value={best.toLocaleString()}
            tone="text-slate-200"
            icon={<Trophy size={12} />}
          />
          <Stat label="Moves" value={String(hud.moves)} tone="text-slate-400" />
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
            onClick={onRestart}
            aria-label="Start again"
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

      <p className="mt-2 text-xs text-slate-500">
        Goal {hud.goal.toLocaleString()}
        {hud.highest > 0 && <> · best tile this run {hud.highest.toLocaleString()}</>}
      </p>
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
