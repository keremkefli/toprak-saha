// Toprak Saha — arayüz ve oyun akışı
import * as G from './core.js';
import { LEAGUES, LMAP, POS, ATTR, ORIGINS, TRAITS, PROV, SHOP, TRAIN, COUNTRIES, ROLE, MOM, TSTAT, STANCE, PERKS, HANG, POSTS, ACH, DEC, HT, BUILD, STYLES, CELE, NET, MACT, DIFF } from './data.js';
import { pickEvent, resolve } from './events.js';
import { Mini } from './mini.js';
import { ic, avatar, persona, crestSvg, radar, ring, PERS, SKIN, HAIRC, HAIRS } from './art.js';
import { sfx } from './sfx.js';

const app = document.getElementById('app'), $modal = document.getElementById('modal'), $mini = document.getElementById('mini'), $toast = document.getElementById('toast');
const $ = s => document.querySelector(s);
let V = { scr: 'title', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'cev' }, mSim = false, curM = null, C = null, busy = false, mini = null, dres = null, AUTO = false, endHTML = '';
const sleep = ms => new Promise(r => setTimeout(r, AUTO ? 0 : ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => Math.round(n).toLocaleString('tr-TR');
const dec = (n, d = 2) => n.toFixed(d).replace('.', ',');

// ---------- küçük parçalar ----------
const crest = (id, s) => { const c = G.club(id); return crestSvg(c.n, c.c1, c.c2, s); };
const me = (cls = '') => { const s = G.S, c = G.club(s.clubId); return `<div class="avw ${cls}">${avatar(s.look, c.c1, c.c2)}</div>`; };
const bar = (v, cls = '') => `<div class="bar ${cls}"><i style="width:${G.clamp(v, 0, 100)}%"></i></div>`;
const chips = a => a && a.length ? `<div class="chg">${a.map(x => `<span class="${x.includes('−') ? 'neg' : 'pos'}">${esc(x)}</span>`).join('')}</div>` : '';
const tag = (s, cls = '') => `<span class="tagk ${cls}">${esc(s)}</span>`;
function toast(s, icon = 'check') { $toast.innerHTML = ic(icon, 18) + `<span>${esc(s)}</span>`; $toast.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => $toast.classList.remove('on'), 2800); }

function dialog({ art = '', k = '', t = '', body = '', opts, auto, cls = '' }) {
  if (AUTO) { const en = opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return Promise.resolve(auto != null ? auto : en[Math.floor(Math.random() * en.length)]); }
  return new Promise(res => {
    dres = res; sfx.pop();
    $modal.innerHTML = `<div class="sheet ${cls}">${art}<div class="sh-in">${k ? tag(k) : ''}${t ? `<h3>${esc(t)}</h3>` : ''}<div class="mbody">${body}</div>
      <div class="opts">${opts.map((o, i) => `<button class="opt ${o.c || ''}" data-a="dlg" data-v="${i}" ${o.dis ? 'disabled' : ''}>${o.i ? ic(o.i, 20) : ''}<span><b>${esc(o.t)}</b>${o.s ? `<small>${esc(o.s)}</small>` : ''}</span></button>`).join('')}</div></div></div>`;
    $modal.hidden = false; $modal.scrollTop = 0;
  });
}
const info = (t, text, k = '', art = '') => dialog({ art, k, t, body: `<p>${esc(text)}</p>`, opts: [{ t: 'Tamam' }], auto: 0 });

// Olay kartı görseli: [konuşan kişi, ikon, ton]
const EV = {
  gece: ['ark', 'moon', 'life'], sinav: ['anne', 'book', 'life'], okulbirak: ['hoca', 'book', 'club'], is: ['baba', 'briefcase', 'life'], aile_para: ['baba', 'coin', 'life'],
  anne: ['doktor', 'plus', 'med'], asker: ['asker', 'shield', 'life'], universite: ['anne', 'book', 'life'], tanisma: ['par', 'heart', 'life'], ayrilik: ['par', 'heart', 'risk'],
  evlilik: ['par', 'heart', 'life'], cocuk: ['par', 'heart', 'life'], hoca: ['hoca', 'whistle', 'club'], yenileme: ['baskan', 'pen', 'club'], kaptan: ['hoca', 'crown', 'club'],
  kavga: ['takim', 'alert', 'risk'], usta: ['takim', 'star', 'club'], maas: ['baskan', 'coin', 'risk'], krampon: ['takim', 'shirt', 'life'], scout: ['scout', 'eye', 'fame'],
  deneme: ['scout', 'target', 'fame'], menajer: ['menajer', 'pen', 'fame'], basin: ['basin', 'mic', 'fame'], rakip: ['rakip', 'bolt', 'fame'], dilbar: ['hoca', 'globe', 'club'],
  milli_tercih: ['fed', 'flag', 'fame'], sponsor: ['sponsor', 'tag', 'fame'], viral: ['taraftar', 'phone', 'fame'], linc: ['taraftar', 'phone', 'risk'], bahis: ['golge', 'coin', 'risk'],
  bahis_sonuc: ['fed', 'alert', 'risk'], sike: ['golge', 'lock', 'risk'], sike_sonuc: ['fed', 'alert', 'risk'], doping: ['golge', 'plus', 'risk'], doping_sonuc: ['fed', 'alert', 'risk'],
  yatirim: ['ark', 'chart', 'life'], yatirim_sonuc: ['ark', 'chart', 'life'], poker: ['takim', 'coin', 'risk'], bagis: ['taraftar', 'heart', 'life'], hayran: ['taraftar', 'shirt', 'life'],
  agir: ['doktor', 'plus', 'med'], bakim: ['doktor', 'plus', 'med'], kavga2: ['hoca', 'alert', 'risk'], kavga3: ['hoca', 'whistle', 'risk'],
  dolandirici: ['menajer', 'coin', 'risk'], dolandirici2: ['menajer', 'lock', 'risk'], gec: ['hoca', 'clock', 'risk'], paparazzi: ['basin', 'moon', 'risk'], vergi: ['fed', 'coin', 'risk'],
  hirsiz: ['golge', 'lock', 'risk'], akraba: ['baba', 'coin', 'life'], yalnizlik: ['anne', 'phone', 'life'], tukenmislik: ['doktor', 'heart', 'med'], reklam: ['sponsor', 'tag', 'fame'], vakif: ['taraftar', 'heart', 'life'],
  net_abi: ['baskan', 'home', 'life'], net_yildiz: ['rakip', 'star', 'fame'], net_gazeteci: ['basin', 'mic', 'fame'], net_doktor: ['doktor', 'plus', 'med'], net_scout: ['scout', 'eye', 'fame'], net_marka: ['sponsor', 'tag', 'fame'], net_golge: ['golge', 'lock', 'risk'],
};
function art(p, icon, tn) {
  const s = G.S, name = p === 'rakip' ? s.rival.n : p === 'par' && s.fl.evli ? 'Eşin' : PERS[p].n;
  return `<div class="art t-${tn}"><div class="art-ic">${ic(icon, 150)}</div><div class="art-av">${persona(p, G.club(s.clubId))}</div><span class="art-n">${esc(name)}</span></div>`;
}
const evArt = id => art(...(EV[id] || ['ark', 'news', 'life']));
function clubArt(id, sub = '') { const c = G.club(id); return `<div class="art club" style="--c1:${c.c1};--c2:${c.c2}"><div class="art-cr">${crest(id, 86)}</div><div class="art-t"><b>${esc(c.n)}</b><small>${esc(sub)}</small></div></div>`; }

// ---------- tema: vurgu rengi kulübünden gelir ya da elle seçilir ----------
const TKEY = 'toprak-saha-tema', THEMES = [['kulup', 'Kulüp', null], ['toprak', 'Toprak', '#ff6a2b'], ['cim', 'Çim', '#2fbf71'], ['gece', 'Gece', '#58a6ff'], ['ates', 'Ateş', '#ff4d4d'], ['altin', 'Altın', '#ffd23f']];
const lum = h => { const n = parseInt((h || '#000000').slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
function theme() { try { return localStorage.getItem(TKEY) || 'kulup'; } catch (e) { return 'kulup'; } }
function applyTheme() {
  let c = (THEMES.find(x => x[0] === theme()) || THEMES[0])[2];
  if (!c) { c = '#ff6a2b'; if (G.S) { const cl = G.club(G.S.clubId); c = lum(cl.c1) > .06 ? cl.c1 : lum(cl.c2) > .06 ? cl.c2 : c; } }   // çok koyu kulüp rengi koyu zeminde kaybolur
  const r = document.documentElement.style; r.setProperty('--or', c); r.setProperty('--on', lum(c) > .4 ? '#14110e' : '#fff');
}

// ---------- başlık ve oyuncu yaratma ----------
function vTitle() {
  const m = G.meta();
  return `<div class="title">
    <div class="t-lines"></div>
    <div class="brand">BAŞKA SAKARYA</div>
    <h1>TOPRAK<br><span>SAHA</span></h1>
    <p class="tag">2. Amatör'den dünya sahnesine.</p>
    <div class="tbtns">
      ${G.hasSave() ? `<button class="cta" data-a="cont">Devam et ${ic('right', 22)}</button>` : ''}
      <button class="cta ${G.hasSave() ? 'ghost' : ''}" data-a="new">Yeni kariyer</button>
    </div>
    ${m.n ? `<p class="meta">${ic('trophy', 16)} ${m.n} kariyer · en iyi ${num(m.best || 0)} puan${m.leg ? ` · miras +${m.leg}` : ''}</p>` : ''}
    <label class="link imp">Kayıt dosyası yükle<input type="file" accept=".json,application/json" data-c="imp" hidden></label>
    <button class="icb snd" data-a="snd" aria-label="Ses">${ic(sfx.on ? 'vol' : 'mute', 22)}</button>
  </div>`;
}

const OIC = { mahalle: 'home', okul: 'book', altyapi: 'shield', gurbet: 'globe' }, TIC = { hirsli: 'bolt', sakin: 'target', asi: 'alert', lider: 'crown' };
function vCreate() {
  const chip = (k, v, l) => `<button class="chip ${C[k] === v ? 'on' : ''}" data-a="set" data-v="${k}:${v}">${l}</button>`;
  const card = (k, v, o, i) => `<button class="pickc ${C[k] === v ? 'on' : ''}" data-a="set" data-v="${k}:${v}"><span class="pic">${ic(i, 22)}</span><span><b>${o.n}</b><small>${o.d}</small></span></button>`;
  const sw = (k, arr) => `<div class="sws">${arr.map((c, i) => `<button class="swc ${C.look[k] === i ? 'on' : ''}" style="background:${c}" data-a="look" data-v="${k}:${i}" aria-label="${k} ${i + 1}"></button>`).join('')}</div>`;
  return `<div class="create">
    ${tag('Yeni kariyer')}<h2>Oyuncunu yarat</h2>
    <div class="mk">
      <div class="mk-av">${avatar(C.look, '#ff6a2b', '#14110e', { num: C.num })}</div>
      <div class="mk-ctl"><small>Ten</small>${sw('skin', SKIN)}<small>Saç rengi</small>${sw('hc', HAIRC)}
        <div class="chips"><button class="chip" data-a="look" data-v="hair:${(C.look.hair + 1) % HAIRS}">${ic('swap', 16)} Saç</button>
        <button class="chip ${C.look.beard ? 'on' : ''}" data-a="look" data-v="beard:${((C.look.beard || 0) + 1) % 3}">Sakal</button>
        <button class="chip ${C.look.band ? 'on' : ''}" data-a="look" data-v="band:${C.look.band ? 0 : 1}">Bant</button></div></div>
    </div>
    <label class="fld"><span>Ad Soyad</span><input id="nm" maxlength="24" value="${esc(C.name)}" placeholder="Örn. Emre Sakarya" autocomplete="off"></label>
    <div class="fld"><span>Mevki</span><div class="chips">${Object.keys(POS).map(p => chip('pos', p, POS[p].n)).join('')}</div></div>
    <div class="fld"><span>Ayak</span><div class="chips">${['Sağ', 'Sol', 'Çift'].map(f => chip('foot', f, f)).join('')}</div></div>
    <div class="fld two"><label><span>Forma no</span><input id="nu" type="number" min="1" max="99" value="${C.num}" inputmode="numeric"></label><label><span>Lakap (isteğe bağlı)</span><input id="nk" maxlength="18" value="${esc(C.nick)}" placeholder="Örn. Adapazarı Ekspresi" autocomplete="off"></label></div>
    <div class="fld"><span>Boy</span><div class="chips">${Object.keys(HT).map(k => chip('ht', k, HT[k].n)).join('')}</div></div>
    <div class="fld"><span>Yapı</span><div class="chips">${Object.keys(BUILD).map(k => chip('build', k, BUILD[k].n)).join('')}</div></div>
    <div class="fld"><span>Oyun stili</span><div class="chips">${STYLES[C.pos].map((x, i) => chip('style', String(i), x.n)).join('')}</div></div>
    <div class="fld"><span>Gol sevinci</span><div class="chips">${Object.keys(CELE).map(k => chip('cele', k, CELE[k][0])).join('')}</div></div>
    <div class="fld"><span>Zorluk</span><div class="chips">${Object.keys(DIFF).map(k => chip('diff', k, DIFF[k][0])).join('')}</div></div>
    <label class="fld"><span>Memleket</span><select data-c="prov">${Object.keys(PROV).map(p => `<option ${C.prov === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <div class="fld"><span>Köken</span>${Object.keys(ORIGINS).map(k => card('origin', k, ORIGINS[k], OIC[k])).join('')}</div>
    <div class="fld"><span>Karakter</span>${Object.keys(TRAITS).map(k => card('trait', k, TRAITS[k], TIC[k])).join('')}</div>
    <button class="cta" data-a="start">Kariyere başla ${ic('right', 22)}</button>
    <button class="link" data-a="title">Geri</button>
  </div>`;
}

// ---------- merkez ----------
function head() {
  const s = G.S, c = G.club(s.clubId), L = LMAP[G.leagueOf(s.clubId)];
  return `<header class="top">${crest(s.clubId, 40)}
    <div class="tc"><b>${esc(c.n)}</b><small>${L.name} · Hafta ${s.week}/${G.WEEKS}${s.loan ? ' · kiralık' : ''}</small></div>
    <span class="pill">${ic('coin', 16)}${G.fmtS(s.money)}</span>
    <button class="icb" data-a="snd" aria-label="Ses">${ic(sfx.on ? 'vol' : 'mute', 20)}</button></header>`;
}
function roleText() {
  const s = G.S, r = G.role();
  if (r === 'sakat') return `Sakat · ${s.inj} hafta`;
  if (r === 'ceza') return `${s.banR || 'Cezalı'} · ${s.ban} hafta`;
  return ROLE[r];
}
const formChips = () => { const r = G.S.lastR; return r.length ? r.map(x => `<i class="${x >= 7.5 ? 'hi' : x < 6 ? 'lo' : ''}">${dec(x, 1)}</i>`).join('') : '<em>henüz maç yok</em>'; };

function hero(big) {
  const s = G.S, c = G.club(s.clubId), nm = s.name.split(' ');
  return `<section class="hero ${big ? 'big' : ''}" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="hero-l">
      <div class="ovr"><b>${G.OVR()}</b><span>${s.pos}</span><span class="no">${s.num}</span></div>
      <h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2>
      <small>${s.age} yaş · ${G.fmtS(G.value())}${s.fl.kaptan ? ' · kaptan' : ''}${G.youngRule() ? ' · yaşı küçük statüsü' : ''}</small>
      <div class="form">${formChips()}</div>
    </div>
    <div class="hero-r">${avatar(s.look, c.c1, c.c2, { num: s.num })}<span class="hero-cr">${crest(s.clubId, 34)}</span></div>
  </section>`;
}
const gauge = (v, icon, l, cls = '') => `<div class="gg ${cls}">${ring(v, icon)}<b>${Math.round(v)}</b><small>${l}</small></div>`;

function fixCard(f, cupF) {
  const s = G.S, r = G.role(), o = G.club(f.opp), u = G.club(s.clubId), a = s.rt[s.clubId], b = s.rt[f.opp];
  return `<section class="vsc ${cupF ? 'cup' : ''}">
    <div class="vs-h"><span>${tag(cupF ? `${f.name} · ${f.round}` : LMAP[f.lid].name, cupF ? 'ye' : '')}${G.isDerby(s.clubId, f.opp) ? ' ' + tag('Derbi', 'ye') : ''}</span><span class="where">${ic(f.final ? 'trophy' : f.home ? 'home' : 'right', 14)}${f.final ? 'Tarafsız saha' : f.home ? 'İç saha' : 'Deplasman'}</span></div>
    <div class="vs3"><div class="side">${crest(s.clubId, 52)}<b>${esc(u.n)}</b></div><div class="mid"><b>VS</b></div><div class="side">${crest(f.opp, 52)}<b>${esc(o.n)}</b></div></div>
    <div class="pw"><i style="width:${(a / (a + b) * 100).toFixed(1)}%"></i></div>
    <div class="pwl"><span>${Math.round(a)}</span><span class="rolep ${r}">${roleText()}</span><span>${Math.round(b)}</span></div>
  </section>`;
}

function actions() {
  const s = G.S, a = [], inj = s.inj > 0;
  a.push({ id: 'train', n: 'Antrenman', i: 'train', e: [['bolt', '−10', 0]], dis: inj });
  a.push({ id: 'rest', n: 'Dinlen', i: 'bed', e: [['bolt', '+20', 1]] });
  a.push({ id: 'aile', n: 'Aile', i: 'home', e: [['heart', '+9', 1]] });
  a.push({ id: 'ark', n: 'Arkadaşlar', i: 'users', e: [['smile', '+5', 1], ['bolt', '−4', 0]] });
  if (s.rel.par != null) a.push({ id: 'par', n: s.fl.evli ? 'Eşin' : 'Sevgilin', i: 'heart', e: [['heart', '+11', 1]] });
  if (s.con.wage < 20000 && !s.job) a.push({ id: 'job', n: 'Ek iş', i: 'briefcase', e: [['coin', '+2B', 1], ['bolt', '−12', 0]], dis: inj });
  if (s.fl.okul) a.push({ id: 'okul', n: 'Ders', i: 'book', e: [['book', '+5', 1]] });
  a.push({ id: 'sosyal', n: 'Paylaşım', i: 'phone', e: [['users', '+', 1]] });
  if (s.dil < 100 && (s.rep >= 25 || s.fl.dilBar)) a.push({ id: 'dil', n: 'Dil kursu', i: 'globe', e: [['coin', '−3B', 0]], dis: s.money < 3000 });
  if (inj) a.push({ id: 'rehab', n: 'Rehabilitasyon', i: 'heart', e: [['plus', '−1 hf', 1]], dis: !!s.fl.rehabw });
  if (inj) { const c = G.fizyoCost(); a.push({ id: 'fizyo', n: 'Fizyoterapi', i: 'plus', e: [['coin', '−' + G.fmtS(c).replace('₺', ''), 0]], dis: s.money < c }); }
  return a;
}

function vHome() {
  const s = G.S, fxt = G.fixture(), cf = G.cupFixture() || G.cupFixture('euro'), left = G.slots() - s.used;
  const nx = ['cup', 'euro'].map(k => [s[k], G.cupNext(k)]).filter(x => x[1] && !(cf && cf.name === x[0].name));
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const acts = actions().map(a => `<button class="act" data-a="act" data-v="${a.id}" ${a.dis || left <= 0 ? 'disabled' : ''}><span class="aic">${ic(a.i, 24)}</span><b>${a.n}</b><span class="efx">${a.e.map(([i, t, g]) => `<i class="${g ? 'pos' : 'neg'}">${ic(i, 12)}${t}</i>`).join('')}</span></button>`).join('');
  const news = s.news.slice(0, 4).map(n => `<li><span class="nic">${ic(n.ic || 'news', 18)}</span><div>${esc(n.s)}<small>${n.w}</small></div></li>`).join('');
  const play = (fxt || cf) && G.canPlay() && !s.fl.skip;
  return `${hero()}
    <section class="gauges">${gauge(s.en, 'bolt', 'Enerji', s.en < 35 ? 'low' : 'en')}${gauge(s.mo, 'smile', 'Moral', 'mo')}${gauge(s.rel.hoca, 'whistle', 'Hoca', 'ho')}${gauge(s.rel.taraf, 'users', 'Taraftar', 'ta')}</section>
    ${s.quest ? `<div class="quest ${s.quest.p >= s.quest.n ? 'ok' : ''}">${ic(s.quest.p >= s.quest.n ? 'check' : 'target', 18)}<span>Haftanın görevi: ${s.quest.t}</span><b>${Math.min(s.quest.p, s.quest.n)}/${s.quest.n}</b></div>` : ''}
    ${cf ? fixCard(cf, true) : ''}
    ${fxt ? fixCard(fxt) : cf ? '' : `<section class="vsc off">${ic('cal', 26)}<div><b>Maçsız hafta</b><small>${s.inj > 0 || s.ban > 0 ? roleText() : 'Bir eylem hakkın fazla.'}</small></div></section>`}
    ${nx.map(([c, n]) => `<div class="cupn">${ic('trophy', 16)}<span>${esc(c.name)} · ${n.round} · ${n.week}. hafta · ${esc(G.club(n.opp).n)}</span></div>`).join('')}
    <section><div class="sh"><h4>Bu hafta</h4><div class="dots">${dots}</div></div><div class="acts">${acts}</div></section>
    <section><div class="sh"><h4>Gündem</h4></div><ul class="news">${news}</ul></section>
    <div class="dock"><button class="cta" data-a="go">${play ? 'Maç günü' : 'Haftayı bitir'} ${ic('right', 22)}</button></div>`;
}

function transferCenter() {
  const s = G.S, st = G.stance(), end = s.year + (s.con.until - s.season);
  const watch = s.watch.slice().sort((a, b) => b.lv - a.lv).map(w => `<div class="wt">${crest(w.id, 30)}<div><b>${esc(G.club(w.id).n)}</b><small>${LMAP[G.leagueOf(w.id)].name} · ${G.interest(w.lv)}</small>${bar(w.lv, w.lv >= 60 ? 'hot' : 'mo')}</div></div>`).join('');
  return `<section class="card">${tag('Transfer merkezi')}
    <div class="tgrid">
      <div>${ic('tag', 16)}<small>Piyasa değeri</small><b>${G.fmtS(G.value())}</b></div>
      <div>${ic('lock', 16)}<small>Serbest kalma</small><b>${G.fmtS(s.con.rel || 0)}</b></div>
      <div>${ic('pen', 16)}<small>Sözleşme bitişi</small><b>${end}/${String((end + 1) % 100).padStart(2, '0')}</b></div>
      <div>${ic('coin', 16)}<small>Haftalık ücret</small><b>${s.con.wage ? G.fmtS(s.con.wage) : 'Amatör'}</b></div>
    </div>
    <div class="stn st-${st}">${ic(st === 'kilit' ? 'lock' : st === 'liste' ? 'alert' : 'swap', 16)}Kulüp tutumu: <b>${STANCE[st]}</b>${s.loan ? ` · asıl kulübün ${esc(G.club(s.loan.from).n)}` : ''}</div>
    <div class="seg col">${Object.keys(TSTAT).map(k => `<button class="${s.tstat === k ? 'on' : ''}" data-a="tstat" data-v="${k}">${TSTAT[k]}</button>`).join('')}</div>
    <div class="sub">${ic('eye', 16)}Seni izleyenler</div>
    ${watch || '<p class="mut sm">Henüz izleyen kulüp yok. İyi form ve menajer ilgiyi artırır.</p>'}
    <div class="kv"><span>Menajer</span><b>${s.agent ? `${esc(s.agent.n)} (%${Math.round(s.agent.cut * 100)})` : 'Yok'}</b></div>
  </section>`;
}

function dreamCard() {
  const d = G.dreamInfo(), o = G.OVR();
  if (!d) return `<section class="card">${tag('Hedef takım', 'ye')}<button class="opt sm" data-a="dream">${ic('heart', 20)}<span><b>Hedef takım seç</b></span></button></section>`;
  const c = G.club(d.id);
  return `<section class="card">${tag('Hedef takım', 'ye')}<div class="wt">${crest(d.id, 46)}<div><b>${esc(c.n)}</b><small>${LMAP[G.leagueOf(d.id)].name} · ${d.mine ? 'Hayalindeki formayı giyiyorsun' : d.w ? G.interest(d.w.lv) : o >= d.need ? 'Seviyen yeterli, formunu koru' : `Gereken güç ${d.need} · sen ${o}`}</small>${bar(d.pct, 'hot')}</div></div><button class="link sm" data-a="dream">Hedefi değiştir</button></section>`;
}
function perkCard() {
  const s = G.S, list = PERKS.filter(p => p.no !== s.pos && (!p.only || p.only === s.pos));
  return `<section class="card">${tag('Yetenekler')}<div class="kv">${ic('star', 16)}<span>Yetenek puanı (iyi maçlarla dolar)</span><b>${s.pp}</b></div>${bar(s.px / 8 * 100, 'hot')}
    <div class="pks">${list.map(p => { const own = G.perk(p.id); return `<button class="pk ${own ? 'own' : ''}" data-a="perk" data-v="${p.id}" ${own || s.pp < p.c ? 'disabled' : ''}>${ic(p.i, 22)}<b>${p.n}</b><small>${p.d}</small><i>${own ? 'Açık' : p.c + ' puan'}</i></button>`; }).join('')}</div></section>`;
}
function achCard() {
  const s = G.S;
  return `<section class="card">${tag('Başarımlar', 'ye')}<div class="achs">${ACH.map(([id, n, i]) => `<div class="ach ${s.ach[id] ? 'on' : ''}">${ic(i, 20)}<small>${n}</small></div>`).join('')}</div></section>`;
}

function vCareer() {
  const s = G.S, t = G.tot();
  const keys = s.pos === 'KL' ? ['kaleci', 'zihin', 'guc', 'pas', 'hiz', 'kafa'] : ['sut', 'pas', 'teknik', 'hiz', 'guc', 'savunma', 'kafa', 'zihin'];
  const attrs = keys.map(k => `<div class="at ${POS[s.pos].w[k] ? 'key' : ''}"><span>${ATTR[k]}</span><b>${Math.round(s.at[k])}</b></div>`).join('');
  const cur = s.st.apps ? dec(s.st.rs / s.st.apps) : '–', car = t.apps ? dec(t.rs / t.apps) : '–';
  const hist = s.hist.slice().reverse().map(h => `<tr><td>${h.y}</td><td>${esc(h.c)}${h.k ? ' (k)' : ''}<small>${h.l} · ${h.pos}.</small></td><td>${h.apps}</td><td>${h.g}</td><td>${h.a}</td><td>${h.avg ? dec(h.avg) : '–'}</td></tr>`).join('');
  const stat = (i, v, l) => `<div class="stt">${ic(i, 18)}<b>${v}</b><small>${l}</small></div>`;
  return `${hero(true)}
    <section class="card">${tag('Özellikler')}<div class="rad">${radar(keys.map(k => ({ l: ATTR[k].slice(0, 3).toLocaleUpperCase('tr'), v: s.at[k] / Math.max(50, Math.max(...keys.map(x => s.at[x])) + 8) * 99 })))}<div class="ats">${attrs}</div></div>
      <p class="mut sm">${ic('star', 14)} Potansiyel: ${G.potText()} · ${ORIGINS[s.origin].n} · ${TRAITS[s.trait].n}</p></section>
    <section class="card">${tag('Bu sezon')}<div class="stts">${stat('shirt', s.st.apps, 'Maç')}${stat('ball', s.st.g, 'Gol')}${stat('swap', s.st.a, 'Asist')}${stat('star', cur, 'Ort.')}</div>
      <div class="kv"><span>Kariyer</span><b>${t.apps} maç · ${t.g} gol · ${t.a} asist · ${car}</b></div>
      <div class="kv"><span>Milli takım</span><b>${s.car.caps} maç · ${s.car.ng} gol</b></div></section>
    ${dreamCard()}
    ${perkCard()}
    ${transferCenter()}
    ${s.tro.length ? `<section class="card">${tag('Müze', 'ye')}<ul class="tro">${s.tro.map(x => `<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${achCard()}
    ${hist ? `<section class="card">${tag('Geçmiş')}<table class="tb hist"><tr><th>Sezon</th><th>Kulüp</th><th>M</th><th>G</th><th>A</th><th>Ort.</th></tr>${hist}</table></section>` : ''}
    <section class="card rv">${tag('Kuşak rakibin')}<div class="wt"><div class="avw sm">${persona('rakip')}</div><div><b>${esc(s.rival.n)}</b><small>${esc(s.rival.c)} · Genel ${s.rival.ovr}</small></div></div></section>`;
}

function vLeague() {
  const s = G.S, my = G.leagueOf(s.clubId), lid = V.lig && s.lg[V.lig] ? V.lig : my, z = G.zones(lid), tb = G.table(lid), n = tb.length;
  const seg = `<div class="seg">${[['tb', 'Puan'], ['cup', 'Kupa'], ['sc', 'Gol krallığı']].map(([k, l]) => `<button class="${V.lv === k ? 'on' : ''}" data-a="lv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (V.lv === 'cup') {
    const ck = V.ck === 'euro' ? 'euro' : 'cup', c = s[ck], alive = c.alive.includes(s.clubId), cn = G.cupNext(ck);
    const seg2 = `<div class="seg">${[['cup', s.cup.name], ['euro', 'Avrupa Kupası']].map(([k, l]) => `<button class="${ck === k ? 'on' : ''}" data-a="ck" data-v="${k}">${esc(l)}</button>`).join('')}</div>`;
    const rounds = c.hist.slice().reverse().map(h => {
      const mine = h.res.filter(x => x[0] === s.clubId || x[1] === s.clubId), rest = h.res.filter(x => !mine.includes(x)).slice(0, h.res.length > 8 ? 5 : 8);
      return `<div class="sub">${h.n}</div>${[...mine, ...rest].map(([a, b, ag, bg, w]) => `<div class="res ${a === s.clubId || b === s.clubId ? 'me' : ''}"><span class="${w === a ? 'w' : ''}">${esc(G.club(a).n)}</span><b>${ag} - ${bg}</b><span class="${w === b ? 'w' : ''}">${esc(G.club(b).n)}</span></div>`).join('')}${h.res.length > mine.length + rest.length ? `<p class="mut sm">+${h.res.length - mine.length - rest.length} maç daha</p>` : ''}`;
    }).join('');
    return `${seg}${seg2}<section class="card cuph">${ic('trophy', 44)}<div><h3>${esc(c.name)}</h3><small>${c.champ ? `Şampiyon: ${esc(G.club(c.champ).n)}` : alive ? `Devam ediyorsun · ${cn.round}, ${cn.week}. hafta` : c.hist.some(h => h.res.some(x => x[0] === s.clubId || x[1] === s.clubId)) ? 'Elendiniz' : 'Kulübün bu sezon katılmıyor'}</small></div></section>
      ${cn ? `<section class="card">${tag('Sıradaki tur', 'ye')}<div class="wt">${crest(cn.opp, 34)}<div><b>${esc(G.club(cn.opp).n)}</b><small>${cn.round} · ${cn.week}. hafta · güç ${Math.round(s.rt[cn.opp])}</small></div></div></section>` : ''}
      ${rounds ? `<section class="card">${rounds}</section>` : '<p class="mut sm pad">İlk tur henüz oynanmadı.</p>'}`;
  }
  const opt = LEAGUES.map(L => `<option value="${L.id}" ${L.id === lid ? 'selected' : ''}>${L.c === 'TR' ? '' : COUNTRIES[L.c] + ' · '}${L.name}${L.gen ? ' (' + s.prov + ')' : ''}</option>`).join('');
  const sel = `<label class="fld"><select data-c="lig">${opt}</select></label>`;
  if (V.lv === 'sc') {
    const sc = G.scorers(lid).filter(x => x.g > 0).map((x, i) => `<tr class="${x.me ? 'me' : ''}"><td>${i + 1}</td><td class="tn">${crest(x.team, 20)}${esc(x.n)}</td><td><b>${x.g}</b></td></tr>`).join('');
    return `${seg}${sel}<section class="card np"><table class="tb lg">${sc || '<tr><td class="mut">Henüz gol yok.</td></tr>'}</table></section>`;
  }
  const rows = tb.map((r, i) => `<tr class="${r.id === s.clubId ? 'me' : ''} ${i < z.up ? 'up' : i < z.up + z.po ? 'po' : i >= n - z.down ? 'down' : i >= n - z.down - z.out ? 'out' : ''}"><td>${i + 1}</td><td class="tn">${crest(r.id, 20)}${esc(G.club(r.id).n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const last = (s.lg[lid].last || []).map(([h, a, hg, ag]) => `<div class="res ${h === s.clubId || a === s.clubId ? 'me' : ''}"><span>${esc(G.club(h).n)}</span><b>${hg} - ${ag}</b><span>${esc(G.club(a).n)}</span></div>`).join('');
  return `${seg}${sel}
    <section class="card np"><table class="tb lg"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr>${rows}</table>
    <p class="mut sm leg"><i class="up"></i>${lid === 'tr1' || LMAP[lid].c !== 'TR' ? 'Şampiyon' : 'Yükselme'}${z.po ? '<i class="po"></i>Play-off' : ''}${z.out ? '<i class="out"></i>Play-out' : ''}${z.down ? '<i class="down"></i>Düşme' : ''} · ${s.lg[lid].rd}/${G.rounds(lid)} hafta · eşitlikte ikili averaj</p></section>
    ${last ? `<section class="card">${tag('Son hafta')}${last}</section>` : ''}`;
}

function matesCard() {
  const s = G.S, c = G.club(s.clubId), left = G.slots() - s.used;
  return `<section class="card hv-cev">${tag('Takım arkadaşların')}<div class="kv">${ic('users', 16)}<span>Takım kimyası</span><b>%${Math.round(G.chem() * 100)}</b></div>
    ${s.mates.map((m, i) => `<div class="ppl"><div class="avw sm">${avatar(m.lk, c.c1, c.c2)}</div><div><b>${esc(m.n)}</b><small>${m.r} · ${m.b >= 70 ? 'yakın dost' : m.b >= 40 ? 'arkadaş' : 'tanıdık'}</small>${bar(m.b, 'mo')}</div><button class="mini-b" data-a="mate" data-v="${i}" ${left <= 0 ? 'disabled' : ''}>Takıl</button></div>`).join('')}
    <p class="mut sm">Yakınlık asist şansını ve soyunma odası havasını artırır. Kulüpten ayrılırken yakın olduğun isimler ağına geçer.</p></section>`;
}
function netCard() {
  const s = G.S, cl = G.club(s.clubId), left = G.slots() - s.used, now = G.absWeek();
  const rows = s.net.map((c, i) => {
    const N = NET[c.k], can = c.b >= 50 && c.cd <= now;
    return `<div class="ppl"><div class="avw sm">${c.lk ? avatar(c.lk, '#3a3f47', '#f2f2f2') : persona(N.p, cl)}</div><div><b>${esc(c.n)}</b><small>${N.n}${c.org && G.club(c.org) ? ' · ' + esc(G.club(c.org).n) : ''}</small>${bar(c.b, c.k === 'golge' ? 'low' : 'hot')}</div><div class="pbs"><button class="mini-b" data-a="netm" data-v="${i}" ${left <= 0 ? 'disabled' : ''}>Görüş</button><button class="mini-b" data-a="netf" data-v="${i}" ${can ? '' : 'disabled'}>${N.f}</button></div></div>`;
  }).join('');
  return `<section class="card hv-cev">${tag('Ağın', 'ye')}${rows || '<p class="mut sm">Henüz kimseyi tanımıyorsun. Tanışmalar olaylarla gelir; kiminle yakınlaşacağın sana kalmış.</p>'}
    <p class="mut sm">İyilik istemek için bağ en az 50 olmalı, sonra 20 hafta beklenir. Görüşmezsen bağ zayıflar.</p></section>`;
}

const SIC = { krampon: 'shirt', telefon: 'phone', araba: 'car', daire: 'home', diyet: 'heart', pt: 'train', halisaha: 'ball', ev: 'home', spor: 'car', kofte: 'cart', villa: 'star' };
function vLife() {
  const s = G.S, inc = G.income(), R = s.rel, c = G.club(s.clubId);
  const rel = [['anne', 'Aile', R.aile], ['ark', 'Arkadaşlar', R.ark], ...(R.par != null ? [['par', s.fl.evli ? 'Eşin' : 'Sevgilin', R.par]] : []), ['hoca', 'Hoca', R.hoca], ['takim', 'Soyunma odası', R.takim], ['taraftar', 'Taraftar', R.taraf]]
    .map(([p, n, v]) => `<div class="rel ${v < 25 ? 'low' : ''}"><div class="relr" style="--v:${Math.round(v)}"><div class="avw">${persona(p, c)}</div></div><b>${Math.round(v)}</b><small>${n}</small></div>`).join('');
  const row = (n, v, i) => v ? `<div class="kv">${ic(i, 16)}<span>${n}</span><b class="${v < 0 ? 'neg' : ''}">${G.fmt(v)}</b></div>` : '';
  const shop = SHOP.map(i => {
    const own = G.has(i.id), cost = i.p || G.yrPrice(i), price = i.p ? G.fmtS(i.p) : `${G.fmtS(cost)}/sezon`;
    const btn = own ? `<span class="own">${ic('check', 16)}</span>` : `<button class="mini-b" data-a="buy" data-v="${i.id}" ${s.money < cost ? 'disabled' : ''}>${price}</button>`;
    return `<div class="shop ${own ? 'has' : ''}"><span class="aic">${ic(SIC[i.id] || 'cart', 22)}</span><div><b>${i.n}</b><small>${i.d}</small></div>${btn}</div>`;
  }).join('');
  const send = G.nice(Math.max(1000, s.con.wage));
  return `<div class="hvw" data-hv="${V.hv}"><div class="seg">${[['cev', 'Çevre'], ['para', 'Para'], ['ayar', 'Ayarlar']].map(([k, l]) => `<button class="${V.hv === k ? 'on' : ''}" data-a="hv" data-v="${k}">${l}</button>`).join('')}</div>
    <section class="card hv-cev">${tag('Çevren')}<div class="rels">${rel}</div></section>
    ${matesCard()}${netCard()}
    <section class="card hv-para">${tag('Haftalık bütçe')}
      ${row('Kulüp ücreti', inc.wage, 'shirt')}${row('Menajer payı', -inc.cut, 'pen')}${row('Ek iş', inc.job, 'briefcase')}${row('Sponsorlar', inc.spon, 'tag')}${row('İşletmeler', inc.biz, 'cart')}${row('Giderler', -inc.cost, 'down')}
      <div class="kv tot">${ic('coin', 16)}<span>Net</span><b class="${inc.net < 0 ? 'neg' : ''}">${G.fmt(inc.net)}</b></div>
      <button class="opt sm" data-a="send" ${s.money < send ? 'disabled' : ''}>${ic('heart', 20)}<span><b>Aileye ${G.fmt(send)} gönder</b></span></button></section>
    <section class="card hv-para">${tag('Şöhret', 'ye')}<div class="stts">
      <div class="stt">${ic('users', 18)}<b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + ' Mn' : num(s.fol)}</b><small>Takipçi</small></div>
      <div class="stt">${ic('star', 18)}<b>${Math.round(s.rep)}</b><small>İtibar</small></div>
      <div class="stt">${ic('book', 18)}<b>${Math.round(s.egt)}</b><small>Eğitim</small></div>
      <div class="stt">${ic('globe', 18)}<b>${Math.round(s.dil)}</b><small>Dil</small></div></div>
      ${s.spon.map(x => `<div class="kv">${ic('tag', 16)}<span>${esc(x.n)}</span><b>${G.fmtS(x.wk)}/hf</b></div>`).join('')}</section>
    <section class="card hv-para">${tag('Yaşam ve yatırım')}${shop}</section>
    <section class="card hv-ayar">${tag('Tema')}<div class="thm">${THEMES.map(([k, n, c]) => `<button class="${theme() === k ? 'on' : ''}" data-a="theme" data-v="${k}"><i style="background:${c || 'conic-gradient(#d81e2c, #ffd21a, #0f8a4b, #1c57c4, #d81e2c)'}"></i>${n}</button>`).join('')}</div></section>
    <button class="opt sm hv-ayar" data-a="exp">${ic('down', 20)}<span><b>Kaydı dosyaya aktar</b><small>Başka cihazda başlık ekranından yüklersin</small></span></button>
    <button class="opt sm hv-ayar" data-a="share">${ic('right', 20)}<span><b>Kariyerini paylaş</b><small>Özet metni paylaşım menüsüne ya da panoya gider</small></span></button>
    <button class="link hv-ayar" data-a="menu">Ana menü</button></div>`;
}

function feedAv(p) {
  const s = G.S, c = G.club(s.clubId);
  if (p.a === 'me') return `<div class="avw sm">${avatar(s.look, c.c1, c.c2)}</div>`;
  if (p.a.startsWith('c:')) return crest(G.club(p.a.slice(2)) ? p.a.slice(2) : s.clubId, 40);
  return `<div class="avw sm">${persona(p.a, c)}</div>`;
}
function vSocial() {
  const s = G.S, left = G.slots() - s.used, hd = '@' + s.name.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]+/g, '');
  s.feedNew = 0;
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const posts = POSTS.filter(G.canPost).map(p => `<button class="pst" data-a="post" data-v="${p.id}" ${left <= 0 ? 'disabled' : ''}>${ic(p.i, 20)}<span>${p.n}</span></button>`).join('');
  const feed = s.feed.map(p => p.k === 'manset'
    ? `<article class="fd manset"><small>${ic('news', 14)}${esc(p.n)} · ${p.w}. hafta</small><b>${esc(p.t)}</b></article>`
    : `<article class="fd k-${p.k}">${feedAv(p)}<div><div class="fd-h"><b>${esc(p.n)}</b><small>${p.k === 'ben' ? hd : p.k === 'fan' ? '@' + esc(p.n) : p.k === 'haber' ? 'haber' : ''} · ${p.w}. hf</small></div><p>${esc(p.t)}</p><div class="fd-f">${ic('heart', 14)}<span>${num(p.l)}</span>${ic('swap', 14)}<span>${num(p.l / 9)}</span></div></div></article>`).join('');
  return `<section class="card soc">${me()}<div><b>${esc(s.name)}</b><small>${hd}</small></div><div class="soc-f"><b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + ' Mn' : num(s.fol)}</b><small>takipçi</small></div></section>
    <section><div class="sh"><h4>Paylaş</h4><div class="dots">${dots}</div></div><div class="psts">${posts}</div></section>
    <section><div class="sh"><h4>Akış</h4></div><div class="feedl">${feed || '<p class="mut sm pad">Akış boş. İlk maçından sonra dolmaya başlar.</p>'}</div></section>`;
}

function vHub() {
  const tabs = [['ev', 'Saha', 'ball'], ['kar', 'Kariyer', 'user'], ['lig', 'Lig', 'trophy'], ['sos', 'Sosyal', 'phone'], ['hay', 'Hayat', 'heart']];
  const nw = V.tab === 'sos' ? 0 : G.S.feedNew || 0;
  const body = { ev: vHome, kar: vCareer, lig: vLeague, sos: vSocial, hay: vLife }[V.tab]();
  return head() + `<main>${body}</main><nav class="tabs">${tabs.map(([k, n, i]) => `<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i, 22)}<span>${n}</span>${k === 'sos' && nw ? `<em>${nw > 9 ? '9+' : nw}</em>` : ''}</button>`).join('')}</nav>`;
}

function render() {
  if (AUTO) return;
  applyTheme();
  if (V.scr === 'title') app.innerHTML = vTitle();
  else if (V.scr === 'create') app.innerHTML = vCreate();
  else if (V.scr === 'hub') app.innerHTML = vHub();
  else if (V.scr === 'end') app.innerHTML = endHTML;
  app.dataset.scr = V.scr;
  if (V.scr === 'hub' && G.S && G.S.pop.length && !busy) { toast(G.S.pop.splice(0).slice(0, 3).join(' · '), 'star'); sfx.up(); }
}

// ---------- mini oyun katmanı ----------
async function playMini(kind, oppR, label, x = {}) {
  const s = G.S;
  $mini.hidden = false; $mini.querySelector('.mh').textContent = label;
  if (!mini) mini = new Mini($mini.querySelector('canvas'));
  const ovr = G.OVR(), oppQ = G.clamp(0.5 + (oppR - ovr) / 28, .08, 1);
  const sk = a => G.clamp((a - (oppR - 12)) / 30, 0, 1);
  const hard = (1 + (s.en < 30 ? .16 : s.en < 50 ? .07 : 0) + (50 - s.mo) / 350) * (s.trait === 'sakin' ? .92 : 1) * (DIFF[s.diff] || DIFF.normal)[1];
  const cu = x.nat ? '#d81e2c' : G.club(s.clubId).c1;
  let co = x.opp ? G.club(x.opp).c1 : '#5a6470'; if (co === cu) co = x.opp ? G.club(x.opp).c2 : '#f2f2f2';
  const res = await mini.play(kind, { skill: sk(G.skillFor(kind)), speed: sk(s.at.hiz), oppQ, hard: hard * (x.focus ? .88 : 1) * (x.tired || 1) * (x.crowd ? .85 : 1), bonus: !!x.bonus, cu, co, pk: Object.fromEntries(s.perks.map(p => [p, 1])) });
  $mini.hidden = true;
  return res;
}

// ---------- akışlar ----------
async function trainFlow() {
  const s = G.S, list = TRAIN.filter(t => !t.pos || t.pos.includes(s.pos));
  const TI = { bit: 'target', top: 'ball', fiz: 'bolt', kon: 'bolt', sav: 'shield', kal: 'shield', zih: 'star' };
  const i = await dialog({ k: 'Antrenman', t: 'Neye çalışacaksın?', opts: [...list.map(t => ({ t: t.n, s: t.a.map(a => ATTR[a]).join(' + '), i: TI[t.id] })), { t: 'Vazgeç', c: 'ghost' }] });
  if (i >= list.length) return;
  const T = list[i]; let mult = 1;
  if (T.g) {
    const j = await dialog({ k: T.n, t: 'Nasıl?', opts: [{ t: 'Sahada çalış', s: 'Başarı ×1,6 · başarısızlık ×0,8', i: 'ball' }, { t: 'Hızlı geç', s: 'Verim ×1,0', i: 'right' }, { t: 'Geri', c: 'ghost' }], auto: 1 });
    if (j === 2) return;
    if (j === 0) { const r = AUTO ? G.simMoment(T.g, { oppR: G.OVR() }) : await playMini(T.g, G.OVR(), 'Antrenman · ' + T.n); mult = G.GOOD.includes(r.out) ? 1.6 : 0.8; }
  }
  const r = G.train(T.id, mult); sfx.up();
  toast(r.gs.map(([k, g]) => `${ATTR[k]} +${dec(g)}`).join(' · ') + (r.inj ? ` · Sakatlandın (${r.inj} hf)` : ''), r.inj ? 'alert' : 'up');
  G.save(); render();
}

const FXL = { ark: 'Arkadaş', mo: 'Moral', en: 'Enerji', teknik: 'Teknik' };
const fxText = f => Object.keys(f).filter(k => FXL[k] || k === 'para').map(k => k === 'para' ? G.fmt(f[k]) : `${FXL[k]} ${f[k] > 0 ? '+' : '−'}${Math.abs(f[k])}`).join(' · ');
async function hangFlow() {
  const s = G.S;
  const i = await dialog({ art: art('ark', 'users', 'life'), t: 'Kiminle?', opts: [{ t: 'Mahalle arkadaşları', s: 'Çocukluk arkadaşların', i: 'home' }, ...s.mates.map(m => ({ t: m.n, s: `${m.r} · bağ ${Math.round(m.b)}`, i: 'shirt' })), { t: 'Vazgeç', c: 'ghost' }], cls: 'ev' });
  if (i > s.mates.length) return;
  return i === 0 ? hangOld() : mateFlow(i - 1);
}
async function mateFlow(i) {
  const s = G.S, m = s.mates[i], c = G.club(s.clubId), keys = Object.keys(MACT);
  const a = `<div class="art t-club"><div class="art-ic">${ic('users', 150)}</div><div class="art-av">${avatar(m.lk, c.c1, c.c2)}</div><span class="art-n">${esc(m.r)}</span></div>`;
  const j = await dialog({ art: a, t: m.n, opts: [...keys.map(k => ({ t: MACT[k].n, s: `Bağ +${MACT[k].b}`, i: MACT[k].i })), { t: 'Vazgeç', c: 'ghost' }], cls: 'ev' });
  if (j >= keys.length) return;
  const [t, ch] = G.mateAct(i, keys[j]);
  await dialog({ art: a, t: MACT[keys[j]].n, body: `<p>${esc(t)}</p>${chips(ch)}`, opts: [{ t: 'Devam' }], auto: 0, cls: 'ev' });
  G.save(); render();
}
async function hangOld() {
  const i = await dialog({ art: art('ark', 'users', 'life'), t: 'Ne yapıyoruz?', opts: [...HANG.map(h => ({ t: h.n, s: fxText(h.fx), i: h.i, dis: !!h.fx.para && G.S.money < -h.fx.para })), { t: 'Vazgeç', c: 'ghost' }], cls: 'ev' });
  if (i >= HANG.length) return;
  const h = HANG[i], [t, ch] = G.hang(h.id);
  await dialog({ art: art('ark', h.i, 'life'), t: h.n, body: `<p>${esc(t)}</p>${chips(ch)}`, opts: [{ t: 'Devam' }], auto: 0, cls: 'ev' });
  G.save(); render();
}
async function dreamFlow() {
  const list = G.dreamList();
  const i = await dialog({ k: 'Hedef takım', t: 'Hangi formayı giymek istiyorsun?', body: '<p>Seviyen yaklaşınca bu kulüp seni kendiliğinden izlemeye başlar.</p>', opts: [...list.map(id => ({ t: G.club(id).n, s: `${LMAP[G.leagueOf(id)].name} · güç ${Math.round(G.S.rt[id])}` })), { t: 'Vazgeç', c: 'ghost' }], auto: 0 });
  if (i < list.length) { G.setDream(list[i]); G.save(); render(); }
}

async function runEvent(e) {
  const a = evArt(e.ev.id);
  const i = await dialog({ art: a, t: e.title, body: `<p>${esc(e.text)}</p>`, opts: e.opts.map(o => ({ t: o.t, s: o.s })), cls: 'ev' });
  const r = resolve(e, e.opts[i]);
  if (r.sp === 'deneme') return trialFlow(e.ctx.club);
  if (r.r || r.ch.length) {
    if (r.ch.some(x => x.includes('−')) && !r.ch.some(x => x.startsWith('+'))) sfx.bad(); else if (r.ch.some(x => x.includes('₺') && x.startsWith('+'))) sfx.coin();
    await dialog({ art: a, t: 'Sonuç', body: `<p>${esc(r.r)}</p>${chips(r.ch)}`, opts: [{ t: 'Devam' }], auto: 0, cls: 'ev' });
  }
}

function offerHTML(o) {
  return `<div class="tgrid">
      <div>${ic('coin', 16)}<small>Haftalık ücret</small><b>${o.wage ? G.fmtS(o.wage) : 'Amatör'}</b></div>
      <div>${ic('pen', 16)}<small>${o.loan ? 'Süre' : 'İmza parası'}</small><b>${o.loan ? 'Sezon sonu' : G.fmtS(o.sign)}</b></div>
      <div>${ic('shirt', 16)}<small>Rol</small><b>${ROLE[o.role]}</b></div>
      <div>${ic('cal', 16)}<small>${o.loan ? 'Tür' : 'Sözleşme'}</small><b>${o.loan ? 'Kiralık' : o.len + ' sezon'}</b></div></div>
    ${o.fee ? `<div class="stn st-${o.st === 'ok' ? 'acik' : 'kilit'}">${ic(o.st === 'ok' ? 'check' : 'lock', 16)}Bonservis teklifi <b>${G.fmtS(o.fee)}</b> · ${o.st === 'ok' ? 'kulübün kabul etti' : `kulübün ${G.fmtS(o.ask)} istiyor`}</div>` : ''}`;
}
const offerSub = id => { const L = LMAP[G.leagueOf(id)]; return `${L.c !== 'TR' ? COUNTRIES[L.c] + ' · ' : ''}${L.name} · güç ${Math.round(G.S.rt[id])}`; };

async function trialFlow(cid) {
  const s = G.S, m = { ...POS[s.pos].m }; delete m.penalti; delete m.frikik;
  let ok = 0;
  for (let i = 0; i < 3; i++) {
    const k = G.wpick(m);
    const r = AUTO ? G.simMoment(k, { oppR: s.rt[cid] }) : await playMini(k, s.rt[cid], `Deneme ${i + 1}/3 · ${MOM[k].n}`, { opp: cid });
    if (G.GOOD.includes(r.out)) ok++;
  }
  if (ok >= 2) {
    const o = G.makeOffer(cid);
    const j = await dialog({ art: clubArt(cid, offerSub(cid)), k: 'Deneme başarılı', t: `${ok}/3 başarılı`, body: offerHTML(o), opts: [{ t: 'İmzala', i: 'pen' }, { t: 'Kulübümde kalıyorum', c: 'ghost' }] });
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(`${G.club(cid).n} oyuncususun!`, 'pen'); }
  } else await info(`${ok}/3 başarılı`, 'Yetmedi. "Seni izlemeye devam edeceğiz" dediler.', 'Deneme', clubArt(cid, 'Deneme antrenmanı'));
}

async function transferWindow(kind) {
  const s = G.S, expired = s.con.until < s.season;
  let offers = G.genOffers(kind);
  if (expired) { const ren = G.renewal(); if (ren) offers.unshift(ren); if (!offers.length) offers = G.genOffers('serbest'); }
  if (!offers.length) return;
  for (;;) {
    const i = await dialog({
      art: `<div class="art t-fame"><div class="art-ic">${ic('swap', 150)}</div><div class="art-av">${persona(s.agent ? 'menajer' : 'baskan')}</div><span class="art-n">${kind === 'kis' ? 'Devre arası' : 'Yaz dönemi'}</span></div>`,
      t: expired ? 'Sözleşmen bitti' : 'Masanda teklif var',
      opts: [...offers.map(o => ({ t: G.club(o.id).n, i: o.loan ? 'clock' : o.renew ? 'pen' : o.st === 'red' ? 'lock' : 'swap', s: `${o.loan ? 'Kiralık' : o.renew ? 'Yenileme' : o.fee ? 'Bonservis ' + G.fmtS(o.fee) : 'Serbest'} · ${ROLE[o.role]} · ${o.wage ? G.fmtS(o.wage) + '/hf' : 'amatör'}${o.st === 'red' ? ' · kulübün reddetti' : ''}` })), ...(expired ? [] : [{ t: 'Kulübümde kalıyorum', c: 'ghost' }])],
    });
    if (i >= offers.length) return;
    const o = offers[i], red = o.st === 'red';
    const j = await dialog({
      art: clubArt(o.id, offerSub(o.id)), k: o.loan ? 'Kiralık teklif' : o.renew ? 'Yenileme' : 'Transfer teklifi', body: offerHTML(o),
      opts: [red ? { t: 'Transfer isteği ver', s: 'Kulübü zorla: hoca ve taraftar tepki gösterir', i: 'alert', dis: o.pushed } : { t: 'İmzala', i: 'pen' }, { t: 'Pazarlık yap', s: 'Ücreti %15 artırmayı dene', i: 'coin', dis: o.neg || !o.wage || o.loan || red }, { t: 'Geri dön', c: 'ghost' }],
    });
    if (j === 0 && red) { const r = G.pushTransfer(o); if (r.ok) sfx.up(); else sfx.bad(); await dialog({ art: art('baskan', 'lock', 'risk'), t: r.ok ? 'Kapı açıldı' : 'Kulüp direniyor', body: `<p>${esc(r.text)}</p>${chips(r.ch)}`, opts: [{ t: 'Devam' }], auto: 0 }); continue; }
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(`${G.club(o.id).n}: ${o.loan ? 'kiralık gidiyorsun' : 'imza atıldı'}.`, 'pen'); if (!AUTO && !o.loan && !o.renew) await ivFlow('imza'); return; }
    if (j === 1) {
      const r = G.negotiate(o); await info('Pazarlık', r.text, '', clubArt(o.id, offerSub(o.id)));
      if (r.gone) { offers.splice(i, 1); if (!offers.length) { if (expired) offers = G.genOffers('serbest'); else return; } }
    }
  }
}

async function runMatch(fxt, rl, mode) {
  const s = G.S, M = G.buildMatch(fxt, rl), nat = M.nat; let sim = mode === 'sim' || AUTO; mSim = false;
  const usN = nat ? fxt.usN : G.club(s.clubId).n, opN = nat ? fxt.opp.n : G.club(fxt.opp).n, home = nat ? true : fxt.home;
  const usC = nat ? crestSvg(usN, '#d81e2c', '#f2f2f2', 50) : crest(s.clubId, 50), opC = nat ? crestSvg(opN, '#3b4754', '#f2f2f2', 50) : crest(fxt.opp, 50);
  let feed, sc, mn, tlb;
  if (!AUTO) {
    V.scr = 'match'; app.dataset.scr = 'match';
    app.innerHTML = `<div class="match">
      <div class="m-h">${tag(nat ? 'Milli maç' : fxt.cup ? `${fxt.name} · ${fxt.round}` : LMAP[fxt.lid].name, fxt.cup ? 'ye' : '')}${sim ? '<span class="where">simülasyon</span>' : '<button class="chip sm" data-a="msim">Kalanı simüle et</button>'}</div>
      <div class="sb"><div class="tm">${home ? usC : opC}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${home ? opC : usC}<span>${esc(home ? opN : usN)}</span></div></div>
      <div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
      ${sim ? '' : `<div class="mctl"><div class="stam">${ic('bolt', 18)}<div class="bar"><i id="stb" style="width:${M.stam}%"></i></div><b id="stv">${Math.round(M.stam)}</b></div>
        <div class="seg">${[['d', 'Defansif'], ['n', 'Dengeli'], ['o', 'Ofansif']].map(([k, l]) => `<button class="${k === 'n' ? 'on' : ''}" data-a="mmode" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="mbt"><button class="chip sm" data-a="mcall">${ic('ball', 14)} Topu iste (2)</button>${M.crowd ? `<button class="chip sm" data-a="mcrowd">${ic('users', 14)} Tribünü coştur</button>` : ''}</div></div>`}
      <div id="feed" class="feed"></div></div>`;
    feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(); sfx.whistle(1);
  }
  curM = M;
  const stamUpd = () => { const b = $('#stb'); if (!b) return; b.style.width = M.stam + '%'; b.parentElement.classList.toggle('low', M.stam < 30); $('#stv').textContent = Math.round(M.stam); };
  // gol sonrası VAR: us gol bizim mi, mine golü oyuncu mu attı
  const vr = async (us, mine, min) => {
    const v = G.varCheck(M, us); if (!v) return;
    put(min, 'VAR incelemesi başladı...', 'var', 'eye'); if (!AUTO) sfx.card(); await wait(1900);
    if (v.cancel) {
      if (us) { M.usG--; M.varAg = true; if (mine) { M.pg--; M.rt -= 1.1; } } else M.oppG--;
      put(min, `GOL İPTAL: ${v.why}.`, us ? 'b' : 'g', 'x'); if (!AUTO) { if (us) sfx.conceded(); else sfx.goal(); }
    } else put(min, 'VAR kararı: gol geçerli.', us ? 'g' : 'b', 'check');
  };
  const put = (min, txt, cls = '', icon = '') => { if (feed) feed.insertAdjacentHTML('afterbegin', `<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); };
  const mark = (min, cls) => { if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${cls}" style="left:${Math.min(100, min / 90 * 100)}%"></i>`); };
  const upd = min => { if (!sc) return; mn.textContent = min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, min / 90 * 100) + '%'; };
  const bump = () => { if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } };
  const wait = ms => sleep(sim ? Math.min(ms, 90) : ms);
  put(1, rl === 'yedek' ? 'Maç başladı. Yedek kulübesindesin.' : 'İlk düdük! Sahadasın.', '', 'whistle'); await wait(700);
  for (let i = 0; i < M.tl.length; i++) {
    if (mSim) sim = true;
    if (!sim && M.want && !M.red && !M.off) { M.want = 0; M.tl.splice(i, 0, { min: M.tl[i].min, t: 'mom', k: G.wpick(POS[s.pos].m) }); put(M.tl[i].min, 'Elini kaldırdın, topu istedin.', 'm', 'ball'); }
    const e = M.tl[i];
    if (!sim) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 1.3 : M.mode === 'd' ? .4 : .8)); stamUpd(); }
    upd(e.min); await wait(380);
    if (e.t === 'txt') {
      put(e.min, e.s);
      if (!sim && M.mode === 'o' && rl !== 'yedek' && !M.red && !M.off) {   // ofansif oyun: fazladan pozisyon, arkada boşluk
        if (G.chance(.22)) M.tl.splice(i + 1, 0, { min: e.min, t: 'mom', k: G.wpick(POS[s.pos].m) });
        else if (G.chance(.12)) M.tl.splice(i + 1, 0, { min: e.min, t: 'bg', us: false });
      }
    } else if (e.t === 'bg' && !sim && M.mode === 'd' && G.chance(.3)) put(e.min, e.us ? 'Geride bekliyorsunuz; atak sonuçsuz kaldı.' : 'Kapalı savunma rakip atağı kesti.', '', 'shield');
    else if (e.t === 'bg') {
      if (e.us) { M.usG++; const sn = !nat && s.sc[s.clubId] ? G.pick(s.sc[s.clubId])[0] : 'Takım arkadaşın'; put(e.min, `GOL! ${sn}`, 'g', 'ball'); mark(e.min, 'g'); if (!sim) sfx.goal(); }
      else { M.oppG++; put(e.min, `${opN} golü buldu.`, 'b', 'ball'); mark(e.min, 'b'); if (!sim) sfx.conceded(); }
      upd(e.min); bump(); await wait(560);
      await vr(e.us, false, e.min); upd(e.min);
    } else if (e.t === 'dec') {
      if (!sim && !M.red && !M.off) {
        const D = DEC[e.k], g0 = M.usG; if (e.k === 'ht') { M.stam = Math.min(100, M.stam + 12); stamUpd(); }   // devre arası nefes
        const c = await dialog({ art: art(D.p, D.i, e.k === 'ht' ? 'club' : 'risk'), k: `${e.min}. dakika`, t: D.t, body: `<p>${esc(G.decText(M, e.k))}</p>`, opts: D.o.map((t, x) => ({ t, s: D.s[x] })), cls: 'ev' });
        const r = G.decide(M, e.k, c, e.min);
        r.lines.forEach(l => put(e.min, l.s, l.c || 'm', l.c === 'g' ? 'ball' : 'whistle'));
        if (M.usG > g0) { mark(e.min, 'g'); bump(); sfx.goal(); }
        if (r.add.length) { const tail = M.tl.splice(i + 1); tail.push(...r.add); tail.sort((a, b) => a.min - b.min); M.tl.push(...tail); }
        upd(e.min); await wait(600);
      }
    } else if (e.t === 'mom' && !M.red && !M.off) {
      let k = e.k, bonus = false;
      for (;;) {
        put(e.min, MOM[k].i, 'm', 'target'); await wait(620);
        const g0 = M.usG, o0 = M.oppG, crowd = M.crowdOn; M.crowdOn = 0;
        if (!sim) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 8 : M.mode === 'd' ? 5 : 6)); stamUpd(); }
        const res = sim ? G.simMoment(k, M) : await playMini(k, M.oppR, `${e.min}' · ${MOM[k].n}`, { bonus, opp: nat ? null : fxt.opp, nat, focus: M.focus, crowd, tired: M.stam < 15 ? 1.3 : M.stam < 30 ? 1.15 : 1 });
        const r = G.applyMoment(M, k, res);
        r.lines.forEach(l => put(e.min, l.s, l.c || '', l.c === 'g' || l.c === 'b' ? 'ball' : ''));
        if (M.usG > g0) { mark(e.min, 'g me'); bump(); if (sim && !AUTO) sfx.goal(); }
        if (M.oppG > o0) { mark(e.min, 'b'); bump(); if (!AUTO) sfx.conceded(); }
        if (res.out === 'faul' && !AUTO) sfx.card();
        upd(e.min); await wait(680);
        if (res.out === 'gol' && M.usG > g0) { await vr(true, true, e.min); upd(e.min); }
        if (r.chain) { k = r.chain; bonus = true; continue; }
        break;
      }
    }
  }
  upd(90);
  let pens = null;
  if (M.cup && M.usG === M.oppG) {
    put(90, 'Beraberlik. Penaltılara gidiliyor!', 'm', 'whistle'); await wait(800);
    const res = sim ? G.simMoment('penalti', M) : await playMini('penalti', M.oppR, 'Seri penaltılar', { opp: fxt.opp });
    const scored = res.out === 'gol'; M.rt += scored ? 0.4 : -0.5;
    pens = G.chance(scored ? .68 : .35);
    put(90, scored ? 'Penaltını gole çevirdin.' : 'Penaltını kaçırdın.', scored ? 'g' : 'b', 'ball');
    put(90, pens ? 'Seriyi kazandınız, tur sizin!' : 'Seri rakibin oldu.', pens ? 'g' : 'b', 'trophy'); await wait(900);
  }
  put(90, 'Son düdük.', '', 'whistle'); if (!AUTO) { sfx.whistle(3); sfx.ambOff(); } await wait(800);
  if (M.stam < 15) M.risk = Math.max(M.risk || 1, 1.5);
  curM = null;
  const rep = G.postMatch(M), win = M.usG > M.oppG || pens === true;
  if (!AUTO && fxt.final && win) sfx.trophy();
  await dialog({
    art: `<div class="art res ${win ? 't-club' : M.usG < M.oppG || pens === false ? 't-risk' : 't-life'}"><div class="art-av">${avatar(s.look, nat ? '#d81e2c' : G.club(s.clubId).c1, nat ? '#f2f2f2' : G.club(s.clubId).c2)}</div><div class="rate ${rep.rt >= 7 ? 'hi' : rep.rt < 6 ? 'lo' : ''}"><b>${dec(rep.rt, 1)}</b><small>MAÇ NOTU</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? ' (pen.)' : ''}`,
    body: `<div class="stts"><div class="stt">${ic('ball', 18)}<b>${M.pg}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${M.pa}</b><small>Asist</small></div><div class="stt">${ic('target', 18)}<b>${M.ok}/${M.mom}</b><small>An</small></div></div>${chips(rep.lines)}`,
    opts: [{ t: 'Devam' }], auto: 0,
  });
  if (!AUTO && !nat && (rep.rt >= 7.8 || M.pg >= 2)) await ivFlow('post', fxt, M);
  if (nat) return null;
  return fxt.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.pg };
}

// Maç önü / maç sonu röportajı
async function ivFlow(kind, fxt, M) {
  const I = G.IV[kind], opts = I.a.map((a, i) => ({ a, i })).filter(x => !x.a.v || (M && M.varAg));
  const j = await dialog({ art: art('basin', 'mic', 'fame'), k: kind === 'pre' ? 'Maç önü röportajı' : kind === 'imza' ? 'İmza töreni' : 'Maç sonu röportajı', t: G.pick(I.q), opts: opts.map(x => ({ t: x.a.t })), cls: 'ev' });
  const ch = G.interview(kind, opts[j].i, fxt);
  if (ch.length) toast(ch.join(' · '), 'mic');
}

async function seasonFlow() {
  const s = G.S;
  // lig bitti: play-off ve play-out oynanır, kulübün içindeyse maçlar senin
  G.initPlayoffs();
  while (G.poPending()) {
    const f = G.poFixture(), rl = G.role(); let own = null;
    if (f && (rl === '11' || rl === 'yedek')) {
      const j = await dialog({ art: clubArt(f.opp, `${f.name} · ${f.round}`), k: f.po === 'out' ? 'Play-out' : 'Play-off', t: f.po === 'out' ? 'Kaybeden küme düşer' : f.round === 'Final' ? 'Kazanan üst ligde' : 'Tek maç, uzatma yok',
        body: `<p>${f.po === 'out' ? 'Ligde kalmak için tek maç. Beraberlikte penaltılar.' : 'Yükselme yolunda eleme maçı. Beraberlikte penaltılar.'}</p>`, opts: [{ t: 'Maça çık', i: 'ball' }, { t: 'Simüle et', c: 'ghost' }] });
      own = await runMatch(f, rl, j === 0 ? 'play' : 'sim');
    }
    G.poRound(own); G.save();
  }
  const r = G.seasonEnd(); G.save();
  if (r.tro.length || r.moved === 1) sfx.trophy();
  await dialog({
    art: `<div class="art res t-fame"><div class="art-av">${me()}</div><div class="rate hi"><b>${r.pos}.</b><small>${esc(r.league)}</small></div></div>`,
    k: `${r.label} bitti`, t: `Şampiyon: ${r.champ}`,
    body: `<div class="stts"><div class="stt">${ic('shirt', 18)}<b>${r.st.apps}</b><small>Maç</small></div><div class="stt">${ic('ball', 18)}<b>${r.st.g}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${r.st.a}</b><small>Asist</small></div><div class="stt">${ic('star', 18)}<b>${r.st.apps ? dec(r.avg) : '–'}</b><small>Ort.</small></div></div>
      ${r.tro.length ? `<ul class="tro">${r.tro.map(x => `<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul>` : ''}${chips(r.lines)}<p class="mut">Artık ${s.age} yaşındasın.</p>`,
    opts: [{ t: 'Yeni sezon', i: 'right' }], auto: 0,
  });
  if (s.age >= 40) { await info('Zaman doldu', 'Kırk yaşına geldin. Krampon asma vakti.'); return retireFlow(); }
  if (s.age >= 30) {
    const j = await dialog({ t: 'Devam mı, veda mı?', body: `<p>${s.age} yaşındasın. İstersen kramponları asabilirsin.</p>`, opts: [{ t: 'Devam ediyorum', i: 'right' }, { t: 'Emekli ol', c: 'ghost' }], auto: 0 });
    if (j === 1) return retireFlow();
  }
  const oi = await dialog({ art: art('ark', 'cal', 'life'), k: 'Sezon arası', t: 'Tatili nasıl geçireceksin?', opts: G.OFF.map(o => ({ t: o.t, s: o.s, i: o.i })), cls: 'ev' });
  const och = G.offseason(oi); if (och.length) toast(och.join(' · '), 'check');
  await transferWindow('yaz');
}

async function retireFlow(reason) {
  const s = G.S, r = G.retire(), t = r.t, c = G.club(s.clubId);
  const paths = [];
  if (s.at.zihin >= 65 || s.fl.kaptan || s.fl.uni) paths.push(['Antrenör', 'whistle', 'Lisanslarını aldın. İlk işin, kariyerine başladığın ligde bir takım. Kenardan bağıran artık sensin.']);
  if (s.fol >= 300000) paths.push(['Yorumcu', 'mic', 'Ekran seni sevdi. Her hafta milyonlar yorumunu bekliyor; eski takım arkadaşların ise tedirgin.']);
  if (s.rep >= 45) paths.push(['Menajer', 'pen', 'Telefon rehberin servet değerinde. İlk müşterin, mahallenden çıkan on altı yaşında bir çocuk.']);
  if (s.money >= 30000000) paths.push(['Kulüp başkanı', 'crown', `${s.prov} futboluna yatırım yaptın. Tesisler yenilendi; tribünler adını haykırıyor.`]);
  paths.push(['Halı saha işletmecisi', 'ball', 'Memlekette bir halı saha açtın. Duvarda formaların asılı; akşamları çocuklara şut çektiriyorsun.']);
  const i = await dialog({ t: reason ? 'Kariyerin sona erdi' : 'Jübile', body: `<p>${esc(reason || 'Son maçında tribünler ayakta. Futboldan sonra ne yapacaksın?')}</p>`, opts: paths.map(p => ({ t: p[0], i: p[1] })), auto: 0 });
  sfx.trophy();
  endHTML = `<div class="title end">${tag('Kariyer özeti')}
    <section class="hero big" style="--c1:${c.c1};--c2:${c.c2}"><div class="hero-l"><div class="ovr"><b>${s.peak}</b><span>ZİRVE</span></div><h2>${esc(s.name)}</h2><small>${s.hist.length} sezon</small><div class="rank">${r.title}</div></div><div class="hero-r">${avatar(s.look, c.c1, c.c2)}</div></section>
    <div class="rate hi wide"><b>${num(r.score)}</b><small>EFSANE PUANI</small></div>
    <div class="stts"><div class="stt">${ic('shirt', 18)}<b>${t.apps}</b><small>Maç</small></div><div class="stt">${ic('ball', 18)}<b>${t.g}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${t.a}</b><small>Asist</small></div><div class="stt">${ic('flag', 18)}<b>${s.car.caps}</b><small>Milli</small></div></div>
    ${s.tro.length ? `<div class="card">${tag('Müze', 'ye')}<ul class="tro">${s.tro.map(x => `<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="card">${tag(paths[i][0])}<p>${paths[i][2]}</p></div>
    <p class="meta">${r.leg ? `Sonraki kariyere miras bonusu: +${r.leg}.` : ''}${s.fl.cocuk ? ' Çocuğun soyadını sahaya taşıyabilir.' : ''}</p>
    <button class="cta" data-a="new">Yeni kariyer</button><button class="link" data-a="title">Ana menü</button></div>`;
  G.wipe(); V.scr = 'end'; render();
}

async function nextStep() {
  if (busy) return; busy = true;
  try {
    const s = G.S;
    const wk = G.absWeek();   // maç gününden geri dönülürse olay ve milli maç tekrar etmez
    if (s.fl.evw !== wk) { s.fl.evw = wk; const ev = pickEvent(); if (ev) await runEvent(ev); G.save(); }
    if (s.over) { await retireFlow(s.over); return; }
    const nf = s.fl.natw === wk ? null : G.natFixture();
    if (nf) {
      s.fl.natw = wk;
      const j = await dialog({ art: art('fed', 'flag', 'fame'), k: 'Milli takım', t: `${nf.usN} kadrosundasın`, body: `<p>Rakip: <b>${esc(nf.opp.n)}</b></p>`, opts: [{ t: 'Maça çık', i: 'ball' }, { t: 'Simüle et', c: 'ghost' }] });
      await runMatch(nf, s.car.caps > 3 || nf.lvl === 'U21' ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
    }
    const rl = G.role(), can = (rl === '11' || rl === 'yedek') && !s.fl.skip;
    const pre = async (f, back) => {
      const rf = G.refInfo();
      const j = await dialog({
        art: clubArt(f.opp, `${f.cup ? f.name + ' · ' + f.round : LMAP[f.lid].name} · ${f.final ? 'tarafsız saha' : f.home ? 'iç saha' : 'deplasman'}`), k: 'Maç günü',
        body: `<div class="tgrid"><div>${ic('shirt', 16)}<small>Görevin</small><b>${ROLE[rl]}</b></div><div>${ic('bolt', 16)}<small>Enerji</small><b>${Math.round(s.en)}</b></div><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div></div><div class="stn st-${rf.cold ? 'kilit' : 'acik'}">${ic('whistle', 16)}Hakem <b>${esc(rf.n)}</b> · ${rf.style} · ${rf.att}</div>${s.en < 35 ? `<p class="warn">${ic('alert', 16)} Enerjin düşük: anlar zorlaşır, sakatlık riski artar.</p>` : ''}`,
        opts: [{ t: 'Maça çık', s: 'Kilit anları sen oynarsın', i: 'ball' }, { t: 'Simüle et', i: 'right' }, ...(back ? [{ t: 'Geri dön', s: 'Hafta harcanmaz', c: 'ghost' }] : [])],
      });
      if (j === 2) return 'back';
      if (!AUTO && G.bigMatch(f) && G.chance(.6)) await ivFlow('pre', f);
      return runMatch(f, rl, j === 0 ? 'play' : 'sim');
    };
    const cf = G.cupFixture() || G.cupFixture('euro'); let ownCup = null, first = true;
    if (cf && can) { ownCup = await pre(cf, true); if (ownCup === 'back') return; first = false; }
    const fxt = G.fixture(); let own = null;
    if (fxt) {
      if (can && G.S.inj <= 0) { own = await pre(fxt, first); if (own === 'back') return; }
      else if (rl === 'yok') { s.bench++; G.fx({ mo: -3 }); toast('Kadroya alınmadın.', 'x'); }
    }
    const r = G.endWeek(own, cf && cf.key === 'cup' ? ownCup : null, cf && cf.key === 'euro' ? ownCup : null); G.save();
    if (s.week === 20) await transferWindow('kis');
    if (r.over) await seasonFlow();
    if (G.S) G.save();
  } finally {
    busy = false; sfx.ambOff();
    if (G.S) { V.scr = 'hub'; V.tab = 'ev'; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}

// ---------- olaylar ----------
const grab = () => { const nm = $('#nm'), nu = $('#nu'), nk = $('#nk'); if (nm) C.name = nm.value; if (nu) C.num = G.clamp(+nu.value || 9, 1, 99); if (nk) C.nick = nk.value.trim(); };
const ACT = {
  dlg: v => { $modal.hidden = true; const r = dres; dres = null; if (r) r(+v); },
  snd: () => { sfx.toggle(); render(); },
  cont: () => { if (G.load()) { V.scr = 'hub'; V.tab = 'ev'; render(); } },
  title: () => { V.scr = 'title'; render(); },
  menu: () => { G.save(); V.scr = 'title'; render(); },
  new: async () => {
    if (G.hasSave()) { const j = await dialog({ k: 'Dikkat', t: 'Mevcut kariyer silinecek', body: '<p>Yeni kariyer başlatırsan kayıtlı kariyerin kalıcı olarak silinir.</p>', opts: [{ t: 'Sil ve yeni başla', i: 'alert' }, { t: 'Vazgeç', c: 'ghost' }] }); if (j !== 0) return; }
    const m = G.meta();
    C = { name: m.heir ? ' ' + m.heir : '', pos: 'FV', foot: 'Sağ', prov: 'Sakarya', origin: 'mahalle', trait: 'hirsli', look: { skin: 1, hair: 0, hc: 0, beard: 0, band: 0 }, num: 9, nick: '', ht: 'orta', build: 'atletik', style: '0', cele: 'kayarak', diff: 'normal' };
    V.scr = 'create'; render(); window.scrollTo(0, 0);
  },
  set: v => { const [k, x] = v.split(':'); grab(); C[k] = x; if (k === 'pos') C.style = '0'; render(); },
  look: v => { const [k, x] = v.split(':'); grab(); C.look[k] = +x; render(); },
  theme: v => { try { localStorage.setItem(TKEY, v); } catch (e) { /* yok */ } render(); },
  mmode: (v, el) => { if (!curM) return; curM.mode = v; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  mcall: (v, el) => { if (!curM || curM.calls <= 0 || curM.stam < 12 || curM.want) return; curM.calls--; curM.stam -= 12; curM.want = 1; el.innerHTML = `${ic('ball', 14)} Topu iste (${curM.calls})`; if (!curM.calls) el.disabled = true; },
  mcrowd: (v, el) => { if (!curM || !curM.crowd) return; curM.crowd = 0; curM.crowdOn = 1; el.disabled = true; sfx.goal(); G.fx({ taraf: 1 }); },
  start: () => {
    grab(); C.style = +C.style; C.name = (C.name || '').trim().replace(/\s+/g, ' ');
    if (C.name.length < 3) { toast('Oyuncuna bir ad ver.', 'alert'); $('#nm').focus(); return; }
    G.wipe(); G.newCareer(C); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'cev' }; sfx.whistle(1); render(); window.scrollTo(0, 0);
  },
  tab: v => { V.tab = v; render(); window.scrollTo(0, 0); },
  lv: v => { V.lv = v; render(); },
  tstat: v => { const ch = G.setStatus(v); if (ch.length) { sfx.bad(); toast(ch.join(' · '), 'alert'); } G.save(); render(); },
  act: async v => {
    if (busy || G.S.used >= G.slots()) return;
    if (v === 'train') { busy = true; try { await trainFlow(); } finally { busy = false; } return; }
    if (v === 'ark') { busy = true; try { await hangFlow(); } finally { busy = false; } return; }
    if (v === 'sosyal') { V.tab = 'sos'; render(); window.scrollTo(0, 0); return; }
    if (v === 'rehab') { busy = true; try { const r = await playMini('pas', G.OVR() - 6, 'Rehabilitasyon · top çalışması'); const [t, ch] = G.rehab(r.out === 'ok'); toast(t + (ch.length ? ' ' + ch.join(' · ') : ''), 'heart'); G.save(); render(); } finally { busy = false; } return; }
    const [txt, ch] = G.act(v); if (v === 'job') sfx.coin(); toast(txt + (ch.length ? ' ' + ch.join(' · ') : ''), 'check'); G.save(); render();
  },
  go: () => nextStep(),
  hv: v => { V.hv = v; render(); },
  mate: async v => { if (busy || G.S.used >= G.slots()) return; busy = true; try { await mateFlow(+v); } finally { busy = false; } },
  netm: v => { if (busy || G.S.used >= G.slots()) return; const [t, ch] = G.netMeet(+v); toast(t + ' ' + ch.join(' · '), 'users'); G.save(); render(); },
  netf: async v => {
    if (busy) return; const c = G.S.net[+v], r = G.netFavor(+v); if (!r) return;
    busy = true; try { sfx.up(); await dialog({ art: art(NET[c.k].p, NET[c.k].i, c.k === 'golge' ? 'risk' : 'fame'), k: NET[c.k].f, t: c.n, body: `<p>${esc(r[0])}</p>${chips(r[1])}`, opts: [{ t: 'Devam' }], auto: 0, cls: 'ev' }); } finally { busy = false; }
    G.save(); render();
  },
  share: () => {
    const s = G.S, t = G.tot(), txt = `Toprak Saha: ${s.name}, ${s.age} yaş, ${G.club(s.clubId).n}. ${t.apps} maç, ${t.g} gol, ${t.a} asist. Genel ${G.OVR()}. https://keremkefli.github.io/toprak-saha/`;
    if (navigator.share) navigator.share({ text: txt }).catch(() => { /* vazgeçildi */ }); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Özet panoya kopyalandı', 'check'));
  },
  msim: (v, el) => { mSim = true; el.disabled = true; el.textContent = 'Simüle ediliyor'; },
  ck: v => { V.ck = v; render(); },
  post: v => { if (busy || G.S.used >= G.slots()) return; const ch = G.post(v); sfx.pop(); toast(ch.join(' · '), 'phone'); G.save(); render(); },
  perk: v => { if (G.buyPerk(v)) { sfx.up(); toast('Yetenek açıldı', 'star'); G.save(); render(); } },
  dream: async () => { if (busy) return; busy = true; try { await dreamFlow(); } finally { busy = false; } },
  exp: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([G.exportData()], { type: 'application/json' })); a.download = 'toprak-saha-kayit.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Kayıt dosyası indirildi', 'down'); },
  buy: v => { const had = G.has(v); G.buy(v); if (!had && G.has(v)) sfx.coin(); G.save(); render(); },
  send: () => { const a = G.nice(Math.max(1000, G.S.con.wage)); const ch = G.fx({ para: -a, aile: 12 }); toast(ch.join(' · '), 'heart'); G.save(); render(); },
};
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const f = ACT[t.dataset.a]; if (!f) return; if (t.dataset.a !== 'dlg') sfx.click(); f(t.dataset.v, t); });
document.addEventListener('change', e => {
  const t = e.target.closest('[data-c]'); if (!t) return;
  if (t.dataset.c === 'prov') C.prov = t.value;
  if (t.dataset.c === 'lig') { V.lig = t.value; render(); }
  if (t.dataset.c === 'imp' && t.files[0]) t.files[0].text().then(x => { if (G.importData(x)) { V.scr = 'hub'; V.tab = 'ev'; render(); toast('Kayıt yüklendi', 'check'); } else toast('Bu dosya geçerli bir kayıt değil', 'alert'); });
});

// Geliştirici aracı: n haftayı rastgele kararlarla hızlı oynatır.
window.__ts = { G, iv: (k, f, M) => ivFlow(k, f, M), auto: async n => { AUTO = true; try { for (let i = 0; i < n && G.S; i++) { while (G.S.used < G.slots() && Math.random() < .8) { if (Math.random() < .5 && G.S.inj <= 0) await trainFlow(); else G.act(G.pick(['rest', 'aile', 'ark', 'rest'])); } if (Math.random() < .05) G.setStatus(G.pick(['mutlu', 'acik', 'kiralik'])); await nextStep(); } } finally { AUTO = false; busy = false; render(); } } };

// Ana ekrana eklenebilir uygulama: çevrimdışı açılış için hizmet işçisi
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* desteklenmiyor */ });

render();
