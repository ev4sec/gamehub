import type { Hud } from '../engine/types';

interface Props {
  hud: Hud;
  isBest: boolean;
  onSkip: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onResume: () => void;
}

export function Overlays({ hud, isBest, onSkip, onRestart, onQuit, onResume }: Props) {
  if (hud.status === 'playing') return null;

  if (hud.status === 'ready') {
    const filled = hud.homes.filter(Boolean).length;
    return (
      // Undimmed and dismissable anywhere, because this banner sits between a
      // player and the run they are already trying to make.
      <Sheet dim={false} onDismiss={onSkip}>
        <h2 className="text-3xl font-black tracking-tight text-lime-300">
          {filled === 0 ? `Level ${hud.level}` : `${5 - filled} to go`}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {hud.lives} {hud.lives === 1 ? 'life' : 'lives'} left.
        </p>
        <div className="mt-5">
          <Action onClick={onSkip} primary>
            Hop to it
          </Action>
        </div>
      </Sheet>
    );
  }

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

  if (hud.status === 'levelComplete') {
    return (
      <Sheet onDismiss={onSkip}>
        <h2 className="text-3xl font-black tracking-tight text-emerald-300">
          All five bays filled
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Level {hud.level} done. The next one moves faster.
        </p>
        <div className="mt-6">
          <Action onClick={onSkip} primary>
            Next level
          </Action>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <h2 className="text-3xl font-black tracking-tight text-slate-100">Out of frogs</h2>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Score" value={hud.score.toLocaleString()} />
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

function Sheet({
  children,
  dim = true,
  onDismiss,
}: {
  children: React.ReactNode;
  dim?: boolean;
  onDismiss?: () => void;
}) {
  return (
    <div
      // Stops here rather than reaching the board underneath, which takes a tap
      // as a hop forward and would have the frog moving before it is meant to.
      onPointerDown={(e) => {
        e.stopPropagation();
        onDismiss?.();
      }}
      data-overlay
      className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${
        dim ? 'bg-slate-950/85 backdrop-blur-sm' : 'bg-slate-950/45'
      }`}
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
      onPointerDown={(e) => e.stopPropagation()}
      className={
        primary
          ? 'rounded-lg bg-lime-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-300'
          : 'rounded-lg border border-slate-700 px-5 py-2.5 text-slate-300 transition hover:border-slate-500 hover:text-white'
      }
    >
      {children}
    </button>
  );
}
