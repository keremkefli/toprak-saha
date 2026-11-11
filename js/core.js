// Toprak Saha — oyun çekirdeği: durum, lig simülasyonu, sezon, transfer, ekonomi
import { LEAGUES, LMAP, CLUBS, PAL, PROV, NAMES, POS, ATTR, ORIGINS, TRAITS, SHOP, TRAIN, NATIONS, FILL, CUPS, PERKS, HANG, POSTS, FANS, ACH, HT, BUILD, STYLES, CELE, NET, MACT, DERBY } from './data.js';

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
    S.perks ??= []; S.pp ??= 0; S.px ??= 0; S.ach ??= {}; S.feed ??= []; S.pop ??= []; S.mr ??= []; S.feedNew ??= 0; S.awards ??= 0;
    if (S.dream === undefined) S.dream = SAK();
    if (!S.euro) initEuro(euroQual());
    for (const id in S.gen) if (!S.gen[id].c2) S.gen[id].c2 = '#f2f2f2';   // eski kayıtlarda boş kalan ikinci renk
    S.net ??= []; S.diff ??= 'normal'; if (!S.mates || !S.mates.length) genMates(); if (!S.quest) newQuest();
    S.fu ??= []; S.num ??= 9; S.cele ??= 'kayarak'; S.nick ??= ''; if (!S.refs || !S.refs.length) initRefs();
    S.assets = S.assets.filter(id => SHOP.some(x => x.id === id));
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
// Lig kuralları (2025/26 statülerine göre, tek gruba sadeleştirilmiş).
// up: doğrudan yükselen, po: play-off türü ve başladığı sıra, down: doğrudan düşen, out: play-out (kaybeden düşer)
const RULES = {
  tr1: { down: 3 },
  tr2: { up: 2, po: 'p5', from: 3, down: 4 },      // 3-7 play-off, 3. doğrudan finalde
  tr3: { up: 2, po: 'p4x2', from: 3, down: 2 },    // iki play-off maçının galipleri çıkar
  tr4: { up: 1, po: 'p4', from: 2, down: 2 },      // 2-5 play-off
  tr5: { up: 1, po: 'p4', from: 2, down: 1, out: 1 },
  tr6: { up: 1, po: 'p2', from: 2, down: 1, out: 1 },   // şampiyon doğrudan, 2. ile 3. play-off
  tr7: { up: 1, po: 'p4', from: 2, down: 1, out: 1 },
  tr8: { up: 1, po: 'p4', from: 2, down: 0 },
};
const POSIZE = { p5: 5, p4: 4, p4x2: 4, p2: 2 }, PON = { p4: ['Yarı final', 'Final'], p5: ['Çeyrek final', 'Yarı final', 'Final'], p4x2: ['Final'], p2: ['Final'], o2: ['Play-out'] };
export function zones(lid) { const R = RULES[lid]; if (!R) return { up: 1, po: 0, down: 0, out: 0 }; return { up: R.up || (lid === 'tr1' ? 1 : 0), po: R.po ? POSIZE[R.po] : 0, down: R.down || 0, out: R.out ? 2 : 0 }; }
// Yerel amatör liglerde "yaşı küçük futbolcu" kuralı: ilk yarıda sahada genç oyuncu zorunlu, forma şansın artar
export const youngRule = () => S.age <= 20 && LMAP[leagueOf(S.clubId)].c === 'TR' && tier() >= 6;
export function rname(c) { const N = NAMES[c] || NAMES.TR; return pick(N.f) + ' ' + pick(N.l); }

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
      const a = keys[h % keys.length]; let b = ['W', 'K', 'Y', 'W'][(h >>> 4) % 4]; if (b === a) b = 'W';
      S.gen[id] = { n, c1: PAL[a], c2: PAL[b] };
      S.rt[id] = Math.round(rnd(rng[ti][0], rng[ti][1]));
      S.lg[lid].t.push(id);
    });
  });
}

function initLeague(lid) {
  const lg = S.lg[lid], c = LMAP[lid].c;
  shuffle(lg.t); lg.tb = {}; lg.rd = 0; lg.last = []; delete lg.res;
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
  for (const mod of [HT[o.ht], BUILD[o.build], (STYLES[o.pos] || [])[o.style]]) for (const k in (mod && mod.at) || {}) at[k] += mod.at[k];
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
    gen: {}, rt: {}, lg: {}, sc: {}, rival: null, over: null, tstat: 'mutlu', watch: [], loan: null, cup: null, euro: null, dream: null, perks: [], pp: 0, px: 0, ach: {}, feed: [], feedNew: 0, pop: [], mr: [], awards: 0, refs: [], refi: 0, fu: [], mates: [], net: [], quest: null, po: null, diff: o.diff || 'normal', num: clamp(+o.num || 9, 1, 99), cele: o.cele || 'kayarak', nick: o.nick || '', ht: o.ht || 'orta', build: o.build || 'atletik', style: o.style || 0,
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
  initCup(); initEuro(euroQual()); S.dream = SAK(); initRefs(); assignRef(); genMates(); newQuest();
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
  const rows = lg.t.map(id => { const r = lg.tb[id] || [0, 0, 0, 0, 0, 0]; return { id, p: r[0], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[1] * 3 + r[2], gd: r[4] - r[5] }; });
  const base = (a, b) => b.gd - a.gd || b.gf - a.gf || club(a.id).n.localeCompare(club(b.id).n, 'tr');
  rows.sort((a, b) => b.pts - a.pts || base(a, b));
  if (!lg.res) return rows;
  // puan eşitliğinde önce aralarındaki maçlar (ikili averaj), sonra genel averaj
  for (let i = 0; i < rows.length;) {
    let j = i; while (j < rows.length && rows[j].pts === rows[i].pts) j++;
    if (j - i > 1 && rows[i].p > 0) {
      const ids = new Set(rows.slice(i, j).map(r => r.id)), hp = {}, hg = {};
      for (const [h, a2, x, y] of lg.res) if (ids.has(h) && ids.has(a2)) { hg[h] = (hg[h] || 0) + x - y; hg[a2] = (hg[a2] || 0) + y - x; if (x > y) hp[h] = (hp[h] || 0) + 3; else if (y > x) hp[a2] = (hp[a2] || 0) + 3; else { hp[h] = (hp[h] || 0) + 1; hp[a2] = (hp[a2] || 0) + 1; } }
      const part = rows.slice(i, j).sort((a2, b2) => (hp[b2.id] || 0) - (hp[a2.id] || 0) || (hg[b2.id] || 0) - (hg[a2.id] || 0) || base(a2, b2));
      rows.splice(i, j - i, ...part);
    }
    i = j;
  }
  return rows;
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
  const s = S.rel.hoca * 0.5 + (OVR() - S.rt[S.clubId]) * 3.5 + 28 + (S.fl.kaptan ? 8 : 0) + (youngRule() ? 12 : 0);
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
  S.used++; questHit('train');
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

// Sezonluk anlaşma bedeli: sezonun kalan kısmı kadar ödenir
export const yrPrice = it => nice(it.yr * (WEEKS - S.week + 1) / WEEKS);
export function buy(id) {
  const it = SHOP.find(x => x.id === id);
  if (has(id)) return;
  const price = it.p || yrPrice(it);
  if (S.money < price) return;
  S.money -= price;
  if (id === 'ev') fx({ aile: 10 }); if (id === 'spor') fx({ ego: 8 });
  S.assets.push(id);
}

// ---------- hafta sonu ----------
export function endWeek(own, ownCup, ownEuro) {
  const s = S, myL = leagueOf(s.clubId);
  cupRound(ownCup, 'cup'); cupRound(ownEuro, 'euro');
  for (const lid in s.lg) {
    const lg = s.lg[lid], R = rounds(lid);
    if (lg.rd >= R || !plays(R, s.week)) continue;
    const res = [];
    for (const [h, a] of roundPairs(lg.t, lg.rd)) {
      let hg, ag, pg = 0;
      if (own && lid === myL && (h === s.clubId || a === s.clubId)) { hg = own.hg; ag = own.ag; pg = own.pg || 0; }
      else[hg, ag] = simScore(s.rt[h], s.rt[a]);
      applyRes(lg, h, a, hg, ag, pg); res.push([h, a, hg, ag]);
      if (lid === myL) (lg.res || (lg.res = [])).push([h, a, hg, ag]);
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
  watchStep(); feedWeek(); checkAch();
  for (const m of s.mates) m.b = clamp(m.b - .5, 0, 100);
  for (const c of s.net) c.b = clamp(c.b - .7, 0, 100);
  for (const c of s.net.filter(x => x.b < 4)) addNews(`${c.n} ile bağın koptu.`, 'users');
  s.net = s.net.filter(x => x.b >= 4);
  s.rel.takim += (chem() * 100 - s.rel.takim) * .03;   // soyunma odası havası, yakın olduğun isimlere bağlı
  newQuest(); delete s.fl.rehabw;
  if (s.week % 4 === 0) {
    if (s.mr.length >= 3 && s.mr.reduce((a, b) => a + b, 0) / s.mr.length >= 7.6) {
      const b = nice(Math.max(1000, s.con.wage)); s.money += b; s.awards++; fx({ rep: 1, mo: 5 }); unlock('ay');
      s.pop.push('Ayın oyuncusu seçildin'); addNews(`Ayın oyuncusu seçildin. Ödül: ${fmt(b)}`, 'star');
      addFeed('c:' + s.clubId, club(s.clubId).n, `Ayın oyuncusu: ${s.name}. Tebrikler!`, 'kulup');
    }
    s.mr = [];
  }
  delete s.fl.skip;
  s.peak = Math.max(s.peak, OVR());
  s.used = 0; s.week++;
  if (s.week <= WEEKS) assignRef();
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
  const eq = euroQual(sorted);
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
  if (st.apps >= 20 && avg >= 7.3) { tro.push('Yılın 11\'i'); unlock('yil11'); }
  // sezon sonu ödül töreni
  if (st.apps >= 22 && avg >= 7.7) tro.push(`${L.name} Yılın Futbolcusu`);
  if (s.age <= 21 && st.apps >= 18 && avg >= 7.2) tro.push('Yılın Genç Oyuncusu');
  if (s.fl.rov) { if (chance(.35)) tro.push('Yılın Golü (röveşata)'); delete s.fl.rov; }
  tro.forEach(t => s.tro.push(label + ' · ' + t));
  const champ = club(sorted[myL][0]).n;
  let moved = 0;
  if (!s.po) { initPlayoffs(); while (poPending()) poRound(); }   // arayüz oynatmadıysa simüle et
  const poOf = (lid, key) => s.po.list.filter(x => x.lid === lid).flatMap(x => x[key]);
  for (let i = 0; i < TRT.length - 1; i++) {
    const U = TRT[i], D = TRT[i + 1], up = s.lg[U], dn = s.lg[D];
    const rel = [...sorted[U].slice(sorted[U].length - RULES[U].down), ...poOf(U, 'down')], pro = [...sorted[D].slice(0, RULES[D].up), ...poOf(D, 'up')];
    up.t = up.t.filter(x => !rel.includes(x)).concat(pro);
    dn.t = dn.t.filter(x => !pro.includes(x)).concat(rel);
    if (pro.includes(s.clubId)) moved = 1;
    if (rel.includes(s.clubId)) moved = -1;
    rel.forEach(x => { s.rt[x] -= 1; }); pro.forEach(x => { s.rt[x] += 1.5; });
  }
  s.po = null;
  if (moved === 1) { lines.push(`${club(s.clubId).n} bir üst lige yükseldi!`); fx({ mo: 12, taraf: 8 }); const b = nice(s.con.wage * 6); if (b) { s.money += b; lines.push(`Yükselme primi: ${fmt(b)}`); } }
  if (moved === -1) { lines.push(`${club(s.clubId).n} küme düştü.`); fx({ mo: -15, taraf: -10 }); }
  for (const lid in s.lg) {
    const t = s.lg[lid].t, m = t.reduce((a, x) => a + s.rt[x], 0) / t.length;
    for (const id of t) s.rt[id] = clamp(s.rt[id] + randn() * 1.1 + (m - s.rt[id]) * 0.06, 15, 94);
  }
  s.lastAvg = avg || s.lastAvg || 6.3;
  if (s.loan) {
    const lc = s.clubId; matesToNet(); s.clubId = s.loan.from; s.loan = null; genMates();
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
  initCup(); initEuro(eq);
  const exp = s.assets.filter(id => SHOP.find(x => x.id === id).yr);
  if (exp.length) { s.assets = s.assets.filter(id => !exp.includes(id)); lines.push('Sezonluk anlaşmaların bitti: ' + exp.map(id => SHOP.find(x => x.id === id).n).join(', ') + '.'); }
  gainXp(2);
  for (const r of s.refs) r.me = clamp(r.me * .5, -1, .6);   // hakemler zamanla unutur
  addNews(`${label} sezonu bitti. ${L.name} şampiyonu ${champ}.`);
  return { label, league: L.name, pos, n, champ, st, avg, tro, lines, moved };
}

// ---------- kupalar: 'cup' ülke kupası, 'euro' Avrupa Kupası ----------
const CUPW = [5, 10, 16, 23, 29, 35], EUROW = [7, 13, 19, 26, 33];
const EQ = { tr1: 4, en1: 5, es1: 5, de1: 4, it1: 4, fr1: 4, nl1: 3, pt1: 3 }; // Avrupa kontenjanları (32 takım)
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
// Önceki sezonun sıralamasına (ilk sezonda güce) göre Avrupa'ya gidenler
function euroQual(sorted) { const out = []; for (const l in EQ) out.push(...(sorted ? sorted[l] : [...S.lg[l].t].sort((a, b) => S.rt[b] - S.rt[a])).slice(0, EQ[l])); return out; }
function initEuro(q) { S.euro = { name: 'Avrupa Kupası', weeks: EUROW, alive: shuffle([...q]), r: 0, hist: [], champ: null }; }

export function cupFixture(k = 'cup') {
  const c = S[k]; if (!c || c.champ || S.week !== c.weeks[c.r]) return null;
  const i = c.alive.indexOf(S.clubId); if (i < 0) return null;
  const final = c.alive.length === 2;
  return { cup: true, key: k, name: c.name, round: cupRoundName(c.alive.length), opp: c.alive[i ^ 1], home: final ? true : i % 2 === 0, final };
}
export const cupNext = (k = 'cup') => { const c = S[k]; return c && !c.champ && c.alive.includes(S.clubId) ? { week: c.weeks[c.r], round: cupRoundName(c.alive.length), opp: c.alive[c.alive.indexOf(S.clubId) ^ 1] } : null; };

// own: {us, opp, win} — oyuncunun oynadığı eşleşmenin sonucu
function cupRound(own, k) {
  const c = S[k]; if (!c || c.champ || S.week !== c.weeks[c.r]) return;
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
      const b = nice(S.con.wage * (k === 'euro' ? 20 : 10)); S.money += b; fx({ mo: 15, taraf: 10, rep: k === 'euro' ? 6 : 3 });
      unlock(k === 'euro' ? 'avrupa' : 'kupa');
      addNews(`${c.name} sizin! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
    addFeed('basin', 'Saha Kenarı', `${c.name} şampiyonu: ${club(c.champ).n}!`, 'manset');
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
    if (pool.length) { const id = pick(pool); s.watch.push({ id, lv: ri(14, 32) }); addNews(`${club(id).n} scoutları seni izlemeye başladı.`, 'eye'); addFeed('basin', 'Transfer Hattı', say('rumor', { c: club(id).n, me: s.name }), 'haber'); }
  }
  // hayal takımı: seviyen yaklaşınca kendiliğinden radarına girersin
  const dr = s.dream;
  if (dr && dr !== s.clubId && !s.watch.some(w => w.id === dr) && o >= s.rt[dr] - 7 && (LMAP[leagueOf(dr)].c === 'TR' || s.rep >= 40) && chance(.15)) {
    s.watch.push({ id: dr, lv: ri(26, 40) }); s.pop.push(`${club(dr).n} seni izliyor`);
    addNews(`Hayalindeki kulüp ${club(dr).n} seni izliyor!`, 'heart'); addFeed('basin', 'Transfer Hattı', `${club(dr).n}, ${s.name} dosyasını açtı.`, 'manset');
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
    matesToNet(); s.clubId = o.id; genMates();
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
  if (move) addFeed('basin', 'Transfer Hattı', `RESMÎ: ${s.name} artık ${club(o.id).n} oyuncusu.`, 'manset');
  if (move && o.id === s.dream) { s.fl.hayal = 1; unlock('hayal'); fx({ mo: 15 }); }
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
const MATTR = { sut: ['sut'], kafa: ['kafa'], frikik: ['sut', 'teknik'], penalti: ['sut', 'zihin'], pas: ['pas'], calim: ['teknik'], savunma: ['savunma'], kurtaris: ['kaleci'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'] };
const XP = { sut: ['sut', 'zihin'], kafa: ['kafa', 'guc'], frikik: ['sut', 'teknik'], penalti: ['zihin', 'sut'], pas: ['pas', 'zihin'], calim: ['teknik', 'hiz'], savunma: ['savunma', 'guc'], kurtaris: ['kaleci', 'zihin'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'] };
export const GOOD = ['gol', 'ok', 'gecti', 'kapildi', 'kurtardi'];
export function skillFor(k) { const a = MATTR[k]; return a.reduce((s, x) => s + S.at[x], 0) / a.length + (has('krampon') ? 2 : 0); }

export function buildMatch(fxt, rl) {
  const nat = !!fxt.nat;
  const usR = nat ? fxt.usR : S.rt[S.clubId], oppR = (nat ? fxt.opp.r : S.rt[fxt.opp]) + (fxt.boost || 0);
  const ref = nat ? null : curRef(), stam = clamp(55 + S.en * .45, 40, 100);
  const hb = nat || fxt.final ? 0 : (fxt.home ? 2 : -2), def = S.pos === 'DF' || S.pos === 'KL';
  const lu = 1.3 * Math.exp((usR + hb - oppR) * 0.05) * (def ? 0.95 : 0.6);
  const lo = 1.2 * Math.exp((oppR - hb - usR) * 0.05) * (S.pos === 'KL' ? 0.25 : def ? 0.55 : 0.95);
  const tl = [];
  for (let i = poisson(clamp(lu, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: true });
  for (let i = poisson(clamp(lo, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: false });
  const derby = !nat && isDerby(S.clubId, fxt.opp);
  const from = rl === 'yedek' ? ri(58, 70) : 1, n = (rl === 'yedek' ? ri(1, 2) : ri(3, 5)) + (derby ? 1 : 0);
  for (let i = 0; i < n; i++) tl.push({ min: ri(from + 1, 90), t: 'mom', k: wpick(POS[S.pos].m) });
  shuffle([...FILL]).slice(0, 4).forEach(x => tl.push({ min: ri(3, 88), t: 'txt', s: x }));
  if (rl === '11' && !nat) { tl.push({ min: 45, t: 'dec', k: 'ht' }); if (chance(.4)) tl.push({ min: ri(50, 84), t: 'dec', k: pick(['pen', 'ref', 'knock']) }); }
  if (rl === 'yedek') tl.push({ min: from, t: 'txt', s: 'Hoca seni çağırdı. Oyuna giriyorsun!' });
  tl.sort((a, b) => a.min - b.min || (a.t === 'txt' ? -1 : 1));
  return { fxt, nat, cup: !!fxt.cup, role: rl, usR, oppR, tl, usG: 0, oppG: 0, pg: 0, pa: 0, rt: 6, yel: 0, red: false, mom: 0, ok: 0,
    derby, stam, stam0: stam, mode: 'n', calls: 2, crowd: !nat && fxt.home ? 1 : 0, ref, bias: ref ? clamp(refBias(ref, S.clubId) - refBias(ref, fxt.opp) * .5 + ref.me, -1.2, 1.2) : 0 };
}

export function simMoment(k, M) {
  const base = { sut: .2, kafa: .17, frikik: .08, penalti: .76, pas: .62, calim: .45, savunma: .58, kurtaris: .74, vole: .15, rovesata: .07, orta: .48, korner: .45 }[k];
  const shot = k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'vole' || k === 'rovesata';
  const ok = chance(clamp(base + (skillFor(k) - M.oppR) * (shot ? 0.008 : 0.013) + (M.focus ? .06 : 0) + (S.diff === 'kolay' ? .04 : S.diff === 'zor' ? -.04 : 0) + (k === 'penalti' && perk('buz') ? .1 : 0), .05, shot ? .42 : .92));
  switch (k) {
    case 'pas': return ok ? { out: 'ok', adv: chance(.5) } : { out: pick(['kesildi', 'bos']) };
    case 'orta': case 'korner': return ok ? { out: 'ok', adv: true } : { out: pick(['kesildi', 'bos']) };
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
  if (k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'penalti' || k === 'vole' || k === 'rovesata') {
    if (out === 'gol') {
      M.usG++; M.pg++; M.rt += k === 'penalti' ? 0.8 : 1.2;
      lines.push({ s: `GOL! ${me} ${k === 'kafa' ? 'kafayla ağları buldu' : k === 'frikik' ? 'frikikten harika attı' : k === 'penalti' ? 'penaltıyı gole çevirdi' : k === 'vole' ? 'gelişine vurdu, top ağlarda' : k === 'rovesata' ? 'röveşatayla stadı ayağa kaldırdı' : 'topu ağlara gönderdi'}!`, c: 'g' });
      if (chance(.6) && CELE[S.cele]) lines.push({ s: `${me} ${CELE[S.cele][1]}.` });
      if (k === 'rovesata') { S.fl.rov = 1; M.rt += .6; fx({ fol: Math.round(300 + S.fol * .12), taraf: 4 }); addFeed('basin', 'Saha Kenarı', `RÖVEŞATA! ${S.name} yılın golüne aday.`, 'manset'); }
    } else if (out === 'kurtaris') { M.rt += k === 'penalti' ? -0.6 : 0.1; lines.push({ s: 'Kaleci vuruşunu çıkardı.' }); }
    else if (out === 'direk') { M.rt += 0.05; lines.push({ s: 'Direk! Top oyun alanında kaldı.' }); }
    else if (out === 'baraj') { M.rt -= 0.1; lines.push({ s: 'Vuruşun barajda kaldı.' }); }
    else if (out === 'blok') { M.rt -= 0.1; lines.push({ s: 'Vuruşun savunmaya çarptı.' }); }
    else if (out === 'gec') { M.rt -= 0.25; lines.push({ s: 'Çok bekledin, top ayağından alındı.' }); }
    else if (out === 'iska') { M.rt -= 0.2; lines.push({ s: 'Topa vuramadın.' }); }
    else { M.rt -= k === 'penalti' ? 0.7 : 0.2; lines.push({ s: 'Vuruşun çerçeveyi bulmadı.' }); }
  } else if (k === 'pas' || k === 'orta' || k === 'korner') {
    if (out === 'ok') {
      if (chance((k !== 'pas' ? .5 : res.adv ? .35 : .12) + (perk('gorus') ? .08 : 0) + chem() * .1)) { M.usG++; M.pa++; M.rt += 0.8; lines.push({ s: `GOL! ${me} asist yaptı, ${mate} tamamladı!`, c: 'g' }); }
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
      if (chance(clamp(.35 + (M.ref ? M.ref.strict * .5 - M.bias * .1 : .25), .15, .95))) {
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
    s.mr.push(rt); gainXp(rt >= 8.5 ? 2 : rt >= 7 ? 1 : 0);
    if (rt >= 7) { questHit('rate'); for (const m of s.mates) m.b = clamp(m.b + .6, 0, 100); }
    if (M.pg + M.pa > 0) questHit('goal');
    if (M.derby) { fx({ taraf: win ? 8 : lose ? -8 : 0, mo: win ? 5 : 0 }); if (win) lines.push('Derbi galibiyeti! Taraftar +8'); }
    // dört sarı kart cezası profesyonel liglerde geçerli; yerel amatörde uygulanmaz
    s.st.yel = (s.st.yel || 0) + (M.red ? 0 : M.yel);
    if (s.st.yel >= 4 && !(LMAP[leagueOf(s.clubId)].c === 'TR' && tier() >= 6)) { s.st.yel = 0; s.ban = Math.max(s.ban, 1); s.banR = 'Sarı kart cezası'; lines.push('Dördüncü sarı kart: gelecek hafta cezalısın.'); }
    if (def && M.oppG === 0) s.st.cs++;
    fx({ hoca: (rt - 6.6) * 2.2 * (rt > 6.6 && perk('kaptan') ? 1.3 : 1), takim: (rt - 6.5) * 1 + (win ? 0.6 : 0), taraf: (rt - 6.5) * 1.3 + M.pg * 0.8 });
    const prim = win ? nice(s.con.wage * 0.25) : 0, gb = (s.con.goalB || 0) * M.pg;
    if (prim + gb > 0) { s.money += prim + gb; lines.push(`Prim: ${fmt(prim + gb)}`); }
    s.lastR.push(rt); if (s.lastR.length > 5) s.lastR.shift();
    s.bench = 0;
    if (M.red) { s.ban = Math.max(s.ban, 1); s.banR = 'Kırmızı kart cezası'; lines.push('Gelecek hafta cezalısın.'); }
    if (s.fl.scout) { delete s.fl.scout; if (rt >= 7) s.q.push({ id: 'deneme', at: absWeek() + 1 }); else lines.push('Scout notlarını aldı ama pek etkilenmiş görünmüyordu.'); }
    if (rt >= 8.5 && M.pg >= 2 && (s.cd.viral || 0) <= absWeek() && !s.q.some(q => q.id === 'viral')) s.q.push({ id: 'viral', at: absWeek() + 1 });
  }
  fx({ mo: (win ? 6 : lose ? -5 : 0) + (rt - 6.5) * 3 });
  const tf = Math.exp((cr - 25) * 0.14) * 4 * (1 + eff('fol')) * (perk('sahne') ? 1.5 : 1);
  const fg = Math.round(Math.max(0, rt - 5.5) * tf + M.pg * tf * 2);
  if (fg > 0) { s.fol += fg; lines.push(`Takipçi +${fg.toLocaleString('tr-TR')}`); }
  const tired = s.en < 30 ? .06 : s.en < 45 ? .025 : 0;
  const spent = M.stam0 > M.stam ? clamp((M.stam0 - M.stam) / 45, .6, 1.6) : 1;   // maçta harcanan efor
  s.en = clamp(s.en - (M.cup ? 12 : M.role === '11' ? 18 : 9) * spent * (perk('akciger') ? .7 : 1), 0, 100);
  if (M.fxt.press) { if (win && rt >= 7) { fx({ taraf: 6 }); lines.push('Sözünü tuttun. Taraftar +6'); } else { fx({ taraf: -5 }); lines.push('İddialı konuştun, olmadı. Taraftar −5'); } }
  if (chance((0.015 + tired) * (M.role === '11' ? 1 : .5) * (M.risk || 1) * (perk('celik') ? .6 : 1))) {
    const r = Math.random();
    if (r < .7) { s.inj = ri(1, 3); lines.push(`Maçta sakatlandın: ${s.inj} hafta yoksun.`); }
    else if (r < .92) { s.inj = ri(4, 8); lines.push(`Kas yırtığı: ${s.inj} hafta yoksun.`); }
    else { s.inj = 6; s.fl.agir = 1; lines.push('Dizinden ağır sakatlandın. Doktorlar seninle konuşmak istiyor.'); }
  }
  feedMatch(M); checkAch(M);
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

// ---------- yetenekler ve başarımlar ----------
export const perk = id => S.perks.includes(id);
export function buyPerk(id) { const p = PERKS.find(x => x.id === id); if (!p || perk(id) || S.pp < p.c) return false; S.pp -= p.c; S.perks.push(id); return true; }
function gainXp(n) { S.px += n; while (S.px >= 8) { S.px -= 8; S.pp++; S.pop.push('Yetenek puanı kazandın'); } }
export function unlock(id) {
  if (S.ach[id]) return; const a = ACH.find(x => x[0] === id); if (!a) return;
  S.ach[id] = seasonLabel(); S.pop.push('Başarım: ' + a[1]); addNews('Başarım açıldı: ' + a[1], 'star');
}
function checkAch(M) {
  const g = tot().g;
  if (g >= 1) unlock('ilkgol'); if (g >= 50) unlock('g50'); if (g >= 100) unlock('g100'); if (g >= 250) unlock('g250');
  if (M && M.pg >= 3) unlock('hat');
  if (S.con.wage >= 8000) unlock('pro'); if (leagueOf(S.clubId) === 'tr1') unlock('sl'); if (S.fl.yurtdisi) unlock('yurt');
  if (S.car.caps >= 1) unlock('milli'); if (S.fol >= 1e6) unlock('m1');
}

// ---------- hedef takım ----------
const SAK = () => Object.keys(CLUBS).find(id => CLUBS[id].n === 'Sakaryaspor') || null;
export function dreamList() {
  const out = [];
  for (const L of LEAGUES) { if (L.gen || L.tier > 2) continue; out.push(...[...S.lg[L.id].t].sort((a, b) => S.rt[b] - S.rt[a]).slice(0, L.id === 'tr1' ? 6 : 3)); }
  const sk = SAK(); if (sk && !out.includes(sk)) out.unshift(sk);
  return out.filter(id => id !== S.clubId);
}
export function setDream(id) { S.dream = id; delete S.fl.hayal; }
export function dreamInfo() {
  if (!S.dream) return null;
  const need = Math.round(S.rt[S.dream] - 4), o = OVR();
  return { id: S.dream, need, pct: clamp((o - 20) / Math.max(1, need - 20) * 100, 0, 100), w: S.watch.find(x => x.id === S.dream), mine: S.dream === S.clubId };
}

// ---------- sosyal medya akışı ----------
// a: 'me' | karakter anahtarı | 'c:<kulüp id>', k: tür (fan, haber, manset, kulup, rakip, ben)
export function addFeed(a, n, t, k = 'fan') {
  S.feed.unshift({ a, n, t, k, l: Math.round(rnd(.2, 1.6) * (20 + S.fol * (k === 'ben' ? .06 : .01) + S.rep * 8)), w: S.week });
  if (S.feed.length > 40) S.feed.length = 40;
  S.feedNew = (S.feedNew || 0) + 1;
}
// Kalıplar: aynı cümle art arda dönmesin diye son kullanılanlar S.fu içinde tutulur
const TX = {
  great: ['{me} bu ligde ne arıyor ya.', 'Bugün {me} oynadı, biz izledik.', 'Bu çocuğu kaçırmayın. Buraya yazıyorum.', '{me} topu her aldığında tribün ayağa kalktı.', '{g} gol, {rt} not. Daha ne olsun.', 'Yıllardır böyle bir {pos} görmedik.', '{me} için besteye başlıyoruz.', 'Forma satışları patlar bu hafta. #{tag}', '{me} maçtan sonra top toplayıcı çocuğa formasını vermiş. Adam gibi adam.'],
  bad: ['{me} bugün sahada mıydı?', 'Hoca bir hafta dinlendirsin: {me}.', '{me} bugün kafası başka yerdeydi sanki.', 'Bu performansla ilk 11 zor.', 'Top ayağında durmadı bugün.', 'Eleştiriyoruz çünkü seviyoruz. Toparla {me}.', 'Geçen haftaki oyuncu nerede?'],
  win: ['Üç puan cepte. Devam!', 'Bu takım bu sene bir şeyler yapar.', '{opp} maçı kolay değildi, helal.', 'Yarış kızışıyor. #{tag}', 'Pazartesi işe mutlu gidiyoruz.', 'Savunma bugün duvar gibiydi.', 'Eve keyifle dönüyoruz. #{tag}', 'Bu galibiyet moral olur.'],
  loss: ['Yine aynı film.', 'Bu savunmayla zor.', '{opp} bizi sahadan sildi.', 'Hocanın planı neydi, anlamadım.', 'Biletime yazık.', 'Toparlanırız. Hep toparlandık.', 'İkinci yarı sahaya çıkmadık.', 'Yönetim uyuyor mu?'],
  draw: ['Bir puan da puandır.', 'İki puan bıraktık bence.', 'Son dakikalarda kalbim durdu.', 'Ne kazandık ne kaybettik.', 'Beraberlik adil sonuç.'],
  opp: ['{me} iyiymiş ama abartmayın.', 'Rövanşta görüşürüz {club}.', 'Hakem olmasa farklı olurdu.', '{me} bize gelsin, oynatırız.', '{club} şanslıydı bugün.'],
  stat: ['{me}: son maçların ortalaması {f5}. Grafik yukarı.', 'Sezon karnesi: {sg} gol, {sa} asist. Bir {pos} için ciddi rakamlar.', '{club} ligde {rank}. sırada. Kalan haftalar belirleyici.', 'Veri: {me} sahadayken takım daha çok pozisyon buluyor.', '{me} bu sezon {sm} maça çıktı. İstikrar burada başlıyor.'],
  mate: ['Kardeşim {me} ile sahada olmak keyif.', 'Bu grup çok iyi. Hafta sonu yine sahadayız.', 'Antrenman bitti, {me} hâlâ şut çekiyor.', 'Soyunma odasında müziği {me} seçti. Bir daha asla.'],
  reply: ['Kralsın.', 'Hafta sonu gol bekliyoruz.', 'Formanın hakkını veriyorsun.', 'Bizi unutma, imza günü yap.', 'Fotoğraf güzel de pazar maçı kazanalım.', 'Memleket seninle gurur duyuyor.', 'Yakışmış.', 'Sakatlanma da ne yaparsan yap.'],
  rumor: ['{c} cephesi {me} için rapor istedi.', '{c} scoutu tribündeydi. Hedef: {me}.', 'Kulis: {c}, {me} için nabız yokluyor.', '{c} yönetimi: "{me} izlediğimiz isimlerden."', '{me} listesi kabarıyor: sıradaki {c}.'],
  rival: ['Çalışmaya devam. Konuşanlar konuşsun.', 'Hedef büyük, yol uzun.', 'Bazıları şansla, bazıları emekle.', 'Rakamlar ortada. Kıyas yapan yapsın.', 'Bugün de üstüne koyduk.'],
  news: ['{w}, {l} karşısında güldü: {s}.', '{w}, {l} engelini geçti: {s}.', '{l} evine eli boş döndü. {w} kazandı: {s}.', '{w} üç puanı {s} ile aldı.'],
  end: ['MAÇ SONU | {sc}', '{sc} | Emeği geçen herkese teşekkürler.', 'Düdük çaldı: {sc}', 'Sahadan ayrılıyoruz: {sc}'],
};
function say(key, c = {}) {
  const pool = TX[key].filter(t => !S.fu.includes(t)), t = pick(pool.length ? pool : TX[key]);
  S.fu.push(t); if (S.fu.length > 34) S.fu.shift();
  return t.replace(/\{(\w+)\}/g, (_, k) => (c[k] != null ? c[k] : ''));
}
function fctx(M) {
  const cl = club(S.clubId), t = table(leagueOf(S.clubId)).map(r => r.id), r5 = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6;
  return { me: S.nick && chance(.3) ? S.nick : S.name, club: cl.n, tag: cl.n.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, ''), pos: POS[S.pos].n.toLocaleLowerCase('tr'), sg: S.st.g, sa: S.st.a, sm: S.st.apps, rank: t.indexOf(S.clubId) + 1, f5: r5.toFixed(1).replace('.', ','),
    g: M ? M.pg : 0, rt: M ? M.rt.toFixed(1).replace('.', ',') : '', opp: M ? (M.nat ? M.fxt.opp.n : club(M.fxt.opp).n) : '' };
}
function feedMatch(M) {
  const c = fctx(M), usN = M.nat ? M.fxt.usN : c.club;
  c.sc = `${usN} ${M.usG}-${M.oppG} ${c.opp}`;
  addFeed(M.nat ? 'fed' : 'c:' + S.clubId, usN, say('end', c), 'kulup');
  if (M.pg >= 2) addFeed('basin', 'Saha Kenarı', `${S.name} şov yaptı: ${M.pg} gol. Maç notu ${c.rt}.`, 'manset');
  else if (M.rt >= 7.5) addFeed('basin', 'Saha Kenarı', pick([`Maçın yıldızı ${S.name}. Maç notu ${c.rt}.`, `${S.name} yine sahnedeydi: ${c.rt}.`, `Haftanın adamı ${S.name} olabilir. Not ${c.rt}.`]), 'haber');
  else if (M.rt < 5.8) addFeed('basin', 'Saha Kenarı', pick([`${S.name} için zor bir gün. Maç notu ${c.rt}.`, `${S.name} beklentinin altında kaldı: ${c.rt}.`]), 'haber');
  addFeed('taraftar', pick(FANS), say(M.rt >= 8 ? 'great' : M.rt < 5.8 ? 'bad' : M.usG > M.oppG ? 'win' : M.usG < M.oppG ? 'loss' : 'draw', c));
  if (chance(.5)) addFeed('taraftar', pick(FANS), say(M.usG > M.oppG ? 'win' : M.usG < M.oppG ? 'loss' : 'draw', c));
  if (!M.nat && chance(.3)) addFeed('golge', c.opp.replace(/\s+/g, '').toLocaleLowerCase('tr') + '_fan', say('opp', c));
  if (!M.nat && M.rt >= 7 && chance(.3) && S.sc[S.clubId]) addFeed('takim', pick(S.sc[S.clubId])[0], say('mate', c), 'rakip');
  if (S.st.apps >= 5 && chance(.22)) addFeed('basin', 'Rakamlarla Futbol', say('stat', c), 'haber');
  if (M.varAg) addFeed('taraftar', pick(FANS), pick(['VAR yine sahne aldı. Tartışılır.', 'Çizgiyi kim çekti?', `Bu hakemi bir daha bize vermeyin: ${M.ref ? M.ref.n : ''}.`]));
}
function feedWeek() {
  const lid = leagueOf(S.clubId), lg = S.lg[lid], L = LMAP[lid], src = L.c === 'TR' && L.tier >= 6 ? 'Amatörün Sesi' : 'Saha Kenarı';
  const r = (lg.last || []).filter(x => x[0] !== S.clubId && x[1] !== S.clubId);
  if (r.length && chance(.55)) {
    const [h, a, hg, ag] = pick(r);
    addFeed('basin', src, hg === ag ? `${club(h).n} ile ${club(a).n} yenişemedi: ${hg}-${ag}.` : say('news', { w: club(hg > ag ? h : a).n, l: club(hg > ag ? a : h).n, s: `${Math.max(hg, ag)}-${Math.min(hg, ag)}` }), 'haber');
  }
  if (S.week % 6 === 0) {
    const t = table(lid)[0], sc = scorers(lid)[0];
    addFeed('basin', src, `${L.name} zirvesi: ${club(t.id).n}, ${t.pts} puan.` + (sc && sc.g ? ` Gol krallığında ${sc.n} önde: ${sc.g} gol.` : ''), 'manset');
  }
  if (S.rival && chance(.07)) addFeed('rakip', S.rival.n, say('rival'), 'rakip');
  if (S.st.apps >= 6 && chance(.12)) addFeed('basin', 'Rakamlarla Futbol', say('stat', fctx()), 'haber');
  if (S.week === 19 || S.week === 38) addFeed('basin', 'Transfer Hattı', 'Transfer dönemi açılıyor. Telefonlar şimdiden çalıyor.', 'manset');
}
export const canPost = p => (!p.need || p.need.some(has)) && (!p.spon || S.spon.length > 0);
export function post(id) {
  const p = POSTS.find(x => x.id === id); S.used++; questHit('post');
  const g = Math.round((30 + S.rep * S.rep * 2) * rnd(.6, 1.4) * (1 + eff('fol')) * p.f * (perk('sahne') ? 1.5 : 1));
  const f = { ...p.fx, fol: g }; if (p.spon) f.para = nice(S.spon.reduce((a, x) => a + x.wk, 0) * .5);
  addFeed('me', S.name, pick(p.t), 'ben');
  if (id === 'luks' && chance(.3)) addFeed('taraftar', pick(FANS), 'Biz bilet parası biriktirirken...');
  else { addFeed('taraftar', pick(FANS), say('reply')); if (chance(.4)) addFeed('taraftar', pick(FANS), say('reply')); }
  S.feedNew = 0;
  return fx(f);
}

// ---------- arkadaş aktiviteleri ----------
export function hang(id) {
  const h = HANG.find(x => x.id === id); S.used++; questHit('hang'); if (id === 'gece') S.fl.gecew = absWeek();
  const ch = fx(h.fx); let t = h.r;
  if (h.risk && chance(h.risk)) { S.inj = Math.max(S.inj, ri(1, 2)); ch.push(`${S.inj} hafta sakat −`); t = 'Halı sahada bileğin döndü.'; }
  if (h.hoca && chance(h.hoca)) { ch.push(...fx({ hoca: -8 })); t = 'Gece uzadı; hoca duymuş.'; }
  return [t, ch];
}

// ---------- maç içi kararlar ----------
export function decText(M, k) {
  if (k === 'ht') return M.usG > M.oppG ? 'Öndesiniz. Hoca "bırakmayın" diyor.' : M.usG < M.oppG ? 'Geridesiniz. Soyunma odası sessiz.' : 'Beraberlik. İkinci yarıda her şey olabilir.';
  return { pen: 'Hakem beyaz noktayı gösterdi. Takımın penaltıcısı topu aldı, sana bakıyor.', ref: 'Hakem bariz bir faulü vermedi. Tribün ayakta.', knock: 'Arka adalende bir çekme hissettin. Sağlık ekibi kenardan bakıyor.' }[k];
}
// Seçimi uygular. add: zaman çizgisine eklenecek yeni olaylar
export function decide(M, k, c, min) {
  const L = [], add = [];
  if (k === 'ht') {
    if (c === 0) {
      if (chance(.3 + (S.trait === 'lider' ? .2 : 0) + (perk('kaptan') ? .1 : 0) + S.rel.takim / 500)) { add.push({ min: ri(50, 88), t: 'bg', us: true }); fx({ takim: 3 }); L.push({ s: 'Konuşman soyunma odasını ayağa kaldırdı.' }); }
      else { fx({ takim: -1 }); L.push({ s: 'Sözlerin havada kaldı.' }); }
    } else if (c === 1) { M.focus = 1; M.rt += .15; L.push({ s: 'Nefesini topladın. Kalan anlar daha sakin akacak.' }); }
    else { M.risk = Math.max(M.risk || 1, 2); add.push({ min: ri(50, 88), t: 'mom', k: wpick(POS[S.pos].m) }); L.push({ s: 'Her topa gireceksin: fazladan pozisyon, fazladan risk.' }); }
  } else if (k === 'pen') {
    if (c === 0) { add.push({ min, t: 'mom', k: 'penalti' }); fx({ ego: 2 }); L.push({ s: 'Topu aldın. Stat sustu.' }); }
    else if (chance(.72)) { M.usG++; L.push({ s: 'GOL! Penaltı ağlarda.', c: 'g' }); } else L.push({ s: 'Penaltı kaçtı.' });
  } else if (k === 'ref') {
    if (c === 0) {
      fx({ taraf: 3 }); if (M.ref) M.ref.me -= .25;   // hakem bunu unutmaz
      if (chance(.4)) { M.yel++; if (M.yel >= 2) { M.red = true; M.rt -= 1.5; L.push({ s: 'İkinci sarı! Kırmızı kart.', c: 'b' }); } else L.push({ s: 'İtirazdan sarı kart gördün.' }); }
      else L.push({ s: 'Hakem kararını değiştirmedi ama tribün seni alkışladı.' });
    } else { fx({ hoca: 1 }); if (M.ref) M.ref.me += .08; L.push({ s: 'Başını sallayıp yerine döndün.' }); }
  } else if (k === 'knock') {
    if (c === 0) { M.risk = 3; M.rt += .3; fx({ hoca: 2 }); L.push({ s: 'Dişini sıktın. Sakatlık riskin arttı.' }); }
    else { M.off = true; fx({ hoca: -1 }); L.push({ s: 'Kenara geldin. Bu maçlık bu kadar.' }); }
  }
  return { lines: L, add };
}

// ---------- kayıt yedeği ----------
export const exportData = () => JSON.stringify(S);
export function importData(str) {
  try { const d = JSON.parse(str); if (!d || d.v !== 1 || !d.name || !d.lg) return false; localStorage.setItem(KEY, JSON.stringify(d)); return load(); }
  catch (e) { return false; }
}

// ---------- hakemler ve VAR ----------
// strict: kart eğilimi, vr: VAR'a gitme eğilimi, me: sana karşı tutumu (itirazlarınla değişir), b: kulüplere karşı eğilimi
function initRefs() { S.refs = Array.from({ length: 10 }, () => ({ n: rname('TR'), strict: +rnd(.15, .95).toFixed(2), vr: +rnd(.2, .9).toFixed(2), me: 0, b: {} })); S.refi = 0; }
export const curRef = () => S.refs[S.refi];
function refBias(r, id) { if (r.b[id] == null) r.b[id] = +clamp(randn() * .5, -1, 1).toFixed(2); return r.b[id]; }
export function refInfo() {
  const r = curRef(), b = refBias(r, S.clubId) + r.me;
  return { n: r.n, style: r.strict > .65 ? 'Kartı çabuk çıkarır' : r.strict < .35 ? 'Oyunu akıtır' : 'Dengeli düdük', att: b > .45 ? 'Size sıcak' : b < -.45 ? 'Size soğuk' : 'Tarafsız', cold: b < -.45 };
}
function assignRef() {
  const f = fixture() || cupFixture() || cupFixture('euro'); if (!f) return;
  S.refi = ri(0, S.refs.length - 1); const i = refInfo();
  addFeed('fed', 'Hakem Kurulu', `${club(f.opp).n} maçına ${i.n} atandı. ${i.style}. Takımınıza tutumu: ${i.att.toLocaleLowerCase('tr')}.`, 'haber');
  if (isDerby(S.clubId, f.opp)) addFeed('basin', 'Saha Kenarı', `DERBİ HAFTASI: ${club(S.clubId).n} - ${club(f.opp).n}. Şehir bu maçı konuşuyor.`, 'manset');
}
// Gol sonrası VAR incelemesi. us: gol bizim mi. null dönerse inceleme yok.
export function varCheck(M, us) {
  if (!M.ref || !chance(.05 + M.ref.vr * .1)) return null;
  return { cancel: chance(clamp(.42 - (us ? M.bias : -M.bias) * .16, .1, .8)), why: pick(['ofsayt', 'elle oynama', 'faul']) };
}

// ---------- röportajlar ----------
export const IV = {
  post: { q: ['Harika bir maç çıkardın. Sırrı ne?', 'Tribünler adını haykırıyor. Ne söylemek istersin?', 'Bu performansı kime armağan ediyorsun?', 'Formunun zirvesindesin. Hedef ne?'],
    a: [{ t: 'Takım arkadaşlarım sayesinde', fx: { takim: 4, hoca: 1 }, say: 'Tek başıma hiçbir şeyim. Bu takımın emeği.' },
      { t: 'Aileme armağan olsun', fx: { aile: 5, taraf: 2 }, say: 'Bu maç annemle babama armağan.' },
      { t: 'Daha iyisini de yaparım', fx: { ego: 3, taraf: 3 }, fol: 1.5, say: 'Bu daha başlangıç. Daha iyisini göreceksiniz.' },
      { t: 'Hakem konusunda susmayacağım', v: 1, fx: { taraf: 4, hoca: -1 }, ref: -.4, fine: 1, say: 'Bu kararlarla futbol oynanmaz.' }] },
  pre: { q: ['Büyük maç öncesi beklentin ne?', 'Rakip hakkında ne düşünüyorsun?', 'Herkes bu maçı konuşuyor. Baskı hissediyor musun?'],
    a: [{ t: 'Rakibe saygı duyuyoruz', fx: { takim: 1 }, say: 'Zor bir maç. Saygımız sonsuz, sahada görüşürüz.' },
      { t: 'Kazanacağız, net', fx: { ego: 2 }, press: 1, say: 'Kazanacağız. Bundan şüphem yok.' },
      { t: 'Onlar bizden korksun', fx: { ego: 4 }, boost: 1.5, fol: 2, say: 'Korkması gereken biz değiliz.' }] },
};
export function interview(kind, i, fxt) {
  const a = IV[kind].a[i], f = { ...a.fx };
  if (a.fol) f.fol = Math.round((60 + S.rep * S.rep * 2) * a.fol);
  if (a.fine) f.para = -nice(wref() * 2);
  if (a.ref) curRef().me += a.ref;
  if (fxt && a.press) fxt.press = 1; if (fxt && a.boost) fxt.boost = a.boost;
  addFeed('me', S.name, '“' + a.say + '”', 'ben');
  return fx(f);
}
export function bigMatch(f) {
  if (isDerby(S.clubId, f.opp) || f.po) return true;
  if (f.cup) return ['Final', 'Yarı final', 'Çeyrek final'].includes(f.round);
  if (f.opp === S.dream) return true;
  const t = table(leagueOf(S.clubId)).map(r => r.id), a = t.indexOf(S.clubId), b = t.indexOf(f.opp);
  return S.week > 8 && a < 5 && b >= 0 && b < 5;
}

// ---------- sezon arası planı ----------
export const OFF = [
  { t: 'Bodrum tatili', s: 'Kafa dinle: moral ve enerji tavan, kondisyon biraz düşer', i: 'smile' },
  { t: 'Özel kamp', s: 'Ücretli. Hız ve güç artar, yeni sezona zinde başlarsın', i: 'train' },
  { t: 'Memleket', s: 'Aile ve arkadaşlarla vakit, mahalle maçları', i: 'home' },
];
export function offseason(i) {
  if (i === 0) { S.en = 100; return fx({ mo: 15, guc: -0.5 }); }
  if (i === 1) { S.en = 75; return fx({ para: -nice(Math.max(5000, S.con.wage * 3)), hiz: 1, guc: 1, prof: 3 }); }
  S.en = 90; return fx({ aile: 12, ark: 8, mo: 8 });
}

// Transfer sonrası imza töreni soruları
IV.imza = { q: ['Yeni kulübünde ilk sözün ne?', 'Taraftara mesajın var mı?'],
  a: [{ t: 'Bu formayı terletmeye geldim', fx: { taraf: 6, takim: 2 }, say: 'Bu formanın hakkını vereceğim.' },
    { t: 'Hedefim şampiyonluk', fx: { taraf: 8, ego: 3 }, say: 'Buraya kupa kaldırmaya geldim.' },
    { t: 'Eski kulübüme teşekkür ederim', fx: { sad: 6, taraf: 3 }, say: 'Beni yetiştiren herkese teşekkür ederim. Şimdi yeni bir sayfa.' }] };

// ---------- play-off ve play-out ----------
export function initPlayoffs() {
  const list = [];
  for (const lid of TRT) {
    const R = RULES[lid], t = table(lid).map(r => r.id), n = t.length;
    if (R.po) {
      const T = t.slice(R.from - 1, R.from - 1 + POSIZE[R.po]);
      const cur = R.po === 'p5' ? [[T[1], T[4]], [T[2], T[3]]] : R.po === 'p2' ? [[T[0], T[1]]] : [[T[0], T[3]], [T[1], T[2]]];
      list.push({ lid, k: R.po, n: LMAP[lid].name + ' play-off', cur, bye: R.po === 'p5' ? T[0] : null, r: 0, up: [], down: [], done: false });
    }
    if (R.out) list.push({ lid, k: 'o2', n: LMAP[lid].name + ' play-out', cur: [[t[n - 2 - R.down], t[n - 1 - R.down]]], r: 0, up: [], down: [], done: false });
  }
  S.po = { list };
}
export const poPending = () => !!S.po && S.po.list.some(b => !b.done);
// Oyuncunun kulübü bir eşleşmedeyse o maçı döndürür
export function poFixture() {
  if (!S.po) return null;
  for (const b of S.po.list) {
    if (b.done) continue;
    const p = b.cur.find(x => x.includes(S.clubId)); if (!p) continue;
    const last = (b.k === 'p4' && b.r === 1) || (b.k === 'p5' && b.r === 2) || b.k === 'o2';
    return { cup: true, key: 'po', po: b.k === 'o2' ? 'out' : 'off', name: b.n, round: PON[b.k][b.r], opp: p[0] === S.clubId ? p[1] : p[0], home: last ? true : p[0] === S.clubId, final: last };
  }
  return null;
}
// Bir tur oynatır. own: {win} oyuncunun maçının sonucu
export function poRound(own) {
  for (const b of S.po.list) {
    if (b.done) continue;
    const W = [], Lo = [];
    for (const [h, a] of b.cur) {
      let w;
      if (own && (h === S.clubId || a === S.clubId)) w = own.win ? S.clubId : (h === S.clubId ? a : h);
      else { const [hg, ag] = simScore(S.rt[h], S.rt[a]); w = hg > ag ? h : ag > hg ? a : chance(.5) ? h : a; }
      W.push(w); Lo.push(w === h ? a : h);
    }
    if (b.k === 'o2') { b.down = Lo; b.done = true; }
    else if (b.k === 'p2' || b.k === 'p4x2') { b.up = W; b.done = true; }
    else if (b.r === 0) b.cur = [[W[0], W[1]]];
    else if (b.k === 'p5' && b.r === 1) b.cur = [[b.bye, W[0]]];
    else { b.up = W; b.done = true; }
    b.r++;
    if (b.done && b.lid === leagueOf(S.clubId)) addFeed('basin', 'Saha Kenarı', b.k === 'o2' ? `Play-out bitti: ${club(b.down[0]).n} küme düştü.` : `Play-off bitti: ${b.up.map(x => club(x).n).join(' ve ')} üst ligde.`, 'manset');
  }
  S.en = clamp(S.en + 14, 0, 100);
}

// ---------- derbi ----------
export function isDerby(a, b) {
  if (!a || !b || a === b) return false;
  if (a[0] === 'g' && b[0] === 'g') { const [ta, ia] = a.slice(1).split('_'), [tb, ib] = b.slice(1).split('_'); return ta === tb && (+ia ^ 1) === +ib; }   // amatörde komşu mahalle
  const A = club(a), B = club(b);
  return !!A && !!B && DERBY.some(g => g.includes(A.n) && g.includes(B.n));
}

// ---------- takım arkadaşları ----------
const MROLE = ['Kaptan', 'Takımın yıldızı', 'Kıdemli', 'Genç yetenek', 'Kaleci'];
function genMates() {
  const sc = S.sc[S.clubId] || [], c = LMAP[leagueOf(S.clubId)].c;
  S.mates = MROLE.map((r, i) => ({ n: i > 0 && i < 3 && sc[i - 1] ? sc[i - 1][0] : rname(c), r, b: ri(18, 40), lk: { skin: ri(0, 3), hair: ri(0, 7), hc: ri(0, 2), beard: ri(0, 2) } }));
}
// Kulüpten ayrılırken yakın olduğun isimler ağına geçer
function matesToNet() {
  for (const m of S.mates || []) if (m.b >= 60) netAdd('eski', m.n, S.clubId, 45, m.lk);
  if (S.rel.hoca >= 72) netAdd('hoca', rname('TR'), S.clubId, 50);
}
export const chem = () => (S.mates && S.mates.length ? S.mates.reduce((a, m) => a + m.b, 0) / S.mates.length / 100 : .3);
export function mateAct(i, k) {
  const m = S.mates[i], A = MACT[k], f = { ...A.fx }, first = m.n.split(' ')[0]; S.used++; questHit('hang');
  m.b = clamp(m.b + A.b, 0, 100);
  if (A.cost) f.para = -nice(Math.max(300, wref() * A.cost));
  if (A.grow) for (const a of Object.keys(POS[S.pos].w).slice(0, 2)) grow(a, .25);
  return [A.r.replace('{n}', first), [...fx(f), `${first} ile bağ +${A.b}`]];
}

// ---------- ağ (network) ----------
export function netAdd(k, n, org, b = 30, lk) {
  if (S.net.some(c => c.k === k && c.n === n) || S.net.length >= 14) return;
  S.net.push({ k, n, org: org || null, b, cd: 0, lk: lk || null });
  S.pop.push('Yeni tanıdık: ' + n); addNews(`Çevren genişliyor: ${n} (${NET[k].n}).`, 'users');
}
export function netMeet(i) {
  const c = S.net[i]; S.used++; questHit('net');
  c.b = clamp(c.b + 12, 0, 100);
  if (c.k === 'yildiz') grow(Object.keys(POS[S.pos].w)[0], .3);
  return [`${c.n} ile görüştün.`, [...fx(c.k === 'golge' ? { prof: -3, mo: 2 } : { mo: c.k === 'yildiz' ? 4 : 2 }), 'Bağ +12']];
}
// İyilik iste: bağ en az 50 olmalı, 20 haftada bir
export function netFavor(i) {
  const c = S.net[i], now = absWeek(); if (c.b < 50 || c.cd > now) return null;
  c.cd = now + 20; c.b -= 12; const o = OVR();
  const recommend = id => {
    if (!id || id === S.clubId || !leagueOf(id)) return 'Şu an yapabileceği bir şey yok.';
    if (S.rt[id] > o + 9) return `${club(id).n} için "henüz erken" dedi. Biraz daha gelişmen gerekiyor.`;
    const w = S.watch.find(x => x.id === id); if (w) w.lv = clamp(w.lv + 30, 0, 100); else S.watch.push({ id, lv: 58 });
    addFeed('basin', 'Transfer Hattı', `${club(id).n}, ${S.name} için devrede. Referansı güçlü.`, 'manset');
    return `${c.n} seni ${club(id).n} yönetimine önerdi. Kulüp dosyanı açtı.`;
  };
  switch (c.k) {
    case 'yildiz': case 'eski': case 'hoca': return [recommend(c.org), []];
    case 'scout': { const pool = []; for (const lid in S.lg) for (const id of S.lg[lid].t) if (id !== S.clubId && S.rt[id] > S.rt[S.clubId] + 1 && S.rt[id] <= o + 6 && (LMAP[lid].c === 'TR' || S.rep >= 40)) pool.push(id); return [recommend(pool.length ? pick(pool) : null), []]; }
    case 'abi': {
      if (LMAP[leagueOf(S.clubId)].c === 'TR' && tier() >= 5) { S.q.push({ id: 'deneme', at: now }); return ['"Bir telefon açtım. Bu hafta seni denemeye çağıracaklar."', []]; }
      const wk = nice(1500 + S.fol * .05); S.spon.push({ n: 'Yerel iş insanı', wk, until: now + 38 }); return [`Tanıdığı bir iş insanı sana sponsor oldu: haftada ${fmt(wk)}.`, []];
    }
    case 'gazeteci': S.fl.kalkan = now + 20; return ['Hakkında övgü dolu bir yazı çıktı. Bir süre kötü haberin de çıkmaz.', fx({ rep: 2, taraf: 4, fol: Math.round(200 + S.fol * .05) })];
    case 'doktor': if (S.inj > 0) { S.inj = Math.max(0, S.inj - 2); return ['Özel programla dönüşün iki hafta öne çekildi.', []]; } return ['Kontrolden geçtin, takviye programı aldın.', fx({ en: 25 })];
    case 'marka': { const wk = nice(Math.max(2000, S.fol * .2)); S.spon.push({ n: 'Marka anlaşması', wk, until: now + 38 }); return [`Masaya oturdunuz: haftada ${fmt(wk)}.`, []]; }
    case 'golge': if (chance(.4)) S.q.push({ id: 'bahis_sonuc', at: now + ri(6, 14) }); return ['"Küçük bir iş" dedi. Zarf cebinde. Soru sormadın.', fx({ para: nice(wref() * 6), prof: -10, sad: -4 })];
  }
  return ['', []];
}

// ---------- haftalık görev ----------
const QUESTS = [['train', 'İki antrenman yap', 2], ['rate', 'Maçta 7,0 ve üstü not al', 1], ['post', 'Sosyal medyada paylaşım yap', 1], ['hang', 'Bir arkadaşınla vakit geçir', 1], ['goal', 'Gol at ya da asist yap', 1], ['net', 'Çevrenden biriyle görüş', 1]];
function newQuest() { const q = pick(QUESTS.filter(x => x[0] !== (S.quest && S.quest.k) && (x[0] !== 'net' || S.net.length))); S.quest = { k: q[0], t: q[1], n: q[2], p: 0 }; }
function questHit(k) {
  const q = S.quest; if (!q || q.k !== k || q.p >= q.n) return;
  if (++q.p >= q.n) { const b = nice(Math.max(500, S.con.wage * .2)); S.money += b; gainXp(2); S.pop.push(`Görev tamam: ${fmt(b)} ve yetenek deneyimi`); }
}

// ---------- rehabilitasyon ----------
export function rehab(ok) {
  S.used++; S.fl.rehabw = 1;
  if (ok) { S.inj = Math.max(0, S.inj - 1); return ['Rehabilitasyon iyi gitti: dönüş bir hafta öne geldi.', []]; }
  return ['Zorladın, ağrı arttı. Bugünlük bu kadar.', fx({ en: -6 })];
}
