/**
 * Engine invariants for every registered game, in plain node with no DOM.
 *
 * The list of games comes from the registry, not from here. A game that is
 * registered but has no engine checks is called out by name rather than
 * passing quietly, because a suite that shrinks silently as the hub grows is
 * worse than no suite at all.
 */
import { engineChecks } from './engines';
import { failureCount, section } from './checks';
import { games } from '../src/platform/registry';

let untested = 0;

for (const game of games) {
  const checks = engineChecks[game.id];
  section(`${game.title} engine`);
  if (!checks) {
    untested += 1;
    console.log(`  note  no engine checks registered for ${game.id}`);
    continue;
  }
  checks();
}

if (untested > 0) {
  console.log(`\n${untested} registered game(s) have no engine checks.`);
}

const failures = failureCount();
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
