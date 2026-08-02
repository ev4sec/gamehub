import { buttonWith, click, press, settle, text } from '../domsetup';
import { check, section, until } from '../harness';

function moveCount(): number {
  const el = document.querySelector('[data-moves]');
  return Number(el?.getAttribute('data-moves') ?? -1);
}

function tileCount(): number {
  return document.querySelectorAll('[data-tile]').length;
}

async function slide(key: string): Promise<void> {
  press(key);
  await settle();
}

/**
 * 2048's deep flow.
 *
 * This one doubles as a check on the platform's central claim. The game runs no
 * loop and mounts no canvas, so if the shell had quietly required either, this
 * is where it would fail rather than in a design document.
 */
export async function game2048DeepChecks(): Promise<void> {
  section('2048: mode select');
  check(text().includes('2048'), 'title renders');
  for (const label of ['Classic', 'Petite', 'Grand']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(tileCount() === 0, 'no board before a mode is chosen');

  section('2048: starting Classic');
  click(buttonWith('Classic'));
  await settle();

  check(!text().includes('Slide the board'), 'mode select is gone');
  check(tileCount() === 2, `a fresh board has two tiles, saw ${tileCount()}`);
  check(moveCount() === 0, `a fresh board has no moves played, saw ${moveCount()}`);
  check(text().includes('Score'), 'HUD renders');
  check(
    document.querySelector('canvas') === null,
    'the board is DOM: this game needs no canvas',
  );

  section('2048: sliding');
  // At least one direction always moves something on a two-tile board, but not
  // every direction does, so this tries them until the counter actually rises.
  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
    if (moveCount() > 0) break;
    await slide(key);
  }
  check(moveCount() === 1, `one move was recorded, saw ${moveCount()}`);
  check(tileCount() >= 2, `the board still holds tiles, saw ${tileCount()}`);

  section('2048: undo');
  click(buttonWith('Undo the last move'));
  await settle();
  check(moveCount() === 0, `undo took the move back, counter is ${moveCount()}`);
  check(tileCount() === 2, `undo restored the two-tile board, saw ${tileCount()}`);

  // Undo is one deep and spent, so the button should now be refusing.
  click(buttonWith('Undo the last move'));
  await settle();
  check(moveCount() === 0, 'a second undo did not rewind further');

  section('2048: the keyboard undo agrees with the button');
  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
    if (moveCount() > 0) break;
    await slide(key);
  }
  check(moveCount() === 1, 'a move was played to undo');
  press('u');
  await settle();
  check(moveCount() === 0, `U undid the move, counter is ${moveCount()}`);

  section('2048: restart');
  await slide('ArrowLeft');
  await slide('ArrowUp');
  click(buttonWith('Start again'));
  await settle();
  check(moveCount() === 0, `restart reset the move counter, saw ${moveCount()}`);
  check(tileCount() === 2, `restart dealt a fresh two-tile board, saw ${tileCount()}`);

  section('2048: back to the mode select');
  click(buttonWith('back to menu'));
  await settle();
  check(text().includes('Classic'), 'the HUD home button returns to the mode select');
  check(tileCount() === 0, 'the board unmounts on quit');

  section('2048: playing a Petite board out to the end');
  click(buttonWith('Petite'));
  await settle();
  check(tileCount() === 2, 'Petite starts with two tiles');

  const keys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
  let presses = 0;
  for (let i = 0; i < 600 && !text().includes('Game Over'); i++) {
    await slide(keys[i % keys.length]);
    presses++;
  }
  check(text().includes('Game Over'), `the small board fills up (after ${presses} presses)`);
  check(text().includes('Best tile'), 'the run is summarised');

  click(buttonWith('Again'));
  await settle();
  check(!text().includes('Game Over'), 'Again deals a new board');
  check(tileCount() === 2, `Again dealt two tiles, saw ${tileCount()}`);

  click(buttonWith('back to menu'));
  await settle();

  // Leave the app on the mode select, ready to be returned to the hub.
  await until(() => text().includes('Grand'), '2048 mode select');
}
