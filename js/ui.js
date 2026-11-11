// Toprak Saha — arayüz ve oyun akışı
import { tt, lang, LC, NLOC, DSEP, LANGS, setLang } from './i18n.js';
import * as G from './core.js';
import { LEAGUES, LMAP, POS, ATTR, ORIGINS, TRAITS, PROV, SHOP, TRAIN, COUNTRIES, ROLE, MOM, TSTAT, STANCE, PERKS, HANG, POSTS, ACH, DEC, HT, BUILD, STYLES, CELE, NET, MACT, DIFF, TACT, PERKS2, FREE, NATN, NATC, WX, INV } from './data.js';
import { pickEvent, resolve } from './events.js';
import { Mini, Pitch, PSLOT } from './mini.js';
import { ic, avatar, persona, crestSvg, radar, ring, PERS, SKIN, HAIRC, HAIRS, euLogo } from './art.js';
import { sfx, spiker } from './sfx.js';

const app = document.getElementById('app'), $modal = document.getElementById('modal'), $mini = document.getElementById('mini'), $toast = document.getElementById('toast');
const $ = s => document.querySelector(s);
let cardData = null, heirW = null;
let V = { scr: 'title', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'cev', kv: 'pro' }, mSim = false, curM = null, C = null, busy = false, mini = null, dres = null, AUTO = false, endHTML = '';
const sleep = ms => new Promise(r => setTimeout(r, AUTO ? 0 : ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => Math.round(n).toLocaleString(NLOC);
const dec = (n, d = 2) => n.toFixed(d).replace('.', DSEP);
const lgHead = () => ['O', 'G', 'B', 'M', 'AV', 'P'].map(x => tt`<th>${tt(x, 'lig')}</th>`).join('');   // puan tablosu başlıkları

// ---------- küçük parçalar ----------
const crest = (id, s) => { const c = G.club(id); return crestSvg(c.n, c.c1, c.c2, s); };
const me = (cls = '') => { const s = G.S, c = G.club(s.clubId); return tt`<div class="avw ${cls}">${avatar(s.look, c.c1, c.c2)}</div>`; };
const bar = (v, cls = '') => `<div class="bar ${cls}"><i style="width:${G.clamp(v, 0, 100)}%"></i></div>`;
const chips = a => a && a.length ? tt`<div class="chg">${a.map(x => tt`<span class="${x.includes('−') ? 'neg' : 'pos'}">${esc(x)}</span>`).join('')}</div>` : '';
const tag = (s, cls = '') => tt`<span class="tagk ${cls}">${esc(s)}</span>`;
const stars = n => tt`<span class="strs">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
const euCls = f => (f && f.eu ? ' eu-' + f.eu : '');
const cl = (id, inner, cls = '') => tt`<button class="cl ${cls}" data-a="club" data-v="${id}">${inner}</button>`;   // tıklanınca kulüp profili
function toast(s, icon = 'check') { $toast.innerHTML = ic(icon, 18) + tt`<span>${esc(s)}</span>`; $toast.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => $toast.classList.remove('on'), 2800); }

function dialog({ art = '', k = '', t = '', body = '', opts, auto, cls = '' }) {
  if (AUTO) { const en = opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return Promise.resolve(auto != null ? auto : en[Math.floor(Math.random() * en.length)]); }
  return new Promise(res => {
    dres = res; sfx.pop();
    $modal.innerHTML = tt`<div class="sheet ${cls}">${art}<div class="sh-in">${k ? tag(k) : ''}${t ? tt`<h3>${esc(t)}</h3>` : ''}<div class="mbody">${body}</div>
      <div class="opts">${opts.map((o, i) => tt`<button class="opt ${o.c || ''}" data-a="dlg" data-v="${i}" ${o.dis ? 'disabled' : ''}>${o.i ? ic(o.i, 20) : ''}<span><b>${esc(o.t)}</b>${o.s ? tt`<small>${esc(o.s)}</small>` : ''}</span></button>`).join('')}</div></div></div>`;
    $modal.hidden = false; $modal.scrollTop = 0;
  });
}
const info = (t, text, k = '', art = '') => dialog({ art, k, t, body: tt`<p>${esc(text)}</p>`, opts: [{ t: tt('Tamam') }], auto: 0 });

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
  kas: ['doktor', 'clock', 'med'], kronik: ['doktor', 'plus', 'med'], kap_prim: ['baskan', 'coin', 'club'], kap_kavga: ['takim', 'alert', 'risk'], kap_genc: ['takim', 'users', 'club'], kap_ceza: ['takim', 'clock', 'club'], kap_al: ['hoca', 'crown', 'risk'],
  net_abi: ['baskan', 'home', 'life'], net_yildiz: ['rakip', 'star', 'fame'], net_gazeteci: ['basin', 'mic', 'fame'], net_doktor: ['doktor', 'plus', 'med'], net_scout: ['scout', 'eye', 'fame'], net_marka: ['sponsor', 'tag', 'fame'], net_golge: ['golge', 'lock', 'risk'],
};
function art(p, icon, tn) {
  const s = G.S, name = p === 'rakip' ? s.rival.n : p === 'par' && s.fl.evli ? tt('Eşin') : PERS[p].n;
  return tt`<div class="art t-${tn}"><div class="art-ic">${ic(icon, 150)}</div><div class="art-av">${persona(p, G.club(s.clubId), G.KW)}</div><span class="art-n">${esc(name)}</span></div>`;
}
const evArt = id => art(...(EV[id] || ['ark', 'news', 'life']));
function clubArt(id, sub = '') { const c = G.club(id); return tt`<div class="art club" style="--c1:${c.c1};--c2:${c.c2}"><div class="art-cr">${crest(id, 86)}</div><div class="art-t"><b>${esc(c.n)}</b><small>${esc(sub)}</small></div></div>`; }

// ---------- öğretici: her ipucu bir kez gösterilir ----------
const OKEY = 'toprak-saha-ogr'; let seen = {};
try { seen = JSON.parse(localStorage.getItem(OKEY)) || {}; } catch (e) { /* yok */ }
const TIPS = {
  hub: [['cal', tt('Haftan böyle işler'), tt('Her hafta birkaç eylem hakkın var: antrenman, dinlenme, aile, arkadaşlar. Hakların bitince ya da istediğin an "Maç günü"ne bas.')], ['bolt', tt('Dört gösterge'), tt('Enerji düşükse maç zorlaşır, sakatlık riski artar. Moral, hoca güveni ve taraftar sevgisi forma şansını ve teklifleri belirler.')], ['target', tt('Hedeflerin'), tt('Ana sayfada sezon hedefin, mevki rakibin ve hocanın sistemi görünür. Kulübe ya da takıma dokunursan profili açılır.')]],
  mac: [['ball', tt('Maç anları'), tt('Maçın tamamını değil, sana gelen kilit anları oynarsın: şut, pas, çalım, müdahale. Her an başlamadan önce nasıl oynanacağı ekranda yazar.')], ['whistle', tt('Hocanın görevleri'), tt('Soyunma odasında verilen görevler üstte durur ve tamamlandıkça işaretlenir. Görev, hoca güveni demek.')], ['bolt', tt('Enerji ve oyun tarzı'), tt('Ofansif oynarsan daha çok pozisyon bulursun ama enerjin hızlı biter. "Topu iste" fazladan bir an getirir. İstersen "Kalanı simüle et".')]],
  transfer: [['swap', tt('Transfer masası'), tt('Her teklifte kulübünle yan yana karşılaştırma görürsün: forma şansı, ücret, tesis, taktik uyumu, gelişim hızı. Yeşil artı, kırmızı eksi.')]],
};
async function tip(key, force) {
  if (AUTO || (seen[key] && !force)) return;
  seen[key] = 1; try { localStorage.setItem(OKEY, JSON.stringify(seen)); } catch (e) { /* yok */ }
  const T = TIPS[key];
  for (let i = 0; i < T.length; i++) await dialog({ art: tt`<div class="art t-med"><div class="art-ic">${ic(T[i][0], 150)}</div><span class="art-n">Rehber ${i + 1}/${T.length}</span></div>`, t: T[i][1], body: tt`<p>${T[i][2]}</p>`, opts: [{ t: i < T.length - 1 ? tt('Devam') : tt('Anladım'), i: 'right' }], cls: 'ev' });
}

// ---------- paylaşım kartı: sonucu görsel olarak dışa verir ----------
function drawCard(o) {
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const g = cv.getContext('2d'), F = (w, sz) => `${w} ${sz}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
  g.fillStyle = '#0f0d0b'; g.fillRect(0, 0, 1080, 1350);
  g.save(); g.translate(540, 420); g.rotate(-.14); g.fillStyle = o.c1; g.fillRect(-900, -330, 1800, 660); g.fillStyle = 'rgba(0,0,0,.14)'; for (let x = -900; x < 900; x += 56) g.fillRect(x, -330, 28, 660); g.restore();
  g.fillStyle = 'rgba(15,13,11,.82)'; g.fillRect(0, 700, 1080, 650);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = F(900, 44); const tw = g.measureText(o.tag).width; g.fillStyle = '#ffd23f'; g.fillRect(70, 84, tw + 44, 66); g.fillStyle = '#14110e'; g.fillText(o.tag, 92, 134);
  g.fillStyle = '#fff'; g.font = F(900, 300); g.fillText(o.big, 64, 560); g.font = F(900, 60); g.fillText(o.bigL, 76, 640);
  g.font = F(900, 96); let y = 830; for (const ln of o.title) { g.fillStyle = '#f5efe4'; g.fillText(ln, 70, y, 940); y += 96; }
  g.font = '500 40px Barlow, system-ui, sans-serif'; g.fillStyle = '#a79b8e'; g.fillText(o.sub, 72, y + 4, 940);
  const n = o.stats.length, w = 940 / n; o.stats.forEach(([v, l], i) => { const x = 70 + i * w; g.fillStyle = '#231e19'; g.fillRect(x, 1090, w - 16, 150); g.fillStyle = '#ffd23f'; g.font = F(900, 78); g.fillText(String(v), x + 22, 1172); g.fillStyle = '#a79b8e'; g.font = '600 28px Barlow, system-ui, sans-serif'; g.fillText(l, x + 24, 1218); });
  g.fillStyle = o.c1; g.font = F(900, 46); g.fillText('TOPRAK SAHA', 70, 1310);
  return cv;
}
async function shareCard(o) {
  const cv = drawCard(o), blob = await new Promise(r => cv.toBlob(r, 'image/png')); if (!blob) return;
  try {
    const file = new File([blob], 'toprak-saha.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: o.text || 'Toprak Saha' }); return; }
  } catch (e) { return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'toprak-saha.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast(tt('Kart indirildi'), 'down');
}

// ---------- aktarım kodu: kaydı başka cihaza metin olarak taşır ----------
async function packSave() {
  const txt = G.exportData();
  if ('CompressionStream' in window) { const buf = new Uint8Array(await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); let b = ''; for (let i = 0; i < buf.length; i += 0x8000) b += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return 'TS1.' + btoa(b); }
  return 'TS0.' + btoa(unescape(encodeURIComponent(txt)));
}
async function unpackSave(code) {
  code = code.replace(/\s+/g, ''); const bin = atob(code.slice(4));
  if (code.startsWith('TS1.')) return new Response(new Blob([Uint8Array.from(bin, c => c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  if (code.startsWith('TS0.')) return decodeURIComponent(escape(bin));
  throw new Error('kod');
}

// ---------- tema: vurgu rengi kulübünden gelir ya da elle seçilir ----------
const TKEY = 'toprak-saha-tema', THEMES = [['kulup', tt('Kulüp'), null], ['toprak', tt('Toprak'), '#ff6a2b'], ['cim', tt('Çim'), '#2fbf71'], ['gece', tt('Gece'), '#58a6ff'], ['ates', tt('Ateş'), '#ff4d4d'], ['altin', tt('Altın'), '#ffd23f']];
const lum = h => { const n = parseInt((h || '#000000').slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
// ---------- dil: seçim js/i18n.js içinde saklanır, değişince sayfa yenilenir ----------
const LDON = 'toprak-saha-dil-don';
const langBtns = (short) => LANGS.map(([k, n, s]) => tt`<button class="${lang === k ? 'on' : ''}" data-a="lang" data-v="${k}" aria-label="${n}">${short ? s : n}</button>`).join('');
function theme() { try { return localStorage.getItem(TKEY) || 'kulup'; } catch (e) { return 'kulup'; } }
function applyTheme() {
  let c = (THEMES.find(x => x[0] === theme()) || THEMES[0])[2];
  if (!c) { c = '#ff6a2b'; if (G.S) { const cl = G.club(G.S.clubId); c = lum(cl.c1) > .06 ? cl.c1 : lum(cl.c2) > .06 ? cl.c2 : c; } }   // çok koyu kulüp rengi koyu zeminde kaybolur
  const r = document.documentElement.style; r.setProperty('--or', c); r.setProperty('--on', lum(c) > .4 ? '#14110e' : '#fff');
}

// ---------- başlık ve oyuncu yaratma ----------
const SQUAD = [[{ skin: 2, hair: 6, hc: 1, beard: 2 }, '#12265e', '#ffd21a', 4], [{ skin: 3, hair: 5, hc: 0, beard: 1 }, '#d81e2c', '#ffd21a', 10], [{ skin: 1, hair: 2, hc: 0, band: 1 }, '#0f8a4b', '#161616', 9], [{ skin: 0, hair: 1, hc: 2 }, '#f47b20', '#12265e', 7], [{ skin: 1, hair: 3, hc: 1, beard: 1 }, '#f2f2f2', '#161616', 1]];
function vTitle() {
  const m = G.meta();
  return tt`<div class="title">
    <div class="t-lines"></div>
    <div class="t-squad">${SQUAD.map(([l, a, b, n], i) => tt`<div class="tsq s${i}">${avatar(l, a, b, { num: n })}</div>`).join('')}</div>
    <h1>TOPRAK<br><span>SAHA</span></h1>
    <p class="tag">2. Amatör'den dünya sahnesine.</p>
    <div class="tbtns">
      ${G.hasSave() ? tt`<button class="cta" data-a="cont">Devam et ${ic('right', 22)}</button>` : ''}
      <button class="cta ${G.hasSave() ? 'ghost' : ''}" data-a="new">Yeni kariyer</button>
    </div>
    ${m.n ? tt`<p class="meta">${ic('trophy', 16)} ${m.n} kariyer · en iyi ${num(m.best || 0)} puan${m.leg ? tt` · miras +${m.leg}` : ''}</p>` : ''}
    <button class="cta ghost chb" data-a="chal">${ic('bolt', 20)} Haftanın meydan okuması</button>
    <div class="tlinks"><label class="link imp">Kayıt dosyası yükle<input type="file" accept=".json,application/json" data-c="imp" hidden></label><button class="link" data-a="kod">Kodla yükle</button></div>
    <button class="icb snd" data-a="snd" aria-label="Ses">${ic(sfx.on ? 'vol' : 'mute', 22)}</button>
    <div class="tlang">${langBtns(1)}</div>
  </div>`;
}

// Kariyer türü kartları: [tür, ad, kısa bilgi, portre]
const KTYPE = [['e', tt('Erkekler'), tt('8 kademe · 3 Avrupa kupası'), { skin: 1, hair: 0, hc: 0, beard: 1 }], ['k', tt('Kadınlar'), tt('4 kademe · 2 Avrupa kupası'), { skin: 1, hair: 8, hc: 1 }]];
const OIC = { mahalle: 'home', okul: 'book', altyapi: 'shield', gurbet: 'globe' }, TIC = { hirsli: 'bolt', sakin: 'target', asi: 'alert', lider: 'crown' };
function vCreate() {
  const chip = (k, v, l) => tt`<button class="chip ${C[k] === v ? 'on' : ''}" data-a="set" data-v="${k}:${v}">${l}</button>`;
  const card = (k, v, o, i) => tt`<button class="pickc ${C[k] === v ? 'on' : ''}" data-a="set" data-v="${k}:${v}"><span class="pic">${ic(i, 22)}</span><span><b>${o.n}</b><small>${o.d}</small></span></button>`;
  const sw = (k, arr) => tt`<div class="sws">${arr.map((c, i) => `<button class="swc ${C.look[k] === i ? 'on' : ''}" style="background:${c}" data-a="look" data-v="${k}:${i}" aria-label="${k} ${i + 1}"></button>`).join('')}</div>`;
  return tt`<div class="create">
    ${tag(tt('Yeni kariyer'))}<h2>Oyuncunu yarat</h2>
    ${C.world ? '' : tt`<div class="ktg">${KTYPE.map(([k, n, d, l]) => tt`<button class="ktc ${(C.w || 'e') === k ? 'on' : ''}" data-a="set" data-v="w:${k}"><span class="avw">${avatar(l, '#ff6a2b', '#14110e')}</span><span><b>${n}</b><small>${d}</small></span></button>`).join('')}</div>`}
    <div class="mk">
      <div class="mk-av">${avatar(C.look, '#ff6a2b', '#14110e', { num: C.num })}</div>
      <div class="mk-ctl"><small>Ten</small>${sw('skin', SKIN)}<small>Saç rengi</small>${sw('hc', HAIRC)}
        <div class="chips"><button class="chip" data-a="look" data-v="hair:${(C.look.hair + 1) % HAIRS}">${ic('swap', 16)} Saç</button>
        ${C.w === 'k' ? '' : tt`<button class="chip ${C.look.beard ? 'on' : ''}" data-a="look" data-v="beard:${((C.look.beard || 0) + 1) % 3}">Sakal</button>`}
        <button class="chip ${C.look.band ? 'on' : ''}" data-a="look" data-v="band:${C.look.band ? 0 : 1}">Bant</button></div></div>
    </div>
    <label class="fld"><span>Ad Soyad</span><input id="nm" maxlength="24" value="${esc(C.name)}" placeholder="${C.w === 'k' ? tt('Örn. Elif Sakarya') : tt('Örn. Emre Sakarya')}" autocomplete="off"></label>
    <div class="fld"><span>Mevki</span><div class="chips">${Object.keys(POS).map(p => chip('pos', p, POS[p].n)).join('')}</div></div>
    <div class="fld"><span>Ayak</span><div class="chips">${['Sağ', 'Sol', 'Çift'].map(f => chip('foot', f, f)).join('')}</div></div>
    <div class="fld two"><label><span>Forma no</span><input id="nu" type="number" min="1" max="99" value="${C.num}" inputmode="numeric"></label><label><span>Lakap (isteğe bağlı)</span><input id="nk" maxlength="18" value="${esc(C.nick)}" placeholder="Örn. Adapazarı Ekspresi" autocomplete="off"></label></div>
    <div class="fld"><span>Boy</span><div class="chips">${Object.keys(HT).map(k => chip('ht', k, HT[k].n)).join('')}</div></div>
    <div class="fld"><span>Yapı</span><div class="chips">${Object.keys(BUILD).map(k => chip('build', k, BUILD[k].n)).join('')}</div></div>
    <div class="fld"><span>Oyun stili</span><div class="chips">${STYLES[C.pos].map((x, i) => chip('style', String(i), x.n)).join('')}</div></div>
    <div class="fld"><span>Gol sevinci</span><div class="chips">${Object.keys(CELE).map(k => chip('cele', k, CELE[k][0])).join('')}</div></div>
    <div class="fld"><span>Zorluk</span><div class="chips">${Object.keys(DIFF).map(k => chip('diff', k, DIFF[k][0])).join('')}</div></div>
    <label class="fld" ${C.world ? 'hidden' : ''}><span>Memleket</span><select data-c="prov">${Object.keys(PROV).map(p => tt`<option ${C.prov === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <div class="fld"><span>Köken</span>${Object.keys(ORIGINS).map(k => card('origin', k, ORIGINS[k], OIC[k])).join('')}</div>
    ${C.origin === 'gurbet' ? tt`<div class="fld"><span>Doğduğun ülke</span><div class="chips">${Object.keys(NATN).filter(k => k !== 'TR').map(k => chip('gur', k, NATN[k])).join('')}</div></div>` : ''}
    ${C.world ? tt`<p class="note">${ic('home', 14)} ${esc(C.world.name)} soyadını taşıyorsun. Aynı dünyada, aynı kulüplerle başlıyorsun; ${esc(C.world.prov)} amatör ligleri seni bekliyor.</p>` : ''}
    <div class="fld"><span>Karakter</span>${Object.keys(TRAITS).map(k => card('trait', k, TRAITS[k], TIC[k])).join('')}</div>
    <button class="cta" data-a="start">Deneme antrenmanlarına çık ${ic('right', 22)}</button>
    <p class="mut sm">Kulübünü kendin bulacaksın: deneme, teklif, pazarlık.</p>
    <button class="link" data-a="title">Geri</button>
  </div>`;
}

// Sıradaki kupa maçları (ülke kupası, Avrupa, tek maçlık kupalar)
function sideNext(cf) {
  const s = G.S, out = [['cup', G.cupNext('cup'), s.cup.name], ...G.EUK.map(k => [k, G.euroNext(k), s[k].name]), ...G.xcNext().map(x => ['xc', { round: 'Final', week: x.week, opp: x.opp }, x.name])];
  return out.filter(x => x[1] && !(cf && cf.name === x[2])).map(([k, n, name]) => [{ name }, n, k]);
}
// endWeek'e gidecek üçlü: [kupa, Avrupa, tek maçlık kupa]
const sideArgs = (cf, r) => [cf && cf.key === 'cup' ? r : null, cf && cf.eu ? r : null, cf && cf.key === 'xc' ? r : null];

// ---------- merkez ----------
function head() {
  const s = G.S, c = G.club(s.clubId), L = LMAP[G.leagueOf(s.clubId)];
  return tt`<header class="top">${crest(s.clubId, 40)}
    <div class="tc"><b>${esc(c.n)}</b><small>${L.name} · Hafta ${s.week}/${G.WEEKS}${s.loan ? tt(' · kiralık') : ''}</small></div>
    <span class="pill">${ic('coin', 16)}${G.fmtS(s.mgr ? s.mgr.bud : s.money)}</span>
    <button class="icb" data-a="snd" aria-label="Ses">${ic(sfx.on ? 'vol' : 'mute', 20)}</button></header>`;
}
function roleText() {
  const s = G.S, r = G.role();
  if (r === 'sakat') return tt`Sakat · ${s.inj} hafta`;
  if (r === 'ceza') return tt`${s.banR || tt('Cezalı')} · ${s.ban} hafta`;
  return ROLE[r];
}
const formChips = () => { const r = G.S.lastR; return r.length ? r.map(x => tt`<i class="${x >= 7.5 ? 'hi' : x < 6 ? 'lo' : ''}">${dec(x, 1)}</i>`).join('') : tt('<em>henüz maç yok</em>'); };

function hero(big) {
  const s = G.S, c = G.club(s.clubId), nm = s.name.split(' ');
  return tt`<section class="hero ${big ? 'big' : ''}" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="hero-l">
      <div class="ovr"><b>${G.OVR()}</b><span>${s.pos}</span><span class="no">${s.num}</span></div>
      <h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2>
      <small>${s.age} yaş · ${G.fmtS(G.value())}${s.fl.kaptan ? tt(' · kaptan') : ''}${G.youngRule() ? tt(' · yaşı küçük statüsü') : ''}${s.adapt > 0 ? tt` · uyum ${s.adapt} hf` : ''}</small>
      <div class="form">${formChips()}</div>
    </div>
    <div class="hero-r">${avatar(s.look, c.c1, c.c2, { num: s.num })}<span class="hero-cr">${crest(s.clubId, 34)}</span></div>
  </section>`;
}
const gauge = (v, icon, l, cls = '') => tt`<div class="gg ${cls}">${ring(v, icon)}<b>${Math.round(v)}</b><small>${l}</small></div>`;

function fixCard(f, cupF) {
  const s = G.S, r = s.mgr ? '11' : G.role(), o = G.club(f.opp), u = G.club(s.clubId), a = s.rt[s.clubId], b = s.rt[f.opp];
  return tt`<section class="vsc ${cupF ? 'cup' : ''}${euCls(f)}">
    <div class="vs-h"><span>${f.eu ? tt`<span class="eut">${euLogo(f.eu, 24)}${esc(f.name)} · ${f.round}</span>` : tag(cupF ? `${f.name} · ${f.round}` : LMAP[f.lid].name, cupF ? 'ye' : '')}${G.isDerby(s.clubId, f.opp) ? ' ' + tag(tt('Derbi'), 'ye') : ''}</span><span class="where">${ic(f.final ? 'trophy' : f.home ? 'home' : 'right', 14)}${f.final ? tt('Tarafsız saha') : f.home ? tt('İç saha') : tt('Deplasman')}</span></div>
    <div class="vs3">${cl(s.clubId, tt`${crest(s.clubId, 52)}<b>${esc(u.n)}</b>`, 'side')}<div class="mid"><b>VS</b></div>${cl(f.opp, tt`${crest(f.opp, 52)}<b>${esc(o.n)}</b>`, 'side')}</div>
    <div class="pw"><i style="width:${(a / (a + b) * 100).toFixed(1)}%"></i></div>
    <div class="pwl"><span>${Math.round(a)}</span><span class="rolep ${r}">${s.mgr ? TACT[G.coach().st].n : roleText()}</span><span>${Math.round(b)}</span></div>
    ${f.agg ? tt`<div class="aggb">${ic('swap', 14)}İlk maç ${f.agg[0]}-${f.agg[1]} · tur için toplam skor geçerli</div>` : f.leg === 1 ? tt`<div class="aggb">${ic('swap', 14)}Çift maçlı tur: rövanş ${f.home ? tt('deplasmanda') : tt('evinizde')}</div>` : ''}
  </section>`;
}

function actions() {
  const s = G.S, a = [], inj = s.inj > 0;
  a.push({ id: 'train', n: tt('Antrenman'), i: 'train', e: [['bolt', '−10', 0]], dis: inj });
  a.push({ id: 'rest', n: tt('Dinlen'), i: 'bed', e: [['bolt', '+20', 1]] });
  a.push({ id: 'aile', n: tt('Aile'), i: 'home', e: [['heart', '+9', 1]] });
  a.push({ id: 'ark', n: tt('Arkadaşlar'), i: 'users', e: [['smile', '+5', 1], ['bolt', '−4', 0]] });
  if (s.rel.par != null) a.push({ id: 'par', n: s.fl.evli ? tt('Eşin') : tt('Sevgilin'), i: 'heart', e: [['heart', '+11', 1]] });
  if (s.con.wage < 20000 && !s.job) a.push({ id: 'job', n: tt('Ek iş'), i: 'briefcase', e: [['coin', '+' + G.fmtS(2000).replace(G.curSym(), ''), 1], ['bolt', '−12', 0]], dis: inj });
  if (s.fl.okul) a.push({ id: 'okul', n: tt('Ders'), i: 'book', e: [['book', '+5', 1]] });
  a.push({ id: 'sosyal', n: tt('Paylaşım'), i: 'phone', e: [['users', '+', 1]] });
  if (s.dil < 100 && (s.rep >= 25 || s.fl.dilBar)) a.push({ id: 'dil', n: tt('Dil kursu'), i: 'globe', e: [['coin', '−' + G.fmtS(3000).replace(G.curSym(), ''), 0]], dis: s.money < 3000 });
  if (inj) a.push({ id: 'rehab', n: tt('Rehabilitasyon'), i: 'heart', e: [['plus', tt('−1 hf'), 1]], dis: !!s.fl.rehabw });
  if (inj) { const c = G.fizyoCost(); a.push({ id: 'fizyo', n: tt('Fizyoterapi'), i: 'plus', e: [['coin', '−' + G.fmtS(c).replace(G.curSym(), ''), 0]], dis: s.money < c }); }
  return a;
}

function vHome() {
  const s = G.S, fxt = G.fixture(), cf = G.sideFixture(), left = G.slots() - s.used, co = G.coach(), fit = G.tacFit(), rv = G.rivalInfo(), gp = G.goalProg();
  const nx = sideNext(cf);
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const acts = actions().map(a => tt`<button class="act" data-a="act" data-v="${a.id}" ${a.dis || left <= 0 ? 'disabled' : ''}><span class="aic">${ic(a.i, 24)}</span><b>${a.n}</b><span class="efx">${a.e.map(([i, t, g]) => tt`<i class="${g ? 'pos' : 'neg'}">${ic(i, 12)}${t}</i>`).join('')}</span></button>`).join('');
  const news = s.news.slice(0, 4).map(n => tt`<li><span class="nic">${ic(n.ic || 'news', 18)}</span><div>${esc(n.s)}<small>${n.w}</small></div></li>`).join('');
  const play = (fxt || cf) && G.canPlay() && !s.fl.skip;
  return tt`${hero()}
    <section class="gauges">${gauge(s.en, 'bolt', tt('Enerji'), s.en < 35 ? 'low' : 'en')}${gauge(s.mo, 'smile', tt('Moral'), 'mo')}${gauge(s.rel.hoca, 'whistle', tt('Hoca'), 'ho')}${gauge(s.rel.taraf, 'users', tt('Taraftar'), 'ta')}</section>
    ${s.quest ? tt`<div class="quest ${s.quest.p >= s.quest.n ? 'ok' : ''}">${ic(s.quest.p >= s.quest.n ? 'check' : 'target', 18)}<span>Haftanın görevi: ${s.quest.t}</span><b>${Math.min(s.quest.p, s.quest.n)}/${s.quest.n}</b></div>` : ''}
    ${cf ? fixCard(cf, true) : ''}
    ${fxt ? fixCard(fxt) : cf ? '' : tt`<section class="vsc off">${ic('cal', 26)}<div><b>Maçsız hafta</b><small>${s.inj > 0 || s.ban > 0 ? roleText() : tt('Bir eylem hakkın fazla.')}</small></div></section>`}
    ${nx.map(([c, n, k]) => tt`<div class="cupn${k === 'cup' || k === 'xc' ? '' : ' eu-' + k}">${k === 'cup' || k === 'xc' ? ic('trophy', 16) : euLogo(k, 18)}<span>${esc(c.name)} · ${n.round} · ${n.week}. hafta · ${esc(G.club(n.opp).n)}</span></div>`).join('')}
    ${cl(s.clubId, tt`${ic('whistle', 18)}<span><b>${esc(co.n)}</b> · ${TACT[co.st].n}</span><em class="${fit >= 60 ? 'hi' : fit < 40 ? 'lo' : ''}">uyum %${fit}</em>`, 'coachs')}
    ${rv ? tt`<div class="coachs rvs">${ic('users', 18)}<span>Mevki rakibin <b>${esc(rv.n)}</b>${rv.inj ? tt` · sakat, ${rv.inj} hf` : ''}</span><em class="${rv.ahead ? 'hi' : 'lo'}">sen ${rv.me} · o ${rv.ovr}</em></div>` : ''}
    ${gp ? tt`<section class="card sgc">${tag(tt('Sezon hedefleri'))}<div class="kv">${ic('target', 16)}<span>${gp.t}</span><b>${gp.cur}/${gp.n}</b></div>${bar(gp.cur / gp.n * 100, gp.cur >= gp.n ? 'mo' : 'hot')}<div class="kv">${ic('chart', 16)}<span>Takım: en az ${gp.team}. sıra</span><b class="${gp.pos > gp.team ? 'neg' : ''}">${gp.pos}.</b></div></section>` : ''}
    <section><div class="sh"><h4>Bu hafta</h4><div class="dots">${dots}</div></div><div class="acts">${acts}</div></section>
    <section><div class="sh"><h4>Gündem</h4></div><ul class="news">${news}</ul></section>
    <div class="dock"><button class="cta" data-a="go">${play ? tt('Maç günü') : tt('Haftayı bitir')} ${ic('right', 22)}</button></div>`;
}

function transferCenter() {
  const s = G.S, st = G.stance(), end = s.year + (s.con.until - s.season);
  const watch = s.watch.slice().sort((a, b) => b.lv - a.lv).map(w => cl(w.id, tt`${crest(w.id, 30)}<div><b>${esc(G.club(w.id).n)}</b><small>${LMAP[G.leagueOf(w.id)].name} · ${G.interest(w.lv)}</small>${bar(w.lv, w.lv >= 60 ? 'hot' : 'mo')}</div>`, 'wt')).join('');
  return tt`<section class="card">${tag(tt('Transfer merkezi'))}
    <div class="tgrid">
      <div>${ic('tag', 16)}<small>Piyasa değeri</small><b>${G.fmtS(G.value())}</b></div>
      <div>${ic('lock', 16)}<small>Serbest kalma</small><b>${G.fmtS(s.con.rel || 0)}</b></div>
      <div>${ic('pen', 16)}<small>Sözleşme bitişi</small><b>${end}/${String((end + 1) % 100).padStart(2, '0')}</b></div>
      <div>${ic('coin', 16)}<small>Haftalık ücret</small><b>${s.con.wage ? G.fmtS(s.con.wage) : tt('Amatör')}</b></div>
    </div>
    <div class="stn st-${st}">${ic(st === 'kilit' ? 'lock' : st === 'liste' ? 'alert' : 'swap', 16)}Kulüp tutumu: <b>${STANCE[st]}</b>${s.loan ? tt` · asıl kulübün ${esc(G.club(s.loan.from).n)}` : ''}</div>
    <div class="seg col">${Object.keys(TSTAT).map(k => tt`<button class="${s.tstat === k ? 'on' : ''}" data-a="tstat" data-v="${k}">${TSTAT[k]}</button>`).join('')}</div>
    <div class="sub">${ic('eye', 16)}Seni izleyenler</div>
    ${watch || tt('<p class="mut sm">Henüz izleyen kulüp yok. İyi form ve menajer ilgiyi artırır.</p>')}
  </section>
  <section class="card">${tag(tt('Menajer'))}<p class="note">${s.agent ? tt`Menajerin ${esc(s.agent.n)}. Değiştirirsen ${G.fmtS(G.agentList()[0].fee)} tazminat ödersin.` : tt('Menajerin yok. Menajer teklifleri ve ücretleri yükseltir, kendini önermeni sağlar.')}</p>
    ${G.agentList().map(a => tt`<div class="shop ${a.cur ? 'has' : ''}"><span class="aic">${ic('pen', 22)}</span><div><b>${esc(a.n)}</b><small>${esc(a.d)} Pay %${Math.round(a.cut * 100)}${a.rep ? tt` · itibar ${a.rep}+` : ''}</small></div>${a.cur ? tt`<span class="own">${ic('check', 16)}</span>` : tt`<button class="mini-b" data-a="agent" data-v="${a.i}" ${a.ok && s.money >= a.fee ? '' : 'disabled'}>${a.ok ? tt('Anlaş') : tt('Kilitli')}</button>`}</div>`).join('')}</section>`;
}

function dreamCard() {
  const d = G.dreamInfo(), o = G.OVR();
  if (!d) return tt`<section class="card">${tag(tt('Hedef takım'), 'ye')}<button class="opt sm" data-a="dream">${ic('heart', 20)}<span><b>Hedef takım seç</b></span></button></section>`;
  const c = G.club(d.id);
  return tt`<section class="card">${tag(tt('Hedef takım'), 'ye')}<div class="wt">${cl(d.id, crest(d.id, 46))}<div><b>${esc(c.n)}</b><small>${LMAP[G.leagueOf(d.id)].name} · ${d.mine ? tt('Hayalindeki formayı giyiyorsun') : d.w ? G.interest(d.w.lv) : o >= d.need ? tt('Seviyen yeterli, formunu koru') : tt`Gereken güç ${d.need} · sen ${o}`}</small>${bar(d.pct, 'hot')}</div></div><button class="link sm" data-a="dream">Hedefi değiştir</button></section>`;
}
function perkCard() {
  const s = G.S, list = PERKS.filter(p => p.no !== s.pos && (!p.only || p.only === s.pos)), tier = G.perkTier();
  const pk = p => { const own = G.perk(p.id); return tt`<button class="pk ${own ? 'own' : ''}" data-a="perk" data-v="${p.id}" ${own || s.pp < p.c ? 'disabled' : ''}>${ic(p.i, 22)}<b>${p.n}</b><small>${p.d}</small><i>${own ? tt('Açık') : p.c + tt(' puan')}</i></button>`; };
  const keys = Object.keys(POS[s.pos].w), bc = G.boostCost(), mx = G.boostMax();
  return tt`<section class="card">${tag(tt('Yetenekler'))}<div class="kv">${ic('star', 16)}<span>Yetenek puanı (iyi maçlarla dolar)</span><b>${s.pp}</b></div>${bar(s.px / 8 * 100, 'hot')}
    <div class="pks">${list.map(pk).join('')}</div>
    ${tier === 1 ? tt`<p class="mut sm lockn">${ic('lock', 14)} Hepsini açınca usta yetenekleri gelir.</p>` : tt`<div class="sub">${ic('crown', 16)}Usta yetenekleri</div><div class="pks t2">${PERKS2.map(pk).join('')}</div>`}
    ${tier === 2 ? tt`<p class="mut sm lockn">${ic('lock', 14)} Usta yetenekleri tamamlanınca ustalık açılır.</p>` : ''}
    ${tier === 3 ? tt`<div class="sub">${ic('up', 16)}Ustalık · ${bc} puana +1</div><div class="chips">${keys.map(k => tt`<button class="chip sm" data-a="boost" data-v="${k}" ${s.pp < bc || s.at[k] >= mx ? 'disabled' : ''}>${ATTR[k]} ${Math.round(s.at[k])}</button>`).join('')}</div><p class="mut sm">Her üç ustalıkta bedel bir puan artar. Üst sınır ${mx}.</p>` : ''}</section>`;
}
function achCard() {
  const s = G.S;
  return tt`<section class="card">${tag(tt('Başarımlar'), 'ye')}<div class="achs">${ACH.map(([id, n, i]) => tt`<div class="ach ${s.ach[id] ? 'on' : ''}">${ic(i, 20)}<small>${n}</small></div>`).join('')}</div></section>`;
}

function vTransfer() {
  const s = G.S, I = G.clubInfo(s.clubId), left = G.slots() - s.used, can = G.canPropose() && left > 0, T = TACT[I.tac];
  const mk = G.market().map(id => { const w = s.watch.find(x => x.id === id); return tt`<div class="mkr">${cl(id, tt`${crest(id, 34)}<div><b>${esc(G.club(id).n)}</b><small>${offerSub(id)} · uyum %${G.tacFit(id)}</small></div>`, 'wt')}<button class="mini-b" data-a="prop" data-v="${id}" ${can && !w ? '' : 'disabled'}>${w ? tt('İzliyor') : tt('Öner')}</button></div>`; }).join('');
  const moves = s.moves.slice().reverse().map(m => tt`<div class="kv">${ic(m.loan ? 'clock' : 'swap', 16)}<span>${m.y} · ${esc(G.club(m.from).n)} → ${esc(G.club(m.to).n)}</span><b>${m.loan ? tt('Kiralık') : m.fee ? G.fmtS(m.fee) : tt('Bedelsiz')}</b></div>`).join('');
  return tt`${transferCenter()}
    <section class="card">${tag(tt('Kulübündeki yerin'))}
      <div class="tgrid">
        <div>${ic('pen', 16)}<small>Sözleşmedeki rol</small><b>${ROLE[s.con.role] || ROLE['11']}</b></div>
        <div>${ic('shirt', 16)}<small>Şu anki durum</small><b>${roleText()}</b></div>
        <div>${ic('target', 16)}<small>Taktik uyumu</small><b>%${I.fit}</b></div>
        <div>${ic('train', 16)}<small>Tesisler</small><b>${stars(I.fac)}</b></div>
      </div>
      <div class="stn st-acik">${ic('whistle', 16)}<span>Hoca <b>${esc(I.coach)}</b> · ${T.n}<small>${T.d}</small></span></div>
      ${s.adapt > 0 ? tt`<div class="stn st-liste">${ic('clock', 16)}<span>Uyum süreci: <b>${s.adapt} hafta</b><small>Yeni kulübe alışıyorsun; maç anları biraz zorlaşır.</small></span></div>` : ''}
      ${s.con.goalB ? tt`<div class="kv">${ic('ball', 16)}<span>Gol primi</span><b>${G.fmtS(s.con.goalB)}</b></div>` : ''}
      <button class="opt sm" data-a="club" data-v="${s.clubId}">${ic('shield', 20)}<span><b>Kulüp profili</b></span></button></section>
    ${dreamCard()}
    <section class="card">${tag(tt('Sana uygun kulüpler'), 'ye')}<p class="mut sm">Kulübe dokun: profil ve transfer analizi. ${G.canPropose() ? tt('Kendini önermek bir eylem hakkı harcar.') : s.agent || s.net.length ? tt('Yeni bir öneri için birkaç hafta bekle.') : tt('Kendini önermek için menajer ya da tanıdık gerekir.')}</p>${mk || tt('<p class="mut sm">Şu an seviyene uyan kulüp yok.</p>')}</section>
    ${moves ? tt`<section class="card">${tag(tt('Transfer geçmişi'))}${moves}</section>` : ''}`;
}

function vCareer() {
  const s = G.S, t = G.tot();
  const keys = s.pos === 'KL' ? ['kaleci', 'zihin', 'guc', 'pas', 'hiz', 'kafa'] : ['sut', 'pas', 'teknik', 'hiz', 'guc', 'savunma', 'kafa', 'zihin'];
  const attrs = keys.map(k => tt`<div class="at ${POS[s.pos].w[k] ? 'key' : ''}"><span>${ATTR[k]}</span><b>${Math.round(s.at[k])}</b></div>`).join('');
  const cur = s.st.apps ? dec(s.st.rs / s.st.apps) : '–', car = t.apps ? dec(t.rs / t.apps) : '–';
  const hist = s.hist.slice().reverse().map(h => tt`<tr><td>${h.y}</td><td>${esc(h.c)}${h.k ? ' (k)' : ''}<small>${h.l} · ${h.pos}.</small></td><td>${h.apps}</td><td>${h.g}</td><td>${h.a}</td><td>${h.avg ? dec(h.avg) : '–'}</td></tr>`).join('');
  const stat = (i, v, l) => tt`<div class="stt">${ic(i, 18)}<b>${v}</b><small>${l}</small></div>`;
  const kv = ['pro', 'tr', 'gec'].includes(V.kv) ? V.kv : 'pro';
  const seg = tt`<div class="seg">${[['pro', tt('Profil')], ['tr', 'Transfer'], ['gec', tt('Geçmiş')]].map(([k, l]) => tt`<button class="${kv === k ? 'on' : ''}" data-a="kv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (kv === 'tr') return `${hero(true)}${seg}${vTransfer()}`;
  if (kv === 'gec') return tt`${hero(true)}${seg}
    ${s.tro.length ? tt`<section class="card">${tag(tt('Müze'), 'ye')}<ul class="tro">${s.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${achCard()}
    <section class="card">${tag(tt('Kulüp efsaneleri'), 'ye')}<div class="kv">${crest(s.clubId, 22)}<span>${esc(G.club(s.clubId).n)} · tüm zamanların golcüleri</span></div>${legHTML(s.clubId)}</section>
    ${hist ? tt`<section class="card">${tag(tt('Geçmiş'))}<table class="tb hist"><tr><th>Sezon</th><th>Kulüp</th><th>M</th><th>G</th><th>A</th><th>Ort.</th></tr>${hist}</table></section>` : tt('<p class="mut sm pad">İlk sezonun bitince burada görünür.</p>')}
    <section class="card rv">${tag(tt('Kuşak rakibin'))}<div class="wt"><div class="avw sm">${persona('rakip', null, G.KW)}</div><div><b>${esc(s.rival.n)}</b><small>${esc(s.rival.c)} · Genel ${s.rival.ovr}</small></div></div></section>`;
  return tt`${hero(true)}${seg}
    <section class="card">${tag(tt('Özellikler'))}<div class="rad">${radar(keys.map(k => ({ l: ATTR[k].slice(0, 3).toLocaleUpperCase(LC), v: s.at[k] / Math.max(50, Math.max(...keys.map(x => s.at[x])) + 8) * 99 })))}<div class="ats">${attrs}</div></div>
      <p class="mut sm">${ic('star', 14)} Potansiyel: ${G.potText()} · ${ORIGINS[s.origin].n} · ${TRAITS[s.trait].n}</p></section>
    <section class="card">${tag(tt('Bu sezon'))}<div class="stts">${stat('shirt', s.st.apps, tt('Maç'))}${stat('ball', s.st.g, tt('Gol'))}${stat('swap', s.st.a, tt('Asist'))}${stat('star', cur, tt('Ort.'))}</div>
      <div class="kv"><span>Kariyer</span><b>${t.apps} maç · ${t.g} gol · ${t.a} asist · ${car}</b></div></section>
    ${natCard()}
    ${perkCard()}`;
}

function natCard() {
  const s = G.S, I = G.ntInfo(), tb = G.ntTable(), me = G.myNat(), ok = G.natOk();
  return tt`<section class="card">${tag(tt('Milli takım'), 'ye')}<div class="kv">${ic('flag', 16)}<span>${I.year} ${I.name} elemeleri · ${I.md}/6</span><b>${s.car.caps} maç · ${s.car.ng} gol</b></div>
    <table class="tb lg nt">${tb.map((r, i) => tt`<tr class="${r.n === me ? 'me' : ''} ${i < 2 ? 'up' : ''}"><td>${i + 1}</td><td class="tn">${esc(r.n)}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
    <p class="note">${I.q === true ? tt('Bilet alındı: yazın final turnuvası var. ') : I.q === false ? tt('Bu turnuva kaçtı. ') : I.next ? tt`Sıradaki: ${esc(I.next.opp)} · ${I.next.week}. hafta · ${I.next.home ? tt('iç saha') : tt('deplasman')}. İlk iki finallere gider. ` : ''}${ok ? tt('A Milli kadrosundasın.') : tt`A Milli için güç 73 ve itibar 45 gerekir (sen ${G.OVR()} / ${Math.round(s.rep)}).`}</p>
    ${I.last ? tt`<div class="kv">${ic('trophy', 16)}<span>${esc(I.last.name)}</span><b>${esc(I.last.stage)}</b></div>` : ''}</section>`;
}
// Kulübün tüm zamanların golcüleri; listede sen de varsan vurgulanır
function legHTML(id) {
  const R = G.legendRank(id);
  return `${R.list.slice(0, 6).map((x, i) => tt`<div class="lgd ${x.me ? 'me' : ''}"><i>${i + 1}</i><span>${esc(x.n)}${x.y ? tt`<small>${x.y}</small>` : tt('<small>bugün</small>')}</span><b>${x.g}</b><small>${x.apps} maç</small></div>`).join('')}${R.pos > 1 && R.pos < 99 ? tt`<p class="note">Bir üst sıra için ${R.next} gol daha.</p>` : R.pos === 1 ? tt('<p class="note">Kulüp tarihinin en golcü ismi sensin.</p>') : ''}`;
}

// Avrupa kupası sayfası: lig aşaması tablosu, eleme turları, katılım kuralları
const EUL = [['en1', 'Premier League'], ['es1', 'La Liga'], ['it1', 'Serie A'], ['de1', 'Bundesliga'], ['fr1', 'Ligue 1'], ['nl1', 'Eredivisie'], ['pt1', 'Liga Portugal'], ['tr1', 'Süper Lig']];
function euroView(k) {
  const s = G.S, c = s[k], inIt = c.teams.includes(s.clubId), nx = G.euroNext(k), tb = G.euroTable(k), kf = c.fmt === 'k', bye = !!c.bye && c.bye.includes(s.clubId);
  const st = c.champ ? tt`Şampiyon: ${esc(G.club(c.champ).n)}` : !inIt ? tt('Kulübün bu sezon katılmıyor') : nx ? tt`Devam ediyorsun · ${nx.round}, ${nx.week}. hafta` : bye ? tt('Çeyrek finaldesin · rakibin play-off turundan gelecek') : tt('Elendiniz');
  const line = ([a, b, ag, bg, w, ta, tb2]) => tt`<div class="res ${a === s.clubId || b === s.clubId ? 'me' : ''}"><span class="${w === a ? 'w' : ''}">${esc(G.club(a).n)}</span><b>${ag} - ${bg}${ta != null ? tt`<small>top. ${ta}-${tb2}</small>` : ''}</b><span class="${w === b ? 'w' : ''}">${esc(G.club(b).n)}</span></div>`;
  const ko = c.hist.filter(h => h.ko || h.q).reverse().map(h => tt`<div class="sub">${h.n}</div>${h.res.map(line).join('')}`).join('');
  const lastLg = c.hist.filter(h => h.lg).slice(-1).map(h => { const mine = h.res.filter(x => x[0] === s.clubId || x[1] === s.clubId), rest = h.res.filter(x => !mine.includes(x)).slice(0, 5); return tt`<div class="sub">${h.n}</div>${[...mine, ...rest].map(line).join('')}`; }).join('');
  const rows = tb.map((r, i) => tt`<tr class="${r.id === s.clubId ? 'me' : ''} ${i < (kf ? 4 : 16) ? 'q' : kf && i < 12 ? 'q2' : ''}" data-a="club" data-v="${r.id}"><td>${i + 1}</td><td class="tn">${crest(r.id, 20)}${esc(G.club(r.id).n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const rules = EUL.map(([lid, n]) => { const q = G.euroSpots(lid), a = q.cl, b = a + q.clq, e = b + q.el, f = e + q.ko, rng = (x, y) => (y - x > 1 ? `${x + 1}.–${y}.` : `${x + 1}.`); return tt`<div class="eur"><span>${n}${s.eps.includes(lid) ? ' <em>+1</em>' : ''}</span><i class="z-cl">${rng(0, a)}</i>${q.clq ? tt`<i class="z-clq">${rng(a, b)}</i>` : '<i class="z-no">–</i>'}<i class="z-el">${rng(b, e)}</i><i class="z-ko">${rng(e, f)}</i></div>`; }).join('');
  const none = tt('<i class="z-no">–</i>');
  const rulesK = !G.KW ? '' : EUL.map(([lid]) => { const q = G.euroSpots(lid), a = q.cl, b = a + q.clq, e = b + q.el, rng = (x, y) => (y - x > 1 ? `${x + 1}.–${y}.` : `${x + 1}.`); return tt`<div class="eur k3"><span>${esc(LMAP[lid].name)}</span>${a ? tt`<i class="z-cl">${rng(0, a)}</i>` : none}${q.clq ? tt`<i class="z-clq">${rng(a, b)}</i>` : none}${q.el ? tt`<i class="z-el">${rng(b, e)}</i>` : none}</div>`; }).join('');
  return tt`<section class="card euh eu-${k}">${euLogo(k, 66)}<div><h3>${c.name}</h3><small>${st}</small></div></section>
    ${nx ? tt`<section class="card">${tag(tt('Sıradaki maç'), 'ye')}${cl(nx.opp, tt`${crest(nx.opp, 34)}<div><b>${esc(G.club(nx.opp).n)}</b><small>${nx.round} · ${nx.week}. hafta · ${nx.final ? tt('tarafsız saha') : nx.home ? tt('iç saha') : tt('deplasman')} · güç ${Math.round(s.rt[nx.opp])}</small></div>`, 'wt')}</section>` : ''}
    ${ko ? tt`<section class="card">${ko}</section>` : ''}
    ${c.md === 0 ? '' : tt`<section class="card np eu-${k}"><table class="tb lg eu"><tr><th>#</th><th>Takım</th>${lgHead()}</tr>${rows}</table>
      ${kf ? tt`<p class="mut sm leg"><i class="q"></i>İlk 4 çeyrek finale<i class="q2"></i>5–12 play-off turuna · lig aşaması ${Math.min(c.r, 6)}/6</p>` : tt`<p class="mut sm leg"><i class="q"></i>İlk 16 çift maçlı eleme turlarına kalır · lig aşaması ${Math.min(c.r, 6)}/6</p>`}</section>`}
    ${lastLg ? tt`<section class="card">${lastLg}</section>` : ''}
    ${G.KW ? tt`<section class="card">${tag(tt('Kim, nereden katılır?'))}<div class="eur hd k3"><span>Lig sırası</span><i class="z-cl">ŞL</i><i class="z-clq">Eleme</i><i class="z-el">Avr. K.</i></div>${rulesK}
      <p class="note">Şampiyonlar Ligi 18 takımlı: lig aşamasında altı maç, ilk 4 çeyrek finale, 5–12 play-off turuna. Elemeyi kaybeden yola Avrupa Kupası'nda devam eder; orada final dahil her tur çift maçlıdır.</p></section>` : tt`<section class="card">${tag(tt('Kim, nereden katılır?'))}<div class="eur hd"><span>Lig sırası</span><i class="z-cl">ŞL</i><i class="z-clq">Eleme</i><i class="z-el">Avr. L.</i><i class="z-ko">Konf.</i></div>${rules}
      <p class="note">Ülke kupası şampiyonu Avrupa Ligi'ne gider. <em class="plus1">+1</em>: geçen sezon Avrupa'da en başarılı iki ülkeye verilen fazladan Şampiyonlar Ligi bileti. Elemeyi kaybeden yola Avrupa Ligi'nde devam eder.</p></section>`}`;
}

function vLeague() {
  const s = G.S, my = G.leagueOf(s.clubId), lid = V.lig && s.lg[V.lig] ? V.lig : my, z = G.zones(lid), tb = G.table(lid), n = tb.length;
  const seg = tt`<div class="seg">${[['tb', tt('Puan')], ['cup', tt('Kupa')], ['sc', G.KW ? tt('Gol kraliçeliği') : tt('Gol krallığı')]].map(([k, l]) => tt`<button class="${V.lv === k ? 'on' : ''}" data-a="lv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (V.lv === 'cup') {
    const ck = G.EUK.includes(V.ck) ? V.ck : s.cup.none ? 'cl' : 'cup', c = s.cup, alive = c.alive.includes(s.clubId), cn = G.cupNext('cup');
    const seg2 = tt`<div class="seg s3">${[['cup', tt('Kupa')], ['cl', tt('Şamp. L.')], ['el', G.KW ? tt('Avrupa K.') : tt('Avrupa L.')], ['ko', tt('Konferans')]].filter(([k]) => (k === 'cup' ? !s.cup.none : G.EUK.includes(k))).map(([k, l]) => tt`<button class="${ck === k ? 'on' : ''} sg-${k}" data-a="ck" data-v="${k}">${esc(l)}</button>`).join('')}</div>`;
    if (ck !== 'cup') return `${seg}${seg2}${euroView(ck)}`;
    const rounds = c.hist.slice().reverse().map(h => {
      const mine = h.res.filter(x => x[0] === s.clubId || x[1] === s.clubId), rest = h.res.filter(x => !mine.includes(x)).slice(0, h.res.length > 8 ? 5 : 8);
      return tt`<div class="sub">${h.n}</div>${[...mine, ...rest].map(([a, b, ag, bg, w]) => tt`<div class="res ${a === s.clubId || b === s.clubId ? 'me' : ''}"><span class="${w === a ? 'w' : ''}">${esc(G.club(a).n)}</span><b>${ag} - ${bg}</b><span class="${w === b ? 'w' : ''}">${esc(G.club(b).n)}</span></div>`).join('')}${h.res.length > mine.length + rest.length ? tt`<p class="mut sm">+${h.res.length - mine.length - rest.length} maç daha</p>` : ''}`;
    }).join('');
    return tt`${seg}${seg2}<section class="card cuph">${ic('trophy', 44)}<div><h3>${esc(c.name)}</h3><small>${c.champ ? tt`Şampiyon: ${esc(G.club(c.champ).n)}` : alive ? tt`Devam ediyorsun · ${cn.round}, ${cn.week}. hafta` : c.hist.some(h => h.res.some(x => x[0] === s.clubId || x[1] === s.clubId)) ? tt('Elendiniz') : tt('Kulübün bu sezon katılmıyor')}</small></div></section>
      ${cn ? tt`<section class="card">${tag(tt('Sıradaki tur'), 'ye')}${cl(cn.opp, tt`${crest(cn.opp, 34)}<div><b>${esc(G.club(cn.opp).n)}</b><small>${cn.round} · ${cn.week}. hafta · güç ${Math.round(s.rt[cn.opp])}</small></div>`, 'wt')}</section>` : ''}
      ${rounds ? tt`<section class="card">${rounds}</section>` : tt('<p class="mut sm pad">İlk tur henüz oynanmadı.</p>')}`;
  }
  const opt = LEAGUES.map(L => tt`<option value="${L.id}" ${L.id === lid ? 'selected' : ''}>${L.c === 'TR' ? '' : COUNTRIES[L.c] + ' · '}${L.name}${L.gen ? ' (' + s.prov + ')' : ''}</option>`).join('');
  const sel = tt`<label class="fld"><select data-c="lig">${opt}</select></label>`;
  if (V.lv === 'sc') {
    const sc = G.scorers(lid).filter(x => x.g > 0).map((x, i) => tt`<tr class="${x.me ? 'me' : ''}" data-a="club" data-v="${x.team}"><td>${i + 1}</td><td class="tn">${crest(x.team, 20)}${esc(x.n)}</td><td><b>${x.g}</b></td></tr>`).join('');
    return tt`${seg}${sel}<section class="card np"><table class="tb lg">${sc || tt('<tr><td class="mut">Henüz gol yok.</td></tr>')}</table></section>`;
  }
  const hasEu = !!G.euroSpots(lid);
  const rows = tb.map((r, i) => tt`<tr class="${r.id === s.clubId ? 'me' : ''} ${i < z.up ? 'up' : i < z.up + z.po ? 'po' : i >= n - z.down ? 'down' : i >= n - z.down - z.out ? 'out' : ''}" data-a="club" data-v="${r.id}"><td><span class="zn z-${G.euroZone(lid, i)}">${i + 1}</span></td><td class="tn">${crest(r.id, 20)}${esc(G.club(r.id).n)}${r.pen ? tt`<em class="pen">−${r.pen}</em>` : ''}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const last = (s.lg[lid].last || []).map(([h, a, hg, ag]) => tt`<div class="res ${h === s.clubId || a === s.clubId ? 'me' : ''}"><span>${esc(G.club(h).n)}</span><b>${hg} - ${ag}</b><span>${esc(G.club(a).n)}</span></div>`).join('');
  return tt`${seg}${sel}
    <section class="card np"><table class="tb lg"><tr><th>#</th><th>Takım</th>${lgHead()}</tr>${rows}</table>
    <p class="mut sm leg"><i class="up"></i>${lid === 'tr1' || LMAP[lid].c !== 'TR' ? 'Şampiyon' : tt('Yükselme')}${z.po ? '<i class="po"></i>Play-off' : ''}${z.out ? '<i class="out"></i>Play-out' : ''}${z.down ? tt('<i class="down"></i>Düşme') : ''} · ${s.lg[lid].rd}/${G.rounds(lid)} hafta · eşitlikte ikili averaj</p>
    ${hasEu && G.KW ? tt`<p class="mut sm leg eu"><i class="z-cl"></i>Şamp. Ligi<i class="z-clq"></i>ŞL elemesi<i class="z-el"></i>Avrupa Kupası · takıma dokun: profil</p>` : hasEu ? tt`<p class="mut sm leg eu"><i class="z-cl"></i>Şamp. Ligi<i class="z-clq"></i>ŞL elemesi<i class="z-el"></i>Avrupa Ligi<i class="z-ko"></i>Konferans · takıma dokun: profil</p>` : tt('<p class="mut sm leg">Takıma dokun: kulüp profili</p>')}</section>
    ${last ? tt`<section class="card">${tag(tt('Son hafta'))}${last}</section>` : ''}`;
}

function matesCard() {
  const s = G.S, c = G.club(s.clubId), left = G.slots() - s.used;
  return tt`<section class="card hv-cev">${tag(tt('Takım arkadaşların'))}<div class="kv">${ic('users', 16)}<span>Takım kimyası</span><b>%${Math.round(G.chem() * 100)}</b></div>
    ${s.mates.map((m, i) => tt`<div class="ppl"><div class="avw sm">${avatar(m.lk, c.c1, c.c2)}</div><div><b>${esc(m.n)}</b><small>${m.r} · ${m.b >= 70 ? tt('yakın dost') : m.b >= 40 ? tt('arkadaş') : tt('tanıdık')}</small>${bar(m.b, 'mo')}</div><button class="mini-b" data-a="mate" data-v="${i}" ${left <= 0 ? 'disabled' : ''}>Takıl</button></div>`).join('')}
    <p class="mut sm">Yakınlık asist şansını ve soyunma odası havasını artırır. Kulüpten ayrılırken yakın olduğun isimler ağına geçer.</p></section>`;
}
function netCard() {
  const s = G.S, cl = G.club(s.clubId), left = G.slots() - s.used, now = G.absWeek();
  const rows = s.net.map((c, i) => {
    const N = NET[c.k], can = c.b >= 50 && c.cd <= now;
    return tt`<div class="ppl"><div class="avw sm">${c.lk ? avatar(c.lk, '#3a3f47', '#f2f2f2') : persona(N.p, cl, G.KW)}</div><div><b>${esc(c.n)}</b><small>${N.n}${c.org && G.club(c.org) ? ' · ' + esc(G.club(c.org).n) : ''}</small>${bar(c.b, c.k === 'golge' ? 'low' : 'hot')}</div><div class="pbs"><button class="mini-b" data-a="netm" data-v="${i}" ${left <= 0 ? 'disabled' : ''}>${tt('Görüş', 'bulus')}</button><button class="mini-b" data-a="netf" data-v="${i}" ${can ? '' : 'disabled'}>${N.f}</button></div></div>`;
  }).join('');
  return tt`<section class="card hv-cev">${tag(tt('Ağın'), 'ye')}${rows || tt('<p class="mut sm">Henüz kimseyi tanımıyorsun. Tanışmalar olaylarla gelir; kiminle yakınlaşacağın sana kalmış.</p>')}
    <p class="mut sm">İyilik istemek için bağ en az 50 olmalı, sonra 20 hafta beklenir. Görüşmezsen bağ zayıflar.</p></section>`;
}

// Kariyer sürerken oyuncunu yeniden biçimlendir
function lookCard() {
  const s = G.S, c = G.club(s.clubId), L = s.look;
  const sw = (k, arr) => tt`<div class="sws">${arr.map((x, i) => `<button class="swc ${(L[k] || 0) === i ? 'on' : ''}" style="background:${x}" data-a="mlook" data-v="${k}:${i}" aria-label="${k} ${i + 1}"></button>`).join('')}</div>`;
  return tt`<section class="card hv-gor">${tag(tt('Oyuncun'))}
    <div class="mk"><div class="mk-av">${avatar(L, c.c1, c.c2, { num: s.num })}</div>
      <div class="mk-ctl"><small>Ten</small>${sw('skin', SKIN)}<small>Saç rengi</small>${sw('hc', HAIRC)}
        <div class="chips"><button class="chip" data-a="mlook" data-v="hair:${((L.hair || 0) + 1) % HAIRS}">${ic('swap', 16)} Saç</button>
        ${G.KW ? '' : tt`<button class="chip ${L.beard ? 'on' : ''}" data-a="mlook" data-v="beard:${((L.beard || 0) + 1) % 3}">Sakal</button>`}
        <button class="chip ${L.band ? 'on' : ''}" data-a="mlook" data-v="band:${L.band ? 0 : 1}">Bant</button></div></div></div>
    <div class="fld two"><label><span>Forma no</span><input type="number" min="1" max="99" value="${s.num}" inputmode="numeric" data-c="mnum"></label><label><span>Lakap</span><input maxlength="18" value="${esc(s.nick || '')}" placeholder="Örn. Adapazarı Ekspresi" autocomplete="off" data-c="mnick"></label></div>
    <div class="fld"><span>Gol sevinci</span><div class="chips">${Object.keys(CELE).map(k => tt`<button class="chip ${s.cele === k ? 'on' : ''}" data-a="mcele" data-v="${k}">${CELE[k][0]}</button>`).join('')}</div></div></section>`;
}

const SIC = { krampon: 'shirt', telefon: 'phone', araba: 'car', daire: 'home', diyet: 'heart', pt: 'train', halisaha: 'ball', ev: 'home', spor: 'car', kofte: 'cart', villa: 'star' };
function vLife() {
  const s = G.S, inc = G.income(), R = s.rel, c = G.club(s.clubId);
  const rel = [['anne', tt('Aile'), R.aile], ['ark', tt('Arkadaşlar'), R.ark], ...(R.par != null ? [['par', s.fl.evli ? tt('Eşin') : tt('Sevgilin'), R.par]] : []), ['hoca', tt('Hoca'), R.hoca], ['takim', tt('Soyunma odası'), R.takim], ['taraftar', tt('Taraftar'), R.taraf], ['basin', tt('Basın'), R.basin ?? 50]]
    .map(([p, n, v]) => tt`<div class="rel ${v < 25 ? 'low' : ''}"><div class="relr" style="--v:${Math.round(v)}"><div class="avw">${persona(p, c, G.KW)}</div></div><b>${Math.round(v)}</b><small>${n}</small></div>`).join('');
  const row = (n, v, i) => v ? tt`<div class="kv">${ic(i, 16)}<span>${n}</span><b class="${v < 0 ? 'neg' : ''}">${G.fmt(v)}</b></div>` : '';
  const shop = SHOP.map(i => {
    const own = G.has(i.id), cost = i.p || G.yrPrice(i), price = i.p ? G.fmtS(i.p) : tt`${G.fmtS(cost)}/sezon`;
    const btn = own ? tt`<span class="own">${ic('check', 16)}</span>` : tt`<button class="mini-b" data-a="buy" data-v="${i.id}" ${s.money < cost ? 'disabled' : ''}>${price}</button>`;
    return tt`<div class="shop ${own ? 'has' : ''}"><span class="aic">${ic(SIC[i.id] || 'cart', 22)}</span><div><b>${i.n}</b><small>${G.tl(i.d)}</small></div>${btn}</div>`;
  }).join('');
  const send = G.nice(Math.max(1000, s.con.wage));
  if (s.mgr) return tt`<div class="hvw" data-hv="ayar">
    <section class="card hv-ayar">${tag(tt('Para birimi'))}<div class="seg">${Object.keys(G.CUR).map(k => tt`<button class="${G.curKey() === k ? 'on' : ''}" data-a="cur" data-v="${k}">${G.CUR[k][0]} ${G.CUR[k][2]}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Tema'))}<div class="thm">${THEMES.map(([k, n, c2]) => tt`<button class="${theme() === k ? 'on' : ''}" data-a="theme" data-v="${k}"><i style="background:${c2 || 'conic-gradient(#d81e2c, #ffd21a, #0f8a4b, #1c57c4, #d81e2c)'}"></i>${n}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Dil'))}<div class="seg">${langBtns()}</div></section>
    <div class="kv">${ic('coin', 16)}<span>Kişisel birikimin</span><b>${G.fmtS(s.money)}</b></div>
    <button class="opt sm hv-ayar" data-a="exp">${ic('down', 20)}<span><b>Kaydı dosyaya aktar</b></span></button>
    <button class="opt sm hv-ayar" data-a="mquit">${ic('x', 20)}<span><b>Kenar kariyerini bitir</b><small>Özet ekranına gider, kayıt silinir</small></span></button>
    <button class="link hv-ayar" data-a="menu">Ana menü</button></div>`;
  return tt`<div class="hvw" data-hv="${V.hv}"><div class="seg">${[['cev', tt('Çevre')], ['para', tt('Para')], ['gor', tt('Görünüm')], ['ayar', tt('Ayarlar')]].map(([k, l]) => tt`<button class="${V.hv === k ? 'on' : ''}" data-a="hv" data-v="${k}">${l}</button>`).join('')}</div>
    <section class="card hv-cev">${tag(tt('Çevren'))}<div class="rels">${rel}</div></section>
    ${s.kid ? tt`<section class="card hv-cev">${tag(tt('Çocuğun'), 'ye')}<div class="ppl"><div class="avw sm">${avatar({ skin: s.look.skin, hair: 1, hc: s.look.hc }, c.c1, c.c2)}</div><div><b>${esc(s.kid.n)}</b><small>${G.kidAge()} yaşında · futbol yeteneği</small>${bar(s.kid.tal / 20 * 100, 'hot')}</div></div><p class="note">Ailenle geçirdiğin vakit ve ona ayırdığın zaman yeteneğini büyütür. Emekli olduğunda kariyere onunla, aynı dünyada devam edebilirsin.</p></section>` : ''}
    ${matesCard()}${netCard()}
    <section class="card hv-para">${tag(tt('Haftalık bütçe'))}
      ${row(tt('Kulüp ücreti'), inc.wage, 'shirt')}${row(tt('Menajer payı'), -inc.cut, 'pen')}${row(tt('Ek iş'), inc.job, 'briefcase')}${row(tt('Sponsorlar'), inc.spon, 'tag')}${row(tt('İşletmeler'), inc.biz, 'cart')}${row(tt('Giderler'), -inc.cost, 'down')}
      <div class="kv tot">${ic('coin', 16)}<span>Net</span><b class="${inc.net < 0 ? 'neg' : ''}">${G.fmt(inc.net)}</b></div>
      <button class="opt sm" data-a="send" ${s.money < send ? 'disabled' : ''}>${ic('heart', 20)}<span><b>Aileye ${G.fmt(send)} gönder</b></span></button></section>
    <section class="card hv-para">${tag(tt('Şöhret'), 'ye')}<div class="stts">
      <div class="stt">${ic('users', 18)}<b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + tt(' Mn', 'para') : num(s.fol)}</b><small>Takipçi</small></div>
      <div class="stt">${ic('star', 18)}<b>${Math.round(s.rep)}</b><small>İtibar</small></div>
      <div class="stt">${ic('book', 18)}<b>${Math.round(s.egt)}</b><small>Eğitim</small></div>
      <div class="stt">${ic('globe', 18)}<b>${Math.round(s.dil)}</b><small>Dil</small></div></div>
      ${s.spon.map(x => tt`<div class="kv">${ic('tag', 16)}<span>${esc(x.n)}</span><b>${G.fmtS(x.wk)}/hf</b></div>`).join('')}</section>
    <section class="card hv-para">${tag(tt('Yatırımlar'), 'ye')}<div class="kv">${ic('chart', 16)}<span>Portföy değeri</span><b>${G.fmtS(G.invTotal())}</b></div>
      ${Object.keys(INV).map(k => { const v = Math.round((s.inv || {})[k] || 0), stp = G.nice(Math.max(5000, s.money * .2)); return tt`<div class="shop ${v ? 'has' : ''}"><span class="aic">${ic(INV[k][4], 22)}</span><div><b>${INV[k][0]}</b><small>${INV[k][1]}${v ? tt` Şu an: ${G.fmtS(v)}` : ''}</small></div><div class="pbs"><button class="mini-b" data-a="inv" data-v="${k}" ${s.money < stp ? 'disabled' : ''}>+${G.fmtS(stp)}</button><button class="mini-b" data-a="div" data-v="${k}" ${v ? '' : 'disabled'}>Çek</button></div></div>`; }).join('')}
      <p class="note">Değerler her hafta oynar. Mali müşavirin varsa kayıplar yarıya iner, ortağın seni batıramaz.</p></section>
    <section class="card hv-para">${tag(tt('Yaşam ve yatırım'))}${shop}</section>
    ${lookCard()}
    <section class="card hv-ayar">${tag(tt('Para birimi'))}<div class="seg">${Object.keys(G.CUR).map(k => tt`<button class="${G.curKey() === k ? 'on' : ''}" data-a="cur" data-v="${k}">${G.CUR[k][0]} ${G.CUR[k][2]}</button>`).join('')}</div><p class="mut sm">Sabit kur: €1 = ₺${G.CUR.EUR[1]} · $1 = ₺${G.CUR.USD[1]}</p></section>
    <section class="card hv-ayar">${tag(tt('Tema'))}<div class="thm">${THEMES.map(([k, n, c]) => tt`<button class="${theme() === k ? 'on' : ''}" data-a="theme" data-v="${k}"><i style="background:${c || 'conic-gradient(#d81e2c, #ffd21a, #0f8a4b, #1c57c4, #d81e2c)'}"></i>${n}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Dil'))}<div class="seg">${langBtns()}</div></section>
    ${spiker.ok ? tt`<button class="opt sm hv-ayar" data-a="spk">${ic('mic', 20)}<span><b>Spiker sesi: ${spiker.on ? tt('açık') : tt('kapalı')}</b><small>Maçta goller ve anlar sesli okunur</small></span></button>` : ''}
    <button class="opt sm hv-ayar" data-a="howto">${ic('book', 20)}<span><b>Nasıl oynanır?</b><small>Rehberi baştan göster</small></span></button>
    <button class="opt sm hv-ayar" data-a="kodal">${ic('swap', 20)}<span><b>Aktarım kodunu kopyala</b><small>Başka cihazda giriş ekranında "Kodla yükle"</small></span></button>
    <button class="opt sm hv-ayar" data-a="exp">${ic('down', 20)}<span><b>Kaydı dosyaya aktar</b><small>Başka cihazda başlık ekranından yüklersin</small></span></button>
    <button class="opt sm hv-ayar" data-a="share">${ic('right', 20)}<span><b>Kariyerini paylaş</b><small>Özet metni paylaşım menüsüne ya da panoya gider</small></span></button>
    <button class="link hv-ayar" data-a="menu">Ana menü</button></div>`;
}

function feedAv(p) {
  const s = G.S, c = G.club(s.clubId);
  if (p.a === 'me') return tt`<div class="avw sm">${avatar(s.look, c.c1, c.c2)}</div>`;
  if (p.a.startsWith('c:')) return crest(G.club(p.a.slice(2)) ? p.a.slice(2) : s.clubId, 40);
  return tt`<div class="avw sm">${persona(p.a, c, G.KW)}</div>`;
}
function vSocial() {
  const s = G.S, left = G.slots() - s.used, hd = '@' + s.name.toLocaleLowerCase(LC).replace(/[^a-zçğıöşü0-9]+/g, '');
  s.feedNew = 0;
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const posts = POSTS.filter(G.canPost).map(p => tt`<button class="pst" data-a="post" data-v="${p.id}" ${left <= 0 ? 'disabled' : ''}>${ic(p.i, 20)}<span>${p.n}</span></button>`).join('');
  const feed = s.feed.map(p => p.k === 'manset'
    ? tt`<article class="fd manset"><small>${ic('news', 14)}${esc(p.n)} · ${p.w}. hafta</small><b>${esc(p.t)}</b></article>`
    : tt`<article class="fd k-${p.k}">${feedAv(p)}<div><div class="fd-h"><b>${esc(p.n)}</b><small>${p.k === 'ben' ? hd : p.k === 'fan' ? '@' + esc(p.n) : p.k === 'haber' ? 'haber' : ''} · ${p.w}. hf</small></div><p>${esc(p.t)}</p><div class="fd-f">${ic('heart', 14)}<span>${num(p.l)}</span>${ic('swap', 14)}<span>${num(p.l / 9)}</span></div></div></article>`).join('');
  return tt`<section class="card soc">${me()}<div><b>${esc(s.name)}</b><small>${hd}</small></div><div class="soc-f"><b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + tt(' Mn', 'para') : num(s.fol)}</b><small>takipçi</small></div></section>
    ${s.mgr ? '' : tt`<section><div class="sh"><h4>Paylaş</h4><div class="dots">${dots}</div></div><div class="psts">${posts}</div></section>`}
    <section><div class="sh"><h4>Akış</h4></div><div class="feedl">${feed || tt('<p class="mut sm pad">Akış boş. İlk maçından sonra dolmaya başlar.</p>')}</div></section>`;
}

function vHub() {
  const mg = !!G.S.mgr;
  const tabs = mg ? [['ev', tt('Kenar'), 'whistle'], ['kar', tt('Kulüp'), 'shield'], ['lig', tt('Lig'), 'trophy'], ['sos', tt('Sosyal'), 'phone'], ['hay', tt('Ayarlar'), 'heart']] : [['ev', tt('Saha'), 'ball'], ['kar', tt('Kariyer'), 'user'], ['lig', tt('Lig'), 'trophy'], ['sos', tt('Sosyal'), 'phone'], ['hay', tt('Hayat'), 'heart']];
  const nw = V.tab === 'sos' ? 0 : G.S.feedNew || 0;
  const body = { ev: mg ? vMgrHome : vHome, kar: mg ? vMgrClub : vCareer, lig: vLeague, sos: vSocial, hay: vLife }[V.tab]();
  return head() + tt`<main>${body}</main><nav class="tabs">${tabs.map(([k, n, i]) => tt`<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i, 22)}<span>${n}</span>${k === 'sos' && nw ? tt`<em>${nw > 9 ? '9+' : nw}</em>` : ''}</button>`).join('')}</nav>`;
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
  const cu = x.nat ? '#d81e2c' : s.clubId ? G.club(s.clubId).c1 : '#ff6a2b';
  let co = x.opp ? G.club(x.opp).c1 : '#5a6470'; if (co === cu) co = x.opp ? G.club(x.opp).c2 : '#f2f2f2';
  const res = await mini.play(kind, { skill: sk(G.skillFor(kind)), speed: sk(s.at.hiz), oppQ, hard: hard * (x.focus ? .88 : 1) * (x.tired || 1) * (x.crowd ? .85 : 1) * (x.big ? .9 : 1) * (x.adapt ? 1.07 : 1) * (x.wxh || 1), wall: x.wall || null, bonus: !!x.bonus, cu, co, pk: Object.fromEntries(s.perks.map(p => [p, 1])) });
  $mini.hidden = true;
  return res;
}

// ---------- akışlar ----------
async function trainFlow() {
  const s = G.S, list = TRAIN.filter(t => !t.pos || t.pos.includes(s.pos));
  const TI = { bit: 'target', top: 'ball', fiz: 'bolt', kon: 'bolt', sav: 'shield', kal: 'shield', zih: 'star' };
  const i = await dialog({ k: tt('Antrenman'), t: tt('Neye çalışacaksın?'), opts: [...list.map(t => ({ t: t.n, s: t.a.map(a => ATTR[a]).join(' + '), i: TI[t.id] })), { t: tt('Vazgeç'), c: 'ghost' }] });
  if (i >= list.length) return;
  const T = list[i]; let mult = 1;
  if (T.g) {
    const j = await dialog({ k: T.n, t: tt('Nasıl?'), opts: [{ t: tt('Sahada çalış'), s: tt('Başarı ×1,6 · başarısızlık ×0,8'), i: 'ball' }, { t: tt('Hızlı geç'), s: tt('Verim ×1,0'), i: 'right' }, { t: tt('Geri'), c: 'ghost' }], auto: 1 });
    if (j === 2) return;
    if (j === 0) { const r = AUTO ? G.simMoment(T.g, { oppR: G.OVR() }) : await playMini(T.g, G.OVR(), tt('Antrenman · ') + T.n); mult = G.GOOD.includes(r.out) ? 1.6 : 0.8; }
  }
  const r = G.train(T.id, mult); sfx.up();
  toast(r.gs.map(([k, g]) => `${ATTR[k]} +${dec(g)}`).join(' · ') + (r.inj ? tt` · Sakatlandın (${r.inj} hf)` : ''), r.inj ? 'alert' : 'up');
  G.save(); render();
}

const FXL = { ark: tt('Arkadaş'), mo: tt('Moral'), en: tt('Enerji'), teknik: tt('Teknik') };
const fxText = f => Object.keys(f).filter(k => FXL[k] || k === 'para').map(k => k === 'para' ? G.fmt(f[k]) : `${FXL[k]} ${f[k] > 0 ? '+' : '−'}${Math.abs(f[k])}`).join(' · ');
async function hangFlow() {
  const s = G.S;
  const i = await dialog({ art: art('ark', 'users', 'life'), t: tt('Kiminle?'), opts: [{ t: tt('Mahalle arkadaşları'), s: tt('Çocukluk arkadaşların'), i: 'home' }, ...s.mates.map(m => ({ t: m.n, s: tt`${m.r} · bağ ${Math.round(m.b)}`, i: 'shirt' })), { t: tt('Vazgeç'), c: 'ghost' }], cls: 'ev' });
  if (i > s.mates.length) return;
  return i === 0 ? hangOld() : mateFlow(i - 1);
}
async function mateFlow(i) {
  const s = G.S, m = s.mates[i], c = G.club(s.clubId), keys = Object.keys(MACT);
  const a = tt`<div class="art t-club"><div class="art-ic">${ic('users', 150)}</div><div class="art-av">${avatar(m.lk, c.c1, c.c2)}</div><span class="art-n">${esc(m.r)}</span></div>`;
  const j = await dialog({ art: a, t: m.n, opts: [...keys.map(k => ({ t: MACT[k].n, s: tt`Bağ +${MACT[k].b}`, i: MACT[k].i })), { t: tt('Vazgeç'), c: 'ghost' }], cls: 'ev' });
  if (j >= keys.length) return;
  const [t, ch] = G.mateAct(i, keys[j]);
  await dialog({ art: a, t: MACT[keys[j]].n, body: tt`<p>${esc(t)}</p>${chips(ch)}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
  G.save(); render();
}
async function hangOld() {
  const i = await dialog({ art: art('ark', 'users', 'life'), t: tt('Ne yapıyoruz?'), opts: [...HANG.map(h => ({ t: h.n, s: fxText(h.fx), i: h.i, dis: !!h.fx.para && G.S.money < -h.fx.para })), { t: tt('Vazgeç'), c: 'ghost' }], cls: 'ev' });
  if (i >= HANG.length) return;
  const h = HANG[i], [t, ch] = G.hang(h.id);
  await dialog({ art: art('ark', h.i, 'life'), t: h.n, body: tt`<p>${esc(t)}</p>${chips(ch)}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
  G.save(); render();
}
async function dreamFlow() {
  const list = G.dreamList();
  const i = await dialog({ k: tt('Hedef takım'), t: tt('Hangi formayı giymek istiyorsun?'), body: tt('<p>Seviyen yaklaşınca bu kulüp seni kendiliğinden izlemeye başlar.</p>'), opts: [...list.map(id => ({ t: G.club(id).n, s: tt`${LMAP[G.leagueOf(id)].name} · güç ${Math.round(G.S.rt[id])}` })), { t: tt('Vazgeç'), c: 'ghost' }], auto: 0 });
  if (i < list.length) { G.setDream(list[i]); G.save(); render(); }
}

async function runEvent(e) {
  const a = evArt(e.ev.id);
  const i = await dialog({ art: a, t: e.title, body: tt`<p>${esc(G.tl(e.text))}</p>`, opts: e.opts.map(o => ({ t: G.tl(o.t), s: o.s ? G.tl(o.s) : o.s })), cls: 'ev' });
  const r = resolve(e, e.opts[i]);
  if (r.sp === 'deneme') return trialFlow(e.ctx.club);
  if (r.r || r.ch.length) {
    if (r.ch.some(x => x.includes('−')) && !r.ch.some(x => x.startsWith('+'))) sfx.bad(); else if (r.ch.some(x => x.includes(G.curSym()) && x.startsWith('+'))) sfx.coin();
    await dialog({ art: a, t: tt('Sonuç'), body: tt`<p>${esc(G.tl(r.r))}</p>${chips(r.ch)}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
  }
}

function offerHTML(o) {
  return tt`<div class="tgrid">
      <div>${ic('coin', 16)}<small>Haftalık ücret</small><b>${o.wage ? G.fmtS(o.wage) : tt('Amatör')}</b></div>
      <div>${ic('pen', 16)}<small>${o.loan ? tt('Süre') : tt('İmza parası')}</small><b>${o.loan ? tt('Sezon sonu') : G.fmtS(o.sign)}</b></div>
      <div>${ic('shirt', 16)}<small>Rol</small><b>${ROLE[o.role]}</b></div>
      <div>${ic('cal', 16)}<small>${o.loan ? tt('Tür') : tt('Sözleşme')}</small><b>${o.loan ? tt('Kiralık') : tt`${o.len} sezon`}</b></div></div>
    ${o.fee ? tt`<div class="stn st-${o.st === 'ok' ? 'acik' : 'kilit'}">${ic(o.st === 'ok' ? 'check' : 'lock', 16)}Bonservis teklifi <b>${G.fmtS(o.fee)}</b> · ${o.st === 'ok' ? tt('kulübün kabul etti') : tt`kulübün ${G.fmtS(o.ask)} istiyor`}</div>` : ''}`;
}
const offerSub = id => { const L = LMAP[G.leagueOf(id)]; return L ? tt`${L.c !== 'TR' ? COUNTRIES[L.c] + ' · ' : ''}${L.name} · güç ${Math.round(G.S.rt[id])}` : tt`${G.club(id).x || tt('Avrupa')} · güç ${Math.round(G.S.rt[id])}`; };
const EUNM = { cl: 'Şampiyonlar Ligi', el: 'Avrupa Ligi', ko: 'Konferans Ligi' };
// Transfer analizi: mevcut kulüp ile teklif yan yana
function cmpHTML(m) {
  const cell = (r, v, sub) => (r.star ? stars(v) : tt`<b>${esc(String(v))}</b>`) + (sub ? tt`<small>${esc(sub)}</small>` : '');
  return tt`<div class="cmp"><div class="cmp-h"><span>${crest(m.A.id, 28)}<small>Şimdi</small></span><b>Karşılaştırma</b><span>${crest(m.B.id, 28)}<small>Teklif</small></span></div>
    ${m.rows.map(r => tt`<div class="cmp-r d${r.d}"><span class="a">${cell(r, r.a, r.sa)}</span><span class="m">${ic(r.i, 16)}<small>${r.l}</small></span><span class="b">${cell(r, r.b, r.sb)}</span></div>`).join('')}</div>
    <div class="vrd t${m.tone}">${ic(m.tone > 0 ? 'up' : m.tone < 0 ? 'alert' : 'swap', 18)}<b>${m.verdict}</b></div>
    ${m.pros.map(x => tt`<div class="pc pro">${ic('check', 14)}<span>${esc(x)}</span></div>`).join('')}${m.cons.map(x => tt`<div class="pc con">${ic('x', 14)}<span>${esc(x)}</span></div>`).join('')}
    <div class="say"><div class="avw sm">${persona(m.fam[0])}</div><p><b>${PERS[m.fam[0]].n}</b>${esc(m.fam[1])}</p></div>
    ${m.agent ? tt`<div class="say"><div class="avw sm">${persona('menajer')}</div><p><b>${esc(G.S.agent.n)}</b>${esc(m.agent)}</p></div>` : ''}`;
}
function clubHTML(id) {
  const I = G.clubInfo(id), T = TACT[I.tac];
  const kv = (i, l, v) => tt`<div class="kv">${ic(i, 16)}<span>${l}</span><b>${v}</b></div>`;
  return tt`<div class="tgrid">
      <div>${ic('shield', 16)}<small>Güç</small><b>${Math.round(I.r)}</b></div>
      <div>${ic('chart', 16)}<small>${esc(I.lname)}</small><b>${I.pos ? tt`${I.pos}. · ${I.row.pts} puan` : esc(I.land || '–')}</b></div>
      <div>${ic('train', 16)}<small>Tesisler</small><b>${stars(I.fac)}</b></div>
      <div>${ic('users', 16)}<small>Stat kapasitesi</small><b>${num(I.cap)}</b></div></div>
    ${I.form ? tt`<div class="frm"><small>Son maçlar</small>${[...I.form].map(x => tt`<i class="f${x}">${tt(x, 'lig')}</i>`).join('')}</div>` : ''}
    ${I.crisis ? tt`<div class="stn st-kilit">${ic('alert', 16)}<span><b>${G.CRN[I.crisis.k]}</b>${I.crisis.n ? tt` · ${I.crisis.n} puan` : ''}<small>${{ ceza: tt('Lisans ihlali nedeniyle puanı silindi.'), maas: tt('Maaşlar ödenemiyor; kadro huzursuz, güç düştü.'), yasak: tt('Bir yıl boyunca oyuncu alamaz; teklif de yapamaz.'), baskan: tt('Kongrede yönetim değişti.') }[I.crisis.k]}</small></span></div>` : ''}
    ${I.eu ? tt`<div class="eub eu-${I.eu}">${euLogo(I.eu, 26)}<span>${EUNM[I.eu]}${I.euChamp ? tt(' şampiyonu') : I.euOut ? tt(' · elendi') : tt(' · yarışıyor')}</span></div>` : ''}
    <div class="stn st-acik">${ic('whistle', 16)}<span>Hoca <b>${esc(I.coach)}</b> · ${T.n}<small>${T.d}</small></span></div>
    ${kv('target', tt('Taktiğe uyumun'), '%' + I.fit)}${bar(I.fit, I.fit >= 60 ? 'mo' : I.fit < 40 ? 'low' : 'hot')}
    ${kv('heart', tt('Taraftar baskısı'), stars(I.fans))}
    ${I.sc.length ? kv('ball', tt('Golcüleri'), I.sc.map(x => `${esc(x[0])} (${x[1]})`).join(' · ')) : ''}
    ${I.hon ? kv('trophy', tt('Bu kariyerde şampiyonluk'), I.hon) : ''}
    ${I.rivals.length ? kv('bolt', tt('Ezeli rakip'), esc(I.rivals.slice(0, 2).join(', '))) : ''}
    ${I.contact ? kv('users', tt('Tanıdığın'), esc(I.contact.n)) : ''}
    ${I.watch ? kv('eye', tt('Sana ilgisi'), G.interest(I.watch.lv)) + bar(I.watch.lv, 'hot') : ''}
    <div class="sub">${ic('shirt', 16)}Kadro</div><div class="sqd">${['KL', 'DF', 'OS', 'KN', 'FV'].map(p => tt`<div><i>${p}</i><span>${I.squad.filter(x => x[0] === p).map(x => { const d = G.duelOf(x[1], id); return esc(x[1]) + (d ? tt` <em>${d[0]}-${d[1]}</em>` : ''); }).join(' · ')}</span></div>`).join('')}</div>
    <div class="sub">${ic('crown', 16)}Tüm zamanların golcüleri</div>${legHTML(id)}`;
}
async function clubFlow(id) {
  const s = G.S, c = G.club(id); if (!c) return;
  for (;;) {
    const I = G.clubInfo(id), mine = id === s.clubId, opts = [];
    if (!mine && I.lid && !s.mgr) opts.push({ k: 'an', t: tt('Transfer analizi'), s: tt('Kulübünle yan yana: süre, gelişim, taktik'), i: 'swap' });
    if (!mine && I.lid && !I.dream && !s.mgr) opts.push({ k: 'dr', t: tt('Hedef takım yap'), i: 'heart' });
    opts.push({ k: 'x', t: tt('Kapat'), c: 'ghost' });
    const j = await dialog({ art: clubArt(id, offerSub(id)), k: mine ? tt('Kulübün') : I.dream ? tt('Hedef takımın') : tt('Kulüp profili'), body: clubHTML(id), opts, auto: opts.length - 1 });
    if (opts[j].k === 'an') { await dialog({ art: clubArt(id, offerSub(id)), k: tt('Transfer analizi'), body: tt`<p class="mut sm">Bu kulüpten teklif gelirse seni ne bekler?</p>${cmpHTML(G.moveInfo({ id }))}`, opts: [{ t: tt('Geri'), c: 'ghost' }], auto: 0 }); continue; }
    if (opts[j].k === 'dr') { G.setDream(id); G.save(); toast(tt`Hedef takımın: ${c.n}`, 'heart'); render(); }
    return;
  }
}

async function trialFlow(cid) {
  const s = G.S, m = { ...POS[s.pos].m }; delete m.penalti; delete m.frikik;
  let ok = 0;
  for (let i = 0; i < 3; i++) {
    const k = G.wpick(m);
    const r = AUTO ? G.simMoment(k, { oppR: s.rt[cid] }) : await playMini(k, s.rt[cid], tt`Deneme ${i + 1}/3 · ${MOM[k].n}`, { opp: cid });
    if (G.GOOD.includes(r.out)) ok++;
  }
  if (ok >= 2) {
    const o = G.makeOffer(cid);
    const j = await dialog({ art: clubArt(cid, offerSub(cid)), k: tt('Deneme başarılı'), t: tt`${ok}/3 başarılı`, body: offerHTML(o) + cmpHTML(G.moveInfo(o)), opts: [{ t: tt('İmzala'), i: 'pen' }, { t: tt('Kulübümde kalıyorum'), c: 'ghost' }] });
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(tt`${G.club(cid).n} oyuncususun!`, 'pen'); }
  } else await info(tt`${ok}/3 başarılı`, tt('Yetmedi. "Seni izlemeye devam edeceğiz" dediler.'), tt('Deneme'), clubArt(cid, tt('Deneme antrenmanı')));
}

async function transferWindow(kind) {
  const s = G.S, expired = s.con.until < s.season;
  let offers = G.genOffers(kind);
  if (offers.length) await tip('transfer');
  if (expired) { const ren = G.renewal(); if (ren) offers.unshift(ren); if (!offers.length) offers = G.genOffers('serbest'); }
  if (!offers.length) return;
  for (;;) {
    const i = await dialog({
      art: tt`<div class="art t-fame"><div class="art-ic">${ic('swap', 150)}</div><div class="art-av">${persona(s.agent ? 'menajer' : 'baskan')}</div><span class="art-n">${kind === 'kis' ? tt('Devre arası') : tt('Yaz dönemi')}</span></div>`,
      t: expired ? tt('Sözleşmen bitti') : tt('Masanda teklif var'),
      opts: [...offers.map(o => ({ t: G.club(o.id).n, i: o.loan ? 'clock' : o.renew ? 'pen' : o.st === 'red' ? 'lock' : 'swap', s: `${o.loan ? tt('Kiralık') : o.renew ? tt('Yenileme') : o.fee ? tt('Bonservis ') + G.fmtS(o.fee) : tt('Serbest')} · ${ROLE[o.role]} · ${o.wage ? G.fmtS(o.wage) + tt('/hf') : tt('amatör')}${o.st === 'red' ? tt(' · kulübün reddetti') : ''}` })), ...(expired ? [] : [{ t: tt('Kulübümde kalıyorum'), c: 'ghost' }])],
    });
    if (i >= offers.length) return;
    const o = offers[i], red = o.st === 'red';
    const j = await dialog({
      art: clubArt(o.id, offerSub(o.id)), k: o.loan ? tt('Kiralık teklif') : o.renew ? tt('Yenileme') : tt('Transfer teklifi'), body: offerHTML(o) + (o.renew ? '' : cmpHTML(G.moveInfo(o))),
      opts: [red ? { t: tt('Transfer isteği ver'), s: tt('Kulübü zorla: hoca ve taraftar tepki gösterir'), i: 'alert', dis: o.pushed } : { t: tt('İmzala'), i: 'pen' }, { t: tt('Pazarlık yap'), s: tt('Ücreti %15 artırmayı dene'), i: 'coin', dis: o.neg || !o.wage || o.loan || red }, { t: tt('Geri dön'), c: 'ghost' }],
    });
    if (j === 0 && red) { const r = G.pushTransfer(o); if (r.ok) sfx.up(); else sfx.bad(); await dialog({ art: art('baskan', 'lock', 'risk'), t: r.ok ? tt('Kapı açıldı') : tt('Kulüp direniyor'), body: tt`<p>${esc(r.text)}</p>${chips(r.ch)}`, opts: [{ t: tt('Devam') }], auto: 0 }); continue; }
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(`${G.club(o.id).n}: ${o.loan ? tt('kiralık gidiyorsun') : tt('imza atıldı')}.`, 'pen'); if (!AUTO && !o.loan && !o.renew) await ivFlow('imza'); return; }
    if (j === 1) {
      const r = G.negotiate(o); await info(tt('Pazarlık'), r.text, '', clubArt(o.id, offerSub(o.id)));
      if (r.gone) { offers.splice(i, 1); if (!offers.length) { if (expired) offers = G.genOffers('serbest'); else return; } }
    }
  }
}

async function runMatch(fxt, rl, mode) {
  const s = G.S, M = G.buildMatch(fxt, rl), nat = M.nat; let sim = mode === 'sim' || AUTO; mSim = false;
  const usN = nat ? fxt.usN : G.club(s.clubId).n, opN = nat ? fxt.opp.n : G.club(fxt.opp).n, home = nat ? fxt.home !== false : fxt.home;
  const lbl = nat ? (fxt.name || tt('Milli maç')) + (fxt.round ? ' · ' + fxt.round : '') : fxt.cup ? `${fxt.name} · ${fxt.round}` : LMAP[fxt.lid].name;
  let capLine = '', pitch = null;
  if (!sim) await tip('mac');
  if (!sim && !nat && s.fl.kaptan && rl === '11') {
    const c = await dialog({ art: art('takim', 'crown', 'club'), k: tt('Kaptan konuşması'), t: tt('Tünelde son sözler'), body: tt('<p>Pazubent kolunda. Takım halkayı kurdu, gözler sende.</p>'), opts: G.CAPT.map(x => ({ t: x.t, s: x.s, i: x.i })), cls: 'ev' });
    capLine = G.capTalk(M, c);
  }
  const usC = nat ? crestSvg(usN, '#d81e2c', '#f2f2f2', 50) : crest(s.clubId, 50), opC = nat ? crestSvg(opN, '#3b4754', '#f2f2f2', 50) : crest(fxt.opp, 50);
  let feed, sc, mn, tlb;
  const taskChips = () => G.taskState(M).map(t => tt`<span class="tk ${t.ok ? 'ok' : ''}">${ic(t.ok ? 'check' : 'target', 13)}${t.t}${t.pr ? ' ' + t.pr : ''}</span>`).join('');
  if (!sim && M.tac) await dialog({
    art: art('hoca', TACT[M.tac].i, 'club'), k: tt('Soyunma odası'), t: TACT[M.tac].n,
    body: tt`<p><b>${esc(G.coach().n)}:</b> "${TACT[M.tac].d}"</p><div class="kv">${ic('target', 16)}<span>Bu sisteme uyumun</span><b>%${M.fit}</b></div><div class="kv">${ic(WX[M.wx][1], 16)}<span>${WX[M.wx][0]}: ${WX[M.wx][2]}</span></div>${M.tasks.length ? tt`<div class="sub">${ic('whistle', 16)}Hocanın senden istediği</div>${G.taskState(M).map(t => tt`<div class="pc">${ic('target', 14)}<span>${t.t}</span></div>`).join('')}<p class="mut sm">Görevler hoca güvenini belirler; maçta karşına çıkacak anlar da bu plana göre şekillenir.</p>` : ''}`,
    opts: [{ t: tt('Sahaya çık'), i: 'ball' }], auto: 0, cls: 'ev',
  });
  if (!AUTO) {
    V.scr = 'match'; app.dataset.scr = 'match';
    app.innerHTML = tt`<div class="match${euCls(fxt)}">
      <div class="m-h">${fxt.eu ? tt`<span class="eut">${euLogo(fxt.eu, 26)}${esc(fxt.name)} · ${fxt.round}</span>` : tag(lbl, fxt.cup || nat ? 'ye' : '')}${sim ? tt('<span class="where">simülasyon</span>') : tt('<button class="chip sm" data-a="msim">Kalanı simüle et</button>')}</div>
      <div class="sb"><div class="tm">${home ? usC : opC}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${home ? opC : usC}<span>${esc(home ? opN : usN)}</span></div></div>
      ${fxt.agg ? tt`<div class="aggb">${ic('swap', 14)}İlk maç ${fxt.agg[0]}-${fxt.agg[1]} · tur için toplam skor geçerli</div>` : ''}
      <canvas id="pitch" class="pitch"></canvas>
      <div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
      ${M.tac ? tt`<div class="tacs">${ic('whistle', 16)}<b id="tcn">${TACT[M.tac].n}</b><div id="tks">${taskChips()}</div></div>` : ''}
      ${sim ? '' : tt`<div class="mctl"><div class="stam">${ic('bolt', 18)}<div class="bar"><i id="stb" style="width:${M.stam}%"></i></div><b id="stv">${Math.round(M.stam)}</b></div>
        <div class="seg">${[['d', tt('Defansif')], ['n', tt('Dengeli')], ['o', tt('Ofansif')]].map(([k, l]) => tt`<button class="${k === 'n' ? 'on' : ''}" data-a="mmode" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="mbt"><button class="chip sm" data-a="mcall">${ic('ball', 14)} Topu iste (2)</button>${M.crowd ? tt`<button class="chip sm" data-a="mcrowd">${ic('users', 14)} Tribünü coştur</button>` : ''}</div></div>`}
      <div id="feed" class="feed"></div></div>`;
    feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(); if (fxt.eu) sfx.anthem(); else sfx.whistle(1);
    const pc = nat ? '#d81e2c' : G.club(s.clubId).c1; let po = nat ? '#3b4754' : G.club(fxt.opp).c1; if (po === pc) po = nat ? '#f2f2f2' : G.club(fxt.opp).c2;
    pitch = new Pitch($('#pitch'), { cu: pc, co: po, me: rl === 'yedek' ? -1 : PSLOT[s.pos], flip: !home, wx: M.wx });
  }
  curM = M;
  const tkUpd = () => { const e = $('#tks'); if (e && M.tac) { e.innerHTML = taskChips(); $('#tcn').textContent = TACT[M.tac].n; } };
  const stamUpd = () => { const b = $('#stb'); if (!b) return; b.style.width = M.stam + '%'; b.parentElement.classList.toggle('low', M.stam < 30); $('#stv').textContent = Math.round(M.stam); };
  // gol sonrası VAR: us gol bizim mi, mine golü oyuncu mu attı
  const vr = async (us, mine, min) => {
    const v = G.varCheck(M, us); if (!v) return;
    put(min, tt('VAR incelemesi başladı...'), 'var', 'eye'); if (!AUTO) sfx.card(); await wait(1900);
    if (v.cancel) {
      if (us) { M.usG--; M.varAg = true; if (mine) { M.pg--; M.rt -= 1.1; } } else M.oppG--;
      put(min, tt`GOL İPTAL: ${v.why}.`, us ? 'b' : 'g', 'x'); if (!AUTO) { if (us) sfx.conceded(); else sfx.goal(); }
    } else put(min, tt('VAR kararı: gol geçerli.'), us ? 'g' : 'b', 'check');
  };
  const put = (min, txt, cls = '', icon = '') => { if (feed) feed.insertAdjacentHTML('afterbegin', tt`<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); if (!sim && !AUTO && cls && cls !== 'var') spiker.say(txt, cls === 'g'); };
  const mark = (min, cls) => { if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${cls}" style="left:${Math.min(100, min / 90 * 100)}%"></i>`); };
  const upd = min => { if (!sc) return; mn.textContent = min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, min / 90 * 100) + '%'; };
  const bump = () => { if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } };
  const wait = ms => sleep(sim ? Math.min(ms, 90) : ms);
  put(1, rl === 'yedek' ? tt('Maç başladı. Yedek kulübesindesin.') : tt('İlk düdük! Sahadasın.'), '', 'whistle');
  if (M.awayEu) put(1, tt('Deplasman tribünü ıslıkla karşıladı. Bu gece her top zor.'), '', 'users');
  if (M.wx !== 'acik') put(1, `${WX[M.wx][0]}: ${WX[M.wx][2]}`, '', WX[M.wx][1]);
  if (M.mark && rl !== 'yedek') { const d = G.duelOf(M.mark, fxt.opp); put(1, (s.pos === 'DF' || s.pos === 'KL' ? tt`Bugün karşında ${M.mark} var.` : tt`Seni bugün ${M.mark} tutuyor.`) + (d ? tt` Aranızdaki hesap: ${d[0]}-${d[1]}.` : ''), '', 'eye'); }
  if (capLine) put(1, capLine, 'm', 'crown');
  await wait(700);
  for (let i = 0; i < M.tl.length; i++) {
    if (mSim) sim = true;
    if (!sim && M.want && !M.red && !M.off) { M.want = 0; M.tl.splice(i, 0, { min: M.tl[i].min, t: 'mom', k: G.momPick(M) }); put(M.tl[i].min, tt('Elini kaldırdın, topu istedin.'), 'm', 'ball'); }
    const e = M.tl[i];
    if (!sim) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 1.3 : M.mode === 'd' ? .4 : .8) * (M.drain || 1)); stamUpd(); }
    upd(e.min); await wait(380);
    if (e.t === 'txt') {
      put(e.min, e.s); if (pitch) pitch.poss(G.chance(.5));
      if (e.s.includes(tt('Oyuna giriyorsun')) && pitch) pitch.me = PSLOT[s.pos];
      if (!sim && M.mode === 'o' && rl !== 'yedek' && !M.red && !M.off) {   // ofansif oyun: fazladan pozisyon, arkada boşluk
        if (G.chance(.22)) M.tl.splice(i + 1, 0, { min: e.min, t: 'mom', k: G.momPick(M) });
        else if (G.chance(.12)) M.tl.splice(i + 1, 0, { min: e.min, t: 'bg', us: false });
      }
    } else if (e.t === 'tac') {
      if (!M.red && !M.off) {   // hoca kenardan sistemi değiştirir
        const r = G.tacShift(M, e.min); put(e.min, r.line, 'm', 'whistle'); if (!sim) sfx.whistle(1);
        if (r.add.length) { const tail = M.tl.splice(i + 1); tail.push(...r.add); tail.sort((a, b) => a.min - b.min); M.tl.push(...tail); }
        tkUpd(); await wait(900);
      }
    } else if (e.t === 'bg' && !sim && M.mode === 'd' && G.chance(.3)) put(e.min, e.us ? tt('Geride bekliyorsunuz; atak sonuçsuz kaldı.') : tt('Kapalı savunma rakip atağı kesti.'), '', 'shield');
    else if (e.t === 'bg') {
      if (pitch) { pitch.attack(e.us); if (!sim) await wait(750); pitch.goal(e.us); }
      if (e.us) { M.usG++; const sn = !nat && s.sc[s.clubId] ? G.pick(s.sc[s.clubId])[0] : tt('Takım arkadaşın'); put(e.min, tt`GOL! ${sn}`, 'g', 'ball'); mark(e.min, 'g'); if (!sim) sfx.goal(); }
      else { M.oppG++; put(e.min, nat ? tt`${opN} golü buldu.` : tt`${G.sqName(fxt.opp, 'FV')} attı: ${opN} golü buldu.`, 'b', 'ball'); mark(e.min, 'b'); if (!sim) sfx.conceded(); }
      upd(e.min); bump(); await wait(560);
      await vr(e.us, false, e.min); upd(e.min); tkUpd();
    } else if (e.t === 'dec') {
      if (!sim && !M.red && !M.off) {
        const D = DEC[e.k], g0 = M.usG; if (e.k === 'ht') { M.stam = Math.min(100, M.stam + (G.perk('nefes') ? 25 : 12)); stamUpd(); }   // devre arası nefes
        const c = await dialog({ art: art(D.p, D.i, e.k === 'ht' ? 'club' : 'risk'), k: tt`${e.min}. dakika`, t: D.t, body: tt`<p>${esc(G.decText(M, e.k))}</p>`, opts: D.o.map((t, x) => ({ t, s: D.s[x] })), cls: 'ev' });
        const r = G.decide(M, e.k, c, e.min);
        r.lines.forEach(l => put(e.min, l.s, l.c || 'm', l.c === 'g' ? 'ball' : 'whistle'));
        if (M.usG > g0) { mark(e.min, 'g'); bump(); sfx.goal(); }
        if (r.add.length) { const tail = M.tl.splice(i + 1); tail.push(...r.add); tail.sort((a, b) => a.min - b.min); M.tl.push(...tail); }
        upd(e.min); await wait(600);
      }
    } else if (e.t === 'mom' && !M.red && !M.off) {
      let k = e.k, bonus = false;
      for (;;) {
        if (e.kader && !bonus) put(e.min, tt('KADER ANI: turun anahtarı senin ayağında.'), 'm', 'star');
        put(e.min, MOM[k].i, 'm', 'target'); if (pitch) pitch.focus(); await wait(sim ? 620 : 1100);
        let wall = null;
        if (k === 'duvar' && !sim) { const wc = await dialog({ art: art('takim', 'shield', 'club'), k: tt`${e.min}. dakika`, t: tt('Barajı kur'), body: tt('<p>Kaç kişi dizersen, vuruş ona göre gelir.</p>'), opts: [{ t: tt('Beş kişi'), s: tt('Düz vuruş kapanır; top köşeye, barajın üstünden gelir'), i: 'shield' }, { t: tt('Dört kişi'), s: tt('Dengeli'), i: 'users' }, { t: tt('Üç kişi'), s: tt('Topu iyi görürsün ama sert ve ortaya yakın gelir'), i: 'eye' }], cls: 'ev' }); wall = [[.88, 1.14], [.6, 1], [.3, .9]][wc]; }
        const g0 = M.usG, o0 = M.oppG, crowd = M.crowdOn; M.crowdOn = 0;
        if (!sim) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 8 : M.mode === 'd' ? 5 : 6) * (M.drain || 1)); stamUpd(); }
        const res = sim ? G.simMoment(k, M) : await playMini(k, M.oppR, `${e.min}' · ${e.kader ? tt('Kader anı') : MOM[k].n}`, { wall, wxh: WX[M.wx][4].includes(k) ? WX[M.wx][5] : 1, bonus, opp: nat ? null : fxt.opp, nat, focus: M.focus, crowd, big: M.big, adapt: M.adapt, tired: M.stam < 15 ? 1.3 : M.stam < 30 ? 1.15 : 1 });
        const r = G.applyMoment(M, k, res);
        r.lines.forEach(l => put(e.min, l.s, l.c || '', l.c === 'g' || l.c === 'b' ? 'ball' : ''));
        if (M.usG > g0) { mark(e.min, 'g me'); bump(); if (sim && !AUTO) sfx.goal(); if (pitch) pitch.goal(true); }
        if (M.oppG > o0) { mark(e.min, 'b'); bump(); if (!AUTO) sfx.conceded(); if (pitch) pitch.goal(false); }
        if (res.out === 'faul' && !AUTO) sfx.card();
        upd(e.min); tkUpd(); await wait(680);
        if (res.out === 'gol' && M.usG > g0) { await vr(true, true, e.min); upd(e.min); tkUpd(); }
        if (r.chain) { k = r.chain; bonus = true; continue; }
        break;
      }
    }
    // eleme maçında doksan dakika eşit: uzatmalar zaman çizgisine eklenir
    if (i === M.tl.length - 1 && !M.et && M.ko && M.usG + M.agg[0] === M.oppG + M.agg[1]) { put(90, tt('Doksan dakika yetmedi: uzatmalara gidiliyor!'), 'm', 'whistle'); if (!sim) sfx.whistle(2); await wait(900); M.tl.push(...G.extraTime(M)); }
  }
  upd(M.et ? 120 : 90);
  let pens = null;
  const tu = () => M.usG + M.agg[0], to = () => M.oppG + M.agg[1];
  if (M.ko && tu() === to()) {
    put(120, tt('Uzatmalar da yetmedi. Penaltılara gidiliyor!'), 'm', 'whistle'); await wait(800);
    const res = sim ? G.simMoment('penalti', M) : await playMini('penalti', M.oppR, tt('Seri penaltılar'), { opp: nat ? null : fxt.opp, nat });
    const scored = res.out === 'gol'; M.rt += scored ? 0.4 : -0.5;
    pens = G.chance(scored ? .68 : .35);
    put(90, scored ? tt('Penaltını gole çevirdin.') : tt('Penaltını kaçırdın.'), scored ? 'g' : 'b', 'ball');
    put(90, pens ? tt('Seriyi kazandınız, tur sizin!') : tt('Seri rakibin oldu.'), pens ? 'g' : 'b', 'trophy'); await wait(900);
  }
  put(90, tt('Son düdük.'), '', 'whistle'); if (!AUTO) { sfx.whistle(3); sfx.ambOff(); } await wait(800);
  if (M.stam < 15) M.risk = Math.max(M.risk || 1, 1.5);
  curM = null; if (pitch) pitch.stop(); spiker.stop();
  const rep = G.postMatch(M), win = M.ko ? tu() > to() || pens === true : M.usG > M.oppG;
  if (!AUTO && fxt.final && win) sfx.trophy();
  const rj = await dialog({
    art: tt`<div class="art res ${win ? 't-club' : M.usG < M.oppG || pens === false ? 't-risk' : 't-life'}"><div class="art-av">${avatar(s.look, nat ? '#d81e2c' : G.club(s.clubId).c1, nat ? '#f2f2f2' : G.club(s.clubId).c2)}</div><div class="rate ${rep.rt >= 7 ? 'hi' : rep.rt < 6 ? 'lo' : ''}"><b>${dec(rep.rt, 1)}</b><small>MAÇ NOTU</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? tt(' (pen.)') : ''}`, k: fxt.leg === 2 ? tt`Toplam ${tu()}-${to()} · ${win ? tt('tur sizin') : tt('elendiniz')}` : fxt.leg === 1 ? tt('İlk maç bitti · rövanş bekliyor') : '',
    body: tt`<div class="stts"><div class="stt">${ic('ball', 18)}<b>${M.pg}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${M.pa}</b><small>Asist</small></div><div class="stt">${ic('target', 18)}<b>${M.ok}/${M.mom}</b><small>An</small></div></div>${M.tasks.length ? tt`<div class="tkr">${G.taskState(M).map(t => tt`<span class="tk ${t.ok ? 'ok' : 'no'}">${ic(t.ok ? 'check' : 'x', 13)}${t.t}</span>`).join('')}</div>` : ''}${chips(rep.lines)}`,
    opts: [{ t: tt('Devam') }, { t: tt('Maç kartını paylaş'), s: tt('Sonucu görsel olarak kaydet ya da gönder'), i: 'phone', c: 'ghost' }], auto: 0,
  });
  if (rj === 1) { const cc = nat ? { c1: '#d81e2c' } : G.club(s.clubId); await shareCard({ c1: cc.c1, tag: tt(lbl).toLocaleUpperCase(LC), big: dec(rep.rt, 1), bigL: tt('MAÇ NOTU'), title: [`${home ? usN : opN} ${home ? M.usG : M.oppG}-${home ? M.oppG : M.usG}`, home ? opN : usN], sub: `${s.name} · ${POS[s.pos].n}`, stats: [[M.pg, tt('Gol')], [M.pa, tt('Asist')], [`${M.ok}/${M.mom}`, tt('An')]], text: tt`Toprak Saha: ${s.name}, maç notu ${dec(rep.rt, 1)}.` }); }
  if (!AUTO && !nat) {   // iyi maç, derbi, final ya da kötü gün: mikrofonlar uzanır
    const hot = rep.rt >= 7.8 || M.pg >= 2 || (fxt.final && win) || (M.derby && G.chance(.7)), cold = (rep.rt < 5.6 || M.red) && G.chance(.35);
    if (hot || cold || G.chance(.1)) await ivFlow('post', fxt, M);
  }
  if (nat) return { us: M.usG, opp: M.oppG, win: M.ko ? win : M.usG > M.oppG };
  return fxt.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.pg };
}

// Maç önü / maç sonu röportajı: duruma göre seçilen, tekrar etmeyen sorular
async function ivFlow(kind, fxt, M) {
  const qs = G.ivPick(kind, fxt, M, kind === 'pre' ? (G.chance(.4) ? 2 : 1) : 2), all = [];
  const ttl = kind === 'pre' ? tt('Maç önü röportajı') : kind === 'imza' ? tt('İmza töreni') : tt('Maç sonu röportajı');
  for (let n = 0; n < qs.length; n++) {
    const q = qs[n];
    const j = await dialog({ art: art('basin', 'mic', 'fame'), k: qs.length > 1 ? `${ttl} · ${n + 1}/${qs.length}` : ttl, t: q.q, opts: [...q.a.map(a => ({ t: a.t })), ...(n === 0 && kind !== 'imza' ? [{ t: tt('Konuşmadan geç'), s: tt('Basın bunu not eder'), c: 'ghost' }] : [])], cls: 'ev' });
    if (j >= q.a.length) { all.push(...G.fx({ basin: -4 })); break; }
    all.push(...G.ivAnswer(q.id, j, fxt));
  }
  if (all.length) toast(all.slice(0, 4).join(' · '), 'mic');
}

async function seasonFlow() {
  const s = G.S;
  // lig bitti: play-off ve play-out oynanır, kulübün içindeyse maçlar senin
  G.initPlayoffs();
  while (G.poPending()) {
    const f = G.poFixture(), rl = G.role(); let own = null;
    if (f && (rl === '11' || rl === 'yedek')) {
      const j = await dialog({ art: clubArt(f.opp, `${f.name} · ${f.round}`), k: f.po === 'out' ? 'Play-out' : 'Play-off', t: f.po === 'out' ? tt('Kaybeden küme düşer') : f.round === 'Final' ? tt('Kazanan üst ligde') : tt('Tek maç, uzatma yok'),
        body: tt`<p>${f.po === 'out' ? tt('Ligde kalmak için tek maç. Beraberlikte penaltılar.') : tt('Yükselme yolunda eleme maçı. Beraberlikte penaltılar.')}</p>`, opts: [{ t: tt('Maça çık'), i: 'ball' }, { t: tt('Simüle et'), c: 'ghost' }] });
      own = await runMatch(f, rl, j === 0 ? 'play' : 'sim');
    }
    G.poRound(own); G.save();
  }
  const r = G.seasonEnd(); G.save();
  await awardFlow(r);
  if (r.tro.length || r.moved === 1) sfx.trophy();
  await dialog({
    art: tt`<div class="art res t-fame"><div class="art-av">${me()}</div><div class="rate hi"><b>${r.pos}.</b><small>${esc(r.league)}</small></div></div>`,
    k: tt`${r.label} bitti`, t: tt`Şampiyon: ${r.champ}`,
    body: tt`<div class="stts"><div class="stt">${ic('shirt', 18)}<b>${r.st.apps}</b><small>Maç</small></div><div class="stt">${ic('ball', 18)}<b>${r.st.g}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${r.st.a}</b><small>Asist</small></div><div class="stt">${ic('star', 18)}<b>${r.st.apps ? dec(r.avg) : '–'}</b><small>Ort.</small></div></div>
      ${r.tro.length ? tt`<ul class="tro">${r.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul>` : ''}${chips(r.lines)}<p class="mut">Artık ${s.age} yaşındasın.</p>`,
    opts: [{ t: tt('Yeni sezon'), i: 'right' }], auto: 0,
  });
  await tourFlow();
  if (s.age >= 40) { await info(tt('Zaman doldu'), tt('Kırk yaşına geldin. Krampon asma vakti.')); return retireFlow(); }
  if (s.age >= 30) {
    const j = await dialog({ t: tt('Devam mı, veda mı?'), body: tt`<p>${s.age} yaşındasın. İstersen kramponları asabilirsin.</p>`, opts: [{ t: tt('Devam ediyorum'), i: 'right' }, { t: tt('Emekli ol'), c: 'ghost' }], auto: 0 });
    if (j === 1) return retireFlow();
  }
  const oi = await dialog({ art: art('ark', 'cal', 'life'), k: tt('Sezon arası'), t: tt('Tatili nasıl geçireceksin?'), opts: G.OFF.map(o => ({ t: o.t, s: o.s, i: o.i })), cls: 'ev' });
  const och = G.offseason(oi); if (och.length) toast(och.join(' · '), 'check');
  await transferWindow('yaz');
}

async function retireFlow(reason) {
  const s = G.S, r = G.retire(), t = r.t, c = G.club(s.clubId);
  const paths = [];
  if (s.at.zihin >= 65 || s.fl.kaptan || s.fl.uni) paths.push(['Antrenör', 'whistle', tt('Lisanslarını aldın. İlk işin, kariyerine başladığın ligde bir takım. Kenardan bağıran artık sensin.')]);
  if (s.fol >= 300000) paths.push([tt('Yorumcu'), 'mic', tt('Ekran seni sevdi. Her hafta milyonlar yorumunu bekliyor; eski takım arkadaşların ise tedirgin.')]);
  if (s.rep >= 45) paths.push([tt('Menajer'), 'pen', tt('Telefon rehberin servet değerinde. İlk müşterin, mahallenden çıkan on altı yaşında bir çocuk.')]);
  if (s.money >= 30000000) paths.push(['Kulüp başkanı', 'crown', tt`${s.prov} futboluna yatırım yaptın. Tesisler yenilendi; tribünler adını haykırıyor.`]);
  paths.push([tt('Halı saha işletmecisi'), 'ball', tt('Memlekette bir halı saha açtın. Duvarda formaların asılı; akşamları çocuklara şut çektiriyorsun.')]);
  const i = await dialog({ t: reason ? tt('Kariyerin sona erdi') : tt('Jübile'), body: tt`<p>${esc(reason || tt('Son maçında tribünler ayakta. Futboldan sonra ne yapacaksın?'))}</p>`, opts: paths.map(p => ({ t: p[0], i: p[1], s: p[0] === 'Antrenör' || p[0] === 'Kulüp başkanı' ? tt('Aynı dünyada kenardan devam edebilirsin') : '' })), auto: paths.length - 1 });
  sfx.trophy();
  if (paths[i][0] === 'Antrenör' || paths[i][0] === 'Kulüp başkanı') {
    const role = paths[i][0] === 'Antrenör' ? 'coach' : 'pres';
    const j = await dialog({ art: art(role === 'coach' ? 'hoca' : 'baskan', role === 'coach' ? 'whistle' : 'crown', 'club'), k: tt`Efsane puanın ${num(r.score)} · ${r.title}`, t: tt('Hikâye burada bitmek zorunda değil'), body: tt`<p>${role === 'coach' ? tt('Lisansların hazır. Aynı liglerde, aynı kulüplerle bu kez kenarda yer alabilirsin: taktik, idman, devre arası kararları senin.') : tt('Birikiminle bir kulübün başına geçebilirsin: bütçe, tesis, hoca ve transfer kararları senin.')}</p>`, opts: [{ t: tt('Kenarda devam et'), i: 'right' }, { t: tt('Kariyeri burada bitir'), c: 'ghost' }], auto: 1 });
    if (j === 0 && await mgrJobFlow(role)) return;
  }
  endHTML = tt`<div class="title end">${tag(tt('Kariyer özeti'))}
    <section class="hero big" style="--c1:${c.c1};--c2:${c.c2}"><div class="hero-l"><div class="ovr"><b>${s.peak}</b><span>ZİRVE</span></div><h2>${esc(s.name)}</h2><small>${s.hist.length} sezon</small><div class="rank">${r.title}</div></div><div class="hero-r">${avatar(s.look, c.c1, c.c2)}</div></section>
    <div class="rate hi wide"><b>${num(r.score)}</b><small>EFSANE PUANI</small></div>
    <div class="stts"><div class="stt">${ic('shirt', 18)}<b>${t.apps}</b><small>Maç</small></div><div class="stt">${ic('ball', 18)}<b>${t.g}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${t.a}</b><small>Asist</small></div><div class="stt">${ic('flag', 18)}<b>${s.car.caps}</b><small>Milli</small></div></div>
    ${s.tro.length ? tt`<div class="card">${tag(tt('Müze'), 'ye')}<ul class="tro">${s.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="card">${tag(paths[i][0])}<p>${paths[i][2]}</p></div>
    <p class="meta">${r.leg ? tt`Sonraki kariyere miras bonusu: +${r.leg}.` : ''}${s.fl.cocuk ? tt(' Çocuğun soyadını sahaya taşıyabilir.') : ''}</p>
    ${s.kid ? tt`<button class="cta" data-a="heir">${ic('right', 22)} ${esc(s.kid.n.split(' ')[0])} ile devam et</button><p class="note">${esc(s.kid.n)}, ${G.kidAge()} yaşında. On altısına geldiğinde aynı dünyada, aynı kulüplerle kendi kariyerine başlar.</p>` : ''}
    <button class="cta ${s.kid ? 'ghost' : ''}" data-a="new">Yeni kariyer</button><button class="cta ghost" data-a="card">Kariyer kartını paylaş</button><button class="link" data-a="title">Ana menü</button></div>`;
  cardData = { c1: c.c1, tag: r.title.toLocaleUpperCase(LC), big: String(s.peak), bigL: tt('ZİRVE GÜCÜ'), title: s.name.toLocaleUpperCase(LC).split(' ').slice(0, 2), sub: tt`${s.hist.length} sezon · efsane puanı ${num(r.score)}`, stats: [[t.apps, tt('Maç')], [t.g, tt('Gol')], [t.a, tt('Asist')], [s.tro.length, tt('Kupa')]], text: tt`Toprak Saha: ${s.name}, ${t.apps} maç, ${t.g} gol.` };
  heirW = s.kid ? JSON.parse(G.exportData()) : null;
  G.wipe(); V.scr = 'end'; render();
}

// ---------- sezon sonu ödül töreni ----------
async function awardFlow(r) {
  if (AUTO || !r.aw || !r.aw.length) return;
  const stage = (icon, lit) => tt`<div class="art awa ${lit ? 'lit' : ''}"><div class="spot"></div><div class="art-ic">${ic(icon, 130)}</div><span class="art-n">Ödül gecesi</span></div>`;
  const row = (n, cls = '') => tt`<div class="nom ${cls}">${n.c && G.club(n.c) ? crest(n.c, 34) : tt`<div class="avw sm">${persona('rakip', null, G.KW)}</div>`}<div><b>${esc(n.n)}</b><small>${esc(n.v || '')}</small></div>${cls.includes('win') ? ic('trophy', 24) : ''}</div>`;
  await dialog({ art: stage('trophy'), k: tt`${r.label} sezonu`, t: tt`${r.league} ödül töreni`, body: tt('<p>Salon dolu, ışıklar sahnede, zarflar sunucunun elinde.</p>'), opts: [{ t: tt('Törene geç'), i: 'star' }], cls: 'ev' });
  for (const a of r.aw) {
    await dialog({ art: stage(a.i), k: tt('Adaylar'), t: a.t, body: a.noms.map(n => row(n, n.me ? 'me' : '')).join(''), opts: [{ t: tt('Zarfı aç'), i: 'star' }], cls: 'ev' });
    const w = a.noms[a.win]; if (w.me) sfx.trophy(); else sfx.pop();
    await dialog({ art: stage(a.i, true), k: a.t, t: w.me ? tt('Kazanan sensin!') : tt('Ve kazanan...'), body: row(w, 'win' + (w.me ? ' me' : '')) + (w.me ? tt('<p>Salon ayakta. Kürsüye yürürken dizlerin titriyor.</p>') : a.noms.some(n => n.me) ? tt('<p>Alkışladın. Seneye o kürsü senin olabilir.</p>') : ''), opts: [{ t: tt('Devam') }], cls: 'ev' });
  }
  if (r.xi) { sfx.up(); await dialog({ art: stage('users', true), k: tt('Yılın 11\'i'), t: tt('Adın okundu'), body: tt`<p>Sezonun en iyi on bir oyuncusu sahneye çağrıldı. ${esc(POS[G.S.pos].n)} hattında senin adın var.</p>`, opts: [{ t: tt('Devam') }], cls: 'ev' }); }
}

// ---------- milli takım yaz turnuvası ----------
async function tourFlow() {
  const T = G.tourStart(); if (!T) return;
  const me = G.myNat(), nc = NATC[G.S.nat] || NATC.TR;
  const flag = sub => tt`<div class="art club" style="--c1:${nc[0]};--c2:${nc[1]}"><div class="art-cr">${crestSvg(me, nc[0], nc[1], 86)}</div><div class="art-t"><b>${esc(T.name)}</b><small>${esc(sub)}</small></div></div>`;
  const tbl = () => tt`<table class="tb lg nt">${G.tourTable().map((r, i) => tt`<tr class="${r.n === me ? 'me' : ''} ${i < 2 ? 'up' : ''}"><td>${i + 1}</td><td class="tn">${esc(r.n)}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>`;
  await dialog({ art: flag(tt('Final turnuvası')), k: tt('Yaz turnuvası'), t: T.me ? tt('Kadrodasın!') : tt`${me} finallerde`, body: tt`<p>Grup: ${T.grp.map(x => esc(tt(x))).join(', ')}.</p><p>${T.me ? tt('Milli takım hocası kadroyu açıkladı; adın listede. Valizini hazırla.') : tt('Bu kez kadroda yoksun. Maçları ekrandan izleyeceksin.')}</p>`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
  for (let f; (f = G.tourFixture());) {
    let own = null;
    if (T.me && G.S.inj <= 0) {
      const j = await dialog({ art: flag(f.round), k: f.round, t: `${me} - ${f.opp.n}`, body: tt`${f.kof ? '' : tbl()}<p>${f.kof ? tt('Tek maç. Beraberlikte penaltılar.') : tt('Grupta ilk iki çeyrek finale çıkar.')}</p>`, opts: [{ t: tt('Maça çık'), i: 'ball' }, { t: tt('Simüle et'), c: 'ghost' }] });
      own = await runMatch(f, G.S.car.caps > 3 ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
      if (!AUTO) { V.scr = 'hub'; render(); }
    }
    G.tourRound(own); G.save();
  }
  const L = G.S.nt.last; if (L.champ && !AUTO) sfx.trophy();
  await dialog({ art: flag(L.stage), k: L.name, t: L.champ ? tt('Şampiyon!') : tt`Yolun sonu: ${L.stage}`, body: L.res.map(([rd, o, a, b, w]) => tt`<div class="res"><span class="${w === 1 ? 'w' : ''}">${esc(me)}</span><b>${a} - ${b}<small>${rd}</small></b><span class="${w === 0 ? 'w' : ''}">${esc(o)}</span></div>`).join(''), opts: [{ t: tt('Devam') }], auto: 0 });
}

// ---------- kenar modu: antrenör ya da başkan ----------
const MGR = () => G.MACTS[G.S.mgr.role];
function mgrHero() {
  const s = G.S, I = G.mgrInfo(), c = G.club(s.clubId), nm = s.name.split(' ');
  return tt`<section class="hero mgr" style="--c1:${c.c1};--c2:${c.c2}"><div class="hero-l">
      <div class="ovr"><b>${Math.round(I.r)}</b><span>${I.role === 'coach' ? tt('T.D.') : tt('BŞK')}</span></div>
      <h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2>
      <small>${s.age} yaş · ${I.role === 'coach' ? tt('Teknik direktör') : 'Kulüp başkanı'} · ${I.pos}. sıra (hedef ${I.obj}.)</small></div>
    <div class="hero-r">${avatar({ ...s.look, band: 0, beard: G.KW ? 0 : s.look.beard || 1 }, '#1b1b1f', '#e9e4da')}<span class="hero-cr">${crest(s.clubId, 34)}</span></div></section>`;
}
function vMgrHome() {
  const s = G.S, I = G.mgrInfo(), fxt = G.fixture(), cf = G.sideFixture(), coachR = I.role === 'coach';
  const nx = sideNext(cf);
  const fs = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
  const acts = MGR().map(([k, n, d, i]) => { const c = G.mgrCost(k); return tt`<button class="act wide" data-a="mact" data-v="${k}" ${I.act || I.bud < c ? 'disabled' : ''}><span class="aic">${ic(i, 24)}</span><b>${n}</b><span class="efx"><i class="${c ? 'neg' : 'pos'}">${c ? ic('coin', 12) + '−' + G.fmtS(c).replace(G.curSym(), '') : esc(d)}</i></span></button>`; }).join('');
  const news = s.news.slice(0, 4).map(n => tt`<li><span class="nic">${ic(n.ic || 'news', 18)}</span><div>${esc(n.s)}<small>${n.w}</small></div></li>`).join('');
  return tt`${mgrHero()}
    <section class="gauges">${gauge(I.conf, 'heart', coachR ? tt('Yönetim') : tt('Kongre'), I.conf < 30 ? 'low' : 'mo')}${gauge((I.fit + 2) * 25, 'target', tt('Kadro uyumu'), 'ho')}${gauge(I.fac * 20, 'train', tt('Tesis'), 'en')}${gauge(G.clamp(100 - (I.pos - 1) / Math.max(1, I.size - 1) * 100, 0, 100), 'chart', tt`${I.pos}. sıra`, 'ta')}</section>
    ${cf ? fixCard(cf, true) : ''}
    ${fxt ? fixCard(fxt) : cf ? '' : tt`<section class="vsc off">${ic('cal', 26)}<div><b>Maçsız hafta</b><small>İdman ve planlama.</small></div></section>`}
    ${nx.map(([c, n, k]) => tt`<div class="cupn${k === 'cup' || k === 'xc' ? '' : ' eu-' + k}">${k === 'cup' || k === 'xc' ? ic('trophy', 16) : euLogo(k, 18)}<span>${esc(c.name)} · ${n.round} · ${n.week}. hafta · ${esc(G.club(n.opp).n)}</span></div>`).join('')}
    <section class="card">${tag(tt('Sistem'))}${coachR
      ? tt`<div class="tcs">${Object.keys(TACT).map(k => { const f = G.squadFit(k); return tt`<button class="tcx ${I.tac === k ? 'on' : ''}" data-a="mtac" data-v="${k}">${ic(TACT[k].i, 18)}<b>${TACT[k].n}</b><em class="${f > 0 ? 'hi' : f < 0 ? 'lo' : ''}">${fs(f)}</em></button>`; }).join('')}</div><p class="note">Sayı, yardımcı antrenörün raporu: bu kadro o sisteme ne kadar yatkın. Kadro her sezon değişir.</p>
         <div class="sub">${ic('train', 16)}İdman ağırlığı</div><div class="seg">${Object.keys(G.MTR).map(k => tt`<button class="${I.tr === k ? 'on' : ''}" data-a="mtr" data-v="${k}">${G.MTR[k][0]}</button>`).join('')}</div><p class="note">${G.MTR[I.tr][1]}.</p>`
      : tt`<div class="stn st-acik">${ic('whistle', 16)}<span>Hoca <b>${esc(I.coach)}</b> · ${TACT[I.tac].n}<small>Kadro uyumu ${fs(I.fit)}. Sistemi beğenmiyorsan hocayı değiştirebilirsin.</small></span></div>`}</section>
    <section><div class="sh"><h4>Bu haftanın hamlesi</h4><div class="dots"><i class="${I.act ? 'u' : ''}"></i></div></div><div class="acts">${acts}</div></section>
    <section><div class="sh"><h4>Gündem</h4></div><ul class="news">${news}</ul></section>
    <div class="dock"><button class="cta" data-a="go">${fxt || cf ? tt('Maç günü') : tt('Haftayı bitir')} ${ic('right', 22)}</button></div>`;
}
function vMgrClub() {
  const s = G.S, m = s.mgr, t = G.tot();
  const hist = m.hist.slice().reverse().map(h => tt`<tr><td>${h.y}</td><td>${esc(h.c)}<small>${h.l}</small></td><td>${h.pos}.</td><td>${h.obj}.</td></tr>`).join('');
  return tt`${mgrHero()}
    <section class="card">${tag(tt('Kenar kariyeri'))}<div class="stts"><div class="stt">${ic('cal', 18)}<b>${m.hist.length}</b><small>Sezon</small></div><div class="stt">${ic('shield', 18)}<b>${m.jobs}</b><small>Kulüp</small></div><div class="stt">${ic('trophy', 18)}<b>${s.tro.filter(x => /teknik direktör|başkan|Teknik Direktörü/.test(x)).length}</b><small>Kupa</small></div><div class="stt">${ic('coin', 18)}<b>${G.fmtS(m.bud).replace(G.curSym(), '')}</b><small>Bütçe</small></div></div>
      <div class="kv">${ic('ball', 16)}<span>Futbolculuk</span><b>${t.apps} maç · ${t.g} gol · ${s.car.caps} milli</b></div></section>
    ${hist ? tt`<section class="card">${tag(tt('Sezonlar'))}<table class="tb hist"><tr><th>Sezon</th><th>Kulüp</th><th>Sıra</th><th>Hedef</th></tr>${hist}</table></section>` : ''}
    ${s.tro.length ? tt`<section class="card">${tag(tt('Müze'), 'ye')}<ul class="tro">${s.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></section>` : ''}
    <section class="card">${tag(tt('Kulüp efsaneleri'), 'ye')}${legHTML(s.clubId)}</section>
    <button class="opt sm" data-a="club" data-v="${s.clubId}">${ic('shield', 20)}<span><b>Kulüp profili</b></span></button>`;
}
async function mgrJobFlow(role, lower) {
  const offers = G.mgrOffers(role, lower);
  if (!offers.length) { await info(tt('Kapı açan yok'), role === 'pres' ? tt('Birikimin şu an hiçbir kulübün başına geçmeye yetmiyor.') : tt('Şu an seni isteyen bir kulüp çıkmadı.')); return false; }
  const i = await dialog({
    art: art(role === 'coach' ? 'baskan' : 'fed', role === 'coach' ? 'whistle' : 'crown', 'club'), k: role === 'coach' ? tt('Teknik direktörlük') : tt('Başkanlık'), t: tt('Hangi kulüp?'),
    opts: [...offers.map(o => ({ t: G.club(o.id).n, s: `${offerSub(o.id)}${o.old ? tt(' · eski kulübün') : ''} · ${role === 'coach' ? G.fmtS(o.wage) + tt('/hf') : tt('bedel ') + G.fmtS(o.price)}`, i: role === 'coach' ? 'whistle' : 'crown' })), { t: tt('Vazgeç'), c: 'ghost' }], auto: 0,
  });
  if (i >= offers.length) return false;
  G.mgrStart(role, offers[i]); sfx.sign();
  V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'ayar', kv: 'pro' };
  if (!AUTO) { render(); window.scrollTo(0, 0); toast(tt`${G.club(offers[i].id).n}: göreve başladın.`, 'pen'); }
  return true;
}
// Kenardan izlenen maç: goller canlı sahada, devre arasında hocanın kararı
async function mgrMatchFlow(f) {
  const s = G.S, coachR = s.mgr.role === 'coach', M = G.mgrMatch(f), home = f.home || !!f.final, usN = G.club(s.clubId).n, opN = G.club(f.opp).n; let sim = AUTO, pitch = null, feed, sc, mn, tlb;
  const lbl = f.cup ? `${f.name} · ${f.round}` : LMAP[f.lid].name;
  if (!AUTO) {
    const j = await dialog({
      art: f.eu ? tt`<div class="art euA eu-${f.eu}">${euLogo(f.eu, 96)}<div class="art-t"><b>${esc(opN)}</b><small>${esc(lbl)}</small></div></div>` : clubArt(f.opp, `${lbl} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}`), k: tt('Maç günü'),
      body: tt`<div class="tgrid"><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div><div>${ic('whistle', 16)}<small>Sistem</small><b>${TACT[G.coach().st].n}</b></div><div>${ic('heart', 16)}<small>Güven</small><b>${Math.round(s.mgr.conf)}</b></div></div>${f.agg ? tt`<div class="aggb">${ic('swap', 14)}İlk maç ${f.agg[0]}-${f.agg[1]}</div>` : ''}`,
      opts: [{ t: coachR ? tt('Kenara geç') : tt('Locaya çık'), s: tt('Maçı izle'), i: 'ball' }, { t: tt('Sonucu göster'), i: 'right' }],
    });
    sim = j === 1;
    V.scr = 'match'; app.dataset.scr = 'match';
    app.innerHTML = tt`<div class="match${euCls(f)}"><div class="m-h">${f.eu ? tt`<span class="eut">${euLogo(f.eu, 26)}${esc(lbl)}</span>` : tag(lbl, f.cup ? 'ye' : '')}<span class="where">${coachR ? tt('kenar') : tt('loca')}</span></div>
      <div class="sb"><div class="tm">${crest(home ? s.clubId : f.opp, 50)}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${crest(home ? f.opp : s.clubId, 50)}<span>${esc(home ? opN : usN)}</span></div></div>
      <canvas id="pitch" class="pitch"></canvas><div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
      <div class="tacs">${ic('whistle', 16)}<b>${TACT[G.coach().st].n}</b><div></div></div><div id="feed" class="feed"></div></div>`;
    feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(); if (f.eu) sfx.anthem(); else sfx.whistle(1);
    const pc = G.club(s.clubId).c1; let po = G.club(f.opp).c1; if (po === pc) po = G.club(f.opp).c2;
    pitch = new Pitch($('#pitch'), { cu: pc, co: po, flip: !home });
  }
  const wait = ms => sleep(sim ? Math.min(ms, 60) : ms);
  const put = (min, txt, cls = '', icon = '') => { if (feed) feed.insertAdjacentHTML('afterbegin', tt`<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); };
  const upd = min => { if (!sc) return; mn.textContent = min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, min / 90 * 100) + '%'; };
  const half = async (a, b) => {
    for (const e of M.tl.filter(x => x.min > a && x.min <= b)) {
      upd(e.min); if (pitch) { pitch.attack(e.us); await wait(800); pitch.goal(e.us); }
      if (e.us) { M.usG++; put(e.min, tt`GOL! ${s.sc[s.clubId] ? G.pick(s.sc[s.clubId])[0] : usN}`, 'g', 'ball'); if (!sim && !AUTO) sfx.goal(); } else { M.oppG++; put(e.min, tt`${opN} golü buldu.`, 'b', 'ball'); if (!sim && !AUTO) sfx.conceded(); }
      if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${e.us ? 'g' : 'b'}" style="left:${Math.min(100, e.min / 90 * 100)}%"></i>`);
      upd(e.min); await wait(900);
    }
  };
  put(1, tt('İlk düdük.'), '', 'whistle'); await wait(900);
  await half(0, 45); upd(45); put(45, tt('Devre arası.'), '', 'whistle'); await wait(600);
  let c = 1;
  if (coachR && !sim) c = await dialog({ art: art('takim', 'whistle', 'club'), k: tt('Devre arası'), t: M.usG > M.oppG ? tt('Öndesiniz') : M.usG < M.oppG ? tt('Geridesiniz') : tt('Beraberlik'), body: tt('<p>Soyunma odası seni bekliyor. İkinci yarı planı?</p>'), opts: G.MHT.map(x => ({ t: x[0], s: x[1] })), cls: 'ev' });
  else if (!coachR || sim) c = M.usG < M.oppG ? 0 : M.usG > M.oppG ? 2 : 1;
  G.mgrHalf(M, G.MHT[c][2], G.MHT[c][3], 45);
  if (coachR && !sim) put(46, tt`İkinci yarı planı: ${G.MHT[c][0].toLocaleLowerCase(LC)}.`, 'm', 'whistle');
  await half(45, 90); upd(90);
  if (M.ko && M.usG + M.agg[0] === M.oppG + M.agg[1]) { put(90, tt('Doksan dakika yetmedi: uzatmalar!'), 'm', 'whistle'); await wait(700); G.mgrHalf(M, 1, 1, 90, 30); await half(90, 120); upd(120); }
  const tu = M.usG + M.agg[0], to = M.oppG + M.agg[1]; let pens = null;
  if (M.ko && tu === to) { pens = G.chance(.5); put(90, pens ? tt('Penaltılarda gülen taraf sizsiniz!') : tt('Penaltılarda kaybettiniz.'), pens ? 'g' : 'b', 'trophy'); await wait(900); }
  put(90, tt('Son düdük.'), '', 'whistle'); if (!AUTO) { sfx.whistle(3); sfx.ambOff(); } await wait(700);
  if (pitch) pitch.stop();
  const win = M.ko ? tu > to || pens === true : M.usG > M.oppG, lines = G.mgrAfter(M, win);
  if (!AUTO && f.final && win) sfx.trophy();
  await dialog({
    art: tt`<div class="art res ${win ? 't-club' : M.usG < M.oppG || pens === false ? 't-risk' : 't-life'}"><div class="art-av">${avatar({ ...s.look, band: 0 }, '#1b1b1f', '#e9e4da')}</div><div class="rate ${win ? 'hi' : M.usG < M.oppG ? 'lo' : ''}"><b>${M.usG}-${M.oppG}</b><small>${win ? tt('GALİBİYET') : M.usG < M.oppG || pens === false ? tt('YENİLGİ') : tt('BERABERLİK')}</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? tt(' (pen.)') : ''}`, body: chips(lines), opts: [{ t: tt('Devam') }], auto: 0,
  });
  return f.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: 0 };
}
async function mgrWindow(title) {
  const s = G.S, list = G.mgrMarket(); let sold = false;
  for (;;) {
    const i = await dialog({
      art: art('scout', 'swap', 'fame'), k: title, t: tt('Transfer masası'), body: tt`<div class="kv">${ic('coin', 16)}<span>Bütçe</span><b>${G.fmtS(s.mgr.bud)}</b></div><div class="kv">${ic('shield', 16)}<span>Takım gücü</span><b>${dec(s.rt[s.clubId], 1)}</b></div>`,
      opts: [...list.map(t => ({ t: `${t.n} · ${t.pos}`, s: tt`${t.age} yaş · güce +${dec(t.plus, 1)} · ${G.fmtS(t.cost)}`, i: 'pen', dis: t.done || s.mgr.bud < t.cost })), { t: tt('Yıldızını sat'), s: tt('Bütçe artar, takım zayıflar, tribün kızar'), i: 'coin', dis: sold }, { t: tt('Masayı kapat'), c: 'ghost' }], auto: list.length + 1,
    });
    if (i > list.length) return;
    if (i === list.length) { const v = G.mgrSell(); sold = true; sfx.coin(); toast(tt`Satıldı: +${G.fmtS(v)}`, 'coin'); continue; }
    if (G.mgrBuy(list[i])) { list[i].done = true; sfx.sign(); toast(tt`${list[i].n} imzaladı.`, 'pen'); }
  }
}
function mgrFinish() {
  const s = G.S, r = G.mgrEnd(), c = G.club(s.clubId);
  endHTML = tt`<div class="title end">${tag(tt('Kenar kariyeri özeti'))}
    <section class="hero big" style="--c1:${c.c1};--c2:${c.c2}"><div class="hero-l"><div class="ovr"><b>${r.seasons}</b><span>SEZON</span></div><h2>${esc(s.name)}</h2><small>${r.role === 'coach' ? tt('Teknik direktör') : 'Kulüp başkanı'} · ${r.jobs} kulüp</small><div class="rank">${r.tro.length >= 3 ? tt('Kupa Avcısı') : r.tro.length ? 'Şampiyon' : r.seasons >= 6 ? tt('Emektar') : tt('Çırak')}</div></div><div class="hero-r">${avatar({ ...s.look, band: 0 }, '#1b1b1f', '#e9e4da')}</div></section>
    <div class="stts"><div class="stt">${ic('trophy', 18)}<b>${r.tro.length}</b><small>Kupa</small></div><div class="stt">${ic('chart', 18)}<b>${r.best || '–'}.</b><small>En iyi sıra</small></div><div class="stt">${ic('shirt', 18)}<b>${G.tot().apps}</b><small>Maç (oyuncu)</small></div><div class="stt">${ic('ball', 18)}<b>${G.tot().g}</b><small>Gol (oyuncu)</small></div></div>
    ${s.tro.length ? tt`<div class="card">${tag(tt('Müze'), 'ye')}<ul class="tro">${s.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <button class="cta" data-a="new">Yeni kariyer</button><button class="link" data-a="title">Ana menü</button></div>`;
  G.wipe(); V.scr = 'end'; render();
}
async function mgrSacked() {
  const s = G.S, role = s.mgr.role;
  sfx.bad();
  const j = await dialog({ art: art('baskan', 'alert', 'risk'), k: role === 'coach' ? tt('Yönetim kararı') : tt('Olağanüstü kongre'), t: role === 'coach' ? tt('Görevden alındın') : tt('Başkanlığı kaybettin'), body: tt`<p>${role === 'coach' ? tt('Güven tükendi. Yönetim sözleşmeni feshetti.') : tt('Üyeler sandıkta başka bir isme döndü.')}</p>`, opts: [{ t: tt('Yeni bir kulüp ara'), i: 'right' }, { t: tt('Kenar kariyerini bitir'), c: 'ghost' }], auto: 0 });
  if (j === 0 && await mgrJobFlow(role, true)) return;
  mgrFinish();
}
async function mgrSeasonFlow() {
  const s = G.S;
  G.initPlayoffs();
  while (G.poPending()) { const f = G.poFixture(); let own = null; if (f) own = await mgrMatchFlow(f); G.poRound(own); G.save(); }
  const r = G.seasonEnd(), ml = G.mgrSeason(r); G.save();
  await awardFlow(r);
  if (r.tro.length || r.moved === 1) sfx.trophy();
  await dialog({
    art: tt`<div class="art res t-fame"><div class="art-av">${avatar({ ...s.look, band: 0 }, '#1b1b1f', '#e9e4da')}</div><div class="rate hi"><b>${r.pos}.</b><small>${esc(r.league)}</small></div></div>`, k: tt`${r.label} bitti`, t: tt`Şampiyon: ${r.champ}`,
    body: tt`${r.tro.length ? tt`<ul class="tro">${r.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul>` : ''}${chips([...ml, ...r.lines])}<p class="mut">Yeni sezon hedefi: ${s.mgr.obj}. sıra.</p>`, opts: [{ t: tt('Yeni sezon'), i: 'right' }], auto: 0,
  });
  await tourFlow();
  if (s.age >= 70) { await info(tt('Zaman doldu'), tt('Yetmiş yaşına geldin. Kenardan da çekilme vakti.')); s.mgr.sacked = 0; mgrFinish(); return; }
  if (!s.mgr.sacked) await mgrWindow(tt('Yaz dönemi'));
}
async function mgrStep() {
  if (busy) return; busy = true;
  try {
    const s = G.S, wk = G.absWeek();
    if (s.fl.evw !== wk) {
      s.fl.evw = wk; const e = G.mgrEvent();
      if (e) { const j = await dialog({ art: art(e.p, e.i, 'club'), t: e.t, body: tt`<p>${esc(e.d)}</p>`, opts: e.o.map(o => ({ t: o[0], s: o[1] })), cls: 'ev' }); const ch = e.o[j][2](); if (!AUTO && ch.length) toast(ch.join(' · '), 'whistle'); G.save(); }
    }
    const cf = G.sideFixture(); let ownCup = null, own = null;
    if (cf) ownCup = await mgrMatchFlow(cf);
    const fxt = G.fixture(); if (fxt) own = await mgrMatchFlow(fxt);
    const r = G.endWeek(own, ...sideArgs(cf, ownCup)); G.save();
    if (s.week === 20) await mgrWindow(tt('Devre arası'));
    if (r.over) await mgrSeasonFlow();
    if (G.S && G.S.mgr && G.S.mgr.sacked) await mgrSacked();
    if (G.S) G.save();
  } finally {
    busy = false; sfx.ambOff();
    if (G.S) { V.scr = 'hub'; V.tab = 'ev'; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}

// Kariyerin başı: kulübünü deneme antrenmanlarıyla bulursun
const AYLAR = [tt('Haziran'), tt('Temmuz'), tt('Ağustos')];
async function startFlow() {
  const s = G.S, tried = []; let round = 0;
  await dialog({ art: art('baba', 'home', 'life'), k: tt('Haziran'), t: tt('Kulüp bulma zamanı'), body: tt('<p>On altı yaşındasın ve lisansın boşta. Sezon başlamadan seni kadrosuna katacak bir kulüp bulman gerek. Önce deneme antrenmanı; beğenirlerse teklif gelir, gerisi pazarlık.</p>'), opts: [{ t: tt('Hazırım'), i: 'ball' }], auto: 0, cls: 'ev' });
  for (;;) {
    let offers = [], adv = [], asked = false, signed = false;
    if (round >= 3) {
      const o = G.lastResort(tried); o.neg = true; offers = [o];
      await dialog({ art: art('baba', 'clock', 'life'), k: tt('Eylül'), t: tt('Sezon başlıyor'), body: tt`<p>Üç ay geçti, imza yok. Baban mahallenin takımıyla konuşmuş: <b>${esc(G.club(o.id).n)}</b> kapısını açıyor. Parlak değil ama sahaya çıkarsın.</p>`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
    } else {
      const list = G.trialClubs(tried);
      const i = await dialog({
        art: art('scout', 'target', 'fame'), k: tt`${AYLAR[round]} · deneme`, t: tt('Hangi kulübün denemesine gidiyorsun?'), body: tt('<p>Güçlü kulüp daha iyi tesis ve vitrin demek. Ama deneme zorlaşır, forma şansın azalır.</p>'),
        opts: list.map(c => ({ t: G.club(c.id).n, s: tt`${LMAP[c.lid].name} · güç ${Math.round(s.rt[c.id])} · ${c.d >= 4 ? tt('zor deneme') : c.d >= 0 ? tt('dengeli') : tt('rahat')} · ${TACT[G.coach(c.id).st].n}`, i: c.d >= 4 ? 'alert' : c.d >= 0 ? 'target' : 'check' })), cls: 'ev',
      });
      const c = list[i], m = { ...POS[s.pos].m }, tor = !!s.fl.torpil; tried.push(c.id);
      for (const k of ['penalti', 'frikik', 'rovesata', 'korner']) delete m[k];
      let ok = 0;
      for (let n = 0; n < 3; n++) {
        const k = G.wpick(m), r = AUTO ? G.simMoment(k, { oppR: s.rt[c.id] }) : await playMini(k, s.rt[c.id], tt`Deneme ${n + 1}/3 · ${MOM[k].n}`, { opp: c.id, focus: tor });
        if (G.GOOD.includes(r.out)) ok++;
      }
      offers = G.trialResult(c.id, ok);
      if (offers.length) sfx.up(); else sfx.bad();
      await dialog({
        art: clubArt(c.id, tt('Deneme antrenmanı')), k: tt`${ok}/3 başarılı`, t: offers.length > 1 ? tt('İki kulüp birden peşinde') : offers.length ? tt('Yönetim seninle görüşmek istiyor') : tt('Bu kez olmadı'),
        body: tt`<p>${offers.length > 1 ? tt`Tribünde ${esc(G.club(offers[1].id).n)} yöneticisi de vardı. İki teklif birden geldi.` : offers.length ? (tor ? tt('Araya giren tanıdığın işe yaradı; gerisini ayakların halletti.') : tt('Antrenman sonrası kulüp odasına çağrıldın.')) : tt('"Teşekkür ederiz, seni ararız." Aramayacaklarını ikiniz de biliyorsunuz.')}</p>`, opts: [{ t: tt('Devam') }], auto: 0,
      });
    }
    while (offers.length) {
      const i = await dialog({
        art: art('baba', 'pen', 'life'), k: tt('Teklifler'), t: tt('Masada ne var?'),
        opts: [...offers.map(o => ({ t: G.club(o.id).n, s: tt`${ROLE[o.role]} · ${o.wage ? G.fmtS(o.wage) + tt('/hf') : tt('amatör')} · imza ${G.fmtS(o.sign)}`, i: 'pen' })), { t: tt('Aileme danışayım'), s: tt('Annenle baban ne diyor?'), i: 'home', dis: asked }, ...(round < 3 ? [{ t: tt('Hiçbirini istemiyorum'), s: tt('Bir ay kulüpsüz kalır, yeniden denemeye hazırlanırsın'), c: 'ghost' }] : [])], auto: 0,
      });
      if (i === offers.length) {
        asked = true; adv = G.famAdvice(offers);
        for (const [p, t] of adv) await dialog({ art: art(p, 'home', 'life'), t: PERS[p].n, body: tt`<p>${esc(t)}</p>`, opts: [{ t: tt('Anladım') }], auto: 0, cls: 'ev' });
        continue;
      }
      if (i > offers.length) break;
      const o = offers[i], T = TACT[G.coach(o.id).st];
      const j = await dialog({
        art: clubArt(o.id, offerSub(o.id)), k: tt('İlk sözleşme'),
        body: tt`${offerHTML(o)}<div class="stn st-acik">${ic('whistle', 16)}<span>Hoca <b>${esc(G.coach(o.id).n)}</b> · ${T.n} · uyumun %${G.tacFit(o.id)}<small>${T.d}</small></span></div><div class="kv">${ic('train', 16)}<span>Tesisler</span><b>${stars(G.facOf(o.id))}</b></div>${adv.some(a => a[2] === o.id) ? tt`<p class="mut sm">${ic('home', 14)} Ailen bu kulübü önerdi.</p>` : ''}`,
        opts: [{ t: tt('İmzala'), i: 'pen' }, { t: tt('Forma sözü iste'), s: tt('Rolünü yükseltmeyi dene'), i: 'shirt', dis: !!o.neg || o.role === '11' }, { t: tt('İmza parasını artır'), s: tt('Tutmazsa teklif geri çekilebilir'), i: 'coin', dis: !!o.neg }, { t: tt('Geri dön'), c: 'ghost' }], auto: 0,
      });
      if (j === 0) { G.signFirst(o); if (adv.some(a => a[2] === o.id)) G.fx({ aile: 5 }); G.save(); signed = true; break; }
      if (j === 1 || j === 2) {
        const r = G.negFirst(o, j === 1 ? 'rol' : 'para'); if (r.gone) { sfx.bad(); offers.splice(i, 1); }
        await info(tt('Pazarlık'), r.text, '', clubArt(o.id, offerSub(o.id)));
      }
    }
    if (signed) break;
    round++;
    await dialog({ art: art('anne', 'cal', 'life'), k: AYLAR[Math.min(round, 2)], t: tt('Kulüpsüz bir ay'), body: tt('<p>İmza çıkmadı. Önünde boş bir ay var; nasıl geçireceğin bir sonraki denemeyi belirler. İki dönem, iki seçim.</p>'), opts: [{ t: tt('Planlayalım') }], auto: 0, cls: 'ev' });
    for (let h = 0; h < 2; h++) {
      const i = await dialog({ art: art('ark', 'cal', 'life'), k: h ? tt('Son iki hafta') : tt('İlk iki hafta'), t: tt('Ne yapacaksın?'), opts: FREE.map(f => ({ t: f.n, s: G.tl(f.s), i: f.i, dis: (!!f.cost && s.money < f.cost) || (f.id === 'tanidik' && !!s.fl.torpil) })), cls: 'ev' });
      const [t, ch] = G.freeMonth(FREE[i].id);
      await dialog({ art: art('ark', FREE[i].i, 'life'), t: FREE[i].n, body: tt`<p>${esc(t)}</p>${chips(ch)}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
    }
  }
  sfx.sign(); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'cev', kv: 'pro' };
  if (!AUTO) { render(); window.scrollTo(0, 0); toast(tt`${G.club(s.clubId).n} oyuncususun!`, 'pen'); await tip('hub'); }
}

// ---------- haftanın meydan okuması: herkes için aynı altı an ----------
const CKEY2 = 'toprak-saha-meydan';
function chalWeek() { const d = new Date(), t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), day = new Date(t).getUTCDay() || 7, th = t + (4 - day) * 864e5, y = new Date(th).getUTCFullYear(); return y + '-' + Math.ceil(((th - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); }
async function chalFlow() {
  const wk = chalWeek(); let h = 0; for (const ch of wk) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rng = () => { h = (h + 0x6D2B79F5) >>> 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pool = ['sut', 'kafa', 'frikik', 'penalti', 'pas', 'calim', 'savunma', 'orta', 'vole', 'kurtaris'], kinds = Array.from({ length: 6 }, () => pool[Math.floor(rng() * pool.length)]), q = .3 + rng() * .35;
  let best = 0; try { const b = JSON.parse(localStorage.getItem(CKEY2)); if (b && b.wk === wk) best = b.best; } catch (e) { /* yok */ }
  const j = await dialog({ art: tt`<div class="art t-fame"><div class="art-ic">${ic('bolt', 150)}</div><span class="art-n">Hafta ${wk.split('-')[1]}</span></div>`, k: tt('Meydan okuma'), t: tt('Altı an, tek deneme'), body: tt`<p>Bu hafta herkes aynı altı anı, aynı zorlukta oynuyor: ${kinds.map(k => MOM[k].n).join(', ')}.</p><p>Her başarı 100 puan, üst üste başarılar seri primi kazandırır.</p>${best ? tt`<div class="kv">${ic('trophy', 16)}<span>Bu haftaki rekorun</span><b>${best}</b></div>` : ''}`, opts: [{ t: tt('Başla'), i: 'ball' }, { t: tt('Vazgeç'), c: 'ghost' }] });
  if (j !== 0) return;
  if (!mini) mini = new Mini($mini.querySelector('canvas'));
  let score = 0, streak = 0, ok = 0;
  for (let i = 0; i < kinds.length; i++) {
    $mini.hidden = false; $mini.querySelector('.mh').textContent = `${i + 1}/6 · ${MOM[kinds[i]].n}`;
    const r = await mini.play(kinds[i], { skill: .55, speed: .55, oppQ: q, hard: 1, bonus: false, cu: '#ff6a2b', co: '#5a6470', pk: {} });
    $mini.hidden = true;
    if (G.GOOD.includes(r.out)) { ok++; streak++; score += 100 + (streak - 1) * 25; } else streak = 0;
  }
  const rec = score > best; if (rec) try { localStorage.setItem(CKEY2, JSON.stringify({ wk, best: score })); } catch (e) { /* yok */ }
  if (rec) sfx.trophy(); else sfx.pop();
  const txt = tt`Toprak Saha haftanın meydan okuması: ${score} puan (${ok}/6). https://keremkefli.github.io/toprak-saha/`;
  const k2 = await dialog({ art: tt`<div class="art res t-fame"><div class="art-av"></div><div class="rate hi"><b>${score}</b><small>PUAN · ${ok}/6</small></div></div>`, t: rec ? tt('Yeni rekor!') : tt('Bu kez olmadı'), body: tt`<p>${rec ? tt('Bu haftanın en iyi derecen.') : tt`Rekorun ${best}. Yeniden deneyebilirsin.`}</p>`, opts: [{ t: tt('Tamam') }, { t: tt('Skoru paylaş'), i: 'phone', c: 'ghost' }] });
  if (k2 === 1) { if (navigator.share) navigator.share({ text: txt }).catch(() => { /* vazgeçildi */ }); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast(tt('Skor panoya kopyalandı'), 'check')); }
}

async function nextStep() {
  if (G.S && G.S.mgr) return mgrStep();
  if (busy) return; busy = true;
  try {
    const s = G.S;
    const wk = G.absWeek();   // maç gününden geri dönülürse olay ve milli maç tekrar etmez
    if (s.fl.evw !== wk) { s.fl.evw = wk; const ev = pickEvent(); if (ev) await runEvent(ev); G.save(); }
    if (s.over) { await retireFlow(s.over); return; }
    const nf = s.fl.natw === wk ? null : G.natFixture();
    if (nf) {
      s.fl.natw = wk;
      const j = await dialog({ art: art('fed', 'flag', 'fame'), k: tt('Milli takım'), t: tt`${nf.usN} kadrosundasın`, body: tt`<p>${esc(nf.name)} · ${nf.home ? tt('iç saha') : tt('deplasman')}</p><p>Rakip: <b>${esc(nf.opp.n)}</b></p>`, opts: [{ t: tt('Maça çık'), i: 'ball' }, { t: tt('Simüle et'), c: 'ghost' }] });
      const nr = await runMatch(nf, s.car.caps > 3 || nf.lvl === 'U21' ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
      if (nf.q) G.natApply(nr ? { us: nr.us, opp: nr.opp } : null);
    }
    const rl = G.role(), can = (rl === '11' || rl === 'yedek') && !s.fl.skip;
    const pre = async (f, back) => {
      const rf = G.refInfo();
      const j = await dialog({
        art: f.eu ? tt`<div class="art euA eu-${f.eu}">${euLogo(f.eu, 96)}<div class="art-t"><b>${esc(G.club(f.opp).n)}</b><small>${esc(f.name)} · ${f.round} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}</small></div></div>` : clubArt(f.opp, `${f.cup ? f.name + ' · ' + f.round : LMAP[f.lid].name} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}`), k: f.eu ? tt('Avrupa gecesi') : tt('Maç günü'),
        body: tt`<div class="tgrid"><div>${ic('shirt', 16)}<small>Görevin</small><b>${ROLE[rl]}</b></div><div>${ic('bolt', 16)}<small>Enerji</small><b>${Math.round(s.en)}</b></div><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div></div><div class="stn st-${rf.cold ? 'kilit' : 'acik'}">${ic('whistle', 16)}Hakem <b>${esc(rf.n)}</b> · ${rf.style} · ${rf.att}</div><div class="stn">${ic(TACT[G.coach().st].i, 16)}Hoca <b>${esc(G.coach().n)}</b> · ${TACT[G.coach().st].n} · uyum %${G.tacFit()}</div>${s.adapt > 0 ? tt`<p class="warn">${ic('clock', 16)} Uyum sürecindesin (${s.adapt} hafta): anlar biraz zorlaşır.</p>` : ''}${s.en < 35 ? tt`<p class="warn">${ic('alert', 16)} Enerjin düşük: anlar zorlaşır, sakatlık riski artar.</p>` : ''}`,
        opts: [{ t: tt('Maça çık'), s: tt('Kilit anları sen oynarsın'), i: 'ball' }, { t: tt('Simüle et'), i: 'right' }, ...(back && s.diff !== 'gercek' ? [{ t: tt('Geri dön'), s: tt('Hafta harcanmaz'), c: 'ghost' }] : [])],
      });
      if (j === 2) return 'back';
      if (!AUTO && G.bigMatch(f) && G.chance(.6)) await ivFlow('pre', f);
      return runMatch(f, rl, j === 0 ? 'play' : 'sim');
    };
    const cf = G.sideFixture(); let ownCup = null, first = true;
    if (cf && can) { ownCup = await pre(cf, true); if (ownCup === 'back') return; first = false; }
    const fxt = G.fixture(); let own = null;
    if (fxt) {
      if (can && G.S.inj <= 0) { own = await pre(fxt, first); if (own === 'back') return; }
      else if (rl === 'yok') { s.bench++; G.fx({ mo: -3 }); toast(tt('Kadroya alınmadın.'), 'x'); }
    }
    const r = G.endWeek(own, ...sideArgs(cf, ownCup)); G.save();
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
    if (G.hasSave()) { const j = await dialog({ k: tt('Dikkat'), t: tt('Mevcut kariyer silinecek'), body: tt('<p>Yeni kariyer başlatırsan kayıtlı kariyerin kalıcı olarak silinir.</p>'), opts: [{ t: tt('Sil ve yeni başla'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }] }); if (j !== 0) return; }
    const m = G.meta();
    C = { name: m.heir ? ' ' + m.heir : '', pos: 'FV', foot: 'Sağ', prov: 'Sakarya', origin: 'mahalle', trait: 'hirsli', look: { skin: 1, hair: 0, hc: 0, beard: 0, band: 0 }, num: 9, nick: '', ht: 'orta', build: 'atletik', style: '0', cele: 'kayarak', diff: 'normal', gur: 'DE', w: 'e' };
    G.setWorld('e'); V.scr = 'create'; render(); window.scrollTo(0, 0);
  },
  set: v => {
    const [k, x] = v.split(':'); grab(); C[k] = x; if (k === 'pos') C.style = '0';
    if (k === 'w') { G.setWorld(x); C.look.beard = 0; C.look.hair = x === 'k' ? 8 : 0; }   // kariyer türü: ligler ve köken metinleri değişir
    render();
  },
  look: v => { const [k, x] = v.split(':'); grab(); C.look[k] = +x; render(); },
  theme: v => { try { localStorage.setItem(TKEY, v); } catch (e) { /* yok */ } render(); },
  mmode: (v, el) => { if (!curM) return; curM.mode = v; el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  mcall: (v, el) => { if (!curM || curM.calls <= 0 || curM.stam < 12 || curM.want) return; curM.calls--; curM.stam -= 12; curM.want = 1; el.innerHTML = tt`${ic('ball', 14)} Topu iste (${curM.calls})`; if (!curM.calls) el.disabled = true; },
  mcrowd: (v, el) => { if (!curM || !curM.crowd) return; curM.crowd = 0; curM.crowdOn = 1; el.disabled = true; sfx.goal(); G.fx({ taraf: 1 }); },
  start: async () => {
    if (busy) return;
    grab(); C.style = +C.style; C.name = (C.name || '').trim().replace(/\s+/g, ' ');
    if (C.name.length < 3) { toast(tt('Oyuncuna bir ad ver.'), 'alert'); $('#nm').focus(); return; }
    busy = true;
    try { G.wipe(); G.newCareer({ ...C, wait: true }); sfx.whistle(1); await startFlow(); }
    finally { busy = false; if (!G.S || !G.S.clubId) { V.scr = 'title'; render(); } }
  },
  club: async v => { if (busy || !$modal.hidden || !G.S || !G.club(v)) return; busy = true; try { await clubFlow(v); } finally { busy = false; } },
  kv: v => { V.kv = v; render(); },
  agent: v => { const r = G.setAgent(+v); if (!r) return; sfx.sign(); toast(r.fee ? tt`Menajer değişti. Tazminat: ${G.fmtS(r.fee)}` : tt('Menajerle el sıkıştınız'), 'pen'); G.save(); render(); },
  inv: v => { const stp = G.nice(Math.max(5000, G.S.money * .2)); if (G.invest(v, stp)) { sfx.coin(); toast(tt`${INV[v][0]}: ${G.fmtS(stp)} yatırıldı`, 'chart'); G.save(); render(); } },
  div: v => { const x = G.divest(v); if (x) { sfx.coin(); toast(tt`${INV[v][0]}: ${G.fmtS(x)} hesabına geçti`, 'coin'); G.save(); render(); } },
  spk: () => { spiker.toggle(); render(); },
  howto: async () => { if (busy) return; busy = true; try { await tip('hub', 1); await tip('mac', 1); await tip('transfer', 1); } finally { busy = false; } },
  kodal: async () => { try { const c = await packSave(); await navigator.clipboard.writeText(c); toast(tt`Kod panoya kopyalandı (${Math.round(c.length / 1024)} KB)`, 'check'); } catch (e) { toast(tt('Kopyalanamadı. Dosyaya aktarmayı dene.'), 'alert'); } },
  kod: async () => {
    if (busy) return; busy = true;
    try {
      const j = await dialog({ k: tt('Kodla yükle'), t: tt('Aktarım kodunu yapıştır'), body: tt('<p>Diğer cihazda Ayarlar > "Aktarım kodunu kopyala" ile aldığın kodu buraya yapıştır. Bu cihazdaki kayıtlı kariyerin üzerine yazılır.</p><textarea id="kodt" rows="5" placeholder="TS1...." autocomplete="off"></textarea>'), opts: [{ t: tt('Yükle'), i: 'down' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 });
      if (j !== 0) return;
      let ok = false; try { ok = G.importData(await unpackSave($('#kodt').value)); } catch (e) { ok = false; }
      if (ok) { V.scr = 'hub'; V.tab = 'ev'; render(); toast(tt('Kayıt yüklendi'), 'check'); } else toast(tt('Kod geçersiz ya da eksik'), 'alert');
    } finally { busy = false; }
  },
  chal: async () => { if (busy) return; busy = true; try { await chalFlow(); } finally { busy = false; $mini.hidden = true; } },
  card: () => { if (cardData) shareCard(cardData); },
  heir: () => {
    if (!heirW || !heirW.kid) return;
    C = { name: heirW.kid.n, pos: 'FV', foot: 'Sağ', prov: heirW.prov, origin: 'altyapi', trait: 'hirsli', look: { skin: heirW.look.skin, hair: 1, hc: heirW.look.hc, beard: 0, band: 0 }, num: 9, nick: '', ht: 'orta', build: 'atletik', style: '0', cele: 'kayarak', diff: heirW.diff || 'normal', gur: 'DE', world: heirW, w: heirW.w === 'k' ? 'k' : 'e' };
    G.setWorld(heirW.w); if (heirW.w === 'k') C.look.hair = 8;
    V.scr = 'create'; render(); window.scrollTo(0, 0);
  },
  mtac: v => { if (!G.S.mgr) return; G.mgrSetTac(v); G.save(); render(); },
  mtr: v => { if (!G.S.mgr) return; G.S.mgr.tr = v; G.save(); render(); },
  mact: async v => {
    if (busy || !G.S.mgr) return; const r = G.mgrAct(v); if (!r) return;
    busy = true; try { sfx.pop(); const a = MGR().find(x => x[0] === v); await dialog({ art: art(G.S.mgr.role === 'coach' ? 'takim' : 'baskan', a[3], 'club'), t: a[1], body: tt`<p>${esc(r[0])}</p>${chips(r[1])}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' }); } finally { busy = false; }
    G.save(); render();
  },
  mquit: async () => {
    if (busy || !G.S.mgr) return; busy = true;
    try { const j = await dialog({ k: tt('Dikkat'), t: tt('Kenar kariyeri bitsin mi?'), body: tt('<p>Özet ekranına geçilir ve kayıt silinir.</p>'), opts: [{ t: tt('Bitir'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 }); if (j === 0) mgrFinish(); } finally { busy = false; }
  },
  cur: v => { G.setCur(v); render(); },
  lang: v => {
    if (busy || v === lang) return;
    setLang(v);
    if (V.scr === 'hub' && G.S) { G.save(); try { sessionStorage.setItem(LDON, '1'); } catch (e) { /* yok */ } }   // oyundaysan yenilenince ayarlara dön
    location.reload();
  },
  mlook: v => { const [k, x] = v.split(':'); G.S.look[k] = +x; G.save(); render(); },
  mcele: v => { G.S.cele = v; G.save(); render(); },
  boost: v => { if (G.buyBoost(v)) { sfx.up(); toast(`${ATTR[v]} +1`, 'up'); G.save(); render(); } },
  prop: v => {
    if (busy || G.S.used >= G.slots() || !G.canPropose()) return;
    const [t, ok] = G.propose(v); if (ok) sfx.up(); else sfx.bad(); toast(t, ok ? 'eye' : 'x'); G.save(); render();
  },
  tab: v => { V.tab = v; render(); window.scrollTo(0, 0); },
  lv: v => { V.lv = v; render(); },
  tstat: v => { const ch = G.setStatus(v); if (ch.length) { sfx.bad(); toast(ch.join(' · '), 'alert'); } G.save(); render(); },
  act: async v => {
    if (busy || G.S.used >= G.slots()) return;
    if (v === 'train') { busy = true; try { await trainFlow(); } finally { busy = false; } return; }
    if (v === 'ark') { busy = true; try { await hangFlow(); } finally { busy = false; } return; }
    if (v === 'sosyal') { V.tab = 'sos'; render(); window.scrollTo(0, 0); return; }
    if (v === 'rehab') { busy = true; try { const r = await playMini('pas', G.OVR() - 6, tt('Rehabilitasyon · top çalışması')); const [t, ch] = G.rehab(r.out === 'ok'); toast(t + (ch.length ? ' ' + ch.join(' · ') : ''), 'heart'); G.save(); render(); } finally { busy = false; } return; }
    const [txt, ch] = G.act(v); if (v === 'job') sfx.coin(); toast(txt + (ch.length ? ' ' + ch.join(' · ') : ''), 'check'); G.save(); render();
  },
  go: () => nextStep(),
  hv: v => { V.hv = v; render(); },
  mate: async v => { if (busy || G.S.used >= G.slots()) return; busy = true; try { await mateFlow(+v); } finally { busy = false; } },
  netm: v => { if (busy || G.S.used >= G.slots()) return; const [t, ch] = G.netMeet(+v); toast(t + ' ' + ch.join(' · '), 'users'); G.save(); render(); },
  netf: async v => {
    if (busy) return; const c = G.S.net[+v], r = G.netFavor(+v); if (!r) return;
    busy = true; try { sfx.up(); await dialog({ art: art(NET[c.k].p, NET[c.k].i, c.k === 'golge' ? 'risk' : 'fame'), k: NET[c.k].f, t: c.n, body: tt`<p>${esc(r[0])}</p>${chips(r[1])}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' }); } finally { busy = false; }
    G.save(); render();
  },
  share: () => {
    const s = G.S, t = G.tot(), txt = tt`Toprak Saha: ${s.name}, ${s.age} yaş, ${G.club(s.clubId).n}. ${t.apps} maç, ${t.g} gol, ${t.a} asist. Genel ${G.OVR()}. https://keremkefli.github.io/toprak-saha/`;
    if (navigator.share) navigator.share({ text: txt }).catch(() => { /* vazgeçildi */ }); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast(tt('Özet panoya kopyalandı'), 'check'));
  },
  msim: (v, el) => { mSim = true; el.disabled = true; el.textContent = tt('Simüle ediliyor'); },
  ck: v => { V.ck = v; render(); },
  post: v => { if (busy || G.S.used >= G.slots()) return; const ch = G.post(v); sfx.pop(); toast(ch.join(' · '), 'phone'); G.save(); render(); },
  perk: v => { if (G.buyPerk(v)) { sfx.up(); toast(tt('Yetenek açıldı'), 'star'); G.save(); render(); } },
  dream: async () => { if (busy) return; busy = true; try { await dreamFlow(); } finally { busy = false; } },
  exp: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([G.exportData()], { type: 'application/json' })); a.download = 'toprak-saha-kayit.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(tt('Kayıt dosyası indirildi'), 'down'); },
  buy: v => { const had = G.has(v); G.buy(v); if (!had && G.has(v)) sfx.coin(); G.save(); render(); },
  send: () => { const a = G.nice(Math.max(1000, G.S.con.wage)); const ch = G.fx({ para: -a, aile: 12 }); toast(ch.join(' · '), 'heart'); G.save(); render(); },
};
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const f = ACT[t.dataset.a]; if (!f) return; if (t.dataset.a !== 'dlg') sfx.click(); f(t.dataset.v, t); });
document.addEventListener('change', e => {
  const t = e.target.closest('[data-c]'); if (!t) return;
  if (t.dataset.c === 'prov') C.prov = t.value;
  if (t.dataset.c === 'lig') { V.lig = t.value; render(); }
  if (t.dataset.c === 'mnum' && G.S) { G.S.num = G.clamp(Math.round(+t.value) || G.S.num, 1, 99); G.save(); render(); }
  if (t.dataset.c === 'mnick' && G.S) { G.S.nick = t.value.trim().slice(0, 18); G.save(); }
  if (t.dataset.c === 'imp' && t.files[0]) t.files[0].text().then(x => { if (G.importData(x)) { V.scr = 'hub'; V.tab = 'ev'; render(); toast(tt('Kayıt yüklendi'), 'check'); } else toast(tt('Bu dosya geçerli bir kayıt değil'), 'alert'); });
});

// Geliştirici aracı: n haftayı rastgele kararlarla hızlı oynatır.
window.__ts = { G, drawCard, chal: () => chalFlow(), heir: w => { heirW = w; ACT.heir(); }, mgr: role => mgrJobFlow(role), retire: () => retireFlow(), aw: r => awardFlow(r), tour: () => tourFlow(), rerender: () => render(), iv: (k, f, M) => ivFlow(k, f, M), club: id => clubFlow(id), start: async (o, auto = true) => { AUTO = auto; try { G.wipe(); G.newCareer({ ...o, wait: true }); await startFlow(); } finally { AUTO = false; render(); } }, auto: async n => { AUTO = true; try { for (let i = 0; i < n && G.S; i++) { if (G.S.mgr) { if (Math.random() < .5) G.mgrAct(G.pick(G.MACTS[G.S.mgr.role])[0]); await nextStep(); continue; } while (G.S.used < G.slots() && Math.random() < .8) { if (Math.random() < .5 && G.S.inj <= 0) await trainFlow(); else G.act(G.pick(['rest', 'aile', 'ark', 'rest'])); } if (Math.random() < .05) G.setStatus(G.pick(['mutlu', 'acik', 'kiralik'])); await nextStep(); } } finally { AUTO = false; busy = false; render(); } } };

// Ana ekrana eklenebilir uygulama: çevrimdışı açılış için hizmet işçisi
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* desteklenmiyor */ });

// Dil değişimi sonrası: oyundan geldiysen kaldığın yere (Ayarlar) dön
try { if (sessionStorage.getItem(LDON)) { sessionStorage.removeItem(LDON); if (G.load()) { V.scr = 'hub'; V.tab = 'hay'; V.hv = 'ayar'; } } } catch (e) { /* yok */ }
render();
