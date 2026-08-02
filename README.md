# Game Hub

A small collection of lightweight browser games sharing one game loop, one save
layer and one test harness. No install, no accounts, no server.

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint + both smoke suites
npm run build    # static bundle in dist/
```

## Status

Two games in. Snake, with four modes, five power-ups, portals, encroaching
hazards, unlockable skins and a rival snake that hunts the same apples you do.
Tetris, with seven-bag randomisation, SRS rotation and wall kicks, hold, ghost
piece, T-spin scoring and back-to-back chains, across three modes.

## Games

| Game | Interaction model |
| --- | --- |
| **Snake** | Continuous steering under a clock |
| **Tetris** | Falling-block placement, ticked, with sustained-input auto-repeat |

Planned, in the order they go in: 2048 (turn-based, no clock at all), Breakout
(analog paddle, float physics rather than a grid), Sokoban (turn-based puzzle
over authored levels).

The spread is chosen so the games feel different to play, and so the shared
platform is proven against a continuous game, a grid game and a game with no
loop at all rather than five variations on one shape. 2048 goes in third
deliberately: it is the one most likely to prove the platform wrong, and that is
worth learning while there is still appetite to change it.

## How it is meant to fit together

```
src/
  platform/   game.ts     The shell/game contract
              registry.ts The list of games
              loop.ts     Fixed-timestep driver, for games that want a clock
              save.ts     localStorage, namespaced per game
              audio.ts    WebAudio synthesis primitive
              rng.ts      Seeded random, so a soak can be replayed
  shell/      The hub page and the chrome around a running game
  games/
    snake/    Engine, renderer, skins, UI. Self-contained.
    tetris/   Engine, renderer, UI. Self-contained.
scripts/      Headless smoke harnesses
  engines/    Per-game engine checks, keyed by registry id
  games/      Per-game deep UI flows, keyed by registry id
```

A game is asked for very little: an id, a title, a blurb, and a component that
mounts and knows how to leave. No step function, no grid size, no renderer. That
is what keeps a turn-based game with no clock as ordinary a tenant as a ticked
one, and it is why `platform/loop.ts` is a utility a game opts into rather than
something the shell runs on its behalf.

`platform/registry.ts` is the only place a game is named. The hub renders from
it and the smoke harness iterates it, so registering a game is what puts that
game under test. This is on purpose: the failure that motivated it was a
render-gating deadlock that left every mode button dead on click while the
engine underneath was fine, and nothing in the test suite touched the wiring.

Games are loaded on selection rather than at startup, so one game's code does
not ship inside every other game's bundle. Snake builds to its own 44 kB chunk;
open the hub and never click it and you never download it.

Each game's saved data is namespaced by its registry id, so two games cannot
collide and one game's data can be dropped without touching another's.

## Testing

```bash
npm run smoke      # engine invariants, ~20k ticks across every mode
npm run smoke:ui   # the whole app in a headless DOM, driven like a player
```

Both bundle through esbuild, already a Vite dependency, so they run offline with
no extra toolchain.

Both are driven by the registry rather than by a list kept in the test, and both
name any registered game that has no checks instead of passing quietly. A suite
that silently shrinks as the hub grows is worse than no suite.

`smoke` pairs a random-input soak with a soak driven by a competent player. The
random one is what catches illegal states; the competent one is what makes the
code past a placement run at all. Random tetris input tops out in a few hundred
ticks and never completes a row, so without the second soak the entire scoring,
combo and level-up path would go unexecuted while the suite still reported
green.

`smoke:ui` has two layers. The generic pass is driven by the registry: every
registered game must appear on the hub, mount when its card is clicked, and be
leavable. Deeper per-game flows live in `scripts/games/` keyed by registry id;
snake's plays a full run, pauses it, dies, restarts, and visits every mode. A
game registered without a deep script still gets the generic pass, and the
harness says so out loud rather than reporting a pass that covered almost
nothing.
