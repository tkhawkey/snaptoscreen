(() => {
  'use strict';
  const { CFG, configured, sb, rpc, normCode, channelName, store, loadImg, b64ToBlob, friendlyError } = Snap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const CODE_KEY = 'snap.board.code';
  const LABEL_KEY = 'snap.board.lessonLabel';
  const STYLE_KEY = 'snap.board.textStyle';
  const ANN_PREFIX = 'snap.ann.';

  const FONTS = {
    sans: { name: 'Clean', css: '"Segoe UI", Arial, sans-serif' },
    hand: { name: 'Handwriting', css: '"Patrick Hand", "Comic Sans MS", cursive' },
    serif: { name: 'Serif', css: 'Georgia, "Times New Roman", serif' },
    mono: { name: 'Typewriter', css: 'Consolas, "Courier New", monospace' },
  };
  const UI_FONT = FONTS.sans.css;
  const TEXT_SIZES = { S: 28, M: 44, L: 68, XL: 100 }; // on-screen px when created
  const LH = 1.2;
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------------------------------------------------------------------
  //  Icons
  // ---------------------------------------------------------------------
  const ICONS = {
    pan: '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
    select: '<path d="M5 3l13 7.5-5.5 1.5L10 18z"/><path d="M13 12.5l4.5 6"/>',
    pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    hl: '<path d="M15.5 4.5l4 4-8 8-4-4z"/><path d="M7.5 12.5 5 15v2h2l2.5-2.5"/><path d="M3 21h18" stroke-width="3" opacity=".6"/>',
    arrow: '<path d="M5 19 19 5M10 5h9v9"/>',
    line: '<path d="M5 19 19 5"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>',
    text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
    redact: '<rect x="3" y="8" width="18" height="8" rx="1" fill="currentColor"/>',
    cover: '<rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity=".3"/><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 10a2 2 0 1 1 2.5 1.9c-.4.2-.5.5-.5.9V14M12 16.5v.01"/>',
    eraser: '<path d="M8 20h12"/><path d="M5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12.5 18H7.5z"/><path d="M9 11.5l5 5"/>',
    spot: '<circle cx="12" cy="12" r="5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    laser: '<circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M3 21c3-1 5-3 7-6s4-6 6-7.5" stroke-dasharray="2.5 3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
    clearmarks: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    zoomin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6M11 8v6"/>',
    zoomout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    crop: '<path d="M6 2v16h16"/><path d="M2 6h16v16"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    fullscreen: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>',
    compare: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    save: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

  // ---------------------------------------------------------------------
  //  Tools, colours, sizes, stamps
  // ---------------------------------------------------------------------
  const TOOLS = [
    { id: 'pan', name: 'Move / zoom (M). Tap a cover to reveal it.', key: 'm' },
    { id: 'select', name: 'Select (S): tap a mark to move, resize, recolour or delete it', key: 's' },
    { id: 'pen', name: 'Pen (P)', key: 'p' },
    { id: 'hl', name: 'Highlighter (I)', key: 'i' },
    { id: 'line', name: 'Line (L): snaps level/upright/45°; hold Shift for 15° steps', key: 'l' },
    { id: 'arrow', name: 'Arrow (A): snaps level/upright/45°; hold Shift for 15° steps', key: 'a' },
    { id: 'rect', name: 'Box (B): snaps to a square when close; hold Shift to force', key: 'b' },
    { id: 'ellipse', name: 'Circle (C): snaps to a perfect circle when close; hold Shift to force', key: 'c' },
    { id: 'text', name: 'Text (T): tap to add, tap existing text to edit', key: 't' },
    { id: 'stamp', name: 'Stamps (V): tap again to choose a stamp', key: 'v' },
    { id: 'redact', name: 'Redact: cover a name' },
    { id: 'cover', name: 'Hide & reveal (K): drag to cover, tap to reveal', key: 'k' },
    { id: 'eraser', name: 'Eraser (E): tap or drag over a mark', key: 'e' },
    { id: 'spot', name: 'Spotlight (O): drag a circle to focus on', key: 'o' },
    { id: 'laser', name: 'Laser pointer (Q): trail fades away', key: 'q' },
  ];
  const COLOURS = ['#e11d48', '#2563eb', '#16a34a', '#facc15', '#111827', '#ffffff'];
  // Line width in on-screen pixels. Presets + a slider (1–40).
  const SIZE_PRESETS = { s: 4, m: 8, l: 16 };
  const SIZE_MIN = 1, SIZE_MAX = 40;
  const SIZE_KEY = 'snap.board.lineW';
  const sizeFor = (lw) => ({ line: lw, stamp: 40 + lw * 6 });
  const STAMPS = [
    { id: 'tick', name: 'Tick' },
    { id: 'cross', name: 'Cross' },
    { id: 'question', name: 'Question mark' },
    { id: 'star', name: 'Star' },
    { id: 'num', name: 'Numbered steps 1, 2, 3…' },
    { id: 'www', name: 'WWW: what went well' },
    { id: 'ebi', name: 'EBI: even better if' },
  ];
  const COLOUR_LESS_TOOLS = ['pan', 'select', 'eraser', 'redact', 'cover', 'spot', 'laser'];

  // ---------------------------------------------------------------------
  //  State
  // ---------------------------------------------------------------------
  const state = {
    code: null,
    snaps: [],
    tool: 'pen',
    colour: COLOURS[0],
    lineW: Math.min(SIZE_MAX, Math.max(SIZE_MIN, +store.get(SIZE_KEY, 8) || 8)),
    stamp: 'tick',
    textStyle: Object.assign({ font: 'sans', bold: true, italic: false, bg: false, sizeKey: 'M' }, store.get(STYLE_KEY, {})),
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

  function rotMatrix(r, W, H) {
    const m = new DOMMatrix();
    if (r === 90) return m.translate(H, 0).rotate(90);
    if (r === 180) return m.translate(W, H).rotate(180);
    if (r === 270) return m.translate(0, W).rotate(270);
    return m;
  }
  const cropOf = (s, full) => (!full && s.crop ? s.crop : { x: 0, y: 0, w: s.w, h: s.h });
  // image coordinates → display coordinates (crop, then rotate)
  function imgMatrix(s, full) {
    const c = cropOf(s, full);
    return rotMatrix(s.rotation, c.w, c.h).translate(-c.x, -c.y);
  }
  function dispSize(s, full) {
    const c = cropOf(s, full);
    return s.rotation % 180 ? [c.h, c.w] : [c.w, c.h];
  }

  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = dx * dx + dy * dy;
    const t = L ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  const normBox = (a, b) => ({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) });

  // Box-shaped marks keep their corners un-rotated and store an angle (radians)
  // around their own centre.
  const BOXY = ['rect', 'ellipse', 'redact', 'cover'];
  function rotAround(q, c, th) {
    const cs = Math.cos(th), sn = Math.sin(th), dx = q[0] - c[0], dy = q[1] - c[1];
    return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs];
  }
  // Point → the box's un-rotated frame (for hit testing).
  function boxLocal(a, p) {
    if (!a.ang) return p;
    const b = normBox(a.a, a.b);
    return rotAround(p, [b.x + b.w / 2, b.y + b.h / 2], -a.ang);
  }
  function inEllipse(a, b, p) {
    const r = normBox(a, b);
    const rx = Math.max(r.w / 2, 1), ry = Math.max(r.h / 2, 1);
    const dx = (p[0] - (r.x + r.w / 2)) / rx, dy = (p[1] - (r.y + r.h / 2)) / ry;
    return dx * dx + dy * dy <= 1;
  }
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }

  // Text and stamps are drawn upright in their own local frame, rotated by -rot.
  function toLocal(a, p) {
    const r = ((a.rot || 0) * Math.PI) / 180;
    const dx = p[0] - a.p[0], dy = p[1] - a.p[1];
    return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
  }
  function fromLocal(a, lx, ly) {
    const r = ((a.rot || 0) * Math.PI) / 180;
    return [a.p[0] + lx * Math.cos(r) + ly * Math.sin(r), a.p[1] - lx * Math.sin(r) + ly * Math.cos(r)];
  }

  // ---------------------------------------------------------------------
  //  Text & stamp measuring
  // ---------------------------------------------------------------------
  const measureCtx = document.createElement('canvas').getContext('2d');
  const fontStr = (a) => `${a.italic ? 'italic ' : ''}${a.bold === false ? 400 : 700} ${a.size}px ${(FONTS[a.font] || FONTS.sans).css}`;
  function textBox(a) {
    measureCtx.font = fontStr(a);
    const lines = a.text.split('\n');
    const w = Math.max(1, ...lines.map((l) => measureCtx.measureText(l).width));
    const pad = a.bg ? a.size * 0.25 : a.size * 0.06;
    return { x0: -pad, y0: -pad, x1: w + pad, y1: lines.length * a.size * LH + pad };
  }
  function labelFont(h) { return `800 ${h * 0.6}px ${UI_FONT}`; }
  function stampBox(a) {
    const s = a.size;
    if (a.kind === 'www' || a.kind === 'ebi') {
      const h = s * 0.5;
      measureCtx.font = labelFont(h);
      const w = measureCtx.measureText(a.kind.toUpperCase()).width + h * 0.8;
      return { x0: -w / 2, y0: -h / 2, x1: w / 2, y1: h / 2 };
    }
    const r = a.kind === 'num' ? s * 0.34 : s * 0.48;
    return { x0: -r, y0: -r, x1: r, y1: r };
  }
  const localBox = (a) => (a.type === 'text' ? textBox(a) : stampBox(a));

  function contrastFor(hex) {
    const n = parseInt(String(hex || '#000000').slice(1), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? '#000000' : '#ffffff';
  }

  // ---------------------------------------------------------------------
  //  Annotation drawing
  // ---------------------------------------------------------------------
  const EXPORT_VIEW = { screen: false, k: 1, prog: (a) => (a.revealed ? 1 : 0) };

  function drawAnns(ctx, anns, showAll, view) {
    for (const a of anns) {
      if (!showAll && a.type !== 'redact' && a.type !== 'cover') continue;
      drawAnn(ctx, a, view);
    }
  }

  function drawStamp(ctx, a) {
    const s = a.size;
    ctx.translate(a.p[0], a.p[1]);
    ctx.rotate((-(a.rot || 0) * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    switch (a.kind) {
      case 'tick':
      case 'cross': {
        const path = new Path2D();
        if (a.kind === 'tick') {
          path.moveTo(-0.42 * s, 0.02 * s); path.lineTo(-0.12 * s, 0.32 * s); path.lineTo(0.45 * s, -0.35 * s);
        } else {
          path.moveTo(-0.35 * s, -0.35 * s); path.lineTo(0.35 * s, 0.35 * s);
          path.moveTo(0.35 * s, -0.35 * s); path.lineTo(-0.35 * s, 0.35 * s);
        }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.2; ctx.stroke(path);
        ctx.strokeStyle = a.kind === 'tick' ? '#16a34a' : '#dc2626'; ctx.lineWidth = s * 0.12; ctx.stroke(path);
        break;
      }
      case 'question': {
        ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb'; ctx.fill();
        ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `800 ${s * 0.56}px ${UI_FONT}`;
        ctx.fillText('?', 0, s * 0.03);
        break;
      }
      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 ? s * 0.2 : s * 0.48;
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fillStyle = '#facc15'; ctx.fill();
        ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.045; ctx.strokeStyle = '#92400e'; ctx.stroke();
        break;
      }
      case 'num': {
        const col = a.color || '#e11d48';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = s * 0.045; ctx.strokeStyle = contrastFor(col) === '#ffffff' ? '#ffffff' : '#111827'; ctx.stroke();
        ctx.fillStyle = contrastFor(col);
        ctx.font = `800 ${s * (a.n >= 10 ? 0.3 : 0.38)}px ${UI_FONT}`;
        ctx.fillText(String(a.n || 1), 0, s * 0.02);
        break;
      }
      case 'www':
      case 'ebi': {
        const b = stampBox(a);
        roundRectPath(ctx, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, (b.y1 - b.y0) * 0.25);
        ctx.fillStyle = a.kind === 'www' ? '#16a34a' : '#d97706'; ctx.fill();
        ctx.lineWidth = s * 0.03; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = labelFont(b.y1 - b.y0);
        ctx.fillText(a.kind.toUpperCase(), 0, s * 0.01);
        break;
      }
    }
  }

  function drawAnn(ctx, a, view) {
    ctx.save();
    // Always start from known text settings, whatever was drawn before.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (a.ang && BOXY.includes(a.type)) { // rotated box / circle / redaction / cover
      const b = normBox(a.a, a.b);
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(a.ang);
      ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    }
    switch (a.type) {
      case 'pen':
      case 'hl': {
        ctx.strokeStyle = a.color;
        ctx.fillStyle = a.color;
        ctx.lineWidth = a.w;
        if (a.type === 'hl') { ctx.globalAlpha = 0.4; ctx.lineCap = 'butt'; }
        const p = a.pts;
        if (p.length === 1) {
          ctx.beginPath(); ctx.arc(p[0][0], p[0][1], a.w / 2, 0, Math.PI * 2); ctx.fill();
          break;
        }
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length - 1; i++) {
          ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
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
        ctx.beginPath(); ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - Math.cos(ang) * head * 0.6, y2 - Math.sin(ang) * head * 0.6); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
        ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'line': {
        ctx.strokeStyle = a.color; ctx.lineWidth = a.w;
        ctx.beginPath(); ctx.moveTo(a.a[0], a.a[1]); ctx.lineTo(a.b[0], a.b[1]); ctx.stroke();
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
      case 'cover': {
        const b = normBox(a.a, a.b);
        const prog = view.prog(a);
        if (prog >= 1) {
          if (view.screen) {
            ctx.setLineDash([8 * view.k, 6 * view.k]);
            ctx.lineWidth = 2 * view.k;
            ctx.strokeStyle = 'rgba(100,116,139,0.9)';
            ctx.strokeRect(b.x, b.y, b.w, b.h);
          }
          break;
        }
        const h = b.h * (1 - prog);
        ctx.fillStyle = '#475569';
        ctx.fillRect(b.x, b.y, b.w, h);
        ctx.lineWidth = Math.max(2 * view.k, Math.min(b.w, b.h) * 0.015);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(b.x, b.y, b.w, h);
        if (prog === 0) {
          const fs = Math.min(b.w, b.h) * 0.5;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = `800 ${fs}px ${UI_FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', b.x + b.w / 2, b.y + b.h / 2 + fs * 0.04);
        }
        break;
      }
      case 'text': {
        ctx.translate(a.p[0], a.p[1]);
        ctx.rotate((-(a.rot || 0) * Math.PI) / 180);
        if (a.bg) {
          const bx = textBox(a);
          ctx.fillStyle = contrastFor(a.color) === '#000000' ? 'rgba(17,24,39,0.88)' : 'rgba(255,255,255,0.92)';
          roundRectPath(ctx, bx.x0, bx.y0, bx.x1 - bx.x0, bx.y1 - bx.y0, a.size * 0.18);
          ctx.fill();
        }
        ctx.font = fontStr(a);
        ctx.textBaseline = 'top';
        ctx.fillStyle = a.color;
        ctx.strokeStyle = contrastFor(a.color);
        ctx.lineWidth = a.size * 0.16;
        a.text.split('\n').forEach((line, i) => {
          const y = i * a.size * LH;
          if (!a.bg) ctx.strokeText(line, 0, y);
          ctx.fillText(line, 0, y);
        });
        break;
      }
      case 'stamp':
        drawStamp(ctx, a);
        break;
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  Hit testing, bounding boxes, transforms
  // ---------------------------------------------------------------------
  function hitAnn(a, p, tol) {
    if (BOXY.includes(a.type)) p = boxLocal(a, p);
    switch (a.type) {
      case 'pen':
      case 'hl': {
        const r = tol + a.w / 2;
        if (a.pts.length === 1) return Math.hypot(p[0] - a.pts[0][0], p[1] - a.pts[0][1]) <= r;
        for (let i = 1; i < a.pts.length; i++) if (segDist(p, a.pts[i - 1], a.pts[i]) <= r) return true;
        return false;
      }
      case 'arrow':
      case 'line': return segDist(p, a.a, a.b) <= tol + a.w / 2;
      case 'rect':
      case 'redact':
      case 'cover': {
        const b = normBox(a.a, a.b);
        return p[0] >= b.x - tol && p[0] <= b.x + b.w + tol && p[1] >= b.y - tol && p[1] <= b.y + b.h + tol;
      }
      case 'ellipse': {
        const b = normBox(a.a, a.b);
        const rx = b.w / 2 + tol, ry = b.h / 2 + tol;
        const dx = (p[0] - (b.x + b.w / 2)) / rx, dy = (p[1] - (b.y + b.h / 2)) / ry;
        return dx * dx + dy * dy <= 1;
      }
      case 'text':
      case 'stamp': {
        const [lx, ly] = toLocal(a, p);
        const b = localBox(a);
        return lx >= b.x0 - tol && lx <= b.x1 + tol && ly >= b.y0 - tol && ly <= b.y1 + tol;
      }
    }
    return false;
  }

  function topHit(s, p, tol, filter) {
    for (let i = s.anns.length - 1; i >= 0; i--) {
      const a = s.anns[i];
      if (filter && !filter(a)) continue;
      if (!s.showAnn && a.type !== 'redact' && a.type !== 'cover') continue;
      if (hitAnn(a, p, tol)) return a;
    }
    return null;
  }

  function annBox(a) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (q, pad = 0) => {
      x0 = Math.min(x0, q[0] - pad); y0 = Math.min(y0, q[1] - pad);
      x1 = Math.max(x1, q[0] + pad); y1 = Math.max(y1, q[1] + pad);
    };
    switch (a.type) {
      case 'pen':
      case 'hl': a.pts.forEach((q) => add(q, a.w / 2)); break;
      case 'arrow':
      case 'line': add(a.a, a.w); add(a.b, a.w); break;
      case 'rect':
      case 'ellipse':
      case 'redact':
      case 'cover': {
        const b = normBox(a.a, a.b);
        const c = [b.x + b.w / 2, b.y + b.h / 2];
        const pad = a.w ? a.w / 2 : 0;
        [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].forEach((q) => add(rotAround(q, c, a.ang || 0), pad));
        break;
      }
      case 'text':
      case 'stamp': {
        const b = localBox(a);
        [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].forEach(([lx, ly]) => add(fromLocal(a, lx, ly)));
        break;
      }
    }
    return { x0, y0, x1, y1 };
  }

  // Returns a transformed copy. f maps a point; k scales text/stamp size.
  function mapAnn(a, f, k = 1) {
    const b = { ...a };
    if (a.pts) b.pts = a.pts.map(f);
    if (a.a) { b.a = f(a.a); b.b = f(a.b); }
    if (a.p) { b.p = f(a.p); if (a.size) b.size = a.size * k; }
    return b;
  }
  const uniformScale = (a) => ['pen', 'hl', 'text', 'stamp'].includes(a.type) || !!a.ang;

  // Rotate a mark by th radians (clockwise on screen) around centre c.
  function rotateAnn(a, c, th) {
    if (BOXY.includes(a.type)) {
      const b = normBox(a.a, a.b);
      const nc = rotAround([b.x + b.w / 2, b.y + b.h / 2], c, th);
      const dx = nc[0] - (b.x + b.w / 2), dy = nc[1] - (b.y + b.h / 2);
      return { ...a, a: [a.a[0] + dx, a.a[1] + dy], b: [a.b[0] + dx, a.b[1] + dy], ang: (a.ang || 0) + th };
    }
    const r = mapAnn(a, (q) => rotAround(q, c, th));
    if (a.type === 'text' || a.type === 'stamp') r.rot = (a.rot || 0) - (th * 180) / Math.PI;
    return r;
  }
  function annCentre(a) {
    const b = annBox(a);
    return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  }
  const hasColour = (a) => a && (a.color !== undefined) && a.type !== 'redact' && a.type !== 'cover';

  // ---------------------------------------------------------------------
  //  Snaps
  // ---------------------------------------------------------------------
  function normaliseAnn(a) {
    if (a.type === 'tick' || a.type === 'cross') return { type: 'stamp', kind: a.type, p: a.p, size: a.size, rot: a.rot || 0, id: uid() };
    if (!a.id) return { ...a, id: uid() };
    return a;
  }

  function makeSnap({ id, local = false, created = new Date(), w = 0, h = 0, title = '' }) {
    const saved = local ? null : store.get(ANN_PREFIX + id, null);
    return {
      id, local, created, w, h, title,
      img: null, url: null, loading: false, failed: false,
      rotation: saved ? saved.rotation || 0 : 0,
      crop: saved ? saved.crop || null : null,
      anns: saved ? (saved.anns || []).map(normaliseAnn) : [],
      undo: [], redo: [],
      showAnn: true,
    };
  }
  const snapNum = (s) => state.snaps.indexOf(s) + 1;

  const persistTimers = new Map();
  function persist(s) {
    if (s.local) return;
    clearTimeout(persistTimers.get(s.id));
    persistTimers.set(s.id, setTimeout(() => {
      if (!state.snaps.includes(s)) return;
      if (!s.anns.length && !s.rotation && !s.crop) store.del(ANN_PREFIX + s.id);
      else store.set(ANN_PREFIX + s.id, { anns: s.anns, rotation: s.rotation, crop: s.crop });
    }, 400));
  }

  function commit(s, ann) {
    ann.id = ann.id || uid();
    s.undo.push(s.anns);
    s.anns = [...s.anns, ann];
    s.redo = [];
    s.showAnn = true;
    changed(s);
    return ann;
  }

  // Replace the whole annotation list as one undoable step.
  function replaceAnns(s, next) {
    s.undo.push(s.anns);
    s.anns = next;
    s.redo = [];
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

  const activePane = () => state.panes[state.active];
  const activeSnap = () => activePane().snap;

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
      this.sel = null;       // selected annotation
      this.drag = null;      // select / spotlight drag info
      this.spot = null;      // spotlight {a, b} in image coords
      this.laser = [];       // laser trail points (screen coords)
      this.laserDown = false;
      this.grid = 0;         // 0 = off, else divisions across the longest side
      this.cropping = null;  // { r, drag } while cropping
      this.anim = new Map(); // cover reveal animations, keyed by annotation id
      this.raf = 0;
      // Transparent layer on top for fast-changing things (laser trail, hover cursor),
      // so they don't force the photo and all annotations to be redrawn.
      this.ov = document.createElement('canvas');
      this.ov.className = 'ov-layer';
      this.canvas.after(this.ov);
      this.octx = this.ov.getContext('2d');
      this.oraf = 0;
      this.hover = null;     // mouse/pen position for the cursor ring (not touch)

      new ResizeObserver(() => this.resize()).observe(el);
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => this.onDown(e));
      c.addEventListener('pointermove', (e) => {
        this.hover = e.pointerType === 'touch' ? null : this.local(e);
        if (state.tool === 'laser' && this.laserDown && e.getPredictedEvents) {
          const pr = e.getPredictedEvents();
          this.pred = pr.length ? this.local(pr[pr.length - 1]) : null;
        }
        this.requestOverlay();
        this.onMove(e);
      });
      c.addEventListener('pointerleave', () => { this.hover = null; this.requestOverlay(); });
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
      this.canvas.width = this.ov.width = Math.round(r.width * d);
      this.canvas.height = this.ov.height = Math.round(r.height * d);
      if (this.fitted) this.fit(); else this.request();
      this.requestOverlay();
    }

    requestOverlay() {
      if (this.oraf) return;
      this.oraf = requestAnimationFrame(() => { this.oraf = 0; this.drawOverlay(); });
    }

    // Laser trail + hover cursor, on the overlay layer only.
    drawOverlay() {
      const ctx = this.octx;
      const d = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.ov.width, this.ov.height);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const now = performance.now();
      const LIFE = 900;

      if (this.laser.length) {
        this.laser = this.laser.filter((p) => now - p.t < LIFE);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Two cheap passes (soft glow, then bright core) instead of a blur filter.
        for (const [w, rgb, k] of [[16, '255,40,60', 0.25], [6, '255,70,85', 1]]) {
          ctx.lineWidth = w;
          for (let i = 1; i < this.laser.length; i++) {
            const p = this.laser[i], q = this.laser[i - 1];
            if (p.brk) continue;
            ctx.strokeStyle = `rgba(${rgb},${(Math.max(0, 1 - (now - p.t) / LIFE) * k).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
        }
      }

      // Laser "dot": follows the pointer, and runs slightly ahead using predicted events.
      const head = this.laserDown ? (this.pred || this.laser[this.laser.length - 1]) : (state.tool === 'laser' ? this.hover : null);
      if (head && !this.cropping) {
        ctx.fillStyle = 'rgba(255,40,60,0.28)';
        ctx.beginPath(); ctx.arc(head.x, head.y, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff3b4f';
        ctx.beginPath(); ctx.arc(head.x, head.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe4e6';
        ctx.beginPath(); ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Brush-size ring for pen / highlighter / eraser (mouse or pen hover only).
      const h = this.hover;
      if (h && !this.cropping && ['pen', 'hl', 'eraser'].includes(state.tool) && this.mode !== 'pinch') {
        const r = state.tool === 'eraser' ? 14 : Math.max(1.5, (state.lineW * (state.tool === 'hl' ? 3.5 : 1)) / 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, Math.PI * 2); ctx.stroke();
        if (r > 5) { // centre point so you can see exactly where it lands
          ctx.fillStyle = state.tool === 'eraser' ? '#ffffff' : state.colour;
          ctx.beginPath(); ctx.arc(h.x, h.y, 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (this.laser.length) this.requestOverlay(); // keep fading
    }

    setSnap(s) {
      if (this.cropping) endCrop(this, false);
      this.snap = s;
      this.draft = null;
      this.sel = null;
      this.spot = null;
      this.laser = [];
      this.requestOverlay();
      this.fit();
      this.updateTag();
      updateSpotChip();
      updateSelBar();
    }

    updateTag() {
      this.tag.textContent = (this.idx === 0 ? 'A' : 'B') + (this.snap ? ` · #${snapNum(this.snap)}` : '');
    }

    fitScale() {
      if (!this.snap || !this.snap.w) return 1;
      const [dw, dh] = dispSize(this.snap, !!this.cropping);
      return Math.min(this.cw / dw, this.ch / dh) * 0.97;
    }

    fit() {
      this.fitted = true;
      if (this.snap && this.snap.w) {
        const [dw, dh] = dispSize(this.snap, !!this.cropping);
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
      return new DOMMatrix().translate(this.tx, this.ty).scale(this.s).multiply(imgMatrix(this.snap, !!this.cropping));
    }

    toImage(x, y) {
      const p = this.matrix().inverse().transformPoint(new DOMPoint(x, y));
      return [p.x, p.y];
    }

    toScreen(q, m = this.matrix()) {
      const p = m.transformPoint(new DOMPoint(q[0], q[1]));
      return { x: p.x, y: p.y };
    }

    local(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    request() {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
    }

    coverProg(a, now) {
      const an = this.anim.get(a.id);
      if (!an) return a.revealed ? 1 : 0;
      const t = Math.min(1, (now - an.start) / 380);
      if (t >= 1) { this.anim.delete(a.id); return an.to; }
      this.animating = true;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      return an.from + (an.to - an.from) * e;
    }

    // Corners of the selected annotation, in screen coordinates.
    selCorners(m = this.matrix()) {
      const b = annBox(this.sel);
      const pad = 6 / this.s;
      const pts = [[b.x0 - pad, b.y0 - pad], [b.x1 + pad, b.y0 - pad], [b.x1 + pad, b.y1 + pad], [b.x0 - pad, b.y1 + pad]];
      return { img: [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]], scr: pts.map((q) => this.toScreen(q, m)) };
    }

    draw() {
      const ctx = this.ctx;
      const d = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const s = this.snap;
      if (!s) return;
      if (!s.img) {
        ctx.save();
        ctx.fillStyle = '#93a2b4';
        ctx.font = `${20 * d}px ${UI_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(s.failed ? 'Could not load this snap' : 'Loading…', this.canvas.width / 2, this.canvas.height / 2);
        ctx.restore();
        return;
      }
      if (this.sel && !s.anns.includes(this.sel)) { this.sel = null; updateSelBar(); }
      this.animating = false;
      const now = performance.now();
      const m0 = this.matrix();
      const m = new DOMMatrix().scale(d).multiply(m0);
      const c = cropOf(s, !!this.cropping);

      // Photo, grid, annotations (clipped to the crop)
      ctx.save();
      ctx.setTransform(m);
      ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.img, 0, 0);
      if (this.grid) {
        const step = Math.max(s.w, s.h) / this.grid;
        ctx.strokeStyle = 'rgba(14,165,233,0.55)';
        ctx.lineWidth = 1.3 / this.s;
        ctx.beginPath();
        for (let x = 0; x <= s.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, s.h); }
        for (let y = 0; y <= s.h; y += step) { ctx.moveTo(0, y); ctx.lineTo(s.w, y); }
        ctx.stroke();
      }
      if (!this.cropping) {
        const view = { screen: true, k: 1 / this.s, prog: (a) => this.coverProg(a, now) };
        drawAnns(ctx, s.anns, s.showAnn, view);
        if (this.draft) drawAnn(ctx, this.draft, view);
      }
      ctx.restore();

      if (this.cropping) this.drawCrop(ctx, m, m0, d);

      // Spotlight
      if (this.spot && !this.cropping) {
        const b = normBox(this.spot.a, this.spot.b);
        ctx.save();
        ctx.setTransform(m);
        ctx.beginPath();
        ctx.rect(-1e6, -1e6, 2e6, 2e6);
        ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w / 2, 1), Math.max(b.h / 2, 1), 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fill('evenodd');
        ctx.beginPath();
        ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w / 2, 1), Math.max(b.h / 2, 1), 0, 0, Math.PI * 2);
        ctx.lineWidth = 2 / this.s;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
        ctx.restore();
      }

      // Selection frame + handles
      if (this.sel && !this.cropping) {
        const { scr } = this.selCorners(m0);
        const xs = scr.map((p) => p.x), ys = scr.map((p) => p.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        ctx.save();
        ctx.setTransform(d, 0, 0, d, 0, 0);
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6';
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        ctx.setLineDash([]);
        for (const p of scr) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x - 9, p.y - 9, 18, 18);
          ctx.strokeRect(p.x - 9, p.y - 9, 18, 18);
        }
        // Rotation handle: a circle on a stalk above the frame (below it if there's no room)
        const hx = (x0 + x1) / 2;
        const above = y0 - 44 > 14;
        const hy = above ? y0 - 44 : y1 + 44;
        this.rotHandle = { x: hx, y: hy };
        ctx.beginPath();
        ctx.moveTo(hx, above ? y0 : y1);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, 7, -Math.PI * 0.9, Math.PI * 0.55);
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        const ex = hx + 7 * Math.cos(Math.PI * 0.55), ey = hy + 7 * Math.sin(Math.PI * 0.55);
        ctx.beginPath();
        ctx.moveTo(ex - 5, ey - 1); ctx.lineTo(ex, ey); ctx.lineTo(ex + 1, ey - 5);
        ctx.stroke();
        if (this.drag && this.drag.kind === 'rotate') {
          const deg = Math.round((this.drag.th * 180) / Math.PI);
          ctx.font = `600 15px ${UI_FONT}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#0b1119e6';
          ctx.fillRect(hx + 22, hy - 13, 56, 26);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${deg > 0 ? '+' : ''}${deg}°`, hx + 28, hy);
        }
        ctx.restore();
        if (this.idx === state.active) placeSelBar(this, { x0, y0, x1, y1 });
      }

      if (this.animating) this.request();
    }

    drawCrop(ctx, m, m0, d) {
      const r = this.cropping.r;
      ctx.save();
      ctx.setTransform(m);
      ctx.beginPath();
      ctx.rect(-1e6, -1e6, 2e6, 2e6);
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fill('evenodd');
      ctx.lineWidth = 2.5 / this.s;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.lineWidth = 1 / this.s;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(r.x + (r.w * i) / 3, r.y); ctx.lineTo(r.x + (r.w * i) / 3, r.y + r.h);
        ctx.moveTo(r.x, r.y + (r.h * i) / 3); ctx.lineTo(r.x + r.w, r.y + (r.h * i) / 3);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.setTransform(d, 0, 0, d, 0, 0);
      for (const q of [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]) {
        const p = this.toScreen(q, m0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 11, p.y - 11, 22, 22);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 11, p.y - 11, 22, 22);
      }
      ctx.restore();
    }

    // ----- pointer handling -----
    onDown(e) {
      e.preventDefault();
      setActive(this.idx);
      closePopovers();
      try { this.canvas.setPointerCapture(e.pointerId); } catch {}
      const p = this.local(e);
      this.ptrs.set(e.pointerId, p);

      if (this.ptrs.size === 2) { // second finger → pinch zoom, cancel any half-done action
        this.cancelTool();
        this.startPinch();
        this.mode = 'pinch';
        return;
      }
      if (this.ptrs.size > 2) return;
      if (!this.snap || !this.snap.img) { this.mode = 'pan'; this.last = p; this.down = p; this.moved = 0; return; }

      if (this.cropping) { this.mode = 'crop'; cropDown(this, p); return; }
      if (state.tool === 'pan' || e.button === 1 || e.button === 2) {
        this.mode = 'pan'; this.last = p; this.down = p; this.moved = 0; return;
      }
      this.mode = 'draw';
      startTool(this, p);
    }

    onMove(e) {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = this.local(e);
      this.ptrs.set(e.pointerId, p);
      this.shift = e.shiftKey;
      if (this.mode === 'pinch' && this.ptrs.size >= 2) this.updatePinch();
      else if (this.mode === 'pan') {
        this.tx += p.x - this.last.x;
        this.ty += p.y - this.last.y;
        this.moved += Math.abs(p.x - this.last.x) + Math.abs(p.y - this.last.y);
        this.last = p;
        this.fitted = false;
        this.request();
      } else if (this.mode === 'crop') cropMove(this, p);
      else if (this.mode === 'draw') {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        if (evs.length > 1) for (const ce of evs) moveTool(this, this.local(ce));
        else moveTool(this, p);
      }
    }

    onUp(e, cancelled) {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      const left = this.ptrs.size;
      if (this.mode === 'draw') {
        if (cancelled) this.cancelTool(); else finishTool(this);
      } else if (this.mode === 'crop') {
        cropUp(this);
      } else if (this.mode === 'pan' && !cancelled && this.moved < 8 && this.snap && this.snap.img) {
        tapCover(this, this.down); // tap with the Move tool reveals/hides a cover
      }
      if (this.mode === 'draw' || this.mode === 'pinch' || this.mode === 'crop') this.mode = left ? 'wait' : null;
      else if (!left) this.mode = null;
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
      const s = this.snap;
      if (this.erasing && this.eraseBefore && s) { s.anns = this.eraseBefore; changed(s); }
      if (this.drag && this.drag.before && s) { s.anns = this.drag.before; this.sel = this.drag.orig || null; changed(s); }
      if (this.cropping) this.cropping.drag = null;
      this.erasing = false;
      this.eraseBefore = null;
      this.drag = null;
      this.draft = null;
      this.laserDown = false;
      this.pred = null;
      this.request();
      this.requestOverlay();
    }
  }

  // ---------------------------------------------------------------------
  //  Tools
  // ---------------------------------------------------------------------
  function nextNumber(s) {
    return 1 + s.anns.reduce((m, a) => (a.type === 'stamp' && a.kind === 'num' ? Math.max(m, a.n || 0) : m), 0);
  }

  function startTool(pane, sp) {
    const s = pane.snap;
    const ip = pane.toImage(sp.x, sp.y);
    const sz = sizeFor(state.lineW);
    const k = 1 / pane.s; // screen px → image px
    const c = state.colour;
    if (state.tool !== 'select' && pane.sel) { pane.sel = null; updateSelBar(); }
    switch (state.tool) {
      case 'pen': pane.draft = { type: 'pen', pts: [ip], color: c, w: sz.line * k }; break;
      case 'hl': pane.draft = { type: 'hl', pts: [ip], color: c, w: sz.line * 3.5 * k }; break;
      case 'line':
      case 'arrow':
      case 'rect':
      case 'ellipse': pane.draft = { type: state.tool, a: ip, b: ip, color: c, w: sz.line * k }; break;
      case 'redact': pane.draft = { type: 'redact', a: ip, b: ip }; break;
      case 'cover': pane.draft = { type: 'cover', a: ip, b: ip, revealed: false, down: sp }; break;
      case 'stamp': {
        const st = { type: 'stamp', kind: state.stamp, p: ip, size: sz.stamp * k, rot: s.rotation };
        if (state.stamp === 'num') { st.n = nextNumber(s); st.color = c; }
        pane.draft = st; // placed when the finger lifts; drag to position it
        break;
      }
      case 'text': pane.draft = { type: 'textTap', p: ip, down: sp }; break;
      case 'eraser':
        pane.erasing = true;
        pane.eraseBefore = s.anns;
        eraseAt(pane, ip);
        break;
      case 'select': selectDown(pane, sp, ip); break;
      case 'spot': spotDown(pane, sp, ip); break;
      case 'laser':
        pane.laserDown = true;
        pane.laser.push({ x: sp.x, y: sp.y, t: performance.now(), brk: true });
        pane.requestOverlay();
        return; // nothing on the photo layer changes
    }
    pane.request();
  }

  function moveTool(pane, sp) {
    const ip = pane.toImage(sp.x, sp.y);
    if (pane.erasing) { eraseAt(pane, ip); return; }
    switch (state.tool) {
      case 'select': selectMove(pane, ip); return;
      case 'spot': spotMove(pane, sp, ip); return;
      case 'laser': pane.laser.push({ x: sp.x, y: sp.y, t: performance.now() }); pane.requestOverlay(); return;
    }
    const d = pane.draft;
    if (!d) return;
    if (d.type === 'textTap') return;
    if (d.type === 'stamp') d.p = ip;
    else if (d.pts) {
      const l = d.pts[d.pts.length - 1];
      if (Math.hypot(ip[0] - l[0], ip[1] - l[1]) * pane.s < 1.5) return;
      d.pts.push(ip);
    } else d.b = constrain(d, ip, pane.shift);
    pane.request();
  }

  // Snapping for shapes and lines. Shift forces it; otherwise it snaps when close.
  function constrain(d, ip, shift) {
    const dx = ip[0] - d.a[0], dy = ip[1] - d.a[1];
    if (d.type === 'rect' || d.type === 'ellipse') {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (!ax || !ay) return ip;
      const ratio = ax / ay;
      if (shift || (ratio > 0.88 && ratio < 1.12)) {
        const side = shift ? Math.max(ax, ay) : (ax + ay) / 2;
        return [d.a[0] + Math.sign(dx) * side, d.a[1] + Math.sign(dy) * side];
      }
      return ip;
    }
    if (d.type === 'line' || d.type === 'arrow') {
      const len = Math.hypot(dx, dy);
      if (!len) return ip;
      const ang = Math.atan2(dy, dx);
      const step = shift ? Math.PI / 12 : Math.PI / 4;
      const snapped = Math.round(ang / step) * step;
      if (shift || Math.abs(ang - snapped) < (4 * Math.PI) / 180) {
        return [d.a[0] + Math.cos(snapped) * len, d.a[1] + Math.sin(snapped) * len];
      }
    }
    return ip;
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
    switch (state.tool) {
      case 'select': selectUp(pane); return;
      case 'spot': spotUp(pane); return;
      case 'laser': pane.laserDown = false; pane.pred = null; pane.requestOverlay(); return;
    }
    const d = pane.draft;
    pane.draft = null;
    if (!d) return;
    if (d.type === 'textTap') {
      const hit = topHit(s, d.p, 12 / pane.s, (a) => a.type === 'text');
      if (hit) editText(pane, hit); else addText(pane, d.p);
      return;
    }
    if (d.type === 'cover') {
      const tiny = Math.hypot(d.a[0] - d.b[0], d.a[1] - d.b[1]) * pane.s < 10;
      delete d.down;
      if (tiny) { tapCover(pane, pane.toScreen(d.a)); pane.request(); return; }
      commit(s, d);
      return;
    }
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

  // ----- Hide & reveal covers -----
  function tapCover(pane, sp) {
    const s = pane.snap;
    const ip = pane.toImage(sp.x, sp.y);
    const a = topHit(s, ip, 0, (x) => x.type === 'cover');
    if (!a) return false;
    const nu = { ...a, revealed: !a.revealed };
    s.anns = s.anns.map((x) => (x === a ? nu : x));
    for (const p of state.panes) {
      if (p.snap === s) p.anim.set(nu.id, { from: a.revealed ? 1 : 0, to: nu.revealed ? 1 : 0, start: performance.now() });
    }
    persist(s);
    redrawSnap(s);
    return true;
  }

  // ----- Select / move / resize -----
  function selectDown(pane, sp, ip) {
    const s = pane.snap;
    const now = performance.now();
    if (pane.sel && pane.rotHandle && Math.hypot(sp.x - pane.rotHandle.x, sp.y - pane.rotHandle.y) < 30) {
      const c = annCentre(pane.sel);
      pane.drag = { kind: 'rotate', orig: pane.sel, before: s.anns, c, start: Math.atan2(ip[1] - c[1], ip[0] - c[0]), th: 0, moved: false };
      return;
    }
    if (pane.sel) {
      const { img, scr } = pane.selCorners();
      let best = -1, bd = 30;
      scr.forEach((p, i) => { const dd = Math.hypot(p.x - sp.x, p.y - sp.y); if (dd < bd) { bd = dd; best = i; } });
      if (best >= 0) {
        pane.drag = { kind: 'resize', orig: pane.sel, before: s.anns, origin: img[(best + 2) % 4], handle: img[best], moved: false };
        return;
      }
    }
    const hit = topHit(s, ip, 14 / pane.s);
    if (hit && hit === pane.sel && hit.type === 'text' && now - (pane.lastTap || 0) < 450) {
      pane.drag = null;
      editText(pane, hit);
      return;
    }
    pane.lastTap = now;
    pane.sel = hit || null;
    pane.drag = hit ? { kind: 'move', orig: hit, before: s.anns, start: ip, moved: false } : null;
    updateSelBar();
  }

  function selectMove(pane, ip) {
    const d = pane.drag;
    if (!d) return;
    const s = pane.snap;
    let nu;
    if (d.kind === 'rotate') {
      let th = Math.atan2(ip[1] - d.c[1], ip[0] - d.c[0]) - d.start;
      th = Math.atan2(Math.sin(th), Math.cos(th)); // keep within ±180°
      const step = Math.PI / 12; // snap to 15° steps when close
      const snapped = Math.round(th / step) * step;
      if (Math.abs(th - snapped) < (4 * Math.PI) / 180) th = snapped;
      d.th = th;
      nu = rotateAnn(d.orig, d.c, th);
    } else if (d.kind === 'move') {
      const dx = ip[0] - d.start[0], dy = ip[1] - d.start[1];
      if (!d.moved && Math.hypot(dx, dy) * pane.s < 3) return;
      nu = mapAnn(d.orig, (q) => [q[0] + dx, q[1] + dy]);
    } else {
      const o = d.origin, h = d.handle;
      const hx = h[0] - o[0] || 1e-6, hy = h[1] - o[1] || 1e-6;
      let sx = (ip[0] - o[0]) / hx, sy = (ip[1] - o[1]) / hy;
      let k = 1;
      if (uniformScale(d.orig)) {
        k = Math.max(0.08, ((ip[0] - o[0]) * hx + (ip[1] - o[1]) * hy) / (hx * hx + hy * hy));
        sx = sy = k;
      }
      nu = mapAnn(d.orig, (q) => [o[0] + (q[0] - o[0]) * sx, o[1] + (q[1] - o[1]) * sy], k);
    }
    s.anns = d.before.map((a) => (a === d.orig ? nu : a));
    pane.sel = nu;
    d.moved = true;
    redrawSnap(s);
  }

  function selectUp(pane) {
    const d = pane.drag;
    pane.drag = null;
    if (d && d.moved) {
      const s = pane.snap;
      s.undo.push(d.before);
      s.redo = [];
      changed(s);
    }
    updateSelBar();
  }

  function selAction(kind) {
    const pane = activePane();
    const s = pane.snap, a = pane.sel;
    if (!s || !a) return;
    if (kind === 'del') {
      replaceAnns(s, s.anns.filter((x) => x !== a));
      pane.sel = null;
    } else if (kind === 'dup') {
      const off = 24 / pane.s;
      const copy = mapAnn(a, (q) => [q[0] + off, q[1] + off]);
      copy.id = uid();
      if (copy.type === 'stamp' && copy.kind === 'num') copy.n = nextNumber(s);
      if (copy.type === 'cover') copy.revealed = false;
      commit(s, copy);
      pane.sel = copy;
    } else if (kind === 'front') {
      replaceAnns(s, [...s.anns.filter((x) => x !== a), a]);
    } else if (kind === 'edit' && a.type === 'text') {
      editText(pane, a);
    } else if (kind === 'done') {
      pane.sel = null;
    }
    updateSelBar();
    pane.request();
  }

  function recolourSelection(col) {
    const pane = activePane();
    const s = pane.snap, a = pane.sel;
    if (!s || !hasColour(a)) return false;
    const nu = { ...a, color: col };
    replaceAnns(s, s.anns.map((x) => (x === a ? nu : x)));
    pane.sel = nu;
    return true;
  }

  function updateSelBar() {
    const p = activePane && state.panes.length ? activePane() : null;
    const bar = $('#selBar');
    if (!p || !p.sel || p.cropping) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    $('[data-sel="edit"]', bar).classList.toggle('hidden', p.sel.type !== 'text');
    p.request();
  }

  function placeSelBar(pane, box) {
    const bar = $('#selBar');
    if (bar.classList.contains('hidden')) return;
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    const ox = pane.el.offsetLeft, oy = pane.el.offsetTop;
    // Bar goes below the frame (the rotation handle sits above it); above if no room.
    let x = ox + (box.x0 + box.x1) / 2 - bw / 2;
    const handleBelow = pane.rotHandle && pane.rotHandle.y > box.y1;
    let y = oy + box.y1 + (handleBelow ? 70 : 14);
    if (y + bh > oy + pane.ch - 6) y = oy + box.y0 - bh - (handleBelow ? 14 : 70);
    x = clamp(x, ox + 6, ox + pane.cw - bw - 6);
    y = clamp(y, oy + 6, oy + pane.ch - bh - 6);
    bar.style.left = x + 'px';
    bar.style.top = y + 'px';
  }

  // ----- Spotlight -----
  function spotDown(pane, sp, ip) {
    const sp0 = pane.spot;
    if (sp0 && inEllipse(sp0.a, sp0.b, ip)) pane.drag = { kind: 'spotmove', start: ip, orig: { a: [...sp0.a], b: [...sp0.b] } };
    else { pane.spot = { a: ip, b: ip }; pane.drag = { kind: 'spotnew', down: sp }; }
    updateSpotChip();
  }
  function spotMove(pane, sp, ip) {
    const d = pane.drag;
    if (!d) return;
    if (d.kind === 'spotmove') {
      const dx = ip[0] - d.start[0], dy = ip[1] - d.start[1];
      pane.spot = { a: [d.orig.a[0] + dx, d.orig.a[1] + dy], b: [d.orig.b[0] + dx, d.orig.b[1] + dy] };
    } else pane.spot.b = ip;
    pane.request();
  }
  function spotUp(pane) {
    const d = pane.drag;
    pane.drag = null;
    if (d && d.kind === 'spotnew') {
      const a = pane.spot.a, b = pane.spot.b;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) * pane.s < 20) { // tap → default-sized circle
        const r = 150 / pane.s;
        pane.spot = { a: [a[0] - r, a[1] - r], b: [a[0] + r, a[1] + r] };
      }
    }
    pane.request();
    updateSpotChip();
  }
  function clearSpot() {
    state.panes.forEach((p) => { p.spot = null; p.request(); });
    updateSpotChip();
  }
  function updateSpotChip() {
    $('#spotChip').classList.toggle('hidden', !state.panes.some((p) => p.spot));
  }

  // ----- Crop -----
  function startCrop() {
    const pane = activePane();
    const s = pane.snap;
    if (!s || !s.img) return;
    pane.sel = null;
    pane.spot = null;
    pane.cropping = { r: { ...cropOf(s) } };
    pane.fit();
    $('#cropBar').classList.remove('hidden');
    updateSelBar();
    updateSpotChip();
  }
  function endCrop(pane, apply) {
    const c = pane.cropping;
    if (!c) return;
    const s = pane.snap;
    if (apply === 'reset') { c.r = { x: 0, y: 0, w: s.w, h: s.h }; pane.request(); return; }
    pane.cropping = null;
    $('#cropBar').classList.add('hidden');
    if (apply) {
      const r = { x: Math.round(c.r.x), y: Math.round(c.r.y), w: Math.round(c.r.w), h: Math.round(c.r.h) };
      s.crop = r.x <= 2 && r.y <= 2 && r.w >= s.w - 4 && r.h >= s.h - 4 ? null : r;
      persist(s);
      for (const p of state.panes) if (p.snap === s && p !== pane) p.fit();
    }
    pane.fit();
  }
  function cropDown(pane, sp) {
    const c = pane.cropping, r = c.r, s = pane.snap;
    const corners = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    let best = -1, bd = 34;
    corners.forEach((q, i) => { const p = pane.toScreen(q); const dd = Math.hypot(p.x - sp.x, p.y - sp.y); if (dd < bd) { bd = dd; best = i; } });
    let ip = pane.toImage(sp.x, sp.y);
    ip = [clamp(ip[0], 0, s.w), clamp(ip[1], 0, s.h)];
    if (best >= 0) c.drag = { kind: 'corner', fixed: corners[(best + 2) % 4] };
    else if (ip[0] > r.x && ip[0] < r.x + r.w && ip[1] > r.y && ip[1] < r.y + r.h) c.drag = { kind: 'move', start: ip, orig: { ...r } };
    else { c.drag = { kind: 'corner', fixed: ip }; c.r = { x: ip[0], y: ip[1], w: 1, h: 1 }; }
  }
  function cropMove(pane, sp) {
    const c = pane.cropping, d = c && c.drag, s = pane.snap;
    if (!d) return;
    let ip = pane.toImage(sp.x, sp.y);
    ip = [clamp(ip[0], 0, s.w), clamp(ip[1], 0, s.h)];
    if (d.kind === 'corner') {
      c.r = { x: Math.min(d.fixed[0], ip[0]), y: Math.min(d.fixed[1], ip[1]), w: Math.abs(ip[0] - d.fixed[0]), h: Math.abs(ip[1] - d.fixed[1]) };
    } else {
      const o = d.orig;
      c.r = { x: clamp(o.x + ip[0] - d.start[0], 0, s.w - o.w), y: clamp(o.y + ip[1] - d.start[1], 0, s.h - o.h), w: o.w, h: o.h };
    }
    pane.request();
  }
  function cropUp(pane) {
    const c = pane.cropping;
    if (!c) return;
    c.drag = null;
    if (c.r.w < 20 || c.r.h < 20) c.r = { x: 0, y: 0, w: pane.snap.w, h: pane.snap.h };
    pane.request();
  }

  // ----- Undo / redo / clear / hide -----
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
    replaceAnns(s, []);
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
  //  Text dialog (add + edit)
  // ---------------------------------------------------------------------
  function nearestSizeKey(screenPx) {
    let best = 'M', bd = Infinity;
    for (const [k, v] of Object.entries(TEXT_SIZES)) { const d = Math.abs(Math.log(v / screenPx)); if (d < bd) { bd = d; best = k; } }
    return best;
  }

  function addText(pane, ip) {
    const st = state.textStyle;
    textDialog({ title: 'Add text', ok: 'Add', text: '', font: st.font, bold: st.bold, italic: st.italic, bg: st.bg, sizeKey: st.sizeKey, color: state.colour }, (v) => {
      const s = pane.snap;
      commit(s, { type: 'text', p: ip, text: v.text, color: v.color, size: TEXT_SIZES[v.sizeKey] / pane.s, rot: s.rotation, font: v.font, bold: v.bold, italic: v.italic, bg: v.bg });
    });
  }

  function editText(pane, a) {
    const startKey = nearestSizeKey(a.size * pane.s);
    textDialog({ title: 'Edit text', ok: 'Save', text: a.text, font: a.font || 'sans', bold: a.bold !== false, italic: !!a.italic, bg: !!a.bg, sizeKey: startKey, color: a.color }, (v) => {
      const s = pane.snap;
      const nu = { ...a, text: v.text, color: v.color, font: v.font, bold: v.bold, italic: v.italic, bg: v.bg };
      if (v.sizeKey !== startKey) nu.size = TEXT_SIZES[v.sizeKey] / pane.s;
      replaceAnns(s, s.anns.map((x) => (x === a ? nu : x)));
      if (pane.sel === a) { pane.sel = nu; updateSelBar(); }
    });
  }

  function textDialog(init, onOk) {
    const v = { ...init };
    const fontBtns = Object.entries(FONTS).map(([k, f]) => `<button type="button" data-font="${k}" style="font-family:${f.css.replace(/"/g, '&quot;')}">Aa <small>${f.name}</small></button>`).join('');
    const sizeBtns = Object.keys(TEXT_SIZES).map((k) => `<button type="button" data-size="${k}">${k}</button>`).join('');
    const colBtns = COLOURS.map((c) => `<button type="button" class="sw" data-col="${c}"><span style="background:${c}"></span></button>`).join('');
    openModal(
      `<h2>${init.title}</h2>
       <textarea id="txtIn" placeholder="Type here… (Shift+Enter for a new line)"></textarea>
       <div class="seg fonts">${fontBtns}</div>
       <div class="seg-row">
         <div class="seg"><button type="button" data-st="bold"><b>B</b></button><button type="button" data-st="italic"><i>I</i></button><button type="button" data-st="bg">Background</button></div>
         <div class="seg">${sizeBtns}</div>
       </div>
       <div class="seg cols">${colBtns}</div>
       <div class="txt-prev" id="txtPrev"><span></span></div>
       <div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" data-ok>${init.ok}</button></div>`,
      (b, close) => {
        b.classList.add('wide');
        const ta = $('#txtIn', b);
        ta.value = v.text;
        const prev = $('#txtPrev span', b);
        const sync = () => {
          $$('[data-font]', b).forEach((x) => x.classList.toggle('on', x.dataset.font === v.font));
          $$('[data-size]', b).forEach((x) => x.classList.toggle('on', x.dataset.size === v.sizeKey));
          $$('[data-col]', b).forEach((x) => x.classList.toggle('on', x.dataset.col === v.color));
          $('[data-st="bold"]', b).classList.toggle('on', v.bold);
          $('[data-st="italic"]', b).classList.toggle('on', v.italic);
          $('[data-st="bg"]', b).classList.toggle('on', v.bg);
          prev.textContent = ta.value || 'Preview';
          prev.style.fontFamily = FONTS[v.font].css;
          prev.style.fontWeight = v.bold ? 700 : 400;
          prev.style.fontStyle = v.italic ? 'italic' : 'normal';
          prev.style.fontSize = Math.min(TEXT_SIZES[v.sizeKey], 60) + 'px';
          prev.style.color = v.color;
          const outline = contrastFor(v.color);
          prev.style.background = v.bg ? (outline === '#000000' ? 'rgba(17,24,39,.88)' : 'rgba(255,255,255,.92)') : 'transparent';
          prev.style.webkitTextStroke = v.bg ? '0' : `1px ${outline}`;
        };
        b.addEventListener('click', (e) => {
          const t = e.target.closest('button');
          if (!t) return;
          if (t.dataset.font) v.font = t.dataset.font;
          else if (t.dataset.size) v.sizeKey = t.dataset.size;
          else if (t.dataset.col) v.color = t.dataset.col;
          else if (t.dataset.st) v[t.dataset.st] = !v[t.dataset.st];
          else return;
          sync();
          ta.focus();
        });
        ta.addEventListener('input', sync);
        const ok = () => {
          const text = ta.value.replace(/\s+$/, '');
          close();
          state.textStyle = { font: v.font, bold: v.bold, italic: v.italic, bg: v.bg, sizeKey: v.sizeKey };
          store.set(STYLE_KEY, state.textStyle);
          if (text) onOk({ ...v, text });
        };
        $('[data-ok]', b).onclick = ok;
        $('[data-x]', b).onclick = close;
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ok(); } });
        sync();
        ta.focus();
        setTimeout(() => ta.focus(), 60);
      }
    );
  }

  // ---------------------------------------------------------------------
  //  Toolbar UI
  // ---------------------------------------------------------------------
  function stampImage(kind, px = 40) {
    const c = document.createElement('canvas');
    const d = 2;
    c.width = c.height = px * d;
    const x = c.getContext('2d');
    x.scale(d, d);
    const wide = kind === 'www' || kind === 'ebi';
    drawStamp(x, { type: 'stamp', kind, p: [px / 2, px / 2], size: wide ? px * 1.1 : px * (kind === 'num' ? 1.35 : 0.95), rot: 0, n: 1, color: '#e11d48' });
    return c.toDataURL();
  }

  function buildToolbar() {
    const tools = $('#tools');
    for (const t of TOOLS) {
      const b = document.createElement('button');
      b.className = 'tool';
      b.dataset.tool = t.id;
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      b.innerHTML = t.id === 'stamp' ? `<img class="stamp-ico" alt="">` : icon(t.id);
      if (t.id === 'stamp') b.dataset.popAnchor = '';
      b.onclick = (e) => {
        if (t.id === 'stamp') togglePop($('#stampPop'), e.currentTarget, 'right');
        setTool(t.id);
      };
      tools.append(b);
    }
    const sp = $('#stampPop');
    sp.innerHTML = '<div class="pop-h">Stamps</div>' + STAMPS.map((st) => `<button data-stamp="${st.id}"><img src="${stampImage(st.id)}" alt=""> ${st.name}</button>`).join('');
    sp.addEventListener('click', (e) => {
      const b = e.target.closest('[data-stamp]');
      if (!b) return;
      state.stamp = b.dataset.stamp;
      setTool('stamp');
      closePopovers();
    });

    const cols = $('#colours');
    for (const c of COLOURS) {
      const b = document.createElement('button');
      b.className = 'swatch';
      b.dataset.colour = c;
      b.title = 'Colour (also recolours the selected mark)';
      b.innerHTML = `<span style="background:${c}"></span>`;
      b.onclick = () => {
        state.colour = c;
        if (!recolourSelection(c) && COLOUR_LESS_TOOLS.includes(state.tool)) setTool('pen');
        updateToolbar();
      };
      cols.append(b);
    }
    const sizes = $('#sizes');
    for (const [k, lw] of Object.entries(SIZE_PRESETS)) {
      const b = document.createElement('button');
      b.className = 'tool size';
      b.dataset.size = lw;
      b.title = { s: 'Thin', m: 'Medium', l: 'Thick' }[k];
      const dpx = { s: 8, m: 14, l: 22 }[k];
      b.innerHTML = `<span style="width:${dpx}px;height:${dpx}px"></span>`;
      b.onclick = () => setLineW(lw, true);
      sizes.append(b);
    }
    const more = document.createElement('button');
    more.className = 'tool size-custom';
    more.id = 'sizeMore';
    more.title = 'Any size: slider with live preview';
    more.dataset.popAnchor = '';
    more.innerHTML = `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></svg><b class="size-num"></b>`;
    more.onclick = (e) => { togglePop($('#sizePop'), e.currentTarget, 'right'); drawSizePreview(); };
    sizes.append(more);

    const range = $('#sizeRange');
    range.min = SIZE_MIN; range.max = SIZE_MAX; range.value = state.lineW;
    range.addEventListener('input', () => setLineW(+range.value, false));
    range.addEventListener('change', () => setLineW(+range.value, true));
    updateToolbar();
  }

  // Set the pen/shape width. `final` = the slider was released or a preset tapped:
  // that's when it's remembered and applied to a selected mark (one undo step).
  function setLineW(lw, final) {
    state.lineW = clamp(Math.round(lw), SIZE_MIN, SIZE_MAX);
    $('#sizeRange').value = state.lineW;
    updateToolbar();
    drawSizePreview();
    if (!final) return;
    store.set(SIZE_KEY, state.lineW);
    const pane = activePane();
    const s = pane && pane.snap, a = pane && pane.sel;
    if (!s || !a) return;
    let nu = null;
    if (a.w !== undefined) nu = { ...a, w: (state.lineW * (a.type === 'hl' ? 3.5 : 1)) / pane.s };
    else if (a.type === 'stamp') nu = { ...a, size: sizeFor(state.lineW).stamp / pane.s };
    if (nu) {
      replaceAnns(s, s.anns.map((x) => (x === a ? nu : x)));
      pane.sel = nu;
    }
  }

  function drawSizePreview() {
    const c = $('#sizePreview');
    if (!c || $('#sizePop').classList.contains('hidden')) return;
    const d = window.devicePixelRatio || 1;
    const W = c.clientWidth, H = c.clientHeight;
    c.width = W * d; c.height = H * d;
    const x = c.getContext('2d');
    x.scale(d, d);
    const light = contrastFor(state.colour) === '#ffffff';
    x.fillStyle = light ? '#f4f1ea' : '#1f2937';
    x.fillRect(0, 0, W, H);
    const hl = state.tool === 'hl';
    const w = state.lineW * (hl ? 3.5 : 1);
    x.strokeStyle = state.colour;
    x.lineCap = hl ? 'butt' : 'round';
    x.lineJoin = 'round';
    x.lineWidth = w;
    x.globalAlpha = hl ? 0.4 : 1;
    x.beginPath();
    const mid = H / 2, amp = Math.max(4, H / 2 - w / 2 - 8);
    for (let i = 0; i <= 60; i++) {
      const px = 24 + (i / 60) * (W - 48);
      const py = mid + Math.sin((i / 60) * Math.PI * 2) * amp * 0.6;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
    $('#sizeVal').textContent = `${state.lineW} px${hl ? ' (highlighter ×3.5)' : ''}`;
  }

  function setTool(id) {
    state.tool = id;
    // Pen, highlighter, eraser and laser draw their own cursor on the overlay
    // (a ring the size of the brush, or the red laser dot).
    const cursor = { pan: 'grab', select: 'default', text: 'text', laser: 'none', pen: 'none', hl: 'none', eraser: 'none' }[id] || 'crosshair';
    for (const p of state.panes) {
      p.canvas.style.cursor = cursor;
      p.requestOverlay();
      if (id !== 'select' && p.sel) { p.sel = null; p.request(); }
    }
    updateSelBar();
    updateToolbar();
  }

  function updateToolbar() {
    $$('#tools .tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === state.tool));
    const si = $('#tools [data-tool="stamp"] img');
    if (si) si.src = stampImage(state.stamp, 28);
    $$('#colours .swatch').forEach((b) => b.classList.toggle('on', b.dataset.colour === state.colour));
    $$('#sizes .tool.size').forEach((b) => b.classList.toggle('on', +b.dataset.size === state.lineW));
    const more = $('#sizeMore');
    if (more) {
      const custom = !Object.values(SIZE_PRESETS).includes(state.lineW);
      more.classList.toggle('on', custom);
      $('.size-num', more).textContent = custom ? state.lineW : '';
    }
    drawSizePreview(); // colour / tool changes update the preview too
    state.panes.forEach((p) => p.requestOverlay()); // and the cursor ring
  }

  function updateActionButtons() {
    const s = activeSnap();
    $('#undoBtn').disabled = !s || !s.undo.length;
    $('#redoBtn').disabled = !s || !s.redo.length;
    $('#clearBtn').disabled = !s || !s.anns.length;
    $('#eyeBtn').disabled = !s;
    $('#eyeBtn').innerHTML = icon(s && !s.showAnn ? 'eyeoff' : 'eye');
    $('#eyeBtn').classList.toggle('on', !!(s && !s.showAnn));
    $$('#viewCtl .vc').forEach((b) => (b.disabled = !s));
    $('#gridBtn').classList.toggle('on', !!activePane().grid);
  }

  // ---------------------------------------------------------------------
  //  Showing snaps, compare mode, strip
  // ---------------------------------------------------------------------
  function setActive(i) {
    if (!state.compare) i = 0;
    if (state.active === i) return;
    if (activePane().cropping) endCrop(activePane(), false);
    state.active = i;
    state.panes.forEach((p, j) => p.el.classList.toggle('active', j === i));
    updateActionButtons();
    updateSelBar();
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
      if (state.panes[1].cropping) endCrop(state.panes[1], false);
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
      t.title = `Snap ${i + 1}${s.title ? ' – ' + s.title : ''} – ${s.created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
      n.textContent = '#' + (i + 1) + (s.title ? ' ' + s.title : s.local ? ' (laptop)' : '');
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
  // Photos already downloaded are kept in this browser (IndexedDB) so a refresh
  // doesn't download them again. Same 12-hour limit as the cloud; cleared by
  // End lesson, Switch teacher, or when the snap is deleted.
  const photoCache = (() => {
    const DB = 'snap-photos', STORE = 'photos', MAX_AGE = 12 * 3600 * 1000;
    let dbp = null;
    const open = () => (dbp = dbp || new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    }));
    const run = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => res(req && req.result);
        t.onerror = () => rej(t.error);
      });
    };
    return {
      async get(id) {
        try { const v = await run('readonly', (st) => st.get(id)); return v && Date.now() - v.t < MAX_AGE ? v.blob : null; } catch { return null; }
      },
      async put(id, blob) { try { await run('readwrite', (st) => st.put({ blob, t: Date.now() }, id)); } catch {} },
      async del(id) { try { await run('readwrite', (st) => st.delete(id)); } catch {} },
      async clear() { try { await run('readwrite', (st) => st.clear()); } catch {} },
      async prune(keepIds) { // drop anything not in the current list or older than 12 h
        try {
          await run('readwrite', (st) => {
            const cur = st.openCursor();
            cur.onsuccess = () => {
              const c = cur.result;
              if (!c) return;
              if (!keepIds.has(c.key) || Date.now() - c.value.t > MAX_AGE) c.delete();
              c.continue();
            };
            return null;
          });
        } catch {}
      },
    };
  })();

  async function loadImage(s) {
    if (s.img || s.loading || s.local) return;
    s.loading = true;
    s.failed = false;
    try {
      let blob = await photoCache.get(s.id);
      if (!blob) {
        const b64 = await rpc('snap_get', { p_code: state.code, p_id: s.id });
        if (!b64) throw new Error('Snap not found');
        blob = b64ToBlob(b64, 'image/jpeg');
        photoCache.put(s.id, blob);
      }
      s.url = URL.createObjectURL(blob);
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
    if (!s.local) photoCache.del(s.id);
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
        if (!state.channelLive) setLive('wait', 'Connecting… (checking every 3 s)');
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
      photoCache.prune(ids);
      if (newest) show(state.snaps[state.snaps.length - 1]);
    } else if (newest) {
      if (!activeSnap() || (state.autoShow && !state.compare && !activePane().cropping)) {
        show(newest, state.compare ? state.active : 0);
        toast(`New snap #${snapNum(newest)}`);
      } else {
        toast(`New snap #${snapNum(newest)}: tap here to show it`, () => show(newest));
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

  // Live connection. If it isn't up within a few seconds, or drops, throw it
  // away and try again (waiting 3 s, 6 s, 12 s… up to 30 s between tries).
  let rtTimer = null, rtTries = 0;
  function scheduleReconnect(delay) {
    clearTimeout(rtTimer);
    const d = delay !== undefined ? delay : Math.min(30000, 3000 * 2 ** rtTries++);
    rtTimer = setTimeout(connectRealtime, d);
  }
  async function connectRealtime() {
    clearTimeout(rtTimer);
    const old = state.channel;
    state.channel = null;
    state.channelLive = false;
    if (old) { try { await sb().removeChannel(old); } catch {} }
    try {
      const name = await channelName(state.code);
      const ch = sb().channel(name, { config: { broadcast: { self: false } } });
      state.channel = ch;
      ch.on('broadcast', { event: 'new' }, () => sync())
        .on('broadcast', { event: 'deleted' }, () => sync())
        .on('broadcast', { event: 'cleared' }, () => sync())
        .subscribe((status) => {
          if (state.channel !== ch) return; // an older attempt
          state.channelLive = status === 'SUBSCRIBED';
          if (status === 'SUBSCRIBED') {
            rtTries = 0;
            clearTimeout(rtTimer);
            setLive('on', 'Live');
            sync();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setLive('wait', 'Reconnecting… (checking every 3 s)');
            scheduleReconnect();
          }
        });
      // Watchdog: not live after 6 s → start a fresh attempt.
      rtTimer = setTimeout(() => { if (state.channel === ch && !state.channelLive) scheduleReconnect(0); }, 6000);
    } catch (e) {
      console.warn(e);
      setLive('wait', 'Checking every 3 s');
      scheduleReconnect();
    }
  }

  // Backup check for new snaps: every 3 s while the live connection is down,
  // every 30 s while it's up. (Only asks "anything new?" – a few hundred bytes.)
  function pollLoop() {
    setTimeout(() => {
      if (!document.hidden) sync();
      pollLoop();
    }, state.channelLive ? 30000 : 3000);
  }

  function broadcast(event, payload = {}) {
    try { state.channel && state.channel.send({ type: 'broadcast', event, payload }); } catch {}
  }

  function showWho(label) {
    $('#roomLabel').textContent = label || 'Signed in';
    $('#whoBtn').classList.remove('hidden');
  }

  let started = false;
  async function start(code, label) {
    state.code = code;
    setLive('wait', 'Connecting…');
    if (label !== undefined) showWho(label);
    else rpc('snap_check', { p_code: code }).then(showWho).catch(() => {});
    if (started) { sync(); return; }
    started = true;
    connectRealtime(); // start the live connection and the first check together
    await sync();
    pollLoop();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      sync();
      if (!state.channelLive) connectRealtime();
    });
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
      $('#gate').classList.add('hidden');
      start(code, label);
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

  // Switch teacher: forget the passcode and wipe everything this board kept
  // locally (annotations, cached photos), then start again at the passcode screen.
  $('#whoBtn').onclick = () => {
    confirmBox(
      'Switch teacher?',
      'This signs this board out and clears the snaps, annotations and cached photos stored on this laptop. Your snaps stay in the cloud until you end the lesson or 12 hours pass. Save anything you want to keep first.',
      'Sign out',
      true,
      async () => {
        store.del(CODE_KEY);
        for (const k of store.keys()) if (k.startsWith(ANN_PREFIX)) store.del(k);
        await photoCache.clear();
        location.reload();
      }
    );
  };

  // ---------------------------------------------------------------------
  //  Images from the laptop (open / drop / paste) and blank pages
  // ---------------------------------------------------------------------
  async function addLocal(blob, name = 'image', title = '') {
    if (!blob || !/^image\//.test(blob.type)) { toast('That file is not an image.'); return; }
    const s = makeSnap({ id: `local-${Date.now()}-${state.localSeq++}`, local: true, created: new Date(), title });
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

  async function addPage(kind) {
    const W = 1600, H = 1131; // A4 landscape proportions
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, W, H);
    if (kind === 'squared') {
      x.strokeStyle = '#bfdbfe'; x.lineWidth = 1.5;
      x.beginPath();
      for (let i = 50; i < W; i += 50) { x.moveTo(i, 0); x.lineTo(i, H); }
      for (let j = 50; j < H; j += 50) { x.moveTo(0, j); x.lineTo(W, j); }
      x.stroke();
    } else if (kind === 'lined') {
      x.strokeStyle = '#bfdbfe'; x.lineWidth = 2;
      x.beginPath();
      for (let j = 110; j < H; j += 64) { x.moveTo(0, j); x.lineTo(W, j); }
      x.stroke();
      x.strokeStyle = '#fca5a5'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(140, 0); x.lineTo(140, H); x.stroke();
    } else if (kind === 'dotted') {
      x.fillStyle = '#94a3b8';
      for (let i = 50; i < W; i += 50) for (let j = 50; j < H; j += 50) { x.beginPath(); x.arc(i, j, 2.6, 0, Math.PI * 2); x.fill(); }
    }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const titles = { blank: 'Blank', squared: 'Squared', lined: 'Lined', dotted: 'Dotted' };
    await addLocal(blob, 'page', titles[kind]);
    setTool('pen');
  }

  $('#addPop').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    closePopovers();
    if (b.dataset.add === 'open') $('#fileInput').click();
    else addPage(b.dataset.add);
  });
  $('#addBtn').onclick = (e) => { e.stopPropagation(); togglePop($('#addPop'), e.currentTarget); };
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
  //  Timer
  // ---------------------------------------------------------------------
  const timer = { total: 0, left: 0, end: 0, running: false, iv: null, done: false };
  const fmt = (ms) => { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

  function startTimer(sec) {
    timer.total = sec * 1000;
    timer.left = timer.total;
    timer.done = false;
    runTimer(true);
    const el = $('#timer');
    el.classList.remove('hidden');
    if (!el.style.left) { el.style.right = '16px'; el.style.top = '16px'; }
  }
  function runTimer(on) {
    timer.running = on;
    if (on) timer.end = performance.now() + timer.left;
    clearInterval(timer.iv);
    if (on) timer.iv = setInterval(tickTimer, 200);
    renderTimer();
  }
  function tickTimer() {
    if (!timer.running) return;
    timer.left = Math.max(0, timer.end - performance.now());
    if (timer.left <= 0) {
      timer.running = false;
      timer.done = true;
      clearInterval(timer.iv);
      beep();
    }
    renderTimer();
  }
  function renderTimer() {
    const el = $('#timer');
    $('.t-digits', el).textContent = fmt(timer.left);
    el.classList.toggle('done', timer.done);
    el.classList.toggle('low', !timer.done && timer.left <= 10000 && timer.total > 10000);
    $('[data-t="toggle"]', el).textContent = timer.running ? 'Pause' : timer.done ? 'Restart' : 'Start';
  }
  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach((t) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880;
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.4, ac.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.28);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.3);
      });
    } catch {}
  }
  $('#timerBtn').onclick = (e) => { e.stopPropagation(); togglePop($('#timerPop'), e.currentTarget); };
  $('#timerPop').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sec]');
    if (!b) return;
    closePopovers();
    startTimer(+b.dataset.sec);
  });
  $('#timer').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const k = b.dataset.t;
    if (k === 'close') { runTimer(false); $('#timer').classList.add('hidden'); return; }
    if (k === 'toggle') {
      if (timer.done) { timer.left = timer.total; timer.done = false; }
      runTimer(!timer.running);
    } else if (k === 'plus' || k === 'minus') {
      const delta = (k === 'plus' ? 60000 : -60000);
      timer.left = Math.max(0, timer.left + delta);
      timer.total = Math.max(timer.total, timer.left);
      timer.done = false;
      if (timer.running) timer.end = performance.now() + timer.left;
      renderTimer();
    } else if (k === 'reset') {
      timer.left = timer.total; timer.done = false; runTimer(false);
    }
  });
  (() => { // drag the timer by its header
    const el = $('#timer'), head = $('.t-head', el);
    let start = null;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, l: r.left - sr.left, t: r.top - sr.top };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', (e) => {
      if (!start) return;
      const sr = stage.getBoundingClientRect();
      el.style.right = 'auto';
      el.style.left = clamp(start.l + e.clientX - start.x, 0, sr.width - el.offsetWidth) + 'px';
      el.style.top = clamp(start.t + e.clientY - start.y, 0, sr.height - el.offsetHeight) + 'px';
    });
    head.addEventListener('pointerup', () => (start = null));
  })();

  // ---------------------------------------------------------------------
  //  Saving
  // ---------------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, '0');
  const slug = (s) => String(s || '').trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function fileName(s, withAnn) {
    const parts = [dateStr(s.created), slug(state.lessonLabel), 'snap' + pad(snapNum(s))].filter(Boolean);
    return parts.join('_') + (withAnn && s.anns.some((a) => a.type !== 'redact' && a.type !== 'cover') ? '_annotated' : '') + '.jpg';
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
    x.setTransform(imgMatrix(s));
    x.drawImage(s.img, 0, 0);
    drawAnns(x, s.anns, withAnn, EXPORT_VIEW);
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
    for (const s of state.snaps) zip.file(fileName(s, withAnn), await toBlob(await renderExport(s, withAnn)));
    const out = await zip.generateAsync({ type: 'blob' });
    const name = [dateStr(new Date()), slug(state.lessonLabel), 'snaps' + (withAnn ? '_annotated' : '')].filter(Boolean).join('_') + '.zip';
    download(out, name);
    toast(`Saved ${state.snaps.length} snaps to Downloads`);
    return true;
  }

  // ---------------------------------------------------------------------
  //  Popovers
  // ---------------------------------------------------------------------
  function openPop(pop, anchor, side = 'below') {
    $$('.popover').forEach((p) => { if (p !== pop) p.classList.add('hidden'); });
    pop.classList.remove('hidden');
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x, y;
    if (side === 'right') { x = r.right + 8; y = r.top; }
    else { x = r.left; y = r.bottom + 6; }
    pop.style.left = clamp(x, 6, window.innerWidth - pw - 6) + 'px';
    pop.style.top = clamp(y, 6, window.innerHeight - ph - 6) + 'px';
  }
  function togglePop(pop, anchor, side) {
    if (!pop.classList.contains('hidden')) { closePopovers(); return; }
    openPop(pop, anchor, side);
  }
  function closePopovers() { $$('.popover').forEach((p) => p.classList.add('hidden')); }
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.popover') && !e.target.closest('[data-pop-anchor]')) closePopovers();
  });

  const savePop = $('#savePop');
  $('#lessonLabel').value = state.lessonLabel;
  $('#lessonLabel').addEventListener('input', (e) => { state.lessonLabel = e.target.value; store.set(LABEL_KEY, state.lessonLabel); });
  $('#saveBtn').onclick = (e) => { e.stopPropagation(); togglePop(savePop, e.currentTarget); };
  savePop.addEventListener('click', async (e) => {
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

  // ---------------------------------------------------------------------
  //  Modals
  // ---------------------------------------------------------------------
  let modalClose = null;
  function openModal(html, bind) {
    const body = $('#modalBody');
    body.className = 'modal';
    body.innerHTML = html;
    $('#modal').classList.remove('hidden');
    modalClose = () => { $('#modal').classList.add('hidden'); body.innerHTML = ''; modalClose = null; };
    bind(body, modalClose);
  }
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && modalClose) modalClose(); });

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
    await photoCache.clear();
    if (state.compare) setCompare(false);
    toast('Lesson ended: snaps deleted from the cloud');
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
  const GRID_STEPS = [0, 16, 32, 8];
  const GRID_NAMES = { 0: 'Grid off', 16: 'Grid: medium squares', 32: 'Grid: small squares', 8: 'Grid: large squares' };
  function cycleGrid() {
    const p = activePane();
    if (!p.snap) return;
    p.grid = GRID_STEPS[(GRID_STEPS.indexOf(p.grid) + 1) % GRID_STEPS.length];
    p.request();
    updateActionButtons();
    toast(GRID_NAMES[p.grid]);
  }

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
    $('#cropBtn').onclick = () => (activePane().cropping ? endCrop(activePane(), true) : startCrop());
    $('#gridBtn').onclick = cycleGrid;
    $('#deleteBtn').onclick = deleteCurrent;
    $('#autoBtn').onclick = () => {
      state.autoShow = !state.autoShow;
      $('#autoBtn').classList.toggle('on', state.autoShow);
      toast(state.autoShow ? 'New snaps will appear straight away' : 'New snaps wait in the strip until you tap them');
    };
    $('#autoBtn').classList.toggle('on', state.autoShow);
    $('#compareBtn').onclick = () => { if (state.snaps.length) setCompare(!state.compare); else toast('No snaps to compare yet'); };
    $('#fsBtn').onclick = toggleFullscreen;
    $('#spotOff').onclick = clearSpot;
    $('#cropBar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-crop]');
      if (!b) return;
      const k = b.dataset.crop;
      endCrop(activePane(), k === 'done' ? true : k === 'reset' ? 'reset' : false);
    });
    $('#selBar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sel]');
      if (b) selAction(b.dataset.sel);
    });
  }

  function rotate() {
    const p = activePane();
    const s = p.snap;
    if (!s || !s.w || p.cropping) return;
    s.rotation = (s.rotation + 90) % 360;
    for (const q of state.panes) if (q.snap === s) { q.spot = null; q.fit(); }
    updateSpotChip();
    persist(s);
    renderStrip();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalClose) { modalClose(); return; }
      closePopovers();
      const p = activePane();
      if (p.cropping) endCrop(p, false);
      else if (p.sel) selAction('done');
      else if (state.panes.some((q) => q.spot)) clearSpot();
      return;
    }
    if (isTyping(e.target) || modalClose) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'd' && activePane().sel) { e.preventDefault(); selAction('dup'); return; }
    // Ctrl + / − / 0 zoom the photo, not the browser
    if ((e.ctrlKey || e.metaKey) && (k === '+' || k === '=' || k === '-' || k === '0')) {
      e.preventDefault();
      const p = activePane();
      if (k === '0') p.fit(); else p.zoomAt(p.cw / 2, p.ch / 2, k === '-' ? 1 / 1.4 : 1.4);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    else if (k === 'f') toggleFullscreen();
    else if (k === 'h') toggleAnn();
    else if (k === 'r') rotate();
    else if (k === 'g') cycleGrid();
    else if (k === '0') activePane().fit();
    else if (k === '+' || k === '=') $('#zoomIn').click();
    else if (k === '-') $('#zoomOut').click();
    else if ((k === '[' || k === ']') && activePane().sel) {
      const p = activePane(), s = p.snap, a = p.sel;
      const nu = rotateAnn(a, annCentre(a), ((k === ']' ? 15 : -15) * Math.PI) / 180);
      replaceAnns(s, s.anns.map((x) => (x === a ? nu : x)));
      p.sel = nu;
    }
    else if (k === 'delete' || k === 'backspace') { if (activePane().sel) selAction('del'); else if (k === 'delete') deleteCurrent(); }
    else {
      const t = TOOLS.find((t) => t.key === k);
      if (t) setTool(t.id);
    }
  });

  // ----- Never let the browser zoom the whole page -----
  // Touchscreen drivers (and trackpads) can send pinches as Ctrl+wheel; route
  // those to the photo under the fingers, and block them everywhere else.
  document.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (e.target.tagName === 'CANVAS') return; // the pane's own handler zooms the photo
    const p = activePane();
    if (p && p.snap) p.zoomAt(p.cw / 2, p.ch / 2, Math.exp(-e.deltaY * 0.01));
  }, { passive: false });
  // Belt and braces for touch: a two-finger gesture outside the photo does nothing.
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault()));

  window.addEventListener('beforeunload', () => {
    for (const s of state.snaps) if (!s.local && (s.anns.length || s.rotation || s.crop)) store.set(ANN_PREFIX + s.id, { anns: s.anns, rotation: s.rotation, crop: s.crop });
  });

  // ---------------------------------------------------------------------
  //  Boot
  // ---------------------------------------------------------------------
  function boot() {
    $('#mark').textContent = CFG.schoolShort;
    $('#appName').textContent = CFG.appName;
    document.title = CFG.appName + ' – Board';
    state.panes = [new Pane(0, $('#pane0')), new Pane(1, $('#pane1'))];
    wireButtons();
    buildToolbar();
    state.panes[0].el.classList.add('active');
    setTool(state.tool);
    updateActionButtons();
    updateEmpty();
    drawQr($('#emptyQr'), 170);
    if (document.fonts && document.fonts.load) {
      document.fonts.load('40px "Patrick Hand"').then(() => state.panes.forEach((p) => p.request())).catch(() => {});
    }

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
  window.snapBoard = { state, addLocal, addPage, photoCache };

  boot();
})();
