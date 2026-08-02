import { Home, Pause, Play, Trophy } from 'lucide-react';
import { SPRINT_LINES } from '../engine/constants';
import type { Hud as HudModel } from '../engine/types';
import { formatBest, formatDuration, type SaveData } from '../save';
import { PieceView } from './PieceView';

interface Props {
  hud: HudModel;
  save: SaveData;
  onPause: () => void;
  onQuit: () => void;
}

export function Hud({ hud, save, onPause, onQuit }: Props) {
  const paused = hud.status === 'paused';
  const lowTime = hud.mode === 'ultra' && hud.timeLeftMs < 15_000;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-5">
          <Stat label="Score" value={hud.score.toLocaleString()} tone="text-cyan-300" />
          <Stat
            label="Best"
            value={formatBest(hud.mode, save.bests[hud.mode] ?? 0)}
            tone="text-amber-300"
            icon={<Trophy size={12} />}
          />
          {hud.combo > 0 && (
            <Stat label="Combo" value={`x${hud.combo}`} tone="text-fuchsia-300" />
          )}
          {hud.backToBack && <Stat label="B2B" value="on" tone="text-orange-300" />}
        </div>

        <div className="flex items-end gap-5">
          {hud.mode === 'sprint' && (
            <Stat
              label="Lines"
              value={`${hud.lines}/${SPRINT_LINES}`}
              tone="text-slate-200"
            />
          )}
          {hud.mode !== 'sprint' && (
            <Stat label="Lines" value={String(hud.lines)} tone="text-slate-200" />
          )}
          {hud.mode === 'ultra' ? (
            <Stat
              label="Time"
              value={formatDuration(hud.timeLeftMs)}
              tone={lowTime ? 'text-red-400 animate-pulse' : 'text-sky-300'}
            />
          ) : (
            <Stat label="Time" value={formatDuration(hud.elapsedMs)} tone="text-sky-300" />
          )}
          <Stat label="Level" value={String(hud.level)} tone="text-emerald-300" />

          <button
            onClick={onPause}
            aria-label={paused ? 'Resume' : 'Pause'}
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
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

      <div className="mt-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Hold</span>
          <PieceView kind={hud.hold} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Next</span>
          <div className="flex items-center gap-3">
            {hud.next.map((kind, i) => (
              <PieceView key={`${kind}-${i}`} kind={kind} size={i === 0 ? 12 : 9} />
            ))}
          </div>
        </div>
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
