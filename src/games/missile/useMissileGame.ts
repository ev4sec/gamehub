import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  createGame,
  fireAt,
  hudOf,
  skipHold as skipHoldState,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * The HUD is pushed into React only when one of these values changes. Missile
 * Command runs sixty ticks a second with dozens of moving entities, and every
 * one of them lives in a ref: React never sees a missile move, only a counter
 * change, which is a handful of re-renders per wave rather than per frame.
 */
function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.wave,
    hud.score,
    hud.cities,
    hud.ammo,
    hud.incoming,
    hud.tally ? `${hud.tally.ammo}/${hud.tally.cities}/${hud.tally.points}` : '',
  ].join('|');
}

export function useMissileGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const killsRef = useRef(0);
  // The aiming reticle is a pure visual and changes on every pointer move, so
  // it never enters React state; the renderer reads it straight off the ref.
  const reticleRef = useRef<{ x: number; y: number } | null>(null);

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
      kills: killsRef.current,
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
    killsRef.current = 0;
    reticleRef.current = null;
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
      // The two held states tick as well, because their countdowns are what
      // ends them. Leaving them out would freeze the wave banner forever.
      running: () => {
        const status = stateRef.current?.status;
        return status === 'playing' || status === 'ready' || status === 'waveComplete';
      },
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        step(s);
        playFor(s.events);
        for (const ev of s.events) if (ev.t === 'kill') killsRef.current += 1;
        if (s.status === 'over') finish(s);
      },
      draw: () => {
        const s = stateRef.current;
        if (s) renderer.draw(s, reticleRef.current);
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

  /** Ends the wave banner or the tally early. */
  const skip = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    skipHoldState(s);
    syncNow();
  }, [syncNow]);

  const fire = useCallback(
    (clientX: number, clientY: number) => {
      const s = stateRef.current;
      const renderer = rendererRef.current;
      if (!s || !renderer) return;

      // A tap during the banner or the tally skips it rather than being
      // swallowed. Anything else makes the first tap of a wave feel dropped.
      if (s.status === 'ready' || s.status === 'waveComplete') {
        skipHoldState(s);
        syncNow();
        return;
      }

      const at = renderer.toWorld(clientX, clientY);
      fireAt(s, at.x, at.y);
      playFor(s.events);
      syncNow();
    },
    [syncNow],
  );

  const aim = useCallback((clientX: number | null, clientY: number) => {
    const renderer = rendererRef.current;
    if (clientX === null || !renderer) {
      reticleRef.current = null;
      return;
    }
    reticleRef.current = renderer.toWorld(clientX, clientY);
  }, []);

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
    fire,
    skip,
    aim,
    togglePause,
    toggleSound,
  };
}
