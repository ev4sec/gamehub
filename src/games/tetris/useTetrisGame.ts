import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { audio } from '../../platform/audio';
import { startLoop } from '../../platform/loop';
import { TICK_MS } from './engine/constants';
import {
  createGame,
  hudOf,
  queueAction,
  setHeld,
  step,
  togglePause as togglePauseState,
} from './engine/engine';
import type { Action, GameState, Held, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { loadSave, recordRun, writeSave, type SaveData } from './save';
import { playFor } from './sfx';

/**
 * Signature of everything the HUD actually shows.
 *
 * The engine ticks at 16ms, so pushing a fresh HUD object into React on every
 * tick would be sixty renders a second to display numbers that change a few
 * times a minute. Comparing this string first keeps the re-render tied to what
 * a player can see, and the clock is deliberately coarse for the same reason.
 */
function hudSignature(hud: Hud): string {
  return [
    hud.status,
    hud.score,
    hud.lines,
    hud.level,
    hud.combo,
    hud.backToBack ? 'b' : '',
    hud.pieces,
    hud.hold ?? '',
    hud.next.join(''),
    Math.floor(hud.elapsedMs / 100),
    Math.floor(hud.timeLeftMs / 100),
  ].join('|');
}

// React 19 types `useRef<T>(null)` as `RefObject<T | null>`, which is honest:
// the ref really is null until the canvas mounts. The effect already guards for
// it, so the signature widens to match rather than the callers casting.
export function useTetrisGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const signatureRef = useRef('');
  const recordedRef = useRef(false);
  const saveRef = useRef(save);
  // Refreshed in an effect rather than assigned during render. Everything that
  // reads it (the loop's tick, the event handlers) runs after commit, so it is
  // always the latest value by the time anything asks, and writing to a ref
  // mid-render is not safe under concurrent rendering.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  /** Bumped to force the run effect to build a fresh game on restart. */
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
      lines: s.lines,
      timeMs: s.elapsedMs,
      completed: s.status === 'cleared',
    });
    setSave(next);
    writeSave(next);
    setIsBest(best);
  }, []);

  useEffect(() => {
    // `quit` clears the HUD itself, so this branch only has to drop the state.
    // Clearing it here as well would be a setState in an effect body, which
    // costs an extra render pass for a value that is already correct.
    if (!mode) {
      stateRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = createGame(mode);
    stateRef.current = state;
    recordedRef.current = false;
    setIsBest(false);
    signatureRef.current = '';

    const renderer = new Renderer(canvas);
    renderer.resize();
    setHud(hudOf(state));

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(canvas);

    const stop = startLoop({
      running: () => stateRef.current?.status === 'playing',
      interval: () => TICK_MS,
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        step(s);
        playFor(s.events);
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

  const start = useCallback((next: Mode) => {
    audio.unlock();
    setMode(next);
    setRunId((n) => n + 1);
  }, []);

  const restart = useCallback(() => {
    setRunId((n) => n + 1);
  }, []);

  const quit = useCallback(() => {
    setMode(null);
    setHud(null);
  }, []);

  const act = useCallback((action: Action) => {
    const s = stateRef.current;
    if (!s) return;
    queueAction(s, action);
  }, []);

  const hold = useCallback((key: keyof Held, down: boolean) => {
    const s = stateRef.current;
    if (!s) return;
    setHeld(s, key, down);
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    togglePauseState(s);
    setHud(hudOf(s));
  }, []);

  const toggleSound = useCallback(() => {
    setSave((current) => {
      const next = { ...current, sound: !current.sound };
      writeSave(next);
      return next;
    });
  }, []);

  return { mode, hud, save, isBest, start, restart, quit, act, hold, togglePause, toggleSound };
}
