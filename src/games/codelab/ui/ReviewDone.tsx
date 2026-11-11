import { useEffect, useRef } from 'react';
import { CORE } from '../engine/levels';
import { nextDue, waitText } from '../../../platform/spacedReview';
import type { SaveData } from '../save';

interface Props {
  tally: { clean: number; assisted: number; skipped: number };
  save: SaveData;
  now: number;
  onContinue: (levelId: string) => void;
  onBack: () => void;
}

const PRIMARY =
  'rounded-lg border border-indigo-400/60 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/20';
const SECONDARY =
  'rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500';

/** The end of a review queue: what held, what did not, and when the next one is. */
export function ReviewDone({ tally, save, now, onContinue, onBack }: Props) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const firstOpen = CORE.find((l) => !save.solved.includes(l.id));
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
      <h1
        ref={heading}
        tabIndex={-1}
        className="text-3xl font-black tracking-tight text-slate-100 focus:outline-none"
      >
        Review done.
      </h1>
      <dl className="mt-5 flex gap-8">
        {stats.map(([label, n]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
            <dd className="text-3xl font-black tabular-nums text-slate-100">{n}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-300">
        {upcoming !== null && `The next review is due in ${waitText(upcoming - now)}. `}
        {tally.skipped > 0 && 'Skipped levels stay due.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {firstOpen && (
          <button onClick={() => onContinue(firstOpen.id)} className={PRIMARY}>
            Continue: {firstOpen.title}
          </button>
        )}
        <button onClick={onBack} className={firstOpen ? SECONDARY : PRIMARY}>
          Back to all levels
        </button>
      </div>
    </div>
  );
}
