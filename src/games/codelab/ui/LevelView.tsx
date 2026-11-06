import { ArrowLeft, ArrowRight, Lightbulb, Play } from 'lucide-react';
import { useState } from 'react';
import { gradeChoice, gradePredict, gradeWrite } from '../engine/grade';
import type { Level } from '../engine/types';
import type { InspectResult, PyRunner, RunResult } from '../runner/types';
import { CodeBlock } from './CodeBlock';
import { Inspector } from './Inspector';

interface Props {
  level: Level;
  index: number;
  total: number;
  solved: boolean;
  getRunner: () => PyRunner;
  onSolved: (hintsUsed: number) => void;
  onNext: (() => void) | null;
  onBack: () => void;
}

type Feedback = { tone: 'good' | 'bad'; lines: string[] } | null;

const BTN =
  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50';

export function LevelView({
  level,
  index,
  total,
  solved,
  getRunner,
  onSolved,
  onNext,
  onBack,
}: Props) {
  const [typed, setTyped] = useState('');
  const [code, setCode] = useState(level.code);
  const [picked, setPicked] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [ran, setRan] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState(solved);

  const win = (lines: string[]) => {
    setFeedback({ tone: 'good', lines });
    if (!won) onSolved(hints);
    setWon(true);
  };

  const run = async (source: string) => {
    setBusy(true);
    setRan(await getRunner().run(source));
    setBusy(false);
  };

  const check = async () => {
    if (busy) return;
    if (level.kind === 'predict') {
      if (gradePredict(level, typed)) win(['Correct.']);
      else setFeedback({ tone: 'bad', lines: ['Not what Python prints. Run it to see, then work out the difference.'] });
      return;
    }
    if (level.kind === 'write') {
      setBusy(true);
      const verdict = await gradeWrite(level, code, getRunner());
      setBusy(false);
      setRan({ stdout: verdict.output, error: '', timedOut: false });
      if (verdict.pass) win(['All tests passed.']);
      else setFeedback({ tone: 'bad', lines: verdict.messages });
      return;
    }
    if (picked === null) {
      setFeedback({ tone: 'bad', lines: ['Pick an answer first.'] });
      return;
    }
    if (gradeChoice(level, picked)) win(['Correct.']);
    else setFeedback({ tone: 'bad', lines: ['Not quite. Reread the code, use the hints if you want them.'] });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void check();
    }
    if (e.key === 'Tab' && level.kind === 'write' && (e.target as HTMLElement).tagName === 'TEXTAREA') {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const { selectionStart: s, selectionEnd: en } = ta;
      const next = `${code.slice(0, s)}    ${code.slice(en)}`;
      setCode(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
    }
  };

  const inspect = (name: string): Promise<InspectResult> => getRunner().inspect(name);

  return (
    <div className="w-full max-w-3xl px-6 py-8" onKeyDown={onKeyDown}>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        <ArrowLeft size={12} />
        All levels
      </button>

      <header className="mb-5">
        <p className="text-xs uppercase tracking-widest text-indigo-300">
          Level {index + 1} of {total} · {level.kind}
        </p>
        <h1 data-level-title className="text-3xl font-black tracking-tight text-slate-100">
          {level.title}
        </h1>
      </header>

      <section aria-label="Concept" className="mb-5 space-y-2 text-sm leading-relaxed text-slate-300">
        {level.concept.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">In the wild. </span>
          {level.wild}
        </p>
      </section>

      <h2 className="mb-2 text-base font-bold text-indigo-200">{level.prompt}</h2>

      {level.kind !== 'write' && (
        <div className="mb-3 space-y-3">
          <CodeBlock code={level.code} name={level.files ? 'main.py' : undefined} />
          {level.files?.map((f) => (
            <CodeBlock key={f.name} code={f.code} name={f.name} />
          ))}
        </div>
      )}

      {level.kind === 'write' && (
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Your code"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          rows={Math.max(8, code.split('\n').length + 1)}
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      )}

      {level.kind === 'predict' && (
        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-label="What it prints"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          rows={Math.max(3, (level.answer ?? '').split('\n').length + 1)}
          placeholder="Type exactly what it prints, one line per line."
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      )}

      {(level.kind === 'locate' || level.kind === 'read') && (
        <ul className="mb-3 grid gap-2">
          {level.choices?.map((choice, i) => (
            <li key={choice}>
              <button
                role="radio"
                aria-checked={picked === i}
                onClick={() => setPicked(i)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  picked === i
                    ? 'border-indigo-400 bg-indigo-400/10 text-slate-100'
                    : 'border-slate-700/70 bg-slate-800/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => void check()}
          disabled={busy}
          className={`${BTN} border-indigo-400/70 bg-indigo-400/10 text-indigo-100 hover:bg-indigo-400/20`}
        >
          {busy ? 'Working...' : 'Check answer'}
        </button>
        {(level.kind === 'predict' || level.kind === 'write') && (
          <button
            onClick={() => void run(level.kind === 'write' ? code : level.code)}
            disabled={busy}
            className={`${BTN} border-slate-700 text-slate-200 hover:border-slate-500`}
          >
            <Play size={14} />
            {level.kind === 'predict' ? 'Run it for real' : 'Run my code'}
          </button>
        )}
        {hints < level.hints.length && !won && (
          <button
            onClick={() => setHints((h) => h + 1)}
            className={`${BTN} border-slate-700 text-slate-300 hover:border-amber-400/60`}
          >
            <Lightbulb size={14} />
            Hint ({hints}/{level.hints.length})
          </button>
        )}
      </div>

      {hints > 0 && !won && (
        <ul className="mb-3 space-y-1 text-sm text-amber-200">
          {level.hints.slice(0, hints).map((h) => (
            <li key={h}>Hint: {h}</li>
          ))}
        </ul>
      )}

      {ran && (
        <div data-run-output className="mb-3">
          <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">Python printed</p>
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/40 p-3 font-mono text-[13px] text-slate-200">
            {ran.timedOut
              ? 'Timed out. Is there a loop that never ends?'
              : `${ran.stdout || '(nothing)'}${ran.error ? `\n${ran.error}` : ''}`}
          </pre>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          data-feedback={feedback.tone}
          className={`mb-4 rounded-xl border p-4 text-sm ${
            feedback.tone === 'good'
              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
              : 'border-rose-400/50 bg-rose-400/10 text-rose-100'
          }`}
        >
          {feedback.lines.map((l) => (
            <p key={l} className="whitespace-pre-wrap">
              {l}
            </p>
          ))}
          {feedback.tone === 'good' && (
            <p className="mt-2 text-emerald-200/90">{level.explain}</p>
          )}
        </div>
      )}

      {won && onNext && (
        <button
          onClick={onNext}
          className={`${BTN} mb-5 border-emerald-400/60 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20`}
        >
          Next level
          <ArrowRight size={14} />
        </button>
      )}

      <Inspector initial={level.inspect} inspect={inspect} />

      <p className="mt-4 text-xs text-slate-600">Ctrl+Enter checks your answer.</p>
    </div>
  );
}
