/* eslint-disable @typescript-eslint/no-explicit-any */
import { LEVELS, PRACTICE, coreIn, levelById } from '../../src/games/codelab/engine/levels';
import { normalize } from '../../src/games/codelab/engine/grade';
import { setPyRunnerFactory } from '../../src/games/codelab/runner/pyRunner';
import type { PyRunner, TraceResult, TraceStep, TraceVar } from '../../src/games/codelab/runner/types';
import { buttonWith, click, press, settle, text } from '../domsetup';
import { check, section } from '../harness';

/** React ignores a plain `.value =`; this goes through the native setter. */
function type(selector: string, value: string): void {
  const el = document.querySelector(selector) as any;
  if (!el) throw new Error(`nothing matches ${selector}`);
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new (window as any).Event('input', { bubbles: true }));
}

/** A key pressed with focus inside `el`, so handlers on the way up see it first. */
function keyOn(el: Element, key: string): void {
  el.dispatchEvent(new (window as any).KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
}

function feedback(): string | null {
  return document.querySelector('[data-feedback]')?.getAttribute('data-feedback') ?? null;
}

function outcome(): string | null {
  return document.querySelector('[data-feedback="good"]')?.getAttribute('data-outcome') ?? null;
}

function open(levelId: string): void {
  const btn = document.querySelector(`[data-level="${levelId}"]`) as HTMLElement | null;
  if (!btn) throw new Error(`no level button for ${levelId}`);
  click(btn);
}

/** Writing levels are off the path and out of sight until asked for. */
async function showPractice(): Promise<void> {
  if (document.querySelector('[data-practice-toggle]')?.getAttribute('aria-expanded') === 'true') return;
  click(buttonWith('Show writing practice'));
  await settle();
}

async function toMenu(): Promise<void> {
  click(buttonWith('All levels'));
  await settle();
}

function count(selector: string): number {
  return document.querySelectorAll(selector).length;
}

function locked(label: string): boolean {
  return buttonWith(label).getAttribute('aria-disabled') === 'true';
}

const v = (name: string, value: string): TraceVar => ({ name, value, kind: 'value', type: 'int', ref: 0 });
const at = (line: number, vars: TraceVar[], out = ''): TraceStep => ({ line, scope: '', vars, out, returned: null });

/** What real Python reports for the first level's code, written out by hand. */
const FIRST_LEVEL_TRACE: TraceResult = {
  steps: [
    at(1, []),
    at(2, [v('width', '6')]),
    at(3, [v('width', '6'), v('height', '4')]),
    at(4, [v('width', '6'), v('height', '4'), v('area', '24')]),
    at(0, [v('width', '6'), v('height', '4'), v('area', '24')], '25\n'),
  ],
  stdout: '25\n',
  error: '',
  errorLine: 0,
  truncated: false,
  timedOut: false,
};

/**
 * Stands in for the interpreter. It knows one thing about Python: a write
 * level's reference solution passes that level's tests and nothing else does.
 * That is enough to drive every screen; whether the answers are right is the
 * job of `verify:levels`.
 */
function fakeRunner(log: string[]): PyRunner {
  return {
    run(code) {
      log.push('run');
      for (const level of LEVELS) {
        if (!level.solution || !level.tests) continue;
        const test = level.tests.find((t) => code === `${level.solution}\n${t.call}`);
        if (test) return Promise.resolve({ stdout: `${test.expect}\n`, error: '', errorLine: 0, timedOut: false });
      }
      if (code.includes('is_valid_port')) {
        return Promise.resolve({ stdout: 'None\n', error: '', errorLine: 0, timedOut: false });
      }
      return Promise.resolve({ stdout: '25\n', error: '', errorLine: 0, timedOut: false });
    },
    trace() {
      log.push('trace');
      return Promise.resolve(FIRST_LEVEL_TRACE);
    },
    inspect: () => Promise.reject(new Error('not used here')),
    dispose() {},
  };
}

/**
 * Code Lab's deep flow, with a stand-in for Python.
 *
 * Grading of predict and multiple-choice levels is plain TypeScript and runs
 * for real here. Runs and traces go to a scripted runner, so the screens
 * behind them are executed even though no interpreter is.
 */
export async function codelabDeepChecks(): Promise<void> {
  const calls: string[] = [];
  setPyRunnerFactory(() => fakeRunner(calls));
  const realNow = Date.now;

  try {
    await flow(calls, realNow);
  } finally {
    Date.now = realNow;
  }
}

async function flow(calls: string[], realNow: () => number): Promise<void> {
  section('Code Lab: menu');
  check(text().includes('Code Lab'), 'title renders');
  check(text().includes('In development'), 'the in-development chip shows');
  for (const world of ['Names and Types', 'Loops', 'Imports and Libraries', 'Reading the Wild']) {
    check(text().includes(world), `${world} world is listed`);
  }
  const CORE = coreIn('python');
  check(count('[data-level]') === CORE.length, 'every Python reading level has a button');
  check(document.querySelector('[data-track="python"]')?.getAttribute('aria-pressed') === 'true', 'the menu opens on the Python track');
  check(
    PRACTICE.every((l) => document.querySelector(`[data-level="${l.id}"]`) === null),
    'and no writing level does until it is asked for',
  );
  check(text().includes('Code You Are Handed'), 'the world on generated-code idioms is listed');
  check(count('[data-nav-grid]') === 1, 'the whole menu is one arrow-key grid');
  check(count('[data-review-due]') + count('[data-review-idle]') === 0, 'no review panel before anything is solved');
  check(count('[data-strength]') === 0, 'no strength bars before anything is solved');

  press('ArrowDown');
  await settle();
  check((document.activeElement?.textContent ?? '').includes('Start: Top to bottom'), 'the first arrow press lands on Start');
  press('End');
  await settle();
  press('ArrowUp');
  await settle();
  press('ArrowUp');
  await settle();
  check(
    document.activeElement?.getAttribute('data-level') === CORE[CORE.length - 1].id,
    'the arrow keys reach the last world, not only the first',
  );
  (document.activeElement as HTMLElement | null)?.blur();

  section('Code Lab: a predict level commits before it reveals');
  open('basics-1');
  await settle();
  check(!text().includes('Inspector'), 'no inspector on a level with no imports');
  check(text().includes('Top to bottom'), 'level opens');
  check(document.activeElement === document.querySelector('[data-level-title]'), 'focus starts on the title');
  check(text().includes('A variable is a name'), 'the lesson is open on a first visit');
  check(!text().includes('Show the lesson'), 'and has no toggle');

  check(locked('Run it for real') && locked('Step through'), 'Run and Step through start locked');
  click(buttonWith('Run it for real'));
  click(buttonWith('Step through'));
  await settle();
  check(calls.length === 0 && count('[data-run-output]') + count('[data-trace]') === 0, 'a locked tool does nothing when clicked');

  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad' && text().includes('Type what you think it prints'), 'an empty answer is asked for, not graded');
  check(locked('Run it for real'), 'and does not unlock anything');

  type('textarea[aria-label="What it prints"]', '24');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad', 'a wrong answer is refused');
  check(text().includes('That is what area holds'), 'with the reason for that particular wrong answer');
  check(!locked('Run it for real') && !locked('Step through'), 'a committed answer unlocks Run and Step through');

  section('Code Lab: stepping through');
  click(buttonWith('Step through'));
  await settle();
  const trace = () => document.querySelector('[data-trace]');
  const status = () => document.querySelector('[data-trace-status]')?.textContent ?? '';
  check(trace() !== null && calls.join() === 'trace', 'the trace opens and asks Python once');
  check(count('pre') >= 1 && count('[data-trace] figure') === 1, 'the code is shown inside the trace, once');
  check(count('figure') === 1, 'and not a second time outside it');
  check(status() === 'Line 1 runs next', 'it starts before the first line');
  check(trace()?.querySelector('[aria-current="step"]')?.textContent?.includes('width = 6') === true, 'the line about to run is marked');
  check(text().includes('No variables yet.'), 'with nothing assigned yet');
  check(document.activeElement === buttonWith('Next step'), 'focus is on Next step');

  click(buttonWith('Next step'));
  await settle();
  check(status() === 'Line 2 runs next' && text().includes('Step 2 of 5'), 'Next moves one line on');
  check(
    document.querySelector('[data-var="width"]')?.getAttribute('data-var-tag') === 'new',
    'a name that just appeared is marked new',
  );
  keyOn(buttonWith('Next step'), 'End');
  await settle();
  check(status() === 'Finished', 'End jumps to the finish');
  const nextStep = buttonWith('Next step') as HTMLButtonElement;
  check(
    nextStep.getAttribute('aria-disabled') === 'true' && !nextStep.disabled,
    'at the finish Next is marked unavailable but keeps focus, so Escape still closes the trace',
  );
  check(document.querySelector('[data-trace-output]')?.textContent === '25\n', 'where the output so far is the whole output');
  check(document.querySelector('[data-var="area"]')?.getAttribute('data-var-tag') === null, 'an unchanged name is not marked');
  keyOn(buttonWith('Next step'), 'ArrowLeft');
  await settle();
  check(status() === 'Line 4 runs next', 'the left arrow steps back');
  check(document.querySelector('[data-var="area"]')?.getAttribute('data-var-tag') === 'new', 'and shows what that step added');

  keyOn(buttonWith('Next step'), 'Escape');
  await settle();
  check(trace() === null, 'Escape closes the trace');
  check(document.activeElement === buttonWith('Step through'), 'and puts focus back on the button that opened it');
  check(document.querySelector('[data-level-title]') !== null, 'without leaving the level');
  check(count('figure') === 1, 'and the plain code is back');
  click(buttonWith('Step through'));
  await settle();
  check(status() === 'Line 4 runs next' && calls.join() === 'trace', 'reopening resumes where it was, without running it again');
  click(buttonWith('Close the trace'));
  await settle();

  type('textarea[aria-label="What it prints"]', '25');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'good', 'the right answer is accepted');
  check(count('[data-feedback]') === 1, 'and replaces the miss rather than joining it');
  check(outcome() === 'assisted' && text().includes('Solved with help.'), 'but as a solve with help');
  check(text().includes('It took more than one check.'), 'because it took two checks');
  check(text().includes('You stepped through the code before your answer was right.'), 'and because the trace was used first');
  check(text().includes('Strength 0 of 4.') && text().includes('Next review in 10 minutes.'), 'so it comes back soon');
  check(text().includes('area held 24 when print ran'), 'the explanation shows');
  check(document.activeElement === buttonWith('Next level'), 'focus moves to Next level');
  check((buttonWith('Check answer') as HTMLButtonElement).disabled, 'a solved level cannot be solved twice');

  section('Code Lab: an unaided solve');
  click(buttonWith('Next level'));
  await settle();
  check(text().includes('Dots and methods'), 'Next level moves on');
  type('textarea[aria-label="What it prints"]', 'ADA!\n3\na');
  click(buttonWith('Check answer'));
  await settle();
  check(outcome() === 'clean' && text().includes('Solved without help.'), 'right on the first check is a solve without help');
  check(text().includes('Strength 1 of 4.') && text().includes('Next review in 1 day.'), 'and waits a day');

  section('Code Lab: a wrong answer, line by line');
  await toMenu();
  check(document.querySelector('[data-nav-initial]')?.getAttribute('data-level') === 'basics-2', 'the menu remembers which level was left');
  open('functions-1');
  await settle();
  type('textarea[aria-label="What it prints"]', '6\n16\n9');
  click(buttonWith('Check answer'));
  await settle();
  const marks = [...document.querySelectorAll('[data-line-mark]')].map((el) => el.getAttribute('data-line-mark'));
  check(marks.join() === 'match,differs,unchecked', 'lines are marked up to the first one that differs');
  check(text().includes('Python prints 2 lines here. You typed 3.'), 'the line count is called out');
  check(text().includes('Lines after the first difference are not compared.'), 'and the rest is said to be uncompared');
  type('textarea[aria-label="What it prints"]', '6');
  click(buttonWith('Check answer'));
  await settle();
  check(
    [...document.querySelectorAll('[data-line-mark]')].map((el) => el.getAttribute('data-line-mark')).join() === 'match,missing',
    'a short answer shows where a line is missing',
  );
  check(!text().includes('Show the answer'), 'the answer is not offered after two misses');
  click(buttonWith('Check answer'));
  await settle();
  click(buttonWith('Show the answer'));
  await settle();
  check(outcome() === 'assisted' && text().includes('You looked at the answer.'), 'after three, it can be shown, as a solve with help');
  check(document.querySelector('[data-feedback="good"] pre')?.textContent === '6\n15', 'and the answer is on screen');

  section('Code Lab: a multiple-choice level');
  await toMenu();
  check(text().includes('2/3'), 'progress shows after solves');
  open('imports-1');
  await settle();
  const inspector = document.querySelector('[aria-label="Module inspector"]');
  const choices = document.querySelector('[role="radiogroup"]');
  check(
    inspector !== null && choices !== null && (inspector.compareDocumentPosition(choices) & 4) !== 0,
    'the inspector sits above the choices that tell you to use it',
  );
  check(document.querySelector('[role="radio"]')?.getAttribute('data-choice') === '0', 'a first visit shows the choices as written');

  click(buttonWith('A third-party package'));
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad', 'the wrong source is refused');
  check(text().includes('Nothing had to be installed for this to run'), 'with why that choice is wrong');
  check(text().includes('Ruled out'), 'and the choice stays marked');

  buttonWith('A third-party package').focus();
  keyOn(buttonWith('A third-party package'), 'ArrowUp');
  await settle();
  check(buttonWith('A third-party package').getAttribute('aria-checked') === 'false', 'an arrow key moves the selection');
  buttonWith('The standard library.').focus();
  click(buttonWith('The standard library.'));
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'good' && outcome() === 'assisted', 'the right source is accepted, as a solve with help');

  section('Code Lab: writing practice, off the path');
  await toMenu();
  await showPractice();
  check(count('[data-level]') === CORE.length + PRACTICE.length, 'the switch brings the writing levels into the list');
  check(text().includes('optional practice'), 'marked as optional');
  open('functions-3');
  await settle();
  const before = calls.length;
  click(buttonWith('Check answer'));
  await settle();
  await settle();
  check(feedback() === 'bad' && text().includes('Tests passing: 0 of 5.'), 'the starter fails, with a count');
  check(count('[data-test-result="fail"]') === 5 && calls.length - before === 5, 'every test ran and has its own row');
  check(text().includes('Expected') && text().includes('Got'), 'a failed test shows what was expected and what came back');
  check(count('[data-run-output]') === 0, 'checking does not masquerade as a run');
  check(!locked('Run my code') && !locked('Step through my code'), 'nothing is locked when the code is your own');

  type('textarea[aria-label="Your code"]', levelById('functions-3')?.solution ?? '');
  click(buttonWith('Check answer'));
  await settle();
  await settle();
  check(feedback() === 'good' && count('[data-test-result="pass"]') === 5, 'a working answer passes every test');
  check(outcome() === 'clean', 'one failed check is allowed on a write level');
  check(text().includes('Compare with a reference solution'), 'the reference solution is offered afterward');
  check(text().includes('Practice ') && !text().includes('Level '), 'it is numbered as practice, not as a level');
  click(buttonWith('Next level'));
  await settle();
  check(text().includes('The mutable default trap') === false, 'Next from practice does not lead onto the reading path');

  section('Code Lab: a fix level');
  await toMenu();
  check(document.querySelector('[data-practice-toggle]')?.getAttribute('aria-expanded') === 'true', 'coming back from practice leaves it showing');
  open('loops-6');
  await settle();
  check(text().includes('Bug report') && text().includes('It stops at 2.'), 'the bug report is shown');
  const broken = (document.querySelector('textarea[aria-label="Your code"]') as HTMLTextAreaElement).value;
  check(broken.includes('range(start, 1, -1)'), 'the editor starts with the broken code');

  section('Code Lab: review');
  await toMenu();
  check(count('[data-strength]') === 5, 'each solved level shows its strength');
  check(text().includes(`4 of ${CORE.length} solved.`), 'progress counts reading levels only');
  check(document.querySelector('[data-level="basics-2"] [data-strength]')?.getAttribute('data-strength') === '1', 'a clean solve shows one bar');
  check(document.querySelector('[data-level="basics-1"] [data-strength]')?.getAttribute('data-strength') === '0', 'a solve with help shows none');
  check(count('[data-review-due]') === 0 && text().includes('Nothing is due.'), 'nothing is due straight away');
  check(text().includes('The next review is in 10 minutes.'), 'and the menu says when something will be');

  // Eleven minutes on. The levels solved with help are due; the clean ones are not.
  Date.now = () => realNow() + 11 * 60_000;
  open('wild-2');
  await settle();
  await toMenu();
  check(document.querySelector('[data-review-due]')?.getAttribute('data-review-due') === '3', 'three levels come due');
  check(count('[data-level] .rounded-full') >= 3 && text().includes('Due'), 'and are marked in the list');

  click(buttonWith('Start review'));
  await settle();
  check(text().includes('Review 1 of 3'), 'review opens on the first due level');
  check(text().includes('Top to bottom'), 'in level order when they came due together');
  check(text().includes('Show the lesson') && !text().includes('A variable is a name'), 'the lesson is folded away');
  check(text().includes('price = 8') && !text().includes('width = 6'), 'the code is a variant');
  check(text().includes('This time the code is a variant'), 'and says so');
  type('textarea[aria-label="What it prints"]', '25');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad', 'last time\'s answer no longer works');
  click(buttonWith('Skip for now'));
  await settle();

  check(text().includes('Review 2 of 3') && text().includes('Arguments and defaults'), 'Skip moves to the next due level');
  click(buttonWith('Show the lesson'));
  await settle();
  check(text().includes('def defines a function'), 'the lesson can be opened');
  type('textarea[aria-label="What it prints"]', normalize('a--\nb++\nc-'));
  click(buttonWith('Check answer'));
  await settle();
  check(outcome() === 'assisted' && text().includes('You reread the lesson first.'), 'but opening it first counts as help');
  check(buttonWith('Next in review') === document.activeElement, 'Next reads as part of the review');
  click(buttonWith('Next in review'));
  await settle();

  check(text().includes('Review 3 of 3'), 'the last item says so');
  check(document.querySelector('[role="radio"]')?.getAttribute('data-choice') === '1', 'the choices come back in a different order');
  click(document.querySelector('[data-choice="0"]') as HTMLElement);
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(outcome() === 'clean' && text().includes('Strength 1 of 4, up from 0.'), 'an unaided review moves the level up');
  click(buttonWith('Finish review'));
  await settle();

  check(document.querySelector('[data-review-done]') !== null && text().includes('Review done.'), 'the queue ends on a summary');
  const stats = [...document.querySelectorAll('[data-review-done] dd')].map((el) => el.textContent).join();
  check(stats === '1,1,1', 'which counts the unaided, the helped and the skipped');
  check(text().includes('Skipped levels stay due.'), 'and says the skipped one is still due');
  click(buttonWith('Back to all levels'));
  await settle();
  check(document.querySelector('[data-review-due]')?.getAttribute('data-review-due') === '1', 'the skipped level is still due on the menu');

  section('Code Lab: the TypeScript track');
  const pythonCalls = calls.length;
  click(document.querySelector('[data-track="ts"]') as HTMLElement);
  await settle();
  const TS = coreIn('ts');
  check(text().includes('Reading a Component') && !text().includes('Names and Types'), 'the switch swaps the worlds');
  check(count('[data-level]') === TS.length, 'every TypeScript level has a button');
  check(document.querySelector('[data-practice-toggle]') === null, 'there is no writing practice on this track');
  check(text().includes('Start: const, let and template text'), 'progress starts fresh on the new track');
  check(count('[data-review-due]') === 1, 'review is shared across tracks');

  open('tsb-1');
  await settle();
  check(text().includes(`Level 1 of ${TS.length}`), 'levels are numbered within the track');
  check(text().includes('What it logs'), 'the answer box speaks the language');
  check(!text().includes('Step through'), 'there is no step-through on this track');
  check(locked('Run it for real') && text().includes('Run unlocks after you check an answer.'), 'Run starts locked here too');

  type('textarea[aria-label="What it prints"]', 'web01:8080\n10');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad' && text().includes('Not what this logs.'), 'a wrong answer is refused in the track\'s own words');
  check(text().includes('port was reassigned on line 3'), 'with the reason for that wrong answer');

  click(buttonWith('Run it for real'));
  await settle();
  await settle();
  check(
    document.querySelector('[data-run-output] pre')?.textContent === 'web01:8081\n10\n',
    'Run executes the code for real, with no interpreter to start',
  );
  check(calls.length === pythonCalls, 'and never touches Python');

  type('textarea[aria-label="What it prints"]', 'web01:8081\n10');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'good' && outcome() === 'assisted', 'the right answer is accepted');
  click(buttonWith('Next level'));
  await settle();
  check(text().includes('Objects and arrays'), 'Next stays on the track');

  await toMenu();
  open('tsr-2');
  await settle();
  check(document.querySelector('figcaption')?.textContent === 'Counter.tsx', 'a component is shown under its file name');
  click(buttonWith('setCount stores the new number'));
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(outcome() === 'clean', 'a reading question about a component can be solved');

  await toMenu();
  check(text().includes(`2 of ${TS.length} solved.`), 'the track counts its own progress');
  click(document.querySelector('[data-track="python"]') as HTMLElement);
  await settle();
  check(text().includes('Names and Types') && text().includes(`of ${CORE.length} solved.`), 'switching back restores the Python track');

  section('Code Lab: hints and leaving');
  open('wild-2');
  await settle();
  click(buttonWith('Hint'));
  await settle();
  check(text().includes('Hint: What does 0o755 do?'), 'a hint reveals on request');
  click(document.querySelector('[data-choice="0"]') as HTMLElement);
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(outcome() === 'assisted' && text().includes('You used a hint.'), 'a hint makes it a solve with help');

  press('Escape');
  await settle();
  check(document.querySelector('[data-level]') !== null, 'Escape returns to the level list');
}
