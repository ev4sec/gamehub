import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { swipeHandlers } from '../../platform/touch';
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

export default function SnakeGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      <main className="game-shell">
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
    <main className="game-shell">
      <div className="w-full max-w-[min(88vw,68vh)]">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-3 aspect-square w-full touch-none overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Resolved during the move rather than on lift. At speed a snake
          // travels most of a cell in the time a swipe takes to finish, and a
          // turn that arrives then has already missed the corner.
          {...swipeHandlers(turn)}
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
