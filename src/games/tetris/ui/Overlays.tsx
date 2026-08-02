import { SPRINT_LINES } from '../engine/constants';
import type { Hud } from '../engine/types';
import { formatDuration } from '../save';

interface Props {
  hud: Hud;
  isBest: boolean;
  onRestart: () => void;
  onQuit: () => void;
  onResume: () => void;
}

export function Overlays({ hud, isBest, onRestart, onQuit, onResume }: Props) {
  if (hud.status === 'playing') return null;

  if (hud.status === 'paused') {
    return (
      <Sheet>
        <h2 className="text-3xl font-black tracking-tight text-slate-100">Paused</h2>
        <p className="mt-2 text-sm text-slate-400">P or the button above to resume.</p>
        <div className="mt-6 flex gap-3">
          <Action onClick={onResume} primary>
            Resume
          </Action>
          <Action onClick={onQuit}>Menu</Action>
        </div>
      </Sheet>
    );
  }

  const won = hud.status === 'cleared';

  return (
    <Sheet>
      <h2 className={`text-3xl font-black tracking-tight ${won ? 'text-cyan-300' : 'text-slate-100'}`}>
        {won ? 'Sprint complete' : 'Game Over'}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {won
          ? `${SPRINT_LINES} lines in ${formatDuration(hud.elapsedMs)}.`
          : hud.mode === 'ultra'
            ? 'Time is up.'
            : 'The well filled up.'}
      </p>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Score" value={hud.score.toLocaleString()} />
        <Figure label="Lines" value={String(hud.lines)} />
        <Figure label="Level" value={String(hud.level)} />
      </dl>

      {isBest && (
        <p className="mt-4 text-sm font-semibold text-amber-300">A new personal best.</p>
      )}

      <div className="mt-6 flex gap-3">
        <Action onClick={onRestart} primary>
          Again
        </Action>
        <Action onClick={onQuit}>Menu</Action>
      </div>
    </Sheet>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 px-6 text-center backdrop-blur-sm">
      {children}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums text-slate-100">{value}</dd>
    </div>
  );
}

function Action({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? 'rounded-lg bg-cyan-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300'
          : 'rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white'
      }
    >
      {children}
    </button>
  );
}
