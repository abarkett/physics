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

  // Map t∈[0,1] to a hex colour along a cyan→magenta gradient (graph-distance shells).
  function hslHex(t) {
    const h = (190 + t * 150) / 360, s = 0.75, l = 0.62;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = x => { if (x < 0) x += 1; if (x > 1) x -= 1; if (x < 1 / 6) return p + (q - p) * 6 * x; if (x < 1 / 2) return q; if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6; return p; };
    const hx = v => ('0' + Math.round(v * 255).toString(16)).slice(-2);
    return '#' + hx(f(h + 1 / 3)) + hx(f(h)) + hx(f(h - 1 / 3));
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
      body: `Two states, <b>A</b> and <b>B</b>, joined by one adjacency. For the first time <b>A ≠ B</b>, so information exists — ` +
            `a single <b>bit</b>. Yet there is still no time. The link is <em>symmetric</em>: "A is next to B" is the very same fact ` +
            `as "B is next to A" — swap the labels and nothing changes. So the step <b>A→B is indistinguishable from B→A</b>: there is ` +
            `no first and second, no ordering, and therefore no time. <em>Distinction, but no direction.</em>`,
      mode: 'graph',
      metrics: ['states', 'bits', 'no-order'],
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
      chapter: '3', title: 'Universe Three', kicker: 'Distance — and the Seed of Time',
      body: `Three states, <b>A — B — C</b> — now ≈<b>1.58 bits</b> of distinction, plus a new structural fact. Two things appear at ` +
            `once. First <em>distance</em>: A and C are "far" (two hops) only because they are weakly connected. Second, the symmetry ` +
            `<b>breaks</b> — B is now distinguishable as the <em>middle</em> (two links) from the <em>ends</em> A and C (one link each). ` +
            `That asymmetry is what finally lets us <b>order</b> them into a line, A→B→C: the seed of sequence, and so the seed of ` +
            `<em>time</em> — which the next chapter turns into a clock.`,
      mode: 'graph',
      metrics: ['states', 'bits', 'dist', 'ordering'],
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
      body: `Take the ordering that first appeared in Universe Three and let the structure grow. Underneath, the process is a ` +
            `<em>simultaneous fanout</em> — amplitude spreads along <b>every</b> adjacency at once (the soft pulses), and is itself ` +
            `static and timeless. The bright dot is one <em>observer slice</em>: a single ordered path sampled out of the fanout. ` +
            `<b>Time is not the fanout</b> — it is the observer's running count of ordered differences along its slice (the <b>clock</b>). ` +
            `No new distinction ⇒ no tick.`,
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
    /* 5 -- adjacency before space (a lattice reconstructs 2-D space) ------- */
    {
      chapter: '6', title: 'Adjacency before Space', kicker: 'The Map and the Territory',
      body: `Here is the claim made literal. This lattice has <b>no built-in positions</b> — only a record of which states are ` +
            `<em>adjacent</em>. Press <b>Scramble</b> and the connections alone pull it back into a coherent 2-D space. The colour is ` +
            `pure <em>graph distance</em> from one corner, yet it settles into neat spatial shells: <b>near in connections becomes ` +
            `near in space.</b> Adjacency is the territory; space is only the map it draws.`,
      mode: 'graph', interactive: 'scramble',
      metrics: ['states', 'edges', 'dim'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true; app.renderer.extra.guides = null;
        const W = 6, H = 6, ids = [];
        for (let i = 0; i < W; i++) for (let j = 0; j < H; j++)
          ids.push(g.addNode({ x: (Math.random() - 0.5) * 520, y: (Math.random() - 0.5) * 520 }).id);
        const at = (i, j) => ids[i * H + j];
        for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
          if (i < W - 1) g.addEdge(at(i, j), at(i + 1, j), 1);
          if (j < H - 1) g.addEdge(at(i, j), at(i, j + 1), 1);
        }
        // tint each node by its graph distance (hops) from the corner
        const origin = at(0, 0);
        let maxd = 1; const dist = {};
        for (const id of ids) { const d = g.informationalDistance(origin, id) || 0; dist[id] = d; if (d > maxd) maxd = d; }
        for (const id of ids) g.get(id).tint = hslHex(dist[id] / maxd);
        app._lattice = ids;
        app.renderer.setCamera(0, 0, 0.82);
      }
    },
    /* 6 -- symmetry: rotation adds no information ------------------------- */
    {
      chapter: '7', title: 'Symmetry projects as Shape', kicker: 'Rotation adds no Information',
      body: `Here is the very same <b>space</b> from before — the faint grid. Drop a <b>symmetric ring</b> into it and let it ` +
            `<b>rotate</b>. Every rotation carries the ring exactly onto itself, so the description of the whole system — grid plus ` +
            `ring — is identical before and after: rotating it <b>adds 0 bits</b> of information, and the space is completely unchanged. ` +
            `(The amber marker is extra information we painted on just to make the motion visible — it isn't part of the symmetric object.)`,
      mode: 'graph',
      metrics: ['ring-symmetry', 'rot-info', 'space-state'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = false;
        // The space from Chapter 6: a clean, pinned grid rendered as a faint backdrop.
        const W = 6, H = 6, gap = 78, ox = -(W - 1) * gap / 2, oy = -(H - 1) * gap / 2, lat = [];
        for (let i = 0; i < W; i++) for (let j = 0; j < H; j++)
          lat.push(g.addNode({ x: ox + i * gap, y: oy + j * gap, pinned: true, dim: true, tint: '#3a4e76', r: 4 }).id);
        const at = (i, j) => lat[i * H + j];
        for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
          if (i < W - 1) g.addEdge(at(i, j), at(i + 1, j), 1);
          if (j < H - 1) g.addEdge(at(i, j), at(i, j + 1), 1);
        }
        // A symmetric ring placed inside that space.
        const n = 8, R = gap * 1.75, ids = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          ids.push(g.addNode({ x: Math.cos(a) * R, y: Math.sin(a) * R, group: 1, pinned: true, r: 8 }).id);
        }
        for (let i = 0; i < n; i++) g.addEdge(ids[i], ids[(i + 1) % n], 2.6);
        g.get(ids[0]).tint = '#ffd27c';                 // the visible marker (extra info)
        app._symIds = ids; app._symN = n; app._symR = R;
        app.renderer.extra.guides = [{ type: 'circle', x: 0, y: 0, r: R, label: 'the ring maps onto itself' }];
        app.renderer.setCamera(0, 0, 1.0);
      },
      update(app) {
        const ids = app._symIds; if (!ids) return;
        const n = app._symN, R = app._symR, ang = app.renderer.time * 0.0006;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2 + ang, node = app.graph.get(ids[i]);
          if (node) { node.x = Math.cos(a) * R; node.y = Math.sin(a) * R; }
        }
      }
    },
    /* 6b -- radius / informational extent -------------------------------- */
    {
      chapter: '8', title: 'Radius & Informational Extent', kicker: 'Same Symmetry, Different Reach',
      body: `Two rings, both perfectly rotationally symmetric — yet plainly different. Symmetry can't be the difference; ` +
            `<em>both possess it equally.</em> What differs is <b>informational extent</b>: how many states, how much connectivity, ` +
            `the loop encompasses. <b>That</b> is what radius really measures — <em>reach</em>, before it is ever a length. ` +
            `Use <b>＋ / －</b> to grow the outer ring's extent; its symmetry type never changes.`,
      mode: 'graph', interactive: 'extent',
      metrics: ['sym-both', 'extent-inner', 'extent-outer'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const inN = 6, outN = app._extN || 14, inR = 95, outR = 215;
        const inner = [], outer = [];
        for (let i = 0; i < inN; i++) { const a = (i / inN) * Math.PI * 2 - Math.PI / 2; inner.push(g.addNode({ x: Math.cos(a) * inR, y: Math.sin(a) * inR, group: 1, pinned: true }).id); }
        for (let i = 0; i < outN; i++) { const a = (i / outN) * Math.PI * 2 - Math.PI / 2; outer.push(g.addNode({ x: Math.cos(a) * outR, y: Math.sin(a) * outR, group: 3, pinned: true }).id); }
        for (let i = 0; i < inN; i++) g.addEdge(inner[i], inner[(i + 1) % inN], 1);
        for (let i = 0; i < outN; i++) g.addEdge(outer[i], outer[(i + 1) % outN], 1);
        app._extInner = inner; app._extOuter = outer; app._extInR = inR; app._extOutR = outR; app._extN = outN;
        app.renderer.extra.guides = [
          { type: 'circle', x: 0, y: 0, r: inR, label: 'reach: ' + inN + ' states' },
          { type: 'circle', x: 0, y: 0, r: outR, label: 'reach: ' + outN + ' states' }
        ];
        app.renderer.setCamera(0, 0, 0.92);
      },
      update(app) {
        const ang = app.renderer.time * 0.0005;
        const rot = (ids, R, dir) => { const n = ids.length; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2 + ang * dir, node = app.graph.get(ids[i]); if (node) { node.x = Math.cos(a) * R; node.y = Math.sin(a) * R; } } };
        if (app._extInner) rot(app._extInner, app._extInR, 1);
        if (app._extOuter) rot(app._extOuter, app._extOutR, -1);
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
      chapter: '19', title: 'Black Hole', kicker: 'Collapse · A Phase Transition',
      body: `Start with an ordinary cluster wired to the rest of the universe — <b>no horizon</b>. Now <b>add internal ` +
            `connections</b> (or <b>nodes</b>) to the core. Each one raises the share of continuations that stay <em>inside</em>. ` +
            `Watch the escape probability fall: when internal continuations <em>dominate</em> external ones, the region <b>collapses</b> ` +
            `— a horizon snaps into being, escape flux → 0, and the fanout can no longer get out. <em>The horizon is emergent, not built in.</em>`,
      mode: 'blackhole', interactive: 'collapse',
      metrics: ['phase', 'p-escape', 'ratio', 'escape'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const core = cluster(app, 0, 0, 12, 5, 0.14, 240);   // ordinary, loosely-connected core
        const web = [];
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          web.push(g.addNode({ x: Math.cos(a) * 360, y: Math.sin(a) * 360, group: 0 }).id);
        }
        for (let i = 0; i < web.length; i++) g.addEdge(web[i], web[(i + 1) % web.length], 1);
        // A handful of external links (these stay fixed; collapse comes from inside).
        g.addEdge(web[0], core[0], 1); g.addEdge(web[5], core[1], 1);
        g.addEdge(web[10], core[2], 1); g.addEdge(web[13], core[3], 1);
        const cs = new Set(core);
        app.renderer.initField('uniform', { lazy: 0.55, coreSet: cs });  // NO leak — trapping emerges
        app.renderer.seedObservers(4);
        app._fieldCore = cs; app._bhCore = cs;
        app.renderer.extra.horizon = 0;             // no horizon yet
        app.renderer.extra.horizonCenter = { x: 0, y: 0 };
        app._bh = { internal: 0, external: 4, p: 1, collapsed: false };
        app.renderer.setCamera(0, 0, 0.8);
      },
      update(app) {
        const g = app.graph, cs = app._bhCore; if (!cs) return;
        let internal = 0, external = 0, cx = 0, cy = 0, k = 0;
        for (const e of g.edges) {
          const a = cs.has(e.a), b = cs.has(e.b);
          if (a && b) internal++; else if (a || b) external++;
        }
        for (const id of cs) { const n = g.get(id); if (n) { cx += n.x; cy += n.y; k++; } }
        if (k) { cx /= k; cy /= k; }
        // Escape probability of a fanout step taken from inside the core.
        const ends = 2 * internal + external;
        const p = ends > 0 ? external / ends : 1;
        const collapsed = p <= 0.09;               // internal continuations dominate
        app._bh = { internal, external, p, collapsed };
        // Horizon radius from the (contracting) core extent — eases in/out.
        let R = 0;
        for (const id of cs) { const n = g.get(id); if (n) R = Math.max(R, Math.hypot(n.x - cx, n.y - cy)); }
        const target = collapsed ? R + 45 : 0;
        const cur = app.renderer.extra.horizon || 0;
        app.renderer.extra.horizon = cur + (target - cur) * 0.07;
        app.renderer.extra.horizonCenter = { x: cx, y: cy };
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
      chapter: '22 · 23', title: 'The Unified Picture', kicker: 'One Structure, Many Shadows',
      body: `One universe, one process. The fanout pools into <b>masses</b>; two of them are collapsed <b>black holes</b> with ` +
            `emergent horizons (amplitude trapped inside). The hexagonal <b>symmetric regions</b> are loops where states are ` +
            `equivalent — observer slices circulate there forever without accumulating distinction: <em>light</em>. Sparser ` +
            `space bridges it all. Every phenomenon here is the same graph + fanout. <em>The universe is a structure, not a process.</em> ` +
            `Now open the <b>Sandbox</b> and build your own.`,
      mode: 'universe',
      metrics: ['states', 'loops', 'horizons', 'occ-mass'],
      build(app) {
        const g = app.graph; g.clear(); app.renderer.flow = true;
        const horizons = [];        // collapsed cores → drawn horizons
        const massCores = [];       // all dense cores (for occupancy metric)

        // Two collapsed black holes: dense cores with very few external links.
        const bh = (cx, cy) => {
          const core = cluster(app, cx, cy, 11, 5, 0.9, 150);
          massCores.push(...core);
          horizons.push({ core, cx, cy });
          return core;
        };
        const bh1 = bh(-330, -120);
        const bh2 = bh(300, 150);

        // A symmetric region = a clean ring of indistinguishable states (light).
        const ringIds = [];
        const rcx = 40, rcy = -180, rR = 110;
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
          ringIds.push(g.addNode({ x: rcx + Math.cos(a) * rR, y: rcy + Math.sin(a) * rR, group: 0, cls: 'L' }).id);
        }
        for (let i = 0; i < 9; i++) g.addEdge(ringIds[i], ringIds[(i + 1) % 9], 1);

        // An ordinary (uncollapsed) mass.
        const lump = cluster(app, -40, 140, 8, 1, 0.5, 160);
        massCores.push(...lump);

        // Sparse space connecting everything.
        const space = [];
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          space.push(g.addNode({ x: Math.cos(a) * 470, y: Math.sin(a) * 470, group: 2 }).id);
        }
        for (let i = 0; i < space.length; i++) g.addEdge(space[i], space[(i + 1) % space.length], 1);
        // bridge regions into the cosmic web (few links each)
        g.addEdge(space[1], bh1[0], 1); g.addEdge(space[9], bh2[0], 1);
        g.addEdge(space[4], ringIds[0], 1); g.addEdge(space[6], lump[0], 1);
        g.addEdge(space[13], lump[1], 1);

        const mass = new Set(massCores);
        app.renderer.initField('uniform', { lazy: 0.6 });
        app.renderer.seedObservers(6);
        // one observer dedicated to the light ring, to show perpetual circulation
        app.renderer.observers[0].from = ringIds[0];
        app.renderer.observers[0].to = ringIds[1];
        app._fieldMass = mass;
        app._uniHorizons = horizons;
        app.renderer.extra.horizons = horizons.map(h => ({ x: h.cx, y: h.cy, r: 0 }));
        app.renderer.setCamera(0, 0, 0.62);
      },
      update(app) {
        const hs = app._uniHorizons; if (!hs) return;
        const g = app.graph;
        app.renderer.extra.horizons = hs.map(h => {
          let cx = 0, cy = 0, k = 0, R = 0;
          for (const id of h.core) { const n = g.get(id); if (n) { cx += n.x; cy += n.y; k++; } }
          if (k) { cx /= k; cy /= k; }
          for (const id of h.core) { const n = g.get(id); if (n) R = Math.max(R, Math.hypot(n.x - cx, n.y - cy)); }
          return { x: cx, y: cy, r: R + 40 };
        });
      }
    }
  ];

  /* ---------------------------------------------------------------------------
   * CLASSICAL counterparts. Attached to stages that have a meaningful textbook
   * GR / QM / Newtonian picture, so the user can toggle and contrast. These use
   * TRADITIONAL visualisations (no graphs) drawn by the renderer's classic modes.
   * ------------------------------------------------------------------------- */
  const CLASSIC = {
    'Information Creates Time': {
      badge: 'Newtonian · absolute time', mode: 'classic-time',
      body: `In the classical picture, <b>time is a given</b>: a universal external parameter <em>t</em> that flows uniformly and ` +
            `identically for every observer. Change happens <em>within</em> time. Here time is the stage, not something that emerges — ` +
            `the exact inversion of the information-first view.`,
      readout: [{ k: 'Model', v: 'Newtonian', sub: 'time is fundamental' }, { k: 'Clock', v: 't', sub: 'absolute, universal' }]
    },
    'Adjacency before Space': {
      badge: 'Newtonian · absolute space', mode: 'classic-space',
      body: `Classically, <b>space is a fixed coordinate stage</b>. Every object sits at absolute coordinates (x, y, z); distance is ` +
            `read straight off the grid. Space exists first and contains the things — the opposite of "adjacency before space."`,
      readout: [{ k: 'Model', v: 'Euclidean ℝ³', sub: 'space is a container' }, { k: 'Distance', v: '√Σ(Δx)²', sub: 'from coordinates' }]
    },
    'Symmetry projects as Shape': {
      badge: 'Euclidean geometry', mode: 'classic-circle',
      body: `Classically a <b>circle is a primitive continuous object</b> — the set of points equidistant from a center. Its symmetry ` +
            `is a property it simply <em>has</em>. Shape is given; it does not emerge from informational invariance.`,
      readout: [{ k: 'Object', v: 'circle', sub: 'continuous, primitive' }, { k: 'Symmetry', v: 'O(2)', sub: 'a given property' }]
    },
    'Radius & Informational Extent': {
      badge: 'Euclidean geometry', mode: 'classic-circle',
      body: `Classically, <b>radius is just a length</b> — a number of metres from the centre, read off pre-existing space. ` +
            `It has nothing to do with information or how much structure a region contains; the circle and its radius are simply given.`,
      readout: [{ k: 'Radius', v: 'r', sub: 'a length in given space' }, { k: 'Symmetry', v: 'O(2)', sub: 'independent of r' }]
    },
    'π and Informational Closure': {
      badge: 'Euclidean geometry', mode: 'classic-circle',
      body: `Classically <b>π is just the ratio</b> of a circle's circumference to its diameter — a fixed constant of continuous ` +
            `geometry, <em>C = 2πr</em>, taken as given rather than emerging from closure of a discrete structure.`,
      readout: [{ k: 'π', v: '3.14159…', sub: 'a given constant' }, { k: 'Circle', v: 'C = 2πr', sub: 'exact, continuous' }]
    },
    'Projection & the Wavefunction': {
      badge: 'Quantum Mechanics', mode: 'classic-wave',
      body: `In standard QM the <b>wavefunction genuinely evolves in time</b> by the Schrödinger equation — a packet that moves and ` +
            `spreads — and <b>measurement collapses it</b> as a real, dynamical event. Time and change are built in, not projected.`,
      readout: [{ k: 'Law', v: 'iħ∂ψ/∂t = Ĥψ', sub: 'unitary evolution' }, { k: 'Measurement', v: 'collapse', sub: 'a dynamical event' }]
    },
    'Entanglement': {
      badge: 'Quantum Mechanics', mode: 'classic-entangle',
      body: `Textbook QM keeps the particles <b>genuinely far apart in space</b> and accepts <b>non-local correlations</b> — measuring ` +
            `one instantly fixes the other ("spooky action at a distance"). The distance is real; the link is a mystery, not a hidden adjacency.`,
      readout: [{ k: 'State', v: '|↑↓⟩ − |↓↑⟩', sub: 'Bell pair' }, { k: 'Correlation', v: 'non-local', sub: 'across real distance' }]
    },
    'Light': {
      badge: 'Special Relativity', mode: 'classic-light',
      body: `In relativity, light travels the <b>null cone</b>: <em>ds² = 0</em>, so a photon's <b>proper time is zero</b> via the ` +
            `Minkowski metric. <em>c</em> is a postulated invariant speed — the structure of spacetime itself, taken as given.`,
      readout: [{ k: 'Metric', v: 'ds² = −c²dt² + dx²', sub: 'Minkowski' }, { k: 'Photon', v: 'dτ = 0', sub: 'on the null cone' }]
    },
    'Mass': {
      badge: 'Classical mechanics', mode: 'classic-mass',
      body: `Classically, <b>mass is a primitive quantity</b> of matter/energy — a number attached to a body (<em>E = mc²</em>). ` +
            `It is what it is; it does not emerge from how much structure is packed into a region.`,
      readout: [{ k: 'Mass', v: 'm', sub: 'a primitive quantity' }, { k: 'Energy', v: 'E = mc²', sub: 'matter ↔ energy' }]
    },
    'Gravity': {
      badge: 'General Relativity', mode: 'classic-gravity',
      body: `General relativity says <b>mass-energy curves spacetime</b>, and free bodies follow the <b>geodesics</b> of that curvature ` +
            `(the rubber-sheet picture). Gravity is geometry — but spacetime is the fundamental thing being bent, not an emergent projection.`,
      readout: [{ k: 'Law', v: 'Gμν = 8πTμν', sub: 'Einstein field eqn' }, { k: 'Motion', v: 'geodesic', sub: 'of curved spacetime' }]
    },
    'Black Hole': {
      badge: 'General Relativity', mode: 'classic-blackhole',
      body: `The Schwarzschild solution: curvature runs away to a <b>singularity</b>, with an <b>event horizon</b> at ` +
            `<em>r_s = 2GM/c²</em> where escape velocity exceeds <em>c</em>. The horizon is a feature of the spacetime metric, fixed by mass alone.`,
      readout: [{ k: 'Horizon', v: 'r_s = 2GM/c²', sub: 'Schwarzschild radius' }, { k: 'Interior', v: 'singularity', sub: 'curvature → ∞' }]
    },
    'The Big Bang': {
      badge: 'ΛCDM cosmology', mode: 'classic-bigbang',
      body: `Standard cosmology: <b>space itself expands</b> from an initial singularity about <b>13.8 billion years ago</b>; galaxies ` +
            `recede and redshift (Hubble's law). The Big Bang is a real beginning of space and time, not merely the edge of our access.`,
      readout: [{ k: 'Model', v: 'ΛCDM', sub: 'expanding space' }, { k: 'Age', v: '≈ 13.8 Gyr', sub: 'since the singularity' }]
    }
  };
  for (const s of STAGES) if (CLASSIC[s.title]) s.classic = CLASSIC[s.title];

  root.IF = root.IF || {};
  root.IF.STAGES = STAGES;
  root.IF._helpers = { ring, cluster };
})(window);
