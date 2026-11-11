// Toprak Saha — oyun çekirdeği: durum, lig simülasyonu, sezon, transfer, ekonomi
import { LEAGUES, LMAP, CLUBS, PAL, PROV, NAMES, POS, ATTR, ORIGINS, TRAITS, SHOP, TRAIN, NATIONS, FILL, CUPS, PERKS, HANG, POSTS, FANS, ACH, HT, BUILD, STYLES, CELE, NET, MACT, DERBY, XIDS, TACT, PERKS2, ROLE } from './data.js';

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
// Para birimi: oyun içi tutarlar TL tutulur, seçilen birime sabit kurla çevrilerek gösterilir
const CKEY = 'toprak-saha-para';
export const CUR = { TRY: ['₺', 1, 'Türk lirası'], EUR: ['€', 50, 'Euro'], USD: ['$', 43, 'Dolar'] };
let cur = 'TRY';
try { const c = localStorage.getItem(CKEY); if (CUR[c]) cur = c; } catch (e) { /* depolama kapalı */ }
export const curKey = () => cur;
export const curSym = () => CUR[cur][0];
export function setCur(k) { if (!CUR[k]) return; cur = k; try { localStorage.setItem(CKEY, k); } catch (e) { /* yok */ } }
const cvt = n => Math.abs(n) / CUR[cur][1];
export const fmt = n => (n < 0 ? '−' : '') + CUR[cur][0] + Math.round(cvt(n)).toLocaleString('tr-TR');
export function fmtS(n) {
  const a = cvt(n), sg = n < 0 ? '−' : '', y = CUR[cur][0];
  if (a >= 1e9) return sg + y + (a / 1e9).toFixed(1).replace('.', ',') + ' Mr';
  if (a >= 1e6) return sg + y + (a / 1e6).toFixed(1).replace('.', ',') + ' Mn';
  if (a >= 1e5) return sg + y + Math.round(a / 1e3) + ' B';
  return fmt(n);
}
// Metin içindeki "₺1.500" gibi tutarları seçili para birimine çevirir
export const tl = t => String(t).replace(/₺([\d.]+)/g, (m, x) => fmt(+x.replace(/\./g, '')));
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
    for (const id in S.gen) if (!S.gen[id].c2) S.gen[id].c2 = '#f2f2f2';   // eski kayıtlarda boş kalan ikinci renk
    S.net ??= []; S.diff ??= 'normal'; if (!S.mates || !S.mates.length) genMates(); if (!S.quest) newQuest();
    S.fu ??= []; S.num ??= 9; S.cele ??= 'kayarak'; S.nick ??= ''; if (!S.refs || !S.refs.length) initRefs();
    S.assets = S.assets.filter(id => SHOP.some(x => x.id === id));
    for (const id of XIDS) S.rt[id] ??= CLUBS[id].r;
    S.co ??= {}; S.eps ??= ['en1', 'es1']; S.hon ??= {}; S.ivq ??= []; S.moves ??= []; S.adapt ??= 0; S.cup.top ??= cupTop();
    if (!S.cl || !S.el || S.cl.weeks.length < 13) { delete S.euro; initEuro(euroQual()); }
    if (!S.nt) ntInit();
    if (!S.cs) { S.cs = {}; for (const h of S.hist) { const id = Object.keys(CLUBS).find(k => CLUBS[k].n === h.c) || Object.keys(S.gen).find(k => S.gen[k].n === h.c); if (id) { const c = S.cs[id] || (S.cs[id] = { apps: 0, g: 0 }); c.apps += h.apps; c.g += h.g; } } }
    S.fx ??= {};
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
  shuffle(lg.t); lg.tb = {}; lg.rd = 0; lg.last = []; delete lg.res; delete lg.fm;
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
  for (const id of XIDS) S.rt[id] = CLUBS[id].r;
  for (const lid in S.lg) initLeague(lid);
  S.co = {}; S.eps = ['en1', 'es1']; S.hon = {}; S.ivq = []; S.moves = []; S.adapt = 0; S.cs = {}; S.fx = {}; ntInit();
  S.rival = { n: rname('TR'), ovr: OVR() + ri(1, 4), pot: ri(82, 90), c: '' };
  if (o.wait) return;   // arayüz: ilk kulüp deneme antrenmanlarıyla bulunur
  const lid = 'tr' + O.tier;
  // hızlı başlangıç: forma şansı bulabileceğin güçte bir takım
  const byR = [...S.lg[lid].t].sort((a, b) => S.rt[a] - S.rt[b]), fit = byR.filter(x => S.rt[x] <= OVR() + 1);
  signFirst({ id: pick(fit.length >= 2 ? fit.slice(-5) : byR.slice(0, 3)), role: '11' });
}
// İlk sözleşme: kulüp belli olunca sezonun geri kalanı kurulur
export function signFirst(o) {
  const lid = leagueOf(o.id);
  S.clubId = o.id;
  S.con = { wage: o.wage ?? wageFor(S.rt[o.id], OVR()), until: o.len || 1, role: o.role || '11', goalB: o.goalB || 0 };
  S.con.rel = nice(value() * 4);
  if (o.sign) S.money += o.sign;
  S.rel.hoca = clamp(S.rel.hoca + ({ '11': 6, rot: 0, genc: -5 }[S.con.role] || 0), 0, 100);
  initCup(); initEuro(euroQual()); S.dream = SAK(); initRefs(); assignRef(); genMates(); newQuest();
  S.peak = OVR(); S.peakC = S.rt[S.clubId];
  S.rival.c = club(pick(S.lg[lid].t.filter(x => x !== S.clubId))).n;
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
  if (leagueOf(S.clubId) === lid && !S.mgr) out.push({ n: S.name, team: S.clubId, g: S.st.lg, me: true });
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
  const fm = lg.fm || (lg.fm = {});
  fm[h] = ((fm[h] || '') + (hg > ag ? 'G' : hg < ag ? 'M' : 'B')).slice(-5); fm[a] = ((fm[a] || '') + (ag > hg ? 'G' : ag < hg ? 'M' : 'B')).slice(-5);
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
  const s = S.rel.hoca * 0.5 + (OVR() - S.rt[S.clubId]) * 3.5 + 28 + (S.fl.kaptan ? 8 : 0) + (youngRule() ? 12 : 0) + (tacFit() - 50) * 0.1;
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
  const m = 0.28 * mult * (TRAITS[S.trait].tr || 1) * (1 + eff('tr')) * (Tn.a.length === 1 ? 1.5 : 1) * facF(facOf(S.clubId));
  const gs = Tn.a.map(k => [k, grow(k, m)]);
  fx({ en: -10, hoca: 0.4, prof: 0.4 });
  let inj = 0;
  if (S.en < 15 && chance(.12)) { inj = ri(1, 3); S.inj = inj; }
  return { gs, inj };
}

export function income() {
  const wage = S.con.wage, cut = S.agent ? Math.round(wage * S.agent.cut) : 0;
  const spon = Math.round(S.spon.reduce((a, x) => a + x.wk, 0) * (perk('ikon') ? 1.3 : 1)), biz = eff('inc');
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
  cupRound(ownCup, 'cup'); euroRound(ownEuro, 'cl'); euroRound(ownEuro, 'el');
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
  if (NATW.includes(s.week)) natApply(null);
  if (s.mgr) { mgrTick(); feedWeek(); s.used = 0; s.week++; if (s.week <= WEEKS) assignRef(); return { over: s.week > WEEKS, inc }; }
  if (s.fl.kronik && s.inj <= 0 && chance(.025)) { s.inj = 2; addNews('Kronik sakatlığın nüksetti: iki hafta yoksun.', 'plus'); }
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
  if (s.adapt > 0) s.adapt--;
  if (s.week === 19) coachCheck();
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
  s.eps = euroCoef();
  const eq = euroQual(sorted);
  const pos = sorted[myL].indexOf(s.clubId) + 1, n = sorted[myL].length;
  const lines = [], tro = [], label = seasonLabel();
  const st = { ...s.st }, avg = st.apps ? st.rs / st.apps : 0, mg = !!s.mgr, aw = [];
  if (!mg) s.hist.push({ y: label, c: club(s.clubId).n, l: L.name, apps: st.apps, g: st.g, a: st.a, avg: +avg.toFixed(2), pos, k: s.loan ? 1 : 0 });
  if (pos === 1) {
    tro.push(`${L.name} Şampiyonluğu${mg ? (s.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : ''}`);
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
  // ödül töreni: adaylar ve kazananlar
  const sc3 = scorers(myL).slice(0, 3), star = id => (s.sc[id] && s.sc[id][0] ? s.sc[id][0][0] : rname(L.c)), T3 = sorted[myL].slice(0, 3);
  if (sc3.length && sc3[0].g > 0) aw.push({ t: 'Gol Kralı', i: 'ball', noms: sc3.map(x => ({ n: x.n, c: x.team, v: x.g + ' gol', me: !!x.me })), win: 0 });
  const meIn = !mg && st.apps >= 16 && avg >= 7.1, poy = [{ n: star(T3[0]), c: T3[0], v: 'Şampiyonun yıldızı' }, { n: star(T3[1]), c: T3[1], v: 'Zirve yarışının ismi' }];
  poy.push(meIn ? { n: s.name, c: s.clubId, v: `${st.g} gol · ${avg.toFixed(2).replace('.', ',')} ort.`, me: true } : { n: star(T3[2] || T3[0]), c: T3[2] || T3[0], v: 'Sezonun sürprizi' });
  aw.push({ t: 'Yılın Futbolcusu', i: 'star', noms: poy, win: st.apps >= 22 && avg >= 7.7 && !mg ? 2 : ri(0, meIn ? 1 : 2) });
  if (!mg && s.age <= 21 && st.apps >= 10) aw.push({ t: 'Yılın Genç Oyuncusu', i: 'up', noms: [{ n: s.rival.n, c: null, v: s.rival.c }, { n: rname(L.c), c: pick(sorted[myL].slice(0, 8)), v: 'Çıkış yılı' }, { n: s.name, c: s.clubId, v: `${st.apps} maç · ${avg.toFixed(2).replace('.', ',')} ort.`, me: true }], win: st.apps >= 18 && avg >= 7.2 ? 2 : ri(0, 1) });
  if (mg && s.mgr.role === 'coach') { const ot = sorted[myL].filter(x => x !== s.clubId).slice(0, 2); aw.push({ t: 'Yılın Teknik Direktörü', i: 'whistle', noms: [...ot.map(x => ({ n: coach(x).n, c: x, v: (sorted[myL].indexOf(x) + 1) + '. sıra' })), { n: s.name, c: s.clubId, v: pos + '. sıra', me: true }], win: pos === 1 || pos <= s.mgr.obj - 4 ? 2 : 0 }); if (pos === 1 || pos <= s.mgr.obj - 4) tro.push('Yılın Teknik Direktörü'); }
  const xi = !mg && st.apps >= 20 && avg >= 7.3;
  tro.forEach(t => s.tro.push(label + ' · ' + t));
  const champ = club(sorted[myL][0]).n;
  for (const lid in sorted) s.hon[sorted[lid][0]] = (s.hon[sorted[lid][0]] || 0) + 1;
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
  for (const id of XIDS) s.rt[id] = clamp(s.rt[id] + randn() * .9 + (CLUBS[id].r - s.rt[id]) * .15, 60, 82);
  coachTurn(pos, n, lines);
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
  if (s.fl.kronik && !mg) {
    if (s.fl.kronikOp) { delete s.fl.kronik; delete s.fl.kronikOp; s.inj = 8; lines.push('Sezon arası ameliyat oldun: ilk sekiz hafta yoksun, diz artık sağlam.'); }
    else { s.at.hiz = clamp(s.at.hiz - 1, 1, 99); lines.push('Kronik diz sakatlığı hızını törpülüyor.'); }
  }
  if (s.age >= 31 && !mg) {
    const d = (s.age - 30) * 0.45, soft = (s.fl.bakim ? 0.6 : 1) * (perk('genclik') ? 0.6 : 1);
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
  if (!mg) rivalStep(lines);
  for (const lid in s.lg) initLeague(lid);
  initCup(); initEuro(eq);
  const exp = s.assets.filter(id => SHOP.find(x => x.id === id).yr);
  if (exp.length) { s.assets = s.assets.filter(id => !exp.includes(id)); lines.push('Sezonluk anlaşmaların bitti: ' + exp.map(id => SHOP.find(x => x.id === id).n).join(', ') + '.'); }
  gainXp(2);
  for (const r of s.refs) r.me = clamp(r.me * .5, -1, .6);   // hakemler zamanla unutur
  addNews(`${label} sezonu bitti. ${L.name} şampiyonu ${champ}.`);
  return { label, league: L.name, pos, n, champ, st, avg, tro, lines, moved, aw, xi };
}

// ---------- kupalar: 'cup' ülke kupası; 'cl' Şampiyonlar Ligi, 'el' Avrupa Ligi ----------
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
  s.cup = { name, weeks: CUPW.slice(-Math.log2(teams.length)), alive: shuffle(teams), r: 0, hist: [], champ: null, top: cupTop() };
}
// Ulusal kupa hangi ülkenin Avrupa kontenjanını etkiler (yerel kupalarda yok)
function cupTop() { const lid = leagueOf(S.clubId), L = LMAP[lid]; return L.c !== 'TR' ? lid : L.tier <= 4 ? 'tr1' : null; }

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
      const b = nice(S.con.wage * 10); S.money += b; fx({ mo: 15, taraf: 10, rep: 3 });
      unlock('kupa');
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
    const old = s.clubId, hain = isDerby(old, o.id);
    s.adapt = adaptWeeks(o.id);
    s.moves.push({ y: seasonLabel(), w: s.week, from: old, to: o.id, fee: o.fee || 0, loan: o.loan ? 1 : 0 });
    if (hain) { s.fl.hain = 1; addFeed('taraftar', pick(FANS), `${s.name} ezeli rakibe gitti. Bunu unutmayız.`); addNews('Ezeli rakibe transferin eski taraftarını öfkelendirdi.', 'alert'); }
    if (!o.loan && s.con.until >= s.season) s.hid.sad = clamp(s.hid.sad - 6, 0, 100);
    if (o.loan) s.loan = { from: s.clubId, back: s.season }; else s.loan = null;
    matesToNet(); s.clubId = o.id; genMates();
    s.rel.hoca = { '11': 60, rot: 46, genc: 34 }[o.role];
    s.rel.takim = 45; s.rel.taraf = clamp(28 + s.rep * 0.3 - (s.fl.hain ? 8 : 0), 0, 100); delete s.fl.hain;
    if (s.net.some(c => c.org === o.id)) { s.rel.takim += 8; s.rel.hoca += 4; }
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
// Milli takım haftaları: iki sezonda altı eleme maçı, çift yıllarda yaz turnuvası
const NATW = [9, 17, 27], NTN = { euro: 'Avrupa Şampiyonası', wc: 'Dünya Kupası' };
const WORLD = [['İngiltere', 87], ['Belçika', 82], ['Danimarka', 79], ['Brezilya', 87], ['Arjantin', 88], ['Uruguay', 81], ['Kolombiya', 80], ['ABD', 77], ['Meksika', 77], ['Japonya', 78], ['Güney Kore', 76], ['Fas', 80], ['Senegal', 78], ['Nijerya', 76], ['Avustralya', 73]];
export const myNat = () => (S.nat === 'DE' ? 'Almanya' : 'Türkiye');
const natR = n => (NATIONS.find(x => x[0] === n) || WORLD.find(x => x[0] === n) || [n, 75])[1];
export const natOk = () => !S.mgr && OVR() >= 73 && S.rep >= 45;
function ntInit() {
  const y = S.year + 1, ty = y % 2 === 0 ? y : y + 1, me = myNat(), pool = NATIONS.filter(x => x[0] !== me), pk = f => pick(pool.filter(f))[0];
  S.nt = { kind: ty % 4 === 0 ? 'euro' : 'wc', year: ty, grp: [pk(x => x[1] >= 83), pk(x => x[1] >= 75 && x[1] < 83), pk(x => x[1] < 75)], tb: {}, md: ty === y ? 3 : 0, wk: 0, q: null, tour: null, last: null };
}
const ntMatch = () => { const t = S.nt, i = t.md % 3; return { opp: t.grp[i], home: t.md < 3 ? i % 2 === 0 : i % 2 === 1 }; };
const tbRec = (tb, a, b, ag, bg) => {
  const row = n => tb[n] || (tb[n] = [0, 0, 0, 0, 0, 0]), A = row(a), B = row(b);
  A[0]++; B[0]++; A[4] += ag; A[5] += bg; B[4] += bg; B[5] += ag;
  if (ag > bg) { A[1]++; B[3]++; } else if (ag < bg) { B[1]++; A[3]++; } else { A[2]++; B[2]++; }
};
const tbSort = (tb, names) => names.map(n => { const r = tb[n] || [0, 0, 0, 0, 0, 0]; return { n, p: r[0], w: r[1], d: r[2], l: r[3], gd: r[4] - r[5], gf: r[4], pts: r[1] * 3 + r[2] }; }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || natR(b.n) - natR(a.n));
export const ntTable = () => tbSort(S.nt.tb, [myNat(), ...S.nt.grp]);
export function ntInfo() {
  const t = S.nt, nx = t.md < 6 ? ntMatch() : null, wk = NATW.find(w => w >= S.week);
  return { name: NTN[t.kind], year: t.year, md: t.md, q: t.q, next: nx && wk ? { ...nx, week: wk } : null, last: t.last };
}
// Eleme maç günü. own: {us, opp} oynadıysan; yoksa simüle edilir
export function natApply(own) {
  const t = S.nt; if (!t || t.md >= 6 || t.wk === absWeek()) return;
  t.wk = absWeek();
  const me = myNat(), m = ntMatch(); let us, op;
  if (own) { us = own.us; op = own.opp; } else { const [h, a] = m.home ? simScore(natR(me), natR(m.opp)) : simScore(natR(m.opp), natR(me)); us = m.home ? h : a; op = m.home ? a : h; }
  tbRec(t.tb, me, m.opp, us, op);
  const rest = t.grp.filter(x => x !== m.opp), [h2, a2] = simScore(natR(rest[0]), natR(rest[1])); tbRec(t.tb, rest[0], rest[1], h2, a2);
  t.md++;
  if (!own) addFeed('fed', 'Milli Takımlar', `${NTN[t.kind]} Elemeleri: ${me} ${us}-${op} ${m.opp}.`, 'haber');
  if (t.md === 6) {
    const pos = ntTable().findIndex(r => r.n === me) + 1; t.q = pos <= 2;
    addNews(t.q ? `${me}, ${t.year} ${NTN[t.kind]} biletini aldı!` : `${me} elemelerde ${pos}. oldu; ${t.year} ${NTN[t.kind]} hayali bitti.`, 'flag');
    addFeed('basin', 'Saha Kenarı', t.q ? `${me.toLocaleUpperCase('tr')} ${t.year} ${NTN[t.kind].toLocaleUpperCase('tr')}'NDA!` : `${me} ${NTN[t.kind]}'na gidemiyor.`, 'manset');
  }
}
export function natFixture() {
  const s = S; if (!NATW.includes(s.week) || s.inj > 0 || s.ban > 0 || s.mgr) return null;
  const o = OVR(), me = myNat(); let lvl = null;
  if (natOk()) lvl = 'A'; else if (s.age <= 21 && o >= 56) lvl = 'U21';
  if (!lvl) return null;
  if (lvl === 'A' && s.nt && s.nt.md < 6) { const m = ntMatch(); return { nat: true, lvl, q: true, name: NTN[s.nt.kind] + ' Elemeleri', usN: me, usR: natR(me), opp: { n: m.opp, r: natR(m.opp) }, home: m.home }; }
  const op = pick(NATIONS.filter(x => x[0] !== me)), d = lvl === 'A' ? 0 : -16, suf = lvl === 'A' ? '' : ' U21';
  return { nat: true, lvl, name: 'Hazırlık maçı', usN: me + suf, usR: natR(me) + d, opp: { n: op[0] + suf, r: op[1] + d }, home: true };
}
// Yaz turnuvası: sezon bittikten sonra çağrılır. Bilet yoksa null döner.
export function tourStart() {
  const t = S.nt; if (!t || t.year !== S.year || t.tour) return t && t.tour ? t.tour : null;
  while (t.md < 6) { t.wk = -1; natApply(null); }
  if (!t.q) { ntInit(); return null; }
  const me = myNat(), key = {}, all = (t.kind === 'euro' ? NATIONS : [...NATIONS, ...WORLD]).filter(x => x[0] !== me);
  all.forEach(x => { key[x[0]] = x[1] + rnd(0, 9); });
  const field = all.map(x => x[0]).sort((a, b) => key[b] - key[a]).slice(0, 11), grp = shuffle([...field]).slice(0, 3);
  t.tour = { name: `${t.year} ${NTN[t.kind]}`, me: natOk() && S.inj <= 0, grp, tb: {}, md: 0, st: 'g', pool: field.filter(x => !grp.includes(x)), res: [], next: null };
  addFeed('fed', 'Milli Takımlar', `${t.tour.name} başlıyor. ${me} grubu: ${grp.join(', ')}.`, 'manset');
  return t.tour;
}
const TRN = { qf: 'Çeyrek final', sf: 'Yarı final', f: 'Final' };
export function tourFixture() {
  const T = S.nt && S.nt.tour; if (!T || T.st === 'out' || T.st === 'champ') return null;
  const me = myNat(), g = T.st === 'g', opp = g ? T.grp[T.md] : T.next;
  return { nat: true, lvl: 'A', tour: true, kof: !g, final: T.st === 'f', name: T.name, round: g ? `Grup ${T.md + 1}/3` : TRN[T.st], usN: me, usR: natR(me), opp: { n: opp, r: natR(opp) } };
}
// own: {us, opp, win} oynadıysan; yoksa simüle edilir
export function tourRound(own) {
  const T = S.nt.tour, me = myNat(), f = tourFixture(); if (!f) return;
  let us, op, win;
  if (own) { us = own.us; op = own.opp; win = own.win; } else { [us, op] = simScore(f.usR - 2, f.opp.r); win = us > op || (us === op && chance(.5)); }
  T.res.push([f.round, f.opp.n, us, op, f.kof ? (win ? 1 : 0) : us > op ? 1 : us < op ? 0 : 2]);
  const draw = () => { T.pool.sort((a, b) => natR(b) - natR(a)); return T.pool.splice(ri(0, Math.min(3, T.pool.length - 1)), 1)[0]; };
  if (T.st === 'g') {
    tbRec(T.tb, me, f.opp.n, us, op);
    const rest = T.grp.filter(x => x !== f.opp.n), [h, a] = simScore(natR(rest[0]) - 2, natR(rest[1])); tbRec(T.tb, rest[0], rest[1], h, a);
    T.md++;
    if (T.md === 3) { if (tbSort(T.tb, [me, ...T.grp]).findIndex(r => r.n === me) < 2) { T.st = 'qf'; T.next = draw(); } else T.st = 'out'; }
  } else if (!win) T.st = 'out';
  else if (T.st === 'f') T.st = 'champ';
  else { T.st = T.st === 'qf' ? 'sf' : 'f'; T.next = draw(); }
  if (T.st !== 'out' && T.st !== 'champ') return;
  const champ = T.st === 'champ', last = { name: T.name, res: T.res, champ, me: T.me, stage: champ ? 'Şampiyon' : T.res[T.res.length - 1][0] };
  if (champ) {
    if (T.me) { S.tro.push(T.name); fx({ rep: 12, taraf: 10, mo: 20, fol: Math.round(5000 + S.fol * .3) }); unlock('milk'); }
    addNews(`${me} ${T.name} ŞAMPİYONU!`, 'trophy'); addFeed('basin', 'Saha Kenarı', `TARİHÎ GECE: ${me.toLocaleUpperCase('tr')} ${T.name.toLocaleUpperCase('tr')} ŞAMPİYONU!`, 'manset');
  } else addNews(`${me}, ${T.name} yolculuğunu ${last.stage.toLocaleLowerCase('tr')} aşamasında noktaladı.`, 'flag');
  ntInit(); S.nt.last = last;
}
export const tourTable = () => { const T = S.nt.tour; return T ? tbSort(T.tb, [myNat(), ...T.grp]) : []; };


// ---------- maç ----------
const MATTR = { sut: ['sut'], kafa: ['kafa'], frikik: ['sut', 'teknik'], penalti: ['sut', 'zihin'], pas: ['pas'], calim: ['teknik'], savunma: ['savunma'], kurtaris: ['kaleci'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'] };
const XP = { sut: ['sut', 'zihin'], kafa: ['kafa', 'guc'], frikik: ['sut', 'teknik'], penalti: ['zihin', 'sut'], pas: ['pas', 'zihin'], calim: ['teknik', 'hiz'], savunma: ['savunma', 'guc'], kurtaris: ['kaleci', 'zihin'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'] };
export const GOOD = ['gol', 'ok', 'gecti', 'kapildi', 'kurtardi'];
export function skillFor(k) { const a = MATTR[k]; return a.reduce((s, x) => s + S.at[x], 0) / a.length + (has('krampon') ? 2 : 0); }

export function buildMatch(fxt, rl) {
  const nat = !!fxt.nat;
  const usR = nat ? fxt.usR : S.rt[S.clubId], oppR = (nat ? fxt.opp.r : S.rt[fxt.opp]) + (fxt.boost || 0);
  const ref = nat ? null : curRef(), stam = clamp(55 + S.en * .45, 40, 100);
  const hb = fxt.final || fxt.tour || (nat && !fxt.q) ? 0 : fxt.home ? 2 : fxt.eu ? -3.5 : -2, def = S.pos === 'DF' || S.pos === 'KL';
  const tac = nat ? null : coach().st, T = tac ? TACT[tac] : { lu: 1, lo: 1, st: 1 }, fit = nat ? 50 : tacFit();
  const lu = 1.3 * Math.exp((usR + hb - oppR) * 0.05) * (def ? 0.95 : 0.6) * T.lu;
  const lo = 1.2 * Math.exp((oppR - hb - usR) * 0.05) * (S.pos === 'KL' ? 0.25 : def ? 0.55 : 0.95) * T.lo;
  const tl = [];
  for (let i = poisson(clamp(lu, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: true });
  for (let i = poisson(clamp(lo, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: false });
  const derby = !nat && isDerby(S.clubId, fxt.opp);
  const from = rl === 'yedek' ? ri(58, 70) : 1, n = (rl === 'yedek' ? ri(1, 2) : ri(3, 5)) + (derby ? 1 : 0);
  const tasks = nat ? [] : pickTasks(tac, rl), need = tasks.flatMap(t => TASKS[t].need || []);
  for (let i = 0; i < Math.max(n, need.length); i++) tl.push({ min: ri(from + 1, 90), t: 'mom', k: need[i] || wpick(momW(tac)), fix: !!need[i] });
  if (rl === '11' && !nat && chance(.5)) tl.push({ min: ri(56, 72), t: 'tac' });
  shuffle([...FILL]).slice(0, 4).forEach(x => tl.push({ min: ri(3, 88), t: 'txt', s: x }));
  if (rl === '11' && !nat) { tl.push({ min: 45, t: 'dec', k: 'ht' }); if (chance(.4)) tl.push({ min: ri(50, 84), t: 'dec', k: pick(['pen', 'ref', 'knock']) }); }
  if (rl === 'yedek') tl.push({ min: from, t: 'txt', s: 'Hoca seni çağırdı. Oyuna giriyorsun!' });
  tl.sort((a, b) => a.min - b.min || (a.t === 'txt' ? -1 : 1));
  return { fxt, nat, cup: !!fxt.cup, ko: (!!fxt.cup && !fxt.lg && fxt.leg !== 1) || !!fxt.kof, agg: fxt.agg || [0, 0], awayEu: !!fxt.eu && !fxt.home && !fxt.final, eu: fxt.eu || null, role: rl, usR, oppR, tl, usG: 0, oppG: 0, pg: 0, pa: 0, rt: 6 + clamp((fit - 50) / 120, -.25, .3), yel: 0, red: false, mom: 0, ok: 0,
    tac, tac0: tac, fit, tasks, drain: T.st, cnt: { pas: 0, orta: 0, calim: 0, sav: 0, kurt: 0, bad: 0, on: 0 },
    big: perk('buyuk') && (derby || !!fxt.eu || !!fxt.final || !!fxt.po), adapt: !nat && S.adapt > 0,
    derby, stam, stam0: stam, mode: 'n', calls: 2, crowd: !nat && fxt.home ? 1 : 0, ref, bias: ref ? clamp(refBias(ref, S.clubId) - refBias(ref, fxt.opp) * .5 + ref.me, -1.2, 1.2) : 0 };
}

export function simMoment(k, M) {
  const base = { sut: .2, kafa: .17, frikik: .08, penalti: .76, pas: .62, calim: .45, savunma: .58, kurtaris: .74, vole: .15, rovesata: .07, orta: .48, korner: .45 }[k];
  const shot = k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'vole' || k === 'rovesata';
  const ok = chance(clamp(base + (skillFor(k) - M.oppR) * (shot ? 0.008 : 0.013) + (M.focus ? .06 : 0) + (M.big ? .04 : 0) - (M.adapt ? .03 : 0) - (M.awayEu ? .02 : 0) + (S.diff === 'kolay' ? .04 : S.diff === 'zor' ? -.04 : 0) + (k === 'penalti' && perk('buz') ? .1 : 0), .05, shot ? .42 : .92));
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
  const cn = M.cnt || (M.cnt = { pas: 0, orta: 0, calim: 0, sav: 0, kurt: 0, bad: 0, on: 0 });
  if (out === 'ok') { cn.pas++; if (k !== 'pas') cn.orta++; }
  if (out === 'gecti') cn.calim++; if (out === 'kapildi') cn.sav++; if (out === 'kurtardi') cn.kurt++;
  if (out === 'gol' || out === 'kurtaris' || out === 'direk') cn.on++;
  if (['kesildi', 'bos', 'kaptirdi', 'gec', 'iska'].includes(out)) cn.bad++;
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
      else { M.rt += 0.35; lines.push({ s: k === 'orta' ? 'Ortan adrese gitti ama vuruş dışarıda.' : k === 'korner' ? 'Kornerin ceza sahasını karıştırdı.' : 'Pasın yerini buldu, atak sürdü.' }); }
    } else if (out === 'kesildi') {
      M.rt -= 0.3; lines.push({ s: k === 'pas' ? 'Pasın kesildi.' : 'Savunma ortanı uzaklaştırdı.' });
      if (chance(.15)) { M.oppG++; M.rt -= 0.2; lines.push({ s: 'Kontra atak golle bitti.', c: 'b' }); }
    } else { M.rt -= 0.2; lines.push({ s: k === 'pas' ? 'Pasın kimseyi bulmadı.' : 'Ortan boşa gitti, kimse yetişemedi.' }); }
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
    const cs = s.cs[s.clubId] || (s.cs[s.clubId] = { apps: 0, g: 0 }); cs.apps++; cs.g += M.pg;
    if (M.pg && !s.fl['lg_' + s.clubId] && legendRank(s.clubId).pos <= 3) { s.fl['lg_' + s.clubId] = 1; unlock('efsane'); fx({ taraf: 8, rep: 2 }); lines.push(`${club(s.clubId).n} tarihinin en golcü üç isminden birisin`); addFeed('c:' + s.clubId, club(s.clubId).n, `${s.name} artık kulüp tarihinin en golcü üç isminden biri.`, 'kulup'); }
    if (M.capFire) fx({ takim: win ? 2 : lose ? -3 : 0, mo: lose ? -3 : 0 });
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
    if (M.tasks && M.tasks.length) {
      const ts = taskState(M), done = ts.filter(t => t.ok).length, k2 = perk('taktik') ? 2 : 1;
      M.tdone = done;
      if (done === ts.length) { lines.push('Görevler tamam · ' + (fx({ hoca: (2.5 * done + 1.5) * k2 })[0] || 'Hoca güveni +')); gainXp(1); }
      else if (done) lines.push(`Görev ${done}/${ts.length} · ` + (fx({ hoca: 2.5 * done * k2 })[0] || 'Hoca güveni +'));
      else lines.push('Görevler yapılmadı · ' + (fx({ hoca: -3 })[0] || 'Hoca güveni −'));
    }
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
  if (chance((0.015 + tired) * (M.role === '11' ? 1 : .5) * (M.risk || 1) * (perk('celik') ? .6 : 1) * (s.fl.kronik ? 1.8 : 1))) {
    const r = Math.random();
    if (r < .7) { s.inj = ri(1, 3); lines.push(`Maçta sakatlandın: ${s.inj} hafta yoksun.`); }
    else if (r < .92) { s.inj = ri(4, 8); lines.push(`Kas yırtığı: ${s.inj} hafta yoksun.`); s.q.push({ id: 'kas', at: absWeek() + 1 }); }
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
const myPerks = () => PERKS.filter(p => p.no !== S.pos && (!p.only || p.only === S.pos));
// 1: ilk kademe sürüyor, 2: usta yetenekleri açık, 3: hepsi tamam, ustalık puanı harcanır
export const perkTier = () => (!myPerks().every(p => perk(p.id)) ? 1 : !PERKS2.every(p => perk(p.id)) ? 2 : 3);
export function buyPerk(id) {
  const p = PERKS.find(x => x.id === id) || (perkTier() >= 2 && PERKS2.find(x => x.id === id));
  if (!p || perk(id) || S.pp < p.c) return false; S.pp -= p.c; S.perks.push(id); return true;
}
// Ustalık: bütün yetenekler açıldıktan sonra puanla seçtiğin özellik +1 (bedel giderek artar)
export const boostCost = () => 3 + Math.floor((S.boost || 0) / 3);
export const boostMax = () => Math.min(99, S.pot + 4);
export function buyBoost(k) { const c = boostCost(); if (perkTier() < 3 || S.pp < c || !(k in S.at) || S.at[k] >= boostMax()) return false; S.pp -= c; S.at[k] = clamp(S.at[k] + 1, 1, 99); S.boost = (S.boost || 0) + 1; return true; }
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
    else { M.risk = Math.max(M.risk || 1, 2); add.push({ min: ri(50, 88), t: 'mom', k: wpick(momW(M.tac)) }); L.push({ s: 'Her topa gireceksin: fazladan pozisyon, fazladan risk.' }); }
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
  const f = fixture() || cupFixture() || euroFixture('cl') || euroFixture('el'); if (!f) return;
  S.refi = ri(0, S.refs.length - 1); const i = refInfo();
  addFeed('fed', 'Hakem Kurulu', `${club(f.opp).n} maçına ${i.n} atandı. ${i.style}. Takımınıza tutumu: ${i.att.toLocaleLowerCase('tr')}.`, 'haber');
  if (isDerby(S.clubId, f.opp)) addFeed('basin', 'Saha Kenarı', `DERBİ HAFTASI: ${club(S.clubId).n} - ${club(f.opp).n}. Şehir bu maçı konuşuyor.`, 'manset');
}
// Gol sonrası VAR incelemesi. us: gol bizim mi. null dönerse inceleme yok.
export function varCheck(M, us) {
  if (!M.ref || !chance(.05 + M.ref.vr * .1)) return null;
  return { cancel: chance(clamp(.42 - (us ? M.bias : -M.bias) * .16, .1, .8)), why: pick(['ofsayt', 'elle oynama', 'faul']) };
}

export function bigMatch(f) {
  if (isDerby(S.clubId, f.opp) || f.po) return true;
  if (f.eu) return f.eu === 'cl' || !f.lg;
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
export const chem = () => clamp((S.mates && S.mates.length ? S.mates.reduce((a, m) => a + m.b, 0) / S.mates.length / 100 : .3) + (perk('lider') ? .15 : 0), 0, 1);
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

// ---------- Avrupa kupaları ----------
// Kontenjanlar UEFA ülke sıralamasına göre: [doğrudan Şampiyonlar Ligi, ŞL eleme turu, Avrupa Ligi]
export const EUQ = { en1: [4, 0, 2], es1: [4, 0, 2], it1: [4, 0, 2], de1: [4, 0, 2], fr1: [3, 1, 2], nl1: [2, 1, 2], pt1: [1, 1, 2], tr1: [1, 1, 2] };
export const EUN = { cl: 'Şampiyonlar Ligi', el: 'Avrupa Ligi' };
const EUW = [3, 6, 8, 11, 13, 15, 18, 20, 24, 26, 30, 32, 36], EUMD = 6;   // lig aşaması, sonra çift maçlı turlar ve tek maç final
// S.eps: geçen sezon Avrupa'da en iyi iki ülke, fazladan bir Şampiyonlar Ligi bileti alır
export function euroSpots(lid) { const q = EUQ[lid]; if (!q) return null; return { cl: q[0] + ((S.eps || []).includes(lid) ? 1 : 0), clq: q[1], el: q[2] }; }
export function euroZone(lid, i) { const q = euroSpots(lid); if (!q) return ''; return i < q.cl ? 'cl' : i < q.cl + q.clq ? 'clq' : i < q.cl + q.clq + q.el ? 'el' : ''; }
export const euroOf = id => (S.cl && S.cl.teams.includes(id) ? 'cl' : S.el && S.el.teams.includes(id) ? 'el' : null);

// Önceki sezonun sıralamasına (ilk sezonda güce) göre Avrupa'ya gidenler. Kupa şampiyonu Avrupa Ligi'ne gider.
function euroQual(sorted) {
  const cl = [], q = [], el = [], cw = S.cup && S.cup.champ && S.cup.top ? S.cup.champ : null;
  for (const l in EUQ) {
    const t = sorted ? sorted[l] : [...S.lg[l].t].sort((a, b) => S.rt[b] - S.rt[a]), sp = euroSpots(l), i = sp.cl + sp.clq, mine = [];
    cl.push(...t.slice(0, sp.cl)); q.push(...t.slice(sp.cl, i));
    if (cw && S.cup.top === l && !t.slice(0, i).includes(cw)) mine.push(cw);
    for (const id of t.slice(i)) { if (mine.length >= sp.el) break; if (!mine.includes(id)) mine.push(id); }
    el.push(...mine);
  }
  return { cl, q, el };
}
function initEuro(q) {
  const key = {}; XIDS.forEach(id => { key[id] = S.rt[id] + rnd(0, 6); });
  const xs = [...XIDS].sort((a, b) => key[b] - key[a]), cl = [...q.cl], el = [...q.el], pre = [];
  for (const id of q.q) {   // eleme turu: iki maç toplamı, kaybeden Avrupa Ligi'ne
    const x = xs.splice(ri(3, 10), 1)[0], [a, b] = simScore(S.rt[id], S.rt[x]), [c, d] = simScore(S.rt[x], S.rt[id]);
    const us = a + d, th = b + c, w = us > th || (us === th && chance(.5)) ? id : x;
    cl.push(w); el.push(w === id ? x : id); pre.push([id, x, us, th, w]);
  }
  while (cl.length < 32 && xs.length) cl.push(xs.shift());
  while (el.length < 32 && xs.length) el.push(xs.shift());
  const mk = (k, teams, pr) => ({ key: k, name: EUN[k], weeks: EUW, teams: shuffle(teams), tb: {}, r: 0, alive: [], hist: pr && pr.length ? [{ n: 'Eleme turu', res: pr, q: 1 }] : [], champ: null, leg1: null });
  S.cl = mk('cl', cl, pre); S.el = mk('el', el);
  if (!S.clubId) return;
  const m = pre.find(x => x[0] === S.clubId);
  if (m) addNews(m[4] === S.clubId ? `Şampiyonlar Ligi elemesinde ${club(m[1]).n} geçildi: ${m[2]}-${m[3]}.` : `Şampiyonlar Ligi elemesinde ${club(m[1]).n} turladı (${m[2]}-${m[3]}). Yola Avrupa Ligi'nde devam.`, 'trophy');
  const k = euroOf(S.clubId); if (k) { addNews(`Bu sezon ${EUN[k]} sahnesindesiniz.`, 'trophy'); S.pop.push(EUN[k] + ' bileti'); }
}
export function euroTable(k) {
  const c = S[k];
  return c.teams.map(id => { const r = c.tb[id] || [0, 0, 0, 0, 0, 0]; return { id, p: r[0], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[1] * 3 + r[2], gd: r[4] - r[5] }; })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || S.rt[b.id] - S.rt[a.id]);
}
// Eleme turları çift maçlı: 1 ilk maç, 2 rövanş, 0 final (tek maç)
const koLeg = c => (c.alive.length === 2 ? 0 : ((c.r - EUMD) % 2) + 1);
export function euroNext(k) {
  const c = S[k]; if (!c || c.champ || !S.clubId || !c.teams.includes(S.clubId)) return null;
  if (c.r < EUMD) { const p = roundPairs(c.teams, c.r).find(x => x.includes(S.clubId)); return { week: c.weeks[c.r], round: `Lig aşaması ${c.r + 1}/${EUMD}`, opp: p[0] === S.clubId ? p[1] : p[0], home: p[0] === S.clubId, lg: true }; }
  const i = c.alive.indexOf(S.clubId); if (i < 0) return null;
  const leg = koLeg(c), nm = cupRoundName(c.alive.length); let agg = null;
  if (leg === 2) { const f = c.leg1[i >> 1]; agg = f[0] === S.clubId ? [f[2], f[3]] : [f[3], f[2]]; }
  // lig aşamasını üstte bitiren rövanşı evinde oynar
  return { week: c.weeks[c.r], round: nm + (leg === 1 ? ' · ilk maç' : leg === 2 ? ' · rövanş' : ''), opp: c.alive[i ^ 1], home: leg === 0 || (leg === 1 ? i % 2 === 1 : i % 2 === 0), final: leg === 0, leg, agg };
}
export function euroFixture(k) { const n = euroNext(k); return n && S.week === n.week ? { cup: true, key: k, eu: k, name: S[k].name, ...n } : null; }
function euroRound(own, k) {
  const c = S[k]; if (!c || c.champ || S.week !== c.weeks[c.r]) return;
  const res = [], mine = (h, a) => own && (h === S.clubId || a === S.clubId);
  if (c.r < EUMD) {
    for (const [h, a] of roundPairs(c.teams, c.r)) {
      let hg, ag;
      if (mine(h, a)) { hg = h === S.clubId ? own.us : own.opp; ag = h === S.clubId ? own.opp : own.us; } else [hg, ag] = simScore(S.rt[h], S.rt[a]);
      const row = id => c.tb[id] || (c.tb[id] = [0, 0, 0, 0, 0, 0]), H = row(h), A = row(a);
      H[0]++; A[0]++; H[4] += hg; H[5] += ag; A[4] += ag; A[5] += hg;
      if (hg > ag) { H[1]++; A[3]++; } else if (hg < ag) { A[1]++; H[3]++; } else { H[2]++; A[2]++; }
      res.push([h, a, hg, ag, null]);
    }
    c.hist.push({ n: `Lig aşaması · ${c.r + 1}. maç`, res, lg: 1 }); c.r++;
    if (c.r === EUMD) {   // ilk 16 eleme turlarına kalır: 1.-16., 2.-15. ...
      const top = euroTable(k).map(r => r.id).slice(0, 16); c.alive = [];
      for (let i = 0; i < 8; i++) c.alive.push(top[i], top[15 - i]);
      if (c.teams.includes(S.clubId)) {
        const pos = euroTable(k).findIndex(r => r.id === S.clubId) + 1;
        addNews(pos <= 16 ? `${c.name}: lig aşamasını ${pos}. bitirdiniz, son 16'dasınız.` : `${c.name}: lig aşamasında ${pos}. oldunuz ve elendiniz.`, 'trophy');
        if (pos <= 16) fx({ rep: k === 'cl' ? 2 : 1, taraf: 4 });
      }
    }
    return;
  }
  const leg = koLeg(c), nm = cupRoundName(c.alive.length), sc = (h, a) => { if (mine(h, a)) return h === S.clubId ? [own.us, own.opp] : [own.opp, own.us]; return simScore(S.rt[h], S.rt[a]); };
  if (leg === 1) {   // ilk maç: alt sıradaki ev sahibi
    for (let i = 0; i < c.alive.length; i += 2) { const h = c.alive[i + 1], a = c.alive[i], [hg, ag] = sc(h, a); res.push([h, a, hg, ag, null]); }
    c.leg1 = res; c.hist.push({ n: nm + ' · ilk maç', res, ko: 1 }); c.r++;
    return;
  }
  const next = [];
  for (let i = 0; i < c.alive.length; i += 2) {
    const h = c.alive[i], a = c.alive[i + 1], f = leg === 2 ? c.leg1[i >> 1] : null; let [hg, ag] = sc(h, a), w;
    if (leg === 0 && !mine(h, a)) [hg, ag] = simScore(S.rt[h] - 2, S.rt[a]);   // final tarafsız sahada
    const th = hg + (f ? f[3] : 0), ta = ag + (f ? f[2] : 0);
    if (mine(h, a)) w = own.win ? S.clubId : (h === S.clubId ? a : h);
    else w = th > ta ? h : ta > th ? a : (chance(.5) ? h : a);
    next.push(w); res.push(f ? [h, a, hg, ag, w, th, ta] : [h, a, hg, ag, w]);
  }
  c.hist.push({ n: nm + (leg === 2 ? ' · rövanş' : ''), res, ko: 1 }); c.alive = next; c.leg1 = null; c.r++;
  const me = res.find(x => x[0] === S.clubId || x[1] === S.clubId);
  if (next.length === 1) {
    c.champ = next[0];
    if (c.champ === S.clubId) {
      S.tro.push(seasonLabel() + ' · ' + c.name + (S.mgr ? (S.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : ''));
      const b = nice(S.con.wage * (k === 'cl' ? 24 : 14)); S.money += b; fx({ mo: 18, taraf: 12, rep: k === 'cl' ? 7 : 4 });
      unlock(k === 'cl' ? 'avrupa' : 'al');
      addNews(`${c.name} şampiyonusunuz! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
    addFeed('basin', 'Saha Kenarı', `${c.name} şampiyonu: ${club(c.champ).n}!`, 'manset');
  } else if (me) addNews(me[4] === S.clubId ? `${c.name}: toplamda ${Math.max(me[5], me[6])}-${Math.min(me[5], me[6])} ile tur atladınız.` : `${c.name}: toplamda elendiniz.`, 'trophy');
}
// Ülke katsayısı: Avrupa'daki ortalama başarı. En iyi iki lig gelecek sezon fazladan ŞL bileti alır.
function euroCoef() {
  const pts = {}, cnt = {};
  for (const k of ['cl', 'el']) {
    const c = S[k]; if (!c) continue;
    for (const id of c.teams) { const l = leagueOf(id); if (!EUQ[l]) continue; const r = c.tb[id] || [0, 0, 0]; pts[l] = (pts[l] || 0) + r[1] * 2 + r[2] + (k === 'cl' ? 3 : 0); cnt[l] = (cnt[l] || 0) + 1; }
    for (const h of c.hist) if (!h.q && !h.lg) for (const x of h.res) { const l = x[4] ? leagueOf(x[4]) : null; if (l && cnt[l]) pts[l] += k === 'cl' ? 2 : 1.5; }
  }
  const out = Object.keys(EUQ).filter(l => cnt[l]).sort((a, b) => pts[b] / cnt[b] - pts[a] / cnt[a]).slice(0, 2);
  return out.length === 2 ? out : ['en1', 'es1'];
}

// ---------- hoca, taktik ve maç görevleri ----------
const hsh = t => { let h = 0; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
export function coach(id = S.clubId) {
  const co = S.co || (S.co = {});
  if (!co[id]) { const lid = leagueOf(id); co[id] = { n: rname(lid ? LMAP[lid].c : pick(['EN', 'DE', 'NL'])), st: pick(Object.keys(TACT)) }; }
  return co[id];
}
// Taktiğe uyum (10-99): mevkin ve hocanın aradığı özellik
export function tacFit(id = S.clubId) {
  if (!id) return 50;
  const T = TACT[coach(id).st], o = OVR(); let f = 50;
  if (T.fit.includes(S.pos)) f += 14; else if (T.bad.includes(S.pos)) f -= 10;
  f += clamp((S.at[T.key] - o) * 1.6, -18, 22);
  if (perk('taktik')) f = Math.max(f, 72);
  return Math.round(clamp(f, 10, 99));
}
function newCoach(why) {
  const old = coach(), st = pick(Object.keys(TACT).filter(k => k !== old.st));
  S.co[S.clubId] = { n: rname(LMAP[leagueOf(S.clubId)].c), st };
  S.rel.hoca = clamp(S.rel.hoca * .45 + 24, 0, 100);
  const c = S.co[S.clubId];
  addNews(`${old.n} ${why}. Yeni hoca ${c.n}: ${TACT[st].n.toLocaleLowerCase('tr')}.`, 'whistle');
  addFeed('c:' + S.clubId, club(S.clubId).n, `Teknik direktörlük görevine ${c.n} getirildi.`, 'kulup'); S.pop.push('Yeni hoca: ' + c.n);
  return c;
}
function coachCheck() {   // devre arası: kötü gidişte hoca gider
  if (S.mgr) return;
  const t = table(leagueOf(S.clubId)).map(r => r.id), pos = t.indexOf(S.clubId) + 1;
  if (pos > t.length - 3 && chance(.5)) newCoach('görevden alındı');
}
function coachTurn(pos, n, lines) {
  for (const id in S.co) if (id !== S.clubId && chance(.3)) delete S.co[id];
  if (!S.mgr && ((pos > n * .7 && chance(.6)) || chance(.1))) { const c = newCoach(pos > n * .7 ? 'ile yollar ayrıldı' : 'başka bir kulübe gitti'); lines.push(`Yeni hoca: ${c.n} (${TACT[c.st].n})`); }
}
// Maç anı ağırlıkları: mevki tabanı, hocanın taktiğiyle şekillenir
export function momW(tac) {
  const m = { ...POS[S.pos].m }, T = TACT[tac]; if (!T) return m;
  for (const k in T.m) if (m[k]) m[k] *= T.m[k];
  if (S.pos !== 'KL') for (const k in T.add || {}) if (!m[k]) m[k] = T.add[k];
  return m;
}
export const momPick = M => wpick(momW(M && M.tac));
// Maç içinde hoca sistemi değiştirir: kalan anlar yeni taktiğe göre şekillenir
export function tacShift(M, min) {
  const d = M.usG - M.oppG, nt = pick(d < 0 ? ['hucum', 'kanat'] : d > 0 ? ['otobus', 'kontra'] : ['pres', 'top', 'kanat']), add = [], cn = coach().n;
  if (nt === M.tac) return { line: `${cn} kenardan bağırıyor: "Aynen devam!"`, add };
  M.tac = nt; M.drain = TACT[nt].st;
  for (const e of M.tl) if (e.t === 'mom' && e.min > min && !e.fix) e.k = wpick(momW(nt));
  if (nt === 'hucum' || nt === 'kanat') {
    if (chance(.5)) add.push({ min: ri(min + 1, 90), t: 'bg', us: chance(.6) });
    if (S.pos !== 'KL' && chance(.5)) add.push({ min: ri(min + 1, 89), t: 'mom', k: wpick(momW(nt)) });
  } else if (nt === 'otobus') { const i = M.tl.findIndex(e => e.t === 'bg' && !e.us && e.min > min); if (i >= 0 && chance(.5)) M.tl.splice(i, 1); }
  return { line: `${cn} sistemi değiştirdi: ${TACT[nt].n}. ${TACT[nt].d}`, add };
}

// Hocanın maç görevleri. need: görev için maçta karşına çıkması gereken anlar
const ALLP = ['KL', 'DF', 'OS', 'KN', 'FV'];
export const TASKS = {
  gol: { t: 'Gol at', pos: ['FV', 'KN'], need: ['sut'], ex: ['katki', 'isabet'], ok: M => M.pg >= 1 },
  katki: { t: 'Gole katkı yap', pos: ['FV', 'KN', 'OS'], ex: ['gol'], ok: M => M.pg + M.pa >= 1 },
  isabet: { t: 'Kaleyi yokla: isabetli şut', pos: ['FV', 'KN', 'OS'], tac: ['hucum'], need: ['sut'], ex: ['gol'], ok: M => M.cnt.on >= 1 },
  pas2: { t: '2 isabetli pas ya da orta', pos: ['OS', 'DF', 'KN', 'KL'], tac: ['top'], need: ['pas', 'pas'], ok: M => M.cnt.pas >= 2, pr: M => Math.min(2, M.cnt.pas) + '/2' },
  orta1: { t: 'İsabetli bir orta aç', pos: ['KN', 'DF', 'OS', 'FV'], tac: ['kanat'], need: ['orta'], ok: M => M.cnt.orta >= 1 },
  calim1: { t: 'Adamını çalımla geç', pos: ['KN', 'FV', 'OS'], tac: ['kontra', 'hucum'], need: ['calim'], ok: M => M.cnt.calim >= 1 },
  sav2: { t: '2 başarılı müdahale', pos: ['DF', 'OS'], tac: ['pres', 'otobus'], need: ['savunma', 'savunma'], ex: ['sav1'], ok: M => M.cnt.sav >= 2, pr: M => Math.min(2, M.cnt.sav) + '/2' },
  sav1: { t: 'Geriye yardım et: bir top kap', pos: ['KN', 'FV'], tac: ['pres', 'otobus'], need: ['savunma'], ex: ['sav2'], ok: M => M.cnt.sav >= 1 },
  temiz: { t: 'Kart görme', pos: ['DF', 'OS'], ok: M => !M.red && M.yel === 0 },
  kale: { t: 'Kaleni gole kapat', pos: ['DF', 'KL'], tac: ['otobus'], ok: M => M.oppG === 0 },
  kurt2: { t: '2 kurtarış yap', pos: ['KL'], need: ['kurtaris', 'kurtaris'], ok: M => M.cnt.kurt >= 2, pr: M => Math.min(2, M.cnt.kurt) + '/2' },
  kayip: { t: 'En fazla 1 top kaybı', pos: ['OS', 'KN', 'FV', 'DF'], tac: ['top'], ok: M => M.cnt.bad <= 1 },
  not7: { t: 'Maç notun 7,0 olsun', pos: ALLP, ok: M => M.rt >= 7 },
};
function pickTasks(tac, rl) {
  if (rl !== '11' && rl !== 'yedek') return [];
  const w = {}, out = [];
  for (const id in TASKS) { const T = TASKS[id]; if (!T.pos.includes(S.pos) || (rl === 'yedek' && (T.need || []).length > 1)) continue; w[id] = T.tac ? (T.tac.includes(tac) ? 3 : .5) : 1; }
  for (let i = 0; i < (rl === '11' ? 2 : 1) && Object.keys(w).length; i++) { const id = wpick(w); out.push(id); delete w[id]; (TASKS[id].ex || []).forEach(e => delete w[e]); }
  return out;
}
export const taskState = M => (M.tasks || []).map(id => ({ id, t: TASKS[id].t, ok: !!TASKS[id].ok(M), pr: TASKS[id].pr ? TASKS[id].pr(M) : '' }));

// ---------- kulüp profili ve transfer analizi ----------
// Tesis düzeyi (1-5): antrenman verimini belirler
export function facOf(id) { const r = S.rt[id] || 30, h = hsh(club(id).n); return clamp(Math.floor((r - 22) / 13) + 1 + (h % 5 === 0 ? 1 : h % 7 === 0 ? -1 : 0) + ((S.fx || {})[id] || 0), 1, 5); }
const facF = f => 0.94 + f * 0.05;
const lavg = lid => { const t = S.lg[lid].t; return t.reduce((a, x) => a + S.rt[x], 0) / t.length; };
export function clubInfo(id) {
  const c = club(id), lid = leagueOf(id), L = lid ? LMAP[lid] : null, r = S.rt[id], h = hsh(c.n);
  const tb = lid ? table(lid) : [], pos = tb.findIndex(x => x.id === id) + 1, co = coach(id), eu = euroOf(id), ec = eu ? S[eu] : null;
  const grp = DERBY.find(g => g.includes(c.n));
  return {
    id, n: c.n, c1: c.c1, c2: c.c2, lid, lname: L ? L.name : 'Avrupa', country: L ? L.c : null, land: c.x || null, tier: L ? L.tier : 0, lavg: lid ? lavg(lid) : r,
    r, pos, size: tb.length, row: tb[pos - 1] || null, form: lid ? ((S.lg[lid].fm || {})[id] || '') : '',
    fac: facOf(id), cap: Math.max(150, Math.round(Math.pow(Math.max(r - 18, 3), 2.6) * (.8 + (h % 40) / 100) / 50) * 50), fans: clamp(Math.round((r - 20) / 14 + (h % 3)), 1, 5),
    coach: co.n, tac: co.st, fit: tacFit(id), eu, euOut: !!ec && ec.r >= EUMD && !ec.champ && !ec.alive.includes(id), euChamp: !!ec && ec.champ === id,
    sc: S.sc[id] || [], hon: (S.hon || {})[id] || 0, watch: S.watch.find(w => w.id === id) || null, dream: S.dream === id, mine: S.clubId === id,
    rivals: grp ? grp.filter(n => n !== c.n) : [], contact: S.net.find(x => x.org === id) || null,
  };
}
// Yeni kulübe alışma süresi (hafta): yeni ülke, dil ve tanıdıklar belirler
export function adaptWeeks(id) {
  const L = LMAP[leagueOf(id)], cur = LMAP[leagueOf(S.clubId)]; let w = 3;
  if (L.c !== cur.c) w += 3;
  if (L.c !== 'TR' && S.dil < 40 && !(L.c === 'DE' && S.fl.gurbet)) w += 3;
  if (S.net.some(c => c.org === id)) w -= 2;
  if (S.trait === 'lider') w -= 1;
  return clamp(w, 1, 9);
}
const MINS = { '11': 85, rot: 50, genc: 20 };
// Teklifin kariyerine etkisi: mevcut kulübünle yan yana
export function moveInfo(o) {
  const A = clubInfo(S.clubId), B = clubInfo(o.id), me = OVR(), of = o.role ? o : makeOffer(o.id);
  const rl = role(), cr = rl === '11' ? '11' : rl === 'yedek' ? 'rot' : rl === 'yok' ? 'genc' : (S.con.role || 'rot');
  const dev = (ci, r) => Math.round(clamp(28 + ci.fac * 9 + (MINS[r] - 50) * .42 + clamp(ci.r - me, -6, 8) * 1.2 + (ci.fit - 50) * .15, 5, 99));
  const da = dev(A, cr), db = dev(B, of.role), ad = adaptWeeks(o.id), sg = (x, t = 0) => (x > t ? 1 : x < -t ? -1 : 0);
  const eut = x => (x ? (x === 'cl' ? 'Şampiyonlar Ligi' : 'Avrupa Ligi') : 'Yok');
  const rows = [
    { l: 'Lig gücü', i: 'trophy', a: Math.round(A.lavg), b: Math.round(B.lavg), d: sg(B.lavg - A.lavg, 1), sa: A.lname, sb: B.lname },
    { l: 'Kulüp gücü', i: 'shield', a: Math.round(A.r), b: Math.round(B.r), d: sg(B.r - A.r, 1) },
    { l: 'Lig sırası', i: 'chart', a: A.pos + '.', b: B.pos + '.', d: sg(A.pos / A.size - B.pos / B.size, .08) },
    { l: 'Forma şansı', i: 'shirt', a: '%' + MINS[cr], b: '%' + MINS[of.role], d: sg(MINS[of.role] - MINS[cr]), sa: ROLE[cr], sb: ROLE[of.role] },
    { l: 'Haftalık ücret', i: 'coin', a: S.con.wage ? fmtS(S.con.wage) : 'Amatör', b: of.wage ? fmtS(of.wage) : 'Amatör', d: sg(of.wage - S.con.wage) },
    { l: 'Tesisler', i: 'train', a: A.fac, b: B.fac, d: sg(B.fac - A.fac), star: 1 },
    { l: 'Taktik uyumu', i: 'whistle', a: '%' + A.fit, b: '%' + B.fit, d: sg(B.fit - A.fit, 5), sa: TACT[A.tac].n, sb: TACT[B.tac].n },
    { l: 'Gelişim hızı', i: 'up', a: da, b: db, d: sg(db - da, 3), bar: 1 },
    { l: 'Avrupa', i: 'globe', a: eut(A.eu), b: eut(B.eu), d: sg((B.eu === 'cl' ? 2 : B.eu ? 1 : 0) - (A.eu === 'cl' ? 2 : A.eu ? 1 : 0)) },
  ];
  const pros = [], cons = [];
  if (B.lavg - A.lavg > 3) pros.push('Daha güçlü lig: itibarın ve piyasa değerin hızlı artar'); else if (A.lavg - B.lavg > 3) cons.push('Daha zayıf lig: itibarın zamanla düşer');
  if (MINS[of.role] > MINS[cr]) pros.push(`${ROLE[of.role]}: daha çok süre, maçta daha çok gelişim`); else if (MINS[of.role] < MINS[cr]) cons.push(`${ROLE[of.role]}: süren azalır, maç tecrüben yavaşlar`);
  if (B.fac > A.fac) pros.push(`Tesisler daha iyi: antrenman verimi +%${Math.round((facF(B.fac) / facF(A.fac) - 1) * 100)}`); else if (B.fac < A.fac) cons.push(`Tesisler daha zayıf: antrenman verimi −%${Math.round((1 - facF(B.fac) / facF(A.fac)) * 100)}`);
  if (B.fit - A.fit >= 8) pros.push(`${B.coach} ${TACT[B.tac].n.toLocaleLowerCase('tr')} oynatıyor: sana uyuyor`); else if (A.fit - B.fit >= 8) cons.push(`${B.coach} ${TACT[B.tac].n.toLocaleLowerCase('tr')} oynatıyor: sana uymuyor`);
  if (B.eu && (!A.eu || (B.eu === 'cl' && A.eu === 'el'))) pros.push(`${eut(B.eu)} sahnesi: takipçi ve itibar`); else if (A.eu && !B.eu) cons.push('Avrupa maçlarından uzak kalırsın');
  if (of.wage > S.con.wage * 1.3) pros.push('Ücret belirgin biçimde artıyor'); else if (of.wage < S.con.wage * .8) cons.push('Ücretin düşüyor');
  if (B.contact) pros.push(`${B.contact.n} orada: soyunma odasına hızlı girersin`);
  if (ad >= 5) cons.push(`Uyum süreci yaklaşık ${ad} hafta: yeni ülke${S.dil < 40 && B.country !== 'TR' ? ', dil engeli' : ''}`);
  if (isDerby(S.clubId, o.id)) cons.push('Ezeli rakip: eski taraftarın bunu affetmez');
  if (B.dream) pros.push('Hayalindeki forma');
  if (of.loan) pros.push('Kiralık: sezon sonunda kulübüne dönersin');
  const gap = B.r - me;
  if (gap > 8) cons.unshift(`Seviye farkı büyük: bu kulüp ${Math.round(B.r - 4)} güç arıyor, sen ${me}`);
  const abroad = B.country !== 'TR' && A.country === 'TR', sc = gap > 8 ? -2 : pros.length - cons.length + (db - da) / 10;
  const fam = abroad && S.age < 21 ? ['anne', '"Çok uzak. Daha çocuksun, biraz daha pişsen?"'] : of.wage > S.con.wage * 1.5 && S.fl.dar ? ['baba', '"Bu para evi rahatlatır oğlum. Ama karar senin."'] : MINS[of.role] < MINS[cr] ? ['baba', '"Oynamayacağın yere gitme. Futbolcu sahada büyür."'] : db > da ? ['baba', '"Orada gelişirsin. Arkandayız."'] : ['anne', '"Mutlu olacağın yere git, biz buradayız."'];
  const agent = S.agent ? (of.wage > S.con.wage * 1.2 ? `"İmzala. Bu rakamı bir daha bulamayız."` : sc >= 1 ? '"Kariyer planına uyuyor. Ben olsam giderim."' : '"Acele etme. Daha iyisi gelir."') : null;
  return { A, B, rows, pros, cons, fam, agent, adapt: ad, dev: [da, db], verdict: gap > 8 ? 'Henüz erken: önce gelişmen gerek' : sc >= 1.5 ? 'Kariyerin için güçlü adım' : sc <= -1 ? 'Riskli hamle' : 'Artısı eksisi dengede', tone: sc >= 1.5 ? 1 : sc <= -1 ? -1 : 0 };
}
// Seviyene uyan kulüpler: ayda bir yenilenen kısa liste
export function market() {
  const o = OVR(), key = S.season + ':' + Math.floor((S.week - 1) / 4), all = [];
  for (const lid in S.lg) { if (LMAP[lid].c !== 'TR' && S.rep < 40) continue; for (const id of S.lg[lid].t) { const r = S.rt[id]; if (id !== S.clubId && r >= o - 6 && r <= o + 4) all.push(id); } }
  return all.sort((a, b) => hsh(a + key) - hsh(b + key)).slice(0, 6).sort((a, b) => S.rt[b] - S.rt[a]);
}
export const canPropose = () => (S.cd.propose || 0) <= absWeek() && (!!S.agent || S.net.length > 0);
// Kendini öner: menajerin ya da tanıdıkların aracılığıyla bir kulübün radarına gir
export function propose(id) {
  S.used++; S.cd.propose = absWeek() + 3;
  const con = S.net.find(c => c.org === id), f = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6.3, w = S.watch.find(x => x.id === id);
  const p = clamp(.22 + (S.agent ? S.agent.pw * .3 : 0) + (con ? .3 : 0) + (f - 6.5) * .15 + (OVR() - S.rt[id]) * .04, .05, .9);
  if (!chance(p)) return [`${club(id).n}: "Dosyanız elimizde, şimdilik ilgilenmiyoruz."`, false];
  if (w) w.lv = clamp(w.lv + 20, 0, 100); else S.watch.push({ id, lv: ri(34, 50) });
  addFeed('basin', 'Transfer Hattı', `${club(id).n} cephesi ${S.name} için bilgi topluyor.`, 'haber');
  return [`${club(id).n} scout göndermeye karar verdi. Önümüzdeki maçlarda izleneceksin.`, true];
}

// ---------- kariyerin başı: deneme antrenmanları ----------
export function trialClubs(tried = []) {
  const O = ORIGINS[S.origin], o = OVR(), out = [];
  const add = (t, how) => {
    const lid = 'tr' + t; if (!S.lg[lid] || LMAP[lid].tier !== t) return;
    const list = S.lg[lid].t.filter(id => !tried.includes(id) && !out.some(x => x.id === id)).sort((a, b) => S.rt[a] - S.rt[b]); if (!list.length) return;
    const j = ri(0, Math.min(2, list.length - 1)), id = how === 'weak' ? list[j] : how === 'strong' ? list[list.length - 1 - j] : list[Math.floor(list.length / 2)];
    out.push({ id, lid, d: S.rt[id] - o });
  };
  add(O.tier, 'weak'); add(O.tier, 'strong'); if (O.tier > 4) add(O.tier - 1, 'mid'); if (O.tier < 8) add(O.tier + 1, 'weak');
  return out.sort((a, b) => b.d - a.d);
}
// Deneme sonucu: ok = 3 antrenmandan kaçı başarılı. Teklif listesi döner.
export function trialResult(id, ok) {
  const o = OVR(), out = [], tor = S.fl.torpil ? 1 : 0;
  const mk = (cid, bump) => {
    const r = S.rt[cid], d = o - r + bump, wage = wageFor(r, o);
    return { id: cid, r, role: d >= 0 ? '11' : d >= -5 ? 'rot' : 'genc', wage, len: 1, sign: nice(Math.max(wage * 4, 300 + Math.max(0, r - 20) * 60) * (ok === 3 ? 1.5 : 1)), goalB: nice(wage * 0.15), st: 'ok', first: 1 };
  };
  if (ok >= 2 || (ok === 1 && (tor || (o - S.rt[id] >= -3 && chance(.5))))) out.push(mk(id, ok === 3 ? 2 : ok === 1 ? -3 : 0));
  if (ok === 3) {   // parlak deneme: tribündeki başka bir kulüp de devreye girer
    const lid = leagueOf(id), alt = S.lg[lid].t.filter(x => x !== id && Math.abs(S.rt[x] - S.rt[id]) <= 3);
    if (alt.length) out.push(mk(pick(alt), 0));
  }
  delete S.fl.torpil;
  return out;
}
// Ailenin tavsiyesi: [kişi, söz, önerdiği kulüp]
export function famAdvice(offers) {
  const by = f => [...offers].sort(f)[0], R = { '11': 2, rot: 1, genc: 0 };
  const play = by((a, b) => R[b.role] - R[a.role] || b.r - a.r), cash = by((a, b) => b.sign - a.sign), near = by((a, b) => LMAP[leagueOf(b.id)].tier - LMAP[leagueOf(a.id)].tier);
  const baba = R[play.role] === 0 ? ['baba', `"Hiçbiri sana forma sözü vermiyor. ${club(play.id).n} olur ama sabırlı olacaksın."`, play.id] : ['baba', `"${club(play.id).n} seni ${ROLE[play.role].toLocaleLowerCase('tr')} düşünüyor. Genç adam oynayarak büyür."`, play.id];
  const anne = S.fl.dar ? ['anne', `"${club(cash.id).n} imza parası veriyor. Evin bir aylık mutfağı eder. Ama sen bilirsin."`, cash.id] : S.fl.okul ? ['anne', `"${club(near.id).n} yakın, okulunu aksatmazsın. Diploman cebinde dursun."`, near.id] : ['anne', `"Nerede mutlu olacaksan orası. ${club(play.id).n} iyi insanlara benziyor."`, play.id];
  return [baba, anne];
}
// İlk sözleşme pazarlığı: what = 'rol' ya da 'para'
export function negFirst(o, what) {
  o.neg = true;
  if (chance(clamp(.35 + (OVR() - o.r) * .05, .1, .85))) {
    if (what === 'rol') { o.role = o.role === 'genc' ? 'rot' : '11'; return { text: `Yönetim ikna oldu: "${ROLE[o.role]} olarak düşünüyoruz."` }; }
    o.sign = nice(o.sign * 1.6); return { text: `İmza parası ${fmt(o.sign)} oldu.` };
  }
  if (chance(.25)) return { gone: true, text: '"Daha top oynamadan pazarlık mı?" Kulüp teklifini geri çekti.' };
  return { text: 'Yönetim şartları değiştirmedi. Teklif masada.' };
}
// Kulüpsüz geçen iki hafta
export function freeMonth(id) {
  const keys = Object.keys(POS[S.pos].w).slice(0, 2);
  switch (id) {
    case 'birey': return ['Her sabah altıda sahadaydın. Kimse izlemedi ama bacakların biliyor.', fx({ [keys[0]]: 1.2, [keys[1]]: 1 })];
    case 'mahalle': return ['Turnuvada yarı finale kadar çıktınız. Toprak sahada top ayağına yapıştı.', fx({ teknik: 1, ark: 8, mo: 5 })];
    case 'kamp': return ['İki hafta kum, yokuş ve merdiven. Nefesin açıldı.', fx({ para: -1500, hiz: 1.2, guc: 1.2 })];
    case 'is': return ['Sanayide çıraklık yaptın. Ellerin nasır tuttu, cebin para gördü.', fx({ para: 6000, aile: 6, mo: -2 })];
    case 'okul': return ['Kitapların başına oturdun. Annenin yüzü güldü.', fx({ egt: 8, aile: 7 })];
    case 'tanidik': S.fl.torpil = 1; if (!S.net.some(c => c.k === 'abi')) netAdd('abi', rname('TR'), null, 40); return ['Eski bir kulüp başkanıyla tanıştın. "Bir telefon açarım, gerisi senin ayağında" dedi.', fx({ mo: 4 })];
  }
  return ['', []];
}
// Kimse almazsa: ligin en zayıf takımı kapısını açar
export function lastResort(tried = []) {
  const t = S.lg.tr8.t.filter(id => !tried.includes(id)).sort((a, b) => S.rt[a] - S.rt[b]), id = t[0] || S.lg.tr8.t[0];
  return { id, r: S.rt[id], role: OVR() >= S.rt[id] - 2 ? '11' : 'rot', wage: 0, len: 1, sign: 0, goalB: 0, st: 'ok', first: 1 };
}

// ---------- röportajlar ----------
// k: post (maç sonu), pre (maç önü), imza. if: sorunun sorulacağı durum. Yanıt özel alanları:
// fol takipçi çarpanı, fine para cezası, ref hakemin tutumu, press söz verdin, boost rakip hırslanır, w seni izleyenlerin ilgisi
const IVQ = [
  { id: 'p_sir', k: 'post', if: c => c.rt >= 7.5, q: 'Harika bir maç çıkardın. Sırrı ne?', a: [
    { t: 'Hafta içi ne çalıştıysak o', fx: { prof: 2, hoca: 2 }, say: 'Sır yok. Antrenmanda ne yaptıysak sahaya o yansıdı.' },
    { t: 'Takım arkadaşlarım sayesinde', fx: { takim: 4, hoca: 1 }, say: 'Tek başıma hiçbir şeyim. Bu takımın emeği.' },
    { t: 'Yetenek bu, öğretilmez', fx: { ego: 4, taraf: 2 }, fol: 1.5, say: 'Bazı şeyler çalışmakla olmuyor. Ya vardır ya yoktur.' }] },
  { id: 'p_trib', k: 'post', if: c => c.home && c.rt >= 7.3, q: 'Tribünler adını haykırıyor. Onlara ne söylersin?', a: [
    { t: 'Bu forma onların', fx: { taraf: 6 }, say: 'Biz geçiciyiz, bu forma tribünün. Hakkını vermeye çalışıyorum.' },
    { t: 'Daha yeni başlıyoruz', fx: { taraf: 3, ego: 2 }, fol: 1.2, say: 'Yerlerinden ayrılmasınlar. Asıl film şimdi başlıyor.' },
    { t: 'Sahada ses duymam, işime bakarım', fx: { hoca: 2, prof: 2, taraf: -2 }, say: 'Açıkçası sahada hiçbir şey duymuyorum. Kafam oyunda.' }] },
  { id: 'p_arm', k: 'post', if: c => c.pg >= 1, q: 'Golünü kime armağan ediyorsun?', a: [
    { t: 'Aileme', fx: { aile: 6, mo: 2 }, say: 'Annemle babama. Bu yollar onların sırtında yüründü.' },
    { t: 'Mahalledeki çocuklara', fx: { taraf: 3, ark: 3 }, fol: 1, say: 'Toprak sahada top koşturan çocuklara. Onlardan biriyim.' },
    { t: 'Bana inanmayanlara', fx: { ego: 4, takim: -1 }, fol: 1.8, say: '"Olmaz" diyenler vardı. Bu gol onlara gitsin.' }] },
  { id: 'p_hat', k: 'post', if: c => c.pg >= 3, q: '{g} gol birden! Maç topu kimde kalacak?', a: [
    { t: 'İmzalatıp anneme götüreceğim', fx: { aile: 7, mo: 3 }, say: 'Top bu gece annemin vitrininde olacak.' },
    { t: 'Soyunma odasında kalsın', fx: { takim: 6 }, say: 'Herkes imzalasın, soyunma odasına asalım. Bu takımın topu.' },
    { t: 'Müzeme koyarım, devamı gelecek', fx: { ego: 5 }, fol: 2, say: 'Raf yaptırdım bile. Yenilerine yer lazım.' }] },
  { id: 'p_2gol', k: 'post', if: c => c.pg === 2, q: 'İki gol attın. Gol krallığı aklında mı?', a: [
    { t: 'Aklımda takımın puanı var', fx: { hoca: 3, takim: 2 }, say: 'Krallık bireysel iş. Benim aklımda puan cetveli var.' },
    { t: 'Evet, hedefim krallık', fx: { ego: 3, taraf: 3 }, fol: 1.2, say: 'Saklamaya gerek yok. O ödülü istiyorum.' },
    { t: 'Üçüncüyü kaçırdığıma yanıyorum', fx: { prof: 3, mo: -1 }, say: 'İki attım ama kaçan pozisyonu bu gece rüyamda göreceğim.' }] },
  { id: 'p_asist', k: 'post', if: c => c.pa >= 1, q: 'Bugün gol attırdın. Atmak mı, attırmak mı?', a: [
    { t: 'Attırmak ayrı keyif', fx: { takim: 5 }, say: 'Arkadaşının sevincini görmek golden tatlı.' },
    { t: 'Önce takım, sonra ben', fx: { takim: 2, hoca: 2 }, say: 'Kim atarsa atsın. Skor tabelasında takımın adı yazıyor.' },
    { t: 'O pası herkes atamaz', fx: { ego: 3 }, fol: 1, say: 'O arayı görmek kolay değil. Görene helal olsun, yani bana.' }] },
  { id: 'p_derbi', k: 'post', if: c => c.derby && c.win, q: 'Derbi sizin. Şehir bu gece kimin?', a: [
    { t: 'Şehir bizim', fx: { taraf: 8, ego: 2 }, fol: 2, say: 'Bu gece şehrin rengi belli.' },
    { t: 'Rakibe saygı, üç puan bize', fx: { takim: 2, hoca: 2, rep: .5 }, say: 'İyi mücadele ettiler. Kazanan biz olduk, hepsi bu.' },
    { t: 'Bu galibiyet tribünün', fx: { taraf: 6, takim: 1 }, say: 'Doksan dakika susmadılar. Galibiyet onların.' }] },
  { id: 'p_derbil', k: 'post', if: c => c.derby && c.lose, q: 'Derbi kaybedildi. Taraftara ne diyeceksin?', a: [
    { t: 'Özür diliyorum, telafi edeceğiz', fx: { taraf: 3, sad: 3 }, say: 'Üzgünüz. Bu formayı giyen herkes adına özür dilerim.' },
    { t: 'Rövanşta konuşuruz', fx: { ego: 2, taraf: 1 }, fol: 1, say: 'Bu maç burada bitmedi. Rövanşı bekleyin.' },
    { t: 'Hakem maçın önüne geçti', fx: { taraf: 3, hoca: -1 }, ref: -.4, fine: 1, say: 'Derbiyi biz değil düdük kaybettirdi.' }] },
  { id: 'p_maglup', k: 'post', if: c => c.lose && c.rt >= 7 && !c.derby, q: 'Sen iyiydin ama takım kaybetti. Sorun nerede?', a: [
    { t: 'Kazanırken de kaybederken de biriz', fx: { takim: 5, hoca: 2 }, say: 'Kimseyi ayırmam. Birlikte kaybettik, birlikte çıkacağız.' },
    { t: 'Bazıları sorumluluk almalı', fx: { takim: -6, ego: 3 }, fol: 1.5, say: 'Herkes aynaya baksın. Ben kendi payıma düşeni yaptım.' },
    { t: 'Taktik tutmadı', fx: { hoca: -5, taraf: 2 }, say: 'Sahaya yanlış planla çıktık, bunu söylemek zorundayım.' }] },
  { id: 'p_var', k: 'post', if: c => c.varAg, q: 'VAR golünüzü iptal etti. Karar doğru muydu?', a: [
    { t: 'Kararlara saygı duyuyorum', fx: { hoca: 1 }, ref: .15, say: 'Hakem ne derse o. Oyunumuza bakarız.' },
    { t: 'O çizgiyi kim çekti?', fx: { taraf: 4 }, ref: -.3, say: 'Çizgiyi kimin çektiğini çok merak ediyorum.' },
    { t: 'Bu kararlarla futbol oynanmaz', fx: { taraf: 5, hoca: -1 }, ref: -.5, fine: 1, say: 'Bu kararlarla futbol oynanmaz. Cezam neyse çekerim.' }] },
  { id: 'p_hoca', k: 'post', w: .6, q: '{co} hoca {tac} oynatıyor. Bu sistem sana uyuyor mu?', a: [
    { t: 'Hocam ne derse o', fx: { hoca: 5 }, say: 'Hocamız ne isterse sahada onu yaparım.' },
    { t: 'Her hafta daha iyi anlıyorum', fx: { hoca: 2, prof: 2 }, say: 'Sisteme alışıyorum. Her maç bir tık daha oturuyor.' },
    { t: 'Başka rolde daha verimliyim', fx: { hoca: -5, ego: 2 }, fol: 1, say: 'Dürüst olayım, en iyi olduğum yerde oynamıyorum.' }] },
  { id: 'p_gorev', k: 'post', if: c => c.tasks != null, q: 'Hocan maç önü sana özel görev vermiş. Yerine geldi mi?', a: [
    { t: 'Görev neyse sahada o', fx: { hoca: 3 }, say: 'Bana ne söylendiyse onu yapmaya çalıştım.' },
    { t: 'Görev tamam, gerisi ikram', fx: { ego: 2, hoca: 1 }, say: 'İstenen yapıldı. Üstü benden.' },
    { t: 'Bunlar soyunma odasında kalır', fx: { takim: 3, prof: 2 }, say: 'Soyunma odasında konuşulan orada kalır.' }] },
  { id: 'p_yedek', k: 'post', if: c => c.bench && c.rt >= 6.8, q: 'Kulübeden gelip maçı değiştirdin. İlk 11 senin hakkın değil mi?', a: [
    { t: 'Karar hocamın', fx: { hoca: 4 }, say: 'Kimin oynayacağına hocamız karar verir. Ben hazır beklerim.' },
    { t: 'Beş dakika da verseler hazırım', fx: { prof: 3, takim: 2 }, say: 'Süre fark etmez. Forma verildiği an görev başlar.' },
    { t: 'Evet, artık hak ediyorum', fx: { ego: 4, hoca: -3, taraf: 3 }, fol: 1.3, say: 'Bence cevabı sahada verdim. Artık başlamak istiyorum.' }] },
  { id: 'p_avrupa', k: 'post', if: c => c.eu, q: 'Avrupa gecesinde sahnedeydin. Bu atmosfer nasıl?', a: [
    { t: 'Bu müziği çocukken ekranda dinlerdim', fx: { taraf: 3, aile: 3 }, fol: 1.5, say: 'O müzik çalarken tüylerim diken diken oldu. Çocukluğum geldi aklıma.' },
    { t: 'Her maç gibi bir maç', fx: { prof: 3, hoca: 1 }, say: 'Top aynı top, kale aynı kale. Fazla büyütmüyorum.' },
    { t: 'Avrupa artık adımı öğrenecek', fx: { ego: 4, rep: 1 }, fol: 2, say: 'Bu geceden sonra ismimi telaffuz etmeyi öğrenirler.' }] },
  { id: 'p_final', k: 'post', if: c => c.final && c.win, q: 'Kupa sizin! İlk his?', a: [
    { t: 'Bu kupa şehrin', fx: { taraf: 8 }, say: 'Bu kupayı şehre götürüyoruz. Yollarda görüşürüz.' },
    { t: 'Ailemi tribünde gördüm', fx: { aile: 8, mo: 3 }, say: 'Babamı ağlarken gördüm. Gerisini hatırlamıyorum.' },
    { t: 'İlki bu, devamı gelecek', fx: { ego: 3 }, fol: 2, say: 'Bir tane yetmez. Bu daha ilki.' }] },
  { id: 'p_transfer', k: 'post', if: c => c.watch, q: 'Adın başka kulüplerle anılıyor. Sezon sonu burada mısın?', a: [
    { t: 'Sözleşmem var, kafam burada', fx: { taraf: 4, hoca: 2, sad: 3 }, say: 'Benim adresim belli. Söylentilerle işim yok.' },
    { t: 'Futbolda yarın belli olmaz', fx: { taraf: -3 }, w: 8, say: 'Futbolda hiçbir kapı kapanmaz. Zaman gösterir.' },
    { t: 'O işlere menajerim bakıyor', fx: { taraf: -1 }, w: 4, say: 'Ben top oynarım, telefonlara menajerim bakar.' }] },
  { id: 'p_genc', k: 'post', if: c => c.age <= 19, q: 'Bu yaşta bu sorumluluk ağır gelmiyor mu?', a: [
    { t: 'Yaş kimlikte yazar', fx: { ego: 3, taraf: 3 }, fol: 1.3, say: 'Sahada kimse kimliğe bakmıyor.' },
    { t: 'Abilerim yol gösteriyor', fx: { takim: 4 }, say: 'Soyunma odasındaki abilerim olmasa bu kadar rahat olamazdım.' },
    { t: 'Okul da var, saha da', fx: { aile: 4, egt: 1 }, say: 'Sabah okul, akşam idman. İkisini de bırakmaya niyetim yok.' }] },
  { id: 'p_seri', k: 'post', if: c => c.f5 >= 7.4, q: 'Üst üste iyi maçlar. Formunun zirvesinde misin?', a: [
    { t: 'Zirve yok, her hafta sıfırdan', fx: { prof: 3, hoca: 2 }, say: 'Geçen haftanın maçı bitti. Pazartesi yine sıfırdan başlıyorum.' },
    { t: 'Evet ve inmeye niyetim yok', fx: { ego: 3, taraf: 2 }, fol: 1.2, say: 'İyi hissediyorum. Bu seviyeden aşağı inmem.' },
    { t: 'Evdeki düzenime borçluyum', fx: { aile: 3, mo: 2 }, say: 'Uykum, yemeğim, ailem düzende. Saha onun yansıması.' }] },
  { id: 'p_kotu', k: 'post', if: c => c.rt < 5.8, q: 'Bugün senin günün değildi. Ne oldu?', a: [
    { t: 'Sorumluluk bende', fx: { hoca: 3, takim: 2, prof: 2 }, say: 'Kötüydüm. Bahane aramayacağım.' },
    { t: 'Herkesin kötü günü olur', fx: { mo: 3 }, say: 'Makine değiliz. Haftaya başka bir ben göreceksiniz.' },
    { t: 'Bana top gelmedi ki', fx: { takim: -5, hoca: -2, ego: 2 }, say: 'Top gelmeden ne yapabilirim? İzleyenler gördü.' }] },
  { id: 'p_kirmizi', k: 'post', if: c => c.red, q: 'Kırmızı kart gördün. Takımını eksik bıraktın.', a: [
    { t: 'Arkadaşlarımdan özür diledim', fx: { takim: 4, hoca: 1 }, say: 'Soyunma odasında herkesten tek tek özür diledim.' },
    { t: 'Pozisyonu izleyin, kart değildi', fx: { taraf: 2 }, ref: -.3, say: 'Tekrarına bakın. Topa gittim.' },
    { t: 'Hırsımdan oldu', fx: { taraf: 3, prof: -1 }, say: 'Kaybetmeyi sevmiyorum. Bazen taşıyor.' }] },
  { id: 'p_zirve', k: 'post', if: c => c.rank <= 2 && c.week >= 12, q: 'Zirve yarışındasınız. Şampiyonluk geliyor mu?', a: [
    { t: 'Maç maç bakıyoruz', fx: { hoca: 2, prof: 2 }, say: 'Puan cetveline mayısta bakarız. Önümüzde sadece bir sonraki maç var.' },
    { t: 'Bu takım şampiyon olur', fx: { taraf: 5, ego: 2 }, say: 'Bu soyunma odası şampiyonluk kokuyor.' },
    { t: 'Kupayı şimdiden parlatsınlar', fx: { ego: 5, takim: -1 }, fol: 1.5, say: 'Kupayı hazırlasınlar. Gelip alacağız.' }] },
  { id: 'p_dusme', k: 'post', if: c => c.rank > c.n - 4 && c.week >= 10, q: 'Alt sıralardasınız. Ligde kalabilecek misiniz?', a: [
    { t: 'Son düdüğe kadar savaşırız', fx: { taraf: 4, takim: 3 }, say: 'Bu forma düşmez. Son haftaya kadar savaşacağız.' },
    { t: 'Bu kadro burada olmamalıydı', fx: { takim: -3, ego: 2 }, say: 'Bu kadronun yeri burası değil. Bazı şeyler konuşulmalı.' },
    { t: 'Kimse panik yapmasın', fx: { mo: 3, hoca: 1 }, say: 'Sakin olalım. İki galibiyet her şeyi değiştirir.' }] },
  { id: 'p_milli', k: 'post', if: c => c.rep >= 30 && c.caps === 0, q: 'Milli takım cephesi seni izliyor. Davet bekliyor musun?', a: [
    { t: 'Ay yıldızlı forma herkesin hayali', fx: { rep: 1, taraf: 2 }, say: 'O formayı giymek her çocuğun hayali. Benim de.' },
    { t: 'Kulübümde işimi yapayım, gerisi gelir', fx: { hoca: 2, prof: 2 }, say: 'Ben burada işimi iyi yaparsam telefon kendiliğinden çalar.' },
    { t: 'Artık çağırmaları lazım', fx: { ego: 4 }, fol: 1.2, say: 'Bence vakti geldi. Karar onların.' }] },
  { id: 'p_rakip', k: 'post', w: .5, q: 'Kuşak rakibin {rival} da çok konuşuluyor. Kıyaslanmak rahatsız ediyor mu?', a: [
    { t: 'İyi oyuncu, başarılar dilerim', fx: { rep: .5, takim: 1 }, say: 'İyi futbolcu. Yolu açık olsun.' },
    { t: 'Ben kendi yoluma bakarım', fx: { prof: 2 }, say: 'Kimseyle yarışmıyorum. Dünkü kendimle yarışıyorum.' },
    { t: 'Sahada karşılaşınca görürüz', fx: { ego: 3 }, fol: 1.5, say: 'Kıyaslamayı sahaya bırakalım. Orada belli olur.' }] },
  { id: 'r_bek', k: 'pre', q: 'Büyük maç öncesi beklentin ne?', a: [
    { t: 'İyi futbol, üç puan', fx: { hoca: 1 }, say: 'Planımız hazır. İyi oynayıp kazanmak istiyoruz.' },
    { t: 'Kazanacağız, net', fx: { ego: 2 }, press: 1, say: 'Kazanacağız. Bundan şüphem yok.' },
    { t: 'Tribün ne isterse onu vereceğiz', fx: { taraf: 3 }, press: 1, say: 'Taraftarımız galibiyet istiyor. Alacaklar.' }] },
  { id: 'r_rakip', k: 'pre', q: '{opp} hakkında ne düşünüyorsun?', a: [
    { t: 'Saygı duyuyoruz', fx: { takim: 1, rep: .3 }, say: 'Zor bir rakip. Saygımız sonsuz, sahada görüşürüz.' },
    { t: 'Zaaflarını biliyoruz', fx: { ego: 2 }, boost: 1, fol: 1, say: 'Videolarını izledik. Nereden vuracağımızı biliyoruz.' },
    { t: 'Onlar bizden korksun', fx: { ego: 4 }, boost: 1.5, fol: 2, say: 'Korkması gereken biz değiliz.' }] },
  { id: 'r_baski', k: 'pre', q: 'Herkes bu maçı konuşuyor. Baskı hissediyor musun?', a: [
    { t: 'Baskı bir ayrıcalık', fx: { prof: 2, mo: 2 }, say: 'Baskı varsa önemli bir yerdesin demektir. Seviyorum.' },
    { t: 'Biraz, yalan yok', fx: { taraf: 2, mo: -1 }, say: 'Midemde kelebekler var, saklamayacağım. Ama iyi anlamda.' },
    { t: 'Baskı rakibin üstünde', fx: { ego: 2 }, press: 1, say: 'Kaybedecek bir şeyi olan onlar. Biz rahatız.' }] },
  { id: 'r_derbi', k: 'pre', if: c => c.derby, q: 'Derbi haftası. Geceleri uyuyabiliyor musun?', a: [
    { t: 'Bebek gibi', fx: { ego: 2, mo: 2 }, say: 'Sekiz saat, deliksiz. Derbi beni dinlendiriyor.' },
    { t: 'Bu maçı çocukluğumdan beri bekliyorum', fx: { taraf: 5 }, press: 1, say: 'Çocukken bu maçların hayalini kurardım. Hazırım.' },
    { t: 'Derbi de üç puan', fx: { prof: 2, hoca: 2, taraf: -1 }, say: 'Sonuçta üç puanlık bir maç. Fazla anlam yüklemiyorum.' }] },
  { id: 'r_hayal', k: 'pre', if: c => c.dream, q: 'Karşında çocukluk hayalin {opp} var. Gol atarsan sevinecek misin?', a: [
    { t: 'Giydiğim forma için sevinirim', fx: { taraf: 5 }, say: 'Hangi formayı giyiyorsam onun için sevinirim.' },
    { t: 'Saygımdan sevinmem', fx: { taraf: -3 }, wd: 10, say: 'O armaya saygım var. Atarsam sevinmem.' },
    { t: 'Önce bir atalım', fx: { prof: 1 }, say: 'Önce golü atalım, sevinci sonra düşünürüz.' }] },
  { id: 'r_final', k: 'pre', if: c => c.final, q: 'Kupaya bir maç kaldı. Hazır mısınız?', a: [
    { t: 'Bu kupayı şehre götüreceğiz', fx: { taraf: 5 }, press: 1, say: 'O kupa bizimle dönecek.' },
    { t: 'Final oynanmaz, kazanılır', fx: { ego: 2 }, fol: 1.5, press: 1, say: 'Finaller oynanmaz, kazanılır. Kazanacağız.' },
    { t: 'Heyecanlıyız ama hazırız', fx: { takim: 2 }, say: 'Heyecan var ama hazırlığımız tam.' }] },
  { id: 'r_avrupa', k: 'pre', if: c => c.eu, q: 'Avrupa sahnesinde rakip güçlü. Şansınız var mı?', a: [
    { t: 'Sahada on bire on bir', fx: { takim: 3 }, say: 'İsimler sahaya çıkmıyor. On bire on bir oynanacak.' },
    { t: 'Favori onlar, sürpriz biziz', fx: { prof: 1, mo: 2 }, say: 'Kâğıt üstünde favori onlar. Biz de sürprizi severiz.' },
    { t: 'Avrupa bizi konuşacak', fx: { ego: 3 }, press: 1, fol: 1.5, say: 'Yarın sabah Avrupa bizi konuşacak.' }] },
  { id: 'r_hakem', k: 'pre', q: 'Maçı {ref} yönetecek. Bir yorumun var mı?', a: [
    { t: 'Hakemlerle işim olmaz', fx: { hoca: 1 }, ref: .1, say: 'Ben topuma bakarım. Hakem işini yapar.' },
    { t: 'Umarım adil bir maç olur', fx: { taraf: 1 }, ref: -.1, say: 'Tek isteğim adil bir yönetim.' },
    { t: 'Geçmişte canımızı yakmıştı', fx: { taraf: 3 }, ref: -.35, say: 'Hafızam iyidir. Umarım bu kez farklı olur.' }] },
  { id: 'r_form', k: 'pre', if: c => c.f5 < 6.3, q: 'Son haftalarda formun düşük. Bu maç dönüş maçı mı?', a: [
    { t: 'Çalışıyorum, karşılığı gelecek', fx: { prof: 3 }, say: 'Antrenmanda fazladan kalıyorum. Karşılığı gelecek.' },
    { t: 'Eleştiriler beni besliyor', fx: { ego: 2 }, press: 1, say: 'Yazılanları okuyorum. Cevabı sahada vereceğim.' },
    { t: 'Form geçici, klas kalıcı', fx: { ego: 4 }, fol: 1.2, say: 'Form gelir geçer. Klas kalır.' }] },
  { id: 'i_ilk', k: 'imza', q: 'Yeni kulübünde ilk sözün ne?', a: [
    { t: 'Bu formayı terletmeye geldim', fx: { taraf: 6, takim: 2 }, say: 'Bu formanın hakkını vereceğim.' },
    { t: 'Hedefim şampiyonluk', fx: { taraf: 8, ego: 3 }, say: 'Buraya kupa kaldırmaya geldim.' },
    { t: 'Önce yerimi kazanmam lazım', fx: { hoca: 4, prof: 2 }, say: 'Kimse bana forma borçlu değil. Çalışıp alacağım.' }] },
  { id: 'i_taraf', k: 'imza', q: 'Taraftara mesajın var mı?', a: [
    { t: 'Tribünde görüşürüz', fx: { taraf: 6 }, say: 'İlk maçta tribünde görüşelim. Sesiniz lazım.' },
    { t: 'Sabır istiyorum', fx: { taraf: 3, hoca: 2 }, say: 'Biraz sabır istiyorum. Karşılığını fazlasıyla vereceğim.' },
    { t: 'Formamı şimdiden alsınlar', fx: { ego: 3, taraf: 4 }, fol: 1.5, say: 'Formamı şimdiden alın. Sonra bulamazsınız.' }] },
  { id: 'i_neden', k: 'imza', q: 'Neden bu kulübü seçtin?', a: [
    { t: 'Proje beni ikna etti', fx: { hoca: 3, taraf: 2 }, say: 'Hocamızla konuştum, plan net. O yüzden buradayım.' },
    { t: 'Bu armayı hep sevdim', fx: { taraf: 7 }, say: 'Bu arma çocukluğumdan beri aklımdaydı.' },
    { t: 'En iyi teklif buydu', fx: { taraf: -4, ego: 2, prof: 1 }, say: 'Dürüst olayım: en iyi teklif buradan geldi.' }] },
  { id: 'i_eski', k: 'imza', q: 'Eski kulübünün taraftarı kırgın. Ne söylersin?', a: [
    { t: 'Beni yetiştiren herkese teşekkürler', fx: { sad: 6, taraf: 2 }, say: 'Beni yetiştiren herkese teşekkür ederim. Kapıyı çarpmadan çıktım.' },
    { t: 'Futbol bu, yollar ayrılır', fx: { sad: -2, prof: 1 }, say: 'Futbolun doğası bu. Kimseye kırgın değilim.' },
    { t: 'Bir gün döneceğim', fx: { sad: 4 }, fol: 1, say: 'Bu bir veda değil. Bir gün yollarımız yine kesişir.' }] },
  { id: 'i_hedef', k: 'imza', q: 'Bu sezon kendine ne hedef koydun?', a: [
    { t: 'Çift haneli katkı', fx: { ego: 2, taraf: 3 }, say: 'Gol ve asistte çift haneyi görmek istiyorum.' },
    { t: 'Her maç forma giymek', fx: { hoca: 2, prof: 2 }, say: 'İlk hedefim her hafta kadroda olmak.' },
    { t: 'Kupa kaldırmak', fx: { taraf: 5, ego: 2 }, say: 'Sezon sonunda elimde bir kupa olsun istiyorum.' }] },
];
function ivCtx(fxt, M) {
  const lid = leagueOf(S.clubId), t = table(lid).map(r => r.id), co = coach(), f5 = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6.5;
  return { g: M ? M.pg : 0, pg: M ? M.pg : 0, pa: M ? M.pa : 0, rt: M ? M.rt : 0, win: !!M && M.usG > M.oppG, lose: !!M && M.usG < M.oppG, varAg: !!M && !!M.varAg, red: !!M && M.red, bench: !!M && M.role === 'yedek',
    tasks: M && M.tasks && M.tasks.length ? M.tdone || 0 : null, derby: !!fxt && !fxt.nat && isDerby(S.clubId, fxt.opp), eu: !!fxt && !!fxt.eu, final: !!fxt && !!fxt.final, home: !!fxt && !!fxt.home,
    dream: !!fxt && fxt.opp === S.dream, opp: fxt && !fxt.nat && club(fxt.opp) ? club(fxt.opp).n : 'rakip', rank: t.indexOf(S.clubId) + 1, n: t.length, week: S.week, f5, age: S.age, rep: S.rep, caps: S.car.caps,
    watch: S.watch.length > 0, co: co.n, tac: TACT[co.st].n.toLocaleLowerCase('tr'), ref: curRef().n, rival: S.rival.n };
}
// Duruma uyan, yakın zamanda sorulmamış n soru seçer
export function ivPick(kind, fxt, M, n = 2) {
  const c = ivCtx(fxt, M), seen = S.ivq || (S.ivq = []), ok = IVQ.filter(q => q.k === kind && (!q.if || q.if(c)));
  const w = {}; ok.forEach(q => { w[q.id] = (q.w || 1) * (q.if ? 2.5 : 1) * (seen.includes(q.id) ? .04 : 1); });
  const out = [];
  while (out.length < n && Object.keys(w).length) { const id = wpick(w); delete w[id]; const q = IVQ.find(x => x.id === id); out.push({ id, q: q.q.replace(/\{(\w+)\}/g, (m, k) => c[k] ?? ''), a: q.a }); seen.push(id); }
  S.ivq = seen.slice(-18);
  return out;
}
export function ivAnswer(id, i, fxt) {
  const a = IVQ.find(x => x.id === id).a[i], f = { ...a.fx };
  if (a.fol) f.fol = Math.round((60 + S.rep * S.rep * 2) * a.fol);
  if (a.fine) f.para = -nice(wref() * 2);
  if (a.ref) curRef().me += a.ref;
  if (a.w) for (const x of S.watch) x.lv = clamp(x.lv + a.w, 0, 100);
  if (a.wd) { const x = S.watch.find(y => y.id === S.dream); if (x) x.lv = clamp(x.lv + a.wd, 0, 100); }
  if (fxt && a.press) fxt.press = 1; if (fxt && a.boost) fxt.boost = a.boost;
  addFeed('me', S.name, '“' + a.say + '”', 'ben');
  return fx(f);
}

// ---------- kulüp efsaneleri ----------
function srnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Kulübün tüm zamanların golcüleri: kulüp adından üretilen sabit liste + senin o formayla yaptıkların
export function legends(id) {
  const c = club(id), lid = leagueOf(id), N = NAMES[lid ? LMAP[lid].c : 'TR'] || NAMES.TR, r = srnd(hsh(c.n + '#efsane')), out = [];
  const big = CLUBS[id] ? clamp((CLUBS[id].r - 40) / 50, 0, 1) : 0;
  let g = 55 + r() * 60 + big * 110;
  for (let i = 0; i < 5; i++) { out.push({ n: N.f[Math.floor(r() * N.f.length)] + ' ' + N.l[Math.floor(r() * N.l.length)], g: Math.round(g), apps: Math.round(g * (2.1 + r() * 1.7)), y: 1962 + Math.floor(r() * 50) }); g *= .7 + r() * .2; }
  const me = (S.cs || {})[id]; if (me && me.apps) out.push({ n: S.name, g: me.g, apps: me.apps, me: true });
  return out.sort((a, b) => b.g - a.g || b.apps - a.apps);
}
export function legendRank(id) {
  const list = legends(id), i = list.findIndex(x => x.me);
  return { list, pos: i < 0 ? 99 : i + 1, next: i > 0 ? list[i - 1].g - list[i].g + 1 : 0 };
}

// ---------- kaptanlık ----------
export const CAPT = [
  { t: 'Takımı ateşle', s: 'Tutarsa gol gelir; kaybederseniz fatura sana kesilir', i: 'bolt' },
  { t: 'Sakinleştir', s: 'Daha az hata: rakibin bir atağı boşa gidebilir', i: 'shield' },
  { t: 'Gençlere güven ver', s: 'Soyunma odasında bağlar güçlenir', i: 'users' },
  { t: 'Sözü kısa kes', s: 'Kendi oyununa odaklan', i: 'target' },
];
export function capTalk(M, i) {
  const srt = () => M.tl.sort((a, b) => a.min - b.min);
  if (i === 0) {
    M.capFire = 1;
    if (chance(.42 + S.rel.takim / 400 + (S.trait === 'lider' ? .15 : 0))) { M.tl.push({ min: ri(6, 80), t: 'bg', us: true }); srt(); return 'Soyunma odası ayağa kalktı. Tünelden çıkarken herkesin gözü dönmüştü.'; }
    return 'Bağırdın, çağırdın; ama gözler yerdeydi.';
  }
  if (i === 1) { M.focus = 1; const j = M.tl.findIndex(e => e.t === 'bg' && !e.us); if (j >= 0 && chance(.5)) M.tl.splice(j, 1); return '"Kimse panik yapmasın, oyunumuzu oynayalım." Omuzlar gevşedi.'; }
  if (i === 2) { for (const m of S.mates) m.b = clamp(m.b + (m.r === 'Genç yetenek' ? 7 : 2), 0, 100); fx({ takim: 3 }); return 'Genç oyuncunun omzuna elini koydun: "Bugün senin günün." Gözleri parladı.'; }
  M.rt += .2; fx({ takim: -1 }); return '"Konuşmaya gerek yok, sahada görüşürüz." Kısa ve soğuk.';
}

// ---------- kenar modu: emeklilikten sonra antrenör ya da başkan ----------
export const MTR = { denge: ['Dengeli', 'Her şeyden biraz'], hucum: ['Hücum', 'Gol yollarında etkinlik artar'], sav: ['Savunma', 'Daha az gol yersiniz'], genc: ['Gençler', 'Yavaş ama kalıcı güç artışı'] };
const mgrPrice = id => nice(Math.max(250000, baseW(S.rt[id]) * 6000));
// Göreve çağıran kulüpler. Başkanlık için kulübün bedelini ödeyebilmen gerekir.
export function mgrOffers(role, lower) {
  const tgt = clamp(30 + S.rep * .5 - (lower ? 8 : 0), 24, role === 'coach' ? 80 : 95), out = [], old = Object.keys(S.cs || {}).filter(id => leagueOf(id));
  const pool = [];
  for (const lid in S.lg) for (const id of S.lg[lid].t) if (id !== (lower ? S.clubId : null)) pool.push(id);
  const ok = id => (role === 'pres' ? mgrPrice(id) <= S.money : S.rt[id] <= tgt + 2);
  for (const id of old.sort((a, b) => S.rt[b] - S.rt[a])) if (out.length < 2 && ok(id) && !(lower && id === S.clubId)) out.push(id);
  const rest = pool.filter(id => ok(id) && !out.includes(id)).sort((a, b) => Math.abs(S.rt[a] - tgt) - Math.abs(S.rt[b] - tgt));
  for (const id of shuffle(rest.slice(0, 8))) if (out.length < 3) out.push(id);
  if (!out.length && role === 'coach') out.push([...S.lg.tr8.t].sort((a, b) => S.rt[a] - S.rt[b])[0]);
  return out.map(id => ({ id, price: role === 'pres' ? mgrPrice(id) : 0, wage: role === 'coach' ? nice(Math.max(1500, wageFor(S.rt[id], S.rt[id] + 4) * 1.4)) : 0, old: old.includes(id) }));
}
const mgrObj = () => { const lid = leagueOf(S.clubId), t = [...S.lg[lid].t].sort((a, b) => S.rt[b] - S.rt[a]); return clamp(t.indexOf(S.clubId) + 1, 1, t.length); };
const mgrBud = id => nice(Math.max(20000, baseW(S.rt[id]) * 900));
export function mgrStart(role, o) {
  const s = S, prev = s.mgr;
  if (role === 'pres') s.money -= o.price;
  if (prev && s.co[s.clubId] && s.co[s.clubId].me) delete s.co[s.clubId];
  s.clubId = o.id; s.loan = null; s.watch = []; s.q = []; s.inj = 0; s.ban = 0; s.over = null; s.tstat = 'mutlu'; s.adapt = 0; s.used = 0;
  s.con = { wage: o.wage || 0, until: s.season + 9, role: '11', goalB: 0, rel: 0 };
  s.mgr = { role, conf: 55, bud: mgrBud(o.id), tr: 'denge', act: 0, talk: 0, obj: 1, since: s.season, hist: prev ? prev.hist : [], jobs: (prev ? prev.jobs : 0) + 1, sacked: 0, mw: 0 };
  s.mgr.obj = mgrObj();
  if (role === 'coach') s.co[o.id] = { n: s.name, st: (s.co[o.id] || {}).st || 'top', me: 1 };
  if (s.week <= 1) initCup();   // sezon ortasında göreve gelirsen kupa kurası yenilenmez
  assignRef();
  addNews(role === 'coach' ? `${club(o.id).n} teknik direktörlüğüne getirildin.` : `${club(o.id).n} başkanı oldun.`, role === 'coach' ? 'whistle' : 'crown');
  addFeed('c:' + o.id, club(o.id).n, role === 'coach' ? `Yeni teknik direktörümüz ${s.name}. Hoş geldin hocam!` : `Yeni başkanımız ${s.name}. Hayırlı olsun!`, 'kulup');
  save();
}
// Taktiğin kadroya uyumu (−2..+2): yardımcı antrenör raporu
export const squadFit = (tac, id = S.clubId) => (hsh(club(id).n + S.season + tac) % 5) - 2;
export const mgrTac = () => coach().st;
export function mgrSetTac(t) { if (TACT[t]) coach().st = t; }
export function mgrInfo() {
  const s = S, m = s.mgr, lid = leagueOf(s.clubId), tb = table(lid), pos = tb.findIndex(r => r.id === s.clubId) + 1;
  return { ...m, pos, size: tb.length, r: s.rt[s.clubId], lid, tac: coach().st, fit: squadFit(coach().st), fac: facOf(s.clubId), coach: coach().n };
}
// Haftalık tek hamle. [metin, etkiler]
export const MACTS = {
  coach: [['talk', 'Takım toplantısı', 'Sıradaki maçta takım daha diri çıkar', 'users'], ['drill', 'Ekstra idman', 'Kalıcı küçük güç artışı; yorgunluk riski', 'train'], ['youth', 'Altyapıyı izle', 'Belki bir cevher çıkar', 'eye'], ['press', 'Basın toplantısı', 'Güveni tazele ya da başını yak', 'mic']],
  pres: [['invest', 'Tesis yatırımı', 'Pahalı; kalıcı güç ve gelişim', 'train'], ['ticket', 'Bilet indirimi', 'Tribün dolar, kasa biraz boşalır', 'users'], ['sponsor', 'Sponsor görüşmesi', 'Bütçeye taze para', 'tag'], ['sack', 'Hocayı değiştir', 'Yeni hoca, yeni sistem; tazminat ödenir', 'whistle']],
};
export const mgrCost = k => (k === 'invest' ? nice(mgrBud(S.clubId) * 2.2 * (1 + ((S.fx || {})[S.clubId] || 0))) : k === 'sack' ? nice(mgrBud(S.clubId) * .8) : k === 'ticket' ? nice(mgrBud(S.clubId) * .15) : 0);
export function mgrAct(k) {
  const s = S, m = s.mgr, id = s.clubId, cost = mgrCost(k); if (m.act || m.bud < cost) return null;
  m.act = 1; m.bud -= cost;
  const up = v => { s.rt[id] = clamp(s.rt[id] + v, 15, 95); };
  switch (k) {
    case 'talk': m.talk = 1; return ['Soyunma odasında herkesle tek tek konuştun. Hafta sonu daha istekli çıkacaklar.', ['Sıradaki maç: takım gücü +1,5']];
    case 'drill': if (chance(.25)) { up(-.3); return ['Fazla yüklendin; iki oyuncu adale sakatlığı yaşadı.', ['Takım gücü −0,3']]; } up(.12); return ['Çift idman meyvesini verdi.', ['Takım gücü +0,1']];
    case 'youth': if (chance(.3)) { up(.5); m.conf = clamp(m.conf + 3, 0, 100); addNews('Altyapıdan bir cevher A takıma yükseldi.', 'star'); return ['On yedi yaşında bir çocuk gözüne çarptı. A takıma aldın; tribün bayıldı.', ['Takım gücü +0,5', 'Güven +3']]; } return ['Bu hafta göze çarpan yoktu. Ama çocuklar hocayı kenarda görünce bir başka koştu.', []];
    case 'press': { const g = chance(.6 + s.rep / 400); m.conf = clamp(m.conf + (g ? 4 : -4), 0, 100); return [g ? 'Sakin, net, kendinden emin. Manşetler lehine.' : 'Bir soruya sinirlendin; görüntü günlerce döndü.', [g ? 'Güven +4' : 'Güven −4']]; }
    case 'invest': s.fx[id] = (s.fx[id] || 0) + 1; up(.4); m.conf = clamp(m.conf + 5, 0, 100); addNews(`${club(id).n} tesislerine yatırım yapıldı.`, 'train'); return ['Yeni sahalar, yeni fizik tedavi merkezi. Etkisi yıllarca sürer.', ['Tesis +1', 'Takım gücü +0,4', 'Güven +5']];
    case 'ticket': m.conf = clamp(m.conf + 4, 0, 100); return ['Kombine fiyatları indi; kale arkası doldu.', ['Güven +4']];
    case 'sponsor': { const g = chance(.45 + s.rep / 400), v = nice(mgrBud(id) * .3); if (g) m.bud += v; return [g ? 'El sıkıştınız. Forma göğsüne yeni bir isim geliyor.' : 'Görüşme uzadı, imza çıkmadı.', g ? ['Bütçe +' + fmtS(v)] : []]; }
    case 'sack': { const old = coach().n, st = pick(Object.keys(TACT).filter(x => x !== coach().st)); s.co[id] = { n: rname(LMAP[leagueOf(id)].c), st }; m.conf = clamp(m.conf + 2, 0, 100); addNews(`${old} ile yollar ayrıldı. Yeni hoca ${s.co[id].n}.`, 'whistle'); return [`${old} gitti, ${s.co[id].n} geldi. Sistemi: ${TACT[st].n.toLocaleLowerCase('tr')}.`, ['Kadro uyumu ' + (squadFit(st) >= 0 ? '+' : '−') + Math.abs(squadFit(st))]]; }
  }
  return null;
}
function mgrTick() {
  const s = S, m = s.mgr, id = s.clubId, d = { denge: .012, hucum: .008, sav: .008, genc: .022 }[m.tr] || .012;
  if (m.role === 'coach') s.rt[id] = clamp(s.rt[id] + d * (m.tr === 'genc' ? (s.week > 20 ? 1 : .2) : 1), 15, 95);
  m.bud += Math.round(mgrBud(id) * .008); m.act = 0;
  m.conf = clamp(m.conf + (50 - m.conf) * .02, 0, 100);
  if (m.conf < 12) m.sacked = 1;
}
// Maç simülasyonu: önce ilk yarı, devre arası kararıyla ikinci yarı
export function mgrMatch(fxt) {
  const s = S, m = s.mgr, T = TACT[coach().st], usR = s.rt[s.clubId] + squadFit(coach().st) + (m.talk ? 1.5 : 0), oppR = s.rt[fxt.opp];
  const hb = fxt.final ? 0 : fxt.home ? 2 : fxt.eu ? -3.5 : -2, f = m.tr === 'hucum' ? [1.08, 1.03] : m.tr === 'sav' ? [.96, .9] : [1, 1];
  const M = { fxt, usR, oppR, lu: 1.35 * Math.exp((usR + hb - oppR) * .05) * T.lu * f[0], lo: 1.2 * Math.exp((oppR - hb - usR) * .05) * T.lo * f[1], usG: 0, oppG: 0, tl: [], agg: fxt.agg || [0, 0], ko: (!!fxt.cup && !fxt.lg && fxt.leg !== 1) || !!fxt.po, eu: fxt.eu || null };
  mgrHalf(M, 1, 1, 0);
  return M;
}
export function mgrHalf(M, ku, ko, from) {
  for (let i = poisson(clamp(M.lu * ku / 2, .05, 3)); i > 0; i--) M.tl.push({ min: ri(from + 2, from + 45), us: true });
  for (let i = poisson(clamp(M.lo * ko / 2, .05, 3)); i > 0; i--) M.tl.push({ min: ri(from + 2, from + 45), us: false });
  M.tl.sort((a, b) => a.min - b.min);
}
export const MHT = [['Hücuma çık', 'İki kale de açılır', 1.4, 1.3], ['Aynen devam', 'Plan değişmez', 1, 1], ['Kapan', 'Skoru koru', .65, .6]];
export function mgrAfter(M, win) {
  const s = S, m = s.mgr, lose = !win && M.usG < M.oppG, d = M.oppR - M.usR, lines = [];
  const dv = win ? 1.2 + clamp(d * .35, 0, 5) : lose ? -2.5 - clamp(-d * .35, 0, 5) : (d > 3 ? 1.5 : d < -3 ? -2 : -.5);
  m.conf = clamp(m.conf + dv * (M.fxt.cup ? 1.3 : 1), 0, 100); m.talk = 0;
  lines.push('Güven ' + (dv >= 0 ? '+' : '−') + Math.abs(Math.round(dv)));
  if (win && m.role === 'coach') { const b = nice(s.con.wage * .2); if (b) { s.money += b; lines.push('Prim: ' + fmt(b)); } }
  const cn = club(s.clubId).n, on = club(M.fxt.opp).n;
  addFeed('c:' + s.clubId, cn, `MAÇ SONU | ${cn} ${M.usG}-${M.oppG} ${on}`, 'kulup');
  addFeed('taraftar', pick(FANS), win ? pick([`${s.name} ne dokunduysa oldu.`, 'Bu takım oynuyor. Helal.', 'Pazartesi işe mutlu gidiyoruz.']) : lose ? pick([`${s.name} bu kadroyla ne yapsın... ya da ne yapmasın?`, 'Böyle olmaz. Bir şey değişmeli.', 'Tribün sabırsız.']) : 'Bir puan bir puandır. Ama yetmez.');
  return lines;
}
// Transfer dönemi: üç hedef. plus: takım gücüne katkı
export function mgrMarket() {
  const s = S, base = mgrBud(s.clubId), L = LMAP[leagueOf(s.clubId)];
  return [.4, .8, 1.3].map((pl, i) => ({ n: rname(pick([L.c, L.c, 'TR', 'EN', 'ES'])), pos: pick(['Forvet', 'Kanat', 'Orta saha', 'Stoper', 'Kaleci']), plus: +(pl + rnd(-.15, .2)).toFixed(1), cost: nice(base * [.6, 1.3, 2.4][i] * rnd(.85, 1.2)), age: ri(19, 31) }));
}
export function mgrBuy(t) { const m = S.mgr; if (m.bud < t.cost) return false; m.bud -= t.cost; S.rt[S.clubId] = clamp(S.rt[S.clubId] + t.plus, 15, 95); m.conf = clamp(m.conf + 2, 0, 100); addFeed('basin', 'Transfer Hattı', `RESMÎ: ${t.n} artık ${club(S.clubId).n} oyuncusu.`, 'manset'); return true; }
export function mgrSell() { const m = S.mgr, v = nice(mgrBud(S.clubId) * .9); m.bud += v; S.rt[S.clubId] = clamp(S.rt[S.clubId] - 1.3, 15, 95); m.conf = clamp(m.conf - 4, 0, 100); addFeed('taraftar', pick(FANS), 'Yıldızımızı sattılar. Hayırlı olsun da kim oynayacak?'); return v; }
// Sezon sonu: hedefe göre güven, yeni bütçe, yeni hedef
export function mgrSeason(rep) {
  const s = S, m = s.mgr, id = s.clubId, lines = [], d = m.obj - rep.pos;
  let dv = clamp(d * 4, -24, 24); if (rep.pos === 1) dv += 12; if (rep.moved === 1) dv += 10; if (rep.moved === -1) dv -= 18;
  m.conf = clamp(m.conf + dv, 0, 100);
  lines.push(`Hedef ${m.obj}. sıra, bitiş ${rep.pos}. sıra`, 'Güven ' + (dv >= 0 ? '+' : '−') + Math.abs(Math.round(dv)));
  m.hist.push({ y: rep.label, c: club(id).n, l: rep.league, pos: rep.pos, obj: m.obj, role: m.role });
  // kadro yaşlanır, yıldızlar gider: güçlü kadroyu korumak her yıl yeniden yatırım ister
  const lg = S.lg[leagueOf(id)].t, avg = lg.reduce((a, x) => a + s.rt[x], 0) / lg.length;
  s.rt[id] = clamp(s.rt[id] - 1.4 - Math.max(0, s.rt[id] - avg) * .14 + .35 * Math.min(3, s.fx[id] || 0), 15, 95);
  m.bud += Math.round(mgrBud(id) * .7); m.obj = mgrObj(); m.act = 0; m.talk = 0;
  if (m.role === 'coach') s.con.wage = nice(Math.max(s.con.wage, wageFor(s.rt[id], s.rt[id] + 4) * 1.4));
  if (m.conf < 20) m.sacked = 1;
  return lines;
}
export function mgrEvent() {
  const s = S, m = s.mgr; if (!chance(.16)) return null;
  const id = s.clubId, up = v => { s.rt[id] = clamp(s.rt[id] + v, 15, 95); }, cf = v => { m.conf = clamp(m.conf + v, 0, 100); }, star = s.sc[id] && s.sc[id][0] ? s.sc[id][0][0] : 'Takımın yıldızı', b = mgrBud(id);
  const list = [
    { p: 'takim', i: 'alert', t: 'Yıldız gitmek istiyor', d: `${star} kapını çaldı: "Üst ligden teklif var, beni bırakın."`, o: [
      ['Sat, parayı al', 'Bütçe artar, takım zayıflar', () => { m.bud += nice(b * .9); up(-1.2); cf(-3); return ['Bütçe +' + fmtS(nice(b * .9)), 'Takım gücü −1,2', 'Güven −3']; }],
      ['İkna et', 'Tutarsa kalır; tutmazsa küser', () => (chance(.5 + s.rep / 300) ? (cf(2), ['Kaldı', 'Güven +2']) : (up(-.5), ['Kaldı ama keyfi yok', 'Takım gücü −0,5']))],
      ['Zam yap', 'Bütçeden gider', () => { m.bud = Math.max(0, m.bud - nice(b * .3)); return ['Bütçe −' + fmtS(nice(b * .3))]; }]] },
    { p: 'taraftar', i: 'users', t: 'Tribün ses veriyor', d: 'Taraftar grubu tesis kapısında. Konuşmak istiyorlar.', o: [
      ['Yanlarına git', 'Yüzleş, dinle', () => (chance(.65) ? (cf(4), ['Güven +4']) : (cf(-2), ['Güven −2']))],
      ['Arka kapıdan çık', 'Bugün uğraşma', () => { cf(-3); return ['Güven −3']; }]] },
    { p: 'doktor', i: 'plus', t: 'Sakatlık krizi', d: 'Bir haftada üç oyuncu revire girdi. Kadro daraldı.', o: [
      ['Takviye yap', 'Bütçeden gider', () => { m.bud = Math.max(0, m.bud - nice(b * .35)); return ['Bütçe −' + fmtS(nice(b * .35))]; }],
      ['Altyapıdan tamamla', 'Bedava ama riskli', () => (chance(.4) ? (up(.2), cf(2), ['Gençler şaşırttı', 'Takım gücü +0,2']) : (up(-.6), ['Takım gücü −0,6']))],
      ['İdare et', 'Kadro zayıflar', () => { up(-.4); return ['Takım gücü −0,4']; }]] },
    { p: 'basin', i: 'mic', t: 'Mikrofonlar sende', d: 'Canlı yayında soru geldi: "Bu sezon hedef ne?"', o: [
      ['Büyük konuş', 'Tutarsa alkış, tutmazsa yuh', () => { cf(chance(.5) ? 5 : -4); return ['Söz ağızdan çıktı']; }],
      ['Maç maç bakıyoruz', 'Güvenli cevap', () => { cf(1); return ['Güven +1']; }]] },
  ];
  return pick(list);
}
// Kenar kariyerinin özeti; kayıt silinmeden önce
export function mgrEnd() {
  const m = S.mgr, best = m.hist.length ? Math.min(...m.hist.map(h => h.pos)) : 0, tro = S.tro.filter(x => /teknik direktör|başkan|Teknik Direktörü/.test(x));
  const mt = meta(); mt.mgr = Math.max(mt.mgr || 0, m.hist.length); setMeta(mt);
  return { seasons: m.hist.length, best, tro, jobs: m.jobs, hist: m.hist, role: m.role };
}
