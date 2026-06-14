/* =============================================================================
 * main.js — Application controller.
 * Wires the graph, force layout, renderer, the staged narrative, the live
 * metric HUD, per-stage interactions, and a free-play sandbox together.
 * ========================================================================== */
(function (root) {
  'use strict';

  const IF = root.IF;

  const App = {
    graph: null, layout: null, renderer: null,
    stageIndex: 0, playing: true, sandbox: false, classicView: false,
    _closureN: 6, _G: 60, _entPair: null,
    _last: 0, _drag: null,

    init() {
      this.canvas = document.getElementById('scene');
      this.graph = new IF.Graph();
      this.layout = new IF.ForceLayout(this.graph);
      this.renderer = new IF.Renderer(this.canvas, this.graph);

      this._cacheDom();
      this._bindUI();
      this._bindCanvas();
      window.addEventListener('resize', () => this.renderer.resize());

      this.gotoStage(0);
      requestAnimationFrame(t => this._loop(t));
    },

    _cacheDom() {
      this.el = {
        chapter: document.getElementById('chapter'),
        kicker: document.getElementById('kicker'),
        title: document.getElementById('title'),
        body: document.getElementById('body'),
        metrics: document.getElementById('metrics'),
        dots: document.getElementById('dots'),
        prev: document.getElementById('prev'),
        next: document.getElementById('next'),
        play: document.getElementById('play'),
        sandboxBtn: document.getElementById('sandboxBtn'),
        controls: document.getElementById('stageControls'),
        progressNum: document.getElementById('progressNum'),
        hint: document.getElementById('hint'),
        viewToggle: document.getElementById('viewToggle')
      };
      this.el.vtBtns = [...this.el.viewToggle.querySelectorAll('.vt-btn')];
      // progress dots
      IF.STAGES.forEach((s, i) => {
        const d = document.createElement('button');
        d.className = 'dot';
        d.title = s.title;
        d.addEventListener('click', () => this.gotoStage(i));
        this.el.dots.appendChild(d);
      });
    },

    _bindUI() {
      this.el.prev.addEventListener('click', () => this.gotoStage(this.stageIndex - 1));
      this.el.next.addEventListener('click', () => this.gotoStage(this.stageIndex + 1));
      this.el.play.addEventListener('click', () => {
        this.playing = !this.playing;
        this.el.play.textContent = this.playing ? '❚❚ Pause' : '▶ Play';
      });
      this.el.sandboxBtn.addEventListener('click', () => this.toggleSandbox());
      this.el.vtBtns.forEach(b => b.addEventListener('click', () => this.setView(b.dataset.view === 'classic')));
      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowRight') this.gotoStage(this.stageIndex + 1);
        else if (e.key === 'ArrowLeft') this.gotoStage(this.stageIndex - 1);
        else if (e.key.toLowerCase() === 'c') this.setView(!this.classicView);
        else if (e.key === ' ') { e.preventDefault(); this.el.play.click(); }
        else if (e.key.toLowerCase() === 's') this.toggleSandbox();
      });
    },

    gotoStage(i) {
      if (this.sandbox) this.toggleSandbox(false);
      i = Math.max(0, Math.min(IF.STAGES.length - 1, i));
      this.stageIndex = i;
      this._applyStage();
    },

    setView(classic) {
      this.classicView = !!classic;
      if (!this.sandbox) this._applyStage();
    },

    // Build the current stage in either the information-first or classical view.
    _applyStage() {
      const i = this.stageIndex, s = IF.STAGES[i];
      const useClassic = this.classicView && !!s.classic;
      const view = useClassic ? s.classic : s;

      this.renderer.mode = view.mode;
      this.renderer.extra = {};
      this.renderer.observers = [];
      this.renderer.field = null;
      this.renderer.flow = true;
      this._fieldCore = null; this._fieldMass = null;
      this._bh = null; this._bhCore = null; this._uniHorizons = null;

      if (useClassic) { this.graph.clear(); if (view.build) view.build(this); }
      else s.build(this);

      this.el.chapter.textContent = 'Chapter ' + s.chapter;
      this.el.kicker.textContent = useClassic ? (view.badge || 'Classical') : s.kicker;
      this.el.title.textContent = s.title;
      this.el.body.innerHTML = useClassic ? view.body : s.body;
      this.el.progressNum.textContent = (i + 1) + ' / ' + IF.STAGES.length;
      [...this.el.dots.children].forEach((d, k) => d.classList.toggle('active', k === i));
      this.el.prev.disabled = i === 0;
      this.el.next.disabled = i === IF.STAGES.length - 1;

      // toggle visibility + active state
      this.el.viewToggle.hidden = !s.classic;
      this.el.vtBtns.forEach(b => b.classList.toggle('active',
        (b.dataset.view === 'classic') === useClassic));

      this._buildControls(useClassic ? {} : s);
      this._setHint(useClassic ? {} : s);
    },

    // (no shared force knobs anymore — the fanout is the only process)
    _syncShared() {},

    _setHint(s) {
      const map = {
        drag: 'Tip: drag any node — the layout re-derives geometry from adjacency.',
        'closure-n': 'Tip: use ＋ / － to add or remove states in the loop.',
        measure: 'Tip: drag a ψ node — the bridge stays a 1-hop throat. Click ψ to measure.',
        'field-reset': 'Tip: press Reset to release the fanout again from scratch.',
        scramble: 'Tip: press Scramble — the connections rebuild space from chaos.',
        collapse: 'Tip: add internal links / nodes until the core collapses into a black hole.'
      };
      this.el.hint.textContent = this.sandbox
        ? 'Sandbox: click empty space to add a state · click two nodes to link them · drag to move.'
        : (map[s.interactive] || '');
      this.el.hint.style.opacity = this.el.hint.textContent ? '1' : '0';
    },

    /* ----- per-stage interactive controls -------------------------------- */
    _buildControls(s) {
      const c = this.el.controls;
      c.innerHTML = '';
      if (this.sandbox) {
        this._addButton(c, 'Clear', () => { this.graph.clear(); });
        this._addButton(c, 'Add 5 random', () => this._sandboxRandom(5));
        return;
      }
      if (s.interactive === 'closure-n') {
        const refresh = () => {
          s.build(this);
          const lab = document.getElementById('nLabel');
          if (lab) lab.textContent = 'n = ' + this._closureN;
        };
        this._addButton(c, '－', () => { this._closureN = Math.max(3, this._closureN - 1); refresh(); });
        this._addLabel(c, 'n = ' + this._closureN, 'nLabel');
        this._addButton(c, '＋', () => { this._closureN = Math.min(64, this._closureN + 1); refresh(); });
      }
      if (s.interactive === 'scramble') {
        this._addButton(c, '⤮ Scramble', () => this._scramble());
      }
      if (s.interactive === 'field-reset') {
        this._addButton(c, '↺ Reset fanout', () => s.build(this));
      }
      if (s.interactive === 'collapse') {
        this._addButton(c, '+ internal links', () => this._bhAddLinks(6));
        this._addButton(c, '+ node', () => this._bhAddNode());
        this._addButton(c, '↺ Reset', () => s.build(this));
      }
    },

    // Add internal edges among the black-hole core (raises internal continuations).
    _bhAddLinks(k) {
      const cs = this._bhCore; if (!cs) return;
      const ids = [...cs];
      let added = 0, tries = 0;
      while (added < k && tries < 400) {
        tries++;
        const a = ids[(Math.random() * ids.length) | 0], b = ids[(Math.random() * ids.length) | 0];
        if (a !== b && !this.graph.findEdge(a, b)) { this.graph.addEdge(a, b, 1); added++; }
      }
      if (this.renderer.field) this.renderer.field.build();   // refresh fanout adjacency
    },

    // Add a node wired densely into the core.
    _bhAddNode() {
      const cs = this._bhCore; if (!cs) return;
      const ids = [...cs];
      let cx = 0, cy = 0;
      for (const id of ids) { const n = this.graph.get(id); cx += n.x; cy += n.y; }
      cx /= ids.length; cy /= ids.length;
      const node = this.graph.addNode({ x: cx + (Math.random() - 0.5) * 120, y: cy + (Math.random() - 0.5) * 120, group: 5 });
      cs.add(node.id);
      const shuffled = ids.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(6, shuffled.length); i++) this.graph.addEdge(node.id, shuffled[i], 1);
      if (this.renderer.field) this.renderer.field.build();
    },

    // Randomise lattice positions so the user can watch space re-form (Ch 6).
    _scramble() {
      const ids = this._lattice || this.graph.nodes.map(n => n.id);
      for (const id of ids) {
        const n = this.graph.get(id);
        if (n) { n.x = (Math.random() - 0.5) * 560; n.y = (Math.random() - 0.5) * 560; n.vx = 0; n.vy = 0; }
      }
    },

    _addButton(parent, label, fn) {
      const b = document.createElement('button');
      b.className = 'ctl'; b.textContent = label;
      b.addEventListener('click', fn); parent.appendChild(b); return b;
    },
    _addLabel(parent, text, id) {
      const s = document.createElement('span'); s.className = 'ctl-label'; s.id = id; s.textContent = text;
      parent.appendChild(s); return s;
    },

    /* ----- canvas interaction (drag / measure / sandbox) ----------------- */
    _bindCanvas() {
      const cv = this.canvas;
      const pos = e => {
        const r = cv.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        return this.renderer.screenToWorld(cx, cy);
      };
      const pick = w => {
        let best = null, bd = 24 / this.renderer.cam.zoom;
        for (const n of this.graph.nodes) {
          const d = Math.hypot(n.x - w.x, n.y - w.y);
          if (d < bd) { bd = d; best = n; }
        }
        return best;
      };

      const down = e => {
        const w = pos(e);
        const n = pick(w);
        const stage = IF.STAGES[this.stageIndex];
        if (this.sandbox) {
          if (n) {
            if (this._linkFrom && this._linkFrom !== n.id) {
              this.graph.addEdge(this._linkFrom, n.id, 1); this._linkFrom = null;
            } else { this._linkFrom = n.id; this._drag = n; }
          } else {
            const node = this.graph.addNode({ x: w.x, y: w.y, group: this.graph.nodes.length % 6 });
            this._linkFrom = null;
            this._drag = node;
          }
          return;
        }
        if (stage.interactive === 'measure' && n && n.tag === 'ent') { this._measure(n); return; }
        if (n) this._drag = n;
      };
      const move = e => {
        if (!this._drag) return;
        const w = pos(e);
        this._drag.x = w.x; this._drag.y = w.y; this._drag.vx = 0; this._drag.vy = 0;
        e.preventDefault();
      };
      const up = () => { this._drag = null; };

      cv.addEventListener('mousedown', down);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      cv.addEventListener('touchstart', down, { passive: false });
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
    },

    _measure(node) {
      if (!this._entPair) return;
      const [a, b] = this._entPair;
      const na = this.graph.get(a), nb = this.graph.get(b);
      const val = node.state === 1 ? 0 : 1;
      na.state = (node.id === a) ? val : (1 - val);
      nb.state = (node.id === b) ? val : (1 - val);
      // pulse the hidden link
      const e = this.graph.findEdge(a, b); if (e) e.flow = 0;
    },

    _sandboxRandom(k) {
      const ids = this.graph.nodes.map(n => n.id);
      for (let i = 0; i < k; i++) {
        const n = this.graph.addNode({ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300, group: this.graph.nodes.length % 6 });
        if (ids.length) this.graph.addEdge(n.id, ids[(Math.random() * ids.length) | 0], 1);
        ids.push(n.id);
      }
    },

    toggleSandbox(force) {
      const want = force != null ? force : !this.sandbox;
      this.sandbox = want;
      this.el.sandboxBtn.classList.toggle('active', want);
      this.el.sandboxBtn.textContent = want ? '✦ Exit Sandbox' : '✦ Sandbox';
      if (want) {
        this.renderer.mode = 'graph'; this.renderer.flow = true; this.renderer.extra = {};
        this.renderer.observers = []; this.renderer.field = null;
        this.el.viewToggle.hidden = true;
        this.graph.clear();
        this.el.chapter.textContent = 'Free Play';
        this.el.kicker.textContent = 'Build an Informational Universe';
        this.el.title.textContent = 'Sandbox';
        this.el.body.innerHTML = 'Click empty space to add a distinguishable <b>state</b>. Click one node then another to ' +
          'create an <b>adjacency</b>. Drag to move. The metrics on the right are computed live from the structure you build — ' +
          'distinction, information, loops, gravity-bearing density. <em>Watch geometry and physics emerge from nothing but relationships.</em>';
        this.renderer.setCamera(0, 0, 1);
        this._buildControls({});
        this._setHint({});
      } else {
        this.gotoStage(this.stageIndex);
      }
    },

    /* ----- live metric HUD ----------------------------------------------- */
    _updateMetrics() {
      const g = this.graph, r = this.renderer;
      const rows = [];
      const add = (k, v, sub) => rows.push({ k, v, sub });

      if (this.sandbox) {
        add('States', g.nodes.length, 'distinguishable');
        add('Adjacencies', g.edges.length, 'relations');
        add('Information', g.bits.toFixed(2), 'bits  (log₂ states)');
        add('Independent loops', g.loopCount, 'path multiplicity');
        add('Components', g.componentCount(), 'disconnected regions');
        const dens = g.densityAt(0, 0, 220).toFixed(1);
        add('Central density', dens, 'mass proxy');
        this._renderMetrics(rows); return;
      }

      const s = IF.STAGES[this.stageIndex];
      // Classical view shows a fixed readout of the textbook law.
      if (this.classicView && s.classic) {
        this._renderMetrics((s.classic.readout || []).map(r => ({ k: r.k, v: r.v, sub: r.sub })));
        return;
      }
      const want = s.metrics || [];
      for (const m of want) {
        switch (m) {
          case 'states': add('States', g.nodes.length, 'distinguishable'); break;
          case 'edges': add('Adjacencies', g.edges.length, 'relations'); break;
          case 'bits': add('Information', g.bits.toFixed(2), 'bits  (log₂ states)'); break;
          case 'distinction': add('Distinction', g.hasDistinction ? 'YES' : '—', g.hasDistinction ? 'information exists' : 'nothing to compare'); break;
          case 'no-order': add('Ordering', 'none', 'A→B ≡ B→A — no time yet'); break;
          case 'ordering': add('Ordering', 'A→B→C', 'middle ≠ ends ⇒ a line'); break;
          case 'dist': {
            const p = r.extra.distancePair;
            const d = p ? g.informationalDistance(p[0], p[1]) : null;
            add('Info distance A↔C', d == null ? '∞' : d.toFixed(2), '= Σ (1 / connectivity)');
            break;
          }
          case 'loops': add('Independent loops', g.loopCount, 'path multiplicity'); break;
          case 'components': add('Components', g.componentCount(), 'connected regions'); break;
          case 'symmetry': add('Rotational symmetry', 'C' + g.nodes.length, g.nodes.length + '-fold invariance'); break;
          case 'dim': add('Emergent dimension', '≈ 2', 'reconstructed from adjacency'); break;
          case 'rot-info': add('Info from rotation', '0 bits', 'ring maps onto itself'); break;
          case 'ring-symmetry': add('Ring symmetry', 'C' + (this._symN || 8), 'rotational invariance'); break;
          case 'space-state': add('Space (the grid)', 'unchanged', 'rotation adds nothing'); break;
          case 'radius': add('Informational reach', g.nodes.length + ' states', 'encompassed by the loop'); break;
          case 'closure': {
            const n = g.nodes.length;
            const v = n >= 3 ? (n * Math.sin(Math.PI / n)) : 0;
            add('Closure  n·sin(π/n)', v.toFixed(5), 'perimeter ÷ diameter');
            break;
          }
          case 'pi-error': {
            const n = g.nodes.length;
            const v = n >= 3 ? (n * Math.sin(Math.PI / n)) : 0;
            add('Distance from π', (Math.PI - v).toFixed(5), 'shrinks as n grows');
            break;
          }
          case 'cross-section': {
            const fr = r.extra.flatRadius || 0;
            add('Slice length', fr.toFixed(2), fr > 0 ? 'point → line → point' : 'not yet intersecting');
            add('Underlying object', 'STATIC', 'nothing actually evolves');
            break;
          }
          case 'projected': {
            if (this._entPair) {
              const a = g.get(this._entPair[0]), b = g.get(this._entPair[1]);
              const d = Math.hypot(a.x - b.x, a.y - b.y);
              add('Projected separation', d.toFixed(0), 'grows as you drag them apart');
            }
            break;
          }
          case 'structural': add('Structural distance', '1 hop', 'adjacent — never changes'); break;
          case 'hidden-links': {
            const h = g.edges.filter(e => e.tag === 'entangled').length;
            add('Hidden adjacencies', h, 'bridges through higher D');
            if (this._entPair) {
              const a = g.get(this._entPair[0]).state, b = g.get(this._entPair[1]).state;
              add('ψ₁ , ψ₂', a + ' , ' + b, a !== b ? 'anti-correlated' : 'correlated');
            }
            break;
          }
          case 'clock': {
            const o = r.observers[0];
            add('Observer clock', o ? o.clock : 0, 'ordered differences = time');
            break;
          }
          case 'steps': { const o = r.observers[0]; add('Steps taken', o ? o.steps : 0, 'fanout samples'); break; }
          case 'clock-matter': { const o = r.observers[0]; add('Matter clock', o ? o.clock : 0, 'distinct states ⇒ time ticks'); break; }
          case 'clock-light': { const o = r.observers[1]; add('Light clock', o ? o.clock : 0, 'no new distinction ⇒ frozen'); break; }
          case 'amp-core': {
            const f = r.field, set = this._fieldCore;
            add('Amplitude in X', f && set ? (f.massIn(set) * 100).toFixed(0) + '%' : '—', 'fanout dwelling in the dense region');
            break;
          }
          case 'delivered': { const f = r.field; add('Delivered to C', f ? f.delivered.toFixed(2) : '0', 'trickle through the mass'); break; }
          case 'occ-core': {
            const f = r.field, set = this._fieldCore;
            add('Occupancy at mass', f && set ? (f.massIn(set) * 100).toFixed(0) + '%' : '—', 'where the fanout pools');
            break;
          }
          case 'deg-core': {
            const f = r.field, set = this._fieldCore;
            add('Path share of mass', f && set ? (f.degreeShare(set) * 100).toFixed(0) + '%' : '—', '∝ degree — the target it converges to');
            break;
          }
          case 'escape': {
            const f = r.field;
            const v = f ? f.escape : 0;
            add('Escape flux', v < 1e-4 ? '≈ 0' : v.toFixed(4), v < 1e-4 ? 'trapped — horizon closed' : 'amplitude leaving the core');
            break;
          }
          case 'phase': {
            const c = this._bh && this._bh.collapsed;
            add('Phase', c ? 'COLLAPSED' : 'open network', c ? 'horizon formed — trapped' : 'continuations still escape');
            break;
          }
          case 'p-escape': {
            const p = this._bh ? this._bh.p : 1;
            add('Escape probability', (p * 100).toFixed(1) + '%', 'of a step from inside leaves the core');
            break;
          }
          case 'ratio': {
            const bh = this._bh || { internal: 0, external: 0 };
            add('Internal : external', bh.internal + ' : ' + bh.external, 'continuations');
            break;
          }
          case 'horizons': add('Black holes', r.extra.horizons ? r.extra.horizons.length : 0, 'collapsed regions'); break;
          case 'occ-mass': {
            const f = r.field, set = this._fieldMass;
            add('Amplitude in masses', f && set ? (f.massIn(set) * 100).toFixed(0) + '%' : '—', 'fanout pooled by gravity');
            break;
          }
        }
      }
      this._renderMetrics(rows);
    },

    _renderMetrics(rows) {
      const html = rows.map(r =>
        `<div class="metric"><div class="mk">${r.k}</div><div class="mv">${r.v}</div>` +
        (r.sub ? `<div class="ms">${r.sub}</div>` : '') + `</div>`).join('');
      this.el.metrics.innerHTML = html;
    },

    /* ----- main loop ----------------------------------------------------- */
    _loop(t) {
      const dt = Math.min(40, t - this._last || 16);
      this._last = t;
      if (this.playing) {
        const steps = 2;
        for (let i = 0; i < steps; i++) this.layout.step(dt / steps);
      }
      // Per-frame stage update (e.g. black-hole collapse detection / horizons).
      if (!this.sandbox && !this.classicView) {
        const s = IF.STAGES[this.stageIndex];
        if (s && s.update) s.update(this);
      }
      this.renderer.render(this.playing ? dt : 0.0001);
      this._updateMetrics();
      requestAnimationFrame(tt => this._loop(tt));
    }
  };

  window.addEventListener('DOMContentLoaded', () => App.init());
  root.IF.App = App;
})(window);
