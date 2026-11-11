/**
 * Runs every Code Lab level against real Python.
 *
 * The levels teach what Python does, so the levels are only as trustworthy as
 * the last time somebody ran them. This runs each predict answer and every
 * variant of it, each write and fix solution through the real grader, the
 * step-through tracer over everything it will be pointed at, and parses every
 * snippet on display. It is slow (it boots an interpreter) so it lives apart
 * from the smoke suites, but it is part of `npm run check`.
 */
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { LEVELS, trackOf } from '../src/games/codelab/engine/levels';
import { gradePredict, gradeWrite, normalize, problemFor } from '../src/games/codelab/engine/grade';
import {
  MAX_TRACE_STEPS,
  TRACE_SOURCE,
  parseTrace,
  readPyError,
} from '../src/games/codelab/runner/tracer';
import type { PyRunner, RunResult, TraceResult } from '../src/games/codelab/runner/types';
import { check, failureCount, section } from './checks';
import { LESSONS as READER_LESSONS } from '../src/games/codereader/engine/course';
import { parsesAs, tsCompiledIsFresh, verifyTsLevel } from './verify-ts';

async function nodeRunner(py: PyodideInterface): Promise<PyRunner> {
  await py.runPythonAsync(TRACE_SOURCE);
  const traceFn = py.globals.get('_lab_trace') as (src: string, max: number) => string;

  return {
    async run(code: string): Promise<RunResult> {
      let out = '';
      let error = '';
      let errorLine = 0;
      py.setStdout({ batched: (s: string) => (out += `${s}\n`) });
      py.setStderr({ batched: (s: string) => (out += `${s}\n`) });
      try {
        const globals = py.toPy({ __name__: '__main__' });
        await py.runPythonAsync(code, { globals });
        globals.destroy();
      } catch (e) {
        ({ error, errorLine } = readPyError(String((e as Error).message)));
      }
      return { stdout: out, error, errorLine, timedOut: false };
    },
    async trace(code: string): Promise<TraceResult> {
      return parseTrace(traceFn(code, MAX_TRACE_STEPS));
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

/** A trace is only worth showing if it tells the same story as a plain run. */
async function traceAgrees(runner: PyRunner, code: string, label: string): Promise<void> {
  const run = await runner.run(code);
  const trace = await runner.trace(code);
  check(!trace.truncated, `${label}: trace finishes inside the step limit (${trace.steps.length} steps)`);
  check(
    normalize(trace.stdout) === normalize(run.stdout),
    `${label}: trace prints what a plain run prints`,
  );
  check((trace.error === '') === (run.error === ''), `${label}: trace and run agree on whether it raised`);
  if (trace.error === '') {
    const last = trace.steps[trace.steps.length - 1];
    check(last !== undefined && last.line === 0, `${label}: trace ends on a closing step`);
  }
  const lineCount = code.replace(/\n$/, '').split('\n').length;
  check(
    trace.steps.every((s) => s.line >= 0 && s.line <= lineCount),
    `${label}: every step points at a line that exists`,
  );
}

async function tracerBehaves(runner: PyRunner): Promise<void> {
  section('tracer');

  const alias = await runner.trace('a = [1]\nb = a\nc = [1]\nb.append(2)');
  const end = alias.steps[alias.steps.length - 1];
  const ref = (name: string) => end.vars.find((v) => v.name === name)?.ref ?? -1;
  check(ref('a') > 0 && ref('a') === ref('b'), 'two names for one list are marked as shared');
  check(ref('c') === 0, 'an equal but separate list is not marked');
  check(end.vars.find((v) => v.name === 'a')?.value === '[1, 2]', 'the shared list shows the change');

  const fn = await runner.trace('def f(x):\n    y = x + 1\n    return y\n\nprint(f(2))');
  const ret = fn.steps.find((s) => s.returned !== null);
  check(ret !== undefined && ret.returned === '3' && ret.scope === 'f', 'a return is its own step, with the value');
  check(
    fn.steps.some((s) => s.scope === 'f' && s.vars.some((v) => v.name === 'x' && v.value === '2')),
    'inside a call, the scope is the function and its parameters are shown',
  );
  check(
    fn.steps.some((s) => s.scope === '' && s.vars.some((v) => v.name === 'f' && v.kind === 'function')),
    'a def shows up as a name bound to a function',
  );
  check(fn.steps[fn.steps.length - 1].out === '3\n', 'output so far is carried on each step');

  const loop = await runner.trace('n = 0\nwhile True:\n    n += 1');
  check(loop.truncated && loop.steps.length === MAX_TRACE_STEPS, 'an endless loop stops at the step limit');

  const boom = await runner.trace('x = 1\nprint(x)\ny = x / 0\nprint("never")');
  check(boom.error.startsWith('ZeroDivisionError'), 'a runtime error is reported');
  check(boom.errorLine === 3, 'with the line it came from');
  check(boom.stdout === '1\n', 'and the output from before it');

  const inner = await runner.trace('def f():\n    return 1 / 0\n\nf()');
  check(inner.errorLine === 2, 'an error inside a function points at the line inside it');
  check(
    !inner.steps.some((s) => s.returned !== null),
    'a function that raises is not shown as returning',
  );

  const syntax = await runner.trace('x = (1,\nprint(x)');
  check(syntax.error.startsWith('SyntaxError') && syntax.steps.length === 0, 'a syntax error is reported with no steps');

  const quiet = await runner.run('print("after")');
  check(quiet.stdout === 'after\n', 'stdout still works for a plain run after tracing');

  const runErr = await runner.run('def f():\n    return [][0]\n\nf()');
  check(runErr.error.startsWith('IndexError') && runErr.errorLine === 2, 'a plain run reports the line of an error');
}

async function main(): Promise<void> {
  const py = await loadPyodide();
  const runner = await nodeRunner(py);

  await tracerBehaves(runner);
  tsCompiledIsFresh();

  const ids = new Set<string>();
  for (const level of LEVELS) {
    section(`${level.id}: ${level.title}`);
    check(!ids.has(level.id), 'id is unique');
    ids.add(level.id);

    const python = trackOf(level) === 'python';
    if (!python) await verifyTsLevel(level);

    const shown = python
      ? [
          level.code,
          ...(level.variants ?? []).map((v) => v.code),
          ...(level.files ?? []).filter((f) => f.name.endsWith('.py')).map((f) => f.code),
        ]
      : [];
    for (const src of shown) {
      check(await parses(py, src), 'displayed code parses as Python');
    }

    if (python && level.kind === 'predict') {
      const count = (level.variants?.length ?? 0) + 1;
      check(count >= 2, 'has at least one variant to come back as');
      const answers = new Set<string>();
      for (let visit = 0; visit < count; visit++) {
        const problem = problemFor(level, visit);
        const label = visit === 0 ? 'original' : `variant ${visit}`;
        const run = await runner.run(problem.code);
        check(run.error === '', `${label}: runs cleanly${run.error ? `: ${run.error}` : ''}`);
        check(
          normalize(run.stdout) === normalize(problem.answer),
          `${label}: stored answer matches real output (got ${JSON.stringify(normalize(run.stdout))})`,
        );
        check(problem.explain.length > 0, `${label}: has an explanation`);
        for (const m of problem.mistakes) {
          const verdict = gradePredict(problem, m.answer);
          check(!verdict.pass, `${label}: anticipated mistake ${JSON.stringify(m.answer)} is in fact wrong`);
          check(verdict.notes[0] === m.why, `${label}: and is answered with its own note`);
        }
        await traceAgrees(runner, problem.code, label);
        answers.add(normalize(problem.answer));
      }
      // The point of a variant is that last time's answer does not work.
      check(answers.size === count, 'no two variants share an answer');
    }

    if (level.kind === 'write' || level.kind === 'fix') {
      check((level.tests ?? []).length > 0, 'has tests');
      check(level.solution !== undefined, 'has a reference solution');
      const starter = await gradeWrite(level, level.code, runner);
      check(!starter.pass, 'the starter code does not already pass');
      if (level.kind === 'fix') {
        check(starter.blocked === '', 'the broken code is not stopped by a forbid rule');
        check(starter.results.some((r) => !r.pass), 'the broken code fails at least one test by running');
      }
      if (level.solution) {
        const verdict = await gradeWrite(level, level.solution, runner);
        const failed = verdict.results.filter((r) => !r.pass).map((r) => `${r.label}: ${r.error || r.got}`);
        check(verdict.pass, `reference solution passes${verdict.pass ? '' : `: ${failed.join(' | ')}`}`);
        check(verdict.results.length === (level.tests ?? []).length, 'every test ran');
      }
      for (const rule of level.forbid ?? []) {
        check(!(level.solution ?? '').includes(rule.text), `solution respects forbid "${rule.text}"`);
      }
    }

    if (level.kind === 'locate' || level.kind === 'read') {
      const choices = level.choices ?? [];
      check(choices.length >= 2, 'has choices');
      check(
        level.correct !== undefined && level.correct >= 0 && level.correct < choices.length,
        'correct index is in range',
      );
      check(level.whyNot?.length === choices.length, 'every choice has a reason');
      check(
        (level.whyNot ?? []).every((why, i) => (i === level.correct) === (why === '')),
        'wrong choices say why, and the right one does not',
      );
    }

    check(level.hints.length >= 1, 'has a hint');
  }

  section('Code Reader snippets');
  for (const lesson of READER_LESSONS) {
    if (lesson.lang === 'text') continue;
    const ok = lesson.lang === 'python' ? await parses(py, lesson.code) : parsesAs(lesson.code, lesson.lang);
    check(ok, `${lesson.id}: ${lesson.fileName} parses as ${lesson.lang}`);
  }
  check(!(await parses(py, 'def broken(:')), 'and the Python parser really rejects broken code');
  check(!parsesAs('const x = ;', 'ts'), 'as does the TypeScript one');

  section('standard library claims');
  const stdlib = await py.runPythonAsync(`
import sys
[n in sys.stdlib_module_names for n in ("json", "collections", "math", "hashlib", "base64", "string")]
`);
  check(stdlib.toJs().every(Boolean), 'json, collections, math, hashlib, base64, string are all standard library');
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
