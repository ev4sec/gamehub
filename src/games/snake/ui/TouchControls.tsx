import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { Dir } from '../engine/types';

interface Props {
  onTurn: (dir: Dir) => void;
}

const PAD: { dir: Dir; icon: React.ReactNode; area: string }[] = [
  { dir: 'up', icon: <ArrowUp size={22} />, area: 'col-start-2 row-start-1' },
  { dir: 'left', icon: <ArrowLeft size={22} />, area: 'col-start-1 row-start-2' },
  { dir: 'down', icon: <ArrowDown size={22} />, area: 'col-start-2 row-start-2' },
  { dir: 'right', icon: <ArrowRight size={22} />, area: 'col-start-3 row-start-2' },
];

export function TouchControls({ onTurn }: Props) {
  return (
    <div className="mx-auto mt-5 grid w-44 grid-cols-3 grid-rows-2 gap-2 [@media(hover:hover)]:hidden">
      {PAD.map(({ dir, icon, area }) => (
        <button
          key={dir}
          aria-label={dir}
          // Pointer events fire before the synthetic click, which keeps the
          // d-pad responsive enough to steer with.
          onPointerDown={(e) => {
            e.preventDefault();
            onTurn(dir);
          }}
          className={`${area} flex h-14 touch-manipulation select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 transition active:border-emerald-400 active:text-emerald-300`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
