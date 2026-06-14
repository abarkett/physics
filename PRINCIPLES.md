# Information-First — Engine Principles

These are the rules the simulation must obey. Every chapter is an illustration
of one or more of them. Nothing in the engine may appeal to pre-existing space,
force, or time: those must *emerge*. If a scene needs a "force" or a
continuous-space trajectory to work, it is wrong and must be rebuilt.

## The substrate

- **R1 — Substrate.** Reality is a graph `G`: distinguishable **states** (nodes)
  and **adjacency** relations (edges). Nothing else is fundamental.
- **R2 — Information = distinction.** With ≥ 2 states, distinction exists;
  information is just the presence of distinguishable states (`bits ≈ log₂ N`).
- **R3 — Distance = adjacency.** "Close" = strongly / few-hops connected; "far"
  = weakly / many-hops. Informational distance is graph distance. Spatial
  coordinates are a *map* re-derived from adjacency; they are never inputs.

## Process, observers, time

- **R4 — Fanout is fundamental; traversal is the projection.** The underlying
  process is a **simultaneous fanout**: from any state, amplitude spreads along
  *every* adjacency at once (a static sum-over-continuations — the wavefunction).
  A single **linear trajectory** is *not* fundamental — it is what one observer's
  restricted slice samples out of the fanout. (This is the answer to
  "linear vs fanout": **fanout underneath, linear on top, as projection.**)
- **R5 — Time = ordered accumulation of distinction.** An observer's time is the
  count of *new distinguishable states* encountered along its sampled slice. No
  new distinction ⇒ no time. Time is not a backdrop; it is a reading.
- **R6 — Observer = restricted access.** An observer integrates only a limited
  neighborhood / low-dimensional slice of `G`. All apparent "dynamics" are the
  slice moving through a *static* structure.
- **R7 — Projection makes the static look dynamic.** Slicing a static higher
  structure yields apparent birth, growth, death, branching, and collapse
  (Flatland, wavefunction, beam-splitter). Collapse/branching = change of slice,
  not change of reality.

## Geometry

- **R8 — Symmetry ⇒ shape.** A transformation that creates no new distinction is
  a symmetry and *projects* as a regular shape. Radius = informational reach.
- **R9 — π = closure invariant.** A closed symmetric loop of `n` states has
  perimeter/diameter `= n·sin(π/n) → π`. Geometry *reveals* π; it doesn't make it.

## Matter, gravity, horizons (all from path multiplicity)

- **R10 — Mass = informational/path density.** A massive region is a dense
  subnetwork: many states, many edges, many **loops** → many indistinguishable
  internal paths packed into a small projection.
- **R11 — Gravity = path multiplicity, not force.** Because the fanout follows
  every continuation, amplitude accumulates where there are *more continuations*.
  The stationary occupancy of the fanout on a graph is **∝ local degree** — so
  it pools at dense regions with **no force**: there are simply more ways to be
  there. "Attraction" is a counting fact about paths.
- **R12 — Black hole = phase transition.** When a subnetwork's *internal*
  continuations overwhelm its *external* ones, fanout that enters effectively
  cannot leave (escape flux → 0); locality breaks and the region becomes
  self-referential. The boundary where this flips is the horizon. Not infinite
  density — a change of regime.
- **R13 — Light = a symmetry direction with zero distinction.** Moving along a
  direction of states that are mutually *indistinguishable* accumulates no new
  information, hence no proper time. `c` is the projected face of that direction.

## Cosmology / constants

- **R14 — Big Bang = accessible boundary, not origin.** It is the earliest edge
  of *our* slice, like a flatlander mistaking the sphere's first contact for a
  beginning.
- **R15 — Constants are invariants.** `c, h, G, π` are invariants of the
  structure, not external dials.

## The single computational primitive

Everything dynamic in the engine is the **fanout operator** on `G`:

```
fanout: amplitude at each state is shared equally among its adjacent
        continuations, every step, simultaneously.
        next[v] = lazy·f[v] + (1−lazy)·Σ_{u~v} f[u]/deg(u)
```

- Its **stationary distribution ∝ degree** ⇒ **mass & gravity (R10/R11)** with no
  force.
- **Throttling the edges that leave a dense core** (few external continuations)
  traps the fanout ⇒ **black holes (R12)**.
- A **single sampled path** through the same operator, with a counter of distinct
  states, is the **observer's time (R4/R5)** — shown as the linear slice riding
  on top of the fanout.

If a chapter cannot be expressed through these rules, the chapter is wrong.
