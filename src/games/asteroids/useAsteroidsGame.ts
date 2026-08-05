import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  createGame,
  fire as fireState,
  hudOf,
  hyperspace as hyperspaceState,
  setAim as setAimState,
  setThrust as setThrustState,
  setTurn as setTurnState,
  skipHold as skipHoldState,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * Nothing continuous reaches React. The ship's angle and velocity, every rock,
 * every bullet and the saucer all live in the ref, and the signature below is
 * built from six integers. On a quiet second at sixty ticks this produces zero
 * renders, which is the target and not merely the happy case.
 */
function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.wave,
    hud.score,
    hud.lives,
    hud.rocks,
    hud.bullets,
    hud.saucer ? '1' : '0',
  ].join('|');
}

export function useAsteroidsGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const rocksRef = useRef(0);
  /** Held down by a thumb on the fire pad. Repeats at the engine's own rate. */
  const firingRef = useRef(false);

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
      wave: s.wave,
      rocks: rocksRef.current,
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

    const state = createGame(mode, Math.floor(Math.random() * 0xffffff) + 1);
    stateRef.current = state;
    recordedRef.current = false;
    rocksRef.current = 0;
    firingRef.current = false;
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
        return status === 'playing' || status === 'ready' || status === 'respawning';
      },
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;

        // Auto-fire is resolved in the tick rather than on a timer, so a held
        // thumb and a held key produce exactly the same rate of shots.
        if (firingRef.current) {
          fireState(s);
          if (s.events.length > 0) playFor(s.events);
        }

        step(s);
        playFor(s.events);
        for (const ev of s.events) if (ev.t === 'rock') rocksRef.current += 1;
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

  const setTurn = useCallback((turn: -1 | 0 | 1) => {
    const s = stateRef.current;
    if (s) setTurnState(s, turn);
  }, []);

  const setThrust = useCallback((on: boolean) => {
    const s = stateRef.current;
    if (s) setThrustState(s, on);
  }, []);

  const setAim = useCallback((heading: number | null) => {
    const s = stateRef.current;
    if (s) setAimState(s, heading);
  }, []);

  const setFiring = useCallback(
    (on: boolean) => {
      firingRef.current = on;
      const s = stateRef.current;
      if (!s) return;
      // The banner is dismissed by the same press that would have been a shot,
      // so the first tap of a run is never swallowed.
      if (on && s.status === 'ready') {
        skipHoldState(s);
        syncNow();
        return;
      }
      if (on) {
        fireState(s);
        playFor(s.events);
        syncNow();
      }
    },
    [syncNow],
  );

  const hyperspace = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    hyperspaceState(s);
    playFor(s.events);
  }, []);

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

  const toggleHanded = useCallback(() => {
    setSave((current) => {
      const next = { ...current, leftHanded: !current.leftHanded };
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
    setTurn,
    setThrust,
    setAim,
    setFiring,
    hyperspace,
    skip,
    togglePause,
    toggleSound,
    toggleHanded,
  };
}
