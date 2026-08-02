import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { useSnakeGame } from './useSnakeGame';
import type { Dir } from './engine/types';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
};

/** Minimum travel, in pixels, before a touch counts as a swipe. */
const SWIPE_THRESHOLD = 24;

export default function SnakeGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const game = useSnakeGame(canvasRef);

  const { mode, hud, turn, togglePause, restart, quit, continueLevel } = game;

  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        turn(dir);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (hud?.status === 'over') restart();
        else if (hud?.status === 'levelComplete') continueLevel();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, hud?.status, turn, togglePause, restart, quit, continueLevel]);

  // Only `mode` gates this. Waiting on `hud` too would deadlock: the effect
  // that produces the first HUD needs the canvas, and the canvas only mounts
  // once we are past this branch.
  if (!mode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Menu
          save={game.save}
          onStart={game.start}
          onSetSkin={game.setSkin}
          onToggleSound={game.toggleSound}
          onExit={onExit}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-6 text-slate-100">
      <div className="w-full max-w-[min(88vw,68vh)]">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-3 aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const origin = touchStart.current;
            touchStart.current = null;
            if (!origin) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - origin.x;
            const dy = t.clientY - origin.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
            if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left');
            else turn(dy > 0 ? 'down' : 'up');
          }}
        >
          <canvas ref={canvasRef} className="block h-full w-full touch-none" />
          {hud && (
            <Overlays
              hud={hud}
              isBest={game.isBest}
              best={game.save.bests[hud.mode] ?? 0}
              onRestart={restart}
              onQuit={quit}
              onContinue={continueLevel}
              onResume={togglePause}
            />
          )}
        </div>

        <TouchControls onTurn={turn} />
      </div>
    </main>
  );
}
