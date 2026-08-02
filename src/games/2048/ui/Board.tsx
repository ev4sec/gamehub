import { styleFor } from '../engine/constants';
import type { Tile } from '../engine/types';

interface Props {
  size: number;
  tiles: Tile[];
  fading: Tile[];
}

/**
 * Keyframes shipped with the component rather than added to the global sheet,
 * so this game stays as self-contained as the ones that draw to a canvas.
 */
const KEYFRAMES = `
@keyframes g2048-appear { from { transform: scale(0.1); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes g2048-pop { 0% { transform: scale(1); } 45% { transform: scale(1.16); } 100% { transform: scale(1); } }
`;

function fontSizeFor(value: number, size: number): string {
  const digits = String(value).length;
  const base = size <= 3 ? 2.6 : size === 4 ? 2.1 : 1.7;
  const shrink = Math.max(0, digits - 2) * 0.32;
  return `${Math.max(0.75, base - shrink)}rem`;
}

function TileView({ tile, size, ghost }: { tile: Tile; size: number; ghost?: boolean }) {
  const palette = styleFor(tile.value);
  const step = 100 / size;

  return (
    <div
      className="absolute p-[3%] transition-[left,top] duration-100 ease-out"
      style={{
        left: `${tile.x * step}%`,
        top: `${tile.y * step}%`,
        width: `${step}%`,
        height: `${step}%`,
        // A consumed tile slides under the tile that ate it and is not drawn on
        // top of it, so the merge reads as one tile rather than a flicker.
        zIndex: ghost ? 1 : 2,
      }}
      aria-hidden={ghost}
      {...(ghost ? {} : { 'data-tile': tile.value })}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-lg font-bold tabular-nums shadow-lg shadow-black/30"
        style={{
          background: palette.bg,
          color: palette.fg,
          fontSize: fontSizeFor(tile.value, size),
          animation: tile.isNew
            ? 'g2048-appear 140ms ease-out'
            : tile.merged
              ? 'g2048-pop 160ms ease-out'
              : undefined,
        }}
      >
        {tile.value}
      </div>
    </div>
  );
}

export function Board({ size, tiles, fading }: Props) {
  return (
    <div className="relative aspect-square w-full rounded-2xl border-2 border-slate-700/80 bg-slate-900/70 p-[1.5%] shadow-2xl shadow-black/50">
      <style>{KEYFRAMES}</style>

      <div
        className="grid h-full w-full gap-0"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        aria-hidden
      >
        {Array.from({ length: size * size }, (_, i) => (
          <div key={i} className="p-[3%]">
            <div className="h-full w-full rounded-lg bg-slate-800/50" />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 p-[1.5%]">
        <div className="relative h-full w-full">
          {fading.map((tile) => (
            <TileView key={`fade-${tile.id}`} tile={tile} size={size} ghost />
          ))}
          {tiles.map((tile) => (
            <TileView key={tile.id} tile={tile} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}
