/* =============================================================================
 * render.js — The projection layer.
 *
 * The renderer turns the timeless informational structure into the moving
 * "shadows" we perceive: glowing nodes, adjacency lines, pulses of ordered
 * difference (time), test-particle trajectories (gravity), and special set
 * pieces (the Flatland sphere, the closure polygon → π, the black hole).
 * ========================================================================== */
(function (root) {
  'use strict';

  const PALETTE = [
    '#7cf6ff', // cyan
    '#b99bff', // violet
    '#ff9bd6', // pink
    '#9bffc4', // mint
    '#ffd27c', // amber
    '#ff7c7c'  // red
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  class Renderer {
    constructor(canvas, graph) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.g = graph;
      this.dpr = Math.max(1, window.devicePixelRatio || 1);
      this.cam = { x: 0, y: 0, zoom: 1 };
      this.targetCam = { x: 0, y: 0, zoom: 1 };
      this.time = 0;
      this.stars = [];
      this.mode = 'graph';
      this.extra = {};          // per-stage rendering parameters
      this.flow = true;         // animate information pulses (time)
      this.field = null;        // FanoutField — THE fundamental process (R4)
      this.fieldParams = {};    // per-stage fanout options
      this.amp = new Map();     // normalized amplitude per node (for glow)
      this.observers = [];      // single sampled paths = observer slices (R4/R5)
      this.resize();
      this._initStars();
    }

    /* The fanout field is the engine's only fundamental process. Stages that
     * illustrate mass / gravity / black holes / time initialise it here. */
    initField(init, params) {
      this.field = new root.IF.FanoutField(this.g);
      this.field.reset(init);
      this.fieldParams = params || {};
      this.amp.clear();
    }

    // Equivalence class of a state: states sharing a class are indistinguishable
    // (used for Light — a symmetry direction accumulates no new distinction, R13).
    _cls(node) { return node ? (node.cls != null ? node.cls : node.id) : null; }

    // Pick the next continuation. Uniform over adjacencies (a fair sample of the
    // fanout), except a throttled core leaks outward with reduced probability —
    // the same asymmetry that traps the fanout in a black hole (R12).
    _pickNext(fromId) {
      const nb = this.g.neighbors(fromId);
      if (!nb.length) return fromId;
      const cs = this.fieldParams.coreSet, leak = this.fieldParams.leak;
      if (cs && leak != null && leak < 1 && cs.has(fromId)) {
        const ws = nb.map(v => cs.has(v) ? 1 : leak);
        let tot = 0; for (const w of ws) tot += w;
        let r = Math.random() * tot;
        for (let i = 0; i < nb.length; i++) { r -= ws[i]; if (r <= 0) return nb[i]; }
        return nb[nb.length - 1];
      }
      return nb[(Math.random() * nb.length) | 0];
    }

    // Seed observer slices (linear samples of the fanout). `start` may be a node
    // id, null (random), or an array giving one observer per id.
    seedObservers(count, start) {
      this.observers = [];
      const nodes = this.g.nodes;
      if (!nodes.length) return;
      const arr = Array.isArray(start) ? start : null;
      const n = arr ? arr.length : count;
      for (let i = 0; i < n; i++) {
        const s = arr ? arr[i] : (start != null ? start : nodes[(Math.random() * nodes.length) | 0].id);
        const c0 = this._cls(this.g.get(s));
        this.observers.push({
          from: s, to: this._pickNext(s),
          t: 0, x: 0, y: 0, trail: [], steps: 0,
          distinct: new Set([c0]), clock: 0, lastCls: c0,
          hue: PALETTE[i % PALETTE.length]
        });
      }
    }

    resize() {
      const c = this.canvas;
      const w = c.clientWidth, h = c.clientHeight;
      c.width = Math.round(w * this.dpr);
      c.height = Math.round(h * this.dpr);
      this.w = w; this.h = h;
    }

    _initStars() {
      this.stars = [];
      for (let i = 0; i < 220; i++) {
        this.stars.push({
          x: Math.random(), y: Math.random(),
          z: Math.random() * 0.8 + 0.2,
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    worldToScreen(x, y) {
      return {
        x: (x - this.cam.x) * this.cam.zoom + this.w / 2,
        y: (y - this.cam.y) * this.cam.zoom + this.h / 2
      };
    }
    screenToWorld(sx, sy) {
      return {
        x: (sx - this.w / 2) / this.cam.zoom + this.cam.x,
        y: (sy - this.h / 2) / this.cam.zoom + this.cam.y
      };
    }

    setCamera(x, y, zoom) { this.targetCam = { x, y, zoom }; }

    /* ----------------------------------------------------------------- frame */
    render(dt) {
      this.time += dt;
      // Ease camera toward target.
      this.cam.x = lerp(this.cam.x, this.targetCam.x, 0.06);
      this.cam.y = lerp(this.cam.y, this.targetCam.y, 0.06);
      this.cam.zoom = lerp(this.cam.zoom, this.targetCam.zoom, 0.06);

      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this._background();

      if (this.mode === 'void') { this._void(); return; }
      if (this.mode === 'flatland') { this._flatland(); return; }
      if (this.mode.indexOf('classic-') === 0) { this._classic(); return; }
      if (this.mode === 'bigbang') { this._bigbang(); }

      const live = dt > 1;   // false when paused (main passes ~0)
      const fieldMode = this.mode === 'mass' || this.mode === 'gravity' ||
                        this.mode === 'blackhole' || this.mode === 'fanout' ||
                        this.mode === 'universe';

      if (fieldMode && this.field) {
        if (live) this.field.step(this.fieldParams);
        this._computeAmp();
        this._drawFieldEdges();
      } else {
        this._drawEdges();
      }

      if (this.observers.length) { if (live) this._stepObservers(dt); this._drawObservers(); }

      if (this.extra.guides) this._drawGuides();
      this._drawNodes(fieldMode);

      if (this.mode === 'closure') this._closureOverlay();
      if (this.mode === 'blackhole') this._horizonOverlay();
      if (this.mode === 'universe' && this.extra.horizons) {
        for (const h of this.extra.horizons) this._drawHorizon(h.x, h.y, h.r);
      }
      if (this.extra.distancePair) this._drawDistance(this.extra.distancePair);
    }

    /* Normalised amplitude per node (drives the density glow = visible mass). */
    _computeAmp() {
      const mx = this.field.max();
      this.amp.clear();
      for (const n of this.g.nodes) this.amp.set(n.id, this.field.amp(n.id) / mx);
    }

    _background() {
      const ctx = this.ctx;
      const grd = ctx.createRadialGradient(
        this.w / 2, this.h * 0.42, 40,
        this.w / 2, this.h * 0.42, Math.max(this.w, this.h) * 0.8);
      grd.addColorStop(0, '#0a0e1f');
      grd.addColorStop(1, '#03040a');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, this.w, this.h);
      // Starfield (parallax with zoom).
      for (const s of this.stars) {
        const px = s.x * this.w;
        const py = s.y * this.h;
        const a = 0.25 + 0.55 * Math.abs(Math.sin(this.time * 0.0008 * s.z + s.tw));
        ctx.fillStyle = `rgba(180,200,255,${a * s.z})`;
        ctx.fillRect(px, py, s.z * 1.6, s.z * 1.6);
      }
    }

    _void() {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.time * 0.001);
      ctx.fillStyle = 'rgba(120,140,200,0.15)';
      ctx.font = '300 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('—  no states  —', this.w / 2, this.h * 0.55);
      ctx.restore();
    }

    _drawEdges() {
      const ctx = this.ctx;
      for (const e of this.g.edges) {
        const a = this.g.get(e.a), b = this.g.get(e.b);
        if (!a || !b) continue;
        const pa = this.worldToScreen(a.x, a.y);
        const pb = this.worldToScreen(b.x, b.y);
        // Entangled pairs are drawn as a higher-dimensional bridge, not a line.
        if (e.tag === 'entangled') { this._entangledBridge(pa, pb, e); continue; }
        const grow = clamp((performance.now() - e.born) / 600, 0, 1);
        const dimEdge = a.dim && b.dim;
        ctx.lineWidth = clamp(e.weight, 0.4, 3);
        ctx.strokeStyle = `rgba(124,246,255,${(dimEdge ? 0.06 : 0.18) * grow + (dimEdge ? 0.02 : 0.05)})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(lerp(pa.x, pb.x, grow), lerp(pa.y, pb.y, grow));
        ctx.stroke();

        // Information pulse traveling along the edge = ordered difference = TIME.
        if (this.flow && grow > 0.99) {
          e.flow = (e.flow + 0.004 + e.weight * 0.001) % 1;
          const t = e.flow;
          const px = lerp(pa.x, pb.x, t), py = lerp(pa.y, pb.y, t);
          const col = '160,235,255';
          const r = 2.6;
          const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
          gl.addColorStop(0, `rgba(${col},0.9)`);
          gl.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = gl;
          ctx.beginPath(); ctx.arc(px, py, r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    _drawNodes(fieldMode) {
      const ctx = this.ctx;
      for (const n of this.g.nodes) {
        const p = this.worldToScreen(n.x, n.y);
        const grow = clamp((performance.now() - n.born) / 500, 0, 1);
        const eased = grow * grow * (3 - 2 * grow);
        const deg = this.g.degree(n.id);
        // In field modes, accumulated fanout amplitude IS the visible mass —
        // but kept restrained so the underlying paths/loops stay legible.
        const a = fieldMode ? (this.amp.get(n.id) || 0) : 0;
        // Dim "space" backdrop nodes stay small; foreground nodes scale with degree/mass.
        const r = n.dim
          ? n.r * this.cam.zoom * eased
          : (n.r + Math.min(deg, 8) * 1.1) * this.cam.zoom * eased * (1 + a * 0.45);
        let col = n.tint || PALETTE[n.group % PALETTE.length];
        if (n.tag === 'singularity') col = '#ffffff';
        if (n.state === 1) col = '#ffd27c';

        ctx.save();
        ctx.globalAlpha = n.dim ? 0.55 : 1;

        // Halo — modestly brighter where amplitude has pooled (density = mass).
        const haloR = r * (n.dim ? 2.2 : (3.4 + a * 1.6));
        const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        gl.addColorStop(0, this._rgba(col, 0.5 + a * 0.3));
        gl.addColorStop(0.5, this._rgba(col, 0.12 + a * 0.12));
        gl.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2); ctx.fill();

        // Core.
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        if (!n.dim) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.35, 0, Math.PI * 2); ctx.fill();
        }

        // Label.
        if (n.label && this.cam.zoom > 0.5) {
          ctx.fillStyle = 'rgba(230,240,255,0.92)';
          ctx.font = `600 ${Math.round(13)}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label, p.x, p.y - r - 8);
        }
        ctx.restore();
      }
    }

    /* Faint "space" guides (e.g. the unchanging footprint of a symmetric object). */
    _drawGuides() {
      const ctx = this.ctx;
      for (const gd of this.extra.guides) {
        if (gd.type === 'circle') {
          const c = this.worldToScreen(gd.x, gd.y);
          const Rp = gd.r * this.cam.zoom;
          ctx.save();
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = gd.color || 'rgba(124,246,255,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(c.x, c.y, Rp, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          if (gd.label) {
            ctx.fillStyle = 'rgba(150,170,210,0.5)';
            ctx.font = '300 11px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText(gd.label, c.x, c.y - Rp - 8);
          }
        }
      }
    }

    /* ------ shortest informational distance highlight ----------------------*/
    _drawDistance(pair) {
      const a = this.g.get(pair[0]), b = this.g.get(pair[1]);
      if (!a || !b) return;
      const pa = this.worldToScreen(a.x, a.y), pb = this.worldToScreen(b.x, b.y);
      const ctx = this.ctx;
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(255,210,124,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      ctx.restore();
    }

    /* ------ closure → π -----------------------------------------------------
     * A closed informational loop laid out as a regular n-gon. Its
     * (perimeter / diameter) = n·sin(π/n) converges to π as n grows: π is the
     * invariant of informational CLOSURE, revealed by — not born from — geometry.
     */
    _closureOverlay() {
      const n = this.g.nodes.length;
      if (n < 3) return;
      const ctx = this.ctx;
      // circumcircle of the layout
      let cx = 0, cy = 0;
      for (const nd of this.g.nodes) { cx += nd.x; cy += nd.y; }
      cx /= n; cy /= n;
      let R = 0;
      for (const nd of this.g.nodes) R = Math.max(R, Math.hypot(nd.x - cx, nd.y - cy));
      const c = this.worldToScreen(cx, cy);
      const Rp = R * this.cam.zoom;
      ctx.save();
      ctx.strokeStyle = 'rgba(124,246,255,0.25)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(c.x, c.y, Rp, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      const ratio = n * Math.sin(Math.PI / n);
      this.extra.closureValue = ratio;
    }

    /* ------ fanout edges: information flowing along EVERY adjacency at once --
     * The pulse on each edge is scaled by how much amplitude crosses it this
     * step (R4). It moves from the higher-amplitude state toward the lower one,
     * so you literally watch the fanout pool into dense regions (R11). */
    _drawFieldEdges() {
      const ctx = this.ctx;
      const f = this.field;
      let fmax = 1e-9;
      for (const v of f.flux.values()) if (v > fmax) fmax = v;
      for (const e of this.g.edges) {
        const a = this.g.get(e.a), b = this.g.get(e.b);
        if (!a || !b) continue;
        const pa = this.worldToScreen(a.x, a.y), pb = this.worldToScreen(b.x, b.y);
        ctx.strokeStyle = 'rgba(124,246,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        const key = e.a < e.b ? e.a + '_' + e.b : e.b + '_' + e.a;
        const fl = (f.flux.get(key) || 0) / fmax;
        if (fl > 0.015) {
          const fwd = f.amp(e.a) >= f.amp(e.b);
          e.flow = (e.flow + 0.008 + 0.02 * fl) % 1;
          const t = fwd ? e.flow : 1 - e.flow;
          const px = pa.x + (pb.x - pa.x) * t, py = pa.y + (pb.y - pa.y) * t;
          const r = 2 + 3.4 * fl;
          const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
          gl.addColorStop(0, `rgba(160,235,255,${0.45 + 0.5 * fl})`);
          gl.addColorStop(1, 'rgba(160,235,255,0)');
          ctx.fillStyle = gl;
          ctx.beginPath(); ctx.arc(px, py, r * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    /* ------ observer slices: a single linear path sampled FROM the fanout -----
     * Not fundamental — this is what one restricted observer experiences (R4/R5).
     * Each step adds a (possibly new) distinguishable state; distinct-count = the
     * observer's elapsed time. */
    _stepObservers(dt) {
      for (const w of this.observers) {
        if (!this.g.get(w.to)) w.to = this._pickNext(w.from);
        w.t += 0.0016 * dt * (this.extra.obsSpeed || 1);
        let guard = 0;
        while (w.t >= 1 && guard++ < 4) {
          w.t -= 1; w.from = w.to; w.steps++;
          const c = this._cls(this.g.get(w.from));
          if (c !== w.lastCls) { w.clock++; w.lastCls = c; }  // ordered difference = a tick of time
          w.distinct.add(c);
          w.to = this._pickNext(w.from);
        }
        const a = this.g.get(w.from), b = this.g.get(w.to);
        if (a && b) { w.x = a.x + (b.x - a.x) * w.t; w.y = a.y + (b.y - a.y) * w.t; }
        w.trail.push(this.worldToScreen(w.x, w.y));
        if (w.trail.length > 30) w.trail.shift();
      }
    }

    _drawObservers() {
      const ctx = this.ctx;
      for (const w of this.observers) {
        ctx.beginPath();
        for (let i = 0; i < w.trail.length; i++) {
          const t = w.trail[i];
          if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
        }
        ctx.strokeStyle = this._rgba(w.hue, 0.55); ctx.lineWidth = 1.8; ctx.stroke();
        const h = w.trail[w.trail.length - 1];
        if (h) {
          const gl = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 11);
          gl.addColorStop(0, this._rgba(w.hue, 0.95));
          gl.addColorStop(1, this._rgba(w.hue, 0));
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(h.x, h.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h.x, h.y, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    /* ------ entanglement: a bridge through a higher dimension -----------------
     * The two states are far apart in the PROJECTION (flat dashed shadow) yet
     * adjacent in the STRUCTURE: the bright tube bows out of the plane and stays
     * a short throat no matter how far you drag the mouths apart (R3/R7). */
    _entangledBridge(pa, pb, e) {
      const ctx = this.ctx;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
      const bow = Math.min(len * 0.45, 150) + 70;          // arc out of the plane
      const apx = mx + nx * bow, apy = my + ny * bow;

      // Flat shadow on the plane = the (large) projected separation.
      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = 'rgba(255,155,214,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      ctx.restore();

      const curve = (alpha, width, col) => {
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(apx, apy, pb.x, pb.y);
        ctx.strokeStyle = `rgba(${col},${alpha})`;
        ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
      };
      curve(0.10, 22, '255,155,214');                       // outer glow
      curve(0.25, 12, '255,180,225');
      curve(0.85, 3, '255,225,240');                        // bright core

      // Synchronised pulses crossing the bridge (instant correlation).
      e.flow = (e.flow + 0.01) % 1;
      for (const base of [e.flow, (e.flow + 0.5) % 1]) {
        const t = base, mt = 1 - t;
        const bx = mt * mt * pa.x + 2 * mt * t * apx + t * t * pb.x;
        const by = mt * mt * pa.y + 2 * mt * t * apy + t * t * pb.y;
        const gl = ctx.createRadialGradient(bx, by, 0, bx, by, 9);
        gl.addColorStop(0, 'rgba(255,235,250,0.95)');
        gl.addColorStop(1, 'rgba(255,180,225,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
      }

      // "Mouths" diving out of the plane.
      for (const p of [pa, pb]) {
        ctx.strokeStyle = 'rgba(255,180,225,0.6)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 4, Math.atan2(dy, dx), 0, Math.PI * 2); ctx.stroke();
      }

      // Throat label — constant short structural distance.
      ctx.fillStyle = 'rgba(255,200,230,0.75)';
      ctx.font = '300 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('adjacent (1 hop) in the structure', apx, apy + (ny > 0 ? 16 : -10));
    }

    _horizonOverlay() {
      const horizon = this.extra.horizon || 0;
      if (horizon <= 0.5) return;
      const hc = this.extra.horizonCenter || { x: 0, y: 0 };
      this._drawHorizon(hc.x, hc.y, horizon);
    }

    // Draw an event horizon (dark interior + glowing ring) at a world position.
    _drawHorizon(worldX, worldY, worldR) {
      if (worldR <= 0.5) return;
      const ctx = this.ctx;
      const c = this.worldToScreen(worldX, worldY);
      const Rp = worldR * this.cam.zoom;
      // Dark interior.
      const gl = ctx.createRadialGradient(c.x, c.y, Rp * 0.2, c.x, c.y, Rp);
      gl.addColorStop(0, 'rgba(0,0,0,0.95)');
      gl.addColorStop(0.85, 'rgba(0,0,0,0.85)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(c.x, c.y, Rp, 0, Math.PI * 2); ctx.fill();
      // Glowing horizon ring.
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 0.003);
      ctx.strokeStyle = `rgba(255,160,90,${0.7 * pulse})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(c.x, c.y, Rp, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,220,150,${0.35 * pulse})`;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(c.x, c.y, Rp, 0, Math.PI * 2); ctx.stroke();
    }

    /* ------ Flatland: a static sphere intersecting a plane = illusory time ---
     * IMPORTANT geometry: we view Flatland — a 2D plane — EDGE-ON, so it appears
     * as the horizontal line. Slicing a sphere with that plane gives a CHORD:
     * what the flatlander experiences is a point that swells into a line segment
     * (max length = the sphere's diameter) and shrinks back to a point. It is
     * NOT a circle. The circle below is the unseen 3D object, drawn for us only.
     */
    _flatland() {
      const ctx = this.ctx;
      const cx = this.w / 2, planeY = this.h * 0.46;

      // The static sphere translating through the plane. From our outside view
      // it is unchanging; the flatlander, trapped in the line, sees a segment.
      const period = 6000;
      const phase = (this.time % period) / period;            // 0..1
      const sphereR = Math.min(this.w, this.h) * 0.17;
      const travel = (phase * 2 - 1) * sphereR * 2.4;          // center offset
      const sphereCY = planeY - travel;

      // Ghost of the full sphere (the higher-dimensional object) — faint.
      ctx.save();
      ctx.globalAlpha = 0.26;
      const sg = ctx.createRadialGradient(cx - sphereR * 0.3, sphereCY - sphereR * 0.3, sphereR * 0.1, cx, sphereCY, sphereR);
      sg.addColorStop(0, 'rgba(185,155,255,0.9)');
      sg.addColorStop(1, 'rgba(80,60,160,0.04)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx, sphereCY, sphereR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(185,155,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, sphereCY, sphereR, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Flatland itself: the 2D plane seen edge-on -> a line.
      ctx.strokeStyle = 'rgba(124,246,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, planeY); ctx.lineTo(this.w - 60, planeY); ctx.stroke();

      // The intersection the flatlander actually experiences: a CHORD/segment.
      const dy = Math.abs(planeY - sphereCY);
      let half = 0;
      if (dy < sphereR) {
        half = Math.sqrt(sphereR * sphereR - dy * dy);        // half-length of chord
        // soft glow around the segment
        const gg = ctx.createRadialGradient(cx, planeY, 0, cx, planeY, Math.max(half * 1.6, 8));
        gg.addColorStop(0, 'rgba(124,246,255,0.35)');
        gg.addColorStop(1, 'rgba(124,246,255,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.ellipse(cx, planeY, Math.max(half * 1.6, 8), 14, 0, 0, Math.PI * 2); ctx.fill();
        // the bright segment lying ON the line
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(160,240,255,0.95)';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx - half, planeY); ctx.lineTo(cx + half, planeY); ctx.stroke();
        // glowing endpoints
        for (const ex of [cx - half, cx + half]) {
          ctx.fillStyle = 'rgba(220,250,255,0.95)';
          ctx.beginPath(); ctx.arc(ex, planeY, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        this.extra.flatRadius = half / sphereR;               // 0..1 normalized length
      } else {
        this.extra.flatRadius = 0;
      }

      // Filmstrip: the flatlander's "history" — successive slices he reads as
      // time. A point grows into a line and shrinks to a point. Nothing evolved.
      const fy = planeY + 150;
      const samples = 11;
      const span = Math.min(this.w * 0.6, 720);
      const step = span / (samples - 1);
      const startX = cx - span / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(180,200,255,0.4)';
      ctx.font = '300 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('what the flatlander records as "time"  →', cx, fy - 28);
      for (let i = 0; i < samples; i++) {
        const ph = i / (samples - 1);
        const tv = (ph * 2 - 1) * sphereR * 2.4;
        const dyi = Math.abs(tv);
        const hi = dyi < sphereR ? Math.sqrt(sphereR * sphereR - dyi * dyi) : 0;
        const x = startX + i * step;
        const len = (hi / sphereR) * (step * 0.42);
        const isNow = Math.abs(ph - phase) < (0.5 / (samples - 1));
        ctx.lineCap = 'round';
        ctx.strokeStyle = isNow ? 'rgba(160,240,255,0.95)' : 'rgba(124,246,255,0.4)';
        ctx.lineWidth = isNow ? 4 : 3;
        if (len < 1.2) {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath(); ctx.arc(x, fy, isNow ? 2.6 : 2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(x - len, fy); ctx.lineTo(x + len, fy); ctx.stroke();
        }
      }
      ctx.restore();

      // Labels.
      ctx.fillStyle = 'rgba(180,200,255,0.6)';
      ctx.font = '300 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('the static object — unchanging (unseen by the flatlander)', cx, sphereCY - sphereR - 14);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(124,246,255,0.55)';
      ctx.font = '300 12px Georgia, serif';
      ctx.fillText('Flatland: the 2D plane, edge-on', this.w - 70, planeY - 8);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(160,240,255,0.8)';
      ctx.fillText('the flatlander’s "now": a point → a line → a point', cx, planeY + 30);
    }

    _bigbang() {
      // A luminous boundary arc: the earliest accessible informational frontier.
      const ctx = this.ctx;
      const c = this.worldToScreen(0, 0);
      const R = 320 * this.cam.zoom;
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 0.0015);
      const gl = ctx.createRadialGradient(c.x, c.y, R * 0.7, c.x, c.y, R * 1.25);
      gl.addColorStop(0, 'rgba(255,210,124,0)');
      gl.addColorStop(0.7, `rgba(255,180,90,${0.10 + 0.08 * pulse})`);
      gl.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(c.x, c.y, R * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,200,120,${0.4 + 0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, R, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }

    /* =====================================================================
     * CLASSICAL views — deliberately TRADITIONAL visualisations (no graphs),
     * so the user can contrast the textbook GR/QM picture with information-first.
     * ===================================================================== */
    _classic() {
      const m = this.mode.slice(8);
      const fn = {
        time: '_clTime', space: '_clSpace', circle: '_clCircle', wave: '_clWave',
        entangle: '_clEntangle', light: '_clLight', mass: '_clMass',
        gravity: '_clGravity', blackhole: '_clBlackhole', bigbang: '_clBigbang'
      }[m];
      if (fn && this[fn]) this[fn]();
      this._clLabel();
    }

    _clLabel() {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(255,180,120,0.85)';
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CLASSICAL VIEW', 26, this.h - 24);
    }
    _clText(s, x, y, col, size) {
      const ctx = this.ctx;
      ctx.fillStyle = col || 'rgba(200,215,245,0.7)';
      ctx.font = '300 ' + (size || 13) + 'px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(s, x, y);
    }

    // Newtonian absolute time: a uniform external timeline + a steady clock.
    _clTime() {
      const ctx = this.ctx, cy = this.h * 0.52, x0 = 140, x1 = this.w - 140;
      ctx.strokeStyle = 'rgba(180,200,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(x1 - 12, cy - 6); ctx.lineTo(x1 - 12, cy + 6); ctx.closePath();
      ctx.fillStyle = 'rgba(180,200,255,0.7)'; ctx.fill();
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n;
        ctx.strokeStyle = 'rgba(160,180,230,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, cy - 6); ctx.lineTo(x, cy + 6); ctx.stroke();
        this._clText('t=' + i, x, cy + 22, 'rgba(150,170,210,0.5)', 11);
      }
      // a particle advancing at a constant rate, the same for all
      const span = x1 - x0;
      const px = x0 + ((this.time * 0.06) % span);
      const gl = ctx.createRadialGradient(px, cy, 0, px, cy, 16);
      gl.addColorStop(0, 'rgba(124,246,255,0.9)'); gl.addColorStop(1, 'rgba(124,246,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, cy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, cy, 4, 0, Math.PI * 2); ctx.fill();
      // a clock
      const ccx = this.w / 2, ccy = this.h * 0.3, R = 46;
      ctx.strokeStyle = 'rgba(180,200,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, Math.PI * 2); ctx.stroke();
      const ang = this.time * 0.002 - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(ccx, ccy); ctx.lineTo(ccx + Math.cos(ang) * R * 0.8, ccy + Math.sin(ang) * R * 0.8); ctx.stroke();
      this._clText('time flows uniformly — an absolute backdrop for all observers', this.w / 2, this.h * 0.7);
    }

    // Absolute space: a fixed Cartesian coordinate stage.
    _clSpace() {
      const ctx = this.ctx, cx = this.w / 2, cy = this.h * 0.48, s = 46;
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i++) {
        ctx.strokeStyle = i === 0 ? 'rgba(160,180,230,0.55)' : 'rgba(120,140,190,0.16)';
        ctx.beginPath(); ctx.moveTo(cx + i * s, cy - 8 * s); ctx.lineTo(cx + i * s, cy + 8 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 8 * s, cy + i * s); ctx.lineTo(cx + 8 * s, cy + i * s); ctx.stroke();
      }
      const objs = [[3, -2, '#7cf6ff'], [-4, 2, '#ff9bd6'], [1, 3, '#ffd27c']];
      for (const [ox, oy, col] of objs) {
        const x = cx + ox * s, y = cy - oy * s;
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 18);
        gl.addColorStop(0, this._rgba(col, 0.9)); gl.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        this._clText('(' + ox + ',' + (oy) + ')', x, y - 16, 'rgba(200,215,245,0.6)', 11);
      }
      this._clText('space is a fixed stage; every object has absolute coordinates', this.w / 2, this.h * 0.9);
    }

    // Euclidean circle: π is simply given.
    _clCircle() {
      const ctx = this.ctx, cx = this.w / 2, cy = this.h * 0.46, R = Math.min(this.w, this.h) * 0.22;
      const gl = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.15);
      gl.addColorStop(0, 'rgba(124,246,255,0)'); gl.addColorStop(0.7, 'rgba(124,246,255,0.18)'); gl.addColorStop(1, 'rgba(124,246,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(124,246,255,0.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      const ang = this.time * 0.0012;
      ctx.strokeStyle = 'rgba(255,210,124,0.8)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
      this._clText('r', cx + Math.cos(ang) * R * 0.5, cy + Math.sin(ang) * R * 0.5 - 8, 'rgba(255,210,124,0.9)', 14);
      this._clText('a perfect continuous circle:  C = 2πr,  A = πr²   —   π is a given constant', this.w / 2, cy + R + 56);
    }

    // QM wave packet evolving by the Schrödinger equation.
    _clWave() {
      const ctx = this.ctx, cy = this.h * 0.52, x0 = 120, x1 = this.w - 120, W = x1 - x0;
      ctx.strokeStyle = 'rgba(120,140,190,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
      const period = 7000, ph = (this.time % period) / period;
      const x0c = 0.5 + 0.35 * Math.sin(ph * Math.PI * 2);   // packet center (0..1)
      const sig = 0.05 + 0.06 * (0.5 - 0.5 * Math.cos(ph * Math.PI * 2)); // spreads
      const amp = this.h * 0.16;
      // |ψ| envelope
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const u = i / 200, x = x0 + u * W;
        const env = Math.exp(-((u - x0c) * (u - x0c)) / (2 * sig * sig));
        const y = cy - env * amp;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = 'rgba(185,155,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      // Re(ψ) oscillation under the envelope
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const u = i / 240, x = x0 + u * W;
        const env = Math.exp(-((u - x0c) * (u - x0c)) / (2 * sig * sig));
        const y = cy - env * amp * Math.cos(60 * (u - x0c) - this.time * 0.006);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = 'rgba(124,246,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
      this._clText('ψ(x,t) evolves continuously in time (Schrödinger);  measurement collapses it', this.w / 2, this.h * 0.84);
    }

    // QM entanglement: a separating Bell pair with anti-correlated spins.
    _clEntangle() {
      const ctx = this.ctx, cy = this.h * 0.46, cx = this.w / 2;
      const period = 6000, ph = (this.time % period) / period;
      const sep = 80 + ph * (this.w * 0.32);
      const measured = ph > 0.6;
      const flip = (this.time / period | 0) % 2 === 0 ? 1 : -1;
      // correlation line
      ctx.strokeStyle = 'rgba(255,155,214,0.3)'; ctx.setLineDash([5, 7]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - sep, cy); ctx.lineTo(cx + sep, cy); ctx.stroke(); ctx.setLineDash([]);
      const drawP = (x, dir, col) => {
        const gl = ctx.createRadialGradient(x, cy, 0, x, cy, 20);
        gl.addColorStop(0, this._rgba(col, 0.9)); gl.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, cy, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, cy, 7, 0, Math.PI * 2); ctx.fill();
        // spin arrow (undetermined = spinning; measured = locked)
        const a = measured ? (dir > 0 ? -Math.PI / 2 : Math.PI / 2) : this.time * 0.01 * dir;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(a) * 16, cy + Math.sin(a) * 16); ctx.stroke();
      };
      drawP(cx - sep, flip, '#7cf6ff');
      drawP(cx + sep, -flip, '#ff9bd6');
      this._clText(measured ? 'measured: spins anti-correlated — "spooky action at a distance"'
                            : 'an entangled pair flies apart through space…', this.w / 2, this.h * 0.8);
    }

    // SR light cone: a photon worldline with ds² = 0, dτ = 0.
    _clLight() {
      const ctx = this.ctx, cx = this.w / 2, oy = this.h * 0.8, H = this.h * 0.62;
      // axes
      ctx.strokeStyle = 'rgba(160,180,230,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx, oy - H); ctx.stroke();       // ct
      ctx.beginPath(); ctx.moveTo(cx - this.w * 0.32, oy); ctx.lineTo(cx + this.w * 0.32, oy); ctx.stroke(); // x
      this._clText('ct', cx + 14, oy - H + 6, 'rgba(160,180,230,0.7)', 12);
      this._clText('x', cx + this.w * 0.32 - 6, oy + 18, 'rgba(160,180,230,0.7)', 12);
      // light cone (45°)
      ctx.strokeStyle = 'rgba(255,210,124,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + H, oy - H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx - H, oy - H); ctx.stroke();
      const cg = ctx.createLinearGradient(cx, oy, cx, oy - H);
      cg.addColorStop(0, 'rgba(255,210,124,0.10)'); cg.addColorStop(1, 'rgba(255,210,124,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + H, oy - H); ctx.lineTo(cx - H, oy - H); ctx.closePath(); ctx.fill();
      // a photon traveling up the 45° null line
      const t = (this.time * 0.05) % H;
      const px = cx + t, py = oy - t;
      const gl = ctx.createRadialGradient(px, py, 0, px, py, 14);
      gl.addColorStop(0, 'rgba(255,235,150,0.95)'); gl.addColorStop(1, 'rgba(255,235,150,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
      // a timelike worldline for contrast
      ctx.strokeStyle = 'rgba(124,246,255,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + H * 0.35, oy - H); ctx.stroke();
      this._clText('photon on the null cone:  ds² = 0  ⇒  proper time dτ = 0', this.w / 2, this.h * 0.12);
      this._clText('massive worldline (cyan) vs light (gold)', this.w / 2, this.h * 0.17, 'rgba(150,170,210,0.5)', 11);
    }

    // Classical mass: a quantity of matter / energy.
    _clMass() {
      const ctx = this.ctx, cx = this.w / 2, cy = this.h * 0.46, R = Math.min(this.w, this.h) * 0.16;
      const gl = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      gl.addColorStop(0, 'rgba(255,240,210,0.95)'); gl.addColorStop(0.5, 'rgba(255,200,120,0.8)'); gl.addColorStop(1, 'rgba(150,90,40,0.2)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      this._clText('M', cx, cy + 6, 'rgba(60,30,10,0.85)', 28);
      this._clText('mass = a quantity of matter/energy:  E = mc²', this.w / 2, cy + R + 50);
    }

    // GR gravity well: the rubber-sheet embedding diagram + an orbiting body.
    _clGravity(deep) {
      const ctx = this.ctx, cx = this.w / 2, cy = this.h * 0.4;
      const maxR = Math.min(this.w, this.h) * 0.42;
      const wellDepth = deep ? this.h * 0.5 : this.h * 0.26;
      const depthAt = rr => {
        const x = rr / maxR;
        return wellDepth / (x * (deep ? 2.2 : 3.0) + (deep ? 0.10 : 0.22));
      };
      // concentric rings sagging toward the centre (the sheet)
      const rings = 11;
      for (let i = rings; i >= 1; i--) {
        const rr = maxR * i / rings;
        const dy = depthAt(rr);
        ctx.strokeStyle = `rgba(124,180,255,${0.07 + 0.16 * (i / rings)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy + dy * 0.0, rr, rr * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // radial mesh lines dipping into the well
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        for (let i = 0; i <= rings; i++) {
          const rr = maxR * i / rings;
          const dy = i === 0 ? wellDepth : (wellDepth - depthAt(rr));
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.42 + dy;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = 'rgba(124,180,255,0.10)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // central mass at the bottom of the well
      const my = cy + wellDepth * 0.92;
      const mr = deep ? 6 : 20;
      if (!deep) {
        const mg = ctx.createRadialGradient(cx, my, 0, cx, my, mr * 2);
        mg.addColorStop(0, 'rgba(255,220,150,0.95)'); mg.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(cx, my, mr * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd27c'; ctx.beginPath(); ctx.arc(cx, my, mr, 0, Math.PI * 2); ctx.fill();
      }
      // an orbiting test particle on the rim
      const a = this.time * 0.0016;
      const orr = maxR * 0.6, ody = wellDepth - depthAt(orr);
      const ox = cx + Math.cos(a) * orr, oyp = cy + Math.sin(a) * orr * 0.42 + ody;
      const og = ctx.createRadialGradient(ox, oyp, 0, ox, oyp, 10);
      og.addColorStop(0, 'rgba(124,246,255,0.95)'); og.addColorStop(1, 'rgba(124,246,255,0)');
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox, oyp, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oyp, 3, 0, Math.PI * 2); ctx.fill();
      if (!deep) this._clText('mass curves spacetime; free-fall follows the geodesics it bends', this.w / 2, this.h * 0.9);
      return { cx, cy, my, wellDepth };
    }

    // GR black hole: a bottomless funnel with a Schwarzschild horizon + disk.
    _clBlackhole() {
      const g = this._clGravity(true);
      const ctx = this.ctx, cx = g.cx, cy = g.cy;
      // accretion disk
      ctx.save();
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,${160 - i * 30},${80 - i * 20},${0.4 - i * 0.1})`;
        ctx.lineWidth = 6 - i * 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, 120 - i * 8, 50 - i * 4, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      // event horizon (black disk + bright ring)
      const hr = 46;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(cx, cy, hr, hr * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 0.003);
      ctx.strokeStyle = `rgba(255,170,90,${0.8 * pulse})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, hr, hr * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      this._clText('Schwarzschild black hole:  event horizon at  r_s = 2GM/c²', this.w / 2, this.h * 0.92);
    }

    // Expanding-universe cosmology from a singularity.
    _clBigbang() {
      const ctx = this.ctx, cx = this.w / 2, cy = this.h * 0.46;
      const period = 9000, ph = (this.time % period) / period;
      // expanding shells
      for (let i = 0; i < 5; i++) {
        const rr = ((ph + i / 5) % 1) * Math.min(this.w, this.h) * 0.46;
        ctx.strokeStyle = `rgba(255,${180 - i * 10},${120 - i * 10},${0.4 * (1 - rr / (Math.min(this.w, this.h) * 0.46))})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, rr + 4, 0, Math.PI * 2); ctx.stroke();
      }
      // galaxies flying outward (redshifting)
      if (!this._galx) {
        this._galx = [];
        for (let i = 0; i < 60; i++) this._galx.push({ a: Math.random() * Math.PI * 2, r: Math.random(), s: 0.4 + Math.random() * 0.8 });
      }
      const maxR = Math.min(this.w, this.h) * 0.46;
      for (const gx of this._galx) {
        const rr = ((gx.r + ph * gx.s) % 1) * maxR;
        const x = cx + Math.cos(gx.a) * rr, y = cy + Math.sin(gx.a) * rr;
        const red = rr / maxR;
        ctx.fillStyle = `rgba(${200 + red * 55},${200 - red * 120},${255 - red * 180},${0.8 * (1 - red * 0.6)})`;
        ctx.beginPath(); ctx.arc(x, y, 2 + (1 - red) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      core.addColorStop(0, 'rgba(255,245,220,0.9)'); core.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
      this._clText('space itself expands from an initial singularity (t ≈ 13.8 Gyr ago)', this.w / 2, this.h * 0.92);
    }

    _rgba(hex, a) {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  }

  root.IF = root.IF || {};
  root.IF.Renderer = Renderer;
  root.IF.PALETTE = PALETTE;
})(window);
