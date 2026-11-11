/*
 * Yellow is "this one": the part being pointed at, a selection, focus. It is
 * never right or wrong. Emerald and rose carry those, always with an icon or
 * a word beside them, since emerald and yellow are close for some eyes.
 */
export const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em]';
export const RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300';
export const BTN = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition aria-disabled:opacity-50 ${RING}`;
export const PRIMARY = `${BTN} border-yellow-300/70 bg-yellow-300/10 text-yellow-100 hover:bg-yellow-300/20`;
export const SECONDARY = `${BTN} border-slate-700 text-slate-200 hover:border-slate-500`;
export const GO = `${BTN} border-emerald-400/60 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20`;

export const LANG_NAME = {
  python: 'Python',
  ts: 'TypeScript',
  tsx: 'TypeScript, React',
  text: 'Text',
} as const;

/** Whether the visitor has asked for less motion. Read at call time, never cached. */
export function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
