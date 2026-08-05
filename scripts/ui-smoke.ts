/**
 * End-to-end check of the shell in a headless DOM.
 *
 * The generic pass is driven by the registry, not by a list kept here: every
 * registered game must appear on the hub, mount when its card is clicked, and
 * be leavable. Registering a game is what puts it under test, which matters
 * because a hub multiplies exactly the routing and mount-order surface that
 * once left every mode button dead on click while the engine was fine.
 *
 * Deeper per-game flows live in scripts/games and are keyed by registry id.
 */
import {
  buttonWith,
  click,
  frames,
  pendingFrames,
  press,
  setReducedMotion,
  settle,
  text,
} from './domsetup';
import { EXIT_LABEL } from '../src/platform/game';
import { check, failureCount, section, until } from './harness';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { games } from '../src/platform/registry';
import { deepChecks } from './games';
import { previews } from '../src/shell/previews';

function previewFrames(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const canvas of document.querySelectorAll('canvas[data-preview]')) {
    counts[canvas.getAttribute('data-preview') ?? '?'] = Number(
      canvas.getAttribute('data-preview-frame') ?? 0,
    );
  }
  return counts;
}

const HUB_TITLE = 'Game Hub';

/**
 * Every button must be findable by name.
 *
 * Nine games with icon-only pause and home buttons, five d-pads and two hold
 * pads is exactly the surface where an unlabelled icon button appears, and the
 * harness's own `buttonWith` matcher depends on those labels existing. This
 * lands green today, so it only ever fires on a regression.
 */
function namelessButtons(): string[] {
  const bad: string[] = [];
  for (const button of document.querySelectorAll('button')) {
    const name = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
    if (name.trim() === '') bad.push(button.className.slice(0, 40) || '(no class)');
  }
  return bad;
}

async function backToHub(): Promise<void> {
  click(buttonWith(EXIT_LABEL));
  await until(() => text().includes(HUB_TITLE), 'the hub after leaving a game');
}

async function main() {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  root.render(createElement(App));
  await settle();

  section('hub');
  check(text().includes(HUB_TITLE), 'hub renders');
  check(games.length > 0, 'at least one game is registered');
  for (const game of games) {
    check(text().includes(game.title), `${game.title} has a card`);
  }
  // The hub used to forbid canvases outright. It now allows exactly one per
  // registered game, for the preview art, and forbids anything else. That is
  // strictly stronger: a stray canvas still fails, and a missing preview now
  // fails too, where before it would have passed silently.
  check(
    document.querySelector('canvas:not([data-preview])') === null,
    'the only canvases on the hub are previews',
  );
  for (const game of games) {
    if (!previews[game.id]) {
      console.log(`  note  no preview registered for ${game.id}`);
      continue;
    }
    const canvas = document.querySelector(
      `canvas[data-preview="${game.id}"]`,
    ) as HTMLCanvasElement | null;
    check(canvas !== null, `${game.title} has a preview`);
  }

  section('hub: the preview driver');
  // Polled rather than asserted outright: React flushes passive effects on its
  // own schedule, and how many turns that takes has changed between major
  // versions. Waiting for the condition tests the driver; counting settles
  // tests React's release notes.
  await until(() => pendingFrames() > 0, 'the preview driver to start');
  check(pendingFrames() > 0, 'the driver schedules frames on the hub');
  await frames(4, 16);

  // Checked after a frame, and against the exact figure, because an unsized
  // canvas is not zero in jsdom: the HTML default is 300x150, so `width > 0`
  // would pass with no driver running at all. A zero bounding rect floors at
  // MIN_CSS 160 and doubles for the stubbed device pixel ratio.
  for (const game of games) {
    if (!previews[game.id]) continue;
    const canvas = document.querySelector(
      `canvas[data-preview="${game.id}"]`,
    ) as HTMLCanvasElement | null;
    check(
      canvas !== null && canvas.width === 320,
      `${game.title} preview was sized by the driver, not left at the default`,
    );
  }
  const advanced = previewFrames();
  for (const game of games) {
    if (!previews[game.id]) continue;
    check((advanced[game.id] ?? 0) > 0, `${game.title} preview advanced`);
  }

  setReducedMotion(true);
  await settle();
  check(pendingFrames() === 0, 'no frame is scheduled once motion is refused');
  const still = previewFrames();
  for (const game of games) {
    if (!previews[game.id]) continue;
    check((still[game.id] ?? 0) > 0, `${game.title} painted a still frame`);
  }
  await frames(10, 16);
  check(
    JSON.stringify(previewFrames()) === JSON.stringify(still),
    'previews hold still while motion is refused',
  );

  setReducedMotion(false);
  await settle();
  check(pendingFrames() > 0, 'animation resumes when motion is allowed again');

  section('hub: the keyboard walks the tiles');
  {
    // Driven from nothing focused, which is the state a player actually arrives
    // in. In a headless DOM every offsetTop is zero, so the grid collapses to a
    // single row and all four arrows walk the list; the two-dimensional half of
    // this is real-browser territory and is not claimed to be covered here.
    const titleOf = () => document.activeElement?.textContent ?? '';

    press('ArrowRight');
    await settle();
    check(
      titleOf().includes(games[0].title),
      `the first press lands on ${games[0].title}, saw '${titleOf().slice(0, 24)}'`,
    );

    press('ArrowRight');
    await settle();
    check(titleOf().includes(games[1].title), `right moved on to ${games[1].title}`);

    press('ArrowLeft');
    await settle();
    check(titleOf().includes(games[0].title), 'left came back');

    press('End');
    await settle();
    const lastGame = games[games.length - 1];
    check(titleOf().includes(lastGame.title), `End jumped to ${lastGame.title}`);

    press('Home');
    await settle();
    check(titleOf().includes(games[0].title), 'Home came back to the first');

    press('Enter');
    await until(() => !text().includes(HUB_TITLE), 'Enter to open the highlighted game');
    check(!text().includes(HUB_TITLE), 'Enter opened it');

    await backToHub();
    check(text().includes(HUB_TITLE), 'and it is leavable as usual');
  }

  section('hub: every control has a name');
  check(namelessButtons().length === 0, `no nameless buttons on the hub`);

  // The hub is running exactly one loop: the preview driver's. Every game must
  // leave this number where it found it, which is the check that catches a
  // `startLoop` outliving the component that started it. That defect is
  // otherwise invisible, because the game is gone and nothing looks wrong.
  const loopBaseline = pendingFrames();

  for (const game of games) {
    section(`${game.title}: wiring`);

    click(buttonWith(game.title));
    await until(
      () => !text().includes(HUB_TITLE),
      `${game.title} to mount after clicking its card`,
    );
    check(!text().includes(HUB_TITLE), 'hub is gone after selecting the game');
    check(!text().includes('Loading'), 'the game finished loading');
    check(!text().includes('failed to load'), 'the game did not fail to load');

    // A leaked preview loop is the most plausible defect this feature ships,
    // and it would be invisible: the hub is gone, so nothing looks wrong. No
    // game has started a loop of its own at this point, because every game
    // opens on its own menu, so this count is exactly the driver's.
    check(
      document.querySelector('canvas[data-preview]') === null,
      'preview canvases unmount with the hub',
    );
    // Polled for the same reason as the start: effect cleanup runs on React's
    // schedule, not on ours.
    await until(() => pendingFrames() === 0, 'the preview driver to stop');
    check(pendingFrames() === 0, 'the preview driver stops when the hub leaves');

    await backToHub();
    check(text().includes(HUB_TITLE), 'returns to the hub');

    const deep = deepChecks[game.id];
    if (!deep) {
      console.log(`  note  no deep checks registered for ${game.id}`);
      continue;
    }

    click(buttonWith(game.title));
    await until(
      () => !text().includes(HUB_TITLE),
      `${game.title} to mount for its deep checks`,
    );

    check(
      namelessButtons().length === 0,
      `${game.title} has no nameless buttons on its menu`,
    );

    await deep();

    // Checked after the deep flow rather than before it, so the in-game HUD,
    // the overlays and the touch pads are covered rather than just the menu.
    check(
      namelessButtons().length === 0,
      `${game.title} has no nameless buttons in play`,
    );

    await backToHub();
    check(text().includes(HUB_TITLE), `${game.title} returns to the hub when done`);

    await until(
      () => pendingFrames() === loopBaseline,
      `${game.title} to leave no loop running behind it`,
    );
    check(
      pendingFrames() === loopBaseline,
      `${game.title} left no loop behind`,
    );
  }

  const failures = failureCount();
  console.log(failures === 0 ? '\nALL UI CHECKS PASSED' : `\n${failures} UI CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
