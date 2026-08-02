import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { LEVELS } from './engine/levels';
import type { Hud as HudModel } from './engine/types';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { useBreakoutGame } from './useBreakoutGame';

const HELD_KEYS: Record<string, 'left' | 'right'> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

function nameOf(hud: HudModel): string {
  if (hud.mode === 'endless') return `Wave ${hud.level + 1}`;
  return LEVELS[Math.min(hud.level, LEVELS.length - 1)].name;
}

export default function BreakoutGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useBreakoutGame(canvasRef);

  const { mode, hud, launch, hold, pointAt, togglePause, restart, quit, nextLevel } = game;

  useEffect(() => {
    if (!mode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const heldKey = HELD_KEYS[e.key];
      if (heldKey) {
        e.preventDefault();
        hold(heldKey, true);
        return;
      }
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        launch();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (hud?.status === 'levelComplete') nextLevel();
        else if (hud?.status === 'over' || hud?.status === 'cleared') restart();
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
  }, [mode, hud?.status, launch, hold, togglePause, restart, quit, nextLevel]);

  // Only `mode` gates this. Waiting on `hud` too would deadlock: the effect
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
      <div className="w-full max-w-3xl">
        {hud && (
          <Hud
            hud={hud}
            save={game.save}
            levelName={nameOf(hud)}
            onPause={togglePause}
            onQuit={quit}
          />
        )}

        <div
          className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Exact counters for the smoke suite. Scraping these out of rendered
          // text would break on any wording change.
          data-status={hud?.status ?? ''}
          data-bricks={hud?.bricksLeft ?? -1}
          data-lives={hud?.lives ?? -1}
          data-level={hud?.level ?? -1}
          onPointerMove={(e) => pointAt(e.clientX)}
          onPointerLeave={() => pointAt(null)}
          onPointerDown={(e) => {
            pointAt(e.clientX);
            launch();
          }}
        >
          <canvas ref={canvasRef} className="block h-full w-full touch-none" />
          {hud && (
            <Overlays
              hud={hud}
              isBest={game.isBest}
              levelName={nameOf(hud)}
              onLaunch={launch}
              onRestart={restart}
              onQuit={quit}
              onResume={togglePause}
              onNextLevel={nextLevel}
            />
          )}
        </div>
      </div>
    </main>
  );
}
