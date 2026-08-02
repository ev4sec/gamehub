import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import type { Dir } from './engine/types';
import { Board } from './ui/Board';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { use2048Game } from './use2048Game';

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

export default function Game2048({ onExit }: GameProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const game = use2048Game();

  const { mode, hud, play, undo, restart, quit } = game;

  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        play(dir);
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restart();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, play, undo, restart, quit]);

  // Gating the board on `hud` is safe here, unlike in the ticked games. There,
  // the first HUD came from an effect that needed the canvas, so waiting on
  // both deadlocked. This game builds its HUD synchronously in the same handler
  // that sets the mode, so the two always arrive together.
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
      <div className="w-full max-w-[min(92vw,32rem)]">
        {hud && (
          <Hud
            hud={hud}
            save={game.save}
            onUndo={undo}
            onRestart={restart}
            onQuit={quit}
          />
        )}

        {hud && (
          <div
            className="relative mt-3"
            // Exact counters for the smoke suite to read. Scraping these out of
            // the rendered text would break on any wording change.
            data-moves={hud.moves}
            data-score={hud.score}
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
              if (Math.abs(dx) > Math.abs(dy)) play(dx > 0 ? 'right' : 'left');
              else play(dy > 0 ? 'down' : 'up');
            }}
          >
            <Board size={hud.size} tiles={game.tiles} fading={game.fading} />
            <Overlays
              hud={hud}
              isBest={game.isBest}
              onRestart={restart}
              onQuit={quit}
              onKeepPlaying={game.keepPlaying}
            />
          </div>
        )}
      </div>
    </main>
  );
}
