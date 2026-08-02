import { settle } from './domsetup';

let failures = 0;

export function check(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ok   ${msg}`);
  } else {
    failures++;
    console.log(`  FAIL ${msg}`);
  }
}

export function section(name: string): void {
  console.log(`\n${name}`);
}

export function failureCount(): number {
  return failures;
}

/**
 * Waits for a condition, settling between attempts.
 *
 * Games are loaded with a dynamic import, so mounting one takes an unknown
 * number of microtask turns. Polling a condition is honest about that; a fixed
 * number of `settle()` calls would pass or fail depending on bundler details
 * rather than on whether the game actually works.
 */
export async function until(
  cond: () => boolean,
  what: string,
  attempts = 40,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    if (cond()) return;
    await settle();
  }
  throw new Error(`timed out waiting for ${what}`);
}
