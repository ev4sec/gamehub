import type { InspectResult, PyRunner, RunResult, TraceResult } from './types';

const BOOT_ALLOWANCE_MS = 20000;

/**
 * Owns the worker. Created lazily so that opening the game costs nothing until
 * the player actually runs code, and recreated after a timeout kills it.
 */
function createWorkerRunner(baseUrl: string): PyRunner {
  let worker: Worker | null = null;
  let booted = false;
  let nextId = 1;

  function spawn(): Worker {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    booted = false;
    return worker;
  }

  function call<T>(payload: object, timeoutMs: number): Promise<T | 'timeout'> {
    const w = worker ?? spawn();
    const id = nextId++;
    // The first call pays for loading the interpreter, so it gets extra time.
    const limit = booted ? timeoutMs : timeoutMs + BOOT_ALLOWANCE_MS;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        w.terminate();
        if (worker === w) worker = null;
        resolve('timeout');
      }, limit);

      w.onmessage = (e: MessageEvent<{ id: number; result: T }>) => {
        if (e.data.id !== id) return;
        clearTimeout(timer);
        booted = true;
        resolve(e.data.result);
      };
      w.onerror = () => {
        clearTimeout(timer);
        resolve('timeout');
      };
      w.postMessage({ ...payload, id, baseUrl });
    });
  }

  return {
    async run(code, timeoutMs = 4000): Promise<RunResult> {
      const r = await call<RunResult>({ kind: 'run', code }, timeoutMs);
      if (r === 'timeout') return { stdout: '', error: '', errorLine: 0, timedOut: true };
      return r;
    },
    async trace(code): Promise<TraceResult> {
      const r = await call<TraceResult>({ kind: 'trace', code }, 6000);
      if (r === 'timeout') {
        return { steps: [], stdout: '', error: '', errorLine: 0, truncated: false, timedOut: true };
      }
      return r;
    },
    async inspect(name): Promise<InspectResult> {
      const r = await call<InspectResult>({ kind: 'inspect', name }, 8000);
      if (r === 'timeout') {
        return {
          name,
          found: false,
          origin: '',
          home: 'missing',
          doc: '',
          names: [],
          error: 'The interpreter did not answer.',
        };
      }
      return r;
    },
    dispose() {
      worker?.terminate();
      worker = null;
    },
  };
}

let factory: (baseUrl: string) => PyRunner = createWorkerRunner;

export function createPyRunner(baseUrl: string): PyRunner {
  return factory(baseUrl);
}

/**
 * Swaps the interpreter for a stand-in. The headless UI suite has no Worker
 * and no WebAssembly to start, and without this seam every screen that sits
 * behind a run or a trace would ship unexecuted.
 */
export function setPyRunnerFactory(next: (baseUrl: string) => PyRunner): void {
  factory = next;
}
