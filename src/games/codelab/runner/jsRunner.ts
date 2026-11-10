import { COMPILED } from '../engine/tsCompiled';
import { formatLog } from './jsConsole';
import type { PyRunner, RunResult } from './types';

type AsyncBody = (console: Record<string, (...args: unknown[]) => void>) => Promise<void>;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => AsyncBody;

/** How long to let work that nobody awaited finish before the output is read. */
const SETTLE_MS = 80;

/**
 * Runs a TypeScript level's code for real.
 *
 * Only ever the lab's own snippets, never anything typed in: the TypeScript
 * track has no writing levels. That is what makes it reasonable to run them
 * here on the page instead of in a worker, since each one has already been
 * executed by the verifier and is known to finish. It is also why a snippet is
 * looked up rather than compiled: the JavaScript was produced ahead of time,
 * so no compiler has to be shipped to the browser.
 */
export function createJsRunner(): PyRunner {
  return {
    async run(source): Promise<RunResult> {
      const js = COMPILED[source];
      if (js === undefined) {
        return { stdout: '', error: 'This code has no runnable form.', errorLine: 0, timedOut: false };
      }

      const lines: string[] = [];
      const log = (...args: unknown[]) => lines.push(`${formatLog(args)}\n`);
      let error = '';
      try {
        await new AsyncFunction('console', js)({ log, info: log, warn: log, error: log });
        // A promise left un-awaited is the point of some levels. Give it time
        // to land, so "next line" then "saved" is what the player sees.
        if (/setTimeout|Promise|\basync\b/.test(js)) {
          await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
        }
      } catch (e) {
        error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      }
      return { stdout: lines.join(''), error, errorLine: 0, timedOut: false };
    },
    trace: () => Promise.reject(new Error('The TypeScript track has no step-through.')),
    inspect: () => Promise.reject(new Error('The TypeScript track has no module inspector.')),
    dispose() {},
  };
}
