import { useEffect, useState } from 'react';
import { MAX_BOX } from '../../../platform/spacedReview';

interface PipsProps {
  strength: number;
  /** Start here and fill to `strength` on the next frame, so a gain is seen arriving. */
  from?: number;
  large?: boolean;
}

/** How well a finished lesson is holding, as four bars. Empty ones are outlined, not merely dim. */
export function Pips({ strength, from, large = false }: PipsProps) {
  const [shown, setShown] = useState(from ?? strength);

  useEffect(() => {
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
          } ${i < shown ? 'bg-yellow-300' : 'ring-1 ring-inset ring-slate-500'}`}
        />
      ))}
    </span>
  );
}
