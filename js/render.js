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
      this.particles = [];      // gravity / accretion test particles
      this.flow = true;         // animate information pulses (time)
      this.resize();
      this._initStars();
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
      if (this.mode === 'bigbang') { this._bigbang(); }

      this._drawEdges();
      if (this.mode === 'gravity' || this.mode === 'blackhole') this._drawParticles(dt);
      this._drawNodes();

      if (this.mode === 'closure') this._closureOverlay();
      if (this.mode === 'blackhole') this._horizonOverlay();
      if (this.extra.distancePair) this._drawDistance(this.extra.distancePair);
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
        const grow = clamp((performance.now() - e.born) / 600, 0, 1);
        const hidden = e.tag === 'entangled';
        ctx.lineWidth = (hidden ? 1.4 : 1) * clamp(e.weight, 0.4, 3);
        ctx.strokeStyle = hidden
          ? `rgba(255,155,214,${0.5 * grow})`
          : `rgba(124,246,255,${0.18 * grow + 0.05})`;
        if (hidden) ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(lerp(pa.x, pb.x, grow), lerp(pa.y, pb.y, grow));
        ctx.stroke();
        ctx.setLineDash([]);

        // Information pulse traveling along the edge = ordered difference = TIME.
        if (this.flow && grow > 0.99) {
          e.flow = (e.flow + 0.004 + e.weight * 0.001) % 1;
          const t = e.flow;
          const px = lerp(pa.x, pb.x, t), py = lerp(pa.y, pb.y, t);
          const col = hidden ? '255,155,214' : '160,235,255';
          const r = 2.6;
          const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
          gl.addColorStop(0, `rgba(${col},0.9)`);
          gl.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = gl;
          ctx.beginPath(); ctx.arc(px, py, r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    _drawNodes() {
      const ctx = this.ctx;
      for (const n of this.g.nodes) {
        const p = this.worldToScreen(n.x, n.y);
        const grow = clamp((performance.now() - n.born) / 500, 0, 1);
        const eased = grow * grow * (3 - 2 * grow);
        const deg = this.g.degree(n.id);
        const r = (n.r + Math.min(deg, 8) * 1.1) * this.cam.zoom * eased;
        let col = PALETTE[n.group % PALETTE.length];
        if (n.tag === 'singularity') col = '#ffffff';
        if (n.state === 1) col = '#ffd27c';

        // Halo.
        const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4.2);
        gl.addColorStop(0, this._rgba(col, 0.55));
        gl.addColorStop(0.5, this._rgba(col, 0.12));
        gl.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 4.2, 0, Math.PI * 2); ctx.fill();

        // Core.
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.35, 0, Math.PI * 2); ctx.fill();

        // Label.
        if (n.label && this.cam.zoom > 0.5) {
          ctx.fillStyle = 'rgba(230,240,255,0.92)';
          ctx.font = `600 ${Math.round(13)}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label, p.x, p.y - r - 8);
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

    /* ------ gravity / accretion particles ----------------------------------*/
    seedParticles(count, bounds) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = bounds * (0.6 + Math.random() * 0.5);
        this.particles.push({
          x: Math.cos(ang) * rad,
          y: Math.sin(ang) * rad,
          vx: -Math.sin(ang) * (0.4 + Math.random() * 0.6),
          vy: Math.cos(ang) * (0.4 + Math.random() * 0.6),
          trail: [],
          captured: false,
          hue: PALETTE[i % PALETTE.length]
        });
      }
    }

    _drawParticles(dt) {
      const ctx = this.ctx;
      const G = this.extra.G != null ? this.extra.G : 60;
      const horizon = this.extra.horizon || 0;
      for (const p of this.particles) {
        // Acceleration = informational topology: biased toward dense regions.
        let ax = 0, ay = 0;
        for (const n of this.g.nodes) {
          const dx = n.x - p.x, dy = n.y - p.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 25) d2 = 25;
          const mass = 1 + this.g.degree(n.id);
          const f = (G * mass) / d2;
          const d = Math.sqrt(d2);
          ax += (dx / d) * f; ay += (dy / d) * f;
        }
        p.vx += ax * dt * 0.06; p.vy += ay * dt * 0.06;
        // mild damping keeps orbits legible
        p.vx *= 0.999; p.vy *= 0.999;
        p.x += p.vx; p.y += p.vy;

        const distC = Math.hypot(p.x, p.y);
        if (horizon > 0 && distC < horizon) {
          // Inside the horizon: internal continuations dominate — no escape.
          p.captured = true;
          p.x *= 0.96; p.y *= 0.96;
          p.vx *= 0.9; p.vy *= 0.9;
        }
        // Respawn drifters that fly off (keeps the field populated).
        if (distC > 1600 && !p.captured) {
          const ang = Math.random() * Math.PI * 2, rad = 700;
          p.x = Math.cos(ang) * rad; p.y = Math.sin(ang) * rad;
          p.vx = -Math.sin(ang) * 0.6; p.vy = Math.cos(ang) * 0.6;
          p.trail.length = 0;
        }

        p.trail.push(this.worldToScreen(p.x, p.y));
        if (p.trail.length > 36) p.trail.shift();

        // Draw trail.
        ctx.beginPath();
        for (let i = 0; i < p.trail.length; i++) {
          const t = p.trail[i];
          if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
        }
        ctx.strokeStyle = this._rgba(p.hue, p.captured ? 0.15 : 0.5);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        const head = p.trail[p.trail.length - 1];
        if (head) {
          ctx.fillStyle = this._rgba(p.hue, 0.95);
          ctx.beginPath(); ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    _horizonOverlay() {
      const horizon = this.extra.horizon || 0;
      if (horizon <= 0) return;
      const ctx = this.ctx;
      const c = this.worldToScreen(0, 0);
      const Rp = horizon * this.cam.zoom;
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

    /* ------ Flatland: a static sphere intersecting a plane = illusory time --*/
    _flatland() {
      const ctx = this.ctx;
      const cx = this.w / 2, planeY = this.h * 0.5;
      // The 2D "plane" inhabited by flatlanders.
      ctx.strokeStyle = 'rgba(124,246,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, planeY); ctx.lineTo(this.w - 60, planeY); ctx.stroke();

      // The static sphere translating through the plane (we, from outside, see
      // it is unchanging; the flatlander sees a circle appear, grow, vanish).
      const period = 6000;
      const phase = (this.time % period) / period;            // 0..1
      const sphereR = Math.min(this.w, this.h) * 0.16;
      const travel = (phase * 2 - 1) * sphereR * 2.4;          // center offset from plane
      const sphereCY = planeY - travel;

      // Ghost of the full sphere (the higher-dimensional object) — faint.
      ctx.save();
      ctx.globalAlpha = 0.28;
      const sg = ctx.createRadialGradient(cx - sphereR * 0.3, sphereCY - sphereR * 0.3, sphereR * 0.1, cx, sphereCY, sphereR);
      sg.addColorStop(0, 'rgba(185,155,255,0.9)');
      sg.addColorStop(1, 'rgba(80,60,160,0.05)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx, sphereCY, sphereR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // The cross-section the flatlander actually experiences (their "now").
      const dy = Math.abs(planeY - sphereCY);
      if (dy < sphereR) {
        const cr = Math.sqrt(sphereR * sphereR - dy * dy);
        const cg = ctx.createRadialGradient(cx, planeY, 0, cx, planeY, cr * 1.4);
        cg.addColorStop(0, 'rgba(124,246,255,0.9)');
        cg.addColorStop(1, 'rgba(124,246,255,0)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cx, planeY, cr * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(124,246,255,0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, planeY, cr, 0, Math.PI * 2); ctx.stroke();
        this.extra.flatRadius = cr / sphereR;
      } else {
        this.extra.flatRadius = 0;
      }

      ctx.fillStyle = 'rgba(180,200,255,0.55)';
      ctx.font = '300 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('the flatlander’s "now"', cx, planeY + 34);
      ctx.fillText('the static object (unseen)', cx, sphereCY - sphereR - 14);
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
