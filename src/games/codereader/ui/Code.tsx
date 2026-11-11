import { Check, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import type { Lang, Region } from '../engine/types';
import { LANG_NAME, reducedMotion } from './shared';

export interface FindState {
  /** Labels the group of lines. */
  promptId: string;
  selected: number | null;
  ruledOut: number[];
  /** Set once the question is answered: the target, drawn as right. */
  solved: Region | null;
  onSelect: (line: number) => void;
}

interface Props {
  fileName: string;
  lang: Lang;
  lines: string[];
  /** The part being pointed at, if any. */
  active?: Region | null;
  /** The region the active one sits inside. Marked quietly, for context. */
  parent?: Region | null;
  /** Shown directly under the active part's last line. */
  callout?: ReactNode;
  /** Present when the lines themselves are the answer choices. */
  find?: FindState | null;
}

function inside(region: Region | null | undefined, line: number): boolean {
  return !!region && region.from <= line && line <= region.last;
}

/**
 * The lesson's code, with one part of it marked.
 *
 * Long lines wrap with a hanging indent and never scroll sideways. On a phone
 * a sideways scroll hides the very token a question is about, and takes any
 * label attached to the line with it. A wrapped line has no number on its
 * continuation, which is cue enough that it is one line.
 */
export function Code({ fileName, lang, lines, active, parent, callout, find }: Props) {
  const activeRow = useRef<HTMLDivElement | null>(null);
  const calloutRow = useRef<HTMLDivElement | null>(null);
  const group = useRef<HTMLDivElement | null>(null);

  // Bring the marked part into view, then whatever is said about it. The
  // second call is what keeps the explanation clear of the dock.
  useEffect(() => {
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    activeRow.current?.scrollIntoView?.({ block: 'nearest', behavior });
    calloutRow.current?.scrollIntoView?.({ block: 'nearest', behavior });
  }, [active?.id]);

  const dimOthers = !!active && !find;
  const rovingLine = find ? (find.selected ?? 1) : 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!find || find.solved) return;
    const at = find.selected ?? 1;
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 1, End: lines.length }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const line = Math.max(1, Math.min(lines.length, find.selected === null && e.key === 'ArrowDown' ? 1 : to));
    find.onSelect(line);
    group.current?.querySelector<HTMLElement>(`[data-line="${line}"]`)?.focus();
  };

  return (
    <figure className="-mx-4 overflow-hidden border-y border-slate-700/70 bg-slate-950 sm:mx-0 sm:rounded-xl sm:border">
      <figcaption className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-1.5">
        <span className="font-mono text-xs text-yellow-200">{fileName}</span>
        <span className="text-[11px] text-slate-400">{LANG_NAME[lang]}</span>
      </figcaption>
      <div
        ref={group}
        role={find ? 'radiogroup' : undefined}
        aria-labelledby={find ? find.promptId : undefined}
        aria-disabled={find?.solved ? true : undefined}
        onKeyDown={onKeyDown}
        className="py-2 font-mono text-[13px] leading-6 text-slate-200"
      >
        {lines.map((text, i) => {
          const n = i + 1;
          const isToken = !!active?.span && active.from === n;
          const inActive = inside(active, n) && !active?.span;
          const inParent = !inActive && !isToken && inside(parent, n);
          const selected = find?.selected === n && !find.solved;
          const ruledOut = find?.ruledOut.includes(n) ?? false;
          const right = inside(find?.solved, n);
          const lead = text.length - text.trimStart().length;

          const rail = right
            ? 'bg-emerald-300'
            : inActive || isToken
              ? 'bg-yellow-300'
              : inParent
                ? 'bg-slate-500'
                : '';
          const rowTone = right
            ? 'bg-emerald-400/10'
            : ruledOut
              ? 'bg-rose-400/6'
              : selected || inActive
                ? 'bg-yellow-300/10'
                : '';
          const numberTone = ruledOut
            ? 'text-rose-300'
            : selected || inActive
              ? 'font-semibold text-yellow-200'
              : isToken
                ? 'text-yellow-200'
                : 'text-slate-500';
          const textTone =
            inActive || isToken ? 'text-slate-50' : dimOthers ? 'text-slate-400' : 'text-slate-200';

          const row = (
            <div
              key={n}
              ref={(inActive || isToken) && active?.from === n ? activeRow : undefined}
              data-line={n}
              data-active={inActive || isToken ? '' : undefined}
              data-ruled-out={ruledOut ? '' : undefined}
              role={find ? 'radio' : undefined}
              aria-checked={find ? selected : undefined}
              aria-label={
                find ? `Line ${n}: ${text.trim() || 'blank'}${ruledOut ? ', ruled out' : ''}` : undefined
              }
              tabIndex={find ? (find.solved ? -1 : n === rovingLine ? 0 : -1) : undefined}
              onClick={find && !find.solved ? () => find.onSelect(n) : undefined}
              onKeyDown={
                find && !find.solved
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        find.onSelect(n);
                      }
                    }
                  : undefined
              }
              className={`relative grid scroll-mb-48 scroll-mt-4 grid-cols-[1rem_1.75rem_minmax(0,1fr)] transition-colors duration-100 motion-reduce:transition-none ${rowTone} ${
                find && !find.solved
                  ? 'cursor-pointer outline-none hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-yellow-300 pointer-coarse:py-1'
                  : ''
              }`}
            >
              <span aria-hidden="true" className="relative flex justify-center pt-1.5 pointer-coarse:pt-2.5">
                {rail && <span className={`absolute inset-y-0 left-0 w-[3px] ${rail}`} />}
                {right && find?.selected === n && <Check size={12} className="text-emerald-300" />}
                {!right && ruledOut && <X size={12} className="text-rose-300" />}
                {!right && !ruledOut && selected && <ChevronRight size={12} className="text-yellow-300" />}
              </span>
              <span aria-hidden="true" className={`select-none pr-2 text-right tabular-nums ${numberTone}`}>
                {n}
              </span>
              <code
                className={`whitespace-pre-wrap pr-3 wrap-anywhere ${textTone}`}
                style={{ paddingLeft: `${lead + 2}ch`, textIndent: `-${lead + 2}ch` }}
              >
                {isToken && active?.span ? (
                  <>
                    {text.slice(0, active.span[0])}
                    <span
                      data-token
                      className="rounded-[3px] bg-yellow-300/20 box-decoration-clone text-yellow-50 shadow-[inset_0_-2px_0_0_#fde047]"
                    >
                      {text.slice(active.span[0], active.span[1])}
                    </span>
                    {text.slice(active.span[1])}
                  </>
                ) : text === '' ? (
                  ' '
                ) : (
                  text
                )}
              </code>
            </div>
          );

          if (!callout || !active || active.last !== n) return row;
          return (
            <div key={n}>
              {row}
              <div ref={calloutRow} className="scroll-mb-40 scroll-mt-4">
                {callout}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
