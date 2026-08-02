import { buttonWith, click, frames, press, release, settle, tap, text } from '../domsetup';
import { check, section, until } from '../harness';

/** Pieces are drawn as role="img" grids, one per next slot plus one if held. */
function pieceViews(): number {
  return document.querySelectorAll('[role="img"]').length;
}

async function backToMenu(): Promise<void> {
  click(buttonWith('back to menu'));
  await settle();
}

/**
 * Tetris's deep flow: start a mode, confirm the well is live, use hold, pause,
 * stack until the well tops out, restart, and visit the other two modes.
 *
 * The generic pass in ui-smoke already proved tetris mounts and can be left.
 * What it cannot show is that the keyboard reaches the engine at all, which is
 * the wiring that has broken before.
 */
export async function tetrisDeepChecks(): Promise<void> {
  section('tetris: mode select');
  check(text().includes('TETRIS'), 'title renders');
  for (const label of ['Marathon', 'Sprint', 'Ultra']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('tetris: starting Marathon');
  click(buttonWith('Marathon'));
  await settle();

  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  check(canvas !== null, 'canvas mounts after clicking a mode');
  check(!text().includes('TETRIS'), 'mode select is gone');

  await frames(4);
  check(text().includes('Score'), 'HUD renders');
  check(canvas !== null && canvas.width > 0, 'canvas got a backing size');
  check(text().includes('Hold'), 'the hold slot is labelled');
  check(text().includes('Next'), 'the next queue is labelled');
  check(pieceViews() === 3, `three next pieces are previewed, saw ${pieceViews()}`);

  section('tetris: playing');
  await frames(30, 16);
  check(!text().includes('Game Over'), 'still alive after a few ticks');

  // Held keys latch until released, which is why these are taps.
  tap('ArrowLeft');
  tap('ArrowRight');
  await frames(6, 16);
  check(!text().includes('Game Over'), 'steering does not end the run');

  tap('ArrowUp');
  await frames(4, 16);
  check(!text().includes('Game Over'), 'rotating does not end the run');

  section('tetris: hold');
  tap('c');
  await frames(4, 16);
  check(pieceViews() === 4, `holding a piece fills the hold slot, saw ${pieceViews()}`);

  section('tetris: soft drop is a held key');
  press('ArrowDown');
  await frames(20, 16);
  release('ArrowDown');
  await frames(2, 16);
  check(!text().includes('Game Over'), 'soft dropping does not end the run');

  section('tetris: pause');
  tap('p');
  await settle();
  check(text().includes('Paused'), 'P pauses');
  await frames(40, 16);
  check(text().includes('Paused'), 'still paused after frames pass');
  tap('p');
  await settle();
  check(!text().includes('Paused'), 'P resumes');

  section('tetris: topping out');
  // Hard drop without steering: the stack piles up in the middle and the well
  // fills. 80 attempts is far more than the ~20 pieces this actually needs.
  let dropped = 0;
  for (let i = 0; i < 80 && !text().includes('Game Over'); i++) {
    tap(' ', 'Space');
    await frames(2, 16);
    dropped++;
  }
  check(text().includes('Game Over'), `the well tops out (after ${dropped} hard drops)`);
  check(text().includes('Score'), 'the final score is shown');

  click(buttonWith('Again'));
  await settle();
  await frames(4, 16);
  check(!text().includes('Game Over'), 'Again restarts the run');
  check(pieceViews() === 3, 'the hold slot is empty again on a fresh run');

  section('tetris: back to the mode select');
  await backToMenu();
  check(text().includes('TETRIS'), 'the HUD home button returns to the mode select');
  check(document.querySelector('canvas') === null, 'canvas unmounts on quit');

  section('tetris: other modes start');
  click(buttonWith('Sprint'));
  await settle();
  await frames(6, 16);
  check(document.querySelector('canvas') !== null, 'Sprint starts and mounts a canvas');
  check(text().includes('/40'), 'Sprint shows its forty-line goal');
  await backToMenu();
  check(text().includes('TETRIS'), 'Sprint returns to the mode select');

  click(buttonWith('Ultra'));
  await settle();
  await frames(6, 16);
  check(document.querySelector('canvas') !== null, 'Ultra starts and mounts a canvas');
  check(text().includes('Time'), 'Ultra shows a clock');
  await backToMenu();
  check(text().includes('TETRIS'), 'Ultra returns to the mode select');

  // Leave the app on the mode select, ready to be returned to the hub.
  await until(() => text().includes('TETRIS'), 'tetris mode select');
}
