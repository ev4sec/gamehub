import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { Dir } from '../engine/types';

interface Props {
  onMove: (dir: Dir) => void;
}

const PAD: { dir: Dir; icon: React.ReactNode; area: string }[] = [
  { dir: 'up', icon: <ArrowUp size={22} />, area: 'col-start-2 row-start-1' },
  { dir: 'left', icon: <ArrowLeft size={22} />, area: 'col-start-1 row-start-2' },
  { dir: 'down', icon: <ArrowDown size={22} />, area: 'col-start-2 row-start-2' },
  { dir: 'right', icon: <ArrowRight size={22} />, area: 'col-start-3 row-start-2' },
];

/**
 * Sokoban is turn-based, so unlike Snake's pad this one does not have to be
 * fast enough to steer with. It still fires on pointer-down rather than click,
 * because a player nudging a box into a corner taps in bursts and the delay
 * before a synthetic click reads as a dropped move.
 */
export function TouchControls({ onMove }: Props) {
  return (
    <div className="mx-auto mt-5 grid w-44 grid-cols-3 grid-rows-2 gap-2 [@media(hover:hover)]:hidden">
      {PAD.map(({ dir, icon, area }) => (
        <button
          key={dir}
          aria-label={dir}
          onPointerDown={(e) => {
            e.preventDefault();
            onMove(dir);
          }}
          className={`${area} flex h-14 touch-manipulation select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 transition active:border-violet-400 active:text-violet-300`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
