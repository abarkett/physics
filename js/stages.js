/* =============================================================================
 * stages.js — The monograph, made executable.
 *
 * Each stage rebuilds the informational structure and tells the renderer how to
 * project it. The sequence deliberately starts at a universe of ZERO nodes and
 * grows one state at a time, so each emergent phenomenon — distinction, time,
 * geometry, π, mass, gravity, horizons — appears exactly when the structure is
 * rich enough to support it.
 * ========================================================================== */
(function (root) {
  'use strict';

  // Helpers used by builders. `app` exposes {graph, renderer, layout}.
  function ring(app, n, group) {
    const g = app.graph; g.clear();
    const R = 120;
    const ids = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ids.push(g.addNode({ x: Math.cos(a) * R, y: Math.sin(a) * R, group: group || 0 }).id);
    }
    for (let i = 0; i < n; i++) g.addEdge(ids[i], ids[(i + 1) % n], 1);
    return ids;
  }

  function cluster(app, cx, cy, n, group, link, spread) {
    const g = app.graph;
    const ids = [];
    const sp = spread != null ? spread : 80;
    for (let i = 0; i < n; i++) {
      ids.push(g.addNode({
        x: cx + (Math.random() - 0.5) * sp,
        y: cy + (Math.random() - 0.5) * sp,
        group: group || 0
      }).id);
    }
    // Densely interconnect (high informational density = mass).
    const p = link != null ? link : 0.6;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.random() < p) g.addEdge(ids[i], ids[j], 1 + Math.random());
    return ids;
  }

  const STAGES = [
    /* 0 ------------------------------------------------------------------- */
    {
      chapter: '0', title: 'Universe Zero', kicker: 'The Void',
      body: `No nodes. No states. No information.<br>Nothing exists — and no concept can even be defined. ` +
            `We do not begin with empty <em>space</em>; space is not yet meaningful. We begin with the absence of distinction itself.`,
      mode: 'void',
      metrics: ['states', 'bits'],
      build(app) { app.graph.clear(); app.renderer.flow = false; app.renderer.setCamera(0, 0, 1); }
    },
    /* 1 ------------------------------------------------------------------- */
    {
      chapter: '1', title: 'Universe One', kicker: 'Identity without Distinction',
      body: `A single informational state: <b>A</b>.<br>Identity exists — but distinction does not. ` +
            `There is nothing to compare it to. No change, no motion, no time, no geometry. Only existence.`,
      mode: 'graph',
      metrics: ['states', 'bits', 'distinction'],
      build(app) {
        app.graph.clear(); app.renderer.flow = false;
        app.graph.addNode({ label: 'A', x: 0, y: 0, group: 0, r: 12 });
        app.renderer.setCamera(0, 0, 1.6);
      }
    },
    /* 2 ------------------------------------------------------------------- */
    {
      chapter: '2', title: 'Universe Two', kicker: 'Distinction is Born',
      body: `Two states: <b>A</b> and <b>B</b>. For the first time <b>A ≠ B</b>. ` +
            `<em>Information now exists</em> — distinction is its smallest unit. Yet there is still no ordering, ` +
            `so there is still no time. Difference without sequence.`,
      mode: 'graph',
      metrics: ['states', 'bits', 'distinction'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = false;
        const a = g.addNode({ label: 'A', x: -90, y: 0, group: 0, r: 11 });
        const b = g.addNode({ label: 'B', x: 90, y: 0, group: 1, r: 11 });
        g.addEdge(a.id, b.id, 1);
        app.renderer.setCamera(0, 0, 1.5);
      }
    },
    /* 3 ------------------------------------------------------------------- */
    {
      chapter: '3', title: 'Universe Three', kicker: 'Adjacency makes Distance',
      body: `Three states: <b>A — B — C</b>. Adjacency now creates <em>distance</em> — not spatial, ` +
            `but informational. A and C are "far" only because they are weakly connected (two hops, not one). ` +
            `The first primitive geometry is born — from relationships, never from coordinates.`,
      mode: 'graph',
      metrics: ['states', 'bits', 'dist'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = false;
        const a = g.addNode({ label: 'A', x: -150, y: 0, group: 0, r: 11 });
        const b = g.addNode({ label: 'B', x: 0, y: 0, group: 2, r: 11 });
        const c = g.addNode({ label: 'C', x: 150, y: 0, group: 1, r: 11 });
        g.addEdge(a.id, b.id, 1); g.addEdge(b.id, c.id, 1);
        app.renderer.extra.distancePair = [a.id, c.id];
        app.renderer.setCamera(0, 0, 1.3);
      }
    },
    /* 4 -- time (fanout vs. the observer's linear slice) ------------------- */
    {
      chapter: '4', title: 'Information Creates Time', kicker: 'Fanout vs. the Observer Slice',
      body: `Underneath, the process is a <em>simultaneous fanout</em> — amplitude spreads along <b>every</b> adjacency at ` +
            `once (the soft pulses). That fanout is static and timeless. The bright dot is one <em>observer slice</em>: a single ` +
            `linear path sampled out of the fanout. <b>Time is not the fanout</b> — it is the observer's running count of ordered ` +
            `differences along its slice (the <b>clock</b>). No new distinction ⇒ no tick.`,
      mode: 'fanout',
      metrics: ['states', 'clock', 'steps'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        let prev = null, first = null;
        const N = 10;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          const n = g.addNode({ x: Math.cos(a) * 150, y: Math.sin(a) * 150, group: i % 6, label: String.fromCharCode(65 + i) });
          if (first === null) first = n.id;
          if (prev !== null) g.addEdge(prev, n.id, 1);
          prev = n.id;
        }
        g.addEdge(prev, first, 1);
        app.renderer.initField([first], { lazy: 0.55 });
        app.renderer.seedObservers(1, first);
        app.renderer.setCamera(0, 0, 1.1);
      }
    },
    /* 5 -- adjacency before space ---------------------------------------- */
    {
      chapter: '6', title: 'Adjacency before Space', kicker: 'The Map and the Territory',
      body: `Space is not fundamental — adjacency is. These positions carry no built-in meaning: they are ` +
            `continuously re-derived from the connectivity matrix by attraction and repulsion. ` +
            `<em>Connectivity is the territory; the layout you see is merely a map.</em> Drag a node — the geometry re-forms to honour the relationships.`,
      mode: 'graph', interactive: 'drag',
      metrics: ['states', 'edges', 'loops', 'components'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        // A small irregular network so the emergent layout is non-obvious.
        const ids = [];
        for (let i = 0; i < 12; i++) ids.push(g.addNode({ group: i % 6 }).id);
        const links = [[0,1],[1,2],[2,0],[2,3],[3,4],[4,5],[5,3],[5,6],[6,7],[7,8],[8,6],[8,9],[9,10],[10,11],[11,9],[1,6],[4,9]];
        for (const [a, b] of links) g.addEdge(ids[a], ids[b], 1);
        app.renderer.setCamera(0, 0, 1);
      }
    },
    /* 6 -- symmetry / sphere --------------------------------------------- */
    {
      chapter: '7', title: 'Symmetry projects as Shape', kicker: 'Invariance made Visible',
      body: `A ring is special because rotating it creates no new information — every direction is equivalent. ` +
            `We usually say "the circle has symmetry." Invert it: <em>symmetry projects as a circle.</em> ` +
            `Shapes are informational invariances made visible. Use <b>＋ / －</b> to change how much connectivity the symmetric loop encompasses — its <em>radius</em> is informational reach.`,
      mode: 'graph', interactive: 'closure-n',
      metrics: ['states', 'symmetry', 'radius'],
      build(app) {
        ring(app, app._closureN || 8, 1);
        app.renderer.flow = true;
        app.renderer.setCamera(0, 0, 1.2);
      }
    },
    /* 7 -- pi / closure --------------------------------------------------- */
    {
      chapter: '9', title: 'π and Informational Closure', kicker: 'An Invariant Revealed',
      body: `Whenever informational relations form a complete symmetric loop, π appears. For a closed loop of <b>n</b> ` +
            `states, perimeter ÷ diameter = <b>n · sin(π/n)</b>. Press <b>＋</b> and watch this <em>closure invariant</em> ` +
            `climb toward 3.14159… Geometry <em>reveals</em> π; it does not manufacture it. The same invariant governs ` +
            `circles, standing waves, and quantum phase.`,
      mode: 'closure', interactive: 'closure-n',
      metrics: ['states', 'closure', 'pi-error'],
      build(app) {
        ring(app, app._closureN || 6, 0);
        app.renderer.flow = true;
        app.renderer.setCamera(0, 0, 1.2);
      }
    },
    /* 8 -- flatland / wavefunction --------------------------------------- */
    {
      chapter: '4 · 10', title: 'Projection & the Wavefunction', kicker: 'Flatland',
      body: `We view Flatland — a 2D plane — <em>edge-on</em>, so it appears as the line. A static sphere drifts through it. ` +
            `The flatlander, trapped in the line, never sees a sphere or even a circle: he experiences only the slice — ` +
            `<em>a point that swells into a line and shrinks back to a point</em> (the filmstrip below). He records that sequence as <em>time</em>, ` +
            `yet nothing evolved. The wavefunction is likewise a static higher-dimensional structure; what moves is only the observer's slice. ` +
            `Collapse is a change of <em>perspective</em>, not of reality.`,
      mode: 'flatland',
      metrics: ['cross-section'],
      build(app) { app.graph.clear(); app.renderer.setCamera(0, 0, 1); }
    },
    /* 9 -- entanglement --------------------------------------------------- */
    {
      chapter: '12', title: 'Entanglement', kicker: 'Hidden Adjacency',
      body: `The two ψ states look far apart — the faint dashed line is their large <em>projected</em> separation. But the ` +
            `bright tube is a bridge through a higher dimension: it bows out of the plane and stays a short <b>1-hop throat</b> ` +
            `no matter how far you <b>drag</b> the mouths apart. They are distant in the projection yet <em>adjacent</em> in the ` +
            `structure. <b>Click either ψ</b> to measure it — its partner correlates instantly, because nothing ever crossed space.`,
      mode: 'graph', interactive: 'measure',
      metrics: ['projected', 'structural', 'hidden-links'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        // Two distant clusters, each with one "entangled" partner.
        const L = cluster(app, -260, 0, 4, 0, 0.5);
        const R = cluster(app, 260, 0, 4, 1, 0.5);
        const e = g.addEdge(L[0], R[0], 0.4);
        if (e) e.tag = 'entangled';
        g.get(L[0]).label = 'ψ₁'; g.get(R[0]).label = 'ψ₂';
        g.get(L[0]).tag = 'ent'; g.get(R[0]).tag = 'ent';
        app._entPair = [L[0], R[0]];
        app.renderer.setCamera(0, 0, 0.85);
      }
    },
    /* 9b -- light --------------------------------------------------------- */
    {
      chapter: '15', title: 'Light', kicker: 'A Direction with No Distinction',
      body: `Two observers traverse two chains. <b>Top</b> chain: every state is distinguishable, so each step is an ordered ` +
            `difference — the observer's clock ticks (proper time accrues). <b>Bottom</b> chain is a <em>symmetry direction</em>: ` +
            `its states are mutually <em>indistinguishable</em>, so moving along it adds no information — the clock never ticks. ` +
            `A photon rides such a direction: it accumulates <b>no proper time</b>. <em>c</em> is the projected face of that symmetry.`,
      mode: 'graph',
      metrics: ['clock-matter', 'clock-light'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = false;
        const N = 7, top = [], bot = [];
        for (let i = 0; i < N; i++) {           // distinguishable states (matter)
          top.push(g.addNode({ x: -300 + i * 100, y: -110, group: i % 6, cls: 't' + i, label: String.fromCharCode(65 + i) }).id);
        }
        for (let i = 0; i < N; i++) {           // indistinguishable states (light direction)
          bot.push(g.addNode({ x: -300 + i * 100, y: 120, group: 0, cls: 'L' }).id);
        }
        for (let i = 0; i < N - 1; i++) { g.addEdge(top[i], top[i + 1], 1); g.addEdge(bot[i], bot[i + 1], 1); }
        app.renderer.seedObservers(0, [top[0], bot[0]]);  // one observer per chain
        app.renderer.observers[0].obsSpeed = 1;
        app.renderer.extra.obsSpeed = 1.4;
        app.renderer.setCamera(0, 0, 1.0);
      }
    },
    /* 10 -- mass ---------------------------------------------------------- */
    {
      chapter: '16', title: 'Mass', kicker: 'Path Density · A → X → C',
      body: `Mass is not "stuff" — it is <em>path density</em>. Amplitude is injected at <b>A</b> and must fan through the dense ` +
            `subnetwork <b>X</b> to reach <b>C</b>. Inside X there are many <em>indistinguishable paths and loops</em>, so the fanout ` +
            `<b>dwells</b> there: amplitude piles up (watch X brighten) and only a trickle is delivered to C. ` +
            `<em>A region that holds this much path-structure in a small projection is what we call mass.</em>`,
      mode: 'mass', interactive: 'field-reset',
      metrics: ['amp-core', 'delivered', 'loops'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const A = g.addNode({ label: 'A', x: -360, y: 0, group: 0, r: 11 }).id;
        const C = g.addNode({ label: 'C', x: 360, y: 0, group: 1, r: 11 }).id;
        const X = cluster(app, 0, 0, 11, 4, 0.5, 220);   // dense subnetwork, spread out
        g.addEdge(A, X[0], 1); g.addEdge(A, X[1], 1);
        g.addEdge(C, X[X.length - 1], 1); g.addEdge(C, X[X.length - 2], 1);
        const core = new Set(X);
        app.renderer.initField([A], { source: A, sink: C, coreSet: core, lazy: 0.6, inject: 0.05, absorb: 0.5 });
        app.renderer.seedObservers(3, A);
        app._fieldCore = core;
        app.renderer.setCamera(0, 0, 0.92);
      }
    },
    /* 11 -- gravity ------------------------------------------------------- */
    {
      chapter: '17 · 18', title: 'Gravity', kicker: 'Path Multiplicity, not Force',
      body: `No force acts here. The fanout follows <b>every</b> continuation, so amplitude accumulates wherever there are ` +
            `<em>more</em> continuations. Its stationary occupancy is <b>∝ local degree</b> — so a uniform haze spontaneously ` +
            `condenses onto the dense region. Compare the readouts: the measured <b>occupancy at the mass</b> converges to its ` +
            `<b>share of the graph's paths</b>. "Attraction" is just a counting fact about paths.`,
      mode: 'gravity', interactive: 'field-reset',
      metrics: ['occ-core', 'deg-core', 'loops'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const core = cluster(app, 0, 0, 10, 4, 0.65, 180);     // the mass (dense)
        const web = [];
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          web.push(g.addNode({ x: Math.cos(a) * 330, y: Math.sin(a) * 330, group: 0 }).id);
        }
        for (let i = 0; i < web.length; i++) g.addEdge(web[i], web[(i + 1) % web.length], 1);
        for (let i = 0; i < web.length; i += 2) g.addEdge(web[i], core[i % core.length], 1);
        const cs = new Set(core);
        app.renderer.initField('uniform', { lazy: 0.6, coreSet: cs });
        app.renderer.seedObservers(2);
        app._fieldCore = cs;
        app.renderer.setCamera(0, 0, 0.8);
      }
    },
    /* 12 -- black hole ---------------------------------------------------- */
    {
      chapter: '19', title: 'Black Hole', kicker: 'Phase Transition · Locality Breaks',
      body: `A dense core is joined to the outside by only a few links — the <b>horizon</b>. Slide the <b>leak</b> toward 0 to ` +
            `throttle those outward continuations. Below a threshold a <em>phase transition</em> occurs: fanout that enters can no ` +
            `longer find its way out (<b>escape flux → 0</b>), amplitude is trapped, and the region becomes self-referential. ` +
            `<em>Not infinite density — a change of regime.</em> The observer slices that wander in cannot get back out.`,
      mode: 'blackhole', interactive: 'leak',
      metrics: ['amp-core', 'escape', 'leak', 'loops'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const core = cluster(app, 0, 0, 15, 5, 0.85, 150);     // very dense core at origin
        const s = g.addNode({ x: 0, y: 0, group: 5, r: 6, tag: 'singularity', pinned: true }).id;
        for (const id of core) if (Math.random() < 0.5) g.addEdge(s, id, 1.5);
        core.push(s);
        const web = [];
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          web.push(g.addNode({ x: Math.cos(a) * 350, y: Math.sin(a) * 350, group: 0 }).id);
        }
        for (let i = 0; i < web.length; i++) g.addEdge(web[i], web[(i + 1) % web.length], 1);
        // FEW links from the web to the core = the horizon (throttled by leak).
        g.addEdge(web[0], core[0], 1); g.addEdge(web[5], core[1], 1); g.addEdge(web[10], core[2], 1);
        const cs = new Set(core);
        const leak = app._leak != null ? app._leak : 0.05;
        app.renderer.initField('uniform', { lazy: 0.55, coreSet: cs, leak });
        app.renderer.seedObservers(4);
        app._fieldCore = cs;
        app.renderer.extra.horizon = 120;
        app.renderer.setCamera(0, 0, 0.8);
      }
    },
    /* 13 -- big bang ------------------------------------------------------ */
    {
      chapter: '21', title: 'The Big Bang', kicker: 'A Boundary, not a Beginning',
      body: `Just as a flatlander mistakes the sphere's first contact for its origin, we may mistake the earliest ` +
            `<em>accessible</em> informational boundary for the beginning of everything. The luminous frontier is ` +
            `the edge of our projection — the start of our perspective, not necessarily the start of reality.`,
      mode: 'bigbang',
      metrics: ['states', 'edges'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        // A fan of structure emanating from the boundary.
        let prevLayer = [g.addNode({ x: 0, y: 280, group: 4 }).id];
        for (let layer = 1; layer <= 4; layer++) {
          const cur = [];
          const count = layer + 1;
          for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 90;
            const id = g.addNode({ x: spread, y: 280 - layer * 110, group: layer % 6 }).id;
            cur.push(id);
            g.addEdge(prevLayer[Math.min(i, prevLayer.length - 1)], id, 1);
          }
          prevLayer = cur;
        }
        app.renderer.setCamera(0, -40, 0.85);
      }
    },
    /* 14 -- synthesis ----------------------------------------------------- */
    {
      chapter: '22 · 23', title: 'The Unified Picture', kicker: 'Information First',
      body: `Information is fundamental. Distinction emerges from it; time from change; geometry from connectivity; ` +
            `spacetime from geometry; mass from density; gravity from path multiplicity; horizons from loop dominance. ` +
            `The universe is not a process — <em>it is a structure</em>, whose shadows we read as the physical world. ` +
            `Enter the <b>Sandbox</b> to build your own informational universe and watch the metrics emerge.`,
      mode: 'graph',
      metrics: ['states', 'edges', 'loops', 'bits', 'density'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const c1 = cluster(app, -180, -60, 7, 1, 0.6);
        const c2 = cluster(app, 180, -40, 6, 2, 0.6);
        // a ring built in-place (NOT via ring(), which would clear the graph)
        const r = [];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          r.push(g.addNode({ x: Math.cos(a) * 120, y: 160 + Math.sin(a) * 120, group: 4 }).id);
        }
        for (let i = 0; i < 6; i++) g.addEdge(r[i], r[(i + 1) % 6], 1);
        // bridge the three regions
        g.addEdge(c1[0], r[0], 0.6);
        g.addEdge(c2[0], r[3], 0.6);
        app.renderer.setCamera(0, 0, 0.85);
      }
    }
  ];

  root.IF = root.IF || {};
  root.IF.STAGES = STAGES;
  root.IF._helpers = { ring, cluster };
})(window);
