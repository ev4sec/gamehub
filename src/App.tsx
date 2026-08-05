import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { audio } from './platform/audio';
import { findGame } from './platform/registry';
import { useKeyboardNav } from './platform/keyboardNav';
import { writeSave } from './platform/save';
import type { GameProps } from './platform/game';
import { HUB_SAVE_ID, Hub } from './shell/Hub';

/**
 * Routes between the hub and one loaded game.
 *
 * The loaded component is held in state rather than behind Suspense so the
 * three render branches below are plainly exclusive and readable in one screen.
 * That is deliberate. The bug this project inherited was a render gate whose two
 * conditions each waited on the other, and it survived a fully tested engine
 * precisely because nothing ever executed the gate.
 */
export default function App() {
  // Mounted once, and it covers the hub, every game's menu and every overlay.
  // All three are found by attribute rather than by reference, because the
  // shell must not import a game to reach one.
  useKeyboardNav();

  const [selected, setSelected] = useState<string | null>(null);
  const [Game, setGame] = useState<ComponentType<GameProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Derived rather than stored. An id with no registry entry is knowable during
  // render, so making it state would mean setting it from inside the effect and
  // paying an extra render to reach a conclusion already available here.
  const entry = selected ? findGame(selected) : undefined;
  const failed = loadFailed || (selected !== null && !entry);

  useEffect(() => {
    if (!entry) return;

    let live = true;
    entry
      .load()
      .then((component) => {
        // React treats a bare function in state as a lazy initialiser, so the
        // component has to be wrapped or it gets called instead of stored.
        if (live) setGame(() => component);
      })
      .catch(() => {
        if (live) setLoadFailed(true);
      });

    return () => {
      live = false;
    };
  }, [entry]);

  // Both of these clear the previous game in the same handler that changes the
  // selection, so the effect never has to correct state after the fact.
  const select = useCallback((id: string) => {
    audio.unlock();
    audio.ui();
    // Recorded by the shell, not by the game, because it is the hub's fact
    // rather than the game's: which tile leads the page next time.
    writeSave(HUB_SAVE_ID, { last: id });
    setGame(null);
    setLoadFailed(false);
    setSelected(id);
  }, []);

  const exit = useCallback(() => {
    audio.ui();
    setGame(null);
    setLoadFailed(false);
    setSelected(null);
  }, []);

  if (!selected) return <Hub onSelect={select} />;

  if (failed) {
    return (
      <main className="game-shell">
        <div className="flex flex-col items-center gap-4 px-6 text-center text-slate-300">
          <p>That game failed to load.</p>
          <button
            onClick={exit}
            className="rounded-lg border border-slate-700 px-4 py-2.5 transition hover:border-slate-500"
          >
            Back to all games
          </button>
        </div>
      </main>
    );
  }

  if (!Game) {
    return (
      // Accented rather than the bare word it used to be. The shell already
      // holds the game's colour in the registry, so the stall can belong to the
      // game you tapped instead of being a generic gap in front of it.
      <main className="game-shell">
        <div className="flex flex-col items-center gap-5 text-center">
          <span
            className="text-3xl font-black tracking-tight"
            style={{ color: entry?.accentText ?? '#94a3b8' }}
          >
            {entry?.title ?? 'Loading'}
          </span>
          <span
            className="relative block h-1 w-50 overflow-hidden rounded-full bg-slate-800"
            aria-label="Loading"
            role="status"
          >
            <span
              className="loading-sweep absolute inset-y-0 left-0 w-[30%] rounded-full"
              style={{ background: entry?.accent ?? '#64748b' }}
              aria-hidden
            />
          </span>
        </div>
      </main>
    );
  }

  return <Game onExit={exit} />;
}
