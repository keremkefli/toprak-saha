// Toprak Saha — sahne çizimleri (canvas): kademeli stadyum, eklemli oyuncu figürü, hava katmanı.
// Görsel dil: düz dolgu, blok şekiller, kulüp renkleri. Arka plan her zaman koyu ve soluk kalır; top ve oyuncu önde.

export const hs = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function srand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = c => { const h = (c || '#888').replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, x => x + x) : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const lum = c => { const [r, g, b] = rgb(c); return r * .299 + g * .587 + b * .114; };
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

// Grafik ayarları: low düşük ayrıntı, calm hareketi azalt. Arayüz doldurur.
export const GFX = { low: false, calm: false };

// Forma deseni iki renkten türetilir: iç saha ve deplasman formasında aynı desen
export const KITP = ['duz', 'cubuk', 'yatay', 'yarim', 'capraz'];
export const kitPat = (c1, c2) => KITP[hs([c1, c2].sort().join('')) % 5];

// ---------- stadyum arka planı ----------
// E: { tier 1-5, tod 'gun'|'aksam'|'gece', wx, fill 0-1, c1, c2 (ev sahibinin renkleri), derby, eu, flash 0-1, banner, boo }
export const ENV0 = { tier: 3, tod: 'gece', wx: 'acik', fill: .6, c1: '#ff6a2b', c2: '#f2f2f2', derby: false, eu: null, flash: 0, banner: '', boo: false };
const SKY = { gun: ['#35566f', '#7fa0b3'], aksam: ['#241f3a', '#b0562f'], gece: ['#0b0f16', '#1b2430'] };
const EUC = { cl: '#3d7bff', el: '#ff8a1f', ko: '#2fbf71' };
// tribün sıraları: [üst, alt, sıra sayısı] (yüksekliğin kesri)
const BANDS = { 1: [[.6, .7, 1]], 2: [[.5, .68, 3]], 3: [[.33, .67, 6]], 4: [[.13, .36, 5], [.43, .69, 6]], 5: [[.06, .21, 4], [.27, .44, 5], [.5, .7, 6]] };
const SEATS = new Map();
function seats(tier, w, h) {
  const k = tier + '|' + w + '|' + h; let a = SEATS.get(k); if (a) return a;
  a = []; const R = srand(tier * 977 + w * 13 + h), B = BANDS[tier] || BANDS[3];
  B.forEach(([y0, y1, rows], bi) => { for (let r = 0; r < rows; r++) { const yy = (y0 + (y1 - y0) * (r + .5) / rows) * h, n = Math.floor(w / 6.2); for (let i = 0; i < n; i++) a.push({ x: i * 6.2 + (r % 2) * 3.1 + R() * 1.6, y: yy, s: R(), p: R() * 6.283, c: Math.floor(R() * 6), b: bi }); } });
  SEATS.set(k, a); return a;
}
const TOWN = new Map();
function town(w, n, seed) { const k = w + '|' + n + '|' + seed; let a = TOWN.get(k); if (!a) { const R = srand(seed); a = Array.from({ length: n }, (_, i) => ({ x: i * w / n + R() * 6 - 3, w: w / n * (.7 + R() * .5), h: .3 + R() * .7, win: R() })); TOWN.set(k, a); } return a; }

export function backdrop(g, x, y, w, h, E0, t = 0) {
  const E = { ...ENV0, ...(E0 || {}) }, T = clamp(E.tier | 0, 1, 5), night = E.tod !== 'gun', bad = E.wx === 'yagmur' || E.wx === 'kar' || E.wx === 'camur';
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y);
  // gökyüzü
  let S = SKY[E.tod] || SKY.gece; if (bad && E.tod === 'gun') S = ['#3a4048', '#6a727b'];
  let gr = g.createLinearGradient(0, 0, 0, h * .75); gr.addColorStop(0, S[0]); gr.addColorStop(1, S[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (T <= 3 && !bad) { g.beginPath(); g.arc(E.tod === 'gece' ? w * .16 : w * .82, h * (E.tod === 'aksam' ? .42 : .14), E.tod === 'gece' ? 7 : 11, 0, 7); g.fillStyle = E.tod === 'gece' ? '#e9e2d3' : E.tod === 'aksam' ? '#ffb347' : '#f3e2a0'; g.globalAlpha = .85; g.fill(); g.globalAlpha = 1; }
  const dark = night ? '#15120f' : '#2a2622', mid = night ? '#1f1b17' : '#3a3530', lite = night ? '#2a2520' : '#4a4640';
  if (T <= 2) {   // şehir: apartmanlar ve ağaçlar
    for (const b of town(w, T === 1 ? 9 : 7, 31 + T)) { const bh = h * (T === 1 ? .2 + b.h * .28 : .12 + b.h * .14), by = h * (T === 1 ? .62 : .46) - bh; g.fillStyle = b.win > .5 ? mid : lite; g.fillRect(b.x, by, b.w, bh + 4); g.fillStyle = night ? 'rgba(255,214,120,.55)' : 'rgba(0,0,0,.22)'; for (let wy = by + 5; wy < by + bh - 4; wy += 9) for (let wx = b.x + 4; wx < b.x + b.w - 5; wx += 8) if (hs(wx * 7 + wy * 3 + T) % 3) g.fillRect(wx, wy, 3.5, 4.5); }
    g.fillStyle = night ? '#14231a' : '#2c4a30'; for (let i = 0; i < 9; i++) { const tx = (i * 47 + 20) % w; g.beginPath(); g.arc(tx, h * (T === 1 ? .6 : .46), 9 + (i % 3) * 4, 0, 7); g.fill(); }
  }
  if (T === 1) {   // mahalle: tel örgü, arkasında birkaç seyirci
    g.fillStyle = night ? '#2a2018' : '#5b4630'; g.fillRect(0, h * .7, w, h * .3);
  } else if (T === 2) {   // tek beton tribün, küçük sundurma
    g.fillStyle = mid; g.beginPath(); g.moveTo(w * .06, h * .47); g.lineTo(w * .94, h * .47); g.lineTo(w, h * .72); g.lineTo(0, h * .72); g.fill();
    g.fillStyle = dark; g.fillRect(w * .1, h * .4, w * .8, h * .035); g.fillRect(w * .12, h * .4, 3, h * .1); g.fillRect(w * .88 - 3, h * .4, 3, h * .1); g.fillRect(w * .5 - 1.5, h * .4, 3, h * .1);
    g.fillStyle = lite; g.fillRect(0, h * .7, w, h * .3);
  } else {
    // çatı ve ışık direkleri
    if (T >= 4) { g.fillStyle = dark; g.beginPath(); g.moveTo(0, h * (T === 5 ? .0 : .05)); g.quadraticCurveTo(w / 2, h * (T === 5 ? .075 : .1), w, h * (T === 5 ? .0 : .05)); g.lineTo(w, 0); g.lineTo(0, 0); g.fill(); }
    else { g.fillStyle = dark; g.fillRect(w * .04, h * .22, w * .92, h * .05); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= 10; i++) { g.moveTo(w * (.04 + i * .092), h * .22); g.lineTo(w * (.04 + (i + .5) * .092), h * .27); } g.stroke(); g.fillStyle = dark; for (const px of [w * .05, w * .95 - 3]) g.fillRect(px, 0, 3, h * .34); }
    // tribün blokları
    for (const [y0, y1] of BANDS[T]) { g.fillStyle = mid; g.fillRect(0, h * (y0 - .02), w, h * (y1 - y0 + .04)); }
    if (T >= 4) { const led = E.eu ? EUC[E.eu] : E.c1; for (let i = 0; i < BANDS[T].length - 1; i++) { g.fillStyle = led; g.globalAlpha = .55; g.fillRect(0, h * (BANDS[T][i][1] + .025), w, h * .022); g.globalAlpha = 1; } }
    g.fillStyle = dark; g.fillRect(0, h * .7, w, h * .3);
    if (T >= 4) { g.fillStyle = '#0c0a09'; g.fillRect(w * .78, h * .15, w * .16, h * .13); g.fillStyle = E.c1; g.globalAlpha = .7; g.fillRect(w * .79, h * .16, w * .14, h * .11); g.globalAlpha = 1; g.fillStyle = E.c2; g.fillRect(w * .79 + w * .06, h * .16, w * .02, h * .11); }
  }
  // seyirci
  const st = seats(T, w, h), fl = clamp(E.flash || 0, 0, 1), fill = clamp(E.fill, .03, 1) * (T === 1 ? .45 : 1), pal = [E.c1, E.c1, E.c2, '#e9e2d3', '#2b2a28', '#c9a07a'], tifo = (E.derby || E.eu) && T >= 3, step = GFX.low ? 2 : 1, bob = GFX.calm ? 0 : 1;
  g.globalAlpha = night ? .78 : .9;
  for (let i = 0; i < st.length; i += step) {
    const s = st[i]; if (s.s > fill) continue;
    let c = pal[s.c];
    if (tifo && s.b === BANDS[T].length - 1) c = (Math.floor(s.x / 26) + Math.floor(s.y / 7)) % 2 ? E.c1 : E.c2;   // koreografi: alt tribün kareli
    if (fl > 0 && (s.p * 5.3) % 1 < fl * .12 && Math.sin(t * 31 + s.p * 9) > .6) c = '#ffffff';   // flaşlar
    g.fillStyle = c; g.fillRect(s.x, s.y + bob * Math.sin(t * (5 + fl * 6) + s.p) * (1.2 + fl * 2.6) - 3, 4.4, 5.4);
  }
  g.globalAlpha = 1;
  if (T === 1) {   // tel örgü
    g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = 1; g.beginPath(); for (let i = -h; i < w + h; i += 9) { g.moveTo(i, h * .56); g.lineTo(i + h * .16, h * .72); g.moveTo(i + h * .16, h * .56); g.lineTo(i, h * .72); } g.stroke();
    g.fillStyle = '#3a3530'; for (let px = 12; px < w; px += 56) g.fillRect(px, h * .54, 3, h * .2); g.fillRect(0, h * .555, w, 2);
  }
  // pankart
  if (E.banner && T >= 2) { const bw = Math.min(w * .5, 30 + E.banner.length * 6.4), by = h * (BANDS[T][BANDS[T].length - 1][0] - .035); g.fillStyle = E.boo ? '#1b1712' : '#f2ecdf'; g.fillRect(w * .5 - bw / 2, by, bw, 13); g.font = '900 10px "Big Shoulders Display", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = E.boo ? '#ff4d4d' : '#1b1712'; g.fillText(E.banner, w * .5, by + 7, bw - 8); }
  // derbi: duman ve meşale
  if (E.derby && T >= 2 && !GFX.low) {
    for (let i = 0; i < 5; i++) { const px = ((i * 83 + t * (6 + i)) % (w + 80)) - 40, py = h * (.3 + (i % 3) * .12) + Math.sin(t * .6 + i) * 5; g.beginPath(); g.arc(px, py, 20 + (i % 3) * 8, 0, 7); g.fillStyle = i % 2 ? E.c1 : '#e9e2d3'; g.globalAlpha = .1; g.fill(); }
    g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const px = w * (.14 + i * .24), py = h * .62; g.beginPath(); g.arc(px, py, 3 + Math.sin(t * 17 + i * 2) * 1.2, 0, 7); g.fillStyle = '#ff7a2b'; g.fill(); g.beginPath(); g.arc(px, py, 11, 0, 7); g.fillStyle = 'rgba(255,122,43,.18)'; g.fill(); }
  }
  // projektörler ve Avrupa gecesi ışık hüzmeleri
  if (night && T >= 3) for (const px of T >= 4 ? [w * .12, w * .38, w * .62, w * .88] : [w * .06, w * .94]) { gr = g.createRadialGradient(px, 4, 2, px, 4, h * .62); gr.addColorStop(0, 'rgba(255,244,200,.46)'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.fillRect(px - h * .62, 0, h * 1.24, h * .66); }
  if (E.eu && T >= 3 && !GFX.low) { g.fillStyle = EUC[E.eu]; for (let i = 0; i < 4; i++) { const px = w * (.14 + i * .24), sw = Math.sin(t * .7 + i * 1.7) * w * .08; g.globalAlpha = .07; g.beginPath(); g.moveTo(px, 0); g.lineTo(px + sw - 26, h * .7); g.lineTo(px + sw + 26, h * .7); g.fill(); } g.globalAlpha = 1; }
  g.restore();
}

// Hava katmanı: sahnenin üstüne çizilir
export function weather(g, w, h, wx, t) {
  if (GFX.low || !wx || wx === 'acik' || wx === 'sicak') return;
  g.save();
  if (wx === 'yagmur' || wx === 'camur') { g.strokeStyle = 'rgba(200,220,255,.28)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 46; i++) { const x = (i * 71.3 + t * 90) % (w + 40) - 20, y = (i * 137.7 + t * 640) % (h + 30) - 15; g.moveTo(x, y); g.lineTo(x - 4, y + 13); } g.stroke(); }
  else if (wx === 'kar') { g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 52; i++) { const x = (i * 53.9 + Math.sin(t * .8 + i) * 12) % w, y = (i * 97.3 + t * 46) % h; g.fillRect(x, y, 2.2, 2.2); } }
  else if (wx === 'ruzgar') { g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 6; i++) { const x = (i * 131 + t * 260) % (w + 120) - 60, y = 40 + i * (h - 80) / 6; g.moveTo(x, y); g.quadraticCurveTo(x + 22, y - 5, x + 44, y); } g.stroke(); }
  g.restore();
}

// Zemin: kademeye ve havaya göre renk çifti
export function turf(E) {
  const T = clamp((E && E.tier) | 0 || 3, 1, 5), wx = E && E.wx;
  let a = T === 1 ? ['#7a5a38', '#6e5032'] : T === 2 ? ['#3f7a3a', '#39702f'] : T === 3 ? ['#22803f', '#1d7438'] : ['#259048', '#1f7c3d'];
  if (wx === 'kar') a = a.map(c => mix(c, '#e8eef0', .55)); else if (wx === 'camur') a = a.map(c => mix(c, '#5a4226', .4)); else if (wx === 'sicak' && T <= 2) a = a.map(c => mix(c, '#a08a4a', .25));
  return a;
}
// Zemin lekeleri: mahallede çim öbekleri, alt liglerde kel bölgeler, çamurda su birikintisi
export function patches(g, x, y, w, h, E) {
  const T = clamp((E && E.tier) | 0 || 3, 1, 5), wx = E && E.wx; if (T >= 3 && wx !== 'camur' && wx !== 'kar') return;
  const R = srand(T * 7 + w + h); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const n = wx === 'camur' ? 9 : T === 1 ? 12 : 6, col = wx === 'camur' ? 'rgba(70,50,28,.45)' : wx === 'kar' ? 'rgba(255,255,255,.3)' : T === 1 ? 'rgba(84,120,60,.4)' : 'rgba(120,96,56,.4)';
  g.fillStyle = col; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(x + R() * w, y + R() * h, 14 + R() * 26, 6 + R() * 12, R() * 3, 0, 7); g.fill(); }
  g.restore();
}

// ---------- eklemli oyuncu figürü (önden ya da arkadan) ----------
// Açılar radyan: 0 aşağı, artı sağa. ll/rl kalça, lk/rk diz, la/ra omuz, lf/rf dirsek, lean gövde eğimi, up sıçrama, dy çökme
export const POSE = {
  idle: (t = 0, tired = 0) => ({ ll: -.1, rl: .1, lk: 0, rk: 0, la: -.28 + Math.sin(t * 2.2) * .05, ra: .28 - Math.sin(t * 2.2) * .05, lf: .12, rf: -.12, dy: Math.sin(t * (tired ? 5 : 2.2)) * (tired ? 1.4 : .6) + tired * 2 }),
  ready: (t = 0) => ({ ll: -.36, rl: .36, lk: .5, rk: .5, la: -1, ra: 1, lf: -.5, rf: .5, dy: 3 + Math.sin(t * 6) * .8 }),
  run: (t = 0, sp = 1) => { const s = Math.sin(t * 12 * sp); return { ll: s * .55, lk: Math.max(0, -s) * 1.1 + .15, rl: -s * .55, rk: Math.max(0, s) * 1.1 + .15, la: -.25 - s * .6, ra: .25 - s * .6, lf: .7, rf: -.7, dy: -Math.abs(Math.cos(t * 12 * sp)) * 1.5 }; },
  kick: k => (k < .4 ? { ll: -.15, lk: .2, rl: .2 + k * 2.2, rk: 1.3 * (k / .4), la: -1.2, ra: .9, lf: -.3, rf: .4, lean: -.06 } : { ll: -.2, lk: .3, rl: 1.08 - (k - .4) / .6 * 2.2, rk: Math.max(0, 1.3 - (k - .4) * 4), la: -.6, ra: 1.5, lf: .3, rf: .2, lean: .1 * (k - .4), dy: -1 }),
  jump: k => ({ ll: -.2, lk: .9 * k, rl: .25, rk: .6 * k, la: -2.2, ra: 2.2, lf: -.3, rf: .3, up: 14 * Math.sin(Math.min(1, k) * Math.PI) }),
  dive: (dir, k = 1, up = 0) => ({ ll: -.25, rl: .25, lk: .2, rk: .2, la: -2.7, ra: 2.7, lf: 0, rf: 0, lean: dir * k * 1.05, up }),
  cheer: (t = 0) => ({ ll: -.15, rl: .15, lk: 0, rk: 0, la: -2.6 + Math.sin(t * 9) * .25, ra: 2.6 - Math.sin(t * 9 + 1) * .25, lf: 0, rf: 0, up: Math.abs(Math.sin(t * 7)) * 6 }),
  limp: (t = 0) => ({ ll: -.1, rl: .3, lk: 0, rk: .5, la: -.3, ra: .9, lf: .2, rf: -1.2, dy: 1 + Math.sin(t * 3), lean: .08 }),
  card: (t = 0) => ({ ll: -.1, rl: .1, lk: 0, rk: 0, la: -.3, ra: 2.9, lf: .1, rf: .1, dy: 0 }),
};
function seg(g, x, y, a, l, w, col) { const ex = x + Math.sin(a) * l, ey = y + Math.cos(a) * l; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); return [ex, ey]; }
function kitFill(g, x, y, w, h, r, c1, c2, pat) {
  g.save(); rr(g, x, y, w, h, r); g.clip(); g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = c2;
  if (pat === 'cubuk') for (let i = x + w / 5; i < x + w; i += w * 2 / 5) g.fillRect(i, y, w / 5, h);
  else if (pat === 'yatay') for (let j = y + h / 5; j < y + h; j += h * 2 / 5) g.fillRect(x, j, w, h / 5);
  else if (pat === 'yarim') g.fillRect(x + w / 2, y, w / 2, h);
  else if (pat === 'capraz') { g.beginPath(); g.moveTo(x, y + h * .15); g.lineTo(x + w, y + h * .6); g.lineTo(x + w, y + h * .9); g.lineTo(x, y + h * .45); g.fill(); }
  g.restore();
}
// o: { c1, c2, pat, skin, hair, back, num, gk, pose, me, long, beard, boot, mud, card }
export function fig(g, x, y, s, o = {}) {
  const P = o.pose || POSE.idle(0), c1 = o.c1 || '#888', c2 = o.c2 || '#f2f2f2', sk = o.skin || '#e0ac7e', hr = o.hair || '#1b1612', back = !!o.back;
  const shorts = Math.abs(lum(c2) - lum(c1)) > 60 ? c2 : lum(c1) > 130 ? '#1b1b1b' : '#f2f2f2', pat = o.pat || kitPat(c1, c2);
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.ellipse(0, 2, 14 - (P.up || 0) * .3, 5 - (P.up || 0) * .1, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill();
  g.translate(0, (P.dy || 0) - (P.up || 0)); g.rotate(P.lean || 0);
  const leg = (sx, a, k) => { const [kx, ky] = seg(g, sx, -24, a, 12, 6.4, sk), [fx, fy] = seg(g, kx, ky, a - Math.sign(a || sx) * k, 12, 5.6, c1); g.beginPath(); g.ellipse(fx, fy + 1, 4.6, 2.8, 0, 0, 7); g.fillStyle = o.boot || '#15120f'; g.fill(); };
  leg(-4.6, P.ll || 0, P.lk || 0); leg(4.6, P.rl || 0, P.rk || 0);
  g.fillStyle = shorts; rr(g, -10, -29, 20, 10, 3); g.fill();
  const arm = (sx, a, f) => { const [ex, ey] = seg(g, sx, -42, a, 9, 5.6, c1), [hx, hy] = seg(g, ex, ey, a + f, 9, 4.4, sk); if (o.gk) { g.beginPath(); g.arc(hx, hy, 4.2, 0, 7); g.fillStyle = '#fff'; g.fill(); } return [hx, hy]; };
  arm(-10, P.la ?? -.28, P.lf || 0); const hand = arm(10, P.ra ?? .28, P.rf || 0);
  kitFill(g, -10.5, -46, 21, 20, 5, c1, c2, o.gk ? 'duz' : pat); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.6; rr(g, -10.5, -46, 21, 20, 5); g.stroke();
  if (back && o.num) { g.font = '900 10px "Big Shoulders Display", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = Math.abs(lum(c2) - lum(c1)) > 60 ? c2 : '#fff'; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.strokeText(o.num, 0, -35.5); g.fillText(o.num, 0, -35.5); }
  if (o.mud) { g.fillStyle = 'rgba(70,50,28,.75)'; for (const [mx, my] of [[-6, -25], [4, -22], [-3, -38], [6, -8], [-5, -6]]) { g.beginPath(); g.arc(mx, my, 1.8, 0, 7); g.fill(); } }
  if (o.long) { g.fillStyle = hr; rr(g, -7.5, -56, 15, 13, 4); g.fill(); }
  g.fillStyle = sk; g.fillRect(-2.6, -49, 5.2, 5); g.beginPath(); g.arc(0, -54, 8, 0, 7); g.fill();
  g.fillStyle = hr; g.beginPath(); if (back) g.arc(0, -54, 8.3, Math.PI * .12, Math.PI * .88, true); else g.arc(0, -54, 8.3, Math.PI * 1.06, Math.PI * 1.94); g.fill();
  if (!back) { g.fillStyle = '#191512'; g.fillRect(-3.6, -54.5, 2, 2.2); g.fillRect(1.6, -54.5, 2, 2.2); if (o.beard) { g.fillStyle = hr; g.globalAlpha = .8; g.beginPath(); g.arc(0, -54, 8, Math.PI * .15, Math.PI * .85); g.fill(); g.globalAlpha = 1; } }
  if (o.card) { g.fillStyle = o.card; g.fillRect(hand[0] - 3, hand[1] - 9, 6.5, 9); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.strokeRect(hand[0] - 3, hand[1] - 9, 6.5, 9); }
  g.restore();
  if (o.me) { g.fillStyle = '#ffd23f'; g.beginPath(); const ty = y - (66 + (P.up || 0)) * s; g.moveTo(x - 5, ty - 7); g.lineTo(x + 5, ty - 7); g.lineTo(x, ty); g.fill(); }
}

// ---------- kuşbakışı oyuncu ----------
export function topMan(g, x, y, o = {}) {
  const c1 = o.c1 || '#888', c2 = o.c2 || '#f2f2f2', t = o.t || 0, st = GFX.calm ? 0 : Math.sin(t * 11 + (o.ph || 0)) * 3.2;
  g.save(); g.translate(x, y); g.scale(o.sx || 1, o.sy || 1);
  g.beginPath(); g.ellipse(0, 4, 12, 9, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
  g.fillStyle = o.boot || '#15120f'; g.beginPath(); g.ellipse(-4.5, st, 3, 4.2, 0, 0, 7); g.ellipse(4.5, -st, 3, 4.2, 0, 0, 7); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, 0, 11.5, 8, 0, 0, 7); g.clip(); g.fillStyle = c1; g.fillRect(-12, -9, 24, 18); g.fillStyle = c2;
  const pat = o.gk ? 'duz' : o.pat || kitPat(c1, c2);
  if (pat === 'cubuk') { g.fillRect(-7, -9, 3.5, 18); g.fillRect(3.5, -9, 3.5, 18); } else if (pat === 'yatay') g.fillRect(-12, -2, 24, 4); else if (pat === 'yarim') g.fillRect(0, -9, 12, 18); else if (pat === 'capraz') { g.beginPath(); g.moveTo(-12, -9); g.lineTo(-6, -9); g.lineTo(12, 9); g.lineTo(6, 9); g.fill(); }
  g.restore();
  g.beginPath(); g.ellipse(0, 0, 11.5, 8, 0, 0, 7); g.lineWidth = 2; g.strokeStyle = o.me ? '#fff' : 'rgba(0,0,0,.65)'; g.stroke();
  g.beginPath(); g.arc(0, -.5, 5, 0, 7); g.fillStyle = o.hair || (o.me ? '#1b1612' : '#3a2a1e'); g.fill();
  g.beginPath(); g.arc(0, -3.2, 2.6, Math.PI, 0); g.fillStyle = o.skin || '#e0ac7e'; g.fill();
  g.restore();
  if (o.me) { g.beginPath(); g.arc(x, y, 15, 0, 7); g.lineWidth = 2.5; g.strokeStyle = '#ffd23f'; g.stroke(); }
}

// ---------- maç ekranı tribün bandı ----------
export class StadView {
  constructor(cv, E) {
    this.cv = cv; this.g = cv.getContext('2d'); this.w = 360; this.h = 96; this.E = { ...ENV0, ...(E || {}) }; this.on = true; this.t = 0; this.last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = this.w * dpr; cv.height = this.h * dpr; this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const loop = () => { if (!this.on) return; const n = performance.now(), dt = Math.min(.06, (n - this.last) / 1000); if (dt < (GFX.low ? .09 : .03)) return; this.last = n; this.t += dt; if (this.E.flash > 0) this.E.flash = Math.max(0, this.E.flash - dt * .45); this.draw(); };
    this.raf = () => { loop(); if (this.on) requestAnimationFrame(this.raf); }; requestAnimationFrame(this.raf); this.iv = setInterval(loop, 120); this.draw();
  }
  draw() { const g = this.g, E = this.E; backdrop(g, 0, 0, this.w, this.h * 1.36, E, this.t); weather(g, this.w, this.h, E.wx, this.t); }
  cheer(v = 1) { this.E.flash = v; }
  stop() { this.on = false; clearInterval(this.iv); }
}
