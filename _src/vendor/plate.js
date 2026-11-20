/* Singing Plate kit — one plate of sand, any size.  (no dependencies; load plate.css beside it)

   THE RULE: a figure belongs to the plate's shape. Plate.figure(slotOrKey, w, h) gives the same habit a different
   drawing on a watch, a phone, an iPad or a widget; the three default habits are curated per shape into one medallion.

   LIVE   const p = Plate.create(host, { habits:[{key,name,votes,note,dir}], device:'watch'|'phone'|'pad'|'widget',
                                         hour:12|'now', face:{x,y,r}|null, sound:false, vibrate:false, dust:0, budget:n,
                                         zones:[{x,y,w,h,r,pad}], onVote(i,total), onLand(i,total), onRest() })
          p.press(i) p.release(i)      hold about 520 ms to cast a vote (tone swells, haze, a pinch sifts down, redraw)
          p.vote(i,{quiet})            cast at once          p.focus(i)   bring one habit's sand forward (-1: all)
          p.sing(i,level,ms)           sound a habit without a vote        p.still()   every habit hums, then rest
          p.pin(id,x,y) p.unpin(id)    still points under fingers (any number)   p.plough(x,y,lx,ly)   finger through sand
          p.setHabits(list) p.setZones(list) p.setHour(h,glide) p.setTilt(x,y) p.resize() p.sound(on)
          p.sleep(on) p.glad(ms) p.look(x,y|null) p.faceTo(x,y,r)   the sand face (optional)
          p.run(on)                    pause/resume everything; at rest the kit does no per-frame work by itself
          p.step(ms)                   advance deterministically and draw (for captures)      p.destroy()
          p.total() p.votes(i) p.habits p.W p.H p.el
   STILL  Plate.still(canvas, { w,h,dpr, habits:[{slot|key,votes,fig?,color?}], look:'full'|'tinted'|'clear'|'red',
                                tint:'#hex', bg:true, hour:12, grains:n, zones:[], seed:1, only:i })
          one call, a finished resting plate drawn into a canvas (widgets, thumbnails, icons).
   ALSO   Plate.figure(slotOrKey,w,h)  Plate.glyph(canvas,fig,hex,w,h)  Plate.COL  Plate.NOTES  Plate.shape(w,h)  */
(function (root) {
'use strict';
const PI = Math.PI, TAU = PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
function RNG(seed) { let s = (seed >>> 0) || 1; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); r.g = () => (r() + r() + r() + r() - 2) * 1.732; return r; }
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };
const COL = ['#EAD59C', '#B4D8B6', '#CBBFEC', '#B2CDE2', '#E9C2B4'], PALE = '#F0EADE';
const NOTES = { D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440, B4: 493.88, D5: 587.33, E5: 659.25, A3: 220, B3: 246.94 };
const SCALE = ['D4', 'Fs4', 'A4', 'E4', 'B4', 'D5', 'A3', 'B3'];

/* ---------- figures by plate shape ---------- */
const TP = f => [f[1], f[0], f[3], f[2], f[4]];
const TALL = [[0, 4, 2, 2, 1], [2, 4, 4, 8, 1], [4, 12, 6, 8, -1]], PORT = [[0, 4, 2, 2, 1], [2, 4, 4, 2, 1], [2, 6, 4, 4, 1]], TINY = [[0, 2, 2, 0, 1], [0, 4, 2, 2, 1], [2, 4, 4, 2, 1]], WATCH = [[0, 4, 2, 2, 1], [2, 4, 4, 2, 1], [0, 2, 2, 0, 1]]; // small plates read at a glance: simpler figures
const TALLKEY = { water: [2, 4, 0, 6, 1], food: [2, 6, 4, 2, -1], sleep: [0, 8, 2, 4, 1], move: [2, 8, 4, 4, 1], loved: [4, 2, 2, 8, 1], fruit: [4, 4, 2, 10, 1], outdoors: [0, 4, 4, 2, 1], junk: [4, 8, 2, 12, 1], scroll: [4, 12, 6, 8, 1], alcohol: [2, 10, 4, 6, 1], smoke: [4, 10, 6, 4, 1], vape: [2, 12, 4, 6, 1] };
const TALLPOOL = [[2, 8, 4, 4, -1], [0, 4, 2, 2, -1], [2, 4, 4, 8, -1], [4, 2, 2, 8, -1], [2, 10, 4, 6, -1], [4, 6, 2, 2, -1], [4, 8, 6, 4, 1], [2, 6, 4, 2, 1]].concat(Object.keys(TALLKEY).map(k => TALLKEY[k]));
const PORTPOOL = [[2, 4, 4, 2, -1], [2, 6, 4, 2, 1], [2, 6, 4, 2, -1], [2, 6, 4, 0, 1], [0, 4, 4, 2, 1], [0, 6, 4, 2, 1], [2, 4, 4, 0, 1], [4, 4, 6, 2, 1], [2, 6, 4, 4, -1], [4, 4, 6, 2, -1], [0, 6, 2, 4, 1], [0, 4, 2, 2, -1]];
function shape(w, h) { const r = w / h; if (Math.min(w, h) < 90) return r >= 1.4 ? 'tinywide' : 'tiny'; if (Math.min(w, h) < 280) return r < 1.4 ? 'watch' : 'watchwide'; return r < .58 ? 'tall' : r < 1.25 ? 'port' : r < 1.72 ? 'land' : 'wide'; }
const hash = s => { let x = 7; for (const ch of String(s).toLowerCase()) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x; };
function figure(k, w, h) { // k: slot 0..2 of the default three, or a habit key / name
  const sh = shape(w, h), slot = typeof k === 'number' ? k : { read: 0, walk: 1, screens: 2 }[k];
  if (slot != null && slot < 3) return sh === 'watch' ? WATCH[slot] : sh === 'watchwide' ? TP(WATCH[slot]) : sh === 'tall' ? TALL[slot] : sh === 'port' ? PORT[slot] : sh === 'land' ? TP(PORT[slot]) : sh === 'wide' ? TP(TALL[slot]) : sh === 'tiny' ? TINY[slot] : TP(TINY[slot]);
  const hs = typeof k === 'number' ? k * 7 + 3 : hash(k);
  if (sh === 'tall') return TALLKEY[k] || TALLPOOL[hs % TALLPOOL.length]; if (sh === 'wide') return TP(TALLKEY[k] || TALLPOOL[hs % TALLPOOL.length]);
  const f = PORTPOOL[hs % PORTPOOL.length]; return sh === 'land' || sh === 'tinywide' || sh === 'watchwide' ? TP(f) : f;
}
function fdist(g, u, v, w, h) { const a = g[0] * PI, b = g[1] * PI, c = g[2] * PI, d = g[3] * PI, s = g[4], cau = Math.cos(a * u), cbv = Math.cos(b * v), ccu = Math.cos(c * u), cdv = Math.cos(d * v);
  return (cau * cbv + s * ccu * cdv) / (Math.hypot((-a * Math.sin(a * u) * cbv - s * c * Math.sin(c * u) * cdv) / w, (-b * cau * Math.sin(b * v) - s * d * ccu * Math.sin(d * v)) / h) + 1e-5); }
function glyph(cv, g, hex, w, h, zoom) { // crisp still lines: the habit's emblem for this plate shape
  w = w || 44; h = h || 92; cv.width = w; cv.height = h; const im = new ImageData(w, h), D = im.data, rgb = hexRgb(hex || '#C6D0E0'), z = zoom || clamp((Math.max(g[0], g[2]) * (h / w > 1.4 ? 1 : .6) + Math.max(g[1], g[3]) / 2.17) / 4.4, 1, 2.5);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.abs(fdist(g, .5 + ((x + .5) / w - .5) / z, .5 + ((y + .5) / h - .5) / z, w * z, h * z)), k = (y * w + x) * 4; D[k] = rgb[0]; D[k + 1] = rgb[1]; D[k + 2] = rgb[2]; D[k + 3] = clamp(1.15 - d / 1.2, 0, 1) * 255; }
  cv.getContext('2d').putImageData(im, 0, 0); return cv;
}

/* ---------- the field: sampling, quiet zones ---------- */
function Field(W, H, seed, fo) {
  fo = fo || {}; const F = { W, H, rnd: RNG(seed || 20261113) }, rnd = F.rnd, QS = 4; let QW = 2, QH = 2, QG = new Float32Array(4);
  F.gs = clamp(Math.sqrt(W * H) / 579, .85, 1.3) * (fo.grain || 1); F.ks = clamp(Math.sqrt(W * H) / 579, .5, 1.4); F.GMIN = 3.76 / Math.sqrt(W * H);
  F.OFFT = new Float32Array(256); F.THR = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const r = rnd(); F.OFFT[i] = rnd.g() * (fo.tight ? (r < .82 ? .55 : r < .98 ? 1.4 : 3) : (r < .6 ? .9 : r < .915 ? 2.7 : r < .988 ? 7 : 20)) * F.ks; F.THR[i] = .08 + rnd() * .84; }
  F.setZones = list => { QW = Math.ceil(W / QS) + 2; QH = Math.ceil(H / QS) + 2; if (QG.length !== QW * QH) QG = new Float32Array(QW * QH); else QG.fill(0);
    for (const z of list || []) { const pad = z.pad || 16, hw = z.w / 2, hh = z.h / 2, cx = z.x + hw, cy = z.y + hh, r = Math.min(z.r == null ? 12 : z.r, hw, hh);
      const x0 = Math.max(0, Math.floor((z.x - pad) / QS)), x1 = Math.min(QW - 1, Math.ceil((z.x + z.w + pad) / QS)), y0 = Math.max(0, Math.floor((z.y - pad) / QS)), y1 = Math.min(QH - 1, Math.ceil((z.y + z.h + pad) / QS));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const ax = Math.abs(i * QS - cx) - hw + r, ay = Math.abs(j * QS - cy) - hh + r, sd = Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - r;
        let t = 1 - sd / pad; if (t <= 0) continue; if (t > 1) t = 1; t = t * t * (3 - 2 * t); const k = j * QW + i; if (t > QG[k]) QG[k] = t; } } };
  F.quiet = (x, y) => { const i = x / QS, j = y / QS; if (i < 0 || j < 0 || i >= QW - 1 || j >= QH - 1) return 0; const i0 = i | 0, j0 = j | 0, fx = i - i0, fy = j - j0, k = j0 * QW + i0;
    return (QG[k] * (1 - fx) + QG[k + 1] * fx) * (1 - fy) + (QG[k + QW] * (1 - fx) + QG[k + QW + 1] * fx) * fy; };
  const pp = F.pp = [0, 0];
  F.project = (g, u, v, off) => { const a = g[0] * PI, b = g[1] * PI, c = g[2] * PI, d = g[3] * PI, s = g[4];
    for (let it = 0; it < 10; it++) { const cau = Math.cos(a * u), cbv = Math.cos(b * v), ccu = Math.cos(c * u), cdv = Math.cos(d * v);
      const gx = (-a * Math.sin(a * u) * cbv - s * c * Math.sin(c * u) * cdv) / W, gy = (-b * cau * Math.sin(b * v) - s * d * ccu * Math.sin(d * v)) / H, gl = Math.hypot(gx, gy) + 1e-5; if (gl < F.GMIN) return false;
      let er = (cau * cbv + s * ccu * cdv) / gl - off; if (er < .3 && er > -.3) { pp[0] = u; pp[1] = v; return true; } if (er > 16) er = 16; else if (er < -16) er = -16;
      u -= gx / gl * er / W; v -= gy / gl * er / H; if (u < .004 || u > .996 || v < .004 || v > .996) return false; } return false; };
  F.home = (g, i) => { for (let t = 0; t < (fo.tight ? 40 : 14); t++) if (F.project(g, .01 + rnd() * .98, .01 + rnd() * .98, F.OFFT[i & 255])) return; if (!fo.tight) { pp[0] = .01 + rnd() * .98; pp[1] = .01 + rnd() * .98; } }; // tight: no strays, a grain that finds no line lies with its neighbour
  F.free = (g, i, loose) => { const thr = F.THR[i & 255]; for (let t = 0; t < 40; t++) { const u = .01 + rnd() * .98, v = .01 + rnd() * .98; if (F.quiet(u * W, v * H) > thr * .5) continue; if (loose) { pp[0] = u; pp[1] = v; return; }
    if (F.project(g, u, v, F.OFFT[i & 255]) && F.quiet(pp[0] * W, pp[1] * H) < thr) return; } };
  return F;
}

/* ---------- light on the plate ---------- */
const STOPS = [{ h: 0, base: '#080a0e', sheen: [150, 176, 236], sa: .055, glow: .75, sh: .25, sun: -.2 }, { h: 5.4, base: '#0a0c11', sheen: [158, 180, 236], sa: .06, glow: .7, sh: .25, sun: -.8 }, { h: 7, base: '#171a21', sheen: [255, 208, 192], sa: .13, glow: .1, sh: .42, sun: -1 },
  { h: 12.5, base: '#1f252e', sheen: [222, 233, 250], sa: .17, glow: 0, sh: .55, sun: 0 }, { h: 17.6, base: '#1b1e24', sheen: [255, 214, 166], sa: .17, glow: .04, sh: .48, sun: .85 }, { h: 19.8, base: '#14161d', sheen: [226, 172, 192], sa: .11, glow: .3, sh: .38, sun: 1 },
  { h: 21.6, base: '#090b10', sheen: [150, 176, 236], sa: .06, glow: .7, sh: .25, sun: .5 }, { h: 24, base: '#080a0e', sheen: [150, 176, 236], sa: .055, glow: .75, sh: .25, sun: -.2 }];
function light(h) { h = ((h % 24) + 24) % 24; let i = 0; while (i < STOPS.length - 2 && STOPS[i + 1].h <= h) i++; const a = STOPS[i], b = STOPS[i + 1], t = clamp((h - a.h) / (b.h - a.h), 0, 1), e = t * t * (3 - 2 * t);
  return { h, base: mixHex(a.base, b.base, e), sheen: a.sheen.map((v, k) => Math.round(lerp(v, b.sheen[k], e))), sa: lerp(a.sa, b.sa, e), glow: lerp(a.glow, b.glow, e), sh: lerp(a.sh, b.sh, e), sun: lerp(a.sun, b.sun, e), night: h < 6 || h >= 22 }; }
const realHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
let metalURL = null;
function metal() { if (metalURL) return metalURL; const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), r = RNG(99); x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) { const y = r() * 512, l = 30 + r() * 260, x0 = r() * 512 - 60, a = .02 + r() * .075; x.fillStyle = r() < .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 1.15 + ')'; x.fillRect(x0, y, l, r() < .8 ? 1 : 2); if (x0 + l > 512) x.fillRect(x0 - 512, y, l, 1); }
  return (metalURL = c.toDataURL('image/png')); }

/* ---------- sand ---------- */
const SZ = [.78, .95, .86, 1.12, .9, 1.04, .82, 1.26], CLS = [2, 3, 1, 2, 0, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 2];
const shades = hex => [mixHex(hex, '#000000', .42), mixHex(hex, '#000000', .16), hex, mixHex(hex, '#ffffff', .3), mixHex(hex, '#ffffff', .66)];
let popId = 0;
function Pop(F, hex, fig) {
  const p = { id: ++popId, ver: 0, cap: 512, n: 0, votes: [], fig: fig || [0, 4, 2, 2, 1], A: 0, lvl: 0, until: 0, tau: .42, Hz: 0, hzL: 0, hzUntil: 0, hzTau: .26, alpha: 1, alphaT: 1, falling: 0, moving: 0, landed: null, loose: false, fresh: null, was: false, isNew: true, stale: false, hex, sh: shades(hex) };
  for (const k of ['u', 'v', 'z', 'zd', 'hu', 'hv', 'tu', 'tv']) p[k] = new Float32Array(p.cap); p.mv = new Uint8Array(p.cap);
  const W = F.W, H = F.H, rnd = F.rnd, pp = F.pp;
  p.room = n => { if (p.n + n <= p.cap) return; let c = p.cap; while (c < p.n + n) c *= 2; for (const k of ['u', 'v', 'z', 'zd', 'hu', 'hv', 'tu', 'tv']) { const a = new Float32Array(c); a.set(p[k]); p[k] = a; } const m = new Uint8Array(c); m.set(p.mv); p.mv = m; p.cap = c; };
  p.add = (mode, n, T) => { p.room(n); p.votes.push(p.n);
    for (let k = 0; k < n; k++) { const i = p.n++; p.mv[i] = 0;
      if (mode === 'sift') { let u = .5, v = .5; for (let t = 0; t < 12; t++) { u = clamp(.5 + rnd.g() * .27, .03, .97); v = clamp(.5 + rnd.g() * .22, .03, .97); if (F.quiet(u * W, v * H) < .15) break; } p.u[i] = p.hu[i] = u; p.v[i] = p.hv[i] = v; p.z[i] = 1 + rnd() * 1.3; p.zd[i] = 300 + rnd() * 260; p.falling++; }
      else { F.home(p.fig, i); p.hu[i] = pp[0]; p.hv[i] = pp[1]; if (F.quiet(pp[0] * W, pp[1] * H) >= F.THR[i & 255]) F.free(p.fig, i); p.u[i] = pp[0]; p.v[i] = pp[1]; p.z[i] = 0; } }
    p.ver++; };
  p.sing = (level, ms, tau, T) => { p.lvl = level; p.until = T + ms; p.tau = tau || .42; p.loose = false; };
  p.lift = (level, ms, tau, T) => { p.hzL = level; p.hzUntil = T + ms; p.hzTau = tau || .26; };
  p.hush = tau => { p.until = 0; p.hzUntil = 0; if (tau) p.tau = tau; };
  p.keep = () => { p.stale = false; for (let i = 0; i < p.n; i++) if (!p.mv[i] && p.z[i] <= 0 && F.quiet(p.u[i] * W, p.v[i] * H) < F.THR[i & 255]) { p.hu[i] = p.u[i]; p.hv[i] = p.v[i]; } };
  p.relocate = snap => { let mov = 0; if (p.stale) p.keep();
    for (let i = 0; i < p.n; i++) { if (p.z[i] > 0) continue; const thr = F.THR[i & 255]; let tu, tv;
      if (p.loose) { if (F.quiet(p.u[i] * W, p.v[i] * H) < thr) { tu = p.u[i]; tv = p.v[i]; } else { F.free(p.fig, i, true); tu = pp[0]; tv = pp[1]; } }
      else if (F.quiet(p.hu[i] * W, p.hv[i] * H) < thr) { tu = p.hu[i]; tv = p.hv[i]; }
      else if (!p.isNew && F.quiet(p.u[i] * W, p.v[i] * H) < thr && Math.abs(p.u[i] - p.hu[i]) * W + Math.abs(p.v[i] - p.hv[i]) * H > 3) { tu = p.u[i]; tv = p.v[i]; }
      else { F.free(p.fig, i); tu = pp[0]; tv = pp[1]; }
      if (snap || p.isNew) { p.u[i] = tu; p.v[i] = tv; p.mv[i] = 0; } else if (Math.abs(tu - p.u[i]) * W + Math.abs(tv - p.v[i]) * H > 1.2) { p.tu[i] = tu; p.tv[i] = tv; p.mv[i] = 1; mov++; } else p.mv[i] = 0; }
    p.moving = mov; p.isNew = false; p.ver++; };
  p.strew = () => { for (let i = 0; i < p.n; i++) { F.free(p.fig, i, true); p.u[i] = p.hu[i] = pp[0]; p.v[i] = p.hv[i] = pp[1]; p.z[i] = 0; p.mv[i] = 0; } p.moving = p.falling = 0; p.loose = true; p.A = p.Hz = 0; p.until = p.hzUntil = 0; p.isNew = false; p.ver++; };
  p.scatter = () => { for (let i = 0; i < p.n; i++) { F.free(p.fig, i, true); p.tu[i] = pp[0]; p.tv[i] = pp[1]; p.mv[i] = 1; } p.moving = p.n; p.loose = true; p.until = 0; p.A = p.Hz = 0; p.hzUntil = 0; };
  p.drop = k => { while (k-- > 0 && p.votes.length) p.n = p.votes.pop(); p.ver++; };
  return p;
}
function drawPop(x, p, P, T) { // P: {W,H,gs,sx,sy,sh}
  const W = P.W, H = P.H, gs = P.gs, U = p.u, V = p.v, Z = p.z, n = p.n, al = p.alpha;
  x.fillStyle = '#000'; x.globalAlpha = Math.min(1, P.sh * 1.15) * al; x.beginPath(); for (let i = 0; i < n; i++) { if (Z[i] > 0) continue; const s = SZ[i & 7] * gs; x.rect(U[i] * W + P.sx, V[i] * H + P.sy, s, s); } x.fill(); x.globalAlpha = al;
  for (let c = 0; c < 5; c++) { x.fillStyle = p.sh[c]; x.beginPath(); for (let r = 0; r < 16; r++) { if (CLS[r] !== c) continue; for (let i = r; i < n; i += 16) { if (Z[i] > 0) continue; const s = SZ[i & 7] * gs; x.rect(U[i] * W, V[i] * H, s, s); } } x.fill(); }
  if (p.fresh) { const age = T - p.fresh.t0, k = age < 3600 ? 1 : 1 - (age - 3600) / 2600; if (k > 0) { x.fillStyle = p.sh[4]; x.globalAlpha = al * k * .9; x.beginPath(); for (let i = p.fresh.from; i < n; i++) { if (Z[i] > 0) continue; const s = SZ[i & 7] * gs * (1 + .5 * k); x.rect(U[i] * W - .2, V[i] * H - .2, s, s); } x.fill(); } else p.fresh = null; }
  if (p.falling > 0) for (let i = 0; i < n; i++) { const z = Z[i]; if (z <= 0 || z > 1) continue; const px = U[i] * W, py = V[i] * H, s = SZ[i & 7] * gs;
    x.fillStyle = '#000'; x.globalAlpha = .4 * (1 - z) * P.sh; x.fillRect(px + P.sx + z * 12 * gs, py + P.sy + z * 18 * gs, s * (1.2 + z * 1.6), s * (1.2 + z * 1.6)); x.fillStyle = p.sh[4]; x.globalAlpha = (1 - z * .5) * p.alpha; x.fillRect(px - z * 2, py - z * 3, s * (1.3 + z * 1.2), s * (1.3 + z * 1.2)); }
  x.globalAlpha = 1;
}

/* ---------- sound (one context for every plate) ---------- */
const Snd = { ctx: null, master: null };
function actx() { if (!Snd.ctx) { try { const AC = window.AudioContext || window.webkitAudioContext; Snd.ctx = new AC(); Snd.master = Snd.ctx.createGain(); Snd.master.gain.value = .5; const c = Snd.ctx.createDynamicsCompressor(); c.threshold.value = -16; c.ratio.value = 4; Snd.master.connect(c); c.connect(Snd.ctx.destination); } catch (e) { return null; } } if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return Snd.ctx; }
function Voice() { const V = {}, vs = {};
  V.tone = (key, freq, level, attack) => { const c = actx(); if (!c) return; let v = vs[key]; const now = c.currentTime;
    if (!v) { v = vs[key] = { g: c.createGain(), os: [] }; v.g.gain.value = 0; v.g.connect(Snd.master); for (const [mul, amp, det] of [[1, .5, 0], [1, .32, 3.2], [2, .11, 0], [3, .035, 0], [.5, .1, 0]]) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = freq * mul; o.detune.value = det; og.gain.value = amp; o.connect(og); og.connect(v.g); o.start(); v.os.push(o); } }
    clearTimeout(v.kill); v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(level * .34, now, (attack || .25) / 3); };
  V.off = (key, rel) => { const c = Snd.ctx, v = vs[key]; if (!c || !v) return; const now = c.currentTime, r = rel || 1.1; v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, r / 3.2); clearTimeout(v.kill);
    v.kill = setTimeout(() => { try { v.os.forEach(o => o.stop()); v.g.disconnect(); } catch (e) {} if (vs[key] === v) delete vs[key]; }, r * 2600); };
  V.all = () => { for (const k in vs) V.off(k, .5); };
  V.tick = (freq, gain) => { const c = actx(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), now = c.currentTime; o.type = 'sine'; o.frequency.value = freq || 1174.66; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain || .07, now + .012); g.gain.exponentialRampToValueAtTime(.0005, now + .22); o.connect(g); g.connect(Snd.master); o.start(now); o.stop(now + .25); };
  V.hiss = (ms, gain) => { const c = actx(); if (!c) return; const len = Math.round(c.sampleRate * ms / 1000), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(PI * i / len), 1.6);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = .7; g.gain.value = gain || .05; s.connect(f); f.connect(g); g.connect(Snd.master); s.start(); };
  return V; }

/* ---------- a live plate ---------- */
const BUDGET = { watch: 2800, phone: 13000, pad: 24000, widget: 3600 };
function create(host, o) {
  o = o || {}; const P = { el: host, habits: [], W: 0, H: 0 }, RM = matchMedia('(prefers-reduced-motion: reduce)').matches, V = Voice();
  host.classList.add('sp'); host.innerHTML = '<div class="sp-metal"></div><div class="sp-vig"></div><div class="sp-sheen"></div><div class="sp-sheen b"></div><canvas class="sp-glow"></canvas><canvas class="sp-sand"></canvas><canvas class="sp-face"></canvas><div class="sp-bevel"></div>';
  host.firstChild.style.backgroundImage = 'url(' + metal() + ')';
  const cvG = host.querySelector('.sp-glow'), cvS = host.querySelector('.sp-sand'), cvF = host.querySelector('.sp-face'), xg = cvG.getContext('2d'), xs = cvS.getContext('2d'), xf = cvF.getContext('2d'), restCv = document.createElement('canvas'), xr = restCv.getContext('2d');
  let F, pops = [], dust = null, T = 0, dirty = true, running = true, raf = 0, idle = 0, last = 0, acc = 0, timers = [], restKey = '', L = light(12), hourT = 12, glide = false, focusI = -1, hold = null, zones = o.zones || [], dpr = 1, sndOn = !!o.sound, HOLD = 520;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 }, pins = {}, sh = { x: .85, y: 1.05 }; let sheenX = 0, gpv = 96;
  const later = (ms, fn) => { const t = { at: T + ms, fn }; timers.push(t); wake(); return t; };
  const all = () => dust ? [dust].concat(pops) : pops;
  const total = () => pops.reduce((s, p) => s + p.votes.length, 0);
  /* face */
  const NF = o.face ? (o.faceGrains || 620) : 0, fc = { on: !!o.face, x: new Float32Array(NF), y: new Float32Array(NF), jx: new Float32Array(NF), jy: new Float32Array(NF), part: new Uint8Array(NF), t: new Float32Array(NF), o: new Float32Array(NF), q: new Float32Array(NF), rate: new Float32Array(NF),
    cx: 0, cy: 0, r: 30, tx: 0, ty: 0, tr: 30, bl: 0, gd: 0, sl: 0, gx: 0, gy: 0, sway: 0, sway2: 0, breath: 0, blinkAt: 2600, blinkEnd: 0, gladUntil: 0, sleep: null, look: null, agit: 0 };
  if (NF) { const r = RNG(5), parts = [[0, .4], [1, .062], [2, .062], [3, .045], [4, .051], [5, .107], [6, .124], [7, .149]]; let i = 0; for (const [pt, fr] of parts) { const n = Math.round(NF * fr); for (let k = 0; k < n && i < NF; k++, i++) { fc.part[i] = pt; fc.t[i] = (k + r()) / n; fc.o[i] = r.g(); fc.q[i] = r(); fc.rate[i] = pt === 1 || pt === 2 ? 22 + r() * 8 : 3.2 + r() * 7; } }
    if (o.face.x != null) { fc.cx = fc.tx = o.face.x; fc.cy = fc.ty = o.face.y; fc.r = fc.tr = o.face.r || 30; } }
  const ft = [0, 0, 1], leaf = (t, len, wd, ang, ox, oy) => { const s = t * 2, a = s < 1 ? s : 2 - s, lx = len * a, ly = (s < 1 ? 1 : -1) * wd * Math.sin(PI * a), c = Math.cos(ang), sn = Math.sin(ang); ft[0] = ox + lx * c - ly * sn; ft[1] = oy + lx * sn + ly * c; };
  function faceTarget(i) { const t = fc.t[i], oo = fc.o[i], pt = fc.part[i], bz = 1 + fc.breath * .022; let x = 0, y = 0, al = 1; const tipx = .05 + fc.sway * .2, tipy = -1.36 - fc.breath * .02;
    if (pt === 0 || (pt === 7 && fc.sl < .5)) { const th = t * TAU, rr = 1 + oo * .024; x = Math.cos(th) * rr * (2 - bz); y = Math.sin(th) * .95 * rr * bz + (1 - bz) * .9; }
    else if (pt === 1 || pt === 2) { const side = pt === 1 ? -1 : 1, ex = side * .37 + fc.gx, ey = -.07 + fc.gy, a = t * TAU, q = Math.sqrt(fc.q[i]) * .088, dx = Math.cos(a) * q, dy = Math.sin(a) * q * (1 - .9 * fc.bl), w = Math.max(fc.gd, fc.sl), k = 1 - 4 * (t - .5) * (t - .5), ax = (t - .5) * .3, ay = (fc.gd >= fc.sl ? -.08 * k + .03 : .05 * k) + oo * .011; x = ex + lerp(dx, ax, w); y = ey + lerp(dy, ay, w); }
    else if (pt === 3) { let w = lerp(.2, .32, fc.gd), dp = lerp(.05, .1, fc.gd); w = lerp(w, .1, fc.sl); dp = lerp(dp, .014, fc.sl); x = (t - .5) * w + fc.gx * .5; y = .27 + fc.gy * .5 + dp * (1 - 4 * (t - .5) * (t - .5)) + oo * .011; }
    else if (pt === 4) { const a = 1 - t; x = 2 * a * t * (-.03 + fc.sway * .08) + t * t * tipx + oo * .011; y = a * a * -.95 + 2 * a * t * -1.18 + t * t * tipy; }
    else if (pt === 5) { leaf(t, .34, .12, -2.5 + fc.sway2 * .45, tipx, tipy); x = ft[0] + oo * .008; y = ft[1]; } else if (pt === 6) { leaf(t, .45, .15, -.6 + fc.sway2 * .45, tipx, tipy); x = ft[0] + oo * .008; y = ft[1]; }
    else { const grp = i % 2, ph = ((T / 3000 + grp * .5) % 1), zs = .1 + ph * .09, s = t * 3; let zx, zy; if (s < 1) { zx = s * 2 - 1; zy = -1; } else if (s < 2) { zx = 1 - (s - 1) * 2; zy = (s - 1) * 2 - 1; } else { zx = (s - 2) * 2 - 1; zy = 1; } x = .7 + ph * .42 + zx * zs + oo * .008; y = -.82 - ph * .7 + zy * zs; al = Math.sin(PI * ph) * clamp(fc.sl * 2 - 1, 0, 1); }
    ft[0] = fc.cx + x * fc.r; ft[1] = fc.cy + y * fc.r; ft[2] = al; return ft; }
  function faceStep(dt) { if (!NF) return; const f = fc, k = 1 - Math.exp(-dt * 5.5), rnd = F.rnd; f.cx += (f.tx - f.cx) * k; f.cy += (f.ty - f.cy) * k; f.r += (f.tr - f.r) * k;
    const ph = (T / 4800) % 1, br = ph < .4 ? ph / .4 : ph < .5 ? 1 : ph < .92 ? 1 - (ph - .5) / .42 : 0; f.breath = br * br * (3 - 2 * br);
    const sw = .55 * Math.sin(T / 2300) + .3 * Math.sin(T / 3700 + 1.3); f.sway += (sw - f.sway) * (1 - Math.exp(-dt * 3)); f.sway2 += (f.sway - f.sway2) * (1 - Math.exp(-dt * 1.6));
    const asleep = f.sleep === true || (f.sleep == null && L.night); if (!asleep && T > f.blinkAt) { f.blinkEnd = T + 130; f.blinkAt = T + 2400 + rnd() * 4200; }
    f.bl += ((T < f.blinkEnd ? 1 : 0) - f.bl) * (1 - Math.exp(-dt * 34)); f.gd += ((T < f.gladUntil && !asleep ? 1 : 0) - f.gd) * (1 - Math.exp(-dt * 8)); f.sl += ((asleep ? 1 : 0) - f.sl) * (1 - Math.exp(-dt * 2.2));
    let lx = 0, ly = 0, sum = 0; for (const p of pops) sum += p.A; sum = Math.min(1, sum); if (f.look) { lx = f.look.x - f.cx; ly = f.look.y - f.cy; } else if (sum > .05) { lx = P.W / 2 - f.cx; ly = P.H / 2 - f.cy; }
    const ll = Math.hypot(lx, ly); if (ll > .01) { lx = lx / ll * .075; ly = ly / ll * .06; } if (asleep) { lx = 0; ly = .02; } f.gx += (lx - f.gx) * (1 - Math.exp(-dt * 7)); f.gy += (ly - f.gy) * (1 - Math.exp(-dt * 7)); f.agit += (sum - f.agit) * (1 - Math.exp(-dt * 6));
    const amp = RM ? 0 : (.42 + f.agit * 2.6) * clamp(f.r / 30, .6, 1.2);
    for (let i = 0; i < NF; i++) { const p = faceTarget(i), kk = 1 - Math.exp(-dt * f.rate[i]); f.jx[i] += (rnd() - .5) * amp - f.jx[i] * .16; f.jy[i] += (rnd() - .5) * amp - f.jy[i] * .16; f.x[i] += (p[0] - f.x[i]) * kk; f.y[i] += (p[1] - f.y[i]) * kk; } }
  function drawFace() { if (!NF) return; const f = fc, zOn = f.sl > .5, gs = clamp(.95 + f.r / 110, 1, 1.6) * (f.r < 20 ? .8 : 1); xf.setTransform(dpr, 0, 0, dpr, 0, 0); xf.clearRect(0, 0, P.W, P.H);
    xf.fillStyle = '#000'; xf.globalAlpha = Math.min(1, L.sh * 1.15); xf.beginPath(); for (let i = 0; i < NF; i++) { if (f.part[i] === 7 && zOn) continue; const s = SZ[i & 7] * gs; xf.rect(f.x[i] + f.jx[i] + sh.x * .62, f.y[i] + f.jy[i] + sh.y * .62, s, s); } xf.fill();
    for (let k = 0; k < 2; k++) { xf.fillStyle = k ? '#EDE6D8' : '#FFFDF6'; xf.globalAlpha = 1; xf.beginPath(); for (let i = k; i < NF; i += 2) { if (f.part[i] === 7 && zOn) continue; const s = SZ[i & 7] * gs; xf.rect(f.x[i] + f.jx[i], f.y[i] + f.jy[i], s, s); } xf.fill(); }
    if (zOn) { xf.fillStyle = '#EDE6D8'; for (let i = 0; i < NF; i++) { if (f.part[i] !== 7) continue; const a = faceTarget(i)[2]; if (a < .03) continue; xf.globalAlpha = a * .9; xf.fillRect(f.x[i] + f.jx[i], f.y[i] + f.jy[i], 1.5, 1.5); } } xf.globalAlpha = 1; }
  /* dance */
  function dance(p) { const g = p.fig, a = g[0] * PI, b = g[1] * PI, c = g[2] * PI, d = g[3] * PI, s = g[4], A = p.A, Hz = p.Hz, W = P.W, H = P.H, iw = 1 / W, ih = 1 / H, ks = F.ks, rnd = F.rnd, OFFT = F.OFFT, GMIN = F.GMIN;
    const pl = []; for (const k in pins) { const q = pins[k]; pl.push(q.x * iw, q.y * ih, fdistF(g, q.x * iw, q.y * ih)); } const np = A > .05 ? pl.length : 0, R = 92 * ks, is2 = 1 / (R * R);
    const U = p.u, V = p.v, Z = p.z, MV = p.mv, n = p.n, hk = 5 * ks * Hz, calm = 1 - Hz * .94, KR = 4.2 * ks, KD = 2.6 * ks, far = 13 * ks;
    for (let i = 0; i < n; i++) { if (Z[i] > 0 || MV[i]) continue; let u = U[i], v = V[i]; const cau = Math.cos(a * u), cbv = Math.cos(b * v), ccu = Math.cos(c * u), cdv = Math.cos(d * v);
      let f = cau * cbv + s * ccu * cdv, gx = (-a * Math.sin(a * u) * cbv - s * c * Math.sin(c * u) * cdv) * iw, gy = (-b * cau * Math.sin(b * v) - s * d * ccu * Math.sin(d * v)) * ih;
      for (let k = 0; k < np; k += 3) { const dx = (u - pl[k]) * W, dy = (v - pl[k + 1]) * H, q = Math.exp(-(dx * dx + dy * dy) * .5 * is2), fp = pl[k + 2]; f -= fp * q; gx += fp * q * dx * is2; gy += fp * q * dy * is2; }
      const gl = Math.hypot(gx, gy) + 1e-5; if (gl < GMIN) { U[i] = clamp(u + (rnd() - .5) * 2 * (2.2 * A + hk) * iw, .004, .996); V[i] = clamp(v + (rnd() - .5) * 2 * (2.2 * A + hk) * ih, .004, .996); continue; }
      const er = f / gl - OFFT[i & 255]; let dist = er < 0 ? -er : er; if (dist > 70) dist = 70; const act = dist > far ? 1 : dist / far, st = Math.min(dist * .5, KD * A * (.3 + act)) * calm, sg = er > 0 ? -1 : 1, k = KR * A * act + hk;
      let dx = (rnd() - .5) * 2 * k + sg * gx / gl * st, dy = (rnd() - .5) * 2 * k + sg * gy / gl * st; const x = u * W, y = v * H, q = F.quiet(x, y);
      if (q > .04) { const qx = F.quiet(x + 4, y) - F.quiet(x - 4, y), qy = F.quiet(x, y + 4) - F.quiet(x, y - 4), ql = Math.hypot(qx, qy) + 1e-4, ps = 1.2 + q * 3.2; dx -= qx / ql * ps; dy -= qy / ql * ps; }
      u += dx * iw; v += dy * ih; U[i] = u < .004 ? .004 : u > .996 ? .996 : u; V[i] = v < .004 ? .004 : v > .996 ? .996 : v; } }
  const fdistF = (g, u, v) => Math.cos(g[0] * PI * u) * Math.cos(g[1] * PI * v) + g[4] * Math.cos(g[2] * PI * u) * Math.cos(g[3] * PI * v);
  const popActive = p => p.A > 0 || p.Hz > 0 || p.falling > 0 || p.moving > 0 || p.alpha !== p.alphaT || (p.fresh && T - p.fresh.t0 < 6200);
  function popStep(p, dt) {
    if (T < p.until) p.A += (p.lvl - p.A) * (1 - Math.exp(-dt / .1)); else if (p.A > 0) { p.A *= Math.exp(-dt / p.tau); if (p.A < .004) { p.A = 0; if (p.Hz === 0) p.keep(); } }
    if (T < p.hzUntil) p.Hz += (p.hzL - p.Hz) * (1 - Math.exp(-dt / .07)); else if (p.Hz > 0) { p.Hz *= Math.exp(-dt / p.hzTau); if (p.Hz < .01) p.Hz = 0; }
    if (p.alpha !== p.alphaT) { p.alpha += (p.alphaT - p.alpha) * (1 - Math.exp(-dt * 5)); if (Math.abs(p.alpha - p.alphaT) < .004) p.alpha = p.alphaT; dirty = true; }
    if (p.n) { if (p.falling > 0) { let left = 0, first = false; for (let i = 0; i < p.n; i++) if (p.z[i] > 0) { p.z[i] -= dt * 1000 / p.zd[i]; if (p.z[i] <= 0) { p.z[i] = 0; first = true; } else left++; } p.falling = left; dirty = true; if (first && p.landed) { const fn = p.landed; p.landed = null; fn(); } }
      if (p.moving > 0) { const k = 1 - Math.exp(-dt * 4.2), W = P.W, H = P.H, rnd = F.rnd; let left = 0; for (let i = 0; i < p.n; i++) if (p.mv[i]) { const kk = k * (.45 + (i % 9) / 9), du = p.tu[i] - p.u[i], dv = p.tv[i] - p.v[i]; if (Math.abs(du) * W + Math.abs(dv) * H < .7) { p.u[i] = p.tu[i]; p.v[i] = p.tv[i]; p.mv[i] = 0; } else { p.u[i] += du * kk + (rnd() - .5) * 1.6 / W; p.v[i] += dv * kk + (rnd() - .5) * 1.6 / H; left++; } } p.moving = left; dirty = true; }
      if (p.A > 0 || p.Hz > 0) { dance(p); p.stale = true; dirty = true; } if (p.fresh && T - p.fresh.t0 < 6200) dirty = true; }
    const act = popActive(p); if (act !== p.was) { p.was = act; p.ver++; dirty = true; } return act; }
  function drawSand() { const list = all().filter(p => p.n && p.alpha > .02), act = [], rest = [], dp = { W: P.W, H: P.H, gs: F.gs, sx: sh.x * .62, sy: sh.y * .62, sh: L.sh }; for (const p of list) (popActive(p) ? act : rest).push(p);
    const key = rest.map(p => p.id + '.' + p.ver + '.' + p.alpha.toFixed(2)).join('|') + '|' + sh.x + ',' + sh.y + '|' + cvS.width + 'x' + cvS.height + '|' + L.sh.toFixed(2);
    if (key !== restKey) { restKey = key; if (restCv.width !== cvS.width || restCv.height !== cvS.height) { restCv.width = cvS.width; restCv.height = cvS.height; } xr.setTransform(dpr, 0, 0, dpr, 0, 0); xr.clearRect(0, 0, P.W, P.H); for (const p of rest) drawPop(xr, p, dp, T); }
    xs.setTransform(1, 0, 0, 1, 0, 0); xs.clearRect(0, 0, cvS.width, cvS.height); xs.drawImage(restCv, 0, 0); xs.setTransform(dpr, 0, 0, dpr, 0, 0); for (const p of act) drawPop(xs, p, dp, T);
    const gc = P.W * (.478 + .022 * sheenX); xs.fillStyle = '#fff'; for (const p of list) for (let i = 7; i < p.n; i += 37) { if (p.z[i] > 0) continue; const x = p.u[i] * P.W, y = p.v[i] * P.H, b = 1 - Math.abs(x - (gc - (y - P.H / 2) * .249)) / (30 * F.ks); if (b <= 0) continue; xs.globalAlpha = b * b * p.alpha * (.5 + (i % 5) * .12); xs.fillRect(x - .3, y - .3, 1.7 * F.gs, 1.7 * F.gs); } xs.globalAlpha = 1;
    if (L.glow > .02) { xg.clearRect(0, 0, cvG.width, cvG.height); xg.drawImage(cvS, 0, 0, cvG.width, cvG.height); } }
  function applyLight(h) { L = light(h); const st = host.style; st.setProperty('--sp-plate', L.base); st.setProperty('--sp-sheen', L.sheen.join(',')); st.setProperty('--sp-sheenA', L.sa.toFixed(3)); st.setProperty('--sp-glow', L.glow.toFixed(3)); const nn = clamp(L.glow / .7, 0, 1); st.setProperty('--sp-metalA', (.9 - nn * .38).toFixed(2)); st.setProperty('--sp-vigA', (.42 + nn * .2).toFixed(2)); dirty = true; }
  /* clock */
  function simStep(dt) { T += dt * 1000; let busy = false;
    if (timers.length) { const due = timers.filter(t => t.at <= T); if (due.length) { timers = timers.filter(t => t.at > T); due.forEach(t => t.fn()); } busy = timers.length > 0; }
    if (glide) { let dh = hourT - L.h; if (dh > 12) dh -= 24; if (dh < -12) dh += 24; if (Math.abs(dh) < .02) { glide = false; applyLight(hourT); } else applyLight(L.h + dh * (1 - Math.exp(-dt * 3.2))); busy = true; }
    if (Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > .002) { tilt.x += (tilt.tx - tilt.x) * (1 - Math.exp(-dt * 7)); tilt.y += (tilt.ty - tilt.y) * (1 - Math.exp(-dt * 7)); dirty = true; busy = true; }
    for (const p of all()) if (popStep(p, dt)) busy = true; if (hold) busy = true; faceStep(dt);
    if (NF && (fc.bl > .02 || fc.gd > .02 || Math.abs(fc.tx - fc.cx) + Math.abs(fc.ty - fc.cy) > .3 || T < fc.blinkEnd || T < fc.gladUntil)) busy = true; return busy; }
  function draw() { const shx = L.sun * 17 + tilt.x * 30; sheenX = shx; host.style.setProperty('--sp-shx', shx.toFixed(2) + '%'); host.style.setProperty('--sp-shx2', (shx * 1.55 + 8 + tilt.y * 6).toFixed(2) + '%');
    sh.x = Math.round((.85 + tilt.x * 1.3 - L.sun * .55) * 5) / 5; sh.y = Math.round((1.05 + tilt.y * .9) * 5) / 5; if (o.onFrame) o.onFrame(T); if (dirty) { dirty = false; drawSand(); } drawFace(); }
  function frame(now) { raf = 0; if (!running) return; const dt = Math.min(80, now - last); last = now; acc += dt; let n = 0, busy = false; while (acc >= 16.667 && n < 4) { busy = simStep(1 / 60) || busy; acc -= 16.667; n++; } if (n === 4) acc = 0; draw();
    if (busy || n === 0) raf = requestAnimationFrame(frame); else rest(); }
  function wake() { if (!running || raf) return; clearTimeout(idle); idle = 0; last = performance.now(); acc = 16.667; raf = requestAnimationFrame(frame); }
  function rest() { if (o.onRest) o.onRest(); if (NF && running && !RM) { clearTimeout(idle); idle = setTimeout(function tk() { if (!running || raf) return; T += 110; faceStep(.11); drawFace(); if (T > fc.blinkAt - 120 || timers.length) wake(); else idle = setTimeout(tk, 110); }, 110); } } // at rest: no frames; the face only shimmers at a low rate
  /* building */
  function size() { P.W = host.clientWidth; P.H = host.clientHeight; dpr = Math.min(o.dpr || 2, Math.max(1, window.devicePixelRatio || 1)); for (const c of [cvS, cvF]) { c.width = Math.round(P.W * dpr); c.height = Math.round(P.H * dpr); } cvG.width = Math.round(P.W / 2); cvG.height = Math.round(P.H / 2); F = Field(P.W, P.H, o.seed, o); F.setZones(zones); }
  function build(list) { P.habits = list.map((hb, i) => Object.assign({ note: SCALE[i % SCALE.length], dir: 'grow', votes: 0 }, hb)); const tot = P.habits.reduce((s, hb) => s + hb.votes, 0), budget = o.budget || BUDGET[o.device] || Math.min(26000, P.W * P.H * .04);
    gpv = Math.round(clamp(budget / Math.max(1, tot), budget / 160, budget / 43)); // early pinches are generous, later ones finer, never over the budget
    pops = P.habits.map((hb, i) => { const p = Pop(F, hb.color || COL[i % COL.length], hb.fig || figure(hb.slot != null ? hb.slot : (i < 3 && !hb.key ? i : hb.key || i), P.W, P.H)); for (let c = 0; c < hb.votes; c++) p.add('settled', gpv, T); p.isNew = false; p.done = false; return p; });
    const dn = Math.round((o.dust || 0) * clamp(1 - tot / 24, 0, 1)); dust = dn ? Pop(F, PALE, pops[0] ? pops[0].fig : figure(0, P.W, P.H)) : null; if (dust) { dust.add('settled', dn, T); if (o.dustLoose) dust.strew(); dust.isNew = false; }
    applyFocus(true); dirty = true; restKey = ''; }
  function applyFocus(snap, singing) { pops.forEach((p, j) => { p.alphaT = focusI < 0 || j === focusI ? 1 : singing ? .36 : (o.dim == null ? .5 : o.dim); if (snap) p.alpha = p.alphaT; }); wake(); }
  function cast(i, quiet) { const hb = P.habits[i], p = pops[i]; if (!p) return; p.done = true; hb.votes++; p.fresh = { from: p.n, t0: T + 600 }; p.landed = () => { if (sndOn) V.tick(NOTES[hb.note] * 2, .05); if (o.onLand) o.onLand(i, total()); };
    p.add(RM ? 'settled' : 'sift', gpv, T); if (RM) { const fn = p.landed; p.landed = null; fn(); } else p.lift(1, 300, .3, T); if (dust) { dust.fig = p.fig; dust.sing(1, 1700, .5, T); }
    if (sndOn) { V.hiss(560, quiet ? .03 : .05); V.tone('h' + i, NOTES[hb.note], quiet ? .5 : 1, .14); later(1800, () => V.off('h' + i, 1.7)); } if (o.vibrate && navigator.vibrate) { try { navigator.vibrate(quiet ? 12 : [26, 60, 16, 80, 10]); } catch (e) {} }
    p.sing(1, 1800, .5, T); const f0 = focusI; focusI = i; applyFocus(false, true); later(3400, () => { if (o.keepFocus === false) focusI = f0; applyFocus(false); }); if (NF) later(700, () => { fc.gladUntil = T + 2000; }); if (o.onVote) o.onVote(i, total()); wake(); }
  /* api */
  P.resize = () => { size(); build(P.habits); if (NF) for (let i = 0; i < NF; i++) { const q = faceTarget(i); fc.x[i] = q[0]; fc.y[i] = q[1]; } applyLight(L.h); wake(); };
  P.setHabits = list => { build(list); wake(); };
  P.setZones = (list, snap) => { zones = list || []; F.setZones(zones); for (const p of all()) if (p.n) p.relocate(RM || snap); dirty = true; wake(); };
  P.press = i => { const hb = P.habits[i], p = pops[i]; if (!p || hold) return; hold = { i, t0: T }; if (sndOn) { actx(); V.tone('h' + i, NOTES[hb.note], .5, .5); } p.sing(.42, 99999, .3, T); if (!RM) p.lift(.2, 99999, .2, T); focusI = i; applyFocus(false, true); hold.timer = later(HOLD, () => { if (hold && hold.i === i) { hold.done = true; cast(i); } }); wake(); };
  P.release = i => { if (!hold || (i != null && hold.i !== i)) return false; const hd = hold; hold = null; if (hd.done) return true; timers = timers.filter(t => t !== hd.timer); V.off('h' + hd.i, .35); pops[hd.i].hush(.2); applyFocus(false); wake(); return false; };
  P.holdT = () => hold ? clamp((T - hold.t0) / HOLD, 0, 1) : 0;
  P.vote = (i, opt) => cast(i, opt && opt.quiet);
  P.sing = (i, level, ms) => { const p = pops[i]; if (!p) return; p.sing(level == null ? .6 : level, ms || 900, .5, T); if (!RM) p.lift(.3, 160, .25, T); if (sndOn) { V.tone('h' + i, NOTES[P.habits[i].note], level == null ? .5 : level, .2); later(ms || 900, () => V.off('h' + i, 1.2)); } wake(); };
  P.focus = i => { focusI = i; applyFocus(false); };
  P.still = () => { focusI = -1; applyFocus(false); pops.forEach((p, i) => { p.sing(.6, 1500, .6, T); if (!RM) p.lift(.4, 240, .3, T); if (sndOn && P.habits[i].votes) { V.tone('h' + i, NOTES[P.habits[i].note], .4, .5); later(1500, () => V.off('h' + i, 2.4)); } }); if (NF) later(2200, () => { fc.sleep = true; }); wake(); };
  P.pin = (id, x, y) => { pins[id] = { x, y }; if (NF) fc.look = { x, y }; wake(); }; P.unpin = id => { delete pins[id]; if (NF && !Object.keys(pins).length) fc.look = null; };
  P.plough = (x, y, lx, ly) => { const R = 15 * F.ks, R2 = R * R, mx = x - lx, my = y - ly, ml = Math.hypot(mx, my) + 1e-4, W = P.W, H = P.H, rnd = F.rnd;
    for (const p of all()) { if (!p.n) continue; let hit = false; for (let i = 0; i < p.n; i++) { if (p.z[i] > 0) continue; const gx = p.u[i] * W, gy = p.v[i] * H; let dx = gx - x, dy = gy - y; const d2 = dx * dx + dy * dy; if (d2 > R2) continue; let d = Math.sqrt(d2); if (d < .5) { dx = -my / ml; dy = mx / ml; d = 1; }
      const side = (dx * -my + dy * mx) >= 0 ? 1 : -1, push = (R - d) * .85 + rnd() * 1.5; p.u[i] = p.hu[i] = clamp((gx + (dx / d * .55 + side * -my / ml * .45) * push + mx * .25) / W, .004, .996); p.v[i] = p.hv[i] = clamp((gy + (dy / d * .55 + side * mx / ml * .45) * push + my * .25) / H, .004, .996); p.mv[i] = 0; hit = true; } if (hit) p.ver++; } dirty = true; wake(); };
  P.setHour = (h, gl) => { hourT = h === 'now' ? realHour() : h; if (gl) { glide = true; wake(); } else { glide = false; applyLight(hourT); wake(); } };
  P.setTilt = (x, y) => { tilt.tx = clamp(x, -1, 1); tilt.ty = clamp(y || 0, -1, 1); wake(); };
  P.sound = on => { sndOn = !!on; if (!on) V.all(); }; P.tick = (f, g) => { if (sndOn) V.tick(f, g); };
  P.sleep = on => { if (NF) { fc.sleep = on; wake(); } }; P.glad = ms => { if (NF) { fc.gladUntil = T + (ms || 1800); wake(); } }; P.look = (x, y) => { if (NF) fc.look = x == null ? null : { x, y }; };
  P.faceTo = (x, y, r) => { if (NF) { fc.tx = x; fc.ty = y; if (r) fc.tr = r; wake(); } };
  P.run = on => { running = !!on; if (!on) { cancelAnimationFrame(raf); raf = 0; clearTimeout(idle); V.all(); } else wake(); };
  P.step = ms => { const n = Math.round(ms / 16.667); for (let i = 0; i < n; i++) simStep(1 / 60); dirty = true; draw(); };
  P.total = total; P.votes = i => pops[i] ? pops[i].votes.length : 0; P.done = i => pops[i] && pops[i].done; P.undo = i => { const p = pops[i]; if (p && p.votes.length) { p.drop(1); P.habits[i].votes--; p.done = false; dirty = true; wake(); } };
  P.later = later; P.dust = () => dust; P.pops = () => pops; P.light = () => L; P.destroy = () => { P.run(false); host.innerHTML = ''; };
  size(); applyLight(o.hour === 'now' || o.hour == null ? realHour() : o.hour); hourT = L.h; build(o.habits || []); if (NF) for (let i = 0; i < NF; i++) { const q = faceTarget(i); fc.x[i] = q[0]; fc.y[i] = q[1]; } draw(); wake(); return P;
}

/* ---------- the static path: one call, a finished resting plate ---------- */
function still(cv, o) {
  o = o || {}; const W = o.w || cv.clientWidth || 158, H = o.h || cv.clientHeight || 158, d = o.dpr || 2, look = o.look || 'full', F = Field(W, H, o.seed || 11, o), rnd = F.rnd, L = light(o.hour == null ? 12 : o.hour), x = cv.getContext('2d');
  cv.width = Math.round(W * d); cv.height = Math.round(H * d); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); F.setZones(o.zones || []);
  if (o.bg !== false && look !== 'clear') { const base = look === 'red' ? '#070303' : look === 'tinted' ? '#0d0f13' : L.base; x.fillStyle = base; x.fillRect(0, 0, W, H);
    const r = RNG(77), n = Math.round(W * H / 34); for (let i = 0; i < n; i++) { const y = r() * H, l = 12 + r() * W * .55, x0 = r() * W - 20, a = .012 + r() * .04; x.fillStyle = r() < .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 1.6 + ')'; x.fillRect(x0, y, l, .6); }
    if (look === 'full') { const g = x.createLinearGradient(W * (.2 + L.sun * .12), 0, W * (.8 + L.sun * .12), H * .28); g.addColorStop(0, 'rgba(' + L.sheen + ',0)'); g.addColorStop(.5, 'rgba(' + L.sheen + ',' + (L.sa * .8).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + L.sheen + ',0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.hypot(W, H) * .62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); x.fillStyle = vg; x.fillRect(0, 0, W, H); }
  const hs = (o.habits || [{ slot: 0, votes: 14 }, { slot: 1, votes: 13 }, { slot: 2, votes: 11 }]).filter((hb, i) => o.only == null || i === o.only), tot = hs.reduce((s, hb) => s + Math.max(0, hb.votes), 0) || 1, budget = o.grains || Math.min(9000, Math.round(W * H * .075));
  hs.forEach((hb, hi) => { const slot = hb.slot != null ? hb.slot : hi, fig = hb.fig || figure(hb.key || slot, W, H), n = Math.round(budget * hb.votes / tot), col = look === 'red' ? '#D2372B' : look === 'tinted' ? (o.tint || '#D9DEE8') : look === 'clear' ? '#FFFFFF' : (hb.color || COL[slot % COL.length]), sd = shades(col), al = (hb.alpha == null ? 1 : hb.alpha) * (look === 'clear' ? .82 : 1);
    const U = new Float32Array(n), V = new Float32Array(n); let m = 0; for (let i = 0; i < n; i++) { F.home(fig, i); if (F.quiet(F.pp[0] * W, F.pp[1] * H) >= F.THR[i & 255]) F.free(fig, i); U[m] = F.pp[0]; V[m++] = F.pp[1]; }
    if (look !== 'clear') { x.fillStyle = '#000'; x.globalAlpha = .5 * al; x.beginPath(); for (let i = 0; i < m; i++) { const s = SZ[i & 7] * F.gs; x.rect(U[i] * W + .5, V[i] * H + .65, s, s); } x.fill(); }
    for (let c = 0; c < 5; c++) { x.fillStyle = sd[c]; x.globalAlpha = al; x.beginPath(); for (let i = 0; i < m; i++) { if (CLS[i & 15] !== c) continue; const s = SZ[i & 7] * F.gs; x.rect(U[i] * W, V[i] * H, s, s); } x.fill(); } });
  x.globalAlpha = 1; return cv;
}
root.Plate = { create, still, figure, glyph, shape, light, COL, PALE, NOTES, SCALE, BUDGET, RNG };
})(window);
