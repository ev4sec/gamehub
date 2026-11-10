import { ChevronLeft, ChevronRight, CornerDownLeft, Link2, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { MAX_TRACE_STEPS } from '../runner/tracer';
import type { TraceResult, TraceVar } from '../runner/types';
import { CodeBlock } from './CodeBlock';

interface Props {
  /** The source that was traced. Shown here, so it is never on screen twice. */
  code: string;
  fileName?: string;
  /** The player's own code, frozen while the trace is open. */
  own: boolean;
  /** Null while Python is still running it. */
  trace: TraceResult | null;
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}

interface View {
  /** The line about to run, 0 once finished. */
  line: number;
  scope: string;
  vars: TraceVar[];
  out: string;
  /** Calls that handed a value back on the way to this step. */
  returns: { fn: string; value: string }[];
  /** Set on the closing view of a run that raised. */
  error: string;
}

const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em]';

/**
 * Folds the raw trace into what is paged through. A return is not a stop of
 * its own here: it is shown on the step it leads to, as "f() returned 3",
 * which is where the player is looking when the value arrives.
 */
function viewsOf(trace: TraceResult): View[] {
  const views: View[] = [];
  let returns: View['returns'] = [];
  for (const s of trace.steps) {
    if (s.returned !== null) {
      returns.push({ fn: s.scope, value: s.returned });
      continue;
    }
    views.push({ line: s.line, scope: s.scope, vars: s.vars, out: s.out, returns, error: '' });
    returns = [];
  }
  if (trace.error !== '') {
    const last = views[views.length - 1];
    views.push({
      line: trace.errorLine,
      scope: last?.scope ?? '',
      vars: last?.vars ?? [],
      out: trace.stdout,
      returns,
      error: trace.error,
    });
  }
  return views;
}

function statusOf(view: View): string {
  if (view.error !== '') {
    return view.line > 0 ? `Stopped by an error on line ${view.line}` : 'Stopped by an error';
  }
  return view.line === 0 ? 'Finished' : `Line ${view.line} runs next`;
}

/** The last earlier view in the same scope, which is what "changed" is measured against. */
function before(views: View[], at: number): View | undefined {
  for (let i = at - 1; i >= 0; i--) {
    if (views[i].scope === views[at].scope) return views[i];
  }
  return undefined;
}

function sharedWith(v: TraceVar, vars: TraceVar[]): string {
  const others = vars.filter((o) => o.ref === v.ref && o.name !== v.name).map((o) => o.name);
  const what = ['list', 'dict', 'set'].includes(v.type) ? v.type : 'object';
  const names =
    others.length <= 1 ? others.join('') : `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}`;
  return `Same ${what} as ${names}`;
}

export function Tracer({ code, fileName, own, trace, step, onStep, onClose }: Props) {
  const views = useMemo(() => (trace ? viewsOf(trace) : []), [trace]);
  const at = Math.min(step, Math.max(0, views.length - 1));
  const view: View | undefined = views[at];
  const prev = view ? before(views, at) : undefined;
  const nextBtn = useRef<HTMLButtonElement | null>(null);
  const printed = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (trace) nextBtn.current?.focus({ preventScroll: true });
  }, [trace]);

  useEffect(() => {
    if (printed.current) printed.current.scrollTop = printed.current.scrollHeight;
  }, [at]);

  const last = views.length - 1;
  // The step buttons are never truly disabled, only marked so. A browser drops
  // focus from a button the moment it is disabled, and at the last step that
  // sent the next Escape past the trace and out of the level.
  const go = (to: number) => {
    if (views.length > 0) onStep(Math.max(0, Math.min(last, to)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    // The scrubber steps on these keys by itself.
    if ((e.target as HTMLElement).tagName === 'INPUT' || views.length === 0) return;
    const to = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };

  const status = view ? statusOf(view) : '';
  const oldOut = view && at > 0 ? views[at - 1].out : '';
  const keptOut = view && view.out.startsWith(oldOut) ? oldOut : '';

  return (
    <section
      id="trace"
      aria-label="Trace"
      data-trace
      onKeyDown={onKeyDown}
      className="mb-3 overflow-hidden rounded-xl border border-indigo-400/40 bg-slate-950"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-1.5">
        <p className={`${LABEL} flex items-baseline gap-2 text-indigo-300`}>
          Trace
          {fileName && <span className="font-mono text-xs font-normal normal-case tracking-normal">{fileName}</span>}
        </p>
        <button
          onClick={onClose}
          aria-label="Close the trace"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <X size={14} />
          Close
        </button>
      </div>
      {own && (
        <p className="border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
          Your code as it was when you opened the trace. Close the trace to keep editing.
        </p>
      )}

      <CodeBlock code={code} bare current={view && view.line > 0 ? view.line : null} />

      <div
        role="group"
        aria-label="Trace controls"
        className="sticky bottom-0 z-10 border-y border-slate-800 bg-slate-900 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        <p aria-live="polite" className="flex items-baseline justify-between gap-3 px-1 text-xs">
          <span data-trace-status className="font-semibold text-slate-100">
            {trace ? status : 'Running it line by line...'}
          </span>
          {view && (
            <span className="tabular-nums text-slate-400">
              Step {at + 1} of {views.length}
            </span>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => go(at - 1)}
            aria-disabled={!view || at === 0}
            aria-label="Previous step"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 aria-disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, last)}
            value={at}
            disabled={!view}
            onChange={(e) => go(Number(e.target.value))}
            aria-label="Step"
            aria-valuetext={view ? `Step ${at + 1} of ${views.length}, ${status.toLowerCase()}` : undefined}
            className="h-11 min-w-0 flex-1 accent-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          />
          <button
            ref={nextBtn}
            onClick={() => go(at + 1)}
            aria-disabled={!view || at === last}
            aria-label="Next step"
            className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border border-indigo-400/70 bg-indigo-400/10 px-3 text-sm font-semibold text-indigo-100 hover:bg-indigo-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 aria-disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {!trace && <p className="text-sm text-slate-400">Running it line by line...</p>}

        {trace?.timedOut && (
          <p className="text-sm text-rose-200">The trace took too long. Is there a loop that never ends?</p>
        )}

        {trace && !view && trace.error !== '' && (
          <p className="font-mono text-[13px] text-rose-200">
            {trace.errorLine > 0 ? `Line ${trace.errorLine}: ` : ''}
            {trace.error}
          </p>
        )}

        {view?.returns.map((r, i) => (
          <p
            key={i}
            data-trace-return
            className="flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-400/10 px-3 py-2 font-mono text-[13px] text-indigo-100"
          >
            <CornerDownLeft size={14} aria-hidden="true" className="shrink-0" />
            <span className="wrap-anywhere">
              {r.fn}() returned {r.value}
            </span>
          </p>
        ))}

        {view && (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className={`${LABEL} text-slate-400`}>Variables</p>
              {view.scope === '' ? (
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                  Top level
                </span>
              ) : (
                <span className="rounded-full border border-indigo-400/40 px-2 py-0.5 text-[11px] text-indigo-200">
                  Inside <span className="font-mono">{view.scope}()</span>
                </span>
              )}
            </div>
            {view.vars.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">No variables yet.</p>
            ) : (
              <table className="mt-1 w-full table-fixed border-collapse font-mono text-[13px]">
                <caption className="sr-only">
                  Variables {view.scope === '' ? 'at the top level' : `inside ${view.scope}()`} at step {at + 1}
                </caption>
                <tbody>
                  {view.vars.map((v) => {
                    const was = prev?.vars.find((o) => o.name === v.name);
                    // The very first view has nothing to be new against.
                    const tag = at === 0 ? '' : !was ? 'new' : was.value !== v.value ? 'changed' : '';
                    return (
                      <tr
                        key={v.name}
                        data-var={v.name}
                        data-var-tag={tag || undefined}
                        className={`border-t border-slate-800/80 first:border-t-0 ${tag ? 'bg-indigo-400/10' : ''}`}
                      >
                        <th
                          scope="row"
                          className="w-[35%] py-1.5 pl-1 pr-3 text-left align-top font-normal text-slate-300 wrap-anywhere"
                        >
                          {v.name}
                        </th>
                        <td
                          className={`py-1.5 align-top whitespace-pre-wrap wrap-anywhere ${
                            v.kind === 'value' ? 'text-slate-100' : 'text-slate-400'
                          }`}
                        >
                          {v.value}
                          {tag && <span className={`${LABEL} ml-2 font-sans text-indigo-300`}>{tag}</span>}
                          {v.ref > 0 && (
                            <span className="mt-0.5 flex items-center gap-1 font-sans text-xs text-indigo-200">
                              <Link2 size={12} aria-hidden="true" />
                              {sharedWith(v, view.vars)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {view && (
          <div>
            <p className={`${LABEL} mb-1 text-slate-400`}>Printed so far</p>
            <pre
              ref={printed}
              data-trace-output
              className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-black/40 p-3 font-mono text-[13px] text-slate-400 wrap-anywhere"
            >
              {view.out === '' ? (
                '(nothing yet)'
              ) : (
                <>
                  {keptOut}
                  <span className="text-slate-100">{view.out.slice(keptOut.length)}</span>
                </>
              )}
            </pre>
          </div>
        )}

        {view && view.error !== '' && (
          <p data-trace-error className="font-mono text-[13px] text-rose-200">
            {view.error}
          </p>
        )}

        {trace?.truncated && at === last && (
          <p className="text-xs text-slate-400">
            The trace stops at {MAX_TRACE_STEPS} steps. The program kept going after this.
          </p>
        )}
      </div>
    </section>
  );
}
