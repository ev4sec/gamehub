import { cellKey } from '../engine/engine';
import type { GameState } from '../engine/types';

/**
 * The board as a plain CSS grid.
 *
 * Like 2048, this game needs no canvas. It also means every box and goal is a
 * real element the smoke suite can count, which is what makes "three boxes,
 * two of them home" checkable rather than a claim about pixels.
 */
export function Board({ board }: { board: GameState }) {
  const cells = [];

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const wall = board.walls[y][x];
      const goal = board.goals[y][x];
      const box = board.boxes.has(cellKey(board.width, x, y));
      const player = board.player.x === x && board.player.y === y;
      const home = box && goal;

      cells.push(
        <div
          key={`${x},${y}`}
          className={`relative flex items-center justify-center ${
            wall ? 'rounded-[3px] bg-slate-700' : ''
          }`}
        >
          {goal && !wall && (
            <span
              className="absolute h-1/3 w-1/3 rounded-full border-2 border-emerald-400/70"
              data-goal
              aria-hidden
            />
          )}

          {box && (
            <span
              className={`absolute h-[82%] w-[82%] rounded-[4px] border-2 ${
                home
                  ? 'border-emerald-300 bg-emerald-500/80'
                  : 'border-amber-300 bg-amber-500/70'
              }`}
              data-box={home ? 'home' : 'loose'}
              aria-label={home ? 'box on a goal' : 'box'}
              role="img"
            />
          )}

          {player && (
            <span
              className="absolute h-[62%] w-[62%] rounded-full bg-sky-300 shadow-lg shadow-sky-500/40"
              data-player
              aria-label="player"
              role="img"
            />
          )}
        </div>,
      );
    }
  }

  return (
    <div
      className="mx-auto grid w-full gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
        aspectRatio: `${board.width} / ${board.height}`,
      }}
    >
      {cells}
    </div>
  );
}
