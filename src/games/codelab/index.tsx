import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../platform/game';
import { CORE, LEVELS, PRACTICE, coreIn, isPractice, trackOf } from './engine/levels';
import { dueIds, type Outcome } from './engine/review';
import { createJsRunner } from './runner/jsRunner';
import { createPyRunner } from './runner/pyRunner';
import type { PyRunner } from './runner/types';
import { loadSave, markSolved, writeSave } from './save';
import { LevelView } from './ui/LevelView';
import { Menu } from './ui/Menu';
import { ReviewDone } from './ui/ReviewDone';

/** Review only ever asks reading levels. */
const ORDER = CORE.map((l) => l.id);

interface Tally {
  clean: number;
  assisted: number;
  skipped: number;
}

/** A review queue being walked. A snapshot: a level missed along the way does not rejoin it. */
interface Queue {
  ids: string[];
  pos: number;
  tally: Tally;
}

type Screen =
  | { at: 'menu'; lastId: string | null }
  | {
      at: 'level';
      id: string;
      /**
       * Completed visits when the level was opened. Fixed for the whole stay,
       * so solving it does not swap the code out from under the explanation.
       */
      visit: number;
      /** Solved before this visit. The lesson starts folded away. */
      returning: boolean;
      /** Null when opened from the menu. */
      queue: Queue | null;
    }
  | { at: 'reviewDone'; tally: Tally };

export default function CodeLab({ onExit }: GameProps) {
  const [save, setSave] = useState(loadSave);
  const [screen, setScreen] = useState<Screen>({ at: 'menu', lastId: null });
  // Read on navigation and on a timer, never during render, so what is due
  // cannot change between two renders of the same screen.
  const [now, setNow] = useState(() => Date.now());
  const runner = useRef<PyRunner | null>(null);

  // Python is only started when the player first runs something. Opening the
  // game, and the hub's generic checks, never pay for it.
  const getRunner = useCallback((): PyRunner => {
    if (!runner.current) runner.current = createPyRunner(import.meta.env.BASE_URL);
    return runner.current;
  }, []);

  useEffect(() => () => runner.current?.dispose(), []);

  // TypeScript levels run on the page, with nothing to boot and nothing to dispose.
  const jsRunner = useRef<PyRunner | null>(null);
  const getJsRunner = useCallback((): PyRunner => {
    if (!jsRunner.current) jsRunner.current = createJsRunner();
    return jsRunner.current;
  }, []);

  // A level missed ten minutes ago comes due while the menu is sitting open.
  useEffect(() => {
    if (screen.at !== 'menu') return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [screen.at]);

  const leftId = screen.at === 'level' ? screen.id : null;
  const toMenu = useCallback(() => {
    setNow(Date.now());
    setScreen({ at: 'menu', lastId: leftId });
  }, [leftId]);

  const open = (id: string, queue: Queue | null) => {
    setScreen({
      at: 'level',
      id,
      visit: save.cards[id]?.visits ?? 0,
      returning: save.solved.includes(id),
      queue,
    });
  };

  const startReview = () => {
    const ids = dueIds(save.cards, ORDER, Date.now());
    if (ids.length > 0) open(ids[0], { ids, pos: 0, tally: { clean: 0, assisted: 0, skipped: 0 } });
  };

  /** Moves a review on by one, counting how the level just left went. */
  const advance = (queue: Queue, how: keyof Tally | null) => {
    const tally = how ? { ...queue.tally, [how]: queue.tally[how] + 1 } : queue.tally;
    const nextId = queue.ids[queue.pos + 1];
    if (nextId) {
      open(nextId, { ids: queue.ids, pos: queue.pos + 1, tally });
    } else {
      setNow(Date.now());
      setScreen({ at: 'reviewDone', tally });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement | null;
      if (t?.tagName === 'TEXTAREA' || t?.tagName === 'INPUT') {
        t.blur();
        return;
      }
      if (screen.at === 'menu') onExit();
      else toMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen.at, onExit, toMenu]);

  if (screen.at === 'reviewDone') {
    return (
      <main className="game-shell">
        <ReviewDone
          tally={screen.tally}
          save={save}
          now={now}
          onContinue={(id) => open(id, null)}
          onBack={toMenu}
        />
      </main>
    );
  }

  const level = screen.at === 'level' ? LEVELS.find((l) => l.id === screen.id) : undefined;
  // A level is numbered, and followed, within its own group: one track's
  // reading path never leads into the other's, or into writing practice.
  const track = level ? trackOf(level) : 'python';
  const group = level && isPractice(level) ? PRACTICE : coreIn(track);
  const index = level ? group.indexOf(level) : -1;

  if (screen.at !== 'level' || !level) {
    return (
      <main className="game-shell">
        <Menu
          save={save}
          now={now}
          lastId={screen.at === 'menu' ? screen.lastId : null}
          onTrack={(next) => {
            const updated = { ...save, track: next };
            setSave(updated);
            writeSave(updated);
          }}
          onOpen={(id) => open(id, null)}
          onReview={startReview}
          onExit={onExit}
        />
      </main>
    );
  }

  const { queue } = screen;
  const following = group[index + 1];

  return (
    <main className="game-shell">
      <LevelView
        // A level can follow itself only across separate visits, and the
        // position keeps two queue entries from ever sharing state.
        key={`${level.id}:${screen.visit}:${queue?.pos ?? 'menu'}`}
        level={level}
        visit={screen.visit}
        returning={screen.returning}
        index={index}
        total={group.length}
        review={queue ? { pos: queue.pos, total: queue.ids.length } : null}
        card={save.cards[level.id]}
        track={track}
        getRunner={track === 'ts' ? getJsRunner : getRunner}
        onSolved={(hintsUsed, outcome: Outcome) => {
          const updated = markSolved(save, level.id, hintsUsed, outcome, Date.now());
          setSave(updated);
          writeSave(updated);
          if (queue) {
            // Counted at the solve, not at Next, so leaving by another door
            // cannot lose it.
            const tally = { ...queue.tally, [outcome]: queue.tally[outcome] + 1 };
            setScreen({ ...screen, queue: { ...queue, tally } });
          }
          return updated.cards[level.id];
        }}
        onNext={queue ? () => advance(queue, null) : following ? () => open(following.id, null) : null}
        onSkip={queue ? () => advance(queue, 'skipped') : null}
        onBack={toMenu}
      />
    </main>
  );
}
