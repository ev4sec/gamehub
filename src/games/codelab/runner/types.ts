export interface RunResult {
  stdout: string;
  /** The last line of Python's error message. Empty when the run was clean. */
  error: string;
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

/** The engine talks to Python only through this, so tests can swap it out. */
export interface PyRunner {
  run(code: string, timeoutMs?: number): Promise<RunResult>;
  inspect(name: string): Promise<InspectResult>;
  dispose(): void;
}
