/**
 * Sokoban engine invariants.
 *
 * The one that matters most is the solver. Every authored level is searched
 * breadth-first for a solution, so a level that cannot actually be finished
 * fails the build rather than being discovered by a player who spends twenty
 * minutes proving it by hand. It doubles as a real workout for the move rules,
 * because the search only explores states the engine itself produced.
 */
import {
  boxesOnGoal,
  buildLevel,
  cellKey,
  cellXY,
  createGame,
  hudOf,
  isSolved,
  isStuck,
  levelCount,
  move,
  reset,
  undo,
} from '../../src/games/sokoban/engine/engine';
import { LEVELS } from '../../src/games/sokoban/engine/levels';
import type { Dir, GameState } from '../../src/games/sokoban/engine/types';
import { expect } from '../checks';

const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

function snapshot(s: GameState): string {
  return `${s.player.x},${s.player.y}|${[...s.boxes].sort((a, b) => a - b).join(',')}`;
}

function invariants(s: GameState, label: string): void {
  expect(
    s.player.x >= 0 && s.player.y >= 0 && s.player.x < s.width && s.player.y < s.height,
    `${label}: player left the grid at ${s.player.x},${s.player.y}`,
  );
  expect(
    !s.walls[s.player.y][s.player.x],
    `${label}: player is standing inside a wall at ${s.player.x},${s.player.y}`,
  );

  const playerCell = cellKey(s.width, s.player.x, s.player.y);
  expect(!s.boxes.has(playerCell), `${label}: player is standing on a box`);

  for (const key of s.boxes) {
    const { x, y } = cellXY(s.width, key);
    expect(
      x >= 0 && y >= 0 && x < s.width && y < s.height,
      `${label}: box left the grid at ${x},${y}`,
    );
    expect(!s.walls[y][x], `${label}: box is inside a wall at ${x},${y}`);
  }

  expect(s.moves >= 0, `${label}: move count went negative`);
  expect(s.pushes >= 0, `${label}: push count went negative`);
  expect(s.pushes <= s.moves, `${label}: ${s.pushes} pushes from only ${s.moves} moves`);
}

/**
 * Breadth-first search over (player, boxes). Small levels only, which is why
 * the authored ones are kept small on purpose.
 */
function solve(index: number, cap = 400_000): { solved: boolean; depth: number; seen: number } {
  const start = createGame(index);
  if (isSolved(start)) return { solved: true, depth: 0, seen: 0 };

  const seen = new Set<string>([snapshot(start)]);
  let frontier: GameState[] = [start];
  let depth = 0;

  while (frontier.length > 0 && seen.size < cap) {
    const next: GameState[] = [];
    depth += 1;

    for (const state of frontier) {
      for (const dir of DIRS) {
        // Cloned rather than moved and undone, so a bug in undo cannot make
        // the search agree with itself and hide the bug.
        const child: GameState = {
          ...state,
          boxes: new Set(state.boxes),
          player: { ...state.player },
          history: [],
          events: [],
        };
        if (!move(child, dir)) continue;

        const key = snapshot(child);
        if (seen.has(key)) continue;
        seen.add(key);

        if (isSolved(child)) return { solved: true, depth, seen: seen.size };
        next.push(child);
      }
    }
    frontier = next;
  }

  return { solved: false, depth, seen: seen.size };
}

export function sokobanEngineChecks(): void {
  // 1. Every authored level is well formed.
  LEVELS.forEach((level, i) => {
    const s = buildLevel(level, i);
    const goals = s.goals.flat().filter(Boolean).length;

    expect(s.boxes.size > 0, `level ${i} (${level.name}): has no boxes`);
    expect(goals > 0, `level ${i} (${level.name}): has no goals`);
    expect(
      s.boxes.size === goals,
      `level ${i} (${level.name}): ${s.boxes.size} boxes against ${goals} goals`,
    );
    expect(
      !s.walls[s.player.y][s.player.x],
      `level ${i} (${level.name}): the player starts inside a wall`,
    );
    expect(
      !isSolved(s),
      `level ${i} (${level.name}): starts already solved`,
    );
    expect(
      !isStuck(s),
      `level ${i} (${level.name}): starts with a box already wedged in a corner`,
    );

    // Every row the same width, so no lookup can fall off the end.
    for (let y = 0; y < s.height; y++) {
      expect(
        s.walls[y].length === s.width && s.goals[y].length === s.width,
        `level ${i} (${level.name}): row ${y} is ragged`,
      );
    }
  });

  // 2. Every authored level can actually be finished.
  {
    for (let i = 0; i < levelCount(); i++) {
      const result = solve(i);
      expect(
        result.solved,
        `level ${i} (${LEVELS[i].name}): no solution found in ${result.seen} states`,
      );
      console.log(
        `level ${i}  ${LEVELS[i].name.padEnd(16)} solved in ${String(result.depth).padStart(3)} moves  ` +
          `(${result.seen} states searched)`,
      );
    }
  }

  // 3. Random walk soak. Nothing here should ever produce an illegal board,
  //    however hard the walls are leaned on.
  {
    let steps = 0;
    let blocked = 0;
    let solved = 0;

    for (let i = 0; i < levelCount(); i++) {
      for (let run = 0; run < 40; run++) {
        let s = createGame(i);
        let seed = 1234 + run * 97 + i * 7717;

        for (let k = 0; k < 400; k++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          const dir = DIRS[seed % 4];
          if (!move(s, dir)) blocked++;
          steps++;
          invariants(s, `level ${i}:soak`);

          if (s.status === 'solved') {
            solved++;
            break;
          }
          // Occasionally take a move back, so undo runs against real boards
          // rather than only against the tidy cases below.
          if (k % 17 === 0) {
            undo(s);
            invariants(s, `level ${i}:soak:undo`);
          }
          if (k % 137 === 0) {
            s = reset(s);
            invariants(s, `level ${i}:soak:reset`);
          }
        }
      }
    }

    console.log(
      `soak      ${steps} attempted moves, ${blocked} refused, ${solved} accidental solutions`,
    );
    expect(blocked > 0, 'soak: nothing was ever refused, the walls are not solid');
  }

  // 4. Undo is an exact inverse, all the way back to the start.
  {
    for (let i = 0; i < levelCount(); i++) {
      const s = createGame(i);
      const start = snapshot(s);
      const trail: string[] = [];
      let seed = 999 + i * 31;

      for (let k = 0; k < 120; k++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        trail.push(snapshot(s));
        if (!move(s, DIRS[seed % 4])) trail.pop();
        if (s.status === 'solved') break;
      }

      while (trail.length > 0) {
        const wanted = trail.pop()!;
        expect(undo(s), `level ${i}: undo refused with history still to unwind`);
        expect(
          snapshot(s) === wanted,
          `level ${i}: undo restored ${snapshot(s)}, expected ${wanted}`,
        );
      }

      expect(snapshot(s) === start, `level ${i}: unwinding did not reach the starting board`);
      expect(s.moves === 0, `level ${i}: move counter unwound to ${s.moves}`);
      expect(s.pushes === 0, `level ${i}: push counter unwound to ${s.pushes}`);
      expect(!undo(s), `level ${i}: undo went past the start of the level`);
    }
  }

  // 5. A box cannot be pushed into a wall, and boxes do not push each other.
  {
    const s = buildLevel(
      {
        name: 'test',
        rows: [
          '######',
          '#@$$ #',
          '######',
        ],
      },
      0,
    );
    const before = snapshot(s);
    expect(!move(s, 'right'), 'two boxes in a row were pushed as one');
    expect(snapshot(s) === before, 'a refused push still moved something');
    expect(s.moves === 0, 'a refused push counted as a move');
  }

  {
    const s = buildLevel(
      {
        name: 'test',
        rows: [
          '#####',
          '#@$##',
          '#####',
        ],
      },
      0,
    );
    expect(!move(s, 'right'), 'a box was pushed into a wall');
    expect(s.pushes === 0, 'a refused push was counted');
  }

  // 6. Pushing counts as a move and a push; walking counts as a move only.
  {
    const s = buildLevel(
      {
        name: 'test',
        rows: [
          '######',
          '#@ $.#',
          '######',
        ],
      },
      0,
    );
    move(s, 'right');
    expect(s.moves === 1 && s.pushes === 0, `walking scored ${s.moves}/${s.pushes}`);
    move(s, 'right');
    expect(s.moves === 2 && s.pushes === 1, `pushing scored ${s.moves}/${s.pushes}`);
    expect(s.status === 'solved', `the level did not register as solved, status '${s.status}'`);
    expect(boxesOnGoal(s) === 1, 'the box was not counted as home');
    expect(!move(s, 'left'), 'the board still accepted moves after being solved');
  }

  // 7. A corner deadlock is spotted, and a box on a goal in a corner is not
  //    mistaken for one.
  {
    const wedged = buildLevel(
      {
        name: 'test',
        rows: [
          '#####',
          '#$ .#',
          '# @ #',
          '#####',
        ],
      },
      0,
    );
    expect(isStuck(wedged), 'a box wedged in a corner was not reported as stuck');

    const home = buildLevel(
      {
        name: 'test',
        rows: [
          '#####',
          '#*  #',
          '# @ #',
          '#####',
        ],
      },
      0,
    );
    expect(!isStuck(home), 'a box finished in a corner goal was called stuck');
    expect(isSolved(home), 'a box on its goal did not count as solved');
  }

  // 8. Reset returns the level to its opening position.
  {
    const s = createGame(2);
    const start = snapshot(s);
    for (const dir of DIRS) move(s, dir);
    const fresh = reset(s);
    expect(snapshot(fresh) === start, 'reset did not restore the opening board');
    expect(fresh.moves === 0 && fresh.pushes === 0, 'reset left the counters running');
    expect(fresh.history.length === 0, 'reset left an undo history behind');
  }

  // 9. The HUD view matches the state it is built from.
  {
    const s = createGame(0);
    const hud = hudOf(s);
    expect(hud.levelIndex === 0, 'hud: wrong level index');
    expect(hud.boxes === s.boxes.size, 'hud: box count disagrees');
    expect(hud.onGoal === 0, 'hud: a fresh level already had a box home');
    expect(!hud.canUndo, 'hud: a fresh level offered an undo');
  }
}
