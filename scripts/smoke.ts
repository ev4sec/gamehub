import { createGame, step, queueDir, tickInterval, advanceLevel } from '../src/games/snake/engine/engine';
import { cellKey } from '../src/games/snake/engine/constants';
import { chooseRivalDir } from '../src/games/snake/engine/ai';
import { LEVELS } from '../src/games/snake/engine/levels';
import type { GameState, Mode } from '../src/games/snake/engine/types';

let failures = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.log('  FAIL: ' + msg);
  }
}

function invariants(s: GameState, label: string) {
  // No duplicated cells within the snake.
  const seen = new Set<number>();
  for (const p of s.snake) {
    const k = cellKey(p.x, p.y);
    check(!seen.has(k), `${label}: snake overlaps itself at ${p.x},${p.y} (tick ${s.tick})`);
    seen.add(k);
    check(
      p.x >= 0 && p.y >= 0 && p.x < s.gridW && p.y < s.gridH,
      `${label}: segment out of bounds ${p.x},${p.y}`,
    );
  }
  // Food never sits on the snake, a wall, or another food.
  const foodSeen = new Set<number>();
  for (const f of s.food) {
    const k = cellKey(f.x, f.y);
    check(!seen.has(k), `${label}: food spawned on the snake at ${f.x},${f.y}`);
    check(!s.walls.has(k), `${label}: food spawned inside a wall at ${f.x},${f.y}`);
    check(!foodSeen.has(k), `${label}: two apples on the same cell`);
    foodSeen.add(k);
  }
  for (const d of s.drops) {
    check(!s.walls.has(cellKey(d.pos.x, d.pos.y)), `${label}: power-up inside a wall`);
  }
  if (s.rival) {
    const rSeen = new Set<number>();
    for (const p of s.rival) {
      const k = cellKey(p.x, p.y);
      check(!rSeen.has(k), `${label}: rival overlaps itself at ${p.x},${p.y}`);
      check(!s.walls.has(k), `${label}: rival inside a wall at ${p.x},${p.y}`);
      rSeen.add(k);
    }
  }
  check(tickInterval(s) > 0, `${label}: non-positive tick interval`);
}

const DIRS = ['up', 'down', 'left', 'right'] as const;

// 1. Long random-input soak on every mode, checking invariants every tick.
const modes: Mode[] = ['endless', 'timeAttack', 'maze', 'rival'];
for (const mode of modes) {
  let deaths = 0;
  let levelUps = 0;
  let maxScore = 0;
  let ticks = 0;

  for (let run = 0; run < 60; run++) {
    const s = createGame(mode, 1000 + run * 7717);
    for (let i = 0; i < 900; i++) {
      // Hammer the input queue: several turns per tick, including reversals.
      const presses = 1 + (i % 3);
      for (let p = 0; p < presses; p++) {
        queueDir(s, DIRS[Math.floor(Math.random() * 4)]);
      }
      step(s);
      ticks++;
      invariants(s, mode);
      if (s.status === 'over') { deaths++; break; }
      if (s.status === 'levelComplete') { levelUps++; advanceLevel(s); invariants(s, mode + ':new-level'); }
      maxScore = Math.max(maxScore, s.score);
    }
  }
  console.log(
    `${mode.padEnd(11)} ${String(ticks).padStart(6)} ticks  ${String(deaths).padStart(3)} deaths  ` +
    `${String(levelUps).padStart(3)} level-ups  best score ${maxScore}`,
  );
}

// 2. Reversal is impossible no matter how fast you press.
{
  const s = createGame('endless', 42);
  // Moving right; slam Up then Left inside a single tick.
  queueDir(s, 'up');
  queueDir(s, 'left');
  const before = s.snake.length;
  step(s);
  check(s.status === 'playing', 'reversal test: died on the first tick from a double-tap turn');
  check(s.dir === 'up', `reversal test: expected to commit 'up' first, got '${s.dir}'`);
  step(s);
  check(s.status === 'playing', 'reversal test: died on the second tick');
  check(s.dir === 'left', `reversal test: expected 'left' on tick two, got '${s.dir}'`);
  check(s.snake.length === before, 'reversal test: length changed unexpectedly');
}

// 3. A tight turn onto the cell the tail is vacating is legal.
{
  const s = createGame('endless', 7);
  // Grow to 5 so there is a real tail to chase.
  s.snake = [
    { x: 10, y: 10 }, { x: 9, y: 10 }, { x: 9, y: 11 }, { x: 10, y: 11 },
  ];
  s.dir = 'right';
  s.pendingGrowth = 0;
  s.food = [{ x: 2, y: 2 }];
  // Head at (10,10) moving down to (10,11), which is the current tail.
  queueDir(s, 'down');
  step(s);
  check(s.status === 'playing', 'tail-chase test: died turning onto the vacating tail cell');
}

// 4. Eating grows by exactly one and never leaves food on the body.
{
  const s = createGame('endless', 99);
  s.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  s.dir = 'right';
  s.food = [{ x: 11, y: 10 }];
  const before = s.snake.length;
  step(s);
  check(s.snake.length === before + 1, `eat test: length ${s.snake.length}, expected ${before + 1}`);
  check(s.apples === 1, 'eat test: apple not counted');
  check(s.score > 0, 'eat test: no score awarded');
  step(s);
  check(s.snake.length === before + 1, 'eat test: length changed again on the following tick');
}

// 5. Every maze level is well formed and its start is not inside a wall.
LEVELS.forEach((lvl, i) => {
  check(!lvl.walls.has(cellKey(lvl.start.x, lvl.start.y)), `level ${i} (${lvl.name}): start is inside a wall`);
  for (let b = 1; b < 3; b++) {
    check(
      !lvl.walls.has(cellKey(lvl.start.x - b, lvl.start.y)),
      `level ${i} (${lvl.name}): no room for the starting body`,
    );
  }
  for (const p of lvl.portals) {
    check(!lvl.walls.has(cellKey(p.a.x, p.a.y)), `level ${i}: portal A inside a wall`);
    check(!lvl.walls.has(cellKey(p.b.x, p.b.y)), `level ${i}: portal B inside a wall`);
  }
});
console.log(`levels      ${LEVELS.length} parsed: ${LEVELS.map((l) => l.name).join(', ')}`);

// 6. Speed actually ramps, and slow-mo actually slows.
{
  const s = createGame('endless', 5);
  const fresh = tickInterval(s);
  s.apples = 25;
  const fast = tickInterval(s);
  check(fast < fresh, `ramp test: interval did not drop (${fresh} -> ${fast})`);
  s.effects.push({ kind: 'slow', ticks: 30 });
  check(tickInterval(s) > fast, 'slow-mo test: interval did not increase');
}

// 7. Long runs driven by a competent player, so the late-game paths (hazard
//    spawning, power-up drops, portals, level clears) actually execute.
{
  const tally: Record<string, number> = {};
  const bump = (k: string) => { tally[k] = (tally[k] ?? 0) + 1; };

  for (const mode of modes) {
    let bestScore = 0;
    let bestApples = 0;
    let maxLevel = 0;
    let maxLength = 0;

    for (let run = 0; run < 12; run++) {
      const s = createGame(mode, 555 + run * 3331);
      for (let i = 0; i < 5000; i++) {
        const blocked = new Set<number>(s.walls);
        for (let b = 0; b < s.snake.length - 1; b++) {
          blocked.add(cellKey(s.snake[b].x, s.snake[b].y));
        }
        if (s.rival) for (const p of s.rival) blocked.add(cellKey(p.x, p.y));

        const goals = s.drops.length && i % 3 === 0
          ? s.drops.map((d) => d.pos)
          : s.food;
        const dir = chooseRivalDir(
          s.gridW, s.gridH, blocked, s.snake[0], s.dir, goals, s.snake.length,
        );
        if (dir) queueDir(s, dir);

        step(s);
        invariants(s, `${mode}:ai`);
        for (const ev of s.events) bump(ev.t);

        maxLength = Math.max(maxLength, s.snake.length);
        if (s.status === 'over') break;
        if (s.status === 'levelComplete') {
          maxLevel = Math.max(maxLevel, s.level + 1);
          advanceLevel(s);
          invariants(s, `${mode}:ai:new-level`);
        }
        bestScore = Math.max(bestScore, s.score);
        bestApples = Math.max(bestApples, s.apples);
      }
    }

    console.log(
      `${mode.padEnd(11)} AI: best score ${String(bestScore).padStart(6)}  ` +
      `apples ${String(bestApples).padStart(4)}  longest ${String(maxLength).padStart(4)}` +
      (mode === 'maze' ? `  levels cleared up to ${maxLevel}` : ''),
    );
  }

  console.log('events fired:', JSON.stringify(tally));
  check((tally.eat ?? 0) > 500, 'AI soak: barely any apples eaten, the brain is not working');
  check((tally.power ?? 0) > 0, 'AI soak: no power-up was ever collected');
  check((tally.hazard ?? 0) > 0, 'AI soak: hazards never spawned in Endless');
  check((tally.portal ?? 0) > 0, 'AI soak: portals were never used');
  check((tally.levelUp ?? 0) > 0, 'AI soak: no maze level was ever cleared');
  check((tally.rivalDown ?? 0) > 0, 'AI soak: the rival never went down');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
