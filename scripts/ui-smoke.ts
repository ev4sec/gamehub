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
import { buttonWith, click, settle, text } from './domsetup';
import { EXIT_LABEL } from '../src/platform/game';
import { check, failureCount, section, until } from './harness';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { games } from '../src/platform/registry';
import { deepChecks } from './games';

const HUB_TITLE = 'Game Hub';

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
  check(document.querySelector('canvas') === null, 'no canvas on the hub');

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
    await deep();
    await backToHub();
    check(text().includes(HUB_TITLE), `${game.title} returns to the hub when done`);
  }

  const failures = failureCount();
  console.log(failures === 0 ? '\nALL UI CHECKS PASSED' : `\n${failures} UI CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
