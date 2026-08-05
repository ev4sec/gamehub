import { ChevronRight, Home, RotateCcw, Trophy } from 'lucide-react';
import { LEVELS } from '../engine/levels';
import type { DeathCause, Hud } from '../engine/types';

const DEATH_TEXT: Record<DeathCause, string> = {
  wall: 'You hit a wall.',
  self: 'You ate yourself.',
  rival: 'The rival got you.',
  time: 'Out of time.',
};

interface Props {
  hud: Hud;
  isBest: boolean;
  best: number;
  onRestart: () => void;
  onQuit: () => void;
  onContinue: () => void;
  onResume: () => void;
}

export function Overlays({
  hud,
  isBest,
  best,
  onRestart,
  onQuit,
  onContinue,
  onResume,
}: Props) {
  if (hud.status === 'playing') return null;

  return (
    <div
      data-overlay
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/80 backdrop-blur-sm"
    >
      {hud.status === 'paused' && (
        <Panel title="Paused" accent="text-slate-100">
          <p className="text-sm text-slate-400">Press Space to resume.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Action onClick={onResume} primary>
              Resume
            </Action>
            <Action onClick={onQuit}>
              <Home size={15} /> Menu
            </Action>
          </div>
        </Panel>
      )}

      {hud.status === 'levelComplete' && (
        <Panel title={`Level ${hud.level + 1} clear`} accent="text-sky-300">
          <p className="text-sm text-slate-400">
            Next up: {LEVELS[(hud.level + 1) % LEVELS.length].name}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Action onClick={onContinue} primary>
              Continue <ChevronRight size={15} />
            </Action>
          </div>
        </Panel>
      )}

      {hud.status === 'over' && (
        <Panel title="Game Over" accent="text-red-400">
          <p className="text-sm text-slate-400">
            {hud.deathCause ? DEATH_TEXT[hud.deathCause] : ''}
          </p>

          {isBest ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-amber-300">
              <Trophy size={16} /> New best: {hud.score.toLocaleString()}
            </p>
          ) : (
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className="text-slate-300">
                Score <b className="text-slate-100">{hud.score.toLocaleString()}</b>
              </span>
              <span className="text-slate-300">
                Best <b className="text-amber-300">{best.toLocaleString()}</b>
              </span>
            </div>
          )}

          <p className="mt-2 text-xs text-slate-500">
            {hud.apples} apple{hud.apples === 1 ? '' : 's'} &bull; length {hud.length}
            {hud.mode === 'maze' && ` • level ${hud.level + 1}`}
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <Action onClick={onRestart} primary>
              <RotateCcw size={15} /> Again
            </Action>
            <Action onClick={onQuit}>
              <Home size={15} /> Menu
            </Action>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 text-center">
      <h2 className={`text-3xl font-black tracking-tight ${accent}`}>{title}</h2>
      {children}
    </div>
  );
}

function Action({
  onClick,
  primary,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition',
        primary
          ? 'bg-emerald-500 text-white hover:bg-emerald-400'
          : 'border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
