// Toprak Saha — oyun çekirdeği: durum, lig simülasyonu, sezon, transfer, ekonomi
import { tt, LC, NLOC, DSEP } from './i18n.js';
import { LEAGUES, LMAP, CLUBS, PAL, PROV, NAMES, POS, ATTR, ORIGINS, TRAITS, SHOP, TRAIN, NATIONS, FILL, CUPS, PERKS, HANG, POSTS, FANS, ACH, HATERS, HT, BUILD, STYLES, CELE, NET, MACT, DERBY, XIDS, TACT, PERKS2, ROLE, WIDS, AGENTS, NATN, WX, INV, DIFF, KPROV, KWORLD, setWorld as setData, SCN, MVAR, UPG, SESS, PROLE, SCENS, COLK, SPN, KLIK, PTAG , REN } from './data.js';

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
// Eski kayıt: gerçek kulüp, lig ve kupa adları yeni karşılıklarıyla değiştirilir (kayıt nm:2 ile işaretlenir)
let RENX = null;
export function renameText(j) {
  if (!j || j.includes('"nm":2')) return j;
  RENX ??= new RegExp('(^|[^\\p{L}\\p{N}])(' + Object.keys(REN).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=$|[^\\p{L}\\p{N}])', 'gu');
  return j.replace(RENX, (m, a, b) => a + REN[b]);
}
export function load() {
  try {
    const j = localStorage.getItem(KEY); if (!j) return false; S = JSON.parse(renameText(j)); S.nm = 2; setWorld(S.w);
    // eski kayıtları yeni alanlarla tamamla
    S.look ??= { skin: 1, hair: 0, hc: 0 }; S.tstat ??= 'mutlu'; S.watch ??= []; S.loan ??= null; S.st.lg ??= S.st.g;
    if (S.con && S.con.rel == null) S.con.rel = nice(value() * 4);
    if (!S.cup) initCup();
    S.perks ??= []; S.pp ??= 0; S.px ??= 0; S.ach ??= {}; S.feed ??= []; S.pop ??= []; S.mr ??= []; S.feedNew ??= 0; S.awards ??= 0;
    if (S.dream === undefined) S.dream = SAK();
    if (!S.fl.drm) { S.fl.drm = 1; const d = S.dream && CLUBS[S.dream]; if (d && d.n === 'Sakarya' && S.prov !== 'Sakarya' && !S.mgr) S.dream = SAK(); }   // eski kayıt: varsayılan hedef artık doğduğun şehrin kulübü
    for (const id in S.gen) if (!S.gen[id].c2) S.gen[id].c2 = '#f2f2f2';   // eski kayıtlarda boş kalan ikinci renk
    S.net ??= []; S.diff ??= 'normal'; if (!S.mates || !S.mates.length) genMates(); if (!S.quest) newQuest();
    S.fu ??= []; S.num ??= 9; S.cele ??= 'kayarak'; S.nick ??= ''; if (!S.refs || !S.refs.length) initRefs();
    S.assets = S.assets.filter(id => SHOP.some(x => x.id === id));
    for (const id of [...XIDS, ...WIDS]) S.rt[id] ??= CLUBS[id].r;
    S.co ??= {}; S.eps ??= ['en1', 'es1']; S.hon ??= {}; S.ivq ??= []; S.moves ??= []; S.adapt ??= 0; S.cup.top ??= cupTop();
    if (!S.cl || !S.el || S.cl.weeks.length < 13) { delete S.euro; initEuro(euroQual()); }
    if (!S.nt) ntInit(); if (!S.yt) ntInit('yt'); S.car.ycaps ??= 0; S.car.yng ??= 0;
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
// Backer Sport maç günü tasarımı: afiş paylaşılınca takipçi ve taraftar ilgisi gelir (haftada bir)
export function backerPost(f) {
  const s = S; if (!has('backer') || s.fl.bkw === absWeek() || !f || !club(f.opp)) return 0;
  s.fl.bkw = absWeek(); const g = Math.round((40 + s.fol * .012) * folF()); s.fol += g; s.rel.taraf = clamp(s.rel.taraf + 1, 0, 100);
  addFeed('me', s.name, tt`MAÇ GÜNÜ | ${club(s.clubId).n} - ${club(f.opp).n}. Hazırız. Tasarım: Backer Sport`, 'ben');
  return g;
}
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
// İlçe adlarından benzersiz amatör kulüp adları: ilçe az olan ilde ekler sırayla döner
const AMS = [' Belediyespor', ' Gençlikspor', ' Gücü', ' İdman Yurdu', ' Spor', ' Birlikspor', ' Yıldızspor', ' SK', ' Doğanspor', ' Anadolu SK', ' Gençler Gücü', ' Ova SK', ' Kartalspor', ' Demirspor'];
const AMK = [' Kadın SK', ' Belediyespor', ' Kadın FK', ' Gençlikspor', ' Spor', ' Gücü', ' Yıldızspor', ' Birlikspor', ' SK', ' Kartalspor', ' Anadolu SK', ' Doğanspor', ' Gençler Gücü', ' Ova SK'];
function amNames(D, n, suf) { const out = []; for (let r = 0; out.length < n && r < suf.length; r++) for (const d of D) { const x = d + suf[r]; if (out.length < n && !out.includes(x)) out.push(x); } return out; }
function genAmateur(prov) {
  if (!PROV[prov]) prov = 'İstanbul';
  const P = PROV[prov], keys = ['R', 'G', 'B', 'N', 'Y', 'O', 'M', 'P', 'S', 'T', 'K'];
  const rng = [[33, 41], [28, 35], [22, 30]];
  const mk = (lid, id, n, lo, hi) => {
    let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = keys[h % keys.length]; let b = ['W', 'K', 'Y', 'W'][(h >>> 4) % 4]; if (b === a) b = 'W';
    S.gen[id] = { n, c1: PAL[a], c2: PAL[b] }; S.rt[id] = Math.round(rnd(lo, hi)); S.lg[lid].t.push(id);
  };
  if (KW) {   // Kadınlar 3. Ligi: ilin ilçe takımları
    S.lg.tr4 = { t: [], tb: {}, rd: 0, last: [] };
    amNames(KPROV[prov] || P.d, 14, AMK).forEach((n, i) => mk('tr4', 'g4_' + i, n, 25, 34));
    return;
  }
  const all = P.l ? null : amNames(P.d, 42, AMS);
  ['tr6', 'tr7', 'tr8'].forEach((lid, ti) => {
    const names = P.l ? P.l[ti] : all.slice(ti * 14, ti * 14 + 14);
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
    st: { apps: 0, g: 0, a: 0, rs: 0, cs: 0, lg: 0 }, car: { apps: 0, g: 0, a: 0, rs: 0, caps: 0, ng: 0, ycaps: 0, yng: 0 },
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
  ntInit(); ntInit('yt');
  S.rival = { n: rname('TR'), ovr: OVR() + ri(1, 4), pot: ri(82, 90), c: '' };
  if (o.wait) return;   // arayüz: ilk kulüp deneme antrenmanlarıyla bulunur
  const lid = 'tr' + O.tier;
  // hızlı başlangıç: forma şansı bulabileceğin güçte bir takım
  const byR = [...S.lg[lid].t].sort((a, b) => S.rt[a] - S.rt[b]), fit = byR.filter(x => S.rt[x] <= OVR() + 1);
  signFirst({ id: pick(fit.length >= 2 ? fit.slice(-5) : byR.slice(0, 3)), role: '11' });
}
// Doğrudan teknik direktör ya da menajer olarak başlama: futbolcu geçmişi olmayan kısa bir kurulum.
// bg: 'sifir' (tanınmayan biri) ya da 'eski' (adı bilinen eski futbolcu: biraz itibar ve birikim)
export function newStaff(o) {
  newCareer({ ...o, pos: 'OS', foot: 'Sağ', origin: 'mahalle', trait: 'sakin', ht: 'orta', build: 'atletik', style: 0, wait: true });
  const old = o.bg === 'eski';
  S.age = ri(33, 37); S.rep = old ? 30 : 10; S.money = old ? 400000 : 40000; S.fol = old ? ri(20000, 40000) : ri(300, 900); S.fl.staff = 1; delete S.fl.okul;
  const low = [...S.lg[TRT[TRT.length - 1]].t].sort((a, b) => S.rt[a] - S.rt[b]);
  signFirst({ id: low[0], role: '11', wage: 0 }); S.news = []; S.feed = []; S.feedNew = 0;
  if (o.role === 'agent') bizStart('agent');
}
// İlk sözleşme: kulüp belli olunca sezonun geri kalanı kurulur
export function signFirst(o) {
  const lid = leagueOf(o.id);
  S.clubId = o.id;
  S.con = { wage: o.wage ?? wageFor(S.rt[o.id], OVR()), until: o.len || 1, role: o.role || '11', goalB: o.goalB || 0 };
  S.con.rel = nice(value() * 4);
  if (o.sign) S.money += o.sign;
  S.rel.hoca = clamp(S.rel.hoca + ({ '11': 6, rot: 0, genc: -5 }[S.con.role] || 0), 0, 100);
  initCup(); initEuro(euroQual()); S.dream = SAK(); S.fl.drm = 1; initRefs(); assignRef(); genMates(); newQuest(); genRival(); newGoals();
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
  const th = S.trh || [], tr = th.length ? th.reduce((a, b) => a + b, 0) / th.length : 1.5;   // son haftaların antrenman ortalaması
  const p = { hoca: S.rel.hoca * 0.5 + 28, guc: (o - S.rt[S.clubId]) * 3.5, ant: clamp((tr - 1.5) * 3, -5, 5), form: n ? clamp((f - 6.6) * 5, -7, 7) : 0,
    ek: (S.fl.kaptan ? 8 : 0) + (youngRule() ? 12 : 0) + (tacFit() - 50) * 0.1 + Math.min(4, (S.posx || []).length * 2) - (S.fl.pc ? 5 : 0) + (S.con.forma ? 6 : 0) + (S.camp && S.camp.s === S.season && S.week <= 6 ? S.camp.pre || 0 : 0),
    rakip: v ? clamp((o - v.ovr) * 1.1, -7, 7) + (v.inj > 0 ? 8 : 0) + (v.f && n ? clamp((f - v.f) * 3, -5, 5) : 0) : 0 };
  return { s: p.hoca + p.guc + p.ek + p.rakip + p.ant + p.form, p, f, tr };
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
  S.used++; questHit('train'); S.trn = (S.trn || 0) + 1;
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
  if (NATW.includes(s.week)) { natApply(null); natApply(null, 'yt'); }
  s.hate = clamp((s.hate ?? 10) * .94, 0, 100);   // eleştiri zamanla söner
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
  rivalTick(); plusWeek(); healthWeek(); rumorWeek(); s.rel.basin += (50 - s.rel.basin) * .025;
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
  if (pos === 1 && !isBiz()) {
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
    if (avg >= 7 && st.apps >= 12) { s.rel.hoca = clamp(s.rel.hoca + 8, 0, 100); lines.push(tt('Kiralıkta parladın: hoca seni kadroda düşünüyor.')); }
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
  if (!mg && tro.length) docAdd('kupa', tro[0], 8, 'trophy', 39);
  if (!mg && st.apps) docAdd('ozet', tt`Sezon karnesi: ${st.apps} maç, ${st.g} gol, ${st.a} asist`, 1, 'chart', 39);
  const doc = mg ? [] : docList(); s.doc = [];
  return { label, league: L.name, pos, n, champ, st, avg, tro, lines, moved, aw, xi, doc };
}

// ---------- kupalar: 'cup' ülke kupası; 'cl' Kıta Ligi, 'el' Kıta Kupası ----------
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
// Kadın futbolunda ücret eğrisi daha alçak ve daha yatık: Elit Lig ortası haftada ~₺10 bin, Avrupa zirvesi ~₺800 bin (≈€16 bin); 2. ve 3. Lig amatör
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
  if (o.img) s.con.img = 1; if (o.loy) s.con.loy = o.loy; if (o.app) s.con.app = o.app; if (o.forma) s.con.forma = 1; if (o.kap) { s.con.kap = 1; s.fl.kaptan = 1; }
  if (move) docAdd('transfer', tt`${club(o.id).n} ile imza`, 4, 'pen');
  s.con.rel = nice(value() * (o.relF || 4));
  if (move) newGoals();
}

// ---------- milli takım ----------
// Milli takım haftaları: iki sezonda altı eleme maçı, çift yıllarda yaz turnuvası
// Kadınlarda turnuvalar tek yıllarda: 2027 Dünya Turnuvası, 2029 Avrupa Turnuvası, 2031 Dünya Turnuvası…
// Genç milli takım (erkeklerde U21, kadınlarda U19): aynı haftalarda kendi elemeleri, tek yıllarda (kadınlarda çift yıllarda) yaz turnuvası
const NATW = [9, 17, 27], NTN_E = { euro: 'Avrupa Turnuvası', wc: 'Dünya Turnuvası', yeuro: 'U21 Avrupa Turnuvası' }, NTN_K = { euro: 'Kadınlar Avrupa Turnuvası', wc: 'Kadınlar Dünya Turnuvası', yeuro: 'U19 Kadınlar Avrupa Turnuvası' };
let NTN = NTN_E;
const WORLD_E = [['İngiltere', 87], ['Belçika', 82], ['Danimarka', 79], ['Brezilya', 87], ['Arjantin', 88], ['Uruguay', 81], ['Kolombiya', 80], ['ABD', 77], ['Meksika', 77], ['Japonya', 78], ['Güney Kore', 76], ['Fas', 80], ['Senegal', 78], ['Nijerya', 76], ['Avustralya', 73]];
let WORLD = WORLD_E;
export const myNat = () => NATN[S.nat] || 'Türkiye';
export const natR = n => (NATIONS.find(x => x[0] === n) || WORLD.find(x => x[0] === n) || [n, 75])[1];
export const natOk = () => !S.mgr && OVR() >= (KW ? natR(myNat()) - 6 : 73) && S.rep >= (KW ? 35 : 45);
export const YD = 16, yAge = () => (KW ? 19 : 21), ySuf = () => (KW ? ' U19' : ' U21');   // genç milli: güç farkı, yaş sınırı, takım eki
export const yOk = () => !S.mgr && !natOk() && S.age <= yAge() && OVR() >= (KW ? natR(myNat()) - 22 : 50);
function ntInit(k = 'nt') {
  const y = S.year + 1, yt = k === 'yt', ty = yt ? ((y % 2 === 1) !== KW ? y : y + 1) : (y % 2 === 0) !== KW ? y : y + 1, me = myNat(), pool = NATIONS.filter(x => x[0] !== me), pk = f => pick(pool.filter(f))[0];
  S[k] = { kind: yt ? 'yeuro' : ty % 4 === (KW ? 1 : 0) ? 'euro' : 'wc', year: ty, grp: [pk(x => x[1] >= 83), pk(x => x[1] >= 75 && x[1] < 83), pk(x => x[1] < 75)], tb: {}, md: ty === y ? 3 : 0, wk: 0, q: null, tour: null, last: null };
}
const ntMatch = (k = 'nt') => { const t = S[k], i = t.md % 3; return { opp: t.grp[i], home: t.md < 3 ? i % 2 === 0 : i % 2 === 1 }; };
const tbRec = (tb, a, b, ag, bg) => {
  const row = n => tb[n] || (tb[n] = [0, 0, 0, 0, 0, 0]), A = row(a), B = row(b);
  A[0]++; B[0]++; A[4] += ag; A[5] += bg; B[4] += bg; B[5] += ag;
  if (ag > bg) { A[1]++; B[3]++; } else if (ag < bg) { B[1]++; A[3]++; } else { A[2]++; B[2]++; }
};
const tbSort = (tb, names) => names.map(n => { const r = tb[n] || [0, 0, 0, 0, 0, 0]; return { n, p: r[0], w: r[1], d: r[2], l: r[3], gd: r[4] - r[5], gf: r[4], pts: r[1] * 3 + r[2] }; }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || natR(b.n) - natR(a.n));
export const ntTable = (k = 'nt') => tbSort(S[k].tb, [myNat(), ...S[k].grp]);
export function ntInfo(k = 'nt') {
  const t = S[k], nx = t.md < 6 ? ntMatch(k) : null, wk = NATW.find(w => w >= S.week);
  return { name: NTN[t.kind], year: t.year, md: t.md, q: t.q, next: nx && wk ? { ...nx, week: wk } : null, last: t.last };
}
// Eleme maç günü. own: {us, opp} oynadıysan; yoksa simüle edilir
export function natApply(own, k = 'nt') {
  const t = S[k]; if (!t || t.md >= 6 || t.wk === absWeek()) return;
  t.wk = absWeek();
  const me = myNat(), m = ntMatch(k), yt = k === 'yt', meN = yt ? me + ySuf() : me; let us, op;
  if (own) { us = own.us; op = own.opp; } else { const [h, a] = m.home ? simScore(natR(me), natR(m.opp)) : simScore(natR(m.opp), natR(me)); us = m.home ? h : a; op = m.home ? a : h; }
  tbRec(t.tb, me, m.opp, us, op);
  const rest = t.grp.filter(x => x !== m.opp), [h2, a2] = simScore(natR(rest[0]), natR(rest[1])); tbRec(t.tb, rest[0], rest[1], h2, a2);
  t.md++;
  if (!own && (!yt || yOk())) addFeed('fed', tt('Milli Takımlar'), tt`${NTN[t.kind]} Elemeleri: ${meN} ${us}-${op} ${m.opp}.`, 'haber');
  if (t.md === 6) {
    const pos = ntTable(k).findIndex(r => r.n === me) + 1; t.q = pos <= 2;
    if (!yt || yOk() || S.car.ycaps) addNews(t.q ? tt`${meN}, ${t.year} ${NTN[t.kind]} biletini aldı!` : tt`${meN} elemelerde ${pos}. oldu; ${t.year} ${NTN[t.kind]} hayali bitti.`, 'flag');
    if (!yt) addFeed('basin', tt('Saha Kenarı'), t.q ? tt`${tt(me).toLocaleUpperCase(LC)} ${t.year} ${tt(NTN[t.kind]).toLocaleUpperCase(LC)}'NDA!` : tt`${me} ${NTN[t.kind]}'na gidemiyor.`, 'manset');
  }
}
export function natFixture() {
  const s = S; if (!NATW.includes(s.week) || s.inj > 0 || s.ban > 0 || s.mgr) return null;
  const o = OVR(), me = myNat(); let lvl = null;
  if (natOk()) lvl = 'A'; else if (yOk()) lvl = 'U21';   // kadınlarda genç milli takım U19
  if (!lvl) return null;
  if (lvl === 'A' && s.nt && s.nt.md < 6) { const m = ntMatch(); return { nat: true, lvl, q: true, name: NTN[s.nt.kind] + ' Elemeleri', usN: me, usR: natR(me), opp: { n: m.opp, r: natR(m.opp) }, home: m.home }; }
  if (lvl === 'U21' && s.yt && s.yt.md < 6) { const m = ntMatch('yt'); return { nat: true, lvl, q: true, k: 'yt', name: NTN.yeuro + ' Elemeleri', usN: me + ySuf(), usR: natR(me) - YD, opp: { n: m.opp + ySuf(), r: natR(m.opp) - YD }, home: m.home }; }
  const op = pick(NATIONS.filter(x => x[0] !== me)), d = lvl === 'A' ? 0 : -YD, suf = lvl === 'A' ? '' : ySuf();
  return { nat: true, lvl, name: 'Hazırlık maçı', usN: me + suf, usR: natR(me) + d, opp: { n: op[0] + suf, r: op[1] + d }, home: true };
}
// Yaz turnuvası: sezon bittikten sonra çağrılır. Bilet yoksa null döner.
export function tourStart(k = 'nt') {
  const t = S[k]; if (!t || t.year !== S.year || t.tour) return t && t.tour ? t.tour : null;
  while (t.md < 6) { t.wk = -1; natApply(null, k); }
  if (!t.q) { ntInit(k); return null; }
  const yt = k === 'yt';
  const me = myNat(), key = {}, all = (t.kind !== 'wc' ? NATIONS : [...NATIONS, ...WORLD]).filter(x => x[0] !== me);
  all.forEach(x => { key[x[0]] = x[1] + rnd(0, 9); });
  const field = all.map(x => x[0]).sort((a, b) => key[b] - key[a]).slice(0, 11), grp = shuffle([...field]).slice(0, 3);
  t.tour = { name: `${t.year} ${NTN[t.kind]}`, me: (yt ? yOk() : natOk()) && S.inj <= 0, grp, tb: {}, md: 0, st: 'g', pool: field.filter(x => !grp.includes(x)), res: [], next: null, k };
  if (!yt || t.tour.me) addFeed('fed', tt('Milli Takımlar'), tt`${t.tour.name} başlıyor. ${yt ? me + ySuf() : me} grubu: ${grp.map(x => tt(x)).join(', ')}.`, 'manset');
  return t.tour;
}
const TRN = { qf: 'Çeyrek final', sf: 'Yarı final', f: 'Final' };
export function tourFixture(k = 'nt') {
  const T = S[k] && S[k].tour; if (!T || T.st === 'out' || T.st === 'champ') return null;
  const me = myNat(), g = T.st === 'g', opp = g ? T.grp[T.md] : T.next, yt = k === 'yt', d = yt ? YD : 0, sf = yt ? ySuf() : '';
  return { nat: true, lvl: yt ? 'U21' : 'A', k, tour: true, kof: !g, final: T.st === 'f', name: T.name, round: g ? `Grup ${T.md + 1}/3` : TRN[T.st], usN: me + sf, usR: natR(me) - d, opp: { n: opp + sf, r: natR(opp) - d }, oppN: opp };
}
// own: {us, opp, win} oynadıysan; yoksa simüle edilir
export function tourRound(own, k = 'nt') {
  const T = S[k].tour, me = myNat(), f = tourFixture(k), yt = k === 'yt', meN = yt ? me + ySuf() : me; if (!f) return;
  let us, op, win;
  if (own) { us = own.us; op = own.opp; win = own.win; } else { [us, op] = simScore(f.usR - 2, f.opp.r); win = us > op || (us === op && chance(.5)); }
  T.res.push([f.round, f.oppN, us, op, f.kof ? (win ? 1 : 0) : us > op ? 1 : us < op ? 0 : 2]);
  const draw = () => { T.pool.sort((a, b) => natR(b) - natR(a)); return T.pool.splice(ri(0, Math.min(3, T.pool.length - 1)), 1)[0]; };
  if (T.st === 'g') {
    tbRec(T.tb, me, f.oppN, us, op);
    const rest = T.grp.filter(x => x !== f.oppN), [h, a] = simScore(natR(rest[0]) - 2, natR(rest[1])); tbRec(T.tb, rest[0], rest[1], h, a);
    T.md++;
    if (T.md === 3) { if (tbSort(T.tb, [me, ...T.grp]).findIndex(r => r.n === me) < 2) { T.st = 'qf'; T.next = draw(); } else T.st = 'out'; }
  } else if (!win) T.st = 'out';
  else if (T.st === 'f') T.st = 'champ';
  else { T.st = T.st === 'qf' ? 'sf' : 'f'; T.next = draw(); }
  if (T.st !== 'out' && T.st !== 'champ') return;
  const champ = T.st === 'champ', last = { name: T.name, res: T.res, champ, me: T.me, stage: champ ? 'Şampiyon' : T.res[T.res.length - 1][0] };
  if (champ) {
    if (T.me) { S.tro.push(T.name); fx(yt ? { rep: 5, taraf: 4, mo: 15, fol: Math.round(2000 + S.fol * .1) } : { rep: 12, taraf: 10, mo: 20, fol: Math.round(5000 + S.fol * .3) }); if (!yt) unlock('milk'); }
    addNews(tt`${meN} ${T.name} ŞAMPİYONU!`, 'trophy'); addFeed('basin', tt('Saha Kenarı'), tt`TARİHÎ GECE: ${tt(meN).toLocaleUpperCase(LC)} ${tt(T.name).toLocaleUpperCase(LC)} ŞAMPİYONU!`, 'manset');
  } else if (!yt || T.me) addNews(tt`${meN}, ${T.name} yolculuğunu ${tt(last.stage).toLocaleLowerCase(LC)} aşamasında noktaladı.`, 'flag');
  ntInit(k); S[k].last = last;
}
export const tourTable = (k = 'nt') => { const T = S[k].tour; return T ? tbSort(T.tb, [myNat(), ...T.grp]) : []; };


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
  const sub = rl !== 'yedek' || chance(subChance(fxt)), from = rl === 'yedek' ? ri(S.pos === 'KL' ? 46 : 58, S.pos === 'KL' ? 80 : 72) : 1, n = !sub ? 0 : Math.max(rl === 'yedek' ? 1 : 3, (rl === 'yedek' ? ri(1, 2) + (chance(.4) ? 1 : 0) : ri(3, 5) + (chance(.4) ? 1 : 0)) + (derby ? 1 : 0) + (Z.mom || 0));
  const tasks = nat ? [] : pickTasks(tac, rl), need = tasks.flatMap(t => TASKS[t].need || []);
  if (sub) for (let i = 0; i < Math.max(n, need.length); i++) tl.push({ min: ri(from + 1, 90), t: 'mom', k: need[i] || wpick(momW(tac, scn)), fix: !!need[i] });
  if (rl === '11' && !nat && chance(.5)) tl.push({ min: ri(56, 72), t: 'tac' });
  shuffle([...FILL]).slice(0, 4).forEach(x => tl.push({ min: ri(3, 88), t: 'txt', s: x }));
  if (rl === '11' && !nat) { tl.push({ min: 45, t: 'dec', k: 'ht' }); if (chance(.4)) tl.push({ min: ri(50, 84), t: 'dec', k: wpick({ pen: .5 + refPn(ref) * 1.1, ref: 1, knock: 1 }) }); }
  if (rl === 'yedek') tl.push(sub ? { min: from, t: 'txt', in: 1, s: S.pos === 'KL' ? tt('Kaleci sakatlandı. Eldivenleri tak, oyuna giriyorsun!') : tt('Hoca seni çağırdı. Oyuna giriyorsun!') } : { min: ri(80, 88), t: 'txt', s: tt('Hoca son değişikliği de yaptı. Bugün sana görev çıkmadı.') });
  tl.sort((a, b) => a.min - b.min || (a.t === 'txt' ? -1 : 1));
  return { fxt, nat, cup: !!fxt.cup, ko: (!!fxt.cup && !fxt.lg && fxt.leg !== 1) || !!fxt.kof, agg: fxt.agg || [0, 0], awayEu: !!fxt.eu && !fxt.home && !fxt.final, eu: fxt.eu || null, role: rl, usR, oppR, tl, usG: 0, oppG: 0, pg: 0, pa: 0, rt: 6 + clamp((fit - 50) / 120, -.25, .3), yel: 0, red: false, mom: 0, ok: 0,
    tac, tac0: tac, fit, tasks, drain: T.st * WX[wx][3], wx, mark: mk, gk, lu, lo, scn, lh, cnt: { pas: 0, orta: 0, calim: 0, sav: 0, kurt: 0, bad: 0, on: 0 },
    big: perk('buyuk') && (derby || !!fxt.eu || !!fxt.final || !!fxt.po), adapt: !nat && S.adapt > 0, prep: S.fl.prep === absWeek(),
    derby, stam, stam0: stam, mode: 'n', calls: 2, on: rl !== 'yedek', unused: !sub, crowd: !nat && fxt.home ? 1 : 0, ref, bias: ref ? clamp(refBias(ref, S.clubId) - refBias(ref, fxt.opp) * .5 + ref.me, -1.2, 1.2) : 0 };
}

export function simMoment(k, M, v) {
  const base = { sut: .2, kafa: .17, frikik: .08, penalti: .76, pas: .62, calim: .45, savunma: .58, kurtaris: .74, vole: .15, rovesata: .07, orta: .48, korner: .45, duvar: .7, penkurtar: .26, kosu: .42, ribaund: .26, markaj: .6, cikis: .7 }[k];
  const shot = k === 'sut' || k === 'kafa' || k === 'frikik' || k === 'vole' || k === 'rovesata' || k === 'ribaund';
  const ok = chance(clamp(base + (skillFor(k) - M.oppR) * (shot ? 0.008 : 0.013) + (M.focus ? .06 : 0) + (M.prep ? .03 : 0) + (M.big ? .04 : 0) - (M.adapt ? .03 : 0) - (M.awayEu ? .02 : 0) - ((M.lh || 1) - 1) * .2 - (v && MVAR[v] ? MVAR[v].dif : 0) - (M.wx && WX[M.wx][4].includes(k) ? .03 : 0) - (S.diff === 'gercek' ? .03 : 0) + (S.diff === 'kolay' ? .04 : S.diff === 'zor' ? -.04 : 0) + (k === 'penalti' && perk('buz') ? .1 : 0) + (k === 'penalti' && M.gkw === 'pen' ? .05 : 0), .05, shot ? .42 : .92));
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
  const lucky = k === 'kosu' && res.out === 'ofsayt' && M.lines === false && chance(.4); if (lucky) res = { out: 'kacti' };   // mahalle maçında yan hakem yok
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
    if (out === 'kacti') { M.rt += .3; chain = 'sut'; if (lucky) lines.push({ s: tt('Ofsayttaydın ama yan hakem yok: hakem görmedi, devam!') }); lines.push({ s: tt('Savunmanın arkasına sarktın, kaleciyle karşı karşıyasın!') }); }
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
    } else if (out === 'kurtaris') {
      M.rt += k === 'penalti' ? -0.6 : 0.1; lines.push({ s: M.gk ? tt`Kaleci ${M.gk} vuruşunu çıkardı.` : tt('Kaleci vuruşunu çıkardı.') });
      if ((res.parry ?? chance(.2)) && chance(.6)) { chain = 'ribaund'; lines.push({ s: tt('Kaleci çeldi ama tutamadı: top ortada!') }); }   // çelinen top
    } else if (out === 'direk') {
      M.rt += 0.05;
      if (chance(.4)) { chain = 'ribaund'; lines.push({ s: tt('Direk! Top sana doğru geri sekti!') }); } else lines.push({ s: tt('Direk! Top oyun alanında kaldı.') });
    }
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
  if (M.unused) {   // kulübede kaldın: maç sayılmaz, hoca ve moral biraz düşer
    s.bench = (s.bench || 0) + 1; fx({ mo: -2, en: 6 }); lines.push(tt('Kulübede kaldın: süre almadın.'));
    if (win && !M.nat) { const prim = nice(s.con.wage * 0.12); if (prim) { s.money += prim; lines.push(tt`Prim: ${fmt(prim)}`); } }
    return { rt: 0, lines, win, lose, unused: true };
  }
  if (def && M.oppG === 0 && M.role === '11') M.rt += 0.6;
  const htd = M.ht ? htOk(M) : null; if (htd) M.rt += .15;
  M.rt += win ? 0.3 : lose ? -0.2 : 0;
  if (M.role === 'yedek') M.rt = 6 + (M.rt - 6) * 0.8;
  M.rt = clamp(Math.round(M.rt * 10) / 10, 3, 10);
  const rt = M.rt, cr = s.rt[s.clubId];
  if (M.nat && M.fxt.lvl === 'U21') {   // genç milli maçlar A milli sayısına yazılmaz
    s.car.ycaps++; s.car.yng += M.pg;
    fx({ rep: .6 + M.pg * .4, mo: win ? 4 : 0 });
    lines.push(tt`${s.car.ycaps}. genç milli maçın.`); if (s.car.ycaps === 1) docAdd('gmilli', tt('Genç milli formayla ilk maç'), 4, 'flag');
  } else if (M.nat) {
    s.car.caps++; s.car.ng += M.pg;
    fx({ rep: 1.5 + M.pg, mo: win ? 6 : 0 });
    lines.push(tt`${s.car.caps}. milli maçın.`); if (s.car.caps === 1) docAdd('milli', tt('Milli formayla ilk maç'), 6, 'flag');
  } else {
    s.st.apps++; s.st.g += M.pg; s.st.a += M.pa; s.st.rs += rt; if (!M.cup) s.st.lg += M.pg;
    s.lm = { w: absWeek(), us: M.usG, op: M.oppG, win, lose, rt, pg: M.pg };   // sosyal medya için son maç
    s.hate = clamp((s.hate || 10) + (lose ? 6 : 0) + (rt < 6 ? 5 : 0) - (win && rt >= 7.5 ? 5 : 0) + (s.fol > 50000 ? 1 : 0), 0, 100);
    const cs = s.cs[s.clubId] || (s.cs[s.clubId] = { apps: 0, g: 0 }); cs.apps++; cs.g += M.pg;
    if (s.con.app) { s.money += s.con.app; lines.push(tt`Maç başı prim: ${fmt(s.con.app)}`); }
    recTrack(M, lines); docMatch(M, rt, win);
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
  if (s.en < 30) hurt(1.5); if ((M.risk || 1) > 1) hurt(1.5);   // yorgun ya da zorlayarak oynamak vücudu yıpratır
  const spent = M.stam0 > M.stam ? clamp((M.stam0 - M.stam) / 45, .6, 1.6) : 1;   // maçta harcanan efor
  s.en = clamp(s.en - (M.cup ? 12 : M.role === '11' ? 18 : 9) * spent * (perk('akciger') ? .7 : 1), 0, 100);
  if (M.fxt.press) { if (win && rt >= 7) { fx({ taraf: 6 }); lines.push(tt('Sözünü tuttun. Taraftar +6')); } else { fx({ taraf: -5 }); lines.push(tt('İddialı konuştun, olmadı. Taraftar −5')); } }
  if (chance((0.015 + tired) * (M.role === '11' ? 1 : .5) * (M.risk || 1) * (perk('celik') ? .6 : 1) * (1 - .04 * ((s.up || {}).ekip || 0)) * (s.fl.kronik ? 1.8 : 1) * (1 + Math.max(0, 60 - health()) / 60) * (s.diff === 'gercek' ? 1.5 : 1))) {
    const r = Math.random();
    if (r < .7) { s.inj = ri(1, 3); hurt(3); lines.push(tt`Maçta sakatlandın: ${s.inj} hafta yoksun.`); }
    else if (r < .92) { s.inj = ri(4, 8); hurt(7); lines.push(tt`Kas yırtığı: ${s.inj} hafta yoksun.`); s.q.push({ id: 'kas', at: absWeek() + 1 }); docAdd('sakat', tt`Kas yırtığı: ${s.inj} hafta saha dışında`, 3, 'plus'); }
    else { s.inj = 6; s.fl.agir = 1; hurt(16); lines.push(tt('Dizinden ağır sakatlandın. Doktorlar seninle konuşmak istiyor.')); careerEnd(lines); if (!s.over) { s.q.push({ id: 'agir', at: absWeek() + 1 }); docAdd('sakat', tt('Ağır diz sakatlığı: sezonun en zor günü'), 5, 'plus'); } }
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
// Hedef takım: doğduğun şehrin en güçlü kulübü; bulunamazsa oyuncu kendi seçer
const CITYC = { 'İstanbul': ['Galata', 'Kadıköy', 'Beşiktaş', 'Başakşehir', 'Kasımpaşa', 'Eyüp', 'Karagümrük', 'İstanbul', 'Ümraniye', 'Pendik', 'Sarıyer', 'Esenler', 'Silivri', 'Beylerbeyi', 'Ataşehir'], 'İzmir': ['Göztepe', 'İzmir A', 'Karşıyaka', 'İzmir O', 'Menemen', 'Bucaspor', 'Konak'], 'Ankara': ['Ankara G', 'Ankara A', 'Keçiören', 'Ankara', 'Fomget'], 'Bursa': ['Bursa', 'İnegöl'], 'Kocaeli': ['Kocaeli', 'Gebze'], 'Trabzon': ['Trabzon'], 'Adana': ['Adana D', 'Adana', 'Adana'], 'Antalya': ['Antalya', 'Alanya', 'Serik'], 'Konya': ['Konya'], 'Samsun': ['Samsun'], 'Sakarya': ['Sakarya', 'Sakarya'] };
export function cityClubs(prov = S.prov) {
  const names = CITYC[prov] || [prov], out = [];
  for (const lid in S.lg) { if (LMAP[lid].c !== 'TR' || LMAP[lid].gen) continue; for (const id of S.lg[lid].t) { const n = CLUBS[id] && CLUBS[id].n; if (n && names.some(x => n.startsWith(x))) out.push(id); } }
  return out.sort((a, b) => S.rt[b] - S.rt[a]);
}
const SAK = () => cityClubs()[0] || null;
export function dreamList() {
  const out = [];
  for (const L of LEAGUES) { if (L.gen || L.tier > 2) continue; out.push(...[...S.lg[L.id].t].sort((a, b) => S.rt[b] - S.rt[a]).slice(0, L.id === 'tr1' ? 6 : 3)); }
  for (const id of cityClubs().slice(0, 3).reverse()) if (!out.includes(id)) out.unshift(id);   // memleketin kulüpleri listenin başında
  return out.filter(id => id !== S.clubId);
}
export function setDream(id) { S.dream = id; S.fl.drm = 1; delete S.fl.hayal; }
export function dreamInfo() {
  if (!S.dream) return null;
  const need = Math.round(S.rt[S.dream] - 4), o = OVR();
  return { id: S.dream, need, pct: clamp((o - 20) / Math.max(1, need - 20) * 100, 0, 100), w: S.watch.find(x => x.id === S.dream), mine: S.dream === S.clubId };
}

// ---------- sosyal medya akışı ----------
// a: 'me' | karakter anahtarı | 'c:<kulüp id>', k: tür (fan, haber, manset, kulup, rakip, ben)
export function addFeed(a, n, t, k = 'fan') {
  S.feed.unshift({ id: (S.fid = (S.fid || 0) + 1), a, n, t, k, l: Math.round(rnd(.2, 1.6) * (20 + S.fol * (k === 'ben' ? .06 : .01) + S.rep * 8)), w: S.week });
  if (S.feed.length > 60) S.feed.length = 60;
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
// ---------- sosyal medya: paylaşımlar, eleştirmenler, canlı akış ----------
const nextOpp = () => { const f = fixture() || sideFixture(); return f && !f.nat && club(f.opp) ? f : null; };
const fillT = t => { const f = nextOpp(), lm = S.lm; return t.replace(/\{(\w+)\}/g, (m, k) => ({ ad: S.name.split(' ')[0], kulup: club(S.clubId).n, rakip: f ? club(f.opp).n : S.rival && S.rival.c || tt('rakip'), il: S.prov, skor: lm ? `${lm.us}-${lm.op}` : '', num: String(S.num) })[k] ?? m); };
const fresh = (list, key) => { const q = S.fq || (S.fq = []), ok = list.filter(t => !q.includes(t)), t = pick(ok.length ? ok : list); q.push(t); if (q.length > 40) q.shift(); return t; };   // yakında yazılanı tekrar etme
export const canPost = p => {
  if (p.need && !p.need.some(has)) return false; if (p.spon && !S.spon.length) return false;
  const f = nextOpp();
  switch (p.id) {
    case 'mac': return !!S.lm && absWeek() - S.lm.w <= 1;
    case 'derbi': return !!f && isDerby(S.clubId, f.opp);
    case 'sakat': return S.inj > 0;
    case 'meydan': return !!f;
    case 'hayir': return S.money >= hayirCost();
    case 'cevap': return (S.hate || 0) >= 25;
    case 'idman': case 'taraf': case 'soru': return true;
  }
  return true;
};
export const hayirCost = () => nice(Math.max(500, (S.con ? S.con.wage : 0) * .5));
export function post(id) {
  const p = POSTS.find(x => x.id === id); S.used++; questHit('post');
  const g = Math.round((30 + S.rep * S.rep * 2) * rnd(.6, 1.4) * (1 + eff('fol')) * p.f * (perk('sahne') ? 1.5 : 1));
  const f = { ...p.fx, fol: g }; if (p.spon) f.para = nice(S.spon.reduce((a, x) => a + x.wk, 0) * .5); if (p.cost) f.para = -hayirCost();
  const list = p.id === 'mac' ? p[S.lm.win ? 'w' : S.lm.lose ? 'l' : 'd'] : p.t;
  addFeed('me', S.name, fillT(fresh(list)), 'ben');
  if (p.hate) S.hate = clamp((S.hate || 10) + p.hate, 0, 100);
  // yanıtlar: taraftar sever, eleştirmen bulduğu her fırsatta yazar
  const hateP = clamp((S.hate || 10) / 100 + (p.id === 'luks' || p.id === 'meydan' ? .3 : 0), .05, .85);
  if (id === 'luks' && chance(.3)) addFeed('taraftar', pick(FANS), tt('Biz bilet parası biriktirirken...'));
  else addFeed('taraftar', pick(FANS), say('reply'));
  if (chance(hateP)) hater(); else if (chance(.4)) addFeed('taraftar', pick(FANS), say('reply'));
  S.feedNew = 0;
  return fx(f);
}
// Eleştirmen yorumu: son maç, form ve paylaşımlara göre
const HTX = {
  gen: [tt('{ad} abartılıyor. Bir iki iyi maçla yıldız olunmuyor.'), tt('Sosyal medyası futbolundan iyi.'), tt('Bu seviyede oynayacak adam değil, söyleyeyim.'), tt('Menajeri iyi iş çıkarıyor, o kadar.'), tt('Forma ağır geliyor bence.'), tt('Kamera görünce koşuyor, gerisi yok.'), tt('Takipçi sayısı arttıkça futbol düşüyor.'), tt('Bu kadar övülecek bir şey göremedim ben.')],
  lose: [tt('Yine kaybettik, {ad} yine yoktu.'), tt('{skor}... Bu kadroyla küme düşeriz, ilki de {ad}.'), tt('Maçtan sonra paylaşım yapacağına idmana kal.'), tt('Taraftarı üzüp sonra kalp atıyor. Yemezler.')],
  luks: [tt('Araba güzel, keşke gol de atsa.'), tt('Biz bilet alamıyoruz, adam villa paylaşıyor.'), tt('Önce sahada göster, sonra lüks.')],
  low: [tt('Bugünkü performansla amatöre dönsün.'), tt('Bu notla bu maaş mı? Ayıp.'), tt('Kaç top kaybetti sayamadım.')],
};
export function hater(kind) {
  const lm = S.lm, k = kind || (lm && lm.lose && absWeek() - lm.w <= 1 ? 'lose' : lm && lm.rt < 6 && absWeek() - lm.w <= 1 ? 'low' : 'gen');
  addFeed('golge', pick(HATERS), fillT(fresh(HTX[k] || HTX.gen)), 'hater');
}
// Canlı akış: Sosyal açıkken birkaç saniyede bir yeni gönderi (haftada sınırlı)
const LTX = {
  fan: [tt('{kulup} bu sezon başka oynuyor, söylemiş olayım.'), tt('{ad} topu alınca tribün ayağa kalkıyor.'), tt('Cumartesi stat dolsun! Herkes formasıyla gelsin.'), tt('{num} numaralı formayı aldım, oğlum çıkarmıyor.'), tt('Kale arkasında yerimizi ayırdık. Sesimizi duyacaklar.'), tt('{ad} bizim mahalleden. Gurur duyuyoruz.'), tt('Bu takımın bir hikâyesi var, izlemeye değer.'), tt('Hocanın sistemi oturdu, sabırlı olun.')],
  win: [tt('{skor}! Gece boyunca kornalar susmadı.'), tt('{ad} bugün sahnenin sahibiydi.'), tt('Böyle oynarsak kimse tutamaz.')],
  lose: [tt('{skor}... Moraller bozuk ama sezon uzun.'), tt('Bugün olmadı, cumartesi rövanş.'), tt('Takım yorgun görünüyordu, hoca rotasyon yapmalı.')],
  rakip: [tt('{rakip} taraftarı şimdiden atıp tutuyor, sahada görüşürüz.'), tt('{rakip} maçı için bilet kuyruğu sokağa taştı.'), tt('{rakip} savunması bu hafta {ad} için özel önlem alıyormuş.')],
  haber: [tt('Kulislerde {ad} için gözlemci geldiği konuşuluyor.'), tt('{kulup} antrenmanında {ad} göz doldurdu.'), tt('Yerel basın: {kulup} bu hafta kampa giriyor.'), tt('{il} amatör futbolu bu sezon ilgi rekoru kırıyor.')],
  trend: [tt('#{kulup} gündemde ilk 10\'a girdi.'), tt('#{ad}{num} etiketi bugün trend oldu.'), tt('Maç günü paylaşımları: tribün koreografisi hazır.')],
};
export function liveFeed() {
  const s = S, wk = absWeek(); if (s.mgr) return null;
  if (s.lfw !== wk) { s.lfw = wk; s.lfn = 0; }
  if (s.lfn >= 12) return null; s.lfn++;
  const lm = s.lm && wk - s.lm.w <= 1 ? s.lm : null, f = nextOpp(), r = Math.random(), hp = clamp((s.hate || 10) / 160, .05, .45);
  if (r < hp) { hater(); return s.feed[0]; }
  const pool = r < .55 ? (lm ? (lm.win ? 'win' : lm.lose ? 'lose' : 'fan') : 'fan') : r < .7 && f ? 'rakip' : r < .87 ? 'haber' : r < .95 ? 'trend' : 'fan';
  const a = pool === 'haber' ? 'basin' : pool === 'rakip' ? 'golge' : 'taraftar', n = pool === 'haber' ? pick([tt('Saha Kenarı'), tt('Amatörün Sesi'), tt('Spor Muhabiri')]) : pool === 'rakip' ? club(f.opp).n.replace(/\s+/g, '').toLocaleLowerCase(LC) + '_fan' : pool === 'trend' ? tt('Gündem') : pick(FANS);
  addFeed(a, n, fillT(fresh(LTX[pool])), pool === 'haber' ? 'haber' : pool === 'trend' ? 'trend' : 'fan');
  return s.feed[0];
}
// Eleştirmene cevap: 0 kibar, 1 sert, 2 esprili, 3 görmezden gel
export function hateReply(id, k) {
  const p = S.feed.find(x => x.id === id); if (!p || p.k !== 'hater' || p.r) return null; p.r = k + 1;
  const out = k === 0 ? fx({ basin: 2, taraf: 1 }) : k === 1 ? fx({ ego: 3, taraf: 2, basin: -3, fol: Math.round(60 + S.fol * .02) }) : k === 2 ? fx({ taraf: 2, fol: Math.round(40 + S.fol * .03) }) : [];
  S.hate = clamp((S.hate || 10) + [-5, 8, -8, -2][k], 0, 100);
  const say2 = [tt('Eleştirin için teşekkürler, sahada daha iyisini göstereceğim.'), tt('Klavyenin arkasından kolay. Gel cumartesi tribünde söyle.'), tt('Haklısın, bir dahaki golü sana armağan ederim.'), ''][k];
  if (say2) addFeed('me', S.name, '@' + p.n + ' ' + say2, 'ben');
  S.feedNew = 0;
  return out;
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
    if (c === 0) { M.risk = 3; M.rt += .3; hurt(2); fx({ hoca: 2 }); L.push({ s: tt('Dişini sıktın. Sakatlık riskin arttı.') }); }
    else if (c === 2) { M.risk = 1.5; M.stam = Math.max(0, (M.stam || 0) - 10); L.push({ s: tt('Saha kenarında bandaj yapıldı. Biraz aksıyorsun ama oyundasın.') }); }
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
  if (!M.ref) return null;
  if (!(M.varOn ??= hasVar(M.fxt))) return chance(.03) ? { cancel: true, why: tt('ofsayt'), noVar: true } : null;   // VAR yok: hakemin düdüğü son söz
  if (!chance(.05 + M.ref.vr * .1)) return null;
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
// Kontenjanlar UEFA ülke sıralamasına göre: [doğrudan Kıta Ligi, KL eleme turu, Kıta Kupası]
const EUQ_E = { en1: [4, 0, 2, 1], es1: [4, 0, 2, 1], it1: [4, 0, 2, 1], de1: [4, 0, 2, 1], fr1: [3, 1, 2, 1], nl1: [2, 1, 2, 1], pt1: [1, 1, 2, 1], tr1: [1, 1, 2, 1] };   // son sütun: Kıta Kalkanı
// Kadınlar (UEFA 2026/27 erişim listesi): 1-2. ülkelerin ilk ikisi ve 3-6. ülkelerin şampiyonu doğrudan lig aşamasında, diğerleri elemede.
// Kıta Kalkanı yok; ikinci kupa Kadınlar Kıta Kupası (Hollanda üçüncüsü ve Türkiye ikincisi doğrudan, eleme kaybedenleri de oraya geçer).
const EUQ_K = { en1: [2, 1, 0, 0], fr1: [2, 1, 0, 0], es1: [1, 2, 0, 0], de1: [1, 2, 0, 0], it1: [1, 2, 0, 0], pt1: [1, 2, 0, 0], nl1: [0, 2, 1, 0], tr1: [0, 1, 1, 0] };
export let EUQ = EUQ_E;
const EUK_E = ['cl', 'el', 'ko'], EUK_K = ['cl', 'el'];
export let EUK = EUK_E;
const EUN_E = { cl: 'Kıta Ligi', el: 'Kıta Kupası', ko: 'Kıta Kalkanı' }, EUN_K = { cl: 'Kadınlar Kıta Ligi', el: 'Kadınlar Kıta Kupası' };
export let EUN = EUN_E;
const EUWK = [6, 8, 18, 20, 24, 26, 30, 32];   // Kadınlar Kıta Kupası: son 16'dan finale dört tur, hepsi çift maçlı
const EUW = [3, 6, 8, 11, 13, 15, 18, 20, 24, 26, 30, 32, 36], EUMD = 6;   // lig aşaması, sonra çift maçlı turlar ve tek maç final
// S.eps: geçen sezon Avrupa'da en iyi iki ülke, fazladan bir Kıta Ligi bileti alır
export function euroSpots(lid) { const q = EUQ[lid]; if (!q) return null; return { cl: q[0] + (!KW && (S.eps || []).includes(lid) ? 1 : 0), clq: q[1], el: q[2], ko: q[3] }; }
export function euroZone(lid, i) { const q = euroSpots(lid); if (!q) return ''; return i < q.cl ? 'cl' : i < q.cl + q.clq ? 'clq' : i < q.cl + q.clq + q.el ? 'el' : i < q.cl + q.clq + q.el + q.ko ? 'ko' : ''; }
export const euroOf = id => EUK.find(k => S[k] && S[k].teams.includes(id)) || null;
// Kulübün bu haftaki / sıradaki Avrupa maçı (hangi kupadaysa)
export const euFix = () => { for (const k of EUK) { const f = euroFixture(k); if (f) return f; } return null; };
export const sideFixture = () => cupFixture() || euFix() || xcFixture();

// Önceki sezonun sıralamasına (ilk sezonda güce) göre Avrupa'ya gidenler. Kupa şampiyonu Kıta Kupası'na gider.
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
// Kadınlar: Kıta Ligi 18 takımlı lig aşaması (8 doğrudan + elemeden 10), Kıta Kupası 16 takımlı çift maçlı eleme.
// Eleme iki yoldan: şampiyonlar yolu (4 bilet) ve lig yolu (6 bilet). Kaybedenler Kıta Kupası'na geçer.
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
  for (const id of q.q) {   // eleme turu: iki maç toplamı, kaybeden Kıta Kupası'na
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
  if (m) addNews(m[4] === S.clubId ? tt`Kıta Ligi elemesinde ${club(m[1]).n} geçildi: ${m[2]}-${m[3]}.` : tt`Kıta Ligi elemesinde ${club(m[1]).n} turladı (${m[2]}-${m[3]}). Yola Kıta Kupası'nda devam.`, 'trophy');
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
      if (!isBiz()) S.tro.push(seasonLabel() + ' · ' + c.name + (S.mgr ? (S.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : ''));
      const b = nice(S.con.wage * { cl: 24, el: 14, ko: 8 }[k]); S.money += b; fx({ mo: 18, taraf: 12, rep: { cl: 7, el: 4, ko: 2 }[k] });
      if (k !== 'ko') unlock(k === 'cl' ? 'avrupa' : 'al');
      addNews(tt`${c.name} şampiyonusunuz! Kupa müzeye gidiyor.`, 'trophy');
    } else addNews(tt`${c.name} şampiyonu ${club(c.champ).n}.`, 'trophy');
    addFeed('basin', tt('Saha Kenarı'), tt`${c.name} şampiyonu: ${club(c.champ).n}!`, 'manset');
  } else if (me) addNews(me[4] === S.clubId ? tt`${c.name}: toplamda ${Math.max(me[5], me[6])}-${Math.min(me[5], me[6])} ile tur atladınız.` : tt`${c.name}: toplamda elendiniz.`, 'trophy');
}
// Ülke katsayısı: Avrupa'daki ortalama başarı. En iyi iki lig gelecek sezon fazladan KL bileti alır.
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
export const ivDue = () => S.ivm !== 'final' && absWeek() >= (S.ivn || 0);   // mikrofonlar her hafta uzanmaz
export function ivPick(kind, fxt, M, n = 2) {
  if (kind !== 'imza') S.ivn = absWeek() + (S.ivm === 'sik' ? ri(2, 3) : ri(10, 14));
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
  s.clubId = o.id; s.loan = null; s.watch = []; s.q = []; s.inj = 0; s.ban = 0; s.over = null; s.tstat = 'mutlu'; s.adapt = 0; s.used = 0; s.agent = null; s.job = 0;
  s.con = { wage: o.wage || 0, until: s.season + 9, role: '11', goalB: 0, rel: 0 };
  s.mgr = { role, conf: 55, bud: mgrBud(o.id), tr: 'denge', act: 0, talk: 0, obj: 1, since: s.season, hist: prev ? prev.hist : [], jobs: (prev ? prev.jobs : 0) + 1, sacked: 0, mw: 0 };
  s.mgr.obj = mgrObj();
  if (role === 'coach') s.co[o.id] = { n: s.name, st: (s.co[o.id] || {}).st || 'top', me: 1 };
  if (role === 'coach') { s.mgr.xi = null; mgrXI(); }   // kadro hemen kurulur ve kayda girer
  if (s.week <= 1) initCup();   // sezon ortasında göreve gelirsen kupa kurası yenilenmez
  assignRef();
  addNews(role === 'coach' ? tt`${club(o.id).n} teknik direktörlüğüne getirildin.` : tt`${club(o.id).n} başkanı oldun.`, role === 'coach' ? 'whistle' : 'crown');
  addFeed('c:' + o.id, club(o.id).n, role === 'coach' ? tt`Yeni teknik direktörümüz ${s.name}. Hoş geldin hocam!` : tt`Yeni başkanımız ${s.name}. Hayırlı olsun!`, 'kulup');
  save();
}
export const mgrShare = () => (S.mgr && S.mgr.role === 'pres' ? nice(mgrBud(S.clubId) * .004) : 0);
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
    case 'talk': m.talk = 1; for (const x of mgrXI() || []) x.mo = clamp(x.mo + 6, 0, 100); return [tt('Soyunma odasında herkesle tek tek konuştun. Hafta sonu daha istekli çıkacaklar.'), [tt('Sıradaki maç: takım gücü +1,5')]];
    case 'drill': { const p = mgrXI(); if (p) { for (const x of p) { x.en = clamp(x.en - 12, 5, 100); if (x.age <= 28) x.q = +clamp(x.q + .25, 5, Math.max(x.q, x.pot)).toFixed(2); } if (chance(.25)) { const v = pick(p.filter(free)); if (v) { v.inj = ri(1, 3); addNews(tt`${v.n} çift idmanda sakatlandı: ${v.inj} hafta yok.`, 'plus'); } syncRt(); return [tt('Fazla yüklendin; bir oyuncu adale sakatlığı yaşadı.'), [tt('Kondisyon −12'), tt('Bir sakat')]]; } syncRt(); return [tt('Çift idman meyvesini verdi. Gençler bir adım öne çıktı.'), [tt('Kondisyon −12'), tt('28 yaş altı güç +0,25')]]; }
      if (chance(.25)) { up(-.3); return [tt('Fazla yüklendin; iki oyuncu adale sakatlığı yaşadı.'), [tt('Takım gücü −0,3')]]; } up(.12); return [tt('Çift idman meyvesini verdi.'), [tt('Takım gücü +0,1')]]; }
    case 'youth': if (mgrXI()) { if (chance(.6)) { const k = mkYouth(s.rt[id] + ri(2, 8)); m.xi.yth.push(k); m.xi.yth = m.xi.yth.slice(-8); return [tt`Altyapı maçında ${k.n} gözüne çarptı. ${k.age} yaşında, ${POS[k.pos].n.toLocaleLowerCase(LC)}.`, [tt('Altyapı listesine eklendi'), tt`Potansiyel ${k.pot}`]]; } return [tt('Bu hafta göze çarpan yoktu. Ama çocuklar hocayı kenarda görünce bir başka koştu.'), []]; }
      if (chance(.3)) { up(.5); m.conf = clamp(m.conf + 3, 0, 100); addNews(tt('Altyapıdan bir cevher A takıma yükseldi.'), 'star'); return [tt('On yedi yaşında bir çocuk gözüne çarptı. A takıma aldın; tribün bayıldı.'), [tt('Takım gücü +0,5'), tt('Güven +3')]]; } return [tt('Bu hafta göze çarpan yoktu. Ama çocuklar hocayı kenarda görünce bir başka koştu.'), []];
    case 'press': { const g = chance(.6 + s.rep / 400); m.conf = clamp(m.conf + (g ? 4 : -4), 0, 100); return [g ? tt('Sakin, net, kendinden emin. Manşetler lehine.') : tt('Bir soruya sinirlendin; görüntü günlerce döndü.'), [g ? tt('Güven +4') : tt('Güven −4')]]; }
    case 'invest': s.fx[id] = (s.fx[id] || 0) + 1; up(.4); m.conf = clamp(m.conf + 5, 0, 100); addNews(tt`${club(id).n} tesislerine yatırım yapıldı.`, 'train'); return [tt('Yeni sahalar, yeni fizik tedavi merkezi. Etkisi yıllarca sürer.'), [tt('Tesis +1'), tt('Takım gücü +0,4'), tt('Güven +5')]];
    case 'ticket': m.conf = clamp(m.conf + 4, 0, 100); return [tt('Kombine fiyatları indi; kale arkası doldu.'), [tt('Güven +4')]];
    case 'sponsor': { const g = chance(.45 + s.rep / 400), v = nice(mgrBud(id) * .3); if (g) m.bud += v; return [g ? tt('El sıkıştınız. Forma göğsüne yeni bir isim geliyor.') : tt('Görüşme uzadı, imza çıkmadı.'), g ? [tt('Bütçe +') + fmtS(v)] : []]; }
    case 'sack': { const old = coach().n, st = pick(Object.keys(TACT).filter(x => x !== coach().st)); s.co[id] = { n: rname(LMAP[leagueOf(id)].c), st }; m.conf = clamp(m.conf + 2, 0, 100); addNews(tt`${old} ile yollar ayrıldı. Yeni hoca ${s.co[id].n}.`, 'whistle'); return [tt`${old} gitti, ${s.co[id].n} geldi. Sistemi: ${TACT[st].n.toLocaleLowerCase(LC)}.`, [tt('Kadro uyumu ') + (squadFit(st) >= 0 ? '+' : '−') + Math.abs(squadFit(st))]]; }
  }
  return null;
}
function mgrTick() {
  if (isBiz()) return bizTick();
  const s = S, m = s.mgr, id = s.clubId, d = { denge: .012, hucum: .008, sav: .008, genc: .022 }[m.tr] || .012;
  if (m.role !== 'coach') s.rt[id] = clamp(s.rt[id] + d * .3, 15, 95);   // teknik direktörde güç kadrodan gelir (xiTick)
  m.bud += Math.round(mgrBud(id) * .008); m.act = 0; xiTick();
  if (m.role === 'pres') s.money += mgrShare();   // başkanın haftalık kâr payı
  m.conf = clamp(m.conf + (50 - m.conf) * .02, 0, 100);
  if (m.conf < 12) m.sacked = 1;
}
// ---------- kenar maçı: dakika dakika motor ----------
// Devre arası konuşması: [ad, ikon, açıklama]
export const HTT = [[tt('Övgü'), 'star', tt('Öndeysen ateşler; gerideysen rehavet')], [tt('Sakin ve net'), 'target', tt('Küçük ama güvenli etki')], [tt('Fırça'), 'alert', tt('Gerideysen silkeler; öndeysen tepki çeker')]];
// Maç içi talimat: [ad, ikon, açıklama]; on iki dakika sürer
export const SHOUT = { baski: [tt('Baskıyı artır'), 'bolt', tt('Daha çok pozisyon; daha çok yorgunluk')], sakin: [tt('Sakin oyna'), 'shield', tt('Daha az gol yersin; tempo düşer')], mucadele: [tt('Daha çok mücadele'), 'users', tt('Takım güçlenir; kart riski artar')], odak: [tt('Konsantre olun'), 'target', tt('Savunma hatası azalır')] };
const plM = u => (mgrXI() || []).find(x => x.u === u);
export function mgrMatch(fxt) {
  const s = S, m = s.mgr, p = m.role === 'coach' ? mgrXI() : null;
  if (p && (!m.xi.man || p.some(x => x.on && !free(x)))) reXI();
  const M = { fxt, min: 0, usG: 0, oppG: 0, ev: [], agg: fxt.agg || [0, 0], ko: (!!fxt.cup && !fxt.lg && fxt.leg !== 1) || !!fxt.po, eu: fxt.eu || null,
    hb: fxt.final ? 0 : fxt.home ? 2 : fxt.eu ? -3.5 : -2, st: coach().st, ment: 2, subs: 5, rd: [0, 0], sh: [0, 0], talk: m.talk ? 1.5 : 0, ht: 0, shout: null, shCd: 0,
    on: [], bench: [], pe: {}, pr: {}, yc: {}, inj: {}, red: {}, g: {}, a: {}, played: [], oppR0: s.rt[fxt.opp], oppAtt: 0, oppSubs: 0, auto: 0 };
  if (p) {
    for (const x of p.filter(y => y.on)) { M.on.push(x.u); M.played.push(x.u); }
    M.bench = p.filter(x => !x.on && free(x)).sort((a, b) => b.q - a.q).slice(0, 9).map(x => x.u);
    for (const u of [...M.on, ...M.bench]) { M.pe[u] = plM(u).en; M.pr[u] = 6.3; }
  }
  M.usR = usStr(M); M.oppR = M.oppR0;
  return M;
}
export function usStr(M) {
  const s = S, m = s.mgr; let r;
  if (m.role === 'coach' && m.xi) {
    const C = FORMS[m.xi.fm].c, P = M.on.map(plM).filter(Boolean); let b = 0, pen = 0;
    for (const x of P) b += x.q - Math.max(0, 62 - M.pe[x.u]) * .14 + (x.fm - 6.5) * .4 + (x.mo - 60) * .012;
    r = b / 11; if (P.length < 11) r -= (11 - P.length) * .6;   // eksik oyuncu: ortalama düşer, üstüne ceza
    const cnt = k => P.filter(x => x.pos === k).length;
    pen += cnt('KL') !== 1 ? 4 : 0; for (const k of ['DF', 'OS', 'KN', 'FV']) pen += Math.max(0, C[k] - cnt(k) - M.rd[0]) * .45;
    r -= pen;
  } else r = s.rt[s.clubId];
  const sh = M.shout && M.min < M.shout.to ? M.shout.k : '';
  return r + squadFit(M.st) + M.talk + M.ht + (sh === 'mucadele' ? 1.2 : 0);
}
function rates(M) {
  const m = S.mgr, T = TACT[M.st], F = FORMS[(m.xi && m.xi.fm) || '4-4-2'], Mn = MENT[M.ment], tr = m.tr === 'hucum' ? [1.06, 1.03] : m.tr === 'sav' ? [.96, .9] : [1, 1];
  const sh = M.shout && M.min < M.shout.to ? M.shout.k : '', us = usStr(M), op = M.oppR0 - M.rd[1] * 5.5 + (M.oppAtt ? 1 : 0);
  let lu = 1.35 * Math.exp((us + M.hb - op) * .05) * T.lu * F.a * Mn[1] * tr[0], lo = 1.2 * Math.exp((op - M.hb - us) * .05) * T.lo * F.d * Mn[2] * tr[1];
  if (sh === 'baski') { lu *= 1.12; lo *= 1.04; } if (sh === 'sakin') { lu *= .9; lo *= .86; } if (sh === 'odak') lo *= .87;
  if (M.oppAtt) { lo *= 1.14; lu *= 1.12; }
  return [clamp(lu, .05, 5) / 90, clamp(lo, .05, 5) / 90];
}
const W_G = { FV: 5, KN: 3, OS: 2, DF: .6, KL: .02 }, W_A = { OS: 3, KN: 3, FV: 1.6, DF: 1, KL: .1 };
function wpickU(list, wf) { const w = {}; for (const u of list) w[u] = Math.max(.001, wf(plM(u))); return +wpick(w); }
const oppName = (M, pos) => { if ((M.oppIn || []).length && chance(.3)) return pick(M.oppIn); const q = squad(M.fxt.opp), c = SQP.map((p, i) => (pos.includes(p) && !(M.oppOut || []).includes(q[i]) ? i : -1)).filter(i => i >= 0); return c.length ? q[pick(c)] : q[9]; };   // oyundan çıkan rakip oyuncu bir daha anılmaz
function goal(M, us, out) {
  const min = M.min;
  if (us) {
    M.usG++; M.sh[0]++;
    let n = club(S.clubId).n, as = '';
    if (M.on.length) {
      const u = wpickU(M.on, x => W_G[x.pos] * Math.pow(x.q / 50, 2)); M.g[u] = (M.g[u] || 0) + 1; M.pr[u] += 1.05; n = plM(u).n;
      const oth = M.on.filter(v => v !== u); if (oth.length && chance(.78)) { const a = wpickU(oth, x => W_A[x.pos] * x.q / 50); M.a[a] = (M.a[a] || 0) + 1; M.pr[a] += .55; as = plM(a).n; }
      for (const v of M.on) M.pr[v] += .08;
    } else if (S.sc[S.clubId]) n = pick(S.sc[S.clubId])[0];
    out.push({ min, t: 'g', us: true, n, as });
  } else {
    M.oppG++; M.sh[1]++;
    for (const v of M.on) { const x = plM(v); M.pr[v] -= x && (x.pos === 'DF' || x.pos === 'KL') ? .3 : .06; }
    out.push({ min, t: 'g', us: false, n: oppName(M, ['FV', 'KN', 'OS']) });
  }
}
function card(M, us, out) {
  const min = M.min;
  if (!us) { if (chance(.05)) { M.rd[1]++; out.push({ min, t: 'r', us: false, n: oppName(M, ['DF', 'OS']) }); } else out.push({ min, t: 'y', us: false, n: oppName(M, ['DF', 'OS', 'KN']) }); return; }
  if (!M.on.length) return;
  const sh = M.shout && M.min < M.shout.to && M.shout.k === 'mucadele';
  const u = wpickU(M.on, x => ({ DF: 3, OS: 2.4, KN: 1.2, FV: 1, KL: .2 })[x.pos]);
  const red = M.yc[u] || chance(sh ? .05 : .03);
  if (red) { M.red[u] = 1; M.on = M.on.filter(v => v !== u); M.rd[0]++; M.pr[u] -= 1.2; out.push({ min, t: 'r', us: true, n: plM(u).n, u }); }
  else { M.yc[u] = 1; M.pr[u] -= .2; out.push({ min, t: 'y', us: true, n: plM(u).n, u }); }
}
// Oyuncu değişikliği: out sahadan çıkan, inn kulübeden giren
export function mgrSub(M, out, inn) {
  if (M.subs <= 0 || !M.on.includes(out) || !M.bench.includes(inn)) return false;
  M.on = M.on.map(v => (v === out ? inn : v)); M.bench = M.bench.filter(v => v !== inn); M.subs--; if (!M.played.includes(inn)) M.played.push(inn);
  if (M.need === out) M.need = 0;
  M.ev.push({ min: M.min, t: 's', us: true, n: plM(inn).n, o: plM(out).n });
  return true;
}
// Yardımcı değişiklik yapar: sakat, kırmızı sonrası eksik mevki ya da yorgun oyuncu
function aiSubs(M, out) {
  if (!M.on.length || M.subs <= 0) return;
  const tryOne = cand => { if (!cand) return false; const x = plM(cand), alt = M.bench.map(plM).filter(y => y && y.pos === x.pos).sort((a, b) => b.q - a.q)[0] || M.bench.map(plM).filter(y => y && y.pos !== 'KL').sort((a, b) => b.q - a.q)[0]; if (!alt) return false; const n0 = M.ev.length; if (!mgrSub(M, cand, alt.u)) return false; out.push(...M.ev.slice(n0)); return true; };
  if (M.need) { tryOne(M.need); return; }
  if (M.min >= 58 && (M.min % 8 === 2 || M.min >= 85)) { const tired = M.on.filter(u => M.pe[u] < 52).sort((a, b) => M.pe[a] - M.pe[b])[0]; if (tired) tryOne(tired); }
}
function stepMin(M, out) {
  const min = ++M.min, [pu, po] = rates(M), sh = M.shout && min < M.shout.to ? M.shout.k : '', T = TACT[M.st];
  for (const u of M.on) M.pe[u] = Math.max(5, M.pe[u] - .19 * MENT[M.ment][3] * T.st * (sh === 'baski' ? 1.35 : 1));
  if (chance(pu)) goal(M, true, out); else if (chance(pu * 1.1)) { M.sh[0]++; out.push({ min, t: 'c', us: true, n: M.on.length ? plM(wpickU(M.on, x => W_G[x.pos])).n : '' }); }
  if (chance(po)) goal(M, false, out); else if (chance(po * 1.1)) { M.sh[1]++; out.push({ min, t: 'c', us: false, n: oppName(M, ['FV', 'KN']) }); }
  if (chance(.017 * (sh === 'mucadele' ? 1.5 : 1))) card(M, true, out);
  if (chance(.017)) card(M, false, out);
  if (M.on.length && chance(.0018 + (sh === 'baski' ? .001 : 0))) {
    const u = wpickU(M.on, x => 1 + Math.max(0, 60 - M.pe[x.u]) * .08); M.inj[u] = ri(1, 5); M.pr[u] -= .2; M.need = u; out.push({ min, t: 'i', us: true, n: plM(u).n, u, w: M.inj[u] });
  }
  if (min >= 70 && !M.oppAtt && M.oppG + M.agg[1] < M.usG + M.agg[0]) { M.oppAtt = 1; out.push({ min, t: 'm', us: false, k: 'att' }); }
  if ([60, 68, 77].includes(min) && M.oppSubs < 3) { M.oppSubs++; const o = oppName(M, ['OS', 'KN', 'FV']), n = rname(LMAP[leagueOf(M.fxt.opp)] ? LMAP[leagueOf(M.fxt.opp)].c : 'TR'); (M.oppOut || (M.oppOut = [])).push(o); (M.oppIn || (M.oppIn = [])).push(n); out.push({ min, t: 's', us: false, n, o }); }
  if (M.auto || (M.need && M.subs <= 0)) aiSubs(M, out);
  if (M.need && (M.subs <= 0 || !M.bench.length)) { M.on = M.on.filter(v => v !== M.need); M.need = 0; out.push({ min, t: 'm', us: true, k: 'ten' }); }
}
export function mgrRun(M, to) { const out = []; while (M.min < to) stepMin(M, out); M.ev.push(...out); return out; }
export function mgrHalf(M, ku, ko, from, span = 45) { mgrRun(M, from + span); }   // eski çağrılar için
export function mgrTalk(M, i) {
  const d = M.usG - M.oppG; M.ht = i === 0 ? (d > 0 ? 1.2 : d === 0 ? .4 : -.7) : i === 1 ? .5 : (d < 0 ? 1.6 : d === 0 ? .3 : -1);
  if (i === 2 && d > 0) for (const u of M.on) { const x = plM(u); if (x) x.mo = clamp(x.mo - 3, 0, 100); }
  return M.ht;
}
export function mgrShout(M, k) { if (!SHOUT[k] || M.min < M.shCd) return false; M.shout = { k, to: M.min + 12 }; M.shCd = M.min + 15; M.ev.push({ min: M.min, t: 'm', us: true, k: 'sh', sh: k }); return true; }
export function mgrMent(M, i) { if (MENT[i]) M.ment = i; }
export function mgrStyle(M, k) { if (TACT[k]) { M.st = k; coach().st = k; } }
// Penaltı atışları: her vuruş tek tek; güçlü takımın vuruşçusu biraz daha isabetli
export function mgrPens(M) {
  const pu = clamp(.75 + (usStr(M) - M.oppR0) * .006, .62, .86), po = clamp(.75 + (M.oppR0 - usStr(M)) * .006, .62, .86), us = [], op = [];
  for (let i = 0; i < 30; i++) {
    us.push(chance(pu)); op.push(chance(po));
    const a = us.filter(Boolean).length, b = op.filter(Boolean).length, n = us.length;
    if (n <= 5) { if (a > b + (5 - n) || b > a + (5 - n)) break; } else if (a !== b) break;
  }
  return { us, op, win: us.filter(Boolean).length > op.filter(Boolean).length };
}
// Tüm maçı yardımcı yönetir (simülasyon ve otomatik oyun)
export function mgrSim(M) {
  M.auto = 1; mgrRun(M, 45); if (S.mgr.role === 'coach') mgrTalk(M, M.usG < M.oppG ? 2 : 1);
  if (M.usG < M.oppG) M.ment = 3; mgrRun(M, 90);
  let pens = null; const tu = () => M.usG + M.agg[0], to = () => M.oppG + M.agg[1];
  if (M.ko && tu() === to()) { mgrRun(M, 120); if (tu() === to()) pens = mgrPens(M); }
  return { win: M.ko ? tu() > to() || !!(pens && pens.win) : M.usG > M.oppG, pens };
}
export function mgrAfter(M, win) {
  const s = S, m = s.mgr, lose = !win && M.usG < M.oppG, d = M.oppR0 - (M.usR || s.rt[s.clubId]), lines = [];
  const dv = win ? 1.2 + clamp(d * .35, 0, 5) : lose ? -2.5 - clamp(-d * .35, 0, 5) : (d > 3 ? 1.5 : d < -3 ? -2 : -.5);
  m.conf = clamp(m.conf + dv * (M.fxt.cup ? 1.3 : 1), 0, 100); m.talk = 0;
  lines.push(tt('Güven ') + (dv >= 0 ? '+' : '−') + Math.abs(Math.round(dv)));
  if (win && m.role === 'coach') { const b = nice(s.con.wage * .2); if (b) { s.money += b; lines.push(tt('Prim: ') + fmt(b)); } }
  if (m.role === 'coach' && m.xi) {
    const p = mgrXI(); let mom = null;
    for (const x of p) {
      if (M.played.includes(x.u)) {
        const r = +clamp(M.pr[x.u] + (win ? .35 : lose ? -.25 : 0) + rnd(-.35, .35), 3, 10).toFixed(1);
        x.en = Math.round(M.pe[x.u] ?? x.en); x.st.ap++; x.st.g += M.g[x.u] || 0; x.st.a += M.a[x.u] || 0; x.st.rs += r; x.lr = r;
        x.fm = +clamp(x.fm + (r - x.fm) * .35, 4.5, 9).toFixed(1); x.mo = clamp(x.mo + (win ? 3 : lose ? -2 : 0) + (r >= 7.5 ? 2 : 0), 0, 100);
        if (M.yc[x.u] && !M.red[x.u]) { x.yc++; if (x.yc >= 5) { x.yc = 0; x.ban = 1; addNews(tt`${x.n} sarı kart cezalısı: bir maç yok.`, 'alert'); } }
        if (M.red[x.u]) { x.ban = ri(1, 3); addNews(tt`${x.n} kırmızı kart gördü: ${x.ban} maç ceza.`, 'alert'); }
        if (M.inj[x.u]) { x.inj = M.inj[x.u]; addNews(tt`${x.n} maçta sakatlandı: ${x.inj} hafta yok.`, 'plus'); }
        if (!mom || r > mom[1]) mom = [x, r];
      } else {
        if (x.ban > 0 && !x.loanOut) x.ban--;
        x.fm = +clamp(x.fm + (6.3 - x.fm) * .1, 4.5, 9).toFixed(1);
      }
    }
    if (mom) { lines.push(tt`Maçın oyuncusu: ${mom[0].n} (${mom[1].toFixed(1).replace('.', DSEP)})`); M.mom = mom[0].u; }
    const top = [...p].sort((a, b) => b.st.g - a.st.g).slice(0, 2); if (top.length === 2) s.sc[s.clubId] = top.map(x => [x.n, x.st.g]);
    syncRt();
  }
  const cn = club(s.clubId).n, on = club(M.fxt.opp).n;
  addFeed('c:' + s.clubId, cn, tt`MAÇ SONU | ${cn} ${M.usG}-${M.oppG} ${on}`, 'kulup');
  addFeed('taraftar', pick(FANS), win ? pick([tt`${s.name} ne dokunduysa oldu.`, tt('Bu takım oynuyor. Helal.'), tt('Pazartesi işe mutlu gidiyoruz.')]) : lose ? pick([tt`${s.name} bu kadroyla ne yapsın... ya da ne yapmasın?`, tt('Böyle olmaz. Bir şey değişmeli.'), tt('Tribün sabırsız.')]) : tt('Bir puan bir puandır. Ama yetmez.'));
  return lines;
}
// Transfer dönemi: üç hedef. plus: takım gücüne katkı
export function mgrMarket() {
  const s = S, base = mgrBud(s.clubId), L = LMAP[leagueOf(s.clubId)];
  const loc = !L || (L.c === 'TR' && (L.tier || 1) >= tierCfg().low);   // alt liglerde ve amatörde yabancı oyuncu masaya gelmez
  return [.4, .8, 1.3].map((pl, i) => ({ n: rname(loc ? 'TR' : pick([L.c, L.c, 'TR', 'EN', 'ES'])), pos: pick([tt('Forvet'), tt('Kanat'), tt('Orta saha'), tt('Stoper'), tt('Kaleci')]), plus: +(pl + rnd(-.15, .2)).toFixed(1), cost: nice(base * [.6, 1.3, 2.4][i] * rnd(.85, 1.2)), age: ri(19, 31) }));
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
  if (m.role === 'coach' && m.xi && m.xi.v2) squadSeason(lines);   // yaş, sözleşme, emeklilik, altyapı
  else { s.rt[id] = clamp(s.rt[id] - 1.4 - Math.max(0, s.rt[id] - avg) * .14 + .35 * Math.min(3, s.fx[id] || 0), 15, 95); m.xi = null; }
  m.bud += Math.round(mgrBud(id) * .7); m.obj = mgrObj(); m.act = 0; m.talk = 0;
  if (m.role === 'coach') s.con.wage = nice(Math.max(s.con.wage, wageFor(s.rt[id], s.rt[id] + 4) * 1.4));
  if (m.conf < 20) m.sacked = 1;
  return lines;
}
export function mgrEvent() {
  const s = S, m = s.mgr, now = absWeek(); if (now - (m.evw ?? -99) < 4 || !chance(.2)) return null;   // olaylar arasında en az dört hafta
  const id = s.clubId, up = v => { s.rt[id] = clamp(s.rt[id] + v, 15, 95); }, cf = v => { m.conf = clamp(m.conf + v, 0, 100); }, star = s.sc[id] && s.sc[id][0] ? s.sc[id][0][0] : 'Takımın yıldızı', b = mgrBud(id);
  const list = [
    { id: 'yildiz', p: 'takim', i: 'alert', t: tt('Yıldız gitmek istiyor'), d: tt`${star} kapını çaldı: "Üst ligden teklif var, beni bırakın."`, o: [
      [tt('Sat, parayı al'), tt('Bütçe artar, takım zayıflar'), () => { const P = mgrXI(); if (P) { const x = [...P].filter(y => !y.loanIn && !y.loanOut).sort((a, c) => c.q - a.q)[0], v = nice(pVal(x) * 1.1); m.xi.p = P.filter(y => y !== x); m.bud += v; if (m.xi.cap === x.u) m.xi.cap = [...m.xi.p].sort((a, c) => c.q - a.q)[0].u; reXI(); syncRt(); cf(-3); addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${x.n} üst lige transfer oldu.`, 'manset'); return [tt`${x.n} satıldı`, tt('Bütçe +') + fmtS(v), tt('Güven −3')]; } m.bud += nice(b * .9); up(-1.2); cf(-3); return [tt('Bütçe +') + fmtS(nice(b * .9)), tt('Takım gücü −1,2'), tt('Güven −3')]; }],
      [tt('İkna et'), tt('Tutarsa kalır; tutmazsa küser'), () => { const P = mgrXI(), x = P && [...P].sort((a, c) => c.q - a.q)[0]; if (chance(.5 + s.rep / 300)) { cf(2); if (x) x.mo = clamp(x.mo + 10, 0, 100); return [tt('Kaldı'), tt('Güven +2')]; } if (x) { x.mo = clamp(x.mo - 25, 0, 100); return [tt('Kaldı ama keyfi yok'), tt`${x.n}: moral −25`]; } up(-.5); return [tt('Kaldı ama keyfi yok'), tt('Takım gücü −0,5')]; }],
      [tt('Zam yap'), tt('Bütçeden gider'), () => { m.bud = Math.max(0, m.bud - nice(b * .3)); return [tt('Bütçe −') + fmtS(nice(b * .3))]; }]] },
    { id: 'tribun', p: 'taraftar', i: 'users', t: tt('Tribün ses veriyor'), d: tt('Taraftar grubu tesis kapısında. Konuşmak istiyorlar.'), o: [
      [tt('Yanlarına git'), tt('Yüzleş, dinle'), () => (chance(.65) ? (cf(4), [tt('Güven +4')]) : (cf(-2), [tt('Güven −2')]))],
      [tt('Arka kapıdan çık'), tt('Bugün uğraşma'), () => { cf(-3); return [tt('Güven −3')]; }]] },
    { id: 'sakat', p: 'doktor', i: 'plus', t: tt('Sakatlık krizi'), d: tt('Bir haftada üç oyuncu revire girdi. Kadro daraldı.'), pre: () => { const P = mgrXI(); if (P) { for (const x of shuffle(P.filter(free)).slice(0, 3)) x.inj = ri(1, 3); reXI(); syncRt(); } }, o: [
      [tt('Takviye yap'), tt('Bütçeden gider'), () => { m.bud = Math.max(0, m.bud - nice(b * .35)); return [tt('Bütçe −') + fmtS(nice(b * .35))]; }],
      [tt('Altyapıdan tamamla'), tt('Bedava ama riskli'), () => (chance(.4) ? (up(.2), cf(2), [tt('Gençler şaşırttı'), tt('Takım gücü +0,2')]) : (up(-.6), [tt('Takım gücü −0,6')]))],
      [tt('İdare et'), tt('Kadro zayıflar'), () => { up(-.4); return [tt('Takım gücü −0,4')]; }]] },
    { id: 'basin', p: 'basin', i: 'mic', t: tt('Mikrofonlar sende'), d: tt('Canlı yayında soru geldi: "Bu sezon hedef ne?"'), o: [
      [tt('Büyük konuş'), tt('Tutarsa alkış, tutmazsa yuh'), () => { cf(chance(.5) ? 5 : -4); return [tt('Söz ağızdan çıktı')]; }],
      [tt('Maç maç bakıyoruz'), tt('Güvenli cevap'), () => { cf(1); return [tt('Güven +1')]; }]] },
  ];
  const seen = m.evr || (m.evr = {}), ok = list.filter(e => now - (seen[e.id] ?? -99) >= 20);   // aynı olay yirmi hafta tekrar etmez
  if (!ok.length) return null;
  const e = pick(ok); seen[e.id] = now; m.evw = now; if (e.pre) e.pre(); return e;
}
// Kenar kariyerinin özeti; kayıt silinmeden önce
export function mgrEnd() {
  const m = S.mgr, hs = m.hist.filter(h => !h.role), best = hs.length ? Math.min(...hs.map(h => h.pos)) : 0, tro = S.tro.filter(x => /teknik direktör|başkan|Teknik Direktörü/.test(x));
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

// ---------- Kıta Kalkanı: eski kayıtlar için sezon ortasında kurulur ----------
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
  if (clw && clw === s.clubId) s.xc.push({ k: 'dk', name: KW ? 'Kadınlar Kıtalararası Kupa' : 'Kıtalararası Kupa', week: 22, opp: pick(WIDS) });
  for (const x of s.xc) addNews(tt`${x.name}: ${x.week}. haftada rakip ${club(x.opp).n}.`, 'trophy');
}
export function xcFixture() { const x = (S.xc || []).find(y => y.week === S.week && !y.done); return x ? { cup: true, key: 'xc', name: x.name, round: 'Final', opp: x.opp, home: true, final: true } : null; }
export const xcNext = () => (S.xc || []).filter(y => !y.done && y.week >= S.week);
function xcRound(own) {
  const x = (S.xc || []).find(y => y.week === S.week && !y.done); if (!x) return;
  x.done = 1; let us, op, win;
  if (own) { us = own.us; op = own.opp; win = own.win; } else { [us, op] = simScore(S.rt[S.clubId] - 2, S.rt[x.opp]); win = us > op || (us === op && chance(.5)); }
  if (win && !isBiz()) { S.tro.push(seasonLabel() + ' · ' + x.name + (S.mgr ? (S.mgr.role === 'coach' ? ' (teknik direktör)' : ' (başkan)') : '')); S.money += nice(S.con.wage * 6); fx({ mo: 10, taraf: 8, rep: x.k === 'dk' ? 4 : 2 }); addNews(tt`${x.name} sizin! (${us}-${op})`, 'trophy'); }
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
  const base = { wage: .5, sign: .58, goalB: .7, rel: .45, img: .48, loy: .5, kisa: .8, app: .6, forma: o.role === '11' ? .5 : .3, kap: o.role === '11' ? .34 : .12 }[k]; if (base == null) return null;
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
    if (k === 'app') { o.app = nice(Math.max(o.wage * .06, 50)); return { ok: 1, text: tt`Kabul: oynadığın her maç için ${fmt(o.app)}.` }; }
    if (k === 'forma') { o.forma = 1; return { ok: 1, text: tt('Kabul: hoca seni kadroda düşünmek zorunda. Yine de formun konuşur.') }; }
    if (k === 'kap') { o.kap = 1; return { ok: 1, text: tt('Kabul: pazubent sözleşmeyle senin.') }; }
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
    try { const j = localStorage.getItem(k); if (!j) return o; const d = JSON.parse(renameText(j)), c = CLUBS[d.clubId] || (d.gen || {})[d.clubId] || {}; return { ...o, name: d.name, age: d.age, pos: d.pos, club: c.n || '', c1: c.c1 || '#ff6a2b', c2: c.c2 || '#14110e', look: d.look, num: d.num, mgr: !!d.mgr, year: d.year }; } catch (e) { return o; }
  });
}
export function wipeSlot(n) { try { localStorage.removeItem(KEYS[n - 1]); } catch (e) { /* yok */ } if (KEYS[n - 1] === KEY) S = null; }

// ---------- maç ortamı: stadyum kademesi, günün saati, doluluk, pankart ----------
export const stadTier = id => { const r = S.rt[id] || 30; return r < 38 ? 1 : r < 50 ? 2 : r < 63 ? 3 : r < 75 ? 4 : 5; };
export function matchEnv(fxt, wx) {
  const s = S, nat = !!fxt.nat, host = nat ? null : (fxt.home || fxt.final ? s.clubId : fxt.opp), hc = host ? club(host) : null;
  const tier = nat ? 5 : fxt.final ? Math.max(4, stadTier(host)) : stadTier(host), h = hsh((nat ? fxt.name || 'milli' : fxt.opp) + ':' + absWeek());
  const derby = !nat && isDerby(s.clubId, fxt.opp), big = !nat && bigMatch(fxt), mine = !nat && !!fxt.home;
  const tod = fxt.eu ? 'gece' : tier <= 2 ? (h % 4 ? 'gun' : 'aksam') : ['gun', 'aksam', 'gece', 'gece'][h % 4];
  const fill = clamp(.3 + (mine ? s.rel.taraf : 50) / 220 + (big ? .2 : 0) + (derby ? .25 : 0) + (tier >= 4 ? .12 : 0) + (nat ? .3 : 0), .12, 1);
  const nm = s.name.split(' ').slice(-1)[0].toLocaleUpperCase(LC), love = mine && s.rel.taraf >= 70, boo = mine && s.rel.taraf < 22;
  return { tier, tod, wx: wx || 'acik', fill, c1: hc ? hc.c1 : '#d81e2c', c2: hc ? hc.c2 : '#f2f2f2', derby, eu: fxt.eu || null, home: mine, banner: love ? `${nm} ${s.num}` : boo ? tt('BU FORMA EMEK İSTER') : '', boo, lines: tier >= 2, ads: adList() };
}
// Antrenman sahası: kulübün tesis düzeyi kadar gelişmiş, tribünler boş
// Saha kenarı panoları: boş reklam alanı ve varsa krampon sponsorun
export const adList = () => ['@BACKER', tt('BURAYA REKLAM VEREBİLİRSİNİZ'), ...(S && S.boot ? [S.boot.n.toLocaleUpperCase(LC)] : [])];   // @ ile başlayan pano logodur
export function trainEnv() { const c = S.clubId ? club(S.clubId) : null; return { tier: S.clubId ? facOf(S.clubId) : 1, tod: 'gun', wx: 'acik', fill: .04, c1: c ? c.c1 : '#ff6a2b', c2: c ? c.c2 : '#f2f2f2', ads: adList() }; }
// Krampon rengi: sponsor markasına göre
const BOOTC = { Poyraz: '#3d7bff', Zirve: '#ffd23f', 'Akın': '#ff4d4d', 'Kıvılcım': '#ff6a2b' };
export const bootColor = () => (S.boot ? BOOTC[S.boot.n] || '#f2f2f2' : has('krampon') ? '#e9e2d3' : '#15120f');

// ---------- VAR ve hakem ekibi: yalnız üst düzeyde ----------
export function hasVar(fxt) {
  if (!fxt) return false; if (fxt.nat) return !!fxt.tour || !!fxt.q; if (fxt.eu) return true;
  const t = id => { const l = leagueOf(id); return l ? LMAP[l].tier : 9; };
  return Math.min(t(S.clubId), t(fxt.opp)) <= (KW ? 1 : 2);
}
// Rakip kalecinin zaafı: sezon boyu sabit, maç öncesi görünür
const GKW = { alt: tt('Alt köşelere geç yatıyor'), ust: tt('Üst köşelere yetişemiyor'), pen: tt('Penaltılarda erken yatıyor'), bire: tt('Bire birde erken çıkıyor') };
export function gkWeak(opp) { const k = Object.keys(GKW)[hsh(opp + ':gk:' + S.season) % 4]; return { k, t: GKW[k], n: squad(opp)[0] }; }
// Panenka: kaleci yatarsa gol, beklerse rezillik. Aynı kaleci ikinciye yemez.
export function panenka(M) {
  const key = 'pnk_' + M.fxt.opp, stay = clamp(.16 + (M.oppR - M.usR) * .004 + (S.fl[key] ? .3 : 0), .08, .65), me = S.name.split(' ').slice(-1)[0];
  M.mom++; S.fl[key] = 1;
  if (!chance(stay)) { M.ok++; M.usG++; M.pg++; M.rt += 1.1; (M.goals || (M.goals = [])).push({ min: M.cmin || 0, k: 'penalti' }); fx({ taraf: 3, ego: 2, fol: Math.round(120 + S.fol * .01) }); return [{ s: tt`PANENKA! ${me} topu ortaya aşırttı, kaleci çoktan yatmıştı!`, c: 'g' }]; }
  M.rt -= .9; fx({ taraf: -3, mo: -4 });
  return [{ s: tt('Kaleci yerinden kıpırdamadı: top kucağına düştü. Tribün ıslıklıyor.'), c: 'b' }];
}
// Bire birde kaleciyi geçmeyi denedin
export function roundKeeper(M, ok) {
  const me = S.name.split(' ').slice(-1)[0]; M.mom++;
  if (ok) { M.ok++; M.usG++; M.pg++; M.rt += 1.25; M.cnt.calim++; (M.goals || (M.goals = [])).push({ min: M.cmin || 0, k: 'calim' }); return [{ s: tt`GOL! ${me} kaleciyi de geçti, topu boş kaleye yuvarladı!`, c: 'g' }]; }
  M.rt -= .2; M.cnt.bad++;
  return [{ s: M.gk ? tt`${M.gk} ayaklarına kapandı, topu aldı.` : tt('Kaleci ayaklarına kapandı, topu aldı.') }];
}
// Gol sevinci: maçın ilk golünde seçilir
export const CELEB = [{ t: tt('Tribüne koş'), s: tt('Taraftarla kucaklaş'), i: 'users' }, { t: tt('Armayı öp'), s: tt('Bu forma benim'), i: 'heart' }, { t: tt('Sus işareti'), s: tt('Rakip tribüne cevap: kart riski'), i: 'alert' }];
export function celebrate(M, i) {
  if (i === 0) return fx({ taraf: 2.5, en: -2 });
  if (i === 1) return fx({ taraf: S.since < S.season ? 3.5 : 1.2, hoca: 1, sad: 2 });
  const L = fx({ ego: 3, rep: .4, fol: Math.round(60 + S.fol * .004), taraf: 1.5 });
  if (M.ref && chance(.08 + M.ref.strict * .1)) { M.yel++; L.push(tt('Sarı kart')); if (M.yel >= 2) { M.red = true; M.rt -= 1.5; } }
  return L;
}
// Maç sonu soyunma odası: sahne ne zaman açılır, kaptan ne der
export const lockerMood = (M, win, lose) => (M.nat ? '' : win && (M.usG - M.oppG >= 2 || M.derby || M.fxt.final || M.fxt.po) ? 'win' : lose && (M.oppG - M.usG >= 3 || M.derby) ? 'loss' : S.fl.kaptan && (win || lose) && chance(.35) ? (win ? 'win' : 'loss') : '');
export const CAPL = { win: [[tt('Herkesi tek tek tebrik et'), 'users', { takim: 4 }], [tt('"Daha bitmedi" de'), 'target', { takim: 1, hoca: 2 }], [tt('Kutlamayı başlat'), 'bolt', { takim: 3, mo: 4, en: -3 }]], loss: [[tt('Sorumluluğu üstlen'), 'shield', { takim: 4, mo: -2 }], [tt('Sert konuş'), 'alert', { takim: -2, hoca: 2 }], [tt('Sessizliğe izin ver'), 'moon', { takim: 1 }]] };
export function capLocker(mood, i) { const o = CAPL[mood][i]; if (mood === 'loss' && i === 1 && chance(.45)) return fx({ takim: 3, hoca: 2 }); return fx(o[2]); }

// ---------- kadro seçimi: her maç kesin oynamazsın ----------
// Yedek oyuncunun oyuna girme ihtimali. Yedek kaleci ancak as kaleci sakatlanınca ya da kupada girer.
export function subChance(fxt) {
  if (fxt && fxt.nat) return .8;
  const sc = roleScore().s, cup = !!(fxt && fxt.cup);
  if (S.pos === 'KL') return cup ? .12 : .05;
  return clamp(.3 + (sc - 30) / 20 * .45 + (cup ? .12 : 0) + (youngRule() ? .15 : 0), .2, .88);
}
// Bu maçtaki görev: ilk 11'in kıyısındaysan hoca rotasyona gidebilir; iyi çalışan yedek ilk 11'e çıkabilir. Hafta içinde sabit kalır.
export function matchRole(fxt) {
  const base = role(); if (base !== '11' && base !== 'yedek') return { r: base, why: '' };
  const sc = roleScore().s, u = (hsh(S.name + ':' + absWeek() + ':' + (fxt ? fxt.opp : '')) % 1000) / 1000, cup = !!(fxt && fxt.cup && !fxt.final), kl = S.pos === 'KL';
  if (base === '11') {
    const p = clamp((60 - sc) / 10 * .3, 0, .32) + (S.en < 40 ? .2 : 0) + (cup && sc < 62 ? .15 : 0);
    if (!S.fl.kaptan && u < p) return { r: 'yedek', why: S.en < 40 ? tt('Hoca seni dinlendiriyor') : cup ? tt('Hoca kupada rotasyona gitti') : tt('Hoca bugün rakibini tercih etti') };
    return { r: '11', why: '' };
  }
  const p = clamp((sc - 40) / 10 * .2, 0, .22) * (kl ? .4 : 1) + (cup ? (kl ? .45 : .22) : 0) + (S.rv && S.rv.inj > 0 ? .25 : 0);
  if (u < p) return { r: '11', why: cup ? tt('Kupada forma senin') : tt('Hoca bugün sana şans verdi') };
  return { r: 'yedek', why: '' };
}

// ---------- sağlık: vücut yıprandıkça sakatlık artar, sonunda kariyer biter ----------
export const health = () => clamp(S.hl ?? 88, 0, 100);
function hurt(v) { S.hl = clamp(health() - v, 0, 100); }
function healthWeek() {
  const s = S; if (s.mgr) return;
  (s.trh || (s.trh = [])).push(s.trn || 0); if (s.trh.length > 4) s.trh.shift(); s.trn = 0;
  const d = (s.en >= 60 ? .45 : s.en < 30 ? -1.1 : -.1) + ((s.up || {}).ekip || 0) * .07 + eff('en') * .02 - (s.fl.kronik ? .35 : 0) - (s.age >= 32 ? .12 : 0) + (s.inj > 0 ? .5 : 0);
  s.hl = clamp(health() + d, 0, 100);
  const h = s.hl, w = absWeek();
  if (h < 40 && (s.cd.hlw || 0) <= w) { s.cd.hlw = w + 6; s.pop.push(tt('Sağlığın alarm veriyor')); addNews(h < 25 ? tt('Doktor açık konuştu: "Bu tempoyla devam edersen kariyerin tehlikede."') : tt('Vücudun yorgun: sağlığın düşüyor. Dinlen, fizyoterapi al, zorlayarak oynama.'), 'plus'); }
}
// Ağır sakatlık yıpranmış vücuda gelirse futbol biter. Sağlıklı oyuncuda olmaz.
function careerEnd(lines) {
  const h = health(); if (h >= 38 || S.over) return;
  if (chance(clamp(.25 + (38 - h) / 45, .2, .85))) { delete S.fl.agir; S.over = tt('Doktorlar son sözü söyledi: diz artık profesyonel futbolu kaldırmıyor. Krampon asmak zorundasın.'); lines.push(tt('Doktorlar kötü haberi verdi: kariyerin burada bitiyor.')); }
}
export const healthText = () => { const h = health(); return h >= 75 ? tt('Sapasağlam') : h >= 55 ? tt('İyi') : h >= 40 ? tt('Yıpranmış') : h >= 25 ? tt('Riskli') : tt('Kritik'); };

// ---------- kenar kariyeri: istifa ----------
// Bırakırken eline geçen: okulun değeri ya da kulüp bedelinin bir kısmı
export const resignValue = () => { const m = S.mgr; return !m ? 0 : m.role === 'school' ? nice(schoolValue()) : m.role === 'pres' ? nice(mgrPrice(S.clubId) * .6) : 0; };
export function mgrResign() {
  const s = S, m = s.mgr; if (!m) return;
  if (s.co[s.clubId] && s.co[s.clubId].me) delete s.co[s.clubId];
  addNews(m.role === 'coach' ? tt`${club(s.clubId).n} teknik direktörlüğünden istifa ettin.` : m.role === 'pres' ? tt`${club(s.clubId).n} başkanlığını bıraktın.` : tt('İşini devrettin.'), 'pen');
  s.money += resignValue();
  m.left = 1;
}

// =====================================================================
// Futbol sonrası iş hayatı: menajerlik ve futbol okulu. Kendi kulübün yok; gelir doğrudan cebine girer.
// =====================================================================
export const isBiz = () => !!S && !!S.mgr && (S.mgr.role === 'agent' || S.mgr.role === 'school' || S.mgr.role === 'pundit');
const bizK = () => (KW ? .3 : 1);
function mkClient(lo, hi) {
  const ovr = ri(Math.round(lo), Math.round(hi)), age = ri(17, 25), pool = [];
  for (const lid in S.lg) for (const id of S.lg[lid].t) if (Math.abs(S.rt[id] - ovr) <= 4) pool.push(id);
  const id = pool.length ? pick(pool) : S.clubId;
  return { n: rname(LMAP[leagueOf(id)].c), age, pos: pick(['KL', 'DF', 'DF', 'OS', 'OS', 'KN', 'FV']), ovr, pot: clamp(ovr + ri(3, 15) - Math.max(0, age - 21) * 2, ovr, 94), id, wage: wageFor(S.rt[id], ovr), mood: ri(55, 78), y: S.season };
}
function mkKid(q) { const pot = clamp(ri(38, Math.round(58 + q * .34)), 30, 92); return { n: rname('TR'), age: ri(9, 14), tal: ri(14, 30), pot }; }
export const schoolCap = () => 6 + (S.mgr.lv || 1) * 4;
export const schoolValue = () => (300000 * Math.pow(S.mgr.lv || 1, 1.8) + 80000 * (S.mgr.hc || 1)) * bizK();
export function bizStart(role) {
  const s = S, prev = s.mgr;
  if (prev && s.co[s.clubId] && s.co[s.clubId].me) delete s.co[s.clubId];
  s.loan = null; s.watch = []; s.q = []; s.inj = 0; s.ban = 0; s.over = null; s.used = 0; s.tstat = 'mutlu'; s.agent = null; s.job = 0;
  s.con = { wage: 0, until: s.season + 99, role: '11', goalB: 0, rel: 0 };
  const m = s.mgr = { role, conf: 60, bud: 0, tr: 'denge', act: 0, talk: 0, obj: 1, since: s.season, hist: prev ? prev.hist : [], jobs: (prev ? prev.jobs : 0) + 1, sacked: 0, inc: 0, earn: 0 };
  if (role === 'agent') {
    const b = clamp(34 + s.rep * .5, 34, 80); m.cl = [mkClient(b - 7, b), mkClient(b - 13, b - 4)]; addNews(tt('Menajerlik ofisini açtın. İlk iki oyuncun dosyanda.'), 'pen');
    const ka = kidAge();
    if (s.kid && ka >= 16 && ka <= 32) {   // çocuğun ilk müşterin olur
      const o = clamp(Math.round(40 + s.kid.tal * 1.5 + Math.min(8, ka - 16) * 1.5), 38, 82), c = mkClient(o, o);
      Object.assign(c, { n: s.kid.n, age: ka, pot: clamp(o + 5 + Math.round(s.kid.tal * .5), o, 94), mood: 92, mine: 1 }); m.cl.unshift(c); addNews(tt`İlk imza evden: ${c.n} artık senin oyuncun.`, 'heart');
    }
    const g = prev && prev.grads && prev.grads.length ? [...prev.grads].sort((x, y) => y.ovr - x.ovr)[0] : null;
    if (g && club(g.id)) { m.cl.push({ n: g.n, age: 18, pos: pick(['DF', 'OS', 'KN', 'FV']), ovr: g.ovr, pot: g.pot, id: g.id, wage: wageFor(S.rt[g.id], g.ovr), mood: 88, y: S.season, grad: 1 }); addNews(tt`Eski öğrencin ${g.n} menajeri olarak seni seçti.`, 'star'); }
  } else if (role === 'school') {
    const cost = Math.min(s.money, nice(400000 * bizK())); s.money -= cost; m.lv = cost >= 300000 * bizK() ? 2 : 1; m.hc = 1; m.rp = clamp(8 + s.rep * .3, 5, 55); m.kids = Array.from({ length: 6 }, () => mkKid(m.rp)); m.grads = []; addNews(tt`${s.prov} futbol okulunun kapılarını açtın.`, 'book');
    const ka = kidAge();
    if (s.kid && ka >= 8 && ka <= 15) { m.kids.unshift({ n: s.kid.n, age: ka, tal: clamp(16 + s.kid.tal * 1.6, 14, 30 + (ka - 8) * 4), pot: clamp(58 + s.kid.tal * 1.7, 50, 92), mine: 1 }); addNews(tt`${s.kid.n} da okulun öğrencisi: evde baba, sahada hoca.`, 'heart'); }
  } else { m.rt = clamp(18 + Math.sqrt(s.fol) / 40 + s.rep * .25, 15, 72); m.cr = 60; m.ch = 0; addNews(tt('Ekrandasın: haftalık yorum programın başladı.'), 'mic'); }
  save();
}
export function bizInfo() {
  const s = S, m = s.mgr;
  if (m.role === 'agent') { const cl = m.cl, w = cl.reduce((a, c) => a + c.wage * .05, 0); return { role: 'agent', n: cl.length, cap: 5 + Math.floor(s.rep / 22), inc: Math.round(w), mood: cl.length ? cl.reduce((a, c) => a + c.mood, 0) / cl.length : 0, best: cl.length ? Math.max(...cl.map(c => c.ovr)) : 0, earn: m.earn || 0 }; }
  if (m.role === 'pundit') return { role: 'pundit', n: Math.round(m.rt), cap: 100, inc: Math.round((1200 + m.rt * m.rt * 10 + (m.ch || 0) * 5000) * bizK()), rt: m.rt, cr: m.cr, ch: m.ch || 0, earn: m.earn || 0, best: 0 };
  const fee = (220 + m.rp * 12) * bizK(), cost = (m.hc * 1500 + m.lv * 1300) * bizK();
  return { role: 'school', n: m.kids.length, cap: schoolCap(), inc: Math.round(m.kids.length * fee - cost), lv: m.lv, hc: m.hc, rp: m.rp, grads: m.grads.length, earn: m.earn || 0, best: m.kids.length ? Math.max(...m.kids.map(k => Math.round(k.tal))) : 0 };
}
function bizTick() {
  const s = S, m = s.mgr, I = bizInfo(); m.act = 0;
  s.money += I.inc; m.inc = I.inc; m.earn = (m.earn || 0) + I.inc;
  if (m.role === 'agent') {
    for (const c of m.cl) { c.ovr = clamp(c.ovr + (c.pot - c.ovr) * (c.age <= 23 ? .014 : .007) + (c.age >= 31 ? -.05 : 0), 20, 95); c.mood = clamp(c.mood - .7 + (S.rt[c.id] <= c.ovr + 1 ? .15 : -.25), c.mine || c.grad ? 55 : 0, 100); }
    for (const c of m.cl.filter(x => x.mood < 12)) addNews(tt`${c.n} seninle yollarını ayırdı: ilgisiz kaldığını söylüyor.`, 'alert');
    m.cl = m.cl.filter(x => x.mood >= 12);
  } else if (m.role === 'pundit') { m.rt = clamp(m.rt - (.3 + m.rt * .011) + (m.ch || 0) * .08, 5, 100); m.cr = clamp(m.cr + (55 - m.cr) * .02, 0, 100); s.fol = Math.round(s.fol * (1 + m.rt / 40000)); }
  else for (const k of m.kids) k.tal = clamp(k.tal + (k.pot - k.tal) * (.005 + .0035 * m.hc + .0025 * m.lv) + rnd(-.1, .2), 5, 30 + (k.age - 8) * 4);   // yaşına göre tavan: 16'sında en çok 58-62
}
export const BACTS = {
  agent: [['kesif', tt('Oyuncu keşfi'), tt('Alt liglerde yeni bir yetenek ara'), 'eye'], ['ilgi', tt('Oyuncunla ilgilen'), tt('En mutsuz oyuncunun gönlünü al'), 'heart'], ['zam', tt('Sözleşme yenile'), tt('Bir oyuncun için zam iste'), 'coin'], ['pazar', tt('Oyuncu pazarla'), tt('Transfer döneminde teklif garantisi'), 'swap']],
  school: [['tara', tt('Yetenek taraması'), tt('Mahalle sahalarında çocuk ara'), 'eye'], ['mac', tt('Maç günü'), tt('Öğrencilerinle sahaya çık, devre arasında konuş'), 'ball'], ['hoca', tt('Antrenör al'), tt('Çocuklar daha hızlı gelişir'), 'whistle'], ['tesis', tt('Tesisi büyüt'), tt('Kapasite ve gelişim artar'), 'train'], ['turnuva', tt('Turnuva düzenle'), tt('İtibar kazan, scoutları çağır'), 'trophy']],
  pundit: [['yorum', tt('Maç yorumu'), tt('Haftanın maçını yorumla'), 'mic'], ['ozel', tt('Özel röportaj'), tt('Bir yıldızı stüdyoya getir'), 'star'], ['kanal', tt('Kanalını büyüt'), tt('Kalıcı reyting ve reklam geliri'), 'phone'], ['kitap', tt('Kitap yaz'), tt('Anılarını kaleme al; bir kez yapılır'), 'book']],
};
// Hamle şu an yapılamıyor mu? max: en üst düzey, no: koşul yok
export const bizMax = k => { const m = S.mgr; return (k === 'hoca' && m.hc >= 5) || (k === 'tesis' && m.lv >= 5) || (k === 'kanal' && (m.ch || 0) >= 5) || (k === 'kitap' && !!m.book); };
export const bizNo = k => { const m = S.mgr; return (k === 'kesif' && m.cl.length >= bizInfo().cap) || ((k === 'ilgi' || k === 'zam' || k === 'pazar') && !m.cl.length) || (k === 'tara' && m.kids.length >= schoolCap()) || (k === 'mac' && m.kids.length < 5); };
export const bizCost = k => nice(({ hoca: 70000 * Math.pow(S.mgr.hc || 1, 1.7), tesis: 280000 * Math.pow(S.mgr.lv || 1, 1.9), turnuva: 25000 + (S.mgr.rp || 0) * 900, kesif: 4000 + S.rep * 250, mac: 6000, ozel: 12000 + (S.mgr.rt || 0) * 300, kanal: 60000 * Math.pow((S.mgr.ch || 0) + 1, 1.6) }[k] || 0) * bizK());
export function bizAct(k) {
  const s = S, m = s.mgr, cost = bizCost(k); if (m.act || s.money < cost) return null;
  if (bizMax(k) || bizNo(k)) return null;
  m.act = 1; s.money -= cost;
  switch (k) {
    case 'mac': return ['@mac', []];
    case 'yorum': return ['@yorum', []];
    case 'ozel': { if (!chance(clamp(.4 + s.rep / 200, .3, .9))) return [tt('Yıldız son anda iptal etti. Stüdyoda boş koltukla kaldın.'), []]; const up = Math.max(1, Math.round(ri(3, 6) * punF())); m.rt = clamp(m.rt + up, 5, 100); s.fol = Math.round(s.fol * 1.02); return [tt('Koltukta bir yıldız, karşısında sen. Röportaj günlerce konuşuldu.'), [tt('Reyting ') + sg(up), tt('Takipçi +%2')]]; }
    case 'kanal': m.ch = (m.ch || 0) + 1; m.rt = clamp(m.rt + 2, 5, 100); return [tt('Yeni stüdyo, yeni ekip. Kanalın artık kendi ayakları üzerinde.'), [tt('Kanal düzeyi +1'), tt('Reyting ') + sg(2), tt('Haftalık gelir artar')]];
    case 'kitap': { m.book = 1; const v = nice((40000 + s.fol * .25 + s.rep * 4000) * bizK()); s.money += v; m.earn = (m.earn || 0) + v; s.rep = clamp(s.rep + 1, 0, 100); return [tt('Kariyerini kâğıda döktün. İmza gününde kuyruk sokağa taştı.'), ['+' + fmt(v), tt('İtibar +1')]]; }
    case 'kesif': {
      if (m.cl.length >= bizInfo().cap) return [tt('Dosyan dolu. Yeni oyuncu almak için itibarın artmalı ya da biriyle yollarını ayırmalısın.'), []];
      if (!chance(clamp(.38 + s.rep / 220, .3, .85))) return [tt('Üç maç izledin, not defterin boş döndü.'), []];
      const b = clamp(34 + s.rep * .5 + rnd(-6, 8), 30, 84), c = mkClient(b - 8, b); m.cl.push(c);
      return [tt`${club(c.id).n} forması giyen ${c.n} ile el sıkıştınız.`, [tt`${POS[c.pos].n} · ${c.age} yaş · güç ${c.ovr}`]];
    }
    case 'ilgi': { const c = [...m.cl].sort((a, b) => a.mood - b.mood)[0]; if (!c) return [tt('Dosyanda oyuncu yok.'), []]; c.mood = clamp(c.mood + 18, 0, 100); return [tt`${c.n} ile uzun bir yemek yediniz. Dertlerini dinledin.`, [tt('Memnuniyet +18')]]; }
    case 'zam': {
      const c = [...m.cl].sort((a, b) => a.wage / wageFor(S.rt[a.id], a.ovr + 2 || 1) - b.wage / wageFor(S.rt[b.id], b.ovr + 2 || 1))[0]; if (!c || !c.wage) return [tt('Zam isteyebileceğin bir sözleşme yok.'), []];
      if (chance(clamp(.42 + s.rep / 260, .3, .85))) { const w0 = c.wage; c.wage = nice(w0 * rnd(1.1, 1.24)); c.mood = clamp(c.mood + 10, 0, 100); return [tt`${club(c.id).n} masaya oturdu: ${c.n} artık haftada ${fmt(c.wage)} alıyor.`, [tt('Payın arttı'), tt('Memnuniyet +10')]]; }
      c.mood = clamp(c.mood - 8, 0, 100); return [tt`${club(c.id).n} kapıyı kapattı. ${c.n} bozuldu.`, [tt('Memnuniyet −8')]];
    }
    case 'pazar': { const c = [...m.cl].filter(x => !x.shop).sort((a, b) => (b.ovr - S.rt[b.id]) - (a.ovr - S.rt[a.id]))[0]; if (!c) return [tt('Pazarlayacak oyuncun yok.'), []]; c.shop = 1; return [tt`${c.n} için kulüpleri aradın. Transfer döneminde masada teklif olacak.`, []]; }
    case 'tara': {
      if (m.kids.length >= schoolCap()) return [tt('Okul dolu. Önce tesisi büyütmelisin.'), []];
      const n = Math.min(schoolCap() - m.kids.length, chance(.4) ? 2 : 1), ks = Array.from({ length: n }, () => mkKid(m.rp + s.rep * .12)); m.kids.push(...ks);
      return [tt`Mahalle turnuvasında ${ks.map(x => x.n.split(' ')[0]).join(tt(' ve '))} gözüne çarptı.`, [tt`Öğrenci +${n}`]];
    }
    case 'hoca': m.hc++; return [tt('Lisanslı yeni bir antrenör kadroya katıldı.'), [tt('Antrenör düzeyi +1')]];
    case 'tesis': m.lv++; m.rp = clamp(m.rp + 4, 0, 100); return [tt('Yeni saha, yeni soyunma odaları. Veliler etkilendi.'), [tt('Tesis +1'), tt('Kapasite +4')]];
    case 'turnuva': {
      const up = ri(2, 5); m.rp = clamp(m.rp + up, 0, 100); const out = [tt`Okul itibarı +${up}`];
      const k = [...m.kids].filter(x => x.age >= 14 && x.tal >= 44).sort((a, b) => b.tal - a.tal)[0];
      if (k && chance(.3)) { const L = gradSign(k); m.kids = m.kids.filter(x => x !== k); if (L) out.push(L); }
      return [tt('Sekiz takımlı turnuva şehrin gündemine oturdu. Tribünde scoutlar vardı.'), out];
    }
  }
  return null;
}
// Öğrenci bir kulüple imzalar: yetiştirme bedeli sana kalır
function gradSign(k) {
  const m = S.mgr, t = Math.round(k.tal), pool = [];
  for (const lid in S.lg) { if (LMAP[lid].c !== 'TR') continue; for (const id of S.lg[lid].t) if (Math.abs(S.rt[id] - (t + 3)) <= 6) pool.push(id); }
  if (!pool.length) return '';
  const id = pick(pool), fee = nice(baseW(Math.max(31, t)) * 60 * bizK() + 15000);
  S.money += fee; m.earn = (m.earn || 0) + fee; m.rp = clamp(m.rp + Math.max(1, (t - 36) * .22), 0, 100); m.grads.unshift({ n: k.n, id, y: seasonLabel(), ovr: t, pot: k.pot }); if (m.grads.length > 14) m.grads.length = 14;
  addNews(tt`Öğrencin ${k.n}, ${club(id).n} ile sözleşme imzaladı. Yetiştirme bedeli: ${fmt(fee)}`, 'star');
  return tt`${k.n} → ${club(id).n} · ${fmt(fee)}`;
}
// Menajerin transfer masası: oyuncularına gelen teklifler
export function agentOffers() {
  const m = S.mgr, out = [];
  m.cl.forEach((c, ci) => {
    const cur = S.rt[c.id]; if (!(c.shop || c.ovr > cur + 2 || chance(.12))) return;
    const pool = []; for (const lid in S.lg) for (const id of S.lg[lid].t) { const r = S.rt[id]; if (id !== c.id && r >= Math.max(cur + 1, c.ovr - 2) && r <= c.ovr + 5) pool.push(id); }
    if (!pool.length) return; const id = pick(pool), fee = nice(baseW(c.ovr) * 300 * valF() * (c.age <= 23 ? 1.4 : c.age <= 28 ? 1 : .5) * rnd(.8, 1.3));
    out.push({ ci, id, fee, wage: wageFor(S.rt[id], c.ovr), cut: nice(Math.min(fee * .03, 3000000 * bizK())) });
  });
  return out;
}
export function agentDeal(o, yes) {
  const m = S.mgr, c = m.cl[o.ci]; if (!c) return [];
  delete c.shop;
  if (!yes) { c.mood = clamp(c.mood - 7, 0, 100); return [tt('Memnuniyet −7')]; }
  const from = club(c.id).n; c.id = o.id; c.wage = o.wage; c.mood = clamp(c.mood + 14, 0, 100); S.money += o.cut; m.earn = (m.earn || 0) + o.cut; S.rep = clamp(S.rep + .6, 0, 100);
  addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${c.n}, ${from} takımından ${club(o.id).n} takımına geçti.`, 'manset');
  return ['+' + fmt(o.cut), tt('Memnuniyet +14'), tt('İtibar +1')];
}
// Sezon sonu: yaşlar ilerler, mezunlar imzalar, eski mezunlar büyür
export function bizSeason(rep) {
  const s = S, m = s.mgr, lines = [];
  if (m.role === 'pundit') {
    lines.push(tt`Sezon reytingi: ${Math.round(m.rt)}`, tt`Sezonluk kazanç: ${fmt(m.earn || 0)}`);
    if (m.rt >= 75 && m.cr >= 55 && !m.aw) { m.aw = 1; s.rep = clamp(s.rep + 3, 0, 100); s.tro.push(rep.label + ' · ' + tt('Yılın Yorumcusu')); lines.push(tt('Yılın Yorumcusu seçildin')); }
    m.hist.push({ y: rep.label, c: tt('Yorumculuk'), l: tt`reyting ${Math.round(m.rt)}`, pos: Math.round(m.rt), obj: 0, role: 'pundit', earn: m.earn || 0 });
    m.earn = 0; m.act = 0; return lines;
  }
  if (m.role === 'agent') {
    for (const c of m.cl) { c.age++; if (c.age >= 30) c.pot = Math.max(c.ovr - 2, c.pot - 2); }
    const old = m.cl.filter(c => c.age >= 35); for (const c of old) lines.push(tt`${c.n} futbolu bıraktı`); m.cl = m.cl.filter(c => c.age < 35);
    const best = m.cl.length ? [...m.cl].sort((a, b) => b.ovr - a.ovr)[0] : null;
    if (best && best.ovr >= 78 && !m['b' + Math.floor(best.ovr / 4)]) { m['b' + Math.floor(best.ovr / 4)] = 1; s.rep = clamp(s.rep + 3, 0, 100); lines.push(tt`${best.n} yıldızlaştı: itibarın arttı`); }
    lines.push(tt`Sezonluk kazanç: ${fmt(m.earn || 0)}`);
    m.hist.push({ y: rep.label, c: tt('Menajerlik'), l: tt`${m.cl.length} oyuncu`, pos: best ? Math.round(best.ovr) : 0, obj: 0, role: 'agent', earn: m.earn || 0 });
  } else {
    let signed = 0;
    for (const g of m.grads) { const o0 = g.ovr; g.ovr = Math.round(clamp(g.ovr + clamp((g.pot - g.ovr) * .28, 0, 7) + ri(-1, 1), 20, 95)); if (Math.floor(g.ovr / 10) > Math.floor(o0 / 10) && g.ovr >= 60) { const pay = nice(Math.min(baseW(g.ovr) * 10, 3000000) * bizK()); s.money += pay; m.earn += pay; m.rp = clamp(m.rp + 2, 0, 100); lines.push(tt`Mezunun ${g.n} yükseliyor (güç ${g.ovr}): dayanışma payı ${fmt(pay)}`); } }
    for (const k of m.kids) k.age++;
    for (const k of m.kids.filter(x => x.age >= 16)) { if (k.tal >= 37) { const L = gradSign(k); if (L) { signed++; lines.push(L); } } }
    m.kids = m.kids.filter(x => x.age < 16);
    lines.push(tt`Bu sezon ${signed} öğrencin profesyonel oldu`, tt`Sezonluk kazanç: ${fmt(m.earn || 0)}`);
    m.hist.push({ y: rep.label, c: tt('Futbol okulu'), l: tt`${m.kids.length} öğrenci`, pos: signed, obj: 0, role: 'school', earn: m.earn || 0 });
  }
  m.earn = 0; m.act = 0;
  return lines;
}
// İş hayatında karşına çıkanlar
// İş hayatı olayları: arada en az dört hafta, aynı olay on altı hafta tekrar etmez
export function bizEvent() {
  const m = S.mgr, now = absWeek(); if (now - (m.evw ?? -99) < 4) return null;
  const e = bizEvent0(); if (!e) return null;
  const seen = m.evr || (m.evr = {}); if (now - (seen[e.t] ?? -99) < 16) return null;
  seen[e.t] = now; m.evw = now; return e;
}
function bizEvent0() {
  const s = S, m = s.mgr; if (!chance(.16)) return null;
  if (m.role === 'pundit') return pick([
    { p: 'basin', i: 'alert', t: tt('Canlı yayında gaf'), d: tt('Mikrofon açıkken söylediğin bir söz sosyal medyada dönüyor.'), o: [
      [tt('Özür dile'), tt('Güven toparlanır, reyting düşer'), () => { m.cr = clamp(m.cr + 4, 0, 100); m.rt = clamp(m.rt - 3, 5, 100); return [tt('Güvenilirlik ') + sg(4), tt('Reyting ') + sg(-3)]; }],
      [tt('Arkasında dur'), tt('Reyting artar, güven düşer'), () => { m.rt = clamp(m.rt + 4, 5, 100); m.cr = clamp(m.cr - 6, 0, 100); return [tt('Reyting ') + sg(4), tt('Güvenilirlik ') + sg(-6)]; }]] },
    { p: 'baskan', i: 'shield', t: tt('Eski kulübün rahatsız'), d: tt`${club(s.clubId).n} yönetimi yorumlarından şikâyetçi. Tonunu yumuşatmanı istiyorlar.`, o: [
      [tt('Yumuşat'), tt('Kulüple köprü kalır'), () => { m.cr = clamp(m.cr - 3, 0, 100); s.rep = clamp(s.rep + 1, 0, 100); return [tt('Güvenilirlik ') + sg(-3), tt('İtibar +1')]; }],
      [tt('Bildiğini söyle'), tt('İzleyici bunu sever'), () => { m.cr = clamp(m.cr + 4, 0, 100); m.rt = clamp(m.rt + 2, 5, 100); return [tt('Güvenilirlik ') + sg(4), tt('Reyting ') + sg(2)]; }]] },
  ]);
  if (m.role === 'agent') {
    const c = m.cl.length ? pick(m.cl) : null; if (!c) return null;
    return pick([
      { p: 'menajer', i: 'alert', t: tt('Rakip menajer kapıda'), d: tt`Başka bir ofis ${c.n} ile gizlice görüşüyor. Daha yüksek pay vadetmişler.`, o: [
        [tt('Oyuncuyla konuş'), tt('Tutarsa bağ güçlenir'), () => (chance(.55 + s.rep / 300) ? (c.mood = clamp(c.mood + 12, 0, 100), [tt('Memnuniyet +12')]) : (c.mood = clamp(c.mood - 15, 0, 100), [tt('Memnuniyet −15')]))],
        [tt('Payını düşür'), tt('Kalır ama gelirin azalır'), () => { c.wage = nice(c.wage * .85); c.mood = clamp(c.mood + 16, 0, 100); return [tt('Memnuniyet +16')]; }],
        [tt('Bırak gitsin'), tt('Dosya kapanır'), () => { m.cl = m.cl.filter(x => x !== c); return [tt('Dosya kapandı')]; }]] },
      { p: 'basin', i: 'moon', t: tt('Gece hayatı manşette'), d: tt`${c.n} maçtan önceki gece görüntülendi. Kulüp seni arıyor.`, o: [
        [tt('Oyuncunu savun'), tt('O memnun, kulüp değil'), () => { c.mood = clamp(c.mood + 8, 0, 100); s.rep = clamp(s.rep - 1, 0, 100); return [tt('Memnuniyet +8'), tt('İtibar −1')]; }],
        [tt('Sert konuş'), tt('Kulüp memnun, o değil'), () => { c.mood = clamp(c.mood - 10, 0, 100); c.ovr = clamp(c.ovr + .4, 0, 95); return [tt('Memnuniyet −10')]; }]] },
    ]);
  }
  const k = m.kids.length ? [...m.kids].sort((a, b) => b.tal - a.tal)[0] : null;
  return pick([
    { p: 'baskan', i: 'shield', t: tt('Büyük kulüpten teklif'), d: tt('Bir Elit Lig kulübü okulunu altyapı ortağı yapmak istiyor: düzenli ödeme karşılığında en iyi öğrencilerde ilk söz hakkı.'), o: [
      [tt('Kabul et'), tt('Düzenli gelir, mezunlardan az bedel'), () => { const v = nice(90000 * bizK() * (1 + m.rp / 50)); s.money += v; m.earn += v; m.rp = clamp(m.rp + 3, 0, 100); return ['+' + fmt(v), tt('Okul itibarı +3')]; }],
      [tt('Bağımsız kal'), tt('Veliler bunu sever'), () => { m.rp = clamp(m.rp + 1.5, 0, 100); return [tt('Okul itibarı +2')]; }]] },
    ...(k ? [{ p: 'baba', i: 'home', t: tt('Veli görüşmesi'), d: tt`${k.n} okulun en yeteneklisi. Babası başka bir okula geçirmeyi düşünüyor.`, o: [
      [tt('Burs ver'), tt('Kalır; gelirin biraz azalır'), () => { k.pot = clamp(k.pot + 2, 0, 94); s.money -= nice(8000 * bizK()); return [tt('Öğrenci kaldı')]; }],
      [tt('İkna etmeye çalış'), tt('Tutmazsa gider'), () => (chance(.5 + m.rp / 200) ? [tt('Öğrenci kaldı')] : (m.kids = m.kids.filter(x => x !== k), [tt('Öğrenci ayrıldı')]))]] }] : []),
  ]);
}
// Kenara çağrı: iş hayatındayken de teknik direktörlük teklifi gelebilir
export function sideOffer() {
  const m = S.mgr; if (!isBiz() || !chance(clamp(.12 + S.rep / 250 + (m.rp || 0) / 300, .1, .5))) return null;
  return mgrOffers('coach', false)[0] || null;
}
export function bizEnd() {
  const m = S.mgr, total = m.hist.reduce((a, h) => a + (h.earn || 0), 0), mt = meta(); mt.mgr = Math.max(mt.mgr || 0, m.hist.length); setMeta(mt);
  return { seasons: m.hist.length, role: m.role, total, grads: (m.grads || []).length, bestGrad: (m.grads || []).length ? [...m.grads].sort((a, b) => b.ovr - a.ovr)[0] : null, clients: (m.cl || []).length, hist: m.hist };
}

// =====================================================================
// v14: değişiklik kararı, seri penaltılar, kaptan itirazı, rekorlar, belgesel, ilk 11, okul maçı, yorumculuk, tezahürat, dedikodu
// =====================================================================
export function heal(v) { hurt(-v); }

// ---------- oyuncu değişikliği: yorulunca hoca sorar ----------
export const subAskDue = (M, min) => !!M.on && !M.off && !M.red && !M.subQ && M.role === '11' && min >= 58 && min <= 84 && M.stam < 44;
export function subAsk(M, c) {
  M.subQ = 1;
  if (c === 0) { M.risk = Math.max(M.risk || 1, 1.8); hurt(1); fx({ hoca: 1 }); return [{ s: tt('"İyiyim hocam." Sahada kaldın; bacakların ağır.') }]; }
  M.off = true; hurt(-1); fx({ hoca: M.rt >= 6.8 ? 1 : 0 });
  return [{ s: tt('Kendi isteğinle çıktın. Hoca omzuna vurdu: "Haftaya lazımsın."') }];
}

// ---------- seri penaltılar: beşer atış, sonra seri bitene kadar birer atış ----------
export function shootStart(M) {
  const d = clamp((M.usR - M.oppR) * .006, -.06, .06), kl = S.pos === 'KL';
  return { us: [], opp: [], pu: .76 + d, po: .76 - d - (kl ? clamp((S.at.kaleci - 60) * .003, -.05, .08) : 0), mine: kl ? -1 : S.pos === 'FV' ? 4 : S.pos === 'KN' ? 3 : S.pos === 'OS' ? 2 : 1, kl };
}
export function shootState(P) {
  const su = P.us.filter(Boolean).length, so = P.opp.filter(Boolean).length, a = P.us.length, b = P.opp.length;
  let over = false;
  if (a <= 5 && b <= 5) over = su > so + (5 - b) || so > su + (5 - a);
  if (!over && a === b && a >= 5) over = su !== so;
  return { su, so, over, win: su > so };
}

// ---------- kaptanın itirazı: VAR olmayan liglerde karar sahada döner ----------
export const protestDue = M => !!S.fl.kaptan && !!M.on && !M.off && !M.red && !M.prot && !M.nat;
export function capProtest(M, c) {
  M.prot = 1;
  if (c !== 0) { fx({ hoca: 1 }); return { ok: false, lines: [{ s: tt('Takımı sakinleştirdin. Oyun devam ediyor.') }] }; }
  const p = clamp(.22 + S.rep / 400 + (M.bias || 0) * .08 + (S.at.zihin - 60) / 300, .08, .5);
  if (chance(p)) { if (M.ref) M.ref.me -= .05; fx({ taraf: 3, takim: 2 }); return { ok: true, lines: [{ s: tt('Hakem yardımcısıyla konuştu ve kararından döndü: gol geçerli!'), c: 'g' }] }; }
  M.yel++;
  if (M.yel >= 2) { M.red = true; M.rt -= 1.5; return { ok: false, lines: [{ s: tt('İkinci sarı! Kırmızı kart.'), c: 'b' }] }; }
  return { ok: false, lines: [{ s: tt('Hakem geri adım atmadı; itirazdan sarı kart gördün.'), c: 'b' }] };
}

// ---------- rekorlar: kulüp ve lig tarihindeki eşikler; kırınca haber olur ----------
function recOf(key) { const R = S.rec || (S.rec = {}); return R[key] || (R[key] = { sg: 0, st: 0, cur: 0, yg: 0, mg: 0, br: {} }); }
export function records(id = S.clubId) {
  const c = club(id), lid = leagueOf(id), N = NAMES[lid ? LMAP[lid].c : 'TR'] || NAMES.TR, r = srnd(hsh(c.n + '#rekor')), rl = srnd(hsh(lid + '#rekor'));
  const big = CLUBS[id] ? clamp((CLUBS[id].r - 40) / 50, 0, 1) : 0, kw = KW ? .8 : 1, me = recOf(id), L = recOf('L:' + lid);
  const nm = f => N.f[Math.floor(f() * N.f.length)] + ' ' + N.l[Math.floor(f() * N.l.length)], yr = f => (KW ? 1996 : 1965) + Math.floor(f() * (KW ? 24 : 50));
  const rows = S.pos === 'KL' ? [
    { k: 'cl', t: tt('Tek sezonda gol yemeden maç'), v: Math.round(11 + r() * 5 + big * 5), n: nm(r), y: yr(r), me: me.cl || 0 },
    { k: 'cst', t: tt('Üst üste gol yemeden maç'), v: 4 + Math.floor(r() * 3 + big * 2), n: nm(r), y: yr(r), me: me.cst || 0 },
  ] : [
    { k: 'sg', t: tt('Tek sezonda gol'), v: Math.round((15 + r() * 8 + big * 13) * kw), n: nm(r), y: yr(r), me: me.sg },
    { k: 'mg', t: tt('Tek maçta gol'), v: 4 + (r() < .35 ? 1 : 0), n: nm(r), y: yr(r), me: me.mg },
    { k: 'st', t: tt('Üst üste gol atılan maç'), v: 5 + Math.floor(r() * 3 + big * 2), n: nm(r), y: yr(r), me: me.st },
    { k: 'yg', t: tt('En genç golcü (yaş)'), v: 16 + Math.floor(r() * 2), n: nm(r), y: yr(r), me: me.yg, low: 1 },
    { k: 'lg', t: tt('Ligde tek sezonda gol'), v: Math.round((24 + rl() * 12) * kw), n: nm(rl), y: yr(rl), me: L.sg, lig: 1 },
  ];
  return rows.map(x => ({ ...x, broke: x.me ? (x.low ? x.me < x.v : x.me > x.v) : false }));
}
function recTrack(M, lines) {
  const s = S, id = s.clubId, me = recOf(id), L = recOf('L:' + leagueOf(id));
  if (M.pg > 0) { me.cur++; me.st = Math.max(me.st, me.cur); if (!me.yg || s.age < me.yg) me.yg = s.age; me.mg = Math.max(me.mg, M.pg); } else me.cur = 0;
  me.sg = Math.max(me.sg, s.st.g); L.sg = Math.max(L.sg, s.st.lg);
  if (s.pos === 'KL' && M.role === '11') {
    if (me.cls !== s.season) { me.cls = s.season; me.cln = 0; }
    if (M.oppG === 0) { me.cln++; me.ccur = (me.ccur || 0) + 1; me.cl = Math.max(me.cl || 0, me.cln); me.cst = Math.max(me.cst || 0, me.ccur); } else me.ccur = 0;
  }
  for (const x of records(id)) {
    const b = x.lig ? L.br : me.br; if (!x.broke || b[x.k]) continue;
    b[x.k] = 1; fx({ rep: 2, taraf: 4 }); s.pop.push(tt('Rekor kırdın')); lines.push(tt`REKOR: ${x.t}`);
    addNews(tt`Rekor senin: ${x.t}. Eski sahibi ${x.n} (${x.y}).`, 'trophy'); addFeed('c:' + id, club(id).n, tt`TARİHE GEÇTİ | ${s.name}: ${x.t}`, 'kulup');
    docAdd('rekor', tt`Rekor kırdın: ${x.t}`, 6, 'trophy');
  }
}

// ---------- sezon belgeseli: sezonun anları birikir, sezon sonunda beşi gösterilir ----------
export function docAdd(k, t, p = 3, i = 'star', w = S.week) { const d = S.doc || (S.doc = []); if (S.mgr || d.some(x => x.k === k)) return; d.push({ k, t, p, i, w }); }
export const docList = () => [...(S.doc || [])].sort((a, b) => b.p - a.p).slice(0, 5).sort((a, b) => a.w - b.w);
function docMatch(M, rt, win) {
  const s = S, on = club(M.fxt.opp).n;
  if (M.pg && s.st.g === M.pg) docAdd('ilk', tt`Sezonun ilk golü: ${on} ağlarına`, 2, 'ball');
  if (M.pg >= 3) docAdd('hat', tt`${on} karşısında hat-trick`, 5, 'ball');
  if (M.derby && win) docAdd('derbi', tt`Derbi senin: ${on} karşısında ${M.usG}-${M.oppG}`, 4, 'bolt');
  if (rt >= 9) docAdd('zirve', tt`Sezonun performansı: ${on} maçında ${rt.toFixed(1).replace('.', DSEP)}`, 4, 'star');
  if (M.fxt.final && win) docAdd('final', tt`${M.fxt.name}: final senin`, 7, 'trophy');
}

// ---------- teknik direktör: kadro, diziliş, gelişim, sözleşmeler, transfer ----------
// Diziliş: her mevkiden kaç oyuncu; a hücum, d savunma çarpanı (d büyüdükçe daha çok gol yenir)
export const FORMS = {
  '4-4-2': { c: { KL: 1, DF: 4, OS: 2, KN: 2, FV: 2 }, a: 1, d: 1, n: tt('Dengeli, iki forvet') },
  '4-3-3': { c: { KL: 1, DF: 4, OS: 3, KN: 2, FV: 1 }, a: 1.07, d: 1.04, n: tt('Kanatlardan baskı') },
  '4-2-3-1': { c: { KL: 1, DF: 4, OS: 3, KN: 2, FV: 1 }, a: 1, d: .94, n: tt('Orta saha kalabalık, sağlam') },
  '3-5-2': { c: { KL: 1, DF: 3, OS: 3, KN: 2, FV: 2 }, a: 1.06, d: 1.07, n: tt('Kanat bekleriyle hücum') },
  '3-4-3': { c: { KL: 1, DF: 3, OS: 2, KN: 2, FV: 3 }, a: 1.13, d: 1.14, n: tt('Hep hücum, arkası açık') },
  '5-3-2': { c: { KL: 1, DF: 5, OS: 3, KN: 0, FV: 2 }, a: .88, d: .84, n: tt('Önce savunma') },
};
// Maç içi zihniyet: [ad, hücum, savunma, yorgunluk]
export const MENT = [[tt('Çok defansif'), .72, .7, .8], [tt('Defansif'), .87, .85, .9], [tt('Dengeli'), 1, 1, 1], [tt('Hücum'), 1.16, 1.14, 1.1], [tt('Tüm hatlarla hücum'), 1.34, 1.32, 1.22]];
export const INTS = { hafif: [tt('Hafif'), tt('Çabuk toparlanır, yavaş gelişir'), .7, 27, .002], normal: [tt('Normal'), tt('Dengeli yük'), 1, 21, .004], yogun: [tt('Yoğun'), tt('Hızlı gelişim, yorgunluk ve sakatlık riski'), 1.3, 14, .009] };
const SQC = { KL: 2, DF: 7, OS: 6, KN: 3, FV: 4 }, SQMAX = 26, SQMIN = 16;
const sqC = () => { const lid = leagueOf(S.clubId); return lid ? LMAP[lid].c : 'TR'; };
const locOnly = id => { const L = LMAP[leagueOf(id)]; return !L || (L.c === 'TR' && (L.tier || 1) >= tierCfg().low); };
export const pWage = q => wageFor(S.rt[S.clubId], q);
export function pVal(p) {
  const af = p.age <= 21 ? 1.35 : p.age <= 25 ? 1.15 : p.age <= 29 ? .9 : p.age <= 32 ? .55 : .3;
  return nice(Math.max(2000, baseW(p.q) * 260 * valF() * af * (1 + Math.max(0, p.pot - p.q) / 50)));
}
function mkPl(pos, q, n, age) {
  const m = S.mgr, a = age ?? ri(17, 33);
  return { u: ++m.xi.uid, n: n || rname(sqC()), pos, age: a, q: +q.toFixed(1), pot: clamp(Math.round(q + Math.max(0, 24 - a) * rnd(.5, 1.6) + rnd(0, 3)), Math.round(q), 95), en: ri(85, 100), fm: +rnd(6, 7).toFixed(1), mo: ri(62, 82), inj: 0, ban: 0, yc: 0, on: 0, wage: 0, until: S.season + (chance(.15) ? 0 : ri(1, 3)), st: { ap: 0, g: 0, a: 0, rs: 0 } };
}
function fixPl(x) {   // eski kayıtlardaki 16 kişilik kadroyu yeni alanlarla tamamlar
  x.u ??= ++S.mgr.xi.uid; x.age ??= ri(18, 32); x.pot ??= clamp(Math.round(x.q + Math.max(0, 24 - x.age) * 1.1 + 1), Math.round(x.q), 95); x.mo ??= 70; x.ban ??= 0; x.yc ??= 0;
  x.wage ??= pWage(x.q); x.until ??= S.season + ri(0, 2); x.st ??= { ap: 0, g: 0, a: 0, rs: 0 };
}
function newSquad() {
  const s = S, m = s.mgr, id = s.clubId, q = squad(id), r = s.rt[id];
  m.xi = { id, man: 0, v2: 1, uid: 0, fm: '4-4-2', cap: 0, yth: [], mk: null, off: [], int: 'normal', p: [] };
  const left = { ...SQC };
  SQP.forEach((pos, i) => { m.xi.p.push(mkPl(pos, r + rnd(-3, 4), q[i])); left[pos]--; });
  for (const pos in left) for (let i = 0; i < left[pos]; i++) m.xi.p.push(mkPl(pos, r + rnd(-9, 0)));
  const d = r - teamR(); for (const x of m.xi.p) { x.q = +clamp(x.q + d, 8, 95).toFixed(1); x.pot = Math.max(x.pot, Math.round(x.q)); x.wage = pWage(x.q); }
  m.xi.cap = [...m.xi.p].filter(x => x.age >= 24).sort((a, b) => b.q - a.q)[0].u;
  mgrAutoXI();
}
export function mgrXI() {
  const s = S, m = s.mgr; if (!m || m.role !== 'coach') return null;
  if (!m.xi || m.xi.id !== s.clubId) newSquad();
  else if (!m.xi.v2) {
    const X = m.xi; Object.assign(X, { v2: 1, uid: 0, fm: '4-4-2', cap: 0, yth: [], mk: null, off: [], int: 'normal' }); X.p.forEach(fixPl);
    const have = {}; X.p.forEach(x => { have[x.pos] = (have[x.pos] || 0) + 1; });
    for (const pos in SQC) for (let i = have[pos] || 0; i < SQC[pos]; i++) { const p = mkPl(pos, s.rt[s.clubId] + rnd(-9, -1)); p.wage = pWage(p.q); X.p.push(p); }
    X.cap = [...X.p].sort((a, b) => b.q - a.q)[0].u;
  }
  return m.xi.p;
}
const free = x => x.inj <= 0 && x.ban <= 0 && !x.loanOut;
function bestXI(p, fm, key = x => x.q) {
  const C = FORMS[fm].c, out = [];
  for (const pos in C) out.push(...p.filter(x => x.pos === pos && free(x)).sort((a, b) => key(b) - key(a)).slice(0, C[pos]));
  while (out.length < 11) { const x = p.filter(y => !out.includes(y) && y.pos !== 'KL' && free(y)).sort((a, b) => key(b) - key(a))[0]; if (!x) break; out.push(x); }
  return out;
}
export function teamR() { const p = mgrXI(); if (!p) return S.rt[S.clubId]; const xi = bestXI(p, S.mgr.xi.fm); return xi.reduce((a, x) => a + x.q, 0) / Math.max(1, xi.length) - Math.max(0, 11 - xi.length) * 3; }
export function syncRt() { if (mgrXI()) S.rt[S.clubId] = +clamp(teamR(), 15, 95).toFixed(2); }
const xiScore = x => x.q + (x.fm - 6.5) * 1.5 - Math.max(0, 72 - x.en) * .3 + (x.mo - 60) * .02;
export function xiBonus() {
  const p = mgrXI(); if (!p) return 0;
  const on = p.filter(x => x.on), r = S.rt[S.clubId], C = FORMS[S.mgr.xi.fm].c, cnt = k => on.filter(x => x.pos === k).length; let b = 0;
  for (const x of on) b += (x.q - r) * .12 + (x.fm - 6.5) * .35 - Math.max(0, 62 - x.en) * .035 + (x.mo - 60) * .01 - (free(x) ? 0 : 1.5);
  let pen = (cnt('KL') !== 1 ? 3 : 0) + Math.abs(11 - on.length) * 2;
  for (const k of ['DF', 'OS', 'KN', 'FV']) pen += Math.abs(cnt(k) - C[k]) * .5;
  return clamp(b / 11 * 4 - pen, -5, 2.5);
}
// Yardımcı antrenör: dizilişe göre her mevkiye en hazır oyuncuyu koyar
export function mgrAutoXI(keep) {
  const p = mgrXI(); if (!p) return; for (const x of p) { x.on = 0; x.fill = 0; }
  for (const x of bestXI(p, S.mgr.xi.fm, xiScore)) x.on = 1;
  if (!keep) S.mgr.xi.man = 0;
}
// Elle kurulan 11'i korur: yalnız sakat/cezalıyı çıkarır, mevki sayısını dizilişe uydurur
function fixXI() {
  const p = mgrXI(), C = FORMS[S.mgr.xi.fm].c, on = () => p.filter(x => x.on);
  for (const x of p) if (x.on && !free(x)) x.on = 0;
  for (const pos in C) { const a = on().filter(x => x.pos === pos).sort((x, y) => xiScore(x) - xiScore(y)); while (a.length > C[pos]) a.shift().on = 0; }
  for (const pos in C) { let n = on().filter(x => x.pos === pos).length; while (n < C[pos] && on().length < 11) { const c = p.filter(x => !x.on && x.pos === pos && free(x)).sort((a, b) => xiScore(b) - xiScore(a))[0]; if (!c) break; c.on = 1; n++; } }
  while (on().length < 11) { const c = p.filter(x => !x.on && free(x) && x.pos !== 'KL').sort((a, b) => xiScore(b) - xiScore(a))[0]; if (!c) break; c.on = 1; c.fill = 1; }   // mevki dışı yama: oyuncusu dönünce geri alınır
  while (on().length > 11) on().sort((a, b) => xiScore(a) - xiScore(b))[0].on = 0;
}
export const reXI = () => { if (!mgrXI()) return; if (S.mgr.xi.man) fixXI(); else mgrAutoXI(); };
export function mgrSwap(i, j) {
  const p = mgrXI(); if (!p || !p[i] || !p[j] || p[i].on === p[j].on) return false;
  const a = p[i].on ? p[i] : p[j], b = p[i].on ? p[j] : p[i]; if (!free(b)) return false;
  a.on = 0; b.on = 1; a.fill = 0; b.fill = 0; S.mgr.xi.man = 1; return true;
}
export function mgrForm(f) { if (!FORMS[f] || !mgrXI()) return; S.mgr.xi.fm = f; reXI(); syncRt(); }
export function mgrCap(u) { const p = mgrXI(); if (p && p.some(x => x.u === u)) S.mgr.xi.cap = u; }
export const capOf = () => { const p = mgrXI(); return p ? p.find(x => x.u === S.mgr.xi.cap) || null : null; };
export function mgrInt(k) { if (INTS[k] && mgrXI()) S.mgr.xi.int = k; }
// Haftalık: kondisyon, sakatlık, gelişim, moral
function xiTick() {
  const m = S.mgr; if (!m || m.role !== 'coach') return; const p = mgrXI(), I = INTS[m.xi.int || 'normal'], fac = facOf(S.clubId);
  for (const x of p) {
    x.en = clamp(x.en + I[3], 5, 100); if (x.inj > 0) x.inj--;
    if (x.age <= 29) { const rt = x.age <= 20 ? .016 : x.age <= 23 ? .011 : x.age <= 26 ? .006 : .003; x.q = +clamp(x.q + Math.max(0, x.pot - x.q) * rt * I[2] * (.75 + fac * .1) * (m.tr === 'genc' && x.age <= 21 ? 1.6 : 1) * (x.on ? 1.15 : 1), 5, 95).toFixed(2); }
    else x.q = +clamp(x.q - (x.age - 29) * .007, 5, 95).toFixed(2);
    if (x.inj <= 0 && chance(I[4])) { x.inj = ri(1, 3); addNews(tt`${x.n} idmanda sakatlandı: ${x.inj} hafta yok.`, 'plus'); }
    x.mo = clamp(x.mo + (x.on ? .8 : x.q >= S.rt[S.clubId] ? -1.6 : -.5) + (60 - x.mo) * .03, 5, 100);
    if (!x.req && x.mo < 28 && x.q >= S.rt[S.clubId] - 2) { x.req = 1; x.sell = 1; addNews(tt`${x.n} forma bulamadığı için ayrılmak istiyor; satış listesine girdi.`, 'alert'); }
    if (x.req && x.mo > 55) x.req = 0;
  }
  if (m.xi.man && p.some(x => x.on && x.fill)) for (const x of p) if (x.fill) { x.on = 0; x.fill = 0; }
  if (!m.xi.man || p.filter(x => x.on).length < 11 || p.some(x => x.on && !free(x))) reXI();   // elle seçmediysen ya da sakat/cezalı ilk 11'deyse yardımcı düzeltir
  if (m.xi.yth) for (const k of m.xi.yth) k.q = +clamp(k.q + Math.max(0, k.pot - k.q) * .012 * (.75 + fac * .1), 5, 95).toFixed(2);
  if (S.week === 26) { const e = p.filter(x => x.until < S.season + 1 && !x.loanIn); if (e.length) addNews(tt`${e.length} oyuncunun sözleşmesi sezon sonunda bitiyor: ${e.slice(0, 3).map(x => x.n).join(', ')}${e.length > 3 ? '…' : ''}. Kadro ekranından uzatabilirsin.`, 'pen'); }
  syncRt(); offerTick();
}
export const xiInfo = () => { const p = mgrXI(); return p ? { p, bonus: xiBonus(), man: !!S.mgr.xi.man, tired: p.filter(x => x.on && x.en < 62).length, fm: S.mgr.xi.fm, int: S.mgr.xi.int || 'normal', cap: S.mgr.xi.cap } : null; };
export const wageBill = () => (mgrXI() || []).reduce((a, x) => a + (x.wage || 0), 0);
export const wageCap = () => nice(Math.max(500, baseW(S.rt[S.clubId])) * 24) * (S.rt[S.clubId] < (KW ? 44 : 30) ? 0 : 1);
// Sezon sonu: yaş, sözleşmeler, emeklilik, kiralıkların dönüşü, altyapıdan yeni çocuklar
function squadSeason(lines) {
  const m = S.mgr, X = m.xi; if (!X || !X.v2) return;
  const gone = [];
  for (const x of X.p) {
    x.age++; x.ls = x.st; x.st = { ap: 0, g: 0, a: 0, rs: 0 }; x.yc = 0; x.ban = 0; x.sell = x.req ? 1 : 0;
    if (x.loanIn && x.loanIn <= S.season - 1) gone.push([x, tt`${x.n} kiralık dönemini bitirdi, kulübüne döndü.`]);
    else if (x.loanOut) { x.loanOut = 0; x.q = +(x.q + rnd(.5, 2)).toFixed(1); lines.push(tt`${x.n} kiralıktan döndü`); }
    else if (x.age >= 34 && chance((x.age - 33) * .3)) gone.push([x, tt`${x.n} ${x.age} yaşında futbolu bıraktı.`]);
    else if (x.until < S.season) gone.push([x, tt`${x.n} sözleşmesi bitti, takımdan ayrıldı.`]);
  }
  for (const [x, t] of gone) { X.p = X.p.filter(y => y !== x); addNews(t, 'swap'); }
  if (gone.length) lines.push(tt`${gone.length} oyuncu ayrıldı`);
  const r = S.rt[S.clubId];
  for (let i = 0; i < 3; i++) X.yth.push(mkYouth(r));
  X.yth = X.yth.slice(-8);
  lines.push(tt('Altyapıya üç yeni çocuk geldi'));
  fillSquad(lines);
  if (!X.p.some(x => x.u === X.cap)) X.cap = [...X.p].sort((a, b) => b.q - a.q)[0].u;
  X.mk = null; X.off = []; reXI(); syncRt();
}
function mkYouth(r) { const p = mkPl(pick(['KL', 'DF', 'DF', 'OS', 'OS', 'KN', 'FV']), clamp(r - ri(12, 22), 8, 80), null, ri(15, 17)); p.pot = clamp(Math.round(r + ri(-8, 16)), Math.round(p.q) + 4, 95); p.yth = 1; return p; }
function fillSquad(lines) {   // kadro çok daralırsa yönetim serbest oyuncularla tamamlar
  const X = S.mgr.xi, r = S.rt[S.clubId]; let n = 0;
  const add = pos => { const p = mkPl(pos, r + rnd(-8, -2), null, ri(24, 31)); p.wage = pWage(p.q); p.until = S.season; X.p.push(p); n++; };
  for (const pos in SQC) { const need = pos === 'KL' ? 2 : Math.min(SQC[pos], 3); while (X.p.filter(x => x.pos === pos && !x.loanOut).length < need) add(pos); }
  while (X.p.filter(x => !x.loanOut).length < SQMIN) add(pick(['DF', 'OS', 'KN', 'FV']));
  if (n && lines) lines.push(tt`Yönetim ${n} serbest oyuncuyla kadroyu tamamladı`);
}
// Altyapı: çocuğu A takıma al ya da gönder
export function youthUp(u) {
  const X = S.mgr.xi, i = X.yth.findIndex(k => k.u === u); if (i < 0 || X.p.length >= SQMAX) return false;
  const k = X.yth.splice(i, 1)[0]; delete k.yth; k.wage = nice(Math.max(0, pWage(k.q) * .5)); k.until = S.season + 2; X.p.push(k); syncRt(); return true;
}
export function youthCut(u) { const X = S.mgr.xi; X.yth = X.yth.filter(k => k.u !== u); }
// Oyuncu işlemleri
const pl = u => (mgrXI() || []).find(x => x.u === u);
export const plInfo = u => { const x = pl(u); return x ? { ...x, val: pVal(x), cap: S.mgr.xi.cap === u } : null; };
export function plList(u, on) { const x = pl(u); if (x) x.sell = on ? 1 : 0; }
export function plRenewAsk(u) { const x = pl(u); if (!x) return null; const w = nice(Math.max(pWage(x.q) * (x.mo < 45 ? 1.35 : 1.1), x.wage * 1.05)); return { w, yrs: x.age >= 31 ? 1 : x.age >= 28 ? 2 : 3, no: x.mo < 30 || (x.req && x.mo < 45) }; }
export function plRenew(u, add) {
  const x = pl(u), A = plRenewAsk(u); if (!x || !A || A.no) return false;
  if (wageBill() - x.wage + A.w > wageCap() && wageCap()) return 'cap';
  const w = Math.round(A.w * (1 + (add || 0))); if (!add && !chance(.75)) return 'ret';
  x.wage = w; x.until = S.season + A.yrs - 1 + (S.week > 30 ? 1 : 0); x.mo = clamp(x.mo + 8, 0, 100); x.req = 0; return true;
}
export function plRelease(u) {
  const X = S.mgr.xi, x = pl(u); if (!x || X.p.length <= SQMIN) return 0;
  const cost = nice(x.wage * Math.max(1, (x.until - S.season + 1) * 38 - S.week) * .5); X.p = X.p.filter(y => y !== x); S.mgr.bud = Math.max(0, S.mgr.bud - cost);
  addNews(tt`${x.n} ile karşılıklı anlaşarak yollar ayrıldı.`, 'swap'); if (X.cap === u) X.cap = [...X.p].sort((a, b) => b.q - a.q)[0].u; reXI(); syncRt(); return cost || 1;
}
export function plLoanOut(u) { const x = pl(u); if (!x || x.age > 23 || S.mgr.xi.p.filter(y => !y.loanOut).length <= SQMIN) return false; x.loanOut = 1; x.on = 0; x.wage = Math.round(x.wage * .3); reXI(); syncRt(); addNews(tt`${x.n} sezon sonuna kadar kiralık gönderildi.`, 'swap'); return true; }
// Transfer dönemi: sezon başı ilk altı hafta ve devre arası
export const winOpen = () => S.week <= 6 || (S.week >= 18 && S.week <= 22);
function mkTarget(id, r0, freeAgent) {
  const c = id && !locOnly(id) ? LMAP[leagueOf(id)].c : locOnly(S.clubId) ? 'TR' : pick([sqC(), sqC(), 'TR', 'EN', 'ES', 'BR']), pos = pick(['KL', 'DF', 'DF', 'DF', 'OS', 'OS', 'OS', 'KN', 'KN', 'FV', 'FV']);
  const age = freeAgent ? pick([ri(18, 21), ri(27, 34)]) : ri(18, 31), q = clamp((id ? S.rt[id] : r0 - 5) + rnd(-7, 4), 8, 94);
  const t = { u: ++S.mgr.xi.uid, n: rname(c), pos, age, q: +q.toFixed(1), pot: 0, club: id || null, sc: 0 };
  t.pot = clamp(Math.round(q + Math.max(0, 24 - age) * rnd(.4, 1.6) + rnd(0, 3)), Math.round(q), 95);
  t.fee = id ? nice(pVal(t) * rnd(.9, 1.15)) : 0; t.wd = nice(Math.max(0, wageFor(S.rt[S.clubId], q) * rnd(1, 1.25) * (freeAgent ? 1.15 : 1)));
  t.pr = [clamp(t.pot - ri(2, 8), Math.round(t.q), 95), clamp(t.pot + ri(2, 8), Math.round(t.q), 99)];   // gözlemci raporu yoksa potansiyel aralık olarak görünür
  return t;
}
export function tmarket() {
  const X = S.mgr.xi; if (!mgrXI()) return [];
  if (X.mk && X.mk.w >= absWeek() - 2) return X.mk.l;
  const my = leagueOf(S.clubId), r = S.rt[S.clubId], pool = [];
  for (const lid in S.lg) { const L = LMAP[lid], M = LMAP[my]; if (locOnly(S.clubId) && L.c !== 'TR') continue; if (L.c === M.c ? Math.abs((L.tier || 1) - (M.tier || 1)) > 1 : (M.tier || 1) > 1 || L.tier > 2) continue; for (const id of S.lg[lid].t) if (id !== S.clubId && Math.abs(S.rt[id] - r) <= 14) pool.push(id); }
  const l = []; for (let i = 0; i < 14 && pool.length; i++) l.push(mkTarget(pick(pool), r));
  for (let i = 0; i < 4; i++) l.push(mkTarget(null, r, true));
  X.mk = { w: absWeek(), l }; return l;
}
export const scoutCost = t => nice(Math.max(500, (t.fee || pVal(t)) * .02));
export function scout(u) { const t = tmarket().find(x => x.u === u); if (!t || t.sc) return false; const c = scoutCost(t); if (S.mgr.bud < c) return false; S.mgr.bud -= c; t.sc = 1; return true; }
// Teklif: k bonservis çarpanı. Dönüş: 'ok' | 'no' | {counter} | 'cap' | 'size' | 'shut' | 'money'
export function bid(u, k) {
  const t = tmarket().find(x => x.u === u), X = S.mgr.xi; if (!t || t.done) return 'no';
  if (!winOpen()) return 'shut'; if (X.p.length >= SQMAX) return 'size';
  const fee = nice(t.fee * k); if (S.mgr.bud < fee) return 'money';
  if (t.club) { const p = clamp(.15 + (k - .75) * 1.6 + (t.age >= 30 ? .1 : 0) - (t.q >= S.rt[t.club] + 3 ? .15 : 0), .03, .97); if (!chance(p)) { t.no = (t.no || 0) + 1; return t.no >= 2 ? 'no' : { counter: nice(t.fee * rnd(1.1, 1.3)) }; } }
  t.agreed = fee; return 'ok';
}
export function acceptCounter(u, fee) { const t = tmarket().find(x => x.u === u); if (!t || S.mgr.bud < fee) return false; t.agreed = fee; return true; }
// Oyuncuyla şahsi şartlar: w maaş çarpanı
export function terms(u, w, loan) {
  const t = tmarket().find(x => x.u === u), X = S.mgr.xi; if (!t) return 'no';
  const step = t.club ? S.rt[t.club] - S.rt[S.clubId] : 0; if (step > 9 && !loan) return 'level';
  const wage = nice(t.wd * w * (loan ? .5 : 1)); if (wageCap() && wageBill() + wage > wageCap()) return 'cap';
  if (!chance(clamp(.25 + (w - .85) * 2.4 - Math.max(0, step) * .04, .05, .98))) return 'ret';
  const fee = loan ? nice((t.fee || 0) * .08) : t.agreed || 0; if (S.mgr.bud < fee) return 'money';
  S.mgr.bud -= fee; t.done = 1;
  const p = mkPl(t.pos, t.q, t.n, t.age); Object.assign(p, { pot: t.pot, wage, until: S.season + (loan ? 0 : t.age >= 30 ? 1 : 2), mo: 78, en: 90 }); if (loan) p.loanIn = S.season;
  X.p.push(p); reXI(); syncRt(); S.mgr.conf = clamp(S.mgr.conf + (t.q > S.rt[S.clubId] ? 2 : 0), 0, 100);
  addFeed('basin', tt('Transfer Hattı'), loan ? tt`RESMÎ: ${t.n} kiralık olarak ${club(S.clubId).n} formasını giyecek.` : tt`RESMÎ: ${t.n} artık ${club(S.clubId).n} oyuncusu.`, 'manset');
  addNews(loan ? tt`${t.n} kiralık geldi.` : t.club ? tt`${t.n}, ${club(t.club).n} kulübünden ${fmtS(fee)} bedelle geldi.` : tt`${t.n} serbest oyuncu olarak imzaladı.`, 'pen');
  return 'ok';
}
// Satış teklifleri: listedeki (bazen listede olmayan yıldız) oyunculara transfer döneminde gelir
function offerTick() {
  const X = S.mgr.xi; X.off = (X.off || []).filter(o => o.w >= absWeek() - 1); if (!winOpen()) { X.off = []; return; }
  for (const x of X.p) {
    if (x.loanIn || x.loanOut || X.off.some(o => o.u === x.u)) continue;
    const star = x.q >= S.rt[S.clubId] + 4;
    if (!(x.sell ? chance(.35) : star ? chance(.05) : false)) continue;
    const L = Object.keys(S.lg).flatMap(l => S.lg[l].t).filter(id => id !== S.clubId && S.rt[id] >= x.q - 6 && S.rt[id] <= x.q + 10 && !(locOnly(S.clubId) && LMAP[leagueOf(id)].c !== 'TR'));
    if (!L.length) continue;
    X.off.push({ u: x.u, id: pick(L), fee: nice(pVal(x) * rnd(.75, 1.25) * (x.sell ? 1 : 1.2)), w: absWeek() });
  }
}
export const offers = () => (S.mgr && S.mgr.xi && S.mgr.xi.off) || [];
// k: 0 kabul, 1 pazarlık, 2 ret
export function offerAct(i, k) {
  const X = S.mgr.xi, o = X.off[i]; if (!o) return null; const x = pl(o.u);
  if (!x) { X.off.splice(i, 1); return null; }
  if (k === 2) { X.off.splice(i, 1); x.mo = clamp(x.mo - (x.req ? 12 : 3), 0, 100); return 'ret'; }
  if (k === 1) { if (chance(.5)) o.fee = nice(o.fee * 1.15); else { X.off.splice(i, 1); return 'gone'; } o.hag = 1; return 'up'; }
  if (X.p.length <= SQMIN) return 'min';
  X.off.splice(i, 1); X.p = X.p.filter(y => y !== x); S.mgr.bud += o.fee; S.rt[o.id] = clamp(S.rt[o.id] + Math.max(0, (x.q - S.rt[o.id]) * .08), 15, 95);
  if (X.cap === x.u) X.cap = [...X.p].sort((a, b) => b.q - a.q)[0].u;
  addFeed('basin', tt('Transfer Hattı'), tt`RESMÎ: ${x.n}, ${club(o.id).n} yolcusu. Bonservis ${fmtS(o.fee)}.`, 'manset');
  if (x.q >= S.rt[S.clubId] + 3) { S.mgr.conf = clamp(S.mgr.conf - 2, 0, 100); addFeed('taraftar', pick(FANS), tt('Yıldızımızı sattılar. Hayırlı olsun da kim oynayacak?')); }
  reXI(); syncRt(); return 'ok';
}

// ---------- futbol okulu: maç günü ----------
export const KHT = [[tt('Cesaret ver'), 'bolt', tt('Daha çok gol, daha çok risk')], [tt('Taktik anlat'), 'target', tt('Daha derli toplu bir ikinci yarı')], [tt('Herkesi oynat'), 'users', tt('Sonuç ikinci planda; herkes gelişir')]];
export function kidsMatch() {
  const m = S.mgr, ks = m.kids, st = ks.reduce((a, k) => a + k.tal, 0) / Math.max(1, ks.length), opp = clamp(st + rnd(-7, 7), 10, 70), low = S.lg[TRT[TRT.length - 1]].t;
  const K = { st, opp, oppN: club(pick(low)).n + ' U15', lu: 1.1 * Math.exp((st - opp) * .05), lo: 1.1 * Math.exp((opp - st) * .05), star: [...ks].sort((a, b) => b.tal - a.tal)[0].n };
  K.us = poisson(K.lu); K.op = poisson(K.lo); K.h1 = [K.us, K.op];
  return K;
}
export function kidsMatchEnd(K, c) {
  const m = S.mgr, f = [[1.3, 1.15], [1.1, .75], [.85, 1.1]][c] || [1, 1], lines = [], cap = k => 30 + (k.age - 8) * 4;
  K.us += poisson(K.lu * f[0]); K.op += poisson(K.lo * f[1]);
  if (c === 2) { for (const k of m.kids) k.tal = clamp(k.tal + .35, 5, cap(k)); lines.push(tt('Bütün öğrenciler gelişti')); }
  if (K.us > K.op) { const b = [...m.kids].sort((x, y) => y.tal - x.tal)[0]; b.tal = clamp(b.tal + .8, 5, cap(b) + 2); m.rp = clamp(m.rp + (c === 2 ? 3 : 2), 0, 100); lines.push(tt`Okul itibarı +${c === 2 ? 3 : 2}`, tt`Maçın yıldızı: ${b.n}`); }
  else { if (c === 2) { m.rp = clamp(m.rp + 1, 0, 100); lines.push(tt`Okul itibarı +${1}`); } lines.push(K.us < K.op ? tt('Çocuklar üzgün ama ders çıkardılar') : tt('Dostluk kazandı')); }
  save(); return lines;
}

// ---------- yorumculuk: haftanın maçı ----------
const punF = () => clamp(1 - (S.mgr.rt || 0) / 125, .15, 1);   // reyting yükseldikçe her yeni puan zorlaşır
export const PUND = [[tt('Kazananı öv'), 'star', tt('Güvenli; küçük artış')], [tt('Dengeli analiz'), 'chart', tt('Güvenilirlik artar')], [tt('Sert eleştir'), 'alert', tt('Reyting fırlar; tepki çekebilir')], [tt('İddialı tahmin'), 'target', tt('Tutarsa parlar, tutmazsa yakar')]];
export function punditTopic() {
  const lid = TRT[0], lg = S.lg[lid], last = lg.last && lg.last.length ? pick(lg.last) : null;
  if (last) return { h: last[0], a: last[1], hg: last[2], ag: last[3] };
  const [h, a] = shuffle([...lg.t]).slice(0, 2), [hg, ag] = simScore(S.rt[h], S.rt[a]); return { h, a, hg, ag };
}
export function punditSay(T, c) {
  const s = S, m = s.mgr, up = (rt, cr) => { m.rt = clamp(m.rt + (rt > 0 ? rt * punF() : rt), 5, 100); m.cr = clamp(m.cr + cr, 0, 100); }, lose = club(T.hg >= T.ag ? T.a : T.h).n, wn = club(T.hg >= T.ag ? T.h : T.a).n;
  const out = (t, rt, cr, x = []) => { const r0 = m.rt; up(rt, cr); const d = m.rt - r0; s.fol = Math.round(s.fol * (1 + Math.max(0, rt) / 400)); save(); return [t, [...(Math.round(d) ? [tt('Reyting ') + sg(d)] : []), ...(cr ? [tt('Güvenilirlik ') + sg(cr)] : []), ...x]]; };
  if (c === 0) return out(tt`${wn} için övgü dolu konuştun. Kimse kırılmadı, kimse de hatırlamadı.`, 1.5, 1);
  if (c === 1) return out(tt('Tahtaya çıktın, pozisyonları tek tek anlattın. Meslektaşların not aldı.'), .5, 4);
  if (c === 2) { if (chance(.3)) { s.rep = clamp(s.rep - 1, 0, 100); return out(tt`${lose} taraftarı ayağa kalktı; kulüp açıklama yayınladı. Ama herkes seni konuşuyor.`, 5, -3, [tt('İtibar −1')]); } return out(tt`${lose} için acı ama doğru şeyler söyledin. Klip gece boyunca döndü.`, 4, -1); }
  if (chance(.42)) return out(tt('Haftaya dair tahminin harfi harfine çıktı. "Demiştim" demene gerek bile kalmadı.'), 6, 5);
  return out(tt('Tahminin tutmadı. Sosyal medyada kesitlerin dönüyor.'), 1, -7);
}

// ---------- tezahürat ----------
export function chantOpts() { const p = S.name.trim().split(' '), ln = p[p.length - 1], fn = p[0]; return [tt`${ln}! ${ln}! Vur, vur, vur!`, tt`Oooo ${fn}, bizim ${fn}!`, tt`${S.num} numara, ${ln} başka!`]; }
export function setChant(i) { S.chant = chantOpts()[i] || chantOpts()[0]; addFeed('taraftar', pick(FANS), tt`Yeni tezahüratımız hazır: "${S.chant}"`); }
export function chantBoost(M) { if (!S.chant || S.mgr || M.nat || !M.fxt.home || !M.on) return null; M.stam = Math.min(100, (M.stam || 0) + 6); M.rt += .1; return S.chant; }

// ---------- transfer dedikodusu ----------
function rumorWeek() {
  const s = S, w = absWeek(); if (s.mgr || s.loan || !((s.week >= 13 && s.week <= 20) || (s.week >= 29 && s.week <= 37))) return;
  if ((s.rum && w - s.rum.w < 6) || !chance(.2)) return;
  const hot = s.watch.filter(x => x.lv >= 35 && club(x.id)), real = hot.length > 0 && chance(.6); let id;
  if (real) id = pick(hot).id;
  else { const pool = [], cur = s.rt[s.clubId]; for (const lid in s.lg) for (const c of s.lg[lid].t) { const r = s.rt[c]; if (c !== s.clubId && r >= cur + 1 && r <= cur + 9) pool.push(c); } if (!pool.length) return; id = pick(pool); }
  const n = club(id).n, t = pick([tt`${n}, ${s.name} için nabız yokluyor. Menajerler görüşmüş.`, tt`Bomba iddia: ${s.name} sezon sonunda ${n} yolcusu!`, tt`${n} scoutları ${s.name} için tribündeydi.`]);
  s.rum = { id, real: real ? 1 : 0, w, t }; addFeed('basin', tt('Transfer Hattı'), t, 'haber');
}
export const rumorInfo = () => (S.rum && !S.rum.done && !S.mgr && absWeek() - S.rum.w <= 3 && club(S.rum.id) ? S.rum : null);
export const RUMO = [[tt('Yalanla'), 'x'], [tt('Sessiz kal'), 'moon'], [tt('Göz kırp'), 'eye']];
export function rumorAct(c) {
  const s = S, r = rumorInfo(); if (!r) return null; r.done = 1; const n = club(r.id).n, w = s.watch.find(x => x.id === r.id);
  if (c === 0) { addFeed('me', s.name, tt('Kulübüme odaklıyım. Yazılanların aslı yok.'), 'ben'); if (r.real && w) w.lv = clamp(w.lv - 10, 0, 100); return [...fx({ taraf: 3, hoca: 2 }), ...(r.real && w ? [tt`${n} ilgisi azaldı`] : [])]; }
  if (c === 1) return [tt('Dedikodu kendiliğinden söndü')];
  addFeed('me', s.name, tt('Futbolda her şey olur.'), 'ben');
  if (r.real) { if (w) w.lv = clamp(w.lv + 12, 0, 100); return [...fx({ taraf: -4, hoca: -3 }), tt`${n} ilgisi arttı`]; }
  s.fol = Math.round(s.fol * 1.01); return [...fx({ taraf: -3, hoca: -2 }), tt('Takipçi +%1')];
}

// ---------- hocanın kiralık önerisi ----------
export function loanOffer() {
  const s = S, o = OVR(), cur = s.rt[s.clubId], cc = LMAP[leagueOf(s.clubId)].c, pool = [];
  for (const lid in s.lg) { if (LMAP[lid].c !== cc) continue; for (const id of s.lg[lid].t) { const r = s.rt[id]; if (id !== s.clubId && r < cur - 1 && r >= o - 6 && r <= o + 2) pool.push(id); } }
  return pool.length ? makeOffer(pick(pool), { loan: true, len: 1, wage: s.con.wage, sign: 0, goalB: s.con.goalB || 0 }) : null;
}
// Ağır sakatlık sonrası tedavi kararı. 0 ameliyat, 1 iğneyle oyna, 2 koruyucu tedavi
export function injPlan(c) {
  const s = S; delete s.fl.agir;
  if (c === 0) { s.inj = ri(12, 15); hurt(-14); delete s.fl.kronik; return tt`Ameliyat iyi geçti. ${s.inj} hafta yoksun ama diz yeniden sağlam.`; }
  if (c === 1) { s.inj = 1; hurt(12); if (chance(.55)) s.fl.kronik = 1; return s.fl.kronik ? tt('İğneyle sahaya döndün. Doktor uyardı: bu diz artık her an nüksedebilir.') : tt('İğneyle sahaya döndün. Şimdilik ağrı yok; vücudun bunun bedelini ödeyecek.'); }
  s.inj = ri(7, 9); hurt(-5); return tt`Bıçak altına yatmadın. ${s.inj} hafta rehabilitasyon; diz tam güven vermiyor ama idare eder.`;
}
