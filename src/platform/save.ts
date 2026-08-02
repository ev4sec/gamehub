/**
 * Per-game localStorage, namespaced by game id.
 *
 * The platform owns where data goes and the fact that every access is guarded;
 * each game owns its own schema. That split matters because a game's save shape
 * changes as the game does, and nothing here should need touching when it does.
 *
 * The key embeds the game id, so two games can never collide, and a game's data
 * can be dropped without touching anyone else's.
 */

const PREFIX = 'gamehub';
const VERSION = 'v1';

function keyFor(gameId: string): string {
  return `${PREFIX}.${gameId}.${VERSION}`;
}

/**
 * Reads a game's saved blob. Returns null when nothing is stored or when the
 * stored value is unusable, so callers always merge against their own defaults
 * rather than trusting the shape.
 *
 * localStorage throws outright in some privacy modes, hence the guard.
 */
export function readSave(gameId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(keyFor(gameId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function writeSave(gameId: string, data: unknown): void {
  try {
    localStorage.setItem(keyFor(gameId), JSON.stringify(data));
  } catch {
    // Nothing useful to do; the run still counts for this session.
  }
}
