import { levelCount } from '../engine/engine';
import type { Hud } from '../engine/types';

interface Props {
  hud: Hud;
  isBest: boolean;
  onNext: () => void;
  onReset: () => void;
  onQuit: () => void;
}

export function Overlays({ hud, isBest, onNext, onReset, onQuit }: Props) {
  if (hud.status !== 'solved') return null;

  const last = hud.levelIndex >= levelCount() - 1;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-950/88 px-6 text-center backdrop-blur-sm">
      <h2 className="text-3xl font-black tracking-tight text-emerald-300">Solved</h2>
      <p className="mt-2 text-sm text-slate-400">{hud.name}</p>

      <dl className="mt-5 flex items-end justify-center gap-6">
        <Figure label="Moves" value={String(hud.moves)} />
        <Figure label="Pushes" value={String(hud.pushes)} />
      </dl>

      {isBest && (
        <p className="mt-4 text-sm font-semibold text-amber-300">A new personal best.</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onNext}
          className="rounded-lg bg-emerald-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {last ? 'Back to levels' : 'Next level'}
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Again
        </button>
        <button
          onClick={onQuit}
          className="rounded-lg border border-slate-700 px-5 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Menu
        </button>
      </div>
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
