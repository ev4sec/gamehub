/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LESSONS,
  STAGES,
  TERM_COUNT,
  lessonById,
  regionsOf,
  termsMet,
} from '../../src/games/codereader/engine/course';
import type { Lesson } from '../../src/games/codereader/engine/types';
import { buttonWith, click, press, settle, text } from '../domsetup';
import { check, section } from '../harness';

const $ = (selector: string) => document.querySelector(selector) as HTMLElement | null;
const count = (selector: string) => document.querySelectorAll(selector).length;
const step = () => $('[data-lesson]')?.getAttribute('data-step') ?? null;
const feedback = () => $('[data-feedback]')?.getAttribute('data-feedback') ?? null;

/** Actions are driven by attribute. Choices are sentences, and one of them will contain "check" or "next". */
async function act(action: string): Promise<void> {
  const el = $(`[data-action="${action}"]`);
  if (!el) throw new Error(`no [data-action="${action}"] on screen`);
  click(el);
  await settle();
}

function keyOn(el: Element, key: string): void {
  el.dispatchEvent(new (window as any).KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
}

async function open(lessonId: string): Promise<void> {
  const el = $(`[data-lesson="${lessonId}"]`);
  if (!el || el.tagName !== 'BUTTON') throw new Error(`no menu row for ${lessonId}`);
  click(el);
  await settle();
}

async function toMenu(): Promise<void> {
  click(buttonWith('All lessons'));
  await settle();
}

async function skipTour(): Promise<void> {
  for (let i = 0; i < 20 && step() === 'tour'; i++) await act('tour-next');
}

/** Answers every question of the lesson on screen correctly, reading the answers from the course data. */
async function answerAll(lesson: Lesson): Promise<void> {
  const regions = regionsOf(lesson);
  for (const q of lesson.steps) {
    if (q.kind === 'find') {
      const target = regions.find((r) => r.id === q.target);
      click($(`[data-line="${target?.from}"]`) as HTMLElement);
    } else {
      click($(`[data-choice="${q.choices.findIndex((c) => c.why === '')}"]`) as HTMLElement);
    }
    await settle();
    await act('check');
    if (feedback() !== 'good') throw new Error(`${lesson.id}: the right answer to a ${q.kind} step was refused`);
    await act('next');
  }
}

export async function codereaderDeepChecks(): Promise<void> {
  const realNow = Date.now;
  try {
    await flow(realNow);
  } finally {
    Date.now = realNow;
  }
}

async function flow(realNow: () => number): Promise<void> {
  const first = lessonById('file-1') as Lesson;

  section('Code Reader: menu');
  check(text().includes('Code Reader') && text().includes('In development'), 'title and chip render');
  check(count('[data-stage]') === STAGES.length, 'every stage is on the path');
  check(count('button[data-lesson]') === LESSONS.length, 'every lesson has a row');
  check(count('[data-nav-grid]') === 1, 'the whole menu is one arrow-key grid');
  check($('[data-stage="file"]')?.getAttribute('data-stage-state') === 'current', 'the first stage is the current one');
  check($('[data-stage="func"]')?.getAttribute('data-stage-state') === 'upcoming', 'and the rest are upcoming');
  check($('[data-up-next]')?.getAttribute('data-lesson') === 'file-1', 'the first lesson is marked up next');
  check(text().includes(`0 of ${LESSONS.length} lessons`) && text().includes('Stage 1 of 12'), 'the position card says where the player is');
  check(count('[data-field-guide]') + count('[data-review-due]') + count('[data-review-idle]') === 0, 'no field guide or review before anything is finished');
  check(count('[data-can-now]') === 0, 'and nothing is claimed as learned');

  press('ArrowDown');
  await settle();
  check((document.activeElement?.textContent ?? '').includes('Start: Lines, top to bottom'), 'the first arrow press lands on Start');
  (document.activeElement as HTMLElement | null)?.blur();

  section('Code Reader: the tour');
  click($('[data-continue]') as HTMLElement);
  await settle();
  check(step() === 'tour', 'a first visit opens on the tour');
  check(document.activeElement === $('[data-lesson-title]'), 'with focus on the title');
  check($('[data-step-label]')?.textContent === 'Tour', 'the step label says so');
  check($('[data-callout]')?.getAttribute('data-callout') === 'comment', 'the first part is explained under its line');
  check($('[data-callout]')?.getAttribute('data-region-kind') === 'Comment', 'and labeled with what it is');
  check($('[data-active]')?.getAttribute('data-line') === '1' && count('[data-active]') === 1, 'only that line is marked');
  check(text().includes(`Part 1 of ${first.regions.length}`), 'the tour says how long it is');
  check($('[data-action="tour-back"]')?.getAttribute('aria-disabled') === 'true', 'Back is unavailable on the first part');
  check(count('[role="radio"]') === 0, 'lines cannot be picked during the tour');

  await act('tour-next');
  check($('[data-callout]')?.getAttribute('data-callout') === 'assign', 'Next moves to the next part');
  keyOn($('[data-lesson]') as HTMLElement, 'ArrowRight');
  await settle();
  check($('[data-callout]')?.getAttribute('data-callout') === 'var', 'and so does the right arrow');
  check($('[data-token]')?.textContent === 'hosts', 'a part smaller than a line is marked as just those characters');
  keyOn($('[data-lesson]') as HTMLElement, 'ArrowLeft');
  await settle();
  check($('[data-callout]')?.getAttribute('data-callout') === 'assign' && count('[data-token]') === 0, 'the left arrow goes back');

  click($('[data-kind-chip]') as HTMLElement);
  await settle();
  check($('[data-peek]')?.getAttribute('data-peek') === 'assignment', 'the label opens its field guide entry in place');
  check(($('[data-peek]')?.textContent ?? '').includes('It is not a claim that the two are equal'), 'with the general definition');
  keyOn($('[data-kind-chip]') as HTMLElement, 'Escape');
  await settle();
  check(count('[data-peek]') === 0 && step() === 'tour', 'Escape closes the entry without leaving the lesson');
  check(document.activeElement === $('[data-kind-chip]'), 'and returns focus to the label');

  await skipTour();
  check(step() === 'find', 'the tour hands over to the questions');
  check($('[data-step-label]')?.textContent === `Question 1 of ${first.steps.length}`, 'which are counted');
  check(count('[data-callout]') === 0 && count('[data-active]') === 0, 'with nothing in the code marked for the player');

  section('Code Reader: finding a line');
  check(count('[role="radio"][data-line]') === 5, 'every line of the code can be picked');
  await act('check');
  check(feedback() === 'bad' && text().includes('Pick a line first.'), 'checking with nothing picked asks for a pick');
  click($('[data-line="3"]') as HTMLElement);
  await settle();
  check($('[data-line="3"]')?.getAttribute('aria-checked') === 'true', 'a click selects a line');
  check(($('[data-action="check"]')?.textContent ?? '') === 'Check line 3', 'and the button says which');
  ($('[data-line="3"]') as HTMLElement).focus();
  keyOn($('[data-line="3"]') as HTMLElement, 'ArrowDown');
  await settle();
  check($('[data-line="4"]')?.getAttribute('aria-checked') === 'true' && document.activeElement === $('[data-line="4"]'), 'the arrow keys move the selection');
  keyOn($('[data-line="4"]') as HTMLElement, 'ArrowUp');
  await settle();
  await act('check');
  check(feedback() === 'bad' && text().includes('Not line 3.'), 'a wrong line is refused');
  check(text().includes('Line 3 is part of the assignment.'), 'with what that line actually is');
  check(text().includes('Look for the line that starts with #.'), 'and a pointer toward the right one');
  check($('[data-line="3"]')?.hasAttribute('data-ruled-out') === true, 'the line stays marked as ruled out');
  click($('[data-line="1"]') as HTMLElement);
  await settle();
  await act('check');
  check(feedback() === 'good', 'the right line is accepted');
  check(($('[data-feedback]')?.textContent ?? '').includes('A note to the reader'), 'and explained again');
  check(document.activeElement === $('[data-action="next"]') && ($('[data-action="next"]')?.textContent ?? '').includes('Next question'), 'focus moves to Next question');
  check(count('[role="radio"][tabindex="0"]') === 0, 'and the lines stop taking picks');

  section('Code Reader: naming a part');
  await act('next');
  check(step() === 'name' && $('[data-token]')?.textContent === 'hosts', 'the part in question is marked in the code');
  check(text().includes('What is the marked part?'), 'and the question is asked');
  check($('[data-dock] [data-choice]') !== null, 'short choices sit in the dock beside the code');
  click($('[data-choice="1"]') as HTMLElement);
  await settle();
  await act('check');
  check(feedback() === 'bad' && text().includes('hosts is followed by ='), 'a wrong name is refused with its own reason');
  check(text().includes('Ruled out'), 'and stays marked');
  click($('[data-choice="0"]') as HTMLElement);
  await settle();
  await act('check');
  check(feedback() === 'good', 'the right name is accepted');
  await act('next');
  click($('[data-choice="0"]') as HTMLElement);
  await settle();
  await act('check');
  await act('next');

  section('Code Reader: finishing a lesson');
  check(step() === 'ask', 'the last step is a plain question');
  check($('[data-dock] [data-choice]') === null && count('[data-choice]') === 3, 'whose longer choices sit below the dock');
  click($('[data-choice="0"]') as HTMLElement);
  await settle();
  await act('check');
  check(($('[data-action="next"]')?.textContent ?? '').includes('Finish lesson'), 'the last Next reads Finish lesson');
  await act('next');
  const done = $('[data-lesson-done]');
  check(step() === 'done' && done?.getAttribute('data-outcome') === 'assisted', 'two misses make it a lesson done with help');
  check(text().includes(`You missed 2 of ${first.steps.length} questions on the first try.`), 'and it says how many');
  check(text().includes('Strength 0 of 4.') && text().includes('Next review in 10 minutes.'), 'so it comes back soon');
  check(text().includes('Most code has that proportion'), 'the takeaway is shown');
  check(count('[data-stage-done]') === 0, 'no stage is announced complete yet');
  check(count('[data-dock]') === 0, 'and the dock is gone');
  check(($('[data-action="next"]')?.textContent ?? '').includes('Next lesson'), 'Next leads to the next lesson');

  section('Code Reader: finishing a stage');
  await act('next');
  check(text().includes('Kinds of value') && step() === 'tour', 'the next lesson opens on its own tour');
  await skipTour();
  await answerAll(lessonById('file-2') as Lesson);
  check($('[data-lesson-done]')?.getAttribute('data-outcome') === 'clean', 'no misses make it a lesson done without help');
  check(text().includes('Strength 1 of 4.') && text().includes('Next review in 1 day.'), 'which waits a day');
  await act('next');
  await skipTour();
  await answerAll(lessonById('file-3') as Lesson);
  check($('[data-stage-done]')?.getAttribute('data-stage-done') === 'file', 'finishing its last lesson completes the stage');
  check(text().includes('Stage 1 of 12 complete') && text().includes(STAGES[0].canNow), 'and says what the player can now do');
  check(($('[data-action="next"]')?.textContent ?? '').includes('Start stage 2: Anatomy of a function'), 'Next names the stage ahead');

  section('Code Reader: the menu after a stage');
  await toMenu();
  check($('[data-nav-initial]')?.getAttribute('data-lesson') === 'file-3', 'the menu remembers which lesson was left');
  check($('[data-stage="file"]')?.getAttribute('data-stage-state') === 'done', 'the stage is marked done');
  check($('[data-stage="func"]')?.getAttribute('data-stage-state') === 'current', 'and the next one is current');
  check(($('[data-position]')?.textContent ?? '').includes(STAGES[0].canNow), 'the position card repeats what was gained');
  check(text().includes(`3 of ${LESSONS.length} lessons`) && text().includes('Stage 2 of 12'), 'and where the player now is');
  check($('[data-up-next]')?.getAttribute('data-lesson') === 'func-1', 'up next has moved on');
  check(count('[data-strength]') === 3, 'each finished lesson shows its strength');
  check(text().includes('Nothing is due.'), 'nothing is due straight away');

  section('Code Reader: the field guide');
  const met = termsMet(['file-1', 'file-2', 'file-3']);
  check(($('[data-field-guide]')?.textContent ?? '').includes(`${met.length} terms you have met`), 'the field guide appears with a count');
  click($('[data-field-guide]') as HTMLElement);
  await settle();
  check(document.activeElement === $('[data-field-guide-title]'), 'it opens with focus on its heading');
  check(count('[data-term]') === met.length, 'and lists exactly the terms met');
  check(($('[data-term="comment"]')?.textContent ?? '').includes('# Report how many hosts are up.'), 'each with the code it was first seen on');
  check(text().includes(`${TERM_COUNT - met.length} more are ahead on the path.`), 'and how many are still ahead');
  check(count('[data-term="decorator"]') === 0, 'terms not yet met are not shown');
  click(buttonWith('All lessons'));
  await settle();
  check($('[data-nav-initial]') === $('[data-field-guide]'), 'coming back puts the keyboard on the field guide button');

  section('Code Reader: an unguided lesson');
  await open('script-3');
  check(step() === 'find' && count('[data-action="tour-next"]') === 0, 'a lesson without a tour opens straight on a question');
  check(count('[data-action="replay-tour"]') === 0, 'and offers none');
  press('Escape');
  await settle();
  check(count('button[data-lesson]') === LESSONS.length, 'Escape returns to the menu');

  section('Code Reader: review');
  Date.now = () => realNow() + 11 * 60_000;
  await open('func-1');
  await toMenu();
  check($('[data-review-due]')?.getAttribute('data-review-due') === '1', 'the lesson done with help comes due');
  click(buttonWith('Start review'));
  await settle();
  check(text().includes('Review 1 of 1') && text().includes('Lines, top to bottom'), 'review opens on it');
  check(step() === 'find' && count('[data-revisit]') === 1, 'a finished lesson skips the tour');
  check($('[data-action="replay-tour"]') !== null, 'and offers it instead');
  await answerAll(first);
  check($('[data-lesson-done]')?.getAttribute('data-outcome') === 'clean', 'from memory, it is done without help');
  check(text().includes('Strength 1 of 4, up from 0.'), 'and moves up');
  check(($('[data-action="next"]')?.textContent ?? '').includes('Finish review'), 'the last review item says so');
  await act('next');
  check($('[data-review-done]') !== null && text().includes('Review done.'), 'the queue ends on a summary');
  check([...document.querySelectorAll('[data-review-done] dd')].map((el) => el.textContent).join() === '1,0', 'with the count');
  click(buttonWith('Back to all lessons'));
  await settle();

  section('Code Reader: every lesson can be finished');
  let finished = 0;
  for (const lesson of LESSONS) {
    await open(lesson.id);
    await skipTour();
    await answerAll(lesson);
    if ($('[data-lesson-done]')?.getAttribute('data-outcome') === 'clean') finished += 1;
    await toMenu();
  }
  check(finished === LESSONS.length, `all ${LESSONS.length} lessons play through to the end`);
  check(text().includes(`All ${STAGES.length} stages done`) && $('[data-continue]') === null, 'the position card says the path is finished');
  check(count('[data-stage-state="done"]') === STAGES.length, 'every stage is marked done');
  click($('[data-field-guide]') as HTMLElement);
  await settle();
  check(count('[data-term]') === TERM_COUNT, 'and the field guide holds every term');
  click(buttonWith('All lessons'));
  await settle();
}
