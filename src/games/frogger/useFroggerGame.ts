import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  createGame,
  hop as hopState,
  hudOf,
  skipHold as skipHoldState,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { Dir, GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * The timer is quantized to whole seconds inside `hudOf`, which is what keeps
 * this signature from changing sixty times a second. Everything the player can
 * see move, the lanes and the frog, lives in a ref and never reaches React.
 */
function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.level,
    hud.score,
    hud.lives,
    hud.homes.map((h) => (h ? '1' : '0')).join(''),
    hud.secondsLeft,
    hud.row,
  ].join('|');
}

export function useFroggerGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const homesRef = useRef(0);

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
      homes: homesRef.current,
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

    const state = createGame(mode);
    stateRef.current = state;
    recordedRef.current = false;
    homesRef.current = 0;
    setIsBest(false);
    signatureRef.current = '';

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    renderer.resize();
    setHud(hudOf(state));

    // jsdom has no matchMedia, and calling it unguarded throws outright rather
    // than returning nothing, which would take the whole suite down.
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
        return status === 'playing' || status === 'ready' || status === 'levelComplete';
      },
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        step(s);
        playFor(s.events);
        for (const ev of s.events) if (ev.t === 'home') homesRef.current += 1;
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

  const hop = useCallback(
    (dir: Dir) => {
      const s = stateRef.current;
      if (!s) return;

      // A direction pressed during the banner starts the crossing instead of
      // being dropped, which is what a player who is already moving expects.
      if (s.status === 'ready' || s.status === 'levelComplete') {
        skipHoldState(s);
        syncNow();
        return;
      }

      hopState(s, dir);
      playFor(s.events);
      for (const ev of s.events) if (ev.t === 'home') homesRef.current += 1;
      if (s.status === 'over') finish(s);
      syncNow();
    },
    [finish, syncNow],
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
    hop,
    skip,
    togglePause,
    toggleSound,
  };
}
