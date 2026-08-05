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
 * Frogger's deep flow.
 *
 * Every assertion about position is made immediately after a keypress, before
 * any frames are allowed to run. The lanes move continuously, so a check taken
 * a few frames later would be asserting about traffic rather than about the
 * hop, and would be the kind of test that fails on a Tuesday.
 */
export async function froggerDeepChecks(): Promise<void> {
  section('frogger: mode select');
  check(text().includes('FROGGER'), 'title renders');
  for (const label of ['Classic', 'Rush', 'Gentle']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('frogger: starting Gentle');
  click(buttonWith('Gentle'));
  await settle();

  check(document.querySelector('canvas') !== null, 'canvas mounts after choosing a mode');
  await until(() => attr('data-status') !== '', 'the board to report a status');
  check(attr('data-status') === 'ready', 'a life opens on its banner, not mid-traffic');
  check(num('data-lives') === 5, 'Gentle starts with five lives');
  check(num('data-level') === 1, 'and on level one');
  check(num('data-homes') === 0, 'with no bays filled');

  const start = num('data-row');
  check(start === 13, 'the frog starts on the near bank');

  section('frogger: the banner gives way');
  // Enter rather than a click. The button was always wired; the keyboard was
  // not, which is exactly how Sokoban shipped unable to advance a level.
  check(buttonWith('Hop to it') !== null, 'the banner offers a way on');
  press('Enter');
  await settle();
  check(attr('data-status') === 'playing', 'Enter starts the crossing');

  section('frogger: hopping');
  // Backwards first, from the bottom row, so the bounds check runs before any
  // traffic has had a chance to move.
  tap('ArrowDown');
  await settle();
  check(num('data-row') === start, 'the near bank is the bottom of the board');

  tap('ArrowUp');
  await settle();
  check(num('data-row') === start - 1, 'up moves one row toward the river');
  check(num('data-lives') === 5, 'and the opening hop is not into traffic');

  section('frogger: the world keeps moving');
  await frames(30, 16);
  check(
    ['playing', 'ready', 'levelComplete'].includes(attr('data-status')),
    'the run is still going after half a second of real frames',
  );

  section('frogger: pause');
  press('p');
  await settle();
  check(attr('data-status') === 'paused', 'P pauses');
  check(text().includes('Paused'), 'and says so');
  press('p');
  await settle();
  check(attr('data-status') !== 'paused', 'and P again resumes');

  section('frogger: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('FROGGER'), 'the home button returns to the menu');
  check(document.querySelector('canvas') === null, 'the board unmounts on quit');
}
