import { buttonWith, click, frames, press, release, settle, tap, text } from '../domsetup';
import { check, section, until } from '../harness';

function field(): Element | null {
  return document.querySelector('[data-status]');
}

function status(): string {
  return field()?.getAttribute('data-status') ?? '';
}

function bricks(): number {
  return Number(field()?.getAttribute('data-bricks') ?? -1);
}

function lives(): number {
  return Number(field()?.getAttribute('data-lives') ?? -1);
}

async function backToMenu(): Promise<void> {
  click(buttonWith('back to menu'));
  await settle();
}

/**
 * Breakout's deep flow.
 *
 * The ball is under continuous physics, so this drives it by wall-clock frames
 * rather than by discrete turns, and reads the exact counters off the field
 * element instead of scraping rendered text.
 */
export async function breakoutDeepChecks(): Promise<void> {
  section('breakout: mode select');
  check(text().includes('BREAKOUT'), 'title renders');
  for (const label of ['Classic', 'Endless', 'Sudden']) {
    check(text().includes(label), `${label} card is present`);
  }
  check(document.querySelector('canvas') === null, 'no canvas before a mode is chosen');

  section('breakout: starting Classic');
  click(buttonWith('Classic'));
  await settle();

  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  check(canvas !== null, 'canvas mounts after clicking a mode');
  await frames(4, 16);

  check(text().includes('Score'), 'HUD renders');
  check(canvas !== null && canvas.width > 0, 'canvas got a backing size');
  check(status() === 'ready', `the ball waits on the paddle, status is '${status()}'`);
  check(lives() === 3, `Classic starts with three lives, saw ${lives()}`);

  const wall = bricks();
  check(wall > 0, `the opening wall has bricks, saw ${wall}`);

  section('breakout: launching');
  click(buttonWith('Launch'));
  await settle();
  check(status() === 'playing', `launching starts the run, status is '${status()}'`);

  // Long enough for the ball to reach the wall and come back down.
  await frames(400, 16);
  check(bricks() < wall, `bricks are being broken, ${wall} down to ${bricks()}`);
  check(status() !== 'over', 'the run is still going');

  section('breakout: pause');
  tap('p');
  await settle();
  check(status() === 'paused', `P pauses, status is '${status()}'`);
  const frozen = bricks();
  await frames(120, 16);
  check(status() === 'paused', 'still paused after frames pass');
  check(bricks() === frozen, 'nothing was broken while paused');
  tap('p');
  await settle();
  check(status() !== 'paused', 'P resumes');

  section('breakout: back to the mode select');
  await backToMenu();
  check(text().includes('BREAKOUT'), 'the HUD home button returns to the mode select');
  check(document.querySelector('canvas') === null, 'canvas unmounts on quit');

  section('breakout: losing on Sudden');
  click(buttonWith('Sudden'));
  await settle();
  await frames(4, 16);
  check(lives() === 1, `Sudden starts with one life, saw ${lives()}`);

  tap(' ', 'Space');
  await settle();
  check(status() === 'playing', 'the ball launched');

  // Drive the paddle into the right wall and leave it there, so the ball
  // launched from the middle comes back down to nothing.
  press('ArrowRight');
  let waited = 0;
  while (status() !== 'over' && waited < 4000) {
    await frames(60, 16);
    waited += 60;
    // A caught extra life would put the ball back on the paddle.
    if (status() === 'ready') {
      tap(' ', 'Space');
      await settle();
    }
  }
  release('ArrowRight');
  check(status() === 'over', `the missed ball ends the run (after ${waited} frames)`);
  check(text().includes('Game Over'), 'the game over sheet is shown');

  click(buttonWith('Again'));
  await settle();
  await frames(4, 16);
  check(status() === 'ready', `Again serves a new ball, status is '${status()}'`);
  check(lives() === 1, `Again restored the single life, saw ${lives()}`);

  await backToMenu();

  // Leave the app on the mode select, ready to be returned to the hub.
  await until(() => text().includes('BREAKOUT'), 'breakout mode select');
}
