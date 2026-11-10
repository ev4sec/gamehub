export interface RunResult {
  stdout: string;
  /** The last line of Python's error message. Empty when the run was clean. */
  error: string;
  /** Line of the source the error was raised from. 0 when unknown or clean. */
  errorLine: number;
  timedOut: boolean;
}

export interface InspectResult {
  name: string;
  found: boolean;
  /** Where the module's code lives, or a note when it has no file. */
  origin: string;
  home: 'stdlib' | 'builtin' | 'installed' | 'missing';
  doc: string;
  names: string[];
  error: string;
}

export interface TraceVar {
  name: string;
  /** repr of the value, shortened. For a function, module or class, a label. */
  value: string;
  kind: 'value' | 'function' | 'module' | 'class';
  /** Python's name for the value's type: int, str, list, dict. */
  type: string;
  /** Names in one scope that share a number above 0 are the same list, dict or set. */
  ref: number;
}

export interface TraceStep {
  /** The line about to run. 0 on the closing step, after the last line has run. */
  line: number;
  /** '' at the top level, otherwise the function being run. */
  scope: string;
  vars: TraceVar[];
  /** Everything printed before this step. */
  out: string;
  /** Set when this step is a function handing a value back. */
  returned: string | null;
}

export interface TraceResult {
  steps: TraceStep[];
  stdout: string;
  error: string;
  errorLine: number;
  /** The step limit was hit. Usually a loop that never ends. */
  truncated: boolean;
  timedOut: boolean;
}

/** The engine talks to Python only through this, so tests can swap it out. */
export interface PyRunner {
  run(code: string, timeoutMs?: number): Promise<RunResult>;
  trace(code: string): Promise<TraceResult>;
  inspect(name: string): Promise<InspectResult>;
  dispose(): void;
}
