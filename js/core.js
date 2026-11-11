// Toprak Saha — oyun çekirdeği: durum, lig simülasyonu, sezon, transfer, ekonomi
import { tt, LC, NLOC, DSEP } from './i18n.js';
import { LEAGUES, LMAP, CLUBS, PAL, PROV, NAMES, POS, ATTR, ORIGINS, TRAITS, SHOP, TRAIN, NATIONS, FILL, CUPS, PERKS, HANG, POSTS, FANS, ACH, HT, BUILD, STYLES, CELE, NET, MACT, DERBY, XIDS, TACT, PERKS2, ROLE, WIDS, AGENTS, NATN, WX, INV, DIFF, KPROV, KWORLD, setWorld as setData, SCN, MVAR, UPG, SESS, PROLE, SCENS, COLK, SPN, KLIK, PTAG } from './data.js';

export let S = null;
export const WEEKS = 38;
const KEYS = ['toprak-saha-kayit-1', 'toprak-saha-kayit-2', 'toprak-saha-kayit-3'], META = 'toprak-saha-meta-1', SLOT = 'toprak-saha-yuva';
let KEY = KEYS[0];   // etkin kayıt yuvası
try { const n = +localStorage.getItem(SLOT); if (KEYS[n - 1]) KEY = KEYS[n - 1]; } catch (e) { /* depolama kapalı */ }
const TRT_E = ['tr1', 'tr2', 'tr3', 'tr4', 'tr5', 'tr6', 'tr7', 'tr8'], TRT_K = ['tr1', 'tr2', 'tr3', 'tr4'];
let TRT = TRT_E;
// Kariyer türü. KW: kadın kariyeri mi. Ligler, kurallar, Avrupa, milli takım ve ekonomi setWorld ile değişir; kayıtta S.w = 'k' olarak durur (erkekte alan yok).
export let KW = false;
export function setWorld(w) {
  KW = w === 'k'; setData(KW ? 'k' : 'e');
  TRT = KW ? TRT_K : TRT_E; RULES = KW ? RULES_K : RULES_E; EUQ = KW ? EUQ_K : EUQ_E; EUK = KW ? EUK_K : EUK_E; EUN = KW ? EUN_K : EUN_E;
  NTN = KW ? NTN_K : NTN_E; WORLD = KW ? KWORLD : WORLD_E;
}
// Yerel amatör kademe (ilden üretilen ligler) ve amatör/alt profesyonel eşikleri
export const tierCfg = () => (KW ? { loc: 4, amat: 3, low: 2 } : { loc: 6, amat: 5, low: 3 });
// Kadın kariyerinde cinsiyetli söz kalıpları: erkek metni → kadın metni (Türkçede zamir yok; bunlar unvan ve akrabalık sözcükleri)
const KXM = new Map();
export const kxAdd = (a, b) => { KXM.set(a, b); return a; };
export const kx = t => (KW && KXM.get(t)) || t;
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
export const CUR = { TRY: ['₺', 1, tt('Türk lirası')], EUR: ['€', 50, 'Euro'], USD: ['$', 43, tt('Dolar')] };
let cur = 'TRY';
try { const c = localStorage.getItem(CKEY); if (CUR[c]) cur = c; } catch (e) { /* depolama kapalı */ }
export const curKey = () => cur;
export const curSym = () => CUR[cur][0];
export function setCur(k) { if (!CUR[k]) return; cur = k; try { localStorage.setItem(CKEY, k); } catch (e) { /* yok */ } }
const cvt = n => Math.abs(n) / CUR[cur][1];
export const fmt = n => (n < 0 ? '−' : '') + CUR[cur][0] + Math.round(cvt(n)).toLocaleString(NLOC);
export function fmtS(n) {
  const a = cvt(n), sg = n < 0 ? '−' : '', y = CUR[cur][0];
  if (a >= 1e9) return sg + y + (a / 1e9).toFixed(1).replace('.', DSEP) + tt(' Mr', 'para');
  if (a >= 1e6) return sg + y + (a / 1e6).toFixed(1).replace('.', DSEP) + tt(' Mn', 'para');
  if (a >= 1e5) return sg + y + Math.round(a / 1e3) + tt(' B', 'para');
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
    const j = localStorage.getItem(KEY); if (!j) return false; S = JSON.parse(j); setWorld(S.w);
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
    for (const id of [...XIDS, ...WIDS]) S.rt[id] ??= CLUBS[id].r;
    S.co ??= {}; S.eps ??= ['en1', 'es1']; S.hon ??= {}; S.ivq ??= []; S.moves ??= []; S.adapt ??= 0; S.cup.top ??= cupTop();
    if (!S.cl || !S.el || S.cl.weeks.length < 13) { delete S.euro; initEuro(euroQual()); }
    if (!S.nt) ntInit();
    if (!S.cs) { S.cs = {}; for (const h of S.hist) { const id = Object.keys(CLUBS).find(k => CLUBS[k].n === h.c) || Object.keys(S.gen).find(k => S.gen[k].n === h.c); if (id) { const c = S.cs[id] || (S.cs[id] = { apps: 0, g: 0 }); c.apps += h.apps; c.g += h.g; } } }
    S.up ??= {}; S.fx ??= {}; S.sq ??= {}; S.cr ??= {}; S.xc ??= []; S.inv ??= {}; S.duel ??= {}; S.xl ??= {}; S.rel.basin ??= 50; S.kid ??= S.fl.cocuk ? { n: rname('TR').split(' ')[0] + ' ' + S.name.split(' ').slice(-1)[0], born: S.season - 2, tal: 0 } : null;
    if (S.fl.gurbet) S.gur ??= 'DE';
    S.drill ??= {}; S.dby ??= {}; S.rvc ??= {}; S.col ??= []; S.posx ??= []; S.lr ??= { ten: 15 }; S.spb ??= {}; S.rec ??= {}; S.vet ??= 0;
    if (!S.ko && !KW) initKo();
    if (!S.rv && !S.mgr) genRival(); if (!S.sg && !S.mgr) newGoals();
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
export const eff = k => SHOP.reduce((s, i) => s + ((has(i.id) && i.e && i.e[k]) || 0), 0) + UPG.reduce((s, u) => s + ((u.e && u.e[k]) || 0) * ((S.up || {})[u.id] || 0), 0);
export const wref = () => Math.max(S.con.wage, 1500);
export function addNews(s, ic = 'news') { S.news.unshift({ w: `${S.week}. hafta`, s, ic }); if (S.news.length > 24) S.news.length = 24; }
export function tot() { const c = S.car, t = S.st; return { apps: c.apps + t.apps, g: c.g + t.g, a: c.a + t.a, rs: c.rs + t.rs }; }
export function potText() { const p = S.pot; return p >= 91 ? tt('Dünya çapında') : p >= 87 ? tt('Çok yüksek') : p >= 83 ? tt('Yüksek') : tt('İyi'); }
// Lig kuralları (2025/26 statülerine göre, tek gruba sadeleştirilmiş).
// up: doğrudan yükselen, po: play-off türü ve başladığı sıra, down: doğrudan düşen, out: play-out (kaybeden düşer)
const RULES_E = {
  tr1: { down: 3 },
  tr2: { up: 2, po: 'p5', from: 3, down: 4 },      // 3-7 play-off, 3. doğrudan finalde
  tr3: { up: 2, po: 'p4x2', from: 3, down: 2 },    // iki play-off maçının galipleri çıkar
  tr4: { up: 1, po: 'p4', from: 2, down: 2 },      // 2-5 play-off
  tr5: { up: 1, po: 'p4', from: 2, down: 1, out: 1 },
  tr6: { up: 1, po: 'p2', from: 2, down: 1, out: 1 },   // şampiyon doğrudan, 2. ile 3. play-off
  tr7: { up: 1, po: 'p4', from: 2, down: 1, out: 1 },
  tr8: { up: 1, po: 'p4', from: 2, down: 0 },
};
// Kadın ligleri (TFF 2026-2027 Kadın Ligleri Statüsü, EK-5; gruplar tek tabloya sadeleştirilmiş)
const RULES_K = {
  tr1: { down: 3 },                               // 16 takım, son 3 düşer
  tr2: { up: 2, po: 'p2', from: 3, down: 4 },     // gerçekte 2 grup: birinciler doğrudan, ikinciler tek maç play-off; 4 takım düşer
  tr3: { up: 4, down: 4 },                        // gerçekte 4 grup: birinciler çıkar, sonuncular düşer
  tr4: { up: 2, po: 'p4x2', from: 3, down: 0 },   // gerçekte yerel gruplar, çıkanlar play-off ile belirlenir
};
let RULES = RULES_E;
const POSIZE = { p5: 5, p4: 4, p4x2: 4, p2: 2 }, PON = { p4: ['Yarı final', 'Final'], p5: ['Çeyrek final', 'Yarı final', 'Final'], p4x2: ['Final'], p2: ['Final'], o2: ['Play-out'] };
export function zones(lid) { const R = RULES[lid]; if (!R) return { up: 1, po: 0, down: 0, out: 0 }; return { up: R.up || (lid === 'tr1' ? 1 : 0), po: R.po ? POSIZE[R.po] : 0, down: R.down || 0, out: R.out ? 2 : 0 }; }
// Yerel amatör liglerde "yaşı küçük futbolcu" kuralı: ilk yarıda sahada genç oyuncu zorunlu, forma şansın artar
export const youngRule = () => S.age <= 20 && LMAP[leagueOf(S.clubId)].c === 'TR' && tier() >= tierCfg().loc;
export function rname(c) { const N = NAMES[c] || NAMES.TR; return pick(N.f) + ' ' + pick(N.l); }
// Hoca adı: kadın liglerinde hocaların yarıdan fazlası erkek
const cname = c => { const N = NAMES[c] || NAMES.TR; return KW && N.m && chance(.55) ? pick(N.m) + ' ' + pick(N.l) : rname(c); };
const GOLK = kxAdd(tt('Gol Kralı'), tt('Gol Kraliçesi'));

// Etki uygula, görünür değişiklikleri döndür. Gizli sayaçlar (prof, ego, sad) listelenmez.
const LBL = { basin: tt('Basın'), en: tt('Enerji'), mo: tt('Moral'), aile: tt('Aile'), ark: tt('Arkadaşlar'), par: tt('İlişki'), hoca: tt('Hoca güveni'), takim: tt('Takım'), taraf: tt('Taraftar'), fol: tt('Takipçi'), rep: tt('İtibar'), egt: tt('Eğitim'), dil: tt('Dil') };
export function fx(o) {
  const out = [];
  for (const k in o) {
    const v = o[k]; if (!v) continue;
    if (k === 'para') { S.money += v; out.push((v > 0 ? '+' : '−') + fmt(Math.abs(v))); }
    else if (k in S.rel) { if (S.rel[k] == null) continue; S.rel[k] = clamp(S.rel[k] + v, 0, 100); if (Math.round(v)) out.push(LBL[k] + ' ' + sg(v)); }
    else if (k === 'en' || k === 'mo' || k === 'rep' || k === 'egt' || k === 'dil') { S[k] = clamp(S[k] + v, 0, 100); if (Math.round(v)) out.push(LBL[k] + ' ' + sg(v)); }
    else if (k === 'fol') { S.fol = Math.max(0, Math.round(S.fol + v)); out.push(tt('Takipçi ') + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)).toLocaleString(NLOC)); }
    else if (k in S.hid) { S.hid[k] = clamp(S.hid[k] + v, 0, 100); }
    else if (k in S.at) { S.at[k] = clamp(S.at[k] + v, 1, 99); out.push(ATTR[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(v)); }
    else if (k === 'inj') { S.inj = Math.max(S.inj, v); out.push(tt`${v} hafta sakat`); }
  }
  return out;
}

// ---------- gelişim ----------
const ageF = () => { const a = S.age; return a <= 17 ? 1.2 : a <= 20 ? 1.05 : a <= 23 ? .85 : a <= 26 ? .6 : a <= 29 ? .38 : a <= 32 ? .2 : .1; };
const capF = v => clamp(1 - Math.pow(Math.max(0, v - 20) / (S.pot - 20), 2), 0, 1);
export function grow(k, amt) { const g = amt * ageF() * capF(S.at[k]) * (S.dfocus ? (S.dfocus === k ? 1.5 : .85) : 1); S.at[k] = clamp(S.at[k] + g, 1, 99); return g; }   // dfocus: sezonluk gelişim odağı

// ---------- dünya kurulumu ----------
function genAmateur(prov) {
  const P = PROV[prov], keys = ['R', 'G', 'B', 'N', 'Y', 'O', 'M', 'P', 'S', 'T', 'K'];
  const rng = [[33, 41], [28, 35], [22, 30]];
  const mk = (lid, id, n, lo, hi) => {
    let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = keys[h % keys.length]; let b = ['W', 'K', 'Y', 'W'][(h >>> 4) % 4]; if (b === a) b = 'W';
    S.gen[id] = { n, c1: PAL[a], c2: PAL[b] }; S.rt[id] = Math.round(rnd(lo, hi)); S.lg[lid].t.push(id);
  };
  if (KW) {   // Kadınlar 3. Ligi: ilin ilçe takımları
    S.lg.tr4 = { t: [], tb: {}, rd: 0, last: [] };
    (KPROV[prov] || P.d).forEach((d, i) => mk('tr4', 'g4_' + i, d + [' Kadın SK', ' Belediyespor', ' Kadın FK', ' Gençlikspor'][i % 4], 25, 34));
    return;
  }
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
  shuffle(lg.t); lg.tb = {}; lg.rd = 0; lg.last = []; delete lg.res; delete lg.fm; delete lg.pen;
  for (const id of lg.t) {
    if (!S.sc[id]) S.sc[id] = [[rname(c), 0], [rname(c), 0]];
    else { S.sc[id][0][1] = 0; S.sc[id][1][1] = 0; if (chance(.25)) S.sc[id][ri(0, 1)][0] = rname(c); }
  }
}

export function newCareer(o) {
  setWorld(o.world ? o.world.w : o.w);   // ebeveynin dünyası devralınıyorsa türü de onunki
  const m = meta(), P = POS[o.pos], O = ORIGINS[o.origin], Tr = TRAITS[o.trait], leg = m.leg || 0;
  const at = { sut: 24, pas: 24, teknik: 24, hiz: 26, guc: 22, savunma: 22, kafa: 22, zihin: 24, kaleci: 8 };
  const W = o.world || null, hb = W ? clamp(((W.kid && W.kid.tal) || 0) * .25 + (W.peak - 60) * .08, 0, 6) : 0;   // W: ebeveynin kariyerinden devralınan dünya
  for (const k in at) at[k] += ri(-2, 2) + (O.all || 0) + leg * 0.5 + hb;
  for (const k in P.b) at[k] += P.b[k];
  for (const k in O.at || {}) at[k] += O.at[k];
  for (const k in Tr.at || {}) at[k] += Tr.at[k];
  for (const mod of [HT[o.ht], BUILD[o.build], (STYLES[o.pos] || [])[o.style]]) for (const k in (mod && mod.at) || {}) at[k] += mod.at[k];
  S = {
    v: 1, w: KW ? 'k' : undefined, name: o.name, pos: o.pos, foot: o.foot, prov: o.prov, origin: o.origin, trait: o.trait, nat: 'TR', look: o.look || { skin: 1, hair: 0, hc: 0 },
    age: 16, year: 2026, season: 1, week: 1, used: 0, at, pot: clamp(ri(80, 91) + (O.pot || 0) + Math.floor(leg / 2) + (W ? clamp(Math.floor(((W.kid && W.kid.tal) || 0) / 4), 0, 4) : 0), 78, 96),
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
  if (W) {   // aynı dünya: ligler, kulüp güçleri, şampiyonluklar yerinde; yıllar geçti
    S.prov = W.prov; S.gen = W.gen; S.rt = W.rt; S.sc = W.sc; S.year = W.year + Math.max(0, 16 - (W.season - ((W.kid && W.kid.born) || W.season)));
    for (const lid in W.lg) S.lg[lid] = { t: [...W.lg[lid].t], tb: {}, rd: 0, last: [] };
  } else {
    for (const L of LEAGUES) {
      if (L.gen) continue;
      S.lg[L.id] = { t: [...L.ids], tb: {}, rd: 0, last: [] };
      for (const id of L.ids) S.rt[id] = CLUBS[id].r;
    }
    genAmateur(o.prov);
  }
  for (const id of [...XIDS, ...WIDS]) S.rt[id] ??= CLUBS[id].r;
  for (const lid in S.lg) initLeague(lid);
  S.co = {}; S.eps = ['en1', 'es1']; S.hon = {}; S.ivq = []; S.moves = []; S.adapt = 0; S.cs = {}; S.fx = {};
  S.up = {}; S.sq = {}; S.cr = {}; S.xc = []; S.inv = {}; S.duel = {}; S.xl = {}; S.kid = null;
  S.drill = {}; S.dby = {}; S.rvc = {}; S.col = []; S.posx = []; S.lr = { ten: 15 }; S.spb = {}; S.rec = {}; S.vet = 0; S.rel.basin = 50; S.gur = o.origin === 'gurbet' ? (NATN[o.gur] ? o.gur : 'DE') : null;
  if (W) {
    S.hon = W.hon || {}; S.eps = W.eps || S.eps; S.fx = W.fx || {}; S.sq = W.sq || {}; S.xl = { ...(W.xl || {}) };
    for (const id in W.cs || {}) if (W.cs[id].apps >= 15) (S.xl[id] || (S.xl[id] = [])).push({ n: W.name, g: W.cs[id].g, apps: W.cs[id].apps, y: W.year });
    S.parent = { n: W.name, peak: W.peak, rep: Math.round(W.rep) }; S.rel.aile = clamp(S.rel.aile + 10, 0, 100); S.rep = 3; S.fol = Math.round(500 + W.fol * .01); S.fl.torpil = 1;
  }
  ntInit();
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
  initCup(); initEuro(euroQual()); S.dream = SAK(); initRefs(); assignRef(); genMates(); newQuest(); genRival(); newGoals();
  if (S.parent) addNews(tt`${S.parent.n} soyadı yeniden sahada. Gözler üzerinde.`, 'star');
  S.peak = OVR(); S.peakC = S.rt[S.clubId];
  S.rival.c = club(pick(S.lg[lid].t.filter(x => x !== S.clubId))).n;
  addNews(tt`${club(S.clubId).n} formasıyla ${LMAP[lid].name} macerası başlıyor.`);
  addNews(tt`Aynı kuşaktan ${S.rival.n} (${S.rival.c}) şimdiden adından söz ettiriyor.`);
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
  const rows = lg.t.map(id => { const r = lg.tb[id] || [0, 0, 0, 0, 0, 0]; const pen = (lg.pen || {})[id] || 0; return { id, p: r[0], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[1] * 3 + r[2] - pen, gd: r[4] - r[5], pen }; });
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
  const s = roleScore().s;
  return s >= 50 ? '11' : s >= 30 ? 'yedek' : 'yok';
}
// Hocanın tercihi: 50 ve üstü ilk 11, 30 ve üstü yedek. p: dökümü
export function roleScore() {
  const o = OVR(), v = S.rv, n = Math.min(3, S.lastR.length), f = n ? S.lastR.slice(-n).reduce((a, b) => a + b, 0) / n : 6.5;
  const p = { hoca: S.rel.hoca * 0.5 + 28, guc: (o - S.rt[S.clubId]) * 3.5,
    ek: (S.fl.kaptan ? 8 : 0) + (youngRule() ? 12 : 0) + (tacFit() - 50) * 0.1 + Math.min(4, (S.posx || []).length * 2) - (S.fl.pc ? 5 : 0) + (S.camp && S.camp.s === S.season && S.week <= 6 ? S.camp.pre || 0 : 0),
    rakip: v ? clamp((o - v.ovr) * 1.1, -7, 7) + (v.inj > 0 ? 8 : 0) + (v.f && n ? clamp((f - v.f) * 3, -5, 5) : 0) : 0 };
  return { s: p.hoca + p.guc + p.ek + p.rakip, p, f };
}
export const canPlay = () => { const r = role(); return r === '11' || r === 'yedek'; };
export const slots = () => (fixture() && canPlay() ? 3 : 4);

// ---------- haftalık eylemler ----------
export function fizyoCost() { return Math.max(1500, nice(S.con.wage * 0.3)); }
export function act(id) {
  S.used++;
  switch (id) {
    case 'rest': return [tt('Dinlendin, bacakların hafifledi.'), fx({ en: 20 })];
    case 'aile': if (S.kid) S.kid.tal = clamp(S.kid.tal + .15, 0, 20); return [S.kid ? tt`Ailenle sofraya oturdun. ${S.kid.n.split(' ')[0]} kucağından inmedi.` : tt('Ailenle sofraya oturdun.'), fx({ aile: 9, mo: 4 })];
    case 'ark': return [tt('Arkadaşlarınla vakit geçirdin.'), fx({ ark: 10, mo: 5, en: -4 })];
    case 'par': return [tt('Baş başa güzel bir gün.'), fx({ par: 11, mo: 5, en: -3 })];
    case 'job': return [tt('Vardiyayı çıkardın, paranı aldın.'), fx({ para: 2000, en: -12 })];
    case 'okul': return [tt('Ders çalıştın.'), fx({ egt: 5, aile: 2, en: -4 })];
    case 'sosyal': { const g = Math.round((30 + S.rep * S.rep * 2) * rnd(.6, 1.4) * (1 + eff('fol')) * folF()); return [tt('Paylaşımın ilgi gördü.'), fx({ fol: g, ego: 1 })]; }
    case 'dil': return [tt('Dil kursuna gittin.'), fx({ para: -3000, dil: 6, en: -3 })];
    case 'fizyo': { const c = fizyoCost(); S.inj = Math.max(0, S.inj - 1); return [tt('Fizyoterapi iyi geldi; dönüş bir hafta öne çekildi.'), fx({ para: -c })]; }
  }
  return ['', []];
}

export function train(tid, mult) {
  S.used++; questHit('train');
  const Tn = TRAIN.find(t => t.id === tid);
  const m = 0.28 * mult * (TRAITS[S.trait].tr || 1) * (1 + eff('tr')) * (Tn.a.length === 1 ? 1.5 : 1) * facF(facOf(S.clubId)) * (mentor() ? 1.1 : 1);
  const gs = Tn.a.map(k => [k, grow(k, m)]);
  if (tid === 'ort' || tid === 'zih') { const b = S.spb || (S.spb = {}); for (const k of tid === 'ort' ? ['fk', 'cor'] : ['pen']) b[k] = Math.min(4, (b[k] || 0) + .25); }
  fx({ en: -10, hoca: 0.4, prof: 0.4 });
  let inj = 0;
  if (S.en < 15 && chance(.12)) { inj = ri(1, 3); S.inj = inj; }
  return { gs, inj };
}

export function income() {
  const wage = S.con.wage, cut = S.agent ? Math.round(wage * S.agent.cut) : 0;
  const spon = Math.round((S.spon.reduce((a, x) => a + x.wk, 0) + (S.boot ? S.boot.wk : 0)) * (perk('ikon') ? 1.3 : 1) * (S.con.img ? 1.25 : 1)), biz = eff('inc');
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
export function endWeek(own, ownCup, ownEuro, ownX) {
  const s = S, myL = leagueOf(s.clubId);
  cupRound(ownCup, 'cup'); for (const k of EUK) euroRound(ownEuro, k);
  xcRound(ownX);
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
    if (s.assets.length < before) addNews(tt('Hesap ekside. Haftalık abonelikler iptal edildi.'));
  }
  s.spon = s.spon.filter(x => x.until > absWeek());
  if (NATW.includes(s.week)) natApply(null);
  invStep();
  if (s.kid && has('akademi')) s.kid.tal = clamp(s.kid.tal + .06, 0, 20);
  if ([7, 15, 26, 33].includes(s.week) && chance(.55)) crisisStep();
  if (s.week >= 19 && s.week <= 21) worldMoves(2, 1);
  if (s.mgr) { mgrTick(); feedWeek(); s.used = 0; s.week++; if (s.week <= WEEKS) assignRef(); return { over: s.week > WEEKS, inc }; }
  if (s.fl.kronik && s.inj <= 0 && chance(.025)) { s.inj = 2; addNews(tt('Kronik sakatlığın nüksetti: iki hafta yoksun.'), 'plus'); }
  s.rel.aile = clamp(s.rel.aile - 1, 0, 100);
  s.rel.ark = clamp(s.rel.ark - 1.2, 0, 100);
  if (s.rel.par != null) s.rel.par = clamp(s.rel.par - (s.fl.evli ? 1 : 1.8), 0, 100);
  // kulüp içi ilişkiler ilgisiz kalınca ortalamaya döner
  s.rel.hoca += (50 - s.rel.hoca) * 0.02; s.rel.takim += (50 - s.rel.takim) * 0.015; s.rel.taraf += (40 - s.rel.taraf) * 0.015;
  s.en = clamp(s.en + 30 + eff('en') - (s.job ? 8 : 0) + (own ? 0 : 6) + (s.camp && s.camp.k === 'kon' && s.camp.s === s.season ? 3 : 0), 0, 100);
  s.mo = clamp(s.mo + (58 + eff('mo') - s.mo) * 0.08, 0, 100);
  if (s.inj > 0) s.inj--; else for (const k in POS[s.pos].w) grow(k, 0.03 * (0.7 + s.rt[s.clubId] / 100));
  if (s.ban > 0) { s.ban--; if (!s.ban) s.banR = ''; }
  const avg = s.st.apps ? s.st.rs / s.st.apps : 6.3;
  const tgt = clamp((s.rt[s.clubId] - 22) * 1.15 + (avg - 6.5) * 8 + s.car.caps * 0.3, 0, 100);
  s.rep = clamp(s.rep + (tgt - s.rep) * 0.04, 0, 100);
  s.fol = Math.round(s.fol + (s.fol * 0.002 + s.rep * s.rep * 0.5) * (1 + eff('fol')) * folF());
  if (s.job && s.con.wage > 20000) { s.job = 0; addNews(tt('Maaşın artık yetiyor; fabrikadaki işten ayrıldın.')); }
  watchStep(); feedWeek(); checkAch();
  for (const m of s.mates) m.b = clamp(m.b - .5, 0, 100);
  for (const c of s.net) c.b = clamp(c.b - .7, 0, 100);
  for (const c of s.net.filter(x => x.b < 4)) addNews(tt`${c.n} ile bağın koptu.`, 'users');
  s.net = s.net.filter(x => x.b >= 4);
  s.rel.takim += (chem() * 100 - s.rel.takim) * .03;   // soyunma odası havası, yakın olduğun isimlere bağlı
  newQuest(); delete s.fl.rehabw;
  if (s.adapt > 0) s.adapt--;
  rivalTick(); plusWeek(); s.rel.basin += (50 - s.rel.basin) * .025;
  if (s.week === 19) coachCheck();
  if (s.week % 4 === 0) {
    if (s.mr.length >= 3 && s.mr.reduce((a, b) => a + b, 0) / s.mr.length >= 7.6) {
      const b = nice(Math.max(1000, s.con.wage)); s.money += b; s.awards++; fx({ rep: 1, mo: 5 }); unlock('ay');
      s.pop.push(tt('Ayın oyuncusu seçildin')); addNews(tt`Ayın oyuncusu seçildin. Ödül: ${fmt(b)}`, 'star');
      addFeed('c:' + s.clubId, club(s.clubId).n, tt`Ayın oyuncusu: ${s.name}. Tebrikler!`, 'kulup');
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
  if (c.length) { const n = club(pick(c)).n; if (n !== r.c) { r.c = n; lines.push(tt`Rakibin ${r.n}, ${n} ile anlaştı.`); } }
}

export function seasonEnd() {
  const s = S, myL = leagueOf(s.clubId), L = LMAP[myL];
  const sorted = {}; for (const lid in s.lg) sorted[lid] = table(lid).map(r => r.id);
  s.eps = euroCoef();
  const eq = euroQual(sorted), skc = s.cup && s.cup.top ? [sorted[s.cup.top][0], s.cup.champ, sorted[s.cup.top][1]] : null, clw = s.cl ? s.cl.champ : null;
  const pos = sorted[myL].indexOf(s.clubId) + 1, n = sorted[myL].length;
  const lines = [], tro = [], label = seasonLabel();
  const st = { ...s.st }, avg = st.apps ? st.rs / st.apps : 0, mg = !!s.mgr, aw = [];
  if (!mg) s.hist.push({ y: label, c: club(s.clubId).n, l: L.name, apps: st.apps, g: st.g, a: st.a, avg: +avg.toFixed(2), pos, k: s.loan ? 1 : 0, o: OVR() });
  if (pos === 1) {
    tro.push(`${L.name} Şampiyonluğu${mg ? (s.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : ''}`);
    const b = nice(s.con.wage * 12); if (b) { s.money += b; lines.push(tt`Şampiyonluk primi: ${fmt(b)}`); }
    fx({ mo: 15, taraf: 10 });
  }
  const top = scorers(myL)[0];
  if (top && top.me && st.lg >= 5) tro.push(`${L.name} ${KW ? 'Gol Kraliçeliği' : 'Gol Krallığı'} (${st.lg} gol)`);
  if (st.apps >= 20 && avg >= 7.3) { tro.push('Yılın 11\'i'); unlock('yil11'); }
  // sezon sonu ödül töreni
  const poyT = s.rel.basin >= 70 ? 7.6 : s.rel.basin < 30 ? 7.8 : 7.7;   // basınla aran oylamaya yansır
  if (st.apps >= 22 && avg >= poyT) tro.push(`${L.name} Yılın Futbolcusu`);
  if (s.age <= 21 && st.apps >= 18 && avg >= 7.2) tro.push('Yılın Genç Oyuncusu');
  if (s.fl.rov) { if (chance(.35)) tro.push('Yılın Golü (röveşata)'); delete s.fl.rov; }
  // ödül töreni: adaylar ve kazananlar
  const sc3 = scorers(myL).slice(0, 3), star = id => (s.sc[id] && s.sc[id][0] ? s.sc[id][0][0] : rname(L.c)), T3 = sorted[myL].slice(0, 3);
  if (sc3.length && sc3[0].g > 0) aw.push({ t: kx(GOLK), i: 'ball', noms: sc3.map(x => ({ n: x.n, c: x.team, v: x.g + tt(' gol'), me: !!x.me })), win: 0 });
  const meIn = !mg && st.apps >= 16 && avg >= 7.1, poy = [{ n: star(T3[0]), c: T3[0], v: tt('Şampiyonun yıldızı') }, { n: star(T3[1]), c: T3[1], v: tt('Zirve yarışının ismi') }];
  poy.push(meIn ? { n: s.name, c: s.clubId, v: tt`${st.g} gol · ${avg.toFixed(2).replace('.', DSEP)} ort.`, me: true } : { n: star(T3[2] || T3[0]), c: T3[2] || T3[0], v: tt('Sezonun sürprizi') });
  aw.push({ t: tt('Yılın Futbolcusu'), i: 'star', noms: poy, win: st.apps >= 22 && avg >= poyT && !mg ? 2 : ri(0, meIn ? 1 : 2) });
  if (!mg && s.age <= 21 && st.apps >= 10) aw.push({ t: tt('Yılın Genç Oyuncusu'), i: 'up', noms: [{ n: s.rival.n, c: null, v: s.rival.c }, { n: rname(L.c), c: pick(sorted[myL].slice(0, 8)), v: tt('Çıkış yılı') }, { n: s.name, c: s.clubId, v: tt`${st.apps} maç · ${avg.toFixed(2).replace('.', DSEP)} ort.`, me: true }], win: st.apps >= 18 && avg >= 7.2 ? 2 : ri(0, 1) });
  if (mg && s.mgr.role === 'coach') { const ot = sorted[myL].filter(x => x !== s.clubId).slice(0, 2); aw.push({ t: tt('Yılın Teknik Direktörü'), i: 'whistle', noms: [...ot.map(x => ({ n: coach(x).n, c: x, v: tt`${sorted[myL].indexOf(x) + 1}. sıra` })), { n: s.name, c: s.clubId, v: tt`${pos}. sıra`, me: true }], win: pos === 1 || pos <= s.mgr.obj - 4 ? 2 : 0 }); if (pos === 1 || pos <= s.mgr.obj - 4) tro.push('Yılın Teknik Direktörü'); }
  const xi = !mg && st.apps >= 20 && avg >= 7.3;
  if (!mg && s.age <= 23 && st.apps >= 20 && avg >= 7.5 && s.pot < 97) { s.pot++; lines.push(tt('Çıkış sezonu: potansiyelin yükseldi')); }
  if (!mg) goalEnd(st, pos, lines);
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
  if (moved === 1) { lines.push(tt`${club(s.clubId).n} bir üst lige yükseldi!`); fx({ mo: 12, taraf: 8 }); const b = nice(s.con.wage * 6); if (b) { s.money += b; lines.push(tt`Yükselme primi: ${fmt(b)}`); } }
  if (moved === -1) { lines.push(tt`${club(s.clubId).n} küme düştü.`); fx({ mo: -15, taraf: -10 }); }
  if (!mg) plusSeason(st, avg, pos, moved, lines);
  for (const lid in s.lg) {
    const t = s.lg[lid].t, m = t.reduce((a, x) => a + s.rt[x], 0) / t.length;
    for (const id of t) s.rt[id] = clamp(s.rt[id] + randn() * 1.1 + (m - s.rt[id]) * 0.06, 15, 94);
  }
  for (const id of XIDS) s.rt[id] = clamp(s.rt[id] + randn() * .9 + (CLUBS[id].r - s.rt[id]) * .15, 60, 82);
  coachTurn(pos, n, lines);
  s.lastAvg = avg || s.lastAvg || 6.3;
  if (s.loan) {
    const lc = s.clubId; matesToNet(); s.clubId = s.loan.from; s.loan = null; genMates(); genRival();
    s.rel.hoca = clamp(42 + (avg - 6.5) * 14, 20, 80); s.rel.takim = 45; s.rel.taraf = 35; s.since = s.season + 1; delete s.fl.kaptan;
    lines.push(tt`Kiralık süren bitti: ${club(s.clubId).n} takımına döndün.`);
    if (avg >= 6.6 && !s.watch.some(w => w.id === lc)) s.watch.push({ id: lc, lv: clamp(50 + (avg - 6.5) * 25, 40, 90) });
  }
  s.car.apps += st.apps; s.car.g += st.g; s.car.a += st.a; s.car.rs += st.rs;
  s.st = { apps: 0, g: 0, a: 0, rs: 0, cs: 0, lg: 0 };
  s.age++; s.season++; s.year++; s.week = 1; s.used = 0; s.bench = 0;
  if (s.fl.kronik && !mg) {
    if (s.fl.kronikOp) { delete s.fl.kronik; delete s.fl.kronikOp; s.inj = 8; lines.push(tt('Sezon arası ameliyat oldun: ilk sekiz hafta yoksun, diz artık sağlam.')); }
    else { s.at.hiz = clamp(s.at.hiz - 1, 1, 99); lines.push(tt('Kronik diz sakatlığı hızını törpülüyor.')); }
  }
  if (s.age >= 31 && !mg) {
    const d = (s.age - 30) * 0.45, soft = (s.fl.bakim ? 0.6 : 1) * (perk('genclik') ? 0.6 : 1);
    s.at.hiz -= d * 1.3 * soft; s.at.guc -= d * 0.8 * soft;
    for (const k of ['sut', 'teknik', 'pas', 'savunma', 'kafa', 'kaleci']) s.at[k] -= d * 0.5 * soft;
    s.at.zihin += 0.4;
    for (const k in s.at) s.at[k] = clamp(s.at[k], 1, 99);
    lines.push(tt('Yaş kendini gösteriyor: hızın ve gücün biraz düştü.'));
  }
  if (s.fl.okul && s.age >= 19) {
    delete s.fl.okul;
    if (s.egt >= 50) { s.fl.diploma = 1; lines.push(tt('Liseyi bitirdin, diploman cebinde.')); fx({ aile: 8 }); }
    else lines.push(tt('Okulu bitiremedin; diploma alamadın.'));
  }
  if (!mg) rivalStep(lines);
  for (const lid in s.lg) initLeague(lid);
  initCup(); initEuro(eq);
  xcInit(skc, clw); worldMoves(6, 3); squadTurn();
  for (const id in s.cr) if (s.cr[id].until <= absWeek()) delete s.cr[id];
  if (!mg) newGoals();
  const exp = s.assets.filter(id => SHOP.find(x => x.id === id).yr);
  if (exp.length) { s.assets = s.assets.filter(id => !exp.includes(id)); lines.push(tt('Sezonluk anlaşmaların bitti: ') + exp.map(id => SHOP.find(x => x.id === id).n).join(', ') + '.'); }
  gainXp(2);
  for (const r of s.refs) r.me = clamp(r.me * .5, -1, .6);   // hakemler zamanla unutur
  addNews(tt`${label} sezonu bitti. ${L.name} şampiyonu ${champ}.`);
  return { label, league: L.name, pos, n, champ, st, avg, tro, lines, moved, aw, xi };
}

// ---------- kupalar: 'cup' ülke kupası; 'cl' Şampiyonlar Ligi, 'el' Avrupa Ligi ----------
const CUPW = [5, 10, 16, 23, 29, 35];
const cupRoundName = n => ({ 64: 'Son 64', 32: 'Son 32', 16: 'Son 16', 8: 'Çeyrek final', 4: 'Yarı final', 2: 'Final' }[n] || 'Tur');

export function initCup() {
  const s = S, lid = leagueOf(s.clubId), L = LMAP[lid]; let name, teams;
  const byR = l => [...s.lg[l].t].sort((a, b) => s.rt[b] - s.rt[a]);
  if (KW && L.c === 'TR') { s.cup = { name: '', weeks: [], alive: [], r: 0, hist: [], champ: null, top: null, none: 1 }; return; }   // Türkiye'de kadınlarda ulusal kupa yok
  if (L.c === 'TR' && L.tier <= 4) { name = 'Türkiye Kupası'; teams = [...s.lg.tr1.t, ...s.lg.tr2.t, ...s.lg.tr3.t, ...byR('tr4').slice(0, 8)]; }
  else if (L.c === 'TR' && L.tier === 5) { name = 'Bölgesel Kupa'; teams = [...s.lg.tr5.t]; }
  else if (L.c === 'TR') { name = s.prov + ' İl Kupası'; teams = [...s.lg.tr6.t, ...s.lg.tr7.t, ...byR('tr8').slice(0, 4)]; }
  else { name = CUPS[L.c]; const all = byR(lid); teams = all.slice(0, Math.min(16, 2 ** Math.floor(Math.log2(all.length)))); }   // kura ikinin kuvveti kadar takımla
  if (!teams.includes(s.clubId)) teams[teams.length - 1] = s.clubId;
  s.cup = { name, weeks: CUPW.slice(-Math.log2(teams.length)), alive: shuffle(teams), r: 0, hist: [], champ: null, top: cupTop() };
}
// Ulusal kupa hangi ülkenin Avrupa kontenjanını etkiler (yerel kupalarda yok)
function cupTop() { if (KW) return null; const lid = leagueOf(S.clubId), L = LMAP[lid]; return L.c !== 'TR' ? lid : L.tier <= 4 ? 'tr1' : null; }   // kadınlarda kupa Avrupa bileti vermez

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
      addNews(tt`${c.name} sizin! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(tt`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
    addFeed('basin', tt('Saha Kenarı'), tt`${c.name} şampiyonu: ${club(c.champ).n}!`, 'manset');
  } else if (mine) addNews(mine[4] === S.clubId ? tt`${c.name}: tur atladınız.` : tt`${c.name}: elendiniz.`, 'trophy');
}

// ---------- transfer ----------
// Kadın futbolunda ücret eğrisi daha alçak ve daha yatık: Süper Lig ortası haftada ~₺10 bin, Avrupa zirvesi ~₺800 bin (≈€16 bin); 2. ve 3. Lig amatör
const baseW = o => (KW ? 125 * Math.exp((o - 30) * 0.146) : 150 * Math.exp((o - 30) * 0.19));
const valF = () => (KW ? .2 : 1);     // bonservis ölçeği: kadınlarda rekor bedeller €1 milyon dolayında
const folF = () => (KW ? .35 : 1);    // takipçi artışı
export function wageFor(r, o) { if (r < (KW ? 44 : 30)) return 0; return nice(baseW(r) * clamp(1 + (o - r) / 25, .6, 1.5)); }

// Piyasa değeri: güç, yaş ve kalan potansiyel
export function value() {
  const o = OVR(), a = S.age;
  const af = a <= 21 ? 1.5 : a <= 25 ? 1.25 : a <= 28 ? 1 : a <= 31 ? .6 : a <= 33 ? .3 : .12;
  return nice(baseW(o) * 300 * valF() * af * (1 + (a <= 23 ? Math.max(0, S.pot - o) / 60 : 0)) * (S.clubId ? clamp(1 + (profile().lvl - o) / 40, .8, 1.35) : 1));
}
// Kulübün satış tutumu
export function stance() {
  if (S.loan) return 'kiralik';
  if (S.rel.hoca < 30 || S.tstat === 'istek') return 'liste';
  if (S.rel.hoca >= 70 && S.con.until > S.season) return 'kilit';
  return 'acik';
}
export function askPrice() { const st = stance(); return nice(value() * (st === 'kilit' ? 1.5 : st === 'liste' ? 0.6 : 1) * (S.con.until <= S.season ? 0.7 : 1)); }
export const interest = lv => lv >= 60 ? tt('Teklif hazırlığında') : lv >= 35 ? tt('İlgileniyor') : tt('İzliyor');

export function setStatus(v) {
  if (S.tstat === v) return [];
  const prev = S.tstat; S.tstat = v;
  if (v === 'istek' && !S.fl.istek) { S.fl.istek = 1; addNews(tt('Transfer isteğin kulüpte bomba etkisi yarattı.'), 'swap'); return fx({ hoca: -10, taraf: -8, sad: -8 }); }
  if (v === 'kiralik') return fx({ hoca: -2 });
  if (v === 'mutlu' && prev === 'istek') return fx({ taraf: 3 });
  return [];
}

// Her hafta: izleyen kulüplerin ilgisi formuna göre artar ya da söner
function watchStep() {
  const s = S, o = OVR(), pw = s.agent ? s.agent.pw : 0;
  const f = s.lastR.length ? s.lastR.reduce((a, b) => a + b, 0) / s.lastR.length : 6.3;
  const open = s.tstat === 'acik' ? 1.5 : s.tstat === 'istek' ? 3 : 0;
  const P = profile(), cur = s.rt[s.clubId];
  // formdayken alt seviye kulüplerin ilgisi söner; menajer ilgiyi canlı tutar
  // seviyenin çok üstündeki kulüp kolay ikna olmaz: ilgisi yavaş büyür, uzun süre form ister
  for (const w of s.watch) { const up = (f - 6.6) * 6 + open + pw * 3; w.lv = clamp(w.lv + (up > 0 ? up * clamp(1 - (s.rt[w.id] - o - 3) / 12, .25, 1) : up) + rnd(-3, 3) - (P.form > 0 && s.rt[w.id] < cur - 4 ? 6 : 0), 0, 100); }
  s.watch = s.watch.filter(w => w.lv > 3 && w.id !== s.clubId && s.rt[w.id] >= P.lo - 3 && s.rt[w.id] <= P.hi + 3);
  if (s.watch.length < 4 && chance(clamp(0.05 + (f - 6.5) * 0.07 + pw * 0.06 + (open ? 0.05 : 0) + (P.rank ? .06 : 0) + (P.tag === 'genc' ? .05 : 0), .01, .4))) {
    let pool = []; const far = [], myC = LMAP[leagueOf(s.clubId)].c;
    for (const lid in s.lg) {
      const home = LMAP[lid].c === myC; if (!home && LMAP[lid].c !== 'TR' && !P.abroad) continue;
      for (const id of s.lg[lid].t) {
        const r = s.rt[id]; if (id === s.clubId || r < P.lo || r > P.hi || banned(id) || s.watch.some(w => w.id === id)) continue;
        if (r < cur - 2 && P.form >= 1) continue;          // iyi oynarken senden zayıf kulüp kapını çalmaz
        const L = home ? pool : far; L.push(id); if (r > cur) L.push(id);
      }
    }
    if (!pool.length || (far.length && chance(.3))) pool = far;   // önce kendi ülkenin kulüpleri duyar; yurt dışı daha seyrek
    if (pool.length) { const id = pick(pool); s.watch.push({ id, lv: ri(14, 32) }); addNews(tt`${club(id).n} scoutları seni izlemeye başladı.`, 'eye'); addFeed('basin', tt('Transfer Hattı'), say('rumor', { c: club(id).n, me: s.name }), 'haber'); }
  }
  if (s.agent && s.week % 4 === 2) agentStep(P);
  // hayal takımı: seviyen yaklaşınca kendiliğinden radarına girersin
  const dr = s.dream;
  if (dr && dr !== s.clubId && !s.watch.some(w => w.id === dr) && o >= s.rt[dr] - 7 && (LMAP[leagueOf(dr)].c === 'TR' || s.rep >= 40) && chance(.15)) {
    s.watch.push({ id: dr, lv: ri(26, 40) }); s.pop.push(tt`${club(dr).n} seni izliyor`);
    addNews(tt`Hayalindeki kulüp ${club(dr).n} seni izliyor!`, 'heart'); addFeed('basin', tt('Transfer Hattı'), tt`${club(dr).n}, ${s.name} dosyasını açtı.`, 'manset');
  }
}

export function makeOffer(id, x = {}) {
  const r = S.rt[id], o = OVR(), d = o + (profile().lvl - o) * .5 - r;   // rol sözü algına göre; sahada yerini yine gücün belirler
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
  const P = profile(), th = (free ? 25 : kind === 'kis' ? 62 : 55) - (s.agent ? s.agent.pw * 8 : 0);
  for (const w of [...s.watch].sort((a, b) => b.lv - a.lv)) {
    if (out.length >= 3 || w.lv < th || w.id === s.clubId || banned(w.id)) continue;
    const of = makeOffer(w.id);
    if (!free) { of.fee = nice(value() * rnd(.75, 1.35)); of.ask = askPrice(); of.st = of.fee >= of.ask || of.fee >= (s.con.rel || Infinity) ? 'ok' : 'red'; }
    out.push(of);
  }
  if (s.agent && !s.loan && P.form >= 1) {   // menajerin masaya getirdikleri: bağlantısı ne kadar güçlüyse o kadar çok ve o kadar iyi kulüp
    const cur = s.rt[s.clubId], want = 1 + Math.round(s.agent.pw * 1.2), okP = clamp(.18 + s.agent.pw * .32 + P.form / 16, .1, .75), pool = [];
    for (const lid in s.lg) { if (LMAP[lid].c !== 'TR' && !P.abroad) continue; for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id !== s.clubId && !banned(id) && !out.some(x => x.id === id) && r >= Math.max(cur + 1, P.lvl - 4) && r <= P.hi) pool.push(id); } }
    const myC = LMAP[leagueOf(s.clubId)].c, hm = shuffle(pool.filter(id => LMAP[leagueOf(id)].c === myC)), fr = shuffle(pool.filter(id => LMAP[leagueOf(id)].c !== myC));
    for (const id of [...hm.slice(0, 4), ...fr.slice(0, 3)]) {   // önce kendi ülkendeki kapılar
      if (out.length >= want || out.length >= 3) break;
      if (!chance(okP)) continue;   // her görüşme teklifle bitmez
      const of = makeOffer(id, { via: 1 });
      if (!free) { of.fee = nice(value() * rnd(.8, 1.3)); of.ask = askPrice(); of.st = of.fee >= of.ask || of.fee >= (s.con.rel || Infinity) ? 'ok' : 'red'; }
      out.push(of);
    }
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
  if (chance(clamp(p, .1, .9))) { o.wage = nice(o.wage * 1.15); o.sign = nice(o.sign * 1.15); o.goalB = nice(o.wage * 0.15); return { text: tt('Kulüp şartlarını kabul etti. Ücret %15 arttı.') }; }
  if (!o.renew && chance(.3)) return { gone: true, text: tt('Kulüp masadan kalktı. Teklif geri çekildi.') };
  return { text: tt('Kulüp teklifini yükseltmedi. Mevcut şartlar geçerli.') };
}

// Kulübün reddettiği teklif için bastır: transfer isteği verilir, kulüp direnebilir.
export function pushTransfer(of) {
  of.pushed = true;
  const ch = setStatus('istek');
  if (chance(clamp(0.35 + (of.fee / of.ask - 0.5), .15, .9))) { of.st = 'ok'; return { ok: true, ch, text: tt('Yönetim direnmedi. Teklif kabul edildi.') }; }
  return { ok: false, ch, text: tt('Yönetim geri adım atmadı: "Sözleşmesi var, satmıyoruz."') };
}

export function acceptOffer(o) {
  const s = S, cut = s.agent ? s.agent.cut : 0, move = o.id !== s.clubId;
  if (move) {
    const old = s.clubId, hain = isDerby(old, o.id);
    s.adapt = adaptWeeks(o.id);
    s.moves.push({ y: seasonLabel(), w: s.week, from: old, to: o.id, fee: o.fee || 0, loan: o.loan ? 1 : 0 });
    if (hain) { s.fl.hain = 1; addFeed('taraftar', pick(FANS), tt`${s.name} ezeli rakibe gitti. Bunu unutmayız.`); addNews(tt('Ezeli rakibe transferin eski taraftarını öfkelendirdi.'), 'alert'); }
    if (!o.loan && s.con.until >= s.season) s.hid.sad = clamp(s.hid.sad - 6, 0, 100);
    if (o.loan) s.loan = { from: s.clubId, back: s.season }; else s.loan = null;
    matesToNet(); s.clubId = o.id; genMates(); genRival();
    s.rel.hoca = { '11': 60, rot: 46, genc: 34 }[o.role];
    s.rel.takim = 45; s.rel.taraf = clamp(28 + s.rep * 0.3 - (s.fl.hain ? 8 : 0), 0, 100); delete s.fl.hain;
    if (s.net.some(c => c.org === o.id)) { s.rel.takim += 8; s.rel.hoca += 4; }
    s.bench = 0; s.since = s.season; s.watch = []; s.tstat = 'mutlu';
    delete s.fl.kaptan; delete s.fl.dilBar; delete s.fl.istek; delete s.fl.pc; s.spb = {}; s.lr = { ten: 20 };
    const L = LMAP[leagueOf(o.id)];
    if (L.c !== 'TR') { s.fl.yurtdisi = 1; if (s.dil < 40 && !(s.fl.gurbet && L.c === (s.gur || 'DE'))) s.fl.dilBar = 1; }
    s.peakC = Math.max(s.peakC, s.rt[o.id]);
  }
  if (o.loan) { addNews(tt`${club(o.id).n} takımına sezon sonuna kadar kiralandın.`, 'swap'); return; }
  s.money += Math.round(o.sign * (1 - cut));
  if (move) addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${s.name} artık ${club(o.id).n} oyuncusu.`, 'manset');
  if (move && o.id === s.dream) { s.fl.hayal = 1; unlock('hayal'); fx({ mo: 15 }); }
  if (move) addNews(o.fee ? tt`${club(o.id).n}, bonservisin için ${fmtS(o.fee)} ödedi. ${o.len} yıllık imza.` : tt`${club(o.id).n} ile ${o.len} yıllık sözleşme imzaladın.`, 'swap');
  else { s.rel.hoca = clamp(s.rel.hoca + 5, 0, 100); s.hid.sad = clamp(s.hid.sad + 5, 0, 100); addNews(tt`${club(o.id).n} ile sözleşme yeniledin.`, 'pen'); }
  s.con = { wage: o.wage, until: s.season + o.len - 1, role: o.role, goalB: o.goalB || 0 };
  if (o.img) s.con.img = 1; if (o.loy) s.con.loy = o.loy;
  s.con.rel = nice(value() * (o.relF || 4));
  if (move) newGoals();
}

// ---------- milli takım ----------
// Milli takım haftaları: iki sezonda altı eleme maçı, çift yıllarda yaz turnuvası
// Kadınlarda turnuvalar tek yıllarda: 2027 Dünya Kupası, 2029 Avrupa Şampiyonası, 2031 Dünya Kupası…
const NATW = [9, 17, 27], NTN_E = { euro: 'Avrupa Şampiyonası', wc: 'Dünya Kupası' }, NTN_K = { euro: 'Kadınlar Avrupa Şampiyonası', wc: 'Kadınlar Dünya Kupası' };
let NTN = NTN_E;
const WORLD_E = [['İngiltere', 87], ['Belçika', 82], ['Danimarka', 79], ['Brezilya', 87], ['Arjantin', 88], ['Uruguay', 81], ['Kolombiya', 80], ['ABD', 77], ['Meksika', 77], ['Japonya', 78], ['Güney Kore', 76], ['Fas', 80], ['Senegal', 78], ['Nijerya', 76], ['Avustralya', 73]];
let WORLD = WORLD_E;
export const myNat = () => NATN[S.nat] || 'Türkiye';
const natR = n => (NATIONS.find(x => x[0] === n) || WORLD.find(x => x[0] === n) || [n, 75])[1];
export const natOk = () => !S.mgr && OVR() >= (KW ? natR(myNat()) - 6 : 73) && S.rep >= (KW ? 35 : 45);
function ntInit() {
  const y = S.year + 1, ty = (y % 2 === 0) !== KW ? y : y + 1, me = myNat(), pool = NATIONS.filter(x => x[0] !== me), pk = f => pick(pool.filter(f))[0];
  S.nt = { kind: ty % 4 === (KW ? 1 : 0) ? 'euro' : 'wc', year: ty, grp: [pk(x => x[1] >= 83), pk(x => x[1] >= 75 && x[1] < 83), pk(x => x[1] < 75)], tb: {}, md: ty === y ? 3 : 0, wk: 0, q: null, tour: null, last: null };
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
  if (!own) addFeed('fed', tt('Milli Takımlar'), tt`${NTN[t.kind]} Elemeleri: ${me} ${us}-${op} ${m.opp}.`, 'haber');
  if (t.md === 6) {
    const pos = ntTable().findIndex(r => r.n === me) + 1; t.q = pos <= 2;
    addNews(t.q ? tt`${me}, ${t.year} ${NTN[t.kind]} biletini aldı!` : tt`${me} elemelerde ${pos}. oldu; ${t.year} ${NTN[t.kind]} hayali bitti.`, 'flag');
    addFeed('basin', tt('Saha Kenarı'), t.q ? tt`${tt(me).toLocaleUpperCase(LC)} ${t.year} ${tt(NTN[t.kind]).toLocaleUpperCase(LC)}'NDA!` : tt`${me} ${NTN[t.kind]}'na gidemiyor.`, 'manset');
  }
}
export function natFixture() {
  const s = S; if (!NATW.includes(s.week) || s.inj > 0 || s.ban > 0 || s.mgr) return null;
  const o = OVR(), me = myNat(); let lvl = null;
  if (natOk()) lvl = 'A'; else if (KW ? s.age <= 19 && o >= natR(me) - 22 : s.age <= 21 && o >= 56) lvl = 'U21';   // kadınlarda genç milli takım U19
  if (!lvl) return null;
  if (lvl === 'A' && s.nt && s.nt.md < 6) { const m = ntMatch(); return { nat: true, lvl, q: true, name: NTN[s.nt.kind] + ' Elemeleri', usN: me, usR: natR(me), opp: { n: m.opp, r: natR(m.opp) }, home: m.home }; }
  const op = pick(NATIONS.filter(x => x[0] !== me)), d = lvl === 'A' ? 0 : -16, suf = lvl === 'A' ? '' : KW ? ' U19' : ' U21';
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
  addFeed('fed', tt('Milli Takımlar'), tt`${t.tour.name} başlıyor. ${me} grubu: ${grp.map(x => tt(x)).join(', ')}.`, 'manset');
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
    addNews(tt`${me} ${T.name} ŞAMPİYONU!`, 'trophy'); addFeed('basin', tt('Saha Kenarı'), tt`TARİHÎ GECE: ${tt(me).toLocaleUpperCase(LC)} ${tt(T.name).toLocaleUpperCase(LC)} ŞAMPİYONU!`, 'manset');
  } else addNews(tt`${me}, ${T.name} yolculuğunu ${tt(last.stage).toLocaleLowerCase(LC)} aşamasında noktaladı.`, 'flag');
  ntInit(); S.nt.last = last;
}
export const tourTable = () => { const T = S.nt.tour; return T ? tbSort(T.tb, [myNat(), ...T.grp]) : []; };


// ---------- maç ----------
const MATTR = { sut: ['sut'], kafa: ['kafa'], frikik: ['sut', 'teknik'], penalti: ['sut', 'zihin'], pas: ['pas'], calim: ['teknik'], savunma: ['savunma'], kurtaris: ['kaleci'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'], duvar: ['kaleci', 'zihin'], penkurtar: ['kaleci', 'zihin'], kosu: ['hiz', 'zihin'], ribaund: ['sut', 'zihin'], markaj: ['savunma', 'zihin'], cikis: ['kaleci', 'zihin'] };
const XP = { sut: ['sut', 'zihin'], kafa: ['kafa', 'guc'], frikik: ['sut', 'teknik'], penalti: ['zihin', 'sut'], pas: ['pas', 'zihin'], calim: ['teknik', 'hiz'], savunma: ['savunma', 'guc'], kurtaris: ['kaleci', 'zihin'], vole: ['sut', 'teknik'], rovesata: ['teknik', 'kafa'], orta: ['pas', 'teknik'], korner: ['pas', 'teknik'], duvar: ['kaleci', 'zihin'], penkurtar: ['kaleci', 'zihin'], kosu: ['hiz', 'zihin'], ribaund: ['sut', 'zihin'], markaj: ['savunma', 'zihin'], cikis: ['kaleci', 'zihin'] };
export const GOOD = ['gol', 'ok', 'gecti', 'kapildi', 'kurtardi', 'kacti'];
export function skillFor(k) { const a = MATTR[k]; return a.reduce((s, x) => s + S.at[x], 0) / a.length + (has('krampon') ? 2 : 0); }

export function buildMatch(fxt, rl) {
  const nat = !!fxt.nat;
  const usR = nat ? fxt.usR : S.rt[S.clubId], oppR = (nat ? fxt.opp.r : S.rt[fxt.opp]) + (fxt.boost || 0);
  const ref = nat ? null : curRef(), stam = clamp(55 + S.en * .45, 40, 100);
  const hb = fxt.final || fxt.tour || (nat && !fxt.q) ? 0 : fxt.home ? 2 : fxt.eu ? -3.5 : -2, def = S.pos === 'DF' || S.pos === 'KL';
  const tac = nat ? null : coach().st, T = tac ? TACT[tac] : { lu: 1, lo: 1, st: 1 }, fit = nat ? 50 : tacFit(), wx = wxFor(nat);
  const mk = nat ? null : sqName(fxt.opp, { FV: 'DF', KN: 'DF', OS: 'OS', DF: 'FV', KL: 'FV' }[S.pos]), gk = nat ? null : squad(fxt.opp)[0];
  const derby = !nat && isDerby(S.clubId, fxt.opp), scn = pickScn(usR + hb, oppR, derby, wx, fxt), Z = SCN[scn], lh = leagueHard(fxt);
  const lu = 1.3 * Math.exp((usR + hb - oppR) * 0.05) * (def ? 0.95 : 0.6) * T.lu * (Z.lu || 1) * (nat ? 1 : (.97 + chem() * .08) * (1 - ((S.lr || {}).ten || 0) / 900));   // kimya gol getirir, gergin soyunma odası götürür
  const lo = 1.2 * Math.exp((oppR - hb - usR) * 0.05) * (S.pos === 'KL' ? 0.25 : def ? 0.55 : 0.95) * T.lo * (Z.lo || 1);
  const tl = [];
  for (let i = poisson(clamp(lu, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: true });
  for (let i = poisson(clamp(lo, .1, 4)); i > 0; i--) tl.push({ min: ri(2, 90), t: 'bg', us: false });
  const from = rl === 'yedek' ? ri(58, 70) : 1, n = Math.max(rl === 'yedek' ? 1 : 3, (rl === 'yedek' ? ri(1, 2) + (chance(.4) ? 1 : 0) : ri(3, 5) + (chance(.4) ? 1 : 0)) + (derby ? 1 : 0) + (Z.mom || 0));
  const tasks = nat ? [] : pickTasks(tac, rl), need = tasks.flatMap(t => TASKS[t].need || []);
  for (let i = 0; i < Math.max(n, need.length); i++) tl.push({ min: ri(from + 1, 90), t: 'mom', k: need[i] || wpick(momW(tac, scn)), fix: !!need[i] });
  if (rl === '11' && !nat && chance(.5)) tl.push({ min: ri(56, 72), t: 'tac' });
  shuffle([...FILL]).slice(0, 4).forEach(x => tl.push({ min: ri(3, 88), t: 'txt', s: x }));
  if (rl === '11' && !nat) { tl.push({ min: 45, t: 'dec', k: 'ht' }); if (chance(.4)) tl.push({ min: ri(50, 84), t: 'dec', k: wpick({ pen: .5 + refPn(ref) * 1.1, ref: 1, knock: 1 }) }); }
  if (rl === 'yedek') tl.push({ min: from, t: 'txt', s: tt('Hoca seni çağırdı. Oyuna giriyorsun!') });
  tl.sort((a, b) => a.min - b.min || (a.t === 'txt' ? -1 : 1));
  return { fxt, nat, cup: !!fxt.cup, ko: (!!fxt.cup && !fxt.lg && fxt.leg !== 1) || !!fxt.kof, agg: fxt.agg || [0, 0], awayEu: !!fxt.eu && !fxt.home && !fxt.final, eu: fxt.eu || null, role: rl, usR, oppR, tl, usG: 0, oppG: 0, pg: 0, pa: 0, rt: 6 + clamp((fit - 50) / 120, -.25, .3), yel: 0, red: false, mom: 0, ok: 0,
    tac, tac0: tac, fit, tasks, drain: T.st * WX[wx][3], wx, mark: mk, gk, lu, lo, scn, lh, cnt: { pas: 0, orta: 0, calim: 0, sav: 0, kurt: 0, bad: 0, on: 0 },
    big: perk('buyuk') && (derby || !!fxt.eu || !!fxt.final || !!fxt.po), adapt: !nat && S.adapt > 0, prep: S.fl.prep === absWeek(),
    derby, stam, stam0: stam, mode: 'n', calls: 2, crowd: !nat && fxt.home ? 1 : 0, ref, bias: ref ? clamp(refBias(ref, S.clubId) - refBias(ref, fxt.opp) * .5 + ref.me, -1.2, 1.2) : 0 };
}

export function simMoment(k, M, v) {
  const base = { sut: .2, kafa: .17, frikik: .08, penalti: .76, pas: .62, calim: .45, savunma: .58, kurtaris: .74, vole: .15, rovesata: .07, orta: .48, korner: .45, duvar: .7, penkurtar: .26, kosu: .42, ribaund: .26, markaj: .6, cikis: .7 }[k];
  const shot = k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'vole' || k === 'rovesata' || k === 'ribaund';
  const ok = chance(clamp(base + (skillFor(k) - M.oppR) * (shot ? 0.008 : 0.013) + (M.focus ? .06 : 0) + (M.prep ? .03 : 0) + (M.big ? .04 : 0) - (M.adapt ? .03 : 0) - (M.awayEu ? .02 : 0) - ((M.lh || 1) - 1) * .2 - (v && MVAR[v] ? MVAR[v].dif : 0) - (M.wx && WX[M.wx][4].includes(k) ? .03 : 0) - (S.diff === 'gercek' ? .03 : 0) + (S.diff === 'kolay' ? .04 : S.diff === 'zor' ? -.04 : 0) + (k === 'penalti' && perk('buz') ? .1 : 0), .05, shot ? .42 : .92));
  switch (k) {
    case 'pas': return ok ? { out: 'ok', adv: chance(.5) } : { out: pick(['kesildi', 'bos']) };
    case 'orta': case 'korner': return ok ? { out: 'ok', adv: true } : { out: pick(['kesildi', 'bos']) };
    case 'calim': return { out: ok ? 'gecti' : 'kaptirdi' };
    case 'savunma': return { out: ok ? 'kapildi' : chance(.2) ? 'faul' : 'gecildi' };
    case 'markaj': return { out: ok ? 'kapildi' : 'gecildi' };
    case 'kosu': return { out: ok ? 'kacti' : pick(['ofsayt', 'gec']) };
    case 'cikis': return { out: ok ? 'kurtardi' : 'yedi' };
    case 'ribaund': return { out: ok ? 'gol' : pick(['kurtaris', 'blok', 'blok']) };
    case 'kurtaris': case 'duvar': case 'penkurtar': return { out: ok ? 'kurtardi' : 'yedi' };
    default: return { out: ok ? 'gol' : pick(['kurtaris', 'kurtaris', 'aut', 'direk']) };
  }
}

export function applyMoment(M, k, res, v) {
  const out = res.out, me = S.name.split(' ').slice(-1)[0], lines = []; let chain = null;
  const good = GOOD.includes(out);
  M.mom++; if (good) M.ok++;
  const cn = M.cnt || (M.cnt = { pas: 0, orta: 0, calim: 0, sav: 0, kurt: 0, bad: 0, on: 0 });
  if (out === 'ok') { cn.pas++; if (k !== 'pas') cn.orta++; }
  if (out === 'gecti') cn.calim++; if (out === 'kapildi') cn.sav++; if (out === 'kurtardi') cn.kurt++;
  if (out === 'gol' || out === 'kurtaris' || out === 'direk') cn.on++;
  if (['kesildi', 'bos', 'kaptirdi', 'gec', 'iska', 'ofsayt'].includes(out)) cn.bad++;
  if (good && v && MVAR[v]) M.rt += MVAR[v].rt;   // zor koşulda başarı daha çok yazar
  XP[k].forEach(a => grow(a, good ? 0.04 : 0.02));
  const mate = !M.nat && S.sc[S.clubId] ? pick(S.sc[S.clubId])[0] : tt('takım arkadaşın');
  if (k === 'ribaund') {
    if (out === 'gol') { M.usG++; M.pg++; M.rt += 1.05; (M.goals || (M.goals = [])).push({ min: M.cmin || 0, k }); lines.push({ s: tt`GOL! ${me} dönen topu tamamladı!`, c: 'g' }); }
    else if (out === 'kurtaris') { M.rt += .05; lines.push({ s: tt('Geç kaldın; kaleci toparlandı ve çıkardı.') }); }
    else if (out === 'blok') { M.rt -= .15; lines.push({ s: tt('Savunma senden önce davrandı.') }); }
    else { M.rt -= .2; lines.push({ s: tt('Topa dokunamadın.') }); }
  } else if (k === 'kosu') {
    if (out === 'kacti') { M.rt += .3; chain = 'sut'; lines.push({ s: tt('Savunmanın arkasına sarktın, kaleciyle karşı karşıyasın!') }); }
    else if (out === 'ofsayt') { M.rt -= .15; lines.push({ s: tt('Erken çıktın: yardımcı hakem bayrağı kaldırdı.') }); }
    else { M.rt -= .2; lines.push({ s: tt('Geç kaldın, pas arkanda kaldı.') }); }
  } else if (k === 'markaj') {
    if (out === 'kapildi') { M.rt += .45; duel(M, 1); lines.push({ s: M.mark ? tt`${M.mark} bir türlü top alamadı; atak söndü.` : tt('Adamına top aldırmadın; atak söndü.') }); }
    else { M.rt -= .35; duel(M, 0); lines.push({ s: M.mark ? tt`${M.mark} senden kurtuldu.` : tt('Adamın senden kurtuldu.') }); if (chance(.38)) { M.oppG++; M.rt -= .2; lines.push({ s: tt('Boş kalan adam golü attı.'), c: 'b' }); } }
  } else if (k === 'cikis') {
    if (out === 'kurtardi') { M.rt += .45; lines.push({ s: tt('Kalabalığın üstünden topu aldın.') }); }
    else { M.rt -= .45; if (chance(.6)) { M.oppG++; lines.push({ s: tt('Topu ıskaladın; arka direkte tamamladılar.'), c: 'b' }); } else lines.push({ s: tt('Topu ıskaladın ama savunma uzaklaştırdı.') }); }
  } else if (k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'penalti' || k === 'vole' || k === 'rovesata') {
    if (out === 'gol') {
      M.usG++; M.pg++; M.rt += k === 'penalti' ? 0.8 : 1.2; (M.goals || (M.goals = [])).push({ min: M.cmin || 0, k });
      lines.push({ s: tt`GOL! ${me} ${k === 'kafa' ? tt('kafayla ağları buldu') : k === 'frikik' ? tt('frikikten harika attı') : k === 'penalti' ? tt('penaltıyı gole çevirdi') : k === 'vole' ? tt('gelişine vurdu, top ağlarda') : k === 'rovesata' ? tt('röveşatayla stadı ayağa kaldırdı') : tt('topu ağlara gönderdi')}!`, c: 'g' });
      if (chance(.6) && CELE[S.cele]) lines.push({ s: `${me} ${CELE[S.cele][1]}.` });
      if (k === 'rovesata') { S.fl.rov = 1; M.rt += .6; fx({ fol: Math.round(300 + S.fol * .12), taraf: 4 }); addFeed('basin', tt('Saha Kenarı'), tt`RÖVEŞATA! ${S.name} yılın golüne aday.`, 'manset'); }
    } else if (out === 'kurtaris') { M.rt += k === 'penalti' ? -0.6 : 0.1; lines.push({ s: M.gk ? tt`Kaleci ${M.gk} vuruşunu çıkardı.` : tt('Kaleci vuruşunu çıkardı.') }); }
    else if (out === 'direk') { M.rt += 0.05; lines.push({ s: tt('Direk! Top oyun alanında kaldı.') }); }
    else if (out === 'baraj') { M.rt -= 0.1; lines.push({ s: tt('Vuruşun barajda kaldı.') }); }
    else if (out === 'blok') { M.rt -= 0.1; lines.push({ s: tt('Vuruşun savunmaya çarptı.') }); }
    else if (out === 'gec') { M.rt -= 0.25; lines.push({ s: tt('Çok bekledin, top ayağından alındı.') }); }
    else if (out === 'iska') { M.rt -= 0.2; lines.push({ s: tt('Topa vuramadın.') }); }
    else { M.rt -= k === 'penalti' ? 0.7 : 0.2; lines.push({ s: tt('Vuruşun çerçeveyi bulmadı.') }); }
  } else if (k === 'pas' || k === 'orta' || k === 'korner') {
    if (out === 'ok') {
      if (chance((k !== 'pas' ? .5 : res.adv ? .35 : .12) + (perk('gorus') ? .08 : 0) + chem() * .1)) { M.usG++; M.pa++; M.rt += 0.8; lines.push({ s: tt`GOL! ${me} asist yaptı, ${mate} tamamladı!`, c: 'g' }); }
      else { M.rt += 0.35; lines.push({ s: k === 'orta' ? tt('Ortan adrese gitti ama vuruş dışarıda.') : k === 'korner' ? tt('Kornerin ceza sahasını karıştırdı.') : tt('Pasın yerini buldu, atak sürdü.') }); }
    } else if (out === 'kesildi') {
      M.rt -= 0.3; lines.push({ s: k === 'pas' ? tt('Pasın kesildi.') : tt('Savunma ortanı uzaklaştırdı.') });
      if (chance(.15)) { M.oppG++; M.rt -= 0.2; lines.push({ s: tt('Kontra atak golle bitti.'), c: 'b' }); }
    } else { M.rt -= 0.2; lines.push({ s: k === 'pas' ? tt('Pasın kimseyi bulmadı.') : tt('Ortan boşa gitti, kimse yetişemedi.') }); }
  } else if (k === 'calim') {
    if (out === 'gecti') { M.rt += 0.4; chain = 'sut'; duel(M, 1); lines.push({ s: M.mark ? tt`${M.mark} yerde kaldı; kaleciyle karşı karşıyasın!` : tt('Savunmayı ipe dizdin, kaleciyle karşı karşıyasın!') }); }
    else { M.rt -= 0.25; duel(M, 0); lines.push({ s: M.mark ? tt`${M.mark} araya girdi, topu kaptırdın.` : tt('Topu kaptırdın.') }); }
  } else if (k === 'savunma') {
    if (out === 'kapildi') { M.rt += 0.5; duel(M, 1); lines.push({ s: M.mark ? tt`${M.mark} karşısında tertemiz müdahale, top sende.` : tt('Tertemiz müdahale, top sende.') }); }
    else if (out === 'gecildi') {
      M.rt -= 0.4; duel(M, 0); lines.push({ s: M.mark ? tt`${M.mark} seni geride bıraktı.` : tt('Rakip seni geçti.') });
      if (chance(.45)) { M.oppG++; M.rt -= 0.2; lines.push({ s: tt('Pozisyon golle sonuçlandı.'), c: 'b' }); }
    } else {
      M.rt -= 0.2; lines.push({ s: tt('Arkadan müdahale: faul.') });
      if (chance(clamp(.35 + (M.ref ? M.ref.strict * .5 - M.bias * .1 : .25), .15, .95))) {
        M.yel++;
        if (M.yel >= 2) { M.red = true; M.rt -= 1.5; lines.push({ s: tt('İkinci sarı! Kırmızı kart gördün.'), c: 'b' }); }
        else lines.push({ s: tt('Sarı kart gördün.') });
      }
      if (chance(M.ref ? .08 + refPn(M.ref) * .2 : .18)) { if (chance(.76)) { M.oppG++; lines.push({ s: tt('Hakem penaltıyı gösterdi; rakip affetmedi.'), c: 'b' }); } else lines.push({ s: tt('Penaltı! Ama kaleciniz kurtardı.') }); }
    }
  } else if (k === 'penkurtar') {
    if (out === 'kurtardi') { M.rt += 1; fx({ taraf: 4, fol: Math.round(100 + S.fol * .03) }); lines.push({ s: tt('PENALTIYI KURTARDIN! Stat ayakta.'), c: 'g' }); }
    else { M.oppG++; M.rt -= 0.15; lines.push({ s: tt('Köşeyi buldu. Penaltı gol.'), c: 'b' }); }
  } else if (k === 'kurtaris' || k === 'duvar') {
    if (out === 'kurtardi') { M.rt += k === 'duvar' ? 0.55 : 0.45; lines.push({ s: k === 'duvar' ? tt('Baraj işini yaptı, gerisini sen tamamladın!') : M.mark ? tt`${M.mark} vurdu, harika kurtardın!` : tt('Harika kurtarış!') }); }
    else { M.oppG++; M.rt -= 0.5; lines.push({ s: k === 'duvar' ? tt('Frikik barajı aştı, ağlarda.') : tt('Top ağlarda.'), c: 'b' }); }
  }
  return { lines, chain };
}

export function postMatch(M) {
  const s = S, def = s.pos === 'DF' || s.pos === 'KL', win = M.usG > M.oppG, lose = M.usG < M.oppG, lines = [];
  if (def && M.oppG === 0 && M.role === '11') M.rt += 0.6;
  const htd = M.ht ? htOk(M) : null; if (htd) M.rt += .15;
  M.rt += win ? 0.3 : lose ? -0.2 : 0;
  if (M.role === 'yedek') M.rt = 6 + (M.rt - 6) * 0.8;
  M.rt = clamp(Math.round(M.rt * 10) / 10, 3, 10);
  const rt = M.rt, cr = s.rt[s.clubId];
  if (M.nat) {
    s.car.caps++; s.car.ng += M.pg;
    fx({ rep: 1.5 + M.pg, mo: win ? 6 : 0 });
    lines.push(tt`${s.car.caps}. milli maçın.`);
  } else {
    s.st.apps++; s.st.g += M.pg; s.st.a += M.pa; s.st.rs += rt; if (!M.cup) s.st.lg += M.pg;
    const cs = s.cs[s.clubId] || (s.cs[s.clubId] = { apps: 0, g: 0 }); cs.apps++; cs.g += M.pg;
    if (M.pg && !s.fl['lg_' + s.clubId] && legendRank(s.clubId).pos <= 3) { s.fl['lg_' + s.clubId] = 1; unlock('efsane'); fx({ taraf: 8, rep: 2 }); lines.push(tt`${club(s.clubId).n} tarihinin en golcü üç isminden birisin`); addFeed('c:' + s.clubId, club(s.clubId).n, tt`${s.name} artık kulüp tarihinin en golcü üç isminden biri.`, 'kulup'); }
    if (M.capFire) fx({ takim: win ? 2 : lose ? -3 : 0, mo: lose ? -3 : 0 });
    s.mr.push(rt); gainXp(rt >= 8.5 ? 2 : rt >= 7 ? 1 : 0);
    if (rt >= 7) { questHit('rate'); for (const m of s.mates) m.b = clamp(m.b + .6, 0, 100); }
    if (M.pg + M.pa > 0) questHit('goal');
    if (M.derby) {
      fx({ taraf: win ? 8 : lose ? -8 : 0, mo: win ? 5 : 0 }); if (win) lines.push(tt('Derbi galibiyeti! Taraftar +8'));
      const d = (s.dby || (s.dby = {}))[M.fxt.opp] || (s.dby[M.fxt.opp] = [0, 0, 0, 0]); d[win ? 0 : lose ? 2 : 1]++; d[3] += M.pg;
      if (!s.ach.derbi && Object.values(s.dby).reduce((a, x) => a + x[3], 0) >= 5) { unlock('derbi'); fx({ taraf: 10 }); lines.push(tt('Derbilerde beşinci golün: taraftar seni bağrına bastı')); }
    }
    s.lastM = { w: absWeek(), opp: M.fxt.opp, us: M.usG, og: M.oppG, rt, pg: M.pg, pa: M.pa, derby: M.derby ? 1 : 0 };
    { const R = s.rec || (s.rec = {}); if (M.pg >= 3) R.hat = (R.hat || 0) + 1; if (M.pg > (R.mg || 0)) R.mg = M.pg; if (rt > (R.rt || 0)) R.rt = rt; }
    if (htd != null) { if (htd) lines.push(tt('Devre arası isteği tamam · ') + (fx({ hoca: 2.5 })[0] || tt('Hoca güveni +'))); else { fx({ hoca: -1 }); lines.push(tt('Devre arası isteği olmadı')); } }
    // dört sarı kart cezası profesyonel liglerde geçerli; yerel amatörde uygulanmaz
    s.st.yel = (s.st.yel || 0) + (M.red ? 0 : M.yel);
    if (s.st.yel >= 4 && !(LMAP[leagueOf(s.clubId)].c === 'TR' && tier() >= tierCfg().loc)) { s.st.yel = 0; s.ban = Math.max(s.ban, 1); s.banR = tt('Sarı kart cezası'); lines.push(tt('Dördüncü sarı kart: gelecek hafta cezalısın.')); }
    if (def && M.oppG === 0) s.st.cs++;
    fx({ hoca: (rt - 6.6) * 2.2 * (rt > 6.6 && perk('kaptan') ? 1.3 : 1), takim: (rt - 6.5) * 1 + (win ? 0.6 : 0), taraf: (rt - 6.5) * 1.3 + M.pg * 0.8 });
    const prim = win ? nice(s.con.wage * 0.25) : 0, gb = (s.con.goalB || 0) * M.pg;
    if (prim + gb > 0) { s.money += prim + gb; lines.push(tt`Prim: ${fmt(prim + gb)}`); }
    s.lastR.push(rt); if (s.lastR.length > 5) s.lastR.shift();
    s.bench = 0;
    if (M.red) { s.ban = Math.max(s.ban, 1); s.banR = tt('Kırmızı kart cezası'); lines.push(tt('Gelecek hafta cezalısın.')); }
    if (M.tasks && M.tasks.length) {
      const ts = taskState(M), done = ts.filter(t => t.ok).length, k2 = perk('taktik') ? 2 : 1;
      M.tdone = done;
      if (done === ts.length) { lines.push(tt('Görevler tamam · ') + (fx({ hoca: (2.5 * done + 1.5) * k2 })[0] || tt('Hoca güveni +'))); gainXp(1); }
      else if (done) lines.push(tt`Görev ${done}/${ts.length} · ` + (fx({ hoca: 2.5 * done * k2 })[0] || tt('Hoca güveni +')));
      else lines.push(tt('Görevler yapılmadı · ') + (fx({ hoca: -3 })[0] || tt('Hoca güveni −')));
    }
    if (s.fl.scout) { delete s.fl.scout; if (rt >= 7) s.q.push({ id: 'deneme', at: absWeek() + 1 }); else lines.push(tt('Scout notlarını aldı ama pek etkilenmiş görünmüyordu.')); }
    if (rt >= 8.5 && M.pg >= 2 && (s.cd.viral || 0) <= absWeek() && !s.q.some(q => q.id === 'viral')) s.q.push({ id: 'viral', at: absWeek() + 1 });
  }
  fx({ mo: (win ? 6 : lose ? -5 : 0) + (rt - 6.5) * 3 });
  const tf = Math.exp((cr - 25) * 0.14) * 4 * (1 + eff('fol')) * (perk('sahne') ? 1.5 : 1) * folF();
  const fg = Math.round(Math.max(0, rt - 5.5) * tf + M.pg * tf * 2);
  if (fg > 0) { s.fol += fg; lines.push(tt`Takipçi +${fg.toLocaleString(NLOC)}`); }
  const tired = s.en < 30 ? .06 : s.en < 45 ? .025 : 0;
  const spent = M.stam0 > M.stam ? clamp((M.stam0 - M.stam) / 45, .6, 1.6) : 1;   // maçta harcanan efor
  s.en = clamp(s.en - (M.cup ? 12 : M.role === '11' ? 18 : 9) * spent * (perk('akciger') ? .7 : 1), 0, 100);
  if (M.fxt.press) { if (win && rt >= 7) { fx({ taraf: 6 }); lines.push(tt('Sözünü tuttun. Taraftar +6')); } else { fx({ taraf: -5 }); lines.push(tt('İddialı konuştun, olmadı. Taraftar −5')); } }
  if (chance((0.015 + tired) * (M.role === '11' ? 1 : .5) * (M.risk || 1) * (perk('celik') ? .6 : 1) * (1 - .04 * ((s.up || {}).ekip || 0)) * (s.fl.kronik ? 1.8 : 1) * (s.diff === 'gercek' ? 1.5 : 1))) {
    const r = Math.random();
    if (r < .7) { s.inj = ri(1, 3); lines.push(tt`Maçta sakatlandın: ${s.inj} hafta yoksun.`); }
    else if (r < .92) { s.inj = ri(4, 8); lines.push(tt`Kas yırtığı: ${s.inj} hafta yoksun.`); s.q.push({ id: 'kas', at: absWeek() + 1 }); }
    else { s.inj = 6; s.fl.agir = 1; lines.push(tt('Dizinden ağır sakatlandın. Doktorlar seninle konuşmak istiyor.')); }
  }
  if (!M.nat) {   // basınla aran manşetlere yansır
    if (s.rel.basin < 30 && rt < 6.2) { fx({ taraf: -2 }); addFeed('basin', tt('Saha Kenarı'), tt`${s.name} yine kayıp. Bu forma ona ağır mı geliyor?`, 'manset'); }
    else if (s.rel.basin >= 70 && rt >= 7.5) { fx({ rep: .4 }); addFeed('basin', tt('Saha Kenarı'), tt`Sahanın en iyisi yine ${s.name}. Alkışı hak ediyor.`, 'manset'); }
  }
  feedMatch(M); checkAch(M);
  return { rt, lines, win, lose };
}

// ---------- emeklilik ----------
export function retire() {
  const s = S, t = tot(), avg = t.apps ? t.rs / t.apps : 0;
  // seviye ağırlıklı: oynadığın en güçlü kulüp ve itibar, ham sayılardan daha çok sayılır
  const score = Math.round(Math.max(0, s.peakC - 20) * 10 + s.rep * 6 + s.tro.length * 30 + s.car.caps * 4 + t.g * 1.5 + t.a + t.apps * 0.25 + Math.max(0, avg - 6) * 150);
  const title = score < 450 ? tt('Mahalle Emektarı') : score < 900 ? tt('Lig Emektarı') : score < 1500 ? tt('Sevilen Yıldız') : score < 2200 ? tt('Ulusal Yıldız') : tt('Efsane');
  const m = meta();
  m.leg = Math.max(m.leg || 0, Math.min(6, Math.floor(score / 400)));
  m.n = (m.n || 0) + 1; m.best = Math.max(m.best || 0, score);
  m.heir = s.fl.cocuk ? s.name.split(' ').slice(-1)[0] : null;
  (m.cars || (m.cars = [])).unshift({ n: s.name, sc: score, g: t.g, a: t.a, apps: t.apps, peak: Math.round(s.peak), pos: s.pos, y: s.year, tro: s.tro.length, w: s.w || '' }); m.cars.length = Math.min(m.cars.length, 8);
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
function gainXp(n) { S.px += n; while (S.px >= 8) { S.px -= 8; S.pp++; S.pop.push(tt('Yetenek puanı kazandın')); } }
export function unlock(id) {
  if (S.ach[id]) return; const a = ACH.find(x => x[0] === id); if (!a) return;
  S.ach[id] = seasonLabel(); S.pop.push(tt('Başarım: ') + a[1]); addNews(tt('Başarım açıldı: ') + a[1], 'star');
}
function checkAch(M) {
  const g = tot().g;
  if (g >= 1) unlock('ilkgol'); if (g >= 50) unlock('g50'); if (g >= 100) unlock('g100'); if (g >= 250) unlock('g250');
  if (M && M.pg >= 3) unlock('hat');
  if (S.con.wage >= 8000) unlock('pro'); if (leagueOf(S.clubId) === 'tr1') unlock('sl'); if (S.fl.yurtdisi) unlock('yurt');
  if (S.car.caps >= 1) unlock('milli'); if (S.fol >= 1e6) unlock('m1');
}

// ---------- hedef takım ----------
const SAK = () => Object.keys(CLUBS).find(id => CLUBS[id].n === (KW ? 'Sakarya Kadın FK' : 'Sakaryaspor')) || null;
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
  great: [tt('{me} bu ligde ne arıyor ya.'), tt('Bugün {me} oynadı, biz izledik.'), tt('Bu çocuğu kaçırmayın. Buraya yazıyorum.'), tt('{me} topu her aldığında tribün ayağa kalktı.'), tt('{g} gol, {rt} not. Daha ne olsun.'), tt('Yıllardır böyle bir {pos} görmedik.'), tt('{me} için besteye başlıyoruz.'), tt('Forma satışları patlar bu hafta. #{tag}'), kxAdd(tt('{me} maçtan sonra top toplayıcı çocuğa formasını vermiş. Adam gibi adam.'), tt('{me} maçtan sonra top toplayıcı çocuğa formasını vermiş. Yüreği de büyük.'))],
  bad: [tt('{me} bugün sahada mıydı?'), tt('Hoca bir hafta dinlendirsin: {me}.'), tt('{me} bugün kafası başka yerdeydi sanki.'), tt('Bu performansla ilk 11 zor.'), tt('Top ayağında durmadı bugün.'), tt('Eleştiriyoruz çünkü seviyoruz. Toparla {me}.'), tt('Geçen haftaki oyuncu nerede?')],
  win: [tt('Üç puan cepte. Devam!'), tt('Bu takım bu sene bir şeyler yapar.'), tt('{opp} maçı kolay değildi, helal.'), tt('Yarış kızışıyor. #{tag}'), tt('Pazartesi işe mutlu gidiyoruz.'), tt('Savunma bugün duvar gibiydi.'), tt('Eve keyifle dönüyoruz. #{tag}'), tt('Bu galibiyet moral olur.')],
  loss: [tt('Yine aynı film.'), tt('Bu savunmayla zor.'), tt('{opp} bizi sahadan sildi.'), tt('Hocanın planı neydi, anlamadım.'), tt('Biletime yazık.'), tt('Toparlanırız. Hep toparlandık.'), tt('İkinci yarı sahaya çıkmadık.'), tt('Yönetim uyuyor mu?')],
  draw: [tt('Bir puan da puandır.'), tt('İki puan bıraktık bence.'), tt('Son dakikalarda kalbim durdu.'), tt('Ne kazandık ne kaybettik.'), tt('Beraberlik adil sonuç.')],
  opp: [tt('{me} iyiymiş ama abartmayın.'), tt('Rövanşta görüşürüz {club}.'), tt('Hakem olmasa farklı olurdu.'), tt('{me} bize gelsin, oynatırız.'), tt('{club} şanslıydı bugün.')],
  stat: [tt('{me}: son maçların ortalaması {f5}. Grafik yukarı.'), tt('Sezon karnesi: {sg} gol, {sa} asist. Bir {pos} için ciddi rakamlar.'), tt('{club} ligde {rank}. sırada. Kalan haftalar belirleyici.'), tt('Veri: {me} sahadayken takım daha çok pozisyon buluyor.'), tt('{me} bu sezon {sm} maça çıktı. İstikrar burada başlıyor.')],
  mate: [tt('Kardeşim {me} ile sahada olmak keyif.'), tt('Bu grup çok iyi. Hafta sonu yine sahadayız.'), tt('Antrenman bitti, {me} hâlâ şut çekiyor.'), tt('Soyunma odasında müziği {me} seçti. Bir daha asla.')],
  reply: [kxAdd(tt('Kralsın.'), tt('Kraliçesin.')), tt('Hafta sonu gol bekliyoruz.'), tt('Formanın hakkını veriyorsun.'), tt('Bizi unutma, imza günü yap.'), tt('Fotoğraf güzel de pazar maçı kazanalım.'), tt('Memleket seninle gurur duyuyor.'), tt('Yakışmış.'), tt('Sakatlanma da ne yaparsan yap.')],
  rumor: [tt('{c} cephesi {me} için rapor istedi.'), tt('{c} scoutu tribündeydi. Hedef: {me}.'), tt('Kulis: {c}, {me} için nabız yokluyor.'), tt('{c} yönetimi: "{me} izlediğimiz isimlerden."'), tt('{me} listesi kabarıyor: sıradaki {c}.')],
  rival: [tt('Çalışmaya devam. Konuşanlar konuşsun.'), tt('Hedef büyük, yol uzun.'), tt('Bazıları şansla, bazıları emekle.'), tt('Rakamlar ortada. Kıyas yapan yapsın.'), tt('Bugün de üstüne koyduk.')],
  news: [tt('{w}, {l} karşısında güldü: {s}.'), tt('{w}, {l} engelini geçti: {s}.'), tt('{l} evine eli boş döndü. {w} kazandı: {s}.'), tt('{w} üç puanı {s} ile aldı.')],
  end: [tt('MAÇ SONU | {sc}'), tt('{sc} | Emeği geçen herkese teşekkürler.'), tt('Düdük çaldı: {sc}'), tt('Sahadan ayrılıyoruz: {sc}')],
};
function say(key, c = {}) {
  const pool = TX[key].filter(t => !S.fu.includes(t)), t = pick(pool.length ? pool : TX[key]);
  S.fu.push(t); if (S.fu.length > 34) S.fu.shift();
  return kx(t).replace(/\{(\w+)\}/g, (_, k) => (c[k] != null ? c[k] : ''));
}
function fctx(M) {
  const cl = club(S.clubId), t = table(leagueOf(S.clubId)).map(r => r.id), r5 = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6;
  return { me: S.nick && chance(.3) ? S.nick : S.name, club: cl.n, tag: cl.n.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, ''), pos: POS[S.pos].n.toLocaleLowerCase(LC), sg: S.st.g, sa: S.st.a, sm: S.st.apps, rank: t.indexOf(S.clubId) + 1, f5: r5.toFixed(1).replace('.', DSEP),
    g: M ? M.pg : 0, rt: M ? M.rt.toFixed(1).replace('.', DSEP) : '', opp: M ? (M.nat ? M.fxt.opp.n : club(M.fxt.opp).n) : '' };
}
function feedMatch(M) {
  const c = fctx(M), usN = M.nat ? M.fxt.usN : c.club;
  c.sc = `${usN} ${M.usG}-${M.oppG} ${c.opp}`;
  addFeed(M.nat ? 'fed' : 'c:' + S.clubId, usN, say('end', c), 'kulup');
  if (M.pg >= 2) addFeed('basin', tt('Saha Kenarı'), tt`${S.name} şov yaptı: ${M.pg} gol. Maç notu ${c.rt}.`, 'manset');
  else if (M.rt >= 7.5) addFeed('basin', tt('Saha Kenarı'), pick([tt`Maçın yıldızı ${S.name}. Maç notu ${c.rt}.`, tt`${S.name} yine sahnedeydi: ${c.rt}.`, KW ? tt`Haftanın ismi ${S.name} olabilir. Not ${c.rt}.` : tt`Haftanın adamı ${S.name} olabilir. Not ${c.rt}.`]), 'haber');
  else if (M.rt < 5.8) addFeed('basin', tt('Saha Kenarı'), pick([tt`${S.name} için zor bir gün. Maç notu ${c.rt}.`, tt`${S.name} beklentinin altında kaldı: ${c.rt}.`]), 'haber');
  addFeed('taraftar', pick(FANS), say(M.rt >= 8 ? 'great' : M.rt < 5.8 ? 'bad' : M.usG > M.oppG ? 'win' : M.usG < M.oppG ? 'loss' : 'draw', c));
  if (chance(.5)) addFeed('taraftar', pick(FANS), say(M.usG > M.oppG ? 'win' : M.usG < M.oppG ? 'loss' : 'draw', c));
  if (!M.nat && chance(.3)) addFeed('golge', c.opp.replace(/\s+/g, '').toLocaleLowerCase(LC) + '_fan', say('opp', c));
  if (!M.nat && M.rt >= 7 && chance(.3) && S.sc[S.clubId]) addFeed('takim', pick(S.sc[S.clubId])[0], say('mate', c), 'rakip');
  if (S.st.apps >= 5 && chance(.22)) addFeed('basin', tt('Rakamlarla Futbol'), say('stat', c), 'haber');
  if (M.varAg) addFeed('taraftar', pick(FANS), pick([tt('VAR yine sahne aldı. Tartışılır.'), tt('Çizgiyi kim çekti?'), tt`Bu hakemi bir daha bize vermeyin: ${M.ref ? M.ref.n : ''}.`]));
}
function feedWeek() {
  const lid = leagueOf(S.clubId), lg = S.lg[lid], L = LMAP[lid], src = L.c === 'TR' && L.tier >= tierCfg().loc ? tt('Amatörün Sesi') : tt('Saha Kenarı');
  const r = (lg.last || []).filter(x => x[0] !== S.clubId && x[1] !== S.clubId);
  if (r.length && chance(.55)) {
    const [h, a, hg, ag] = pick(r);
    addFeed('basin', src, hg === ag ? tt`${club(h).n} ile ${club(a).n} yenişemedi: ${hg}-${ag}.` : say('news', { w: club(hg > ag ? h : a).n, l: club(hg > ag ? a : h).n, s: `${Math.max(hg, ag)}-${Math.min(hg, ag)}` }), 'haber');
  }
  if (S.week % 6 === 0) {
    const t = table(lid)[0], sc = scorers(lid)[0];
    addFeed('basin', src, tt`${L.name} zirvesi: ${club(t.id).n}, ${t.pts} puan.` + (sc && sc.g ? (KW ? tt` Gol kraliçeliğinde ${sc.n} önde: ${sc.g} gol.` : tt` Gol krallığında ${sc.n} önde: ${sc.g} gol.`) : ''), 'manset');
  }
  if (S.rival && chance(.07)) addFeed('rakip', S.rival.n, say('rival'), 'rakip');
  if (S.st.apps >= 6 && chance(.12)) addFeed('basin', tt('Rakamlarla Futbol'), say('stat', fctx()), 'haber');
  if (S.week === 19 || S.week === 38) addFeed('basin', tt('Transfer Hattı'), tt('Transfer dönemi açılıyor. Telefonlar şimdiden çalıyor.'), 'manset');
}
export const canPost = p => (!p.need || p.need.some(has)) && (!p.spon || S.spon.length > 0);
export function post(id) {
  const p = POSTS.find(x => x.id === id); S.used++; questHit('post');
  const g = Math.round((30 + S.rep * S.rep * 2) * rnd(.6, 1.4) * (1 + eff('fol')) * p.f * (perk('sahne') ? 1.5 : 1));
  const f = { ...p.fx, fol: g }; if (p.spon) f.para = nice(S.spon.reduce((a, x) => a + x.wk, 0) * .5);
  addFeed('me', S.name, pick(p.t), 'ben');
  if (id === 'luks' && chance(.3)) addFeed('taraftar', pick(FANS), tt('Biz bilet parası biriktirirken...'));
  else { addFeed('taraftar', pick(FANS), say('reply')); if (chance(.4)) addFeed('taraftar', pick(FANS), say('reply')); }
  S.feedNew = 0;
  return fx(f);
}

// ---------- arkadaş aktiviteleri ----------
export function hang(id) {
  const h = HANG.find(x => x.id === id); S.used++; questHit('hang'); if (id === 'gece') S.fl.gecew = absWeek();
  const ch = fx(h.fx); let t = h.r;
  if (h.risk && chance(h.risk)) { S.inj = Math.max(S.inj, ri(1, 2)); ch.push(tt`${S.inj} hafta sakat −`); t = tt('Halı sahada bileğin döndü.'); }
  if (h.hoca && chance(h.hoca)) { ch.push(...fx({ hoca: -8 })); t = tt('Gece uzadı; hoca duymuş.'); }
  return [t, ch];
}

// ---------- maç içi kararlar ----------
export function decText(M, k) {
  if (k === 'pen' && S.pos !== 'KL' && setPieces().pen.me) return tt('Hakem beyaz noktayı gösterdi. Takımın penaltıcısı sensin; top senin elinde.');
  if (k === 'ht') return M.usG > M.oppG ? tt('Öndesiniz. Hoca "bırakmayın" diyor.') : M.usG < M.oppG ? tt('Geridesiniz. Soyunma odası sessiz.') : tt('Beraberlik. İkinci yarıda her şey olabilir.');
  return { pen: tt('Hakem beyaz noktayı gösterdi. Takımın penaltıcısı topu aldı, sana bakıyor.'), ref: tt('Hakem bariz bir faulü vermedi. Tribün ayakta.'), knock: tt('Arka adalende bir çekme hissettin. Sağlık ekibi kenardan bakıyor.') }[k];
}
// Seçimi uygular. add: zaman çizgisine eklenecek yeni olaylar
export function decide(M, k, c, min) {
  const L = [], add = [];
  if (k === 'ht') {
    if (c === 0) {
      if (chance(.3 + (S.trait === 'lider' ? .2 : 0) + (perk('kaptan') ? .1 : 0) + S.rel.takim / 500)) { add.push({ min: ri(50, 88), t: 'bg', us: true }); fx({ takim: 3 }); L.push({ s: tt('Konuşman soyunma odasını ayağa kaldırdı.') }); }
      else { fx({ takim: -1 }); L.push({ s: tt('Sözlerin havada kaldı.') }); }
    } else if (c === 1) { M.focus = 1; M.rt += .15; L.push({ s: tt('Nefesini topladın. Kalan anlar daha sakin akacak.') }); }
    else if (c === 2) { M.risk = Math.max(M.risk || 1, 2); add.push({ min: ri(50, 88), t: 'mom', k: wpick(momW(M.tac, M.scn)) }); L.push({ s: tt('Her topa gireceksin: fazladan pozisyon, fazladan risk.') }); }
    else if (c === 3) {   // hocaya plan sor: istediği an karşına çıkar
      const h = htTalk(M), mk = HTA[h.k].mom;
      if (S.rel.hoca >= 30 || chance(.5)) { M.focus = 1; if (mk) add.push({ min: ri(50, 80), t: 'mom', k: mk, fix: true }); L.push({ s: tt('Hoca tahtaya çizdi: ne istediği artık net.') }); }
      else L.push({ s: tt('Hoca başını çevirdi: "Sahada göster."') });
    } else {   // itiraz: tutarsa sistem sana göre değişir
      const p = clamp(.25 + (S.trait === 'lider' ? .15 : S.trait === 'asi' ? .05 : 0) + (S.rel.hoca - 50) / 150 + (S.fl.kaptan ? .15 : 0), .08, .75);
      if (chance(p)) {
        const fit = Object.keys(TACT).filter(t => TACT[t].fit.includes(S.pos) && t !== M.tac), nt = pick(fit.length ? fit : Object.keys(TACT));
        M.tac = nt; M.drain = TACT[nt].st; for (const e of M.tl) if (e.t === 'mom' && e.min > 45 && !e.fix) { e.k = wpick(momW(nt, M.scn)); delete e.v; }
        fx({ ego: 2 }); M.rt += .1; L.push({ s: tt`Hoca seni dinledi. İkinci yarı: ${TACT[nt].n}.` });
      } else { fx({ hoca: -6 }); if (chance(.25)) { M.off = true; L.push({ s: tt('Hoca kenarı gösterdi: "Otur." Maç senin için bitti.'), c: 'b' }); } else L.push({ s: tt('Hoca sert çıkıştı: "Burada kararı ben veririm."') }); }
    }
  } else if (k === 'pen') {
    if (c === 0) { add.push({ min, t: 'mom', k: 'penalti' }); fx({ ego: 2 }); L.push({ s: tt('Topu aldın. Stat sustu.') }); }
    else { if (S.pos !== 'KL' && setPieces().pen.me) fx({ takim: 2 }); if (chance(.72)) { M.usG++; L.push({ s: tt('GOL! Penaltı ağlarda.'), c: 'g' }); } else L.push({ s: tt('Penaltı kaçtı.') }); }
  } else if (k === 'ref') {
    if (c === 0) {
      fx({ taraf: 3 }); if (M.ref) M.ref.me -= .25;   // hakem bunu unutmaz
      if (chance(.4)) { M.yel++; if (M.yel >= 2) { M.red = true; M.rt -= 1.5; L.push({ s: tt('İkinci sarı! Kırmızı kart.'), c: 'b' }); } else L.push({ s: tt('İtirazdan sarı kart gördün.') }); }
      else L.push({ s: tt('Hakem kararını değiştirmedi ama tribün seni alkışladı.') });
    } else { fx({ hoca: 1 }); if (M.ref) M.ref.me += .08; L.push({ s: tt('Başını sallayıp yerine döndün.') }); }
  } else if (k === 'knock') {
    if (c === 0) { M.risk = 3; M.rt += .3; fx({ hoca: 2 }); L.push({ s: tt('Dişini sıktın. Sakatlık riskin arttı.') }); }
    else { M.off = true; fx({ hoca: -1 }); L.push({ s: tt('Kenara geldin. Bu maçlık bu kadar.') }); }
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
function initRefs() { S.refs = Array.from({ length: 10 }, () => ({ n: rname('TR'), strict: +rnd(.15, .95).toFixed(2), vr: +rnd(.2, .9).toFixed(2), pn: +rnd(.1, .9).toFixed(2), me: 0, b: {} })); S.refi = 0; }
export const curRef = () => S.refs[S.refi];
function refBias(r, id) { if (r.b[id] == null) r.b[id] = +clamp(randn() * .5, -1, 1).toFixed(2); return r.b[id]; }
export function refInfo() {
  const r = curRef(), b = refBias(r, S.clubId) + r.me;
  return { n: r.n, style: r.strict > .65 ? tt('Kartı çabuk çıkarır') : r.strict < .35 ? tt('Oyunu akıtır') : tt('Dengeli düdük'), att: b > .45 ? tt('Size sıcak') : b < -.45 ? tt('Size soğuk') : tt('Tarafsız'), cold: b < -.45, pen: refPn(r) > .66 ? tt('Penaltıyı çabuk verir') : refPn(r) < .3 ? tt('Penaltıya eli gitmez') : '' };
}
function assignRef() {
  const f = fixture() || cupFixture() || euroFixture('cl') || euroFixture('el'); if (!f) return;
  S.refi = ri(0, S.refs.length - 1); const i = refInfo();
  addFeed('fed', tt('Hakem Kurulu'), tt`${club(f.opp).n} maçına ${i.n} atandı. ${i.style}. Takımınıza tutumu: ${i.att.toLocaleLowerCase(LC)}.`, 'haber');
  if (isDerby(S.clubId, f.opp)) addFeed('basin', tt('Saha Kenarı'), tt`DERBİ HAFTASI: ${club(S.clubId).n} - ${club(f.opp).n}. Şehir bu maçı konuşuyor.`, 'manset');
}
// Gol sonrası VAR incelemesi. us: gol bizim mi. null dönerse inceleme yok.
export function varCheck(M, us) {
  if (!M.ref || !chance(.05 + M.ref.vr * .1)) return null;
  return { cancel: chance(clamp(.42 - (us ? M.bias : -M.bias) * .16, .1, .8)), why: pick([tt('ofsayt'), tt('elle oynama'), 'faul']) };
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
  { t: tt('Bodrum tatili'), s: tt('Kafa dinle: moral ve enerji tavan, kondisyon biraz düşer'), i: 'smile' },
  { t: tt('Özel kamp'), s: tt('Ücretli. Hız ve güç artar, yeni sezona zinde başlarsın'), i: 'train' },
  { t: tt('Memleket'), s: tt('Aile ve arkadaşlarla vakit, mahalle maçları'), i: 'home' },
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
    if (b.done && b.lid === leagueOf(S.clubId)) addFeed('basin', tt('Saha Kenarı'), b.k === 'o2' ? tt`Play-out bitti: ${club(b.down[0]).n} küme düştü.` : tt`Play-off bitti: ${b.up.map(x => club(x).n).join(tt(' ve '))} üst ligde.`, 'manset');
  }
  S.en = clamp(S.en + 14, 0, 100);
}

// ---------- derbi ----------
export function isDerby(a, b) {
  if (!a || !b || a === b) return false;
  if (a[0] === 'g' && b[0] === 'g') { const [ta, ia] = a.slice(1).split('_'), [tb, ib] = b.slice(1).split('_'); return ta === tb && (+ia ^ 1) === +ib; }   // amatörde komşu mahalle
  const A = club(a), B = club(b);
  if (!A || !B) return false;
  return DERBY.some(g => g.includes(A.n) && g.includes(B.n)) || (a === S.clubId && genDerby(a) === b) || (b === S.clubId && genDerby(b) === a);
}

// ---------- takım arkadaşları ----------
const MROLE = ['Kaptan', 'Takımın yıldızı', 'Kıdemli', 'Genç yetenek', 'Kaleci'];
function genMates() {
  const sc = S.sc[S.clubId] || [], c = LMAP[leagueOf(S.clubId)].c;
  S.mates = MROLE.map((r, i) => ({ n: i > 0 && i < 3 && sc[i - 1] ? sc[i - 1][0] : rname(c), r, b: ri(18, 40), lk: { skin: ri(0, 3), hair: KW ? pick([4, 7, 8, 9, 10, 11]) : ri(0, 7), hc: ri(0, 2), beard: KW ? 0 : ri(0, 2) } }));
}
// Kulüpten ayrılırken yakın olduğun isimler ağına geçer
function matesToNet() {
  for (const m of S.mates || []) if (m.b >= 60) netAdd('eski', m.n, S.clubId, 45, m.lk);
  if (S.rel.hoca >= 72) netAdd('hoca', rname('TR'), S.clubId, 50);
}
export const chem = () => clamp((S.mates && S.mates.length ? S.mates.reduce((a, m) => a + m.b, 0) / S.mates.length / 100 : .3) + (perk('lider') ? .15 : 0) - ((S.lr || {}).ten || 0) / 500, 0, 1);
export function mateAct(i, k) {
  const m = S.mates[i], A = MACT[k], f = { ...A.fx }, first = m.n.split(' ')[0]; S.used++; questHit('hang');
  m.b = clamp(m.b + A.b, 0, 100);
  if (A.cost) f.para = -nice(Math.max(300, wref() * A.cost));
  if (A.grow) for (const a of Object.keys(POS[S.pos].w).slice(0, 2)) grow(a, .25);
  if (A.vet) { S.vet = (S.vet || 0) + 1; fx({ rep: .3 }); if (S.vet >= 8) unlock('akil'); }
  return [A.r.replace('{n}', first), [...fx(f), tt`${first} ile bağ +${A.b}`]];
}

// ---------- ağ (network) ----------
export function netAdd(k, n, org, b = 30, lk) {
  if (S.net.some(c => c.k === k && c.n === n) || S.net.length >= 14) return;
  S.net.push({ k, n, org: org || null, b, cd: 0, lk: lk || null });
  S.pop.push(tt('Yeni tanıdık: ') + n); addNews(tt`Çevren genişliyor: ${n} (${NET[k].n}).`, 'users');
}
export function netMeet(i) {
  const c = S.net[i]; S.used++; questHit('net');
  c.b = clamp(c.b + 12, 0, 100);
  if (c.k === 'yildiz') grow(Object.keys(POS[S.pos].w)[0], .3);
  return [tt`${c.n} ile görüştün.`, [...fx(c.k === 'golge' ? { prof: -3, mo: 2 } : { mo: c.k === 'yildiz' ? 4 : 2 }), tt('Bağ +12')]];
}
// İyilik iste: bağ en az 50 olmalı, 20 haftada bir
export function netFavor(i) {
  const c = S.net[i], now = absWeek(); if (c.b < 50 || c.cd > now) return null;
  c.cd = now + 20; c.b -= 12; const o = OVR();
  const recommend = id => {
    if (!id || id === S.clubId || !leagueOf(id)) return tt('Şu an yapabileceği bir şey yok.');
    if (S.rt[id] > o + 9) return tt`${club(id).n} için "henüz erken" dedi. Biraz daha gelişmen gerekiyor.`;
    const w = S.watch.find(x => x.id === id); if (w) w.lv = clamp(w.lv + 30, 0, 100); else S.watch.push({ id, lv: 58 });
    addFeed('basin', tt('Transfer Hattı'), tt`${club(id).n}, ${S.name} için devrede. Referansı güçlü.`, 'manset');
    return tt`${c.n} seni ${club(id).n} yönetimine önerdi. Kulüp dosyanı açtı.`;
  };
  switch (c.k) {
    case 'yildiz': case 'eski': case 'hoca': return [recommend(c.org), []];
    case 'scout': { const pool = []; for (const lid in S.lg) for (const id of S.lg[lid].t) if (id !== S.clubId && S.rt[id] > S.rt[S.clubId] + 1 && S.rt[id] <= o + 6 && (LMAP[lid].c === 'TR' || S.rep >= 40)) pool.push(id); return [recommend(pool.length ? pick(pool) : null), []]; }
    case 'abi': {
      if (LMAP[leagueOf(S.clubId)].c === 'TR' && tier() >= tierCfg().amat) { S.q.push({ id: 'deneme', at: now }); return [tt('"Bir telefon açtım. Bu hafta seni denemeye çağıracaklar."'), []]; }
      const wk = nice(1500 + S.fol * .05); S.spon.push({ n: tt('Yerel iş insanı'), wk, until: now + 38 }); return [tt`Tanıdığı bir iş insanı sana sponsor oldu: haftada ${fmt(wk)}.`, []];
    }
    case 'gazeteci': S.fl.kalkan = now + 20; S.rel.basin = clamp(S.rel.basin + 15, 0, 100); return [tt('Hakkında övgü dolu bir yazı çıktı. Bir süre kötü haberin de çıkmaz.'), fx({ rep: 2, taraf: 4, fol: Math.round(200 + S.fol * .05) })];
    case 'doktor': if (S.inj > 0) { S.inj = Math.max(0, S.inj - 2); return [tt('Özel programla dönüşün iki hafta öne çekildi.'), []]; } return [tt('Kontrolden geçtin, takviye programı aldın.'), fx({ en: 25 })];
    case 'marka': { const wk = nice(Math.max(2000, S.fol * .2)); S.spon.push({ n: tt('Marka anlaşması'), wk, until: now + 38 }); return [tt`Masaya oturdunuz: haftada ${fmt(wk)}.`, []]; }
    case 'golge': if (chance(.4)) S.q.push({ id: 'bahis_sonuc', at: now + ri(6, 14) }); return [tt('"Küçük bir iş" dedi. Zarf cebinde. Soru sormadın.'), fx({ para: nice(wref() * 6), prof: -10, sad: -4 })];
  }
  return ['', []];
}

// ---------- haftalık görev ----------
const QUESTS = [['train', tt('İki antrenman yap'), 2], ['rate', tt('Maçta 7,0 ve üstü not al'), 1], ['post', tt('Sosyal medyada paylaşım yap'), 1], ['hang', tt('Bir arkadaşınla vakit geçir'), 1], ['goal', tt('Gol at ya da asist yap'), 1], ['net', tt('Çevrenden biriyle görüş'), 1]];
function newQuest() { const q = pick(QUESTS.filter(x => x[0] !== (S.quest && S.quest.k) && (x[0] !== 'net' || S.net.length))); S.quest = { k: q[0], t: q[1], n: q[2], p: 0 }; }
function questHit(k) {
  const q = S.quest; if (!q || q.k !== k || q.p >= q.n) return;
  if (++q.p >= q.n) { const b = nice(Math.max(500, S.con.wage * .2)); S.money += b; gainXp(2); S.pop.push(tt`Görev tamam: ${fmt(b)} ve yetenek deneyimi`); }
}

// ---------- rehabilitasyon ----------
export function rehab(ok) {
  S.used++; S.fl.rehabw = 1;
  if (ok) { S.inj = Math.max(0, S.inj - 1); return [tt('Rehabilitasyon iyi gitti: dönüş bir hafta öne geldi.'), []]; }
  return [tt('Zorladın, ağrı arttı. Bugünlük bu kadar.'), fx({ en: -6 })];
}

// ---------- Avrupa kupaları ----------
// Kontenjanlar UEFA ülke sıralamasına göre: [doğrudan Şampiyonlar Ligi, ŞL eleme turu, Avrupa Ligi]
const EUQ_E = { en1: [4, 0, 2, 1], es1: [4, 0, 2, 1], it1: [4, 0, 2, 1], de1: [4, 0, 2, 1], fr1: [3, 1, 2, 1], nl1: [2, 1, 2, 1], pt1: [1, 1, 2, 1], tr1: [1, 1, 2, 1] };   // son sütun: Konferans Ligi
// Kadınlar (UEFA 2026/27 erişim listesi): 1-2. ülkelerin ilk ikisi ve 3-6. ülkelerin şampiyonu doğrudan lig aşamasında, diğerleri elemede.
// Konferans Ligi yok; ikinci kupa Kadınlar Avrupa Kupası (Hollanda üçüncüsü ve Türkiye ikincisi doğrudan, eleme kaybedenleri de oraya geçer).
const EUQ_K = { en1: [2, 1, 0, 0], fr1: [2, 1, 0, 0], es1: [1, 2, 0, 0], de1: [1, 2, 0, 0], it1: [1, 2, 0, 0], pt1: [1, 2, 0, 0], nl1: [0, 2, 1, 0], tr1: [0, 1, 1, 0] };
export let EUQ = EUQ_E;
const EUK_E = ['cl', 'el', 'ko'], EUK_K = ['cl', 'el'];
export let EUK = EUK_E;
const EUN_E = { cl: 'Şampiyonlar Ligi', el: 'Avrupa Ligi', ko: 'Konferans Ligi' }, EUN_K = { cl: 'Kadınlar Şampiyonlar Ligi', el: 'Kadınlar Avrupa Kupası' };
export let EUN = EUN_E;
const EUWK = [6, 8, 18, 20, 24, 26, 30, 32];   // Kadınlar Avrupa Kupası: son 16'dan finale dört tur, hepsi çift maçlı
const EUW = [3, 6, 8, 11, 13, 15, 18, 20, 24, 26, 30, 32, 36], EUMD = 6;   // lig aşaması, sonra çift maçlı turlar ve tek maç final
// S.eps: geçen sezon Avrupa'da en iyi iki ülke, fazladan bir Şampiyonlar Ligi bileti alır
export function euroSpots(lid) { const q = EUQ[lid]; if (!q) return null; return { cl: q[0] + (!KW && (S.eps || []).includes(lid) ? 1 : 0), clq: q[1], el: q[2], ko: q[3] }; }
export function euroZone(lid, i) { const q = euroSpots(lid); if (!q) return ''; return i < q.cl ? 'cl' : i < q.cl + q.clq ? 'clq' : i < q.cl + q.clq + q.el ? 'el' : i < q.cl + q.clq + q.el + q.ko ? 'ko' : ''; }
export const euroOf = id => EUK.find(k => S[k] && S[k].teams.includes(id)) || null;
// Kulübün bu haftaki / sıradaki Avrupa maçı (hangi kupadaysa)
export const euFix = () => { for (const k of EUK) { const f = euroFixture(k); if (f) return f; } return null; };
export const sideFixture = () => cupFixture() || euFix() || xcFixture();

// Önceki sezonun sıralamasına (ilk sezonda güce) göre Avrupa'ya gidenler. Kupa şampiyonu Avrupa Ligi'ne gider.
function euroQual(sorted) {
  const cl = [], q = [], el = [], ko = [], qc = [], cw = S.cup && S.cup.champ && S.cup.top ? S.cup.champ : null;
  for (const l in EUQ) {
    const t = sorted ? sorted[l] : [...S.lg[l].t].sort((a, b) => S.rt[b] - S.rt[a]), sp = euroSpots(l), i = sp.cl + sp.clq, mine = [];
    cl.push(...t.slice(0, sp.cl)); q.push(...t.slice(sp.cl, i)); if (!sp.cl && sp.clq) qc.push(t[0]);   // qc: elemeye giren lig şampiyonları
    if (cw && S.cup.top === l && !t.slice(0, i).includes(cw)) mine.push(cw);
    for (const id of t.slice(i)) { if (mine.length >= sp.el) break; if (!mine.includes(id)) mine.push(id); }
    el.push(...mine);
    ko.push(...t.slice(i).filter(id => !mine.includes(id)).slice(0, sp.ko));
  }
  return { cl, q, el, ko, qc };
}
// Kadınlar: Şampiyonlar Ligi 18 takımlı lig aşaması (8 doğrudan + elemeden 10), Avrupa Kupası 16 takımlı çift maçlı eleme.
// Eleme iki yoldan: şampiyonlar yolu (4 bilet) ve lig yolu (6 bilet). Kaybedenler Avrupa Kupası'na geçer.
function initEuroK(q) {
  const key = {}; XIDS.forEach(id => { key[id] = S.rt[id] + rnd(0, 6); });
  const xs = [...XIDS].sort((a, b) => key[b] - key[a]), cl = [...q.cl], el = [...q.el], pre = [];
  const tie = (a, b) => {
    const [g1, g2] = simScore(S.rt[a], S.rt[b]), [g3, g4] = simScore(S.rt[b], S.rt[a]), A = g1 + g4, B = g2 + g3, w = A > B || (A === B && chance(.5)) ? a : b;
    cl.push(w); el.push(w === a ? b : a); pre.push([a, b, A, B, w]);
  };
  const qc = q.qc || [], lp = shuffle(q.q.filter(id => !qc.includes(id)));
  for (const id of qc) tie(id, xs.splice(ri(3, 10), 1)[0]);
  for (let i = qc.length; i < 4; i++) tie(xs.shift(), xs.splice(ri(2, 8), 1)[0]);
  if (lp.length % 2) lp.push(xs.shift());
  for (let i = 0; i < lp.length; i += 2) tie(lp[i], lp[i + 1]);
  while (cl.length < 18 && xs.length) cl.push(xs.shift());
  while (el.length < 16 && xs.length) el.push(xs.shift());
  if (el.length > 16) el.length = 16;
  const top = [...el].sort((a, b) => S.rt[b] - S.rt[a]), alive = [];
  for (let i = 0; i < 8; i++) alive.push(top[i], top[15 - i]);
  S.cl = { key: 'cl', name: EUN.cl, weeks: EUW, teams: shuffle(cl), tb: {}, r: 0, alive: [], hist: [{ n: 'Eleme turu', res: pre, q: 1 }], champ: null, leg1: null, fmt: 'k' };
  S.el = { key: 'el', name: EUN.el, weeks: EUWK, teams: el, tb: {}, r: 0, alive, hist: [], champ: null, leg1: null, md: 0, f2: 1 };
  delete S.ko;
  if (!S.clubId) return;
  const m = pre.find(x => x[0] === S.clubId || x[1] === S.clubId);
  if (m) { const a = m[0] === S.clubId, opp = club(a ? m[1] : m[0]).n, us = a ? m[2] : m[3], th = a ? m[3] : m[2]; addNews(m[4] === S.clubId ? tt`${EUN.cl} elemesinde ${opp} geçildi: ${us}-${th}.` : tt`${EUN.cl} elemesinde ${opp} turladı (${th}-${us}). Yola ${EUN.el} ile devam.`, 'trophy'); }
  const k = euroOf(S.clubId); if (k) { addNews(tt`Bu sezon ${EUN[k]} sahnesindesiniz.`, 'trophy'); S.pop.push(tt`${EUN[k]} bileti`); }
}
function initEuro(q) {
  if (KW) return initEuroK(q);
  const key = {}; XIDS.forEach(id => { key[id] = S.rt[id] + rnd(0, 6); });
  const xs = [...XIDS].sort((a, b) => key[b] - key[a]), cl = [...q.cl], el = [...q.el], ko = [...(q.ko || [])], pre = [];
  for (const id of q.q) {   // eleme turu: iki maç toplamı, kaybeden Avrupa Ligi'ne
    const x = xs.splice(ri(3, 10), 1)[0], [a, b] = simScore(S.rt[id], S.rt[x]), [c, d] = simScore(S.rt[x], S.rt[id]);
    const us = a + d, th = b + c, w = us > th || (us === th && chance(.5)) ? id : x;
    cl.push(w); el.push(w === id ? x : id); pre.push([id, x, us, th, w]);
  }
  while (cl.length < 32 && xs.length) cl.push(xs.shift());
  while (el.length < 32 && xs.length) el.push(xs.shift());
  while (ko.length < 32 && xs.length) ko.push(xs.shift());
  const mk = (k, teams, pr) => ({ key: k, name: EUN[k], weeks: EUW, teams: shuffle(teams), tb: {}, r: 0, alive: [], hist: pr && pr.length ? [{ n: 'Eleme turu', res: pr, q: 1 }] : [], champ: null, leg1: null });
  S.cl = mk('cl', cl, pre); S.el = mk('el', el); S.ko = mk('ko', ko);
  if (!S.clubId) return;
  const m = pre.find(x => x[0] === S.clubId);
  if (m) addNews(m[4] === S.clubId ? tt`Şampiyonlar Ligi elemesinde ${club(m[1]).n} geçildi: ${m[2]}-${m[3]}.` : tt`Şampiyonlar Ligi elemesinde ${club(m[1]).n} turladı (${m[2]}-${m[3]}). Yola Avrupa Ligi'nde devam.`, 'trophy');
  const k = euroOf(S.clubId); if (k) { addNews(tt`Bu sezon ${EUN[k]} sahnesindesiniz.`, 'trophy'); S.pop.push(tt`${EUN[k]} bileti`); }
}
export function euroTable(k) {
  const c = S[k];
  return c.teams.map(id => { const r = c.tb[id] || [0, 0, 0, 0, 0, 0]; return { id, p: r[0], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[1] * 3 + r[2], gd: r[4] - r[5] }; })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || S.rt[b.id] - S.rt[a.id]);
}
// Eleme turları çift maçlı: 1 ilk maç, 2 rövanş, 0 final (tek maç). c.md: lig aşaması maç sayısı (yoksa 6), c.f2: final de çift maçlı
const euMd = c => c.md ?? EUMD;
const koLeg = c => (c.alive.length === 2 && !c.f2 ? 0 : ((c.r - euMd(c)) % 2) + 1);
// c.bye: lig aşamasını ilk dörtte bitirip play-off turunu beklemeden çeyrek finale çıkanlar (kadınlar)
const euRn = c => (c.bye ? 'Play-off' : cupRoundName(c.alive.length));
export function euroNext(k) {
  const c = S[k]; if (!c || c.champ || !S.clubId || !c.teams.includes(S.clubId)) return null;
  if (c.r < euMd(c)) { const p = roundPairs(c.teams, c.r).find(x => x.includes(S.clubId)); return { week: c.weeks[c.r], round: `Lig aşaması ${c.r + 1}/${EUMD}`, opp: p[0] === S.clubId ? p[1] : p[0], home: p[0] === S.clubId, lg: true }; }
  const i = c.alive.indexOf(S.clubId); if (i < 0) return null;
  const leg = koLeg(c), nm = euRn(c); let agg = null;
  if (leg === 2) { const f = c.leg1[i >> 1]; agg = f[0] === S.clubId ? [f[2], f[3]] : [f[3], f[2]]; }
  // lig aşamasını üstte bitiren rövanşı evinde oynar
  return { week: c.weeks[c.r], round: nm + (leg === 1 ? ' · ilk maç' : leg === 2 ? ' · rövanş' : ''), opp: c.alive[i ^ 1], home: leg === 0 || (leg === 1 ? i % 2 === 1 : i % 2 === 0), final: leg === 0, leg, agg };
}
export function euroFixture(k) { const n = euroNext(k); return n && S.week === n.week ? { cup: true, key: k, eu: k, name: S[k].name, ...n } : null; }
function euroRound(own, k) {
  const c = S[k]; if (!c || c.champ || S.week !== c.weeks[c.r]) return;
  const res = [], mine = (h, a) => own && (h === S.clubId || a === S.clubId);
  if (c.r < euMd(c)) {
    for (const [h, a] of roundPairs(c.teams, c.r)) {
      let hg, ag;
      if (mine(h, a)) { hg = h === S.clubId ? own.us : own.opp; ag = h === S.clubId ? own.opp : own.us; } else [hg, ag] = simScore(S.rt[h], S.rt[a]);
      const row = id => c.tb[id] || (c.tb[id] = [0, 0, 0, 0, 0, 0]), H = row(h), A = row(a);
      H[0]++; A[0]++; H[4] += hg; H[5] += ag; A[4] += ag; A[5] += hg;
      if (hg > ag) { H[1]++; A[3]++; } else if (hg < ag) { A[1]++; H[3]++; } else { H[2]++; A[2]++; }
      res.push([h, a, hg, ag, null]);
    }
    c.hist.push({ n: `Lig aşaması · ${c.r + 1}. maç`, res, lg: 1 }); c.r++;
    if (c.r === EUMD && c.fmt === 'k') {   // kadınlar: ilk 4 doğrudan çeyrek finalde, 5-12 play-off oynar (5.-12., 6.-11. ...)
      const top = euroTable(k).map(r => r.id); c.bye = top.slice(0, 4); c.alive = [];
      for (let i = 0; i < 4; i++) c.alive.push(top[4 + i], top[11 - i]);
      if (c.teams.includes(S.clubId)) {
        const pos = top.indexOf(S.clubId) + 1;
        addNews(pos <= 4 ? tt`${c.name}: lig aşamasını ${pos}. bitirdiniz, doğrudan çeyrek finaldesiniz.` : pos <= 12 ? tt`${c.name}: lig aşamasını ${pos}. bitirdiniz, play-off turundasınız.` : tt`${c.name}: lig aşamasında ${pos}. oldunuz ve elendiniz.`, 'trophy');
        if (pos <= 12) fx({ rep: 2, taraf: 4 });
      }
    } else if (c.r === EUMD) {   // ilk 16 eleme turlarına kalır: 1.-16., 2.-15. ...
      const top = euroTable(k).map(r => r.id).slice(0, 16); c.alive = [];
      for (let i = 0; i < 8; i++) c.alive.push(top[i], top[15 - i]);
      if (c.teams.includes(S.clubId)) {
        const pos = euroTable(k).findIndex(r => r.id === S.clubId) + 1;
        addNews(pos <= 16 ? tt`${c.name}: lig aşamasını ${pos}. bitirdiniz, son 16'dasınız.` : tt`${c.name}: lig aşamasında ${pos}. oldunuz ve elendiniz.`, 'trophy');
        if (pos <= 16) fx({ rep: k === 'cl' ? 2 : 1, taraf: 4 });
      }
    }
    return;
  }
  const leg = koLeg(c), nm = euRn(c), sc = (h, a) => { if (mine(h, a)) return h === S.clubId ? [own.us, own.opp] : [own.opp, own.us]; return simScore(S.rt[h], S.rt[a]); };
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
  if (c.bye) { const b = c.bye; c.alive = [b[0], next[3], b[1], next[2], b[2], next[1], b[3], next[0]]; c.bye = null; }   // çeyrek final: 1. en alttan gelenle
  const me = res.find(x => x[0] === S.clubId || x[1] === S.clubId);
  if (next.length === 1) {
    c.champ = next[0];
    if (c.champ === S.clubId) {
      S.tro.push(seasonLabel() + ' · ' + c.name + (S.mgr ? (S.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : ''));
      const b = nice(S.con.wage * { cl: 24, el: 14, ko: 8 }[k]); S.money += b; fx({ mo: 18, taraf: 12, rep: { cl: 7, el: 4, ko: 2 }[k] });
      if (k !== 'ko') unlock(k === 'cl' ? 'avrupa' : 'al');
      addNews(tt`${c.name} şampiyonusunuz! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(tt`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
    addFeed('basin', tt('Saha Kenarı'), tt`${c.name} şampiyonu: ${club(c.champ).n}!`, 'manset');
  } else if (me) addNews(me[4] === S.clubId ? tt`${c.name}: toplamda ${Math.max(me[5], me[6])}-${Math.min(me[5], me[6])} ile tur atladınız.` : tt`${c.name}: toplamda elendiniz.`, 'trophy');
}
// Ülke katsayısı: Avrupa'daki ortalama başarı. En iyi iki lig gelecek sezon fazladan ŞL bileti alır.
function euroCoef() {
  const pts = {}, cnt = {};
  for (const k of EUK) {
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
  if (!co[id]) { const lid = leagueOf(id); co[id] = { n: cname(lid ? LMAP[lid].c : pick(['EN', 'DE', 'NL'])), st: pick(Object.keys(TACT)) }; }
  return co[id];
}
// Taktiğe uyum (10-99): mevkin ve hocanın aradığı özellik
export function tacFit(id = S.clubId) {
  if (!id) return 50;
  const T = TACT[coach(id).st], o = OVR(); let f = 50;
  if (T.fit.includes(S.pos)) f += 14; else if (T.bad.includes(S.pos)) f -= 10;
  f += clamp((S.at[T.key] - o) * 1.6, -18, 22);
  if (id === S.clubId) { const R = curRole(); if (R && (R.tac || []).includes(coach(id).st)) f += 6; if (S.camp && S.camp.k === 'tak' && S.camp.s === S.season) f += 8; if (S.fl.pc) f += 8; }
  if (perk('taktik')) f = Math.max(f, 72);
  return Math.round(clamp(f, 10, 99));
}
function newCoach(why) {
  const old = coach(), st = pick(Object.keys(TACT).filter(k => k !== old.st));
  S.co[S.clubId] = { n: cname(LMAP[leagueOf(S.clubId)].c), st };
  S.rel.hoca = clamp(S.rel.hoca * .45 + 24, 0, 100);
  const c = S.co[S.clubId];
  addNews(tt`${old.n} ${why}. Yeni hoca ${c.n}: ${TACT[st].n.toLocaleLowerCase(LC)}.`, 'whistle');
  addFeed('c:' + S.clubId, club(S.clubId).n, tt`Teknik direktörlük görevine ${c.n} getirildi.`, 'kulup'); S.pop.push(tt('Yeni hoca: ') + c.n);
  return c;
}
function coachCheck() {   // devre arası: kötü gidişte hoca gider
  if (S.mgr) return;
  const t = table(leagueOf(S.clubId)).map(r => r.id), pos = t.indexOf(S.clubId) + 1;
  if (pos > t.length - 3 && chance(.5)) newCoach(tt('görevden alındı'));
}
function coachTurn(pos, n, lines) {
  for (const id in S.co) if (id !== S.clubId && chance(.3)) delete S.co[id];
  if (!S.mgr && ((pos > n * .7 && chance(.6)) || chance(.1))) { const c = newCoach(pos > n * .7 ? tt('ile yollar ayrıldı') : tt('başka bir kulübe gitti')); lines.push(tt`Yeni hoca: ${c.n} (${TACT[c.st].n})`); }
}
// Maç anı ağırlıkları: mevki tabanı, hocanın taktiğiyle şekillenir
export function momW(tac, scn) {
  const m = { ...POS[S.pos].m };
  for (const X of [TACT[tac], SCN[scn], curRole()]) {
    if (!X) continue;
    for (const k in X.w || X.m || {}) if (m[k]) m[k] *= (X.w || X.m)[k];
    if (S.pos !== 'KL') for (const k in X.add || {}) if (!m[k]) m[k] = X.add[k];
  }
  if (S.clubId && S.pos !== 'KL') { const sp = setPieces(); if (m.penalti) m.penalti *= sp.pen.me ? 1.8 : .35; if (m.frikik) m.frikik *= sp.fk.me ? 1.7 : .3; if (m.korner) m.korner *= sp.cor.me ? 1.6 : .4; }
  return m;
}
export const momPick = M => wpick(momW(M && M.tac, M && M.scn));
// Maç içinde hoca sistemi değiştirir: kalan anlar yeni taktiğe göre şekillenir
export function tacShift(M, min) {
  const d = M.usG - M.oppG, nt = pick(d < 0 ? ['hucum', 'kanat'] : d > 0 ? ['otobus', 'kontra'] : ['pres', 'top', 'kanat']), add = [], cn = coach().n;
  if (nt === M.tac) return { line: tt`${cn} kenardan bağırıyor: "Aynen devam!"`, add };
  M.tac = nt; M.drain = TACT[nt].st;
  for (const e of M.tl) if (e.t === 'mom' && e.min > min && !e.fix) { e.k = wpick(momW(nt, M.scn)); delete e.v; }
  if (nt === 'hucum' || nt === 'kanat') {
    if (chance(.5)) add.push({ min: ri(min + 1, 90), t: 'bg', us: chance(.6) });
    if (S.pos !== 'KL' && chance(.5)) add.push({ min: ri(min + 1, 89), t: 'mom', k: wpick(momW(nt, M.scn)) });
  } else if (nt === 'otobus') { const i = M.tl.findIndex(e => e.t === 'bg' && !e.us && e.min > min); if (i >= 0 && chance(.5)) M.tl.splice(i, 1); }
  return { line: tt`${cn} sistemi değiştirdi: ${TACT[nt].n}. ${TACT[nt].d}`, add };
}

// Hocanın maç görevleri. need: görev için maçta karşına çıkması gereken anlar
const ALLP = ['KL', 'DF', 'OS', 'KN', 'FV'];
export const TASKS = {
  gol: { t: tt('Gol at'), pos: ['FV', 'KN'], need: ['sut'], ex: ['katki', 'isabet'], ok: M => M.pg >= 1 },
  katki: { t: tt('Gole katkı yap'), pos: ['FV', 'KN', 'OS'], ex: ['gol'], ok: M => M.pg + M.pa >= 1 },
  isabet: { t: tt('Kaleyi yokla: isabetli şut'), pos: ['FV', 'KN', 'OS'], tac: ['hucum'], need: ['sut'], ex: ['gol'], ok: M => M.cnt.on >= 1 },
  pas2: { t: tt('2 isabetli pas ya da orta'), pos: ['OS', 'DF', 'KN', 'KL'], tac: ['top'], need: ['pas', 'pas'], ok: M => M.cnt.pas >= 2, pr: M => Math.min(2, M.cnt.pas) + '/2' },
  orta1: { t: tt('İsabetli bir orta aç'), pos: ['KN', 'DF', 'OS', 'FV'], tac: ['kanat'], need: ['orta'], ok: M => M.cnt.orta >= 1 },
  calim1: { t: kxAdd(tt('Adamını çalımla geç'), tt('Rakibini çalımla geç')), pos: ['KN', 'FV', 'OS'], tac: ['kontra', 'hucum'], need: ['calim'], ok: M => M.cnt.calim >= 1 },
  sav2: { t: tt('2 başarılı müdahale'), pos: ['DF', 'OS'], tac: ['pres', 'otobus'], need: ['savunma', 'savunma'], ex: ['sav1'], ok: M => M.cnt.sav >= 2, pr: M => Math.min(2, M.cnt.sav) + '/2' },
  sav1: { t: tt('Geriye yardım et: bir top kap'), pos: ['KN', 'FV'], tac: ['pres', 'otobus'], need: ['savunma'], ex: ['sav2'], ok: M => M.cnt.sav >= 1 },
  temiz: { t: tt('Kart görme'), pos: ['DF', 'OS'], ok: M => !M.red && M.yel === 0 },
  kale: { t: tt('Kaleni gole kapat'), pos: ['DF', 'KL'], tac: ['otobus'], ok: M => M.oppG === 0 },
  kurt2: { t: tt('2 kurtarış yap'), pos: ['KL'], need: ['kurtaris', 'kurtaris'], ok: M => M.cnt.kurt >= 2, pr: M => Math.min(2, M.cnt.kurt) + '/2' },
  kayip: { t: tt('En fazla 1 top kaybı'), pos: ['OS', 'KN', 'FV', 'DF'], tac: ['top'], ok: M => M.cnt.bad <= 1 },
  not7: { t: tt('Maç notun 7,0 olsun'), pos: ALLP, ok: M => M.rt >= 7 },
};
function pickTasks(tac, rl) {
  if (rl !== '11' && rl !== 'yedek') return [];
  const w = {}, out = [];
  for (const id in TASKS) { const T = TASKS[id]; if (!T.pos.includes(S.pos) || (rl === 'yedek' && (T.need || []).length > 1)) continue; w[id] = T.tac ? (T.tac.includes(tac) ? 3 : .5) : 1; }
  for (let i = 0; i < (rl === '11' ? 2 : 1) && Object.keys(w).length; i++) { const id = wpick(w); out.push(id); delete w[id]; (TASKS[id].ex || []).forEach(e => delete w[e]); }
  return out;
}
export const taskState = M => (M.tasks || []).map(id => ({ id, t: kx(TASKS[id].t), ok: !!TASKS[id].ok(M), pr: TASKS[id].pr ? TASKS[id].pr(M) : '' }));

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
    id, n: c.n, c1: c.c1, c2: c.c2, lid, lname: L ? L.name : tt('Avrupa'), country: L ? L.c : null, land: c.x || null, tier: L ? L.tier : 0, lavg: lid ? lavg(lid) : r,
    r, pos, size: tb.length, row: tb[pos - 1] || null, form: lid ? ((S.lg[lid].fm || {})[id] || '') : '',
    fac: facOf(id), cap: Math.max(KW ? 100 : 150, Math.round(Math.pow(Math.max(r - 18, 3), 2.6) * (.8 + (h % 40) / 100) * (KW ? .12 : 1) / 50) * 50),   // kadın maçlarında tribünler daha küçük fans: clamp(Math.round((r - 20) / 14 + (h % 3)), 1, 5),
    coach: co.n, tac: co.st, fit: tacFit(id), eu, squad: squad(id).map((n, i) => [SQP[i], n]), crisis: crisisOf(id), euOut: !!ec && ec.r >= euMd(ec) && !ec.champ && !ec.alive.includes(id) && !(ec.bye || []).includes(id), euChamp: !!ec && ec.champ === id,
    sc: S.sc[id] || [], hon: (S.hon || {})[id] || 0, watch: S.watch.find(w => w.id === id) || null, dream: S.dream === id, mine: S.clubId === id,
    rivals: grp ? grp.filter(n => n !== c.n) : [], contact: S.net.find(x => x.org === id) || null,
  };
}
// Yeni kulübe alışma süresi (hafta): yeni ülke, dil ve tanıdıklar belirler
export function adaptWeeks(id) {
  const L = LMAP[leagueOf(id)], cur = LMAP[leagueOf(S.clubId)]; let w = 3;
  if (L.c !== cur.c) w += 3;
  if (L.c !== 'TR' && S.dil < 40 && !(S.fl.gurbet && L.c === (S.gur || 'DE'))) w += 3;
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
  const eut = x => (x ? EUN[x] : tt('Yok')), euv = x => (x === 'cl' ? 3 : x === 'el' ? 2 : x ? 1 : 0);
  const rows = [
    { l: tt('Lig gücü'), i: 'trophy', a: Math.round(A.lavg), b: Math.round(B.lavg), d: sg(B.lavg - A.lavg, 1), sa: A.lname, sb: B.lname },
    { l: tt('Kulüp gücü'), i: 'shield', a: Math.round(A.r), b: Math.round(B.r), d: sg(B.r - A.r, 1) },
    { l: tt('Lig sırası'), i: 'chart', a: A.pos + '.', b: B.pos + '.', d: sg(A.pos / A.size - B.pos / B.size, .08) },
    { l: tt('Forma şansı'), i: 'shirt', a: '%' + MINS[cr], b: '%' + MINS[of.role], d: sg(MINS[of.role] - MINS[cr]), sa: ROLE[cr], sb: ROLE[of.role] },
    { l: tt('Haftalık ücret'), i: 'coin', a: S.con.wage ? fmtS(S.con.wage) : tt('Amatör'), b: of.wage ? fmtS(of.wage) : tt('Amatör'), d: sg(of.wage - S.con.wage) },
    { l: tt('Tesisler'), i: 'train', a: A.fac, b: B.fac, d: sg(B.fac - A.fac), star: 1 },
    { l: tt('Taktik uyumu'), i: 'whistle', a: '%' + A.fit, b: '%' + B.fit, d: sg(B.fit - A.fit, 5), sa: TACT[A.tac].n, sb: TACT[B.tac].n },
    { l: tt('Gelişim hızı'), i: 'up', a: da, b: db, d: sg(db - da, 3), bar: 1 },
    { l: tt('Avrupa'), i: 'globe', a: eut(A.eu), b: eut(B.eu), d: sg(euv(B.eu) - euv(A.eu)) },
  ];
  const pros = [], cons = [];
  if (B.lavg - A.lavg > 3) pros.push(tt('Daha güçlü lig: itibarın ve piyasa değerin hızlı artar')); else if (A.lavg - B.lavg > 3) cons.push(tt('Daha zayıf lig: itibarın zamanla düşer'));
  if (MINS[of.role] > MINS[cr]) pros.push(tt`${ROLE[of.role]}: daha çok süre, maçta daha çok gelişim`); else if (MINS[of.role] < MINS[cr]) cons.push(tt`${ROLE[of.role]}: süren azalır, maç tecrüben yavaşlar`);
  if (B.fac > A.fac) pros.push(tt`Tesisler daha iyi: antrenman verimi +%${Math.round((facF(B.fac) / facF(A.fac) - 1) * 100)}`); else if (B.fac < A.fac) cons.push(tt`Tesisler daha zayıf: antrenman verimi −%${Math.round((1 - facF(B.fac) / facF(A.fac)) * 100)}`);
  if (B.fit - A.fit >= 8) pros.push(tt`${B.coach} ${TACT[B.tac].n.toLocaleLowerCase(LC)} oynatıyor: sana uyuyor`); else if (A.fit - B.fit >= 8) cons.push(tt`${B.coach} ${TACT[B.tac].n.toLocaleLowerCase(LC)} oynatıyor: sana uymuyor`);
  if (B.crisis) cons.push(tt`Kulüp sıkıntıda: ${CRN[B.crisis.k].toLocaleLowerCase(LC)}`);
  if (euv(B.eu) > euv(A.eu)) pros.push(tt`${eut(B.eu)} sahnesi: takipçi ve itibar`); else if (A.eu && !B.eu) cons.push(tt('Avrupa maçlarından uzak kalırsın'));
  if (of.wage > S.con.wage * 1.3) pros.push(tt('Ücret belirgin biçimde artıyor')); else if (of.wage < S.con.wage * .8) cons.push(tt('Ücretin düşüyor'));
  if (B.contact) pros.push(tt`${B.contact.n} orada: soyunma odasına hızlı girersin`);
  if (ad >= 5) cons.push(tt`Uyum süreci yaklaşık ${ad} hafta: yeni ülke${S.dil < 40 && B.country !== 'TR' ? tt(', dil engeli') : ''}`);
  if (isDerby(S.clubId, o.id)) cons.push(tt('Ezeli rakip: eski taraftarın bunu affetmez'));
  if (B.dream) pros.push(tt('Hayalindeki forma'));
  if (of.loan) pros.push(tt('Kiralık: sezon sonunda kulübüne dönersin'));
  const gap = B.r - me;
  if (gap > 8) cons.unshift(tt`Seviye farkı büyük: bu kulüp ${Math.round(B.r - 4)} güç arıyor, sen ${me}`);
  const abroad = B.country !== 'TR' && A.country === 'TR', sc = gap > 8 ? -2 : pros.length - cons.length + (db - da) / 10;
  const fam = abroad && S.age < 21 ? ['anne', tt('"Çok uzak. Daha çocuksun, biraz daha pişsen?"')] : of.wage > S.con.wage * 1.5 && S.fl.dar ? ['baba', KW ? tt('"Bu para evi rahatlatır kızım. Ama karar senin."') : tt('"Bu para evi rahatlatır oğlum. Ama karar senin."')] : MINS[of.role] < MINS[cr] ? ['baba', tt('"Oynamayacağın yere gitme. Futbolcu sahada büyür."')] : db > da ? ['baba', tt('"Orada gelişirsin. Arkandayız."')] : ['anne', tt('"Mutlu olacağın yere git, biz buradayız."')];
  const agent = S.agent ? (of.wage > S.con.wage * 1.2 ? tt`"İmzala. Bu rakamı bir daha bulamayız."` : sc >= 1 ? tt('"Kariyer planına uyuyor. Ben olsam giderim."') : tt('"Acele etme. Daha iyisi gelir."')) : null;
  return { A, B, rows, pros, cons, fam, agent, adapt: ad, dev: [da, db], verdict: gap > 8 ? tt('Henüz erken: önce gelişmen gerek') : sc >= 1.5 ? tt('Kariyerin için güçlü adım') : sc <= -1 ? tt('Riskli hamle') : tt('Artısı eksisi dengede'), tone: sc >= 1.5 ? 1 : sc <= -1 ? -1 : 0 };
}
// Seviyene uyan kulüpler: ayda bir yenilenen kısa liste
export function market() {
  const P = profile(), key = S.season + ':' + Math.floor((S.week - 1) / 4), all = [];
  for (const lid in S.lg) { if (LMAP[lid].c !== 'TR' && !P.abroad) continue; for (const id of S.lg[lid].t) { const r = S.rt[id]; if (id !== S.clubId && r >= P.lo + 1 && r <= P.hi) all.push(id); } }
  return all.sort((a, b) => hsh(a + key) - hsh(b + key)).slice(0, 6).sort((a, b) => S.rt[b] - S.rt[a]);
}
export const canPropose = () => (S.cd.propose || 0) <= absWeek() && (!!S.agent || S.net.length > 0);
// Kendini öner: menajerin ya da tanıdıkların aracılığıyla bir kulübün radarına gir
export function propose(id) {
  S.used++; S.cd.propose = absWeek() + 3;
  const con = S.net.find(c => c.org === id), f = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6.3, w = S.watch.find(x => x.id === id);
  const p = clamp(.22 + (S.agent ? S.agent.pw * .3 : 0) + (con ? .3 : 0) + (f - 6.5) * .15 + (OVR() - S.rt[id]) * .04, .05, .9);
  if (!chance(p)) return [tt`${club(id).n}: "Dosyanız elimizde, şimdilik ilgilenmiyoruz."`, false];
  if (w) w.lv = clamp(w.lv + 20, 0, 100); else S.watch.push({ id, lv: ri(34, 50) });
  addFeed('basin', tt('Transfer Hattı'), tt`${club(id).n} cephesi ${S.name} için bilgi topluyor.`, 'haber');
  return [tt`${club(id).n} scout göndermeye karar verdi. Önümüzdeki maçlarda izleneceksin.`, true];
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
  add(O.tier, 'weak'); add(O.tier, 'strong'); if (O.tier > (KW ? 2 : 4)) add(O.tier - 1, 'mid'); if (O.tier < TRT.length) add(O.tier + 1, 'weak');
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
  const baba = R[play.role] === 0 ? ['baba', tt`"Hiçbiri sana forma sözü vermiyor. ${club(play.id).n} olur ama sabırlı olacaksın."`, play.id] : ['baba', KW ? tt`"${club(play.id).n} seni ${ROLE[play.role].toLocaleLowerCase(LC)} düşünüyor. Genç oyuncu oynayarak büyür."` : tt`"${club(play.id).n} seni ${ROLE[play.role].toLocaleLowerCase(LC)} düşünüyor. Genç adam oynayarak büyür."`, play.id];
  const anne = S.fl.dar ? ['anne', tt`"${club(cash.id).n} imza parası veriyor. Evin bir aylık mutfağı eder. Ama sen bilirsin."`, cash.id] : S.fl.okul ? ['anne', tt`"${club(near.id).n} yakın, okulunu aksatmazsın. Diploman cebinde dursun."`, near.id] : ['anne', tt`"Nerede mutlu olacaksan orası. ${club(play.id).n} iyi insanlara benziyor."`, play.id];
  return [baba, anne];
}
// İlk sözleşme pazarlığı: what = 'rol' ya da 'para'
export function negFirst(o, what) {
  o.neg = true;
  if (chance(clamp(.35 + (OVR() - o.r) * .05, .1, .85))) {
    if (what === 'rol') { o.role = o.role === 'genc' ? 'rot' : '11'; return { text: tt`Yönetim ikna oldu: "${ROLE[o.role]} olarak düşünüyoruz."` }; }
    o.sign = nice(o.sign * 1.6); return { text: tt`İmza parası ${fmt(o.sign)} oldu.` };
  }
  if (chance(.25)) return { gone: true, text: tt('"Daha top oynamadan pazarlık mı?" Kulüp teklifini geri çekti.') };
  return { text: tt('Yönetim şartları değiştirmedi. Teklif masada.') };
}
// Kulüpsüz geçen iki hafta
export function freeMonth(id) {
  const keys = Object.keys(POS[S.pos].w).slice(0, 2);
  switch (id) {
    case 'birey': return [tt('Her sabah altıda sahadaydın. Kimse izlemedi ama bacakların biliyor.'), fx({ [keys[0]]: 1.2, [keys[1]]: 1 })];
    case 'mahalle': return [tt('Turnuvada yarı finale kadar çıktınız. Toprak sahada top ayağına yapıştı.'), fx({ teknik: 1, ark: 8, mo: 5 })];
    case 'kamp': return [tt('İki hafta kum, yokuş ve merdiven. Nefesin açıldı.'), fx({ para: -1500, hiz: 1.2, guc: 1.2 })];
    case 'is': return [tt('Sanayide çıraklık yaptın. Ellerin nasır tuttu, cebin para gördü.'), fx({ para: 6000, aile: 6, mo: -2 })];
    case 'okul': return [tt('Kitapların başına oturdun. Annenin yüzü güldü.'), fx({ egt: 8, aile: 7 })];
    case 'tanidik': S.fl.torpil = 1; if (!S.net.some(c => c.k === 'abi')) netAdd('abi', rname('TR'), null, 40); return [tt('Eski bir kulüp başkanıyla tanıştın. "Bir telefon açarım, gerisi senin ayağında" dedi.'), fx({ mo: 4 })];
  }
  return ['', []];
}
// Kimse almazsa: ligin en zayıf takımı kapısını açar
export function lastResort(tried = []) {
  const low = S.lg[TRT[TRT.length - 1]].t, t = low.filter(id => !tried.includes(id)).sort((a, b) => S.rt[a] - S.rt[b]), id = t[0] || low[0];
  return { id, r: S.rt[id], role: OVR() >= S.rt[id] - 2 ? '11' : 'rot', wage: 0, len: 1, sign: 0, goalB: 0, st: 'ok', first: 1 };
}

// ---------- röportajlar ----------
// k: post (maç sonu), pre (maç önü), imza. if: sorunun sorulacağı durum. Yanıt özel alanları:
// fol takipçi çarpanı, fine para cezası, ref hakemin tutumu, press söz verdin, boost rakip hırslanır, w seni izleyenlerin ilgisi
const IVQ = [
  { id: 'p_sir', k: 'post', if: c => c.rt >= 7.5, q: tt('Harika bir maç çıkardın. Sırrı ne?'), a: [
    { t: tt('Hafta içi ne çalıştıysak o'), fx: { prof: 2, hoca: 2 }, say: tt('Sır yok. Antrenmanda ne yaptıysak sahaya o yansıdı.') },
    { t: tt('Takım arkadaşlarım sayesinde'), fx: { takim: 4, hoca: 1 }, say: tt('Tek başıma hiçbir şeyim. Bu takımın emeği.') },
    { t: tt('Yetenek bu, öğretilmez'), fx: { ego: 4, taraf: 2 }, fol: 1.5, say: tt('Bazı şeyler çalışmakla olmuyor. Ya vardır ya yoktur.') }] },
  { id: 'p_trib', k: 'post', if: c => c.home && c.rt >= 7.3, q: tt('Tribünler adını haykırıyor. Onlara ne söylersin?'), a: [
    { t: tt('Bu forma onların'), fx: { taraf: 6 }, say: tt('Biz geçiciyiz, bu forma tribünün. Hakkını vermeye çalışıyorum.') },
    { t: tt('Daha yeni başlıyoruz'), fx: { taraf: 3, ego: 2 }, fol: 1.2, say: tt('Yerlerinden ayrılmasınlar. Asıl film şimdi başlıyor.') },
    { t: tt('Sahada ses duymam, işime bakarım'), fx: { hoca: 2, prof: 2, taraf: -2 }, say: tt('Açıkçası sahada hiçbir şey duymuyorum. Kafam oyunda.') }] },
  { id: 'p_arm', k: 'post', if: c => c.pg >= 1, q: tt('Golünü kime armağan ediyorsun?'), a: [
    { t: tt('Aileme'), fx: { aile: 6, mo: 2 }, say: tt('Annemle babama. Bu yollar onların sırtında yüründü.') },
    { t: tt('Mahalledeki çocuklara'), fx: { taraf: 3, ark: 3 }, fol: 1, say: tt('Toprak sahada top koşturan çocuklara. Onlardan biriyim.') },
    { t: tt('Bana inanmayanlara'), fx: { ego: 4, takim: -1 }, fol: 1.8, say: tt('"Olmaz" diyenler vardı. Bu gol onlara gitsin.') }] },
  { id: 'p_hat', k: 'post', if: c => c.pg >= 3, q: tt('{g} gol birden! Maç topu kimde kalacak?'), a: [
    { t: tt('İmzalatıp anneme götüreceğim'), fx: { aile: 7, mo: 3 }, say: tt('Top bu gece annemin vitrininde olacak.') },
    { t: tt('Soyunma odasında kalsın'), fx: { takim: 6 }, say: tt('Herkes imzalasın, soyunma odasına asalım. Bu takımın topu.') },
    { t: tt('Müzeme koyarım, devamı gelecek'), fx: { ego: 5 }, fol: 2, say: tt('Raf yaptırdım bile. Yenilerine yer lazım.') }] },
  { id: 'p_2gol', k: 'post', if: c => c.pg === 2, q: kxAdd(tt('İki gol attın. Gol krallığı aklında mı?'), tt('İki gol attın. Gol kraliçeliği aklında mı?')), a: [
    { t: tt('Aklımda takımın puanı var'), fx: { hoca: 3, takim: 2 }, say: kxAdd(tt('Krallık bireysel iş. Benim aklımda puan cetveli var.'), tt('Kraliçelik bireysel iş. Benim aklımda puan cetveli var.')) },
    { t: kxAdd(tt('Evet, hedefim krallık'), tt('Evet, hedefim kraliçelik')), fx: { ego: 3, taraf: 3 }, fol: 1.2, say: tt('Saklamaya gerek yok. O ödülü istiyorum.') },
    { t: tt('Üçüncüyü kaçırdığıma yanıyorum'), fx: { prof: 3, mo: -1 }, say: tt('İki attım ama kaçan pozisyonu bu gece rüyamda göreceğim.') }] },
  { id: 'p_asist', k: 'post', if: c => c.pa >= 1, q: tt('Bugün gol attırdın. Atmak mı, attırmak mı?'), a: [
    { t: tt('Attırmak ayrı keyif'), fx: { takim: 5 }, say: tt('Arkadaşının sevincini görmek golden tatlı.') },
    { t: tt('Önce takım, sonra ben'), fx: { takim: 2, hoca: 2 }, say: tt('Kim atarsa atsın. Skor tabelasında takımın adı yazıyor.') },
    { t: tt('O pası herkes atamaz'), fx: { ego: 3 }, fol: 1, say: tt('O arayı görmek kolay değil. Görene helal olsun, yani bana.') }] },
  { id: 'p_derbi', k: 'post', if: c => c.derby && c.win, q: tt('Derbi sizin. Şehir bu gece kimin?'), a: [
    { t: tt('Şehir bizim'), fx: { taraf: 8, ego: 2 }, fol: 2, say: tt('Bu gece şehrin rengi belli.') },
    { t: tt('Rakibe saygı, üç puan bize'), fx: { takim: 2, hoca: 2, rep: .5 }, say: tt('İyi mücadele ettiler. Kazanan biz olduk, hepsi bu.') },
    { t: tt('Bu galibiyet tribünün'), fx: { taraf: 6, takim: 1 }, say: tt('Doksan dakika susmadılar. Galibiyet onların.') }] },
  { id: 'p_derbil', k: 'post', if: c => c.derby && c.lose, q: tt('Derbi kaybedildi. Taraftara ne diyeceksin?'), a: [
    { t: tt('Özür diliyorum, telafi edeceğiz'), fx: { taraf: 3, sad: 3 }, say: tt('Üzgünüz. Bu formayı giyen herkes adına özür dilerim.') },
    { t: tt('Rövanşta konuşuruz'), fx: { ego: 2, taraf: 1 }, fol: 1, say: tt('Bu maç burada bitmedi. Rövanşı bekleyin.') },
    { t: tt('Hakem maçın önüne geçti'), fx: { taraf: 3, hoca: -1 }, ref: -.4, fine: 1, say: tt('Derbiyi biz değil düdük kaybettirdi.') }] },
  { id: 'p_maglup', k: 'post', if: c => c.lose && c.rt >= 7 && !c.derby, q: tt('Sen iyiydin ama takım kaybetti. Sorun nerede?'), a: [
    { t: tt('Kazanırken de kaybederken de biriz'), fx: { takim: 5, hoca: 2 }, say: tt('Kimseyi ayırmam. Birlikte kaybettik, birlikte çıkacağız.') },
    { t: tt('Bazıları sorumluluk almalı'), fx: { takim: -6, ego: 3 }, fol: 1.5, say: tt('Herkes aynaya baksın. Ben kendi payıma düşeni yaptım.') },
    { t: tt('Taktik tutmadı'), fx: { hoca: -5, taraf: 2 }, say: tt('Sahaya yanlış planla çıktık, bunu söylemek zorundayım.') }] },
  { id: 'p_var', k: 'post', if: c => c.varAg, q: tt('VAR golünüzü iptal etti. Karar doğru muydu?'), a: [
    { t: tt('Kararlara saygı duyuyorum'), fx: { hoca: 1 }, ref: .15, say: tt('Hakem ne derse o. Oyunumuza bakarız.') },
    { t: tt('O çizgiyi kim çekti?'), fx: { taraf: 4 }, ref: -.3, say: tt('Çizgiyi kimin çektiğini çok merak ediyorum.') },
    { t: tt('Bu kararlarla futbol oynanmaz'), fx: { taraf: 5, hoca: -1 }, ref: -.5, fine: 1, say: tt('Bu kararlarla futbol oynanmaz. Cezam neyse çekerim.') }] },
  { id: 'p_hoca', k: 'post', w: .6, q: tt('{co} hoca {tac} oynatıyor. Bu sistem sana uyuyor mu?'), a: [
    { t: tt('Hocam ne derse o'), fx: { hoca: 5 }, say: tt('Hocamız ne isterse sahada onu yaparım.') },
    { t: tt('Her hafta daha iyi anlıyorum'), fx: { hoca: 2, prof: 2 }, say: tt('Sisteme alışıyorum. Her maç bir tık daha oturuyor.') },
    { t: tt('Başka rolde daha verimliyim'), fx: { hoca: -5, ego: 2 }, fol: 1, say: tt('Dürüst olayım, en iyi olduğum yerde oynamıyorum.') }] },
  { id: 'p_gorev', k: 'post', if: c => c.tasks != null, q: tt('Hocan maç önü sana özel görev vermiş. Yerine geldi mi?'), a: [
    { t: tt('Görev neyse sahada o'), fx: { hoca: 3 }, say: tt('Bana ne söylendiyse onu yapmaya çalıştım.') },
    { t: tt('Görev tamam, gerisi ikram'), fx: { ego: 2, hoca: 1 }, say: tt('İstenen yapıldı. Üstü benden.') },
    { t: tt('Bunlar soyunma odasında kalır'), fx: { takim: 3, prof: 2 }, say: tt('Soyunma odasında konuşulan orada kalır.') }] },
  { id: 'p_yedek', k: 'post', if: c => c.bench && c.rt >= 6.8, q: tt('Kulübeden gelip maçı değiştirdin. İlk 11 senin hakkın değil mi?'), a: [
    { t: tt('Karar hocamın'), fx: { hoca: 4 }, say: tt('Kimin oynayacağına hocamız karar verir. Ben hazır beklerim.') },
    { t: tt('Beş dakika da verseler hazırım'), fx: { prof: 3, takim: 2 }, say: tt('Süre fark etmez. Forma verildiği an görev başlar.') },
    { t: tt('Evet, artık hak ediyorum'), fx: { ego: 4, hoca: -3, taraf: 3 }, fol: 1.3, say: tt('Bence cevabı sahada verdim. Artık başlamak istiyorum.') }] },
  { id: 'p_avrupa', k: 'post', if: c => c.eu, q: tt('Avrupa gecesinde sahnedeydin. Bu atmosfer nasıl?'), a: [
    { t: tt('Bu müziği çocukken ekranda dinlerdim'), fx: { taraf: 3, aile: 3 }, fol: 1.5, say: tt('O müzik çalarken tüylerim diken diken oldu. Çocukluğum geldi aklıma.') },
    { t: tt('Her maç gibi bir maç'), fx: { prof: 3, hoca: 1 }, say: tt('Top aynı top, kale aynı kale. Fazla büyütmüyorum.') },
    { t: tt('Avrupa artık adımı öğrenecek'), fx: { ego: 4, rep: 1 }, fol: 2, say: tt('Bu geceden sonra ismimi telaffuz etmeyi öğrenirler.') }] },
  { id: 'p_final', k: 'post', if: c => c.final && c.win, q: tt('Kupa sizin! İlk his?'), a: [
    { t: tt('Bu kupa şehrin'), fx: { taraf: 8 }, say: tt('Bu kupayı şehre götürüyoruz. Yollarda görüşürüz.') },
    { t: tt('Ailemi tribünde gördüm'), fx: { aile: 8, mo: 3 }, say: tt('Babamı ağlarken gördüm. Gerisini hatırlamıyorum.') },
    { t: tt('İlki bu, devamı gelecek'), fx: { ego: 3 }, fol: 2, say: tt('Bir tane yetmez. Bu daha ilki.') }] },
  { id: 'p_transfer', k: 'post', if: c => c.watch, q: tt('Adın başka kulüplerle anılıyor. Sezon sonu burada mısın?'), a: [
    { t: tt('Sözleşmem var, kafam burada'), fx: { taraf: 4, hoca: 2, sad: 3 }, say: tt('Benim adresim belli. Söylentilerle işim yok.') },
    { t: tt('Futbolda yarın belli olmaz'), fx: { taraf: -3 }, w: 8, say: tt('Futbolda hiçbir kapı kapanmaz. Zaman gösterir.') },
    { t: tt('O işlere menajerim bakıyor'), fx: { taraf: -1 }, w: 4, say: tt('Ben top oynarım, telefonlara menajerim bakar.') }] },
  { id: 'p_genc', k: 'post', if: c => c.age <= 19, q: tt('Bu yaşta bu sorumluluk ağır gelmiyor mu?'), a: [
    { t: tt('Yaş kimlikte yazar'), fx: { ego: 3, taraf: 3 }, fol: 1.3, say: tt('Sahada kimse kimliğe bakmıyor.') },
    { t: kxAdd(tt('Abilerim yol gösteriyor'), tt('Ablalarım yol gösteriyor')), fx: { takim: 4 }, say: kxAdd(tt('Soyunma odasındaki abilerim olmasa bu kadar rahat olamazdım.'), tt('Soyunma odasındaki ablalarım olmasa bu kadar rahat olamazdım.')) },
    { t: tt('Okul da var, saha da'), fx: { aile: 4, egt: 1 }, say: tt('Sabah okul, akşam idman. İkisini de bırakmaya niyetim yok.') }] },
  { id: 'p_seri', k: 'post', if: c => c.f5 >= 7.4, q: tt('Üst üste iyi maçlar. Formunun zirvesinde misin?'), a: [
    { t: tt('Zirve yok, her hafta sıfırdan'), fx: { prof: 3, hoca: 2 }, say: tt('Geçen haftanın maçı bitti. Pazartesi yine sıfırdan başlıyorum.') },
    { t: tt('Evet ve inmeye niyetim yok'), fx: { ego: 3, taraf: 2 }, fol: 1.2, say: tt('İyi hissediyorum. Bu seviyeden aşağı inmem.') },
    { t: tt('Evdeki düzenime borçluyum'), fx: { aile: 3, mo: 2 }, say: tt('Uykum, yemeğim, ailem düzende. Saha onun yansıması.') }] },
  { id: 'p_kotu', k: 'post', if: c => c.rt < 5.8, q: tt('Bugün senin günün değildi. Ne oldu?'), a: [
    { t: tt('Sorumluluk bende'), fx: { hoca: 3, takim: 2, prof: 2 }, say: tt('Kötüydüm. Bahane aramayacağım.') },
    { t: tt('Herkesin kötü günü olur'), fx: { mo: 3 }, say: tt('Makine değiliz. Haftaya başka bir ben göreceksiniz.') },
    { t: tt('Bana top gelmedi ki'), fx: { takim: -5, hoca: -2, ego: 2 }, say: tt('Top gelmeden ne yapabilirim? İzleyenler gördü.') }] },
  { id: 'p_kirmizi', k: 'post', if: c => c.red, q: tt('Kırmızı kart gördün. Takımını eksik bıraktın.'), a: [
    { t: tt('Arkadaşlarımdan özür diledim'), fx: { takim: 4, hoca: 1 }, say: tt('Soyunma odasında herkesten tek tek özür diledim.') },
    { t: tt('Pozisyonu izleyin, kart değildi'), fx: { taraf: 2 }, ref: -.3, say: tt('Tekrarına bakın. Topa gittim.') },
    { t: tt('Hırsımdan oldu'), fx: { taraf: 3, prof: -1 }, say: tt('Kaybetmeyi sevmiyorum. Bazen taşıyor.') }] },
  { id: 'p_zirve', k: 'post', if: c => c.rank <= 2 && c.week >= 12, q: tt('Zirve yarışındasınız. Şampiyonluk geliyor mu?'), a: [
    { t: tt('Maç maç bakıyoruz'), fx: { hoca: 2, prof: 2 }, say: tt('Puan cetveline mayısta bakarız. Önümüzde sadece bir sonraki maç var.') },
    { t: tt('Bu takım şampiyon olur'), fx: { taraf: 5, ego: 2 }, say: tt('Bu soyunma odası şampiyonluk kokuyor.') },
    { t: tt('Kupayı şimdiden parlatsınlar'), fx: { ego: 5, takim: -1 }, fol: 1.5, say: tt('Kupayı hazırlasınlar. Gelip alacağız.') }] },
  { id: 'p_dusme', k: 'post', if: c => c.rank > c.n - 4 && c.week >= 10, q: tt('Alt sıralardasınız. Ligde kalabilecek misiniz?'), a: [
    { t: tt('Son düdüğe kadar savaşırız'), fx: { taraf: 4, takim: 3 }, say: tt('Bu forma düşmez. Son haftaya kadar savaşacağız.') },
    { t: tt('Bu kadro burada olmamalıydı'), fx: { takim: -3, ego: 2 }, say: tt('Bu kadronun yeri burası değil. Bazı şeyler konuşulmalı.') },
    { t: tt('Kimse panik yapmasın'), fx: { mo: 3, hoca: 1 }, say: tt('Sakin olalım. İki galibiyet her şeyi değiştirir.') }] },
  { id: 'p_milli', k: 'post', if: c => c.rep >= 30 && c.caps === 0, q: tt('Milli takım cephesi seni izliyor. Davet bekliyor musun?'), a: [
    { t: tt('Ay yıldızlı forma herkesin hayali'), fx: { rep: 1, taraf: 2 }, say: tt('O formayı giymek her çocuğun hayali. Benim de.') },
    { t: tt('Kulübümde işimi yapayım, gerisi gelir'), fx: { hoca: 2, prof: 2 }, say: tt('Ben burada işimi iyi yaparsam telefon kendiliğinden çalar.') },
    { t: tt('Artık çağırmaları lazım'), fx: { ego: 4 }, fol: 1.2, say: tt('Bence vakti geldi. Karar onların.') }] },
  { id: 'p_rakip', k: 'post', w: .5, q: tt('Kuşak rakibin {rival} da çok konuşuluyor. Kıyaslanmak rahatsız ediyor mu?'), a: [
    { t: tt('İyi oyuncu, başarılar dilerim'), fx: { rep: .5, takim: 1 }, say: tt('İyi futbolcu. Yolu açık olsun.') },
    { t: tt('Ben kendi yoluma bakarım'), fx: { prof: 2 }, say: tt('Kimseyle yarışmıyorum. Dünkü kendimle yarışıyorum.') },
    { t: tt('Sahada karşılaşınca görürüz'), fx: { ego: 3 }, fol: 1.5, say: tt('Kıyaslamayı sahaya bırakalım. Orada belli olur.') }] },
  { id: 'r_bek', k: 'pre', q: tt('Büyük maç öncesi beklentin ne?'), a: [
    { t: tt('İyi futbol, üç puan'), fx: { hoca: 1 }, say: tt('Planımız hazır. İyi oynayıp kazanmak istiyoruz.') },
    { t: tt('Kazanacağız, net'), fx: { ego: 2 }, press: 1, say: tt('Kazanacağız. Bundan şüphem yok.') },
    { t: tt('Tribün ne isterse onu vereceğiz'), fx: { taraf: 3 }, press: 1, say: tt('Taraftarımız galibiyet istiyor. Alacaklar.') }] },
  { id: 'r_rakip', k: 'pre', q: tt('{opp} hakkında ne düşünüyorsun?'), a: [
    { t: tt('Saygı duyuyoruz'), fx: { takim: 1, rep: .3 }, say: tt('Zor bir rakip. Saygımız sonsuz, sahada görüşürüz.') },
    { t: tt('Zaaflarını biliyoruz'), fx: { ego: 2 }, boost: 1, fol: 1, say: tt('Videolarını izledik. Nereden vuracağımızı biliyoruz.') },
    { t: tt('Onlar bizden korksun'), fx: { ego: 4 }, boost: 1.5, fol: 2, say: tt('Korkması gereken biz değiliz.') }] },
  { id: 'r_baski', k: 'pre', q: tt('Herkes bu maçı konuşuyor. Baskı hissediyor musun?'), a: [
    { t: tt('Baskı bir ayrıcalık'), fx: { prof: 2, mo: 2 }, say: tt('Baskı varsa önemli bir yerdesin demektir. Seviyorum.') },
    { t: tt('Biraz, yalan yok'), fx: { taraf: 2, mo: -1 }, say: tt('Midemde kelebekler var, saklamayacağım. Ama iyi anlamda.') },
    { t: tt('Baskı rakibin üstünde'), fx: { ego: 2 }, press: 1, say: tt('Kaybedecek bir şeyi olan onlar. Biz rahatız.') }] },
  { id: 'r_derbi', k: 'pre', if: c => c.derby, q: tt('Derbi haftası. Geceleri uyuyabiliyor musun?'), a: [
    { t: tt('Bebek gibi'), fx: { ego: 2, mo: 2 }, say: tt('Sekiz saat, deliksiz. Derbi beni dinlendiriyor.') },
    { t: tt('Bu maçı çocukluğumdan beri bekliyorum'), fx: { taraf: 5 }, press: 1, say: tt('Çocukken bu maçların hayalini kurardım. Hazırım.') },
    { t: tt('Derbi de üç puan'), fx: { prof: 2, hoca: 2, taraf: -1 }, say: tt('Sonuçta üç puanlık bir maç. Fazla anlam yüklemiyorum.') }] },
  { id: 'r_hayal', k: 'pre', if: c => c.dream, q: tt('Karşında çocukluk hayalin {opp} var. Gol atarsan sevinecek misin?'), a: [
    { t: tt('Giydiğim forma için sevinirim'), fx: { taraf: 5 }, say: tt('Hangi formayı giyiyorsam onun için sevinirim.') },
    { t: tt('Saygımdan sevinmem'), fx: { taraf: -3 }, wd: 10, say: tt('O armaya saygım var. Atarsam sevinmem.') },
    { t: tt('Önce bir atalım'), fx: { prof: 1 }, say: tt('Önce golü atalım, sevinci sonra düşünürüz.') }] },
  { id: 'r_final', k: 'pre', if: c => c.final, q: tt('Kupaya bir maç kaldı. Hazır mısınız?'), a: [
    { t: tt('Bu kupayı şehre götüreceğiz'), fx: { taraf: 5 }, press: 1, say: tt('O kupa bizimle dönecek.') },
    { t: tt('Final oynanmaz, kazanılır'), fx: { ego: 2 }, fol: 1.5, press: 1, say: tt('Finaller oynanmaz, kazanılır. Kazanacağız.') },
    { t: tt('Heyecanlıyız ama hazırız'), fx: { takim: 2 }, say: tt('Heyecan var ama hazırlığımız tam.') }] },
  { id: 'r_avrupa', k: 'pre', if: c => c.eu, q: tt('Avrupa sahnesinde rakip güçlü. Şansınız var mı?'), a: [
    { t: tt('Sahada on bire on bir'), fx: { takim: 3 }, say: tt('İsimler sahaya çıkmıyor. On bire on bir oynanacak.') },
    { t: tt('Favori onlar, sürpriz biziz'), fx: { prof: 1, mo: 2 }, say: tt('Kâğıt üstünde favori onlar. Biz de sürprizi severiz.') },
    { t: tt('Avrupa bizi konuşacak'), fx: { ego: 3 }, press: 1, fol: 1.5, say: tt('Yarın sabah Avrupa bizi konuşacak.') }] },
  { id: 'r_hakem', k: 'pre', q: tt('Maçı {ref} yönetecek. Bir yorumun var mı?'), a: [
    { t: tt('Hakemlerle işim olmaz'), fx: { hoca: 1 }, ref: .1, say: tt('Ben topuma bakarım. Hakem işini yapar.') },
    { t: tt('Umarım adil bir maç olur'), fx: { taraf: 1 }, ref: -.1, say: tt('Tek isteğim adil bir yönetim.') },
    { t: tt('Geçmişte canımızı yakmıştı'), fx: { taraf: 3 }, ref: -.35, say: tt('Hafızam iyidir. Umarım bu kez farklı olur.') }] },
  { id: 'r_form', k: 'pre', if: c => c.f5 < 6.3, q: tt('Son haftalarda formun düşük. Bu maç dönüş maçı mı?'), a: [
    { t: tt('Çalışıyorum, karşılığı gelecek'), fx: { prof: 3 }, say: tt('Antrenmanda fazladan kalıyorum. Karşılığı gelecek.') },
    { t: tt('Eleştiriler beni besliyor'), fx: { ego: 2 }, press: 1, say: tt('Yazılanları okuyorum. Cevabı sahada vereceğim.') },
    { t: tt('Form geçici, klas kalıcı'), fx: { ego: 4 }, fol: 1.2, say: tt('Form gelir geçer. Klas kalır.') }] },
  { id: 'i_ilk', k: 'imza', q: tt('Yeni kulübünde ilk sözün ne?'), a: [
    { t: tt('Bu formayı terletmeye geldim'), fx: { taraf: 6, takim: 2 }, say: tt('Bu formanın hakkını vereceğim.') },
    { t: tt('Hedefim şampiyonluk'), fx: { taraf: 8, ego: 3 }, say: tt('Buraya kupa kaldırmaya geldim.') },
    { t: tt('Önce yerimi kazanmam lazım'), fx: { hoca: 4, prof: 2 }, say: tt('Kimse bana forma borçlu değil. Çalışıp alacağım.') }] },
  { id: 'i_taraf', k: 'imza', q: tt('Taraftara mesajın var mı?'), a: [
    { t: tt('Tribünde görüşürüz'), fx: { taraf: 6 }, say: tt('İlk maçta tribünde görüşelim. Sesiniz lazım.') },
    { t: tt('Sabır istiyorum'), fx: { taraf: 3, hoca: 2 }, say: tt('Biraz sabır istiyorum. Karşılığını fazlasıyla vereceğim.') },
    { t: tt('Formamı şimdiden alsınlar'), fx: { ego: 3, taraf: 4 }, fol: 1.5, say: tt('Formamı şimdiden alın. Sonra bulamazsınız.') }] },
  { id: 'i_neden', k: 'imza', q: tt('Neden bu kulübü seçtin?'), a: [
    { t: tt('Proje beni ikna etti'), fx: { hoca: 3, taraf: 2 }, say: tt('Hocamızla konuştum, plan net. O yüzden buradayım.') },
    { t: tt('Bu armayı hep sevdim'), fx: { taraf: 7 }, say: tt('Bu arma çocukluğumdan beri aklımdaydı.') },
    { t: tt('En iyi teklif buydu'), fx: { taraf: -4, ego: 2, prof: 1 }, say: tt('Dürüst olayım: en iyi teklif buradan geldi.') }] },
  { id: 'i_eski', k: 'imza', q: tt('Eski kulübünün taraftarı kırgın. Ne söylersin?'), a: [
    { t: tt('Beni yetiştiren herkese teşekkürler'), fx: { sad: 6, taraf: 2 }, say: tt('Beni yetiştiren herkese teşekkür ederim. Kapıyı çarpmadan çıktım.') },
    { t: tt('Futbol bu, yollar ayrılır'), fx: { sad: -2, prof: 1 }, say: tt('Futbolun doğası bu. Kimseye kırgın değilim.') },
    { t: tt('Bir gün döneceğim'), fx: { sad: 4 }, fol: 1, say: tt('Bu bir veda değil. Bir gün yollarımız yine kesişir.') }] },
  { id: 'i_hedef', k: 'imza', q: tt('Bu sezon kendine ne hedef koydun?'), a: [
    { t: tt('Çift haneli katkı'), fx: { ego: 2, taraf: 3 }, say: tt('Gol ve asistte çift haneyi görmek istiyorum.') },
    { t: tt('Her maç forma giymek'), fx: { hoca: 2, prof: 2 }, say: tt('İlk hedefim her hafta kadroda olmak.') },
    { t: tt('Kupa kaldırmak'), fx: { taraf: 5, ego: 2 }, say: tt('Sezon sonunda elimde bir kupa olsun istiyorum.') }] },
];
function ivCtx(fxt, M) {
  const lid = leagueOf(S.clubId), t = table(lid).map(r => r.id), co = coach(), f5 = S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6.5;
  return { g: M ? M.pg : 0, pg: M ? M.pg : 0, pa: M ? M.pa : 0, rt: M ? M.rt : 0, win: !!M && M.usG > M.oppG, lose: !!M && M.usG < M.oppG, varAg: !!M && !!M.varAg, red: !!M && M.red, bench: !!M && M.role === 'yedek',
    tasks: M && M.tasks && M.tasks.length ? M.tdone || 0 : null, derby: !!fxt && !fxt.nat && isDerby(S.clubId, fxt.opp), eu: !!fxt && !!fxt.eu, final: !!fxt && !!fxt.final, home: !!fxt && !!fxt.home,
    dream: !!fxt && fxt.opp === S.dream, opp: fxt && !fxt.nat && club(fxt.opp) ? club(fxt.opp).n : tt('rakip'), rank: t.indexOf(S.clubId) + 1, n: t.length, week: S.week, f5, age: S.age, rep: S.rep, caps: S.car.caps,
    watch: S.watch.length > 0, co: co.n, tac: TACT[co.st].n.toLocaleLowerCase(LC), ref: curRef().n, rival: S.rival.n };
}
// Duruma uyan, yakın zamanda sorulmamış n soru seçer
export const ivDue = () => absWeek() >= (S.ivn || 0);   // mikrofonlar her hafta uzanmaz
export function ivPick(kind, fxt, M, n = 2) {
  if (kind !== 'imza') S.ivn = absWeek() + ri(4, 6);
  const c = ivCtx(fxt, M), seen = S.ivq || (S.ivq = []), ok = IVQ.filter(q => q.k === kind && (!q.if || q.if(c)));
  const w = {}; ok.forEach(q => { w[q.id] = (q.w || 1) * (q.if ? 2.5 : 1) * (seen.includes(q.id) ? .04 : 1); });
  const out = [];
  while (out.length < n && Object.keys(w).length) { const id = wpick(w); delete w[id]; const q = IVQ.find(x => x.id === id); out.push({ id, q: kx(q.q).replace(/\{(\w+)\}/g, (m, k) => c[k] ?? ''), a: q.a.map(x => ({ ...x, t: kx(x.t), say: kx(x.say) })) }); seen.push(id); }
  S.ivq = seen.slice(-18);
  return out;
}
export function ivAnswer(id, i, fxt) {
  const a = IVQ.find(x => x.id === id).a[i], f = { ...a.fx };
  if (a.fol) f.fol = Math.round((60 + S.rep * S.rep * 2) * a.fol);
  if (a.fine) f.para = -nice(wref() * 2);
  if (a.ref) curRef().me += a.ref;
  S.rel.basin = clamp(S.rel.basin + (a.fine ? -5 : (f.ego || 0) >= 4 ? 1.5 : 1), 0, 100);   // konuşan futbolcu sevilir; hakemle kavga eden değil
  if (a.w) for (const x of S.watch) x.lv = clamp(x.lv + a.w, 0, 100);
  if (a.wd) { const x = S.watch.find(y => y.id === S.dream); if (x) x.lv = clamp(x.lv + a.wd, 0, 100); }
  if (fxt && a.press) fxt.press = 1; if (fxt && a.boost) fxt.boost = a.boost;
  addFeed('me', S.name, '“' + kx(a.say) + '”', 'ben');
  return fx(f);
}

// ---------- kulüp efsaneleri ----------
function srnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Kulübün tüm zamanların golcüleri: kulüp adından üretilen sabit liste + senin o formayla yaptıkların
export function legends(id) {
  const c = club(id), lid = leagueOf(id), N = NAMES[lid ? LMAP[lid].c : 'TR'] || NAMES.TR, r = srnd(hsh(c.n + '#efsane')), out = [];
  const big = CLUBS[id] ? clamp((CLUBS[id].r - 40) / 50, 0, 1) : 0;
  let g = 55 + r() * 60 + big * 110;
  for (let i = 0; i < 5; i++) { out.push({ n: N.f[Math.floor(r() * N.f.length)] + ' ' + N.l[Math.floor(r() * N.l.length)], g: Math.round(g), apps: Math.round(g * (2.1 + r() * 1.7)), y: (KW ? 1994 : 1962) + Math.floor(r() * (KW ? 26 : 50)) }); g *= .7 + r() * .2; }
  for (const x of (S.xl || {})[id] || []) out.push({ ...x });   // ebeveyninin bıraktığı iz
  const me = (S.cs || {})[id]; if (me && me.apps) out.push({ n: S.name, g: me.g, apps: me.apps, me: true });
  return out.sort((a, b) => b.g - a.g || b.apps - a.apps);
}
export function legendRank(id) {
  const list = legends(id), i = list.findIndex(x => x.me);
  return { list, pos: i < 0 ? 99 : i + 1, next: i > 0 ? list[i - 1].g - list[i].g + 1 : 0 };
}

// ---------- kaptanlık ----------
export const CAPT = [
  { t: tt('Takımı ateşle'), s: tt('Tutarsa gol gelir; kaybederseniz fatura sana kesilir'), i: 'bolt' },
  { t: tt('Sakinleştir'), s: tt('Daha az hata: rakibin bir atağı boşa gidebilir'), i: 'shield' },
  { t: tt('Gençlere güven ver'), s: tt('Soyunma odasında bağlar güçlenir'), i: 'users' },
  { t: tt('Sözü kısa kes'), s: tt('Kendi oyununa odaklan'), i: 'target' },
];
export function capTalk(M, i) {
  const srt = () => M.tl.sort((a, b) => a.min - b.min);
  if (i === 0) {
    M.capFire = 1;
    if (chance(.42 + S.rel.takim / 400 + (S.trait === 'lider' ? .15 : 0))) { M.tl.push({ min: ri(6, 80), t: 'bg', us: true }); srt(); return tt('Soyunma odası ayağa kalktı. Tünelden çıkarken herkesin gözü dönmüştü.'); }
    return tt('Bağırdın, çağırdın; ama gözler yerdeydi.');
  }
  if (i === 1) { M.focus = 1; const j = M.tl.findIndex(e => e.t === 'bg' && !e.us); if (j >= 0 && chance(.5)) M.tl.splice(j, 1); return tt('"Kimse panik yapmasın, oyunumuzu oynayalım." Omuzlar gevşedi.'); }
  if (i === 2) { for (const m of S.mates) m.b = clamp(m.b + (m.r === 'Genç yetenek' ? 7 : 2), 0, 100); fx({ takim: 3 }); return tt('Genç oyuncunun omzuna elini koydun: "Bugün senin günün." Gözleri parladı.'); }
  M.rt += .2; fx({ takim: -1 }); return tt('"Konuşmaya gerek yok, sahada görüşürüz." Kısa ve soğuk.');
}

// ---------- kenar modu: emeklilikten sonra antrenör ya da başkan ----------
export const MTR = { denge: [tt('Dengeli'), tt('Her şeyden biraz')], hucum: [tt('Hücum'), tt('Gol yollarında etkinlik artar')], sav: [tt('Savunma'), tt('Daha az gol yersiniz')], genc: [tt('Gençler'), tt('Yavaş ama kalıcı güç artışı')] };
const mgrPrice = id => nice(Math.max(250000, baseW(S.rt[id]) * 6000));
// Göreve çağıran kulüpler. Başkanlık için kulübün bedelini ödeyebilmen gerekir.
export function mgrOffers(role, lower) {
  const tgt = clamp(30 + S.rep * .5 - (lower ? 8 : 0) + (S.fl.pc ? 6 : 0), 24, role === 'coach' ? 80 : 95), out = [], old = Object.keys(S.cs || {}).filter(id => leagueOf(id));
  const pool = [];
  for (const lid in S.lg) for (const id of S.lg[lid].t) if (id !== (lower ? S.clubId : null)) pool.push(id);
  const ok = id => (role === 'pres' ? mgrPrice(id) <= S.money : S.rt[id] <= tgt + 2);
  for (const id of old.sort((a, b) => S.rt[b] - S.rt[a])) if (out.length < 2 && ok(id) && !(lower && id === S.clubId)) out.push(id);
  const rest = pool.filter(id => ok(id) && !out.includes(id)).sort((a, b) => Math.abs(S.rt[a] - tgt) - Math.abs(S.rt[b] - tgt));
  for (const id of shuffle(rest.slice(0, 8))) if (out.length < 3) out.push(id);
  if (!out.length && role === 'coach') out.push([...S.lg[TRT[TRT.length - 1]].t].sort((a, b) => S.rt[a] - S.rt[b])[0]);
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
  addNews(role === 'coach' ? tt`${club(o.id).n} teknik direktörlüğüne getirildin.` : tt`${club(o.id).n} başkanı oldun.`, role === 'coach' ? 'whistle' : 'crown');
  addFeed('c:' + o.id, club(o.id).n, role === 'coach' ? tt`Yeni teknik direktörümüz ${s.name}. Hoş geldin hocam!` : tt`Yeni başkanımız ${s.name}. Hayırlı olsun!`, 'kulup');
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
  coach: [['talk', tt('Takım toplantısı'), tt('Sıradaki maçta takım daha diri çıkar'), 'users'], ['drill', tt('Ekstra idman'), tt('Kalıcı küçük güç artışı; yorgunluk riski'), 'train'], ['youth', tt('Altyapıyı izle'), tt('Belki bir cevher çıkar'), 'eye'], ['press', tt('Basın toplantısı'), tt('Güveni tazele ya da başını yak'), 'mic']],
  pres: [['invest', tt('Tesis yatırımı'), tt('Pahalı; kalıcı güç ve gelişim'), 'train'], ['ticket', tt('Bilet indirimi'), tt('Tribün dolar, kasa biraz boşalır'), 'users'], ['sponsor', tt('Sponsor görüşmesi'), tt('Bütçeye taze para'), 'tag'], ['sack', tt('Hocayı değiştir'), tt('Yeni hoca, yeni sistem; tazminat ödenir'), 'whistle']],
};
export const mgrCost = k => (k === 'invest' ? nice(mgrBud(S.clubId) * 2.2 * (1 + ((S.fx || {})[S.clubId] || 0))) : k === 'sack' ? nice(mgrBud(S.clubId) * .8) : k === 'ticket' ? nice(mgrBud(S.clubId) * .15) : 0);
export function mgrAct(k) {
  const s = S, m = s.mgr, id = s.clubId, cost = mgrCost(k); if (m.act || m.bud < cost) return null;
  m.act = 1; m.bud -= cost;
  const up = v => { s.rt[id] = clamp(s.rt[id] + v, 15, 95); };
  switch (k) {
    case 'talk': m.talk = 1; return [tt('Soyunma odasında herkesle tek tek konuştun. Hafta sonu daha istekli çıkacaklar.'), [tt('Sıradaki maç: takım gücü +1,5')]];
    case 'drill': if (chance(.25)) { up(-.3); return [tt('Fazla yüklendin; iki oyuncu adale sakatlığı yaşadı.'), [tt('Takım gücü −0,3')]]; } up(.12); return [tt('Çift idman meyvesini verdi.'), [tt('Takım gücü +0,1')]];
    case 'youth': if (chance(.3)) { up(.5); m.conf = clamp(m.conf + 3, 0, 100); addNews(tt('Altyapıdan bir cevher A takıma yükseldi.'), 'star'); return [tt('On yedi yaşında bir çocuk gözüne çarptı. A takıma aldın; tribün bayıldı.'), [tt('Takım gücü +0,5'), tt('Güven +3')]]; } return [tt('Bu hafta göze çarpan yoktu. Ama çocuklar hocayı kenarda görünce bir başka koştu.'), []];
    case 'press': { const g = chance(.6 + s.rep / 400); m.conf = clamp(m.conf + (g ? 4 : -4), 0, 100); return [g ? tt('Sakin, net, kendinden emin. Manşetler lehine.') : tt('Bir soruya sinirlendin; görüntü günlerce döndü.'), [g ? tt('Güven +4') : tt('Güven −4')]]; }
    case 'invest': s.fx[id] = (s.fx[id] || 0) + 1; up(.4); m.conf = clamp(m.conf + 5, 0, 100); addNews(tt`${club(id).n} tesislerine yatırım yapıldı.`, 'train'); return [tt('Yeni sahalar, yeni fizik tedavi merkezi. Etkisi yıllarca sürer.'), [tt('Tesis +1'), tt('Takım gücü +0,4'), tt('Güven +5')]];
    case 'ticket': m.conf = clamp(m.conf + 4, 0, 100); return [tt('Kombine fiyatları indi; kale arkası doldu.'), [tt('Güven +4')]];
    case 'sponsor': { const g = chance(.45 + s.rep / 400), v = nice(mgrBud(id) * .3); if (g) m.bud += v; return [g ? tt('El sıkıştınız. Forma göğsüne yeni bir isim geliyor.') : tt('Görüşme uzadı, imza çıkmadı.'), g ? [tt('Bütçe +') + fmtS(v)] : []]; }
    case 'sack': { const old = coach().n, st = pick(Object.keys(TACT).filter(x => x !== coach().st)); s.co[id] = { n: rname(LMAP[leagueOf(id)].c), st }; m.conf = clamp(m.conf + 2, 0, 100); addNews(tt`${old} ile yollar ayrıldı. Yeni hoca ${s.co[id].n}.`, 'whistle'); return [tt`${old} gitti, ${s.co[id].n} geldi. Sistemi: ${TACT[st].n.toLocaleLowerCase(LC)}.`, [tt('Kadro uyumu ') + (squadFit(st) >= 0 ? '+' : '−') + Math.abs(squadFit(st))]]; }
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
export function mgrHalf(M, ku, ko, from, span = 45) {
  for (let i = poisson(clamp(M.lu * ku * span / 90, .03, 3)); i > 0; i--) M.tl.push({ min: ri(from + 2, from + span), us: true });
  for (let i = poisson(clamp(M.lo * ko * span / 90, .03, 3)); i > 0; i--) M.tl.push({ min: ri(from + 2, from + span), us: false });
  M.tl.sort((a, b) => a.min - b.min);
}
export const MHT = [[tt('Hücuma çık'), tt('İki kale de açılır'), 1.4, 1.3], [tt('Aynen devam'), tt('Plan değişmez'), 1, 1], [tt('Kapan'), tt('Skoru koru'), .65, .6]];
export function mgrAfter(M, win) {
  const s = S, m = s.mgr, lose = !win && M.usG < M.oppG, d = M.oppR - M.usR, lines = [];
  const dv = win ? 1.2 + clamp(d * .35, 0, 5) : lose ? -2.5 - clamp(-d * .35, 0, 5) : (d > 3 ? 1.5 : d < -3 ? -2 : -.5);
  m.conf = clamp(m.conf + dv * (M.fxt.cup ? 1.3 : 1), 0, 100); m.talk = 0;
  lines.push(tt('Güven ') + (dv >= 0 ? '+' : '−') + Math.abs(Math.round(dv)));
  if (win && m.role === 'coach') { const b = nice(s.con.wage * .2); if (b) { s.money += b; lines.push(tt('Prim: ') + fmt(b)); } }
  const cn = club(s.clubId).n, on = club(M.fxt.opp).n;
  addFeed('c:' + s.clubId, cn, tt`MAÇ SONU | ${cn} ${M.usG}-${M.oppG} ${on}`, 'kulup');
  addFeed('taraftar', pick(FANS), win ? pick([tt`${s.name} ne dokunduysa oldu.`, tt('Bu takım oynuyor. Helal.'), tt('Pazartesi işe mutlu gidiyoruz.')]) : lose ? pick([tt`${s.name} bu kadroyla ne yapsın... ya da ne yapmasın?`, tt('Böyle olmaz. Bir şey değişmeli.'), tt('Tribün sabırsız.')]) : tt('Bir puan bir puandır. Ama yetmez.'));
  return lines;
}
// Transfer dönemi: üç hedef. plus: takım gücüne katkı
export function mgrMarket() {
  const s = S, base = mgrBud(s.clubId), L = LMAP[leagueOf(s.clubId)];
  return [.4, .8, 1.3].map((pl, i) => ({ n: rname(pick([L.c, L.c, 'TR', 'EN', 'ES'])), pos: pick([tt('Forvet'), tt('Kanat'), tt('Orta saha'), tt('Stoper'), tt('Kaleci')]), plus: +(pl + rnd(-.15, .2)).toFixed(1), cost: nice(base * [.6, 1.3, 2.4][i] * rnd(.85, 1.2)), age: ri(19, 31) }));
}
export function mgrBuy(t) { const m = S.mgr; if (m.bud < t.cost) return false; m.bud -= t.cost; S.rt[S.clubId] = clamp(S.rt[S.clubId] + t.plus, 15, 95); m.conf = clamp(m.conf + 2, 0, 100); addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${t.n} artık ${club(S.clubId).n} oyuncusu.`, 'manset'); return true; }
export function mgrSell() { const m = S.mgr, v = nice(mgrBud(S.clubId) * .9); m.bud += v; S.rt[S.clubId] = clamp(S.rt[S.clubId] - 1.3, 15, 95); m.conf = clamp(m.conf - 4, 0, 100); addFeed('taraftar', pick(FANS), tt('Yıldızımızı sattılar. Hayırlı olsun da kim oynayacak?')); return v; }
// Sezon sonu: hedefe göre güven, yeni bütçe, yeni hedef
export function mgrSeason(rep) {
  const s = S, m = s.mgr, id = s.clubId, lines = [], d = m.obj - rep.pos;
  let dv = clamp(d * 4, -24, 24); if (rep.pos === 1) dv += 12; if (rep.moved === 1) dv += 10; if (rep.moved === -1) dv -= 18;
  m.conf = clamp(m.conf + dv, 0, 100);
  lines.push(tt`Hedef ${m.obj}. sıra, bitiş ${rep.pos}. sıra`, tt('Güven ') + (dv >= 0 ? '+' : '−') + Math.abs(Math.round(dv)));
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
    { p: 'takim', i: 'alert', t: tt('Yıldız gitmek istiyor'), d: tt`${star} kapını çaldı: "Üst ligden teklif var, beni bırakın."`, o: [
      [tt('Sat, parayı al'), tt('Bütçe artar, takım zayıflar'), () => { m.bud += nice(b * .9); up(-1.2); cf(-3); return [tt('Bütçe +') + fmtS(nice(b * .9)), tt('Takım gücü −1,2'), tt('Güven −3')]; }],
      [tt('İkna et'), tt('Tutarsa kalır; tutmazsa küser'), () => (chance(.5 + s.rep / 300) ? (cf(2), [tt('Kaldı'), tt('Güven +2')]) : (up(-.5), [tt('Kaldı ama keyfi yok'), tt('Takım gücü −0,5')]))],
      [tt('Zam yap'), tt('Bütçeden gider'), () => { m.bud = Math.max(0, m.bud - nice(b * .3)); return [tt('Bütçe −') + fmtS(nice(b * .3))]; }]] },
    { p: 'taraftar', i: 'users', t: tt('Tribün ses veriyor'), d: tt('Taraftar grubu tesis kapısında. Konuşmak istiyorlar.'), o: [
      [tt('Yanlarına git'), tt('Yüzleş, dinle'), () => (chance(.65) ? (cf(4), [tt('Güven +4')]) : (cf(-2), [tt('Güven −2')]))],
      [tt('Arka kapıdan çık'), tt('Bugün uğraşma'), () => { cf(-3); return [tt('Güven −3')]; }]] },
    { p: 'doktor', i: 'plus', t: tt('Sakatlık krizi'), d: tt('Bir haftada üç oyuncu revire girdi. Kadro daraldı.'), o: [
      [tt('Takviye yap'), tt('Bütçeden gider'), () => { m.bud = Math.max(0, m.bud - nice(b * .35)); return [tt('Bütçe −') + fmtS(nice(b * .35))]; }],
      [tt('Altyapıdan tamamla'), tt('Bedava ama riskli'), () => (chance(.4) ? (up(.2), cf(2), [tt('Gençler şaşırttı'), tt('Takım gücü +0,2')]) : (up(-.6), [tt('Takım gücü −0,6')]))],
      [tt('İdare et'), tt('Kadro zayıflar'), () => { up(-.4); return [tt('Takım gücü −0,4')]; }]] },
    { p: 'basin', i: 'mic', t: tt('Mikrofonlar sende'), d: tt('Canlı yayında soru geldi: "Bu sezon hedef ne?"'), o: [
      [tt('Büyük konuş'), tt('Tutarsa alkış, tutmazsa yuh'), () => { cf(chance(.5) ? 5 : -4); return [tt('Söz ağızdan çıktı')]; }],
      [tt('Maç maç bakıyoruz'), tt('Güvenli cevap'), () => { cf(1); return [tt('Güven +1')]; }]] },
  ];
  return pick(list);
}
// Kenar kariyerinin özeti; kayıt silinmeden önce
export function mgrEnd() {
  const m = S.mgr, best = m.hist.length ? Math.min(...m.hist.map(h => h.pos)) : 0, tro = S.tro.filter(x => /teknik direktör|başkan|Teknik Direktörü/.test(x));
  const mt = meta(); mt.mgr = Math.max(mt.mgr || 0, m.hist.length); setMeta(mt);
  return { seasons: m.hist.length, best, tro, jobs: m.jobs, hist: m.hist, role: m.role };
}

// ---------- kadrolar: her kulübün isimli on biri ----------
export const SQP = ['KL', 'DF', 'DF', 'DF', 'DF', 'OS', 'OS', 'OS', 'KN', 'FV', 'FV'];
export function squad(id) {
  const q = S.sq || (S.sq = {});
  if (!q[id]) { const lid = leagueOf(id), c = lid ? LMAP[lid].c : pick(['EN', 'DE', 'NL']); q[id] = SQP.map(() => rname(c)); }
  const sc = S.sc[id]; if (sc) { if (sc[0]) q[id][9] = sc[0][0]; if (sc[1]) q[id][10] = sc[1][0]; }   // golcüler gol krallığı listesiyle aynı isimler
  return q[id];
}
export const sqName = (id, pos) => { const q = squad(id), ix = SQP.map((p, i) => (p === pos ? i : -1)).filter(i => i >= 0); return q[pick(ix)]; };
// Seninle karşı karşıya gelen oyuncularla hesabın: [kazandığın, kaybettiğin]
function duel(M, win) { if (!M.mark) return; const d = S.duel || (S.duel = {}), key = M.fxt.opp + ':' + M.mark, r = d[key] || (d[key] = [0, 0]); r[win ? 0 : 1]++; const ks = Object.keys(d); if (ks.length > 40) delete d[ks[0]]; }
export const duelOf = (n, id) => (S.duel || {})[id + ':' + n] || null;
function squadTurn() {   // her yaz kadrolardan birkaç isim değişir
  for (const id in S.sq) { const lid = leagueOf(id), c = lid ? LMAP[lid].c : 'EN'; for (let i = 0; i < 2; i++) if (chance(.6)) S.sq[id][ri(0, 8)] = rname(c); }
}
// Diğer kulüpler de alıp satar: güçleri değişir, haberi akışa düşer
function worldMoves(n, show) {
  const s = S, my = leagueOf(s.clubId), pro = Object.keys(s.lg).filter(l => !(LMAP[l].c === 'TR' && LMAP[l].tier >= tierCfg().loc)); let shown = 0;
  for (let i = 0; i < n; i++) {
    const lb = chance(.45) && pro.includes(my) ? my : pick(pro), B = pick(s.lg[lb].t); if (banned(B)) continue;
    const pool = []; for (const l of pro) for (const id of s.lg[l].t) if (id !== B && s.rt[id] < s.rt[B] + 2 && s.rt[id] > s.rt[B] - 14) pool.push(id);
    if (!pool.length) continue;
    const A = pick(pool), qa = squad(A), qb = squad(B), ia = ri(1, 10), nm = qa[ia], fee = nice(baseW(s.rt[A] + 4) * 280 * valF() * rnd(.6, 1.6));
    qa[ia] = rname(LMAP[leagueOf(A)].c); qb[ia] = nm;
    if (ia >= 9) { const k = ia - 9; if (s.sc[A] && s.sc[A][k]) s.sc[A][k] = [qa[ia], 0]; if (s.sc[B] && s.sc[B][k]) s.sc[B][k][0] = nm; }
    s.rt[B] = clamp(s.rt[B] + .3, 15, 94); s.rt[A] = clamp(s.rt[A] - .3, 15, 94);
    const mine = A === s.clubId || B === s.clubId;
    if (mine || shown < show) { shown++; addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${nm}, ${club(A).n} formasını bırakıp ${club(B).n} ile anlaştı. Bonservis ${fmtS(fee)}.`, mine ? 'manset' : 'haber'); }
    if (mine && !s.mgr) addNews(A === s.clubId ? tt`Takım arkadaşın ${nm}, ${club(B).n} takımına gitti.` : tt`Kulübün ${nm} ile anlaştı.`, 'swap');
  }
}

// ---------- kulüp krizleri ----------
export const CRN = { ceza: tt('Puan silme'), maas: tt('Maaş krizi'), yasak: tt('Transfer yasağı'), baskan: tt('Başkan değişimi') };
export const crisisOf = id => { const c = (S.cr || {})[id]; return c && c.until > absWeek() ? c : null; };
const banned = id => { const c = crisisOf(id); return !!c && c.k === 'yasak'; };
function crisisStep() {
  const s = S, my = leagueOf(s.clubId), pro = Object.keys(s.lg).filter(l => !(LMAP[l].c === 'TR' && LMAP[l].tier >= tierCfg().loc));
  const lid = chance(.5) && pro.includes(my) ? my : pick(pro), lg = s.lg[lid], id = pick(lg.t), c = club(id).n, k = wpick({ ceza: 3, maas: 4, yasak: 2, baskan: 3 }), now = absWeek(); let msg;
  if (crisisOf(id)) return;
  s.cr = s.cr || {};
  if (k === 'ceza') { const n = pick([3, 3, 6]); (lg.pen || (lg.pen = {}))[id] = (lg.pen[id] || 0) + n; s.cr[id] = { k, n, until: now + 20 }; msg = tt`${c} lisans kurallarını çiğnedi: ${n} puan silindi.`; }
  else if (k === 'maas') { s.rt[id] = clamp(s.rt[id] - 1.5, 15, 94); s.cr[id] = { k, until: now + 14 }; msg = tt`${c} maaşları ödeyemiyor. Oyuncular idmana çıkmadı.`; if (id === s.clubId && !s.mgr && s.con.wage >= 500) s.q.push({ id: 'maas', at: now }); }
  else if (k === 'yasak') { s.cr[id] = { k, until: now + WEEKS }; msg = tt`${c} transfer yasağı aldı: bir yıl oyuncu alamayacak.`; }
  else { s.rt[id] = clamp(s.rt[id] + pick([-1, 1, 1.5]), 15, 94); if (id !== s.clubId) delete s.co[id]; s.cr[id] = { k, until: now + 8 }; msg = tt`${c} kongresinde başkan değişti. Kulüpte yeni dönem.`; }
  addFeed('basin', tt('Saha Kenarı'), msg, lid === my ? 'manset' : 'haber');
  if (lid === my) addNews(msg, 'alert');
  if (id === s.clubId && s.mgr) s.mgr.conf = clamp(s.mgr.conf - 5, 0, 100);
}

// ---------- Konferans Ligi: eski kayıtlar için sezon ortasında kurulur ----------
function initKo() {
  const used = new Set([...S.cl.teams, ...S.el.teams]), q = euroQual().ko.filter(id => !used.has(id)), xs = XIDS.filter(id => !used.has(id));
  while (q.length < 32 && xs.length) q.push(xs.shift());
  S.ko = { key: 'ko', name: EUN.ko, weeks: S.cl.weeks, teams: shuffle(q), tb: {}, r: 0, alive: [], hist: [], champ: null, leg1: null };
  const wk = S.week;   // geçmiş haftaların maçları oynanmış sayılır
  while (!S.ko.champ && S.ko.weeks[S.ko.r] < wk) { S.week = S.ko.weeks[S.ko.r]; euroRound(null, 'ko'); }
  S.week = wk;
}

// ---------- tek maçlık kupalar: Süper Kupa (2. hafta) ve Kıtalararası Kupa (22. hafta) ----------
function xcInit(skc, clw) {
  const s = S; s.xc = [];
  if (skc) { const a = skc[0], b = skc[1] && skc[1] !== a ? skc[1] : skc[2]; if (s.clubId === a || s.clubId === b) s.xc.push({ k: 'sk', name: 'Süper Kupa', week: 2, opp: s.clubId === a ? b : a }); }
  if (clw && clw === s.clubId) s.xc.push({ k: 'dk', name: KW ? 'FIFA Kadınlar Şampiyonlar Kupası' : 'Kıtalararası Kupa', week: 22, opp: pick(WIDS) });
  for (const x of s.xc) addNews(tt`${x.name}: ${x.week}. haftada rakip ${club(x.opp).n}.`, 'trophy');
}
export function xcFixture() { const x = (S.xc || []).find(y => y.week === S.week && !y.done); return x ? { cup: true, key: 'xc', name: x.name, round: 'Final', opp: x.opp, home: true, final: true } : null; }
export const xcNext = () => (S.xc || []).filter(y => !y.done && y.week >= S.week);
function xcRound(own) {
  const x = (S.xc || []).find(y => y.week === S.week && !y.done); if (!x) return;
  x.done = 1; let us, op, win;
  if (own) { us = own.us; op = own.opp; win = own.win; } else { [us, op] = simScore(S.rt[S.clubId] - 2, S.rt[x.opp]); win = us > op || (us === op && chance(.5)); }
  if (win) { S.tro.push(seasonLabel() + ' · ' + x.name + (S.mgr ? (S.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : '')); S.money += nice(S.con.wage * 6); fx({ mo: 10, taraf: 8, rep: x.k === 'dk' ? 4 : 2 }); addNews(tt`${x.name} sizin! (${us}-${op})`, 'trophy'); }
  else addNews(tt`${x.name} ${club(x.opp).n} takımının oldu (${us}-${op}).`, 'trophy');
  addFeed('basin', tt('Saha Kenarı'), tt`${x.name}: ${club(win ? S.clubId : x.opp).n} kupayı kaldırdı.`, 'manset');
}

// ---------- mevki rakibi: aynı forma için yarıştığın takım arkadaşı ----------
function genRival(up) {
  const lid = leagueOf(S.clubId), c = lid ? LMAP[lid].c : 'TR', r = S.rt[S.clubId];
  S.rv = { n: rname(c), ovr: Math.round(clamp(up ? Math.max(r, OVR() - 1) + ri(0, 3) : r + ri(-3, 1), 12, 95)), inj: 0 };
}
function rivalTick() {
  const v = S.rv; if (!v || S.mgr) return;
  v.ovr = clamp(v.ovr + rnd(-.06, .1) + (S.rt[S.clubId] - v.ovr) * .01, 10, 96);
  v.f = +clamp(6.5 + (v.ovr - S.rt[S.clubId]) * .07 + randn() * .5, 4.8, 9).toFixed(1);   // rakibin son haftaki formu
  if (v.inj > 0) { v.inj--; if (!v.inj) addNews(tt`Mevki rakibin ${v.n} sahalara döndü.`, 'users'); }
  else if (chance(.012)) { v.inj = ri(2, 6); addNews(tt`Mevki rakibin ${v.n} sakatlandı: ${v.inj} hafta yok. Forma sana daha yakın.`, 'plus'); }
  if (S.week === 20 && OVR() - v.ovr > 6 && chance(.6)) { const old = v.n; genRival(true); addNews(tt`Kulüp mevkine takviye yaptı: ${old} gitti, ${S.rv.n} geldi (güç ${S.rv.ovr}).`, 'swap'); }
}
export const rivalInfo = () => (S.rv ? { ...S.rv, ovr: Math.round(S.rv.ovr), me: OVR(), ahead: OVR() >= S.rv.ovr } : null);

// ---------- sezon hedefleri ----------
const SGT = { g: n => tt`${n} gol at`, ga: n => tt`${n} gol ya da asist yap`, cs: n => tt`${n} maçı gol yemeden bitir` };
function newGoals() {
  const s = S, id = s.clubId, lid = leagueOf(id), R = rounds(lid), left = clamp((R - s.lg[lid].rd) / 34, .25, 1.15), d = OVR() - s.rt[id], r11 = (s.con.role || '11') === '11';
  const base = { FV: ['g', 9], KN: ['ga', 9], OS: ['ga', 7], DF: ['cs', 8], KL: ['cs', 9] }[s.pos];
  const t = [...s.lg[lid].t].sort((a, b) => s.rt[b] - s.rt[a]);
  s.sg = { k: base[0], n: Math.max(2, Math.round((base[1] + clamp(d * .6, -4, 8)) * (r11 ? 1 : .55) * left)), team: clamp(t.indexOf(id) + 2, 1, t.length), g0: s.st.g, a0: s.st.a, c0: s.st.cs };
}
const sgCur = (g, st) => (g.k === 'g' ? st.g - g.g0 : g.k === 'ga' ? st.g + st.a - g.g0 - g.a0 : st.cs - g.c0);
export function goalProg() {
  const g = S.sg; if (!g) return null;
  return { t: SGT[g.k](g.n), cur: Math.max(0, sgCur(g, S.st)), n: g.n, team: g.team, pos: table(leagueOf(S.clubId)).findIndex(r => r.id === S.clubId) + 1 };
}
function goalEnd(st, pos, lines) {
  const g = S.sg; if (!g) return; const cur = Math.max(0, sgCur(g, st));
  if (cur >= g.n) { const b = nice(S.con.wage * 8); S.money += b; S.con.wage = nice(S.con.wage * 1.08); fx({ hoca: 6 }); lines.push(tt`Kişisel hedef tuttu (${cur}/${g.n})` + (b ? tt`: prim ${fmt(b)}, ücrete %8 zam` : '')); }
  else if (cur < g.n * .5 && st.apps >= 10) { fx({ hoca: -6 }); lines.push(tt`Kişisel hedef kaçtı (${cur}/${g.n}): yönetim memnun değil`); }
  else lines.push(tt`Kişisel hedef: ${cur}/${g.n}`);
  if (pos <= g.team) { const b = nice(S.con.wage * 4); S.money += b; fx({ taraf: 3 }); lines.push(tt`Takım hedefi tuttu: ${pos}. sıra (hedef ${g.team}.)` + (b ? tt` · prim ${fmt(b)}` : '')); }
}

// ---------- hava ve zemin ----------
function wxFor(nat) {
  const w = S.week, lid = nat || !S.clubId ? null : leagueOf(S.clubId), L = lid ? LMAP[lid] : null, winter = w >= 14 && w <= 26, warm = !!L && (L.c === 'SA' || L.c === 'ES' || L.c === 'PT');
  let k = wpick({ acik: 50, yagmur: winter ? 26 : 12, ruzgar: 10, sicak: w <= 4 || w >= 35 || (L && L.c === 'SA') ? 22 : 0, kar: winter && !warm ? 7 : 0 });
  if (k === 'yagmur' && L && L.c === 'TR' && L.tier >= tierCfg().loc) k = 'camur';   // amatörde yağmur demek çamur demek
  return k;
}
// Eleme maçında 90 dakika eşit biterse: uzatmalar. Sahadaysan bir "kader anı" seni bulur.
export function extraTime(M) {
  const out = [{ min: 91, t: 'txt', s: tt('Uzatmalar başladı. Bacaklar ağır, kafalar yorgun.') }];
  for (let i = poisson(clamp((M.lu || 1) * .3, .05, 1.5)); i > 0; i--) out.push({ min: ri(93, 119), t: 'bg', us: true });
  for (let i = poisson(clamp((M.lo || 1) * .3, .05, 1.5)); i > 0; i--) out.push({ min: ri(93, 119), t: 'bg', us: false });
  if ((M.role === '11' || M.role === 'yedek') && !M.red && !M.off) out.push({ min: ri(101, 117), t: 'mom', k: wpick(momW(M.tac, M.scn)), kader: 1 });
  M.et = 1;
  return out.sort((a, b) => a.min - b.min);
}

// ---------- yatırımlar ----------
export const invTotal = () => Object.values(S.inv || {}).reduce((a, b) => a + b, 0);
export function invest(k, amt) { if (!INV[k] || amt <= 0 || S.money < amt) return false; S.money -= amt; S.inv[k] = (S.inv[k] || 0) + amt; return true; }
export function divest(k) { const v = Math.round((S.inv || {})[k] || 0); if (!v) return 0; S.money += v; S.inv[k] = 0; return v; }
function invStep() {
  const inv = S.inv || (S.inv = {}), safe = has('musavir');
  for (const k in inv) {
    if (!inv[k] || !INV[k]) continue;
    let r = INV[k][2] + randn() * INV[k][3]; if (r < 0 && safe) r *= .5;   // mali müşavir kayıpları yarıya indirir
    if (k === 'isl' && !safe && chance(.004)) { addNews(tt`Ortağın işletmeyi batırdı: ${fmt(inv[k] * .7)} gitti.`, 'alert'); r = -.7; }
    else if (r <= -.18) addNews(tt`${INV[k][0]} sert düştü: yatırımın %${Math.round(-r * 100)} eridi.`, 'chart');
    else if (r >= .22) addNews(tt`${INV[k][0]} uçtu: yatırımın %${Math.round(r * 100)} değerlendi.`, 'chart');
    inv[k] = Math.max(0, Math.round(inv[k] * (1 + r)));
  }
}

// ---------- menajer değiştirme ----------
export function agentList() { return AGENTS.map((a, i) => ({ ...a, i, cur: !!S.agent && S.agent.n === a.n, ok: S.rep >= (a.rep || 0), fee: S.agent ? nice(Math.max(1000, S.con.wage * 4)) : 0 })); }
export function setAgent(i) {
  const a = AGENTS[i]; if (!a || S.rep < (a.rep || 0) || (S.agent && S.agent.n === a.n)) return null;
  const fee = S.agent ? nice(Math.max(1000, S.con.wage * 4)) : 0; if (S.money < fee) return null;
  const old = S.agent; S.money -= fee; S.agent = { ...a };
  addNews(old ? tt`${old.n} ile yollarını ayırdın. Yeni menajerin ${a.n}.` : tt`${a.n} artık menajerin.`, 'pen');
  return { fee, old };
}
export const kidAge = () => (S.kid ? S.season - S.kid.born : 0);

// ---------- lig seviyesi, maçın havası, an çeşitlemeleri ----------
// Lig yükseldikçe her an zorlaşır: en zayıf lig 0,86, en güçlü lig 1,18; Avrupa ve milli turnuvalar daha da sert.
export function leagueHard(fxt) {
  if (fxt && fxt.nat) return fxt.tour ? 1.16 : fxt.q ? 1.1 : 1.02;
  if (!S.clubId) return .88;
  const av = Object.keys(S.lg).map(l => lavg(l)), mn = Math.min(...av), mx = Math.max(...av), me = lavg(leagueOf(S.clubId));
  return +(0.86 + (mx > mn ? (me - mn) / (mx - mn) : .5) * .32 + (fxt && fxt.eu ? { cl: .07, el: .05, ko: .03 }[fxt.eu] : 0)).toFixed(3);
}
export const hardStars = h => clamp(Math.round((h - .86) / .32 * 4) + 1, 1, 5);
// Her maçın bir havası olur: güç farkı, derbi, hava ve şans belirler
function pickScn(usR, oppR, derby, wx, fxt) {
  const d = oppR - usR, big = derby || !!fxt.final || !!fxt.po || (!!fxt.cup && !fxt.lg);
  return wpick({ denge: 4, acik: 3, kilit: 2 + (big ? 3 : 0), pres: 2 + (d > 3 ? 2 : 0), duran: 2 + (wx === 'ruzgar' || wx === 'yagmur' || wx === 'camur' ? 2 : 0), kontra: 2 + (d < -3 || fxt.home === false ? 1.5 : 0), kusatma: d > 4 ? 4 : .5, duello: fxt.nat ? 0 : 1.5 + (OVR() > usR + 2 ? 2 : 0) });
}
// Bu an hangi koşulda geliyor? e.v bir kez belirlenir: çeşitleme anahtarı ya da null
export function momVar(M, e, k) {
  if (e.v !== undefined && e.vk === k) return e.v;
  const hot = (SCN[M.scn] || {}).vars || [], w = {};
  for (const id in MVAR) { const V = MVAR[id]; if (V.k.includes(k) && (!V.from || e.min >= V.from)) w[id] = id === 'sondk' ? 4 : hot.includes(id) ? 3 : 1; }
  e.vk = k; e.v = Object.keys(w).length && chance(hot.some(x => w[x]) ? .72 : .5) ? wpick(w) : null;
  return e.v;
}

// ---------- piyasa profili: kulüpler seni gücünle değil, gördükleriyle tartar ----------
// lvl: algılanan seviye (güç + form + gol krallığı + genç yetenek primi + itibar). lo-hi: seni isteyebilecek kulüplerin güç aralığı
export function profile() {
  const s = S, o = OVR(), st = s.st, lid = leagueOf(s.clubId), avg = st.apps >= 4 ? st.rs / st.apps : (s.lastAvg || 6.5);
  const rank = scorers(lid).findIndex(x => x.me) + 1, top = st.lg >= 4 && rank > 0 && rank <= 3 ? (rank === 1 ? 4 : 2) : 0;
  const young = s.age <= 21 ? clamp((s.pot - o) * .3, 0, 6) : 0;
  const bench = s.week >= 10 && st.apps < s.week * .25;   // forma giymeyenin piyasası düşer
  const form = bench ? -3 : clamp((avg - 6.8) * 5, -5, 5) * clamp((st.apps || (s.week < 4 ? 8 : 2)) / 8, .3, 1);
  const lvl = o + form + top + young + s.rep / 25;
  const tag = form <= -3 ? 'formsuz' : s.age <= 21 && young >= 3 && avg >= 6.9 ? 'genc' : top >= 4 || avg >= 7.6 ? 'yildiz' : form >= 2 ? 'yukselen' : 'duzenli';
  return { lvl, avg, rank: top ? rank : 0, young, form, tag, lo: lvl - 7, hi: Math.min(lvl + 4, o + 8 + (young >= 3 ? 3 : 0)) + (s.agent ? s.agent.pw * 3 : 0),   // algı ne olursa olsun gücünden çok uzağa sıçrayamazsın
    bench, abroad: s.rep >= 40 || (tag === 'genc' && s.rep >= 20) || (top >= 4 && LMAP[lid].tier === 1) };
}
// Menajerin ayda bir kapı çalar: ulaşabildiği en iyi kulüplerden birini radarına sokar
function agentStep(P) {
  const s = S, a = s.agent; if (!chance(clamp(a.pw * .55 + .08, .1, .8)) || P.form < -1) return;
  const cur = s.rt[s.clubId], pool = [];
  for (const lid in s.lg) { if (LMAP[lid].c !== 'TR' && !P.abroad) continue; for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id !== s.clubId && !banned(id) && r >= Math.max(cur + 1, P.lvl - 3) && r <= P.hi + 2) pool.push(id); } }
  if (!pool.length) return;
  const id = pick(pool), w = s.watch.find(x => x.id === id), up = ri(12, 22) + Math.round(a.pw * 8);
  if (w) w.lv = clamp(w.lv + up, 0, 100); else s.watch.push({ id, lv: clamp(18 + up, 0, 100) });
  addNews(tt`Menajerin ${a.n}, ${club(id).n} ile görüştü. Kulüp seni yakından izleyecek.`, 'pen');
  addFeed('basin', tt('Transfer Hattı'), tt`${club(id).n}, ${s.name} için menajeriyle temasta.`, 'haber');
}

// ---------- mağaza kademeleri ve kademeli yatırımlar ----------
export const shopTier = () => (!SHOP.filter(i => i.p && !i.t2).every(i => has(i.id)) ? 1 : SHOP.filter(i => i.t2).every(i => has(i.id)) ? 3 : 2);
export const upLvl = id => (S.up || {})[id] || 0;
export const upCost = id => { const u = UPG.find(x => x.id === id); return nice(u.base * Math.pow(u.k, upLvl(id))); };
export const upOpen = u => !u.need || shopTier() >= u.need;
export function buyUp(id) {
  const u = UPG.find(x => x.id === id), c = upCost(id); if (!u || !upOpen(u) || upLvl(id) >= u.max || S.money < c) return null;
  S.money -= c; (S.up || (S.up = {}))[id] = upLvl(id) + 1;
  return id === 'vakif' ? fx({ rep: 1.5, taraf: 5, basin: 6, aile: 3 }) : [];
}

// ---------- ücretli seanslar ----------
export const sessCost = x => nice(Math.max(x.min, wref() * x.c));
export const sessUsed = id => S.ssw === absWeek() && (S.ssu || []).includes(id);
export function session(id) {
  const x = SESS.find(y => y.id === id), c = sessCost(x); if (!x || sessUsed(id) || S.money < c || (id === 'ozel' && S.inj > 0)) return null;
  if (S.ssw !== absWeek()) { S.ssw = absWeek(); S.ssu = []; }
  S.ssu.push(id); S.money -= c;
  const keys = Object.keys(POS[S.pos].w).slice(0, 2);
  switch (id) {
    case 'ozel': { if (S.pos2) S.pos2.x = Math.min(100, S.pos2.x + 6); const g = keys.map(k => `${ATTR[k]} +${grow(k, .22).toFixed(2).replace('.', DSEP)}`); return [tt('Özel hocayla bire bir çalıştın.'), [...g, ...fx({ en: -5 })]]; }
    case 'analiz': S.fl.prep = absWeek(); return [tt('Rakibin son üç maçını izledin. Kim nereye koşuyor, artık biliyorsun.'), [tt('Sıradaki maç: anlar kolaylaşır')]];
    case 'mental': grow('zihin', .12); return [tt('Kafandaki gürültü azaldı.'), fx({ mo: 8 })];
    case 'fizik': return [tt('Buz banyosu, masaj, erken uyku.'), fx({ en: 18 })];
  }
  return null;
}

// ---------- gelişim: odak, akıl hocası, döküm ----------
export const mentor = () => (S.mates || []).find(m => (m.r === MROLE[0] || m.r === MROLE[2]) && m.b >= 60) || null;
export function setFocus(k) { S.dfocus = k && k in S.at ? k : null; }
export function devInfo() {
  const s = S, m = mentor();
  return { age: ageF(), fac: facF(facOf(s.clubId)), gear: 1 + eff('tr'), mentor: m, trait: TRAITS[s.trait].tr || 1, focus: s.dfocus || null, pot: s.pot,
    total: ageF() * facF(facOf(s.clubId)) * (1 + eff('tr')) * (m ? 1.1 : 1) * (TRAITS[s.trait].tr || 1) };
}

// Kulübün ligdeki yeri: maç kartında rakibin kaçıncı olduğunu göstermek için
export function standing(id) {
  const lid = leagueOf(id); if (!lid) return null;
  const tb = table(lid), i = tb.findIndex(r => r.id === id);
  return i < 0 ? null : { pos: i + 1, pts: tb[i].pts, p: tb[i].p, n: tb.length, lid, lname: LMAP[lid].name };
}

// =====================================================================
// Yeni katman: oyun rolü, duran toplar, ikinci mevki, pazarlık, kamp, senaryolar,
// koleksiyon, krampon sponsoru, gazete, soyunma odası, derbi karnesi, menajer sohbeti
// =====================================================================
const fmtR = v => v.toFixed(1).replace('.', DSEP);
const refPn = r => (r ? (r.pn ??= +rnd(.1, .9).toFixed(2)) : .5);   // hakemin penaltıya eli ne kadar yatkın

// ---------- devre arası: hocanın ikinci yarı isteği ----------
const HTA = {
  gol: { t: tt('İkinci yarıda bir gol istiyorum'), mom: 'sut', ok: (M, b) => M.pg > b.pg },
  katki: { t: tt('Bir gole imzanı at: gol ya da asist'), mom: 'pas', ok: (M, b) => M.pg + M.pa > b.pg + b.pa },
  pas: { t: tt('Topu sakla: iki isabetli pas daha'), mom: 'pas', ok: (M, b) => M.cnt.pas >= b.pas + 2 },
  kap: { t: tt('Bir top daha kap'), mom: 'savunma', ok: (M, b) => M.cnt.sav > b.sav },
  kale: { t: tt('Bu yarıda gol yemeyeceğiz'), mom: null, ok: (M, b) => M.oppG <= b.og },
  kurt: { t: tt('Bir kurtarış daha çıkar'), mom: 'kurtaris', ok: (M, b) => M.cnt.kurt > b.kurt },
};
export function htTalk(M) {
  if (M.ht) return M.ht;
  const d = M.usG - M.oppG, cold = M.rt < 6.2 && M.mom >= 1, hot = M.rt >= 7.1;
  const k = pick({ FV: ['gol', 'katki'], KN: ['katki', 'gol', 'pas'], OS: ['pas', 'katki', 'kap'], DF: ['kale', 'kap'], KL: ['kale', 'kurt'] }[S.pos]);
  const line = cold ? pick([tt('"Seni sahada göremiyorum. İkinci yarıda başka birini izlemek istiyorum."'), tt('"İlk yarıyı unut. Şimdi çık ve oyna."')])
    : hot ? pick([tt('"Aynen böyle devam. Maçı sen taşıyorsun."'), tt('"İlk yarının en iyisi sendin. Bırakma."')])
    : d < 0 ? tt('"Gerideyiz ama panik yok. Herkes işini yapsın."') : d > 0 ? tt('"Öndeyiz diye gevşemek yok."') : tt('"Maç ortada. Küçük şeyler belirleyecek."');
  M.ht = { k, cold, hot, line, ask: HTA[k].t, base: { pg: M.pg, pa: M.pa, pas: M.cnt.pas, sav: M.cnt.sav, kurt: M.cnt.kurt, og: M.oppG } };
  return M.ht;
}
const htOk = M => !!M.ht && HTA[M.ht.k].ok(M, M.ht.base);

// ---------- duran top hiyerarşisi ----------
// Her kulübün sezonluk bir ustası var; özelliklerin onu geçerse (ya da hoca izin verirse) top senin
const SPK = { pen: [tt('Penaltı'), 9], fk: [tt('Frikik'), 6], cor: [tt('Korner'), 8] };
export function setPieces() {
  const a = S.at, id = S.clubId, b = S.spb || {}, out = {};
  const my = { pen: a.sut * .5 + a.zihin * .5, fk: a.sut * .4 + a.teknik * .6, cor: a.pas * .6 + a.teknik * .4 };
  for (const k in SPK) {
    const mate = S.rt[id] + 3 + hsh(id + k + S.season) % 7, mine = my[k] + (b[k] || 0);
    out[k] = { k, n: SPK[k][0], who: squad(id)[SPK[k][1]], mate: Math.round(mate), mine: Math.round(mine), me: S.pos !== 'KL' && mine >= mate };
  }
  return out;
}
export const spWait = () => Math.max(0, (S.cd.sp || 0) - absWeek());
export function spAsk(k) {
  const sp = setPieces()[k]; if (!sp || sp.me || S.pos === 'KL' || spWait() > 0) return null;
  S.cd.sp = absWeek() + 5;
  const p = clamp(.2 + (S.rel.hoca - 50) / 120 + (sp.mine - sp.mate) / 12 + (S.fl.kaptan ? .15 : 0), .04, .85);
  if (chance(p)) { const b = S.spb || (S.spb = {}); b[k] = (b[k] || 0) + (sp.mate - sp.mine) + 1.5; return [tt`Hoca kabul etti: bu sezon ${sp.n.toLocaleLowerCase(LC)} senin.`, true]; }
  fx({ hoca: -1.5 });
  return [tt`Hoca istemedi: "${sp.who} bu işin ustası. Antrenmanda göster, konuşuruz."`, false];
}

// ---------- oyun rolü ----------
export const curRole = () => (PROLE[S.pos] || []).find(r => r.id === S.prole) || null;
export const roleWait = () => (S.prole ? Math.max(0, (S.prw || 0) + 4 - absWeek()) : 0);
export const roleList = () => (PROLE[S.pos] || []).map(r => ({ ...r, cur: S.prole === r.id, fit: (r.tac || []).includes(coach().st) }));
export function setRole(id) {
  if (roleWait() > 0) return false;
  S.prole = (PROLE[S.pos] || []).some(r => r.id === id) ? id : null; S.prw = absWeek();
  return true;
}

// ---------- ikinci mevki ----------
const PADJ = { FV: ['KN', 'OS'], KN: ['FV', 'OS', 'DF'], OS: ['KN', 'DF', 'FV'], DF: ['OS', 'KN'], KL: [] };
export const ovrAs = p => { const w = POS[p].w; let s = 0; for (const k in w) s += S.at[k] * w[k]; return Math.round(s); };
export function pos2Info() {
  const kn = S.posx || [], opts = S.pos === 'KL' ? [] : Object.keys(POS).filter(p => p !== 'KL' && p !== S.pos && !kn.includes(p));
  return { cur: S.pos2 ? { ...S.pos2, n: POS[S.pos2.p].n } : null, opts: opts.map(p => ({ p, n: POS[p].n, near: PADJ[S.pos].includes(p), ovr: ovrAs(p) })), known: kn.map(p => ({ p, n: POS[p].n, ovr: ovrAs(p) })), wait: Math.max(0, (S.posw || 0) + 8 - absWeek()), me: OVR() };
}
export function learnPos(p) {
  if (S.pos === 'KL' || p === 'KL' || p === S.pos || !POS[p] || (S.posx || []).includes(p)) return false;
  S.pos2 = { p, x: S.pos2 && S.pos2.p === p ? S.pos2.x : 0 };
  return true;
}
export function switchPos(p) {
  if (!(S.posx || []).includes(p) || (S.posw || 0) + 8 > absWeek()) return false;
  S.posx = S.posx.filter(x => x !== p).concat(S.pos); S.pos = p; S.prole = null; S.posw = absWeek(); S.adapt = Math.max(S.adapt || 0, 3);
  if (S.dfocus && !POS[p].w[S.dfocus]) S.dfocus = null;
  genRival(); if (!S.mgr) newGoals();
  addNews(tt`Artık ${POS[p].n.toLocaleLowerCase(LC)} oynuyorsun. Hoca seni yeni yerinde deneyecek.`, 'swap');
  return true;
}

// ---------- antrenman serisi: üç tekrar, isabet sayısı verimi belirler ----------
export function drillEnd(tid, hits) {
  const d = S.drill || (S.drill = {}), r = d[tid] || (d[tid] = { b: 0, n: 0 }), rec = hits > r.b;
  r.b = Math.max(r.b, hits); r.n++;
  if (hits >= 3) fx({ hoca: 1 });
  return { mult: [.7, 1.1, 1.5, 2][clamp(hits, 0, 3)], rec, best: r.b };
}

// ---------- haftalık ve sezonluk işler ----------
function plusWeek() {
  const s = S, R = s.rec || (s.rec = {});
  if (s.pos2 && s.inj <= 0) {
    s.pos2.x = Math.min(100, s.pos2.x + (1.5 + s.at.zihin / 60) * (PADJ[s.pos].includes(s.pos2.p) ? 1.3 : .8));
    if (s.pos2.x >= 100) { const p = s.pos2.p; (s.posx || (s.posx = [])).push(p); s.pos2 = null; s.pop.push(tt('Yeni mevki öğrenildi')); addNews(tt`${POS[p].n} mevkisini öğrendin. Kariyer > Profil'den asıl mevkini değiştirebilirsin.`, 'up'); }
  }
  const L = s.lr || (s.lr = { ten: 15 }), lm = s.lastM;
  L.ten = clamp(L.ten - .9 + (lm && lm.w === absWeek() ? (lm.us < lm.og ? 3 : lm.us > lm.og ? -2 : 0) : 0) + (s.rel.takim < 30 ? 1.5 : 0), 0, 100);
  if (L.ten >= 70 && !s.q.some(q => q.id === 'lr_patla') && (s.cd.lr_patla || 0) <= absWeek()) s.q.push({ id: 'lr_patla', at: absWeek() + 1 });
  if (s.fl.pc) s.rel.hoca = Math.max(s.rel.hoca, 55);
  if (s.week % 4 === 0) R.val = Math.max(R.val || 0, value());
}
function plusSeason(st, avg, pos, moved, lines) {
  const s = S, R = s.rec || (s.rec = {}), y = seasonLabel();
  if (st.g > (R.g || 0)) { R.g = st.g; R.gy = y; }
  if (st.a > (R.a || 0)) { R.a = st.a; R.ay = y; }
  if (st.apps >= 10 && avg > (R.avg || 0)) { R.avg = +avg.toFixed(2); R.avgy = y; }
  const sc = s.scn;
  if (sc && !sc.done && sc.s === s.season) {   // senaryo hedefi ilk sezonun sonunda tartılır
    const X = SCENS.find(x => x.id === sc.id), ok = sc.id === 'kurtar' ? moved !== -1 : sc.id === 'donus' ? st.apps >= 15 && avg >= 7 : pos === 1 || (st.apps >= 15 && avg >= 7.2);
    sc.done = ok ? 1 : -1;
    if (ok) { const b = nice(Math.max(50000, s.con.wage * 20)); s.money += b; fx({ rep: 5, taraf: 8 }); unlock('sc_' + sc.id); lines.push(tt`Senaryo tamam: ${X.n} · ödül ${fmt(b)}`); const m = meta(); (m.sc || (m.sc = {}))[sc.id] = 1; setMeta(m); }
    else lines.push(tt`Senaryo hedefi tutmadı: ${X.g}`);
  }
  const b = s.boot;
  if (b) {
    if (b.tgt) { const cur = Math.max(0, sgCur(b.tgt, st)); if (cur >= b.tgt.n) { s.money += b.bon; lines.push(tt`${b.n} hedef primi: ${fmt(b.bon)} (${cur}/${b.tgt.n})`); } else lines.push(tt`${b.n} hedefi kaçtı (${cur}/${b.tgt.n}): prim yok`); }
    else lines.push(tt`${b.n} ile krampon anlaşman bitti.`);
    s.boot = null;
  }
  if (s.con.loy && s.con.until > s.season && !s.loan) { s.money += s.con.loy; lines.push(tt`Sadakat primi: ${fmt(s.con.loy)}`); }
  for (const c of s.col || []) c.v = nice(c.v * rnd(1, 1.09));
  for (const k in s.spb || {}) s.spb[k] = Math.max(0, s.spb[k] * .5);
  if (s.fl.pc) s.at.zihin = clamp(s.at.zihin + .4, 1, 99);
  s.camp = null;
}

// ---------- sözleşme pazarlığı: madde madde, kulübün sabrı sınırlı ----------
export const negoInfo = o => o.ng || (o.ng = { pat: clamp(2 + Math.round((S.agent ? S.agent.pw : 0) * 2), 2, 4), n: 0, got: {} });
export function negoAsk(o, k) {
  const g = negoInfo(o); if (g.got[k] || g.pat <= 0 || g.end) return null;
  const base = { wage: .5, sign: .58, goalB: .7, rel: .45, img: .48, loy: .5, kisa: .8 }[k]; if (base == null) return null;
  const p = clamp(base + (S.agent ? S.agent.pw * .22 : -.06) + (profile().lvl - o.r) * .03 - g.n * .17 + (o.renew ? .06 : 0), .06, .92);
  g.n++; o.neg = true;
  if (chance(p)) {
    g.got[k] = 1;
    if (k === 'wage') { o.wage = nice(o.wage * 1.12); return { ok: 1, text: tt`Kabul: haftalık ücret ${fmt(o.wage)} oldu.` }; }
    if (k === 'sign') { o.sign = nice(o.sign * 1.35); return { ok: 1, text: tt`Kabul: imza parası ${fmt(o.sign)} oldu.` }; }
    if (k === 'goalB') { o.goalB = nice(Math.max(o.goalB * 2, o.wage * .3)); return { ok: 1, text: tt`Kabul: gol başına ${fmt(o.goalB)}.` }; }
    if (k === 'rel') { o.relF = 2.4; return { ok: 1, text: tt('Kabul: serbest kalma bedelin düşük tutulacak.') }; }
    if (k === 'img') { o.img = 1; return { ok: 1, text: tt('Kabul: imaj hakların sende. Sponsor gelirin %25 artar.') }; }
    if (k === 'loy') { o.loy = nice(o.wage * 6); return { ok: 1, text: tt`Kabul: kulüpte kaldığın her sezon sonunda ${fmt(o.loy)}.` }; }
    o.len = Math.max(1, o.len - 1); return { ok: 1, text: tt`Kabul: sözleşme ${o.len} sezon.` };
  }
  g.pat--;
  if (g.pat <= 0) { g.end = 1; if (!o.renew && chance(.35)) return { gone: 1, text: tt('Kulüp masadan kalktı. Teklif geri çekildi.') }; return { ok: 0, text: tt('"Son sözümüz bu." Kulüp başka madde konuşmayacak.') }; }
  return { ok: 0, text: pick([tt('"Bu maddede esneyemeyiz."'), tt('"Bütçemiz bu kadar."'), tt('"Bunu başkana kabul ettiremem."')]) + ' ' + tt`Kalan sabır: ${g.pat}.` };
}

// ---------- sezon öncesi kamp ----------
export function campPick(k) {
  const s = S; s.camp = { k, s: s.season, pre: 0 };
  if (k === 'tek') return Object.keys(POS[s.pos].w).slice(0, 2).map(a => `${ATTR[a]} +${grow(a, .7).toFixed(2).replace('.', DSEP)}`);
  if (k === 'bag') { for (const m of s.mates) m.b = clamp(m.b + 8, 0, 100); tenAdj(-12); return fx({ takim: 6 }); }
  return [k === 'kon' ? tt('Sezon boyunca haftalık enerji +3') : tt('Bu sezon taktik uyumu +8')];
}
export function campFixture() {
  const s = S, r = s.rt[s.clubId], pool = [];
  for (const lid in s.lg) for (const id of s.lg[lid].t) if (id !== s.clubId && Math.abs(s.rt[id] - r) <= 6) pool.push(id);
  return pool.length ? pick(pool) : null;
}
export function campMatch(played, good) {
  const s = S; if (!s.camp) return [];
  if (!played) return fx({ en: 8 });
  if (good) { s.camp.pre = (s.camp.pre || 0) + 3; return [...fx({ hoca: 3, mo: 3 }), tt('İlk haftalarda forma şansın artar')]; }
  return fx({ hoca: -1 });
}

// ---------- senaryolu başlangıç ----------
export function newScenario(o) {
  newCareer({ ...o, wait: true });
  const s = S, t1 = [...s.lg.tr1.t].sort((a, b) => s.rt[a] - s.rt[b]), sc = o.sc;
  const id = sc === 'kurtar' ? t1[0] : sc === 'donus' ? t1[Math.floor(t1.length / 2)] : t1[t1.length - 2];
  if (sc === 'kurtar') s.rt[id] -= 2.5;   // kadro yazın dağıldı: takım kâğıt üstünde ligin açık ara en zayıfı
  const age = sc === 'kurtar' ? 24 : sc === 'donus' ? 27 : 35, tgt = s.rt[id] + (sc === 'sondans' ? 0 : sc === 'kurtar' ? 3 : 2);
  for (let i = 0; i < 400 && OVR() < tgt; i++) for (const k in s.at) if (k !== 'kaleci' || s.pos === 'KL') s.at[k] = clamp(s.at[k] * 1.008 + .05, 1, 97);
  s.age = age; s.pot = clamp(Math.max(s.pot, Math.round(tgt) + (age < 26 ? 5 : 1)), 60, 97);
  delete s.fl.okul; s.fl.diploma = 1; s.egt = 60; s.dil = Math.max(s.dil, 20);
  s.rep = sc === 'kurtar' ? 28 : sc === 'donus' ? 45 : 68; s.fol = Math.round((sc === 'kurtar' ? 40000 : sc === 'donus' ? 400000 : 2500000) * (KW ? .35 : 1));
  s.money = nice((sc === 'kurtar' ? 600000 : sc === 'donus' ? 4000000 : 30000000) * (KW ? .2 : 1));
  if (sc === 'sondans') { s.rel.par = 70; s.fl.evli = 1; }
  s.scn = { id: sc, s: 1 }; s.rival.ovr = OVR() + ri(-1, 4); s.rival.pot = Math.max(s.rival.pot, s.rival.ovr + 2);
  signFirst({ id, role: '11', len: sc === 'sondans' ? 1 : 2 });
  s.rel.hoca = sc === 'donus' ? 48 : 60; s.rel.taraf = sc === 'sondans' ? 70 : 45;
  if (sc === 'donus') { s.inj = 8; s.fl.kronik = 1; s.at.hiz = clamp(s.at.hiz - 5, 1, 99); addNews(tt('Dizin hâlâ sargıda. Sekiz hafta sonra sahadasın.'), 'plus'); }
  s.peak = OVR(); save();
}
export function scenInfo() {
  const sc = S.scn; if (!sc || S.mgr) return null;
  const X = SCENS.find(x => x.id === sc.id), st = S.st, lid = leagueOf(S.clubId), tb = table(lid), pos = tb.findIndex(r => r.id === S.clubId) + 1, z = zones(lid);
  const av = st.apps ? (st.rs / st.apps).toFixed(2).replace('.', DSEP) : '–';
  const prog = sc.id === 'kurtar' ? tt`${pos}. sıra · düşme hattı ${tb.length - z.down + 1}. sıradan başlıyor` : sc.id === 'donus' ? tt`${st.apps}/15 maç · ortalama ${av}` : tt`${pos}. sıra · ${st.apps}/15 maç · ortalama ${av}`;
  return { id: sc.id, n: X.n, g: X.g, i: X.i, done: sc.done || 0, prog, live: sc.s === S.season && !sc.done };
}

// ---------- koleksiyon ----------
export function colOffer() {
  const s = S; if (shopTier() < 3) return [];
  if (!s.colS || s.colS.s !== s.season) {
    s.colS = { s: s.season, it: Object.keys(COLK).map(k => { const own = (s.col || []).filter(c => c.k === k), free = COLK[k].l.map((_, i) => i).filter(i => !own.some(c => c.li === i)); return { k, li: free.length ? pick(free) : ri(0, COLK[k].l.length - 1), p: nice(COLK[k].base * rnd(.8, 1.3) * Math.pow(1.1, own.length)) }; }) };
  }
  return s.colS.it;
}
export function buyCol(i) {
  const it = colOffer()[i]; if (!it || it.own || S.money < it.p) return null;
  S.money -= it.p; it.own = 1; (S.col || (S.col = [])).push({ k: it.k, li: it.li, p: it.p, v: it.p, y: seasonLabel() });
  if (S.col.length >= 6) unlock('koleksiyon');
  return fx({ rep: .6, mo: 3, fol: Math.round(400 + S.fol * .008) });
}
export function sellCol(i) { const c = (S.col || [])[i]; if (!c) return 0; const v = nice(c.v * .93); S.money += v; S.col.splice(i, 1); return v; }
export const colValue = () => (S.col || []).reduce((a, c) => a + c.v, 0);

// ---------- krampon sponsoru ----------
export function bootMake(hedef) {
  const s = S, base = nice(Math.max(800, s.con.wage * .12 + s.fol * .015)), k = { FV: 'g', KN: 'ga', OS: 'ga', DF: 'cs', KL: 'cs' }[s.pos], n0 = s.sg ? s.sg.n : 6;
  return hedef ? { wk: nice(base * .5), tgt: { k, n: Math.max(3, Math.round(n0 * 1.15)), g0: s.st.g, a0: s.st.a, c0: s.st.cs }, bon: nice(base * 38 * 1.3) } : { wk: base, tgt: null, bon: 0 };
}
export const bootGoal = t => SGT[t.k](t.n);
export function bootInfo() {
  const b = S.boot; if (!b) return null;
  return { n: b.n, wk: b.wk, bon: b.bon, t: b.tgt ? bootGoal(b.tgt) : '', cur: b.tgt ? Math.max(0, sgCur(b.tgt, S.st)) : 0, need: b.tgt ? b.tgt.n : 0 };
}

// ---------- haftalık gazete ----------
export function paper() {
  const s = S, lid = leagueOf(s.clubId), L = LMAP[lid], tb = table(lid), pos = tb.findIndex(r => r.id === s.clubId) + 1;
  const lm = s.lastM && s.lastM.w >= absWeek() - 1 ? s.lastM : null, R = srnd(hsh('gz' + absWeek() + s.name)), rp = a => a[Math.floor(R() * a.length)];
  const me = s.name, ME = me.toLocaleUpperCase(LC), cn = club(s.clubId).n, CN = cn.toLocaleUpperCase(LC);
  let head, sub, mood = 0;
  if (lm) {
    const on = club(lm.opp).n, sc = `${lm.us}-${lm.og}`, nt = fmtR(lm.rt);
    if (lm.pg >= 3) { head = tt`${ME} ŞOV YAPTI`; sub = tt`${on} karşısında hat-trick. Skor ${sc}, maç notu ${nt}.`; mood = 1; }
    else if (lm.derby && lm.us > lm.og) { head = tt`DERBİ ${CN} TAKIMININ`; sub = tt`${on} ${sc} yenildi. ${me} ${nt} notla oynadı.`; mood = 1; }
    else if (lm.rt >= 8) { head = tt`GECENİN YILDIZI ${ME}`; sub = tt`${on} maçında ${lm.pg} gol, ${lm.pa} asist. Maç notu ${nt}.`; mood = 1; }
    else if (lm.rt < 5.8) { head = tt`${ME} KAYIPLARDA`; sub = tt`${on} maçında sahada görünmedi. Maç notu ${nt}.`; mood = -1; }
    else if (lm.us > lm.og) { head = tt`${CN} ÜÇ PUANI ALDI`; sub = tt`${on} karşısında ${sc}. ${me} ${nt} notla oynadı.`; }
    else if (lm.us < lm.og) { head = tt`${CN} YARA ALDI`; sub = tt`${on} karşısında ${sc}. ${me} ${nt} notla oynadı.`; mood = -1; }
    else { head = tt('PUANLAR PAYLAŞILDI'); sub = tt`${on} ile ${sc}. ${me} ${nt} notla oynadı.`; }
  } else if (!tb[0].p) { head = tt('SEZON BAŞLIYOR'); sub = tt`${L.name} perdesi açılıyor. Gözler ${cn} ve ${me} üzerinde.`; }
  else { head = tt`ZİRVEDE ${club(tb[0].id).n.toLocaleUpperCase(LC)}`; sub = tt`${L.name} lideri ${tb[0].pts} puanda. ${cn} ${pos}. sırada.`; }
  const best = [];
  for (const [h, a, hg, ag] of s.lg[lid].last || []) { const w = hg > ag ? h : ag > hg ? a : null; if (!w || w === s.clubId) continue; best.push({ n: s.sc[w] && s.sc[w][0] ? s.sc[w][0][0] : squad(w)[9], c: w, r: +(7.2 + Math.min(2, Math.max(hg, ag) * .4) + R() * .5).toFixed(1) }); }
  if (lm && lm.rt >= 7.3) best.push({ n: me, c: s.clubId, r: lm.rt, me: 1 });
  best.sort((a, b) => b.r - a.r); best.length = Math.min(best.length, 4);
  const rum = s.watch.slice().sort((a, b) => b.lv - a.lv).slice(0, 2).map(w => (w.lv >= 60 ? tt`${club(w.id).n}, ${me} için teklif hazırlığında.` : tt`${club(w.id).n} scoutları ${me} için tribündeydi.`));
  const oth = s.lg[lid].t.filter(x => x !== s.clubId);
  if (oth.length > 3) { const a = rp(oth), b = rp(oth.filter(x => x !== a)); rum.push(tt`${club(a).n}, ${club(b).n} forması giyen ${squad(b)[Math.floor(R() * 11)]} için nabız yokluyor.`); }
  if (s.rival && s.rival.c) rum.push(tt`Kuşağının yıldızı ${s.rival.n} (${s.rival.c}) yine konuşuluyor: genel ${s.rival.ovr}.`);
  const rows = tb.slice(0, 5).map((r, i) => ({ pos: i + 1, id: r.id, pts: r.pts, me: r.id === s.clubId }));
  if (pos > 5) rows.push({ pos, id: s.clubId, pts: tb[pos - 1].pts, me: true });
  const f = fixture(), nx = f ? standing(f.opp) : null;
  return { date: tt`${seasonLabel()} · ${s.week}. hafta`, lname: L.name, head, sub, mood, best, rum, rows, next: f ? { id: f.opp, home: f.home, pos: nx ? nx.pos : 0, derby: isDerby(s.clubId, f.opp) } : null, lm };
}

// ---------- soyunma odası: klikler ve gerginlik ----------
export function lockerInfo() {
  const m = S.mates || [], L = S.lr || { ten: 15 };
  const ks = Object.keys(KLIK).map(k => { const mm = KLIK[k].r.map(i => m[i]).filter(Boolean), b = mm.length ? mm.reduce((a, x) => a + x.b, 0) / mm.length : 0; return { k, n: KLIK[k].n, i: KLIK[k].i, b: Math.round(b), mood: b >= 60 ? tt('seninle') : b >= 35 ? tt('tarafsız') : tt('mesafeli'), lv: b >= 60 ? 2 : b >= 35 ? 1 : 0 }; });
  return { ks, ten: Math.round(L.ten), chem: Math.round(chem() * 100) };
}
export function klikAdj(k, d) { for (const i of KLIK[k].r) if (S.mates[i]) S.mates[i].b = clamp(S.mates[i].b + d, 0, 100); }
export function tenAdj(d) { const L = S.lr || (S.lr = { ten: 15 }); L.ten = clamp(L.ten + d, 0, 100); }
export function newMate(i) {
  const c = LMAP[leagueOf(S.clubId)].c, old = S.mates[i];
  S.mates[i] = { n: rname(c), r: MROLE[i], b: ri(12, 22), lk: { skin: ri(0, 3), hair: KW ? pick([4, 7, 8, 9, 10, 11]) : ri(0, 7), hc: ri(0, 2), beard: KW ? 0 : ri(0, 2) } };
  return { n: S.mates[i].n, old: old ? old.n : '' };
}

// ---------- ezeli rakip: listede rakibi olmayan kulübe ligden en yakın güçteki takım rakip olur ----------
function genDerby(id) {
  const R = S.rvc || (S.rvc = {}); if (R[id] !== undefined) return R[id];
  const c = club(id), lid = leagueOf(id);
  if (!c || !lid || id[0] === 'g' || DERBY.some(g => g.includes(c.n))) return (R[id] = null);
  const t = S.lg[lid].t.filter(x => x !== id && !DERBY.some(g => g.includes(club(x).n)));
  if (!t.length) return (R[id] = null);
  t.sort((a, b) => Math.abs(S.rt[a] - S.rt[id]) - Math.abs(S.rt[b] - S.rt[id]) || hsh(a) - hsh(b));
  return (R[id] = t[0]);
}
export const derbyRec = opp => (S.dby || {})[opp] || null;
export function derbyOf(id = S.clubId) {
  const g = genDerby(id); if (g) return [g];
  const c = club(id), lid = leagueOf(id); if (!c || !lid) return [];
  return S.lg[lid].t.filter(x => x !== id && isDerby(id, x));
}

// ---------- menajerle konuşma ----------
const AGW = k => Math.max(0, ((S.agent || {})[k] || 0) - absWeek());
export const agentHi = () => { const a = S.agent && AGENTS.find(x => x.n === S.agent.n); return a ? a.hi : ''; };
export function agentTopics() {
  const s = S, a = s.agent; if (!a) return [];
  const rl = role();
  return [
    { k: 'durum' },
    { k: 'bul', wait: AGW('cd') },
    { k: 'zam', dis: a.zam === s.season || !s.con.wage || !!s.loan, why: a.zam === s.season ? tt('Bu sezon bir kez istendi') : !s.con.wage ? tt('Amatör sözleşmede ücret yok') : s.loan ? tt('Kiralıkken olmaz') : '' },
    { k: 'spon', wait: AGW('spcd'), dis: s.spon.length >= 3, why: s.spon.length >= 3 ? tt('Sponsor kotan dolu') : '' },
    { k: 'hayal', dis: !s.dream || s.dream === s.clubId, why: !s.dream ? tt('Önce hedef takım seç') : '' },
    { k: 'kiralik', dis: !!s.loan || rl === '11' || s.con.until <= s.season || s.tstat === 'kiralik', why: s.tstat === 'kiralik' ? tt('Zaten kiralık arıyor') : rl === '11' ? tt('İlk 11 oyuncusunu kiralamazlar') : '' },
  ];
}
export function agentTalk(k, x) {
  const s = S, a = s.agent; if (!a) return null;
  const P = profile(), now = absWeek(), o = OVR(), cur = s.rt[s.clubId], L = [], ch = [], clubs = [], st = s.st, avg = st.apps >= 3 ? st.rs / st.apps : (s.lastAvg || 6.5);
  if (a.rel == null) a.rel = 55;
  const out = () => ({ lines: L, ch, clubs });
  if (k === 'durum') {
    L.push(tt`"Piyasada adın '${PTAG[P.tag].toLocaleLowerCase(LC)}' diye geçiyor. Kulüplerin gözünde seviyen ${Math.round(P.lvl)}, gerçek gücün ${o}."`);
    L.push(P.bench ? tt('"Oynamıyorsun. Oynamayan oyuncuyu kimseye anlatamam; önce forma lazım."') : P.form >= 2 ? tt('"Formun çok iyi. Telefonlar bu yüzden çalıyor; böyle devam."') : P.form <= -2 ? tt('"Son haftalar kötü. Şimdi kapı çalsam yüzümüze kapanır."') : tt('"Ne iyi ne kötü. Bir iki parlak maç işi değiştirir."'));
    L.push(s.watch.length ? tt`"Şu an ${s.watch.length} kulüp izliyor. En sıcağı ${club([...s.watch].sort((p, q) => q.lv - p.lv)[0].id).n}."` : tt('"Şu an defterimde seni yazan kulüp yok."'));
    L.push(tt`"Gerçekçi hedef: gücü ${Math.round(P.lo + 3)} ile ${Math.round(P.hi)} arasındaki kulüpler."`);
    if (!P.abroad) L.push(tt('"Yurt dışı için adın henüz yetmiyor."'));
    return out();
  }
  if (k === 'bul') {
    if (AGW('cd') > 0) { L.push(tt`"Herkesi daha yeni aradım. ${AGW('cd')} hafta sonra tekrar bakarım."`); return out(); }
    if (x === 'yurt' && !P.abroad) { L.push(tt('"Yurt dışında adını bilen yok. İtibarın 40 olunca ya da gol krallığına oynarken konuşuruz."')); return out(); }
    a.cd = now + 4; a.brief = x;
    const myC = LMAP[leagueOf(s.clubId)].c, pool = [];
    for (const lid in s.lg) {
      const fr = LMAP[lid].c !== myC; if (x === 'yurt' ? !fr : (LMAP[lid].c !== 'TR' && !P.abroad)) continue;
      for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id === s.clubId || banned(id)) continue; if (x === 'sure' ? (r <= o - 1 && r >= o - 7) : x === 'para' ? (r >= P.lo + 2 && r <= P.hi) : (r >= Math.max(cur + 1, P.lvl - 4) && r <= P.hi + 1)) pool.push(id); }
    }
    if (!pool.length) { L.push(tt('"Baktım, şu an sana uyan kapı yok. Formunu yükselt, tekrar deneriz."')); return out(); }
    if (x === 'para') pool.sort((p1, p2) => s.rt[p2] - s.rt[p1]); else shuffle(pool);
    const p = clamp(.22 + a.pw * .38 + P.form / 14 + (a.rel - 50) / 200 + (x === 'sure' ? .25 : 0), .1, .92), n = 1 + (chance(a.pw * .5) ? 1 : 0);
    for (const id of pool.slice(0, 5)) {
      if (clubs.length >= n) break; if (!chance(p)) continue;
      const w = s.watch.find(q => q.id === id), up = ri(22, 34) + Math.round(a.pw * 8);
      if (w) w.lv = clamp(w.lv + up, 0, 100); else s.watch.push({ id, lv: clamp(20 + up, 0, 100) });
      clubs.push(id);
    }
    if (clubs.length) { a.rel = clamp(a.rel + 3, 0, 100); L.push(tt`"${clubs.map(id => club(id).n).join(', ')} ile konuştum. Seni izleyecekler; gerisi sahada sende."`); addFeed('basin', tt('Transfer Hattı'), tt`${club(clubs[0]).n}, ${s.name} için menajeriyle temasta.`, 'haber'); }
    else L.push(P.form < 0 ? tt('"Herkesi aradım. Hepsi aynı şeyi söyledi: önce formunu görelim."') : tt('"Bu tur olmadı. Kapılar kapalı değil, biraz zaman lazım."'));
    return out();
  }
  if (k === 'zam') {
    if (a.zam === s.season || !s.con.wage || s.loan) return null;
    a.zam = s.season;
    const p = clamp(.18 + a.pw * .3 + (avg - 6.8) * .25 + (role() === '11' ? .1 : -.15) + (s.rel.hoca - 50) / 200 + (s.con.until <= s.season ? .12 : 0), .05, .85);
    if (chance(p)) { const pct = ri(7, 12) + Math.round(a.pw * 4), w0 = s.con.wage; s.con.wage = nice(w0 * (1 + pct / 100)); a.rel = clamp(a.rel + 5, 0, 100); L.push(tt`"Hallettim. Haftalık ücretin ${fmt(w0)} yerine ${fmt(s.con.wage)}."`); ch.push(tt`Ücret +%${pct}`); }
    else { ch.push(...fx({ hoca: -2 })); L.push(tt('"Yönetim kapıyı kapattı: sözleşmesi neyse o. Biraz da bozuldular."')); }
    return out();
  }
  if (k === 'spon') {
    if (AGW('spcd') > 0) { L.push(tt`"Markalarla daha yeni konuştum. ${AGW('spcd')} hafta sonra yine yoklarım."`); return out(); }
    if (s.spon.length >= 3) return null;
    a.spcd = now + 8;
    if (s.fol < 3000) { L.push(tt('"Markalar takipçi sayısına bakıyor. Üç bini geçince konuşalım."')); return out(); }
    if (chance(clamp(.25 + a.pw * .35 + Math.log10(s.fol) / 25, .1, .85))) {
      const f = s.fol, n = pick(SPN.filter(z => !s.spon.some(q => q.n === z)).concat(SPN).slice(0, SPN.length)), wk = nice((f < 50000 ? 1200 + f * .05 : f < 1e6 ? f * .25 : Math.min(6e6, f * .4)) * (.5 + a.pw * .35));
      s.spon.push({ n, wk, until: now + 38 }); a.rel = clamp(a.rel + 3, 0, 100);
      L.push(tt`"${n} ile anlaştık: bir sezon, haftada ${fmt(wk)}."`); ch.push('+' + fmt(wk) + tt('/hf'));
    } else L.push(tt('"Görüştüğüm markalar bu sezon bütçeyi kapatmış. Sonra yine yoklarım."'));
    return out();
  }
  if (k === 'hayal') {
    const d = s.dream; if (!d || d === s.clubId) return null;
    const r = Math.round(s.rt[d]), hi = Math.round(P.hi), w = s.watch.find(q => q.id === d);
    if (hi >= r - 1 && P.form >= 0) {
      if ((a.dcd || 0) <= now && chance(clamp(.2 + a.pw * .35, .1, .7))) { a.dcd = now + 8; if (w) w.lv = clamp(w.lv + 18, 0, 100); else s.watch.push({ id: d, lv: 34 }); clubs.push(d); L.push(tt`"${club(d).n} ile konuştum. Adını biliyorlar; izlemeye alıyorlar."`); }
      else { a.dcd = Math.max(a.dcd || 0, now + 3); L.push(tt`"${club(d).n} kapısı aralık ama bugün açılmadı. Formunu koru, ben takipteyim."`); }
    } else if (hi < r - 1) L.push(tt`"${club(d).n} gücü ${r}. Senin ulaşabildiğin üst sınır ${hi}; arada ${r - 1 - hi} puan var. Ya gücün artacak ya formun."`);
    else L.push(tt`"${club(d).n} seviyene uzak değil ama formun düşükken aramam. Önce iki iyi maç."`);
    return out();
  }
  if (k === 'kiralik') {
    if (s.loan || s.tstat === 'kiralik') return null;
    ch.push(...setStatus('kiralik'));
    L.push(tt('"Tamam. Transfer döneminde sana forma verecek bir kulüp bulacağım. Kulübüne de haber verdim."'));
    return out();
  }
  return null;
}

// ---------- kariyer istatistikleri ----------
export function statsInfo() {
  const s = S, t = tot(), R = s.rec || {}, cs = Object.keys(s.cs || {}).filter(id => club(id)).map(id => ({ id, ...s.cs[id] })).sort((a, b) => b.apps - a.apps);
  const curve = [...s.hist.filter(h => h.o).map(h => ({ y: h.y, o: h.o, g: h.g })), ...(s.mgr ? [] : [{ y: seasonLabel(), o: OVR(), g: s.st.g, cur: 1 }])];
  const dby = Object.values(s.dby || {}).reduce((a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2], a[3] + d[3]], [0, 0, 0, 0]);
  return { t, R, cs, curve, peak: Math.round(s.peak), cars: meta().cars || [], dby };
}

// ---------- kayıt yuvaları ----------
export const curSlot = () => KEYS.indexOf(KEY) + 1;
export function setSlot(n) { if (!KEYS[n - 1]) return; KEY = KEYS[n - 1]; S = null; try { localStorage.setItem(SLOT, String(n)); } catch (e) { /* yok */ } }
export function slotList() {
  return KEYS.map((k, i) => {
    const o = { n: i + 1, cur: k === KEY };
    try { const j = localStorage.getItem(k); if (!j) return o; const d = JSON.parse(j), c = CLUBS[d.clubId] || (d.gen || {})[d.clubId] || {}; return { ...o, name: d.name, age: d.age, pos: d.pos, club: c.n || '', c1: c.c1 || '#ff6a2b', c2: c.c2 || '#14110e', look: d.look, num: d.num, mgr: !!d.mgr, year: d.year }; } catch (e) { return o; }
  });
}
export function wipeSlot(n) { try { localStorage.removeItem(KEYS[n - 1]); } catch (e) { /* yok */ } if (KEYS[n - 1] === KEY) S = null; }
