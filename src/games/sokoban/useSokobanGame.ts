import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../platform/audio';
import {
  createGame,
  hudOf,
  levelCount,
  move as moveState,
  reset as resetState,
  undo as undoState,
} from './engine/engine';
import type { Dir, GameState, Hud } from './engine/types';
import { loadSave, recordSolve, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * Turn-based, like 2048: no loop, no frames, no timers. The board is a plain
 * value pushed into React whenever the player does something.
 */
export function useSokobanGame() {
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [board, setBoard] = useState<GameState | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const recordedRef = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    audio.enabled = save.sound;
  }, [save.sound]);

  const sync = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    setHud(hudOf(s));
    // A shallow copy is enough for React to re-render; the board is small and
    // the components read it rather than mutating it.
    setBoard({ ...s, boxes: new Set(s.boxes), player: { ...s.player } });
  }, []);

  const finish = useCallback((s: GameState) => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const { next, isBest: best } = recordSolve(saveRef.current, s.levelIndex, {
      moves: s.moves,
      pushes: s.pushes,
    });
    setSave(next);
    writeSave(next);
    setIsBest(best);
  }, []);

  const open = useCallback(
    (index: number) => {
      const s = createGame(index);
      stateRef.current = s;
      recordedRef.current = false;
      setIsBest(false);
      setLevelIndex(s.levelIndex);
      setHud(hudOf(s));
      setBoard({ ...s, boxes: new Set(s.boxes), player: { ...s.player } });
    },
    [],
  );

  const start = useCallback(
    (index: number) => {
      audio.unlock();
      open(index);
    },
    [open],
  );

  const quit = useCallback(() => {
    stateRef.current = null;
    setLevelIndex(null);
    setHud(null);
    setBoard(null);
  }, []);

  const play = useCallback(
    (dir: Dir) => {
      const s = stateRef.current;
      if (!s) return;
      moveState(s, dir);
      playFor(s.events);
      sync();
      if (s.status === 'solved') finish(s);
    },
    [finish, sync],
  );

  const undo = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (undoState(s)) {
      playFor(s.events);
      sync();
    }
  }, [sync]);

  const restart = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const fresh = resetState(s);
    stateRef.current = fresh;
    recordedRef.current = false;
    setIsBest(false);
    playFor(fresh.events);
    sync();
  }, [sync]);

  const nextLevel = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const next = s.levelIndex + 1;
    if (next >= levelCount()) quit();
    else open(next);
  }, [open, quit]);

  const toggleSound = useCallback(() => {
    setSave((current) => {
      const next = { ...current, sound: !current.sound };
      writeSave(next);
      return next;
    });
  }, []);

  return {
    levelIndex,
    hud,
    board,
    save,
    isBest,
    start,
    quit,
    play,
    undo,
    restart,
    nextLevel,
    toggleSound,
  };
}
