import {
  ArrowDownToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Square,
} from 'lucide-react';
import type { Action, Held } from '../engine/types';

interface Props {
  onAct: (action: Action) => void;
  onHold: (key: keyof Held, down: boolean) => void;
}

/**
 * Touch controls, hidden on pointer-precise screens.
 *
 * Left, right and soft drop are press-and-hold so auto-repeat works the way it
 * does on a keyboard; the rest are taps. `onPointerLeave` matters as much as
 * `onPointerUp`, because a thumb that slides off a button never sends an up
 * event and the piece would keep travelling.
 */
export function TouchControls({ onAct, onHold }: Props) {
  const holdProps = (key: keyof Held) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onHold(key, true);
    },
    onPointerUp: () => onHold(key, false),
    onPointerLeave: () => onHold(key, false),
    onPointerCancel: () => onHold(key, false),
  });

  return (
    <div className="mt-4 grid grid-cols-6 gap-2 [@media(hover:hover)]:hidden">
      <Pad label="Move left" {...holdProps('left')}>
        <ChevronLeft size={20} />
      </Pad>
      <Pad label="Move right" {...holdProps('right')}>
        <ChevronRight size={20} />
      </Pad>
      <Pad label="Soft drop" {...holdProps('softDrop')}>
        <ChevronDown size={20} />
      </Pad>
      <Pad label="Rotate left" onClick={() => onAct('rotateCCW')}>
        <RotateCcw size={18} />
      </Pad>
      <Pad label="Rotate right" onClick={() => onAct('rotateCW')}>
        <RotateCw size={18} />
      </Pad>
      <Pad label="Hold piece" onClick={() => onAct('hold')}>
        <Square size={18} />
      </Pad>
      <div className="col-span-6">
        <Pad label="Hard drop" wide onClick={() => onAct('hardDrop')}>
          <ArrowDownToLine size={20} />
        </Pad>
      </div>
    </div>
  );
}

function Pad({
  label,
  children,
  wide,
  ...handlers
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
} & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex ${wide ? 'w-full' : ''} items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 py-3 text-slate-300 transition active:bg-slate-700`}
      {...handlers}
    >
      {children}
    </button>
  );
}
