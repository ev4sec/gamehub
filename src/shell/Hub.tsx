import { games } from '../platform/registry';

interface Props {
  onSelect: (id: string) => void;
}

export function Hub({ onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto flex min-h-full max-w-4xl flex-col px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-100">
            Game Hub
          </h1>
          <p className="mt-2 text-slate-400">
            A small collection of browser games sharing one loop, one save layer
            and one test harness.
          </p>
        </header>

        {games.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 px-5 py-8 text-center text-slate-500">
            No games registered yet.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {games.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => onSelect(game.id)}
                  className="h-full w-full rounded-2xl border border-slate-700/70 bg-slate-800/40 p-5 text-left transition hover:border-emerald-400/70 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span className="block text-lg font-bold text-slate-100">
                    {game.title}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-slate-400">
                    {game.blurb}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
