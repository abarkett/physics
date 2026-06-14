/* =============================================================================
 * graph.js — The informational substrate.
 *
 * In this framework reality is NOT space containing things. It is a set of
 * distinguishable states (nodes) and adjacency relations among them (edges).
 * Everything visual downstream — distance, geometry, time, mass, gravity — is
 * computed from THIS structure. This file is the "territory"; the renderer
 * draws a "map" of it.
 * ========================================================================== */
(function (root) {
  'use strict';

  let _nextId = 1;

  class Node {
    constructor(opts) {
      opts = opts || {};
      this.id = opts.id != null ? opts.id : _nextId++;
      this.label = opts.label != null ? opts.label : '';
      this.group = opts.group != null ? opts.group : 0;
      // Spatial PROJECTION coordinates. These are emergent, not fundamental —
      // they are produced by the force layout from adjacency alone.
      this.x = opts.x != null ? opts.x : (Math.random() - 0.5) * 40;
      this.y = opts.y != null ? opts.y : (Math.random() - 0.5) * 40;
      this.vx = 0;
      this.vy = 0;
      this.fx = opts.fx != null ? opts.fx : null; // pinned x (optional)
      this.fy = opts.fy != null ? opts.fy : null;
      this.r = opts.r != null ? opts.r : 7;        // visual radius
      this.pinned = !!opts.pinned;
      this.born = performance.now();               // for spawn animation
      this.state = opts.state != null ? opts.state : 0; // for entanglement demo
      this.tag = opts.tag || null;                 // 'horizon', 'singularity'...
    }
  }

  class Edge {
    constructor(a, b, weight) {
      this.a = a;                       // node id
      this.b = b;                       // node id
      this.weight = weight != null ? weight : 1; // connectivity strength
      this.born = performance.now();
      this.flow = Math.random();        // phase of the information pulse
    }
    // Informational distance is the INVERSE of connectivity: strongly
    // connected states are "close"; weakly connected states are "far".
    get length() { return 1 / this.weight; }
  }

  class Graph {
    constructor() {
      this.nodes = [];
      this.edges = [];
      this._index = new Map();
    }

    clear() {
      this.nodes.length = 0;
      this.edges.length = 0;
      this._index.clear();
      return this;
    }

    get(id) { return this._index.get(id); }

    addNode(opts) {
      const n = new Node(opts);
      this.nodes.push(n);
      this._index.set(n.id, n);
      return n;
    }

    addEdge(aId, bId, weight) {
      if (aId === bId) return null;
      if (!this._index.has(aId) || !this._index.has(bId)) return null;
      if (this.findEdge(aId, bId)) return null;
      const e = new Edge(aId, bId, weight);
      this.edges.push(e);
      return e;
    }

    findEdge(aId, bId) {
      for (const e of this.edges) {
        if ((e.a === aId && e.b === bId) || (e.a === bId && e.b === aId)) return e;
      }
      return null;
    }

    removeNode(id) {
      const i = this.nodes.findIndex(n => n.id === id);
      if (i >= 0) this.nodes.splice(i, 1);
      this._index.delete(id);
      this.edges = this.edges.filter(e => e.a !== id && e.b !== id);
    }

    neighbors(id) {
      const out = [];
      for (const e of this.edges) {
        if (e.a === id) out.push(e.b);
        else if (e.b === id) out.push(e.a);
      }
      return out;
    }

    degree(id) {
      let d = 0;
      for (const e of this.edges) if (e.a === id || e.b === id) d++;
      return d;
    }

    /* --- Emergent metrics --------------------------------------------------
     * These are the quantities the framework claims are FUNDAMENTAL or
     * primitive, derived purely from the graph. The HUD displays them live. */

    // Distinction: do two states differ at all? Information requires >= 2 nodes.
    get hasDistinction() { return this.nodes.length >= 2; }

    // A crude "information content" in bits: log2 of distinguishable states.
    get bits() {
      const n = this.nodes.length;
      return n <= 1 ? 0 : Math.log2(n);
    }

    // Shortest informational distance between two nodes (Dijkstra on 1/weight).
    informationalDistance(aId, bId) {
      if (aId === bId) return 0;
      const dist = new Map();
      const visited = new Set();
      for (const n of this.nodes) dist.set(n.id, Infinity);
      dist.set(aId, 0);
      while (true) {
        let u = null, best = Infinity;
        for (const [id, d] of dist) {
          if (!visited.has(id) && d < best) { best = d; u = id; }
        }
        if (u == null) break;
        if (u === bId) return best;
        visited.add(u);
        for (const e of this.edges) {
          let v = null;
          if (e.a === u) v = e.b; else if (e.b === u) v = e.a; else continue;
          if (visited.has(v)) continue;
          const nd = best + e.length;
          if (nd < dist.get(v)) dist.set(v, nd);
        }
      }
      const d = dist.get(bId);
      return d === Infinity ? null : d;
    }

    // Count of independent loops (cycles): E - V + components. Loops are the
    // engine of "path multiplicity" → gravity and black holes.
    get loopCount() {
      const comps = this.componentCount();
      return Math.max(0, this.edges.length - this.nodes.length + comps);
    }

    componentCount() {
      const seen = new Set();
      let comps = 0;
      for (const n of this.nodes) {
        if (seen.has(n.id)) continue;
        comps++;
        const stack = [n.id];
        while (stack.length) {
          const u = stack.pop();
          if (seen.has(u)) continue;
          seen.add(u);
          for (const v of this.neighbors(u)) if (!seen.has(v)) stack.push(v);
        }
      }
      return comps;
    }

    // Informational density near a point in the projection (mass proxy):
    // total degree-weighted node presence within a radius.
    densityAt(x, y, radius) {
      let d = 0;
      const r2 = radius * radius;
      for (const n of this.nodes) {
        const dx = n.x - x, dy = n.y - y;
        const q = dx * dx + dy * dy;
        if (q < r2) d += (1 + this.degree(n.id)) * (1 - q / r2);
      }
      return d;
    }
  }

  /* ===========================================================================
   * ForceLayout — adjacency PROJECTED into space.
   * The framework's claim "adjacency before space" is literally implemented
   * here: positions carry no fundamental meaning; they are continuously
   * re-derived from the connectivity matrix by spring + repulsion forces.
   * ========================================================================*/
  class ForceLayout {
    constructor(graph, opts) {
      this.g = graph;
      opts = opts || {};
      this.repulsion = opts.repulsion != null ? opts.repulsion : 1400;
      this.spring = opts.spring != null ? opts.spring : 0.04;
      this.restLength = opts.restLength != null ? opts.restLength : 80;
      this.damping = opts.damping != null ? opts.damping : 0.86;
      this.center = opts.center != null ? opts.center : 0.0009;
      this.maxV = opts.maxV != null ? opts.maxV : 12;
    }

    step(dt) {
      const g = this.g;
      const nodes = g.nodes;
      // Pairwise repulsion (states resist coinciding — distinction in space).
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) { d2 = 0.01; dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
          const f = this.repulsion / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }
      // Springs along edges — rest length scales with informational distance.
      for (const e of g.edges) {
        const a = g.get(e.a), b = g.get(e.b);
        if (!a || !b) continue;
        const rest = this.restLength * e.length;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const f = this.spring * (d - rest);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
      // Gentle pull to origin so the structure stays framed.
      for (const n of nodes) {
        n.vx -= n.x * this.center;
        n.vy -= n.y * this.center;
      }
      // Integrate.
      for (const n of nodes) {
        if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
        n.vx *= this.damping; n.vy *= this.damping;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > this.maxV) { n.vx = (n.vx / sp) * this.maxV; n.vy = (n.vy / sp) * this.maxV; }
        n.x += n.vx; n.y += n.vy;
      }
    }
  }

  root.IF = root.IF || {};
  root.IF.Node = Node;
  root.IF.Edge = Edge;
  root.IF.Graph = Graph;
  root.IF.ForceLayout = ForceLayout;
})(window);
