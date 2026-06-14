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
| 4 | **Time** | Pulses traverse ordered differences — time as a *reading* of ordering. |
| 6 | **Adjacency before space** | Positions are re-derived live from the connectivity matrix. Drag a node. |
| 7 | **Symmetry → shape** | A symmetric loop *projects* as a circle. |
| 9 | **π & closure** | A closed loop's `n·sin(π/n)` visibly converges to π as you add states. |
| 4·10 | **Projection / wavefunction** | A static sphere crossing a plane fakes "time" (Flatland). |
| 12 | **Entanglement** | Hidden adjacency: measure one node, its partner correlates instantly. |
| 16 | **Mass** | Informational density — a dense knot of connectivity. |
| 17·18 | **Gravity** | Test particles bias toward density: path multiplicity, not force. |
| 19 | **Black hole** | A phase transition with a horizon that captures trajectories. |
| 21 | **Big Bang** | The earliest *accessible* boundary, not necessarily the beginning. |
| 22·23 | **Unified picture** | Synthesis → enter the Sandbox. |

Every number in the **Emergent Readout** (top right) is computed live from the
graph: distinction, information (bits), informational distance, independent
loops, density, the closure invariant, captured trajectories, and more.

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
- **`js/render.js`** — *the projection layer / the shadows.* Glowing nodes,
  adjacency lines, information pulses (time), gravitational test particles,
  the Flatland sphere, the closure→π overlay, and the black-hole horizon.
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
