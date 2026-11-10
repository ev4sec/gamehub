import type { TraceResult } from './types';

/**
 * The Python side of the step-through view, and the one place a Python
 * traceback is turned into something short.
 *
 * Kept free of any Pyodide import so the browser worker and the Node-side
 * level verifier load exactly the same source. If the two ever traced
 * differently, the verifier would be checking a tracer nobody uses.
 */

/** Steps recorded before a trace gives up. Enough for every level; small enough to page through. */
export const MAX_TRACE_STEPS = 300;

/**
 * Defines `_lab_trace(src, max_steps)`, which runs `src` under `sys.settrace`
 * and returns JSON matching `TraceResult` (minus `timedOut`).
 *
 * Each step is taken just before a line runs: which line, which scope, what
 * every name in that scope holds, and what has been printed so far. A function
 * returning is a step of its own, because "what came back" is half of what
 * there is to learn about a call.
 */
export const TRACE_SOURCE = `
import io as _io, json as _json, sys as _sys, types as _types

def _lab_trace(src, max_steps):
    steps = []
    buf = _io.StringIO()
    state = {"truncated": False}
    raising = set()

    class _Stop(BaseException):
        pass

    def show(v):
        if isinstance(v, _types.ModuleType):
            return "module", "module " + v.__name__
        if isinstance(v, (_types.FunctionType, _types.BuiltinFunctionType)):
            return "function", "function"
        if isinstance(v, type):
            return "class", "class " + v.__name__
        try:
            r = repr(v)
        except Exception:
            r = "<unprintable>"
        return "value", (r if len(r) <= 80 else r[:77] + "...")

    def snap(names):
        shared = {}
        for k, v in names.items():
            if not k.startswith("__") and isinstance(v, (list, dict, set)):
                shared.setdefault(id(v), []).append(k)
        refs = {}
        for ident, group in shared.items():
            if len(group) > 1:
                refs[ident] = len(refs) + 1
        out = []
        for k, v in names.items():
            if k.startswith("__"):
                continue
            kind, text = show(v)
            out.append({"name": k, "value": text, "kind": kind, "type": type(v).__name__, "ref": refs.get(id(v), 0)})
        return out

    def tracer(frame, event, arg):
        code = frame.f_code
        if code.co_filename != "<lab>":
            return None
        if event == "exception":
            raising.add(id(frame))
            return tracer
        if event == "line":
            raising.discard(id(frame))
        if event == "line" or event == "return":
            top = code.co_name == "<module>"
            if event == "return" and (top or id(frame) in raising):
                raising.discard(id(frame))
                return tracer
            if len(steps) >= max_steps:
                state["truncated"] = True
                raise _Stop()
            step = {
                "line": frame.f_lineno,
                "scope": "" if top else code.co_name,
                "vars": snap(frame.f_locals),
                "out": buf.getvalue(),
                "returned": None,
            }
            if event == "return":
                step["returned"] = show(arg)[1]
            steps.append(step)
        return tracer

    g = {"__name__": "__main__"}
    error = ""
    error_line = 0
    old = _sys.stdout
    _sys.stdout = buf
    try:
        compiled = compile(src, "<lab>", "exec")
        _sys.settrace(tracer)
        try:
            exec(compiled, g)
        finally:
            _sys.settrace(None)
    except _Stop:
        pass
    except SyntaxError as exc:
        error = "SyntaxError: " + str(exc.msg)
        error_line = exc.lineno or 0
    except BaseException as exc:
        error = type(exc).__name__ + ": " + str(exc)
        tb = exc.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<lab>":
                error_line = tb.tb_lineno
            tb = tb.tb_next
    finally:
        _sys.stdout = old

    if error == "" and not state["truncated"]:
        steps.append({"line": 0, "scope": "", "vars": snap(g), "out": buf.getvalue(), "returned": None})

    return _json.dumps({
        "steps": steps,
        "stdout": buf.getvalue(),
        "error": error,
        "errorLine": error_line,
        "truncated": state["truncated"],
    })
`;

export function parseTrace(json: string): TraceResult {
  return { ...(JSON.parse(json) as Omit<TraceResult, 'timedOut'>), timedOut: false };
}

/**
 * Pyodide reports a Python exception as a full traceback in `message`. The
 * last line is the readable part; the last frame inside the player's own
 * source says where to look.
 */
export function readPyError(message: string): { error: string; errorLine: number } {
  const lines = message.trim().split('\n');
  const error = lines[lines.length - 1] ?? 'Error';
  let errorLine = 0;
  for (const m of message.matchAll(/File "<exec>", line (\d+)/g)) errorLine = Number(m[1]);
  return { error, errorLine };
}
