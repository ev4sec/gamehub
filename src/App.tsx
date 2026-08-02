import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { audio } from './platform/audio';
import { findGame } from './platform/registry';
import type { GameProps } from './platform/game';
import { Hub } from './shell/Hub';

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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-300">
        <p>That game failed to load.</p>
        <button
          onClick={exit}
          className="rounded-lg border border-slate-700 px-4 py-2 transition hover:border-slate-500"
        >
          Back to all games
        </button>
      </main>
    );
  }

  if (!Game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-500">
        Loading...
      </main>
    );
  }

  return <Game onExit={exit} />;
}
