import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { nextDue, waitText } from '../../../platform/spacedReview';
import { LESSONS, STAGES, TERM_COUNT, lessonById, termsMet } from '../engine/course';
import type { SaveData } from '../save';
import { LABEL, PRIMARY, RING, SECONDARY } from './shared';

interface GuideProps {
  save: SaveData;
  onBack: () => void;
}

/** Every term met so far, grouped by the stage that introduced it, each with the code it was first seen on. */
export function FieldGuide({ save, onBack }: GuideProps) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const met = termsMet(save.solved);
  const ahead = TERM_COUNT - met.length;

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 py-8 sm:px-6">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white ${RING}`}
      >
        <ArrowLeft size={12} aria-hidden="true" />
        All lessons
      </button>
      <h1
        ref={heading}
        tabIndex={-1}
        data-field-guide-title
        className="mt-4 text-4xl font-black tracking-tight text-slate-100 focus:outline-none"
      >
        Field guide
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Every term you have met so far, with the code where you first saw it.
        {ahead > 0 && ` ${ahead} more are ahead on the path.`}
      </p>

      {STAGES.map((stage, i) => {
        const terms = met.filter((t) => lessonById(t.lessonId)?.stage === stage.id);
        if (terms.length === 0) return null;
        return (
          <section key={stage.id} className="mt-8">
            <h2 className={`${LABEL} text-slate-400`}>
              Stage {i + 1} · {stage.title}
            </h2>
            <dl className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-700/70 bg-slate-800/40">
              {terms.map((t) => (
                <div key={t.key} data-term={t.key} className="px-4 py-3.5">
                  <dt className="text-base font-bold text-slate-100">{t.name}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-300">{t.definition}</dd>
                  <dd className="mt-2">
                    <div className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[13px] leading-6 text-slate-200 wrap-anywhere">
                      {t.example}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      From <span className="text-slate-300">{t.lessonTitle}</span>
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

interface DoneProps {
  tally: { clean: number; assisted: number; skipped: number };
  save: SaveData;
  now: number;
  onContinue: (lessonId: string) => void;
  onBack: () => void;
}

/** The end of a review queue: what held, what did not, and when the next one is. */
export function ReviewDone({ tally, save, now, onContinue, onBack }: DoneProps) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const upNext = LESSONS.find((l) => !save.solved.includes(l.id));
  const upcoming = nextDue(save.cards, now);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const stats: [string, number][] = [
    ['Without help', tally.clean],
    ['With help', tally.assisted],
  ];
  if (tally.skipped > 0) stats.push(['Skipped', tally.skipped]);

  return (
    <div data-overlay data-review-done className="w-full max-w-md px-4 py-10 sm:px-6">
      <h1 ref={heading} tabIndex={-1} className="text-3xl font-black tracking-tight text-slate-100 focus:outline-none">
        Review done.
      </h1>
      <dl className="mt-5 flex gap-8">
        {stats.map(([label, n]) => (
          <div key={label}>
            <dt className={`${LABEL} text-slate-400`}>{label}</dt>
            <dd className="text-3xl font-black tabular-nums text-slate-100">{n}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-300">
        {upcoming !== null && `The next review is due in ${waitText(upcoming - now)}. `}
        {tally.skipped > 0 && 'Skipped lessons stay due.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {upNext && (
          <button onClick={() => onContinue(upNext.id)} className={PRIMARY}>
            Continue: {upNext.title}
          </button>
        )}
        <button onClick={onBack} className={upNext ? SECONDARY : PRIMARY}>
          Back to all lessons
        </button>
      </div>
    </div>
  );
}
