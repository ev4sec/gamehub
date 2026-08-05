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

Nine games in, and every one of them plays on a phone.

Snake, with four modes, five power-ups, portals, encroaching hazards,
unlockable skins and a rival snake that hunts the same apples you do. Tetris,
with seven-bag randomisation, SRS rotation and wall kicks, hold, ghost piece,
T-spin scoring and back-to-back chains, across three modes. 2048, on three
board sizes, with one move of undo. Breakout, with five authored walls, an
endless generator, five power-ups and a paddle that aims. Sokoban, six
hand-built warehouses with unlimited undo and a deadlock warning.

Then four arcade cabinets. Missile Command, where the nearest battery with ammo
fires at wherever you tapped, so the whole game works with one thumb; it has
splitters, smart bombs that sidestep your explosions, bombers and chain
reactions. Frogger, six lanes of traffic and five of river, with turtles that
start diving at level three. Asteroids, on a real torus, with splitting rocks,
saucers that aim, hyperspace, and a two-thumb touch scheme that is not a d-pad.
And a maze chase over a 28 by 31 board, with four ghosts that target four
different things and are told apart by silhouette as well as by colour.

## Games

| Game | Interaction model |
| --- | --- |
| **Snake** | Continuous steering under a clock |
| **Tetris** | Falling-block placement, ticked, with sustained-input auto-repeat |
| **2048** | Turn-based. No clock, no loop, no canvas |
| **Breakout** | Continuous float physics, analog paddle, no grid at all |
| **Sokoban** | Turn-based puzzle over authored levels, unlimited undo |
| **Missile Command** | Absolute pointer input. The field is the only control |
| **Frogger** | A discrete board whose occupants are one float per lane |
| **Asteroids** | Free float physics on a wrapped surface, no edges at all |
| **Maze Chase** | Tile-and-fraction actors, four independent pursuers |

The spread is chosen so the games feel different to play, and so the shared
platform is proven against a continuous game, a grid game and a game with no
loop at all rather than nine variations on one shape.

2048 went in third deliberately, as the one most likely to prove the platform
wrong. It did not. It imports neither `platform/loop` nor a canvas: the whole
game is request-response, state changes only when the player does something,
and the board is DOM with CSS transitions. That is the outcome the contract was
shaped for, and its UI smoke asserts the absence of a canvas so the property
cannot quietly rot. The one thing it did change was `platform/rng`, which was
lifted out of a game and into the platform once a second game wanted seeded
randomness.

The last four each pushed on something the platform had not been asked for.
Missile Command wanted a whole world coordinate out of a tap rather than a
single axis, which is where `platform/canvas.ts` came from. Frogger wanted a
board that is discrete for the player and continuous for everything else, and
got it by modelling each lane as one repeating pattern rather than as a list of
cars. Asteroids wanted a surface with no edges, so every distance test in it
goes through one function that knows the world wraps. The maze chase wanted four
independent pursuers, which is affordable only because an actor picks a
direction when it arrives at a tile and at no other moment.

## How it is meant to fit together

```
src/
  platform/   game.ts     The shell/game contract
              registry.ts The list of games
              loop.ts     Fixed-timestep driver, for games that want a clock
              save.ts     localStorage, namespaced per game
              audio.ts    WebAudio synthesis primitive
              rng.ts      Seeded random, so a soak can be replayed
              canvas.ts   Backing-store sizing, and client-to-world mapping
              touch.ts    Swipe, hold and tap recognisers. Behaviour, not look
              keyboardNav.ts  Arrow-key navigation for menus, tiles and sheets
  shell/      The hub page and the chrome around a running game
  games/
    snake/     Engine, renderer, skins, UI. Self-contained.
    tetris/    Engine, renderer, UI. Self-contained.
    2048/      Engine and UI. No renderer, because there is no canvas.
    breakout/  Engine, renderer, UI. Self-contained.
    sokoban/   Engine, levels, UI. DOM again, no canvas.
    missile/   Engine, renderer, UI. Tap to detonate, no d-pad anywhere.
    frogger/   Engine, lane tables, renderer, UI.
    asteroids/ Engine, renderer, UI. Wrapped world, floating-stick touch.
    mazechase/ Engine, maze, ghost AI, renderer, UI.
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
not ship inside every other game's bundle. Snake builds to its own 38 kB chunk;
open the hub and never click it and you never download it. All nine games come
to about ninety kilobytes of game code, and none of it is in the page a first
visitor loads.

Each game's saved data is namespaced by its registry id, so two games cannot
collide and one game's data can be dropped without touching another's.

Touch is a platform concern only where it has to be. The swipe threshold, the
diagonal tie-break and the fact that a held control must be released on four
different events are shared, because three copies of a recogniser will
eventually disagree about them and nobody will notice which one changed. What is
deliberately not shared is the look: a d-pad's colour, icons and grid belong to
the game drawing it.

## On a keyboard

The whole collection is playable without a mouse. Arrow keys move between the
tiles on the hub, between the modes on a game's menu, and between the actions on
whatever sheet is showing; Enter opens what is highlighted. The highlight is
deliberately loud, because the thing being selected is a piece of artwork rather
than a line of text and a hairline ring gets lost on it.

That is one hook, mounted once by the shell, and every surface opts in with a
`data-` attribute. Nine games own their own menus and overlays and the shell is
forbidden from importing any of them, so a marker in the DOM is the seam that
already exists rather than a new one.

It listens in the capture phase, which is the part worth knowing. Every game
registers its own window `keydown` in the bubble phase to move a piece, so
running first is what stops navigating a sheet from also steering the board
underneath it. The exception is a sheet with a single action: several games start
a run when a direction is pressed on the opening banner, so the arrows are only
claimed when there is a choice to make.

## On a phone

The playfield sizes itself against the visible viewport rather than the nominal
one, which matters more than it sounds: a mobile browser measures `100vh` with
its toolbars retracted, so a page built against it is taller than the box that
clips it and the bottom of every screen, exactly where the touch controls sit,
becomes unreachable with no scrollbar and no gesture to recover it.

Controls appear based on whether the device has a fine pointer, not on how wide
the window is. Width is the wrong question: it shows a d-pad to a laptop at
900px and hides one from a tablet at the same width.

Each game takes the input its shape actually calls for. Missile Command is a
single tap anywhere on the field, and the battery is chosen for you. Frogger
takes a swipe, and also a plain tap, because forward is most of what that game
asks for. The maze chase takes a swipe and remembers it until the corridor
allows the turn. Asteroids gets a floating stick under the left thumb that sets
a heading the ship still has to rotate towards, so anticipating your own turn
survives the port; the right half of the field fires, and the sides can be
swapped for left-handed players.

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
green. Missile Command is the same lesson twice over: a driver that fires every
tick simply empties the batteries and dies in the second wave, and every check
past the first minute goes untouched. Each soak prints a tally and asserts on
it, because a run that cleared no waves proves nothing about waves.

Where a property can be proved rather than sampled, it is, and that is the part
that has repaid the most. Sokoban's suite runs a breadth-first solver over every
authored level, so a level that cannot be finished fails the build instead of
being found by a player who spends twenty minutes proving it by hand. 2048
checks conservation: merging preserves the total and so does sliding, so the
board's sum can only change by the value of the tile that spawned, and almost
every way of getting the merge scan wrong breaks that equality on the first
move.

Frogger's lanes are repeating patterns, so how long a cell stays clear is
`gap / speed` and how long a raft covers it is `span / speed`. Checking those
two numbers across every mode and twenty levels is 660 lanes in microseconds,
and it found a raft that is rideable for only a third of a second at the top
speed. The maze chase floods the board from the player's start tile and asserts
every dot is reachable, which found two authored rows a character too long that
had quietly walled off half the maze. Neither would have surfaced in a soak as
anything but bad luck.

Asteroids gets a different kind of proof. Its world wraps, so the suite places a
bullet just inside one edge and a rock just inside the other and asserts they
collide. Random play almost never straddles that seam at the moment of a
collision, so a suite without this check would run green for a very long time
with the wrong distance function in it.

`smoke:ui` has two layers. The generic pass is driven by the registry: every
registered game must appear on the hub, mount when its card is clicked, and be
leavable. Deeper per-game flows live in `scripts/games/` keyed by registry id;
snake's plays a full run, pauses it, dies, restarts, and visits every mode, and
sokoban's drives the first level from its opening position to solved. A game
registered without a deep script still gets the generic pass, and the harness
says so out loud rather than reporting a pass that covered almost nothing.

Two of the generic checks exist for things that are otherwise invisible. Every
game must leave the hub running exactly as many animation frames as it found,
which catches a game loop outliving the component that started it; nothing looks
wrong when that happens, because the game is already gone. And every button must
be findable by name, on the menu and again in play, because nine games' worth of
icon-only pause and home buttons is precisely where an unlabelled control
appears.

What neither suite can check is anything about pixels. jsdom has no layout, so
hit-target sizes, `touch-action`, focus rings and how `dvh` behaves against a
retracting address bar are all beyond it. Those get checked on a phone or not at
all.
