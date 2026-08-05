import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { Dir } from '../engine/types';

interface Props {
  onHop: (dir: Dir) => void;
}

const PAD: { dir: Dir; icon: React.ReactNode; area: string }[] = [
  { dir: 'up', icon: <ArrowUp size={24} />, area: 'col-start-2 row-start-1' },
  { dir: 'left', icon: <ArrowLeft size={24} />, area: 'col-start-1 row-start-2' },
  { dir: 'down', icon: <ArrowDown size={24} />, area: 'col-start-2 row-start-2' },
  { dir: 'right', icon: <ArrowRight size={24} />, area: 'col-start-3 row-start-2' },
];

/**
 * The pad exists for discoverability and for players who would rather not put a
 * thumb over the board. A swipe anywhere on the board does the same thing, and
 * a tap there hops forward, because forward is most of what this game asks for.
 *
 * Shown by pointer type rather than by viewport width: a laptop at 900px does
 * not want this, and a tablet at 900px does.
 */
export function TouchControls({ onHop }: Props) {
  return (
    <div className="mx-auto mt-4 grid w-46 grid-cols-3 grid-rows-2 gap-2 [@media(hover:hover)]:hidden">
      {PAD.map(({ dir, icon, area }) => (
        <button
          key={dir}
          aria-label={dir}
          onPointerDown={(e) => {
            e.preventDefault();
            onHop(dir);
          }}
          className={`${area} flex h-14 touch-manipulation select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 transition active:border-lime-400 active:text-lime-300`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
