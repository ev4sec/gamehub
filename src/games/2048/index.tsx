import { useEffect } from 'react';
import type { GameProps } from '../../platform/game';
import { swipeHandlers } from '../../platform/touch';
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

export default function Game2048({ onExit }: GameProps) {
  const game = use2048Game();

  const { mode, hud, play, undo, restart, keepPlaying, quit } = game;

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
      if (e.key === 'Enter') {
        e.preventDefault();
        // Whatever the overlay's primary button is, Enter presses it.
        if (hud?.status === 'won') keepPlaying();
        else if (hud?.status === 'over') restart();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, hud?.status, play, undo, restart, keepPlaying, quit]);

  // Gating the board on `hud` is safe here, unlike in the ticked games. There,
  // the first HUD came from an effect that needed the canvas, so waiting on
  // both deadlocked. This game builds its HUD synchronously in the same handler
  // that sets the mode, so the two always arrive together.
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
            className="relative mt-3 touch-none"
            // Exact counters for the smoke suite to read. Scraping these out of
            // the rendered text would break on any wording change.
            data-moves={hud.moves}
            data-score={hud.score}
            {...swipeHandlers(play)}
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
