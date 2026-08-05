import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { swipeHandlers } from '../../platform/touch';
import type { Dir } from './engine/types';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';
import { useFroggerGame } from './useFroggerGame';

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

export default function FroggerGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useFroggerGame(canvasRef);
  const { mode, hud, hop, skip, togglePause, restart, quit } = game;

  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        hop(dir);
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
  }, [mode, hud?.status, hop, skip, restart, togglePause, quit]);

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
        Sized off the height rather than the width. The board is thirteen cells
        by fifteen, so height is the binding constraint on a phone, and letting
        the width lead would push the bottom of the board past the fold.
      */}
      <div className="w-full max-w-[min(92vw,calc(58dvh*13/15))]">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-2 aspect-[13/15] max-h-[58dvh] w-full touch-none overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Exact counters for the smoke suite. Scraping these out of rendered
          // text would break on any wording change.
          data-status={hud?.status ?? ''}
          data-level={hud?.level ?? -1}
          data-lives={hud?.lives ?? -1}
          data-row={hud?.row ?? -1}
          data-homes={hud ? hud.homes.filter(Boolean).length : -1}
          // A tap is a hop forward: it is what the player wants most of the
          // time, and it costs them nothing to learn.
          {...swipeHandlers(hop, { onTap: () => hop('up') })}
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

        <TouchControls onHop={hop} />
      </div>
    </main>
  );
}
