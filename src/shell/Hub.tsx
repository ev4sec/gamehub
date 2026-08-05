import { readSave } from '../platform/save';
import { games, type GameEntry } from '../platform/registry';
import { previews } from './previews';
import { PreviewCanvas } from './previews/PreviewCanvas';

interface Props {
  onSelect: (id: string) => void;
}

/** Where the shell records the last game opened. Not a game's save; the hub's. */
export const HUB_SAVE_ID = 'hub';

function lastPlayed(): string | null {
  const stored = readSave(HUB_SAVE_ID);
  const id = typeof stored?.last === 'string' ? stored.last : null;
  // Verified against the registry rather than trusted, so an id left behind by
  // a game that has since been renamed marks nothing rather than marking wrong.
  return id && games.some((g) => g.id === id) ? id : null;
}

/**
 * The landing page.
 *
 * Nine tiles, three across, every one the same size. The count is what decides
 * this: nine divides by three and by nothing else useful, so three rows of
 * three is the only arrangement that leaves no tile stranded alone on a final
 * row. Below `md` it drops to a single column, which also divides cleanly and
 * is the right shape for a phone anyway.
 *
 * An earlier version gave the last-played game a full-width hero tile. At
 * nine games that tile was simply too big: it dominated the page, pushed the
 * rest below the fold, and made the collection look like one game with eight
 * afterthoughts. What was worth keeping is the much smaller signal, so the
 * last-played game still gets a chip and nothing else.
 */
export function Hub({ onSelect }: Props) {
  const last = lastPlayed();

  return (
    <div className="relative h-full overflow-y-auto">
      <Backdrop />

      <main className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 py-10 md:px-6 md:py-16">
        <header className="mb-9 text-center md:mb-14">
          <h1 className="text-4xl font-black tracking-tight text-slate-100 md:text-5xl">
            Game Hub
          </h1>
          {/*
            One segment per game, in registry order. This used to be a single
            gradient through every accent, which at five hues was a spectrum and
            at nine is mud. Discrete segments read as "nine games" in the first
            second, which the gradient never did at any count.
          */}
          <span
            className="mx-auto mt-5 flex max-w-full items-center justify-center gap-1"
            aria-hidden
          >
            {games.map((game) => (
              <span
                key={game.id}
                className="block h-[3px] w-4 rounded-full"
                style={{ background: game.accent }}
              />
            ))}
          </span>
        </header>

        {games.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 px-5 py-8 text-center text-slate-500">
            No games registered yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {games.map((game) => (
              <li key={game.id}>
                <Tile
                  game={game}
                  chip={game.id === last ? 'Continue' : undefined}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

/**
 * The page's background art: an arcade grid under coloured light.
 *
 * Every hue is taken from a game accent, so the field belongs to the tiles
 * sitting on it rather than being decoration chosen at random. Five pools for
 * nine games: adding one per accent turned the whole page to mud, and the point
 * is a coloured field rather than a legend. Built entirely from gradients: no
 * image files, nothing to fetch, nothing to animate, and no per-frame cost on a
 * page that already has nine canvases running.
 *
 * Fixed rather than scrolled, so the light stays put and the tiles move over it.
 */
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(58rem 34rem at 12% 4%, rgba(52, 211, 153, 0.10), transparent 62%)',
            'radial-gradient(52rem 30rem at 88% 0%, rgba(34, 211, 238, 0.11), transparent 60%)',
            'radial-gradient(46rem 30rem at 78% 62%, rgba(251, 191, 36, 0.07), transparent 62%)',
            'radial-gradient(50rem 32rem at 20% 78%, rgba(56, 189, 248, 0.08), transparent 62%)',
            'radial-gradient(44rem 28rem at 52% 106%, rgba(167, 139, 250, 0.09), transparent 62%)',
            'linear-gradient(180deg, #020617 0%, #030a1c 55%, #020617 100%)',
          ].join(', '),
        }}
      />

      {/* The grid. Two hairline sets, plus a heavier one every fifth line, so
          it reads as a playfield rather than graph paper. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(to right, rgba(148, 163, 184, 0.055) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(148, 163, 184, 0.055) 1px, transparent 1px)',
            'linear-gradient(to right, rgba(148, 163, 184, 0.085) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(148, 163, 184, 0.085) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '38px 38px, 38px 38px, 190px 190px, 190px 190px',
          maskImage:
            'radial-gradient(120% 90% at 50% 24%, #000 0%, #000 42%, transparent 82%)',
          WebkitMaskImage:
            'radial-gradient(120% 90% at 50% 24%, #000 0%, #000 42%, transparent 82%)',
        }}
      />

      {/* A vignette, so the corners fall away and the tiles hold the centre. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(2, 6, 23, 0.55) 100%)',
        }}
      />
    </div>
  );
}

function Tile({
  game,
  chip,
  onSelect,
}: {
  game: GameEntry;
  chip?: string;
  onSelect: (id: string) => void;
}) {
  const preview = previews[game.id];

  return (
    <button
      type="button"
      onClick={() => onSelect(game.id)}
      // Fetching the chunk on approach rather than on click. This is the one
      // good half of "load the real game early": the responsiveness, without a
      // byte of game code in the entry bundle.
      onPointerEnter={() => void game.load().catch(() => {})}
      onFocus={() => void game.load().catch(() => {})}
      style={{ '--accent': game.accent, '--accent-text': game.accentText } as React.CSSProperties}
      className="group block w-full overflow-hidden rounded-[20px] border border-slate-700/70 bg-[#0b1120] text-left shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-[transform,border-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--accent)]/55 hover:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)] focus-visible:-translate-y-0.5 focus-visible:border-[var(--accent)]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--accent)] active:translate-y-0 active:scale-[0.985] motion-reduce:transform-none"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {chip && (
          // The only words that sit over artwork anywhere on this page, and the
          // only thing distinguishing one tile from another. Every tile is the
          // same size now, so this has to carry "you were here" on its own.
          <span
            className="absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-950"
            style={{ background: 'var(--accent)' }}
          >
            {chip}
          </span>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(110% 80% at 50% 115%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 68%), linear-gradient(180deg, #0a1122 0%, #060b16 100%)',
          }}
          aria-hidden
        />

        {preview && (
          <div className="absolute inset-0 opacity-70 saturate-[0.85] transition duration-200 group-hover:scale-[1.015] group-hover:opacity-100 group-hover:saturate-100 group-focus-visible:opacity-100 group-focus-visible:saturate-100 motion-reduce:transform-none">
            <PreviewCanvas gameId={game.id} spec={preview} />
          </div>
        )}

        <span
          className="absolute bottom-3 right-2.5 inline-flex translate-y-1 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-950 opacity-0 transition duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
          style={{ background: 'var(--accent)' }}
        >
          {/* Drawn inline rather than imported from lucide. The hub is the
              entry chunk, and importing one icon here hoists the icon library's
              shared machinery out of the game chunks and into the page every
              visitor loads first. One triangle is not worth that. */}
          <svg width="7" height="8" viewBox="0 0 7 8" aria-hidden focusable="false">
            <path d="M0 0l7 4-7 4z" fill="currentColor" />
          </svg>
          Play
        </span>

        {/* The seam between the art and the text, and the tile's clearest
            accent. Brightens with hover and focus alike. */}
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 opacity-35 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--accent) 22%, var(--accent) 78%, transparent 100%)',
          }}
          aria-hidden
        />
      </div>

      <div className="min-h-[84px] bg-gradient-to-b from-slate-900/85 to-slate-950/90 px-4 pb-4 pt-3.5 md:min-h-[92px] md:px-5 md:pb-4.5 md:pt-4">
        <span
          className="block text-xl font-bold tracking-tight text-slate-200 transition-colors duration-150 group-hover:text-[var(--accent-text)] group-focus-visible:text-[var(--accent-text)]"
        >
          {game.title}
        </span>
        <span
          className="mt-1.5 block text-[13px] leading-snug text-slate-400"
        >
          {game.blurb}
        </span>
      </div>
    </button>
  );
}
