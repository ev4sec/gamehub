/**
 * 2048 engine invariants.
 *
 * The load-bearing one is conservation: merging two tiles preserves their
 * total, and sliding preserves it too, so the sum of the board can only ever
 * change by the value of the tile that spawned. Almost every way of getting the
 * merge scan wrong (merging a tile twice, dropping a tile, double-counting a
 * pair) breaks that equality on the very first move, while a check that only
 * looked at positions would let most of them through.
 */
import {
  canMove,
  createGame,
  highestTile,
  hudOf,
  keepPlaying,
  move,
  undoMove,
} from '../../src/games/2048/engine/engine';
import { MODE_META, MODES } from '../../src/games/2048/engine/constants';
import type { Dir, GameState, Tile } from '../../src/games/2048/engine/types';
import { rand } from '../../src/platform/rng';
import { expect } from '../checks';

const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

function sumOf(tiles: Tile[]): number {
  return tiles.reduce((total, t) => total + t.value, 0);
}

function setBoard(s: GameState, rows: number[][]): void {
  s.tiles = [];
  s.fading = [];
  s.nextId = 1;
  rows.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value > 0) {
        s.tiles.push({ id: s.nextId++, value, x, y, isNew: false, merged: false });
      }
    }),
  );
}

function valueAt(s: GameState, x: number, y: number): number {
  return s.tiles.find((t) => t.x === x && t.y === y)?.value ?? 0;
}

function invariants(s: GameState, label: string): void {
  const seen = new Set<string>();
  const ids = new Set<number>();

  for (const t of s.tiles) {
    expect(
      t.x >= 0 && t.y >= 0 && t.x < s.size && t.y < s.size,
      `${label}: tile out of bounds at ${t.x},${t.y}`,
    );
    const key = `${t.x},${t.y}`;
    expect(!seen.has(key), `${label}: two tiles share cell ${key}`);
    seen.add(key);

    expect(!ids.has(t.id), `${label}: duplicate tile id ${t.id}`);
    ids.add(t.id);

    expect(t.value >= 2, `${label}: tile value ${t.value} is below 2`);
    expect(
      Number.isInteger(Math.log2(t.value)),
      `${label}: tile value ${t.value} is not a power of two`,
    );
  }

  expect(
    s.tiles.length <= s.size * s.size,
    `${label}: ${s.tiles.length} tiles on a ${s.size}x${s.size} board`,
  );
}

export function twentyFortyEightEngineChecks(): void {
  // 1. Random-play soak with conservation checked on every single move.
  for (const mode of MODES) {
    let games = 0;
    let overs = 0;
    let moves = 0;
    let best = 0;

    for (let run = 0; run < 40; run++) {
      const s = createGame(mode, 909 + run * 6151);
      const holder = { rngState: 17 + run * 101 };
      games++;

      for (let i = 0; i < 4000; i++) {
        const dir = DIRS[Math.floor(rand(holder) * DIRS.length)];
        const before = sumOf(s.tiles);
        const scoreBefore = s.score;

        const played = move(s, dir);
        invariants(s, `${mode}:soak`);

        if (played) {
          const spawn = s.events.find((e) => e.t === 'spawn');
          const spawned = spawn && spawn.t === 'spawn' ? spawn.value : 0;
          expect(
            sumOf(s.tiles) === before + spawned,
            `${mode}: board sum went from ${before} to ${sumOf(s.tiles)} with ${spawned} spawned`,
          );
          expect(s.score >= scoreBefore, `${mode}: score went backwards`);
          moves++;
        } else {
          expect(
            sumOf(s.tiles) === before,
            `${mode}: a refused move still changed the board`,
          );
          expect(s.score === scoreBefore, `${mode}: a refused move still scored`);
        }

        if (s.status === 'over') {
          overs++;
          break;
        }
        if (s.status === 'won') keepPlaying(s);
      }
      best = Math.max(best, highestTile(s));
    }

    console.log(
      `${mode.padEnd(8)} ${String(games).padStart(3)} games  ${String(moves).padStart(6)} moves  ` +
        `${String(overs).padStart(3)} finished  best tile ${best}`,
    );
    expect(overs > 0, `${mode}: no random game ever reached a dead board`);
  }

  // 1b. A game played with a fixed move preference, which stacks far better
  //     than random and gets the big tiles and long chains actually built.
  {
    let best = 0;
    let bestScore = 0;
    let longest = 0;

    for (let run = 0; run < 20; run++) {
      const s = createGame('classic', 313 + run * 7919);
      let played = 0;
      // Left and up first keeps the mass in one corner, which is the whole of
      // the strategy and enough to reach 512 and beyond.
      const preference: Dir[] = ['left', 'up', 'right', 'down'];

      while (s.status !== 'over' && played < 20000) {
        let moved = false;
        for (const dir of preference) {
          const before = sumOf(s.tiles);
          if (move(s, dir)) {
            const spawn = s.events.find((e) => e.t === 'spawn');
            const spawned = spawn && spawn.t === 'spawn' ? spawn.value : 0;
            expect(
              sumOf(s.tiles) === before + spawned,
              `ai: board sum broke, ${before} to ${sumOf(s.tiles)} with ${spawned} spawned`,
            );
            invariants(s, 'classic:ai');
            moved = true;
            played++;
            break;
          }
        }
        if (!moved) break;
        if (s.status === 'won') keepPlaying(s);
      }

      best = Math.max(best, highestTile(s));
      bestScore = Math.max(bestScore, s.score);
      longest = Math.max(longest, played);
    }

    console.log(
      `ai       best tile ${best}  best score ${bestScore}  longest game ${longest} moves`,
    );
    expect(best >= 256, `AI soak: never got past ${best}, the merge logic is suspect`);
  }

  // 2. A tile merges at most once per move.
  {
    const s = createGame('classic', 5);
    setBoard(s, [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const played = move(s, 'left');
    expect(played, 'merge-once: the move was refused');
    expect(valueAt(s, 0, 0) === 4, `merge-once: leftmost is ${valueAt(s, 0, 0)}, expected 4`);
    expect(valueAt(s, 1, 0) === 4, `merge-once: second is ${valueAt(s, 1, 0)}, expected 4`);
    // Two survivors plus the tile the move spawned.
    expect(s.tiles.length === 3, `merge-once: ${s.tiles.length} tiles left, expected 3`);
    expect(s.score === 8, `merge-once: scored ${s.score}, expected 8`);
  }

  // 3. Three in a row merges the leading pair, not the trailing one.
  {
    const s = createGame('classic', 6);
    setBoard(s, [
      [4, 4, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    move(s, 'left');
    expect(valueAt(s, 0, 0) === 8, `triple: leftmost is ${valueAt(s, 0, 0)}, expected 8`);
    expect(valueAt(s, 1, 0) === 4, `triple: second is ${valueAt(s, 1, 0)}, expected 4`);
  }

  // 4. Direction is respected: the same row moved right merges the far pair.
  {
    const s = createGame('classic', 7);
    setBoard(s, [
      [4, 4, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    move(s, 'right');
    expect(valueAt(s, 3, 0) === 8, `right: rightmost is ${valueAt(s, 3, 0)}, expected 8`);
    expect(valueAt(s, 2, 0) === 4, `right: next along is ${valueAt(s, 2, 0)}, expected 4`);
  }

  // 5. Columns work the same way as rows.
  {
    const s = createGame('classic', 8);
    setBoard(s, [
      [8, 0, 0, 0],
      [8, 0, 0, 0],
      [2, 0, 0, 0],
      [2, 0, 0, 0],
    ]);
    move(s, 'up');
    expect(valueAt(s, 0, 0) === 16, `up: top is ${valueAt(s, 0, 0)}, expected 16`);
    expect(valueAt(s, 0, 1) === 4, `up: second is ${valueAt(s, 0, 1)}, expected 4`);
  }

  // 6. A move that changes nothing is refused outright, and costs nothing.
  {
    const s = createGame('classic', 9);
    setBoard(s, [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const tilesBefore = s.tiles.length;
    const played = move(s, 'left');
    expect(!played, 'blocked: a move that changes nothing reported success');
    expect(s.moves === 0, `blocked: move counter went to ${s.moves}`);
    expect(s.tiles.length === tilesBefore, 'blocked: a tile spawned on a refused move');
    expect(
      s.events.some((e) => e.t === 'blocked'),
      'blocked: no blocked event was emitted',
    );
  }

  // 7. Undo restores the board exactly, and is only good once.
  {
    const s = createGame('classic', 10);
    setBoard(s, [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const before = s.tiles.map((t) => `${t.x},${t.y},${t.value}`).sort().join('|');

    move(s, 'left');
    expect(s.score === 4, `undo: expected a score of 4 before undoing, got ${s.score}`);

    expect(undoMove(s), 'undo: refused when there was a move to take back');
    const after = s.tiles.map((t) => `${t.x},${t.y},${t.value}`).sort().join('|');
    expect(after === before, `undo: board came back as ${after}, expected ${before}`);
    expect(s.score === 0, `undo: score came back as ${s.score}, expected 0`);
    expect(s.moves === 0, `undo: move counter came back as ${s.moves}`);
    expect(!undoMove(s), 'undo: a second undo went through');
  }

  // 8. A full board with no equal neighbours is dead; one pair is enough to
  //    keep it alive.
  {
    const s = createGame('classic', 11);
    setBoard(s, [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(!canMove(s), 'dead board: reported a move available on a locked board');

    setBoard(s, [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4],
    ]);
    expect(canMove(s), 'live board: missed the one available merge');
  }

  // 9. Reaching the goal wins without ending the run.
  {
    for (const mode of MODES) {
      const goal = MODE_META[mode].goal;
      const half = goal / 2;
      const s = createGame(mode, 12);
      const blank = Array.from({ length: MODE_META[mode].size }, () =>
        Array<number>(MODE_META[mode].size).fill(0),
      );
      blank[0][0] = half;
      blank[0][1] = half;
      setBoard(s, blank);

      move(s, 'left');
      expect(highestTile(s) === goal, `${mode} win: highest tile is ${highestTile(s)}`);
      expect(s.status === 'won', `${mode} win: status is '${s.status}'`);
      expect(s.reachedGoal, `${mode} win: the goal was not recorded`);
      expect(
        s.events.some((e) => e.t === 'win'),
        `${mode} win: no win event`,
      );

      keepPlaying(s);
      expect(s.status === 'playing', `${mode} win: could not carry on past the goal`);
      expect(s.reachedGoal, `${mode} win: carrying on wiped the record of the win`);
    }
  }

  // 10. The HUD view matches the state it is built from.
  {
    const s = createGame('grand', 13);
    const hud = hudOf(s);
    expect(hud.size === 5, `hud: grand reported a ${hud.size}-wide board`);
    expect(hud.goal === 4096, `hud: grand reported a goal of ${hud.goal}`);
    expect(hud.moves === 0, 'hud: a fresh game had moves on the clock');
    expect(!hud.canUndo, 'hud: a fresh game offered an undo');
    expect(s.tiles.length === 2, `hud: a fresh game started with ${s.tiles.length} tiles`);
  }
}
