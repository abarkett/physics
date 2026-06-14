# Information First — The Emergent Universe

An interactive simulation and graphical illustration of the speculative
framework *Information First*, in which **information is fundamental** and
space, time, geometry, matter, and gravity are all **emergent projections** of a
timeless informational structure.

The experience is built from the bottom up — exactly as requested — starting
from a universe of **zero** information nodes, then **one**, **two**, **three**,
and growing outward until the familiar phenomena of physics appear, each one
exactly when the underlying graph becomes rich enough to support it.

> The universe is not a process. The universe is a structure.

## Run it

It is a single, dependency-free static site. Either:

```bash
# option A — just open the file
open index.html        # (or double-click it)

# option B — serve it (nicer for some browsers)
npx http-server . -p 8080   # then visit http://localhost:8080
```

No build step, no frameworks, no network access required.

## What you'll see

A guided, chaptered journey (use **← →**, the dots, or **space** to play/pause),
plus a free-play **Sandbox** (press **S**) where you build your own
informational universe and watch the metrics emerge.

| Chapter | Phenomenon | What emerges, and how it's computed |
|--------:|------------|--------------------------------------|
| 0 | **The Void** | No states. No information. No concepts. |
| 1 | **Identity** | One node: existence without distinction. `bits = 0`. |
| 2 | **Distinction** | Two nodes → `A ≠ B`. Information is born. `bits = 1`. |
| 3 | **Adjacency → distance** | `A—B—C`. *Informational* distance = Σ(1/connectivity). |
| 4 | **Time** | A simultaneous **fanout** with one **observer slice** riding it; the slice's count of ordered differences is the **clock**. |
| 6 | **Adjacency before space** | Positions are re-derived live from the connectivity matrix. Drag a node. |
| 7 | **Symmetry → shape** | A symmetric loop *projects* as a circle. |
| 9 | **π & closure** | A closed loop's `n·sin(π/n)` visibly converges to π as you add states. |
| 4·10 | **Projection / wavefunction** | A static sphere, viewed edge-on, slices to a **point→line→point** segment that fakes "time" (Flatland). |
| 12 | **Entanglement** | Hidden adjacency drawn as a higher-dimensional **bridge**: short 1-hop throat however far you drag the mouths apart. |
| 15 | **Light** | Two observers; along a **symmetry direction** (indistinguishable states) the clock never ticks → no proper time. |
| 16 | **Mass** | Path density: amplitude injected at A must fan through a dense subnetwork X to reach C, and **dwells** there. |
| 17·18 | **Gravity** | The fanout's stationary occupancy is **∝ degree**; the readout shows measured occupancy converging to the mass's share of paths. **No force.** |
| 19 | **Black hole** | Throttle the **leak** on the core's outward edges → escape flux → 0; the fanout is trapped. A phase transition, not infinite density. |
| 21 | **Big Bang** | The earliest *accessible* boundary, not necessarily the beginning. |
| 22·23 | **Unified picture** | Synthesis → enter the Sandbox. |

Every number in the **Emergent Readout** (top right) is computed live from the
graph and the fanout: distinction, information (bits), informational distance,
independent loops, the closure invariant, the observer clock, occupancy vs.
degree-share, escape flux, and more.

### Information First ⇄ Classical

Most chapters carry a **toggle** (top of the narrative panel, or press **C**)
that switches the canvas between the information-first view and the *textbook*
**GR / QM / Newtonian** picture, drawn with traditional, non-graph
visualizations so you can contrast them directly:

| Chapter | Classical view |
|---|---|
| Time | Newtonian absolute timeline + uniform clock |
| Adjacency before space | Fixed Cartesian coordinate grid |
| Symmetry / π | A continuous Euclidean circle (`C = 2πr`, π given) |
| Wavefunction | A Schrödinger wave packet evolving + collapsing |
| Entanglement | A Bell pair separating in real space ("spooky action") |
| Light | A Minkowski **light cone**, `ds²=0 ⇒ dτ=0` |
| Mass | A solid body with `E = mc²` |
| Gravity | The GR **rubber-sheet** well with an orbiting body |
| Black hole | A Schwarzschild **funnel** + horizon at `r_s = 2GM/c²` |
| Big Bang | An **expanding** ΛCDM universe from a singularity |

### The rules it obeys

The engine is built on an explicit set of information-first axioms — see
[`PRINCIPLES.md`](./PRINCIPLES.md). The short version: **nothing may appeal to
pre-existing space, force, or time.** The one fundamental process is a
**simultaneous fanout** on the graph (amplitude shared among every adjacency at
once — the static wavefunction). A single linear trajectory is *not*
fundamental; it is only an observer's projected slice of that fanout. From this
one operator, mass & gravity fall out as `occupancy ∝ degree` (path
multiplicity, no force), black holes as a trapping phase transition, and an
observer's time as the count of ordered differences along its slice.

## How the framework maps to the code

The project deliberately mirrors the monograph's central inversion
(`Information → Relationships → Geometry → Spacetime → Matter`):

- **`js/graph.js`** — *the territory.* Distinguishable states (nodes) and
  adjacency relations (edges). All "fundamental" quantities live here:
  informational distance (Dijkstra on `1/weight`), independent loop count
  (`E − V + components`), and density (the mass proxy). Spatial coordinates are
  treated as *emergent*, not given.
- **`js/graph.js → ForceLayout`** — *adjacency projected into space.* Node
  positions are continuously re-derived from connectivity by spring + repulsion
  forces, literally implementing "adjacency before space."
- **`js/field.js → FanoutField`** — *the one fundamental process.* The
  simultaneous fanout operator on the graph; its stationary distribution ∝
  degree gives mass/gravity, and a throttled core gives black holes.
- **`js/render.js`** — *the projection layer / the shadows.* Glowing nodes (mass
  = pooled amplitude), fanout flux pulses, **observer slices**, the entanglement
  bridge, the Flatland slice + filmstrip, the closure→π overlay, the horizon.
- **`js/stages.js`** — *the monograph, made executable.* Each chapter rebuilds
  the structure one step richer than the last.
- **`js/main.js`** — controller: narrative, live metric HUD, interactions, sandbox.

## Verification

The engine and every stage builder are covered by headless checks (graph
metrics, the π-closure convergence, force-layout stability, and clean
construction of all stages); the full page was rendered and exercised with a
headless browser with zero console errors.

---

*This is a speculative-physics art/visualization piece, not a peer-reviewed
physical theory. It is meant to make the ideas in the framework tangible,
explorable, and beautiful.*
