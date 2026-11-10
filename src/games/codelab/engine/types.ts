export type WorldId =
  | 'basics'
  | 'loops'
  | 'functions'
  | 'collections'
  | 'imports'
  | 'handed'
  | 'wild'
  | 'ts-basics'
  | 'ts-functions'
  | 'ts-data'
  | 'ts-async'
  | 'ts-modules'
  | 'ts-react';

/** Which language a world is in. A track has its own worlds, numbering and progress. */
export type Track = 'python' | 'ts';

/**
 * - predict: read the code, type exactly what it prints.
 * - write:   finish the code; tests run it in real Python.
 * - fix:     the code is already written and wrong; repair it. Graded like write.
 * - locate:  an import is in front of you; say where it comes from.
 * - read:    a snippet as found in the wild; say what it does.
 */
export type LevelKind = 'predict' | 'write' | 'fix' | 'locate' | 'read';

export interface SourceFile {
  name: string;
  code: string;
}

export interface WriteTest {
  /** Python appended after the player's code. Empty means grade the code's own output. */
  call: string;
  /** Exact expected stdout, compared after trailing whitespace is stripped. */
  expect: string;
}

/**
 * A wrong answer worth anticipating. When the player types exactly this, the
 * feedback names the misreading instead of only saying "no".
 */
export interface Mistake {
  answer: string;
  why: string;
}

/**
 * The same idea in different code. A level that comes back for review shows a
 * variant, so the answer cannot be recalled without rereading the code.
 */
export interface Variant {
  code: string;
  answer: string;
  mistakes?: Mistake[];
  explain: string;
}

export interface Level {
  id: string;
  world: WorldId;
  title: string;
  kind: LevelKind;
  /** The idea, in plain paragraphs. */
  concept: string[];
  /** Where this shows up when reading someone else's code. */
  wild: string;
  prompt: string;
  /** predict/locate/read: the code on display. write: the starter. fix: the broken code. */
  code: string;
  /** What to call the main file when it matters: 'Badge.tsx', 'package.json'. */
  fileName?: string;
  /** Extra files shown beside the main one (requirements.txt, helper modules). */
  files?: SourceFile[];
  /** predict: the exact stdout. Cross-checked against real Python by `verify:levels`. */
  answer?: string;
  /** predict: wrong answers with a known cause. */
  mistakes?: Mistake[];
  /** predict: alternate code for the same idea, used when the level comes back. */
  variants?: Variant[];
  choices?: string[];
  correct?: number;
  /** locate/read: one entry per choice saying why it is wrong. The correct one's is ''. */
  whyNot?: string[];
  tests?: WriteTest[];
  /** Substrings that fail a write level, so a hard-coded answer cannot pass. */
  forbid?: { text: string; why: string }[];
  /** A working answer for write and fix levels. `verify:levels` runs it through the grader. */
  solution?: string;
  hints: string[];
  /** Said after the level is solved. */
  explain: string;
  /** Module name to preload into the inspector. */
  inspect?: string;
}

export interface World {
  id: WorldId;
  track: Track;
  title: string;
  blurb: string;
}

/** What a predict level actually puts on screen for a given visit. */
export interface Problem {
  code: string;
  answer: string;
  mistakes: Mistake[];
  explain: string;
}
