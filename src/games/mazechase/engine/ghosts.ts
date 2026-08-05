import { randInt } from '../../../platform/rng';
import { DELTA, DIR_ORDER, OPPOSITE, SCATTER_TARGETS } from './constants';
import { PEN_DOOR, isGate, isWall, wrapX } from './maze';
import type { Cell } from './maze';
import type { Actor, Dir, Ghost, GameState } from './types';

/**
 * The four minds.
 *
 * They are one array of identical records rather than four named fields, so the
 * tick is one loop and the suite can assert over all four uniformly. What makes
 * them feel different is one function each, evaluated only when a ghost arrives
 * at a tile, which is about eight times a second per ghost.
 *
 * The rule that makes them feel right, and the one that regresses silently if
 * nobody writes it down: a ghost never reverses. It picks among the three
 * directions that are not behind it, and only a mode change turns it around.
 */

type Grid = readonly (readonly Cell[])[];

function ahead(actor: Actor, tiles: number): { x: number; y: number } {
  const d = DELTA[actor.dir];
  return { x: actor.tx + d.x * tiles, y: actor.ty + d.y * tiles };
}

/**
 * Where each ghost wants to be. Blinky goes straight at you; Pinky cuts you
 * off; Inky works off Blinky's position, so he is dangerous exactly when Blinky
 * is close; Clyde loses his nerve inside eight tiles.
 */
export function targetFor(s: GameState, ghost: Ghost): { x: number; y: number } {
  if (ghost.mode === 'eaten') return PEN_DOOR;
  if (ghost.mode === 'scatter') return SCATTER_TARGETS[ghost.name];

  const pac = s.pac;

  switch (ghost.name) {
    case 'blinky':
      return { x: pac.tx, y: pac.ty };

    case 'pinky':
      return ahead(pac, 4);

    case 'inky': {
      const blinky = s.ghosts.find((g) => g.name === 'blinky');
      const pivot = ahead(pac, 2);
      if (!blinky) return pivot;
      // The vector from Blinky to two tiles ahead of the player, doubled.
      return {
        x: pivot.x + (pivot.x - blinky.tx),
        y: pivot.y + (pivot.y - blinky.ty),
      };
    }

    case 'clyde': {
      const distance = Math.hypot(pac.tx - ghost.tx, pac.ty - ghost.ty);
      return distance > 8 ? { x: pac.tx, y: pac.ty } : SCATTER_TARGETS.clyde;
    }
  }
}

/** Can this actor stand on the tile in that direction? */
export function canEnter(
  grid: Grid,
  x: number,
  y: number,
  dir: Dir,
  ghost: boolean,
): boolean {
  const d = DELTA[dir];
  const nx = wrapX(x + d.x);
  const ny = y + d.y;

  // The door opens for ghosts, on the way out and on the way back. It is a
  // wall to the player, which is what keeps the pen a sanctuary.
  if (isGate(grid, nx, ny)) return ghost;
  return !isWall(grid, nx, ny);
}

/**
 * The direction a ghost takes on arriving at a tile.
 *
 * Ties break in `DIR_ORDER`, which is not decoration: preferring up, then left,
 * then down, then right is what produces the original's paths.
 */
export function chooseGhostDir(s: GameState, ghost: Ghost): Dir {
  const back = OPPOSITE[ghost.dir];
  const legal = DIR_ORDER.filter(
    (dir) =>
      dir !== back &&
      canEnter(s.grid, ghost.tx, ghost.ty, dir, true),
  );

  // Boxed into a dead end, which the pen can do. Turning round is the only move.
  if (legal.length === 0) return back;

  if (ghost.mode === 'frightened') {
    return legal[randInt(s, legal.length)];
  }

  const target = targetFor(s, ghost);
  let best = legal[0];
  let bestDistance = Infinity;

  for (const dir of legal) {
    const d = DELTA[dir];
    const nx = ghost.tx + d.x;
    const ny = ghost.ty + d.y;
    const distance = Math.hypot(nx - target.x, ny - target.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = dir;
    }
  }

  return best;
}
