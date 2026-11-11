import { useCallback, useEffect, useState } from 'react';
import type { GameProps } from '../../platform/game';
import { dueIds } from '../../platform/spacedReview';
import { LESSONS, STAGES, lessonsIn } from './engine/course';
import { loadSave, markSolved, writeSave } from './save';
import { LessonView } from './ui/LessonView';
import { Menu } from './ui/Menu';
import { FieldGuide, ReviewDone } from './ui/Screens';

const ORDER = LESSONS.map((l) => l.id);

interface Tally {
  clean: number;
  assisted: number;
  skipped: number;
}

/** A review queue being walked. A snapshot: a lesson missed along the way does not rejoin it. */
interface Queue {
  ids: string[];
  pos: number;
  tally: Tally;
}

type Screen =
  | { at: 'menu'; lastId: string | null }
  | { at: 'guide' }
  | {
      at: 'lesson';
      id: string;
      /** Fixed when the lesson is opened, so finishing it does not reshuffle what is on screen. */
      visit: number;
      returning: boolean;
      queue: Queue | null;
    }
  | { at: 'reviewDone'; tally: Tally };

export default function CodeReader({ onExit }: GameProps) {
  const [save, setSave] = useState(loadSave);
  const [screen, setScreen] = useState<Screen>({ at: 'menu', lastId: null });
  // Read on navigation and on a timer, never during render.
  const [now, setNow] = useState(() => Date.now());

  // A lesson missed ten minutes ago comes due while the menu is sitting open.
  useEffect(() => {
    if (screen.at !== 'menu') return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [screen.at]);

  const leftId = screen.at === 'lesson' ? screen.id : screen.at === 'guide' ? 'guide' : null;
  const toMenu = useCallback(() => {
    setNow(Date.now());
    setScreen({ at: 'menu', lastId: leftId });
  }, [leftId]);

  const open = (id: string, queue: Queue | null) => {
    setScreen({
      at: 'lesson',
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

  const advance = (queue: Queue, skipped: boolean) => {
    const tally = skipped ? { ...queue.tally, skipped: queue.tally.skipped + 1 } : queue.tally;
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
      if (screen.at === 'menu') onExit();
      else toMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen.at, onExit, toMenu]);

  if (screen.at === 'reviewDone') {
    return (
      <main className="game-shell">
        <ReviewDone tally={screen.tally} save={save} now={now} onContinue={(id) => open(id, null)} onBack={toMenu} />
      </main>
    );
  }

  if (screen.at === 'guide') {
    return (
      <main className="game-shell">
        <FieldGuide save={save} onBack={toMenu} />
      </main>
    );
  }

  const lesson = screen.at === 'lesson' ? LESSONS.find((l) => l.id === screen.id) : undefined;

  if (screen.at !== 'lesson' || !lesson) {
    return (
      <main className="game-shell">
        <Menu
          save={save}
          now={now}
          lastId={screen.at === 'menu' ? screen.lastId : null}
          onOpen={(id) => open(id, null)}
          onReview={startReview}
          onGuide={() => setScreen({ at: 'guide' })}
          onExit={onExit}
        />
      </main>
    );
  }

  const { queue } = screen;
  const stageIndex = STAGES.findIndex((s) => s.id === lesson.stage);
  const inStage = lessonsIn(lesson.stage);
  const following = LESSONS[LESSONS.indexOf(lesson) + 1];

  let next: { label: string; go: () => void } | null = null;
  if (queue) {
    const last = queue.pos + 1 >= queue.ids.length;
    next = { label: last ? 'Finish review' : 'Next in review', go: () => advance(queue, false) };
  } else if (following) {
    const followingStage = STAGES.findIndex((s) => s.id === following.stage);
    next = {
      label:
        following.stage === lesson.stage
          ? 'Next lesson'
          : `Start stage ${followingStage + 1}: ${STAGES[followingStage].title}`,
      go: () => open(following.id, null),
    };
  }

  return (
    <main className="game-shell">
      <LessonView
        key={`${lesson.id}:${screen.visit}:${queue?.pos ?? 'menu'}`}
        lesson={lesson}
        visit={screen.visit}
        returning={screen.returning}
        place={{ stage: stageIndex, lesson: inStage.indexOf(lesson), of: inStage.length }}
        review={queue ? { pos: queue.pos, total: queue.ids.length } : null}
        card={save.cards[lesson.id]}
        onSolved={(outcome) => {
          const updated = markSolved(save, lesson.id, outcome, Date.now());
          setSave(updated);
          writeSave(updated);
          if (queue) {
            // Counted at the finish, not at Next, so leaving by another door cannot lose it.
            const tally = { ...queue.tally, [outcome]: queue.tally[outcome] + 1 };
            setScreen({ ...screen, queue: { ...queue, tally } });
          }
          // "Stage complete" is said once: the first time its last open lesson is finished.
          const stageDone =
            !save.solved.includes(lesson.id) && inStage.every((l) => updated.solved.includes(l.id));
          return { card: updated.cards[lesson.id], stageDone };
        }}
        next={next}
        onSkip={queue ? () => advance(queue, true) : null}
        onBack={toMenu}
      />
    </main>
  );
}
