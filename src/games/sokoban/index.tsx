import { useEffect } from 'react';
import type { GameProps } from '../../platform/game';
import { swipeHandlers } from '../../platform/touch';
import type { Dir } from './engine/types';
import { Board } from './ui/Board';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';
import { useSokobanGame } from './useSokobanGame';

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

export default function SokobanGame({ onExit }: GameProps) {
  const game = useSokobanGame();
  const { levelIndex, hud, board, play, undo, restart, nextLevel, quit } = game;

  useEffect(() => {
    if (levelIndex === null) return;

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
      // Enter as well as N. Enter is what every other game in the hub uses to
      // take the overlay's primary action, and a player who has just solved a
      // level reaches for it before reading the hint that says otherwise.
      if (e.key === 'n' || e.key === 'N' || e.key === 'Enter') {
        e.preventDefault();
        if (hud?.status === 'solved') nextLevel();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [levelIndex, hud?.status, play, undo, restart, nextLevel, quit]);

  // As in 2048, gating on the board is safe: it is built synchronously in the
  // same handler that sets the level, so the two always arrive together.
  if (levelIndex === null) {
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
      <div className="w-full max-w-lg">
        {hud && (
          <Hud
            hud={hud}
            save={game.save}
            onUndo={undo}
            onReset={restart}
            onQuit={quit}
          />
        )}

        {hud && board && (
          <div
            className="relative mt-3 touch-none rounded-2xl border-2 border-slate-700/80 bg-slate-900/60 p-3 shadow-2xl shadow-black/50"
            // Exact counters for the smoke suite. Scraping these out of the
            // rendered text would break on any wording change.
            data-moves={hud.moves}
            data-pushes={hud.pushes}
            data-status={hud.status}
            data-on-goal={hud.onGoal}
            data-level={hud.levelIndex}
            // A swipe anywhere on the board moves the player one cell, the same
            // gesture 2048 and Snake already use. The d-pad below covers the
            // precise nudging that a puzzle needs and a swipe is clumsy at.
            {...swipeHandlers(play)}
          >
            <Board board={board} />
            <Overlays
              hud={hud}
              isBest={game.isBest}
              onNext={nextLevel}
              onReset={restart}
              onQuit={quit}
            />
          </div>
        )}

        <TouchControls onMove={play} />
      </div>
    </main>
  );
}
