import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { Dir } from '../engine/types';

interface Props {
  onSteer: (dir: Dir) => void;
}

const PAD: { dir: Dir; icon: React.ReactNode; area: string }[] = [
  { dir: 'up', icon: <ArrowUp size={22} />, area: 'col-start-2 row-start-1' },
  { dir: 'left', icon: <ArrowLeft size={22} />, area: 'col-start-1 row-start-2' },
  { dir: 'down', icon: <ArrowDown size={22} />, area: 'col-start-2 row-start-2' },
  { dir: 'right', icon: <ArrowRight size={22} />, area: 'col-start-3 row-start-2' },
];

/**
 * Slightly tighter than the pads in the other games, at 52px rather than 56.
 * That is the one place the vertical budget on a small phone bites: a
 * thirty-one row board plus a HUD plus this has to fit above the fold, and 52
 * is still comfortably above the floor a thumb needs.
 */
export function TouchControls({ onSteer }: Props) {
  return (
    <div className="mx-auto mt-3 grid w-42 grid-cols-3 grid-rows-2 gap-2 [@media(hover:hover)]:hidden">
      {PAD.map(({ dir, icon, area }) => (
        <button
          key={dir}
          aria-label={dir}
          onPointerDown={(e) => {
            e.preventDefault();
            onSteer(dir);
          }}
          className={`${area} flex h-13 touch-manipulation select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 transition active:border-orange-400 active:text-orange-300`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
