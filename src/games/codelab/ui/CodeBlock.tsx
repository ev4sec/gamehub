import { ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  code: string;
  name?: string;
  /** No border or rounding, for sitting inside another panel. */
  bare?: boolean;
  /**
   * Tracing: the line about to run, or null when no line is. Passing this at
   * all adds the marker column, so lines do not shift as the marker moves.
   */
  current?: number | null;
}

/** Read-only source with line numbers. Plain text on purpose: no highlighter to trust. */
export function CodeBlock({ code, name, bare = false, current }: Props) {
  const lines = code.replace(/\n$/, '').split('\n');
  const tracing = current !== undefined;
  const row = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    row.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
  }, [current]);

  return (
    <figure
      className={
        bare ? 'bg-slate-950' : 'overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950'
      }
    >
      {name && (
        <figcaption className="border-b border-slate-800 bg-slate-900/70 px-4 py-1.5 font-mono text-xs text-indigo-300">
          {name}
        </figcaption>
      )}
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6 text-slate-200">
        <div className="w-max min-w-full">
          {lines.map((line, i) => {
            const here = tracing && current === i + 1;
            return (
              <div
                key={i}
                ref={here ? row : undefined}
                aria-current={here ? 'step' : undefined}
                className={here ? 'flex scroll-mb-32 scroll-mt-4 bg-indigo-400/15' : 'flex'}
              >
                {tracing && (
                  <span className="flex w-5 shrink-0 items-center justify-end">
                    {here && <ChevronRight size={12} className="text-indigo-300" aria-hidden="true" />}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={`shrink-0 select-none pr-3 text-right ${tracing ? 'w-8' : 'w-10'} ${
                    here ? 'font-semibold text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {i + 1}
                </span>
                <code className="whitespace-pre pr-4">{line === '' ? ' ' : line}</code>
              </div>
            );
          })}
        </div>
      </pre>
    </figure>
  );
}
