/**
 * The TypeScript half of `verify:levels`.
 *
 * Same promise as the Python half: nothing a level shows or claims is taken on
 * trust. Every snippet goes through the real type checker, every predict
 * answer is compared against a real run, and the JavaScript shipped to the
 * browser is confirmed to be what the level's source compiles to today.
 */
import { format } from 'node:util';
import { resolve } from 'node:path';
import { transformSync } from 'esbuild';
import ts from 'typescript';
import { gradePredict, normalize, problemFor } from '../src/games/codelab/engine/grade';
import { COMPILED } from '../src/games/codelab/engine/tsCompiled';
import type { Level } from '../src/games/codelab/engine/types';
import { formatLog } from '../src/games/codelab/runner/jsConsole';
import { createJsRunner } from '../src/games/codelab/runner/jsRunner';
import { check, section } from './checks';
import { compileAll } from './ts-compile';

const OPTIONS: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};

/**
 * Type-checks one snippet as a file of its own inside this project, so an
 * import of "react" resolves to the real installed types.
 */
function typeErrors(source: string, tsx: boolean): string[] {
  const name = resolve(`__lab_snippet__.${tsx ? 'tsx' : 'ts'}`);
  // Checked as a module. A snippet is shown without an export, but as a bare
  // script its top-level names would collide with browser globals such as
  // `name`, and a top-level await would be refused.
  const text = `${source}\nexport {};\n`;
  const host = ts.createCompilerHost(OPTIONS);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (file, version, onError, fresh) =>
    resolve(file) === name
      ? ts.createSourceFile(file, text, version, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
      : read(file, version, onError, fresh);
  const exists = host.fileExists.bind(host);
  host.fileExists = (file) => resolve(file) === name || exists(file);
  const readFile = host.readFile.bind(host);
  host.readFile = (file) => (resolve(file) === name ? text : readFile(file));

  const program = ts.createProgram([name], OPTIONS, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
}

function parses(source: string, fileName: string): boolean {
  try {
    if (fileName.endsWith('.json')) JSON.parse(source);
    else transformSync(source, { loader: fileName.endsWith('.tsx') ? 'tsx' : 'ts', jsx: 'automatic' });
    return true;
  } catch {
    return false;
  }
}

/** Runs compiled code under plain Node and reports each log call both ways. */
async function nodeAgrees(js: string): Promise<boolean> {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const ours: string[] = [];
  const nodes: string[] = [];
  const log = (...args: unknown[]) => {
    ours.push(formatLog(args));
    nodes.push(format(...args));
  };
  await new AsyncFunction('console', js)({ log });
  await new Promise((r) => setTimeout(r, 80));
  return ours.length > 0 && ours.join('\n') === nodes.join('\n');
}

export function tsCompiledIsFresh(): void {
  section('type checker');
  // Controls. A checker that could not find React's types, or was not really
  // running, would pass every level and prove nothing.
  check(typeErrors('const n: number = "x";', false).length > 0, 'a wrong type is caught');
  check(typeErrors('const [a] = useState(0);', true).length > 0, 'an undeclared name is caught');
  check(
    typeErrors('import { useState } from "react";\nexport const C = () => <p>{useState(0)[0] + 1}</p>;', true)
      .length === 0,
    'a correct component, importing React, passes',
  );
  check(
    typeErrors('import { useState } from "react";\nexport const C = () => <p>{useState(0)[0].trim()}</p>;', true)
      .length > 0,
    'and React types are really loaded, so misuse of state is caught',
  );

  section('compiled TypeScript');
  const now = compileAll();
  const keys = Object.keys(now);
  check(keys.length > 0, 'there are snippets to compile');
  check(
    keys.length === Object.keys(COMPILED).length && keys.every((k) => COMPILED[k] === now[k]),
    'tsCompiled.ts matches the levels as they are now (if not: npm run gen:ts)',
  );
}

export async function verifyTsLevel(level: Level): Promise<void> {
  const mainName = level.fileName ?? 'main.ts';
  const shown: [string, string][] = [
    [mainName, level.code],
    ...(level.variants ?? []).map((v): [string, string] => [mainName, v.code]),
    ...(level.files ?? []).map((f): [string, string] => [f.name, f.code]),
  ];
  for (const [name, src] of shown) {
    check(parses(src, name), `${name}: displayed code parses`);
  }

  // A level made of several files is checked for syntax only: its imports
  // point at files that exist on the level's screen and nowhere on disk.
  const single = !level.files && /\.tsx?$/.test(mainName);
  if (single) {
    for (const src of [level.code, ...(level.variants ?? []).map((v) => v.code)]) {
      const errors = typeErrors(src, mainName.endsWith('.tsx'));
      check(errors.length === 0, `passes the type checker${errors.length ? `: ${errors.join(' | ')}` : ''}`);
    }
  }

  if (level.kind !== 'predict') return;

  const runner = createJsRunner();
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
    check(
      await nodeAgrees(COMPILED[problem.code] ?? ''),
      `${label}: every logged value is shown the way Node shows it`,
    );
    check(problem.explain.length > 0, `${label}: has an explanation`);
    for (const m of problem.mistakes) {
      const verdict = gradePredict(problem, m.answer, 'ts');
      check(!verdict.pass, `${label}: anticipated mistake ${JSON.stringify(m.answer)} is in fact wrong`);
      check(verdict.notes[0] === m.why, `${label}: and is answered with its own note`);
    }
    answers.add(normalize(problem.answer));
  }
  check(answers.size === count, 'no two variants share an answer');
}
