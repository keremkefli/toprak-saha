// Toprak Saha — maç anı mini oyunları (canvas)
// Oyun arayüzü: update(dt), after(dt), draw(g), down/move/up(x,y). Sonuç m.finish({out,...}).
// Parametreler: skill 0-1, speed 0-1, oppQ 0-1 (rakip kalitesi), hard ~1 (yorgunluk/moral çarpanı), cu/co forma renkleri
import { tt } from './i18n.js';
import { sfx } from './sfx.js';

const W = 360, H = 460;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }

const OUT = {
  gol: [tt('GOL!'), 1], kurtaris: [tt('KALECİ ÇIKARDI'), 0], direk: [tt('DİREK!'), 0], aut: [tt('DIŞARI'), 0], baraj: [tt('BARAJDA'), 0], blok: [tt('SAVUNMADA'), 0], gec: [tt('GEÇ KALDIN'), 0], iska: [tt('ISKA'), 0],
  ok: [tt('PAS YERİNDE'), 1], kesildi: [tt('ARAYA GİRDİLER'), 0], bos: [tt('PAS BOŞA'), 0],
  gecti: [tt('GEÇTİN!'), 1], kaptirdi: [tt('TOPU KAPTIRDIN'), 0],
  kapildi: [tt('TOPU KAPTIN'), 1], gecildi: [tt('RAKİP GEÇTİ'), 0], faul: [tt('FAUL'), 0],
  kurtardi: [tt('KURTARDIN!'), 1], yedi: [tt('GOL OLDU'), 0],
  kacti: [tt('ARKAYA SARKTIN!'), 1], ofsayt: [tt('OFSAYT'), 0],
};
// [başlık, ipucu 1, ipucu 2, hareket animasyonu]
export const INTRO = {
  sut: [tt('ŞUT'), tt('Kaleye doğru kaydır. Hızlı kaydır: sert.'), tt('Sol alttaki topta vuruş noktasını seç.'), 'swipe'],
  kafa: [tt('KAFA'), tt('Top başına geldiği an kaydır.'), tt('Halka kapanınca vur.'), 'swipe'],
  vole: [tt('VOLE'), tt('Top yere inmeden kaydır.'), tt('Halka kapanınca vur. Sert gider.'), 'swipe'],
  rovesata: [tt('RÖVEŞATA'), tt('Tam anında kaydır.'), tt('Zor ama tutarsa stat yıkılır.'), 'swipe'],
  orta: [tt('ORTA'), tt('Koşan arkadaşının varacağı yere dokun.'), tt('Kaleciye yakın atma.'), 'tap'],
  korner: [tt('KORNER'), tt('Ceza sahasında bir nokta seç.'), tt('Koşuyu önceden gör.'), 'tap'],
  frikik: [tt('FRİKİK'), tt('Topun yanına vur: falso alır.'), tt('Uçarken parmağını kaydır: top döner.'), 'swipe'],
  penalti: [tt('PENALTI'), tt('Köşene doğru kaydır.'), '', 'swipe'],
  pas: [tt('PAS'), tt('Koşan arkadaşının önüne dokun.'), tt('Araya girmesinler.'), 'tap'],
  calim: [tt('ÇALIM'), tt('Soldaki analogla koş.'), tt('Kırmızı hattan çık. ÇALIM: ani sıçrama.'), 'drag'],
  savunma: [tt('SAVUNMA'), tt('Soldaki analogla önünü kes.'), tt('Halka yeşilken KAY tuşuna bas.'), 'drag'],
  kurtaris: [tt('KURTARIŞ'), tt('Eldiveni topa yetiştir.'), '', 'drag'],
  duvar: [tt('FRİKİK'), tt('Top barajı aşınca eldiveni yetiştir.'), tt('Kurduğun baraj vuruşun yönünü belirler.'), 'drag'],
  penkurtar: [tt('PENALTI'), tt('Vuruş anını bekle, köşeyi tahmin et.'), tt('Erken oynarsan boş köşe kalır.'), 'drag'],
  kosu: [tt('KOŞU'), tt('Pas çıktıktan sonra, imleç yeşile girince dokun.'), tt('Erken koşarsan ofsayt, geç kalırsan top kaçar.'), 'tap'],
  cikis: [tt('YAN TOP'), tt('Top geldiğinde, imleç yeşile girince dokun.'), tt('Erken çıkarsan kale boş kalır.'), 'tap'],
  ribaund: [tt('DÖNEN TOP'), tt('Savunmadan önce topa dokun.'), tt('Ne kadar çabuk, o kadar net.'), 'tap'],
  markaj: [tt('MARKAJ'), tt('Soldaki analogla adamının dibinde kal.'), tt('Halka yeşilken süre sayılır. PRES: kısa hamle.'), 'drag'],
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

// ---------- şut / kafa / frikik / penaltı ----------
// Yön = kaydırma yönü. Sertlik = kaydırma hızı. Yükseklik ve falso = topa vurduğun nokta (sol alttaki top).
// Uçuş sırasında parmağı sağa sola kaydırmak topa ek falso verir. 'sut' anında top koşu hâlindedir.
function shotGame(m, o) {
  const { gx, gy, gw, gh } = GOAL, gb = gy + gh, v = o.variant, pk = o.pk || {}, crowd = mkCrowd(o), trail = [], V = o.vr || {};   // V: maça özel çeşitleme (t süre, sp rakip hızı, acc isabet, n fazladan savunmacı, side dar açı)
  const run = v === 'sut';
  // havadan gelen toplar: win zamanlama payı, hy vuruş yüksekliği, sg isabet çarpanı, hN topun gideceği yükseklik
  const AIR = { kafa: { win: pk.hava ? .34 : .24, hy: 318, sg: 1.5, hN: .1, rd: 0 }, vole: { win: .2, hy: 352, sg: 1.55, hN: .02, rd: .02 }, rovesata: { win: .13, hy: 330, sg: 2.1, hN: .4, rd: .08 } }[v];
  const ball = { x: 180 + (run ? (V.side ? (Math.random() < .5 ? -1 : 1) * rnd(96, 122) : rnd(-46, 46)) : 0), y: run ? 428 : 392 };
  const hit = { x: 0, y: .25 };                 // vuruş noktası: y -1 topun üstü (yerden) … +1 topun altı (havadan), x yan (falso)
  const HW = { x: 46, y: 412, r: 30 };          // vuruş noktası göstergesi
  let phase = AIR ? 'cross' : 'aim', t = 0, tl = (run ? 4.6 : 7) * (V.t || 1), kx = 180, sw = null, sh = null, net = null, bp = null, bv = null, hold = false, lastX = null;
  const tl0 = tl, ks = (1.1 + o.oppQ * 1.1) * o.hard * (V.sp || 1), kAmp = v === 'penalti' ? 8 : 56;
  const defs = [];
  if (run && !o.bonus && !(V.n < 0) && (o.oppQ > .4 || V.n > 0)) defs.push({ x: rnd(100, 260), y: 258, vx: (Math.random() < .5 ? -1 : 1) * (44 + o.oppQ * 46) * o.hard });
  if (run && !o.bonus && V.n > 0) defs.push({ x: rnd(90, 270), y: 300, vx: (Math.random() < .5 ? -1 : 1) * (38 + o.oppQ * 40) * o.hard });
  const wall = v === 'frikik' ? { x: 180 + rnd(-38, 38) - (pk.frikik ? 32 : 40), w: pk.frikik ? 64 : 80, y: 270 } : null;
  const cr = AIR ? { x0: Math.random() < .5 ? -10 : 370, T: rnd(1.2, 1.6) / o.hard, hx: 180, hy: AIR.hy, win: AIR.win } : null;
  if (cr) { ball.x = cr.x0; ball.y = 250; }
  const sigma0 = (20 - o.skill * 14) * o.hard * (v === 'frikik' ? (pk.frikik ? 1.05 : 1.45) : v === 'penalti' ? .6 : 1) * (pk.plase ? .8 : 1) * (V.acc || 1);
  const org = () => (cr ? { x: cr.hx, y: cr.hy } : ball);
  const far = () => clamp((org().y - gb) / 208, .5, 1.2);            // kaleye uzaklık (1 = başlangıç mesafesi)
  const rush = () => (run ? clamp((428 - ball.y) / 110, 0, 1) : 0);   // kalecinin açı kapatması
  const spOf = (L, dur) => clamp((L / Math.max(.04, dur) - 300) / 1000, 0, 1);
  const kind = spN => (spN < .35 && hit.y > .55 ? 'AŞIRTMA' : spN < .4 ? 'PLASE' : spN > .7 ? tt('SERT ŞUT') : tt('ŞUT'));

  function aim(dx, dy, spN) {
    const q = org(), hy = cr ? AIR.hN : hit.y;
    const hN = clamp(.1 + (hy + 1) / 2 * .78 + spN * (hy > .3 ? .2 : .06), .04, 1.3);   // 1'in üstü: üstten dışarı
    const ty = gb - 4 - hN * (gh - 4);
    return { tx: clamp(q.x + dx / Math.max(20, -dy) * (q.y - ty), 8, 352), ty, hN };
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
    const dx = s.x - s.x0, dy = s.y - s.y0, L = Math.hypot(dx, dy), spN = spOf(L, t - s.t0);
    let q = 1;
    if (cr) { q = 1 - Math.abs(t - cr.T) / cr.win; if (q <= 0) return end('iska', { x: ball.x, y: ball.y, r: 10 }); }
    const a = aim(dx, dy, spN), kd = kind(spN);
    const sg = sigma0 * (.75 + spN * .75) * (.7 + far() * .5) * (kd === 'PLASE' ? .75 : 1) * (cr ? AIR.sg + (1 - q) * 1.6 : 1);
    const tx = a.tx + randn() * sg, ty = a.ty + randn() * sg * .5;
    const side = tx < 150 ? -1 : tx > 210 ? 1 : 0;
    sh = { from: { x: ball.x, y: ball.y }, tx, ty, T: Math.max(cr ? .46 : .3, (.8 - .36 * spN) * clamp(far(), .6, 1.1) * (v === 'frikik' ? 1.2 : 1)), curve: cr ? 0 : -hit.x * 60, p: 0, el: 0, slowed: false, shift: 0,
      rd: v === 'penalti' ? .04 : cr ? .1 + AIR.rd + (1 - o.oppQ) * .12 : .16 + (1 - o.oppQ) * .18, vk: (165 + o.oppQ * 150) * (o.bonus ? .75 : 1) * (cr ? 1.1 : 1), chip: kd === 'AŞIRTMA', rush: rush(),
      pen: v === 'penalti' ? 180 + (Math.random() < o.oppQ * .15 * (pk.buz ? .3 : 1) ? side : [-1, 0, 1][Math.floor(Math.random() * 3)]) * 64 : null };
    phase = 'fly'; lastX = null; sfx.kick(); m.shake(3);
  }
  function arrive(b) {
    const { tx, ty } = sh, hN = (gb - ty) / gh;
    const inG = tx > gx + 5 && tx < gx + gw - 5 && ty > gy + 5 && ty <= gb;
    const post = !inG && tx > gx - 6 && tx < gx + gw + 6 && ty > gy - 6 && (Math.abs(tx - gx) <= 6 || Math.abs(tx - gx - gw) <= 6 || Math.abs(ty - gy) <= 6);
    if (!inG) return end(post ? 'direk' : 'aut', b);
    let reach = v === 'penalti' ? (hN > .72 ? 22 : 30) : (26 + o.oppQ * 10) * (hN > .72 ? .72 : 1) * (1 + sh.rush * .3);
    if (sh.chip && sh.rush > .45) reach *= .45;     // öne çıkmış kalecinin üstünden
    end(Math.abs(tx - kx) <= reach ? 'kurtaris' : 'gol', b);
  }
  const setHit = (x, y) => { let hx = (x - HW.x) / (HW.r * .8), hy = (y - HW.y) / (HW.r * .8); const L = Math.hypot(hx, hy); if (L > 1) { hx /= L; hy /= L; } hit.x = hx; hit.y = hy; };
  return {
    _s: { ball, org, hit, aim, kx: () => kx, defs, wall, cr, t: () => t, sigma0, phase: () => phase },
    update(dt) {
      t += dt;
      for (const d of defs) { d.x += d.vx * dt; if (d.x < 80 || d.x > 280) { d.vx *= -1; d.x = clamp(d.x, 80, 280); } }
      if (phase === 'aim' || phase === 'cross') kx = 180 + Math.sin(t * ks) * kAmp;
      if (phase === 'aim') {
        tl -= dt;
        if (run) { ball.y -= 26 * dt; ball.x = clamp(ball.x + Math.sin(t * 1.3) * 14 * dt, 60, 300); }
        if (tl <= 0) end('gec', { x: ball.x, y: ball.y, r: 13 });
      } else if (phase === 'cross') {
        const u = Math.min(t / cr.T, 1.3); ball.x = lerp(cr.x0, cr.hx, u); ball.y = lerp(250, cr.hy - 8, u) - Math.sin(Math.min(u, 1) * Math.PI) * 70;
        if (t > cr.T + cr.win) end('iska', { x: ball.x, y: ball.y, r: 10 });
      } else if (phase === 'fly') {
        const p0 = sh.p; sh.p += dt / sh.T; sh.el += dt; const b = posAt(Math.min(1, sh.p));
        pushTrail(trail, b.x, b.y, b.r);
        const cross = y => { const pb = (sh.from.y - y) / (sh.from.y - gb); return p0 < pb && sh.p >= pb; }, hN = (gb - sh.ty) / gh;
        for (const d of defs) if (cross(d.y) && Math.abs(b.x - d.x) < 15 && hN < .7) return end('blok', b);
        if (wall && cross(wall.y) && b.x > wall.x && b.x < wall.x + wall.w && hN < .6) return end('baraj', b);
        if (sh.el > sh.rd) { const goal = sh.pen != null ? sh.pen : sh.tx, sp = sh.pen != null ? 330 : sh.vk; kx += clamp(goal - kx, -sp * dt, sp * dt); }
        if (!sh.slowed && sh.p > .68) { sh.slowed = true; m.slowmo(.28, .34); }
        if (sh.p >= 1) arrive(b);
      }
    },
    after(dt) { t += dt; if (net) net.t += dt; if (bp) { bp.x += bv.x * dt; bp.y += bv.y * dt; bv.x *= .96; if (net) bp.y = Math.min(bp.y, gb - 6); else bv.y += 220 * dt; } },
    down(x, y) {
      if (phase === 'fly') { lastX = x; return; }
      if (phase !== 'aim' && phase !== 'cross') return;
      if (!cr && Math.hypot(x - HW.x, y - HW.y) < HW.r + 8) { hold = true; setHit(x, y); return; }
      sw = { x0: x, y0: y, x, y, t0: t };
    },
    move(x, y) {
      if (phase === 'fly') { // havada falso: parmağı yana kaydır
        if (lastX != null && sh.pen == null) { const d = clamp((x - lastX) * .45, -42 - sh.shift, 42 - sh.shift); sh.shift += d; sh.tx += d; sh.curve += d * .6; }
        lastX = x; return;
      }
      if (hold) setHit(x, y); else if (sw) { sw.x = x; sw.y = y; }
    },
    up() {
      if (hold) { hold = false; return; }
      if (!sw) return; const s = sw; sw = null;
      if (phase !== 'aim' && phase !== 'cross') return;
      if (s.y - s.y0 > -28 || Math.hypot(s.x - s.x0, s.y - s.y0) < 36) return;
      release(s);
    },
    draw(g) {
      stadium(g, t, crowd, net);
      const lean = sh ? clamp(kx - 180, -70, 70) * (phase === 'aim' ? 0 : 1) : 0, out = phase === 'aim' ? rush() : sh ? sh.rush : 0;
      g.save(); g.translate(kx, gb + out * 26); g.scale(1 + out * .28, 1 + out * .28); g.translate(-kx, -gb);
      keeperD(g, kx, gb, '#ffd23f', sh && sh.el > sh.rd ? lean : 0, sh && sh.ty < gy + 40 ? Math.min(22, sh.p * 20) : 0); g.restore();
      for (const d of defs) figure(g, d.x, d.y, o.co, .82);
      if (wall) for (let i = 0; i < Math.round(wall.w / 20); i++) figure(g, wall.x + 10 + i * 20, wall.y, o.co, .86);
      if (sw && (phase === 'aim' || phase === 'cross')) {
        const dx = sw.x - sw.x0, dy = sw.y - sw.y0, L = Math.hypot(dx, dy);
        if (dy < -10 && L > 18) {
          const spN = spOf(L, t - sw.t0), a = aim(dx, dy, spN), q = org(), col = a.hN > 1 ? '#ff4d4d' : '#5dff9e';
          g.setLineDash([6, 7]); g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo((q.x + a.tx) / 2 - (cr ? 0 : hit.x * 96), (q.y + a.ty) / 2, a.tx, a.ty); g.stroke(); g.setLineDash([]);
          g.beginPath(); g.arc(a.tx, a.ty, Math.max(7, sigma0), 0, 7); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
          head(g, tt(kind(spN)), q.x, q.y - 34, 15, col);
        }
      }
      if (cr) {
        if (phase === 'cross') { const u = clamp(t / cr.T, 0, 1); g.beginPath(); g.arc(cr.hx, cr.hy - 8, 12 + (1 - u) * 46, 0, 7); g.strokeStyle = Math.abs(t - cr.T) < cr.win / 2 ? '#5dff9e' : 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.stroke(); }
        if (v === 'rovesata' && phase !== 'cross') { g.save(); g.translate(cr.hx, cr.hy + 14); g.rotate(Math.PI * .95); figure(g, 0, 22, o.cu, 1.05); g.restore(); }   // havada ters
        else figure(g, cr.hx, cr.hy + 44 - (phase === 'fly' ? 6 : 0), o.cu, 1.05);
      } else {
        if (run && phase === 'aim') figure(g, ball.x + 34, ball.y + 62 - (1 - tl / tl0) * 40, o.co, 1);   // arkadan yetişen savunmacı
        figure(g, ball.x - 26, ball.y + 34, o.cu, 1.05);
      }
      if (phase === 'fly') {
        const b = posAt(Math.min(1, sh.p));
        g.beginPath(); g.ellipse(b.x, b.sy, b.r * 1.1, b.r * .4, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
        trailD(g, trail); ballD(g, b.x, b.y, b.r);
        if (sh.pen == null && sh.p < .8) text(g, tt('◄ falso ►'), 180, 440, 13, 'rgba(255,255,255,.75)');
      } else if (phase === 'end' && bp) ballD(g, bp.x, bp.y, bp.r);
      else {
        if (!cr) { g.beginPath(); g.ellipse(ball.x, ball.y + 11, 13, 4.5, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(); }
        ballD(g, ball.x, ball.y, cr ? lerp(7, 12, clamp(t / cr.T, 0, 1)) : 13);
      }
      if (!cr && (phase === 'aim')) {   // vuruş noktası göstergesi
        g.fillStyle = 'rgba(10,8,7,.6)'; rr(g, HW.x - 40, HW.y - 52, 80, 92, 8); g.fill();
        text(g, tt('VURUŞ'), HW.x, HW.y - 41, 10, 'rgba(255,255,255,.7)', 700);
        ballD(g, HW.x, HW.y, HW.r);
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(HW.x - HW.r, HW.y); g.lineTo(HW.x + HW.r, HW.y); g.moveTo(HW.x, HW.y - HW.r); g.lineTo(HW.x, HW.y + HW.r); g.stroke();
        g.beginPath(); g.arc(HW.x + hit.x * HW.r * .8, HW.y + hit.y * HW.r * .8, 7, 0, 7); g.fillStyle = '#ff4d4d'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      }
      if (phase === 'aim') { timer(g, tl / tl0); if (!sw && !hold && t > 1.4 && !run) text(g, tt('Kaleye doğru kaydır'), 180, 330, 14); }
    },
  };
}

// ---------- pas ----------
function passGame(m, o) {
  const me = { x: 180, y: 410 }, trail = [];
  const mates = [{ x: 70, y: 95, vx: 55 }, { x: 280, y: 200, vx: -45 }, { x: 120, y: 285, vx: 38 }];
  const V = o.vr || {}, sp = (0.75 + o.oppQ * 0.55) * o.hard * (V.sp || 1);
  const defs = [{ x: 200, y: 150, vx: 80 * sp }, { x: 100, y: 245, vx: -95 * sp }, { x: 250, y: 340, vx: 70 * sp }];
  if (V.n > 0) defs.push({ x: 150, y: 195, vx: -86 * sp }); else if (V.n < 0) defs.pop();
  const ri = 13 + o.oppQ * 5 - o.skill * 3, rcv = 17 + o.skill * 5 + ((o.pk || {}).gorus ? 5 : 0), vb = 300 + o.skill * 150;
  let ball = null, tl = 7 * (V.t || 1), hold = null;
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
      head(g, tt('İLERİ BÖLGE'), 180, 26, 15, 'rgba(255,255,255,.55)');
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

// ---------- çalım: analogla koş; savunmacılar işaret verip kayar; ÇALIM tuşu ani sıçrama ----------
function dribGame(m, o) {
  const me = { x: 180, y: 425, vx: 0, vy: 0, fx: 0, fy: -1 }, sp = 128 + o.speed * 52, tr = 14 - o.skill * 3, trail = [];
  const V = o.vr || {};
  const defs = (V.n > 0 ? [345, 270, 195, 120] : V.n < 0 ? [300, 170] : [330, 235, 140]).map(y => { const x = rnd(70, 290); return { x, y, hx: x, hy: y, st: 'jog', tm: 0, cd: rnd(.8, 1.3), dx: 0, dy: 0 }; });
  const wind = .48 - o.oppQ * .16 + o.skill * .08 + ((o.pk || {}).bilek ? .09 : 0), dashV = (290 + o.oppQ * 90) * o.hard * (V.sp || 1), lr = 70 + o.oppQ * 18, jog = sp * (.42 + o.oppQ * .2) * o.hard * (V.sp || 1), lead = .08 + o.oppQ * .1;
  let tl = 9 * (V.t || 1), t = 0, dash = 0, dcd = 0;
  const lose = () => { m.burst(me.x, me.y, 10, ['#fff', o.co], 120); m.shake(7); sfx.save(); sfx.ooh(); m.finish({ out: 'kaptirdi' }); };
  return {
    _s: { me, defs },
    act() { if (dcd > 0) return; dash = .16; dcd = 1.1; sfx.swoosh(); m.burst(me.x, me.y + 6, 6, ['#fff'], 60); },
    update(dt) {
      t += dt; tl -= dt; if (tl <= 0) return lose(); dcd -= dt;
      const L = Math.hypot(m.sx, m.sy);
      if (L > .15) { me.fx = m.sx / L; me.fy = m.sy / L; }
      const wx = dash > 0 ? me.fx * sp * 2.3 : m.sx * sp, wy = dash > 0 ? me.fy * sp * 2.3 : m.sy * sp, a = Math.min(1, 14 * dt);
      if (dash > 0) dash -= dt;
      me.vx += (wx - me.vx) * a; me.vy += (wy - me.vy) * a;   // yumuşak hızlanma
      me.x = clamp(me.x + me.vx * dt, 14, 346); me.y = clamp(me.y + me.vy * dt, 40, 446);
      if (Math.abs(me.vx) + Math.abs(me.vy) > 20) pushTrail(trail, me.x, me.y + 4, 9, 7);
      for (const d of defs) {
        const dist = hyp(me, d), act = me.y > d.y - 30 && Math.abs(me.y - d.y) < 150;
        d.cd -= dt;
        if (d.st === 'jog') {
          const tx = act ? me.x : d.hx, ty = act ? me.y - 18 : d.hy, dx = tx - d.x, dy = ty - d.y, D = Math.hypot(dx, dy);
          if (D > 3 && !(act && dist < 34)) { const s = Math.min((act ? jog : jog * .6) * dt, D); d.x += dx / D * s; d.y += dy / D * s; }
          if (dist < tr - 3) return lose();
          if (act && dist < lr && d.cd <= 0) { const px = me.x + me.vx * (wind + lead) - d.x, py = me.y + me.vy * (wind + lead) - d.y, L2 = Math.hypot(px, py) || 1; d.dx = px / L2; d.dy = py / L2; d.st = 'wind'; d.tm = wind; }
        } else if (d.st === 'wind') { d.tm -= dt; if (d.tm <= 0) { d.st = 'dash'; d.tm = .34; sfx.swoosh(); } }
        else if (d.st === 'dash') { d.x += d.dx * dashV * dt; d.y += d.dy * dashV * dt; d.tm -= dt; if (dist < tr) return lose(); if (d.tm <= 0) { d.st = 'down'; d.tm = .95; } }
        else { d.tm -= dt; if (d.tm <= 0) { d.st = 'jog'; d.cd = .5; } }
      }
      if (me.y < 58) { m.burst(me.x, me.y, 16, ['#fff', '#ffd23f', o.cu], 150); sfx.up(); m.finish({ out: 'gecti' }); }
    },
    draw(g) {
      pitch(g);
      g.fillStyle = 'rgba(255,210,63,.2)'; g.fillRect(8, 8, W - 16, 50);
      head(g, tt('CEZA SAHASI'), 180, 33, 18, 'rgba(255,255,255,.8)');
      for (const d of defs) {
        if (d.st === 'wind') { g.save(); g.translate(d.x, d.y); g.rotate(Math.atan2(d.dy, d.dx)); g.fillStyle = 'rgba(255,77,77,.3)'; g.fillRect(0, -tr, dashV * .34, tr * 2); g.restore(); g.beginPath(); g.arc(d.x, d.y, 15 + Math.sin(t * 40) * 3, 0, 7); g.strokeStyle = '#ff4d4d'; g.lineWidth = 3; g.stroke(); head(g, '!', d.x, d.y - 24, 22, '#ff4d4d'); man(g, d.x, d.y, o.co); }
        else if (d.st === 'dash') { g.save(); g.translate(d.x, d.y); g.rotate(Math.atan2(d.dy, d.dx)); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-34, -6, 26, 12); g.restore(); man(g, d.x, d.y, o.co, false, 1.25, .8); }
        else if (d.st === 'down') { g.globalAlpha = .55; man(g, d.x, d.y, o.co, false, 1.3, .6); g.globalAlpha = 1; }
        else man(g, d.x, d.y, o.co);
      }
      trailD(g, trail);
      g.beginPath(); g.moveTo(me.x + me.fx * 26, me.y + me.fy * 26); g.lineTo(me.x + me.fx * 17 - me.fy * 6, me.y + me.fy * 17 + me.fx * 6); g.lineTo(me.x + me.fx * 17 + me.fy * 6, me.y + me.fy * 17 - me.fx * 6); g.closePath(); g.fillStyle = dcd > 0 ? 'rgba(255,255,255,.35)' : '#ffd23f'; g.fill();   // yön oku: sarıysa ÇALIM hazır
      man(g, me.x, me.y, o.cu, true, dash > 0 ? 1.2 : 1, dash > 0 ? .85 : 1); ballD(g, me.x + me.fx * 11, me.y + me.fy * 11, 5);
      timer(g, tl / 9);
    },
  };
}

// ---------- savunma: analogla önünü kes, KAY tuşuyla kayarak gir ----------
function defGame(m, o) {
  const pk = o.pk || {}, at = { x: rnd(90, 270), y: 45, vx: 0 }, me = { x: 180, y: 318, vx: 0, vy: 0, st: 'run', tm: 0, dx: 0, dy: -1 }, trail = [];
  const sa = (92 + o.oppQ * 42) * o.hard * ((o.vr || {}).sp || 1), sp = 118 + o.speed * 48, rc = 11 + o.skill * 6, turn = 3.5 + o.oppQ * 3;
  const slideV = 330, slideT = pk.makas ? .36 : .3, react = .215 - o.oppQ * .13;
  let zt = rnd(0, 6), seen = 0;
  const ballP = () => ({ x: at.x + at.vx * .04, y: at.y + 13 });
  const done = (out, ok) => { m.burst(at.x, at.y, 12, ok ? ['#fff', '#5dff9e'] : ['#ffd23f', '#ff4d4d'], 130); m.shake(ok ? 6 : 8); if (ok) { sfx.save(); sfx.up(); } else sfx.whistle(1); m.finish({ out }); };
  return {
    _s: { me, at, ballP },
    act() {   // topa doğru kay
      if (me.st !== 'run') return;
      const b = ballP(), px = b.x + at.vx * .12 - me.x, py = b.y + sa * .11 - me.y, L = Math.hypot(px, py) || 1;
      me.dx = px / L; me.dy = py / L; me.st = 'slide'; me.tm = slideT; seen = 0; sfx.swoosh();
    },
    update(dt) {
      zt += dt;
      if (me.st === 'run') { const a = Math.min(1, 14 * dt); me.vx += (m.sx * sp - me.vx) * a; me.vy += (m.sy * sp - me.vy) * a; me.x += me.vx * dt; me.y += me.vy * dt; }
      else if (me.st === 'slide') { me.x += me.dx * slideV * dt; me.y += me.dy * slideV * dt; me.tm -= dt; seen += dt; pushTrail(trail, me.x, me.y, 10, 7); if (me.tm <= 0) { me.st = 'down'; me.tm = .8; me.vx = me.vy = 0; } }
      else { me.tm -= dt; if (me.tm <= 0) me.st = 'run'; }
      me.x = clamp(me.x, 14, 346); me.y = clamp(me.y, 30, 446);
      const dx = at.x - me.x, dy = me.y - at.y, near = dy > -10 && dy < 120 && Math.abs(dx) < 90;
      let want = Math.sin(zt * 1.7) * sa * .45;
      if (me.st === 'slide') { if (seen >= react) want = ((at.x - (me.x + me.dx * 40)) >= 0 ? 1 : -1) * sa * 2.4; }   // kaymayı görünce yana kaçar
      else if (near && me.st === 'run') { want = (dx >= 0 ? 1 : -1) * sa * .8; if (at.x < 50) want = Math.abs(want); if (at.x > 310) want = -Math.abs(want); }
      at.vx += (want - at.vx) * Math.min(1, turn * (me.st === 'slide' ? 2.5 : 1) * dt);
      at.x = clamp(at.x + at.vx * dt, 20, 340); at.y += sa * (near && me.st === 'run' ? .72 : .95) * dt;   // önü kesilince yavaşlar
      if (me.st === 'slide') {
        if (hyp(me, ballP()) < rc) return done('kapildi', true);
        if (hyp(me, at) < 12) return done('faul', false);
      } else if (me.st === 'run' && hyp(me, at) < 13) at.vx += (dx >= 0 ? 1 : -1) * 260 * dt * 8;   // omuz omuza: yana iter
      if (at.y > 428) { sfx.ooh(); m.finish({ out: 'gecildi' }); }
    },
    draw(g) {
      pitch(g);
      g.fillStyle = 'rgba(255,77,77,.22)'; g.fillRect(8, 420, W - 16, 32);
      head(g, tt('KALEN'), 180, 437, 16, 'rgba(255,255,255,.8)');
      const b = ballP(), d = hyp(me, b), reach = slideV * slideT, ok = d < reach * .62 && me.y > at.y;
      if (me.st === 'run') { g.beginPath(); g.arc(me.x, me.y, reach * .62, 0, 7); g.strokeStyle = ok ? 'rgba(93,255,158,.8)' : 'rgba(255,255,255,.22)'; g.lineWidth = ok ? 3 : 2; g.setLineDash([5, 6]); g.stroke(); g.setLineDash([]); if (ok) head(g, tt('KAY!'), me.x, me.y + 34, 16, '#5dff9e'); }
      man(g, at.x, at.y, o.co); ballD(g, b.x, b.y, 5.5);
      trailD(g, trail);
      if (me.st === 'slide') { g.save(); g.translate(me.x, me.y); g.rotate(Math.atan2(me.dy, me.dx)); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-36, -6, 28, 12); g.restore(); man(g, me.x, me.y, o.cu, true, 1.25, .8); }
      else if (me.st === 'down') { g.globalAlpha = .6; man(g, me.x, me.y, o.cu, true, 1.3, .6); g.globalAlpha = 1; }
      else man(g, me.x, me.y, o.cu, true);
    },
  };
}

// ---------- orta / korner: koşuyu oku, topu varacağı yere bırak ----------
function crossGame(m, o) {
  const pk = o.pk || {}, corner = o.variant === 'korner', side = Math.random() < .5 ? -1 : 1;
  const me = corner ? { x: side < 0 ? 18 : 342, y: 44 } : { x: side < 0 ? 38 : 322, y: 320 };
  const keeper = { x: 180, y: 56 };
  const mates = [0, 1, 2].map(i => { const x = 105 + i * 75 + rnd(-14, 14), y = rnd(225, 290); return { x, y, tx: clamp(x + rnd(-70, 70), 80, 280), ty: rnd(84, 160), sp: rnd(72, 104), d: rnd(0, .7) }; });
  const defs = mates.map(a => ({ x: a.x + rnd(-22, 22), y: a.y - rnd(16, 30), a, sp: a.sp * (.86 + o.oppQ * .28) }));   // adam adama markaj
  const V = o.vr || {}, flyT = .9 - o.skill * .15, rr = 21 + o.skill * 8 + (pk.gorus ? 5 : 0), sg = (15 - o.skill * 9) * o.hard * (V.acc || 1);
  let ball = null, tl = 6 * (V.t || 1), t = 0, hold = null;
  const end = (out, x) => { if (out === 'ok') { m.burst(ball.to.x, ball.to.y, 14, ['#fff', '#5dff9e'], 130); sfx.up(); } else { m.shake(4); sfx.ooh(); } m.finish({ out, ...x }); };
  return {
    _s: { me, mates, defs, keeper, flyT },
    update(dt) {
      t += dt;
      for (const a of mates) if (t > a.d) { const dx = a.tx - a.x, dy = a.ty - a.y, L = Math.hypot(dx, dy); if (L > 2) { const s = Math.min(a.sp * dt, L); a.x += dx / L * s; a.y += dy / L * s; } }
      for (const d of defs) { const dx = d.a.x - d.x, dy = d.a.y - 13 - d.y, L = Math.hypot(dx, dy); if (L > 2) { const s = Math.min(d.sp * dt, L); d.x += dx / L * s; d.y += dy / L * s; } }
      if (!ball) { tl -= dt; if (tl <= 0) { ball = { to: me }; end('kesildi'); } return; }
      ball.p += dt / flyT;
      if (ball.p >= 1) {
        const P = ball.to, dm = Math.min(...mates.map(a => hyp(a, P))), dd = Math.min(...defs.map(d => hyp(d, P)));
        if (hyp(P, keeper) < 36) return end('kesildi');
        if (dm < rr && dm < dd + 5) return end('ok', { adv: true });
        end(dd < rr ? 'kesildi' : 'bos');
      }
    },
    down(x, y) { if (!ball) hold = { x, y }; },
    move(x, y) { if (hold) { hold.x = x; hold.y = y; } },
    up() { if (!hold || ball) return; const h = hold; hold = null; if (h.y > 300) return; ball = { p: 0, to: { x: clamp(h.x + randn() * sg, 20, 340), y: clamp(h.y + randn() * sg, 30, 300) } }; sfx.kick(); },
    draw(g) {
      pitch(g);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(60, 8, 240, 200); g.strokeRect(120, 8, 120, 70);
      g.fillStyle = '#f4f4f4'; g.fillRect(140, 4, 80, 6);
      g.beginPath(); g.arc(keeper.x, keeper.y, 36, 0, 7); g.fillStyle = 'rgba(255,77,77,.14)'; g.fill();
      for (const a of mates) { g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.tx, a.ty); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(a.tx, a.ty, 4, 0, 7); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill(); }
      for (const d of defs) man(g, d.x, d.y, o.co);
      for (const a of mates) man(g, a.x, a.y, o.cu, true);
      man(g, keeper.x, keeper.y, '#ffd23f'); man(g, me.x, me.y, o.cu, true);
      if (hold && !ball) { g.beginPath(); g.arc(hold.x, hold.y, rr, 0, 7); g.strokeStyle = hold.y > 300 ? '#ff4d4d' : '#5dff9e'; g.lineWidth = 2.5; g.stroke(); }
      if (ball && ball.p != null) { const p = Math.min(1, ball.p), x = lerp(me.x, ball.to.x, p), y = lerp(me.y, ball.to.y, p), h = Math.sin(p * Math.PI); g.beginPath(); g.ellipse(x, y, 6, 3, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(); ballD(g, x, y - h * 34, 6 + h * 5); g.beginPath(); g.arc(ball.to.x, ball.to.y, rr, 0, 7); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.stroke(); }
      else if (!ball) { ballD(g, me.x + (side < 0 ? 12 : -12), me.y - 8); timer(g, tl / 6); }
    },
  };
}

// ---------- kurtarış ----------
function keepGame(m, o) {
  const { gx, gy, gw, gh } = GOAL, gb = gy + gh, glove = { x: 180, y: gy + 56 }, crowd = mkCrowd(o), trail = [];
  // pen: penaltı düellosu (çok hızlı, hep köşe). wall: kurduğun baraj [köşe olasılığı, hız çarpanı]
  const W2 = o.wall || null, T = clamp(0.54 - o.oppQ * 0.2, .3, .56) / o.hard * (o.pen ? .62 : W2 ? W2[1] : 1) / ((o.vr || {}).sp || 1), R = 20 + o.skill * 14 + (o.pen ? 6 : 0), gs = (330 + o.skill * 260) * ((o.pk || {}).refleks ? 1.2 : 1) * (o.pen ? 1.25 : 1);
  const corner = o.pen ? true : Math.random() < (W2 ? W2[0] : .6);
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
      if (phase === 'wait') head(g, tt('HAZIR OL'), 180, 300, 22, 'rgba(255,255,255,.85)');
    },
  };
}

// Zamanlama oyunu. kosu: savunma arkasına koşu (pas çıkınca, imleç yeşildeyken dokun). cikis: kalecinin yan topa çıkışı.
function timeGame(m, o) {
  const V = o.vr || {}, gk = o.variant === 'cikis';
  const zw = clamp((.17 + o.skill * .1 - o.oppQ * .05) / o.hard, .08, .3), z0 = rnd(.48, .76), spd = (.6 + o.oppQ * .4) * o.hard * (V.sp || 1);
  const side = Math.random() < .5 ? -1 : 1, line = [62, 132, 228, 298];
  let wait = rnd(.7, 1.7), p = 0, phase = 'wait', t = 0, okEnd = false;
  const end = (out, ok) => { phase = 'end'; okEnd = ok; if (ok) { m.burst(180, gk ? 96 : 150, 16, ['#fff', '#5dff9e'], 140); sfx.up(); if (gk) sfx.save(); } else { m.shake(6); if (gk) { m.flash(.2); sfx.conceded(); } else sfx.whistle(1); } m.finish({ out }); };
  const press = () => {
    if (phase === 'wait' || (phase === 'go' && p < z0)) return end(gk ? 'yedi' : 'ofsayt', false);   // erken: ofsayt ya da boşa çıkış
    if (phase !== 'go') return;
    if (p <= z0 + zw) end(gk ? 'kurtardi' : 'kacti', true); else end(gk ? 'yedi' : 'gec', false);
  };
  return {
    _s: { zone: () => [z0, z0 + zw], p: () => (phase === 'go' ? p : -1) },
    down() { press(); }, act() { press(); },
    update(dt) {
      t += dt;
      if (phase === 'wait') { wait -= dt; if (wait <= 0) { phase = 'go'; sfx.kick(); } }
      else if (phase === 'go') { p += spd * dt; if (p >= 1) end(gk ? 'yedi' : 'gec', false); }
    },
    after(dt) { t += dt; },
    draw(g) {
      pitch(g);
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(80, 8, 200, 96); g.strokeRect(134, 8, 92, 34);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(140, 2, 80, 6);
      const q = phase === 'wait' ? 0 : Math.min(1, p);
      if (gk) {   // yan top: kale ağzına süzülüyor
        const bx = lerp(side < 0 ? 20 : 340, 180, q), by = lerp(150, 62, q) - Math.sin(q * Math.PI) * 40;
        for (const x of [120, 160, 205, 245]) { man(g, x + Math.sin(t * 2 + x) * 4, 78, o.co, false); man(g, x + 14 + Math.cos(t * 2 + x) * 4, 96, o.cu, false); }
        man(g, 180, okEnd ? 60 : 30, '#ffd23f', true);
        man(g, side < 0 ? 22 : 338, 154, o.co, false);
        ballD(g, bx, by, 6 + Math.sin(q * Math.PI) * 4);
      } else {    // savunma hattı, pasör ve koşu
        const ly = 176 + Math.sin(t * 1.4) * 5;
        g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,210,63,.55)'; g.beginPath(); g.moveTo(10, ly); g.lineTo(350, ly); g.stroke(); g.setLineDash([]);
        for (const x of line) man(g, x, ly, o.co, false);
        man(g, 180, 60, '#ffd23f', false);
        man(g, 150, 372, o.cu, false);
        const my = phase === 'end' ? (okEnd ? ly - 60 : ly - 18) : ly + 12 - q * 4;
        man(g, 214, my, o.cu, true);
        ballD(g, lerp(160, 226, q), lerp(362, ly - 70, q) - Math.sin(q * Math.PI) * 18, 6);
      }
      // zamanlama çubuğu
      const bx0 = 40, bw = 280, by0 = 418;
      g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, bx0 - 4, by0 - 4, bw + 8, 26, 6); g.fill();
      g.fillStyle = '#7a1f1f'; g.fillRect(bx0, by0, bw, 18);
      g.fillStyle = '#2fbf71'; g.fillRect(bx0 + z0 * bw, by0, zw * bw, 18);
      if (phase !== 'wait') { g.fillStyle = '#fff'; g.fillRect(bx0 + Math.min(1, p) * bw - 2, by0 - 5, 4, 28); }
      head(g, phase === 'wait' ? tt('BEKLE') : phase === 'go' ? tt('ŞİMDİ!') : '', 180, 396, 20, phase === 'go' ? '#ffd23f' : 'rgba(255,255,255,.8)');
    },
  };
}

// Dönen top: kaleciden seken topa savunmacıdan önce dokun. Çabuk dokunursan kaleci toparlanamaz.
function tapGame(m, o) {
  const V = o.vr || {}, T = clamp((1.85 - o.oppQ * .6) / o.hard * (V.t ? .5 + V.t * .5 : 1), .8, 2.2), R = 25 + o.skill * 11;
  const b = { x: 180, y: 62, vx: rnd(-150, 150), vy: rnd(150, 230) }, d = { x: rnd(60, 300), y: rnd(250, 320) }, me = { x: 180, y: 392 };
  let t = 0, miss = 0, done = false, shot = null;
  const end = (out, ok) => { done = true; if (ok) { m.burst(180, 20, 26, ['#fff', o.cu, '#ffd23f'], 190); m.shake(9); m.flash(.5); sfx.net(); sfx.goal(); } else { m.shake(5); sfx.ooh(); if (out === 'kurtaris') sfx.save(); } m.finish({ out }); };
  return {
    _s: { b, R, T },
    down(x, y) {
      if (done) return;
      if (Math.hypot(x - b.x, y - b.y) <= R + 6) { sfx.kick(); shot = { x: b.x, y: b.y, t: 0, ok: t / T < .55 }; end(shot.ok ? 'gol' : 'kurtaris', shot.ok); }
      else if (++miss >= 2) end('iska', false);
    },
    update(dt) {
      t += dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.exp(-1.6 * dt); b.vy *= Math.exp(-1.9 * dt);
      if (b.x < 30 || b.x > 330) { b.vx *= -1; b.x = clamp(b.x, 30, 330); }
      const dx = b.x - d.x, dy = b.y - d.y, L = Math.hypot(dx, dy) || 1, s = L / Math.max(.05, T - t) * 1.02;
      d.x += dx / L * Math.min(s * dt, L); d.y += dy / L * Math.min(s * dt, L);
      if (t >= T || L < 12) end('blok', false);
    },
    after(dt) { if (shot) shot.t += dt; },
    draw(g) {
      pitch(g);
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(70, 8, 220, 130); g.strokeRect(130, 8, 100, 44);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(132, 2, 96, 6);
      man(g, 180 + Math.sin(t * 3) * 3, 34, '#ffd23f', false, 1.2, .7);   // yerdeki kaleci
      man(g, d.x, d.y, o.co, false); man(g, me.x, me.y, o.cu, true);
      if (shot) { const q = Math.min(1, shot.t / .25); ballD(g, lerp(shot.x, shot.ok ? 180 + (shot.x < 180 ? 30 : -30) : 180, q), lerp(shot.y, shot.ok ? 10 : 34, q), 6); }
      else {
        const f = 1 - t / T; g.beginPath(); g.arc(b.x, b.y, R * (.55 + f * .9), 0, 7); g.lineWidth = 3; g.strokeStyle = f > .38 ? '#2fbf71' : '#ffd23f'; g.stroke();
        ballD(g, b.x, b.y, 7);
      }
      timer(g, 1 - t / T);
    },
  };
}

// Markaj: analogla adamının dibinde kal. Yakın geçen süre barı doldurur.
function trackGame(m, o) {
  const V = o.vr || {}, at = { x: rnd(110, 250), y: 130, vx: 0, vy: 0 }, me = { x: 180, y: 260, vx: 0, vy: 0 };
  const sp = 124 + o.speed * 46, sa = (72 + o.oppQ * 40) * o.hard * (V.sp || 1), R = 42 + o.skill * 14, T = 5.2, need = clamp(.4 + o.oppQ * .16, .4, .62);
  let t = 0, near = 0, turn = 0, boost = 0, cd = 0, inR = false;
  return {
    _s: { me, at, R },
    act() { if (cd > 0) return; boost = .24; cd = 1.3; sfx.swoosh(); },
    update(dt) {
      t += dt; cd -= dt; turn -= dt;
      if (turn <= 0) {   // adam yön değiştirir: kenara yakınsa içeri döner
        let a = rnd(0, Math.PI * 2); if (at.x < 70) a = rnd(-1, 1); else if (at.x > 290) a = Math.PI + rnd(-1, 1); if (at.y < 80) a = Math.PI / 2 + rnd(-1, 1); else if (at.y > 330) a = -Math.PI / 2 + rnd(-1, 1);
        at.vx = Math.cos(a) * sa; at.vy = Math.sin(a) * sa; turn = rnd(.45, .95) - o.oppQ * .18;
      }
      at.x = clamp(at.x + at.vx * dt, 30, 330); at.y = clamp(at.y + at.vy * dt, 50, 360);
      const v = sp * (boost > 0 ? 2 : 1), k = Math.min(1, 12 * dt); if (boost > 0) boost -= dt;
      me.vx += (m.sx * v - me.vx) * k; me.vy += (m.sy * v - me.vy) * k;
      me.x = clamp(me.x + me.vx * dt, 14, 346); me.y = clamp(me.y + me.vy * dt, 40, 446);
      inR = Math.hypot(me.x - at.x, me.y - at.y) <= R; if (inR) near += dt;
      if (near >= T * need) { m.burst(at.x, at.y, 14, ['#fff', '#5dff9e'], 130); m.shake(5); sfx.save(); sfx.up(); return m.finish({ out: 'kapildi' }); }
      if (t >= T) { m.shake(7); sfx.ooh(); m.finish({ out: 'gecildi' }); }
    },
    draw(g) {
      pitch(g);
      g.beginPath(); g.arc(at.x, at.y, R, 0, 7); g.fillStyle = inR ? 'rgba(47,191,113,.22)' : 'rgba(255,77,77,.12)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = inR ? '#2fbf71' : '#ff4d4d'; g.stroke();
      man(g, at.x, at.y, o.co, false); ballD(g, at.x + at.vx * .05, at.y + 13, 5);
      man(g, me.x, me.y, o.cu, true);
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 60, 16, 240, 14, 5); g.fill();
      g.fillStyle = '#2fbf71'; g.fillRect(62, 18, 236 * clamp(near / (T * need), 0, 1), 10);
      timer(g, 1 - t / T);
    },
  };
}

export const GAMES = {
  sut: (m, o) => shotGame(m, { ...o, variant: 'sut' }), kafa: (m, o) => shotGame(m, { ...o, variant: 'kafa' }),
  frikik: (m, o) => shotGame(m, { ...o, variant: 'frikik' }), penalti: (m, o) => shotGame(m, { ...o, variant: 'penalti' }),
  vole: (m, o) => shotGame(m, { ...o, variant: 'vole' }), rovesata: (m, o) => shotGame(m, { ...o, variant: 'rovesata' }),
  orta: (m, o) => crossGame(m, { ...o, variant: 'orta' }), korner: (m, o) => crossGame(m, { ...o, variant: 'korner' }),
  pas: passGame, calim: dribGame, savunma: defGame, kurtaris: keepGame, duvar: keepGame, penkurtar: (m, o) => keepGame(m, { ...o, pen: 1 }),
  kosu: (m, o) => timeGame(m, { ...o, variant: 'kosu' }), cikis: (m, o) => timeGame(m, { ...o, variant: 'cikis' }), ribaund: tapGame, markaj: trackGame,
};
const PADS = { calim: tt('ÇALIM'), savunma: tt('KAY'), markaj: tt('PRES') };   // analog + eylem tuşu kullanan oyunlar

export class Mini {
  constructor(cv) {
    this.cv = cv; this.g = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.px = W / 2; this.py = H / 2; this.hasP = false; this.game = null; this.res = null; this.started = false;
    this.p = []; this.sh = 0; this.slow = 1; this.slowT = 0; this.fl = 0; this.it = 0; this.sx = 0; this.sy = 0;
    // analog çubuk ve eylem tuşu: parmak sahayı kapatmasın diye sahanın altında durur
    this.pad = cv.parentElement.querySelector('.pad');
    if (this.pad) {
      const st = this.pad.querySelector('.stick'), nub = st.firstElementChild, btn = this.pad.querySelector('.pbtn'); let sid = null;
      const begin = () => { if (this.game && !this.started) { this.started = true; sfx.whistle(1); } };
      const mv = e => { const r = st.getBoundingClientRect(), R = r.width / 2, k = R * .6; let x = (e.clientX - r.left - R) / k, y = (e.clientY - r.top - R) / k; const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; } this.sx = x; this.sy = y; nub.style.transform = `translate(${x * k}px,${y * k}px)`; };
      st.addEventListener('pointerdown', e => { e.preventDefault(); sid = e.pointerId; try { st.setPointerCapture(sid); } catch (x) { /* sentetik */ } begin(); mv(e); });
      st.addEventListener('pointermove', e => { if (e.pointerId === sid) mv(e); });
      const end = e => { if (e.pointerId !== sid) return; sid = null; this.sx = this.sy = 0; nub.style.transform = ''; };
      st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
      btn.addEventListener('pointerdown', e => { e.preventDefault(); if (!this.started) return begin(); if (this.game && !this.res && this.game.act) this.game.act(); });
      const keys = {}, K = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
      const kb = () => { let x = 0, y = 0; for (const k in keys) if (keys[k]) { x += K[k][0]; y += K[k][1]; } const L = Math.hypot(x, y) || 1; this.sx = x / L; this.sy = y / L; };
      window.addEventListener('keydown', e => { if (!this.game || this.pad.hidden) return; if (K[e.key]) { e.preventDefault(); begin(); keys[e.key] = 1; kb(); } else if (e.key === ' ') { e.preventDefault(); if (this.started && !this.res && this.game.act) this.game.act(); else begin(); } });
      window.addEventListener('keyup', e => { if (K[e.key]) { keys[e.key] = 0; kb(); } });
    }
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* sentetik olay */ }
      [this.px, this.py] = pos(e); this.hasP = true;
      if (!this.game || this.res) return;
      if (!this.started) { this.started = true; this.skipUp = true; sfx.whistle(1); return; }
      if (this.game.down) this.game.down(this.px, this.py);
    });
    cv.addEventListener('pointermove', e => { [this.px, this.py] = pos(e); if (this.game && this.started && !this.res && this.game.move) this.game.move(this.px, this.py); });
    const up = e => { [this.px, this.py] = pos(e); if (this.skipUp) { this.skipUp = false; return; } if (this.game && this.started && !this.res && this.game.up) this.game.up(this.px, this.py); };
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
      this.game = GAMES[kind](this, o); this.sx = this.sy = 0;
      if (this.pad) { const P = PADS[kind]; this.pad.hidden = !P; this.cv.parentElement.classList.toggle('haspad', !!P); if (P) this.pad.querySelector('.pbtn').textContent = P; }
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
    g.save(); g.translate(cx, 150); const cs = getComputedStyle(document.documentElement), th = cs.getPropertyValue('--or').trim() || '#ff6a2b', on = cs.getPropertyValue('--on').trim() || '#14110e';
    g.transform(1, 0, -.18, 1, 0, 0); g.fillStyle = th; g.fillRect(-124, -34, 248, 68); g.restore();
    head(g, I[0], cx, 152, 52, on);
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
    if (Math.sin(k * 5) > -.3) text(g, tt('BAŞLAMAK İÇİN DOKUN'), cx, 410, 13, '#ffd23f', 700);
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

// ---------- canlı 2B maç görünümü: anlar arasında topun sahada dolaşması ----------
// Biz soldan sağa oynarız. Diziliş 4-4-2; me: oyuncunun dizilişteki sırası.
const FORM = [[.05, .5], [.2, .14], [.2, .38], [.2, .62], [.2, .86], [.42, .12], [.42, .38], [.42, .62], [.42, .88], [.64, .34], [.64, .66]];
export const PSLOT = { KL: 0, DF: 2, OS: 6, KN: 8, FV: 9 };
export class Pitch {
  constructor(cv, { cu = '#ff6a2b', co = '#5a6470', me = -1, flip = false, wx = '' } = {}) {
    this.cv = cv; this.g = cv.getContext('2d'); this.w = 360; this.h = 150;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = this.w * dpr; cv.height = this.h * dpr; this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cu = cu; this.co = co; this.me = me; this.flip = flip; this.wx = wx; this.on = true; this.t = 0; this.last = performance.now();
    this.us = FORM.map(([x, y]) => ({ x, y, hx: x, hy: y })); this.op = FORM.map(([x, y]) => ({ x: 1 - x, y, hx: 1 - x, hy: y }));
    this.b = { x: .5, y: .5, tx: .5, ty: .5, sp: 1.2 }; this.pos = true; this.next = .6; this.push = 0; this.flash = 0; this.fu = true; this.ring = 0; this.lock = 0; this.trail = [];
    const loop = () => { if (!this.on) return; const n = performance.now(), dt = Math.min(.05, (n - this.last) / 1000); if (dt > .012) { this.last = n; this.step(dt); this.draw(); } };
    this.raf = () => { loop(); if (this.on) requestAnimationFrame(this.raf); }; requestAnimationFrame(this.raf);
    this.iv = setInterval(loop, 60);   // sekme arka plandayken de aksın
  }
  stop() { this.on = false; clearInterval(this.iv); }
  // top bizde mi: hat ileri ya da geri kayar
  poss(us) { this.pos = us; this.push = us ? .1 : -.1; this.next = 0; }
  // atak: top rakip (ya da bizim) ceza sahasına doğru taşınır
  attack(us) { this.pos = us; this.push = us ? .2 : -.2; const p = (us ? this.us : this.op)[9 + (Math.random() < .5 ? 0 : 1)]; this.b.tx = p.x; this.b.ty = p.y; this.b.sp = 1.5; this.next = .5; }
  goal(us) { this.b.tx = us ? 1.01 : -.01; this.b.ty = .5 + (Math.random() - .5) * .12; this.b.sp = 3.2; this.lock = 1.5; this.flash = 1.5; this.fu = us; }
  // an sana geliyor: top oyuncunun ayağına
  focus() { if (this.me < 0) return; const p = this.us[this.me]; this.pos = true; this.b.tx = p.x; this.b.ty = p.y; this.b.sp = 2; this.ring = 2.2; this.lock = 1.6; }
  step(dt) {
    this.t += dt; const b = this.b;
    if (this.lock > 0) { this.lock -= dt; if (this.lock <= 0 && (b.tx > 1 || b.tx < 0)) { b.x = b.tx = .5; b.y = b.ty = .5; this.push = 0; this.pos = !this.fu; this.next = .7; } }
    else if ((this.next -= dt) <= 0) {   // paslaşma: topa sahip takımın bir oyuncusuna
      if (Math.random() < .16) { this.pos = !this.pos; this.push = this.pos ? .08 : -.08; }
      const T = this.pos ? this.us : this.op, p = T[1 + Math.floor(Math.random() * 10)];
      b.tx = p.x; b.ty = p.y; b.sp = .9 + Math.random() * .8; this.next = .55 + Math.random() * .7;
    }
    const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), v = b.sp * dt;
    if (d > v) { b.x += dx / d * v; b.y += dy / d * v; } else { b.x = b.tx; b.y = b.ty; }
    this.trail.push([b.x, b.y]); if (this.trail.length > 7) this.trail.shift();
    const mv = (T, sign) => T.forEach((p, i) => {
      const k = i === 0 ? .03 : .22, tx = clamp(p.hx + (b.x - .5) * k + this.push * sign * (i ? 1 : .2), .02, .98), ty = p.hy + (b.y - p.hy) * (i ? .16 : .3) + Math.sin(this.t * 1.3 + i * 2.1) * .012;
      p.x += (tx - p.x) * Math.min(1, dt * 2.6); p.y += (ty - p.y) * Math.min(1, dt * 2.6);
    });
    mv(this.us, 1); mv(this.op, 1);
    if (this.flash > 0) this.flash -= dt; if (this.ring > 0) this.ring -= dt;
  }
  draw() {
    const g = this.g, W = this.w, H = this.h, fl = this.flip, X = x => 8 + (fl ? 1 - x : x) * (W - 16), Y = y => 6 + y * (H - 12);   // deplasmanda saha aynalanır: skor tabelasıyla aynı yön
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#1d6b3a' : '#1a6235'; g.fillRect(i * W / 8, 0, W / 8 + 1, H); }
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
    g.strokeRect(8, Y(0), W - 16, Y(1) - Y(0)); g.beginPath(); g.moveTo(X(.5), Y(0)); g.lineTo(X(.5), Y(1)); g.stroke();
    g.beginPath(); g.arc(X(.5), Y(.5), 17, 0, 6.3); g.stroke();
    g.strokeRect(8, Y(.24), 42, Y(.76) - Y(.24)); g.strokeRect(W - 50, Y(.24), 42, Y(.76) - Y(.24));
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(4, Y(.42), 4, Y(.58) - Y(.42)); g.fillRect(W - 8, Y(.42), 4, Y(.58) - Y(.42));
    if (this.flash > 0) { g.fillStyle = this.fu ? `rgba(47,191,113,${Math.min(.5, this.flash * .5)})` : `rgba(255,77,77,${Math.min(.5, this.flash * .5)})`; g.fillRect(this.fu !== fl ? W / 2 : 0, 0, W / 2, H); }
    const dot = (p, c, hi) => {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X(p.x), Y(p.y) + 4, 4.5, 2, 0, 0, 6.3); g.fill();
      g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Y(p.y), hi ? 5.2 : 4.3, 0, 6.3); g.fill();
      g.strokeStyle = hi ? '#ffd23f' : 'rgba(0,0,0,.55)'; g.lineWidth = hi ? 2 : 1; g.stroke();
    };
    this.op.forEach(p => dot(p, this.co)); this.us.forEach((p, i) => dot(p, this.cu, i === this.me));
    if (this.ring > 0 && this.me >= 0) { const p = this.us[this.me], r = 8 + (2.2 - this.ring) % .7 * 16; g.strokeStyle = `rgba(255,210,63,${.9 - ((2.2 - this.ring) % .7) / .7 * .8})`; g.lineWidth = 2; g.beginPath(); g.arc(X(p.x), Y(p.y), r, 0, 6.3); g.stroke(); }
    this.trail.forEach(([x, y], i) => { g.fillStyle = `rgba(255,255,255,${i / 28})`; g.beginPath(); g.arc(X(x), Y(y), 2, 0, 6.3); g.fill(); });
    g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 1; g.beginPath(); g.arc(X(this.b.x), Y(this.b.y), 3, 0, 6.3); g.fill(); g.stroke();
    if (this.wx === 'yagmur' || this.wx === 'camur') { g.strokeStyle = 'rgba(200,225,255,.35)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 46; i++) { const x = (i * 53 + this.t * 190) % (W + 20) - 10, y = (i * 37 + this.t * 420) % H; g.moveTo(x, y); g.lineTo(x - 3, y + 9); } g.stroke(); if (this.wx === 'camur') { g.fillStyle = 'rgba(90,60,30,.22)'; g.fillRect(0, 0, W, H); } }
    else if (this.wx === 'kar') { g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const x = (i * 47 + Math.sin(this.t + i) * 8 + this.t * 14) % W, y = (i * 29 + this.t * 46) % H; g.fillRect(x, y, 1.6, 1.6); } }
    else if (this.wx === 'sicak') { g.fillStyle = 'rgba(255,170,60,.08)'; g.fillRect(0, 0, W, H); }
  }
}
