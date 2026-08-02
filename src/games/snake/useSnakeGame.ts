import { useCallback, useEffect, useRef, useState } from 'react';
import { startLoop } from '../../platform/loop';
import { sfx } from './sfx';
import { GRID } from './engine/constants';
import {
  advanceLevel,
  createGame,
  queueDir,
  step,
  tickInterval,
  toHud,
} from './engine/engine';
import type { Dir, GameEvent, GameState, Hud, Mode } from './engine/types';
import { Renderer } from './renderer';
import { skinById } from './skins';
import { loadSave, recordRun, writeSave, type SaveData } from './save';

export interface GameApi {
  hud: Hud | null;
  mode: Mode | null;
  save: SaveData;
  isBest: boolean;
  start: (mode: Mode) => void;
  quit: () => void;
  restart: () => void;
  togglePause: () => void;
  continueLevel: () => void;
  turn: (dir: Dir) => void;
  setSkin: (id: string) => void;
  toggleSound: () => void;
}

export function useSnakeGame(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): GameApi {
  const [mode, setMode] = useState<Mode | null>(null);
  const [runId, setRunId] = useState(0);
  const [hud, setHud] = useState<Hud | null>(null);
  const [save, setSave] = useState<SaveData>(loadSave);
  const [isBest, setIsBest] = useState(false);

  const stateRef = useRef<GameState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const saveRef = useRef(save);
  const recordedRef = useRef(false);

  // Refreshed in an effect rather than assigned during render: everything that
  // reads it runs after commit, and writing to a ref mid-render is not safe
  // under concurrent rendering.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    sfx.enabled = save.sound;
  }, [save.sound]);

  useEffect(() => {
    rendererRef.current?.setSkin(skinById(save.skin));
  }, [save.skin]);

  const playEvents = useCallback((events: GameEvent[]) => {
    for (const ev of events) {
      switch (ev.t) {
        case 'eat':
          sfx.eat(ev.combo);
          break;
        case 'power':
          sfx.power(ev.kind);
          break;
        case 'portal':
          sfx.portal();
          break;
        case 'rivalDown':
          sfx.rivalDown();
          break;
        case 'levelUp':
          sfx.levelUp();
          break;
        case 'death':
          sfx.death();
          break;
        default:
          break;
      }
    }
  }, []);

  // Owns the run: builds state, sizes the canvas, drives the fixed-timestep loop.
  useEffect(() => {
    // The HUD is cleared by `quit`, so this branch only drops the state.
    if (!mode) {
      stateRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Renderer(canvas);
    renderer.setSkin(skinById(saveRef.current.skin));
    rendererRef.current = renderer;

    const state = createGame(mode);
    stateRef.current = state;
    recordedRef.current = false;
    setIsBest(false);
    setHud(toHud(state));

    const parent = canvas.parentElement;
    const fit = () => {
      const box = parent?.getBoundingClientRect();
      const side = Math.max(200, Math.floor(box ? Math.min(box.width, box.height) : 480));
      renderer.resize(side, GRID);
    };
    fit();

    const observer = new ResizeObserver(fit);
    if (parent) observer.observe(parent);

    const stop = startLoop({
      running: () => stateRef.current?.status === 'playing',
      interval: () => {
        const s = stateRef.current;
        return s ? tickInterval(s) : 1000;
      },
      tick: () => {
        const s = stateRef.current;
        if (!s) return;
        renderer.snapshot(s);
        step(s);
        renderer.consume(s.events);
        playEvents(s.events);
      },
      draw: (alpha, dt) => {
        const s = stateRef.current;
        if (s) renderer.draw(s, alpha, dt);
      },
      onTicked: () => {
        const s = stateRef.current;
        if (!s) return;
        setHud(toHud(s));

        if (s.status === 'over' && !recordedRef.current) {
          recordedRef.current = true;
          const { next, isBest: best } = recordRun(saveRef.current, {
            mode: s.mode,
            score: s.score,
            apples: s.apples,
            level: s.level,
          });
          writeSave(next);
          setSave(next);
          setIsBest(best);
        }
      },
    });

    return () => {
      stop();
      observer.disconnect();
      rendererRef.current = null;
    };
  }, [mode, runId, canvasRef, playEvents]);

  const turn = useCallback((dir: Dir) => {
    const s = stateRef.current;
    if (!s || s.status !== 'playing') return;
    queueDir(s, dir);
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.status === 'playing') s.status = 'paused';
    else if (s.status === 'paused') s.status = 'playing';
    else return;
    sfx.ui();
    setHud(toHud(s));
  }, []);

  const continueLevel = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.status !== 'levelComplete') return;
    advanceLevel(s);
    rendererRef.current?.reset();
    sfx.ui();
    setHud(toHud(s));
  }, []);

  const start = useCallback((next: Mode) => {
    sfx.unlock();
    sfx.ui();
    setMode(next);
    setRunId((n) => n + 1);
  }, []);

  const restart = useCallback(() => {
    sfx.ui();
    setRunId((n) => n + 1);
  }, []);

  const quit = useCallback(() => {
    sfx.ui();
    setMode(null);
    // Cleared here rather than in the run effect, so leaving a game is one
    // state change instead of a render followed by a corrective one.
    setHud(null);
  }, []);

  const setSkin = useCallback((id: string) => {
    setSave((prev) => {
      const next = { ...prev, skin: id };
      writeSave(next);
      return next;
    });
    sfx.ui();
  }, []);

  const toggleSound = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, sound: !prev.sound };
      writeSave(next);
      return next;
    });
    sfx.unlock();
  }, []);

  return {
    hud,
    mode,
    save,
    isBest,
    start,
    quit,
    restart,
    togglePause,
    continueLevel,
    turn,
    setSkin,
    toggleSound,
  };
}
