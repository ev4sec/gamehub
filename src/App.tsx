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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!selected) {
      setGame(null);
      setFailed(false);
      return;
    }
    const entry = findGame(selected);
    if (!entry) {
      setFailed(true);
      return;
    }

    let live = true;
    setFailed(false);
    entry
      .load()
      .then((component) => {
        // React treats a bare function in state as a lazy initialiser, so the
        // component has to be wrapped or it gets called instead of stored.
        if (live) setGame(() => component);
      })
      .catch(() => {
        if (live) setFailed(true);
      });

    return () => {
      live = false;
    };
  }, [selected]);

  const select = useCallback((id: string) => {
    audio.unlock();
    audio.ui();
    setSelected(id);
  }, []);

  const exit = useCallback(() => {
    audio.ui();
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
