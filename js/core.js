// Toprak Saha — oyun çekirdeği: durum, lig simülasyonu, sezon, transfer, ekonomi
import { LEAGUES, LMAP, CLUBS, PAL, PROV, NAMES, POS, ATTR, ORIGINS, TRAITS, SHOP, TRAIN, NATIONS, FILL, CUPS } from './data.js';

export let S = null;
export const WEEKS = 38;
const KEY = 'toprak-saha-kayit-1', META = 'toprak-saha-meta-1';
const TRT = ['tr1', 'tr2', 'tr3', 'tr4', 'tr5', 'tr6', 'tr7', 'tr8'];
const SWAP = [3, 3, 3, 3, 2, 2, 2]; // kademeler arası inen/çıkan takım sayısı

// ---------- yardımcılar ----------
export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const chance = p => Math.random() < p;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function randn() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function wpick(o) { let t = 0; for (const k in o) t += o[k]; let r = Math.random() * t; for (const k in o) { r -= o[k]; if (r <= 0) return k; } return Object.keys(o)[0]; }
function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
export const fmt = n => (n < 0 ? '−' : '') + '₺' + Math.abs(Math.round(n)).toLocaleString('tr-TR');
export function fmtS(n) {
  n = Math.round(n); const a = Math.abs(n), sg = n < 0 ? '−' : '';
  if (a >= 1e9) return sg + '₺' + (a / 1e9).toFixed(1).replace('.', ',') + ' Mr';
  if (a >= 1e6) return sg + '₺' + (a / 1e6).toFixed(1).replace('.', ',') + ' Mn';
  if (a >= 1e5) return sg + '₺' + Math.round(a / 1e3) + ' B';
  return fmt(n);
}
export function nice(n) { if (n < 100) return Math.round(n / 10) * 10; const m = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / m) * m; }
const sg = v => (v > 0 ? '+' : '−') + Math.abs(Math.round(v));

// ---------- kayıt ----------
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* depolama kapalı */ } }
export function load() {
  try {
    const j = localStorage.getItem(KEY); if (!j) return false; S = JSON.parse(j);
    // eski kayıtları yeni alanlarla tamamla
    S.look ??= { skin: 1, hair: 0, hc: 0 }; S.tstat ??= 'mutlu'; S.watch ??= []; S.loan ??= null; S.st.lg ??= S.st.g;
    if (S.con && S.con.rel == null) S.con.rel = nice(value() * 4);
    if (!S.cup) initCup();
    return true;
  } catch (e) { return false; }
}
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) { /* yok */ } S = null; }
export function meta() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } }
function setMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) { /* yok */ } }

// ---------- sorgular ----------
export const club = id => CLUBS[id] || S.gen[id];
export function OVR() { const w = POS[S.pos].w; let s = 0; for (const k in w) s += S.at[k] * w[k]; return Math.round(s); }
export function leagueOf(id) { for (const k in S.lg) if (S.lg[k].t.includes(id)) return k; return null; }
export const tier = () => LMAP[leagueOf(S.clubId)].tier;
export const absWeek = () => (S.season - 1) * WEEKS + S.week;
export const seasonLabel = () => `${S.year}/${String((S.year + 1) % 100).padStart(2, '0')}`;
export const has = id => S.assets.includes(id);
export const eff = k => SHOP.reduce((s, i) => s + ((has(i.id) && i.e && i.e[k]) || 0), 0);
export const wref = () => Math.max(S.con.wage, 1500);
export function addNews(s, ic = 'news') { S.news.unshift({ w: `${S.week}. hafta`, s, ic }); if (S.news.length > 24) S.news.length = 24; }
export function tot() { const c = S.car, t = S.st; return { apps: c.apps + t.apps, g: c.g + t.g, a: c.a + t.a, rs: c.rs + t.rs }; }
export function potText() { const p = S.pot; return p >= 91 ? 'Dünya çapında' : p >= 87 ? 'Çok yüksek' : p >= 83 ? 'Yüksek' : 'İyi'; }
export function zones(lid) { const i = TRT.indexOf(lid); if (i < 0) return { up: 1, down: 0 }; return { up: i > 0 ? SWAP[i - 1] : 1, down: i < 7 ? SWAP[i] : 0 }; }
function rname(c) { const N = NAMES[c] || NAMES.TR; return pick(N.f) + ' ' + pick(N.l); }

// Etki uygula, görünür değişiklikleri döndür. Gizli sayaçlar (prof, ego, sad) listelenmez.
const LBL = { en: 'Enerji', mo: 'Moral', aile: 'Aile', ark: 'Arkadaşlar', par: 'İlişki', hoca: 'Hoca güveni', takim: 'Takım', taraf: 'Taraftar', fol: 'Takipçi', rep: 'İtibar', egt: 'Eğitim', dil: 'Dil' };
export function fx(o) {
  const out = [];
  for (const k in o) {
    const v = o[k]; if (!v) continue;
    if (k === 'para') { S.money += v; out.push((v > 0 ? '+' : '−') + fmt(Math.abs(v))); }
    else if (k in S.rel) { if (S.rel[k] == null) continue; S.rel[k] = clamp(S.rel[k] + v, 0, 100); if (Math.round(v)) out.push(LBL[k] + ' ' + sg(v)); }
    else if (k === 'en' || k === 'mo' || k === 'rep' || k === 'egt' || k === 'dil') { S[k] = clamp(S[k] + v, 0, 100); if (Math.round(v)) out.push(LBL[k] + ' ' + sg(v)); }
    else if (k === 'fol') { S.fol = Math.max(0, Math.round(S.fol + v)); out.push('Takipçi ' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)).toLocaleString('tr-TR')); }
    else if (k in S.hid) { S.hid[k] = clamp(S.hid[k] + v, 0, 100); }
    else if (k in S.at) { S.at[k] = clamp(S.at[k] + v, 1, 99); out.push(ATTR[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(v)); }
    else if (k === 'inj') { S.inj = Math.max(S.inj, v); out.push(`${v} hafta sakat`); }
  }
  return out;
}

// ---------- gelişim ----------
const ageF = () => { const a = S.age; return a <= 17 ? 1.2 : a <= 20 ? 1.05 : a <= 23 ? .85 : a <= 26 ? .6 : a <= 29 ? .38 : a <= 32 ? .2 : .1; };
const capF = v => clamp(1 - Math.pow(Math.max(0, v - 20) / (S.pot - 20), 2), 0, 1);
export function grow(k, amt) { const g = amt * ageF() * capF(S.at[k]); S.at[k] = clamp(S.at[k] + g, 1, 99); return g; }

// ---------- dünya kurulumu ----------
function genAmateur(prov) {
  const P = PROV[prov], keys = ['R', 'G', 'B', 'N', 'Y', 'O', 'M', 'P', 'S', 'T', 'K'];
  const rng = [[33, 41], [28, 35], [22, 30]];
  ['tr6', 'tr7', 'tr8'].forEach((lid, ti) => {
    const names = P.l ? P.l[ti] : P.d.map((d, i) => d + (ti === 0 ? ' Belediyespor' : ti === 1 ? ' Gençlikspor' : (i % 2 ? ' Gücü' : ' İdman Yurdu')));
    S.lg[lid] = { t: [], tb: {}, rd: 0, last: [] };
    names.forEach((n, i) => {
      const id = 'g' + (ti + 6) + '_' + i; let h = 0;
      for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const a = keys[h % keys.length]; let b = ['W', 'K', 'Y', 'W'][(h >> 4) % 4]; if (b === a) b = 'W';
      S.gen[id] = { n, c1: PAL[a], c2: PAL[b] };
      S.rt[id] = Math.round(rnd(rng[ti][0], rng[ti][1]));
      S.lg[lid].t.push(id);
    });
  });
}

function initLeague(lid) {
  const lg = S.lg[lid], c = LMAP[lid].c;
  shuffle(lg.t); lg.tb = {}; lg.rd = 0; lg.last = [];
  for (const id of lg.t) {
    if (!S.sc[id]) S.sc[id] = [[rname(c), 0], [rname(c), 0]];
    else { S.sc[id][0][1] = 0; S.sc[id][1][1] = 0; if (chance(.25)) S.sc[id][ri(0, 1)][0] = rname(c); }
  }
}

export function newCareer(o) {
  const m = meta(), P = POS[o.pos], O = ORIGINS[o.origin], Tr = TRAITS[o.trait], leg = m.leg || 0;
  const at = { sut: 24, pas: 24, teknik: 24, hiz: 26, guc: 22, savunma: 22, kafa: 22, zihin: 24, kaleci: 8 };
  for (const k in at) at[k] += ri(-2, 2) + (O.all || 0) + leg * 0.5;
  for (const k in P.b) at[k] += P.b[k];
  for (const k in O.at || {}) at[k] += O.at[k];
  for (const k in Tr.at || {}) at[k] += Tr.at[k];
  S = {
    v: 1, name: o.name, pos: o.pos, foot: o.foot, prov: o.prov, origin: o.origin, trait: o.trait, nat: 'TR', look: o.look || { skin: 1, hair: 0, hc: 0 },
    age: 16, year: 2026, season: 1, week: 1, used: 0, at, pot: clamp(ri(80, 91) + (O.pot || 0) + Math.floor(leg / 2), 78, 96),
    en: 80, mo: 65, money: O.money, fol: ri(80, 200), rep: 1, egt: 20 + (O.egt || 0), dil: O.dil || 0,
    rel: { aile: 65, ark: 55, par: null, hoca: 40, takim: 45, taraf: 30 },
    hid: { prof: 50, ego: 30, sad: 50 },
    fl: { okul: 1, ...(O.fl || {}) }, cd: {}, q: [], clubId: null, con: null, agent: null,
    inj: 0, ban: 0, banR: '', bench: 0, job: 0, assets: [], spon: [],
    st: { apps: 0, g: 0, a: 0, rs: 0, cs: 0, lg: 0 }, car: { apps: 0, g: 0, a: 0, rs: 0, caps: 0, ng: 0 },
    hist: [], tro: [], news: [], lastR: [], lastAvg: 0, peak: 0, peakC: 0, since: 1,
    gen: {}, rt: {}, lg: {}, sc: {}, rival: null, over: null, tstat: 'mutlu', watch: [], loan: null, cup: null,
  };
  for (const k in Tr.hid || {}) S.hid[k] = clamp(S.hid[k] + Tr.hid[k], 0, 100);
  for (const k in Tr.rel || {}) S.rel[k] = clamp(S.rel[k] + Tr.rel[k], 0, 100);
  for (const k in O.rel || {}) S.rel[k] = clamp(S.rel[k] + O.rel[k], 0, 100);
  for (const L of LEAGUES) {
    if (L.gen) continue;
    S.lg[L.id] = { t: [...L.ids], tb: {}, rd: 0, last: [] };
    for (const id of L.ids) S.rt[id] = CLUBS[id].r;
  }
  genAmateur(o.prov);
  for (const lid in S.lg) initLeague(lid);
  const lid = 'tr' + O.tier;
  // ilk kulüp: forma şansı bulabileceğin güçte bir takım
  const byR = [...S.lg[lid].t].sort((a, b) => S.rt[a] - S.rt[b]), fit = byR.filter(x => S.rt[x] <= OVR() + 1);
  S.clubId = pick(fit.length >= 2 ? fit.slice(-5) : byR.slice(0, 3));
  S.con = { wage: wageFor(S.rt[S.clubId], OVR()), until: 1, role: '11', goalB: 0 };
  S.con.rel = nice(value() * 4);
  initCup();
  S.peak = OVR(); S.peakC = S.rt[S.clubId];
  S.rival = { n: rname('TR'), ovr: OVR() + ri(1, 4), pot: ri(82, 90), c: club(pick(S.lg[lid].t.filter(x => x !== S.clubId))).n };
  addNews(`${club(S.clubId).n} formasıyla ${LMAP[lid].name} macerası başlıyor.`);
  addNews(`Aynı kuşaktan ${S.rival.n} (${S.rival.c}) şimdiden adından söz ettiriyor.`);
  save();
}

// ---------- lig ----------
export const rounds = lid => (S.lg[lid].t.length - 1) * 2;
const plays = (R, w) => Math.floor(w * R / WEEKS) > Math.floor((w - 1) * R / WEEKS);

export function roundPairs(teams, r) {
  const n = teams.length, half = n - 1, rr = r % half, second = r >= half;
  const arr = [teams[0]];
  for (let i = 0; i < half; i++) arr.push(teams[1 + (i + rr) % half]);
  const pairs = [];
  for (let i = 0; i < n / 2; i++) {
    let h = arr[i], a = arr[n - 1 - i];
    if (i === 0 ? rr % 2 === 1 : i % 2 === 1) [h, a] = [a, h];
    if (second) [h, a] = [a, h];
    pairs.push([h, a]);
  }
  return pairs;
}

export function table(lid) {
  const lg = S.lg[lid];
  return lg.t.map(id => { const r = lg.tb[id] || [0, 0, 0, 0, 0, 0]; return { id, p: r[0], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[1] * 3 + r[2], gd: r[4] - r[5] }; })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || club(a.id).n.localeCompare(club(b.id).n, 'tr'));
}

export function scorers(lid) {
  const out = [];
  for (const id of S.lg[lid].t) for (const s of S.sc[id] || []) out.push({ n: s[0], team: id, g: s[1] });
  if (leagueOf(S.clubId) === lid) out.push({ n: S.name, team: S.clubId, g: S.st.lg, me: true });
  return out.sort((a, b) => b.g - a.g || (a.me ? -1 : 1)).slice(0, 10);
}

export function simScore(rh, ra) {
  const d = (rh + 2 - ra) * 0.05;
  return [poisson(clamp(1.35 * Math.exp(d), .2, 4.5)), poisson(clamp(1.1 * Math.exp(-d), .2, 4.5))];
}

function applyRes(lg, h, a, hg, ag, pg = 0) {
  const row = id => lg.tb[id] || (lg.tb[id] = [0, 0, 0, 0, 0, 0]);
  const H = row(h), A = row(a);
  H[0]++; A[0]++; H[4] += hg; H[5] += ag; A[4] += ag; A[5] += hg;
  if (hg > ag) { H[1]++; A[3]++; } else if (hg < ag) { A[1]++; H[3]++; } else { H[2]++; A[2]++; }
  const give = (id, n) => {
    const sc = S.sc[id]; if (!sc) return;
    if (id === S.clubId) n = Math.max(0, n - pg);
    for (let i = 0; i < n; i++) { const r = Math.random(); if (r < .36) sc[0][1]++; else if (r < .6) sc[1][1]++; }
  };
  give(h, hg); give(a, ag);
}

export function fixture() {
  const lid = leagueOf(S.clubId), lg = S.lg[lid], R = rounds(lid);
  if (lg.rd >= R || !plays(R, S.week)) return null;
  const p = roundPairs(lg.t, lg.rd).find(x => x.includes(S.clubId));
  const home = p[0] === S.clubId;
  return { lid, h: p[0], a: p[1], home, opp: home ? p[1] : p[0] };
}

export function role() {
  if (S.inj > 0) return 'sakat';
  if (S.ban > 0) return 'ceza';
  const s = S.rel.hoca * 0.5 + (OVR() - S.rt[S.clubId]) * 3.5 + 28 + (S.fl.kaptan ? 8 : 0);
  return s >= 50 ? '11' : s >= 30 ? 'yedek' : 'yok';
}
export const canPlay = () => { const r = role(); return r === '11' || r === 'yedek'; };
export const slots = () => (fixture() && canPlay() ? 3 : 4);

// ---------- haftalık eylemler ----------
export function fizyoCost() { return Math.max(1500, nice(S.con.wage * 0.3)); }
export function act(id) {
  S.used++;
  switch (id) {
    case 'rest': return ['Dinlendin, bacakların hafifledi.', fx({ en: 20 })];
    case 'aile': return ['Ailenle sofraya oturdun.', fx({ aile: 9, mo: 4 })];
    case 'ark': return ['Arkadaşlarınla vakit geçirdin.', fx({ ark: 10, mo: 5, en: -4 })];
    case 'par': return ['Baş başa güzel bir gün.', fx({ par: 11, mo: 5, en: -3 })];
    case 'job': return ['Vardiyayı çıkardın, paranı aldın.', fx({ para: 2000, en: -12 })];
    case 'okul': return ['Ders çalıştın.', fx({ egt: 5, aile: 2, en: -4 })];
    case 'sosyal': { const g = Math.round((30 + S.rep * S.rep * 2) * rnd(.6, 1.4) * (1 + eff('fol'))); return ['Paylaşımın ilgi gördü.', fx({ fol: g, ego: 1 })]; }
    case 'dil': return ['Dil kursuna gittin.', fx({ para: -3000, dil: 6, en: -3 })];
    case 'fizyo': { const c = fizyoCost(); S.inj = Math.max(0, S.inj - 1); return ['Fizyoterapi iyi geldi; dönüş bir hafta öne çekildi.', fx({ para: -c })]; }
  }
  return ['', []];
}

export function train(tid, mult) {
  S.used++;
  const Tn = TRAIN.find(t => t.id === tid);
  const m = 0.28 * mult * (TRAITS[S.trait].tr || 1) * (1 + eff('tr')) * (Tn.a.length === 1 ? 1.5 : 1);
  const gs = Tn.a.map(k => [k, grow(k, m)]);
  fx({ en: -10, hoca: 0.4, prof: 0.4 });
  let inj = 0;
  if (S.en < 15 && chance(.12)) { inj = ri(1, 3); S.inj = inj; }
  return { gs, inj };
}

export function income() {
  const wage = S.con.wage, cut = S.agent ? Math.round(wage * S.agent.cut) : 0;
  const spon = S.spon.reduce((a, x) => a + x.wk, 0), biz = eff('inc');
  const cost = SHOP.reduce((a, i) => a + (has(i.id) && i.wk ? i.wk : 0), 0);
  return { wage, cut, job: S.job, spon, biz, cost, net: wage - cut + S.job + spon + biz - cost };
}

export function buy(id) {
  const it = SHOP.find(x => x.id === id);
  if (has(id)) { if (it.wk) S.assets = S.assets.filter(x => x !== id); return; }
  if (it.p) { if (S.money < it.p) return; S.money -= it.p; if (id === 'ev') fx({ aile: 10 }); if (id === 'spor') fx({ ego: 8 }); }
  S.assets.push(id);
}

// ---------- hafta sonu ----------
export function endWeek(own, ownCup) {
  const s = S, myL = leagueOf(s.clubId);
  cupRound(ownCup);
  for (const lid in s.lg) {
    const lg = s.lg[lid], R = rounds(lid);
    if (lg.rd >= R || !plays(R, s.week)) continue;
    const res = [];
    for (const [h, a] of roundPairs(lg.t, lg.rd)) {
      let hg, ag, pg = 0;
      if (own && lid === myL && (h === s.clubId || a === s.clubId)) { hg = own.hg; ag = own.ag; pg = own.pg || 0; }
      else[hg, ag] = simScore(s.rt[h], s.rt[a]);
      applyRes(lg, h, a, hg, ag, pg); res.push([h, a, hg, ag]);
    }
    lg.last = res; lg.rd++;
  }
  const inc = income(); s.money += inc.net;
  if (s.money < 0) {
    s.mo = clamp(s.mo - 2, 0, 100);
    const before = s.assets.length;
    s.assets = s.assets.filter(id => !SHOP.find(x => x.id === id).wk);
    if (s.assets.length < before) addNews('Hesap ekside. Haftalık abonelikler iptal edildi.');
  }
  s.spon = s.spon.filter(x => x.until > absWeek());
  s.rel.aile = clamp(s.rel.aile - 1, 0, 100);
  s.rel.ark = clamp(s.rel.ark - 1.2, 0, 100);
  if (s.rel.par != null) s.rel.par = clamp(s.rel.par - (s.fl.evli ? 1 : 1.8), 0, 100);
  // kulüp içi ilişkiler ilgisiz kalınca ortalamaya döner
  s.rel.hoca += (50 - s.rel.hoca) * 0.02; s.rel.takim += (50 - s.rel.takim) * 0.015; s.rel.taraf += (40 - s.rel.taraf) * 0.015;
  s.en = clamp(s.en + 30 + eff('en') - (s.job ? 8 : 0) + (own ? 0 : 6), 0, 100);
  s.mo = clamp(s.mo + (58 + eff('mo') - s.mo) * 0.08, 0, 100);
  if (s.inj > 0) s.inj--; else for (const k in POS[s.pos].w) grow(k, 0.03 * (0.7 + s.rt[s.clubId] / 100));
  if (s.ban > 0) { s.ban--; if (!s.ban) s.banR = ''; }
  const avg = s.st.apps ? s.st.rs / s.st.apps : 6.3;
  const tgt = clamp((s.rt[s.clubId] - 22) * 1.15 + (avg - 6.5) * 8 + s.car.caps * 0.3, 0, 100);
  s.rep = clamp(s.rep + (tgt - s.rep) * 0.04, 0, 100);
  s.fol = Math.round(s.fol + (s.fol * 0.002 + s.rep * s.rep * 0.5) * (1 + eff('fol')));
  if (s.job && s.con.wage > 20000) { s.job = 0; addNews('Maaşın artık yetiyor; fabrikadaki işten ayrıldın.'); }
  watchStep();
  delete s.fl.skip;
  s.peak = Math.max(s.peak, OVR());
  s.used = 0; s.week++;
  return { over: s.week > WEEKS, inc };
}

// ---------- sezon sonu ----------
function rivalStep(lines) {
  const r = S.rival; if (!r) return;
  r.ovr = Math.min(r.pot, Math.round(r.ovr + rnd(4, 8) * (S.age <= 22 ? 1 : .35)));
  const c = [];
  for (const lid in S.lg) for (const id of S.lg[lid].t) if (id !== S.clubId && Math.abs(S.rt[id] - (r.ovr - 1)) <= 3) c.push(id);
  if (c.length) { const n = club(pick(c)).n; if (n !== r.c) { r.c = n; lines.push(`Rakibin ${r.n}, ${n} ile anlaştı.`); } }
}

export function seasonEnd() {
  const s = S, myL = leagueOf(s.clubId), L = LMAP[myL];
  const sorted = {}; for (const lid in s.lg) sorted[lid] = table(lid).map(r => r.id);
  const pos = sorted[myL].indexOf(s.clubId) + 1, n = sorted[myL].length;
  const lines = [], tro = [], label = seasonLabel();
  const st = { ...s.st }, avg = st.apps ? st.rs / st.apps : 0;
  s.hist.push({ y: label, c: club(s.clubId).n, l: L.name, apps: st.apps, g: st.g, a: st.a, avg: +avg.toFixed(2), pos, k: s.loan ? 1 : 0 });
  if (pos === 1) {
    tro.push(`${L.name} Şampiyonluğu`);
    const b = nice(s.con.wage * 12); if (b) { s.money += b; lines.push(`Şampiyonluk primi: ${fmt(b)}`); }
    fx({ mo: 15, taraf: 10 });
  }
  const top = scorers(myL)[0];
  if (top && top.me && st.lg >= 5) tro.push(`${L.name} Gol Krallığı (${st.lg} gol)`);
  tro.forEach(t => s.tro.push(label + ' · ' + t));
  const champ = club(sorted[myL][0]).n;
  let moved = 0;
  for (let i = 0; i < SWAP.length; i++) {
    const up = s.lg[TRT[i]], dn = s.lg[TRT[i + 1]], k = SWAP[i];
    const rel = sorted[TRT[i]].slice(-k), pro = sorted[TRT[i + 1]].slice(0, k);
    up.t = up.t.filter(x => !rel.includes(x)).concat(pro);
    dn.t = dn.t.filter(x => !pro.includes(x)).concat(rel);
    if (pro.includes(s.clubId)) moved = 1;
    if (rel.includes(s.clubId)) moved = -1;
    rel.forEach(x => { s.rt[x] -= 1; }); pro.forEach(x => { s.rt[x] += 1.5; });
  }
  if (moved === 1) { lines.push(`${club(s.clubId).n} bir üst lige yükseldi!`); fx({ mo: 12, taraf: 8 }); const b = nice(s.con.wage * 6); if (b) { s.money += b; lines.push(`Yükselme primi: ${fmt(b)}`); } }
  if (moved === -1) { lines.push(`${club(s.clubId).n} küme düştü.`); fx({ mo: -15, taraf: -10 }); }
  for (const lid in s.lg) {
    const t = s.lg[lid].t, m = t.reduce((a, x) => a + s.rt[x], 0) / t.length;
    for (const id of t) s.rt[id] = clamp(s.rt[id] + randn() * 1.1 + (m - s.rt[id]) * 0.06, 15, 94);
  }
  s.lastAvg = avg || s.lastAvg || 6.3;
  if (s.loan) {
    const lc = s.clubId; s.clubId = s.loan.from; s.loan = null;
    s.rel.hoca = clamp(42 + (avg - 6.5) * 14, 20, 80); s.rel.takim = 45; s.rel.taraf = 35; s.since = s.season + 1; delete s.fl.kaptan;
    lines.push(`Kiralık süren bitti: ${club(s.clubId).n} takımına döndün.`);
    if (avg >= 6.6 && !s.watch.some(w => w.id === lc)) s.watch.push({ id: lc, lv: clamp(50 + (avg - 6.5) * 25, 40, 90) });
  }
  s.car.apps += st.apps; s.car.g += st.g; s.car.a += st.a; s.car.rs += st.rs;
  s.st = { apps: 0, g: 0, a: 0, rs: 0, cs: 0, lg: 0 };
  s.age++; s.season++; s.year++; s.week = 1; s.used = 0; s.bench = 0;
  if (s.age >= 31) {
    const d = (s.age - 30) * 0.45, soft = s.fl.bakim ? 0.6 : 1;
    s.at.hiz -= d * 1.3 * soft; s.at.guc -= d * 0.8 * soft;
    for (const k of ['sut', 'teknik', 'pas', 'savunma', 'kafa', 'kaleci']) s.at[k] -= d * 0.5 * soft;
    s.at.zihin += 0.4;
    for (const k in s.at) s.at[k] = clamp(s.at[k], 1, 99);
    lines.push('Yaş kendini gösteriyor: hızın ve gücün biraz düştü.');
  }
  if (s.fl.okul && s.age >= 19) {
    delete s.fl.okul;
    if (s.egt >= 50) { s.fl.diploma = 1; lines.push('Liseyi bitirdin, diploman cebinde.'); fx({ aile: 8 }); }
    else lines.push('Okulu bitiremedin; diploma alamadın.');
  }
  rivalStep(lines);
  for (const lid in s.lg) initLeague(lid);
  initCup();
  addNews(`${label} sezonu bitti. ${L.name} şampiyonu ${champ}.`);
  return { label, league: L.name, pos, n, champ, st, avg, tro, lines, moved };
}

// ---------- kupa ----------
const CUPW = [5, 10, 16, 23, 29, 35];
const cupRoundName = n => ({ 64: 'Son 64', 32: 'Son 32', 16: 'Son 16', 8: 'Çeyrek final', 4: 'Yarı final', 2: 'Final' }[n] || 'Tur');

export function initCup() {
  const s = S, lid = leagueOf(s.clubId), L = LMAP[lid]; let name, teams;
  const byR = l => [...s.lg[l].t].sort((a, b) => s.rt[b] - s.rt[a]);
  if (L.c === 'TR' && L.tier <= 4) { name = 'Türkiye Kupası'; teams = [...s.lg.tr1.t, ...s.lg.tr2.t, ...s.lg.tr3.t, ...byR('tr4').slice(0, 8)]; }
  else if (L.c === 'TR' && L.tier === 5) { name = 'Bölgesel Kupa'; teams = [...s.lg.tr5.t]; }
  else if (L.c === 'TR') { name = s.prov + ' İl Kupası'; teams = [...s.lg.tr6.t, ...s.lg.tr7.t, ...byR('tr8').slice(0, 4)]; }
  else { name = CUPS[L.c]; teams = byR(lid).slice(0, 16); }
  if (!teams.includes(s.clubId)) teams[teams.length - 1] = s.clubId;
  s.cup = { name, weeks: CUPW.slice(-Math.log2(teams.length)), alive: shuffle(teams), r: 0, hist: [], champ: null };
}

export function cupFixture() {
  const c = S.cup; if (!c || c.champ || S.week !== c.weeks[c.r]) return null;
  const i = c.alive.indexOf(S.clubId); if (i < 0) return null;
  const final = c.alive.length === 2;
  return { cup: true, name: c.name, round: cupRoundName(c.alive.length), opp: c.alive[i ^ 1], home: final ? true : i % 2 === 0, final };
}
export const cupNext = () => { const c = S.cup; return c && !c.champ && c.alive.includes(S.clubId) ? { week: c.weeks[c.r], round: cupRoundName(c.alive.length), opp: c.alive[c.alive.indexOf(S.clubId) ^ 1] } : null; };

// own: {us, opp, win} — oyuncunun oynadığı eşleşmenin sonucu
function cupRound(own) {
  const c = S.cup; if (!c || c.champ || S.week !== c.weeks[c.r]) return;
  const next = [], res = [];
  for (let i = 0; i < c.alive.length; i += 2) {
    const h = c.alive[i], a = c.alive[i + 1]; let hg, ag, w;
    if (own && (h === S.clubId || a === S.clubId)) { const mh = h === S.clubId; hg = mh ? own.us : own.opp; ag = mh ? own.opp : own.us; w = own.win ? S.clubId : (mh ? a : h); }
    else { [hg, ag] = simScore(S.rt[h], S.rt[a]); w = hg > ag ? h : ag > hg ? a : (chance(.5) ? h : a); }
    next.push(w); res.push([h, a, hg, ag, w]);
  }
  c.hist.push({ n: cupRoundName(c.alive.length), res }); c.alive = shuffle(next); c.r++;
  const mine = res.find(x => x[0] === S.clubId || x[1] === S.clubId);
  if (next.length === 1) {
    c.champ = next[0];
    if (c.champ === S.clubId) {
      S.tro.push(seasonLabel() + ' · ' + c.name);
      const b = nice(S.con.wage * 10); S.money += b; fx({ mo: 15, taraf: 10, rep: 3 });
      addNews(`${c.name} sizin! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
  } else if (mine) addNews(mine[4] === S.clubId ? `${c.name}: tur atladınız.` : `${c.name}: elendiniz.`, 'trophy');
}

// ---------- transfer ----------
const baseW = o => 150 * Math.exp((o - 30) * 0.19);
export function wageFor(r, o) { if (r < 30) return 0; return nice(baseW(r) * clamp(1 + (o - r) / 25, .6, 1.5)); }

// Piyasa değeri: güç, yaş ve kalan potansiyel
export function value() {
  const o = OVR(), a = S.age;
  const af = a <= 21 ? 1.5 : a <= 25 ? 1.25 : a <= 28 ? 1 : a <= 31 ? .6 : a <= 33 ? .3 : .12;
  return nice(baseW(o) * 300 * af * (1 + (a <= 23 ? Math.max(0, S.pot - o) / 60 : 0)));
}
// Kulübün satış tutumu
export function stance() {
  if (S.loan) return 'kiralik';
  if (S.rel.hoca < 30 || S.tstat === 'istek') return 'liste';
  if (S.rel.hoca >= 70 && S.con.until > S.season) return 'kilit';
  return 'acik';
}
export function askPrice() { const st = stance(); return nice(value() * (st === 'kilit' ? 1.5 : st === 'liste' ? 0.6 : 1) * (S.con.until <= S.season ? 0.7 : 1)); }
export const interest = lv => lv >= 60 ? 'Teklif hazırlığında' : lv >= 35 ? 'İlgileniyor' : 'İzliyor';

export function setStatus(v) {
  if (S.tstat === v) return [];
  const prev = S.tstat; S.tstat = v;
  if (v === 'istek' && !S.fl.istek) { S.fl.istek = 1; addNews('Transfer isteğin kulüpte bomba etkisi yarattı.', 'swap'); return fx({ hoca: -10, taraf: -8, sad: -8 }); }
  if (v === 'kiralik') return fx({ hoca: -2 });
  if (v === 'mutlu' && prev === 'istek') return fx({ taraf: 3 });
  return [];
}

// Her hafta: izleyen kulüplerin ilgisi formuna göre artar ya da söner
function watchStep() {
  const s = S, o = OVR(), pw = s.agent ? s.agent.pw : 0;
  const f = s.lastR.length ? s.lastR.reduce((a, b) => a + b, 0) / s.lastR.length : 6.3;
  const open = s.tstat === 'acik' ? 1.5 : s.tstat === 'istek' ? 3 : 0;
  for (const w of s.watch) w.lv = clamp(w.lv + (f - 6.6) * 6 + open + pw * 1.5 + rnd(-3, 3), 0, 100);
  s.watch = s.watch.filter(w => w.lv > 3 && w.id !== s.clubId && s.rt[w.id] >= o - 10 && s.rt[w.id] <= o + 7);
  if (s.watch.length < 4 && chance(clamp(0.05 + (f - 6.5) * 0.07 + pw * 0.05 + (open ? 0.05 : 0), .01, .35))) {
    const cur = s.rt[s.clubId], pool = [];
    for (const lid in s.lg) {
      if (LMAP[lid].c !== 'TR' && s.rep < 40) continue;
      for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id !== s.clubId && r >= o - 8 && r <= o + 5 && !s.watch.some(w => w.id === id)) { pool.push(id); if (r > cur) pool.push(id); } }
    }
    if (pool.length) { const id = pick(pool); s.watch.push({ id, lv: ri(14, 32) }); addNews(`${club(id).n} scoutları seni izlemeye başladı.`, 'eye'); }
  }
}

export function makeOffer(id, x = {}) {
  const r = S.rt[id], o = OVR(), d = o - r;
  const wage = nice(wageFor(r, o) * (1 + (S.agent ? S.agent.pw * 0.25 : 0)));
  return { id, r, role: d >= 2 ? '11' : d >= -4 ? 'rot' : 'genc', wage, len: ri(1, 3) + (S.age < 24 ? 1 : 0), sign: nice(wage * ri(3, 10)), goalB: nice(wage * 0.15), st: 'ok', ...x };
}

export function renewal() {
  if (S.rel.hoca < 35 || S.loan) return null;
  const o = makeOffer(S.clubId); o.renew = true; o.wage = Math.max(o.wage, nice(S.con.wage * 1.1)); o.sign = nice(o.wage * 2);
  return o;
}

// Teklifler izleyen kulüplerden gelir. Sözleşmen sürüyorsa kulübün bonservis bedelini onaylaması gerekir.
export function genOffers(kind) {
  const s = S, o = OVR(), out = [], free = kind === 'serbest' || s.con.until < s.season;
  const th = free ? 25 : kind === 'kis' ? 62 : 55;
  for (const w of [...s.watch].sort((a, b) => b.lv - a.lv)) {
    if (out.length >= 3 || w.lv < th || w.id === s.clubId) continue;
    const of = makeOffer(w.id);
    if (!free) { of.fee = nice(value() * rnd(.75, 1.35)); of.ask = askPrice(); of.st = of.fee >= of.ask || of.fee >= (s.con.rel || Infinity) ? 'ok' : 'red'; }
    out.push(of);
  }
  if (!free && !s.loan && s.con.until > s.season && (s.tstat === 'kiralik' || role() === 'yok' || s.bench >= 2)) {
    const cur = s.rt[s.clubId], cc = LMAP[leagueOf(s.clubId)].c, pool = [];
    for (const lid in s.lg) { if (LMAP[lid].c !== cc) continue; for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id !== s.clubId && r < cur - 1 && r >= o - 6 && r <= o + 2) pool.push(id); } }
    shuffle(pool).slice(0, s.tstat === 'kiralik' ? 2 : 1).forEach(id => out.push(makeOffer(id, { loan: true, len: 1, wage: s.con.wage, sign: 0, goalB: s.con.goalB || 0 })));
  }
  if (free && !out.length) {
    const all = [];
    for (const lid of TRT) for (const id of s.lg[lid].t) if (id !== s.clubId) all.push(id);
    all.sort((a, b) => Math.abs(s.rt[a] - (o - 3)) - Math.abs(s.rt[b] - (o - 3)));
    out.push(makeOffer(all[ri(0, 3)]));
  }
  return out;
}

export function negotiate(o) {
  o.neg = true;
  const p = 0.3 + (S.agent ? S.agent.pw * 0.4 : 0) + (OVR() - o.r) * 0.03;
  if (chance(clamp(p, .1, .9))) { o.wage = nice(o.wage * 1.15); o.sign = nice(o.sign * 1.15); o.goalB = nice(o.wage * 0.15); return { text: 'Kulüp şartlarını kabul etti. Ücret %15 arttı.' }; }
  if (!o.renew && chance(.3)) return { gone: true, text: 'Kulüp masadan kalktı. Teklif geri çekildi.' };
  return { text: 'Kulüp teklifini yükseltmedi. Mevcut şartlar geçerli.' };
}

// Kulübün reddettiği teklif için bastır: transfer isteği verilir, kulüp direnebilir.
export function pushTransfer(of) {
  of.pushed = true;
  const ch = setStatus('istek');
  if (chance(clamp(0.35 + (of.fee / of.ask - 0.5), .15, .9))) { of.st = 'ok'; return { ok: true, ch, text: 'Yönetim direnmedi. Teklif kabul edildi.' }; }
  return { ok: false, ch, text: 'Yönetim geri adım atmadı: "Sözleşmesi var, satmıyoruz."' };
}

export function acceptOffer(o) {
  const s = S, cut = s.agent ? s.agent.cut : 0, move = o.id !== s.clubId;
  if (move) {
    if (!o.loan && s.con.until >= s.season) s.hid.sad = clamp(s.hid.sad - 6, 0, 100);
    if (o.loan) s.loan = { from: s.clubId, back: s.season }; else s.loan = null;
    s.clubId = o.id;
    s.rel.hoca = { '11': 60, rot: 46, genc: 34 }[o.role];
    s.rel.takim = 45; s.rel.taraf = clamp(28 + s.rep * 0.3, 0, 100);
    s.bench = 0; s.since = s.season; s.watch = []; s.tstat = 'mutlu';
    delete s.fl.kaptan; delete s.fl.dilBar; delete s.fl.istek;
    const L = LMAP[leagueOf(o.id)];
    if (L.c !== 'TR') { s.fl.yurtdisi = 1; if (s.dil < 40 && !(L.c === 'DE' && s.fl.gurbet)) s.fl.dilBar = 1; }
    s.peakC = Math.max(s.peakC, s.rt[o.id]);
  }
  if (o.loan) { addNews(`${club(o.id).n} takımına sezon sonuna kadar kiralandın.`, 'swap'); return; }
  s.money += Math.round(o.sign * (1 - cut));
  if (move) addNews(o.fee ? `${club(o.id).n}, bonservisin için ${fmtS(o.fee)} ödedi. ${o.len} yıllık imza.` : `${club(o.id).n} ile ${o.len} yıllık sözleşme imzaladın.`, 'swap');
  else { s.rel.hoca = clamp(s.rel.hoca + 5, 0, 100); s.hid.sad = clamp(s.hid.sad + 5, 0, 100); addNews(`${club(o.id).n} ile sözleşme yeniledin.`, 'pen'); }
  s.con = { wage: o.wage, until: s.season + o.len - 1, role: o.role, goalB: o.goalB || 0 };
  s.con.rel = nice(value() * 4);
}

// ---------- milli takım ----------
export function natFixture() {
  const s = S; if (s.week !== 12 && s.week !== 30) return null;
  if (s.inj > 0 || s.ban > 0) return null;
  const o = OVR(); let lvl = null;
  if (o >= 73 && s.rep >= 45) lvl = 'A'; else if (s.age <= 21 && o >= 56) lvl = 'U21';
  if (!lvl) return null;
  const me = s.nat === 'DE' ? 'Almanya' : 'Türkiye';
  const us = NATIONS.find(x => x[0] === me), op = pick(NATIONS.filter(x => x[0] !== me));
  const d = lvl === 'A' ? 0 : -16, suf = lvl === 'A' ? '' : ' U21';
  return { nat: true, lvl, usN: us[0] + suf, usR: us[1] + d, opp: { n: op[0] + suf, r: op[1] + d } };
}

// ---------- maç ----------
const MATTR = { sut: ['sut'], kafa: ['kafa'], frikik: ['sut', 'teknik'], penalti: ['sut', 'zihin'], pas: ['pas'], calim: ['teknik'], savunma: ['savunma'], kurtaris: ['kaleci'] };
const XP = { sut: ['sut', 'zihin'], kafa: ['kafa', 'guc'], frikik: ['sut', 'teknik'], penalti: ['zihin', 'sut'], pas: ['pas', 'zihin'], calim: ['teknik', 'hiz'], savunma: ['savunma', 'guc'], kurtaris: ['kaleci', 'zihin'] };
export const GOOD = ['gol', 'ok', 'gecti', 'kapildi', 'kurtardi'];
export function skillFor(k) { const a = MATTR[k]; return a.reduce((s, x) => s + S.at[x], 0) / a.length + (has('krampon') ? 2 : 0); }

export function buildMatch(fxt, rl) {
  const nat = !!fxt.nat;
  const usR = nat ? fxt.usR : S.rt[S.clubId], oppR = nat ? fxt.opp.r : S.rt[fxt.opp];
  const hb = nat || fxt.final ? 0 : (fxt.home ? 2 : -2), def = S.pos === 'DF' || S.pos === 'KL';
  const lu = 1.3 * Math.exp((usR + hb - oppR) * 0.05) * (def ? 0.95 : 0.6);
  const lo = 1.2 * Math.exp((oppR - hb - usR) * 0.05) * (S.pos === 'KL' ? 0.25 : def ? 0.55 : 0.95);
  const tl = [];
  for (let i = poisson(clamp(lu, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: true });
  for (let i = poisson(clamp(lo, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: false });
  const from = rl === 'yedek' ? ri(58, 70) : 1, n = rl === 'yedek' ? ri(1, 2) : ri(3, 5);
  for (let i = 0; i < n; i++) tl.push({ min: ri(from + 1, 90), t: 'mom', k: wpick(POS[S.pos].m) });
  shuffle([...FILL]).slice(0, 4).forEach(x => tl.push({ min: ri(3, 88), t: 'txt', s: x }));
  if (rl === 'yedek') tl.push({ min: from, t: 'txt', s: 'Hoca seni çağırdı. Oyuna giriyorsun!' });
  tl.sort((a, b) => a.min - b.min || (a.t === 'txt' ? -1 : 1));
  return { fxt, nat, cup: !!fxt.cup, role: rl, usR, oppR, tl, usG: 0, oppG: 0, pg: 0, pa: 0, rt: 6, yel: 0, red: false, mom: 0, ok: 0 };
}

export function simMoment(k, M) {
  const base = { sut: .2, kafa: .17, frikik: .08, penalti: .76, pas: .62, calim: .45, savunma: .58, kurtaris: .74 }[k];
  const shot = k === 'sut' || k === 'kafa' || k === 'frikik';
  const ok = chance(clamp(base + (skillFor(k) - M.oppR) * (shot ? 0.008 : 0.013), .05, shot ? .42 : .92));
  switch (k) {
    case 'pas': return ok ? { out: 'ok', adv: chance(.5) } : { out: pick(['kesildi', 'bos']) };
    case 'calim': return { out: ok ? 'gecti' : 'kaptirdi' };
    case 'savunma': return { out: ok ? 'kapildi' : chance(.2) ? 'faul' : 'gecildi' };
    case 'kurtaris': return { out: ok ? 'kurtardi' : 'yedi' };
    default: return { out: ok ? 'gol' : pick(['kurtaris', 'kurtaris', 'aut', 'direk']) };
  }
}

export function applyMoment(M, k, res) {
  const out = res.out, me = S.name.split(' ').slice(-1)[0], lines = []; let chain = null;
  const good = GOOD.includes(out);
  M.mom++; if (good) M.ok++;
  XP[k].forEach(a => grow(a, good ? 0.04 : 0.02));
  const mate = !M.nat && S.sc[S.clubId] ? pick(S.sc[S.clubId])[0] : 'takım arkadaşın';
  if (k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'penalti') {
    if (out === 'gol') {
      M.usG++; M.pg++; M.rt += k === 'penalti' ? 0.8 : 1.2;
      lines.push({ s: `GOL! ${me} ${k === 'kafa' ? 'kafayla ağları buldu' : k === 'frikik' ? 'frikikten harika attı' : k === 'penalti' ? 'penaltıyı gole çevirdi' : 'topu ağlara gönderdi'}!`, c: 'g' });
    } else if (out === 'kurtaris') { M.rt += k === 'penalti' ? -0.6 : 0.1; lines.push({ s: 'Kaleci vuruşunu çıkardı.' }); }
    else if (out === 'direk') { M.rt += 0.05; lines.push({ s: 'Direk! Top oyun alanında kaldı.' }); }
    else if (out === 'baraj') { M.rt -= 0.1; lines.push({ s: 'Vuruşun barajda kaldı.' }); }
    else if (out === 'blok') { M.rt -= 0.1; lines.push({ s: 'Vuruşun savunmaya çarptı.' }); }
    else if (out === 'gec') { M.rt -= 0.25; lines.push({ s: 'Çok bekledin, top ayağından alındı.' }); }
    else if (out === 'iska') { M.rt -= 0.2; lines.push({ s: 'Topa vuramadın.' }); }
    else { M.rt -= k === 'penalti' ? 0.7 : 0.2; lines.push({ s: 'Vuruşun çerçeveyi bulmadı.' }); }
  } else if (k === 'pas') {
    if (out === 'ok') {
      if (chance(res.adv ? .35 : .12)) { M.usG++; M.pa++; M.rt += 0.8; lines.push({ s: `GOL! ${me} asist yaptı, ${mate} tamamladı!`, c: 'g' }); }
      else { M.rt += 0.35; lines.push({ s: 'Pasın yerini buldu, atak sürdü.' }); }
    } else if (out === 'kesildi') {
      M.rt -= 0.3; lines.push({ s: 'Pasın kesildi.' });
      if (chance(.15)) { M.oppG++; M.rt -= 0.2; lines.push({ s: 'Kontra atak golle bitti.', c: 'b' }); }
    } else { M.rt -= 0.2; lines.push({ s: 'Pasın kimseyi bulmadı.' }); }
  } else if (k === 'calim') {
    if (out === 'gecti') { M.rt += 0.4; chain = 'sut'; lines.push({ s: 'Savunmayı ipe dizdin, kaleciyle karşı karşıyasın!' }); }
    else { M.rt -= 0.25; lines.push({ s: 'Topu kaptırdın.' }); }
  } else if (k === 'savunma') {
    if (out === 'kapildi') { M.rt += 0.5; lines.push({ s: 'Tertemiz müdahale, top sende.' }); }
    else if (out === 'gecildi') {
      M.rt -= 0.4; lines.push({ s: 'Rakip seni geçti.' });
      if (chance(.45)) { M.oppG++; M.rt -= 0.2; lines.push({ s: 'Pozisyon golle sonuçlandı.', c: 'b' }); }
    } else {
      M.rt -= 0.2; lines.push({ s: 'Arkadan müdahale: faul.' });
      if (chance(.6)) {
        M.yel++;
        if (M.yel >= 2) { M.red = true; M.rt -= 1.5; lines.push({ s: 'İkinci sarı! Kırmızı kart gördün.', c: 'b' }); }
        else lines.push({ s: 'Sarı kart gördün.' });
      }
      if (chance(.18)) { if (chance(.76)) { M.oppG++; lines.push({ s: 'Hakem penaltıyı gösterdi; rakip affetmedi.', c: 'b' }); } else lines.push({ s: 'Penaltı! Ama kaleciniz kurtardı.' }); }
    }
  } else if (k === 'kurtaris') {
    if (out === 'kurtardi') { M.rt += 0.45; lines.push({ s: 'Harika kurtarış!' }); }
    else { M.oppG++; M.rt -= 0.5; lines.push({ s: 'Top ağlarda.', c: 'b' }); }
  }
  return { lines, chain };
}

export function postMatch(M) {
  const s = S, def = s.pos === 'DF' || s.pos === 'KL', win = M.usG > M.oppG, lose = M.usG < M.oppG, lines = [];
  if (def && M.oppG === 0 && M.role === '11') M.rt += 0.6;
  M.rt += win ? 0.3 : lose ? -0.2 : 0;
  if (M.role === 'yedek') M.rt = 6 + (M.rt - 6) * 0.8;
  M.rt = clamp(Math.round(M.rt * 10) / 10, 3, 10);
  const rt = M.rt, cr = s.rt[s.clubId];
  if (M.nat) {
    s.car.caps++; s.car.ng += M.pg;
    fx({ rep: 1.5 + M.pg, mo: win ? 6 : 0 });
    lines.push(`${s.car.caps}. milli maçın.`);
  } else {
    s.st.apps++; s.st.g += M.pg; s.st.a += M.pa; s.st.rs += rt; if (!M.cup) s.st.lg += M.pg;
    if (def && M.oppG === 0) s.st.cs++;
    fx({ hoca: (rt - 6.6) * 2.2, takim: (rt - 6.5) * 1 + (win ? 0.6 : 0), taraf: (rt - 6.5) * 1.3 + M.pg * 0.8 });
    const prim = win ? nice(s.con.wage * 0.25) : 0, gb = (s.con.goalB || 0) * M.pg;
    if (prim + gb > 0) { s.money += prim + gb; lines.push(`Prim: ${fmt(prim + gb)}`); }
    s.lastR.push(rt); if (s.lastR.length > 5) s.lastR.shift();
    s.bench = 0;
    if (M.red) { s.ban = Math.max(s.ban, 1); s.banR = 'Kırmızı kart cezası'; lines.push('Gelecek hafta cezalısın.'); }
    if (s.fl.scout) { delete s.fl.scout; if (rt >= 7) s.q.push({ id: 'deneme', at: absWeek() + 1 }); else lines.push('Scout notlarını aldı ama pek etkilenmiş görünmüyordu.'); }
    if (rt >= 8.5 && M.pg >= 2 && (s.cd.viral || 0) <= absWeek() && !s.q.some(q => q.id === 'viral')) s.q.push({ id: 'viral', at: absWeek() + 1 });
  }
  fx({ mo: (win ? 6 : lose ? -5 : 0) + (rt - 6.5) * 3 });
  const tf = Math.exp((cr - 25) * 0.14) * 4 * (1 + eff('fol'));
  const fg = Math.round(Math.max(0, rt - 5.5) * tf + M.pg * tf * 2);
  if (fg > 0) { s.fol += fg; lines.push(`Takipçi +${fg.toLocaleString('tr-TR')}`); }
  const tired = s.en < 30 ? .06 : s.en < 45 ? .025 : 0;
  s.en = clamp(s.en - (M.cup ? 12 : M.role === '11' ? 18 : 9), 0, 100);
  if (chance((0.015 + tired) * (M.role === '11' ? 1 : .5))) {
    const r = Math.random();
    if (r < .7) { s.inj = ri(1, 3); lines.push(`Maçta sakatlandın: ${s.inj} hafta yoksun.`); }
    else if (r < .92) { s.inj = ri(4, 8); lines.push(`Kas yırtığı: ${s.inj} hafta yoksun.`); }
    else { s.inj = 6; s.fl.agir = 1; lines.push('Dizinden ağır sakatlandın. Doktorlar seninle konuşmak istiyor.'); }
  }
  return { rt, lines, win, lose };
}

// ---------- emeklilik ----------
export function retire() {
  const s = S, t = tot(), avg = t.apps ? t.rs / t.apps : 0;
  // seviye ağırlıklı: oynadığın en güçlü kulüp ve itibar, ham sayılardan daha çok sayılır
  const score = Math.round(Math.max(0, s.peakC - 20) * 10 + s.rep * 6 + s.tro.length * 30 + s.car.caps * 4 + t.g * 1.5 + t.a + t.apps * 0.25 + Math.max(0, avg - 6) * 150);
  const title = score < 450 ? 'Mahalle Emektarı' : score < 900 ? 'Lig Emektarı' : score < 1500 ? 'Sevilen Yıldız' : score < 2200 ? 'Ulusal Yıldız' : 'Efsane';
  const m = meta();
  m.leg = Math.max(m.leg || 0, Math.min(6, Math.floor(score / 400)));
  m.n = (m.n || 0) + 1; m.best = Math.max(m.best || 0, score);
  m.heir = s.fl.cocuk ? s.name.split(' ').slice(-1)[0] : null;
  setMeta(m);
  return { score, title, t, avg, leg: m.leg };
}
