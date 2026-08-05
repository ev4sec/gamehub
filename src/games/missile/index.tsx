import { useEffect, useRef } from 'react';
import type { GameProps } from '../../platform/game';
import { Hud } from './ui/Hud';
import { Menu } from './ui/Menu';
import { Overlays } from './ui/Overlays';
import { useMissileGame } from './useMissileGame';

export default function MissileGame({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useMissileGame(canvasRef);
  const { mode, hud, fire, skip, aim, togglePause, restart, quit } = game;

  useEffect(() => {
    if (!mode) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // Begin, Next wave, or Again: whichever the sheet is offering.
        if (hud?.status === 'over') restart();
        else if (hud?.status === 'paused') togglePause();
        else skip();
        return;
      }
      if (e.key === 'Escape') quit();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, hud?.status, skip, restart, togglePause, quit]);

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
      <div className="w-full max-w-3xl">
        {hud && <Hud hud={hud} save={game.save} onPause={togglePause} onQuit={quit} />}

        <div
          className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-slate-700/80 shadow-2xl shadow-black/50"
          // Exact counters for the smoke suite. Scraping these out of rendered
          // text would break on any wording change.
          data-status={hud?.status ?? ''}
          data-wave={hud?.wave ?? -1}
          data-cities={hud?.cities ?? -1}
          data-ammo={hud?.ammo ?? -1}
          data-incoming={hud?.incoming ?? -1}
          // Pointer-down rather than click: the shot has to leave the battery
          // the instant the finger lands, and a synthetic click is too late to
          // catch a missile that is already low.
          onPointerDown={(e) => {
            e.preventDefault();
            fire(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => aim(e.clientX, e.clientY)}
          onPointerLeave={() => aim(null, 0)}
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
      </div>
    </main>
  );
}
