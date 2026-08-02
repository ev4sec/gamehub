import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../platform/audio';
import {
  createGame,
  highestTile,
  hudOf,
  keepPlaying as keepPlayingState,
  move as moveState,
  undoMove,
} from './engine/engine';
import type { Dir, GameState, Hud, Mode, Tile } from './engine/types';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * No loop, no animation frames, no timers.
 *
 * The whole hook is request-response: something the player did changes the
 * state, and the changed state is pushed into React once. `platform/loop` is
 * never imported here, which is the concrete proof that it is a utility a game
 * opts into rather than machinery the shell imposes.
 */
export function use2048Game() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [fading, setFading] = useState<Tile[]>([]);
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
    // Copied out so React sees new objects; the engine mutates tiles in place.
    setTiles(s.tiles.map((t) => ({ ...t })));
    setFading(s.fading.map((t) => ({ ...t })));
  }, []);

  const finish = useCallback((s: GameState) => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const { next, isBest: best } = recordRun(saveRef.current, {
      mode: s.mode,
      score: s.score,
      highest: highestTile(s),
    });
    setSave(next);
    writeSave(next);
    setIsBest(best);
  }, []);

  const begin = useCallback(
    (next: Mode) => {
      const s = createGame(next);
      stateRef.current = s;
      recordedRef.current = false;
      setIsBest(false);
      setMode(next);
      setHud(hudOf(s));
      setTiles(s.tiles.map((t) => ({ ...t })));
      setFading([]);
    },
    [],
  );

  const start = useCallback(
    (next: Mode) => {
      audio.unlock();
      begin(next);
    },
    [begin],
  );

  const restart = useCallback(() => {
    const current = stateRef.current?.mode ?? mode;
    if (current) begin(current);
  }, [begin, mode]);

  const quit = useCallback(() => {
    stateRef.current = null;
    setMode(null);
    setHud(null);
    setTiles([]);
    setFading([]);
  }, []);

  const play = useCallback(
    (dir: Dir) => {
      const s = stateRef.current;
      if (!s) return;
      // No status guard here on purpose: the engine already refuses a move on a
      // dead board, and testing it first narrows the type such that the check
      // after the move is considered unreachable.
      moveState(s, dir);
      playFor(s.events);
      sync();
      if (s.status === 'over') finish(s);
    },
    [finish, sync],
  );

  const undo = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (undoMove(s)) {
      playFor(s.events);
      sync();
    }
  }, [sync]);

  const keepPlaying = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    keepPlayingState(s);
    sync();
  }, [sync]);

  const toggleSound = useCallback(() => {
    setSave((current) => {
      const next = { ...current, sound: !current.sound };
      writeSave(next);
      return next;
    });
  }, []);

  return {
    mode,
    hud,
    tiles,
    fading,
    save,
    isBest,
    start,
    restart,
    quit,
    play,
    undo,
    keepPlaying,
    toggleSound,
  };
}
