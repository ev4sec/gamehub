import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  createGame,
  hudOf,
  setDir as setDirState,
  skipHold as skipHoldState,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { Dir, GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * Four actors moving continuously, a two hundred and forty dot grid, and none
 * of it in React. The fright timer is quantized to whole seconds in `hudOf`,
 * which is what stops the one genuinely continuous number in the HUD from
 * costing sixty renders a second while a pellet is running.
 */
function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.level,
    hud.score,
    hud.lives,
    hud.dotsLeft,
    hud.ghostMode,
    hud.frightSeconds,
  ].join('|');
}

export function useMazeChaseGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const ghostsRef = useRef(0);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const [runId, setRunId] = useState(0);

  useEffect(() => {
    audio.enabled = save.sound;
  }, [save.sound]);

  const finish = useCallback((s: GameState) => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const { next, isBest: best } = recordRun(saveRef.current, {
      mode: s.mode,
      score: s.score,
      level: s.level,
      ghosts: ghostsRef.current,
    });
    setSave(next);
    writeSave(next);
    setIsBest(best);
  }, []);

  useEffect(() => {
    if (!mode) {
      stateRef.current = null;
      rendererRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = createGame(mode, 1, Math.floor(Math.random() * 0xffffff) + 1);
    stateRef.current = state;
    recordedRef.current = false;
    ghostsRef.current = 0;
    setIsBest(false);
    signatureRef.current = '';

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    renderer.resize();
    setHud(hudOf(state));

    const motion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const applyMotion = () => renderer.setReducedMotion(motion?.matches ?? false);
    applyMotion();
    motion?.addEventListener?.('change', applyMotion);

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(canvas);

    const stop = startLoop({
      running: () => {
        const status = stateRef.current?.status;
        return (
          status === 'playing' ||
          status === 'ready' ||
          status === 'dying' ||
          status === 'levelComplete'
        );
      },
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        step(s);
        playFor(s.events);
        for (const ev of s.events) if (ev.t === 'ghost') ghostsRef.current += 1;
        if (s.status === 'over') finish(s);
      },
      draw: () => {
        const s = stateRef.current;
        if (s) renderer.draw(s);
      },
      onTicked: () => {
        const s = stateRef.current;
        if (!s) return;
        const next = hudOf(s);
        const signature = hudSignature(next);
        if (signature === signatureRef.current) return;
        signatureRef.current = signature;
        setHud(next);
      },
    });

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      motion?.removeEventListener?.('change', applyMotion);
      observer?.disconnect();
    };
  }, [mode, runId, canvasRef, finish]);

  const syncNow = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const next = hudOf(s);
    signatureRef.current = hudSignature(next);
    setHud(next);
  }, []);

  const start = useCallback((next: Mode) => {
    audio.unlock();
    setMode(next);
    setRunId((n) => n + 1);
  }, []);

  const restart = useCallback(() => setRunId((n) => n + 1), []);

  const quit = useCallback(() => {
    setMode(null);
    setHud(null);
  }, []);

  const steer = useCallback(
    (dir: Dir) => {
      const s = stateRef.current;
      if (!s) return;

      // A direction pressed on the banner starts the level. In a chase a player
      // is already moving before the words have finished being read.
      if (s.status === 'ready' || s.status === 'levelComplete') {
        skipHoldState(s);
        syncNow();
        return;
      }
      setDirState(s, dir);
    },
    [syncNow],
  );

  const skip = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    skipHoldState(s);
    syncNow();
  }, [syncNow]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    togglePauseState(s);
    syncNow();
  }, [syncNow]);

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
    save,
    isBest,
    start,
    restart,
    quit,
    steer,
    skip,
    togglePause,
    toggleSound,
  };
}
