/* =============================================================================
 * field.js — The fanout operator (THE fundamental process).
 *
 * Per PRINCIPLES.md R4/R11: the underlying process is a SIMULTANEOUS FANOUT —
 * amplitude at each state is shared among ALL its adjacent continuations every
 * step, at once. This is the static sum-over-continuations (the wavefunction).
 *
 *   next[v] = lazy·f[v] + (1−lazy)·Σ_{u~v} f[u]/deg(u)
 *
 * Key facts this engine makes literal (no force anywhere):
 *   • stationary occupancy ∝ degree            → MASS & GRAVITY (R10/R11)
 *   • throttling edges leaving a dense core     → BLACK HOLE (R12)
 *   • a single sampled path + distinct-count    → an OBSERVER'S TIME (R4/R5)
 * ========================================================================== */
(function (root) {
  'use strict';

  class FanoutField {
    constructor(graph) {
      this.g = graph;
      this.f = new Map();        // nodeId -> amplitude
      this.adj = new Map();      // nodeId -> [neighborIds]
      this.flux = new Map();     // "a_b" -> amplitude crossing this step
      this.delivered = 0;        // absorbed at sink (mass A->C demo)
      this.escape = 0;           // amplitude leaving the core this step (BH)
      this.build();
    }

    build() {
      this.adj.clear();
      for (const n of this.g.nodes) this.adj.set(n.id, []);
      for (const e of this.g.edges) {
        if (this.adj.has(e.a) && this.adj.has(e.b)) {
          this.adj.get(e.a).push(e.b);
          this.adj.get(e.b).push(e.a);
        }
      }
    }

    deg(id) { const a = this.adj.get(id); return a ? a.length : 0; }

    reset(init) {
      this.f.clear();
      this.delivered = 0;
      const nodes = this.g.nodes;
      if (!nodes.length) return;
      if (init === 'uniform') {
        const v = 1 / nodes.length;
        for (const n of nodes) this.f.set(n.id, v);
      } else if (Array.isArray(init)) {            // point source(s)
        const v = 1 / init.length;
        for (const id of init) this.f.set(id, v);
      } else {                                      // random seed
        for (const n of nodes) this.f.set(n.id, Math.random());
        this.normalize();
      }
    }

    normalize() {
      let s = 0; for (const v of this.f.values()) s += v;
      if (s > 0) for (const [k, v] of this.f) this.f.set(k, v / s);
    }

    /* One fanout step. opts:
     *   lazy   : fraction kept in place (slows the visual)            [0.6]
     *   source : nodeId continuously re-injected (open system)
     *   sink   : nodeId that absorbs (counts as "delivered")
     *   coreSet: Set of nodeIds forming a dense core
     *   leak   : share multiplier on edges LEAVING the core (BH)      [1 = open]
     */
    step(opts) {
      opts = opts || {};
      const lazy = opts.lazy != null ? opts.lazy : 0.6;
      const coreSet = opts.coreSet || null;
      const leak = opts.leak != null ? opts.leak : 1;
      const open = (opts.source != null || opts.sink != null);

      const next = new Map();
      for (const n of this.g.nodes) next.set(n.id, 0);
      this.flux.clear();
      this.escape = 0;

      for (const n of this.g.nodes) {
        const u = n.id;
        const fu = this.f.get(u) || 0;
        if (fu <= 1e-9) continue;
        const nb = this.adj.get(u) || [];
        next.set(u, (next.get(u) || 0) + fu * lazy);
        const moving = fu * (1 - lazy);
        if (nb.length === 0) { next.set(u, (next.get(u) || 0) + moving); continue; }

        // Per-continuation shares. The ONLY asymmetry allowed: a dense core may
        // have throttled OUTWARD continuations (few external paths) → R12.
        let shares = nb, tot = nb.length;
        if (coreSet && leak !== 1 && coreSet.has(u)) {
          shares = nb.map(v => coreSet.has(v) ? 1 : leak);
          tot = shares.reduce((a, b) => a + b, 0);
        } else {
          shares = nb.map(() => 1);
          tot = nb.length;
        }
        for (let i = 0; i < nb.length; i++) {
          const v = nb[i];
          const amt = moving * shares[i] / tot;
          next.set(v, (next.get(v) || 0) + amt);
          const key = u < v ? u + '_' + v : v + '_' + u;
          this.flux.set(key, (this.flux.get(key) || 0) + amt);
          if (coreSet && coreSet.has(u) && !coreSet.has(v)) this.escape += amt;
        }
      }

      this.f = next;

      if (opts.source != null) {
        const inj = opts.inject != null ? opts.inject : 0.03;
        this.f.set(opts.source, (this.f.get(opts.source) || 0) + inj);
      }
      if (opts.sink != null) {
        const got = this.f.get(opts.sink) || 0;
        const absorb = opts.absorb != null ? opts.absorb : 0.5;
        this.delivered += got * absorb;
        this.f.set(opts.sink, got * (1 - absorb));
      }
      if (!open) this.normalize();   // closed system conserves total amplitude
    }

    amp(id) { return this.f.get(id) || 0; }
    max() { let m = 0; for (const v of this.f.values()) if (v > m) m = v; return m || 1e-9; }

    // Sum of amplitude over a set of nodes (fraction of total).
    massIn(set) {
      let inSet = 0, all = 0;
      for (const [k, v] of this.f) { all += v; if (set.has(k)) inSet += v; }
      return all > 0 ? inSet / all : 0;
    }

    // Share of total degree held by a set — the value the fanout pools toward.
    degreeShare(set) {
      let inSet = 0, all = 0;
      for (const n of this.g.nodes) { const d = this.deg(n.id); all += d; if (set.has(n.id)) inSet += d; }
      return all > 0 ? inSet / all : 0;
    }
  }

  root.IF = root.IF || {};
  root.IF.FanoutField = FanoutField;
})(window);
