export type WorldId = 'basics' | 'loops' | 'functions' | 'collections' | 'imports' | 'wild';

/**
 * - predict: read the code, type exactly what it prints.
 * - write:   finish the code; hidden tests run it in real Python.
 * - locate:  an import is in front of you; say where it comes from.
 * - read:    a snippet as found in the wild; say what it does.
 */
export type LevelKind = 'predict' | 'write' | 'locate' | 'read';

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
  /** predict/locate/read: the code on display. write: the starter. */
  code: string;
  /** Extra files shown beside the main one (requirements.txt, helper modules). */
  files?: SourceFile[];
  /** predict: the exact stdout. Cross-checked against real Python by `verify:levels`. */
  answer?: string;
  choices?: string[];
  correct?: number;
  tests?: WriteTest[];
  /** Substrings that fail a write level, so a hard-coded answer cannot pass. */
  forbid?: { text: string; why: string }[];
  /** A working answer for write levels. `verify:levels` runs it through the grader. */
  solution?: string;
  hints: string[];
  /** Said after the level is solved. */
  explain: string;
  /** Module name to preload into the inspector. */
  inspect?: string;
}

export interface World {
  id: WorldId;
  title: string;
  blurb: string;
}
