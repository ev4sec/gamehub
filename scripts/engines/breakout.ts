/**
 * Breakout engine invariants.
 *
 * This is the first game in the hub with continuous positions rather than a
 * grid, so the failure modes are different in kind: a ball can leave the field,
 * pass straight through a brick, or settle into an angle so flat that the run
 * never ends. Each of those has its own check below, and the tunnelling one is
 * built deliberately rather than hoped for, because it only ever shows up at
 * speeds an ordinary soak does not reach.
 */
import {
  advanceLevel,
  createGame,
  hudOf,
  launch,
  setHeld,
  setPointer,
  step,
  togglePause,
} from '../../src/games/breakout/engine/engine';
import {
  BALL_R,
  BASE_SPEED,
  BRICK_H,
  BRICK_W,
  FIELD_H,
  FIELD_W,
  MAX_SPEED,
  MIN_VY_RATIO,
  MODES,
  PADDLE_Y,
  speedOf,
} from '../../src/games/breakout/engine/constants';
import { LEVELS } from '../../src/games/breakout/engine/levels';
import type { Brick, GameState } from '../../src/games/breakout/engine/types';
import { expect } from '../checks';

function invariants(s: GameState, label: string): void {
  for (const b of s.balls) {
    expect(
      Number.isFinite(b.x) && Number.isFinite(b.y),
      `${label}: ball position is not a number (${b.x}, ${b.y})`,
    );
    expect(
      Number.isFinite(b.vx) && Number.isFinite(b.vy),
      `${label}: ball velocity is not a number (${b.vx}, ${b.vy})`,
    );
    expect(b.x >= -1 && b.x <= FIELD_W + 1, `${label}: ball escaped sideways at x=${b.x}`);
    expect(b.y >= -1, `${label}: ball escaped through the ceiling at y=${b.y}`);
    expect(
      b.y - b.r <= FIELD_H + 1,
      `${label}: a ball below the floor survived the tick at y=${b.y}`,
    );

    if (b.stuckOffset === null && s.status === 'playing') {
      const speed = speedOf(b.vx, b.vy);
      expect(speed > 0, `${label}: a live ball has no speed`);
      expect(speed <= MAX_SPEED + 1, `${label}: ball speed ${speed} is over the cap`);
      expect(
        Math.abs(b.vy) >= speed * MIN_VY_RATIO - 1e-6,
        `${label}: ball angle is too flat, vy=${b.vy} against speed ${speed}`,
      );
    }
  }

  expect(s.lives >= 0, `${label}: lives went negative`);
  expect(s.score >= 0, `${label}: score went negative`);
  expect(s.paddle.x >= 0 && s.paddle.x <= FIELD_W, `${label}: paddle left the field`);
}

/**
 * Steers the paddle at whichever ball is lowest, but deliberately off centre.
 *
 * A tracker that centres the ball perfectly returns it straight up every time,
 * so the ball drills one column of bricks and then rallies vertically against
 * the ceiling forever. It never dies and it never clears, which reads as an
 * engine that cannot finish a level. The wobble stays well inside half the
 * paddle so the ball is still always caught, it just leaves at an angle.
 */
function trackBalls(s: GameState, tick = 0): void {
  let target = FIELD_W / 2;
  let lowest = -Infinity;
  for (const b of s.balls) {
    if (b.y > lowest) {
      lowest = b.y;
      target = b.x + b.vx * 0.12;
    }
  }
  const wobble = Math.sin(tick * 0.037) * (s.paddle.w / 2) * 0.8;
  setPointer(s, target - wobble);
}

function makeBrick(id: number, x: number, y: number): Brick {
  return {
    id,
    x,
    y,
    w: BRICK_W,
    h: BRICK_H,
    hp: 1,
    maxHp: 1,
    points: 50,
    solid: false,
    color: '#38bdf8',
  };
}

export function breakoutEngineChecks(): void {
  // 1. A competent player soak. A random paddle loses instantly, so this is
  //    the only way the brick, drop and level code runs at all.
  for (const mode of MODES) {
    let ticks = 0;
    let levels = 0;
    let bestScore = 0;
    let overs = 0;
    const tally: Record<string, number> = {};

    for (let run = 0; run < 6; run++) {
      const s = createGame(mode, 2024 + run * 5153);

      for (let i = 0; i < 24_000; i++) {
        trackBalls(s, i);
        if (s.status === 'ready') launch(s);
        step(s);
        ticks++;
        invariants(s, `${mode}:ai`);

        for (const ev of s.events) tally[ev.t] = (tally[ev.t] ?? 0) + 1;

        if (s.status === 'levelComplete') {
          levels++;
          advanceLevel(s);
          invariants(s, `${mode}:ai:new-level`);
        }
        bestScore = Math.max(bestScore, s.score);
        if (s.status === 'over' || s.status === 'cleared') {
          if (s.status === 'over') overs++;
          break;
        }
      }
    }

    console.log(
      `${mode.padEnd(8)} ${String(ticks).padStart(7)} ticks  ${String(levels).padStart(3)} levels  ` +
        `${String(overs).padStart(2)} lost  best score ${bestScore}`,
    );
    expect(levels > 0, `${mode}: never finished a single level`);
  }

  // 1b. The same, but with the keyboard rather than a pointer, so that path is
  //     not left to the UI suite alone.
  {
    const s = createGame('classic', 77);
    let moved = false;
    for (let i = 0; i < 600; i++) {
      setHeld(s, 'right', i % 120 < 60);
      setHeld(s, 'left', i % 120 >= 60);
      if (s.status === 'ready') launch(s);
      step(s);
      invariants(s, 'keys');
      if (Math.abs(s.paddle.x - FIELD_W / 2) > 20) moved = true;
    }
    expect(moved, 'keyboard: holding a direction never moved the paddle');
  }

  // 2. Tunnelling. A ball fast enough to clear a brick inside one tick must
  //    still hit it. This is the check the substepping exists for, and it fails
  //    loudly against the naive "move the whole frame, then test" approach.
  {
    const s = createGame('classic', 3);
    s.status = 'playing';
    const brick = makeBrick(9001, 300, 300);
    s.bricks = [brick];
    s.balls = [
      {
        id: 9002,
        x: brick.x + brick.w / 2,
        y: brick.y - 12,
        vx: 0,
        vy: 3000,
        r: BALL_R,
        stuckOffset: null,
      },
    ];

    const travel = 3000 * (16 / 1000);
    expect(
      travel > brick.h + 12,
      `tunnelling setup: the ball only travels ${travel}, which would not clear the brick`,
    );

    step(s);
    expect(
      s.bricks.length === 0,
      'tunnelling: a ball moving faster than a brick is thick passed straight through it',
    );
    expect(
      s.events.some((e) => e.t === 'brick'),
      'tunnelling: no brick collision was reported',
    );
  }

  // 3. The paddle aims. Where the ball lands on it decides where it goes.
  {
    const cases: { name: string; offset: number; expect: (vx: number) => boolean }[] = [
      { name: 'left edge', offset: -0.9, expect: (vx) => vx < -20 },
      { name: 'centre', offset: 0, expect: (vx) => Math.abs(vx) < 20 },
      { name: 'right edge', offset: 0.9, expect: (vx) => vx > 20 },
    ];

    for (const item of cases) {
      const s = createGame('classic', 4);
      s.status = 'playing';
      s.bricks = [];
      const half = s.paddle.w / 2;
      s.balls = [
        {
          id: 1,
          x: s.paddle.x + item.offset * half,
          y: PADDLE_Y - BALL_R - 1,
          vx: 0,
          vy: BASE_SPEED,
          r: BALL_R,
          stuckOffset: null,
        },
      ];
      setPointer(s, s.paddle.x);
      step(s);

      const ball = s.balls[0];
      expect(ball !== undefined, `paddle ${item.name}: the ball was lost`);
      if (!ball) continue;
      expect(ball.vy < 0, `paddle ${item.name}: the ball was not sent back up`);
      expect(
        item.expect(ball.vx),
        `paddle ${item.name}: deflected to vx=${ball.vx.toFixed(1)}`,
      );
    }
  }

  // 4. Losing the last ball costs a life, and the last life ends the run.
  {
    const s = createGame('classic', 5);
    s.status = 'playing';
    const lives = s.lives;
    // Below the floor line already: at ordinary speed a ball starting level
    // with the floor takes several ticks to fully clear it.
    s.balls = [
      { id: 1, x: 400, y: FIELD_H + BALL_R + 2, vx: 0, vy: BASE_SPEED, r: BALL_R, stuckOffset: null },
    ];
    step(s);
    expect(s.lives === lives - 1, `life loss: lives went ${lives} to ${s.lives}`);
    expect(s.status === 'ready', `life loss: status is '${s.status}', expected 'ready'`);
    expect(s.balls.length === 1, 'life loss: no fresh ball was served');
    expect(s.balls[0].stuckOffset !== null, 'life loss: the fresh ball was not on the paddle');
    expect(
      s.events.some((e) => e.t === 'lifeLost'),
      'life loss: no lifeLost event',
    );
  }

  {
    const s = createGame('sudden', 6);
    expect(s.lives === 1, `sudden: started with ${s.lives} lives`);
    s.status = 'playing';
    s.balls = [
      { id: 1, x: 400, y: FIELD_H + BALL_R + 2, vx: 0, vy: BASE_SPEED, r: BALL_R, stuckOffset: null },
    ];
    step(s);
    expect(s.status === 'over', `sudden: status is '${s.status}' after the only ball was lost`);
  }

  // 5. Solid blocks never break and never hold a level open.
  {
    const s = createGame('classic', 7);
    s.status = 'playing';
    const solid: Brick = {
      id: 1,
      x: 300,
      y: 300,
      w: BRICK_W,
      h: BRICK_H,
      hp: Infinity,
      maxHp: Infinity,
      points: 0,
      solid: true,
      color: '#64748b',
    };
    s.bricks = [solid, makeBrick(2, 300, 400)];
    s.balls = [
      { id: 3, x: 336, y: 380, vx: 0, vy: BASE_SPEED, r: BALL_R, stuckOffset: null },
    ];

    let guard = 0;
    while (s.status === 'playing' && guard < 400) {
      trackBalls(s, guard);
      step(s);
      guard++;
    }
    expect(
      s.status === 'levelComplete',
      `solids: status is '${s.status}' with only an indestructible block left`,
    );
    expect(s.bricks.length === 1, `solids: ${s.bricks.length} bricks remain, expected the solid`);
    expect(s.bricks[0].solid, 'solids: the wrong brick survived');
  }

  // 6. Levels advance, and the authored modes run out and report a win.
  {
    const s = createGame('classic', 8);
    for (let level = 0; level < LEVELS.length; level++) {
      expect(s.bricks.length > 0, `levels: level ${level} was built empty`);
      s.status = 'levelComplete';
      advanceLevel(s);
    }
    expect(s.status === 'cleared', `levels: status is '${s.status}' after the last level`);
  }

  {
    const s = createGame('endless', 9);
    for (let i = 0; i < 30; i++) {
      expect(
        s.bricks.some((b) => !b.solid),
        `endless: wave ${i} had no breakable brick and could never be cleared`,
      );
      s.status = 'levelComplete';
      advanceLevel(s);
      expect(s.status === 'ready', `endless: wave ${i + 1} did not start`);
    }
  }

  // 7. Power-ups reach the paddle and do what they say.
  {
    const widen = createGame('classic', 10);
    widen.status = 'playing';
    const before = widen.paddle.w;
    widen.drops = [{ id: 1, kind: 'wide', x: widen.paddle.x, y: PADDLE_Y - 2 }];
    step(widen);
    expect(widen.paddle.w > before, `power wide: paddle stayed ${widen.paddle.w}`);

    const extra = createGame('classic', 11);
    extra.status = 'playing';
    const lives = extra.lives;
    extra.drops = [{ id: 1, kind: 'extra', x: extra.paddle.x, y: PADDLE_Y - 2 }];
    step(extra);
    expect(extra.lives === lives + 1, `power extra: lives went ${lives} to ${extra.lives}`);

    const multi = createGame('classic', 12);
    multi.status = 'playing';
    launch(multi);
    const balls = multi.balls.length;
    multi.drops = [{ id: 1, kind: 'multi', x: multi.paddle.x, y: PADDLE_Y - 2 }];
    step(multi);
    expect(multi.balls.length > balls, `power multi: ball count stayed at ${multi.balls.length}`);
    for (const b of multi.balls) {
      const speed = speedOf(b.vx, b.vy);
      expect(
        Math.abs(b.vy) >= speed * MIN_VY_RATIO - 1e-6,
        'power multi: a spawned ball came out travelling too flat',
      );
    }
  }

  // 8. Pausing freezes everything and resumes to the state it interrupted.
  {
    const s = createGame('classic', 13);
    launch(s);
    for (let i = 0; i < 10; i++) step(s);

    togglePause(s);
    expect(s.status === 'paused', 'pause: did not pause');
    const frozen = JSON.stringify(s.balls);
    const clock = s.elapsedMs;
    for (let i = 0; i < 120; i++) step(s);
    expect(JSON.stringify(s.balls) === frozen, 'pause: the ball moved while paused');
    expect(s.elapsedMs === clock, 'pause: the clock ran while paused');

    togglePause(s);
    expect(s.status === 'playing', `pause: resumed into '${s.status}'`);
  }

  // 9. Same seed, same inputs, same game. Without this a failing soak cannot
  //    be replayed from its seed and the invariants above are unchaseable.
  {
    const runOnce = (): string => {
      const s = createGame('endless', 4242);
      for (let i = 0; i < 3000; i++) {
        trackBalls(s, i);
        if (s.status === 'ready') launch(s);
        step(s);
        if (s.status === 'levelComplete') advanceLevel(s);
        if (s.status === 'over' || s.status === 'cleared') break;
      }
      return `${s.score}|${s.level}|${s.lives}|${s.bricks.length}|${s.balls.length}`;
    };
    expect(runOnce() === runOnce(), 'determinism: the same seed produced two different runs');
  }

  // 10. The HUD view matches the state it is built from.
  {
    const s = createGame('classic', 14);
    const hud = hudOf(s);
    expect(hud.lives === 3, `hud: classic started with ${hud.lives} lives`);
    expect(hud.balls === 1, `hud: ${hud.balls} balls on the paddle`);
    expect(hud.bricksLeft > 0, 'hud: the opening level reported no bricks');
    expect(hud.effects.length === 0, 'hud: a fresh run already had a power-up running');
  }
}
