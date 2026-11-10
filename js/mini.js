// Toprak Saha — maç anı mini oyunları (canvas)
// Oyun arayüzü: update(dt), after(dt), draw(g), down/move/up(x,y). Sonuç m.finish({out,...}).
// Parametreler: skill 0-1, speed 0-1, oppQ 0-1 (rakip kalitesi), hard ~1 (yorgunluk/moral çarpanı), cu/co forma renkleri
import { sfx } from './sfx.js';

const W = 360, H = 460;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }

const OUT = {
  gol: ['GOL!', 1], kurtaris: ['KALECİ ÇIKARDI', 0], direk: ['DİREK!', 0], aut: ['DIŞARI', 0], baraj: ['BARAJDA', 0], blok: ['SAVUNMADA', 0], gec: ['GEÇ KALDIN', 0], iska: ['ISKA', 0],
  ok: ['PAS YERİNDE', 1], kesildi: ['ARAYA GİRDİLER', 0], bos: ['PAS BOŞA', 0],
  gecti: ['GEÇTİN!', 1], kaptirdi: ['TOPU KAPTIRDIN', 0],
  kapildi: ['TOPU KAPTIN', 1], gecildi: ['RAKİP GEÇTİ', 0], faul: ['FAUL', 0],
  kurtardi: ['KURTARDIN!', 1], yedi: ['GOL OLDU', 0],
};
// [başlık, ipucu 1, ipucu 2, hareket animasyonu]
const INTRO = {
  sut: ['ŞUT', 'Toptan kaleye doğru kaydır.', 'Uzun kaydır: yüksek. Hızlı kaydır: sert.', 'swipe'],
  kafa: ['KAFA', 'Top başına geldiği an kaydır.', 'Halka kapanınca vur.', 'swipe'],
  frikik: ['FRİKİK', 'Kavis çizerek kaydır.', 'Top barajın yanından döner.', 'swipe'],
  penalti: ['PENALTI', 'Köşene doğru kaydır.', '', 'swipe'],
  pas: ['PAS', 'Koşan arkadaşının önüne dokun.', 'Araya girmesinler.', 'tap'],
  calim: ['ÇALIM', 'Oyuncun parmağını takip eder.', 'Kayarak girenlerden kaç.', 'drag'],
  savunma: ['SAVUNMA', 'Rakibi önünden karşıla.', 'Arkadan girersen faul.', 'drag'],
  kurtaris: ['KURTARIŞ', 'Eldiveni topa yetiştir.', '', 'drag'],
};

// ---------- çizim ----------
function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function text(g, s, x, y, size = 13, col = 'rgba(255,255,255,.85)', w = 600) { g.font = `${w} ${size}px Barlow, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); }
function head(g, s, x, y, size, col) { g.font = `900 ${size}px "Big Shoulders Display", "Arial Narrow", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); }
function timer(g, f) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, W, 6); g.fillStyle = f < .3 ? '#ff4d4d' : '#ffd23f'; g.fillRect(0, 0, W * clamp(f, 0, 1), 6); }

function pitch(g) {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#22803f' : '#1d7438'; g.fillRect(0, i * H / 8, W, H / 8 + 1); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(8, 8, W - 16, H - 16);
  g.beginPath(); g.arc(W / 2, H / 2, 46, 0, 7); g.moveTo(8, H / 2); g.lineTo(W - 8, H / 2); g.stroke();
}
function man(g, x, y, col, me, sx = 1, sy = 1) {
  g.save(); g.translate(x, y); g.scale(sx, sy);
  g.beginPath(); g.ellipse(0, 4, 12, 9, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
  g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fillStyle = col; g.fill();
  g.lineWidth = 2; g.strokeStyle = me ? '#fff' : 'rgba(0,0,0,.65)'; g.stroke();
  g.beginPath(); g.arc(0, -1, 4.5, 0, 7); g.fillStyle = me ? '#f3cfa6' : '#c9a07a'; g.fill();
  g.restore();
  if (me) { g.beginPath(); g.arc(x, y, 15, 0, 7); g.lineWidth = 2.5; g.strokeStyle = '#ffd23f'; g.stroke(); }
}
function ballD(g, x, y, r = 6) {
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#111'; g.lineWidth = Math.max(1, r / 5); g.stroke();
  if (r > 5) { g.beginPath(); g.arc(x, y, r * .36, 0, 7); g.fillStyle = '#1b1b1b'; g.fill(); }
}
function trailD(g, tr) { for (let i = 0; i < tr.length; i++) { const p = tr[i]; g.beginPath(); g.arc(p.x, p.y, (p.r || 5) * (i / tr.length), 0, 7); g.fillStyle = `rgba(255,255,255,${(i / tr.length) * .28})`; g.fill(); } }
function pushTrail(tr, x, y, r, max = 9) { tr.push({ x, y, r }); if (tr.length > max) tr.shift(); }

export const GOAL = { gx: 70, gy: 92, gw: 220, gh: 92 };
function mkCrowd(o) { const a = []; for (let i = 0; i < 170; i++) a.push({ x: (i * 37.7) % W, y: 16 + ((i * 53.3) % 58), c: [o.co, '#e9e2d3', '#2b2a28', o.co, '#55504a'][i % 5], p: i * 1.7 }); return a; }
function stadium(g, t, crowd, net) {
  const { gx, gy, gw, gh } = GOAL, gb = gy + gh;
  let gr = g.createLinearGradient(0, 0, 0, gb); gr.addColorStop(0, '#0b0f16'); gr.addColorStop(1, '#1b2430');
  g.fillStyle = gr; g.fillRect(0, 0, W, gb);
  for (const c of crowd) { g.fillStyle = c.c; g.globalAlpha = .75; g.fillRect(c.x, c.y + Math.sin(t * 5 + c.p) * 1.4, 5, 6); }
  g.globalAlpha = 1;
  for (const x of [24, W - 24]) { gr = g.createRadialGradient(x, 4, 2, x, 4, 110); gr.addColorStop(0, 'rgba(255,244,200,.5)'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.fillRect(x - 110, 0, 220, 120); }
  g.fillStyle = '#14110e'; g.fillRect(0, gb - 15, W, 15);
  g.font = '900 10px "Big Shoulders Display", "Arial Narrow", sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#ff6a2b';
  for (let x = -40 + (t * 10) % 120; x < W; x += 120) g.fillText('BAŞKA SAKARYA', x, gb - 7);
  gr = g.createLinearGradient(0, gb, 0, H); gr.addColorStop(0, '#1b6d36'); gr.addColorStop(1, '#2a9450');
  g.fillStyle = gr; g.fillRect(0, gb, W, H - gb);
  g.fillStyle = 'rgba(255,255,255,.035)';
  for (let i = 0; i < 6; i += 2) { const y0 = gb + (H - gb) * Math.pow(i / 6, 1.6), y1 = gb + (H - gb) * Math.pow((i + 1) / 6, 1.6); g.fillRect(0, y0, W, y1 - y0); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath();
  g.moveTo(0, gb); g.lineTo(W, gb); g.moveTo(gx - 26, gb); g.lineTo(gx - 70, gb + 46); g.lineTo(gx + gw + 70, gb + 46); g.lineTo(gx + gw + 26, gb);
  g.moveTo(18, gb); g.lineTo(-40, gb + 150); g.moveTo(W - 18, gb); g.lineTo(W + 40, gb + 150); g.stroke();
  // ağ: gol olunca vuruş noktasından dalgalanır
  g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(gx, gy, gw, gh);
  const off = (x, y) => { if (!net) return [x, y]; const d = Math.hypot(x - net.x, y - net.y), a = Math.exp(-d / 46) * Math.exp(-net.t * 2.4) * 12 * Math.cos(net.t * 15 - d / 9); return [x + (x - net.x) / (d + 1) * a * .3, y - a]; };
  g.strokeStyle = 'rgba(255,255,255,.17)'; g.lineWidth = 1; g.beginPath();
  for (let x = gx; x <= gx + gw + .1; x += 11) for (let y = gy, i = 0; y <= gb + .1; y += 11.5, i++) { const [px, py] = off(x, y); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  for (let y = gy; y <= gb + .1; y += 11.5) for (let x = gx, i = 0; x <= gx + gw + .1; x += 11, i++) { const [px, py] = off(x, y); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.stroke();
  g.strokeStyle = '#f6f6f6'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(gx, gb); g.lineTo(gx, gy); g.lineTo(gx + gw, gy); g.lineTo(gx + gw, gb); g.stroke();
}
function keeperD(g, x, base, col, lean, up = 0) {
  g.save(); g.translate(x, base - up); g.rotate(clamp(lean / 70, -1, 1) * 1.05);
  g.fillStyle = col; rr(g, -12, -44, 24, 36, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#e8c39e'; g.beginPath(); g.arc(0, -52, 8, 0, 7); g.fill();
  g.strokeStyle = col; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, -38); g.lineTo(-22, -60); g.moveTo(10, -38); g.lineTo(22, -60); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-22, -62, 5, 0, 7); g.arc(22, -62, 5, 0, 7); g.fill();
  g.fillStyle = '#1b1b1b'; g.fillRect(-10, -8, 8, 8); g.fillRect(2, -8, 8, 8);
  g.restore();
}
function figure(g, x, y, col, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.ellipse(0, 2, 14, 5, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
  g.fillStyle = '#1b1b1b'; g.fillRect(-8, -12, 6, 13); g.fillRect(2, -12, 6, 13);
  g.fillStyle = col; rr(g, -11, -40, 22, 30, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#e8c39e'; g.beginPath(); g.arc(0, -48, 8, 0, 7); g.fill();
  g.restore();
}

// ---------- şut / kafa / frikik / penaltı: kaydırarak vur ----------
// Yön = kaydırma yönü, yükseklik = kaydırma uzunluğu, sertlik = kaydırma hızı, falso = kaydırmanın kavisi
function shotGame(m, o) {
  const { gx, gy, gw, gh } = GOAL, gb = gy + gh, v = o.variant, crowd = mkCrowd(o), trail = [];
  const ball = { x: 180, y: 392 };
  let phase = v === 'kafa' ? 'cross' : 'aim', t = 0, tl = v === 'sut' ? 5 : 7, kx = 180, sw = null, sh = null, net = null, bp = null, bv = null;
  const tl0 = tl, ks = (1.3 + o.oppQ * 1.3) * o.hard, kAmp = v === 'penalti' ? 8 : 60;
  const defs = [];
  if (v === 'sut' && !o.bonus) for (let i = 0, n = o.oppQ > .55 ? 2 : 1; i < n; i++) defs.push({ x: rnd(100, 260), y: 292 - i * 26, vx: (Math.random() < .5 ? -1 : 1) * (48 + o.oppQ * 50) * o.hard });
  const wall = v === 'frikik' ? { x: 180 + rnd(-38, 38) - 40, w: 80, y: 270 } : null;
  const cr = v === 'kafa' ? { x0: Math.random() < .5 ? -10 : 370, T: rnd(1.2, 1.6) / o.hard, hx: 180, hy: 318 } : null;
  if (cr) { ball.x = cr.x0; ball.y = 250; }
  const sigma0 = (22 - o.skill * 15) * o.hard * (v === 'frikik' ? 1.5 : v === 'penalti' ? .6 : 1);
  const org = () => (cr ? { x: cr.hx, y: cr.hy } : ball);

  function aim(dx, dy, L) {
    const pw = L / 170, q = org();
    const ty = pw <= 1 ? gb - 6 - clamp((pw - .42) / .58, 0, 1) * (gh - 14) : gy + 8 - (pw - 1) * 190;
    return { tx: clamp(q.x + dx / Math.max(20, -dy) * (q.y - ty), 8, 352), ty, pw };
  }
  function curveOf(s) {
    const dx = s.x - s.x0, dy = s.y - s.y0, L = Math.hypot(dx, dy) || 1; let mx = 0;
    for (const [px, py] of s.pts) { const d = ((px - s.x0) * dy - (py - s.y0) * dx) / L; if (Math.abs(d) > Math.abs(mx)) mx = d; }
    return clamp(-mx * 1.8, -80, 80);
  }
  function posAt(p) {
    return { x: lerp(sh.from.x, sh.tx, p) + Math.sin(p * Math.PI) * sh.curve, y: lerp(sh.from.y, sh.ty, p) - Math.sin(p * Math.PI) * (12 + (gb - sh.ty) * .22), sy: lerp(Math.max(sh.from.y, 372), gb, p), r: 13 - 7.5 * p };
  }
  function end(res, b) {
    phase = 'end'; bp = { x: b.x, y: b.y, r: b.r || 6 }; bv = { x: 0, y: 0 };
    if (res === 'gol') { net = { x: sh.tx, y: sh.ty, t: 0 }; bv = { x: 0, y: 26 }; m.burst(sh.tx, sh.ty, 30, ['#fff', o.cu, '#ffd23f'], 200); m.shake(10); m.flash(.55); sfx.net(); sfx.goal(); }
    else if (res === 'kurtaris') { bv = { x: (b.x < kx ? -1 : 1) * 150, y: -60 }; m.burst(b.x, b.y, 12, ['#fff', '#ffd23f'], 130); m.shake(6); sfx.save(); sfx.ooh(); }
    else if (res === 'direk') { bv = { x: (b.x < 180 ? 1 : -1) * 90, y: 170 }; m.burst(b.x, b.y, 8, ['#fff'], 110); m.shake(8); sfx.post(); sfx.ooh(); }
    else if (res === 'blok' || res === 'baraj') { bv = { x: rnd(-60, 60), y: 150 }; m.burst(b.x, b.y, 8, ['#fff'], 100); m.shake(4); sfx.save(); }
    else if (res === 'aut') { bv = { x: (sh.tx - sh.from.x) * .8, y: -150 }; sfx.ooh(); }
    else sfx.ooh();
    m.finish({ out: res });
  }
  function release(s) {
    const dx = s.x - s.x0, dy = s.y - s.y0, L = Math.hypot(dx, dy), dur = Math.max(.04, t - s.t0);
    let q = 1;
    if (cr) { q = 1 - Math.abs(t - cr.T) / .24; if (q <= 0) return end('iska', { x: ball.x, y: ball.y, r: 10 }); }
    const a = aim(dx, dy, L), spN = clamp((L / dur - 250) / 900, 0, 1), weak = a.pw < .42;
    const sg = sigma0 * (1 + spN * .6) * (cr ? 1 + (1 - q) * 1.4 : 1);
    const tx = a.tx + randn() * sg, ty = Math.min(gb - 4, a.ty + randn() * sg * .55);
    const T = (weak ? .95 : .74 - .34 * spN) * (v === 'frikik' ? 1.3 : 1);
    const inG = tx > gx + 5 && tx < gx + gw - 5 && ty > gy + 5;
    const post = !inG && tx > gx - 6 && tx < gx + gw + 6 && ty > gy - 6 && (Math.abs(tx - gx) <= 6 || Math.abs(tx - gx - gw) <= 6 || Math.abs(ty - gy) <= 6);
    const k0 = kx; let kEnd, rd, res;
    if (v === 'penalti') {
      const real = tx < 150 ? -1 : tx > 210 ? 1 : 0, side = Math.random() < o.oppQ * .15 ? real : [-1, 0, 1][Math.floor(Math.random() * 3)];
      kEnd = 180 + side * 64; rd = .04;
      res = !inG ? (post ? 'direk' : 'aut') : Math.abs(tx - kEnd) < (ty < gy + 24 ? 22 : 30) * (weak ? 1.5 : 1) ? 'kurtaris' : 'gol';
    } else {
      rd = .10 + (1 - o.oppQ) * .16 + (cr ? .1 : 0);
      const mv = (230 + o.oppQ * 170) * (o.bonus ? .75 : 1) * Math.max(0, T - rd);
      kEnd = k0 + clamp(tx - k0, -mv, mv);
      let reach = 30 + o.oppQ * 12; if (ty < gy + 26) reach *= .72; if (weak) reach *= 1.3;
      res = !inG ? (post ? 'direk' : 'aut') : Math.abs(tx - kEnd) <= reach ? 'kurtaris' : 'gol';
    }
    sh = { from: { x: ball.x, y: ball.y }, tx, ty, T, curve: cr ? 0 : curveOf(s), p: 0, k0, kEnd, rd, hN: (gb - ty) / gh, res, slowed: false };
    phase = 'fly'; sfx.kick(); m.shake(3);
  }
  const kp = () => clamp((sh.p * sh.T - sh.rd) / Math.max(.05, sh.T - sh.rd), 0, 1);
  return {
    _s: { ball, org, kx: () => kx, defs, wall, cr, t: () => t, sigma0 },
    update(dt) {
      t += dt;
      for (const d of defs) { d.x += d.vx * dt; if (d.x < 80 || d.x > 280) { d.vx *= -1; d.x = clamp(d.x, 80, 280); } }
      if (phase === 'aim' || phase === 'cross') kx = 180 + Math.sin(t * ks) * kAmp;
      if (phase === 'aim') { tl -= dt; if (tl <= 0) end('gec', { x: ball.x, y: ball.y, r: 13 }); }
      else if (phase === 'cross') {
        const u = Math.min(t / cr.T, 1.3); ball.x = lerp(cr.x0, cr.hx, u); ball.y = lerp(250, cr.hy - 8, u) - Math.sin(Math.min(u, 1) * Math.PI) * 70;
        if (t > cr.T + .24) end('iska', { x: ball.x, y: ball.y, r: 10 });
      } else if (phase === 'fly') {
        const p0 = sh.p; sh.p += dt / sh.T; const b = posAt(Math.min(1, sh.p));
        pushTrail(trail, b.x, b.y, b.r);
        const cross = y => { const pb = (sh.from.y - y) / (sh.from.y - gb); return p0 < pb && sh.p >= pb; };
        for (const d of defs) if (cross(d.y) && Math.abs(b.x - d.x) < 15 && sh.hN < .7) return end('blok', b);
        if (wall && cross(wall.y) && b.x > wall.x && b.x < wall.x + wall.w && sh.hN < .6) return end('baraj', b);
        kx = lerp(sh.k0, sh.kEnd, kp());
        if (!sh.slowed && sh.p > .68 && sh.res !== 'aut') { sh.slowed = true; m.slowmo(.28, .34); }
        if (sh.p >= 1) end(sh.res, b);
      }
    },
    after(dt) { t += dt; if (net) net.t += dt; if (bp) { bp.x += bv.x * dt; bp.y += bv.y * dt; bv.x *= .96; if (net) bp.y = Math.min(bp.y, gb - 6); else bv.y += 220 * dt; } },
    down(x, y) { if (phase === 'aim' || phase === 'cross') sw = { x0: x, y0: y, x, y, t0: t, pts: [[x, y]] }; },
    move(x, y) { if (sw) { sw.x = x; sw.y = y; sw.pts.push([x, y]); } },
    up() { if (!sw) return; const s = sw; sw = null; if (phase !== 'aim' && phase !== 'cross') return; if (s.y - s.y0 > -28 || Math.hypot(s.x - s.x0, s.y - s.y0) < 36) return; release(s); },
    draw(g) {
      stadium(g, t, crowd, net);
      const lean = sh ? (sh.kEnd - sh.k0) * kp() : 0;
      keeperD(g, kx, gb, '#ffd23f', lean, sh && sh.ty < gy + 40 ? Math.min(22, Math.abs(lean) * .2 + sh.p * 14) : 0);
      for (const d of defs) figure(g, d.x, d.y, o.co, .82);
      if (wall) for (let i = 0; i < 4; i++) figure(g, wall.x + 10 + i * 20, wall.y, o.co, .86);
      // nişan önizlemesi: çizgi rengi sertliği gösterir (yeşil iyi, sarı zayıf, kırmızı üstten)
      if (sw && (phase === 'aim' || phase === 'cross')) {
        const dx = sw.x - sw.x0, dy = sw.y - sw.y0, L = Math.hypot(dx, dy);
        if (dy < -10 && L > 18) {
          const a = aim(dx, dy, L), q = org(), cv = cr ? 0 : curveOf(sw), col = a.pw > 1 ? '#ff4d4d' : a.pw < .42 ? '#ffd23f' : '#5dff9e';
          g.setLineDash([6, 7]); g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo((q.x + a.tx) / 2 + cv * 1.6, (q.y + a.ty) / 2, a.tx, a.ty); g.stroke(); g.setLineDash([]);
          g.beginPath(); g.arc(a.tx, a.ty, Math.max(7, sigma0), 0, 7); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
          g.beginPath(); g.arc(q.x, q.y, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(a.pw / 1.2, 0, 1)); g.strokeStyle = col; g.lineWidth = 4; g.stroke();
        }
      }
      if (cr) {
        if (phase === 'cross') { const u = clamp(t / cr.T, 0, 1); g.beginPath(); g.arc(cr.hx, cr.hy - 8, 12 + (1 - u) * 46, 0, 7); g.strokeStyle = Math.abs(t - cr.T) < .12 ? '#5dff9e' : 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.stroke(); }
        figure(g, cr.hx, cr.hy + 44 - (phase === 'fly' ? 6 : 0), o.cu, 1.05);
      } else figure(g, ball.x - 30, ball.y + 34, o.cu, 1.05);
      if (phase === 'fly') {
        const b = posAt(Math.min(1, sh.p));
        g.beginPath(); g.ellipse(b.x, b.sy, b.r * 1.1, b.r * .4, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
        trailD(g, trail); ballD(g, b.x, b.y, b.r);
      } else if (phase === 'end' && bp) ballD(g, bp.x, bp.y, bp.r);
      else {
        if (!cr) { g.beginPath(); g.ellipse(ball.x, ball.y + 11, 13, 4.5, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(); }
        ballD(g, ball.x, ball.y, cr ? lerp(7, 12, clamp(t / cr.T, 0, 1)) : 13);
      }
      if (phase === 'aim') { timer(g, tl / tl0); if (!sw && t > 1.2) text(g, 'Toptan yukarı kaydır', 180, 330, 14); }
    },
  };
}

// ---------- pas ----------
function passGame(m, o) {
  const me = { x: 180, y: 410 }, trail = [];
  const mates = [{ x: 70, y: 95, vx: 55 }, { x: 280, y: 200, vx: -45 }, { x: 120, y: 285, vx: 38 }];
  const sp = (0.75 + o.oppQ * 0.55) * o.hard;
  const defs = [{ x: 200, y: 150, vx: 80 * sp }, { x: 100, y: 245, vx: -95 * sp }, { x: 250, y: 340, vx: 70 * sp }];
  const ri = 13 + o.oppQ * 5 - o.skill * 3, rcv = 17 + o.skill * 5, vb = 300 + o.skill * 150;
  let ball = null, tl = 7, hold = null;
  const fire = (x, y) => { if (ball) return; const dx = x - me.x, dy = y - me.y, L = Math.hypot(dx, dy); if (L < 25) return; ball = { x: me.x, y: me.y, dx: dx / L, dy: dy / L, d: 0, len: L + 18 }; sfx.kick(); };
  const done = (out, x) => {
    if (out === 'ok') { m.burst(ball.x, ball.y, 12, ['#fff', '#5dff9e'], 120); sfx.up(); }
    else { m.shake(4); if (out === 'kesildi') sfx.save(); sfx.ooh(); }
    m.finish({ out, ...x });
  };
  return {
    update(dt) {
      for (const a of mates) { a.x += a.vx * dt; if (a.x < 35 || a.x > 325) { a.vx *= -1; a.x = clamp(a.x, 35, 325); } }
      for (const d of defs) {
        if (ball) { const dx = ball.x - d.x, dy = ball.y - d.y, L = Math.hypot(dx, dy) || 1, s = 75 * (0.5 + o.oppQ); d.x += dx / L * s * dt; d.y += dy / L * s * dt; }
        else { d.x += d.vx * dt; if (d.x < 30 || d.x > 330) { d.vx *= -1; d.x = clamp(d.x, 30, 330); } }
      }
      if (!ball) { tl -= dt; if (tl <= 0) done('kesildi'); return; }
      ball.x += ball.dx * vb * dt; ball.y += ball.dy * vb * dt; ball.d += vb * dt; pushTrail(trail, ball.x, ball.y, 6);
      for (const d of defs) if (hyp(d, ball) < ri) return done('kesildi');
      if (ball.d > 35) for (const a of mates) if (hyp(a, ball) < rcv) return done('ok', { adv: a.y < 160 });
      if (ball.d >= ball.len) done('bos');
    },
    down(x, y) { hold = { x, y }; },
    move(x, y) { if (hold) { hold.x = x; hold.y = y; } },
    up() { if (hold) { fire(hold.x, hold.y); hold = null; } },
    draw(g) {
      pitch(g);
      g.fillStyle = 'rgba(255,210,63,.12)'; g.fillRect(8, 8, W - 16, 150);
      head(g, 'İLERİ BÖLGE', 180, 26, 15, 'rgba(255,255,255,.55)');
      if (hold && !ball) { g.setLineDash([6, 7]); g.strokeStyle = '#5dff9e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(me.x, me.y); g.lineTo(hold.x, hold.y); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(hold.x, hold.y, 9, 0, 7); g.stroke(); }
      for (const a of mates) {
        const s = Math.sign(a.vx); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath();
        g.moveTo(a.x + s * 18, a.y); g.lineTo(a.x + s * 32, a.y); g.lineTo(a.x + s * 26, a.y - 5); g.moveTo(a.x + s * 32, a.y); g.lineTo(a.x + s * 26, a.y + 5); g.stroke();
        man(g, a.x, a.y, o.cu, true);
      }
      for (const d of defs) man(g, d.x, d.y, o.co);
      man(g, me.x, me.y, o.cu, true);
      if (ball) { trailD(g, trail); ballD(g, ball.x, ball.y); } else { ballD(g, me.x + 12, me.y - 10); timer(g, tl / 7); }
    },
  };
}

// ---------- çalım: savunmacılar işaret verip kayarak girer ----------
function dribGame(m, o) {
  const me = { x: 180, y: 425, vx: 0, vy: 0 }, sp = 128 + o.speed * 52, tr = 14 - o.skill * 3, trail = [];
  const defs = [330, 235, 140].map(y => { const x = rnd(70, 290); return { x, y, hx: x, hy: y, st: 'jog', tm: 0, cd: rnd(.8, 1.3), dx: 0, dy: 0 }; });
  const wind = .48 - o.oppQ * .16 + o.skill * .08, dashV = (290 + o.oppQ * 90) * o.hard, lr = 70 + o.oppQ * 18, jog = sp * (.42 + o.oppQ * .2) * o.hard, lead = .08 + o.oppQ * .1;
  let tl = 9, t = 0;
  const lose = () => { m.burst(me.x, me.y, 10, ['#fff', o.co], 120); m.shake(7); sfx.save(); sfx.ooh(); m.finish({ out: 'kaptirdi' }); };
  return {
    _s: { me, defs },
    update(dt) {
      t += dt; tl -= dt; if (tl <= 0) return lose();
      const ox = me.x, oy = me.y;
      if (m.hasP) { const dx = m.px - me.x, dy = m.py - me.y, L = Math.hypot(dx, dy); if (L > 3) { const s = Math.min(sp * dt, L); me.x += dx / L * s; me.y += dy / L * s; } }
      me.x = clamp(me.x, 14, 346); me.y = clamp(me.y, 40, 446);
      me.vx = (me.x - ox) / dt; me.vy = (me.y - oy) / dt;
      if (Math.abs(me.vx) + Math.abs(me.vy) > 20) pushTrail(trail, me.x, me.y + 4, 9, 7);
      for (const d of defs) {
        const dist = hyp(me, d), act = me.y > d.y - 30 && Math.abs(me.y - d.y) < 150;
        d.cd -= dt;
        if (d.st === 'jog') {
          const tx = act ? me.x : d.hx, ty = act ? me.y - 18 : d.hy, dx = tx - d.x, dy = ty - d.y, L = Math.hypot(dx, dy);
          if (L > 3 && !(act && dist < 34)) { const s = Math.min((act ? jog : jog * .6) * dt, L); d.x += dx / L * s; d.y += dy / L * s; }
          if (dist < tr - 3) return lose();
          if (act && dist < lr && d.cd <= 0) { const px = me.x + me.vx * (wind + lead) - d.x, py = me.y + me.vy * (wind + lead) - d.y, L2 = Math.hypot(px, py) || 1; d.dx = px / L2; d.dy = py / L2; d.st = 'wind'; d.tm = wind; }
        } else if (d.st === 'wind') {
          d.tm -= dt;
          if (d.tm <= 0) { d.st = 'dash'; d.tm = .34; sfx.swoosh(); }
        } else if (d.st === 'dash') {
          d.x += d.dx * dashV * dt; d.y += d.dy * dashV * dt; d.tm -= dt;
          if (dist < tr) return lose();
          if (d.tm <= 0) { d.st = 'down'; d.tm = .95; }
        } else { d.tm -= dt; if (d.tm <= 0) { d.st = 'jog'; d.cd = .5; } }
      }
      if (me.y < 58) { m.burst(me.x, me.y, 16, ['#fff', '#ffd23f', o.cu], 150); sfx.up(); m.finish({ out: 'gecti' }); }
    },
    draw(g) {
      pitch(g);
      g.fillStyle = 'rgba(255,210,63,.2)'; g.fillRect(8, 8, W - 16, 50);
      head(g, 'CEZA SAHASI', 180, 33, 18, 'rgba(255,255,255,.8)');
      for (const d of defs) {
        if (d.st === 'wind') { g.save(); g.translate(d.x, d.y); g.rotate(Math.atan2(d.dy, d.dx)); g.fillStyle = 'rgba(255,77,77,.3)'; g.fillRect(0, -tr, dashV * .34, tr * 2); g.restore(); g.beginPath(); g.arc(d.x, d.y, 15 + Math.sin(t * 40) * 3, 0, 7); g.strokeStyle = '#ff4d4d'; g.lineWidth = 3; g.stroke(); head(g, '!', d.x, d.y - 24, 22, '#ff4d4d'); man(g, d.x, d.y, o.co); }
        else if (d.st === 'dash') { g.save(); g.translate(d.x, d.y); g.rotate(Math.atan2(d.dy, d.dx)); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-34, -6, 26, 12); g.restore(); man(g, d.x, d.y, o.co, false, 1.25, .8); }
        else if (d.st === 'down') { g.globalAlpha = .55; man(g, d.x, d.y, o.co, false, 1.3, .6); g.globalAlpha = 1; }
        else man(g, d.x, d.y, o.co);
      }
      trailD(g, trail); man(g, me.x, me.y, o.cu, true); ballD(g, me.x + 9, me.y - 9, 5);
      timer(g, tl / 9);
    },
  };
}

// ---------- savunma ----------
function defGame(m, o) {
  const at = { x: rnd(90, 270), y: 45, vx: 0 }, me = { x: 180, y: 330 }, trail = [];
  const sa = (95 + o.oppQ * 45) * o.hard, sp = 112 + o.speed * 48, rc = 17 + o.skill * 8, turn = 3.5 + o.oppQ * 3.5;
  let zt = rnd(0, 6);
  return {
    _s: { me, at },
    update(dt) {
      zt += dt;
      if (m.hasP) { const dx = m.px - me.x, dy = m.py - me.y, L = Math.hypot(dx, dy); if (L > 3) { const s = Math.min(sp * dt, L); me.x += dx / L * s; me.y += dy / L * s; } }
      me.x = clamp(me.x, 14, 346); me.y = clamp(me.y, 30, 446);
      let want = Math.sin(zt * 1.7) * sa * 0.45;
      const dx = at.x - me.x, dy = me.y - at.y, near = dy > -10 && dy < 130 && Math.abs(dx) < 100;
      if (near) { want = (dx >= 0 ? 1 : -1) * sa * (1.05 + o.oppQ * 0.35); if (at.x < 50) want = Math.abs(want); if (at.x > 310) want = -Math.abs(want); }
      at.vx += (want - at.vx) * Math.min(1, turn * dt);
      at.x = clamp(at.x + at.vx * dt, 20, 340); at.y += sa * (near ? 1.1 : 0.9) * dt;
      pushTrail(trail, at.x, at.y, 9, 7);
      if (hyp(me, at) < rc) {
        const ok = me.y >= at.y - 14;
        m.burst(at.x, at.y, 12, ok ? ['#fff', '#5dff9e'] : ['#ffd23f', '#ff4d4d'], 130); m.shake(ok ? 5 : 8);
        if (ok) { sfx.save(); sfx.up(); } else sfx.whistle(1);
        return m.finish({ out: ok ? 'kapildi' : 'faul' });
      }
      if (at.y > 428) { sfx.ooh(); m.finish({ out: 'gecildi' }); }
    },
    draw(g) {
      pitch(g);
      g.fillStyle = 'rgba(255,77,77,.22)'; g.fillRect(8, 420, W - 16, 32);
      head(g, 'KALEN', 180, 437, 16, 'rgba(255,255,255,.8)');
      trailD(g, trail); man(g, at.x, at.y, o.co); ballD(g, at.x + 6, at.y + 12, 5);
      g.beginPath(); g.arc(me.x, me.y, rc, 0, 7); g.strokeStyle = 'rgba(255,210,63,.35)'; g.lineWidth = 1.5; g.stroke();
      man(g, me.x, me.y, o.cu, true);
    },
  };
}

// ---------- kurtarış ----------
function keepGame(m, o) {
  const { gx, gy, gw, gh } = GOAL, gb = gy + gh, glove = { x: 180, y: gy + 56 }, crowd = mkCrowd(o), trail = [];
  const T = clamp(0.54 - o.oppQ * 0.2, .3, .56) / o.hard, R = 20 + o.skill * 14, gs = 330 + o.skill * 260;
  const corner = Math.random() < .6;
  const tx = corner ? (Math.random() < .5 ? gx + rnd(14, 64) : gx + gw - rnd(14, 64)) : gx + rnd(40, gw - 40);
  const ty = gy + rnd(14, gh - 14);
  let wait = rnd(0.9, 2.1), phase = 'wait', fly = 0, t = 0, net = null, bp = null, bv = null;
  return {
    _s: { glove, tx, ty, fly: () => (phase === 'wait' ? -1 : fly), T },
    update(dt) {
      t += dt;
      if (m.hasP) {
        const px = clamp(m.px, gx - 8, gx + gw + 8), py = clamp(m.py, gy - 8, gb);
        const dx = px - glove.x, dy = py - glove.y, L = Math.hypot(dx, dy);
        if (L > 1) { const s = Math.min(gs * dt, L); glove.x += dx / L * s; glove.y += dy / L * s; }
      }
      if (phase === 'wait') { wait -= dt; if (wait <= 0) { phase = 'fly'; sfx.kick(); } }
      else if (phase === 'fly') {
        fly += dt / T; pushTrail(trail, lerp(180, tx, fly), lerp(396, ty, fly) - Math.sin(fly * Math.PI) * 14, 13 - 7 * fly);
        if (fly >= 1) {
          fly = 1; phase = 'end'; bp = { x: tx, y: ty, r: 6 };
          const ok = hyp(glove, { x: tx, y: ty }) <= R;
          if (ok) { bv = { x: (tx < 180 ? -1 : 1) * 150, y: -80 }; m.burst(tx, ty, 16, ['#fff', '#ffd23f'], 150); m.shake(8); sfx.save(); sfx.goal(); }
          else { net = { x: tx, y: ty, t: 0 }; bv = { x: 0, y: 26 }; m.shake(6); m.flash(.25); sfx.net(); sfx.conceded(); }
          m.finish({ out: ok ? 'kurtardi' : 'yedi' });
        }
      }
    },
    after(dt) { t += dt; if (net) net.t += dt; if (bp) { bp.x += bv.x * dt; bp.y += bv.y * dt; if (net) bp.y = Math.min(bp.y, gb - 6); } },
    draw(g) {
      stadium(g, t, crowd, net);
      keeperD(g, glove.x, gb, o.cu, (glove.x - 180) * .5, Math.max(0, gy + 56 - glove.y) * .5);
      g.beginPath(); g.arc(glove.x, glove.y, R, 0, 7); g.fillStyle = 'rgba(255,210,63,.2)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5; g.stroke();
      figure(g, 150 + (phase === 'wait' ? Math.sin(t * 9) * 2 : 8), 430, o.co, 1.05);
      if (phase === 'end' && bp) ballD(g, bp.x, bp.y, bp.r);
      else { trailD(g, trail); ballD(g, lerp(180, tx, fly), lerp(396, ty, fly) - Math.sin(fly * Math.PI) * 14, 13 - 7 * fly); }
      if (phase === 'wait') head(g, 'HAZIR OL', 180, 300, 22, 'rgba(255,255,255,.85)');
    },
  };
}

export const GAMES = {
  sut: (m, o) => shotGame(m, { ...o, variant: 'sut' }), kafa: (m, o) => shotGame(m, { ...o, variant: 'kafa' }),
  frikik: (m, o) => shotGame(m, { ...o, variant: 'frikik' }), penalti: (m, o) => shotGame(m, { ...o, variant: 'penalti' }),
  pas: passGame, calim: dribGame, savunma: defGame, kurtaris: keepGame,
};

export class Mini {
  constructor(cv) {
    this.cv = cv; this.g = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.px = W / 2; this.py = H / 2; this.hasP = false; this.game = null; this.res = null; this.started = false;
    this.p = []; this.sh = 0; this.slow = 1; this.slowT = 0; this.fl = 0; this.it = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* sentetik olay */ }
      [this.px, this.py] = pos(e); this.hasP = true;
      if (!this.game || this.res) return;
      if (!this.started) { this.started = true; sfx.whistle(1); return; }
      if (this.game.down) this.game.down(this.px, this.py);
    });
    cv.addEventListener('pointermove', e => { [this.px, this.py] = pos(e); if (this.game && this.started && !this.res && this.game.move) this.game.move(this.px, this.py); });
    const up = e => { [this.px, this.py] = pos(e); if (this.game && this.started && !this.res && this.game.up) this.game.up(this.px, this.py); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  burst(x, y, n, cols, spd = 170) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), s = rnd(.3, 1) * spd; this.p.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, l: rnd(.4, 1), c: cols[i % cols.length], r: rnd(1.5, 4) }); } }
  shake(v) { this.sh = Math.max(this.sh, v); }
  slowmo(f, d) { this.slow = f; this.slowT = d; }
  flash(a) { this.fl = a; }
  finish(r) { if (!this.res) { this.res = r; this.endT = 0; } }
  play(kind, o) {
    return new Promise(resolve => {
      this.res = null; this.started = false; this.hasP = false; this.endT = 0; this.kind = kind; this.p = []; this.sh = 0; this.slow = 1; this.slowT = 0; this.fl = 0; this.it = 0;
      this.game = GAMES[kind](this, o);
      let last = performance.now();
      // rAF arka planda durabilir; zamanlayıcı yedeği oyunun takılmasını önler.
      const next = f => { let done = false, ra = 0, to = 0; const run = () => { if (done) return; done = true; cancelAnimationFrame(ra); clearTimeout(to); f(performance.now()); }; ra = requestAnimationFrame(run); to = setTimeout(run, 60); };
      const loop = now => {
        const rdt = Math.min(0.033, (now - last) / 1000); last = now;
        if (this.slowT > 0) { this.slowT -= rdt; if (this.slowT <= 0) this.slow = 1; }
        const dt = rdt * this.slow, g = this.g;
        if (this.started && !this.res) this.game.update(dt); else if (this.res && this.game.after) this.game.after(dt);
        for (const q of this.p) { q.x += q.vx * rdt; q.y += q.vy * rdt; q.vy += 320 * rdt; q.l -= rdt; }
        this.p = this.p.filter(q => q.l > 0);
        g.save();
        if (this.sh > .3) { g.translate(rnd(-this.sh, this.sh), rnd(-this.sh, this.sh)); this.sh *= Math.exp(-9 * rdt); }
        this.game.draw(g);
        for (const q of this.p) { g.globalAlpha = clamp(q.l * 2, 0, 1); g.fillStyle = q.c; g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
        g.globalAlpha = 1; g.restore();
        if (this.fl > .01) { g.fillStyle = `rgba(255,255,255,${this.fl})`; g.fillRect(0, 0, W, H); this.fl *= Math.exp(-7 * rdt); }
        if (!this.started) { this.it += rdt; this.intro(); }
        if (this.res) {
          this.endT += rdt; if (this.endT > .4) this.banner(Math.min(1, (this.endT - .4) / .18));
          if (this.endT > 1.75) { const r = this.res; this.game = null; resolve(r); return; }
        }
        next(loop);
      };
      next(loop);
    });
  }
  intro() {
    const g = this.g, I = INTRO[this.kind], k = this.it, cx = W / 2, cy = 330, u = (k % 1.4) / 1.4;
    g.fillStyle = 'rgba(10,8,7,.78)'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(cx, 150); g.transform(1, 0, -.18, 1, 0, 0); g.fillStyle = '#ff6a2b'; g.fillRect(-124, -34, 248, 68); g.restore();
    head(g, I[0], cx, 152, 52, '#14110e');
    text(g, I[1], cx, 214, 16, '#f5efe4', 600); if (I[2]) text(g, I[2], cx, 238, 14, 'rgba(245,239,228,.7)', 500);
    // hareket ipucu: parmak animasyonu
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.setLineDash([5, 6]);
    if (I[3] === 'swipe') {
      const e = Math.min(1, u * 1.6);
      g.beginPath(); g.moveTo(cx, cy + 34); g.lineTo(cx + 16, cy - 40); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(cx + 16 * e, cy + 34 - 74 * e, 12, 0, 7); g.fillStyle = `rgba(255,210,63,${u > .65 ? 1 - (u - .65) / .35 : 1})`; g.fill();
    } else if (I[3] === 'tap') {
      g.setLineDash([]); g.beginPath(); g.arc(cx, cy, 12 + u * 22, 0, 7); g.strokeStyle = `rgba(255,210,63,${1 - u})`; g.stroke();
      g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fillStyle = '#ffd23f'; g.fill();
    } else {
      g.beginPath(); g.moveTo(cx - 50, cy + 20); g.quadraticCurveTo(cx, cy - 50, cx + 50, cy + 10); g.stroke(); g.setLineDash([]);
      const bx = (1 - u) * (1 - u) * (cx - 50) + 2 * (1 - u) * u * cx + u * u * (cx + 50), by = (1 - u) * (1 - u) * (cy + 20) + 2 * (1 - u) * u * (cy - 50) + u * u * (cy + 10);
      g.beginPath(); g.arc(bx, by, 12, 0, 7); g.fillStyle = '#ffd23f'; g.fill();
    }
    g.setLineDash([]);
    if (Math.sin(k * 5) > -.3) text(g, 'BAŞLAMAK İÇİN DOKUN', cx, 410, 13, '#ffd23f', 700);
  }
  banner(a) {
    const g = this.g, [txt, good] = OUT[this.res.out] || ['', 0], s = 1.5 - a * .5;
    g.save(); g.translate(W / 2, 232); g.transform(1, 0, -.18, 1, 0, 0); g.globalAlpha = a;
    g.fillStyle = good ? '#2fbf71' : '#d63b3b'; g.fillRect(-W / 2 - 30, -40, W + 60, 80);
    g.fillStyle = 'rgba(0,0,0,.16)'; for (let x = -W / 2; x < W / 2 + 30; x += 22) g.fillRect(x, -40, 8, 80);
    g.restore();
    g.save(); g.translate(W / 2, 234); g.scale(s, s); g.globalAlpha = a; head(g, txt, 0, 0, txt.length > 11 ? 38 : 56, '#fff'); g.restore();
  }
}
