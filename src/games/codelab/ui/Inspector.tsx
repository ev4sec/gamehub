import { Search } from 'lucide-react';
import { useState } from 'react';
import type { InspectResult } from '../runner/types';

interface Props {
  initial?: string;
  inspect: (name: string) => Promise<InspectResult>;
}

const HOME_LABEL: Record<InspectResult['home'], string> = {
  stdlib: 'Standard library',
  builtin: 'Built into the interpreter',
  installed: 'Installed package',
  missing: 'Not found here',
};

/**
 * Asks the real interpreter where a module lives. This is the "where is it and
 * what is it" tool: it reports the actual file path, not a description of one.
 */
export function Inspector({ initial = '', inspect }: Props) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InspectResult | null>(null);

  const go = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setResult(await inspect(trimmed));
    setBusy(false);
  };

  return (
    <section
      aria-label="Module inspector"
      className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4"
    >
      <h3 className="text-sm font-bold text-slate-200">Inspector</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Type a module name. Real Python reports where it lives.
      </p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Module name"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="json"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400/70 disabled:opacity-50"
        >
          <Search size={14} />
          {busy ? 'Asking...' : 'Inspect'}
        </button>
      </form>

      {result && (
        <dl data-inspect-result className="mt-3 space-y-2 text-xs leading-relaxed">
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Home</dt>
            <dd className="text-indigo-300">{HOME_LABEL[result.home]}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Origin</dt>
            <dd className="break-all font-mono text-slate-200">{result.origin || 'n/a'}</dd>
          </div>
          {result.doc && (
            <div>
              <dt className="uppercase tracking-widest text-slate-500">Docstring</dt>
              <dd className="text-slate-300">{result.doc}</dd>
            </div>
          )}
          {result.names.length > 0 && (
            <div>
              <dt className="uppercase tracking-widest text-slate-500">Public names (dir)</dt>
              <dd className="font-mono text-slate-400">{result.names.join('  ')}</dd>
            </div>
          )}
          {!result.found && (
            <p className="text-slate-400">
              Not installed in this sandbox. In a real project that means one of two things: a
              package that still needs pip install, or a file that belongs to the project itself.
            </p>
          )}
          {result.error && <p className="font-mono text-rose-300">{result.error}</p>}
        </dl>
      )}
    </section>
  );
}
