// Toprak Saha — ses efektleri. Hepsi Web Audio ile üretilir, ses dosyası yoktur.
const has = typeof window !== 'undefined';
const KEY = 'toprak-saha-ses';
let ctx = null, master = null, nb = null, amb = null, on = true;
try { on = has && localStorage.getItem(KEY) !== '0'; } catch (e) { /* depolama kapalı */ }

function ac() {
  if (!has || !on) return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ctx = new C(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  }
  if (ctx.state !== 'running') ctx.resume();
  return ctx;
}
function env(g, t, d, vol, a) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
function tone(f, d, { type = 'sine', vol = .2, to, at = 0, a = .006 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  env(g, t, d, vol, a); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .03);
}
function nbuf(c) {
  if (!nb) { nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return nb;
}
function noise(d, { f = 1000, q = 1, type = 'bandpass', vol = .2, at = 0, a = .01, to } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = nbuf(c); s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d); fl.Q.value = q;
  env(g, t, d, vol, a); s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + d + .05);
}
// iOS: ses ancak bir dokunuş içinde açılır; ayrıca sessiz anahtarı açıkken Web Audio susar.
// Döngüde çalan sessiz bir <audio> oturumu "oynatma" kipine alır, böylece efektler duyulur.
let keep = null;
function unlock() {
  if (!has || !on) return;
  const c = ac(); if (!c) return;
  try { const b = c.createBufferSource(); b.buffer = c.createBuffer(1, 1, 22050); b.connect(c.destination); b.start(0); } catch (e) { /* yok */ }
  if (!keep) {
    try {
      const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      keep = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))); keep.loop = true; keep.setAttribute('playsinline', ''); keep.volume = 0.01;
    } catch (e) { /* yok */ }
  }
  if (keep && keep.paused) keep.play().catch(() => { /* engellendi */ });
}
if (has) {
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(e => document.addEventListener(e, unlock, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume(); });
}
const vib = p => { try { if (has && on && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* desteklenmiyor */ } };

export const sfx = {
  get on() { return on; },
  toggle() { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* yok */ } if (!on) { this.ambOff(); if (keep) keep.pause(); } else { unlock(); this.click(); } return on; },
  click() { tone(520, .05, { type: 'triangle', vol: .09 }); },
  pop() { tone(300, .09, { type: 'triangle', vol: .12, to: 520 }); },
  kick() { tone(170, .13, { vol: .5, to: 48 }); noise(.05, { f: 1800, q: .7, vol: .22 }); vib(12); },
  swoosh() { noise(.2, { f: 500, to: 2600, q: 1.2, vol: .14, a: .04 }); },
  net() { noise(.32, { f: 4200, type: 'highpass', vol: .2, a: .01 }); },
  post() { tone(880, .5, { type: 'square', vol: .09 }); tone(1320, .45, { type: 'sine', vol: .14 }); vib(30); },
  save() { tone(120, .12, { vol: .35, to: 60 }); noise(.08, { f: 900, q: .8, vol: .2 }); },
  whistle(n = 1) { for (let i = 0; i < n; i++) { const at = i * .38, d = i === n - 1 && n > 1 ? .7 : .28; tone(2350, d, { type: 'square', vol: .05, at }); tone(2480, d, { type: 'square', vol: .05, at }); noise(d, { f: 2400, q: 6, vol: .1, at }); } },
  goal() { noise(2.8, { f: 850, q: .5, vol: .55, a: .16 }); noise(2.4, { f: 2300, q: .8, vol: .2, a: .25 }); tone(392, .16, { type: 'triangle', vol: .12, at: .05 }); tone(523, .16, { type: 'triangle', vol: .12, at: .2 }); tone(659, .4, { type: 'triangle', vol: .14, at: .35 }); vib([40, 60, 120]); },
  ooh() { noise(.9, { f: 700, to: 320, q: .9, vol: .28, a: .05 }); },
  conceded() { noise(1.1, { f: 420, to: 200, q: .8, vol: .26, a: .08 }); tone(196, .5, { type: 'sawtooth', vol: .06, to: 130 }); },
  card() { tone(740, .1, { type: 'square', vol: .09 }); tone(554, .22, { type: 'square', vol: .09, at: .11 }); },
  coin() { tone(988, .08, { type: 'square', vol: .08 }); tone(1319, .22, { type: 'square', vol: .08, at: .08 }); },
  up() { [523, 659, 784].forEach((f, i) => tone(f, .16, { type: 'triangle', vol: .13, at: i * .08 })); },
  bad() { tone(300, .28, { type: 'sawtooth', vol: .08, to: 170 }); },
  sign() { noise(.25, { f: 3000, to: 1500, q: 2, vol: .1 }); [659, 784, 1047].forEach((f, i) => tone(f, .2, { type: 'triangle', vol: .12, at: .2 + i * .09 })); },
  trophy() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .24, { type: 'triangle', vol: .15, at: i * .13 })); noise(2.6, { f: 900, q: .5, vol: .4, a: .3 }); },
  ambOn() {
    const c = ac(); if (!c || amb) return;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nbuf(c); s.loop = true; fl.type = 'lowpass'; fl.frequency.value = 520; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 1);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(); amb = { s, g };
  },
  ambOff() { if (!amb || !ctx) return; const a = amb; amb = null; try { a.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + .6); a.s.stop(ctx.currentTime + .7); } catch (e) { /* zaten durdu */ } },
};
