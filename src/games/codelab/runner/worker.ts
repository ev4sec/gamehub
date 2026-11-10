/// <reference lib="webworker" />
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { MAX_TRACE_STEPS, TRACE_SOURCE, parseTrace, readPyError } from './tracer';
import type { InspectResult, RunResult } from './types';

/**
 * Real CPython, compiled to WebAssembly, in a worker. A worker so that a
 * `while True:` in the player's code costs one terminated thread instead of a
 * frozen tab.
 */

type Request = { id: number; baseUrl: string } & (
  | { kind: 'run'; code: string }
  | { kind: 'trace'; code: string }
  | { kind: 'inspect'; name: string }
);

let pyodide: Promise<PyodideInterface> | null = null;

function boot(baseUrl: string): Promise<PyodideInterface> {
  if (!pyodide) {
    pyodide = loadPyodide({ indexURL: new URL(`${baseUrl}pyodide/`, self.location.origin).href });
  }
  return pyodide;
}

const INSPECT = `
import importlib, importlib.util, json, sys

def _inspect(name):
    out = {"name": name, "found": False, "origin": "", "home": "missing", "doc": "", "names": [], "error": ""}
    try:
        spec = importlib.util.find_spec(name)
    except Exception as exc:
        out["error"] = f"{type(exc).__name__}: {exc}"
        return json.dumps(out)
    if spec is None:
        out["origin"] = "not found on this interpreter's search path"
        return json.dumps(out)
    out["found"] = True
    top = name.split(".")[0]
    if spec.origin in ("built-in", "frozen") or spec.origin is None:
        out["home"] = "builtin"
        out["origin"] = "compiled into the interpreter, so there is no .py file to open"
    else:
        out["origin"] = spec.origin
        out["home"] = "stdlib" if top in sys.stdlib_module_names else "installed"
    try:
        mod = importlib.import_module(name)
        out["doc"] = (mod.__doc__ or "").strip().split("\\n")[0]
        out["names"] = [n for n in dir(mod) if not n.startswith("_")][:40]
    except Exception as exc:
        out["error"] = f"{type(exc).__name__}: {exc}"
    return json.dumps(out)
`;

self.onmessage = async (event: MessageEvent<Request>) => {
  const msg = event.data;
  const py = await boot(msg.baseUrl);

  if (msg.kind === 'run') {
    let out = '';
    let error = '';
    let errorLine = 0;
    py.setStdout({ batched: (s: string) => (out += `${s}\n`) });
    py.setStderr({ batched: (s: string) => (out += `${s}\n`) });
    try {
      const globals = py.toPy({ __name__: '__main__' });
      await py.runPythonAsync(msg.code, { globals });
      globals.destroy();
    } catch (e) {
      ({ error, errorLine } = readPyError(String((e as Error).message)));
    }
    const result: RunResult = { stdout: out, error, errorLine, timedOut: false };
    self.postMessage({ id: msg.id, result });
    return;
  }

  if (msg.kind === 'trace') {
    await py.runPythonAsync(TRACE_SOURCE);
    const fn = py.globals.get('_lab_trace') as (src: string, max: number) => string;
    self.postMessage({ id: msg.id, result: parseTrace(fn(msg.code, MAX_TRACE_STEPS)) });
    return;
  }

  await py.runPythonAsync(INSPECT);
  const fn = py.globals.get('_inspect') as (n: string) => string;
  const result = JSON.parse(fn(msg.name)) as InspectResult;
  self.postMessage({ id: msg.id, result });
};
