(() => {
  'use strict';
  const { CFG, configured, sb, rpc, normCode, channelName, store, loadImg, b64ToBlob, friendlyError } = Snap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const CODE_KEY = 'snap.board.code';
  const LABEL_KEY = 'snap.board.lessonLabel';
  const ANN_PREFIX = 'snap.ann.';
  const FONT = '"Segoe UI", Arial, sans-serif';
  const POLL_MS = 15000;

  // ---------------------------------------------------------------------
  //  Icons
  // ---------------------------------------------------------------------
  const ICONS = {
    pan: '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
    pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    hl: '<path d="M15.5 4.5l4 4-8 8-4-4z"/><path d="M7.5 12.5 5 15v2h2l2.5-2.5"/><path d="M3 21h18" stroke-width="3" opacity=".6"/>',
    arrow: '<path d="M5 19 19 5M10 5h9v9"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>',
    text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
    tick: '<path d="M4 12.5l5 5L20 6.5"/>',
    cross: '<path d="M6 6l12 12M18 6 6 18"/>',
    redact: '<rect x="3" y="8" width="18" height="8" rx="1" fill="currentColor"/>',
    eraser: '<path d="M8 20h12"/><path d="M5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12.5 18H7.5z"/><path d="M9 11.5l5 5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
    clearmarks: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    zoomin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6M11 8v6"/>',
    zoomout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    fullscreen: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>',
    compare: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    save: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

  // ---------------------------------------------------------------------
  //  Tool definitions
  // ---------------------------------------------------------------------
  const TOOLS = [
    { id: 'pan', name: 'Move / zoom (V)', key: 'v' },
    { id: 'pen', name: 'Pen (P)', key: 'p' },
    { id: 'hl', name: 'Highlighter (I)', key: 'i' },
    { id: 'arrow', name: 'Arrow (A)', key: 'a' },
    { id: 'rect', name: 'Box (B)', key: 'b' },
    { id: 'ellipse', name: 'Circle (C)', key: 'c' },
    { id: 'text', name: 'Text (T)', key: 't' },
    { id: 'tick', name: 'Tick stamp' },
    { id: 'cross', name: 'Cross stamp' },
    { id: 'redact', name: 'Redact (cover a name)' },
    { id: 'eraser', name: 'Eraser (E) – tap or drag over a mark', key: 'e' },
  ];
  const COLOURS = ['#e11d48', '#2563eb', '#16a34a', '#facc15', '#111827', '#ffffff'];
  const SIZES = {
    s: { line: 4, font: 30, stamp: 56, dot: 8 },
    m: { line: 8, font: 46, stamp: 90, dot: 14 },
    l: { line: 16, font: 72, stamp: 140, dot: 22 },
  };

  // ---------------------------------------------------------------------
  //  State
  // ---------------------------------------------------------------------
  const state = {
    code: null,
    snaps: [], // ordered oldest → newest
    tool: 'pen',
    colour: COLOURS[0],
    size: 'm',
    autoShow: true,
    compare: false,
    active: 0,
    panes: [],
    channel: null,
    lessonLabel: store.get(LABEL_KEY, ''),
    localSeq: 0,
  };

  // ---------------------------------------------------------------------
  //  Geometry helpers
  // ---------------------------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Maps image coordinates to "display" coordinates for a rotation (0/90/180/270, clockwise).
  function rotMatrix(r, W, H) {
    const m = new DOMMatrix();
    if (r === 90) return m.translate(H, 0).rotate(90);
    if (r === 180) return m.translate(W, H).rotate(180);
    if (r === 270) return m.translate(0, W).rotate(270);
    return m;
  }
  const dispSize = (s) => (s.rotation % 180 ? [s.h, s.w] : [s.w, s.h]);

  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = dx * dx + dy * dy;
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  const normBox = (a, b) => ({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) });

  // ---------------------------------------------------------------------
  //  Annotation drawing
  // ---------------------------------------------------------------------
  const measureCtx = document.createElement('canvas').getContext('2d');
  function textWidth(text, size) {
    measureCtx.font = `700 ${size}px ${FONT}`;
    return Math.max(...text.split('\n').map((l) => measureCtx.measureText(l).width), 1);
  }
  function contrastFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? '#000000' : '#ffffff';
  }

  function drawAnns(ctx, anns, showAll) {
    for (const a of anns) {
      if (!showAll && a.type !== 'redact') continue;
      drawAnn(ctx, a);
    }
  }

  function drawAnn(ctx, a) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (a.type) {
      case 'pen':
      case 'hl': {
        ctx.strokeStyle = a.color;
        ctx.fillStyle = a.color;
        ctx.lineWidth = a.w;
        if (a.type === 'hl') { ctx.globalAlpha = 0.4; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; }
        const p = a.pts;
        if (p.length === 1) {
          ctx.beginPath(); ctx.arc(p[0][0], p[0][1], a.w / 2, 0, Math.PI * 2); ctx.fill();
          break;
        }
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length - 1; i++) {
          const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
          ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
        }
        const l = p[p.length - 1];
        ctx.lineTo(l[0], l[1]);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const [x1, y1] = a.a, [x2, y2] = a.b;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const len = Math.hypot(x2 - x1, y2 - y1);
        const head = Math.min(Math.max(a.w * 4, a.w + 10), len * 0.6);
        ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = a.w;
        const sx = x2 - Math.cos(ang) * head * 0.6, sy = y2 - Math.sin(ang) * head * 0.6;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(sx, sy); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
        ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'rect': {
        const b = normBox(a.a, a.b);
        ctx.strokeStyle = a.color; ctx.lineWidth = a.w;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        break;
      }
      case 'ellipse': {
        const b = normBox(a.a, a.b);
        ctx.strokeStyle = a.color; ctx.lineWidth = a.w;
        ctx.beginPath();
        ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w / 2, 0.5), Math.max(b.h / 2, 0.5), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'redact': {
        const b = normBox(a.a, a.b);
        ctx.fillStyle = '#111111';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        break;
      }
      case 'text': {
        ctx.translate(a.p[0], a.p[1]);
        ctx.rotate((-a.rot * Math.PI) / 180);
        ctx.font = `700 ${a.size}px ${FONT}`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = a.size * 0.16;
        ctx.strokeStyle = contrastFor(a.color);
        ctx.fillStyle = a.color;
        a.text.split('\n').forEach((line, i) => {
          ctx.strokeText(line, 0, i * a.size * 1.15);
          ctx.fillText(line, 0, i * a.size * 1.15);
        });
        break;
      }
      case 'tick':
      case 'cross': {
        ctx.translate(a.p[0], a.p[1]);
        ctx.rotate((-a.rot * Math.PI) / 180);
        const s = a.size;
        const path = new Path2D();
        if (a.type === 'tick') {
          path.moveTo(-0.42 * s, 0.02 * s); path.lineTo(-0.12 * s, 0.32 * s); path.lineTo(0.45 * s, -0.35 * s);
        } else {
          path.moveTo(-0.35 * s, -0.35 * s); path.lineTo(0.35 * s, 0.35 * s);
          path.moveTo(0.35 * s, -0.35 * s); path.lineTo(-0.35 * s, 0.35 * s);
        }
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.2; ctx.stroke(path);
        ctx.strokeStyle = a.type === 'tick' ? '#16a34a' : '#dc2626'; ctx.lineWidth = s * 0.12; ctx.stroke(path);
        break;
      }
    }
    ctx.restore();
  }

  function hitAnn(a, p, tol) {
    switch (a.type) {
      case 'pen':
      case 'hl': {
        const r = tol + a.w / 2;
        if (a.pts.length === 1) return Math.hypot(p[0] - a.pts[0][0], p[1] - a.pts[0][1]) <= r;
        for (let i = 1; i < a.pts.length; i++) if (segDist(p, a.pts[i - 1], a.pts[i]) <= r) return true;
        return false;
      }
      case 'arrow': return segDist(p, a.a, a.b) <= tol + a.w / 2;
      case 'rect':
      case 'redact': {
        const b = normBox(a.a, a.b);
        return p[0] >= b.x - tol && p[0] <= b.x + b.w + tol && p[1] >= b.y - tol && p[1] <= b.y + b.h + tol;
      }
      case 'ellipse': {
        const b = normBox(a.a, a.b);
        const rx = b.w / 2 + tol, ry = b.h / 2 + tol;
        const dx = (p[0] - (b.x + b.w / 2)) / rx, dy = (p[1] - (b.y + b.h / 2)) / ry;
        return dx * dx + dy * dy <= 1;
      }
      case 'text': {
        const r = (a.rot * Math.PI) / 180;
        const dx = p[0] - a.p[0], dy = p[1] - a.p[1];
        const lx = dx * Math.cos(r) - dy * Math.sin(r);
        const ly = dx * Math.sin(r) + dy * Math.cos(r);
        const lines = a.text.split('\n').length;
        return lx >= -tol && lx <= a.bw + tol && ly >= -tol && ly <= lines * a.size * 1.15 + tol;
      }
      case 'tick':
      case 'cross':
        return Math.hypot(p[0] - a.p[0], p[1] - a.p[1]) <= a.size * 0.55 + tol;
    }
    return false;
  }

  // ---------------------------------------------------------------------
  //  Snaps
  // ---------------------------------------------------------------------
  function makeSnap({ id, local = false, created = new Date(), w = 0, h = 0 }) {
    const saved = store.get(ANN_PREFIX + id, null);
    return {
      id, local, created, w, h,
      img: null, url: null, loading: false, failed: false,
      rotation: saved ? saved.rotation || 0 : 0,
      anns: saved ? saved.anns || [] : [],
      undo: [], redo: [],
      showAnn: true,
    };
  }
  const snapNum = (s) => state.snaps.indexOf(s) + 1;

  const persistTimers = new Map();
  function persist(s) {
    if (s.local) return; // laptop images aren't kept after a reload anyway
    clearTimeout(persistTimers.get(s.id));
    persistTimers.set(s.id, setTimeout(() => {
      if (!state.snaps.includes(s)) return;
      if (!s.anns.length && !s.rotation) store.del(ANN_PREFIX + s.id);
      else store.set(ANN_PREFIX + s.id, { anns: s.anns, rotation: s.rotation });
    }, 400));
  }

  function commit(s, ann) {
    s.undo.push(s.anns);
    s.anns = [...s.anns, ann];
    s.redo = [];
    s.showAnn = true;
    changed(s);
  }

  function changed(s) {
    persist(s);
    redrawSnap(s);
    updateActionButtons();
    renderStrip();
  }

  function redrawSnap(s) {
    for (const p of state.panes) if (p.snap === s) p.request();
  }

  function activePane() { return state.panes[state.active]; }
  function activeSnap() { return activePane().snap; }

  // ---------------------------------------------------------------------
  //  Pane (one zoomable, annotatable view)
  // ---------------------------------------------------------------------
  class Pane {
    constructor(idx, el) {
      this.idx = idx;
      this.el = el;
      this.canvas = $('canvas', el);
      this.ctx = this.canvas.getContext('2d');
      this.tag = $('.pane-tag', el);
      this.snap = null;
      this.s = 1; this.tx = 0; this.ty = 0;
      this.fitted = true;
      this.cw = 1; this.ch = 1;
      this.ptrs = new Map();
      this.mode = null;
      this.draft = null;
      this.raf = 0;

      new ResizeObserver(() => this.resize()).observe(el);
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => this.onDown(e));
      c.addEventListener('pointermove', (e) => this.onMove(e));
      c.addEventListener('pointerup', (e) => this.onUp(e, false));
      c.addEventListener('pointercancel', (e) => this.onUp(e, true));
      c.addEventListener('lostpointercapture', (e) => { if (this.ptrs.has(e.pointerId)) this.onUp(e, true); });
      c.addEventListener('contextmenu', (e) => e.preventDefault());
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        setActive(this.idx);
        const p = this.local(e);
        this.zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      }, { passive: false });
    }

    resize() {
      const r = this.el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.cw = r.width; this.ch = r.height;
      const d = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(r.width * d);
      this.canvas.height = Math.round(r.height * d);
      if (this.fitted) this.fit(); else this.request();
    }

    setSnap(s) {
      this.snap = s;
      this.draft = null;
      this.fit();
      this.updateTag();
    }

    updateTag() {
      this.tag.textContent = (this.idx === 0 ? 'A' : 'B') + (this.snap ? ` · #${snapNum(this.snap)}` : '');
    }

    fitScale() {
      if (!this.snap || !this.snap.w) return 1;
      const [dw, dh] = dispSize(this.snap);
      return Math.min(this.cw / dw, this.ch / dh) * 0.97;
    }

    fit() {
      this.fitted = true;
      if (this.snap && this.snap.w) {
        const [dw, dh] = dispSize(this.snap);
        this.s = this.fitScale();
        this.tx = (this.cw - dw * this.s) / 2;
        this.ty = (this.ch - dh * this.s) / 2;
      }
      this.request();
    }

    zoomAt(cx, cy, f) {
      if (!this.snap || !this.snap.w) return;
      const qx = (cx - this.tx) / this.s, qy = (cy - this.ty) / this.s;
      const fs = this.fitScale();
      this.s = clamp(this.s * f, fs * 0.5, Math.max(fs * 12, 8));
      this.tx = cx - this.s * qx;
      this.ty = cy - this.s * qy;
      this.fitted = false;
      this.request();
    }

    matrix() {
      const s = this.snap;
      return new DOMMatrix().translate(this.tx, this.ty).scale(this.s).multiply(rotMatrix(s.rotation, s.w, s.h));
    }

    toImage(x, y) {
      const p = this.matrix().inverse().transformPoint(new DOMPoint(x, y));
      return [p.x, p.y];
    }

    local(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    request() {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
    }

    draw() {
      const ctx = this.ctx;
      const d = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const s = this.snap;
      if (!s) return;
      if (!s.img) {
        ctx.fillStyle = '#93a2b4';
        ctx.font = `${20 * d}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(s.failed ? 'Could not load this snap' : 'Loading…', this.canvas.width / 2, this.canvas.height / 2);
        return;
      }
      ctx.setTransform(new DOMMatrix().scale(d).multiply(this.matrix()));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.img, 0, 0);
      drawAnns(ctx, s.anns, s.showAnn);
      if (this.draft) drawAnn(ctx, this.draft);
    }

    // ----- pointer handling -----
    onDown(e) {
      e.preventDefault();
      setActive(this.idx);
      closePopovers();
      try { this.canvas.setPointerCapture(e.pointerId); } catch {}
      const p = this.local(e);
      this.ptrs.set(e.pointerId, p);

      if (this.ptrs.size === 2) {        // second finger → pinch zoom, cancel any half-drawn mark
        this.cancelTool();
        this.startPinch();
        this.mode = 'pinch';
        return;
      }
      if (this.ptrs.size > 2) return;
      if (!this.snap || !this.snap.img) { this.mode = 'pan'; this.last = p; return; }

      if (state.tool === 'pan' || e.button === 1 || e.button === 2) {
        this.mode = 'pan'; this.last = p; return;
      }
      this.mode = 'draw';
      startTool(this, p);
    }

    onMove(e) {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = this.local(e);
      this.ptrs.set(e.pointerId, p);
      if (this.mode === 'pinch' && this.ptrs.size >= 2) this.updatePinch();
      else if (this.mode === 'pan') {
        this.tx += p.x - this.last.x;
        this.ty += p.y - this.last.y;
        this.last = p;
        this.fitted = false;
        this.request();
      } else if (this.mode === 'draw') {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        if (evs.length > 1) for (const ce of evs) moveTool(this, this.local(ce));
        else moveTool(this, p);
      }
    }

    onUp(e, cancelled) {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      if (this.mode === 'draw') {
        if (cancelled) this.cancelTool(); else finishTool(this);
        this.mode = this.ptrs.size ? 'wait' : null;
      } else if (this.mode === 'pinch') {
        this.mode = this.ptrs.size ? 'wait' : null; // don't start drawing with the finger left behind
      } else if (!this.ptrs.size) {
        this.mode = null;
      }
    }

    startPinch() {
      const [a, b] = [...this.ptrs.values()];
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      this.p0 = { d: dist(a, b) || 1, s: this.s, qx: (m.x - this.tx) / this.s, qy: (m.y - this.ty) / this.s };
    }

    updatePinch() {
      if (!this.snap || !this.snap.w) return;
      const [a, b] = [...this.ptrs.values()];
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const fs = this.fitScale();
      this.s = clamp(this.p0.s * (dist(a, b) / this.p0.d), fs * 0.5, Math.max(fs * 12, 8));
      this.tx = m.x - this.s * this.p0.qx;
      this.ty = m.y - this.s * this.p0.qy;
      this.fitted = false;
      this.request();
    }

    cancelTool() {
      if (this.erasing && this.eraseBefore && this.snap) {
        this.snap.anns = this.eraseBefore; // undo a half-done erase
        changed(this.snap);
      }
      this.erasing = false;
      this.eraseBefore = null;
      this.draft = null;
      this.request();
    }
  }

  // ---------------------------------------------------------------------
  //  Tools
  // ---------------------------------------------------------------------
  function startTool(pane, sp) {
    const s = pane.snap;
    const ip = pane.toImage(sp.x, sp.y);
    const sz = SIZES[state.size];
    const k = 1 / pane.s; // screen px → image px
    const c = state.colour;
    switch (state.tool) {
      case 'pen': pane.draft = { type: 'pen', pts: [ip], color: c, w: sz.line * k }; break;
      case 'hl': pane.draft = { type: 'hl', pts: [ip], color: c, w: sz.line * 3.5 * k }; break;
      case 'arrow':
      case 'rect':
      case 'ellipse': pane.draft = { type: state.tool, a: ip, b: ip, color: c, w: sz.line * k }; break;
      case 'redact': pane.draft = { type: 'redact', a: ip, b: ip }; break;
      case 'tick':
      case 'cross':
        commit(s, { type: state.tool, p: ip, size: sz.stamp * k, rot: s.rotation });
        pane.mode = 'wait';
        break;
      case 'text':
        pane.mode = 'wait';
        askText((t) => {
          const size = sz.font * k;
          commit(s, { type: 'text', p: ip, text: t, color: c, size, rot: s.rotation, bw: textWidth(t, size) });
        });
        break;
      case 'eraser':
        pane.erasing = true;
        pane.eraseBefore = s.anns;
        eraseAt(pane, ip);
        break;
    }
    pane.request();
  }

  function moveTool(pane, sp) {
    const ip = pane.toImage(sp.x, sp.y);
    const d = pane.draft;
    if (pane.erasing) { eraseAt(pane, ip); return; }
    if (!d) return;
    if (d.pts) {
      const l = d.pts[d.pts.length - 1];
      if (Math.hypot(ip[0] - l[0], ip[1] - l[1]) * pane.s < 1.5) return;
      d.pts.push(ip);
    } else {
      d.b = ip;
    }
    pane.request();
  }

  function finishTool(pane) {
    const s = pane.snap;
    if (pane.erasing) {
      if (pane.eraseBefore && pane.eraseBefore !== s.anns) {
        s.undo.push(pane.eraseBefore);
        s.redo = [];
        changed(s);
      }
      pane.erasing = false;
      pane.eraseBefore = null;
      return;
    }
    const d = pane.draft;
    pane.draft = null;
    if (!d) return;
    if (d.a && Math.hypot(d.a[0] - d.b[0], d.a[1] - d.b[1]) * pane.s < 6) { pane.request(); return; } // accidental tap
    commit(s, d);
  }

  function eraseAt(pane, ip) {
    const s = pane.snap;
    const tol = 14 / pane.s;
    const keep = s.anns.filter((a) => !hitAnn(a, ip, tol));
    if (keep.length !== s.anns.length) {
      s.anns = keep;
      redrawSnap(s);
    }
  }

  function undo() {
    const s = activeSnap();
    if (!s || !s.undo.length) return;
    s.redo.push(s.anns);
    s.anns = s.undo.pop();
    s.showAnn = true;
    changed(s);
  }
  function redo() {
    const s = activeSnap();
    if (!s || !s.redo.length) return;
    s.undo.push(s.anns);
    s.anns = s.redo.pop();
    s.showAnn = true;
    changed(s);
  }
  function clearMarks() {
    const s = activeSnap();
    if (!s || !s.anns.length) return;
    s.undo.push(s.anns);
    s.anns = [];
    s.redo = [];
    changed(s);
    toast('Annotations cleared. Undo brings them back.');
  }
  function toggleAnn() {
    const s = activeSnap();
    if (!s) return;
    s.showAnn = !s.showAnn;
    redrawSnap(s);
    updateActionButtons();
  }

  // ---------------------------------------------------------------------
  //  Toolbar UI
  // ---------------------------------------------------------------------
  function buildToolbar() {
    const tools = $('#tools');
    for (const t of TOOLS) {
      const b = document.createElement('button');
      b.className = 'tool';
      b.dataset.tool = t.id;
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      b.innerHTML = icon(t.id);
      b.onclick = () => setTool(t.id);
      tools.append(b);
    }
    const cols = $('#colours');
    for (const c of COLOURS) {
      const b = document.createElement('button');
      b.className = 'swatch';
      b.dataset.colour = c;
      b.title = 'Colour';
      b.innerHTML = `<span style="background:${c}"></span>`;
      b.onclick = () => { state.colour = c; if (['pan', 'eraser', 'tick', 'cross', 'redact'].includes(state.tool)) setTool('pen'); updateToolbar(); };
      cols.append(b);
    }
    const sizes = $('#sizes');
    for (const k of Object.keys(SIZES)) {
      const b = document.createElement('button');
      b.className = 'tool size';
      b.dataset.size = k;
      b.title = { s: 'Thin', m: 'Medium', l: 'Thick' }[k];
      const dpx = SIZES[k].dot;
      b.innerHTML = `<span style="width:${dpx}px;height:${dpx}px"></span>`;
      b.onclick = () => { state.size = k; updateToolbar(); };
      sizes.append(b);
    }
    updateToolbar();
  }

  function setTool(id) {
    state.tool = id;
    for (const p of state.panes) p.canvas.style.cursor = id === 'pan' ? 'grab' : id === 'text' ? 'text' : 'crosshair';
    updateToolbar();
  }

  function updateToolbar() {
    $$('#tools .tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === state.tool));
    $$('#colours .swatch').forEach((b) => b.classList.toggle('on', b.dataset.colour === state.colour));
    $$('#sizes .tool').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  }

  function updateActionButtons() {
    const s = activeSnap();
    $('#undoBtn').disabled = !s || !s.undo.length;
    $('#redoBtn').disabled = !s || !s.redo.length;
    $('#clearBtn').disabled = !s || !s.anns.length;
    $('#eyeBtn').disabled = !s;
    $('#eyeBtn').innerHTML = icon(s && !s.showAnn ? 'eyeoff' : 'eye');
    $('#eyeBtn').classList.toggle('on', !!(s && !s.showAnn));
    const has = !!s;
    $$('#viewCtl .vc').forEach((b) => (b.disabled = !has));
  }

  // ---------------------------------------------------------------------
  //  Showing snaps, compare mode, strip
  // ---------------------------------------------------------------------
  function setActive(i) {
    if (!state.compare) i = 0;
    if (state.active === i) return;
    state.active = i;
    state.panes.forEach((p, j) => p.el.classList.toggle('active', j === i));
    updateActionButtons();
    renderStrip();
  }

  function show(s, paneIdx = state.active) {
    const p = state.panes[paneIdx];
    p.setSnap(s);
    if (s && !s.img && !s.local) loadImage(s);
    updateActionButtons();
    renderStrip();
    updateEmpty();
  }

  function setCompare(on) {
    state.compare = on;
    $('#stage').classList.toggle('compare', on);
    $('#pane1').classList.toggle('hidden', !on);
    $('#compareBtn').classList.toggle('on', on);
    $('#savePop').classList.toggle('compare', on);
    if (on) {
      const a = state.panes[0].snap;
      const i = state.snaps.indexOf(a);
      const b = state.snaps[i - 1] || state.snaps[i + 1] || a;
      show(b, 1);
      state.active = 0;
      setActive(1);
      toast('Compare: tap a pane, then tap a thumbnail to put it there.');
    } else {
      state.active = 0;
      state.panes[0].el.classList.add('active');
      state.panes[1].setSnap(null);
    }
    state.panes.forEach((p) => p.updateTag());
    updateActionButtons();
    renderStrip();
  }

  function step(dir) {
    const cur = activeSnap();
    if (!state.snaps.length) return;
    let i = cur ? state.snaps.indexOf(cur) + dir : state.snaps.length - 1;
    i = clamp(i, 0, state.snaps.length - 1);
    show(state.snaps[i]);
  }

  function renderStrip() {
    const strip = $('#strip');
    strip.innerHTML = '';
    const a = state.panes[0].snap, b = state.compare ? state.panes[1].snap : null;
    state.snaps.forEach((s, i) => {
      const t = document.createElement('button');
      t.className = 'thumb' + (s === a ? ' in-a' : '') + (s === b ? ' in-b' : '');
      t.title = `Snap ${i + 1} – ${s.created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (s.url) {
        const img = document.createElement('img');
        img.src = s.url; img.alt = ''; img.draggable = false;
        if (s.rotation) img.style.transform = `rotate(${s.rotation}deg)`;
        t.append(img);
      } else {
        const l = document.createElement('span');
        l.className = 'loading';
        l.textContent = s.failed ? 'Failed – tap to retry' : 'Loading…';
        t.append(l);
      }
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = '#' + (i + 1) + (s.local ? ' (laptop)' : '');
      t.append(n);
      if (state.compare && (s === a || s === b)) {
        const bd = document.createElement('span');
        bd.className = 'badge';
        bd.textContent = s === a && s === b ? 'A B' : s === a ? 'A' : 'B';
        bd.style.color = s === a ? '#93c5fd' : '#f59e0b';
        t.append(bd);
      }
      if (s.anns.length) {
        const dot = document.createElement('span');
        dot.className = 'ann-dot';
        t.append(dot);
      }
      t.onclick = () => {
        if (s.failed) { s.failed = false; loadImage(s); }
        show(s);
      };
      strip.append(t);
    });
    const sel = strip.querySelector('.in-a, .in-b');
    if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    state.panes.forEach((p) => p.updateTag());
  }

  function updateEmpty() {
    const none = state.snaps.length === 0;
    $('#empty').classList.toggle('hidden', !none);
    $('#viewCtl').classList.toggle('hidden', none);
    $('#pane0').classList.toggle('hidden', none);
    if (none && state.compare) setCompare(false);
  }

  // ---------------------------------------------------------------------
  //  Loading images
  // ---------------------------------------------------------------------
  async function loadImage(s) {
    if (s.img || s.loading || s.local) return;
    s.loading = true;
    s.failed = false;
    try {
      const b64 = await rpc('snap_get', { p_code: state.code, p_id: s.id });
      if (!b64) throw new Error('Snap not found');
      s.url = URL.createObjectURL(b64ToBlob(b64, 'image/jpeg'));
      s.img = await loadImg(s.url);
      s.w = s.img.naturalWidth;
      s.h = s.img.naturalHeight;
    } catch (e) {
      console.warn(e);
      s.failed = true;
    } finally {
      s.loading = false;
    }
    for (const p of state.panes) if (p.snap === s) { if (p.fitted) p.fit(); else p.request(); }
    renderStrip();
  }

  let loadingQueue = false;
  async function loadAll() {
    if (loadingQueue) return;
    loadingQueue = true;
    try {
      for (let i = state.snaps.length - 1; i >= 0; i--) {
        const s = state.snaps[i];
        if (s && !s.img && !s.failed && !s.local) await loadImage(s);
      }
    } finally {
      loadingQueue = false;
    }
  }

  function removeSnap(s) {
    const i = state.snaps.indexOf(s);
    if (i < 0) return;
    state.snaps.splice(i, 1);
    if (s.url) setTimeout(() => URL.revokeObjectURL(s.url), 1000);
    store.del(ANN_PREFIX + s.id);
    state.panes.forEach((p, j) => {
      if (p.snap === s) {
        const next = state.snaps[Math.min(i, state.snaps.length - 1)] || null;
        if (j === 0 || state.compare) show(next, j);
      }
    });
    updateEmpty();
    renderStrip();
    updateActionButtons();
  }

  // ---------------------------------------------------------------------
  //  Syncing with Supabase
  // ---------------------------------------------------------------------
  let syncing = null, syncAgain = false, firstSync = true;
  function sync() {
    if (!configured || !state.code) return;
    if (syncing) { syncAgain = true; return syncing; }
    syncing = (async () => {
      try {
        const rows = (await rpc('snap_list', { p_code: state.code })) || [];
        applyList(rows);
        if (!state.channelLive) setLive('wait', 'Checking every 15 s');
      } catch (e) {
        console.warn(e);
        setLive('bad', /passcode/i.test(e.message) ? 'Wrong passcode' : 'Offline');
        if (/passcode/i.test(e.message)) { store.del(CODE_KEY); showGate(); }
      } finally {
        syncing = null;
        if (syncAgain) { syncAgain = false; sync(); }
      }
    })();
    return syncing;
  }

  function applyList(rows) {
    const ids = new Set(rows.map((r) => r.snap_id));
    for (const s of [...state.snaps]) if (!s.local && !ids.has(s.id)) removeSnap(s);

    let newest = null;
    for (const r of rows) {
      if (state.snaps.some((s) => s.id === r.snap_id)) continue;
      const s = makeSnap({ id: r.snap_id, created: new Date(r.taken_at), w: r.w || 0, h: r.h || 0 });
      state.snaps.push(s);
      newest = s;
    }
    state.snaps.sort((a, b) => a.created - b.created);

    if (firstSync) {
      firstSync = false;
      cleanStaleAnnotations(ids);
      if (newest) show(state.snaps[state.snaps.length - 1]);
    } else if (newest) {
      if (!activeSnap() || (state.autoShow && !state.compare)) {
        show(newest, state.compare ? state.active : 0);
        toast(`New snap #${snapNum(newest)}`);
      } else {
        toast(`New snap #${snapNum(newest)} – tap here to show it`, () => show(newest));
      }
    }
    updateEmpty();
    renderStrip();
    loadAll();
  }

  function cleanStaleAnnotations(ids) {
    for (const k of store.keys()) {
      if (k.startsWith(ANN_PREFIX) && !ids.has(k.slice(ANN_PREFIX.length))) store.del(k);
    }
  }

  function setLive(kind, text) {
    const el = $('#live');
    el.className = 'live ' + kind;
    $('span', el).textContent = text;
  }

  async function connectRealtime() {
    try {
      const name = await channelName(state.code);
      const ch = sb().channel(name, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'new' }, () => sync())
        .on('broadcast', { event: 'deleted' }, () => sync())
        .on('broadcast', { event: 'cleared' }, () => sync())
        .subscribe((status) => {
          state.channelLive = status === 'SUBSCRIBED';
          if (status === 'SUBSCRIBED') { setLive('on', 'Live'); sync(); }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setLive('wait', 'Reconnecting…');
        });
      state.channel = ch;
    } catch (e) {
      console.warn(e);
      setLive('wait', 'Checking every 15 s');
    }
  }

  function broadcast(event, payload = {}) {
    try { state.channel && state.channel.send({ type: 'broadcast', event, payload }); } catch {}
  }

  let started = false;
  async function start(code) {
    state.code = code;
    setLive('wait', 'Connecting…');
    if (started) { sync(); return; }
    started = true;
    await sync();
    connectRealtime();
    setInterval(() => { if (!document.hidden) sync(); }, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  }

  // ---------------------------------------------------------------------
  //  Passcode gate
  // ---------------------------------------------------------------------
  function showGate() {
    $('#gate').classList.remove('hidden');
    setTimeout(() => $('#gateCode').focus(), 50);
  }
  $('#gateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = normCode($('#gateCode').value);
    $('#gateErr').textContent = '';
    $('#gateGo').disabled = true;
    try {
      const label = await rpc('snap_check', { p_code: code });
      if ($('#gateRemember').checked) store.set(CODE_KEY, code);
      $('#roomLabel').textContent = label || '';
      $('#gate').classList.add('hidden');
      start(code);
    } catch (err) {
      $('#gateErr').textContent = friendlyError(err);
    } finally {
      $('#gateGo').disabled = false;
    }
  });
  $('#gateSkip').onclick = () => {
    $('#gate').classList.add('hidden');
    setLive('', 'Laptop only');
  };

  // ---------------------------------------------------------------------
  //  Images from the laptop (open / drop / paste)
  // ---------------------------------------------------------------------
  async function addLocal(blob, name = 'image') {
    if (!blob || !/^image\//.test(blob.type)) { toast('That file is not an image.'); return; }
    const s = makeSnap({ id: `local-${Date.now()}-${state.localSeq++}`, local: true, created: new Date() });
    s.url = URL.createObjectURL(blob);
    try {
      s.img = await loadImg(s.url);
    } catch {
      toast(`Could not open ${name}`);
      return;
    }
    s.w = s.img.naturalWidth;
    s.h = s.img.naturalHeight;
    state.snaps.push(s);
    show(s, state.compare ? state.active : 0);
    updateEmpty();
  }

  $('#openBtn').onclick = () => $('#fileInput').click();
  $('#fileInput').addEventListener('change', async (e) => {
    for (const f of e.target.files) await addLocal(f, f.name);
    e.target.value = '';
  });
  const stage = $('#stage');
  let dragDepth = 0;
  stage.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('#dropHint').classList.remove('hidden'); });
  stage.addEventListener('dragover', (e) => e.preventDefault());
  stage.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#dropHint').classList.add('hidden'); } });
  stage.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDepth = 0;
    $('#dropHint').classList.add('hidden');
    for (const f of e.dataTransfer.files) await addLocal(f, f.name);
  });
  document.addEventListener('paste', async (e) => {
    if (isTyping(e.target)) return;
    for (const it of e.clipboardData.items) if (it.type.startsWith('image/')) await addLocal(it.getAsFile(), 'pasted image');
  });

  // ---------------------------------------------------------------------
  //  Saving
  // ---------------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, '0');
  const slug = (s) => String(s || '').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function fileName(s, withAnn) {
    const parts = [dateStr(s.created), slug(state.lessonLabel), 'snap' + pad(snapNum(s))].filter(Boolean);
    return parts.join('_') + (withAnn && s.anns.some((a) => a.type !== 'redact') ? '_annotated' : '') + '.jpg';
  }

  async function ensureImg(s) {
    if (!s.img && !s.local) await loadImage(s);
    if (!s.img) throw new Error(`Snap #${snapNum(s)} could not be loaded`);
  }

  async function renderExport(s, withAnn) {
    await ensureImg(s);
    const [dw, dh] = dispSize(s);
    const c = document.createElement('canvas');
    c.width = dw; c.height = dh;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, dw, dh);
    x.setTransform(rotMatrix(s.rotation, s.w, s.h));
    x.drawImage(s.img, 0, 0);
    drawAnns(x, s.anns, withAnn);
    return c;
  }

  const toBlob = (c) => new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  async function saveOne(withAnn) {
    const s = activeSnap();
    if (!s) return;
    download(await toBlob(await renderExport(s, withAnn)), fileName(s, withAnn));
    toast('Saved to Downloads');
  }

  async function savePair() {
    const [a, b] = [state.panes[0].snap, state.panes[1].snap];
    if (!a || !b) return;
    const ca = await renderExport(a, true), cb = await renderExport(b, true);
    const H = Math.min(Math.max(ca.height, cb.height), 2400);
    const wa = Math.round((ca.width * H) / ca.height), wb = Math.round((cb.width * H) / cb.height);
    const gap = Math.round(H * 0.02);
    const c = document.createElement('canvas');
    c.width = wa + wb + gap * 3; c.height = H + gap * 2;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(ca, gap, gap, wa, H);
    x.drawImage(cb, gap * 2 + wa, gap, wb, H);
    const name = [dateStr(new Date()), slug(state.lessonLabel), `compare_snap${pad(snapNum(a))}-snap${pad(snapNum(b))}`].filter(Boolean).join('_') + '.jpg';
    download(await toBlob(c), name);
    toast('Saved to Downloads');
  }

  async function saveAll(withAnn) {
    if (!state.snaps.length) return false;
    toast('Preparing images…');
    if (!window.JSZip) {
      for (const s of state.snaps) download(await toBlob(await renderExport(s, withAnn)), fileName(s, withAnn));
      toast('Saved to Downloads');
      return true;
    }
    const zip = new JSZip();
    for (const s of state.snaps) {
      const blob = await toBlob(await renderExport(s, withAnn));
      zip.file(fileName(s, withAnn), blob);
    }
    const out = await zip.generateAsync({ type: 'blob' });
    const name = [dateStr(new Date()), slug(state.lessonLabel), 'snaps' + (withAnn ? '_annotated' : '')].filter(Boolean).join('_') + '.zip';
    download(out, name);
    toast(`Saved ${state.snaps.length} snaps to Downloads`);
    return true;
  }

  // Save popover
  const savePop = $('#savePop');
  $('#lessonLabel').value = state.lessonLabel;
  $('#lessonLabel').addEventListener('input', (e) => { state.lessonLabel = e.target.value; store.set(LABEL_KEY, state.lessonLabel); });
  $('#saveBtn').onclick = (e) => {
    e.stopPropagation();
    if (!savePop.classList.contains('hidden')) { closePopovers(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    savePop.style.top = r.bottom + 6 + 'px';
    savePop.style.left = Math.min(r.left, window.innerWidth - 300) + 'px';
    savePop.classList.remove('hidden');
  };
  savePop.addEventListener('click', async (e) => {
    e.stopPropagation();
    const b = e.target.closest('button[data-save]');
    if (!b) return;
    closePopovers();
    if (!state.snaps.length) { toast('Nothing to save yet'); return; }
    try {
      const k = b.dataset.save;
      if (k === 'one-ann') await saveOne(true);
      else if (k === 'one-clean') await saveOne(false);
      else if (k === 'pair-ann') await savePair();
      else if (k === 'all-ann') await saveAll(true);
      else if (k === 'all-clean') await saveAll(false);
    } catch (err) {
      toast('Save failed: ' + friendlyError(err));
    }
  });
  function closePopovers() { savePop.classList.add('hidden'); }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.popover') && !e.target.closest('#saveBtn')) closePopovers(); });

  // ---------------------------------------------------------------------
  //  Modals
  // ---------------------------------------------------------------------
  let modalClose = null;
  function openModal(html, bind) {
    const body = $('#modalBody');
    body.innerHTML = html;
    $('#modal').classList.remove('hidden');
    modalClose = () => { $('#modal').classList.add('hidden'); body.innerHTML = ''; modalClose = null; };
    bind(body, modalClose);
  }
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && modalClose) modalClose(); });

  function askText(cb) {
    openModal(
      `<h2>Add text</h2>
       <textarea id="txtIn" placeholder="Type here…"></textarea>
       <div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" data-ok>Add</button></div>`,
      (b, close) => {
        const ta = $('#txtIn', b);
        ta.focus();
        setTimeout(() => ta.focus(), 60); // again after the pointer-up, which can steal focus
        const ok = () => { const t = ta.value.replace(/\s+$/, ''); close(); if (t) cb(t); };
        $('[data-ok]', b).onclick = ok;
        $('[data-x]', b).onclick = close;
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ok(); } });
      }
    );
  }

  function confirmBox(title, text, okLabel, danger, cb) {
    openModal(
      `<h2></h2><p></p><div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok></button></div>`,
      (b, close) => {
        $('h2', b).textContent = title;
        $('p', b).textContent = text;
        $('[data-ok]', b).textContent = okLabel;
        $('[data-x]', b).onclick = close;
        $('[data-ok]', b).onclick = () => { close(); cb(); };
      }
    );
  }

  function phoneUrl() { return new URL('phone.html', location.href).href; }
  function drawQr(el, size) {
    el.innerHTML = '';
    if (!window.QRCode || location.protocol === 'file:') return;
    new QRCode(el, { text: phoneUrl(), width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
  }

  $('#phoneBtn').onclick = () => openModal(
    `<h2>Phone page</h2><p>Scan with the iPhone camera, then Share → Add to Home Screen.</p>
     <div style="text-align:center"><div class="qr-big" id="qrBig"></div><div class="url" id="qrUrl"></div></div>
     <div class="row"><button class="btn primary" data-x>Close</button></div>`,
    (b, close) => { drawQr($('#qrBig', b), 260); $('#qrUrl', b).textContent = phoneUrl(); $('[data-x]', b).onclick = close; }
  );

  // End lesson
  $('#endBtn').onclick = () => {
    const n = state.snaps.length;
    openModal(
      `<h2>End lesson</h2>
       <p>This deletes ${n === 1 ? 'the 1 snap' : `all ${n} snaps`} from the cloud and clears this screen. Anything you have already saved stays on this laptop.</p>
       <div class="col">
         <button class="btn primary" data-k="ann">Save all (with annotations), then delete</button>
         <button class="btn" data-k="clean">Save all (without annotations), then delete</button>
         <button class="btn danger" data-k="none">Delete without saving</button>
         <button class="btn ghost" data-x>Cancel</button>
       </div>`,
      (b, close) => {
        $('[data-x]', b).onclick = close;
        b.querySelectorAll('[data-k]').forEach((btn) => (btn.onclick = async () => {
          b.querySelectorAll('button').forEach((x) => (x.disabled = true));
          try {
            if (btn.dataset.k !== 'none' && n) await saveAll(btn.dataset.k === 'ann');
            await endLesson();
            close();
          } catch (err) {
            toast('Could not finish: ' + friendlyError(err));
            b.querySelectorAll('button').forEach((x) => (x.disabled = false));
          }
        }));
      }
    );
  };

  async function endLesson() {
    if (configured && state.code) {
      await rpc('snap_clear', { p_code: state.code });
      broadcast('cleared');
    }
    for (const s of [...state.snaps]) removeSnap(s);
    for (const k of store.keys()) if (k.startsWith(ANN_PREFIX)) store.del(k);
    if (state.compare) setCompare(false);
    toast('Lesson ended – snaps deleted from the cloud');
  }

  function deleteCurrent() {
    const s = activeSnap();
    if (!s) return;
    confirmBox(`Delete snap #${snapNum(s)}?`, s.local ? 'It will be removed from this screen.' : 'It will be deleted from the cloud and this screen.', 'Delete', true, async () => {
      try {
        if (!s.local) { await rpc('snap_delete', { p_code: state.code, p_id: s.id }); broadcast('deleted', { id: s.id }); }
        removeSnap(s);
      } catch (e) { toast(friendlyError(e)); }
    });
  }

  // ---------------------------------------------------------------------
  //  Toast
  // ---------------------------------------------------------------------
  let toastTimer;
  function toast(msg, onClick) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    t.classList.toggle('clickable', !!onClick);
    t.onclick = onClick ? () => { onClick(); t.classList.remove('show'); } : null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), onClick ? 6000 : 2600);
  }

  // ---------------------------------------------------------------------
  //  Buttons & keyboard
  // ---------------------------------------------------------------------
  function wireButtons() {
    $$('[data-icon]').forEach((b) => {
      const label = b.textContent.trim();
      b.innerHTML = icon(b.dataset.icon) + (label ? `<span class="lbl">${label}</span>` : '');
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.title || label);
    });
    $('#undoBtn').onclick = undo;
    $('#redoBtn').onclick = redo;
    $('#eyeBtn').onclick = toggleAnn;
    $('#clearBtn').onclick = clearMarks;
    const centreZoom = (f) => { const p = activePane(); p.zoomAt(p.cw / 2, p.ch / 2, f); };
    $('#zoomIn').onclick = () => centreZoom(1.4);
    $('#zoomOut').onclick = () => centreZoom(1 / 1.4);
    $('#fitBtn').onclick = () => activePane().fit();
    $('#rotateBtn').onclick = rotate;
    $('#deleteBtn').onclick = deleteCurrent;
    $('#autoBtn').onclick = () => {
      state.autoShow = !state.autoShow;
      $('#autoBtn').classList.toggle('on', state.autoShow);
      toast(state.autoShow ? 'New snaps will appear straight away' : 'New snaps wait in the strip until you tap them');
    };
    $('#autoBtn').classList.toggle('on', state.autoShow);
    $('#compareBtn').onclick = () => { if (state.snaps.length) setCompare(!state.compare); else toast('No snaps to compare yet'); };
    $('#fsBtn').onclick = toggleFullscreen;
  }

  function rotate() {
    const s = activeSnap();
    if (!s || !s.w) return;
    s.rotation = (s.rotation + 90) % 360;
    for (const p of state.panes) if (p.snap === s) p.fit();
    persist(s);
    renderStrip();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (modalClose) modalClose(); closePopovers(); return; }
    if (isTyping(e.target) || modalClose) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    else if (k === 'f') toggleFullscreen();
    else if (k === 'h') toggleAnn();
    else if (k === 'r') rotate();
    else if (k === '0') activePane().fit();
    else if (k === '+' || k === '=') $('#zoomIn').click();
    else if (k === '-') $('#zoomOut').click();
    else if (k === 'delete') deleteCurrent();
    else {
      const t = TOOLS.find((t) => t.key === k);
      if (t) setTool(t.id);
    }
  });

  window.addEventListener('beforeunload', () => {
    for (const s of state.snaps) if (!s.local && (s.anns.length || s.rotation)) store.set(ANN_PREFIX + s.id, { anns: s.anns, rotation: s.rotation });
  });

  // ---------------------------------------------------------------------
  //  Boot
  // ---------------------------------------------------------------------
  function boot() {
    $('#mark').textContent = CFG.schoolShort;
    $('#appName').textContent = CFG.appName;
    document.title = CFG.appName + ' – Board';
    wireButtons();
    buildToolbar();
    state.panes = [new Pane(0, $('#pane0')), new Pane(1, $('#pane1'))];
    state.panes[0].el.classList.add('active');
    setTool(state.tool);
    updateActionButtons();
    updateEmpty();
    drawQr($('#emptyQr'), 170);

    if (!configured) {
      $('#notConfigured').classList.remove('hidden');
      $('#phoneBtn').classList.add('hidden');
      setLive('', 'Not connected');
      return;
    }
    const saved = store.get(CODE_KEY);
    if (saved) start(saved);
    else showGate();
  }

  // Exposed for troubleshooting from the browser console.
  window.snapBoard = { state, addLocal };

  boot();
})();
