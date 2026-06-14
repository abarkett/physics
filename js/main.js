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
    stageIndex: 0, playing: true, sandbox: false,
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
        hint: document.getElementById('hint')
      };
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
      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowRight') this.gotoStage(this.stageIndex + 1);
        else if (e.key === 'ArrowLeft') this.gotoStage(this.stageIndex - 1);
        else if (e.key === ' ') { e.preventDefault(); this.el.play.click(); }
        else if (e.key.toLowerCase() === 's') this.toggleSandbox();
      });
    },

    gotoStage(i) {
      if (this.sandbox) this.toggleSandbox(false);
      i = Math.max(0, Math.min(IF.STAGES.length - 1, i));
      this.stageIndex = i;
      const s = IF.STAGES[i];
      this.renderer.mode = s.mode;
      this.renderer.extra = {};            // reset per-stage rendering params
      this._syncShared();
      s.build(this);
      this._syncShared();

      this.el.chapter.textContent = 'Chapter ' + s.chapter;
      this.el.kicker.textContent = s.kicker;
      this.el.title.textContent = s.title;
      this.el.body.innerHTML = s.body;
      this.el.progressNum.textContent = (i + 1) + ' / ' + IF.STAGES.length;
      [...this.el.dots.children].forEach((d, k) => d.classList.toggle('active', k === i));
      this.el.prev.disabled = i === 0;
      this.el.next.disabled = i === IF.STAGES.length - 1;

      this._buildControls(s);
      this._setHint(s);
    },

    // Push App-level shared knobs into renderer.extra where stages expect them.
    _syncShared() {
      if (this.renderer.extra.G == null && (this.renderer.mode === 'gravity' || this.renderer.mode === 'blackhole'))
        this.renderer.extra.G = this._G;
    },

    _setHint(s) {
      const map = {
        drag: 'Tip: drag any node — the layout re-derives geometry from adjacency.',
        'closure-n': 'Tip: use ＋ / － to add or remove states in the loop.',
        measure: 'Tip: click an entangled node (ψ) to measure it.',
        gravity: 'Tip: drag the G slider to change the informational coupling.'
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
        this._addButton(c, '－', () => { this._closureN = Math.max(3, this._closureN - 1); s.build(this); });
        this._addLabel(c, 'n = ' + this._closureN, 'nLabel');
        this._addButton(c, '＋', () => { this._closureN = Math.min(64, this._closureN + 1); s.build(this); });
      }
      if (s.interactive === 'gravity') {
        const wrap = document.createElement('div'); wrap.className = 'slider';
        const lab = document.createElement('span'); lab.textContent = 'G';
        const inp = document.createElement('input');
        inp.type = 'range'; inp.min = '10'; inp.max = '260'; inp.value = String(this._G);
        const val = document.createElement('span'); val.textContent = this._G; val.className = 'sval';
        inp.addEventListener('input', () => {
          this._G = +inp.value; val.textContent = this._G;
          this.renderer.extra.G = (this.renderer.mode === 'blackhole') ? Math.max(this._G, 120) : this._G;
        });
        wrap.append(lab, inp, val); c.appendChild(wrap);
        this._addButton(c, 'Re-seed', () => this.renderer.seedParticles(this.renderer.mode === 'blackhole' ? 200 : 160, 720));
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
      const want = s.metrics || [];
      for (const m of want) {
        switch (m) {
          case 'states': add('States', g.nodes.length, 'distinguishable'); break;
          case 'edges': add('Adjacencies', g.edges.length, 'relations'); break;
          case 'bits': add('Information', g.bits.toFixed(2), 'bits  (log₂ states)'); break;
          case 'distinction': add('Distinction', g.hasDistinction ? 'YES' : '—', g.hasDistinction ? 'information exists' : 'nothing to compare'); break;
          case 'dist': {
            const p = r.extra.distancePair;
            const d = p ? g.informationalDistance(p[0], p[1]) : null;
            add('Info distance A↔C', d == null ? '∞' : d.toFixed(2), '= Σ (1 / connectivity)');
            break;
          }
          case 'loops': add('Independent loops', g.loopCount, 'path multiplicity'); break;
          case 'components': add('Components', g.componentCount(), 'connected regions'); break;
          case 'symmetry': add('Rotational symmetry', 'C' + g.nodes.length, g.nodes.length + '-fold invariance'); break;
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
            add('Cross-section radius', fr.toFixed(2), fr > 0 ? 'the "now" the flatlander sees' : 'object not yet intersecting');
            add('Underlying object', 'STATIC', 'nothing actually evolves');
            break;
          }
          case 'hidden-links': {
            const h = g.edges.filter(e => e.tag === 'entangled').length;
            add('Hidden adjacencies', h, 'across the projection');
            if (this._entPair) {
              const a = g.get(this._entPair[0]).state, b = g.get(this._entPair[1]).state;
              add('ψ₁ , ψ₂', a + ' , ' + b, a !== b ? 'anti-correlated' : 'correlated');
            }
            break;
          }
          case 'density': add('Peak density', g.densityAt(0, 0, 200).toFixed(1), 'informational mass'); break;
          case 'G': add('Coupling G', (r.extra.G || this._G).toFixed(0), 'density ↔ projection bias'); break;
          case 'captured': {
            const cap = r.particles.filter(p => p.captured).length;
            add('Captured paths', cap + ' / ' + r.particles.length, r.extra.horizon ? 'beyond the horizon' : 'bound to the well');
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
      this.renderer.render(this.playing ? dt : 0.0001);
      this._updateMetrics();
      requestAnimationFrame(tt => this._loop(tt));
    }
  };

  window.addEventListener('DOMContentLoaded', () => App.init());
  root.IF.App = App;
})(window);
