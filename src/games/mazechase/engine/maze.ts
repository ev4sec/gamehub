/**
 * The maze, authored as text and parsed once at module load.
 *
 * Twenty-eight by thirty-one, the classic proportions. Text is the right source
 * form here for the same reason Sokoban's levels are text: the shape of the
 * thing is visible in the file, so a wall in the wrong place is a typo you can
 * see rather than an index you have to work out.
 *
 * Legend:
 *   `#` wall            `.` dot          `o` power pellet
 *   ` ` open, no dot    `-` pen gate     `P` the player's start
 */
const ROWS = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '######.##### ## #####.######',
  '######.##          ##.######',
  '######.## ###--### ##.######',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......P .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

export const MAZE_W = 28;
export const MAZE_H = 31;

export type Cell = 'wall' | 'open' | 'dot' | 'pellet' | 'gate';

function cellOf(ch: string): Cell {
  switch (ch) {
    case '#':
      return 'wall';
    case '.':
      return 'dot';
    case 'o':
      return 'pellet';
    case '-':
      return 'gate';
    default:
      return 'open';
  }
}

function parse(): { grid: Cell[][]; start: { x: number; y: number } } {
  const grid: Cell[][] = [];
  let start = { x: 13, y: 23 };

  ROWS.forEach((line, y) => {
    // Loud rather than forgiving. Padding a short row or trimming a long one
    // would turn a typo into a maze that is subtly wrong everywhere after it,
    // which is exactly how a whole half of this board once ended up walled off
    // from the other. A wrong row is a bug in the file, so it throws.
    if (line.length !== MAZE_W) {
      throw new Error(`maze row ${y} is ${line.length} wide, expected ${MAZE_W}`);
    }
    const cells: Cell[] = [];
    for (let x = 0; x < MAZE_W; x++) {
      const ch = line[x];
      if (ch === 'P') start = { x, y };
      cells.push(ch === 'P' ? 'dot' : cellOf(ch));
    }
    grid.push(cells);
  });

  return { grid, start };
}

const parsed = parse();

/** The authored maze. Games copy it; nothing mutates this. */
export const MAZE: readonly (readonly Cell[])[] = parsed.grid;
export const PLAYER_START = parsed.start;

/** The row the tunnel runs along, which is the only row that wraps. */
export const TUNNEL_ROW = 14;

/**
 * The tile a ghost aims for on its way out of, or back into, the pen.
 *
 * `PEN_DOOR` is the corridor tile immediately above the gate, not the gate
 * itself. That distinction matters: a ghost that treats the gate as its exit
 * tile picks its next direction while standing in the doorway, where three of
 * the four neighbours are wall, and walks into one of them.
 */
export const PEN_DOOR = { x: 13, y: 11 };
export const PEN_INSIDE = { x: 13, y: 14 };

export function freshGrid(): Cell[][] {
  return MAZE.map((row) => [...row]);
}

export function isWall(grid: readonly (readonly Cell[])[], x: number, y: number): boolean {
  if (y < 0 || y >= MAZE_H) return true;
  const row = grid[y];
  const cell = row[((x % MAZE_W) + MAZE_W) % MAZE_W];
  return cell === 'wall';
}

/** The gate is a wall to the player and a door to a ghost. */
export function isGate(grid: readonly (readonly Cell[])[], x: number, y: number): boolean {
  if (y < 0 || y >= MAZE_H) return false;
  return grid[y][((x % MAZE_W) + MAZE_W) % MAZE_W] === 'gate';
}

export function wrapX(x: number): number {
  return ((x % MAZE_W) + MAZE_W) % MAZE_W;
}

export function countDots(grid: readonly (readonly Cell[])[]): number {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell === 'dot' || cell === 'pellet') n += 1;
  return n;
}
