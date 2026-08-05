import { MODE_META } from '../engine/constants';
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
    return (
      // The whole sheet is the dismiss target. A player who has already tapped
      // to fire should not have their first shot of the wave eaten by a banner.
      <Sheet dim={false} onDismiss={onSkip}>
        <h2 className="text-3xl font-black tracking-tight text-rose-300">
          Wave {hud.wave}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {hud.incoming} inbound. {hud.cities} {hud.cities === 1 ? 'city' : 'cities'} standing.
        </p>
        <div className="mt-5">
          <Action onClick={onSkip} primary>
            Begin
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

  if (hud.status === 'waveComplete' && hud.tally) {
    return (
      <Sheet onDismiss={onSkip}>
        <h2 className="text-3xl font-black tracking-tight text-emerald-300">
          Wave {hud.wave} held
        </h2>

        <dl className="mt-5 flex items-end justify-center gap-6">
          <Figure label="Cities" value={String(hud.tally.cities)} />
          <Figure label="Ammo left" value={String(hud.tally.ammo)} />
          <Figure label="Bonus" value={hud.tally.points.toLocaleString()} />
        </dl>

        <div className="mt-6">
          <Action onClick={onSkip} primary>
            Next wave
          </Action>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <h2 className="text-3xl font-black tracking-tight text-slate-100">
        The last city is gone
      </h2>
      <p className="mt-2 text-sm text-slate-400">{MODE_META[hud.mode].label} run ended.</p>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Score" value={hud.score.toLocaleString()} />
        <Figure label="Wave" value={String(hud.wave)} />
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
      // Stops here rather than bubbling to the field beneath, which would
      // fire a live interceptor at whatever the player tapped to dismiss.
      onPointerDown={(e) => {
        e.stopPropagation();
        onDismiss?.();
      }}
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
      // The sheet behind this one dismisses on pointer-down, so a button that
      // let the event through would act twice: once here, once there.
      onPointerDown={(e) => e.stopPropagation()}
      className={
        primary
          ? 'rounded-lg bg-rose-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-rose-300'
          : 'rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white'
      }
    >
      {children}
    </button>
  );
}
