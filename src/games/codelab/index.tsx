import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../platform/game';
import { LEVELS } from './engine/levels';
import { createPyRunner } from './runner/pyRunner';
import type { PyRunner } from './runner/types';
import { loadSave, markSolved, writeSave } from './save';
import { LevelView } from './ui/LevelView';
import { Menu } from './ui/Menu';

export default function CodeLab({ onExit }: GameProps) {
  const [save, setSave] = useState(loadSave);
  const [levelId, setLevelId] = useState<string | null>(null);
  const runner = useRef<PyRunner | null>(null);

  // Python is only started when the player first runs something. Opening the
  // game, and the hub's generic checks, never pay for it.
  const getRunner = useCallback((): PyRunner => {
    if (!runner.current) runner.current = createPyRunner(import.meta.env.BASE_URL);
    return runner.current;
  }, []);

  useEffect(() => () => runner.current?.dispose(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement | null;
      if (t?.tagName === 'TEXTAREA' || t?.tagName === 'INPUT') {
        t.blur();
        return;
      }
      if (levelId) setLevelId(null);
      else onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [levelId, onExit]);

  const index = LEVELS.findIndex((l) => l.id === levelId);
  const level = index >= 0 ? LEVELS[index] : undefined;

  if (!level) {
    return (
      <main className="game-shell">
        <Menu save={save} onOpen={setLevelId} onExit={onExit} />
      </main>
    );
  }

  const next = LEVELS[index + 1];

  return (
    <main className="game-shell">
      <LevelView
        key={level.id}
        level={level}
        index={index}
        total={LEVELS.length}
        solved={save.solved.includes(level.id)}
        getRunner={getRunner}
        onSolved={(hintsUsed) => {
          const updated = markSolved(save, level.id, hintsUsed);
          setSave(updated);
          writeSave(updated);
        }}
        onNext={next ? () => setLevelId(next.id) : null}
        onBack={() => setLevelId(null)}
      />
    </main>
  );
}
