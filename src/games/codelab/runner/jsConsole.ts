/**
 * What `console.log` shows, as text.
 *
 * Browsers each draw logged values their own way, and none of them hand the
 * result back as a string. So the lab formats values itself, the way Node
 * prints them, and the level verifier holds this to Node's own output for
 * every value any level logs. A level's stored answer is therefore what a
 * person would see running the same file with `node`.
 */

const IDENT = /^[A-Za-z_$][\w$]*$/;

function quote(text: string): string {
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes('"')) return `"${text}"`;
  return `\`${text}\``;
}

function inspect(value: unknown): string {
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'function') return value.name ? `[Function: ${value.name}]` : '[Function (anonymous)]';
  if (value === null || typeof value !== 'object') return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : `[ ${value.map(inspect).join(', ')} ]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  return `{ ${entries.map(([k, v]) => `${IDENT.test(k) ? k : quote(k)}: ${inspect(v)}`).join(', ')} }`;
}

/** One `console.log` call as one line: arguments joined by spaces, top-level text unquoted. */
export function formatLog(args: unknown[]): string {
  return args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
}
