interface Props {
  code: string;
  name?: string;
}

/** Read-only source with line numbers. Plain text on purpose: no highlighter to trust. */
export function CodeBlock({ code, name }: Props) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950">
      {name && (
        <figcaption className="border-b border-slate-800 bg-slate-900/70 px-4 py-1.5 font-mono text-xs text-indigo-300">
          {name}
        </figcaption>
      )}
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6 text-slate-200">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span
              aria-hidden="true"
              className="w-10 shrink-0 select-none pr-3 text-right text-slate-600"
            >
              {i + 1}
            </span>
            <code className="whitespace-pre pr-4">{line === '' ? ' ' : line}</code>
          </div>
        ))}
      </pre>
    </figure>
  );
}
