import { buttonWith, click, frames, press, settle, tap, text } from '../domsetup';
import { check, section, until } from '../harness';

function board(): Element | null {
  return document.querySelector('[data-status]');
}

function attr(name: string): string {
  return board()?.getAttribute(name) ?? '';
}

function num(name: string): number {
  return Number(attr(name) || -1);
}

/**
 * The maze chase's deep flow.
 *
 * The one behaviour of the four-actor system that is visible from outside is
 * the ghost mode, so the flow worth driving is: steer, eat, and confirm the
 * board is actually being cleared. Nothing here asserts on a ghost's position;
 * those are floats mid-corridor and they belong to the renderer.
 */
export async function mazechaseDeepChecks(): Promise<void> {
  section('mazechase: mode select');
  check(text().includes('MAZE CHASE'), 'title renders');
  for (const label of ['Classic', 'Rush', 'Gentle']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('mazechase: starting Gentle');
  click(buttonWith('Gentle'));
  await settle();

  check(document.querySelector('canvas') !== null, 'canvas mounts after choosing a mode');
  await until(() => attr('data-status') !== '', 'the board to report a status');
  check(attr('data-status') === 'ready', 'the level opens on its banner');
  check(num('data-level') === 1, 'on level one');
  check(num('data-lives') === 5, 'Gentle starts with five lives');
  check(attr('data-mode') === 'scatter', 'and the ghosts open on scatter, not on a chase');

  const dots = num('data-dots');
  check(dots > 200, 'the maze starts full of dots');

  section('mazechase: the banner gives way');
  // Enter rather than a click. The button was always wired; the keyboard was
  // not, which is exactly how Sokoban shipped unable to advance a level.
  check(buttonWith('Go') !== null, 'the banner offers a way on');
  press('Enter');
  await settle();
  check(attr('data-status') === 'playing', 'Enter starts the level');

  section('mazechase: eating');
  tap('ArrowLeft');
  await frames(40, 16);
  check(num('data-dots') < dots, 'moving along a corridor eats the dots in it');

  section('mazechase: steering');
  const eaten = num('data-dots');
  tap('ArrowRight');
  await frames(40, 16);
  check(
    num('data-dots') <= eaten,
    'turning back does not put dots back on the board',
  );
  check(
    ['playing', 'dying', 'ready'].includes(attr('data-status')),
    'and the run is still going',
  );

  section('mazechase: pause');
  press('p');
  await settle();
  check(attr('data-status') === 'paused', 'P pauses');
  check(text().includes('Paused'), 'and says so');
  press('p');
  await settle();
  check(attr('data-status') !== 'paused', 'and P again resumes');

  section('mazechase: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('MAZE CHASE'), 'the home button returns to the menu');
  check(document.querySelector('canvas') === null, 'the board unmounts on quit');
}
