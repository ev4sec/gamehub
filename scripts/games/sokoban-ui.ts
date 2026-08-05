import { buttonWith, click, press, settle, text } from '../domsetup';
import { check, section, until } from '../harness';

function field(): Element | null {
  return document.querySelector('[data-status]');
}

function attr(name: string): number {
  return Number(field()?.getAttribute(name) ?? -1);
}

function status(): string {
  return field()?.getAttribute('data-status') ?? '';
}

function count(selector: string): number {
  return document.querySelectorAll(selector).length;
}

async function walk(key: string): Promise<void> {
  press(key);
  await settle();
}

/**
 * Sokoban's deep flow.
 *
 * The first level is one push wide on purpose, so this can drive a level from
 * its opening position to solved with a single keystroke and check the whole
 * chain: the move rules, the solved detection, the overlay, and the jump to the
 * next level.
 */
export async function sokobanDeepChecks(): Promise<void> {
  section('sokoban: level select');
  check(text().includes('SOKOBAN'), 'title renders');
  check(text().includes('First push'), 'the first level is listed');
  check(text().includes('Tight quarters'), 'the last level is listed');
  check(count('[data-player]') === 0, 'no board before a level is chosen');

  section('sokoban: opening the first level');
  click(buttonWith('First push'));
  await settle();

  check(status() === 'playing', `the level opened, status is '${status()}'`);
  check(attr('data-level') === 0, `opened level index ${attr('data-level')}`);
  check(attr('data-moves') === 0, 'a fresh level has no moves played');
  check(count('[data-player]') === 1, `exactly one player, saw ${count('[data-player]')}`);
  check(count('[data-box]') === 1, `exactly one box, saw ${count('[data-box]')}`);
  check(count('[data-goal]') === 1, `exactly one goal, saw ${count('[data-goal]')}`);
  check(count('[data-box="home"]') === 0, 'the box does not start on its goal');

  section('sokoban: walking into a wall');
  await walk('ArrowUp');
  check(attr('data-moves') === 0, `the wall refused the move, counter is ${attr('data-moves')}`);

  section('sokoban: the push that solves it');
  await walk('ArrowRight');
  check(attr('data-moves') === 1, `one move recorded, saw ${attr('data-moves')}`);
  check(attr('data-pushes') === 1, `one push recorded, saw ${attr('data-pushes')}`);
  check(count('[data-box="home"]') === 1, 'the box landed on its goal');
  check(status() === 'solved', `the level registered as solved, status is '${status()}'`);
  check(text().includes('Solved'), 'the solved sheet is shown');

  section('sokoban: undo unwinds a solved board');
  click(buttonWith('Undo the last move'));
  await settle();
  check(attr('data-moves') === 0, `undo took the push back, counter is ${attr('data-moves')}`);
  check(attr('data-pushes') === 0, `push counter came back to ${attr('data-pushes')}`);
  check(status() === 'playing', `the level is playable again, status is '${status()}'`);
  check(count('[data-box="home"]') === 0, 'the box came off its goal');
  check(!text().includes('Solved'), 'the solved sheet is gone');

  section('sokoban: the arrows move the selection on the solved sheet');
  await walk('ArrowRight');
  check(status() === 'solved', 're-solved the level');
  check(buttonWith('Next level') !== null, 'the solved sheet offers a way on');

  // The reported bug, driven exactly as it was hit: solve, then reach for the
  // arrows to pick a different action. They used to fall straight through to
  // the board's own handler and the selection never moved off the primary.
  press('ArrowRight');
  await settle();
  check(
    (document.activeElement?.textContent ?? '').includes('Again'),
    `right moved the selection to '${document.activeElement?.textContent}'`,
  );

  press('ArrowLeft');
  await settle();
  check(
    (document.activeElement?.textContent ?? '').includes('Next level'),
    'left moved it back to the primary action',
  );

  section('sokoban: Enter takes the selected action, not always the first');
  press('ArrowRight');
  await settle();
  press('Enter');
  await settle();
  check(attr('data-level') === 0, 'choosing Again replayed the level rather than advancing');
  check(status() === 'playing', 'and the board is playable again');
  check(attr('data-moves') === 0, 'from a clean counter');

  section('sokoban: on to the next level');
  await walk('ArrowRight');
  check(status() === 'solved', 'solved it once more');
  press('Enter');
  await settle();
  check(attr('data-level') === 1, `Enter moved to level index ${attr('data-level')}`);
  check(status() === 'playing', 'the next level is playable');
  check(attr('data-moves') === 0, 'the next level starts with a clean counter');
  check(text().includes('Round the back'), 'the next level is named');

  section('sokoban: restart');
  await walk('ArrowUp');
  await walk('ArrowUp');
  check(attr('data-moves') > 0, 'some moves were played before restarting');
  click(buttonWith('Restart the level'));
  await settle();
  check(attr('data-moves') === 0, `restart reset the counter, saw ${attr('data-moves')}`);
  check(attr('data-level') === 1, 'restart stayed on the same level');

  section('sokoban: the keyboard shortcuts agree with the buttons');
  await walk('ArrowUp');
  const played = attr('data-moves');
  press('u');
  await settle();
  check(attr('data-moves') === played - 1, 'U undid a move');
  await walk('ArrowUp');
  press('r');
  await settle();
  check(attr('data-moves') === 0, 'R restarted the level');

  section('sokoban: back to the level select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('First push'), 'the HUD home button returns to the level select');
  check(count('[data-player]') === 0, 'the board unmounts on quit');
  check(text().includes('1 of 6 levels solved'), 'the solved level is recorded on the menu');

  // Leave the app on the level select, ready to be returned to the hub.
  await until(() => text().includes('SOKOBAN'), 'sokoban level select');
}
