import { useEffect, useState } from 'react';
import { MAX_BOX } from '../engine/review';

interface Props {
  strength: number;
  /** Start here and fill to `strength` on the next frame, so a gain is seen arriving. */
  from?: number;
  large?: boolean;
}

/**
 * How well a solved level is holding, as four bars. Empty bars are outlined
 * rather than merely dim, so strength 0 (four outlines) cannot be mistaken for
 * a level that was never solved (no bars at all).
 */
export function Pips({ strength, from, large = false }: Props) {
  const [shown, setShown] = useState(from ?? strength);

  useEffect(() => {
    // Nothing to animate on the menu, and a frame requested there would sit
    // waiting behind every row for no reason.
    if (from === undefined || from === strength) return;
    const frame = requestAnimationFrame(() => setShown(strength));
    return () => cancelAnimationFrame(frame);
  }, [from, strength]);

  return (
    <span aria-hidden="true" data-strength={strength} className="flex gap-0.5">
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <span
          key={i}
          className={`rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none ${
            large ? 'h-2 w-4' : 'h-1.5 w-3'
          } ${i < shown ? 'bg-indigo-300' : 'ring-1 ring-inset ring-slate-500'}`}
        />
      ))}
    </span>
  );
}
