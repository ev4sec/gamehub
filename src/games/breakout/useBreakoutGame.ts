import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  advanceLevel as advanceLevelState,
  createGame,
  hudOf,
  launch as launchState,
  setHeld,
  setPointer,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.score,
    hud.lives,
    hud.level,
    hud.combo,
    hud.balls,
    hud.bricksLeft,
    hud.effects.map((e) => `${e.kind}:${Math.ceil(e.ticks / 30)}`).join(','),
  ].join('|');
}

// React 19 types `useRef<T>(null)` as `RefObject<T | null>`; the effect already
// guards for the null, so the signature widens to match.
export function useBreakoutGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const bricksRef = useRef(0);
  const saveRef = useRef(save);
  // Refreshed in an effect rather than assigned during render: everything that
  // reads it runs after commit, and writing to a ref mid-render is not safe
  // under concurrent rendering.
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
      bricks: bricksRef.current,
    });
    setSave(next);
    writeSave(next);
    setIsBest(best);
  }, []);

  useEffect(() => {
    // `quit` clears the HUD itself; doing it here too would be a setState in
    // an effect body for a value that is already correct.
    if (!mode) {
      stateRef.current = null;
      rendererRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = createGame(mode);
    stateRef.current = state;
    recordedRef.current = false;
    bricksRef.current = 0;
    setIsBest(false);
    signatureRef.current = '';

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    renderer.resize();
    setHud(hudOf(state));

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(canvas);

    const stop = startLoop({
      running: () => {
        const status = stateRef.current?.status;
        return status === 'playing' || status === 'ready';
      },
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        step(s);
        playFor(s.events, s.combo);
        for (const ev of s.events) {
          if (ev.t === 'brick' && ev.destroyed) bricksRef.current += 1;
        }
        if (s.status === 'over' || s.status === 'cleared') finish(s);
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
      observer?.disconnect();
    };
  }, [mode, runId, canvasRef, finish]);

  /** Pushes the HUD immediately, for changes made outside the loop's tick. */
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

  const launch = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    launchState(s);
    playFor(s.events, s.combo);
    syncNow();
  }, [syncNow]);

  const hold = useCallback((key: 'left' | 'right', down: boolean) => {
    const s = stateRef.current;
    if (s) setHeld(s, key, down);
  }, []);

  const pointAt = useCallback((clientX: number | null) => {
    const s = stateRef.current;
    const renderer = rendererRef.current;
    if (!s) return;
    setPointer(s, clientX === null || !renderer ? null : renderer.toWorldX(clientX));
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    togglePauseState(s);
    syncNow();
  }, [syncNow]);

  const nextLevel = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    advanceLevelState(s);
    playFor(s.events, s.combo);
    if (s.status === 'cleared') finish(s);
    syncNow();
  }, [finish, syncNow]);

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
    launch,
    hold,
    pointAt,
    togglePause,
    nextLevel,
    toggleSound,
  };
}
