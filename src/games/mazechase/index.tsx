import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { swipeHandlers } from '../../platform/touch';
import type { Dir } from './engine/types';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';
import { useMazeChaseGame } from './useMazeChaseGame';

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

export default function MazeChaseGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useMazeChaseGame(canvasRef);
  const { mode, hud, steer, skip, togglePause, restart, quit } = game;

  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        steer(dir);
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (hud?.status === 'over') restart();
        else if (hud?.status === 'paused') togglePause();
        else skip();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, hud?.status, steer, skip, restart, togglePause, quit]);

  if (!mode) {
    return (
      <main className="game-shell">
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
    <main className="game-shell">
      {/*
        Twenty-eight by thirty-one, so height binds long before width does.
        Sizing off `dvh` and deriving the width from it is what keeps the whole
        board and the pad above the fold on a small phone.
      */}
      <div className="w-full max-w-[min(92vw,calc(56dvh*28/31))]">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-1 aspect-[28/31] max-h-[56dvh] w-full touch-none overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Exact counters for the smoke suite. Scraping these out of rendered
          // text would break on any wording change.
          data-status={hud?.status ?? ''}
          data-level={hud?.level ?? -1}
          data-lives={hud?.lives ?? -1}
          data-dots={hud?.dotsLeft ?? -1}
          data-mode={hud?.ghostMode ?? ''}
          // No tap handler: unlike Frogger there is no meaningful "forward" in
          // a maze, so a stray tap should do nothing rather than guess.
          {...swipeHandlers(steer)}
        >
          <canvas ref={canvasRef} className="block h-full w-full touch-none" />
          {hud && (
            <Overlays
              hud={hud}
              isBest={game.isBest}
              onSkip={skip}
              onRestart={restart}
              onQuit={quit}
              onResume={togglePause}
            />
          )}
        </div>

        <TouchControls onSteer={steer} />
      </div>
    </main>
  );
}
