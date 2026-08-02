/**
 * Assertions and the failure tally, shared by both smoke suites.
 *
 * Deliberately free of any DOM import. The engine suite runs in plain node and
 * must not drag jsdom in behind it, which is what a shared harness that touched
 * `document` at module scope would do.
 */

let failures = 0;

/** Loud. Logs every result, for flows with a handful of assertions. */
export function check(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ok   ${msg}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${msg}`);
  }
}

/**
 * Quiet. Logs only failures, for assertions inside hot loops. The engine soaks
 * check invariants every tick across tens of thousands of ticks; a loud check
 * there would bury the run in output.
 */
export function expect(cond: boolean, msg: string): void {
  if (!cond) {
    failures += 1;
    console.log(`  FAIL ${msg}`);
  }
}

export function section(name: string): void {
  console.log(`\n${name}`);
}

export function failureCount(): number {
  return failures;
}
