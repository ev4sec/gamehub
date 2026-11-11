/** What the snippet is written in. Decides how it is checked, not how it is drawn. */
export type Lang = 'python' | 'ts' | 'tsx' | 'text';

/**
 * A named piece of a snippet, as written by the author.
 *
 * Located by text, never by line number. A line number is wrong the moment a
 * line is added above it, and nothing notices. A piece of text that must match
 * exactly one line fails loudly instead.
 */
export interface RegionSpec {
  id: string;
  /** The short label shown on the piece: "Import", "Parameter", "Entry point". */
  kind: string;
  /** Glossary key for the general definition of this kind of thing. */
  term: string;
  /** Text found on exactly one line: the line the region starts on. */
  at: string;
  /** Text found on exactly one line at or after `at`: the last line. Omitted for one line. */
  to?: string;
  /** For a piece smaller than a line: the exact text on the `at` line. */
  token?: string;
  /** What this particular one is doing here, in a sentence or two. */
  note: string;
}

/** A region with its place in the code worked out. Lines count from 1. */
export interface Region extends RegionSpec {
  from: number;
  last: number;
  /** Character span on line `from`, when the region is a token. */
  span?: [start: number, end: number];
}

export interface Choice {
  text: string;
  /** Why this choice is wrong. Empty on the right one. */
  why: string;
}

/**
 * - find: a prompt names a piece; the player picks the line it is on.
 * - name: a piece is highlighted; the player says what it is.
 * - ask:  an ordinary question about the snippet.
 */
export type Step =
  | { kind: 'find'; prompt: string; target: string; miss: string }
  | { kind: 'name'; region: string; choices: Choice[] }
  | { kind: 'ask'; prompt: string; focus?: string; choices: Choice[] };

export interface Lesson {
  id: string;
  stage: string;
  title: string;
  lang: Lang;
  fileName: string;
  /** Said before the code is read. */
  intro: string[];
  code: string;
  regions: RegionSpec[];
  /**
   * Whether the pieces are walked through before the questions. Later stages
   * drop the walkthrough: by then the pieces have names and the work is
   * finding them unaided.
   */
  tour: boolean;
  steps: Step[];
  /** The one thing to carry out of the lesson. */
  takeaway: string;
}

export interface Stage {
  id: string;
  title: string;
  blurb: string;
  /** What finishing the stage lets the player do, as one plain sentence. */
  canNow: string;
}

export interface Term {
  name: string;
  definition: string;
}
