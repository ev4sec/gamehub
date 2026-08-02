# Game Hub

A small collection of lightweight browser games sharing one game loop, one save
layer and one test harness. No install, no accounts, no server.

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint
npm run build    # static bundle in dist/
```

## Status

Early. The scaffold and the game registry are in place; no games are registered
yet. Snake is the first one going in, ported from its own repo rather than
rewritten, because its engine is already free of any DOM, React or canvas
dependency and moves across as-is.

## How it is meant to fit together

```
src/
  platform/   Shared machinery: registry, loop, save, audio, canvas helpers
  shell/      The hub page, routing and the chrome around a running game
  games/      One directory per game, each self-contained
scripts/      Headless smoke harnesses
```

`platform/registry.ts` is the only place a game is named. The hub page renders
from it and the smoke harness iterates it, so registering a game is what puts
that game under test. This is on purpose: the failure that motivated it was a
render-gating deadlock that left every mode button dead on click while the
engine underneath was fine, and nothing in the test suite touched the wiring.

Games are loaded on selection rather than at startup, so one game's code does
not ship inside every other game's bundle.

## Planned

| Game | Interaction model |
| --- | --- |
| Snake | Continuous steering under a clock |
| Tetris | Falling-block placement, ticked |
| Breakout | Analog paddle, float physics rather than a grid |
| 2048 | Turn-based, no clock at all |
| Sokoban | Turn-based puzzle over authored levels |

The spread is chosen so the games feel different to play, and so the shared
platform is proven against a continuous game, a grid game and a game with no
loop at all rather than five variations on one shape.
