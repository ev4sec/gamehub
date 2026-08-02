import type { Hud } from '../engine/types';

interface Props {
  hud: Hud;
  isBest: boolean;
  levelName: string;
  onLaunch: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onResume: () => void;
  onNextLevel: () => void;
}

export function Overlays({
  hud,
  isBest,
  levelName,
  onLaunch,
  onRestart,
  onQuit,
  onResume,
  onNextLevel,
}: Props) {
  if (hud.status === 'playing') return null;

  if (hud.status === 'ready') {
    return (
      <Sheet dim={false}>
        <h2 className="text-2xl font-bold text-slate-100">{levelName}</h2>
        <p className="mt-2 text-sm text-slate-400">Space, or click, to launch.</p>
        <div className="mt-5">
          <Action onClick={onLaunch} primary>
            Launch
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
      <Sheet>
        <h2 className="text-3xl font-black tracking-tight text-emerald-300">Wall down</h2>
        <p className="mt-2 text-sm text-slate-400">
          {levelName} cleared with {hud.lives} {hud.lives === 1 ? 'life' : 'lives'} in hand.
        </p>
        <div className="mt-6 flex gap-3">
          <Action onClick={onNextLevel} primary>
            Next
          </Action>
          <Action onClick={onQuit}>Menu</Action>
        </div>
      </Sheet>
    );
  }

  const won = hud.status === 'cleared';

  return (
    <Sheet>
      <h2
        className={`text-3xl font-black tracking-tight ${won ? 'text-sky-300' : 'text-slate-100'}`}
      >
        {won ? 'All walls down' : 'Game Over'}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        {won ? 'Every level cleared.' : 'That was the last ball.'}
      </p>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Score" value={hud.score.toLocaleString()} />
        <Figure label={hud.mode === 'endless' ? 'Wave' : 'Level'} value={String(hud.level + 1)} />
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

function Sheet({ children, dim = true }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div
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
      className={
        primary
          ? 'rounded-lg bg-sky-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-sky-300'
          : 'rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white'
      }
    >
      {children}
    </button>
  );
}
