import { COLORS, SHAPES } from '../engine/constants';
import type { PieceKind } from '../engine/types';

/**
 * A piece drawn as a tiny CSS grid, for the hold slot and the next queue.
 *
 * Deliberately not a canvas. These are static, they need no loop, and as DOM
 * the smoke suite can see them: `next` and `hold` being wrong is exactly the
 * kind of wiring bug a pixel buffer would hide.
 */
export function PieceView({ kind, size = 12 }: { kind: PieceKind | null; size?: number }) {
  if (!kind) {
    return (
      <div
        className="rounded border border-dashed border-slate-700/70"
        style={{ width: size * 4, height: size * 2 }}
      />
    );
  }

  const cells = SHAPES[kind][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX + 1;
  const height = Math.max(...ys) - minY + 1;

  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${width}, ${size}px)` }}
      aria-label={`${kind} piece`}
      role="img"
    >
      {Array.from({ length: width * height }, (_, i) => {
        const cx = minX + (i % width);
        const cy = minY + Math.floor(i / width);
        const filled = cells.some(([x, y]) => x === cx && y === cy);
        return (
          <span
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: 2,
              background: filled ? COLORS[kind] : 'transparent',
            }}
          />
        );
      })}
    </div>
  );
}
