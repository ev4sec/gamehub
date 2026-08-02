import { block, easeOut, roundRect, stage } from './paint';
import { TETRIS } from './palette';
import type { PreviewSpec } from './driver';

const COLS = 10;
const ROWS = 9;
const CELL = 8;
const ORIGIN_X = 40;
const ORIGIN_Y = 9;

const PERIOD = 8400;
/** The row completes here; it flashes, then the stack collapses onto it. */
const CLEAR_AT = 4600;
const FLASH_MS = 180;
const COLLAPSE_MS = 200;

interface Cell {
  c: number;
  r: number;
  k: string;
}

/** The wall already standing when the loop begins. Row 8 is the floor. */
const BASE: Cell[] = [
  { c: 0, r: 8, k: 'J' }, { c: 1, r: 8, k: 'L' }, { c: 2, r: 8, k: 'S' },
  { c: 7, r: 8, k: 'T' }, { c: 8, r: 8, k: 'Z' }, { c: 9, r: 8, k: 'J' },
  { c: 0, r: 7, k: 'L' }, { c: 1, r: 7, k: 'O' }, { c: 9, r: 7, k: 'S' },
  { c: 0, r: 6, k: 'Z' }, { c: 9, r: 6, k: 'T' },
];

interface Piece {
  k: string;
  /** Offsets from the piece's landing origin. */
  cells: [number, number][];
  c: number;
  landRow: number;
  start: number;
  land: number;
}

/**
 * Three pieces. The last is an I laid flat across the gap the base wall leaves,
 * which completes the floor and triggers the clear.
 */
const PIECES: Piece[] = [
  { k: 'O', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], c: 7, landRow: 5, start: 0, land: 1500 },
  { k: 'T', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], c: 1, landRow: 5, start: 1700, land: 3100 },
  { k: 'I', cells: [[0, 0], [1, 0], [2, 0], [3, 0]], c: 3, landRow: 8, start: 3300, land: CLEAR_AT },
];

function cellsOf(piece: Piece, row: number): Cell[] {
  return piece.cells.map(([dx, dy]) => ({ c: piece.c + dx, r: row + dy, k: piece.k }));
}

function draw(g: CanvasRenderingContext2D, cell: Cell, alpha = 1): void {
  g.globalAlpha = alpha;
  block(
    g,
    ORIGIN_X + cell.c * CELL + 0.5,
    ORIGIN_Y + cell.r * CELL + 0.5,
    CELL - 1,
    CELL - 1,
    TETRIS[cell.k] ?? '#94a3b8',
    1.5,
  );
  g.globalAlpha = 1;
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  stage(ctx, w, h, (g) => {
    // The well.
    g.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    g.lineWidth = 1;
    roundRect(g, ORIGIN_X - 1, ORIGIN_Y - 1, COLS * CELL + 2, ROWS * CELL + 2, 2);
    g.stroke();

    const cleared = t >= CLEAR_AT + FLASH_MS;
    const collapse = cleared
      ? easeOut(Math.min(1, (t - CLEAR_AT - FLASH_MS) / COLLAPSE_MS))
      : 0;

    const settled: Cell[] = [...BASE];
    for (const piece of PIECES) {
      if (t >= piece.land) settled.push(...cellsOf(piece, piece.landRow));
    }

    for (const cell of settled) {
      // The completed floor is removed, and everything above it slides down
      // into the gap rather than teleporting.
      if (cleared && cell.r === 8) continue;
      const shift = cleared && cell.r < 8 ? collapse : 0;
      draw(g, { ...cell, r: cell.r + shift });
    }

    // The flash, in the moment between completion and collapse.
    if (t >= CLEAR_AT && t < CLEAR_AT + FLASH_MS) {
      g.globalAlpha = 0.85 * (1 - (t - CLEAR_AT) / FLASH_MS);
      g.fillStyle = '#f8fafc';
      g.fillRect(ORIGIN_X, ORIGIN_Y + 8 * CELL, COLS * CELL, CELL);
      g.globalAlpha = 1;
    }

    // Whichever piece is in the air, plus its ghost on the landing row.
    for (const piece of PIECES) {
      if (t < piece.start || t >= piece.land) continue;
      const k = (t - piece.start) / (piece.land - piece.start);
      const row = -2 + (piece.landRow + 2) * k;

      g.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      g.lineWidth = 0.6;
      for (const cell of cellsOf(piece, piece.landRow)) {
        roundRect(
          g,
          ORIGIN_X + cell.c * CELL + 1,
          ORIGIN_Y + cell.r * CELL + 1,
          CELL - 2,
          CELL - 2,
          1.5,
        );
        g.stroke();
      }

      for (const cell of cellsOf(piece, row)) draw(g, cell);
    }
  });
}

export const tetrisPreview: PreviewSpec = {
  paint,
  periodMs: PERIOD,
  // The I-piece hanging over the one open row, ghost drawn where it will land.
  stillMs: 4200,
};
