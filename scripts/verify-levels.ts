/**
 * Runs every Code Lab level against real Python.
 *
 * The levels teach what Python does, so the levels are only as trustworthy as
 * the last time somebody ran them. This runs each predict answer, each write
 * solution through the real grader, and parses every snippet on display. It is
 * slow (it boots an interpreter) so it lives apart from the smoke suites, but
 * it is part of `npm run check`.
 */
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { LEVELS } from '../src/games/codelab/engine/levels';
import { gradeWrite, normalize } from '../src/games/codelab/engine/grade';
import type { PyRunner, RunResult } from '../src/games/codelab/runner/types';
import { check, failureCount, section } from './checks';

async function nodeRunner(py: PyodideInterface): Promise<PyRunner> {
  return {
    async run(code: string): Promise<RunResult> {
      let out = '';
      let error = '';
      py.setStdout({ batched: (s: string) => (out += `${s}\n`) });
      py.setStderr({ batched: (s: string) => (out += `${s}\n`) });
      try {
        const globals = py.toPy({ __name__: '__main__' });
        await py.runPythonAsync(code, { globals });
        globals.destroy();
      } catch (e) {
        const lines = String((e as Error).message).trim().split('\n');
        error = lines[lines.length - 1] ?? 'Error';
      }
      return { stdout: out, error, timedOut: false };
    },
    inspect() {
      throw new Error('not used here');
    },
    dispose() {},
  };
}

async function parses(py: PyodideInterface, source: string): Promise<boolean> {
  py.globals.set('_src', source);
  try {
    await py.runPythonAsync('import ast; ast.parse(_src)');
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const py = await loadPyodide();
  const runner = await nodeRunner(py);

  const ids = new Set<string>();
  for (const level of LEVELS) {
    section(`${level.id}: ${level.title}`);
    check(!ids.has(level.id), 'id is unique');
    ids.add(level.id);

    const shown = [
      level.code,
      ...(level.files ?? []).filter((f) => f.name.endsWith('.py')).map((f) => f.code),
    ];
    for (const src of shown) {
      check(await parses(py, src), 'displayed code parses as Python');
    }

    if (level.kind === 'predict') {
      const run = await runner.run(level.code);
      check(run.error === '', `runs cleanly${run.error ? `: ${run.error}` : ''}`);
      check(
        normalize(run.stdout) === normalize(level.answer ?? ''),
        `stored answer matches real output (got ${JSON.stringify(normalize(run.stdout))})`,
      );
    }

    if (level.kind === 'write') {
      check((level.tests ?? []).length > 0, 'has tests');
      check(level.solution !== undefined, 'has a reference solution');
      const starter = await gradeWrite(level, level.code, runner);
      check(!starter.pass, 'the starter code does not already pass');
      if (level.solution) {
        const verdict = await gradeWrite(level, level.solution, runner);
        check(verdict.pass, `reference solution passes${verdict.pass ? '' : `: ${verdict.messages.join(' | ')}`}`);
      }
      for (const rule of level.forbid ?? []) {
        check(!(level.solution ?? '').includes(rule.text), `solution respects forbid "${rule.text}"`);
      }
    }

    if (level.kind === 'locate' || level.kind === 'read') {
      check((level.choices ?? []).length >= 2, 'has choices');
      check(
        level.correct !== undefined && level.correct >= 0 && level.correct < (level.choices ?? []).length,
        'correct index is in range',
      );
    }

    check(level.hints.length >= 1, 'has a hint');
  }

  section('standard library claims');
  const stdlib = await py.runPythonAsync(`
import sys
[n in sys.stdlib_module_names for n in ("json", "collections", "math", "hashlib", "base64")]
`);
  check(stdlib.toJs().every(Boolean), 'json, collections, math, hashlib, base64 are all standard library');
  const req = await py.runPythonAsync(`
import sys, importlib.util
("requests" in sys.stdlib_module_names, importlib.util.find_spec("requests") is None)
`);
  const [reqStd] = req.toJs() as [boolean, boolean];
  check(!reqStd, 'requests is not standard library');

  const failures = failureCount();
  console.log(failures === 0 ? '\nALL LEVELS VERIFIED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
