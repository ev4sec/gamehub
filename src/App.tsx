import { games } from './platform/registry';

export default function App() {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto flex min-h-full max-w-4xl flex-col px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-4 text-left transition hover:border-slate-500 hover:bg-slate-800/60"
                >
                  <span className="block font-medium text-slate-100">
                    {game.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
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
