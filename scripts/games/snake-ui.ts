import { buttonWith, click, frames, press, settle, text } from '../domsetup';
import { check, section, until } from '../harness';

/**
 * Snake's deep flow: get from its mode select into a running game, steer it,
 * pause it, die, restart, and come back.
 *
 * The generic pass in ui-smoke already proved snake mounts and can be left.
 * This proves it is actually playable, which no amount of engine testing shows.
 */
export async function snakeDeepChecks(): Promise<void> {
  section('snake: mode select');
  check(text().includes('SNAKE'), 'title renders');
  for (const label of ['Endless', 'Time Attack', 'Maze', 'Rival']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('snake: starting Endless');
  click(buttonWith('Endless'));
  await settle();

  const canvas = document.querySelector('canvas');
  check(canvas !== null, 'canvas mounts after clicking a mode');
  check(!text().includes('SNAKE'), 'mode select is gone');

  await frames(4);
  check(text().includes('Score'), 'HUD renders');
  check(
    canvas !== null && (canvas as HTMLCanvasElement).width > 0,
    'canvas got a backing size',
  );

  section('snake: playing');
  // Enough frames to cross several ticks at ~132ms each.
  await frames(30, 20);
  check(!text().includes('Game Over'), 'still alive after a few ticks');

  press('ArrowDown');
  await frames(20, 20);
  check(!text().includes('Game Over'), 'steering down does not kill you');

  section('snake: pause');
  press(' ', 'Space');
  await settle();
  check(text().includes('Paused'), 'Space pauses');
  const before = (document.querySelector('canvas') as HTMLCanvasElement).width;
  await frames(30, 20);
  check(text().includes('Paused'), 'still paused after frames pass');
  check(
    (document.querySelector('canvas') as HTMLCanvasElement).width === before,
    'canvas untouched while paused',
  );

  press(' ', 'Space');
  await settle();
  check(!text().includes('Paused'), 'Space resumes');

  section('snake: death and restart');
  // Left unsteered the snake runs into a wall. 24 cells at ~132ms is plenty.
  await frames(400, 20);
  check(text().includes('Game Over'), 'running into a wall ends the run');
  check(
    text().includes('hit a wall') || text().includes('ate yourself'),
    'a cause of death is shown',
  );

  click(buttonWith('Again'));
  await settle();
  await frames(4);
  check(!text().includes('Game Over'), 'Again restarts the run');
  check(text().includes('Score'), 'HUD is back after restart');

  section('snake: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('SNAKE'), 'the HUD home button returns to the mode select');
  check(document.querySelector('canvas') === null, 'canvas unmounts on quit');

  section('snake: other modes start');
  for (const label of ['Time Attack', 'Maze', 'Rival']) {
    click(buttonWith(label));
    await settle();
    await frames(6);
    check(document.querySelector('canvas') !== null, `${label} starts and mounts a canvas`);
    check(text().includes('Score'), `${label} shows a HUD`);
    click(buttonWith('back to menu'));
    await settle();
    check(text().includes('SNAKE'), `${label} returns to the mode select`);
  }

  // Leave the app on the mode select, ready to be returned to the hub.
  await until(() => text().includes('SNAKE'), 'snake mode select');
}
