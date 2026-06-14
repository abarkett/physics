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

  function cluster(app, cx, cy, n, group, link) {
    const g = app.graph;
    const ids = [];
    for (let i = 0; i < n; i++) {
      ids.push(g.addNode({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 80,
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
    /* 4 -- time ----------------------------------------------------------- */
    {
      chapter: '4', title: 'Information Creates Time', kicker: 'Ordered Difference',
      body: `Every measurement of time requires change; every change requires distinguishable states. ` +
            `So <b>Information → Change → Time</b>, never the reverse. Watch the pulses: each is the traversal of an ` +
            `ordered difference. <em>Time is the observer's reading of that ordering</em> — not a fundamental backdrop.`,
      mode: 'graph',
      metrics: ['states', 'edges', 'bits'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        let prev = null, first = null;
        const N = 7;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          const n = g.addNode({ x: Math.cos(a) * 140, y: Math.sin(a) * 140, group: i % 6, label: String.fromCharCode(65 + i) });
          if (first === null) first = n.id;
          if (prev !== null) g.addEdge(prev, n.id, 1);
          prev = n.id;
        }
        g.addEdge(prev, first, 1);
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
      body: `A sphere drifts through a plane. From outside, nothing evolves — the object is static. ` +
            `But the flatlander, who only ever sees the cross-section, swears something was <em>born, grew, and died in time.</em> ` +
            `The wavefunction is likewise a static higher-dimensional structure; what changes is only the observer's slice of access. ` +
            `Collapse is a change of <em>perspective</em>, not of reality.`,
      mode: 'flatland',
      metrics: ['cross-section'],
      build(app) { app.graph.clear(); app.renderer.setCamera(0, 0, 1); }
    },
    /* 9 -- entanglement --------------------------------------------------- */
    {
      chapter: '12', title: 'Entanglement', kicker: 'Hidden Adjacency',
      body: `Two states sit far apart in the spatial projection, yet a dashed link shows they remain <em>adjacent</em> ` +
            `in the underlying structure. <b>Click either one</b> to "measure" it: its partner correlates instantly — ` +
            `nothing travelled across space, because in the territory they were never apart. ` +
            `Entanglement reveals adjacency the projection hides.`,
      mode: 'graph', interactive: 'measure',
      metrics: ['states', 'hidden-links'],
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
    /* 10 -- mass ---------------------------------------------------------- */
    {
      chapter: '16', title: 'Mass', kicker: 'Informational Density',
      body: `Mass is not "stuff." A massive region is one where a great deal of informational structure is packed ` +
            `into a small projection — many states, many adjacencies. The bright dense knot here carries far more ` +
            `connectivity than the sparse surroundings. <em>Mass is informational complexity made visible.</em>`,
      mode: 'graph',
      metrics: ['states', 'edges', 'density'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        cluster(app, 0, 0, 14, 4, 0.7);            // the massive knot
        // sparse halo
        const halo = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          halo.push(g.addNode({ x: Math.cos(a) * 280, y: Math.sin(a) * 280, group: 0 }).id);
        }
        for (let i = 0; i < halo.length; i++) g.addEdge(halo[i], halo[(i + 1) % halo.length], 1);
        app.renderer.setCamera(0, 0, 0.9);
      }
    },
    /* 11 -- gravity ------------------------------------------------------- */
    {
      chapter: '17 · 18', title: 'Gravity', kicker: 'Path Multiplicity, not Force',
      body: `Release test particles into the field. They are not "pulled" — a dense informational region simply offers ` +
            `<em>more paths, more loops, more equivalent continuations</em>, so trajectories become statistically biased toward it. ` +
            `What we call gravitational attraction is the topology of information. ` +
            `Tune the coupling <b>G</b> below and watch the bias strengthen.`,
      mode: 'gravity', interactive: 'gravity',
      metrics: ['density', 'G', 'captured'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        cluster(app, 0, 0, 12, 4, 0.75);
        app.renderer.extra.G = app._G != null ? app._G : 60;
        app.renderer.extra.horizon = 0;
        app.renderer.seedParticles(160, 700);
        app.renderer.setCamera(0, 0, 0.85);
      }
    },
    /* 12 -- black hole ---------------------------------------------------- */
    {
      chapter: '19', title: 'Black Hole', kicker: 'An Informational Phase Transition',
      body: `Push the density higher and a <em>phase transition</em> occurs. Loops multiply, indistinguishable paths ` +
            `multiply, and internal continuations begin to dominate external ones. Locality breaks: the graph stops ` +
            `behaving like an open network and becomes self-referential. The glowing ring is that boundary — ` +
            `<em>the horizon is not infinite density, it is where the information folds inward.</em> Particles that cross cannot return.`,
      mode: 'blackhole', interactive: 'gravity',
      metrics: ['density', 'G', 'captured', 'loops'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const core = cluster(app, 0, 0, 18, 5, 0.95);
        // a singular core node
        const s = g.addNode({ x: 0, y: 0, group: 5, r: 6, tag: 'singularity', pinned: true });
        for (const id of core) if (Math.random() < 0.5) g.addEdge(s.id, id, 1.5);
        app.renderer.extra.G = app._G != null ? Math.max(app._G, 120) : 150;
        app.renderer.extra.horizon = 95;
        app.renderer.seedParticles(200, 750);
        app.renderer.setCamera(0, 0, 0.85);
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
