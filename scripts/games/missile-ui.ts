import { buttonWith, click, frames, pointerDown, press, settle, text } from '../domsetup';
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
 * Missile Command's deep flow.
 *
 * This is the only game in the hub whose entire input is an absolute point, so
 * the one thing worth driving here is a pointer press on the field: it proves
 * the click-to-world path, the battery choice and the ammo ledger in a single
 * gesture. jsdom reports a zero bounding rect, so the tap resolves to the
 * middle of the field, which is exactly the fallback the renderer promises.
 */
export async function missileDeepChecks(): Promise<void> {
  section('missile: mode select');
  check(text().includes('MISSILE COMMAND'), 'title renders');
  for (const label of ['Classic', 'Blitz', 'Survival']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('missile: starting Classic');
  click(buttonWith('Classic'));
  await settle();

  check(document.querySelector('canvas') !== null, 'canvas mounts after choosing a mode');
  await until(() => attr('data-status') !== '', 'the field to report a status');
  check(attr('data-status') === 'ready', 'the wave opens on its banner, not mid-air');
  check(num('data-wave') === 1, 'it opens on wave one');
  check(num('data-cities') === 6, 'six cities are standing');

  const armed = num('data-ammo');
  check(armed === 30, 'three batteries hold ten missiles each');

  section('missile: the banner gives way');
  click(buttonWith('Begin'));
  await settle();
  check(attr('data-status') === 'playing', 'Begin starts the wave immediately');

  section('missile: firing costs a missile');
  pointerDown(field()!, 0, 0);
  await settle();
  check(num('data-ammo') === armed - 1, 'one tap spends exactly one missile');

  pointerDown(field()!, 0, 0);
  pointerDown(field()!, 0, 0);
  await settle();
  check(num('data-ammo') === armed - 3, 'three taps spend three, so nothing is swallowed');

  section('missile: the wave arrives');
  const queued = num('data-incoming');
  check(queued > 0, 'the wave has something in it');
  await frames(40, 16);
  check(
    attr('data-status') === 'playing' || attr('data-status') === 'waveComplete',
    'the run is still going after a second of real frames',
  );

  section('missile: pause');
  press('p');
  await settle();
  check(attr('data-status') === 'paused', 'P pauses');
  check(text().includes('Paused'), 'and says so');
  press('p');
  await settle();
  check(attr('data-status') !== 'paused', 'and P again resumes');

  section('missile: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('MISSILE COMMAND'), 'the home button returns to the menu');
  check(document.querySelector('canvas') === null, 'the field unmounts on quit');
}
