import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { TouchControls } from './ui/TouchControls';
import { useAsteroidsGame } from './useAsteroidsGame';

export default function AsteroidsGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useAsteroidsGame(canvasRef);
  const {
    mode,
    hud,
    setTurn,
    setThrust,
    setAim,
    setFiring,
    hyperspace,
    skip,
    togglePause,
    restart,
    quit,
  } = game;

  useEffect(() => {
    if (!mode) return;

    // Both directions are tracked, not just the most recent, so releasing one
    // key while the other is still down leaves the ship turning rather than
    // stopping dead. That is the difference between steering and jabbing.
    const held = { left: false, right: false };
    const apply = () => setTurn(held.left === held.right ? 0 : held.left ? -1 : 1);

    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          held.left = true;
          apply();
          return;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          held.right = true;
          apply();
          return;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setThrust(true);
          return;
        case 'Shift':
          e.preventDefault();
          hyperspace();
          return;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          return;
        case 'Enter':
          e.preventDefault();
          // Launch, or Again, or Resume: whichever the sheet is offering.
          if (hud?.status === 'over') restart();
          else if (hud?.status === 'paused') togglePause();
          else skip();
          return;
        case 'Escape':
          quit();
          return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        // Held rather than tapped: the engine's own cooldown sets the rate, so
        // a held key and a held thumb fire at exactly the same speed.
        if (!e.repeat) setFiring(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          held.left = false;
          apply();
          return;
        case 'ArrowRight':
        case 'd':
        case 'D':
          held.right = false;
          apply();
          return;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setThrust(false);
          return;
      }
      if (e.code === 'Space') setFiring(false);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode, hud?.status, setTurn, setThrust, setFiring, hyperspace, skip, restart, togglePause, quit]);

  if (!mode) {
    return (
      <main className="game-shell">
        <Menu
          save={game.save}
          onStart={game.start}
          onToggleSound={game.toggleSound}
          onToggleHanded={game.toggleHanded}
          onExit={onExit}
        />
      </main>
    );
  }

  return (
    <main className="game-shell">
      <div className="w-full max-w-4xl">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-3 aspect-[4/3] max-h-[74dvh] w-full touch-none overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Exact counters for the smoke suite. Scraping these out of rendered
          // text would break on any wording change.
          data-status={hud?.status ?? ''}
          data-wave={hud?.wave ?? -1}
          data-lives={hud?.lives ?? -1}
          data-rocks={hud?.rocks ?? -1}
          data-bullets={hud?.bullets ?? -1}
        >
          <canvas ref={canvasRef} className="block h-full w-full touch-none" />

          {hud && (hud.status === 'playing' || hud.status === 'respawning') && (
            <TouchControls
              leftHanded={game.save.leftHanded}
              onAim={setAim}
              onThrust={setThrust}
              onFiring={setFiring}
              onHyperspace={hyperspace}
            />
          )}

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
      </div>
    </main>
  );
}
