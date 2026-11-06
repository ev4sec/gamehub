/* eslint-disable @typescript-eslint/no-explicit-any */
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

function feedback(): string | null {
  return document.querySelector('[data-feedback]')?.getAttribute('data-feedback') ?? null;
}

function open(levelId: string): void {
  const btn = document.querySelector(`[data-level="${levelId}"]`) as HTMLElement | null;
  if (!btn) throw new Error(`no level button for ${levelId}`);
  click(btn);
}

/**
 * Code Lab's deep flow, without Python.
 *
 * Predict and multiple-choice levels grade in plain TypeScript, so they run
 * here. Anything that needs the interpreter is covered by `verify:levels`; the
 * runner is created lazily, so none of this ever starts a worker.
 */
export async function codelabDeepChecks(): Promise<void> {
  section('Code Lab: menu');
  check(text().includes('Code Lab'), 'title renders');
  check(text().includes('In development'), 'the in-development chip shows');
  for (const world of ['Names and Types', 'Loops', 'Imports and Libraries', 'Reading the Wild']) {
    check(text().includes(world), `${world} world is listed`);
  }
  check(document.querySelectorAll('[data-level]').length >= 25, 'every level has a button');

  section('Code Lab: a predict level');
  open('basics-1');
  await settle();
  check(!text().includes('Inspector'), 'no inspector on a level with no imports');
  check(text().includes('Top to bottom'), 'level opens');
  check(document.querySelector('[data-level-title]') !== null, 'level title is marked');

  type('textarea[aria-label="What it prints"]', '24');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad', 'a wrong answer is refused');

  type('textarea[aria-label="What it prints"]', '25');
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'good', 'the right answer is accepted');
  check(text().includes('Next level'), 'Next level appears after a win');

  section('Code Lab: a multiple-choice level');
  click(buttonWith('All levels'));
  await settle();
  check(text().includes('1/'), 'progress shows after a solve');
  open('imports-1');
  await settle();
  check(text().includes('Inspector'), 'the inspector is on screen');

  click(buttonWith('A third-party package'));
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'bad', 'the wrong source is refused');

  click(buttonWith('The standard library.'));
  await settle();
  click(buttonWith('Check answer'));
  await settle();
  check(feedback() === 'good', 'the right source is accepted');

  section('Code Lab: hints and leaving');
  click(buttonWith('All levels'));
  await settle();
  open('wild-2');
  await settle();
  click(buttonWith('Hint'));
  await settle();
  check(text().includes('Hint: What does 0o755 do?'), 'a hint reveals on request');

  press('Escape');
  await settle();
  check(document.querySelector('[data-level]') !== null, 'Escape returns to the level list');
}
