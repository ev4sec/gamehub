import { buttonWith, click, frames, press, release, settle, text } from '../domsetup';
import { check, section, until } from '../harness';

function field(): Element | null {
  return document.querySelector('[data-status]');
}

function attr(name: string): string {
  return field()?.getAttribute(name) ?? '';
}

function num(name: string): number {
  return Number(attr(name) || -1);
}

/**
 * Asteroids' deep flow.
 *
 * The shot is the assertion worth making: firing, then waiting past the bullet's
 * life, exercises the loop, the ref the simulation lives in, the HUD signature
 * and the unmount in one gesture. Nothing here asserts on the ship's heading;
 * that is a float and it belongs to the renderer.
 */
export async function asteroidsDeepChecks(): Promise<void> {
  section('asteroids: mode select');
  check(text().includes('ASTEROIDS'), 'title renders');
  for (const label of ['Classic', 'Storm', 'One Ship']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('asteroids: starting Classic');
  click(buttonWith('Classic'));
  await settle();

  check(document.querySelector('canvas') !== null, 'canvas mounts after choosing a mode');
  await until(() => attr('data-status') !== '', 'the field to report a status');
  check(attr('data-status') === 'ready', 'the wave opens on its banner');
  check(num('data-wave') === 1, 'on wave one');
  check(num('data-lives') === 3, 'with three ships');
  check(num('data-rocks') === 4, 'and four large rocks');

  section('asteroids: the banner gives way');
  // Enter rather than a click. The button was always wired; the keyboard was
  // not, which is exactly how Sokoban shipped unable to advance a level.
  check(buttonWith('Launch') !== null, 'the banner offers a way on');
  press('Enter');
  await settle();
  check(attr('data-status') === 'playing', 'Enter starts the wave');
  check(num('data-bullets') === 0, 'nothing has been fired yet');

  section('asteroids: firing');
  press('Space');
  release('Space');
  await settle();
  check(num('data-bullets') === 1, 'one press puts one bullet in the air');

  // Past the bullet's lifetime. It either expires or hits something; either way
  // it must leave, and a bullet that never leaves is a leak the HUD can see.
  await frames(80, 16);
  check(num('data-bullets') === 0, 'and the bullet is gone again a second later');

  section('asteroids: the field keeps running');
  check(
    ['playing', 'respawning'].includes(attr('data-status')),
    'the run is still going after real frames',
  );
  check(num('data-rocks') > 0, 'and there are still rocks to shoot');

  section('asteroids: pause');
  press('p');
  await settle();
  check(attr('data-status') === 'paused', 'P pauses');
  check(text().includes('Paused'), 'and says so');
  press('p');
  await settle();
  check(attr('data-status') !== 'paused', 'and P again resumes');

  section('asteroids: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('ASTEROIDS'), 'the home button returns to the menu');
  check(document.querySelector('canvas') === null, 'the field unmounts on quit');
}
