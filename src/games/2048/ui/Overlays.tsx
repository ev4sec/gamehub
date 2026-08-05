import type { Hud } from '../engine/types';

interface Props {
  hud: Hud;
  isBest: boolean;
  onRestart: () => void;
  onQuit: () => void;
  onKeepPlaying: () => void;
}

export function Overlays({ hud, isBest, onRestart, onQuit, onKeepPlaying }: Props) {
  if (hud.status === 'playing') return null;

  if (hud.status === 'won') {
    return (
      <Sheet>
        <h2 className="text-3xl font-black tracking-tight text-amber-300">
          {hud.goal.toLocaleString()}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Made it in {hud.moves} moves. The board is still perfectly playable.
        </p>
        <div className="mt-6 flex gap-3">
          <Action onClick={onKeepPlaying} primary>
            Keep going
          </Action>
          <Action onClick={onRestart}>Again</Action>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <h2 className="text-3xl font-black tracking-tight text-slate-100">Game Over</h2>
      <p className="mt-2 text-sm text-slate-400">Nothing left to slide.</p>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Score" value={hud.score.toLocaleString()} />
        <Figure label="Best tile" value={hud.highest.toLocaleString()} />
        <Figure label="Moves" value={String(hud.moves)} />
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
    <div
      data-overlay
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-950/85 px-6 text-center backdrop-blur-sm"
    >
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
          ? 'rounded-lg bg-amber-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-amber-300'
          : 'rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white'
      }
    >
      {children}
    </button>
  );
}
