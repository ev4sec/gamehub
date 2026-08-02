import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import type { Action, Held } from './engine/types';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';
import { useTetrisGame } from './useTetrisGame';

/** Keys that set a sustained direction, so auto-repeat can take over. */
const HELD_KEYS: Record<string, keyof Held> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  s: 'softDrop',
  S: 'softDrop',
};

/** Keys that fire once per press. */
const ACTION_KEYS: Record<string, Action> = {
  ArrowUp: 'rotateCW',
  x: 'rotateCW',
  X: 'rotateCW',
  z: 'rotateCCW',
  Z: 'rotateCCW',
  q: 'rotate180',
  Q: 'rotate180',
  c: 'hold',
  C: 'hold',
  Shift: 'hold',
};

export default function TetrisGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useTetrisGame(canvasRef);

  const { mode, hud, act, hold, togglePause, restart, quit } = game;

  useEffect(() => {
    if (!mode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const heldKey = HELD_KEYS[e.key];
      if (heldKey) {
        e.preventDefault();
        hold(heldKey, true);
        return;
      }

      // The rest are one-shot, so an autorepeating keydown is dropped rather
      // than spinning the piece once per repeat.
      if (e.repeat) return;

      const action = ACTION_KEYS[e.key];
      if (action) {
        e.preventDefault();
        act(action);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        act('hardDrop');
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (hud?.status === 'over' || hud?.status === 'cleared') restart();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const heldKey = HELD_KEYS[e.key];
      if (heldKey) hold(heldKey, false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode, hud?.status, act, hold, togglePause, restart, quit]);

  // Only `mode` gates this. Waiting on `hud` as well would deadlock: the effect
  // that produces the first HUD needs the canvas, and the canvas only mounts
  // once we are past this branch.
  if (!mode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Menu
          save={game.save}
          onStart={game.start}
          onToggleSound={game.toggleSound}
          onExit={onExit}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-6 text-slate-100">
      <div className="w-full max-w-xl">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div className="mt-3 flex justify-center">
          <div className="relative aspect-[1/2] h-[min(64vh,540px)] max-w-full overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50">
            <canvas ref={canvasRef} className="block h-full w-full touch-none" />
            {hud && (
              <Overlays
                hud={hud}
                isBest={game.isBest}
                onRestart={restart}
                onQuit={quit}
                onResume={togglePause}
              />
            )}
          </div>
        </div>

        <TouchControls onAct={act} onHold={hold} />
      </div>
    </main>
  );
}
