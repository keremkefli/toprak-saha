// Toprak Saha — arayüz ve oyun akışı
import * as G from './core.js';
import { LEAGUES, LMAP, POS, ATTR, ORIGINS, TRAITS, PROV, SHOP, TRAIN, COUNTRIES, ROLE, MOM, TSTAT, STANCE } from './data.js';
import { pickEvent, resolve } from './events.js';
import { Mini } from './mini.js';
import { ic, avatar, persona, crestSvg, radar, ring, PERS, SKIN, HAIRC, HAIRS } from './art.js';
import { sfx } from './sfx.js';

const app = document.getElementById('app'), $modal = document.getElementById('modal'), $mini = document.getElementById('mini'), $toast = document.getElementById('toast');
const $ = s => document.querySelector(s);
let V = { scr: 'title', tab: 'ev', lig: null, lv: 'tb' }, C = null, busy = false, mini = null, dres = null, AUTO = false, endHTML = '';
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
  agir: ['doktor', 'plus', 'med'], bakim: ['doktor', 'plus', 'med'],
};
function art(p, icon, tn) {
  const s = G.S, name = p === 'rakip' ? s.rival.n : p === 'par' && s.fl.evli ? 'Eşin' : PERS[p].n;
  return `<div class="art t-${tn}"><div class="art-ic">${ic(icon, 150)}</div><div class="art-av">${persona(p, G.club(s.clubId))}</div><span class="art-n">${esc(name)}</span></div>`;
}
const evArt = id => art(...(EV[id] || ['ark', 'news', 'life']));
function clubArt(id, sub = '') { const c = G.club(id); return `<div class="art club" style="--c1:${c.c1};--c2:${c.c2}"><div class="art-cr">${crest(id, 86)}</div><div class="art-t"><b>${esc(c.n)}</b><small>${esc(sub)}</small></div></div>`; }

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
      <div class="mk-av">${avatar(C.look, '#ff6a2b', '#14110e')}</div>
      <div class="mk-ctl"><small>Ten</small>${sw('skin', SKIN)}<small>Saç rengi</small>${sw('hc', HAIRC)}
        <button class="chip" data-a="look" data-v="hair:${(C.look.hair + 1) % HAIRS}">${ic('swap', 16)} Saç modeli</button></div>
    </div>
    <label class="fld"><span>Ad Soyad</span><input id="nm" maxlength="24" value="${esc(C.name)}" placeholder="Örn. Emre Sakarya" autocomplete="off"></label>
    <div class="fld"><span>Mevki</span><div class="chips">${Object.keys(POS).map(p => chip('pos', p, POS[p].n)).join('')}</div></div>
    <div class="fld"><span>Ayak</span><div class="chips">${['Sağ', 'Sol', 'Çift'].map(f => chip('foot', f, f)).join('')}</div></div>
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
      <div class="ovr"><b>${G.OVR()}</b><span>${s.pos}</span></div>
      <h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2>
      <small>${s.age} yaş · ${G.fmtS(G.value())}${s.fl.kaptan ? ' · kaptan' : ''}</small>
      <div class="form">${formChips()}</div>
    </div>
    <div class="hero-r">${avatar(s.look, c.c1, c.c2)}<span class="hero-cr">${crest(s.clubId, 34)}</span></div>
  </section>`;
}
const gauge = (v, icon, l, cls = '') => `<div class="gg ${cls}">${ring(v, icon)}<b>${Math.round(v)}</b><small>${l}</small></div>`;

function fixCard(f, cupF) {
  const s = G.S, r = G.role(), o = G.club(f.opp), u = G.club(s.clubId), a = s.rt[s.clubId], b = s.rt[f.opp];
  return `<section class="vsc ${cupF ? 'cup' : ''}">
    <div class="vs-h">${tag(cupF ? `${f.name} · ${f.round}` : LMAP[f.lid].name, cupF ? 'ye' : '')}<span class="where">${ic(f.final ? 'trophy' : f.home ? 'home' : 'right', 14)}${f.final ? 'Tarafsız saha' : f.home ? 'İç saha' : 'Deplasman'}</span></div>
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
  if (inj) { const c = G.fizyoCost(); a.push({ id: 'fizyo', n: 'Fizyoterapi', i: 'plus', e: [['coin', '−' + G.fmtS(c).replace('₺', ''), 0]], dis: s.money < c }); }
  return a;
}

function vHome() {
  const s = G.S, fxt = G.fixture(), cf = G.cupFixture(), cn = G.cupNext(), left = G.slots() - s.used;
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const acts = actions().map(a => `<button class="act" data-a="act" data-v="${a.id}" ${a.dis || left <= 0 ? 'disabled' : ''}><span class="aic">${ic(a.i, 24)}</span><b>${a.n}</b><span class="efx">${a.e.map(([i, t, g]) => `<i class="${g ? 'pos' : 'neg'}">${ic(i, 12)}${t}</i>`).join('')}</span></button>`).join('');
  const news = s.news.slice(0, 5).map(n => `<li><span class="nic">${ic(n.ic || 'news', 18)}</span><div>${esc(n.s)}<small>${n.w}</small></div></li>`).join('');
  const play = (fxt || cf) && G.canPlay() && !s.fl.skip;
  return `${hero()}
    <section class="gauges">${gauge(s.en, 'bolt', 'Enerji', s.en < 35 ? 'low' : 'en')}${gauge(s.mo, 'smile', 'Moral', 'mo')}${gauge(s.rel.hoca, 'whistle', 'Hoca', 'ho')}${gauge(s.rel.taraf, 'users', 'Taraftar', 'ta')}</section>
    ${cf ? fixCard(cf, true) : ''}
    ${fxt ? fixCard(fxt) : cf ? '' : `<section class="vsc off">${ic('cal', 26)}<div><b>Maçsız hafta</b><small>${s.inj > 0 || s.ban > 0 ? roleText() : 'Bir eylem hakkın fazla.'}</small></div></section>`}
    ${cn && !cf ? `<div class="cupn">${ic('trophy', 16)}<span>${esc(s.cup.name)} · ${cn.round} · ${cn.week}. hafta · ${esc(G.club(cn.opp).n)}</span></div>` : ''}
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
    ${transferCenter()}
    ${s.tro.length ? `<section class="card">${tag('Müze', 'ye')}<ul class="tro">${s.tro.map(x => `<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${hist ? `<section class="card">${tag('Geçmiş')}<table class="tb hist"><tr><th>Sezon</th><th>Kulüp</th><th>M</th><th>G</th><th>A</th><th>Ort.</th></tr>${hist}</table></section>` : ''}
    <section class="card rv">${tag('Kuşak rakibin')}<div class="wt"><div class="avw sm">${persona('rakip')}</div><div><b>${esc(s.rival.n)}</b><small>${esc(s.rival.c)} · Genel ${s.rival.ovr}</small></div></div></section>`;
}

function vLeague() {
  const s = G.S, my = G.leagueOf(s.clubId), lid = V.lig && s.lg[V.lig] ? V.lig : my, z = G.zones(lid), tb = G.table(lid), n = tb.length;
  const seg = `<div class="seg">${[['tb', 'Puan'], ['cup', 'Kupa'], ['sc', 'Gol krallığı']].map(([k, l]) => `<button class="${V.lv === k ? 'on' : ''}" data-a="lv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (V.lv === 'cup') {
    const c = s.cup, alive = c.alive.includes(s.clubId), cn = G.cupNext();
    const rounds = c.hist.slice().reverse().map(h => {
      const mine = h.res.filter(x => x[0] === s.clubId || x[1] === s.clubId), rest = h.res.filter(x => !mine.includes(x)).slice(0, h.res.length > 8 ? 5 : 8);
      return `<div class="sub">${h.n}</div>${[...mine, ...rest].map(([a, b, ag, bg, w]) => `<div class="res ${a === s.clubId || b === s.clubId ? 'me' : ''}"><span class="${w === a ? 'w' : ''}">${esc(G.club(a).n)}</span><b>${ag} - ${bg}</b><span class="${w === b ? 'w' : ''}">${esc(G.club(b).n)}</span></div>`).join('')}${h.res.length > mine.length + rest.length ? `<p class="mut sm">+${h.res.length - mine.length - rest.length} maç daha</p>` : ''}`;
    }).join('');
    return `${seg}<section class="card cuph">${ic('trophy', 44)}<div><h3>${esc(c.name)}</h3><small>${c.champ ? `Şampiyon: ${esc(G.club(c.champ).n)}` : alive ? `Devam ediyorsun · ${cn.round}, ${cn.week}. hafta` : 'Elendiniz'}</small></div></section>
      ${cn ? `<section class="card">${tag('Sıradaki tur', 'ye')}<div class="wt">${crest(cn.opp, 34)}<div><b>${esc(G.club(cn.opp).n)}</b><small>${cn.round} · ${cn.week}. hafta · güç ${Math.round(s.rt[cn.opp])}</small></div></div></section>` : ''}
      ${rounds ? `<section class="card">${rounds}</section>` : '<p class="mut sm pad">İlk tur henüz oynanmadı.</p>'}`;
  }
  const opt = LEAGUES.map(L => `<option value="${L.id}" ${L.id === lid ? 'selected' : ''}>${L.c === 'TR' ? '' : COUNTRIES[L.c] + ' · '}${L.name}${L.gen ? ' (' + s.prov + ')' : ''}</option>`).join('');
  const sel = `<label class="fld"><select data-c="lig">${opt}</select></label>`;
  if (V.lv === 'sc') {
    const sc = G.scorers(lid).filter(x => x.g > 0).map((x, i) => `<tr class="${x.me ? 'me' : ''}"><td>${i + 1}</td><td class="tn">${crest(x.team, 20)}${esc(x.n)}</td><td><b>${x.g}</b></td></tr>`).join('');
    return `${seg}${sel}<section class="card np"><table class="tb lg">${sc || '<tr><td class="mut">Henüz gol yok.</td></tr>'}</table></section>`;
  }
  const rows = tb.map((r, i) => `<tr class="${r.id === s.clubId ? 'me' : ''} ${i < z.up ? 'up' : i >= n - z.down ? 'down' : ''}"><td>${i + 1}</td><td class="tn">${crest(r.id, 20)}${esc(G.club(r.id).n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const last = (s.lg[lid].last || []).map(([h, a, hg, ag]) => `<div class="res ${h === s.clubId || a === s.clubId ? 'me' : ''}"><span>${esc(G.club(h).n)}</span><b>${hg} - ${ag}</b><span>${esc(G.club(a).n)}</span></div>`).join('');
  return `${seg}${sel}
    <section class="card np"><table class="tb lg"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr>${rows}</table>
    <p class="mut sm leg"><i class="up"></i>${lid === 'tr1' || LMAP[lid].c !== 'TR' ? 'Şampiyon' : 'Yükselme'}${z.down ? '<i class="down"></i>Düşme' : ''} · ${s.lg[lid].rd}/${G.rounds(lid)} hafta</p></section>
    ${last ? `<section class="card">${tag('Son hafta')}${last}</section>` : ''}`;
}

const SIC = { krampon: 'shirt', telefon: 'phone', araba: 'car', daire: 'home', diyet: 'heart', pt: 'train', halisaha: 'ball', ev: 'home', spor: 'car', kofte: 'cart', villa: 'star' };
function vLife() {
  const s = G.S, inc = G.income(), R = s.rel, c = G.club(s.clubId);
  const rel = [['anne', 'Aile', R.aile], ['ark', 'Arkadaşlar', R.ark], ...(R.par != null ? [['par', s.fl.evli ? 'Eşin' : 'Sevgilin', R.par]] : []), ['hoca', 'Hoca', R.hoca], ['takim', 'Soyunma odası', R.takim], ['taraftar', 'Taraftar', R.taraf]]
    .map(([p, n, v]) => `<div class="rel ${v < 25 ? 'low' : ''}"><div class="relr" style="--v:${Math.round(v)}"><div class="avw">${persona(p, c)}</div></div><b>${Math.round(v)}</b><small>${n}</small></div>`).join('');
  const row = (n, v, i) => v ? `<div class="kv">${ic(i, 16)}<span>${n}</span><b class="${v < 0 ? 'neg' : ''}">${G.fmt(v)}</b></div>` : '';
  const shop = SHOP.map(i => {
    const own = G.has(i.id), price = i.p ? G.fmtS(i.p) : `${G.fmtS(i.wk)}/hf`;
    const btn = own ? (i.wk ? `<button class="mini-b" data-a="buy" data-v="${i.id}">İptal</button>` : `<span class="own">${ic('check', 16)}</span>`) : `<button class="mini-b" data-a="buy" data-v="${i.id}" ${i.p && s.money < i.p ? 'disabled' : ''}>${price}</button>`;
    return `<div class="shop ${own ? 'has' : ''}"><span class="aic">${ic(SIC[i.id] || 'cart', 22)}</span><div><b>${i.n}</b><small>${i.d}</small></div>${btn}</div>`;
  }).join('');
  const send = G.nice(Math.max(1000, s.con.wage));
  return `<section class="card">${tag('Çevren')}<div class="rels">${rel}</div></section>
    <section class="card">${tag('Haftalık bütçe')}
      ${row('Kulüp ücreti', inc.wage, 'shirt')}${row('Menajer payı', -inc.cut, 'pen')}${row('Ek iş', inc.job, 'briefcase')}${row('Sponsorlar', inc.spon, 'tag')}${row('İşletmeler', inc.biz, 'cart')}${row('Giderler', -inc.cost, 'down')}
      <div class="kv tot">${ic('coin', 16)}<span>Net</span><b class="${inc.net < 0 ? 'neg' : ''}">${G.fmt(inc.net)}</b></div>
      <button class="opt sm" data-a="send" ${s.money < send ? 'disabled' : ''}>${ic('heart', 20)}<span><b>Aileye ${G.fmt(send)} gönder</b></span></button></section>
    <section class="card">${tag('Şöhret', 'ye')}<div class="stts">
      <div class="stt">${ic('users', 18)}<b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + ' Mn' : num(s.fol)}</b><small>Takipçi</small></div>
      <div class="stt">${ic('star', 18)}<b>${Math.round(s.rep)}</b><small>İtibar</small></div>
      <div class="stt">${ic('book', 18)}<b>${Math.round(s.egt)}</b><small>Eğitim</small></div>
      <div class="stt">${ic('globe', 18)}<b>${Math.round(s.dil)}</b><small>Dil</small></div></div>
      ${s.spon.map(x => `<div class="kv">${ic('tag', 16)}<span>${esc(x.n)}</span><b>${G.fmtS(x.wk)}/hf</b></div>`).join('')}</section>
    <section class="card">${tag('Yaşam ve yatırım')}${shop}</section>
    <button class="link" data-a="menu">Ana menü</button>`;
}

function vHub() {
  const tabs = [['ev', 'Saha', 'ball'], ['kar', 'Kariyer', 'user'], ['lig', 'Lig', 'trophy'], ['hay', 'Hayat', 'heart']];
  const body = { ev: vHome, kar: vCareer, lig: vLeague, hay: vLife }[V.tab]();
  return head() + `<main>${body}</main><nav class="tabs">${tabs.map(([k, n, i]) => `<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i, 22)}<span>${n}</span></button>`).join('')}</nav>`;
}

function render() {
  if (AUTO) return;
  if (V.scr === 'title') app.innerHTML = vTitle();
  else if (V.scr === 'create') app.innerHTML = vCreate();
  else if (V.scr === 'hub') app.innerHTML = vHub();
  else if (V.scr === 'end') app.innerHTML = endHTML;
  app.dataset.scr = V.scr;
}

// ---------- mini oyun katmanı ----------
async function playMini(kind, oppR, label, x = {}) {
  const s = G.S;
  $mini.hidden = false; $mini.querySelector('.mh').textContent = label;
  if (!mini) mini = new Mini($mini.querySelector('canvas'));
  const ovr = G.OVR(), oppQ = G.clamp(0.5 + (oppR - ovr) / 28, .08, 1);
  const sk = a => G.clamp((a - (oppR - 12)) / 30, 0, 1);
  const hard = (1 + (s.en < 30 ? .16 : s.en < 50 ? .07 : 0) + (50 - s.mo) / 350) * (s.trait === 'sakin' ? .92 : 1);
  const cu = x.nat ? '#d81e2c' : G.club(s.clubId).c1;
  let co = x.opp ? G.club(x.opp).c1 : '#5a6470'; if (co === cu) co = x.opp ? G.club(x.opp).c2 : '#f2f2f2';
  const res = await mini.play(kind, { skill: sk(G.skillFor(kind)), speed: sk(s.at.hiz), oppQ, hard, bonus: !!x.bonus, cu, co });
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
    const j = await dialog({ k: T.n, t: 'Nasıl?', opts: [{ t: 'Sahada çalış', s: 'Başarı ×1,6 · başarısızlık ×0,8', i: 'ball' }, { t: 'Hızlı geç', s: 'Verim ×1,0', i: 'right' }] });
    if (j === 0) { const r = AUTO ? G.simMoment(T.g, { oppR: G.OVR() }) : await playMini(T.g, G.OVR(), 'Antrenman · ' + T.n); mult = G.GOOD.includes(r.out) ? 1.6 : 0.8; }
  }
  const r = G.train(T.id, mult); sfx.up();
  toast(r.gs.map(([k, g]) => `${ATTR[k]} +${dec(g)}`).join(' · ') + (r.inj ? ` · Sakatlandın (${r.inj} hf)` : ''), r.inj ? 'alert' : 'up');
  G.save(); render();
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
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(`${G.club(o.id).n}: ${o.loan ? 'kiralık gidiyorsun' : 'imza atıldı'}.`, 'pen'); return; }
    if (j === 1) {
      const r = G.negotiate(o); await info('Pazarlık', r.text, '', clubArt(o.id, offerSub(o.id)));
      if (r.gone) { offers.splice(i, 1); if (!offers.length) { if (expired) offers = G.genOffers('serbest'); else return; } }
    }
  }
}

async function runMatch(fxt, rl, mode) {
  const s = G.S, M = G.buildMatch(fxt, rl), nat = M.nat, sim = mode === 'sim' || AUTO;
  const usN = nat ? fxt.usN : G.club(s.clubId).n, opN = nat ? fxt.opp.n : G.club(fxt.opp).n, home = nat ? true : fxt.home;
  const usC = nat ? crestSvg(usN, '#d81e2c', '#f2f2f2', 50) : crest(s.clubId, 50), opC = nat ? crestSvg(opN, '#3b4754', '#f2f2f2', 50) : crest(fxt.opp, 50);
  let feed, sc, mn, tlb;
  if (!AUTO) {
    V.scr = 'match'; app.dataset.scr = 'match';
    app.innerHTML = `<div class="match">
      <div class="m-h">${tag(nat ? 'Milli maç' : fxt.cup ? `${fxt.name} · ${fxt.round}` : LMAP[fxt.lid].name, fxt.cup ? 'ye' : '')}${sim ? '<span class="where">simülasyon</span>' : ''}</div>
      <div class="sb"><div class="tm">${home ? usC : opC}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${home ? opC : usC}<span>${esc(home ? opN : usN)}</span></div></div>
      <div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
      <div id="feed" class="feed"></div></div>`;
    feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(); sfx.whistle(1);
  }
  const put = (min, txt, cls = '', icon = '') => { if (feed) feed.insertAdjacentHTML('afterbegin', `<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); };
  const mark = (min, cls) => { if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${cls}" style="left:${Math.min(100, min / 90 * 100)}%"></i>`); };
  const upd = min => { if (!sc) return; mn.textContent = min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, min / 90 * 100) + '%'; };
  const bump = () => { if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } };
  const wait = ms => sleep(sim ? Math.min(ms, 90) : ms);
  put(1, rl === 'yedek' ? 'Maç başladı. Yedek kulübesindesin.' : 'İlk düdük! Sahadasın.', '', 'whistle'); await wait(700);
  for (const e of M.tl) {
    upd(e.min); await wait(380);
    if (e.t === 'txt') put(e.min, e.s);
    else if (e.t === 'bg') {
      if (e.us) { M.usG++; const sn = !nat && s.sc[s.clubId] ? G.pick(s.sc[s.clubId])[0] : 'Takım arkadaşın'; put(e.min, `GOL! ${sn}`, 'g', 'ball'); mark(e.min, 'g'); if (!sim) sfx.goal(); }
      else { M.oppG++; put(e.min, `${opN} golü buldu.`, 'b', 'ball'); mark(e.min, 'b'); if (!sim) sfx.conceded(); }
      upd(e.min); bump(); await wait(560);
    } else if (e.t === 'mom' && !M.red) {
      let k = e.k, bonus = false;
      for (;;) {
        put(e.min, MOM[k].i, 'm', 'target'); await wait(620);
        const g0 = M.usG, o0 = M.oppG;
        const res = sim ? G.simMoment(k, M) : await playMini(k, M.oppR, `${e.min}' · ${MOM[k].n}`, { bonus, opp: nat ? null : fxt.opp, nat });
        const r = G.applyMoment(M, k, res);
        r.lines.forEach(l => put(e.min, l.s, l.c || '', l.c === 'g' || l.c === 'b' ? 'ball' : ''));
        if (M.usG > g0) { mark(e.min, 'g me'); bump(); if (sim && !AUTO) sfx.goal(); }
        if (M.oppG > o0) { mark(e.min, 'b'); bump(); if (!AUTO) sfx.conceded(); }
        if (res.out === 'faul' && !AUTO) sfx.card();
        upd(e.min); await wait(680);
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
  const rep = G.postMatch(M), win = M.usG > M.oppG || pens === true;
  if (!AUTO && fxt.final && win) sfx.trophy();
  await dialog({
    art: `<div class="art res ${win ? 't-club' : M.usG < M.oppG || pens === false ? 't-risk' : 't-life'}"><div class="art-av">${avatar(s.look, nat ? '#d81e2c' : G.club(s.clubId).c1, nat ? '#f2f2f2' : G.club(s.clubId).c2)}</div><div class="rate ${rep.rt >= 7 ? 'hi' : rep.rt < 6 ? 'lo' : ''}"><b>${dec(rep.rt, 1)}</b><small>MAÇ NOTU</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? ' (pen.)' : ''}`,
    body: `<div class="stts"><div class="stt">${ic('ball', 18)}<b>${M.pg}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${M.pa}</b><small>Asist</small></div><div class="stt">${ic('target', 18)}<b>${M.ok}/${M.mom}</b><small>An</small></div></div>${chips(rep.lines)}`,
    opts: [{ t: 'Devam' }], auto: 0,
  });
  if (nat) return null;
  return fxt.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.pg };
}

async function seasonFlow() {
  const s = G.S, r = G.seasonEnd(); G.save();
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
    const ev = pickEvent(); if (ev) await runEvent(ev);
    if (s.over) { await retireFlow(s.over); return; }
    const nf = G.natFixture();
    if (nf) {
      const j = await dialog({ art: art('fed', 'flag', 'fame'), k: 'Milli takım', t: `${nf.usN} kadrosundasın`, body: `<p>Rakip: <b>${esc(nf.opp.n)}</b></p>`, opts: [{ t: 'Maça çık', i: 'ball' }, { t: 'Simüle et', c: 'ghost' }] });
      await runMatch(nf, s.car.caps > 3 || nf.lvl === 'U21' ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
    }
    const rl = G.role(), can = (rl === '11' || rl === 'yedek') && !s.fl.skip;
    const pre = async f => {
      const j = await dialog({
        art: clubArt(f.opp, `${f.cup ? f.name + ' · ' + f.round : LMAP[f.lid].name} · ${f.final ? 'tarafsız saha' : f.home ? 'iç saha' : 'deplasman'}`), k: 'Maç günü',
        body: `<div class="tgrid"><div>${ic('shirt', 16)}<small>Görevin</small><b>${ROLE[rl]}</b></div><div>${ic('bolt', 16)}<small>Enerji</small><b>${Math.round(s.en)}</b></div><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div></div>${s.en < 35 ? `<p class="warn">${ic('alert', 16)} Enerjin düşük: anlar zorlaşır, sakatlık riski artar.</p>` : ''}`,
        opts: [{ t: 'Maça çık', s: 'Kilit anları sen oynarsın', i: 'ball' }, { t: 'Simüle et', c: 'ghost' }],
      });
      return runMatch(f, rl, j === 0 ? 'play' : 'sim');
    };
    const cf = G.cupFixture(); let ownCup = null;
    if (cf && can) ownCup = await pre(cf);
    const fxt = G.fixture(); let own = null;
    if (fxt) {
      if (can && G.S.inj <= 0) own = await pre(fxt);
      else if (rl === 'yok') { s.bench++; G.fx({ mo: -3 }); toast('Kadroya alınmadın.', 'x'); }
    }
    const r = G.endWeek(own, ownCup); G.save();
    if (s.week === 20) await transferWindow('kis');
    if (r.over) await seasonFlow();
    if (G.S) G.save();
  } finally {
    busy = false; sfx.ambOff();
    if (G.S) { V.scr = 'hub'; V.tab = 'ev'; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}

// ---------- olaylar ----------
const ACT = {
  dlg: v => { $modal.hidden = true; const r = dres; dres = null; if (r) r(+v); },
  snd: () => { sfx.toggle(); render(); },
  cont: () => { if (G.load()) { V.scr = 'hub'; V.tab = 'ev'; render(); } },
  title: () => { V.scr = 'title'; render(); },
  menu: () => { G.save(); V.scr = 'title'; render(); },
  new: async () => {
    if (G.hasSave()) { const j = await dialog({ k: 'Dikkat', t: 'Mevcut kariyer silinecek', body: '<p>Yeni kariyer başlatırsan kayıtlı kariyerin kalıcı olarak silinir.</p>', opts: [{ t: 'Sil ve yeni başla', i: 'alert' }, { t: 'Vazgeç', c: 'ghost' }] }); if (j !== 0) return; }
    const m = G.meta();
    C = { name: m.heir ? ' ' + m.heir : '', pos: 'FV', foot: 'Sağ', prov: 'Sakarya', origin: 'mahalle', trait: 'hirsli', look: { skin: 1, hair: 0, hc: 0 } };
    V.scr = 'create'; render(); window.scrollTo(0, 0);
  },
  set: v => { const [k, x] = v.split(':'); const nm = $('#nm'); if (nm) C.name = nm.value; C[k] = x; render(); },
  look: v => { const [k, x] = v.split(':'); const nm = $('#nm'); if (nm) C.name = nm.value; C.look[k] = +x; render(); },
  start: () => {
    C.name = ($('#nm').value || '').trim().replace(/\s+/g, ' ');
    if (C.name.length < 3) { toast('Oyuncuna bir ad ver.', 'alert'); $('#nm').focus(); return; }
    G.wipe(); G.newCareer(C); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb' }; sfx.whistle(1); render(); window.scrollTo(0, 0);
  },
  tab: v => { V.tab = v; render(); window.scrollTo(0, 0); },
  lv: v => { V.lv = v; render(); },
  tstat: v => { const ch = G.setStatus(v); if (ch.length) { sfx.bad(); toast(ch.join(' · '), 'alert'); } G.save(); render(); },
  act: async v => {
    if (busy || G.S.used >= G.slots()) return;
    if (v === 'train') { busy = true; try { await trainFlow(); } finally { busy = false; } return; }
    const [txt, ch] = G.act(v); if (v === 'job') sfx.coin(); toast(txt + (ch.length ? ' ' + ch.join(' · ') : ''), 'check'); G.save(); render();
  },
  go: () => nextStep(),
  buy: v => { const had = G.has(v); G.buy(v); if (!had && G.has(v)) sfx.coin(); G.save(); render(); },
  send: () => { const a = G.nice(Math.max(1000, G.S.con.wage)); const ch = G.fx({ para: -a, aile: 12 }); toast(ch.join(' · '), 'heart'); G.save(); render(); },
};
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const f = ACT[t.dataset.a]; if (!f) return; if (t.dataset.a !== 'dlg') sfx.click(); f(t.dataset.v, t); });
document.addEventListener('change', e => {
  const t = e.target.closest('[data-c]'); if (!t) return;
  if (t.dataset.c === 'prov') C.prov = t.value;
  if (t.dataset.c === 'lig') { V.lig = t.value; render(); }
});

// Geliştirici aracı: n haftayı rastgele kararlarla hızlı oynatır.
window.__ts = { G, auto: async n => { AUTO = true; try { for (let i = 0; i < n && G.S; i++) { while (G.S.used < G.slots() && Math.random() < .8) { if (Math.random() < .5 && G.S.inj <= 0) await trainFlow(); else G.act(G.pick(['rest', 'aile', 'ark', 'rest'])); } if (Math.random() < .05) G.setStatus(G.pick(['mutlu', 'acik', 'kiralik'])); await nextStep(); } } finally { AUTO = false; busy = false; render(); } } };

render();
