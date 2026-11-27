// Toprak Saha — arayüz ve oyun akışı
import { tt, lang, LC, NLOC, DSEP, LANGS, setLang } from './i18n.js';
import * as G from './core.js';
import { PITCH, LEAGUES, LMAP, POS, ATTR, ORIGINS, TRAITS, PROV, SHOP, YEREL, TRAIN, COUNTRIES, ROLE, MOM, TSTAT, STANCE, PERKS, HANG, POSTS, ACH, DEC, HT, BUILD, STYLES, CELE, NET, MACT, DIFF, TACT, PERKS2, FREE, NATN, NATC, WX, INV, SCN, MVAR, UPG, SESS, PTAG, SCENS, COLK, CAMP, NEGO, AGTOP, AGBR } from './data.js';
import { pickEvent, resolve } from './events.js';
import { Mini, Pitch, PSLOT, INTRO } from './mini.js';
import { StadView, GFX, fig, POSE, backdrop, lockerDraw, injuryDraw } from './scene.js';
import { ic, avatar, persona, crestSvg, radar, ring, PERS, SKIN, HAIRC, HAIRS, euLogo, trophySvg } from './art.js';
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
const me = (cls = '') => { const s = G.S, c = G.club(s.clubId); return tt`<div class="avw ${cls}">${avatar(s.look, c.c1, c.c2, lookX())}</div>`; };
const bar = (v, cls = '') => `<div class="bar ${cls}"><i style="width:${G.clamp(v, 0, 100)}%"></i></div>`;
const chips = a => a && a.length ? tt`<div class="chg">${a.map(x => tt`<span class="${x.includes('−') ? 'neg' : 'pos'}">${esc(x)}</span>`).join('')}</div>` : '';
const tag = (s, cls = '') => tt`<span class="tagk ${cls}">${esc(s)}</span>`;
const stars = n => tt`<span class="strs">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
const euCls = f => (f && f.eu ? ' eu-' + f.eu : '');
const cl = (id, inner, cls = '') => tt`<button class="cl ${cls}" data-a="club" data-v="${id}">${inner}</button>`;   // tıklanınca kulüp profili
function toast(s, icon = 'check') { $toast.innerHTML = ic(icon, 18) + tt`<span>${esc(s)}</span>`; $toast.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => $toast.classList.remove('on'), 2800); }

function dialog({ art = '', k = '', t = '', body = '', opts, auto, cls = '', grid = false, timer = 0, tdef = 0 }) {
  if (AUTO) { const en = opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return Promise.resolve(auto != null ? auto : en[Math.floor(Math.random() * en.length)]); }
  return new Promise(res => {
    dres = res; sfx.pop();
    $modal.innerHTML = tt`<div class="sheet ${cls}">${art}<div class="sh-in">${k ? tag(k) : ''}${t ? tt`<h3>${esc(t)}</h3>` : ''}<div class="mbody">${body}</div>${timer ? `<div class="tmr" style="--t:${timer}s"><i></i></div>` : ''}
      <div class="opts ${grid ? 'grid' : ''}">${opts.map((o, i) => tt`<button class="opt ${o.c || ''}" data-a="dlg" data-v="${i}" ${o.dis ? 'disabled' : ''}>${o.i ? ic(o.i, 20) : ''}<span><b>${esc(o.t)}</b>${o.s ? tt`<small>${esc(o.s)}</small>` : ''}</span></button>`).join('')}</div></div></div>`;
    $modal.hidden = false; $modal.scrollTop = 0;
    if (timer) setTimeout(() => { if (dres === res) { $modal.hidden = true; dres = null; res(tdef); } }, timer * 1000);   // süre dolunca varsayılan seçenek
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
  bootdeal: ['sponsor', 'shirt', 'fame'], bootshoot: ['sponsor', 'tag', 'fame'], lr_yeni: ['takim', 'users', 'club'], lr_klik: ['takim', 'alert', 'risk'], lr_patla: ['hoca', 'alert', 'risk'], oyuncu_antrenor: ['hoca', 'whistle', 'club'],
  g_kuraklik: ['basin', 'ball', 'risk'], g_seri: ['basin', 'ball', 'fame'], g_kotuseri: ['takim', 'alert', 'risk'], g_iyiseri: ['baskan', 'coin', 'club'], g_zirve: ['hoca', 'trophy', 'club'], g_dusme: ['taraftar', 'down', 'risk'],
  g_kontrat: ['menajer', 'pen', 'club'], g_parlak: ['scout', 'eye', 'fame'], g_dusukform: ['hoca', 'chart', 'risk'], g_kirmizi: ['takim', 'alert', 'risk'], g_donus: ['doktor', 'plus', 'med'], g_derbi: ['taraftar', 'bolt', 'fame'], g_cepbos: ['baba', 'coin', 'life'],
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

// Mevkiye özel eğitim: mevkinin anlarını birer kez dener; sonuç sayılmaz
const CTRL = { swipe: ['swap', tt('Kaydır')], tap: ['target', tt('Dokun')], drag: ['bolt', tt('Analog')] };
async function tutFlow(force) {
  const s = G.S; if (AUTO || !s || (!force && seen['tut_' + s.pos])) return;
  const ks = Object.entries(POS[s.pos].m).sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(k => INTRO[k]).slice(0, 6);
  const j = await dialog({ art: tt`<div class="art t-med"><div class="art-ic">${ic('train', 150)}</div><span class="art-n">${tt('Eğitim')}</span></div>`, k: POS[s.pos].n, t: tt('Mevkine özel eğitim'), body: `<p>${tt`Maçta sana gelecek ${ks.length} farklı anı birer kez dene. Sonuçlar kariyerine sayılmaz.`}</p><div class="tutl">${ks.map(k => `<span>${ic(CTRL[INTRO[k][3]][0], 14)}${INTRO[k][0]}</span>`).join('')}</div>`, opts: [{ t: tt('Eğitime başla'), i: 'right' }, { t: tt('Atla'), s: tt('Ayarlar > Nasıl oynanır içinden sonra açabilirsin'), c: 'ghost' }], cls: 'ev' });
  seen['tut_' + s.pos] = 1; try { localStorage.setItem(OKEY, JSON.stringify(seen)); } catch (e) { /* yok */ }
  if (j !== 0) return;
  let ok = 0;
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i], I = INTRO[k];
    const c = await dialog({ art: tt`<div class="art t-med"><div class="art-ic">${ic(CTRL[I[3]][0], 150)}</div><span class="art-n">${tt`Eğitim ${i + 1}/${ks.length}`}</span></div>`, k: CTRL[I[3]][1], t: I[0], body: `<p>${I[1]}</p>${I[2] ? `<p class="mut">${I[2]}</p>` : ''}`, opts: [{ t: tt('Dene'), i: 'ball' }, { t: tt('Eğitimi bitir'), c: 'ghost' }], cls: 'ev' });
    if (c !== 0) break;
    const r = await playMini(k, G.OVR() - 10, tt`Eğitim · ${I[0]} · ${i + 1}/${ks.length}`, { lh: .8 });
    if (G.GOOD.includes(r.out)) { ok++; toast(tt('Güzel! Maçta da böyle.'), 'check'); } else toast(tt('Olmadı. Maçta yine şansın olacak.'), 'alert');
  }
  if (ok) toast(tt`Eğitim bitti: ${ok}/${ks.length} başarılı.`, 'star');
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
// Dükkândaki küçük afiş önizlemesi (HTML; gerçek afiş maç günü çizilir)
function mdMini() {
  const s = G.S, c = G.club(s.clubId), nm = s.name.split(' ');
  return `<div class="mdm" style="--c1:${c.c1};--c2:${c.c2}" aria-hidden="true"><em>${tt('MAÇ GÜNÜ')}</em><b>${esc((nm.slice(0, -1).join(' ') || nm[0]).toLocaleUpperCase(LC))}<br>${esc((nm[nm.length - 1] || '').toLocaleUpperCase(LC))}</b><span class="mav">${avatar(s.look, c.c1, c.c2, { num: s.num })}</span><i>${esc(c.n.toLocaleUpperCase(LC))}</i></div>`;
}
// Backer Sport maç günü afişi: kulüp renkleri, oyuncu, rakip, logo
const svgImg = svg => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="720" height="720" ' + (svg.includes('xmlns=') ? '' : 'xmlns="http://www.w3.org/2000/svg" '))); });   // tek başına resim olarak açılması için xmlns gerekir
const BLG = Object.assign(new Image(), { src: 'img/backer.png' });
async function mdPoster(f) {
  const s = G.S, c = G.club(s.clubId), o = G.club(f.opp), L = LMAP[G.leagueOf(s.clubId)], cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350;
  const g = cv.getContext('2d'), F = (w, sz) => `${w} ${sz}px "Big Shoulders Display", "Arial Narrow", sans-serif`, nm = s.name.split(' ');
  try { await document.fonts.ready; } catch (e) { /* yok */ }
  g.fillStyle = '#0b0f14'; g.fillRect(0, 0, 1080, 1350);
  g.save(); g.translate(540, 520); g.rotate(-.18); g.fillStyle = c.c1; g.fillRect(-1000, -560, 2000, 820); g.fillStyle = 'rgba(0,0,0,.16)'; for (let x = -1000; x < 1000; x += 64) g.fillRect(x, -560, 30, 820); g.fillStyle = c.c2; g.fillRect(-1000, 250, 2000, 26); g.restore();
  const av = await svgImg(avatar(s.look, c.c1, c.c2, lookX({ num: s.num }))); if (av) g.drawImage(av, 380, 170, 760, 760);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = F(900, 46); const tag0 = tt('MAÇ GÜNÜ'), tw = g.measureText(tag0).width; g.fillStyle = '#ffd23f'; g.fillRect(64, 78, tw + 44, 64); g.fillStyle = '#14110e'; g.fillText(tag0, 86, 126);
  g.fillStyle = '#fff'; g.font = F(900, 150); g.fillText((nm.slice(0, -1).join(' ') || nm[0]).toLocaleUpperCase(LC), 60, 330, 640); g.fillText((nm.length > 1 ? nm[nm.length - 1] : '').toLocaleUpperCase(LC), 60, 470, 640);
  g.font = F(900, 220); g.globalAlpha = .9; g.fillText(String(s.num), 64, 700); g.globalAlpha = 1;
  g.fillStyle = 'rgba(11,15,20,.92)'; g.fillRect(0, 930, 1080, 420);
  g.fillStyle = '#a79b8e'; g.font = F(800, 40); g.fillText(`${(f.cup ? f.name : L.name).toLocaleUpperCase(LC)} · ${tt`${s.week}. hafta`.toLocaleUpperCase(LC)}`, 64, 1004, 950);
  g.fillStyle = '#f5efe4'; g.font = F(900, 92); g.fillText(c.n.toLocaleUpperCase(LC), 64, 1100, 950);
  g.fillStyle = o.c1 === '#14110e' ? o.c2 : o.c1; g.font = F(900, 60); g.fillText('VS', 64, 1176); g.fillStyle = '#f5efe4'; g.font = F(900, 70); g.fillText(o.n.toLocaleUpperCase(LC), 160, 1176, 860);
  g.fillStyle = '#a79b8e'; g.font = F(800, 36); g.fillText((f.home ? tt('İÇ SAHA') : tt('DEPLASMAN')), 64, 1230);
  if (BLG.complete && BLG.naturalWidth) { const h = 70, w = h * BLG.naturalWidth / BLG.naturalHeight; g.drawImage(BLG, 1080 - 64 - w, 1350 - 64 - h, w, h); }
  return cv;
}
async function backerFlow(f) {
  const gain = G.backerPost(f); if (!gain) return;
  const cv = await mdPoster(f), url = cv.toDataURL('image/jpeg', .86);
  const j = await dialog({ k: tt('Backer Sport'), t: tt('Maç günü afişin hazır'), body: `<img class="mdp" src="${url}" alt=""><p class="mut sm">${tt`Sosyal medyanda paylaşıldı: +${num(gain)} takipçi.`}</p>`, opts: [{ t: tt('Maça hazırlan'), i: 'right' }, { t: tt('Afişi kaydet ya da gönder'), i: 'phone', c: 'ghost' }], cls: 'ev mdd' });
  if (j === 1) { const blob = await new Promise(r => cv.toBlob(r, 'image/png')); if (blob) { try { const file = new File([blob], 'mac-gunu.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { return; } const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mac-gunu.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); } }
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
    ${slotRow()}
    <div class="tbtns">
      ${G.hasSave() ? tt`<button class="cta" data-a="cont">Devam et ${ic('right', 22)}</button>` : ''}
      <button class="cta ${G.hasSave() ? 'ghost' : ''}" data-a="new">Yeni kariyer</button>
    </div>
    ${m.n ? tt`<p class="meta">${ic('trophy', 16)} ${m.n} kariyer · en iyi ${num(m.best || 0)} puan${m.leg ? tt` · miras +${m.leg}` : ''}</p>` : ''}
    <button class="cta ghost chb" data-a="chal">${ic('bolt', 20)} Haftanın meydan okuması</button>
    <div class="tlinks"><label class="link imp">Kayıt dosyası yükle<input type="file" accept=".json,application/json" data-c="imp" hidden></label><button class="link" data-a="kod">Kodla yükle</button>${(G.hasSave() ? slotDelBtn() : '') + legalBtn()}</div>
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
    <label class="fld"><span>Ad Soyad</span><input id="nm" maxlength="24" value="${esc(C.name)}" placeholder="${C.w === 'k' ? tt('Örn. Elif Yılmaz') : tt('Örn. Emre Yılmaz')}" autocomplete="off"></label>
    <div class="fld"><span>Mevki</span><div class="chips">${Object.keys(POS).map(p => chip('pos', p, POS[p].n)).join('')}</div></div>
    <div class="fld"><span>Ayak</span><div class="chips">${['Sağ', 'Sol', 'Çift'].map(f => chip('foot', f, f)).join('')}</div></div>
    <div class="fld two"><label><span>Forma no</span><input id="nu" type="number" min="1" max="99" value="${C.num}" inputmode="numeric"></label><label><span>Lakap (isteğe bağlı)</span><input id="nk" maxlength="18" value="${esc(C.nick)}" placeholder="Örn. Gol Makinesi" autocomplete="off"></label></div>
    <div class="fld"><span>Boy</span><div class="chips">${Object.keys(HT).map(k => chip('ht', k, HT[k].n)).join('')}</div></div>
    <div class="fld"><span>Yapı</span><div class="chips">${Object.keys(BUILD).map(k => chip('build', k, BUILD[k].n)).join('')}</div></div>
    <div class="fld"><span>Oyun stili</span><div class="chips">${STYLES[C.pos].map((x, i) => chip('style', String(i), x.n)).join('')}</div></div>
    <div class="fld"><span>Gol sevinci</span><div class="chips">${Object.keys(CELE).map(k => chip('cele', k, CELE[k][0])).join('')}</div></div>
    ${scenFld()}
    <div class="fld"><span>Zorluk</span><div class="chips">${Object.keys(DIFF).map(k => chip('diff', k, DIFF[k][0])).join('')}</div></div>
    <label class="fld" ${C.world ? 'hidden' : ''}><span>Memleket</span><select data-c="prov">${Object.keys(PROV).sort((a, b) => a.localeCompare(b, 'tr')).map(p => tt`<option ${C.prov === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <div class="fld"><span>Köken</span>${Object.keys(ORIGINS).map(k => card('origin', k, ORIGINS[k], OIC[k])).join('')}</div>
    ${C.origin === 'gurbet' ? tt`<div class="fld"><span>Doğduğun ülke</span><div class="chips">${Object.keys(NATN).filter(k => k !== 'TR').map(k => chip('gur', k, NATN[k])).join('')}</div></div>` : ''}
    ${C.world ? tt`<p class="note">${ic('home', 14)} ${esc(C.world.name)} soyadını taşıyorsun. Aynı dünyada, aynı kulüplerle başlıyorsun; ${esc(C.world.prov)} amatör ligleri seni bekliyor.</p>` : ''}
    <div class="fld"><span>Karakter</span>${Object.keys(TRAITS).map(k => card('trait', k, TRAITS[k], TIC[k])).join('')}</div>
    ${C.sc && !C.world ? scenStartBtn() : tt`<button class="cta" data-a="start">Deneme antrenmanlarına çık ${ic('right', 22)}</button>
    <p class="mut sm">Kulübünü kendin bulacaksın: deneme, teklif, pazarlık.</p>`}
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
  const bz = G.isBiz() ? bizLbl(s.mgr.role) : null;
  return tt`<header class="top">${bz ? `<span class="bizc">${ic(bz[2], 24)}</span>` : crest(s.clubId, 40)}
    <div class="tc"><b>${esc(bz ? bz[1] : c.n)}</b><small>${bz ? esc(s.prov) : L.name} · Hafta ${s.week}/${G.WEEKS}${s.loan ? tt(' · kiralık') : ''}</small></div>
    <span class="pill">${ic('coin', 16)}${G.fmtS(s.mgr && !bz ? s.mgr.bud : s.money)}</span>
    <button class="icb" data-a="snd" aria-label="Ses">${ic(sfx.on ? 'vol' : 'mute', 20)}</button><i class="wkp" style="width:${Math.round(s.week / G.WEEKS * 100)}%"></i></header>`;
}
function roleText() {
  const s = G.S, r = G.role();
  if (r === 'sakat') return tt`Sakat · ${s.inj} hafta`;
  if (r === 'ceza') return tt`${s.banR || tt('Cezalı')} · ${s.ban} hafta`;
  return ROLE[r];
}
const formChips = () => { const r = G.S.lastR; return r.length ? r.map(x => tt`<i class="${x >= 7.5 ? 'hi' : x < 6 ? 'lo' : ''}">${dec(x, 1)}</i>`).join('') : tt('<em>henüz maç yok</em>'); };

// Oyuncu kartının altındaki dört gösterge (ana sayfa)
const sbar = (v, l, cls) => `<div class="hb ${cls}${v < 35 ? ' low' : ''}"><span>${l}<b>${Math.round(v)}</b></span><u><i style="width:${Math.round(v)}%"></i></u></div>`;
function hero(big, extra = '') {
  const s = G.S, c = G.club(s.clubId), nm = s.name.split(' ');
  return tt`<section class="hero ${big ? 'big' : ''}" style="--c1:${c.c1};--c2:${c.c2}">
    <div class="hero-l">
      <div class="ovr"><b>${G.OVR()}</b><span>${s.pos}</span><span class="no">${s.num}</span></div>
      <h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2>
      <small>${s.age} yaş · ${G.fmtS(G.value())}${s.fl.kaptan ? tt(' · kaptan') : ''}${G.youngRule() ? tt(' · yaşı küçük statüsü') : ''}${s.adapt > 0 ? tt` · uyum ${s.adapt} hf` : ''}</small>
      <div class="form">${formChips()}</div>
    </div>
    <div class="hero-r">${avatar(s.look, c.c1, c.c2, lookX({ num: s.num }))}<span class="hero-cr">${crest(s.clubId, 34)}</span></div>${extra}
  </section>`;
}
const gauge = (v, icon, l, cls = '') => tt`<div class="gg ${cls}">${ring(v, icon)}<b>${Math.round(v)}</b><small>${l}</small></div>`;

// Takımın ligdeki sırası: lig maçında sıra ve puan, kupada lig adı ve sıra
function rk(id, f) { const st = G.standing(id); if (!st) return ''; return `<small class="rk">${f.cup ? esc(st.lname) + ' · ' + tt`${st.pos}. sıra` : tt`${st.pos}. sıra` + ' · ' + tt`${st.pts} puan`}</small>`; }
function fixCard(f, cupF) {
  const s = G.S, r = s.mgr ? '11' : G.role(), o = G.club(f.opp), u = G.club(s.clubId), a = s.rt[s.clubId], b = s.rt[f.opp];
  return tt`<section class="vsc ${cupF ? 'cup' : ''}${euCls(f)}">
    <div class="vs-h"><span>${f.eu ? tt`<span class="eut">${euLogo(f.eu, 24)}${esc(f.name)} · ${f.round}</span>` : tag(cupF ? `${f.name} · ${f.round}` : LMAP[f.lid].name, cupF ? 'ye' : '')}${G.isDerby(s.clubId, f.opp) ? ' ' + tag(tt('Derbi'), 'ye') : ''}</span><span class="where">${ic(f.final ? 'trophy' : f.home ? 'home' : 'right', 14)}${f.final ? tt('Tarafsız saha') : f.home ? tt('İç saha') : tt('Deplasman')}</span></div>
    <div class="vs3">${cl(s.clubId, `${crest(s.clubId, 52)}<b>${esc(u.n)}</b>${rk(s.clubId, f)}`, 'side')}<div class="mid"><b>VS</b></div>${cl(f.opp, `${crest(f.opp, 52)}<b>${esc(o.n)}</b>${rk(f.opp, f)}`, 'side')}</div>
    <div class="pw"><i style="width:${(a / (a + b) * 100).toFixed(1)}%"></i></div>
    <div class="pwl"><span>${Math.round(a)}</span><span class="rolep ${r}">${s.mgr ? TACT[G.coach().st].n : roleText()}</span><span>${Math.round(b)}</span></div>${derbyLine(f)}
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
  return tt`${hero(false, `<div class="hbars">${sbar(s.en, tt('Enerji'), 'en')}${sbar(s.mo, tt('Moral'), 'mo')}${sbar(s.rel.hoca, tt('Hoca'), 'ho')}${sbar(s.rel.taraf, tt('Taraftar'), 'ta')}</div>`)}
    ${dailyCard()}${inboxCard()}<section class="wkact"><div class="sh"><h4>Bu hafta</h4><div class="dots">${dots}</div></div><div class="acts">${acts}</div></section>
    ${s.quest ? tt`<div class="quest ${s.quest.p >= s.quest.n ? 'ok' : ''}">${ic(s.quest.p >= s.quest.n ? 'check' : 'target', 18)}<span>Haftanın görevi: ${s.quest.t}</span><b>${Math.min(s.quest.p, s.quest.n)}/${s.quest.n}</b></div>` : ''}
    ${cf ? fixCard(cf, true) : ''}
    ${fxt ? fixCard(fxt) : cf ? '' : tt`<section class="vsc off">${ic('cal', 26)}<div><b>Maçsız hafta</b><small>${s.inj > 0 || s.ban > 0 ? roleText() : tt('Bir eylem hakkın fazla.')}</small></div></section>`}
    ${nx.map(([c, n, k]) => tt`<div class="cupn${k === 'cup' || k === 'xc' ? '' : ' eu-' + k}">${k === 'cup' || k === 'xc' ? ic('trophy', 16) : euLogo(k, 18)}<span>${esc(c.name)} · ${n.round} · ${n.week}. hafta · ${esc(G.club(n.opp).n)}</span></div>`).join('')}
    ${cl(s.clubId, tt`${ic('whistle', 18)}<span><b>${esc(co.n)}</b> · ${TACT[co.st].n}</span><em class="${fit >= 60 ? 'hi' : fit < 40 ? 'lo' : ''}">uyum %${fit}</em>`, 'coachs')}
    ${rv ? tt`<div class="coachs rvs">${ic('users', 18)}<span>Mevki rakibin <b>${esc(rv.n)}</b>${rv.inj ? tt` · sakat, ${rv.inj} hf` : ''}</span><em class="${rv.ahead ? 'hi' : 'lo'}">sen ${rv.me} · o ${rv.ovr}</em></div>` : ''}${healthWarn() + prefBar()}${scenCard()}
    ${gp ? tt`<section class="card sgc">${tag(tt('Sezon hedefleri'))}<div class="kv">${ic('target', 16)}<span>${gp.t}</span><b>${gp.cur}/${gp.n}</b></div>${bar(gp.cur / gp.n * 100, gp.cur >= gp.n ? 'mo' : 'hot')}<div class="kv">${ic('chart', 16)}<span>Takım: en az ${gp.team}. sıra</span><b class="${gp.pos > gp.team ? 'neg' : ''}">${gp.pos}.</b></div></section>` : ''}
    <section><div class="sh"><h4>Gündem</h4>${paperBtn()}</div><ul class="news">${news}</ul></section>
    <div class="dock"><button class="cta" data-a="go">${play ? tt('Maç günü') : tt('Haftayı bitir')}${left > 0 ? `<em class="hak">${tt`${left} hak kaldı`}</em>` : ''} ${ic('right', 22)}</button></div>`;
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
  <section class="card">${tag(tt('Menajer'))}<p class="note">${s.agent ? tt`Menajerin ${esc(s.agent.n)}. Değiştirirsen ${G.fmtS(G.agentList()[0].fee)} tazminat ödersin.` : tt('Menajerin yok. Menajer teklifleri ve ücretleri yükseltir, kendini önermeni sağlar.')}</p>${s.agent ? agBtn() : ''}
    ${G.agentList().map(a => tt`<div class="shop ${a.cur ? 'has' : ''}"><span class="avw sm">${agentAv(a.n)}</span><div><b>${esc(a.n)}</b><small>${esc(a.d)} Pay %${Math.round(a.cut * 100)}${a.rep ? tt` · itibar ${a.rep}+` : ''}</small></div>${a.cur ? tt`<span class="own">${ic('check', 16)}</span>` : tt`<button class="mini-b" data-a="agent" data-v="${a.i}" ${a.ok && s.money >= a.fee ? '' : 'disabled'}>${a.ok ? tt('Anlaş') : tt('Kilitli')}</button>`}</div>`).join('')}</section>`;
}

function dreamCard() {
  const d = G.dreamInfo(), o = G.OVR();
  if (!d) return tt`<section class="card">${tag(tt('Hedef takım'), 'ye')}<button class="opt sm" data-a="dream">${ic('heart', 20)}<span><b>Hedef takım seç</b></span></button></section>`;
  const c = G.club(d.id);
  return tt`<section class="card">${tag(tt('Hedef takım'), 'ye')}<div class="wt">${cl(d.id, crest(d.id, 46))}<div><b>${esc(c.n)}</b><small>${LMAP[G.leagueOf(d.id)].name} · ${d.mine ? tt('Hayalindeki formayı giyiyorsun') : d.w ? G.interest(d.w.lv) : o >= d.need ? tt('Seviyen yeterli, formunu koru') : tt`Gereken güç ${d.need} · sen ${o}`}</small>${bar(d.pct, 'hot')}</div></div><button class="link sm" data-a="dream">Hedefi değiştir</button></section>`;
}
const perkCard = () => devCard() + roleCard() + spCard() + perkCard0();
function perkCard0() {
  const s = G.S, list = PERKS.filter(p => p.no !== s.pos && (!p.only || p.only === s.pos)), tier = G.perkTier();
  const pk = p => { const own = G.perk(p.id); return tt`<button class="pk ${own ? 'own' : ''}" data-a="perk" data-v="${p.id}" ${own || s.pp < p.c ? 'disabled' : ''}>${ic(p.i, 22)}<b>${p.n}</b><small>${p.d}</small><i>${own ? tt('Açık') : p.c + tt(' puan')}</i></button>`; };
  const keys = Object.keys(POS[s.pos].w), bc = G.boostCost(), mx = G.boostMax();
  return tt`<section class="card">${tag(tt('Yetenekler'))}<div class="kv">${ic('star', 16)}<span>Yetenek puanı (iyi maçlarla dolar)</span><b>${s.pp}</b></div>${bar(s.px / 8 * 100, 'hot')}
    <div class="pks">${list.map(pk).join('')}</div>
    ${tier === 1 ? tt`<p class="mut sm lockn">${ic('lock', 14)} Hepsini açınca usta yetenekleri gelir.</p>` : tt`<div class="sub">${ic('crown', 16)}Usta yetenekleri</div><div class="pks t2">${PERKS2.map(pk).join('')}</div>`}
    ${tier === 2 ? tt`<p class="mut sm lockn">${ic('lock', 14)} Usta yetenekleri tamamlanınca ustalık açılır.</p>` : ''}
    ${tier === 3 ? tt`<div class="sub">${ic('up', 16)}Ustalık · ${bc} puana +1</div><div class="chips">${keys.map(k => tt`<button class="chip sm" data-a="boost" data-v="${k}" ${s.pp < bc || s.at[k] >= mx ? 'disabled' : ''}>${ATTR[k]} ${Math.round(s.at[k])}</button>`).join('')}</div><p class="mut sm">Her üç ustalıkta bedel bir puan artar. Üst sınır ${mx}.</p>` : ''}</section>`;
}
// Rozet duvarı: açılanlar önde, hangi sezon açıldığı altında; kilitliler sönük
function achCard() {
  const s = G.S, on = ACH.filter(([id]) => s.ach[id]), off = ACH.filter(([id]) => !s.ach[id]), pc = on.length / ACH.length * 100;
  return tt`<section class="card">${tag(tt('Rozet duvarı'), 'ye')}<div class="kv">${ic('star', 16)}<span>${on.length}/${ACH.length} rozet</span><b>%${Math.round(pc)}</b></div>${bar(pc, 'hot')}
    <div class="achs">${on.map(([id, n, i]) => `<div class="ach on">${ic(i, 22)}<small>${n}</small>${typeof s.ach[id] === 'string' ? `<em>${esc(s.ach[id])}</em>` : ''}</div>`).join('')}${off.map(([, n]) => `<div class="ach">${ic('lock', 16)}<small>${n}</small></div>`).join('')}</div></section>`;
}
// Günlük ödül: 7 günlük şerit, bugünkü ödül tek dokunuşla alınır
function dailyCard() {
  const D = G.daily(); if (!D || !D.ok) return '';
  const icn = r => r.para ? 'coin' : r.mo ? 'heart' : r.en ? 'bolt' : r.fol ? 'phone' : 'star';
  const lbl = r => r.para ? G.fmt(r.para) : r.mo ? tt`Moral +${r.mo}` : r.en ? tt`Enerji +${r.en}` : r.fol ? tt`+${r.fol} takipçi` : tt('+1 yetenek puanı');
  return tt`<section class="dly"><div class="sh"><h4>Günlük ödül</h4><small>${D.n > 1 ? tt`${D.n}. gün serisi` : tt('Her gün gel, seri büyüsün')}</small></div>
    <div class="dlyr">${D.all.map((r, j) => `<div class="dd ${j < D.i ? 'got' : j === D.i ? 'now' : ''}">${ic(j < D.i ? 'check' : icn(r), 15)}<small>${j + 1}</small></div>`).join('')}</div>
    <button class="btn dlyb" data-a="daily">${ic(icn(D.rew), 18)}<span>${tt('Al')} · ${lbl(D.rew)}</span></button></section>`;
}
// Kuşak rakibiyle karne: genel güç, son sezon ve kariyer toplamı yan yana
function rivCard() {
  const s = G.S, r = s.rival; if (!r) return '';
  const H = r.h || [], mh = s.hist, sum = (L, k) => L.reduce((t, x) => t + (x[k] || 0), 0), lm = mh[mh.length - 1], lr = H[H.length - 1], kl = s.pos === 'KL';
  const rows = [[tt('Genel'), G.OVR(), r.ovr]];
  if (lm && lr) rows.push([tt('Son sezon maç'), lm.apps, lr.apps], ...(kl ? [] : [[tt('Son sezon gol'), lm.g, lr.g]]), [tt('Son sezon ort.'), lm.avg, lr.avg]);
  if (H.length) rows.push(...(kl ? [] : [[tt('Kariyer golü'), sum(mh, 'g'), sum(H, 'g')]]), [tt('Kariyer asisti'), sum(mh, 'a'), sum(H, 'a')]);
  const v = x => (typeof x === 'number' && x % 1 ? dec(x) : x);
  const row = ([l, a, b]) => { const p = a + b > 0 ? a / (a + b) * 100 : 50; return `<div class="rvr"><b class="${a > b ? 'up' : ''}">${v(a)}</b><div><small>${l}</small><div class="rvb"><i style="width:${p}%"></i></div></div><b class="${b > a ? 'up' : ''}">${v(b)}</b></div>`; };
  const lead = rows.filter(([, a, b]) => a > b).length, lose = rows.filter(([, a, b]) => b > a).length;
  return tt`<section class="card rv">${tag(tt('Kuşak rakibin'))}<div class="rvh">${me('sm')}<div><b>${tt('Sen')}</b><small>${esc(G.club(s.clubId).n)}</small></div><em>VS</em><div class="r"><b>${esc(r.n)}</b><small>${esc(r.c)}</small></div><div class="avw sm">${persona('rakip', null, G.KW)}</div></div>
    ${rows.map(row).join('')}<p class="note">${!H.length ? tt('İlk sezon bitince karne burada yan yana gelir.') : lead > lose ? tt('Kıyasta öndesin; o da seni izliyor.') : lead < lose ? tt('Şimdilik o önde. Sezon uzun.') : tt('Başa baş gidiyorsunuz.')}</p></section>`;
}

// Piyasa profili: kulüpler seni nasıl görüyor, kimler isteyebilir
function profCard() {
  const s = G.S, P = G.profile(), a = s.agent, why = [tt`Gücün ${G.OVR()}.`];
  if (P.bench) why.push(tt('Forma giymiyorsun: piyasan düşüyor.')); else if (P.form >= 1) why.push(tt('Formun seni olduğundan iyi gösteriyor.')); else if (P.form <= -1) why.push(tt('Formun seni aşağı çekiyor.'));
  if (P.rank) why.push(tt`Gol krallığında ${P.rank}. sıradasın; üst kulüpler bunu görür.`);
  if (P.young >= 3) why.push(tt('Genç ve gelişmeye açıksın: üst ligler potansiyele para öder.'));
  why.push(a ? tt`Menajerin ${a.n} ulaşabildiğin üst sınırı ${Math.round(a.pw * 3)} puan yükseltiyor, ayda bir kapı çalıyor ve transfer döneminde masaya teklif getiriyor.` : tt('Menajerin yok: kulüpler seni yalnızca kendi scoutlarıyla bulur.'));
  if (!P.abroad) why.push(tt('Yurt dışı için itibar 40 gerekir; genç yetenek ya da gol kralıysan kapı daha erken açılır.'));
  if (P.form >= 1) why.push(tt('İyi oynarken senden zayıf kulüpler kapını çalmaz.'));
  return `<section class="card">${tag(tt('Piyasa profilin'), 'ye')}
    <div class="tgrid">
      <div>${ic('star', 16)}<small>${tt('Algın')}</small><b>${PTAG[P.tag]}</b></div>
      <div>${ic('chart', 16)}<small>${tt('Algılanan seviye')}</small><b>${Math.round(P.lvl)}</b></div>
      <div>${ic('shield', 16)}<small>${tt('Seni isteyebilecek kulüpler')}</small><b>${tt('güç')} ${Math.round(P.lo)}–${Math.round(P.hi)}</b></div>
      <div>${ic('globe', 16)}<small>${tt('Yurt dışı kapısı')}</small><b>${P.abroad ? tt('Açık', 'kapi') : tt('Kapalı', 'kapi')}</b></div>
    </div><p class="note">${why.join(' ')}</p></section>`;
}
// Gelişim: verim dökümü, sezon odağı, ücretli seanslar
function devCard() {
  const s = G.S, D = G.devInfo(), keys = Object.keys(POS[s.pos].w);
  const row = (i, l, v, sub) => `<div class="kv">${ic(i, 16)}<span>${l}${sub ? ` · ${sub}` : ''}</span><b class="${v < 1 ? 'neg' : ''}">×${dec(v, 2)}</b></div>`;
  const sess = SESS.map(x => { const c = G.sessCost(x), used = G.sessUsed(x.id); return `<div class="shop ${used ? 'has' : ''}"><span class="aic">${ic(x.i, 22)}</span><div><b>${x.n}</b><small>${x.d}</small></div>${used ? `<span class="own">${ic('check', 16)}</span>` : `<button class="mini-b" data-a="sess" data-v="${x.id}" ${s.money < c || (x.id === 'ozel' && s.inj > 0) ? 'disabled' : ''}>${G.fmtS(c)}</button>`}</div>`; }).join('');
  return `<section class="card">${tag(tt('Gelişim'))}
    ${row('cal', tt('Yaş'), D.age, tt`${s.age} yaş`)}${row('train', tt('Kulüp tesisleri'), D.fac)}${row('cart', tt('Kişisel imkânlar'), D.gear, tt('antrenör, spor salonu'))}${row('users', tt('Akıl hocası'), D.mentor ? 1.1 : 1, D.mentor ? esc(D.mentor.n) : tt('kaptan ya da kıdemliyle bağ 60+'))}${D.trait !== 1 ? row('bolt', tt('Karakter'), D.trait) : ''}
    <div class="kv tot">${ic('up', 16)}<span>${tt('Antrenman verimi')}</span><b>×${dec(D.total, 2)}</b></div>${healthRow()}
    <div class="sub">${ic('target', 16)}${tt('Sezon odağı')}</div><div class="chips">${[null, ...keys].map(k => `<button class="chip sm ${(D.focus || null) === k ? 'on' : ''}" data-a="dfocus" data-v="${k || ''}">${k ? ATTR[k] : tt('Dengeli')}</button>`).join('')}</div>
    <p class="note">${tt('Odak seçersen o özellik %50 hızlı, diğerleri %15 yavaş gelişir. Çıkış sezonu (23 yaş altı, 20 maç, 7,5 ortalama) potansiyelini yükseltir.')}</p>
    <div class="sub">${ic('coin', 16)}${tt('Ücretli seanslar · haftada birer kez, eylem hakkı harcamaz')}</div>${sess}</section>`;
}
// Mağazanın devamı: ikinci kademe kilidi ve kademeli yatırımlar
function shopExtra() {
  const s = G.S;
  const ups = UPG.filter(G.upOpen).map(u => { const lv = G.upLvl(u.id), c = G.upCost(u.id); return `<div class="shop ${lv ? 'has' : ''}"><span class="aic">${ic(u.i, 22)}</span><div><b>${u.n}${lv ? ` · ${tt('seviye')} ${lv}` : ''}</b><small>${G.tl(u.d)}</small></div>${lv >= u.max ? `<span class="own">${ic('check', 16)}</span>` : `<button class="mini-b" data-a="upg" data-v="${u.id}" ${s.money < c ? 'disabled' : ''}>${G.fmtS(c)}</button>`}</div>`; }).join('');
  return `${G.shopTier() >= 2 ? '' : `<p class="mut sm lockn">${ic('lock', 14)} ${tt('Kalıcı olan her şeyi alınca ikinci kademe açılır: müze, tekne, akademi, kulüp hissesi, yalı.')}</p>`}<div class="sub">${ic('up', 16)}${tt('Kademeli yatırımlar')}</div>${ups}${colHTML()}`;
}
function vTransfer() {
  const s = G.S, I = G.clubInfo(s.clubId), left = G.slots() - s.used, can = G.canPropose() && left > 0, T = TACT[I.tac];
  const mk = G.market().map(id => { const w = s.watch.find(x => x.id === id); return tt`<div class="mkr">${cl(id, tt`${crest(id, 34)}<div><b>${esc(G.club(id).n)}</b><small>${offerSub(id)} · uyum %${G.tacFit(id)}</small></div>`, 'wt')}<button class="mini-b" data-a="prop" data-v="${id}" ${can && !w ? '' : 'disabled'}>${w ? tt('İzliyor') : tt('Öner')}</button></div>`; }).join('');
  const moves = s.moves.slice().reverse().map(m => tt`<div class="kv">${ic(m.loan ? 'clock' : 'swap', 16)}<span>${m.y} · ${esc(G.club(m.from).n)} → ${esc(G.club(m.to).n)}</span><b>${m.loan ? tt('Kiralık') : m.fee ? G.fmtS(m.fee) : tt('Bedelsiz')}</b></div>`).join('');
  return offerDesk() + profCard() + tt`${transferCenter()}
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
  // mevkiye göre önem sırası: en önemli üçü yıldızlı; çubukta potansiyele kalan boşluk taralı
  const W = POS[s.pos].w, ord = [...keys].sort((x, y) => (W[y] || 0) - (W[x] || 0)), top = ord.filter(k => W[k]).slice(0, 3), pot = Math.max(s.pot, ...keys.map(k => s.at[k]));
  const attrs = ord.map(k => tt`<div class="at ${W[k] ? 'key' : ''}"><span>${top.includes(k) ? `<em class="ks">★</em>` : ''}${ATTR[k]}</span><u class="ab"><i style="width:${Math.min(100, s.at[k] / pot * 100).toFixed(1)}%"></i><s style="left:${Math.min(100, s.at[k] / pot * 100).toFixed(1)}%;width:${Math.max(0, (s.pot - s.at[k]) / pot * 100).toFixed(1)}%"></s></u><b>${Math.round(s.at[k])}</b></div>`).join('') + `<p class="mut sm atl"><em class="ks">★</em> ${tt('mevkin için en önemli')} · <s></s> ${tt('potansiyele kalan')}</p>`;
  const cur = s.st.apps ? dec(s.st.rs / s.st.apps) : '–', car = t.apps ? dec(t.rs / t.apps) : '–';
  const hist = s.hist.slice().reverse().map(h => tt`<tr><td>${h.y}</td><td>${esc(h.c)}${h.k ? ' (k)' : ''}<small>${h.l} · ${h.pos}.</small></td><td>${h.apps}</td><td>${h.g}</td><td>${h.a}</td><td>${h.avg ? dec(h.avg) : '–'}</td></tr>`).join('');
  const stat = (i, v, l) => tt`<div class="stt">${ic(i, 18)}<b>${v}</b><small>${l}</small></div>`;
  const kv = ['pro', 'tr', 'gec'].includes(V.kv) ? V.kv : 'pro';
  const seg = tt`<div class="seg">${[['pro', tt('Profil')], ['tr', 'Transfer'], ['gec', tt('Geçmiş')]].map(([k, l]) => tt`<button class="${kv === k ? 'on' : ''}" data-a="kv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (kv === 'tr') return `${hero(true)}${seg}${vTransfer()}`;
  if (kv === 'gec') return tt`${hero(true)}${seg}
    ${trophyRoom() + recCard()}${careerPath()}${statsCard()}
    ${achCard()}
    <section class="card">${tag(tt('Kulüp efsaneleri'), 'ye')}<div class="kv">${crest(s.clubId, 22)}<span>${esc(G.club(s.clubId).n)} · tüm zamanların golcüleri</span></div>${legHTML(s.clubId)}</section>
    ${hist ? tt`<section class="card">${tag(tt('Geçmiş'))}<table class="tb hist"><tr><th>Sezon</th><th>Kulüp</th><th>M</th><th>G</th><th>A</th><th>Ort.</th></tr>${hist}</table></section>` : tt('<p class="mut sm pad">İlk sezonun bitince burada görünür.</p>')}
    ${rivCard()}`;
  return tt`${hero(true)}${seg}
    <section class="card">${tag(tt('Özellikler'))}<div class="rad">${radar(keys.map(k => ({ l: ATTR[k].slice(0, 3).toLocaleUpperCase(LC), v: s.at[k] / Math.max(50, Math.max(...keys.map(x => s.at[x])) + 8) * 99 })))}<div class="ats">${attrs}</div></div>
      <p class="mut sm">${ic('star', 14)} Potansiyel: ${G.potText()} · ${ORIGINS[s.origin].n} · ${TRAITS[s.trait].n}</p></section>
    <section class="card">${tag(tt('Bu sezon'))}<div class="stts">${stat('shirt', s.st.apps, tt('Maç'))}${stat('ball', s.st.g, tt('Gol'))}${stat('swap', s.st.a, tt('Asist'))}${stat('star', cur, tt('Ort.'))}</div>
      <div class="kv"><span>Kariyer</span><b>${t.apps} maç · ${t.g} gol · ${t.a} asist · ${car}</b></div></section>
    ${ytCard()}${natCard()}
    ${perkCard()}`;
}

function natCard() {
  const s = G.S, I = G.ntInfo(), tb = G.ntTable(), me = G.myNat(), ok = G.natOk();
  return tt`<section class="card">${tag(tt('Milli takım'), 'ye')}<div class="kv">${ic('flag', 16)}<span>${I.year} ${I.name} elemeleri · ${I.md}/6</span><b>${s.car.caps} maç · ${s.car.ng} gol</b></div>
    <table class="tb lg nt">${tb.map((r, i) => tt`<tr class="${r.n === me ? 'me' : ''} ${i < 2 ? 'up' : ''}"><td>${i + 1}</td><td class="tn">${esc(r.n)}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
    <p class="note">${I.q === true ? tt('Bilet alındı: yazın final turnuvası var. ') : I.q === false ? tt('Bu turnuva kaçtı. ') : I.next ? tt`Sıradaki: ${esc(I.next.opp)} · ${I.next.week}. hafta · ${I.next.home ? tt('iç saha') : tt('deplasman')}. İlk iki finallere gider. ` : ''}${ok ? tt('A Milli kadrosundasın.') : tt`A Milli için güç 73 ve itibar 45 gerekir (sen ${G.OVR()} / ${Math.round(s.rep)}).`}</p>
    ${I.last ? tt`<div class="kv">${ic('trophy', 16)}<span>${esc(I.last.name)}</span><b>${esc(I.last.stage)}</b></div>` : ''}</section>`;
}
// Genç milli takım: yaş sınırının altındaysan ya da daha önce forma giydiysen görünür
function ytCard() {
  const s = G.S; if (!s.yt || (s.age > G.yAge() && !s.car.ycaps)) return '';
  const I = G.ntInfo('yt'), tb = G.ntTable('yt'), me = G.myNat(), ok = G.yOk(), nm = me + G.ySuf();
  const why = G.natOk() ? tt('A Milli kadrosunda olduğun için genç takıma çağrılmıyorsun.') : s.age > G.yAge() ? tt`Yaş sınırını geçtin (${G.yAge()}).` : ok ? tt`${nm} kadrosundasın.` : tt`Genç milli için güç ${G.KW ? Math.max(1, Math.round(G.natR(me) - 22)) : 50} gerekir (sen ${G.OVR()}).`;
  return tt`<section class="card">${tag(tt('Genç milli takım'), 'ye')}<div class="kv">${ic('flag', 16)}<span>${I.year} ${I.name} elemeleri · ${I.md}/6</span><b>${s.car.ycaps} maç · ${s.car.yng} gol</b></div>
    <table class="tb lg nt">${tb.map((r, i) => tt`<tr class="${r.n === me ? 'me' : ''} ${i < 2 ? 'up' : ''}"><td>${i + 1}</td><td class="tn">${esc(r.n)}${r.n === me ? esc(G.ySuf()) : ''}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
    <p class="note">${I.q === true ? tt('Bilet alındı: yazın final turnuvası var. ') : I.q === false ? tt('Bu turnuva kaçtı. ') : I.next ? tt`Sıradaki: ${esc(I.next.opp)} · ${I.next.week}. hafta · ${I.next.home ? tt('iç saha') : tt('deplasman')}. İlk iki finallere gider. ` : ''}${why}</p>
    ${I.last ? tt`<div class="kv">${ic('trophy', 16)}<span>${esc(I.last.name)}</span><b>${esc(I.last.stage)}</b></div>` : ''}</section>`;
}
// Kulübün tüm zamanların golcüleri; listede sen de varsan vurgulanır
function legHTML(id) {
  const R = G.legendRank(id);
  return `${R.list.slice(0, 6).map((x, i) => tt`<div class="lgd ${x.me ? 'me' : ''}"><i>${i + 1}</i><span>${esc(x.n)}${x.y ? tt`<small>${x.y}</small>` : tt('<small>bugün</small>')}</span><b>${x.g}</b><small>${x.apps} maç</small></div>`).join('')}${R.pos > 1 && R.pos < 99 ? tt`<p class="note">Bir üst sıra için ${R.next} gol daha.</p>` : R.pos === 1 ? tt('<p class="note">Kulüp tarihinin en golcü ismi sensin.</p>') : ''}`;
}

// Avrupa kupası sayfası: lig aşaması tablosu, eleme turları, katılım kuralları
const EUL = [['en1', 'İngiltere Ligi'], ['es1', 'İspanya Ligi'], ['it1', 'İtalya Ligi'], ['de1', 'Almanya Ligi'], ['fr1', 'Fransa Ligi'], ['nl1', 'Hollanda Ligi'], ['pt1', 'Portekiz Ligi'], ['tr1', 'Elit Lig']];
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
    ${G.KW ? tt`<section class="card">${tag(tt('Kim, nereden katılır?'))}<div class="eur hd k3"><span>Lig sırası</span><i class="z-cl">KL</i><i class="z-clq">Eleme</i><i class="z-el">Kıta K.</i></div>${rulesK}
      <p class="note">Kıta Ligi 18 takımlı: lig aşamasında altı maç, ilk 4 çeyrek finale, 5–12 play-off turuna. Elemeyi kaybeden yola Kıta Kupası'nda devam eder; orada final dahil her tur çift maçlıdır.</p></section>` : tt`<section class="card">${tag(tt('Kim, nereden katılır?'))}<div class="eur hd"><span>Lig sırası</span><i class="z-cl">KL</i><i class="z-clq">Eleme</i><i class="z-el">Kıta K.</i><i class="z-ko">Kalkan</i></div>${rules}
      <p class="note">Ülke kupası şampiyonu Kıta Kupası'na gider. <em class="plus1">+1</em>: geçen sezon Avrupa'da en başarılı iki ülkeye verilen fazladan Kıta Ligi bileti. Elemeyi kaybeden yola Kıta Kupası'nda devam eder.</p></section>`}`;
}

function vLeague() {
  const s = G.S, my = G.leagueOf(s.clubId), lid = V.lig && s.lg[V.lig] ? V.lig : my, z = G.zones(lid), tb = G.table(lid), n = tb.length;
  const seg = tt`<div class="seg">${[['tb', tt('Puan')], ['cup', tt('Kupa')], ['sc', G.KW ? tt('Gol kraliçeliği') : tt('Gol krallığı')]].map(([k, l]) => tt`<button class="${V.lv === k ? 'on' : ''}" data-a="lv" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (V.lv === 'cup') {
    const ck = G.EUK.includes(V.ck) ? V.ck : s.cup.none ? 'cl' : 'cup', c = s.cup, alive = c.alive.includes(s.clubId), cn = G.cupNext('cup');
    const seg2 = tt`<div class="seg s3">${[['cup', tt('Kupa')], ['cl', tt('Kıta L.')], ['el', G.KW ? tt('Kıta K.') : tt('Kıta K.')], ['ko', tt('Kalkan')]].filter(([k]) => (k === 'cup' ? !s.cup.none : G.EUK.includes(k))).map(([k, l]) => tt`<button class="${ck === k ? 'on' : ''} sg-${k}" data-a="ck" data-v="${k}">${esc(l)}</button>`).join('')}</div>`;
    if (ck !== 'cup') return `${seg}${seg2}${euroView(ck)}`;
    const rounds = c.hist.slice().reverse().map(h => {
      const mine = h.res.filter(x => x[0] === s.clubId || x[1] === s.clubId), rest = h.res.filter(x => !mine.includes(x)).slice(0, h.res.length > 8 ? 5 : 8);
      return tt`<div class="sub">${h.n}</div>${[...mine, ...rest].map(([a, b, ag, bg, w]) => tt`<div class="res ${a === s.clubId || b === s.clubId ? 'me' : ''}"><span class="${w === a ? 'w' : ''}">${esc(G.club(a).n)}</span><b>${ag} - ${bg}</b><span class="${w === b ? 'w' : ''}">${esc(G.club(b).n)}</span></div>`).join('')}${h.res.length > mine.length + rest.length ? tt`<p class="mut sm">+${h.res.length - mine.length - rest.length} maç daha</p>` : ''}`;
    }).join('');
    return tt`${seg}${seg2}<section class="card cuph">${ic('trophy', 44)}<div><h3>${esc(c.name)}</h3><small>${c.champ ? tt`Şampiyon: ${esc(G.club(c.champ).n)}` : alive ? tt`Devam ediyorsun · ${cn.round}, ${cn.week}. hafta` : c.hist.some(h => h.res.some(x => x[0] === s.clubId || x[1] === s.clubId)) ? tt('Elendiniz') : tt('Kulübün bu sezon katılmıyor')}</small></div></section>
      ${cn ? tt`<section class="card">${tag(tt('Sıradaki tur'), 'ye')}${cl(cn.opp, tt`${crest(cn.opp, 34)}<div><b>${esc(G.club(cn.opp).n)}</b><small>${cn.round} · ${cn.week}. hafta · güç ${Math.round(s.rt[cn.opp])}</small></div>`, 'wt')}</section>` : ''}
      ${rounds ? tt`<section class="card">${rounds}</section>` : tt('<p class="mut sm pad">İlk tur henüz oynanmadı.</p>')}`;
  }
  const opt = LEAGUES.map(L => tt`<option value="${L.id}" ${L.id === lid ? 'selected' : ''}>${''}${L.name}${L.gen ? ' (' + s.prov + ')' : ''}</option>`).join('');
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
    ${hasEu && G.KW ? tt`<p class="mut sm leg eu"><i class="z-cl"></i>Kıta Ligi<i class="z-clq"></i>KL elemesi<i class="z-el"></i>Kıta Kupası · takıma dokun: profil</p>` : hasEu ? tt`<p class="mut sm leg eu"><i class="z-cl"></i>Kıta Ligi<i class="z-clq"></i>KL elemesi<i class="z-el"></i>Kıta Kupası<i class="z-ko"></i>Kalkan · takıma dokun: profil</p>` : tt('<p class="mut sm leg">Takıma dokun: kulüp profili</p>')}</section>
    ${last ? tt`<section class="card">${tag(tt('Son hafta'))}${last}</section>` : ''}`;
}

function matesCard() {
  const s = G.S, c = G.club(s.clubId), left = G.slots() - s.used;
  return tt`<section class="card hv-cev">${tag(tt('Takım arkadaşların'))}<div class="kv">${ic('users', 16)}<span>Takım kimyası</span><b>%${Math.round(G.chem() * 100)}</b></div>${lockerBar()}
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
    <div class="fld two"><label><span>Forma no</span><input type="number" min="1" max="99" value="${s.num}" inputmode="numeric" data-c="mnum"></label><label><span>Lakap</span><input maxlength="18" value="${esc(s.nick || '')}" placeholder="Örn. Gol Makinesi" autocomplete="off" data-c="mnick"></label></div>
    <div class="fld"><span>Gol sevinci</span><div class="chips">${Object.keys(CELE).map(k => tt`<button class="chip ${s.cele === k ? 'on' : ''}" data-a="mcele" data-v="${k}">${CELE[k][0]}</button>`).join('')}</div></div></section>`;
}

const SIC = { muze: 'trophy', tekne: 'star', akademi: 'book', jet: 'globe', hisse: 'chart', yali: 'home', krampon: 'shirt', telefon: 'phone', araba: 'car', daire: 'home', diyet: 'heart', pt: 'train', halisaha: 'ball', ev: 'home', spor: 'car', kofte: 'cart', villa: 'star' };
function vLife() {
  const s = G.S, inc = G.income(), R = s.rel, c = G.club(s.clubId);
  const rel = [['anne', tt('Aile'), R.aile], ['ark', tt('Arkadaşlar'), R.ark], ...(R.par != null ? [['par', s.fl.evli ? tt('Eşin') : tt('Sevgilin'), R.par]] : []), ['hoca', tt('Hoca'), R.hoca], ['takim', tt('Soyunma odası'), R.takim], ['taraftar', tt('Taraftar'), R.taraf], ['basin', tt('Basın'), R.basin ?? 50]]
    .map(([p, n, v]) => tt`<div class="rel ${v < 25 ? 'low' : ''}"><div class="relr" style="--v:${Math.round(v)}"><div class="avw">${persona(p, c, G.KW)}</div></div><b>${Math.round(v)}</b><small>${n}</small></div>`).join('');
  const row = (n, v, i) => v ? tt`<div class="kv">${ic(i, 16)}<span>${n}</span><b class="${v < 0 ? 'neg' : ''}">${G.fmt(v)}</b></div>` : '';
  // Alışveriş kartları: açıklama yerinde, üstüne kazandırdığı şeyler etiket olarak. Backer Sport afiş önizlemesiyle öne çıkar
  const gain = e => [e && e.en ? tt`Enerji +${e.en}` : '', e && e.mo ? tt`Moral +${e.mo}` : '', e && e.fol ? tt('Takipçi artışı') : '', e && e.tr ? tt`Antrenman +%${Math.round(e.tr * 100)}` : '', e && e.inc ? tt`Haftalık +${G.fmtS(e.inc)}` : ''].filter(Boolean).map(x => `<i class="pos">${x}</i>`).join('');
  const shopC = i => {
    const own = G.has(i.id), cost = i.p || G.yrPrice(i), price = i.p ? G.fmtS(i.p) : tt`${G.fmtS(cost)}/sezon`;
    const btn = own ? tt`<span class="own">${ic('check', 16)} ${tt('Sende')}</span>` : tt`<button class="mini-b" data-a="buy" data-v="${i.id}" ${s.money < cost ? 'disabled' : ''}>${price}</button>`;
    const Y = i.loc ? YEREL[s.prov] || [tt('Memleket lokantası'), tt('Ev yemekleri, esnaf lokantası usulü.')] : null, nm = Y ? Y[0] : i.n, ds = Y ? Y[1] + ' ' + tt`Haftalık ${G.fmtS(i.e.inc)} gelir.` : G.tl(i.d);   // memleket lezzeti: ile göre
    return tt`<div class="shop shc ${own ? 'has' : ''}${i.img ? ' feat' : ''}"><span class="aic${i.img ? ' blg' : ''}">${i.img ? `<img src="${i.img}" alt="">` : ic(SIC[i.id] || 'cart', 22)}</span><div><b>${nm}</b><small>${ds}</small><span class="efx">${gain(i.e)}</span></div>${i.img ? mdMini() : ''}${btn}</div>`;
  };
  const list = SHOP.filter(i => (!i.t2 || G.shopTier() >= 2) && !(s.mgr && i.img)), feat = list.filter(i => i.img), shop0 = feat.map(shopC).join('') + `<div class="shopg">${list.filter(i => !i.img).map(shopC).join('')}</div>`, shop = s.mgr ? shop0 : shop0 + shopExtra();
  const send = G.nice(Math.max(1000, s.con.wage));
  const invRows = Object.keys(INV).map(k => { const v = Math.round((s.inv || {})[k] || 0), stp = G.nice(Math.max(5000, s.money * .2)); return tt`<div class="shop ${v ? 'has' : ''}"><span class="aic">${ic(INV[k][4], 22)}</span><div><b>${INV[k][0]}</b><small>${INV[k][1]}${v ? tt` Şu an: ${G.fmtS(v)}` : ''}</small></div><div class="pbs"><button class="mini-b" data-a="inv" data-v="${k}" ${s.money < stp ? 'disabled' : ''}>+${G.fmtS(stp)}</button><button class="mini-b" data-a="div" data-v="${k}" ${v ? '' : 'disabled'}>Çek</button></div></div>`; }).join('');
  if (s.mgr) {   // kenar ve iş kariyeri: kazandığın para senin; harcar, yatırıma çevirirsin
    const hv = V.hv === 'para' ? 'para' : 'ayar';
    return `<div class="hvw" data-hv="${hv}"><div class="seg">${[['para', tt('Para')], ['ayar', tt('Ayarlar')]].map(([k, l]) => `<button class="${hv === k ? 'on' : ''}" data-a="hv" data-v="${k}">${l}</button>`).join('')}</div>
    ${mgrPay()}${lifeCard()}
    <section class="card hv-para">${tag(tt('Yatırımlar'), 'ye')}<div class="kv">${ic('chart', 16)}<span>${tt('Portföy değeri')}</span><b>${G.fmtS(G.invTotal())}</b></div>${invRows}</section>
    <section class="card hv-para">${tag(tt('Yaşam ve yatırım'))}${shop}</section>
    <section class="card hv-ayar">${tag(tt('Para birimi'))}<div class="seg">${Object.keys(G.CUR).map(k => `<button class="${G.curKey() === k ? 'on' : ''}" data-a="cur" data-v="${k}">${G.CUR[k][0]} ${G.CUR[k][2]}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Tema'))}<div class="thm">${THEMES.map(([k, n, c2]) => `<button class="${theme() === k ? 'on' : ''}" data-a="theme" data-v="${k}"><i style="background:${c2 || 'conic-gradient(#d81e2c, #ffd21a, #0f8a4b, #1c57c4, #d81e2c)'}"></i>${n}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Dil'))}<div class="seg">${langBtns()}</div></section>
    <button class="opt sm hv-ayar" data-a="exp">${ic('down', 20)}<span><b>${tt('Kaydı dosyaya aktar')}</b></span></button>
    ${mgrSetBtns()}${legalOpt()}
    <button class="link hv-ayar" data-a="menu">${tt('Ana menü')}</button></div>`;
  }
  return tt`<div class="hvw" data-hv="${V.hv}"><div class="seg">${[['cev', tt('Çevre')], ['para', tt('Para')], ['gor', tt('Görünüm')], ['ayar', tt('Ayarlar')]].map(([k, l]) => tt`<button class="${V.hv === k ? 'on' : ''}" data-a="hv" data-v="${k}">${l}</button>`).join('')}</div>
    <section class="card hv-cev">${tag(tt('Çevren'))}<div class="rels">${rel}</div></section>
    ${s.kid ? tt`<section class="card hv-cev">${tag(tt('Çocuğun'), 'ye')}<div class="ppl"><div class="avw sm">${avatar({ skin: s.look.skin, hair: 1, hc: s.look.hc }, c.c1, c.c2)}</div><div><b>${esc(s.kid.n)}</b><small>${G.kidAge()} yaşında · futbol yeteneği</small>${bar(s.kid.tal / 20 * 100, 'hot')}</div></div><p class="note">Ailenle geçirdiğin vakit ve ona ayırdığın zaman yeteneğini büyütür. Emekli olduğunda kariyere onunla, aynı dünyada devam edebilirsin.</p></section>` : ''}
    ${matesCard()}${netCard()}
    <div class="bsum hv-para"><div><small>${tt('Haftalık gelir')}</small><b class="pos">${G.fmtS(inc.wage - inc.cut + inc.job + inc.spon + inc.biz)}</b></div><div><small>${tt('Gider')}</small><b class="neg">${G.fmtS(inc.cost)}</b></div><div><small>Net</small><b class="${inc.net < 0 ? 'neg' : 'net'}">${G.fmtS(inc.net)}</b></div></div>
    ${lifeCard()}
    <section class="card hv-para">${tag(tt('Haftalık bütçe'))}
      ${row(tt('Kulüp ücreti'), inc.wage, 'shirt')}${row(tt('Menajer payı'), -inc.cut, 'pen')}${row(tt('Ek iş'), inc.job, 'briefcase')}${row(tt('Sponsorlar'), inc.spon, 'tag')}${row(tt('İşletmeler'), inc.biz, 'cart')}${row(tt('Giderler'), -inc.cost, 'down')}
      <div class="kv tot">${ic('coin', 16)}<span>Net</span><b class="${inc.net < 0 ? 'neg' : ''}">${G.fmt(inc.net)}</b></div>
      <button class="opt sm" data-a="send" ${s.money < send ? 'disabled' : ''}>${ic('heart', 20)}<span><b>Aileye ${G.fmt(send)} gönder</b></span></button></section>
    <section class="card hv-para">${tag(tt('Şöhret'), 'ye')}<div class="stts">
      <div class="stt">${ic('users', 18)}<b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + tt(' Mn', 'para') : num(s.fol)}</b><small>Takipçi</small></div>
      <div class="stt">${ic('star', 18)}<b>${Math.round(s.rep)}</b><small>İtibar</small></div>
      <div class="stt">${ic('book', 18)}<b>${Math.round(s.egt)}</b><small>Eğitim</small></div>
      <div class="stt">${ic('globe', 18)}<b>${Math.round(s.dil)}</b><small>Dil</small></div></div>
      ${s.spon.map(x => tt`<div class="kv">${ic('tag', 16)}<span>${esc(x.n)}</span><b>${G.fmtS(x.wk)}/hf</b></div>`).join('')}${bootRow()}</section>
    <section class="card hv-para">${tag(tt('Yatırımlar'), 'ye')}<div class="kv">${ic('chart', 16)}<span>Portföy değeri</span><b>${G.fmtS(G.invTotal())}</b></div>
      ${invRows}
      <p class="note">Değerler her hafta oynar. Mali müşavirin varsa kayıplar yarıya iner, ortağın seni batıramaz.</p></section>
    <section class="card hv-para">${tag(tt('Yaşam ve yatırım'))}${shop}</section>
    ${lookCard()}
    <section class="card hv-ayar">${tag(tt('Para birimi'))}<div class="seg">${Object.keys(G.CUR).map(k => tt`<button class="${G.curKey() === k ? 'on' : ''}" data-a="cur" data-v="${k}">${G.CUR[k][0]} ${G.CUR[k][2]}</button>`).join('')}</div><p class="mut sm">Sabit kur: €1 = ₺${G.CUR.EUR[1]} · $1 = ₺${G.CUR.USD[1]}</p></section>
    <section class="card hv-ayar">${tag(tt('Tema'))}<div class="thm">${THEMES.map(([k, n, c]) => tt`<button class="${theme() === k ? 'on' : ''}" data-a="theme" data-v="${k}"><i style="background:${c || 'conic-gradient(#d81e2c, #ffd21a, #0f8a4b, #1c57c4, #d81e2c)'}"></i>${n}</button>`).join('')}</div></section>
    <section class="card hv-ayar">${tag(tt('Dil'))}<div class="seg">${langBtns()}</div></section>
    ${gfxCard()}${ivCard()}${legalOpt()}
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
// Akıştaki tek gönderi: eleştirmen yorumlarına cevap düğmesi var
function fdHTML(p, hd) {
  if (p.k === 'manset') return tt`<article class="fd manset"><small>${ic('news', 14)}${esc(p.n)} · ${p.w}. hafta</small><b>${esc(p.t)}</b></article>`;
  const tag2 = p.k === 'ben' ? hd : p.k === 'fan' || p.k === 'hater' ? '@' + esc(p.n) : p.k === 'haber' ? tt('haber') : p.k === 'trend' ? tt('gündem') : '';
  const rep = p.k === 'hater' ? (p.r ? `<em class="hrd">${ic('check', 12)}${tt('yanıtlandı')}</em>` : `<button class="mini-b hr" data-a="hrep" data-v="${p.id}">${tt('Yanıtla')}</button>`) : '';
  return tt`<article class="fd k-${p.k}" data-id="${p.id || ''}">${feedAv(p)}<div><div class="fd-h"><b>${esc(p.n)}</b><small>${tag2} · ${p.w}. hf</small>${p.k === 'hater' ? `<em class="htg">${tt('eleştirmen')}</em>` : ''}</div><p>${esc(p.t)}</p><div class="fd-f">${ic('heart', 14)}<span>${num(p.l)}</span>${ic('swap', 14)}<span>${num(p.l / 9)}</span>${rep}</div></div></article>`;
}
const sosHd = () => '@' + G.S.name.toLocaleLowerCase(LC).replace(/[^a-zçğıöşü0-9]+/g, '');
function vSocial() {
  const s = G.S, left = G.slots() - s.used, hd = sosHd();
  s.feedNew = 0;
  const dots = Array.from({ length: G.slots() }, (_, i) => `<i class="${i < s.used ? 'u' : ''}"></i>`).join('');
  const feed = s.feed.map(p => fdHTML(p, hd)).join('');
  const hate = Math.round(s.hate || 0), c = G.club(s.clubId), f = G.fixture(), tag0 = x => '#' + x.replace(/\s+/g, '');
  const trends = [tag0(c.n), tag0(s.name.split(' ')[0]) + s.num, ...(f && !f.nat && G.club(f.opp) ? [tag0(G.club(f.opp).n) + tt('Maçı')] : [])];
  return tt`<section class="card soc">${me()}<div><b>${esc(s.name)}</b><small>${hd}</small></div><div class="soc-f"><b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + tt(' Mn', 'para') : num(s.fol)}</b><small>takipçi</small></div>
      <div class="hate"><span>${ic('alert', 14)}${tt('Eleştiri')}</span><u><i style="width:${hate}%"></i></u><b>${hate < 25 ? tt('sakin') : hate < 55 ? tt('hareketli') : tt('alevli')}</b></div></section>
    <div class="trends">${trends.map(t => `<span>${esc(t)}</span>`).join('')}</div>
    ${s.mgr ? '' : `<button class="sbtn" data-a="share" ${left <= 0 ? 'disabled' : ''}>${ic('phone', 20)}<span>${tt('Paylaşım yap')}</span><span class="dots">${dots}</span></button>`}
    <section><div class="sh"><h4>Akış</h4><em class="live">${tt('CANLI')}</em></div><div class="feedl" id="feedl">${feed || tt('<p class="mut sm pad">Akış boş. İlk maçından sonra dolmaya başlar.</p>')}</div></section>`;
}
// Sosyal açıkken akış canlı akar: birkaç saniyede bir yeni gönderi üstten kayarak gelir
let LIVE = null;
function liveSet() {
  const on = V.scr === 'hub' && V.tab === 'sos' && G.S && !G.S.mgr && !AUTO;
  if (on && !LIVE) LIVE = setInterval(() => {
    if (busy || !$modal.hidden || document.hidden || Math.random() < .25) return;   // 2,5 sn'de bir, ara ara boşluk: gerçek akış gibi düzensiz
    const p = G.liveFeed(), box = $('#feedl'); if (!p || !box) return;
    const e = box.querySelector('.pad'); if (e) e.remove();
    box.insertAdjacentHTML('afterbegin', fdHTML(p, sosHd())); const el = box.firstElementChild; if (el) el.classList.add('new');
    while (box.children.length > 60) box.lastElementChild.remove();
    G.S.feedNew = 0; if (Math.random() < .2) G.save();
  }, 2500);
  if (!on && LIVE) { clearInterval(LIVE); LIVE = null; }
}

// Geniş ekranda sol menünün tepesindeki kimlik kartı
function navCard() {
  const s = G.S, c = G.club(s.clubId), bz = G.isBiz() ? bizLbl(s.mgr.role) : null;
  if (bz) return `<div class="nvc"><span class="bizc">${ic(bz[2], 24)}</span><div><b>${esc(s.name)}</b><small>${esc(bz[1])}</small></div></div>`;
  if (s.mgr) return `<div class="nvc" style="--c1:${c.c1}">${crest(s.clubId, 46)}<div><b>${esc(s.name)}</b><small>${esc(c.n)}</small></div></div>`;
  return `<div class="nvc" style="--c1:${c.c1}"><div class="avw">${avatar(s.look, c.c1, c.c2)}</div><div><b>${esc(s.name)}</b><small>${POS[s.pos].n} · ${esc(c.n)}</small></div><em>${G.OVR()}</em></div>`;
}
function vHub() {
  const mg = !!G.S.mgr, bz = G.isBiz(), ag = bz && G.S.mgr.role === 'agent', pu = bz && G.S.mgr.role === 'pundit';
  const tabs = bz ? [['ev', pu ? tt('Stüdyo') : ag ? tt('Ofis') : tt('Okul'), pu ? 'mic' : ag ? 'pen' : 'book'], ['kar', pu ? tt('Program') : ag ? tt('Oyuncular') : tt('Öğrenciler'), pu ? 'chart' : 'users'], ['lig', tt('Lig'), 'trophy'], ['sos', tt('Sosyal'), 'phone'], ['hay', tt('Hayat'), 'heart']] : mg ? [['ev', tt('Kenar'), 'whistle'], ['kar', tt('Kulüp'), 'shield'], ['lig', tt('Lig'), 'trophy'], ['sos', tt('Sosyal'), 'phone'], ['hay', tt('Hayat'), 'heart']] : [['ev', tt('Saha'), 'ball'], ['kar', tt('Kariyer'), 'user'], ['lig', tt('Lig'), 'trophy'], ['sos', tt('Sosyal'), 'phone'], ['hay', tt('Hayat'), 'heart']];
  const nw = V.tab === 'sos' ? 0 : G.S.feedNew || 0;
  const body = { ev: bz ? vBizHome : mg ? vMgrHome : vHome, kar: bz ? vBizList : mg ? (G.S.mgr.role === 'coach' ? vCoachClub : vMgrClub) : vCareer, lig: vLeague, sos: () => rumCard() + vSocial(), hay: vLife }[V.tab]();
  return head() + tt`<main>${body}</main><nav class="tabs">${navCard()}${tabs.map(([k, n, i]) => tt`<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i, 22)}<span>${n}</span>${k === 'sos' && nw ? tt`<em>${nw > 9 ? '9+' : nw}</em>` : ''}</button>`).join('')}</nav>`;
}

function render() {
  if (AUTO) return;
  applyTheme();
  if (V.scr === 'title') app.innerHTML = vTitle();
  else if (V.scr === 'create') app.innerHTML = vCreate();
  else if (V.scr === 'hub') app.innerHTML = vHub();
  else if (V.scr === 'end') app.innerHTML = endHTML;
  app.dataset.scr = V.scr; polish(); liveSet();
  if (V.scr === 'hub' && G.S && G.S.pop.length && !busy) { toast(G.S.pop.splice(0).slice(0, 3).join(' · '), 'star'); sfx.up(); }
}

// ---------- mini oyun katmanı ----------
async function playMini(kind, oppR, label, x = {}) {
  const s = G.S;
  $mini.hidden = false; $mini.querySelector('.mh').textContent = label;
  if (!mini) mini = new Mini($mini.querySelector('canvas'));
  const ovr = G.OVR(), oppQ = G.clamp(0.5 + (oppR - ovr) / 28, .08, 1);
  const sk = a => G.clamp((a - (oppR - 12)) / 30, 0, 1);
  const hard = (1 + (s.en < 30 ? .16 : s.en < 50 ? .07 : 0) + (50 - s.mo) / 350) * (s.trait === 'sakin' ? .92 : 1) * (DIFF[s.diff] || DIFF.normal)[1] * (x.lh || G.leagueHard(null));   // lig yükseldikçe zorlaşır
  const cu = x.nat ? '#d81e2c' : s.clubId ? G.club(s.clubId).c1 : '#ff6a2b';
  let co = x.opp ? G.club(x.opp).c1 : '#5a6470'; if (co === cu) co = x.opp ? G.club(x.opp).c2 : '#f2f2f2';
  const L = s.look || {}, cu2 = x.nat ? '#f2f2f2' : s.clubId ? G.club(s.clubId).c2 : '#f2f2f2', co2 = x.opp ? (co === G.club(x.opp).c2 ? G.club(x.opp).c1 : G.club(x.opp).c2) : '#1b1b1b';
  const res = await mini.play(kind, { env: x.env || G.trainEnv(), gkw: x.gkw || null, cu2, co2, skin: SKIN[L.skin ?? 1], hair: HAIRC[L.hc ?? 0], long: (L.hair ?? 0) >= 8, num: s.num, boot: G.bootColor(), tired: x.tired || 1, skill: sk(G.skillFor(kind)), speed: sk(s.at.hiz), oppQ, hard: hard * (x.focus ? .88 : 1) * (x.tired || 1) * (x.crowd ? .85 : 1) * (x.big ? .9 : 1) * (x.adapt ? 1.07 : 1) * (x.wxh || 1) * (x.prep ? .93 : 1), wall: x.wall || null, vr: x.vr || null, bonus: !!x.bonus, cu, co, pk: Object.fromEntries(s.perks.map(p => [p, 1])) });
  $mini.hidden = true;
  return res;
}

// ---------- akışlar ----------
async function trainFlow() {
  const s = G.S, list = TRAIN.filter(t => !t.pos || t.pos.includes(s.pos));
  const TI = { bit: 'target', top: 'ball', fiz: 'bolt', kon: 'bolt', sav: 'shield', kal: 'shield', zih: 'star' };
  const i = await dialog({ k: tt('Antrenman'), t: tt('Neye çalışacaksın?'), opts: [...list.map(t => ({ t: t.n, s: t.a.map(a => ATTR[a]).join(' + '), i: TI[t.id] })), { t: tt('Vazgeç'), c: 'ghost' }] });
  if (i >= list.length) return;
  const T = list[i]; let mult = 1, drill = null;
  if (T.g) {
    const bd = (s.drill || {})[T.id];
    const j = await dialog({ k: T.n, t: tt('Nasıl?'), opts: [{ t: tt('Sahada çalış'), s: tt('Üç tekrar: isabet sayısına göre verim ×0,7 ile ×2,0 arası') + (bd ? ' · ' + tt`rekorun ${bd.b}/3` : ''), i: 'ball' }, { t: tt('Hızlı geç'), s: tt('Verim ×1,0'), i: 'right' }, { t: tt('Geri'), c: 'ghost' }], auto: 1 });
    if (j === 2) return;
    if (j === 0) {   // seri: üç tekrar
      let hits = 0;
      for (let n = 0; n < 3; n++) { const r = AUTO ? G.simMoment(T.g, { oppR: G.OVR() }) : await playMini(T.g, G.OVR(), tt('Antrenman · ') + T.n + ` · ${n + 1}/3`); if (G.GOOD.includes(r.out)) hits++; }
      drill = G.drillEnd(T.id, hits); drill.hits = hits; mult = drill.mult;
    }
  }
  const r = G.train(T.id, mult); sfx.up();
  toast((drill ? tt`Seri ${drill.hits}/3` + (drill.rec ? ' · ' + tt('yeni rekor') : '') + ' · ' : '') + r.gs.map(([k, g]) => `${ATTR[k]} +${dec(g)}`).join(' · ') + (r.inj ? tt` · Sakatlandın (${r.inj} hf)` : ''), r.inj ? 'alert' : 'up');
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
  const s = G.S, m = s.mates[i], c = G.club(s.clubId), keys = Object.keys(MACT).filter(k => !MACT[k].vet || (s.age >= 30 && i === 3));   // akıl hocalığı: otuzundan sonra, genç yeteneğe
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
const offerSub = id => { const L = LMAP[G.leagueOf(id)]; return L ? tt`${''}${L.name} · güç ${Math.round(G.S.rt[id])}` : tt`${G.club(id).x || tt('Avrupa')} · güç ${Math.round(G.S.rt[id])}`; };
const EUNM = { cl: 'Kıta Ligi', el: 'Kıta Kupası', ko: 'Kıta Kalkanı' };
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


// ---------- v26: teklif masası ----------
const oLeft = o => o.exp - G.absWeek();   // 0: son hafta
const oDue = o => (oLeft(o) <= 0 ? tt('Son hafta') : tt`${oLeft(o) + 1} hafta`);
function oChips(o) {
  const c = [];
  if (o.nw) c.push(['nw', tt('Yeni')]);
  if (o.renew) c.push(['', tt('Kulübünün teklifi')]); if (o.loan) c.push(['', tt('Kiralık')]); if (o.via) c.push(['', tt('Menajerin')]);
  if (o.bids) c.push(['up', tt`Artırdı ×${o.bids}`]);
  if (o.fee && o.st === 'red') c.push(['lo', tt('Bonservis reddi')]);
  if (o.pt && !o.ph) c.push(['pt', tt('Sunum var')]);
  if (o.wait) c.push(['', tt('Bekletiyorsun')]);
  return c.map(([k, t]) => `<i class="${k}">${esc(t)}</i>`).join('');
}
function inboxCard() {
  const s = G.S; if (!s || s.mgr) return '';
  const pm = G.pendingMove();
  if (pm) return tt`<button class="inbx pm" data-a="inbox">${crest(pm.id, 34)}<div><b>${esc(G.club(pm.id).n)} ile anlaştın</b><small>${pm.win === 'kis' ? tt('Transfer devre arasında gerçekleşecek') : tt('Transfer sezon sonunda gerçekleşecek')}</small></div>${ic('pen', 20)}</button>`;
  const L = G.inbox(); if (!L.length) return '';
  const soon = Math.min(...L.map(oLeft)), nw = L.filter(o => o.nw).length;
  return tt`<button class="inbx" data-a="inbox"><span class="ix">${ic('swap', 22)}${nw ? `<em>${nw}</em>` : ''}</span><div><b>Teklif masası · ${L.length}</b><small>${G.twin() ? tt('Transfer dönemi açık') : tt('Pencere açılınca imza')} · ${soon <= 0 ? tt('bir teklifin son haftası') : tt`en yakın son gün ${soon + 1} hafta`}</small></div><span class="crs">${L.slice(0, 4).map(o => crest(o.id, 24)).join('')}</span></button>`;
}
function offerDesk() {
  const L = G.inbox(), pm = G.pendingMove();
  if (pm) return tt`<section class="card desk">${tag(tt('Teklif masası'))}<div class="ofr pm">${crest(pm.id, 34)}<div><b>${esc(G.club(pm.id).n)}</b><small>${tt('Anlaştın')} · ${ROLE[pm.role]} · ${pm.wage ? G.fmtS(pm.wage) + tt('/hf') : tt('amatör')}</small></div><em><b>${ic('pen', 18)}</b><small>${pm.win === 'kis' ? tt('devre arası') : tt('sezon sonu')}</small></em></div><p class="note">${tt('Pencere açılınca imzalar atılır. O zamana kadar başka teklif dinlemiyorsun.')}</p></section>`;
  if (!L.length) return tt`<section class="card desk">${tag(tt('Teklif masası'))}<p class="mut sm">${G.twin() ? tt('Transfer dönemi açık. Teklifler haftalık gelir; seni izleyen kulüplerin ilgisi arttıkça masan dolar.') : tt('Masa boş. Teklifler devre arasından önce (14. hafta) ve sezon sonuna doğru (32. hafta) gelmeye başlar. Sözleşmen bitiyorsa 24. haftadan itibaren bedelsiz anlaşabilirsin.')}</p></section>`;
  return tt`<section class="card desk">${tag(tt('Teklif masası'), 'ye')}<p class="mut sm">${G.twin() ? tt('Transfer dönemi açık: imzaladığın an gidersin.') : tt('Pencere kapalı: anlaşırsan transfer pencere açılınca gerçekleşir.')} ${tt('Her teklifin son günü var. Rakip teklif gören kulüp artırabilir, bekletilen kulüp acele edebilir.')}</p>
    ${L.map((o, i) => `<button class="ofr ${o.nw ? 'nw' : ''}" data-a="offer" data-v="${i}">${crest(o.id, 34)}<div><b>${esc(G.club(o.id).n)}</b><small>${offerSub(o.id)} · ${ROLE[o.role]} · ${o.wage ? G.fmtS(o.wage) + tt('/hf') : tt('amatör')}</small><span class="och">${oChips(o)}</span></div><em class="${oLeft(o) <= 0 ? 'lo' : ''}"><b>${oLeft(o) <= 0 ? '!' : oLeft(o) + 1}</b><small>${oLeft(o) <= 0 ? tt('son hafta') : tt('hafta')}</small></em></button>`).join('')}
    ${L.length >= 2 ? tt`<button class="opt sm" data-a="ocmp">${ic('chart', 20)}<span><b>Teklifleri karşılaştır</b></span></button>` : ''}</section>`;
}
function pitchHTML(o) {
  const P = o.pt && PITCH[o.pt]; if (!P) return '';
  return o.ph ? `<div class="opch on"><span class="aic">${ic(P.i, 18)}</span><div><b>${esc(P.n)}</b><small>${esc(P.e)}</small></div></div>`
    : `<div class="opch"><span class="aic">${ic(P.i, 18)}</span><div><b>${esc(P.n)}</b><small>${tt('Sunumu dinlemedin. Dinlersen sözleşmeye bir madde eklenir.')}</small></div></div>`;
}
function cmpTable(L) {
  const best = f => { const v = L.map(f), b = Math.max(...v); return v.map(x => x === b && v.some(y => y !== b)); };
  const RR = { genc: 0, rot: 1, '11': 2 }, bw = best(o => o.wage || 0), bs = best(o => o.sign || 0), br = best(o => RR[o.role]), bp = best(o => G.S.rt[o.id] || 0), bt = best(oLeft);
  const row = (l, f, b) => `<tr><th>${l}</th>${L.map((o, i) => `<td class="${b && b[i] ? 'bst' : ''}">${f(o)}</td>`).join('')}</tr>`;
  return `<div class="oct"><table><tr><th></th>${L.map(o => `<td class="oh">${crest(o.id, 26)}<b>${esc(G.club(o.id).n)}</b></td>`).join('')}</tr>
    ${row(tt('Lig'), o => esc((LMAP[G.leagueOf(o.id)] || {}).name || '–'))}
    ${row(tt('Güç'), o => Math.round(G.S.rt[o.id]), bp)}
    ${row(tt('Rol'), o => ROLE[o.role], br)}
    ${row(tt('Ücret/hf'), o => (o.wage ? G.fmtS(o.wage) : '–'), bw)}
    ${row(tt('İmza parası'), o => (o.sign ? G.fmtS(o.sign) : '–'), bs)}
    ${row(tt('Süre'), o => (o.loan ? tt('Kiralık') : tt`${o.len} sezon`))}
    ${row(tt('Bonservis'), o => (o.renew || o.loan || !o.fee ? '–' : o.st === 'ok' ? tt('Onaylı') : tt('Reddedildi')))}
    ${row(tt('Sunum'), o => (o.pt ? (o.ph ? tt('Dinlendi') : tt('Bekliyor')) : '–'))}
    ${row(tt('Son gün'), oDue, bt)}</table></div>`;
}
async function offerFlow(o) {
  for (;;) {
    if (o.end) return;
    const left = oLeft(o), red = o.st === 'red', win = !!(G.twin() || o.renew || o.loan), P = o.pt && PITCH[o.pt]; o.nw = 0;
    const acts = [], opts = [];
    if (red) { acts.push('push'); opts.push({ t: tt('Transfer isteği ver'), s: tt('Kulübü zorla: hoca ve taraftar tepki gösterir'), i: 'alert', dis: o.pushed }); }
    else { acts.push('sign'); opts.push({ t: win ? tt('İmzala') : tt('Anlaş'), s: win ? '' : o.win === 'kis' ? tt('Devre arasında gidersin; haber sızar') : tt('Sezon sonunda gidersin; haber sızar'), i: 'pen' }); }
    if (P && !o.ph) { acts.push('pitch'); opts.push({ t: tt('Sunumu dinle'), s: P.n, i: P.i }); }
    acts.push('nego'); opts.push({ t: tt('Pazarlık yap'), s: tt('Madde madde: ücret, imza parası, primler, süre'), i: 'coin', dis: !o.wage || o.loan || red || !!(o.ng && (o.ng.end || o.ng.pat <= 0)) });
    acts.push('wait'); opts.push({ t: tt('Düşüneceğim'), s: tt('Teklif masada kalır; kulüp acele edebilir'), i: 'clock' });
    acts.push('no'); opts.push({ t: tt('Reddet'), c: 'ghost' });
    const body = (o.renew ? '' : citySvg(cityOf(o.id), G.club(o.id).c1)) + offerHTML(o) + negoHTML(o) + pitchHTML(o)
      + (o.log.length ? `<div class="olog">${o.log.slice(0, 3).map(x => `<p>${ic('news', 14)}<span>${esc(x)}</span></p>`).join('')}</div>` : '')
      + `<div class="odl ${left <= 0 ? 'lo' : ''}">${ic('clock', 16)}<span>${left <= 0 ? tt('Son hafta: cevap vermezsen teklif düşer.') : tt`Cevap için ${left + 1} haftan var.`}${win ? '' : ' ' + tt('Pencere kapalı: anlaşırsan transfer pencere açılınca gerçekleşir.')}</span></div>`
      + (o.renew ? '' : cmpHTML(G.moveInfo(o)));
    const j = await dialog({ art: clubArt(o.id, offerSub(o.id)), k: o.loan ? tt('Kiralık teklif') : o.renew ? tt('Kulübünün teklifi') : o.via ? tt('Menajerin getirdi') : tt('Transfer teklifi'), t: G.club(o.id).n, body, opts });
    const a = acts[j];
    if (a === 'push') { const r = G.pushTransfer(o); if (r.ok) sfx.up(); else sfx.bad(); await dialog({ art: art('baskan', 'lock', 'risk'), t: r.ok ? tt('Kapı açıldı') : tt('Kulüp direniyor'), body: tt`<p>${esc(r.text)}</p>${chips(r.ch)}`, opts: [{ t: tt('Devam') }], auto: 0 }); continue; }
    if (a === 'pitch') { const p = G.pitchHear(o); sfx.up(); await dialog({ art: art(p.p, p.i, 'fame'), k: tt('Sunum'), t: p.n, body: `<p>${esc(p.d)}</p><div class="opch on"><span class="aic">${ic('check', 18)}</span><div><b>${tt('Sözleşmeye eklendi')}</b><small>${esc(p.e)}</small></div></div>`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' }); continue; }
    if (a === 'nego') { const gone = await negoFlow(o); if (gone) { o.end = 'geri'; return; } continue; }
    if (a === 'wait') { G.offerWait(o); toast(tt`${G.club(o.id).n}: teklif masada bekliyor.`, 'clock'); return; }
    if (a === 'no') { const ch = G.offerDecline(o); toast(tt`${G.club(o.id).n} teklifini reddettin.` + (ch.length ? ' · ' + ch.join(' · ') : ''), 'x'); return; }
    const r = G.offerSign(o); sfx.sign();   // imza ya da ön anlaşma
    if (r.done) { toast(o.renew ? tt('Sözleşmeni yeniledin.') : `${G.club(o.id).n}: ${o.loan ? tt('kiralık gidiyorsun') : tt('imza atıldı')}.`, 'pen'); if (!AUTO && !o.loan && !o.renew) { await signFlow(o); if (G.chance(.5)) await ivFlow('imza'); } }
    else await dialog({ art: clubArt(o.id, offerSub(o.id)), k: tt('Ön anlaşma'), t: tt`${G.club(o.id).n} ile anlaştın`, body: tt`<p>${o.win === 'kis' ? tt('Devre arası penceresi açılınca imzalar atılacak.') : tt('Sezon bitince imzalar atılacak.')} Haber sızdı: kulübünde hava biraz soğudu.</p>${chips(r.ch)}`, opts: [{ t: tt('Devam') }], auto: 0 });
    return;
  }
}
async function preMoveFlow(o) {
  sfx.sign(); toast(tt`${G.club(o.id).n}: imzalar atıldı.`, 'pen');
  if (AUTO) return;
  await dialog({ art: clubArt(o.id, offerSub(o.id)), k: tt('Transfer tamam'), t: G.club(o.id).n, body: tt('<p>Pencere açıldı, anlaştığın kulübe imzanı attın.</p>'), opts: [{ t: tt('Yeni kulübüme'), i: 'right' }], auto: 0 });
  if (!o.loan && !o.renew) await signFlow(o);
}
let goDesk = false;   // pencere açılış diyaloğundan teklif masasına geçiş
async function transferWindow(kind) {
  const s = G.S, expired = s.con.until < s.season;
  const pm = G.preDue(); if (pm) { await preMoveFlow(pm); return; }
  if (!AUTO && !expired) {   // teklifler artık masada birikir; dönem açılışında hatırlat
    const L = G.inbox(); if (!L.length) return;
    const j = await dialog({ art: tt`<div class="art t-fame"><div class="art-ic">${ic('swap', 150)}</div><div class="art-av">${persona(s.agent ? 'menajer' : 'baskan')}</div><span class="art-n">${kind === 'kis' ? tt('Devre arası') : tt('Yaz dönemi')}</span></div>`,
      k: kind === 'kis' ? tt('Devre arası') : tt('Yaz dönemi'), t: tt('Transfer dönemi açıldı'), body: tt`<p>Masanda ${L.length} teklif var. Dönem boyunca yenileri gelebilir; her teklifin son günü var.</p>`, opts: [{ t: tt('Teklif masasına git'), i: 'swap' }, { t: tt('Sonra bakarım'), c: 'ghost' }] });
    if (j === 0) goDesk = true;
    return;
  }
  let offers = expired ? G.inbox().filter(o => !o.loan) : G.genOffers(kind);
  if (expired) for (const o of G.genOffers(kind)) if (!offers.some(x => x.id === o.id)) offers.push(o);
  if (offers.length) await tip('transfer');
  if (expired) { const ren = G.renewal(); if (ren) offers.unshift(ren); if (!offers.length) offers = G.genOffers('serbest'); }
  if (!offers.length) return;
  for (;;) {
    const i = await dialog({
      art: tt`<div class="art t-fame"><div class="art-ic">${ic('swap', 150)}</div><div class="art-av">${persona(s.agent ? 'menajer' : 'baskan')}</div><span class="art-n">${kind === 'kis' ? tt('Devre arası') : tt('Yaz dönemi')}</span></div>`,
      t: expired ? tt('Sözleşmen bitti') : tt('Masanda teklif var'),
      opts: [...offers.map(o => ({ t: G.club(o.id).n, i: o.loan ? 'clock' : o.renew ? 'pen' : o.st === 'red' ? 'lock' : 'swap', s: `${o.loan ? tt('Kiralık') : o.renew ? tt('Yenileme') : o.fee ? tt('Bonservis ') + G.fmtS(o.fee) : tt('Serbest')} · ${ROLE[o.role]} · ${o.wage ? G.fmtS(o.wage) + tt('/hf') : tt('amatör')}${o.st === 'red' ? tt(' · kulübün reddetti') : ''}${o.via ? tt(' · menajerin getirdi') : ''}` })), ...(expired ? [] : [{ t: tt('Kulübümde kalıyorum'), c: 'ghost' }])],
    });
    if (i >= offers.length) return;
    const o = offers[i], red = o.st === 'red';
    const j = await dialog({
      art: clubArt(o.id, offerSub(o.id)), k: o.loan ? tt('Kiralık teklif') : o.renew ? tt('Yenileme') : tt('Transfer teklifi'), body: (o.renew ? '' : citySvg(cityOf(o.id), G.club(o.id).c1)) + offerHTML(o) + (o.renew ? '' : cmpHTML(G.moveInfo(o))),
      opts: [red ? { t: tt('Transfer isteği ver'), s: tt('Kulübü zorla: hoca ve taraftar tepki gösterir'), i: 'alert', dis: o.pushed } : { t: tt('İmzala'), i: 'pen' }, { t: tt('Pazarlık yap'), s: tt('Madde madde: ücret, imza parası, primler, süre'), i: 'coin', dis: !o.wage || o.loan || red || !!(o.ng && (o.ng.end || o.ng.pat <= 0)) }, { t: tt('Geri dön'), c: 'ghost' }],
    });
    if (j === 0 && red) { const r = G.pushTransfer(o); if (r.ok) sfx.up(); else sfx.bad(); await dialog({ art: art('baskan', 'lock', 'risk'), t: r.ok ? tt('Kapı açıldı') : tt('Kulüp direniyor'), body: tt`<p>${esc(r.text)}</p>${chips(r.ch)}`, opts: [{ t: tt('Devam') }], auto: 0 }); continue; }
    if (j === 0) { G.acceptOffer(o); sfx.sign(); toast(`${G.club(o.id).n}: ${o.loan ? tt('kiralık gidiyorsun') : tt('imza atıldı')}.`, 'pen'); if (!AUTO && !o.loan && !o.renew) { await signFlow(o); if (G.chance(.5)) await ivFlow('imza'); } return; }
    if (j === 1) {
      const gone = await negoFlow(o);
      if (gone) { offers.splice(i, 1); if (!offers.length) { if (expired) offers = G.genOffers('serbest'); else return; } }
    }
  }
}

// Maçın havası ve lig seviyesi: soyunma odasında görünür
const scnHTML = M => `<div class="stn st-acik">${ic(SCN[M.scn].i, 16)}<span><b>${SCN[M.scn].n}</b><small>${SCN[M.scn].d}</small></span></div><div class="kv">${ic('chart', 16)}<span>${tt('Lig seviyesi')}</span><b>${stars(G.hardStars(M.lh))}</b></div>`;

async function runMatch(fxt, rl, mode) {
  const s = G.S, M = G.buildMatch(fxt, rl), nat = M.nat; let sim = mode === 'sim' || AUTO; mSim = false;
  const ENVM = G.matchEnv(fxt, M.wx); let stad = null;   // stadyum: kademe, saat, doluluk
  const roar = us => { if (stad) stad.cheer((nat ? us : us === ENVM.home) ? 1 : .12); };
  M.gkw = nat ? null : G.gkWeak(fxt.opp).k; M.lines = ENVM.lines;   // rakip kalecinin zaafı; yan hakem var mı
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
    body: scnHTML(M) + tt`<p><b>${esc(G.coach().n)}:</b> "${TACT[M.tac].d}"</p><div class="kv">${ic('target', 16)}<span>Bu sisteme uyumun</span><b>%${M.fit}</b></div><div class="kv">${ic(WX[M.wx][1], 16)}<span>${WX[M.wx][0]}: ${WX[M.wx][2]}</span></div>${M.tasks.length ? tt`<div class="sub">${ic('whistle', 16)}Hocanın senden istediği</div>${G.taskState(M).map(t => tt`<div class="pc">${ic('target', 14)}<span>${t.t}</span></div>`).join('')}<p class="mut sm">Görevler hoca güvenini belirler; maçta karşına çıkacak anlar da bu plana göre şekillenir.</p>` : ''}`,
    opts: [{ t: tt('Sahaya çık'), i: 'ball' }], auto: 0, cls: 'ev',
  });
  if (!sim) await tunnelFlow(fxt, M, ENVM, rl);
  if (!AUTO) {
    V.scr = 'match'; app.dataset.scr = 'match';
    app.innerHTML = tt`<div class="match${euCls(fxt)}">
      <div class="m-h">${fxt.eu ? tt`<span class="eut">${euLogo(fxt.eu, 26)}${esc(fxt.name)} · ${fxt.round}</span>` : tag(lbl, fxt.cup || nat ? 'ye' : '')}${sim ? tt('<span class="where">simülasyon</span>') : tt('<button class="chip sm" data-a="msim">Kalanı simüle et</button>')}</div>
      <canvas id="stad" class="stad"></canvas>
      <div class="sb sb-t${ENVM.tier}${ENVM.tod === 'gun' ? ' sb-day' : ''}"><div class="tm">${home ? usC : opC}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${home ? opC : usC}<span>${esc(home ? opN : usN)}</span></div></div>
      ${sim ? '' : `<div class="myr" id="myr"><span>${M.on ? tt('Senin notun') : tt('Kulübedesin')}</span></div>`}${fxt.agg ? tt`<div class="aggb">${ic('swap', 14)}İlk maç ${fxt.agg[0]}-${fxt.agg[1]} · tur için toplam skor geçerli</div>` : ''}
      <canvas id="pitch" class="opch"></canvas>
      <div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
      <div class="momc" aria-label="${tt('Maçın baskı grafiği')}"><svg viewBox="0 0 90 20" preserveAspectRatio="none"><defs><clipPath id="mcu"><rect x="0" y="0" width="90" height="10"/></clipPath><clipPath id="mco"><rect x="0" y="10" width="90" height="10"/></clipPath></defs><line x1="0" y1="10" x2="90" y2="10"/><path id="mau" clip-path="url(#mcu)"/><path id="mao" clip-path="url(#mco)"/><path id="mal"/><line id="mnow" x1="0" y1="0" x2="0" y2="20"/></svg><div class="mcl"><span>${tt('Senin baskın ↑')}</span><span>${tt('Rakibin baskısı ↓')}</span></div></div>
      ${M.tac ? tt`<div class="tacs">${ic('whistle', 16)}<b id="tcn">${TACT[M.tac].n}</b><div id="tks">${taskChips()}</div></div>` : ''}
      ${sim ? '' : tt`<div class="mctl"><div class="stam">${ic('bolt', 18)}<div class="bar"><i id="stb" style="width:${M.stam}%"></i></div><b id="stv">${Math.round(M.stam)}</b></div>
        <div class="seg">${[['d', tt('Defansif'), 'shield'], ['n', tt('Dengeli'), 'target'], ['o', tt('Ofansif'), 'bolt']].map(([k, l, i]) => tt`<button class="${k === 'n' ? 'on' : ''}" data-a="mmode" data-v="${k}">${ic(i, 14)}${l}</button>`).join('')}</div>
        <div class="mbt"><button class="chip sm" data-a="mcall">${ic('ball', 14)} Topu iste (2)</button>${M.crowd ? tt`<button class="chip sm" data-a="mcrowd">${ic('users', 14)} Tribünü coştur</button>` : ''}</div></div>`}
      <div id="feed" class="feed"></div></div>`;
    feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(ENVM.tier, ENVM.fill); if (fxt.eu) sfx.anthem(); else sfx.whistle(1);
    const pc = nat ? '#d81e2c' : G.club(s.clubId).c1; let po = nat ? '#3b4754' : G.club(fxt.opp).c1; if (po === pc) po = nat ? '#f2f2f2' : G.club(fxt.opp).c2;
    pitch = new Pitch($('#pitch'), { cu: pc, co: po, me: rl === 'yedek' ? -1 : PSLOT[s.pos], flip: !home, wx: M.wx, env: ENVM });
    stad = new StadView($('#stad'), ENVM);
    if (!M.on) { const mc = $('.mctl'); if (mc) mc.classList.add('off'); }   // kulübedeyken kontroller kapalı
  }
  curM = M;
  const tkUpd = () => { const e = $('#tks'); if (e && M.tac) { e.innerHTML = taskChips(); $('#tcn').textContent = TACT[M.tac].n; } };
  const stamUpd = () => { const b = $('#stb'); if (!b) return; b.style.width = M.stam + '%'; b.parentElement.classList.toggle('low', M.stam < 30); $('#stv').textContent = Math.round(M.stam); };
  // gol sonrası VAR: us gol bizim mi, mine golü oyuncu mu attı
  const vr = async (us, mine, min) => {
    const v = G.varCheck(M, us); if (!v) return;
    if (v.noVar) {   // VAR yok: karar sahada kalır
      if (us) { M.usG--; M.varAg = true; if (mine) { M.pg--; M.rt -= 1.1; if (M.goals) M.goals.pop(); } } else M.oppG--;
      put(min, ENVM.lines ? tt('Yan hakem bayrağı kaldırdı: ofsayt, gol sayılmadı.') : tt('Hakem ofsayt düdüğünü çaldı: gol sayılmadı.'), us ? 'b' : 'g', 'x'); if (!AUTO) { if (us) sfx.conceded(); else sfx.goal(); }
      if (us && !sim && G.protestDue(M)) {   // kaptan itiraz edebilir: karar sahada döner ya da kart çıkar
        const pc = await dialog({ art: art('takim', 'crown', 'risk'), k: tt`${min}. dakika`, t: tt('Kaptan, bir şey yap!'), body: `<p>${tt('Takım arkadaşların hakemin etrafını sardı, sana bakıyorlar. VAR yok: karar hakemin dudağında.')}</p>`, opts: [{ t: tt('Hakemle konuş'), s: tt('Karar dönebilir; sarı kart riski'), i: 'mic' }, { t: tt('Takımı sakinleştir'), s: tt('Oyun devam eder'), i: 'users' }], grid: true, cls: 'ev' });
        const pr = G.capProtest(M, pc);
        if (pr.ok) { M.usG++; M.varAg = false; if (mine) { M.pg++; M.rt += 1.1; } mark(min, 'g'); bump(); if (!AUTO) sfx.goal(); }
        pr.lines.forEach(l => put(min, l.s, l.c || 'm', pr.ok ? 'check' : 'whistle')); upd(min);
      }
      return;
    }
    const pe = $('#pitch'); if (pe) pe.classList.add('var');
    put(min, tt('VAR incelemesi başladı...'), 'var', 'eye'); if (!AUTO) sfx.card(); await wait(1900);
    if (pe) pe.classList.remove('var');
    if (v.cancel) {
      if (us) { M.usG--; M.varAg = true; if (mine) { M.pg--; M.rt -= 1.1; if (M.goals) M.goals.pop(); } } else M.oppG--;
      put(min, tt`GOL İPTAL: ${v.why}.`, us ? 'b' : 'g', 'x'); if (!AUTO) { if (us) sfx.conceded(); else sfx.goal(); }
    } else put(min, tt('VAR kararı: gol geçerli.'), us ? 'g' : 'b', 'check');
  };
  // Baskı (momentum): her olayda tabana doğru söner; gol ve iyi/kötü anlar itki verir
  const mb = G.clamp((nat ? (fxt.usR || 70) - ((fxt.opp && fxt.opp.r) || 70) : (s.rt[s.clubId] || 50) - (s.rt[fxt.opp] || 50)) / 30, -.25, .25) + (home ? .05 : -.03), mpts = [0];
  let mv = mb, mlast = 0;
  const momDraw = min => {
    for (let m = mlast + 1; m <= Math.min(120, min); m++) { mv += (mb - mv) * .06 + (Math.random() - .5) * .22; mpts[m] = G.clamp(mv, -1, 1); }
    mlast = Math.max(mlast, Math.min(120, min)); const sx = 90 / Math.max(90, mlast);
    const line = mpts.map((v, i) => `${(i * sx).toFixed(2)},${(10 - (v || 0) * 9).toFixed(2)}`).join(' L'), area = `M0,10 L${line} L${(mlast * sx).toFixed(2)},10 Z`;
    const u = $('#mau'), o = $('#mao'), l = $('#mal'), n = $('#mnow'); if (!u) return;
    u.setAttribute('d', area); o.setAttribute('d', area); l.setAttribute('d', 'M' + line); n.setAttribute('x1', (mlast * sx).toFixed(2)); n.setAttribute('x2', (mlast * sx).toFixed(2));
  };
  const put = (min, txt, cls = '', icon = '') => { if (cls === 'g') mv = G.clamp(mv + .55, -1, 1); else if (cls === 'b') mv = G.clamp(mv - .55, -1, 1); else if (icon === 'target') mv = G.clamp(mv + .25, -1, 1); else if (icon === 'alert' || icon === 'shield') mv = G.clamp(mv - .15, -1, 1); if (feed) feed.insertAdjacentHTML('afterbegin', tt`<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); if (!sim && !AUTO && cls && cls !== 'var') spiker.say(txt, cls === 'g'); };
  const mark = (min, cls) => { if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${cls}" style="left:${Math.min(100, min / 90 * 100)}%"></i>`); };
  const upd = min => {
    if (!sc) return; momDraw(min); mn.textContent = min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, min / 90 * 100) + '%';
    const my = $('#myr'); if (my && M.on) { const r = G.clamp(M.rt, 3, 10), k = M.mom > 0; my.innerHTML = `<span>${tt('Senin notun')}</span><b class="${k && r >= 7.5 ? 'hi' : k && r < 6 ? 'lo' : ''}">${k ? dec(r, 1) : '–'}</b><span>${tt`${M.pg} gol · ${M.ok}/${M.mom} an`}</span>`; }   // canlı maç notu
  };
  const bump = () => { if (sc) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } };
  const wait = ms => sleep(sim ? Math.min(ms, 90) : ms);
  put(1, rl === 'yedek' ? tt('Maç başladı. Yedek kulübesindesin.') : tt('İlk düdük! Sahadasın.'), '', 'whistle');
  if (M.awayEu) put(1, tt('Deplasman tribünü ıslıkla karşıladı. Bu gece her top zor.'), '', 'users');
  { const ch = G.chantBoost(M); if (ch) { put(1, tt`Tribün adını söylüyor: "${ch}"`, 'm', 'users'); if (stad) stad.cheer(1); stamUpd(); } }
  if (M.scn !== 'denge') put(1, `${SCN[M.scn].n}: ${SCN[M.scn].d}`, '', SCN[M.scn].i);
  if (M.prep) put(1, tt('Rakip analizi cebinde: ne yapacaklarını biliyorsun.'), '', 'eye');
  if (M.wx !== 'acik') put(1, `${WX[M.wx][0]}: ${WX[M.wx][2]}`, '', WX[M.wx][1]);
  if (M.mark && rl !== 'yedek') { const d = G.duelOf(M.mark, fxt.opp); put(1, (s.pos === 'DF' || s.pos === 'KL' ? tt`Bugün karşında ${M.mark} var.` : tt`Seni bugün ${M.mark} tutuyor.`) + (d ? tt` Aranızdaki hesap: ${d[0]}-${d[1]}.` : ''), '', 'eye'); }
  if (capLine) put(1, capLine, 'm', 'crown');
  await wait(700);
  for (let i = 0; i < M.tl.length; i++) {
    if (mSim) sim = true;
    if (!sim && M.want && M.on && !M.red && !M.off) { M.want = 0; M.tl.splice(i, 0, { min: M.tl[i].min, t: 'mom', k: G.momPick(M) }); put(M.tl[i].min, tt('Elini kaldırdın, topu istedin.'), 'm', 'ball'); }
    const e = M.tl[i];
    if (!sim && G.subAskDue(M, e.min)) {   // yorgunluk: hoca kenardan sorar
      const sc2 = await dialog({ art: art('hoca', 'swap', 'club'), k: tt`${e.min}. dakika`, t: tt('Hoca kenardan soruyor'), body: `<p>${tt('Bacakların ağırlaştı. Hoca eliyle işaret ediyor: "Devam edebilecek misin?"')}</p><div class="kv">${ic('bolt', 16)}<span>${tt('Kondisyon')}</span><b class="neg">${Math.round(M.stam)}</b></div><div class="kv">${ic('heart', 16)}<span>${tt('Sağlık')}</span><b>%${Math.round(G.health())}</b></div>`, opts: [{ t: tt('Devam ederim'), s: tt('Sakatlık riski artar'), i: 'shield' }, { t: tt('Çıkayım'), s: tt('Maç senin için biter; vücudun korunur'), i: 'swap' }], grid: true, cls: 'ev' });
      G.subAsk(M, sc2).forEach(l => put(e.min, l.s, 'm', 'whistle'));
      if (M.off && stad) stad.cheer(M.rt >= 6.8 && ENVM.home ? .8 : .2);
    }
    if (!sim && M.on) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 1.3 : M.mode === 'd' ? .4 : .8) * (M.drain || 1)); stamUpd(); }
    upd(e.min); await wait(380);
    if (e.t === 'txt') {
      put(e.min, e.s); if (pitch) pitch.poss(G.chance(.5));
      if (e.in) { M.on = true; if (pitch) pitch.me = PSLOT[s.pos]; const mc = $('.mctl'); if (mc) mc.classList.remove('off'); if (!sim) sfx.whistle(1); }   // artık sahadasın
      if (!sim && M.mode === 'o' && M.on && !M.red && !M.off) {   // ofansif oyun: fazladan pozisyon, arkada boşluk
        if (G.chance(.22)) M.tl.splice(i + 1, 0, { min: e.min, t: 'mom', k: G.momPick(M) });
        else if (G.chance(.12)) M.tl.splice(i + 1, 0, { min: e.min, t: 'bg', us: false });
      }
    } else if (e.t === 'tac') {
      if (!M.red && !M.off) {   // hoca kenardan sistemi değiştirir
        const r = G.tacShift(M, e.min); put(e.min, r.line, 'm', 'whistle'); if (!sim) sfx.whistle(1);
        if (r.add.length) { const tail = M.tl.splice(i + 1); tail.push(...r.add); tail.sort((a, b) => a.min - b.min); M.tl.push(...tail); }
        tkUpd(); await wait(900);
      }
    } else if (e.t === 'bg' && !sim && M.on && M.mode === 'd' && G.chance(.3)) put(e.min, e.us ? tt('Geride bekliyorsunuz; atak sonuçsuz kaldı.') : tt('Kapalı savunma rakip atağı kesti.'), '', 'shield');
    else if (e.t === 'bg') {
      if (pitch) { pitch.attack(e.us); if (!sim) await wait(750); pitch.goal(e.us); } roar(e.us);
      if (e.us) { M.usG++; const sn = !nat && s.sc[s.clubId] ? G.pick(s.sc[s.clubId])[0] : tt('Takım arkadaşın'); put(e.min, tt`GOL! ${sn}`, 'g', 'ball'); mark(e.min, 'g'); if (!sim) sfx.goal(); }
      else { M.oppG++; put(e.min, nat ? tt`${opN} golü buldu.` : tt`${G.sqName(fxt.opp, 'FV')} attı: ${opN} golü buldu.`, 'b', 'ball'); mark(e.min, 'b'); if (!sim) sfx.conceded(); }
      upd(e.min); bump(); await wait(560);
      await vr(e.us, false, e.min); upd(e.min); tkUpd();
    } else if (e.t === 'dec') {
      if (!sim && !M.red && !M.off) {
        const D = DEC[e.k], g0 = M.usG; if (e.k === 'ht') { M.stam = Math.min(100, M.stam + (G.perk('nefes') ? 25 : 12)); stamUpd(); }   // devre arası nefes
        const H = e.k === 'ht' ? G.htTalk(M) : null;   // hocanın konuşması ve ikinci yarı isteği
        const dopt = { k: tt`${e.min}. dakika`, t: D.t, body: tt`<p>${esc(G.decText(M, e.k))}</p>` + (H ? htHTML(M, H) : ''), opts: D.o.map((t, x) => ({ t, s: D.s[x], i: (D.ic || [])[x], dis: !!H && x === 4 && !(H.cold || M.usG < M.oppG) })), cls: 'ev' + (H ? ' locker' : ''), grid: true };
        if (H) { put(e.min, tt('Devre düdüğü: takım soyunma odasına gidiyor.'), '', 'whistle'); sfx.whistle(2); await wait(700); }
        const c = H ? await sceneDialog((g, t, W2, H2) => lockerDraw(g, t, W2, H2, lockO('ht', M)), dopt) : e.k === 'knock' ? await sceneDialog((g, t, W2, H2) => injuryDraw(g, t, W2, H2, { env: ENVM, ...kitMe() }), dopt) : await dialog({ ...dopt, art: art(D.p, D.i, 'risk') });
        const r = G.decide(M, e.k, c, e.min);
        if (M.off) { const okk = M.rt >= 6.8; put(e.min, okk ? tt('Kenara gelirken tribün seni ayakta alkışladı.') : tt('Kenara gelirken tribünden ıslıklar yükseldi.'), 'm', 'users'); if (stad) stad.cheer(okk && ENVM.home ? .8 : .1); }
        r.lines.forEach(l => put(e.min, l.s, l.c || 'm', l.c === 'g' ? 'ball' : 'whistle'));
        if (M.usG > g0) { mark(e.min, 'g'); bump(); sfx.goal(); }
        if (r.add.length) { const tail = M.tl.splice(i + 1); tail.push(...r.add); tail.sort((a, b) => a.min - b.min); M.tl.push(...tail); }
        upd(e.min); await wait(600);
      }
    } else if (e.t === 'mom' && M.on && !M.red && !M.off) {
      let k = e.k, bonus = false, from = null;
      const lbl = () => `${e.min}' · ${MOM[k].n}`;
      const myGoal = () => { mark(e.min, 'g me'); bump(); if (!AUTO) sfx.goal(); if (pitch) pitch.goal(true); roar(true); };
      const cele = async () => {   // maçın ilk golünde sevinç seçilir
        if (sim || M.celeb || M.red) return; M.celeb = 1;
        const ci = await dialog({ art: art('taraftar', 'star', 'fame'), k: tt`${e.min}. dakika`, t: tt('Gol sevinci'), opts: G.CELEB.map(c => ({ t: c.t, s: c.s, i: c.i })), cls: 'ev', grid: true }), ch = G.celebrate(M, ci);
        put(e.min, G.CELEB[ci].t + (ch.length ? ' · ' + ch.slice(0, 3).join(' · ') : ''), 'm', G.CELEB[ci].i); if (M.red) put(e.min, tt('İkinci sarı! Kırmızı kart gördün.'), 'b', 'alert');
      };
      for (;;) {
        if (e.kader && !bonus) put(e.min, tt('KADER ANI: turun anahtarı senin ayağında.'), 'm', 'star');
        const vk = bonus ? null : G.momVar(M, e, k), VR = vk ? MVAR[vk] : null;
        put(e.min, MOM[k].i, 'm', 'target'); if (VR) put(e.min, `${VR.n}: ${VR.d}`, 'm', 'alert'); if (pitch) pitch.focus(); await wait(sim ? 620 : 1100);
        if (vk === 'kontra' && k === 'sut' && !sim) {   // önün açık: nasıl bitireceğine sen karar verirsin
          const ch = await dialog({ art: art('takim', 'right', 'club'), k: tt`${e.min}. dakika`, t: tt('Kontra: önün açık'), body: tt('<p>Savunma geride kaldı. Yanında bir arkadaşın koşuyor, kaleci çizgisinde.</p>'), opts: [{ t: tt('Kendin bitir'), s: tt('Şut: gol senin olur'), i: 'target' }, { t: tt('Boştaki arkadaşa ver'), s: tt('Pas: asist şansı yüksek'), i: 'swap' }, { t: tt('Kaleciyi de geç'), s: tt('Çalım: tutarsa boş kaleye'), i: 'bolt' }], cls: 'ev' });
          k = ['sut', 'pas', 'calim'][ch];
        }
        let vx = null;   // bu ana özel seçim
        if (!sim && bonus && k === 'sut' && (from === 'kosu' || from === 'calim')) {   // kaleciyle karşı karşıya
          const gw = M.gkw === 'bire' ? `<p class="note">${tt('Bu kaleci bire birde erken çıkıyor: aşırtma ve çalım daha kolay.')}</p>` : '';
          const ch = await dialog({ art: art('takim', 'target', 'club'), k: tt`${e.min}. dakika`, t: tt('Kaleciyle karşı karşıyasın'), body: gw, opts: [{ t: tt('Plase'), s: tt('Köşeyi seç: isabet kolaylaşır'), i: 'target' }, { t: tt('Aşırtma'), s: tt('Kaleci öne çıkmış: topun altına vur, yumuşak kaydır'), i: 'up' }, { t: tt('Kaleciyi geç'), s: tt('Çalım: tutarsa boş kale'), i: 'bolt' }], cls: 'ev', grid: true });
          if (ch === 2) {
            const g1 = M.usG, rr = await playMini('calim', M.oppR - (M.gkw === 'bire' ? 6 : 0), lbl(), { env: ENVM, lh: M.lh, bonus: true, opp: nat ? null : fxt.opp, nat, focus: M.focus, big: M.big });
            M.cmin = e.min; G.roundKeeper(M, rr.out === 'gecti').forEach(l => put(e.min, l.s, l.c || '', l.c === 'g' ? 'ball' : ''));
            if (M.usG > g1) { myGoal(); upd(e.min); tkUpd(); await wait(680); await vr(true, true, e.min); if (M.usG > g1) await cele(); }
            upd(e.min); tkUpd(); break;
          }
          vx = ch === 1 ? { rushy: 1, acc: 1.1 } : { acc: .82 };
        }
        if (!sim && k === 'penalti') {   // penaltıyı nasıl kullanacaksın
          const ch = await dialog({ art: art('takim', 'target', 'club'), k: tt`${e.min}. dakika`, t: tt('Penaltıyı nasıl kullanacaksın?'), body: M.gkw === 'pen' ? `<p class="note">${tt('Bu kaleci penaltılarda erken yatıyor.')}</p>` : '', opts: [{ t: tt('Köşeye vur'), s: tt('Bildiğin vuruş'), i: 'target' }, { t: tt('Duraksayarak vur'), s: tt('Kaleci erken yatar ama isabet zorlaşır'), i: 'clock' }, { t: 'Panenka', s: tt('Ortaya aşırt: tutarsa efsane, tutmazsa rezalet'), i: 'star' }], cls: 'ev', grid: true });
          if (ch === 2) {
            const g1 = M.usG; M.cmin = e.min; G.panenka(M).forEach(l => put(e.min, l.s, l.c || '', 'ball'));
            if (M.usG > g1) { myGoal(); upd(e.min); tkUpd(); await wait(680); await vr(true, true, e.min); if (M.usG > g1) await cele(); } else if (!AUTO) sfx.ooh();
            upd(e.min); tkUpd(); await wait(500); break;
          }
          if (ch === 1) vx = { fake: 1, acc: 1.3 };
        }
        let wall = null;
        if (k === 'duvar' && !sim) { const wc = await dialog({ art: art('takim', 'shield', 'club'), k: tt`${e.min}. dakika`, t: tt('Barajı kur'), body: tt('<p>Kaç kişi dizersen, vuruş ona göre gelir.</p>'), opts: [{ t: tt('Beş kişi'), s: tt('Düz vuruş kapanır; top köşeye, barajın üstünden gelir'), i: 'shield' }, { t: tt('Dört kişi'), s: tt('Dengeli'), i: 'users' }, { t: tt('Üç kişi'), s: tt('Topu iyi görürsün ama sert ve ortaya yakın gelir'), i: 'eye' }], cls: 'ev' }); wall = [[.88, 1.14], [.6, 1], [.3, .9]][wc]; }
        const g0 = M.usG, o0 = M.oppG, crowd = M.crowdOn; M.crowdOn = 0;
        if (!sim) { M.stam = Math.max(0, M.stam - (M.mode === 'o' ? 8 : M.mode === 'd' ? 5 : 6) * (M.drain || 1)); stamUpd(); }
        const res = sim ? G.simMoment(k, M, vk) : await playMini(k, M.oppR, `${e.min}' · ${e.kader ? tt('Kader anı') : MOM[k].n}${VR ? ' · ' + VR.n : ''}`, { env: ENVM, lh: M.lh, prep: M.prep, gkw: M.gkw, vr: vx ? { ...(VR && MVAR[vk].k.includes(k) ? VR.vr : {}), ...vx } : VR && MVAR[vk].k.includes(k) ? VR.vr : null, wall, wxh: WX[M.wx][4].includes(k) ? WX[M.wx][5] : 1, bonus, opp: nat ? null : fxt.opp, nat, focus: M.focus, crowd, big: M.big, adapt: M.adapt, tired: M.stam < 15 ? 1.3 : M.stam < 30 ? 1.15 : 1 });
        M.cmin = e.min; const r = G.applyMoment(M, k, res, vk);
        r.lines.forEach(l => put(e.min, l.s, l.c || '', l.c === 'g' || l.c === 'b' ? 'ball' : ''));
        if (M.usG > g0) { mark(e.min, 'g me'); bump(); if (sim && !AUTO) sfx.goal(); if (pitch) pitch.goal(true); roar(true); }
        if (M.oppG > o0) { mark(e.min, 'b'); bump(); if (!AUTO) sfx.conceded(); if (pitch) pitch.goal(false); roar(false); }
        if (res.out === 'faul' && !AUTO) sfx.card();
        upd(e.min); tkUpd(); await wait(680);
        if (res.out === 'gol' && M.usG > g0) { await vr(true, true, e.min); upd(e.min); tkUpd(); if (M.usG > g0) await cele(); }
        if (r.chain) { from = k; k = r.chain; bonus = true; continue; }
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
    // seri: beşer atış, eşitse birer atış. Sıran gelince sen atarsın; kaleciysen rakibin atışlarında kaledesin
    const P = G.shootStart(M), act = M.on && !M.off && !M.red, mopt = { env: ENVM, opp: nat ? null : fxt.opp, nat }; let box = null;
    if (feed) { feed.insertAdjacentHTML('beforebegin', '<div class="pso" id="pso"></div>'); box = $('#pso'); }
    const dots = a => Array.from({ length: Math.max(5, a.length) }, (_, x) => `<i class="${a[x] == null ? '' : a[x] ? 'g' : 'b'}"></i>`).join('');
    const draw = () => { if (!box) return; const R = G.shootState(P); box.innerHTML = `<div><b>${esc(usN)}</b><span>${dots(P.us)}</span><em>${R.su}</em></div><div><b>${esc(opN)}</b><span>${dots(P.opp)}</span><em>${R.so}</em></div>`; };
    draw();
    for (let n = 0; n < 40; n++) {
      let ok;
      if (act && !P.kl && n === P.mine) { const res = sim ? G.simMoment('penalti', M) : await playMini('penalti', M.oppR, tt('Seri penaltılar'), mopt); ok = res.out === 'gol'; M.rt += ok ? .4 : -.5; put(120, ok ? tt('Penaltını gole çevirdin.') : tt('Penaltını kaçırdın.'), ok ? 'g' : 'b', 'ball'); }
      else { ok = G.chance(P.pu); put(120, ok ? tt`${n + 1}. atış: ${usN} attı.` : tt`${n + 1}. atış: ${usN} kaçırdı.`, ok ? 'g' : 'b', 'ball'); }
      P.us.push(ok); draw(); await wait(650); if (G.shootState(P).over) break;
      if (act && P.kl && !sim && n < 5 && n % 2 === 0) { const res = await playMini('penkurtar', M.oppR, tt('Seri penaltılar'), mopt); ok = res.out !== 'kurtardi'; if (!ok) M.rt += .5; put(120, ok ? tt`${n + 1}. atış: ${opN} attı.` : tt('Köşeyi bildin, kurtardın!'), ok ? 'b' : 'g', 'ball'); }
      else { ok = G.chance(P.po); put(120, ok ? tt`${n + 1}. atış: ${opN} attı.` : tt`${n + 1}. atış: ${opN} kaçırdı.`, ok ? 'b' : 'g', 'ball'); }
      P.opp.push(ok); draw(); await wait(650); if (G.shootState(P).over) break;
    }
    const PR = G.shootState(P); pens = PR.win; put(120, tt`Seri bitti: ${PR.su}-${PR.so}.`, pens ? 'g' : 'b', 'whistle');
    put(90, pens ? tt('Seriyi kazandınız, tur sizin!') : tt('Seri rakibin oldu.'), pens ? 'g' : 'b', 'trophy'); await wait(900);
  }
  if (!sim && ENVM.tier >= 4 && !M.et) { put(90, tt`Dördüncü hakem tabelayı kaldırdı: +${2 + (M.usG + M.oppG) % 4} dakika.`, '', 'clock'); await wait(500); }
  put(90, tt('Son düdük.'), '', 'whistle'); if (!AUTO) { sfx.whistle(3); sfx.ambOff(); } await wait(800);
  if (M.stam < 15) M.risk = Math.max(M.risk || 1, 1.5);
  curM = null; if (pitch) pitch.stop(); if (stad) stad.stop(); spiker.stop();
  const rep = G.postMatch(M), win = M.ko ? tu() > to() || pens === true : M.usG > M.oppG;
  if (!AUTO && fxt.final && win) sfx.trophy();
  if (rep.unused) {   // kulübede kaldın: maç notu, röportaj, kutlama yok
    await dialog({
      art: `<div class="art res t-life"><div class="art-av">${avatar(s.look, nat ? '#d81e2c' : G.club(s.clubId).c1, nat ? '#f2f2f2' : G.club(s.clubId).c2, { age: s.age })}</div><div class="rate"><b>${ic('clock', 30)}</b><small>${tt('KULÜBEDE')}</small></div></div>`,
      k: tt('Bugün forma şansı gelmedi'), t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? tt(' (pen.)') : ''}`,
      body: chips(rep.lines) + `<p class="mut sm">${tt('Kadro yerin idman temposuna ve maç notlarına göre belirlenir. Çalışmaya devam et.')}</p>`, opts: [{ t: tt('Devam') }], auto: 0,
    });
    if (nat) return { us: M.usG, opp: M.oppG, win: M.ko ? win : M.usG > M.oppG };
    return fxt.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: 0 };
  }
  const rj = await dialog({
    art: tt`<div class="art res ${win ? 't-club' : M.usG < M.oppG || pens === false ? 't-risk' : 't-life'}"><div class="art-av">${avatar(s.look, nat ? '#d81e2c' : G.club(s.clubId).c1, nat ? '#f2f2f2' : G.club(s.clubId).c2, { mood: rep.rt >= 7 ? 'joy' : rep.rt < 6 ? 'ang' : '', age: s.age, cap: !!s.fl.kaptan })}</div><div class="rate ${rep.rt >= 7 ? 'hi' : rep.rt < 6 ? 'lo' : ''}"><b>${dec(rep.rt, 1)}</b><small>MAÇ NOTU</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens != null ? tt(' (pen.)') : ''}`, k: fxt.leg === 2 ? tt`Toplam ${tu()}-${to()} · ${win ? tt('tur sizin') : tt('elendiniz')}` : fxt.leg === 1 ? tt('İlk maç bitti · rövanş bekliyor') : '',
    body: tt`<div class="stts"><div class="stt">${ic('ball', 18)}<b>${M.pg}</b><small>Gol</small></div><div class="stt">${ic('swap', 18)}<b>${M.pa}</b><small>Asist</small></div><div class="stt">${ic('target', 18)}<b>${M.ok}/${M.mom}</b><small>An</small></div></div>${M.tasks.length ? tt`<div class="tkr">${G.taskState(M).map(t => tt`<span class="tk ${t.ok ? 'ok' : 'no'}">${ic(t.ok ? 'check' : 'x', 13)}${t.t}</span>`).join('')}</div>` : ''}${chips(rep.lines)}`,
    opts: [{ t: tt('Devam') }, { t: tt('Maç kartını paylaş'), s: tt('Sonucu görsel olarak kaydet ya da gönder'), i: 'phone', c: 'ghost' }, ...(M.goals && M.goals.length && !AUTO ? [{ t: tt('Golünü tekrar izle'), s: tt('Sahada yeniden oynar; gol kartını paylaşabilirsin'), i: 'ball', c: 'ghost' }] : [])], auto: 0,
  });
  if (rj === 2) await replayFlow(M, fxt);
  const lmood = AUTO ? '' : G.lockerMood(M, win, M.usG < M.oppG);   // büyük gecelerin ardından soyunma odası
  if (lmood) {
    const cap = !!s.fl.kaptan, ci = await sceneDialog((g, t, W2, H2) => lockerDraw(g, t, W2, H2, lockO(lmood)), { k: tt('Soyunma odası'), t: lmood === 'win' ? tt('Şarkılar, su şişeleri, kahkaha') : tt('Kimse konuşmuyor'), body: cap ? `<p>${tt('Kaptan sensin. Gözler sende.')}</p>` : '', opts: cap ? G.CAPL[lmood].map(o => ({ t: o[0], i: o[1] })) : [{ t: tt('Devam') }], grid: cap, auto: 0, cls: 'ev locker' });
    if (cap) { const ch = G.capLocker(lmood, ci); if (ch.length) toast(ch.join(' · '), 'users'); }
  }
  if (rj === 1) { const cc = nat ? { c1: '#d81e2c' } : G.club(s.clubId); await shareCard({ c1: cc.c1, tag: tt(lbl).toLocaleUpperCase(LC), big: dec(rep.rt, 1), bigL: tt('MAÇ NOTU'), title: [`${home ? usN : opN} ${home ? M.usG : M.oppG}-${home ? M.oppG : M.usG}`, home ? opN : usN], sub: `${s.name} · ${POS[s.pos].n}`, stats: [[M.pg, tt('Gol')], [M.pa, tt('Asist')], [`${M.ok}/${M.mom}`, tt('An')]], text: tt`Toprak Saha: ${s.name}, maç notu ${dec(rep.rt, 1)}.` }); }
  if (!AUTO && !nat) {   // iyi maç, derbi, final ya da kötü gün: mikrofonlar uzanır
    const must = !!fxt.final && win, hot = (rep.rt >= 8.2 || M.pg >= 3 || (M.derby && win)) && G.chance(.5), cold = (rep.rt < 5.2 || M.red) && G.chance(.25);
    if (must || (G.ivDue() && (hot || cold))) await ivFlow('post', fxt, M);   // özel geceler dışında mikrofon birkaç haftada bir uzanır
  }
  if (nat) return { us: M.usG, opp: M.oppG, win: M.ko ? win : M.usG > M.oppG };
  return fxt.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.pg };
}

// Maç önü / maç sonu röportajı: duruma göre seçilen, tekrar etmeyen sorular
async function ivFlow(kind, fxt, M) {
  const qs = G.ivPick(kind, fxt, M, 1), all = [];   // tek soru: mikrofon kısa uzanır
  const ttl = kind === 'pre' ? tt('Maç önü röportajı') : kind === 'imza' ? tt('İmza töreni') : tt('Maç sonu röportajı');
  for (let n = 0; n < qs.length; n++) {
    const q = qs[n];
    const j = await dialog({ art: ivArt(), k: qs.length > 1 ? `${ttl} · ${n + 1}/${qs.length}` : ttl, t: q.q, opts: [...q.a.map(a => ({ t: a.t })), ...(n === 0 && kind !== 'imza' ? [{ t: tt('Konuşmadan geç'), s: tt('Basın bunu not eder'), c: 'ghost' }] : [])], cls: 'ev',
      ...(n === 0 && kind !== 'imza' ? { timer: 12, tdef: q.a.length } : {}) });   // mikrofon 12 sn bekler, cevap gelmezse geçilir
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
  await docFlow(r);
  await tourFlow();
  if (s.age >= 40) { await info(tt('Zaman doldu'), tt('Kırk yaşına geldin. Krampon asma vakti.')); return retireFlow(); }
  if (s.age >= 30) {
    const j = await dialog({ t: tt('Devam mı, veda mı?'), body: tt`<p>${s.age} yaşındasın. İstersen kramponları asabilirsin.</p>`, opts: [{ t: tt('Devam ediyorum'), i: 'right' }, { t: tt('Emekli ol'), c: 'ghost' }], auto: 0 });
    if (j === 1) return retireFlow();
  }
  const oi = await dialog({ art: art('ark', 'cal', 'life'), k: tt('Sezon arası'), t: tt('Tatili nasıl geçireceksin?'), opts: G.OFF.map(o => ({ t: o.t, s: o.s, i: o.i })), cls: 'ev' });
  const och = G.offseason(oi); if (och.length) toast(och.join(' · '), 'check');
  await transferWindow('yaz');
  await campFlow();
}

async function retireFlow(reason) {
  const s = G.S, r = G.retire(), t = r.t, c = G.club(s.clubId);
  const paths = [];
  if (s.at.zihin >= 65 || s.fl.kaptan || s.fl.uni) paths.push(['Antrenör', 'whistle', tt('Lisanslarını aldın. İlk işin, kariyerine başladığın ligde bir takım. Kenardan bağıran artık sensin.')]);
  if (s.fol >= 150000) paths.push([tt('Yorumcu'), 'mic', tt('Ekran seni sevdi. Her hafta milyonlar yorumunu bekliyor; eski takım arkadaşların ise tedirgin.'), 'pundit']);
  if (s.rep >= 25) paths.push([tt('Menajer'), 'pen', tt('Telefon rehberin servet değerinde. İlk müşterin, mahallenden çıkan on altı yaşında bir çocuk.'), 'agent']);
  if (s.money >= 30000000) paths.push(['Kulüp başkanı', 'crown', tt`${s.prov} futboluna yatırım yaptın. Tesisler yenilendi; tribünler adını haykırıyor.`]);
  paths.push([tt('Futbol okulu sahibi'), 'book', tt('Memlekette bir futbol okulu açtın. Sabah çocuklara top sürdürüyor, akşam scoutlarla çay içiyorsun.'), 'school']);
  paths.push([tt('Halı saha işletmecisi'), 'ball', tt('Memlekette bir halı saha açtın. Duvarda formaların asılı; akşamları çocuklara şut çektiriyorsun.')]);
  const i = await dialog({ t: reason ? tt('Kariyerin sona erdi') : tt('Jübile'), body: tt`<p>${esc(reason || tt('Son maçında tribünler ayakta. Futboldan sonra ne yapacaksın?'))}</p>`, opts: paths.map(p => ({ t: p[0], i: p[1], s: p[0] === 'Antrenör' || p[0] === 'Kulüp başkanı' ? tt('Aynı dünyada kenardan devam edebilirsin') : p[3] ? tt('Aynı dünyada iş hayatına devam edebilirsin') : '' })), auto: paths.length - 1 });
  sfx.trophy();
  if (paths[i][0] === 'Antrenör' || paths[i][0] === 'Kulüp başkanı') {
    const role = paths[i][0] === 'Antrenör' ? 'coach' : 'pres';
    const j = await dialog({ art: art(role === 'coach' ? 'hoca' : 'baskan', role === 'coach' ? 'whistle' : 'crown', 'club'), k: tt`Efsane puanın ${num(r.score)} · ${r.title}`, t: tt('Hikâye burada bitmek zorunda değil'), body: tt`<p>${role === 'coach' ? tt('Lisansların hazır. Aynı liglerde, aynı kulüplerle bu kez kenarda yer alabilirsin: taktik, idman, devre arası kararları senin.') : tt('Birikiminle bir kulübün başına geçebilirsin: bütçe, tesis, hoca ve transfer kararları senin.')}</p>`, opts: [{ t: tt('Kenarda devam et'), i: 'right' }, { t: tt('Kariyeri burada bitir'), c: 'ghost' }], auto: 1 });
    if (j === 0 && await mgrJobFlow(role)) return;
  }
  if (paths[i][3]) {   // menajerlik ya da futbol okulu: aynı dünyada iş hayatı
    const k = paths[i][3];
    const j = await dialog({ art: art(bizPers(k), bizLbl(k)[2], 'club'), k: tt`Efsane puanın ${num(r.score)} · ${r.title}`, t: tt('Hikâye burada bitmek zorunda değil'), body: `<p>${k === 'pundit' ? tt('Stüdyoya geçebilirsin: her hafta bir maçı yorumlar, reyting ve güvenilirlik arasında denge kurarsın. Kenara çağrı da gelebilir.') : k === 'agent' ? tt('Ofisini açabilirsin: oyuncu keşfeder, sözleşme pazarlığı yapar, transferlerden komisyon alırsın. Aynı ligler, aynı kulüpler.') : tt('Okulunu açabilirsin: çocukları yetiştirir, tesisi büyütür, mezunların profesyonel olunca yetiştirme bedeli alırsın. Kenara çağrı da gelebilir.')}</p>`, opts: [{ t: tt('İşe başla'), i: 'right' }, { t: tt('Kariyeri burada bitir'), c: 'ghost' }], auto: 1 });
    if (j === 0) {
      G.bizStart(k); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'para', kv: 'pro' };
      if (!AUTO) { render(); window.scrollTo(0, 0); toast(k === 'agent' ? tt('Menajerlik ofisin açıldı.') : k === 'pundit' ? tt('Yayın başladı.') : tt('Futbol okulun açıldı.'), 'pen'); }
      return;
    }
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
async function tourFlow(k = 'nt') {
  if (k === 'nt') await tourFlow('yt');   // önce genç milli turnuva, sonra A milli
  const T = G.tourStart(k); if (!T) return;
  const yt = k === 'yt';
  if (yt && !T.me) { while (G.tourFixture(k)) G.tourRound(null, k); G.save(); return; }   // kadroda değilsen genç turnuva sessizce oynanır
  const me = yt ? G.myNat() + G.ySuf() : G.myNat(), nc = NATC[G.S.nat] || NATC.TR;
  const flag = sub => tt`<div class="art club" style="--c1:${nc[0]};--c2:${nc[1]}"><div class="art-cr">${crestSvg(me, nc[0], nc[1], 86)}</div><div class="art-t"><b>${esc(T.name)}</b><small>${esc(sub)}</small></div></div>`;
  const tbl = () => tt`<table class="tb lg nt">${G.tourTable(k).map((r, i) => tt`<tr class="${r.n === G.myNat() ? 'me' : ''} ${i < 2 ? 'up' : ''}"><td>${i + 1}</td><td class="tn">${esc(r.n)}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>`;
  await dialog({ art: flag(tt('Final turnuvası')), k: tt('Yaz turnuvası'), t: T.me ? tt('Kadrodasın!') : tt`${me} finallerde`, body: tt`<p>Grup: ${T.grp.map(x => esc(tt(x))).join(', ')}.</p><p>${T.me ? tt('Milli takım hocası kadroyu açıkladı; adın listede. Valizini hazırla.') : tt('Bu kez kadroda yoksun. Maçları ekrandan izleyeceksin.')}</p>`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
  for (let f; (f = G.tourFixture(k));) {
    let own = null;
    if (T.me && G.S.inj <= 0) {
      const j = await dialog({ art: flag(f.round), k: f.round, t: `${me} - ${f.opp.n}`, body: tt`${f.kof ? '' : tbl()}<p>${f.kof ? tt('Tek maç. Beraberlikte penaltılar.') : tt('Grupta ilk iki çeyrek finale çıkar.')}</p>`, opts: [{ t: tt('Maça çık'), i: 'ball' }, { t: tt('Simüle et'), c: 'ghost' }] });
      own = await runMatch(f, yt || G.S.car.caps > 3 ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
      if (!AUTO) { V.scr = 'hub'; render(); }
    }
    G.tourRound(own, k); G.save();
  }
  const L = G.S[k].last; if (L.champ && !AUTO) sfx.trophy();
  await dialog({ art: flag(L.stage), k: L.name, t: L.champ ? tt('Şampiyon!') : tt`Yolun sonu: ${L.stage}`, body: L.res.map(([rd, o, a, b, w]) => tt`<div class="res"><span class="${w === 1 ? 'w' : ''}">${esc(me)}</span><b>${a} - ${b}<small>${rd}</small></b><span class="${w === 0 ? 'w' : ''}">${esc(o + (yt ? G.ySuf() : ''))}</span></div>`).join(''), opts: [{ t: tt('Devam') }], auto: 0 });
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
    ${nx.map(([c, n, k]) => tt`<div class="cupn${k === 'cup' || k === 'xc' ? '' : ' eu-' + k}">${k === 'cup' || k === 'xc' ? ic('trophy', 16) : euLogo(k, 18)}<span>${esc(c.name)} · ${n.round} · ${n.week}. hafta · ${esc(G.club(n.opp).n)}</span></div>`).join('') + (coachR ? sqHome() : '')}
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
  const hist = m.hist.filter(h => !h.role).slice().reverse().map(h => tt`<tr><td>${h.y}</td><td>${esc(h.c)}<small>${h.l}</small></td><td>${h.pos}.</td><td>${h.obj}.</td></tr>`).join('');
  return tt`${mgrHero() + mgrPocket()}
    <section class="card">${tag(tt('Kenar kariyeri'))}<div class="stts"><div class="stt">${ic('cal', 18)}<b>${m.hist.length}</b><small>Sezon</small></div><div class="stt">${ic('shield', 18)}<b>${m.jobs}</b><small>Kulüp</small></div><div class="stt">${ic('trophy', 18)}<b>${s.tro.filter(x => /teknik direktör|başkan|Teknik Direktörü/.test(x)).length}</b><small>Kupa</small></div><div class="stt">${ic('coin', 18)}<b>${G.fmtS(m.bud).replace(G.curSym(), '')}</b><small>Bütçe</small></div></div>
      ${s.fl.staff ? '' : tt`<div class="kv">${ic('ball', 16)}<span>Futbolculuk</span><b>${t.apps} maç · ${t.g} gol · ${s.car.caps} milli</b></div>`}</section>
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
// =====================================================================
// Teknik direktör: kadro, transfer, altyapı ve canlı maç yönetimi
// =====================================================================
const posB = p => `<i class="pb p-${p}">${p}</i>`;
const shortN = n => { const w = n.split(' '); return w.length > 1 ? w[0][0] + '. ' + w.slice(1).join(' ') : n; };
// potansiyel yıldızı takımın gücüne göre: iki yıldız ortalama
const potSt = a => { const v = Math.round((a - G.S.rt[G.S.clubId]) / 5) + 2; return `<span class="stars">${'★'.repeat(G.clamp(v, 0, 5))}${'☆'.repeat(5 - G.clamp(v, 0, 5))}</span>`; };
const ctrLeft = x => (x.until < G.S.season + 1 ? `<em class="lo">${tt('bitiyor')}</em>` : `${G.S.year + x.until - G.S.season}`);
const plTags = (x, cap) => `${x.u === cap ? `<em class="tg cap">C</em>` : ''}${x.inj > 0 ? `<em class="tg inj">${ic('plus', 11)}${x.inj}</em>` : ''}${x.ban > 0 ? `<em class="tg ban">${ic('alert', 11)}${x.ban}</em>` : ''}${x.sell ? `<em class="tg sl">${tt('satılık')}</em>` : ''}${x.loanIn ? `<em class="tg ln">${tt('kiralık')}</em>` : ''}${x.loanOut ? `<em class="tg ln">${tt('kiralıkta')}</em>` : ''}`;
const enBar = v => `<span class="enb ${v < 62 ? 'lo' : ''}"><u style="width:${Math.round(v)}%"></u></span>`;
// Kulüp sekmesinin alt başlıkları
const CTABS = () => [['kadro', tt('Kadro'), 'users'], ['transfer', tt('Transfer'), 'swap'], ['alt', tt('Altyapı'), 'star'], ['gecmis', tt('Kariyer'), 'cal']];
function vCoachClub() {
  const k = V.ct || 'kadro', off = G.offers().length;
  const seg = `<div class="seg ctab">${CTABS().map(([v, n, i]) => `<button class="${k === v ? 'on' : ''}" data-a="ctab" data-v="${v}">${ic(i, 16)}${n}${v === 'transfer' && off ? `<em>${off}</em>` : ''}</button>`).join('')}</div>`;
  return seg + (k === 'transfer' ? vMarket() : k === 'alt' ? vAcademy() : k === 'gecmis' ? vMgrClub() : vSquad());
}
// Saha üstünde diziliş: forvetler üstte, kaleci altta
function fPitch(X) {
  const all = X.p.map((x, i) => [x, i]), on = all.filter(([x]) => x.on), C = G.FORMS[X.fm].c;
  const row = ps => { let r = on.filter(([x]) => ps.includes(x.pos)); const kn = r.filter(([x]) => x.pos === 'KN'); if (kn.length === 2 && r.length > 2) r = [kn[0], ...r.filter(([x]) => x.pos !== 'KN'), kn[1]]; return `<div class="fr">${r.map(([x, i]) => `<button class="fpl ${V.xs === i ? 'sel' : ''} ${x.inj > 0 || x.ban > 0 ? 'inj' : ''}" data-a="xi" data-v="${i}">${posB(x.pos)}<b>${esc(shortN(x.n))}</b><small>${Math.round(x.q)}${x.u === X.cap ? ' · C' : ''}</small>${enBar(x.en)}</button>`).join('')}</div>`; };
  const mid = C.KN ? ['OS', 'KN'] : ['OS'];
  return `<div class="fpitch">${row(['FV'])}${row(mid.length > 1 && C.OS + C.KN > 4 ? ['KN'] : [])}${row(mid.length > 1 && C.OS + C.KN > 4 ? ['OS'] : mid)}${row(['DF'])}${row(['KL'])}</div>`;
}
function vSquad() {
  const X = G.xiInfo(); if (!X) return '';
  const s = G.S, fs = v => (v > 0 ? '+' : v < 0 ? '−' : '') + dec(Math.abs(v), 1), all = X.p.map((x, i) => [x, i]), cap = G.capOf();
  const ord = { KL: 0, DF: 1, OS: 2, KN: 3, FV: 4 }, list = [...all].sort((a, b) => ord[a[0].pos] - ord[b[0].pos] || b[0].q - a[0].q);
  const bench = all.filter(([x]) => !x.on).sort((a, b) => ord[a[0].pos] - ord[b[0].pos] || b[0].q - a[0].q);
  const rows = list.map(([x]) => `<tr class="${x.on ? 'xi' : ''}" data-a="plr" data-v="${x.u}"><td>${posB(x.pos)}</td><td class="tn"><b>${esc(x.n)}</b>${plTags(x, X.cap)}</td><td>${x.age}</td><td><b>${Math.round(x.q)}</b></td><td class="hm">${potSt(x.pot)}</td><td class="hm">${dec(x.fm, 1)}</td><td>${enBar(x.en)}</td><td class="hm">${Math.round(x.mo)}</td><td class="hm">${ctrLeft(x)}</td><td class="hm">${G.fmtS(G.pVal(x))}</td></tr>`).join('');
  return `<section class="card">${tag(tt('Diziliş'))}<div class="seg fms">${Object.keys(G.FORMS).map(f => `<button class="${X.fm === f ? 'on' : ''}" data-a="mform" data-v="${f}">${f}</button>`).join('')}</div><p class="note">${esc(G.FORMS[X.fm].n)}</p>
    ${fPitch(X)}
    <div class="kv">${ic('users', 16)}<span>${tt('Kadro etkisi')}${X.man ? '' : ' · ' + tt('yardımcın seçiyor')}${X.tired ? ' · ' + tt`${X.tired} yorgun` : ''}</span><b class="${X.bonus < 0 ? 'neg' : ''}">${fs(X.bonus)}</b></div>
    <div class="sub">${ic('swap', 16)}${tt('Yedekler')}</div><div class="bnch">${bench.map(([x, i]) => `<button class="fpl b ${V.xs === i ? 'sel' : ''} ${x.inj > 0 || x.ban > 0 || x.loanOut ? 'inj' : ''}" data-a="xi" data-v="${i}">${posB(x.pos)}<b>${esc(shortN(x.n))}</b><small>${Math.round(x.q)}</small>${enBar(x.en)}</button>`).join('')}</div>
    <p class="note">${tt('Değiştirmek için önce sahadaki oyuncuya, sonra yedeğe dokun. Oyuncunun ayrıntısı için aşağıdaki listeden adına dokun.')}</p>
    <button class="opt sm" data-a="xiauto">${ic('whistle', 20)}<span><b>${tt('Yardımcı seçsin')}</b><small>${tt('Dizilişe göre her mevkiye en hazır oyuncu')}</small></span></button></section>
    <section class="card">${tag(tt('İdman'))}<div class="seg">${Object.keys(G.INTS).map(k => `<button class="${X.int === k ? 'on' : ''}" data-a="mint" data-v="${k}">${G.INTS[k][0]}</button>`).join('')}</div><p class="note">${G.INTS[X.int][1]}. ${tt('Gençler oynadıkça ve tesis iyileştikçe daha hızlı gelişir; 30 yaş üstü yavaşça düşer.')}</p>
      <div class="kv">${ic('crown', 16)}<span>${tt('Kaptan')}</span><b>${cap ? esc(cap.n) : '–'}</b></div></section>
    <section class="card np">${tag(tt('Kadro'))}<table class="tb sqd"><tr><th></th><th>${tt('Oyuncu')}</th><th>${tt('Yaş')}</th><th>${tt('Güç')}</th><th class="hm">${tt('Pot.')}</th><th class="hm">${tt('Form')}</th><th>${tt('Kond.')}</th><th class="hm">${tt('Moral')}</th><th class="hm">${tt('Sözl.')}</th><th class="hm">${tt('Değer')}</th></tr>${rows}</table>
      <p class="mut sm leg">${tt`${X.p.length} oyuncu · maaşlar haftalık ${G.fmtS(G.wageBill())}${G.wageCap() ? tt` / sınır ${G.fmtS(G.wageCap())}` : ''}`}</p></section>`;
}
async function plFlow(u) {
  for (;;) {
    const x = G.plInfo(u); if (!x) return;
    const s = G.S, ap = x.st.ap, r = ap ? dec(x.st.rs / ap, 1) : '–', canR = x.until <= s.season + 1 && !x.loanIn, win = G.winOpen();
    const o = [
      x.on ? null : { k: 'xi', t: tt('İlk 11\'e al'), s: tt('Aynı mevkideki en zayıf oyuncunun yerine'), i: 'users', dis: x.inj > 0 || x.ban > 0 || !!x.loanOut },
      x.cap ? null : { k: 'cap', t: tt('Kaptan yap'), s: tt('Soyunma odası ona bakar'), i: 'crown' },
      canR ? { k: 'ren', t: tt('Sözleşme uzat'), s: tt('Maaş zammı ister'), i: 'pen' } : null,
      x.loanIn ? null : { k: 'sell', t: x.sell ? tt('Satış listesinden çıkar') : tt('Satış listesine koy'), s: x.sell ? tt('Teklifler kesilir') : win ? tt('Transfer döneminde teklifler gelir') : tt('Teklifler transfer döneminde gelir'), i: 'coin' },
      x.age <= 23 && !x.loanOut && !x.loanIn ? { k: 'loan', t: tt('Kiralık gönder'), s: tt('Sezon sonuna kadar başka takımda oynasın, gelişip dönsün'), i: 'swap' } : null,
      x.loanIn ? null : { k: 'rel', t: tt('Sözleşmesini feshet'), s: tt('Kalan maaşın yarısı bütçeden ödenir'), i: 'x' },
      { k: '', t: tt('Kapat'), c: 'ghost' }].filter(Boolean);
    const body = `<div class="tgrid"><div>${ic('user', 16)}<small>${tt('Yaş')}</small><b>${x.age}</b></div><div>${ic('chart', 16)}<small>${tt('Güç')}</small><b>${Math.round(x.q)}</b></div><div>${ic('star', 16)}<small>${tt('Potansiyel')}</small><b>${x.pot}</b></div><div>${ic('bolt', 16)}<small>${tt('Kondisyon')}</small><b>${Math.round(x.en)}</b></div><div>${ic('smile', 16)}<small>${tt('Moral')}</small><b>${Math.round(x.mo)}</b></div><div>${ic('target', 16)}<small>${tt('Form')}</small><b>${dec(x.fm, 1)}</b></div></div>
      <div class="kv">${ic('coin', 16)}<span>${tt('Maaş / değer')}</span><b>${G.fmtS(x.wage)}${tt('/hf')} · ${G.fmtS(x.val)}</b></div><div class="kv">${ic('pen', 16)}<span>${tt('Sözleşme')}</span><b>${s.year + x.until - s.season}${x.until < s.season + 1 ? ' · ' + tt('sezon sonunda bitiyor') : ''}</b></div>
      <div class="kv">${ic('ball', 16)}<span>${tt('Bu sezon')}</span><b>${tt`${ap} maç · ${x.st.g} gol · ${x.st.a} asist · ort. ${r}`}</b></div>${x.inj > 0 ? `<p class="warn">${ic('plus', 16)} ${tt`Sakat: ${x.inj} hafta`}</p>` : ''}${x.ban > 0 ? `<p class="warn">${ic('alert', 16)} ${tt`Cezalı: ${x.ban} maç`}</p>` : ''}${x.req ? `<p class="warn">${ic('alert', 16)} ${tt('Forma bulamadığı için ayrılmak istiyor.')}</p>` : ''}`;
    const j = await dialog({ art: `<div class="art t-club"><div class="art-ic">${ic('shirt', 150)}</div><div class="art-av">${plAv(x)}</div><span class="art-n">${esc(POS[x.pos].n)}</span></div>`, k: x.cap ? tt('Kaptan') : x.on ? tt('İlk 11') : tt('Yedek'), t: x.n, body, opts: o, cls: 'ev' });
    const k = o[j].k; if (!k) return;
    if (k === 'xi') { const X = G.xiInfo(), a = X.p.findIndex(y => y.u === u), cand = X.p.map((y, i) => [y, i]).filter(([y]) => y.on && y.pos === x.pos).sort((p1, p2) => p1[0].q - p2[0].q)[0] || X.p.map((y, i) => [y, i]).filter(([y]) => y.on && y.pos !== 'KL').sort((p1, p2) => p1[0].q - p2[0].q)[0]; if (cand && G.mgrSwap(cand[1], a)) toast(tt`${x.n} ilk 11'de.`, 'users'); }
    if (k === 'cap') { G.mgrCap(u); toast(tt`Yeni kaptan: ${x.n}`, 'crown'); }
    if (k === 'sell') G.plList(u, !x.sell);
    if (k === 'loan') { if (G.plLoanOut(u)) toast(tt`${x.n} kiralık gitti.`, 'swap'); else toast(tt('Kadro çok dar; kiralık gönderemezsin.'), 'alert'); }
    if (k === 'rel') { const c = await dialog({ k: tt('Fesih'), t: tt`${x.n} ile yollar ayrılsın mı?`, body: `<p>${tt('Bu geri alınamaz. Kalan sözleşmesinin yarısı bütçeden ödenir.')}</p>`, opts: [{ t: tt('Feshet'), i: 'x' }, { t: tt('Vazgeç'), c: 'ghost' }] }); if (c === 0) { const v = G.plRelease(u); if (v) { toast(tt`Fesih bedeli: ${G.fmtS(v)}`, 'coin'); G.save(); render(); return; } toast(tt('Kadro çok dar; kimseyi gönderemezsin.'), 'alert'); } }
    if (k === 'ren') {
      const A = G.plRenewAsk(u);
      if (A.no) { await info(tt('Masaya oturmuyor'), tt`${x.n} şu an imza atmak istemiyor. Önce forma ve moral lazım.`); continue; }
      const c = await dialog({ k: tt('Sözleşme uzatma'), t: x.n, body: `<p>${tt`İsteği: haftalık ${G.fmtS(A.w)}, ${A.yrs} yıl.`}</p>`, opts: [{ t: tt('Pazarlık et'), s: tt`Haftalık ${G.fmtS(A.w)} öner; reddedebilir`, i: 'pen' }, { t: tt('İsteğini kabul et'), s: tt`Haftalık ${G.fmtS(Math.round(A.w * 1.1))}; kesin imza`, i: 'check' }, { t: tt('Vazgeç'), c: 'ghost' }] });
      if (c < 2) { const r = G.plRenew(u, c === 1 ? .1 : 0); toast(r === true ? tt`${x.n} imzaladı.` : r === 'cap' ? tt('Maaş sınırını aşıyor.') : tt('Teklifini reddetti.'), r === true ? 'pen' : 'alert'); }
    }
    G.save(); render();
  }
}
const plAv = x => avatar({ skin: nh(x.n) % 4, hair: nh(x.n) % HAIRS, hc: nh(x.n + 'h') % 4, beard: G.KW ? 0 : nh(x.n + 'b') % 3 }, G.club(G.S.clubId).c1, G.club(G.S.clubId).c2, { num: (x.u % 30) + 1, age: x.age });
// Transfer pazarı
function vMarket() {
  const s = G.S, m = s.mgr, open = G.winOpen(), f = V.tf || '', mk = G.tmarket().filter(t => !t.done && (!f || t.pos === f)), off = G.offers(), X = G.xiInfo();
  const st = open ? (s.week <= 6 ? tt`Transfer dönemi açık: ${6}. haftaya kadar` : tt`Transfer dönemi açık: ${22}. haftaya kadar`) : s.week < 18 ? tt`Transfer dönemi kapalı: devre arası ${18}. haftada açılır` : tt('Transfer dönemi kapalı: yeni sezonun ilk haftalarında açılır');
  const offs = off.map((o, i) => { const x = X.p.find(y => y.u === o.u); return x ? `<div class="toff">${crest(o.id, 30)}<div><b>${esc(x.n)}</b><small>${esc(G.club(o.id).n)} · ${G.fmtS(o.fee)}${o.hag ? ' · ' + tt('son teklif') : ''}</small></div><button class="mini-b" data-a="toff" data-v="${i}:0">${tt('Kabul')}</button>${o.hag ? '' : `<button class="mini-b" data-a="toff" data-v="${i}:1">${tt('Pazarlık')}</button>`}<button class="mini-b gh" data-a="toff" data-v="${i}:2">${tt('Ret')}</button></div>` : ''; }).join('');
  const rows = mk.map(t => `<tr data-a="tgt" data-v="${t.u}"><td>${posB(t.pos)}</td><td class="tn"><b>${esc(t.n)}</b><small>${t.club ? esc(G.club(t.club).n) : tt('Serbest')}</small></td><td>${t.age}</td><td><b>${Math.round(t.q)}</b></td><td>${t.sc ? `<b>${t.pot}</b>` : `<span class="mut">${t.pr[0]}–${t.pr[1]}</span>`}</td><td>${t.club ? G.fmtS(t.fee) : '–'}</td><td class="hm">${G.fmtS(t.wd)}</td></tr>`).join('');
  return `<section class="card">${tag(tt('Transfer'), open ? 'ye' : '')}<div class="stn st-${open ? 'acik' : 'kilit'}">${ic(open ? 'swap' : 'clock', 16)}<span>${st}</span></div>
      <div class="kv">${ic('coin', 16)}<span>${tt('Transfer bütçesi')}</span><b>${G.fmtS(m.bud)}</b></div>
      <div class="kv">${ic('users', 16)}<span>${tt('Kadro')}</span><b>${X.p.length}/26</b></div>
      ${G.wageCap() ? `<div class="kv">${ic('chart', 16)}<span>${tt('Haftalık maaşlar')}</span><b>${G.fmtS(G.wageBill())} / ${G.fmtS(G.wageCap())}</b></div>` : `<p class="note">${tt('Amatör seviyede oyunculara maaş ödenmez.')}</p>`}</section>
    ${offs ? `<section class="card">${tag(tt('Gelen teklifler'), 'ye')}${offs}</section>` : ''}
    <section class="card np">${tag(tt('Oyuncu pazarı'))}<div class="seg tfs">${[['', tt('Tümü')], ...['KL', 'DF', 'OS', 'KN', 'FV'].map(p => [p, p])].map(([v, n]) => `<button class="${f === v ? 'on' : ''}" data-a="tf" data-v="${v}">${n}</button>`).join('')}</div>
      <table class="tb sqd mkt"><tr><th></th><th>${tt('Oyuncu')}</th><th>${tt('Yaş')}</th><th>${tt('Güç')}</th><th>${tt('Pot.')}</th><th>${tt('Bedel')}</th><th class="hm">${tt('Maaş')}</th></tr>${rows}</table>
      <p class="mut sm leg">${tt('Potansiyel aralık olarak görünür; gözlemci gönderirsen kesinleşir. Liste iki haftada bir yenilenir.')}</p></section>`;
}
async function tgtFlow(u) {
  for (;;) {
    const t = G.tmarket().find(x => x.u === u); if (!t || t.done) return;
    const s = G.S, open = G.winOpen(), big = t.club && s.rt[t.club] > s.rt[s.clubId] + 3;
    const o = [
      open && t.agreed == null ? { k: 'bid', t: t.club ? tt('Bonservis teklifi yap') : tt('İmza teklif et'), s: t.club ? tt`İstenen ${G.fmtS(t.fee)}` : tt('Bonservis yok, yalnız maaş'), i: 'coin' } : null,
      open && t.agreed != null ? { k: 'terms', t: tt('Oyuncuyla anlaş'), s: tt`Kulüp ${G.fmtS(t.agreed)} bedeli kabul etti`, i: 'pen' } : null,
      open && t.club && t.age <= 23 && big && t.agreed == null ? { k: 'loan', t: tt('Kiralık iste'), s: tt('Sezon sonuna kadar, maaşın yarısı bizden'), i: 'swap' } : null,
      t.sc ? null : { k: 'scout', t: tt('Gözlemci gönder'), s: tt`${G.fmtS(G.scoutCost(t))} · potansiyeli kesinleşir`, i: 'eye', dis: s.mgr.bud < G.scoutCost(t) },
      { k: '', t: tt('Kapat'), c: 'ghost' }].filter(Boolean);
    const body = `<div class="tgrid"><div>${ic('user', 16)}<small>${tt('Yaş')}</small><b>${t.age}</b></div><div>${ic('chart', 16)}<small>${tt('Güç')}</small><b>${Math.round(t.q)}</b></div><div>${ic('star', 16)}<small>${tt('Potansiyel')}</small><b>${t.sc ? t.pot : `${t.pr[0]}–${t.pr[1]}`}</b></div><div>${ic('shield', 16)}<small>${tt('Takımın gücü')}</small><b>${Math.round(s.rt[s.clubId])}</b></div></div>
      <div class="kv">${ic('coin', 16)}<span>${tt('Bonservis / maaş isteği')}</span><b>${t.club ? G.fmtS(t.fee) : '–'} · ${G.fmtS(t.wd)}${tt('/hf')}</b></div>${open ? '' : `<p class="warn">${ic('clock', 16)} ${tt('Transfer dönemi kapalı. İzleyebilir, gözlemci gönderebilirsin.')}</p>`}`;
    const j = await dialog({ art: t.club ? clubArt(t.club, tt`${POS[t.pos].n} · ${t.age} yaş`) : `<div class="art t-club"><div class="art-ic">${ic('pen', 150)}</div><div class="art-av">${plAv(t)}</div><span class="art-n">${tt('Serbest')}</span></div>`, k: POS[t.pos].n, t: t.n, body, opts: o, cls: 'ev' });
    const k = o[j].k; if (!k) return;
    if (k === 'scout') { if (G.scout(u)) { toast(tt`Gözlemci raporu: potansiyel ${t.pot}`, 'eye'); G.save(); } continue; }
    if (k === 'bid') {
      const K = [.85, 1, 1.25], c = t.club ? await dialog({ k: tt('Bonservis teklifi'), t: G.club(t.club).n, body: `<p>${tt`İstenen bedel ${G.fmtS(t.fee)}. Bütçen ${G.fmtS(s.mgr.bud)}.`}</p>`, opts: [...K.map((v, i) => ({ t: G.fmtS(G.nice(t.fee * v)), s: [tt('Düşük teklif: büyük ihtimalle ret'), tt('İstenen bedel'), tt('Cömert teklif: neredeyse kesin')][i], i: 'coin', dis: s.mgr.bud < G.nice(t.fee * v) })), { t: tt('Vazgeç'), c: 'ghost' }] }) : 1;
      if (c >= K.length) continue;
      const r = G.bid(u, K[c]);
      if (r && r.counter) { const a = await dialog({ k: tt('Karşı teklif'), t: G.club(t.club).n, body: `<p>${tt`Kulüp ${G.fmtS(r.counter)} istiyor.`}</p>`, opts: [{ t: tt('Kabul et'), i: 'check', dis: s.mgr.bud < r.counter }, { t: tt('Vazgeç'), c: 'ghost' }] }); if (a === 0 && G.acceptCounter(u, r.counter)) toast(tt('Kulüple anlaştınız. Şimdi oyuncuyla konuş.'), 'check'); continue; }
      const msg = { ok: tt('Kulüple anlaştınız. Şimdi oyuncuyla konuş.'), no: tt('Kulüp satmak istemiyor.'), shut: tt('Transfer dönemi kapalı.'), size: tt('Kadro dolu (26). Önce birini gönder.'), money: tt('Bütçe yetmiyor.') }[r] || tt('Kulüp satmak istemiyor.');
      toast(msg, r === 'ok' ? 'check' : 'alert'); if (r === 'ok' && !t.club) await termsFlow(u, false); continue;
    }
    if (k === 'terms') { await termsFlow(u, false); continue; }
    if (k === 'loan') { await termsFlow(u, true); continue; }
  }
}
async function termsFlow(u, loan) {
  const t = G.tmarket().find(x => x.u === u); if (!t) return;
  const W = [.9, 1, 1.15], base = loan ? t.wd * .5 : t.wd;
  const c = await dialog({ k: loan ? tt('Kiralık şartları') : tt('Şahsi şartlar'), t: t.n, body: `<p>${tt`Haftalık ${G.fmtS(G.nice(base))} istiyor.`}${G.wageCap() ? ' ' + tt`Maaş sınırına kalan: ${G.fmtS(Math.max(0, G.wageCap() - G.wageBill()))}.` : ''}</p>`, opts: [...W.map((v, i) => ({ t: G.fmtS(G.nice(base * v)) + tt('/hf'), s: [tt('Pazarlık: reddedebilir'), tt('İsteği: büyük ihtimalle evet'), tt('Fazlası: kesin evet')][i], i: 'pen' })), { t: tt('Vazgeç'), c: 'ghost' }] });
  if (c >= W.length) return;
  const r = G.terms(u, W[c], loan);
  if (r === 'ok') { sfx.sign(); toast(loan ? tt`${t.n} kiralık geldi.` : tt`${t.n} imzaladı!`, 'pen'); G.save(); render(); return; }
  toast({ level: tt('Bu seviyede bir takıma gelmek istemiyor.'), cap: tt('Maaş sınırını aşıyor.'), ret: tt('Teklifini reddetti. Biraz daha zorlayabilirsin.'), money: tt('Bütçe yetmiyor.') }[r] || tt('Anlaşma olmadı.'), 'alert');
}
function vAcademy() {
  const X = G.xiInfo(); if (!X) return ''; const Y = G.S.mgr.xi.yth || [];
  const rows = Y.map(k => `<div class="ykid">${posB(k.pos)}<div><b>${esc(k.n)}</b><small>${tt`${k.age} yaş · güç ${Math.round(k.q)} · potansiyel ${k.pot}`}</small></div><button class="mini-b" data-a="yup" data-v="${k.u}" ${X.p.length >= 26 ? 'disabled' : ''}>${tt('A takıma')}</button><button class="mini-b gh" data-a="ycut" data-v="${k.u}">${tt('Gönder')}</button></div>`).join('');
  return `<section class="card">${tag(tt('Altyapı'), 'ye')}${rows || `<p class="note">${tt('Altyapıda şu an öne çıkan çocuk yok. "Altyapıyı izle" hamlesiyle yeni yetenek arayabilirsin; her yaz üç çocuk gelir.')}</p>`}
    <p class="note">${tt('Altyapıdaki çocuklar her hafta biraz gelişir. A takıma alınca düşük maaşla iki yıllık sözleşme imzalar; oynadıkça daha hızlı gelişir.')}</p></section>`;
}

// ---------- canlı maç ----------
let MM = null;   // kenardaki maçın kontrol durumu
const SPD = [[tt('1x'), 320], [tt('2x'), 150], [tt('4x'), 55]];
function evTxt(e, opN) {
  const SH = G.SHOUT;
  switch (e.t) {
    case 'g': return e.us ? [tt`GOL! ${e.n}`+ (e.as ? tt` · asist ${e.as}` : ''), 'g', 'ball'] : [tt`${opN} golü: ${e.n}`, 'b', 'ball'];
    case 'c': return e.us ? [tt`${e.n} kaçırdı! Top direğin yanından çıktı.`, '', 'target'] : [tt`${opN} tehlikeli geldi: ${e.n}, ama top dışarıda.`, '', 'target'];
    case 'y': return e.us ? [tt`Sarı kart: ${e.n}`, 'y', 'alert'] : [tt`Sarı kart: ${e.n} (${opN})`, '', 'alert'];
    case 'r': return e.us ? [tt`KIRMIZI KART: ${e.n}! On kişi kaldınız.`, 'b', 'alert'] : [tt`${opN} eksik kaldı: ${e.n} kırmızı gördü.`, 'g', 'alert'];
    case 'i': return [tt`${e.n} sakatlandı (${e.w} hf).`, 'b', 'plus'];
    case 's': return e.us ? [tt`Değişiklik: ${e.n} girdi, ${e.o} çıktı.`, 'm', 'swap'] : [tt`${opN} değişikliği: ${e.n} girdi, ${e.o} çıktı.`, '', 'swap'];
    case 'm': return e.k === 'att' ? [tt`${opN} hücuma kalktı: arkada boşluk var.`, 'm', 'bolt'] : e.k === 'ten' ? [tt('Değişiklik hakkın kalmadı: eksik devam.'), 'b', 'alert'] : e.k === 'tx' ? [tt`Zihniyet: ${e.x}`, 'm', 'target'] : [tt`Talimat: ${SH[e.sh][0]}`, 'm', 'mic'];
  }
  return ['', '', ''];
}
function mluHTML(M) {
  if (!M.on.length && !M.bench.length) return '';
  const p = u => G.plInfo(u), row = (u, b) => { const x = p(u); if (!x) return ''; const r = M.pr[u] ?? 6.3; return `<div class="mlr ${b ? 'bn' : ''} ${M.red[u] ? 'rd' : ''} ${M.inj[u] ? 'in' : ''}">${posB(x.pos)}<span>${esc(shortN(x.n))}${M.g[u] ? ' ' + ic('ball', 11).repeat(Math.min(3, M.g[u])) : ''}${M.yc[u] ? '<i class="yc"></i>' : ''}</span>${enBar(M.pe[u] ?? x.en)}<b class="${r >= 7.5 ? 'hi' : r < 6 ? 'lo' : ''}">${b ? '' : dec(G.clamp(r, 3, 10), 1)}</b></div>`; };
  return `<div class="mlh">${tt('Sahada')} · ${M.subs} ${tt('değişiklik hakkı')}</div>${M.on.map(u => row(u)).join('')}<div class="mlh">${tt('Kulübe')}</div>${M.bench.map(u => row(u, 1)).join('')}`;
}
async function subFlow(M, forced) {
  if (M.subs <= 0 || !M.bench.length) { toast(tt('Değişiklik hakkın kalmadı.'), 'alert'); return; }
  const P = u => G.plInfo(u);
  const outs = forced ? [forced] : M.on;
  const a = forced ? 0 : await dialog({ k: tt`Değişiklik · ${M.min}'`, t: tt('Kim çıksın?'), opts: [...outs.map(u => { const x = P(u); return { t: `${x.pos} · ${x.n}`, s: tt`kondisyon ${Math.round(M.pe[u])} · not ${dec(G.clamp(M.pr[u], 3, 10), 1)}${M.yc[u] ? ' · ' + tt('sarı kartlı') : ''}`, i: M.pe[u] < 55 ? 'alert' : 'user' }; }), { t: tt('Vazgeç'), c: 'ghost' }], grid: true });
  if (a >= outs.length) return;
  const out = outs[a], ox = P(out), ins = [...M.bench].sort((x, y) => (P(y).pos === ox.pos) - (P(x).pos === ox.pos) || P(y).q - P(x).q);
  const b = await dialog({ k: forced ? tt('Sakatlık') : tt`${ox.n} çıkıyor`, t: tt('Kim girsin?'), body: forced ? `<p>${tt`${ox.n} devam edemiyor. Yerine kim girsin?`}</p>` : '', opts: [...ins.map(u => { const x = P(u); return { t: `${x.pos} · ${x.n}`, s: tt`güç ${Math.round(x.q)} · form ${dec(x.fm, 1)}${x.pos !== ox.pos ? ' · ' + tt('farklı mevki') : ''}`, i: x.pos === ox.pos ? 'check' : 'swap' }; }), { t: forced ? tt('Yardımcı seçsin') : tt('Vazgeç'), c: 'ghost' }], grid: true });
  if (b >= ins.length) { if (forced) { const alt = ins[0]; if (alt) G.mgrSub(M, out, alt); } return; }
  G.mgrSub(M, out, ins[b]);
}
async function tacFlow(M) {
  for (;;) {
    const X = G.xiInfo();
    const j = await dialog({ k: tt`Taktik · ${M.min}'`, t: tt('Oyun planı'), body: `<div class="kv">${ic('target', 16)}<span>${tt('Zihniyet')}</span><b>${G.MENT[M.ment][0]}</b></div><div class="kv">${ic(TACT[M.st].i, 16)}<span>${tt('Oyun stili')}</span><b>${TACT[M.st].n}</b></div><div class="kv">${ic('users', 16)}<span>${tt('Diziliş')}</span><b>${X ? X.fm : '–'}</b></div>`,
      opts: [{ t: tt('Zihniyeti değiştir'), s: tt('Defanstan tüm hatlarla hücuma'), i: 'target' }, { t: tt('Oyun stilini değiştir'), s: tt('Pres, kontra, kanat…'), i: 'whistle' }, ...(X ? [{ t: tt('Dizilişi değiştir'), s: tt('Mevki dengesi ve hücum gücü'), i: 'users' }] : []), { t: tt('Maça dön'), c: 'ghost' }] });
    if (j === 0) { const i = await dialog({ k: tt('Zihniyet'), t: tt('Nasıl oynasınlar?'), opts: G.MENT.map((x, i) => ({ t: x[0], s: i === M.ment ? tt('şu anki') : '', i: i < 2 ? 'shield' : i > 2 ? 'bolt' : 'target' })) }); G.mgrMent(M, i); M.ev.push({ min: M.min, t: 'm', us: true, k: 'tx', x: G.MENT[i][0] }); continue; }
    if (j === 1) { const ks = Object.keys(TACT), i = await dialog({ k: tt('Oyun stili'), t: tt('Hangi plan?'), opts: ks.map(k => ({ t: TACT[k].n, s: TACT[k].d, i: TACT[k].i })), grid: true }); G.mgrStyle(M, ks[i]); continue; }
    if (j === 2 && X) { const fs = Object.keys(G.FORMS), i = await dialog({ k: tt('Diziliş'), t: tt('Hangi diziliş?'), opts: fs.map(f => ({ t: f, s: G.FORMS[f].n })), grid: true }); G.S.mgr.xi.fm = fs[i]; continue; }
    return;
  }
}
async function shoutFlow(M) {
  if (M.min < M.shCd) { toast(tt`Yeni talimat için ${M.shCd - M.min} dakika bekle.`, 'clock'); return; }
  const ks = Object.keys(G.SHOUT), i = await dialog({ k: tt`Talimat · ${M.min}'`, t: tt('Kenardan ne bağıracaksın?'), opts: [...ks.map(k => ({ t: G.SHOUT[k][0], s: G.SHOUT[k][2], i: G.SHOUT[k][1] })), { t: tt('Vazgeç'), c: 'ghost' }], grid: true });
  if (i < ks.length) G.mgrShout(M, ks[i]);
}
async function mgrMatchFlow(f, first) {
  const s = G.S, coachR = s.mgr.role === 'coach', home = f.home || !!f.final, usN = G.club(s.clubId).n, opN = G.club(f.opp).n; let sim = AUTO, pitch = null, feed, sc, mn, tlb;
  const lbl = f.cup ? `${f.name} · ${f.round}` : LMAP[f.lid].name;
  if (!AUTO) {
    const X = coachR ? G.xiInfo() : null, xi = X ? X.p.filter(x => x.on) : [];
    const lu = X ? `<div class="kv">${ic('users', 16)}<span>${tt('İlk 11')} · ${X.fm}</span><b class="${X.bonus < 0 ? 'neg' : ''}">${X.bonus >= 0 ? '+' : '−'}${dec(Math.abs(X.bonus), 1)}</b></div><p class="mut sm">${xi.map(x => esc(shortN(x.n))).join(', ')}</p>${xi.some(x => x.en < 62) ? `<p class="warn">${ic('alert', 16)} ${tt`${xi.filter(x => x.en < 62).length} oyuncu yorgun.`}</p>` : ''}` : '';
    const j = await dialog({
      art: f.eu ? tt`<div class="art euA eu-${f.eu}">${euLogo(f.eu, 96)}<div class="art-t"><b>${esc(opN)}</b><small>${esc(lbl)}</small></div></div>` : clubArt(f.opp, `${lbl} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}`), k: tt('Maç günü'),
      body: tt`<div class="tgrid"><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div><div>${ic('whistle', 16)}<small>Sistem</small><b>${TACT[G.coach().st].n}</b></div><div>${ic('heart', 16)}<small>Güven</small><b>${Math.round(s.mgr.conf)}</b></div></div>${f.agg ? tt`<div class="aggb">${ic('swap', 14)}İlk maç ${f.agg[0]}-${f.agg[1]}</div>` : ''}` + lu,
      opts: [{ t: coachR ? tt('Kenara geç') : tt('Locaya çık'), s: coachR ? tt('Maçı canlı yönet: değişiklik, taktik, talimat') : tt('Maçı izle'), i: 'ball' }, { t: tt('Sonucu göster'), s: coachR ? tt('Maçı yardımcın yönetir') : '', i: 'right' }, ...(coachR && first ? [{ t: tt('Kadroyu düzenle'), s: tt('Geri dön; hafta harcanmaz'), c: 'ghost' }] : [])],
    });
    if (j === 2) return 'back';
    sim = j === 1;
  }
  const M = G.mgrMatch(f);
  if (sim) {
    const R = G.mgrSim(M), win = R.win, lines = G.mgrAfter(M, win);
    if (!AUTO) await resDialog(M, f, win, R.pens, lines, home, usN, opN);
    return f.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.usG };
  }
  V.scr = 'match'; app.dataset.scr = 'match';
  MM = { M, pause: 0, sp: 1, busy: 0, live: coachR };
  app.innerHTML = tt`<div class="match mgrm${euCls(f)}"><div class="m-h">${f.eu ? tt`<span class="eut">${euLogo(f.eu, 26)}${esc(lbl)}</span>` : tag(lbl, f.cup ? 'ye' : '')}<span class="where">${coachR ? tt('kenar') : tt('loca')}</span></div>
    <div class="sb"><div class="tm">${crest(home ? s.clubId : f.opp, 50)}<span>${esc(home ? usN : opN)}</span></div><div class="scr"><b id="sc">0 - 0</b><small id="mn">0'</small></div><div class="tm">${crest(home ? f.opp : s.clubId, 50)}<span>${esc(home ? opN : usN)}</span></div></div>
    <canvas id="pitch" class="opch"></canvas><div class="tlb"><i id="tlp"></i><div id="tlm"></div></div>
    ${coachR ? `<div class="mcbar"><button class="mcb" data-a="mc" data-v="p" id="mcp">${ic('clock', 18)}<span>${tt('Durdur')}</span></button><button class="mcb" data-a="mc" data-v="sp" id="mcs">${ic('right', 18)}<span>${SPD[1][0]}</span></button><button class="mcb" data-a="mc" data-v="sub" id="mcu">${ic('swap', 18)}<span>${tt('Değişiklik')} <em>${M.subs}</em></span></button><button class="mcb" data-a="mc" data-v="tac">${ic('whistle', 18)}<span>${tt('Taktik')}</span></button><button class="mcb" data-a="mc" data-v="sh">${ic('mic', 18)}<span>${tt('Talimat')}</span></button></div>
    <div class="mst"><span id="mmt">${G.MENT[M.ment][0]}</span> · <span id="mst">${TACT[M.st].n}</span> · <span id="msh">${tt`şut ${0}-${0}`}</span></div><div id="feed" class="feed"></div><div id="mlu" class="mlu">${mluHTML(M)}</div>` : `<div class="tacs">${ic('whistle', 16)}<b>${TACT[G.coach().st].n}</b><div></div></div><div id="feed" class="feed"></div>`}</div>`;
  feed = $('#feed'); sc = $('#sc'); mn = $('#mn'); tlb = $('#tlm'); sfx.ambOn(); if (f.eu) sfx.anthem(); else sfx.whistle(1);
  const pc = G.club(s.clubId).c1; let po = G.club(f.opp).c1; if (po === pc) po = G.club(f.opp).c2;
  pitch = new Pitch($('#pitch'), { cu: pc, co: po, flip: !home });
  if (!coachR) M.auto = 1;
  MM.opN = opN;
  const put = (min, txt, cls = '', icon = '') => { if (feed && txt) feed.insertAdjacentHTML('afterbegin', tt`<div class="fl ${cls}"><b>${min}'</b>${icon ? ic(icon, 18) : '<i></i>'}<span>${esc(txt)}</span></div>`); };
  const upd = () => {
    if (!sc) return; mn.textContent = M.min + "'"; sc.textContent = home ? `${M.usG} - ${M.oppG}` : `${M.oppG} - ${M.usG}`; $('#tlp').style.width = Math.min(100, M.min / 90 * 100) + '%';
    if (coachR) { const l = $('#mlu'); if (l) l.innerHTML = mluHTML(M); const e = $('#mcu em'); if (e) e.textContent = M.subs; $('#mmt').textContent = G.MENT[M.ment][0]; $('#mst').textContent = TACT[M.st].n; $('#msh').textContent = tt`şut ${M.sh[0]}-${M.sh[1]}`; }
  };
  MM.put = put; MM.upd = upd;
  const tick = async () => { await sleep(SPD[MM.sp][1]); while (MM.pause || MM.busy) await sleep(120); };
  const show = async list => {
    for (const e of list) {
      const [txt, cls, icon] = evTxt(e, opN);
      if (e.t === 'g') { if (pitch) { pitch.attack(e.us); await sleep(MM.sp === 2 ? 250 : 650); pitch.goal(e.us); } if (e.us) sfx.goal(); else sfx.conceded(); if (tlb) tlb.insertAdjacentHTML('beforeend', `<i class="${e.us ? 'g' : 'b'}" style="left:${Math.min(100, e.min / 90 * 100)}%"></i>`); }
      else if (e.t === 'c' && pitch && MM.sp < 2) pitch.attack(e.us);
      put(e.min, txt, cls, icon);
      if (e.t === 'g' || e.t === 'r') await sleep(MM.sp === 2 ? 300 : 900);
    }
  };
  const runTo = async to => {
    while (M.min < to) {
      const n0 = M.ev.length, out = G.mgrRun(M, M.min + 1); void n0; upd(); await show(out);
      if (coachR && M.need && M.subs > 0 && M.bench.length) { MM.busy = 1; await subFlow(M, M.need); MM.busy = 0; await show(M.ev.slice(-1).filter(e => e.t === 's')); upd(); }
      await tick();
    }
  };
  put(1, tt('İlk düdük.'), '', 'whistle');
  await runTo(45); put(45, tt('Devre arası.'), '', 'whistle'); upd();
  if (coachR) {
    MM.busy = 1;
    for (;;) {
      const c = await dialog({ art: art('takim', 'whistle', 'club'), k: tt('Devre arası'), t: M.usG > M.oppG ? tt('Öndesiniz') : M.usG < M.oppG ? tt('Geridesiniz') : tt('Beraberlik'), body: tt`<p>Soyunma odası seni bekliyor. Şut ${M.sh[0]}-${M.sh[1]}.</p>`, opts: [...G.HTT.map(x => ({ t: x[0], s: x[2], i: x[1] })), { t: tt('Değişiklik yap'), s: tt`${M.subs} hak`, i: 'swap', c: 'ghost' }, { t: tt('Taktiği değiştir'), i: 'whistle', c: 'ghost' }], cls: 'ev' });
      if (c === 3) { await subFlow(M); upd(); continue; } if (c === 4) { await tacFlow(M); upd(); continue; }
      G.mgrTalk(M, c); put(46, tt`Soyunma odası: ${G.HTT[c][0].toLocaleLowerCase(LC)}.`, 'm', 'mic'); break;
    }
    MM.busy = 0;
  }
  await show(M.ev.filter(e => e.min === 45 && e.t === 's')); upd();
  await runTo(90);
  const tu = () => M.usG + M.agg[0], to = () => M.oppG + M.agg[1]; let pens = null;
  if (M.ko && tu() === to()) { put(90, tt('Doksan dakika yetmedi: uzatmalar!'), 'm', 'whistle'); await sleep(700); await runTo(120); }
  if (M.ko && tu() === to()) {
    pens = G.mgrPens(M); put(M.min, tt('Seri penaltılar başlıyor.'), 'm', 'whistle');
    for (let i = 0; i < pens.us.length; i++) { await sleep(500); put(M.min, tt`${i + 1}. vuruş: ${usN} ${pens.us[i] ? tt('gol') : tt('kaçtı')} · ${opN} ${pens.op[i] ? tt('gol') : tt('kaçtı')}`, pens.us[i] && !pens.op[i] ? 'g' : !pens.us[i] && pens.op[i] ? 'b' : '', 'target'); }
    put(M.min, pens.win ? tt('Penaltılarda gülen taraf sizsiniz!') : tt('Penaltılarda kaybettiniz.'), pens.win ? 'g' : 'b', 'trophy'); await sleep(900);
  }
  put(M.min, tt('Son düdük.'), '', 'whistle'); sfx.whistle(3); sfx.ambOff(); await sleep(700);
  if (pitch) pitch.stop(); MM = null;
  const win = M.ko ? tu() > to() || !!(pens && pens.win) : M.usG > M.oppG, lines = G.mgrAfter(M, win);
  if (f.final && win) sfx.trophy();
  await resDialog(M, f, win, pens, lines, home, usN, opN);
  return f.cup ? { us: M.usG, opp: M.oppG, win } : { hg: home ? M.usG : M.oppG, ag: home ? M.oppG : M.usG, pg: M.usG };
}
async function resDialog(M, f, win, pens, lines, home, usN, opN) {
  const s = G.S, ev = M.ev.filter(e => e.t === 'g' || e.t === 'r').map(e => `<div class="rev ${e.us ? 'us' : ''}"><b>${e.min}'</b>${ic(e.t === 'g' ? 'ball' : 'alert', 14)}<span>${esc(e.n)}${e.t === 'r' ? ' · ' + tt('kırmızı') : ''}</span></div>`).join('');
  const P = M.played.map(u => G.plInfo(u)).filter(Boolean).sort((a, b) => (b.lr || 0) - (a.lr || 0)).slice(0, 6);
  const rt = P.length ? `<div class="rtl">${P.map(x => `<div class="${x.u === M.mom ? 'mom' : ''}">${posB(x.pos)}<span>${esc(shortN(x.n))}</span><b>${dec(x.lr || 6, 1)}</b></div>`).join('')}</div>` : '';
  await dialog({
    art: tt`<div class="art res ${win ? 't-club' : M.usG < M.oppG || (pens && !pens.win) ? 't-risk' : 't-life'}"><div class="art-av">${avatar({ ...s.look, band: 0 }, '#1b1b1f', '#e9e4da')}</div><div class="rate ${win ? 'hi' : M.usG < M.oppG ? 'lo' : ''}"><b>${M.usG}-${M.oppG}</b><small>${win ? tt('GALİBİYET') : M.usG < M.oppG || (pens && !pens.win) ? tt('YENİLGİ') : tt('BERABERLİK')}</small></div></div>`,
    t: `${home ? usN : opN} ${home ? M.usG : M.oppG} - ${home ? M.oppG : M.usG} ${home ? opN : usN}${pens ? tt(' (pen.)') : ''}`, body: (ev ? `<div class="revs">${ev}</div>` : '') + rt + chips(lines), opts: [{ t: tt('Devam') }], auto: 0,
  });
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
    <div class="stts"><div class="stt">${ic('trophy', 18)}<b>${r.tro.length}</b><small>Kupa</small></div><div class="stt">${ic('chart', 18)}<b>${r.best || '–'}.</b><small>En iyi sıra</small></div>${s.fl.staff ? tt`<div class="stt">${ic('shield', 18)}<b>${r.jobs}</b><small>Kulüp</small></div><div class="stt">${ic('cal', 18)}<b>${r.seasons}</b><small>Sezon</small></div>` : tt`<div class="stt">${ic('shirt', 18)}<b>${G.tot().apps}</b><small>Maç (oyuncu)</small></div><div class="stt">${ic('ball', 18)}<b>${G.tot().g}</b><small>Gol (oyuncu)</small></div>`}</div>
    ${s.tro.length ? tt`<div class="card">${tag(tt('Müze'), 'ye')}<ul class="tro">${s.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <button class="cta" data-a="new">Yeni kariyer</button><button class="link" data-a="title">Ana menü</button></div>`;
  G.wipe(); V.scr = 'end'; render();
}
async function mgrSacked() {
  const s = G.S, role = s.mgr.role;
  sfx.bad();
  const j = await dialog({ art: art('baskan', 'alert', 'risk'), k: role === 'coach' ? tt('Yönetim kararı') : tt('Olağanüstü kongre'), t: role === 'coach' ? tt('Görevden alındın') : tt('Başkanlığı kaybettin'), body: tt`<p>${role === 'coach' ? tt('Güven tükendi. Yönetim sözleşmeni feshetti.') : tt('Üyeler sandıkta başka bir isme döndü.')}</p>`, opts: [{ t: tt('Yeni bir yol seç'), s: tt('Kulüp, menajerlik ya da futbol okulu'), i: 'right' }, { t: tt('Kenar kariyerini bitir'), c: 'ghost' }], auto: 0 });
  if (j === 0 && await sideCareerFlow()) return;
  mgrFinish();
}
async function mgrSeasonFlow() {
  const s = G.S;
  G.initPlayoffs();
  while (G.poPending()) { const f = G.poFixture(); let own = null; if (f) own = await mgrMatchFlow(f); G.poRound(own); G.save(); }
  if (s.mgr.role === 'coach' && !AUTO) {   // sözleşmesi biten önemli oyuncular: son kez sorulur
    const ex = (G.mgrXI() || []).filter(x => x.until < s.season + 1 && !x.loanIn && !x.loanOut).sort((a, b) => b.q - a.q).slice(0, 6);
    for (const x of ex) {
      const A = G.plRenewAsk(x.u); if (!A || A.no) continue;
      const j = await dialog({ k: tt('Sözleşmesi bitiyor'), t: x.n, body: `<p>${posB(x.pos)} ${tt`${x.age} yaş · güç ${Math.round(x.q)} · potansiyel ${x.pot}`}</p><p>${tt`İsteği: haftalık ${G.fmtS(Math.round(A.w * 1.1))}, ${A.yrs} yıl.`}</p>`, opts: [{ t: tt('Sözleşmesini uzat'), i: 'pen' }, { t: tt('Gitsin'), c: 'ghost' }], cls: 'ev' });
      if (j === 0) { const ok = G.plRenew(x.u, .1); toast(ok === true ? tt`${x.n} imzaladı.` : tt('Maaş sınırını aşıyor.'), ok === true ? 'pen' : 'alert'); }
    }
  }
  const r = G.seasonEnd(), ml = G.mgrSeason(r); G.save();
  await awardFlow(r);
  if (r.tro.length || r.moved === 1) sfx.trophy();
  await dialog({
    art: tt`<div class="art res t-fame"><div class="art-av">${avatar({ ...s.look, band: 0 }, '#1b1b1f', '#e9e4da')}</div><div class="rate hi"><b>${r.pos}.</b><small>${esc(r.league)}</small></div></div>`, k: tt`${r.label} bitti`, t: tt`Şampiyon: ${r.champ}`,
    body: tt`${r.tro.length ? tt`<ul class="tro">${r.tro.map(x => tt`<li>${ic('trophy', 18)}${esc(x)}</li>`).join('')}</ul>` : ''}${chips([...ml, ...r.lines])}<p class="mut">Yeni sezon hedefi: ${s.mgr.obj}. sıra.</p>`, opts: [{ t: tt('Yeni sezon'), i: 'right' }], auto: 0,
  });
  await tourFlow();
  if (s.age >= 70) { await info(tt('Zaman doldu'), tt('Yetmiş yaşına geldin. Kenardan da çekilme vakti.')); s.mgr.sacked = 0; mgrFinish(); return; }
  if (!s.mgr.sacked && s.mgr.role !== 'coach') await mgrWindow(tt('Yaz dönemi'));
  else if (!s.mgr.sacked && !AUTO) toast(tt('Yaz transfer dönemi açık: ilk altı hafta.'), 'swap');
}
async function mgrStep() {
  if (busy) return; busy = true; let back = 0;
  try {
    const s = G.S, wk = G.absWeek();
    if (s.fl.evw !== wk) {
      s.fl.evw = wk; const e = G.mgrEvent();
      if (e) { const j = await dialog({ art: art(e.p, e.i, 'club'), t: e.t, body: tt`<p>${esc(e.d)}</p>`, opts: e.o.map(o => ({ t: o[0], s: o[1] })), cls: 'ev' }); const ch = e.o[j][2](); if (!AUTO && ch.length) toast(ch.join(' · '), 'whistle'); G.save(); }
    }
    const cf = G.sideFixture(); let ownCup = null, own = null;
    if (cf) { ownCup = await mgrMatchFlow(cf, true); if (ownCup === 'back') { back = 1; return; } }
    const fxt = G.fixture(); if (fxt) { own = await mgrMatchFlow(fxt, !cf); if (own === 'back') { back = 1; return; } }
    const o0 = G.offers().length, r = G.endWeek(own, ...sideArgs(cf, ownCup)); G.save();
    if (s.mgr.role !== 'coach' && s.week === 20) await mgrWindow(tt('Devre arası'));
    if (!AUTO && s.mgr.role === 'coach') { if (s.week === 18) toast(tt('Devre arası transfer dönemi açıldı.'), 'swap'); else if (G.offers().length > o0) toast(tt('Oyuncuna transfer teklifi var. Kulüp > Transfer.'), 'coin'); }
    if (r.over) await mgrSeasonFlow();
    if (G.S && G.S.mgr && G.S.mgr.sacked) await mgrSacked();
    if (G.S) G.save();
  } finally {
    busy = false; sfx.ambOff();
    if (G.S) { V.scr = 'hub'; V.tab = back ? 'kar' : 'ev'; if (back) V.ct = 'kadro'; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}

// =====================================================================
// Futbol sonrası iş hayatı: menajerlik ve futbol okulu arayüzü
// =====================================================================
const bizLbl = r => ({ agent: [tt('MNJ'), tt('Menajer'), 'pen'], school: [tt('OKUL'), tt('Futbol okulu sahibi'), 'book'], pundit: [tt('YRM'), tt('Yorumcu'), 'mic'] }[r]);
const bizPers = r => ({ agent: 'menajer', school: 'hoca', pundit: 'basin' }[r] || 'baskan');
const nh = n => [...String(n)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
const sideAv = () => { const s = G.S; return avatar({ ...s.look, band: 0, beard: G.KW ? 0 : s.look.beard || 1 }, '#1b1b1f', '#e9e4da', { pat: 'duz', age: s.age }); };
function bizHero() {
  const s = G.S, I = G.bizInfo(), nm = s.name.split(' '), L = bizLbl(I.role);
  return `<section class="hero mgr" style="--c1:#2a2f45;--c2:#ffd23f"><div class="hero-l"><div class="ovr"><b>${I.n}</b><span>${L[0]}</span></div><h2>${esc(nm.slice(0, -1).join(' ') || nm[0])}<br><span>${esc(nm.length > 1 ? nm[nm.length - 1] : '')}</span></h2><small>${tt`${s.age} yaş`} · ${L[1]}</small></div><div class="hero-r">${sideAv()}</div></section>`;
}
function vBizHome() {
  const s = G.S, m = s.mgr, I = G.bizInfo(), sch = I.role === 'school', pun = I.role === 'pundit';
  const acts = G.BACTS[I.role].map(([k, n, d, i]) => { const c = G.bizCost(k), max = G.bizMax(k), no = G.bizNo(k); return `<button class="act wide" data-a="bact" data-v="${k}" ${m.act || s.money < c || max || no ? 'disabled' : ''}><span class="aic">${ic(i, 24)}</span><b>${n}</b><span class="efx"><i class="${c && !max ? 'neg' : 'pos'}">${max ? tt('En üst düzey') : c ? ic('coin', 12) + '−' + G.fmtS(c).replace(G.curSym(), '') : esc(d)}</i></span></button>`; }).join('');
  const news = s.news.slice(0, 4).map(n => `<li><span class="nic">${ic(n.ic || 'news', 18)}</span><div>${esc(n.s)}<small>${n.w}</small></div></li>`).join('');
  const g = pun ? gauge(I.rt, 'chart', tt('Reyting'), 'mo') + gauge(I.cr, 'check', tt('Güvenilirlik'), I.cr < 35 ? 'low' : 'en') + gauge(s.rep, 'star', tt('İtibar'), 'ho') + gauge(I.ch * 20, 'phone', tt('Kanal'), 'ta')
    : sch ? gauge(I.rp, 'star', tt('Okul itibarı'), 'mo') + gauge(I.n / I.cap * 100, 'users', tt('Doluluk'), 'ta') + gauge(I.lv * 20, 'train', tt('Tesis'), 'en') + gauge(I.hc * 20, 'whistle', tt('Antrenör'), 'ho')
    : gauge(s.rep, 'star', tt('İtibar'), 'mo') + gauge(I.n / I.cap * 100, 'users', tt('Dosya'), 'ta') + gauge(I.mood, 'smile', tt('Memnuniyet'), I.mood < 35 ? 'low' : 'en') + gauge(I.best, 'chart', tt('En iyi oyuncu'), 'ho');
  return `${bizHero()}<section class="gauges">${g}</section>
    <section class="card">${tag(tt('Kasa'))}<div class="kv">${ic('coin', 16)}<span>${tt('Haftalık kazanç')}</span><b class="${I.inc < 0 ? 'neg' : ''}">${G.fmt(I.inc)}</b></div><div class="kv">${ic('chart', 16)}<span>${tt('Bu sezonki kazanç')}</span><b>${G.fmtS(I.earn)}</b></div><div class="kv">${ic('users', 16)}<span>${pun ? tt('Takipçi') : sch ? tt('Öğrenci') : tt('Oyuncu')}</span><b>${pun ? num(s.fol) : I.n + '/' + I.cap}</b></div><div class="kv tot">${ic('home', 16)}<span>${tt('Kişisel birikimin')}</span><b>${G.fmtS(s.money)}</b></div></section>
    <section><div class="sh"><h4>${tt('Bu haftanın hamlesi')}</h4><div class="dots"><i class="${m.act ? 'u' : ''}"></i></div></div><div class="acts">${acts}</div></section>
    <section><div class="sh"><h4>${tt('Gündem')}</h4></div><ul class="news">${news}</ul></section>
    <div class="dock"><button class="cta" data-a="go">${tt('Haftayı bitir')} ${ic('right', 22)}</button></div>`;
}
function vBizList() {
  const s = G.S, m = s.mgr, sch = m.role === 'school', pun = m.role === 'pundit';
  const hist = m.hist.slice().reverse().map(h => `<tr><td>${h.y}</td><td>${esc(h.c)}<small>${esc(h.l || '')}</small></td><td>${h.earn != null ? G.fmtS(h.earn) : (h.pos || '–') + '.'}</td></tr>`).join('');
  const histC = hist ? `<section class="card">${tag(tt('Sezonlar'))}<table class="tb hist"><tr><th>${tt('Sezon')}</th><th>${tt('İş')}</th><th>${tt('Kazanç')}</th></tr>${hist}</table></section>` : '';
  const quit = `<button class="opt sm" data-a="mresign">${ic('right', 20)}<span><b>${tt('Bu işi bırak')}</b><small>${pun ? tt('Mikrofonu bırak, başka bir yola gir') : sch ? tt('Okulu devret, başka bir yola gir') : tt('Dosyaları kapat, başka bir yola gir')}</small></span></button>`;
  if (pun) {
    const I = G.bizInfo();
    return `${bizHero()}<section class="card">${tag(tt('Programın'))}<div class="stts"><div class="stt">${ic('chart', 18)}<b>${Math.round(I.rt)}</b><small>${tt('Reyting')}</small></div><div class="stt">${ic('check', 18)}<b>${Math.round(I.cr)}</b><small>${tt('Güvenilirlik')}</small></div><div class="stt">${ic('users', 18)}<b>${s.fol >= 1e6 ? dec(s.fol / 1e6, 1) + tt(' Mn', 'para') : num(s.fol)}</b><small>${tt('Takipçi')}</small></div><div class="stt">${ic('phone', 18)}<b>${I.ch}/5</b><small>${tt('Kanal')}</small></div></div>
      <p class="note">${tt('Reyting her hafta biraz düşer; yorum, röportaj ve kanal yatırımıyla yükselir. Gelirin reytinge bağlıdır. Güvenilirliğin düşerse sözün dinlenmez; yüksek reyting ve güvenle Yılın Yorumcusu seçilirsin.')}</p></section>${histC}${quit}`;
  }
  const tagOf = x => (x.mine ? ' · ' + tt('çocuğun') : x.grad ? ' · ' + tt('eski öğrencin') : '');
  const rows = sch
    ? m.kids.slice().sort((a, b) => b.tal - a.tal).map(k => `<div class="ppl"><div class="avw sm">${avatar({ skin: nh(k.n) % 4, hair: nh(k.n + 'h') % 4, hc: nh(k.n + 'c') % 3 }, '#2a2f45', '#ffd23f', { pat: 'duz' })}</div><div><b>${esc(k.n)}</b><small>${tt`${k.age} yaş · yetenek ${Math.round(k.tal)}`}${tagOf(k)}</small>${bar(k.tal, k.tal >= 37 ? 'mo' : 'hot')}</div><span class="mini-b">${k.age >= 15 ? tt('Mezun oluyor') : tt`${16 - k.age} yıl`}</span></div>`).join('')
    : m.cl.slice().sort((a, b) => b.ovr - a.ovr).map(c => `<div class="ppl">${crest(c.id, 38)}<div><b>${esc(c.n)}</b><small>${POS[c.pos].n} · ${tt`${c.age} yaş`} · ${esc(G.club(c.id).n)} · ${tt('güç')} ${Math.round(c.ovr)}${c.shop ? ' · ' + tt('pazarda') : ''}${tagOf(c)}</small>${bar(c.mood, c.mood < 35 ? 'hot' : 'mo')}</div><span class="mini-b">${G.fmtS(Math.round(c.wage * .05))}${tt('/hf')}</span></div>`).join('');
  const grads = sch && m.grads.length ? `<section class="card">${tag(tt('Mezunların'), 'ye')}${m.grads.map(g => `<div class="kv">${crest(g.id, 20)}<span>${esc(g.n)} · ${esc(G.club(g.id).n)}<small> · ${g.y}</small></span><b>${g.ovr}</b></div>`).join('')}</section>` : '';
  return `${bizHero()}<section class="card">${tag(sch ? tt('Öğrencilerin') : tt('Oyuncuların'))}${rows || `<p class="mut sm">${sch ? tt('Okulda öğrenci yok. Yetenek taraması yap.') : tt('Dosyanda oyuncu yok. Oyuncu keşfine çık.')}</p>`}<p class="note">${sch ? tt('Çocuklar 16 yaşında mezun olur. Yeteneği 37 ve üstü olan bir kulüple imzalar; yetiştirme bedeli sana kalır. Mezunların yükseldikçe dayanışma payı alırsın.') : tt('Oyuncularının ücretinden %5 pay alırsın. Çubuk memnuniyeti gösterir; ilgisiz kalan oyuncu ofisini değiştirir. Transferlerde bonservisin %3\'ü senin.')}</p></section>
    ${grads}${histC}${quit}`;
}
async function agentWindow(title) {
  const s = G.S;
  for (const o of G.agentOffers()) {
    const c = s.mgr.cl[o.ci]; if (!c) continue;
    const j = await dialog({ art: clubArt(o.id, offerSub(o.id)), k: title, t: tt`${c.n} için teklif`, body: `<div class="tgrid"><div>${ic('swap', 16)}<small>${tt('Bonservis')}</small><b>${G.fmtS(o.fee)}</b></div><div>${ic('coin', 16)}<small>${tt('Yeni ücret')}</small><b>${G.fmtS(o.wage)}</b></div><div>${ic('shield', 16)}<small>${tt('Şu anki kulübü')}</small><b>${esc(G.club(c.id).n)}</b></div><div>${ic('pen', 16)}<small>${tt('Komisyonun')}</small><b>${G.fmtS(o.cut)}</b></div></div>`, opts: [{ t: tt('Transferi bitir'), s: tt('Oyuncu memnun, komisyon cebinde'), i: 'pen' }, { t: tt('Reddet'), s: tt('Oyuncu bozulur'), c: 'ghost' }], auto: 0 });
    const ch = G.agentDeal(o, j === 0); if (j === 0) sfx.sign(); if (!AUTO && ch.length) toast(ch.join(' · '), j === 0 ? 'pen' : 'x');
  }
}
function bizFinish() {
  const s = G.S, r = G.bizEnd(), L = bizLbl(r.role);
  endHTML = `<div class="title end">${tag(tt('İş hayatı özeti'))}
    <section class="hero big" style="--c1:#2a2f45;--c2:#ffd23f"><div class="hero-l"><div class="ovr"><b>${r.seasons}</b><span>${tt('SEZON')}</span></div><h2>${esc(s.name)}</h2><small>${L[1]}</small></div><div class="hero-r">${sideAv()}</div></section>
    <div class="rate hi wide"><b>${G.fmtS(r.total)}</b><small>${tt('TOPLAM KAZANÇ')}</small></div>
    <div class="stts"><div class="stt">${ic(r.role === 'pundit' ? 'chart' : 'users', 18)}<b>${r.role === 'school' ? r.grads : r.role === 'pundit' ? Math.round(s.mgr.rt) : r.clients}</b><small>${r.role === 'school' ? tt('Mezun') : r.role === 'pundit' ? tt('Reyting') : tt('Oyuncu')}</small></div><div class="stt">${ic('star', 18)}<b>${r.bestGrad ? r.bestGrad.ovr : Math.round(s.rep)}</b><small>${r.bestGrad ? tt('En iyi mezun') : tt('İtibar')}</small></div><div class="stt">${ic('shirt', 18)}<b>${G.tot().apps}</b><small>${tt('Maç (oyuncu)')}</small></div><div class="stt">${ic('ball', 18)}<b>${G.tot().g}</b><small>${tt('Gol (oyuncu)')}</small></div></div>
    ${r.bestGrad ? `<div class="card">${tag(tt('Gururun'), 'ye')}<div class="kv">${crest(r.bestGrad.id, 22)}<span>${esc(r.bestGrad.n)} · ${esc(G.club(r.bestGrad.id).n)}</span><b>${r.bestGrad.ovr}</b></div></div>` : ''}
    <button class="cta" data-a="new">${tt('Yeni kariyer')}</button><button class="link" data-a="title">${tt('Ana menü')}</button></div>`;
  G.wipe(); V.scr = 'end'; render();
}
async function bizSeasonFlow() {
  const s = G.S;
  G.initPlayoffs(); while (G.poPending()) { G.poRound(null); }
  const r = G.seasonEnd(), bl = G.bizSeason(r); G.save();
  await dialog({ art: `<div class="art res t-fame"><div class="art-av">${sideAv()}</div><div class="rate hi"><b>${s.mgr.hist.length}.</b><small>${tt('SEZON')}</small></div></div>`, k: tt`${r.label} bitti`, t: tt`Şampiyon: ${r.champ}`, body: chips(bl) + `<p class="mut">${tt`Artık ${s.age} yaşındasın.`}</p>`, opts: [{ t: tt('Yeni sezon'), i: 'right' }], auto: 0 });
  await tourFlow();
  if (s.age >= 70) { await info(tt('Zaman doldu'), tt('Yetmiş yaşına geldin. İşleri devretme vakti.')); bizFinish(); return; }
  if (s.mgr.role === 'agent') await agentWindow(tt('Yaz dönemi'));
  const so = G.sideOffer();   // iş hayatındayken de kenara çağrı gelebilir
  if (so) {
    const j = await dialog({ art: clubArt(so.id, offerSub(so.id)), k: tt('Kenara çağrı'), t: tt`${G.club(so.id).n} seni teknik direktör olarak istiyor`, body: `<p>${s.mgr.role === 'school' ? tt('Okulda yetiştirdiğin çocuklar adını duyurdu. Kabul edersen okulu devredersin; değeri hesabına geçer.') : s.mgr.role === 'pundit' ? tt('Ekrandaki analizlerin bir başkanın dikkatini çekti. Kabul edersen mikrofonu bırakırsın.') : tt('Oyuncuların senden övgüyle söz ediyor. Kabul edersen dosyalarını kapatırsın.')}</p>`, opts: [{ t: tt('Kabul et'), s: G.fmtS(so.wage) + tt('/hf'), i: 'whistle' }, { t: tt('İşime devam ediyorum'), c: 'ghost' }], auto: 1, cls: 'ev' });
    if (j === 0) { G.mgrResign(); G.mgrStart('coach', so); sfx.sign(); if (!AUTO) toast(tt`${G.club(so.id).n}: göreve başladın.`, 'pen'); }
  }
}
async function bizStep() {
  if (busy) return; busy = true;
  try {
    const s = G.S, wk = G.absWeek();
    if (s.fl.evw !== wk) {
      s.fl.evw = wk; const e = G.bizEvent();
      if (e) { const j = await dialog({ art: art(e.p, e.i, 'club'), t: e.t, body: `<p>${esc(e.d)}</p>`, opts: e.o.map(o => ({ t: o[0], s: o[1] })), cls: 'ev' }); const ch = e.o[j][2](); if (!AUTO && ch.length) toast(ch.join(' · '), 'check'); G.save(); }
    }
    const r = G.endWeek(null, null, null, null); G.save();
    if (s.mgr.role === 'agent' && s.week === 20) await agentWindow(tt('Devre arası'));
    if (r.over) await bizSeasonFlow();
    if (G.S) G.save();
  } finally {
    busy = false;
    if (G.S) { V.scr = 'hub'; V.tab = goDesk ? 'kar' : 'ev'; if (goDesk) V.kv = 'tr'; goDesk = false; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}
// Yeni sayfa: görevi bırakınca açılan yollar. true: yeni işe başlandı
async function sideCareerFlow() {
  const s = G.S, cur = s.mgr ? s.mgr.role : '';
  for (;;) {
    const o = [{ k: 'coach', t: tt('Teknik direktörlük'), s: tt('Seni isteyen kulüplere bak'), i: 'whistle' },
      { k: 'pres', t: tt('Başkanlık'), s: tt('Birikiminle bir kulübün başına geç'), i: 'crown' },
      { k: 'agent', t: tt('Menajerlik'), s: cur === 'agent' ? tt('Az önce bıraktın') : s.rep >= 25 ? tt('Oyuncu temsil et, komisyon kazan') : tt('İtibar 25 gerekir'), i: 'pen', dis: s.rep < 25 || cur === 'agent' },
      { k: 'school', t: tt('Futbol okulu'), s: cur === 'school' ? tt('Az önce devrettin') : tt('Çocuk yetiştir, mezunların imzalasın'), i: 'book', dis: cur === 'school' },
      { k: 'pundit', t: tt('Yorumculuk'), s: cur === 'pundit' ? tt('Az önce bıraktın') : s.fol >= 150000 ? tt('Ekranda maç yorumla') : tt('150 bin takipçi gerekir'), i: 'mic', dis: cur === 'pundit' || s.fol < 150000 },
      { k: '', t: tt('Burada bitir'), s: tt('Özet ekranına geç'), i: 'x' }];
    const i = await dialog({ art: `<div class="art t-club"><div class="art-ic">${ic('right', 150)}</div><div class="art-av">${sideAv()}</div><span class="art-n">${esc(s.name)}</span></div>`, k: tt('Yeni sayfa'), t: tt('Bundan sonra ne yapacaksın?'), body: `<div class="kv">${ic('coin', 16)}<span>${tt('Kişisel birikimin')}</span><b>${G.fmtS(s.money)}</b></div>`, opts: o, grid: true, auto: 5, cls: 'ev' });
    const k = o[i].k; if (!k) return false;
    if (k === 'coach' || k === 'pres') { if (await mgrJobFlow(k, true)) return true; continue; }
    G.bizStart(k); sfx.sign(); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'para', kv: 'pro' };
    if (!AUTO) { render(); window.scrollTo(0, 0); toast(k === 'agent' ? tt('Menajerlik ofisin açıldı.') : k === 'pundit' ? tt('Yayın başladı.') : tt('Futbol okulun açıldı.'), 'pen'); }
    return true;
  }
}
// Cebin: maaş, kâr payı ya da iş geliri kişisel birikime gider
function mgrPay() {
  const s = G.S, role = s.mgr.role, inc = G.income(), sh = G.mgrShare(), bz = G.isBiz() ? G.bizInfo().inc : 0;
  const row = (n, v, i) => v ? `<div class="kv">${ic(i, 16)}<span>${n}</span><b class="${v < 0 ? 'neg' : ''}">${G.fmt(v)}</b></div>` : '';
  return `<section class="card hv-para">${tag(tt('Cebin'))}${row(tt('Haftalık maaşın'), inc.wage, 'whistle')}${row(tt('Kâr payın'), sh, 'crown')}${row(role === 'agent' ? tt('Komisyonların') : role === 'pundit' ? tt('Ekran geliri') : tt('Okul geliri'), bz, bizLbl(role) ? bizLbl(role)[2] : 'coin')}${row(tt('Sponsorlar'), inc.spon, 'tag')}${row(tt('İşletmeler'), inc.biz, 'cart')}${row(tt('Giderler'), -inc.cost, 'down')}
    <div class="kv tot">${ic('coin', 16)}<span>${tt('Haftalık net')}</span><b class="${inc.net + sh + bz < 0 ? 'neg' : ''}">${G.fmt(inc.net + sh + bz)}</b></div><div class="kv">${ic('home', 16)}<span>${tt('Kişisel birikimin')}</span><b>${G.fmtS(s.money)}</b></div>
    <p class="note">${role === 'coach' ? tt('Maaşın ve galibiyet primlerin kendi hesabına geçer. Kulüp bütçesi ayrıdır; onu yalnızca kulüp için harcarsın.') : role === 'pres' ? tt('Kulüp bütçesi kulübündür; sana haftalık kâr payı kalır.') : tt('Bu işte kazandığın her kuruş doğrudan cebine girer.')}</p></section>`;
}
// Kulüp sekmesindeki kısa cep özeti ve istifa
function mgrPocket() {
  const s = G.S, coachR = s.mgr.role === 'coach';
  return `<section class="card">${tag(tt('Cebin'))}<div class="kv">${ic('coin', 16)}<span>${coachR ? tt('Haftalık maaşın') : tt('Kâr payın')}</span><b>${G.fmt(coachR ? s.con.wage : G.mgrShare())}</b></div><div class="kv tot">${ic('home', 16)}<span>${tt('Kişisel birikimin')}</span><b>${G.fmtS(s.money)}</b></div><p class="note">${tt('Harcamak ve yatırım için: Hayat > Para.')}</p>
    <button class="opt sm" data-a="mresign">${ic('right', 20)}<span><b>${tt('İstifa et')}</b><small>${tt('Başka bir yola gir: kulüp, menajerlik, futbol okulu')}</small></span></button></section>`;
}
const mgrSetBtns = () => `<button class="opt sm hv-ayar" data-a="mresign">${ic('right', 20)}<span><b>${G.isBiz() ? tt('Bu işi bırak') : tt('İstifa et')}</b><small>${tt('Başka bir yola gir: kulüp, menajerlik, futbol okulu')}</small></span></button><button class="opt sm hv-ayar" data-a="mquit">${ic('x', 20)}<span><b>${tt('Kenar kariyerini bitir')}</b><small>${tt('Özet ekranına gider, kayıt silinir')}</small></span></button>`;
// Sağlık göstergesi (Kariyer > Profil)
function healthRow() {
  const h = Math.round(G.health());
  return `<div class="sub">${ic('plus', 16)}${tt('Sağlık')}</div><div class="kv">${ic('heart', 16)}<span>${G.healthText()}</span><b class="${h < 40 ? 'neg' : ''}">%${h}</b></div>${bar(h, h < 40 ? 'hot' : '')}<p class="note">${tt('Yorgun oynamak, sakatken zorlamak ve ağır sakatlıklar sağlığını düşürür; dinlenmek ve kişisel ekip toparlar. Sağlık 40\'ın altındayken gelen ağır bir sakatlık kariyeri bitirebilir.')}</p>`;
}
function healthWarn() {
  const h = Math.round(G.health()); if (h >= 40) return '';
  return `<p class="warn hlw">${ic('alert', 16)} ${tt`Sağlığın %${h}: ${G.healthText()}.`} ${tt('Dinlen; bu hâlde ağır bir sakatlık kariyerini bitirebilir.')}</p>`;
}

// =====================================================================
// v14 arayüzü: rekorlar, belgesel, ilk 11, okul maçı, stüdyo, dedikodu
// =====================================================================
function recCard() {
  const s = G.S; if (s.mgr) return '';
  const R = G.records();
  return `<section class="card recs">${tag(tt('Rekorlar'), 'ye')}<div class="kv">${crest(s.clubId, 20)}<span>${esc(G.club(s.clubId).n)} · ${tt('kulüp ve lig tarihi')}</span></div>${R.map(x => `<div class="recr ${x.broke ? 'ok' : ''}"><span class="aic">${ic(x.broke ? 'trophy' : x.lig ? 'chart' : 'target', 20)}</span><div><b>${x.t}</b><small>${x.broke ? tt('Rekor artık senin') : `${esc(x.n)} · ${x.y}`}</small></div><em><b>${x.broke ? x.me : x.v}</b><small>${x.broke ? tt`eski ${x.v}` : tt`sen ${x.me || '–'}`}</small></em></div>`).join('')}${drillRecs()}<p class="note">${tt('Rekor kırınca haber olur, itibarın ve taraftar sevgisi artar, sezon belgeseline girer.')}</p></section>`;
}
// Antrenman serileri: her çalışmanın en iyi isabeti ve kaç kez yapıldığı
function drillRecs() {
  const D = Object.entries(G.S.drill || {}).map(([id, r]) => [TRAIN.find(t => t.id === id), r]).filter(([T, r]) => T && r.n);
  return D.length ? tt`<div class="sub">${ic('whistle', 16)}Antrenman serileri</div><div class="drl">${D.map(([T, r]) => tt`<div class="drc ${r.b >= 3 ? 'ok' : ''}"><b>${r.b}/3</b><small>${esc(T.n)}</small><em>${r.n} seri</em></div>`).join('')}</div>` : '';
}
async function docFlow(r) {
  if (AUTO || !r.doc || r.doc.length < 2) return;
  const s = G.S, c = G.club(s.clubId);
  const cards = r.doc.map((d, i) => `<div class="docc" style="--i:${i}"><span class="doci">${ic(d.i, 22)}</span><div><small>${d.w > 38 ? tt('Sezon sonu') : tt`${d.w}. hafta`}</small><b>${esc(G.tl(d.t))}</b></div></div>`).join('');
  const j = await dialog({ art: `<div class="art res t-fame"><div class="art-av">${me()}</div><div class="rate hi"><b>${ic('star', 28)}</b><small>${esc(r.label)}</small></div></div>`, k: tt('Sezon belgeseli'), t: tt('Bu sezon senin hikâyen'), body: `<div class="docs">${cards}</div>`, opts: [{ t: tt('Devam') }, { t: tt('Belgeseli paylaş'), s: tt('Sezon kartını kaydet ya da gönder'), i: 'phone', c: 'ghost' }], auto: 0, cls: 'ev' });
  if (j === 1) await shareCard({ c1: c.c1, tag: tt('SEZON BELGESELİ'), big: String(r.st.g), bigL: tt('GOL'), title: [s.name.toLocaleUpperCase(LC), r.label], sub: r.doc.slice(0, 2).map(d => G.tl(d.t)).join(' · '), stats: [[r.st.apps, tt('Maç')], [r.st.g, tt('Gol')], [r.st.a, tt('Asist')], [r.pos + '.', tt('Sıra')]], text: tt`Toprak Saha: ${s.name}, ${r.label} sezonu.` });
}
// Teknik direktörün ilk 11'i: bir oyuncuya, sonra yer değiştireceği oyuncuya dokun
function xiCard() {
  const X = G.xiInfo(); if (!X) return '';
  const fs = v => (v > 0 ? '+' : v < 0 ? '−' : '') + dec(Math.abs(v), 1), all = X.p.map((x, i) => [x, i]);
  const row = ([x, i]) => `<button class="xir ${x.on ? 'on' : ''} ${V.xs === i ? 'sel' : ''} ${x.inj > 0 ? 'inj' : ''}" data-a="xi" data-v="${i}"><i>${x.pos}</i><span><b>${esc(x.n)}</b><small>${tt('güç')} ${Math.round(x.q)} · ${tt('form')} ${dec(x.fm, 1)}${x.inj > 0 ? ' · ' + tt`sakat, ${x.inj} hf` : ''}</small></span><em class="${x.en < 62 ? 'lo' : ''}"><u style="width:${Math.round(x.en)}%"></u></em></button>`;
  return `<section class="card xic">${tag(tt('İlk 11'))}<div class="kv">${ic('users', 16)}<span>${tt('Kadro etkisi')}${X.man ? '' : ' · ' + tt('yardımcın seçiyor')}${X.tired ? ' · ' + tt`${X.tired} yorgun` : ''}</span><b class="${X.bonus < 0 ? 'neg' : ''}">${fs(X.bonus)}</b></div>
    <div class="xil">${all.filter(([x]) => x.on).map(row).join('')}</div><div class="sub">${ic('swap', 16)}${tt('Yedekler')}</div><div class="xil">${all.filter(([x]) => !x.on).map(row).join('')}</div>
    <p class="note">${tt('Bir oyuncuya, sonra yer değiştireceği oyuncuya dokun. Çubuk kondisyonu gösterir: yorgun oyuncu takımı aşağı çeker ve daha kolay sakatlanır. Her maç on bir kişi yorulur, yedekler dinlenir.')}</p>
    <button class="opt sm" data-a="xiauto">${ic('whistle', 20)}<span><b>${tt('Yardımcı seçsin')}</b><small>${tt('Her mevkiye en hazır oyuncu')}</small></span></button></section>`;
}
// Kenar ana sayfası: kadronun kısa özeti, transfer dönemi ve teklifler
function sqHome() {
  const X = G.xiInfo(); if (!X) return '';
  const out = X.p.filter(x => x.inj > 0 || x.ban > 0), off = G.offers().length, open = G.winOpen(), fs = v => (v > 0 ? '+' : v < 0 ? '−' : '') + dec(Math.abs(v), 1);
  return `<section class="card sqh">${tag(tt('Kadro'))}<div class="kv">${ic('users', 16)}<span>${X.fm} · ${tt('kadro etkisi')}${X.tired ? ' · ' + tt`${X.tired} yorgun` : ''}</span><b class="${X.bonus < 0 ? 'neg' : ''}">${fs(X.bonus)}</b></div>
    ${out.length ? `<div class="kv">${ic('plus', 16)}<span>${tt('Sakat ya da cezalı')}</span><b>${out.map(x => esc(shortN(x.n))).join(', ')}</b></div>` : ''}
    ${open ? `<div class="stn st-acik">${ic('swap', 16)}<span>${tt('Transfer dönemi açık')}${off ? ' · ' + tt`${off} teklif bekliyor` : ''}</span></div>` : ''}
    <div class="btn2"><button class="opt sm" data-a="ctab2" data-v="kadro">${ic('users', 20)}<span><b>${tt('Kadro ve diziliş')}</b><small>${tt('İlk 11, idman, sözleşmeler')}</small></span></button><button class="opt sm" data-a="ctab2" data-v="transfer">${ic('swap', 20)}<span><b>${tt('Transfer')}</b><small>${open ? tt('Oyuncu al, sat, kirala') : tt('Pazarı izle, gözlemci gönder')}</small></span></button></div></section>`;
}
// Futbol okulu: öğrencilerle maç günü
async function kidsMatchFlow() {
  const K = G.kidsMatch();
  await dialog({ art: art('hoca', 'ball', 'club'), k: tt('Maç günü'), t: tt`Rakip: ${K.oppN}`, body: `<p>${tt('Veliler tel örgünün arkasında, çocuklar çizgide. İlk düdük çaldı.')}</p><div class="rate wide"><b>${K.h1[0]} - ${K.h1[1]}</b><small>${tt('İLK YARI')}</small></div>`, opts: [{ t: tt('Soyunma odasına git'), i: 'right' }], auto: 0, cls: 'ev' });
  const c = await sceneDialog((g, t, W2, H2) => lockerDraw(g, t, W2, H2, lockO('ht')), { k: tt('Devre arası'), t: K.h1[0] > K.h1[1] ? tt('Öndesiniz') : K.h1[0] < K.h1[1] ? tt('Geridesiniz') : tt('Beraberlik'), body: `<p>${tt`Gözler sende. ${K.star} formanı çekiştiriyor: "Hocam ben ne yapayım?"`}</p>`, opts: G.KHT.map(o => ({ t: o[0], i: o[1], s: o[2] })), grid: true, auto: 1, cls: 'ev locker' });
  const lines = G.kidsMatchEnd(K, c), w = K.us > K.op, l = K.us < K.op; if (w) sfx.goal();
  await dialog({ art: `<div class="art res ${w ? 't-club' : l ? 't-risk' : 't-life'}"><div class="art-av">${sideAv()}</div><div class="rate ${w ? 'hi' : l ? 'lo' : ''}"><b>${K.us}-${K.op}</b><small>${w ? tt('GALİBİYET') : l ? tt('YENİLGİ') : tt('BERABERLİK')}</small></div></div>`, k: tt('Maç bitti'), t: `${K.us} - ${K.op} · ${K.oppN}`, body: chips(lines), opts: [{ t: tt('Devam') }], auto: 0 });
}
// Yorumcu: haftanın maçı
async function punditFlow() {
  const T = G.punditTopic();
  const c = await dialog({ art: `<div class="art t-fame"><div class="art-ic">${ic('mic', 150)}</div><div class="art-av">${sideAv()}</div><span class="art-n">${tt('Stüdyo')}</span></div>`, k: tt('Haftanın maçı'), t: `${G.club(T.h).n} ${T.hg} - ${T.ag} ${G.club(T.a).n}`, body: `<p>${tt('Kırmızı ışık yandı. Sunucu sözü sana verdi.')}</p>`, opts: G.PUND.map(o => ({ t: o[0], i: o[1], s: o[2] })), grid: true, auto: 1, cls: 'ev' });
  const r = G.punditSay(T, c); sfx.pop();
  await dialog({ art: art('basin', 'mic', 'fame'), k: tt('Yayın bitti'), t: G.PUND[c][0], body: `<p>${esc(r[0])}</p>${chips(r[1])}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' });
}
// Sosyal sekmesi: transfer dedikodusu ve tribünün tezahüratı
function rumCard() {
  const s = G.S, r = G.rumorInfo();
  const ch = s.chant && !s.mgr ? `<div class="cupn chant">${ic('users', 16)}<span>${tt('Tribünün tezahüratı')}: "${esc(s.chant)}"</span></div>` : '';
  if (!r) return ch;
  return `${ch}<section class="card rum">${tag(tt('Dedikodu'), 'ye')}<div class="wt">${crest(r.id, 40)}<div><b>${esc(G.club(r.id).n)}</b><small>${esc(G.tl(r.t))}</small></div></div><p class="note">${tt('Doğru mu, yalan mı? Tepkin taraftarı, hocayı ve o kulübün ilgisini etkiler.')}</p><div class="rumb">${G.RUMO.map((o, i) => `<button class="chip" data-a="rum" data-v="${i}">${ic(o[1], 14)} ${o[0]}</button>`).join('')}</div></section>`;
}

// Kariyerin başı: kulübünü deneme antrenmanlarıyla bulursun
const AYLAR = [tt('Haziran'), tt('Temmuz'), tt('Ağustos')];
async function startFlow() {
  const s = G.S, tried = []; let round = 0;
  await tutFlow();
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
  const pool = ['sut', 'kafa', 'frikik', 'penalti', 'pas', 'calim', 'savunma', 'orta', 'vole', 'kurtaris', 'kosu', 'ribaund', 'markaj', 'birebir', 'blok', 'kesme', 'verkac', 'asirtma'], kinds = Array.from({ length: 6 }, () => pool[Math.floor(rng() * pool.length)]), q = .3 + rng() * .35;
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
  if (G.isBiz()) return bizStep();
  if (G.S && G.S.mgr) return mgrStep();
  if (busy) return; busy = true; sfx.pre();
  try {
    const s = G.S;
    const wk = G.absWeek();   // maç gününden geri dönülürse olay ve milli maç tekrar etmez
    if (s.fl.evw !== wk) { s.fl.evw = wk; const ev = pickEvent(); if (ev) await runEvent(ev); G.save(); }
    if (s.over) { await retireFlow(s.over); return; }
    const nf = s.fl.natw === wk ? null : G.natFixture();
    if (nf) {
      s.fl.natw = wk;
      const j = await dialog({ art: art('fed', 'flag', 'fame'), k: nf.lvl === 'U21' ? tt('Genç milli takım') : tt('Milli takım'), t: tt`${nf.usN} kadrosundasın`, body: tt`<p>${esc(nf.name)} · ${nf.home ? tt('iç saha') : tt('deplasman')}</p><p>Rakip: <b>${esc(nf.opp.n)}</b></p>`, opts: [{ t: tt('Maça çık'), i: 'ball' }, { t: tt('Simüle et'), c: 'ghost' }] });
      const nr = await runMatch(nf, s.car.caps > 3 || nf.lvl === 'U21' ? '11' : 'yedek', j === 0 ? 'play' : 'sim');
      if (nf.q) G.natApply(nr ? { us: nr.us, opp: nr.opp } : null, nf.k);
    }
    const rl = G.role(), can = (rl === '11' || rl === 'yedek') && !s.fl.skip;
    const pre = async (f, back) => {
      if (!AUTO) await backerFlow(f);   // abonelik varsa maç günü afişi paylaşılır
      const rf = G.refInfo(), mr = G.matchRole(f), r2 = mr.r;
      const why = (mr.why ? `<div class="stn st-${r2 === '11' ? 'acik' : 'liste'}">${ic('whistle', 16)}${esc(mr.why)}</div>` : '') + (r2 === 'yedek' ? `<div class="stn">${ic('clock', 16)}${tt('Oyuna girme ihtimalin')} <b>%${Math.round(G.subChance(f) * 100)}</b></div>` : '');
      const j = await dialog({
        art: f.eu ? tt`<div class="art euA eu-${f.eu}">${euLogo(f.eu, 96)}<div class="art-t"><b>${esc(G.club(f.opp).n)}</b><small>${esc(f.name)} · ${f.round} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}</small></div></div>` : clubArt(f.opp, `${f.cup ? f.name + ' · ' + f.round : LMAP[f.lid].name} · ${f.final ? tt('tarafsız saha') : f.home ? tt('iç saha') : tt('deplasman')}`), k: f.eu ? tt('Avrupa gecesi') : tt('Maç günü'),
        body: tt`<div class="tgrid"><div>${ic('shirt', 16)}<small>Görevin</small><b>${ROLE[r2]}</b></div><div>${ic('bolt', 16)}<small>Enerji</small><b>${Math.round(s.en)}</b></div><div>${ic('shield', 16)}<small>Takımın</small><b>${Math.round(s.rt[s.clubId])}</b></div><div>${ic('shield', 16)}<small>Rakip</small><b>${Math.round(s.rt[f.opp])}</b></div></div><div class="stn st-${rf.cold ? 'kilit' : 'acik'}">${ic('whistle', 16)}Hakem <b>${esc(rf.n)}</b> · ${rf.style} · ${rf.att}</div>${why + preExtra(f, rf)}<div class="stn">${ic(TACT[G.coach().st].i, 16)}Hoca <b>${esc(G.coach().n)}</b> · ${TACT[G.coach().st].n} · uyum %${G.tacFit()}</div>${s.adapt > 0 ? tt`<p class="warn">${ic('clock', 16)} Uyum sürecindesin (${s.adapt} hafta): anlar biraz zorlaşır.</p>` : ''}${s.en < 35 ? tt`<p class="warn">${ic('alert', 16)} Enerjin düşük: anlar zorlaşır, sakatlık riski artar.</p>` : ''}`,
        opts: [{ t: tt('Maça çık'), s: tt('Kilit anları sen oynarsın'), i: 'ball' }, { t: tt('Simüle et'), i: 'right' }, ...(back && s.diff !== 'gercek' ? [{ t: tt('Geri dön'), s: tt('Hafta harcanmaz'), c: 'ghost' }] : [])],
      });
      if (j === 2) return 'back';
      if (!AUTO && G.ivDue() && G.bigMatch(f) && (f.final || G.chance(.12))) await ivFlow('pre', f);
      return runMatch(f, r2, j === 0 ? 'play' : 'sim');
    };
    const cf = G.sideFixture(); let ownCup = null, first = true;
    if (cf && can) { ownCup = await pre(cf, true); if (ownCup === 'back') return; first = false; }
    const fxt = G.fixture(); let own = null;
    if (fxt) {
      if (can && G.S.inj <= 0) { own = await pre(fxt, first); if (own === 'back') return; }
      else if (rl === 'yok') { s.bench++; G.fx({ mo: -3 }); toast(tt('Kadroya alınmadın.'), 'x'); }
    }
    const r = G.endWeek(own, ...sideArgs(cf, ownCup)); G.save();
    if (s.week === 18) await transferWindow('kis');
    if (r.over) await seasonFlow();
    if (G.S) G.save();
  } finally {
    busy = false; sfx.ambOff();
    if (G.S) { V.scr = 'hub'; V.tab = goDesk ? 'kar' : 'ev'; if (goDesk) V.kv = 'tr'; goDesk = false; render(); if (!AUTO) window.scrollTo(0, 0); }
  }
}


// =====================================================================
// Yeni katman arayüzü: yuvalar, senaryo, rol, duran top, menajer, gazete, kupa odası, istatistik, pazarlık, kamp, gol tekrarı
// =====================================================================
const shirtSvg = (c1, c2, n, s = 50) => `<svg class="shirt" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 6l-11 6 4 9 6-3v24h20V18l6 3 4-9-11-6c-1 4-4 6-9 6s-8-2-9-6z" fill="${c1}" stroke="${c2}" stroke-width="2" stroke-linejoin="round"/><text x="24" y="33" text-anchor="middle" font-size="13" font-weight="900" fill="${c2}" font-family="Big Shoulders Display, Arial Narrow, sans-serif">${n}</text></svg>`;

// Başlık ekranı: üç kayıt yuvası
function slotRow() {
  return `<div class="slots">${G.slotList().map(x => `<button class="slot ${x.cur ? 'on' : ''} ${x.name ? '' : 'empty'}" data-a="slot" data-v="${x.n}">${x.name
    ? `<span class="avw">${avatar(x.look || { skin: 1, hair: 0, hc: 0 }, x.c1, x.c2, { num: x.num })}</span><b>${esc(x.name)}</b><small>${esc(x.club)} · ${x.mgr ? tt('kenarda') : tt`${x.age} yaş`}</small>`
    : `<span class="avw plus">${ic('plus', 24)}</span><b>${tt`Yuva ${x.n}`}</b><small>${tt('Boş')}</small>`}</button>`).join('')}</div>`;
}
// ---------- gizlilik bildirimi ve künye: başlık ekranından ve Ayarlar'dan açılır ----------
const REPO = 'https://github.com/keremkefli/toprak-saha';
const legalBtn = () => `<button class="link" data-a="legal">${tt('Gizlilik ve künye')}</button>`;
const legalOpt = () => `<button class="opt sm hv-ayar" data-a="legal">${ic('lock', 20)}<span><b>${tt('Gizlilik ve künye')}</b><small>${tt('Hangi veri nerede tutuluyor, kim sorumlu')}</small></span></button>`;
async function legalFlow() {
  const sec = (h, ps) => `<div class="lgl"><b>${h}</b>${ps.map(p => `<p>${p}</p>`).join('')}</div>`;
  const body = sec(tt('Kısaca'), [tt('Toprak Saha hesap istemez, reklam ve analitik aracı kullanmaz, çerez koymaz. Geliştirici hiçbir kişisel veriyi toplamaz, görmez, sunucuya göndermez.')])
    + sec(tt('Cihazında saklananlar'), [tt('Kariyer kayıtların ve ayarların (dil, ses, tema, para birimi) tarayıcının yerel depolamasında yalnızca bu cihazda durur. Oyunun çalışması için gereklidir; başka bir amaçla kullanılmaz.'), tt('Oyuncuna verdiğin ad da yalnızca cihazında kalır. Gerçek adını yazmak zorunda değilsin.')])
    + sec(tt('Barındırma'), [tt('Site GitHub Pages üzerinde yayınlanır. Sayfayı açtığında IP adresin, bağlantının teknik gereği olarak GitHub sunucularına ulaşır; GitHub bunu kendi gizlilik bildirimine göre güvenlik amacıyla işler. Yazı tipleri ve sesler aynı sunucudan gelir, başka bir şirkete istek yapılmaz.')])
    + sec(tt('Paylaşım ve aktarım'), [tt('Kariyer özeti, aktarım kodu ve kayıt dosyası yalnızca sen düğmeye basarsan oluşur; cihazının paylaşım menüsüne, panoya ya da indirme klasörüne gider. Nereye göndereceğini sen seçersin.')])
    + sec(tt('Silme ve hakların'), [tt('Ana menüdeki "Bu yuvayı sil" düğmesiyle bir kariyeri, tarayıcı ayarlarından site verilerini temizleyerek tüm kayıtları silebilirsin. Geliştiricide senin hakkında veri olmadığı için silinecek başka bir şey kalmaz.'), tt('6698 sayılı KVKK kapsamındaki soruların ve başvuruların için aşağıdaki iletişim kanalını kullanabilirsin.')])
    + sec(tt('Künye'), [tt('Toprak Saha bağımsız bir hayran yapımıdır; ücretsizdir, uygulama içi satın alma ve gerçek parayla oynanan hiçbir bölüm yoktur.'), tt('Kulüp adları şehir ve semt adlarından türetilmiştir; lig ve turnuva adları kurgudur. Oyunun hiçbir kulüp, federasyon ya da organizasyonla bağı yoktur, onlarca onaylanmamıştır. Armalar oyun içinde baş harflerden üretilir; resmî logo kullanılmaz.'), tt('Oyuncular, hocalar, hakemler ve diğer kişiler kurgudur; gerçek kişilerle benzerlik tesadüftür. Bahis, şike ve doping olayları kurgudur ve cezalarıyla birlikte gösterilir; gerçek bahsi özendirmez.'), tt('Yazı tipleri: Barlow ve Big Shoulders Display, SIL Open Font License 1.1.')])
    + sec(tt('İletişim'), [`<a href="${REPO}/issues" target="_blank" rel="noopener">${REPO.replace('https://', '')}/issues</a>`])
    + `<p class="note">${tt('Son güncelleme: 23 Kasım 2026')}</p>`;
  await dialog({ k: tt('Bilgilendirme'), t: tt('Gizlilik ve künye'), body, opts: [{ t: tt('Tamam') }], auto: 0 });
}
const slotDelBtn = () => `<button class="link" data-a="slotdel">${tt('Bu yuvayı sil')}</button>`;

// Oyuncu yaratma: klasik kariyer ya da senaryo
function scenFld() {
  if (C.world) return '';
  const m = G.meta().sc || {};
  const card = (v, n, d, i, done) => `<button class="pickc ${(C.sc || '') === v ? 'on' : ''}" data-a="set" data-v="sc:${v}"><span class="pic">${ic(i, 22)}</span><span><b>${n}${done ? ' ✓' : ''}</b><small>${d}</small></span></button>`;
  return `<div class="fld"><span>${tt('Başlangıç')}</span>${card('', tt('Klasik kariyer'), tt('16 yaşında, amatör ligden başla. Kulübünü deneme antrenmanlarıyla bulursun.'), 'home')}${SCENS.map(x => card(x.id, x.n, `${x.d} ${tt('Hedef')}: ${x.g}.`, x.i, m[x.id])).join('')}</div>`;
}
const scenStartBtn = () => `<button class="cta" data-a="start">${tt('Senaryoyu başlat')} ${ic('right', 22)}</button><p class="mut sm">${tt('Deneme antrenmanı yok: doğrudan kulübünde, ilk haftadasın.')}</p>`;

// Ana sayfa parçaları
function prefBar() {
  const s = G.S; if (!s.rv || s.inj > 0 || s.ban > 0) return '';
  const R = G.roleScore(), v = G.clamp(R.s, 0, 100), ant = Math.round(G.clamp(((R.tr ?? 1.5) - 1.5) * 3, -5, 5)), frm = Math.round(G.clamp(((R.f ?? 6.6) - 6.6) * 5, -7, 7)), fs = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x);
  return `<div class="prefw"><div class="prefh">${ic('whistle', 14)}<span>${tt('Hocanın tercihi')}</span><small>${s.rv.f && s.lastR.length ? tt`form: sen ${dec(R.f, 1)} · o ${dec(s.rv.f, 1)}` : ''}</small></div>
    <div class="prefb ${v >= 50 ? 'hi' : v >= 30 ? '' : 'lo'}"><i style="width:${v.toFixed(0)}%"></i><u style="left:30%"></u><u style="left:50%"></u></div>
    <div class="prefl"><span>${ROLE.yok}</span><span>${ROLE.yedek}</span><span>${ROLE['11']}</span></div>
    <div class="prefc"><span class="${ant >= 0 ? 'pos' : 'neg'}">${ic('train', 12)}${tt('İdman')} ${fs(ant)}</span><span class="${frm >= 0 ? 'pos' : 'neg'}">${ic('star', 12)}${tt('Form')} ${fs(frm)}</span><small>${tt('Kadro yerin her hafta idman temposuna ve maç notlarına göre yeniden belirlenir.')}</small></div></div>`;
}
function scenCard() {
  const X = G.scenInfo(); if (!X || !X.live) return '';
  return `<section class="card sgc scn">${tag(tt('Senaryo') + ' · ' + X.n, 'ye')}<div class="kv">${ic(X.i, 16)}<span>${X.g}</span></div><p class="note">${X.prog}</p></section>`;
}
function derbyLine(f) {
  const s = G.S; if (s.mgr || !G.isDerby(s.clubId, f.opp)) return '';
  const d = G.derbyRec(f.opp);
  return `<div class="aggb dby">${ic('bolt', 14)}${d ? tt`Derbi karnen: ${d[0]} galibiyet, ${d[1]} beraberlik, ${d[2]} mağlubiyet · ${d[3]} gol` : tt('Bu derbide ilk kez sahne alacaksın')}</div>`;
}
const paperBtn = () => `<button class="chip sm" data-a="paper">${ic('news', 14)} ${tt('Gazete')}</button>`;
const preExtra = (f, rf) => (f.nat ? '' : (() => { const gw = G.gkWeak(f.opp); return `<div class="stn">${ic('eye', 16)}${tt('Rakip kaleci')} <b>${esc(gw.n)}</b> · ${gw.t}</div>`; })()) + (rf.pen ? `<div class="stn">${ic('target', 16)}${rf.pen}</div>` : '') + (G.isDerby(G.S.clubId, f.opp) ? `<div class="stn st-liste">${ic('bolt', 16)}<span><b>${tt('Derbi günü')}</b> · ${f.home ? tt('Tribünler saatler önce doldu. Bugün her top iki kat ağır.') : tt('Deplasman tribünü ıslıkla bekliyor. Bugün her top iki kat ağır.')}</span></div>` : '');

// Haftalık gazete sayfası
async function paperFlow() {
  const P = G.paper(), s = G.S, c = G.club(s.clubId), lm = P.lm;
  const best = P.best.map(b => `<div class="pp-r ${b.me ? 'me' : ''}">${crest(b.c, 20)}<span>${esc(b.n)}</span><b>${dec(b.r, 1)}</b></div>`).join('');
  const rows = P.rows.map(r => `<div class="pp-r ${r.me ? 'me' : ''}"><i>${r.pos}</i>${crest(r.id, 20)}<span>${esc(G.club(r.id).n)}</span><b>${r.pts}</b></div>`).join('');
  const pic = lm ? `<div class="pp-pic ${P.mood > 0 ? 'up' : P.mood < 0 ? 'dn' : ''}" style="--c1:${c.c1}"><div class="pp-av">${avatar(s.look, c.c1, c.c2, { num: s.num })}</div><div class="pp-sc">${crest(s.clubId, 34)}<b>${lm.us} - ${lm.og}</b>${crest(lm.opp, 34)}</div></div>` : `<div class="pp-pic" style="--c1:${G.club(P.rows[0].id).c1}"><div class="pp-sc">${crest(P.rows[0].id, 64)}</div></div>`;
  await dialog({ cls: 'paper', body: `<div class="pp"><div class="pp-h"><b>${tt('SAHA KENARI')}</b><small>${esc(P.date)} · ${esc(tt(P.lname))}</small></div>${pic}
    <h3 class="pp-t">${esc(P.head)}</h3><p class="pp-s">${esc(P.sub)}</p>
    <div class="pp-2"><div><div class="pp-k">${tt('Haftanın en iyileri')}</div>${best || `<p class="mut sm">${tt('Geçen hafta kazanan çıkmadı.')}</p>`}</div><div><div class="pp-k">${tt('Puan durumu')}</div>${rows}</div></div>
    <div class="pp-k">${tt('Transfer kulisi')}</div><ul class="pp-l">${P.rum.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${P.next ? `<div class="pp-n">${ic('cal', 14)}<span>${tt('Sıradaki maç')}: <b>${esc(G.club(P.next.id).n)}</b> · ${P.next.home ? tt('İç saha') : tt('Deplasman')}${P.next.pos ? ' · ' + tt`${P.next.pos}. sıra` : ''}${P.next.derby ? ' · ' + tt('Derbi') : ''}</span></div>` : ''}</div>`, opts: [{ t: tt('Kapat') }], auto: 0 });
}

// Kariyer > Profil: oyun rolü, ikinci mevki, duran toplar
function roleCard() {
  const s = G.S, w = G.roleWait(), P2 = G.pos2Info();
  const roles = [{ id: '', n: tt('Serbest', 'rol'), d: tt('Belirli bir rol yok: mevkinin olağan anları gelir.'), i: 'ball', cur: !s.prole }, ...G.roleList()]
    .map(r => `<button class="pickc sm ${r.cur ? 'on' : ''}" data-a="prole" data-v="${r.id}" ${!r.cur && w > 0 ? 'disabled' : ''}><span class="pic">${ic(r.i, 20)}</span><span><b>${r.n}${r.fit ? ` <em class="fitk">${tt('sisteme uygun')}</em>` : ''}</b><small>${r.d}</small></span></button>`).join('');
  let p2 = '';
  if (s.pos !== 'KL') {
    const cur = P2.cur ? `<div class="kv">${ic('up', 16)}<span>${tt`${P2.cur.n} öğreniliyor`}</span><b>%${Math.floor(P2.cur.x)}</b></div>${bar(P2.cur.x, 'hot')}` : '';
    const known = P2.known.map(k => `<div class="shop has"><span class="aic">${ic('check', 22)}</span><div><b>${k.n}</b><small>${tt`Bu mevkide gücün ${k.ovr} · şu an ${P2.me}`}</small></div><button class="mini-b" data-a="posw" data-v="${k.p}" ${P2.wait > 0 ? 'disabled' : ''}>${P2.wait > 0 ? tt`${P2.wait} hf` : tt('Geç')}</button></div>`).join('');
    const opts = P2.opts.map(o => `<button class="chip sm ${P2.cur && P2.cur.p === o.p ? 'on' : ''}" data-a="posl" data-v="${o.p}">${o.n} · ${o.ovr}${o.near ? ' ↗' : ''}</button>`).join('');
    p2 = `<div class="sub">${ic('swap', 16)}${tt('İkinci mevki')}</div>${cur}${known}${opts ? `<div class="chips">${opts}</div>` : ''}<p class="note">${tt('Bir mevki seç: her hafta biraz öğrenirsin. Ok işaretli yakın mevkiler daha hızlı öğrenilir, özel antrenman hızlandırır. Sayı, o mevkideki gücündür. Öğrendiğin mevkiye geçebilirsin; her yeni mevki forma şansını da artırır.')}</p>`;
  }
  return `<section class="card">${tag(tt('Oyun rolü'))}<p class="note">${w > 0 ? tt`Rolü yeniden değiştirmek için ${w} hafta bekle.` : tt('Rol, maçta karşına çıkan anları değiştirir. Hocanın sistemine uyan rol taktik uyumunu da artırır.')}</p>${roles}${p2}</section>`;
}
function spCard() {
  const s = G.S; if (s.pos === 'KL') return '';
  const sp = G.setPieces(), w = G.spWait();
  const rows = Object.values(sp).map(x => `<div class="shop ${x.me ? 'has' : ''}"><span class="aic">${ic(x.k === 'pen' ? 'target' : x.k === 'fk' ? 'ball' : 'flag', 22)}</span><div><b>${x.n} · ${x.me ? tt('sende') : esc(x.who)}</b><small>${tt`Sen ${x.mine} · usta ${x.mate}`}</small></div>${x.me ? `<span class="own">${ic('check', 16)}</span>` : `<button class="mini-b" data-a="spask" data-v="${x.k}" ${w > 0 ? 'disabled' : ''}>${w > 0 ? tt`${w} hf` : tt('İste')}</button>`}</div>`).join('');
  return `<section class="card">${tag(tt('Duran toplar'))}${rows}<p class="note">${tt('Topun başına kimin geçeceğini özellikler belirler: penaltıda şut ve zihin, frikikte şut ve teknik, kornerde pas ve teknik. "Orta ve Duran Top" ile "Zihin" antrenmanları seni öne geçirir; hocadan da isteyebilirsin. Usta sen olursan o anlar maçta çok daha sık gelir.')}</p></section>`;
}

// Menajerle konuşma
const agBtn = () => `<button class="opt sm" data-a="agtalk">${ic('phone', 20)}<span><b>${tt('Menajerinle konuş')}</b><small>${tt('Kulüp bul, zam iste, sponsor ara')}</small></span></button>`;
async function agentFlow() {
  const s = G.S, a = s.agent; if (!a) return;
  const A = i => `<div class="art t-fame"><div class="art-ic">${ic(i, 150)}</div><div class="art-av">${agentAv(a.n)}</div><span class="art-n">${esc(a.n)}</span></div>`;
  for (;;) {
    const T = G.agentTopics();
    const i = await dialog({ art: A('phone'), k: tt('Menajer'), t: a.n, body: `<p class="quo">${esc(G.agentHi())}</p>`, opts: [...T.map(x => ({ t: AGTOP[x.k].n, s: x.why || (x.wait ? tt`${x.wait} hafta sonra yeniden` : AGTOP[x.k].d), i: AGTOP[x.k].i, dis: !!x.dis })), { t: tt('Kapat'), c: 'ghost' }], cls: 'ev', auto: T.length });
    if (i >= T.length) break;
    const k = T[i].k; let x = null;
    if (k === 'bul' && !T[i].wait) {
      const ks = Object.keys(AGBR), j = await dialog({ art: A('eye'), k: AGTOP.bul.n, t: tt('Ne arıyorsun?'), opts: [...ks.map(b => ({ t: AGBR[b].n, s: AGBR[b].d, i: AGBR[b].i })), { t: tt('Vazgeç'), c: 'ghost' }], cls: 'ev' });
      if (j >= ks.length) continue; x = ks[j];
    }
    const r = G.agentTalk(k, x); if (!r) continue;
    if (r.clubs.length || r.ch.some(c => c.startsWith('+'))) sfx.up();
    await dialog({ art: A(AGTOP[k].i), k: AGTOP[k].n, t: a.n, body: r.lines.map(l => `<p class="quo">${esc(l)}</p>`).join('') + r.clubs.map(id => `<div class="kv">${crest(id, 22)}<span>${esc(G.club(id).n)} · ${tt('güç')} ${Math.round(s.rt[id])}</span><b>${tt('izlemeye aldı')}</b></div>`).join('') + chips(r.ch), opts: [{ t: tt('Tamam') }], auto: 0, cls: 'ev' });
    G.save();
  }
  render();
}

// Kariyer > Geçmiş: kupa odası ve istatistikler
function trophyRoom() {
  const s = G.S, cs = G.statsInfo().cs;
  if (!s.tro.length && !cs.length) return '';
  const g = {}; for (const x of s.tro) { const i = x.indexOf(' · '), y = x.slice(0, i), n = x.slice(i + 3).replace(/ \(\d+ gol\)$/, ''); (g[n] || (g[n] = [])).push(y); }
  const kind = n => (/Gol Kral/.test(n) ? ['ball', 'b'] : /Yılın|Ayın/.test(n) ? ['star', 's'] : /Kıta|Avrupa|Dünya|Süper Kupa/.test(n) ? ['crown', 'e'] : ['trophy', 'g']);
  const tiles = Object.keys(g).map(n => { const [i, k] = kind(n), ys = g[n]; return `<div class="trt k-${k}"><div class="trc">${trophySvg(k === 'b' ? 'gol' : k === 's' ? 'odul' : k === 'e' ? 'avrupa' : /Kupa/.test(n) ? 'kupa' : 'lig', 34)}${ys.length > 1 ? `<em>×${ys.length}</em>` : ''}</div><b>${esc(tt`${n}`)}</b><small>${ys.slice(-3).join(' · ')}${ys.length > 3 ? ' …' : ''}</small></div>`; }).join('');
  const shirts = cs.slice(0, 9).map(x => { const k = G.club(x.id); return `<button class="shr" data-a="club" data-v="${x.id}">${shirtSvg(k.c1, k.c2, s.num)}<b>${esc(k.n)}</b><small>${tt`${x.apps} maç, ${x.g} gol`}</small></button>`; }).join('');
  return `<section class="card trr">${tag(tt('Kupa odası'), 'ye')}${tiles ? `<div class="trg">${tiles}</div>` : `<p class="mut sm">${tt('Raflar boş. İlk kupan bu vitrine gelecek.')}</p>`}${shirts ? `<div class="sub">${ic('shirt', 16)}${tt('Giydiğin formalar')}</div><div class="shg">${shirts}</div>` : ''}</section>`;
}
function statsCard() {
  const s = G.S, X = G.statsInfo(), t = X.t, R = X.R, C = X.curve;
  let chart = `<p class="mut sm">${tt('Güç eğrisi ilk sezonun bitince çizilir.')}</p>`;
  if (C.length >= 2) {
    const W = 320, H = 124, os = C.map(c => c.o), mn = Math.min(...os) - 3, mx = Math.max(...os) + 3, gx = Math.max(1, ...C.map(c => c.g)), top = os.indexOf(Math.max(...os));
    const x = i => 16 + i * (W - 32) / (C.length - 1), y = v => H - 20 - (v - mn) / (mx - mn) * (H - 40), bw = Math.min(16, (W - 32) / C.length * .5);
    chart = `<svg class="gch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tt('Güç eğrisi')}">${C.map((c, i) => `<rect class="gcb" x="${(x(i) - bw / 2).toFixed(1)}" y="${(H - 20 - c.g / gx * 36).toFixed(1)}" width="${bw.toFixed(1)}" height="${(c.g / gx * 36).toFixed(1)}"/>`).join('')}<polyline class="gcl" points="${C.map((c, i) => `${x(i).toFixed(1)},${y(c.o).toFixed(1)}`).join(' ')}"/>${C.map((c, i) => `<circle class="gcd ${c.cur ? 'cur' : ''}" cx="${x(i).toFixed(1)}" cy="${y(c.o).toFixed(1)}" r="${c.cur ? 4 : 3}"/>${i === 0 || i === C.length - 1 || i === top ? `<text class="gct" x="${x(i).toFixed(1)}" y="${(y(c.o) - 8).toFixed(1)}" text-anchor="middle">${c.o}</text>` : ''}`).join('')}<text class="gcy" x="16" y="${H - 4}">${C[0].y}</text><text class="gcy" x="${W - 16}" y="${H - 4}" text-anchor="end">${C[C.length - 1].y}</text></svg><p class="mut sm">${tt('Çizgi: sezon sonundaki gücün. Sütunlar: o sezonki gollerin.')}</p>`;
  }
  const dn = X.dby[0] + X.dby[1] + X.dby[2];
  const rec = [[tt('Bir sezonda en çok gol'), R.g ? `${R.g} · ${R.gy}` : '–', 'ball'], [tt('Bir sezonda en çok asist'), R.a ? `${R.a} · ${R.ay}` : '–', 'swap'], [tt('En iyi sezon ortalaması'), R.avg ? `${dec(R.avg)} · ${R.avgy}` : '–', 'star'], [tt('Bir maçta en çok gol'), R.mg || '–', 'target'], ['Hat-trick', R.hat || 0, 'bolt'], [tt('En yüksek maç notu'), R.rt ? dec(R.rt, 1) : '–', 'up'], [tt('Zirve gücü'), X.peak, 'chart'], [tt('En yüksek piyasa değeri'), R.val ? G.fmtS(R.val) : '–', 'tag'], [tt('Derbi karnesi'), dn ? tt`${X.dby[0]}G ${X.dby[1]}B ${X.dby[2]}M · ${X.dby[3]} gol` : '–', 'shield']];
  const cmp = X.cars.length ? `<div class="sub">${ic('users', 16)}${tt('Önceki kariyerlerinle')}</div><table class="tb hist"><tr><th></th><th>${tt('Oyuncu')}</th><th>${tt('Maç')}</th><th>${tt('Gol')}</th><th>${tt('Zirve')}</th><th>${tt('Puan')}</th></tr><tr class="me"><td>${ic('right', 14)}</td><td>${esc(s.name)}<small>${tt('şimdiki kariyer')}</small></td><td>${t.apps}</td><td>${t.g}</td><td>${X.peak}</td><td>–</td></tr>${X.cars.slice(0, 5).map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c.n)}<small>${POS[c.pos] ? POS[c.pos].n : ''} · ${c.y}</small></td><td>${c.apps}</td><td>${c.g}</td><td>${c.peak}</td><td>${num(c.sc)}</td></tr>`).join('')}</table>` : '';
  return `<section class="card">${tag(tt('İstatistik'))}${chart}<div class="recg">${rec.map(([l, v, i]) => `<div class="kv">${ic(i, 16)}<span>${l}</span><b>${v}</b></div>`).join('')}</div>${cmp}</section>`;
}

// Hayat: soyunma odası klikleri, krampon sponsoru, koleksiyon
function lockerBar() {
  const L = G.lockerInfo();
  return `<div class="kliks">${L.ks.map(k => `<div class="klik l${k.lv}">${ic(k.i, 16)}<b>${k.n}</b><small>${k.mood}</small></div>`).join('')}</div><div class="kv">${ic('alert', 16)}<span>${tt('Soyunma odası gerginliği')}</span><b class="${L.ten >= 50 ? 'neg' : ''}">%${L.ten}</b></div>${bar(L.ten, L.ten >= 50 ? 'hot' : 'mo')}`;
}
function bootRow() {
  const b = G.bootInfo(); if (!b) return '';
  return `<div class="kv">${ic('shirt', 16)}<span>${esc(b.n)} · ${tt('krampon sponsoru')}</span><b>${G.fmtS(b.wk)}${tt('/hf')}</b></div>${b.need ? `<div class="kv">${ic('target', 16)}<span>${b.t} · ${tt`prim ${G.fmtS(b.bon)}`}</span><b>${b.cur}/${b.need}</b></div>${bar(b.cur / b.need * 100, 'hot')}` : ''}`;
}
function colHTML() {
  const s = G.S, tr = G.shopTier();
  if (tr < 2) return '';
  if (tr === 2) return `<p class="mut sm lockn">${ic('lock', 14)} ${tt('İkinci kademeyi de bitirince koleksiyon açılır: her sezon yeni forma, saat, tablo ve klasik araba.')}</p>`;
  const off = G.colOffer(), col = s.col || [];
  return `<div class="sub">${ic('star', 16)}${tt('Koleksiyon · her sezon yeni parçalar')}</div>${off.map((it, i) => `<div class="shop ${it.own ? 'has' : ''}"><span class="aic">${ic(COLK[it.k].i, 22)}</span><div><b>${COLK[it.k].l[it.li]}</b><small>${COLK[it.k].n} · ${tt('itibar ve takipçi getirir, değeri zamanla artar')}</small></div>${it.own ? `<span class="own">${ic('check', 16)}</span>` : `<button class="mini-b" data-a="colb" data-v="${i}" ${s.money < it.p ? 'disabled' : ''}>${G.fmtS(it.p)}</button>`}</div>`).join('')}
    ${col.length ? `<div class="kv tot">${ic('chart', 16)}<span>${tt`Koleksiyonun: ${col.length} parça`}</span><b>${G.fmtS(G.colValue())}</b></div>${col.map((c, i) => `<div class="shop has"><span class="aic">${ic(COLK[c.k].i, 22)}</span><div><b>${COLK[c.k].l[c.li]}</b><small>${c.y} · ${tt`alış ${G.fmtS(c.p)} · şimdi ${G.fmtS(c.v)}`}</small></div><button class="mini-b" data-a="cols" data-v="${i}">${tt('Sat')}</button></div>`).join('')}` : ''}`;
}

// Maç: devre arası konuşması, gol tekrarı
const htHTML = (M, H) => `<p class="quo"><b>${esc(G.coach().n)}</b>${esc(H.line)}</p><div class="stn st-acik">${ic('target', 16)}<span>${tt('Hocanın ikinci yarı isteği')}: <b>${H.ask}</b></span></div><div class="kv">${ic('star', 16)}<span>${tt('İlk yarı notun')}</span><b>${dec(M.rt, 1)}</b></div>`;
async function replayFlow(M, fxt) {
  const s = G.S, nat = M.nat, cu = nat ? '#d81e2c' : G.club(s.clubId).c1; let co = nat ? '#3b4754' : G.club(fxt.opp).c1; if (co === cu) co = nat ? '#f2f2f2' : G.club(fxt.opp).c2;
  const opN = nat ? fxt.opp.n : G.club(fxt.opp).n;
  for (let gi = 0; gi < M.goals.length; gi++) {
    const g = M.goals[gi];
    const p = dialog({ cls: 'ev', k: tt`${g.min}. dakika`, t: MOM[g.k].n, body: `<canvas id="rpl" class="opch"></canvas><p class="note">${tt`Gol ${gi + 1}/${M.goals.length} · tekrar oynuyor`}</p>`, opts: [{ t: gi < M.goals.length - 1 ? tt('Sıradaki gol') : tt('Kapat') }, { t: tt('Gol kartını paylaş'), i: 'phone', c: 'ghost' }, ...(clipType() ? [{ t: tt('Klibi kaydet'), s: tt('5 saniyelik video: paylaş ya da indir'), i: 'down', c: 'ghost' }] : [])], auto: 0 });
    const cv = $('#rpl'); let pt = null;
    if (cv) {
      pt = new Pitch(cv, { cu, co, me: PSLOT[s.pos], flip: false });
      (async () => { for (let n = 0; n < 8 && pt.on; n++) { pt.focus(); await sleep(1100); if (!pt.on) break; pt.attack(true); await sleep(650); if (!pt.on) break; pt.goal(true); if (!n) sfx.goal(); await sleep(2600); } })();
    }
    const j = await p;
    if (j === 2 && cv) await recordClip(cv, { c1: cu, tag: tt('GOL'), title: s.name.toLocaleUpperCase(LC), sub: `${g.min}' · ${MOM[g.k].n}`, sub2: tt`${opN} maçı`, text: tt`Toprak Saha: ${s.name}, ${g.min}. dakikada gol.` });
    if (pt) pt.stop();
    if (j === 1) await shareCard({ c1: cu, tag: tt('GOL'), big: g.min + "'", bigL: MOM[g.k].n.toLocaleUpperCase(LC), title: s.name.toLocaleUpperCase(LC).split(' ').slice(0, 2), sub: tt`${opN} maçı · ${POS[s.pos].n}`, stats: [[M.pg, tt('Gol')], [M.pa, tt('Asist')], [dec(M.rt, 1), tt('Not')]], text: tt`Toprak Saha: ${s.name}, ${g.min}. dakikada gol.` });
  }
}

// Transfer: madde madde pazarlık. Dönen değer: kulüp masadan kalktı mı
const negoHTML = o => [o.goalB ? [tt('Gol primi'), G.fmtS(o.goalB), 'ball'] : null, o.img ? [tt('İmaj hakkı'), tt('sende'), 'tag'] : null, o.loy ? [tt('Sadakat primi'), G.fmtS(o.loy), 'heart'] : null, o.relF ? [tt('Serbest kalma bedeli'), tt('düşük'), 'lock'] : null, o.app ? [tt('Maç başı prim'), G.fmtS(o.app), 'shirt'] : null, o.forma ? [tt('Forma garantisi'), tt('var'), 'shield'] : null, o.kap ? [tt('Kaptanlık maddesi'), tt('var'), 'crown'] : null].filter(Boolean).map(([l, v, i]) => `<div class="kv">${ic(i, 16)}<span>${l}</span><b>${v}</b></div>`).join('');
async function negoFlow(o) {
  for (;;) {
    const g = G.negoInfo(o), list = NEGO.filter(n => n.id !== 'kisa' || o.len > 1), shut = g.pat <= 0 || !!g.end;
    const i = await dialog({ art: clubArt(o.id, offerSub(o.id)), k: tt('Pazarlık masası'), t: shut ? tt('Kulüp son sözünü söyledi') : tt`Kulübün sabrı: ${g.pat}`, body: offerHTML(o) + negoHTML(o) + `<p class="note">${tt('Her madde ayrı konuşulur. Reddedilen her istek kulübün sabrını bir azaltır; sabır bitince masa kapanır, hatta teklif geri çekilebilir. Menajerin güçlüyse daha çok madde koparırsın.')}</p>`, opts: [...list.map(n => ({ t: n.n, s: g.got[n.id] ? tt('Alındı') : n.d, i: g.got[n.id] ? 'check' : n.i, dis: !!g.got[n.id] || shut })), { t: tt('Masadan kalk'), c: 'ghost' }], auto: list.length });
    if (i >= list.length) return false;
    const r = G.negoAsk(o, list[i].id); if (!r) continue;
    if (r.ok) sfx.up(); else sfx.bad();
    await info(tt('Pazarlık'), r.text, '', clubArt(o.id, offerSub(o.id)));
    if (r.gone) return true;
  }
}

// Sezon öncesi kamp: ağırlık seçimi ve iki hazırlık maçı
async function campFlow() {
  const s = G.S; if (!s || s.mgr || !s.clubId) return;
  const i = await dialog({ art: art('hoca', 'train', 'club'), k: tt('Sezon öncesi kamp'), t: tt('Kampta neye ağırlık vereceksin?'), body: `<p>${tt('Takım on günlük kampa giriyor. Seçimin bütün sezona yansır; ardından iki hazırlık maçı var.')}</p>`, opts: CAMP.map(c => ({ t: c.n, s: c.d, i: c.i })), cls: 'ev' });
  const ch = G.campPick(CAMP[i].id); if (ch.length && !AUTO) toast(ch.join(' · '), 'check');
  for (let n = 0; n < 2 && s.inj <= 0; n++) {
    const opp = G.campFixture(); if (!opp) break;
    const j = await dialog({ art: clubArt(opp, tt`Hazırlık maçı ${n + 1}/2`), k: tt('Hazırlık maçı'), t: G.club(opp).n, body: `<p>${tt('Sonuç önemli değil; hoca kimin hazır olduğuna bakıyor. Tek bir pozisyon oynarsın: iyi geçerse ilk haftalarda forma şansın artar.')}</p>`, opts: [{ t: tt('Oyna'), s: tt('Bir an: hocanın gözüne gir'), i: 'ball' }, { t: tt('Dinlen'), s: tt('Enerji +8'), i: 'bed' }], cls: 'ev', auto: 0 });
    let good = false;
    if (j === 0) { const k = G.momPick(null), r = AUTO ? G.simMoment(k, { oppR: s.rt[opp] }) : await playMini(k, s.rt[opp], tt('Hazırlık maçı') + ' · ' + MOM[k].n, { opp }); good = G.GOOD.includes(r.out); }
    const c2 = G.campMatch(j === 0, good);
    if (!AUTO) toast((j === 0 ? (good ? tt('Hoca not aldı: iyi iş.') : tt('Bu sefer olmadı.')) + ' ' : '') + c2.join(' · '), good ? 'up' : 'check');
  }
  G.save();
}

// ---------- maç günü sahneleri: tünel ve diziliş ----------
const XI = [[50, 91], [14, 70], [38, 74], [62, 74], [86, 70], [18, 46], [42, 50], [66, 46], [84, 26], [36, 16], [62, 16]];   // sahadaki yerler (%): KL, 4 DF, 3 OS, KN, 2 FV
function lineupSvg(names, me, c1, c2) {
  const lumo = c => { const n = parseInt(c.replace('#', ''), 16); return ((n >> 16) & 255) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; }, ink = lumo(c1) > 140 ? '#14110e' : '#fff';
  return `<svg class="lnp" viewBox="0 0 100 104" aria-hidden="true"><rect x="1" y="1" width="98" height="102" rx="2" fill="#1d7438" stroke="rgba(255,255,255,.45)"/><path d="M1 52h98M30 103V88h40v15M30 1v15h40V1" fill="none" stroke="rgba(255,255,255,.35)"/><circle cx="50" cy="52" r="10" fill="none" stroke="rgba(255,255,255,.35)"/>
    ${XI.map(([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="${i === me ? 5.4 : 4.4}" fill="${i === 0 ? '#ffd23f' : c1}" stroke="${i === me ? '#ffd23f' : c2}" stroke-width="${i === me ? 1.6 : 1}"/><text x="${x}" y="${y + 9.6}" text-anchor="middle" font-size="4.6" font-weight="${i === me ? 800 : 600}" fill="${i === me ? '#ffd23f' : '#f5efe4'}" font-family="Barlow, system-ui, sans-serif">${esc(names[i])}</text>${i === me ? `<text x="${x}" y="${y + 1.7}" text-anchor="middle" font-size="4.6" font-weight="900" fill="${ink}" font-family="Big Shoulders Display, Arial Narrow, sans-serif">${G.S.num}</text>` : ''}</g>`).join('')}</svg>`;
}
function tunnelDraw(g, t, W, H, E, A, B, num) {
  g.fillStyle = '#0c0a09'; g.fillRect(0, 0, W, H);
  backdrop(g, W * .3, 4, W * .4, H * .66 * 1.36, E, t);
  g.fillStyle = '#17130f'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * .3, 4); g.lineTo(W * .3, H * .64); g.lineTo(0, H); g.fill(); g.beginPath(); g.moveTo(W, 0); g.lineTo(W * .7, 4); g.lineTo(W * .7, H * .64); g.lineTo(W, H); g.fill();
  g.fillStyle = '#231e19'; g.beginPath(); g.moveTo(0, H); g.lineTo(W * .3, H * .64); g.lineTo(W * .7, H * .64); g.lineTo(W, H); g.fill();
  g.fillStyle = A.c1; g.globalAlpha = .5; g.beginPath(); g.moveTo(0, H * .3); g.lineTo(W * .3, H * .24); g.lineTo(W * .3, H * .28); g.lineTo(0, H * .37); g.fill(); g.beginPath(); g.moveTo(W, H * .3); g.lineTo(W * .7, H * .24); g.lineTo(W * .7, H * .28); g.lineTo(W, H * .37); g.fill(); g.globalAlpha = 1;
  const rows = [[H * .72, .5], [H * .82, .72], [H * .97, 1]];
  rows.forEach(([y, s], i) => {
    const dx = 26 + i * 16, me = i === 2;
    if (i === 0) fig(g, W / 2, y - 2, s * .95, { c1: '#15120f', c2: '#ffd23f', pat: 'duz', back: true, pose: POSE.run(t + 1, .3) });   // hakem
    fig(g, W / 2 - dx, y, s, { c1: A.c1, c2: A.c2, back: true, num: me ? num : '', skin: me ? A.skin : undefined, hair: me ? A.hair : undefined, boot: me ? A.boot : undefined, pose: POSE.run(t + i * .4, .3) });
    fig(g, W / 2 + dx, y, s, { c1: B.c1, c2: B.c2, back: true, pose: POSE.run(t + i * .4 + .5, .3) });
  });
}
async function tunnelFlow(fxt, M, E, rl) {
  const s = G.S, nat = M.nat, c = nat ? { c1: '#d81e2c', c2: '#f2f2f2' } : G.club(s.clubId), o = nat ? { c1: '#3b4754', c2: '#f2f2f2' } : G.club(fxt.opp), L = s.look || {};
  const A = { c1: c.c1, c2: c.c2, skin: SKIN[L.skin ?? 1], hair: HAIRC[L.hc ?? 0], boot: G.bootColor() }, B = o.c1 === c.c1 ? { c1: o.c2, c2: o.c1 } : { c1: o.c1, c2: o.c2 };
  const slot = rl === 'yedek' ? -1 : PSLOT[s.pos], last = n => String(n).split(' ').slice(-1)[0], names = (nat ? XI.map((_, i) => String(i + 1)) : G.squad(s.clubId).map(last)).slice(0, 11);
  if (slot >= 0) names[slot] = last(s.name);
  const p = dialog({ art: '<canvas id="tun" class="tun"></canvas>', k: tt('Tünel'), t: nat ? tt('Milli marş için sıradasınız') : fxt.home ? tt('Tribünler sizi bekliyor') : tt('Deplasman tribünü ıslıklıyor'),
    body: `<div class="lnw">${lineupSvg(names, slot, A.c1, A.c2)}<div class="lnn"><div class="kv">${ic('shirt', 16)}<span>${tt('Dizilişteki yerin')}</span><b>${slot >= 0 ? POS[s.pos].n : tt('Yedek kulübesi')}</b></div><div class="kv">${ic('users', 16)}<span>${tt('Tribün')}</span><b>%${Math.round(E.fill * 100)}</b></div><div class="kv">${ic(E.tod === 'gun' ? 'sun' : 'moon', 16)}<span>${tt('Saat')}</span><b>${E.tod === 'gun' ? tt('Gündüz') : E.tod === 'aksam' ? tt('Akşam') : tt('Gece')}</b></div>${rl === 'yedek' ? `<p class="note">${tt('Kulübedesin. Hoca çağırınca oyuna girersin.')}</p>` : ''}</div></div>`,
    opts: [{ t: tt('Sahaya çık'), i: 'ball' }], auto: 0, cls: 'ev' });
  const cv = $('#tun'); let on = true;
  if (cv) {
    const g = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 360, H = 170; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = performance.now(), loop = () => { if (!on) return; tunnelDraw(g, (performance.now() - t0) / 1000, W, H, E, A, B, s.num); if (!GFX.calm) setTimeout(loop, GFX.low ? 120 : 40); }; loop();
  }
  await p; on = false;
}

// ---------- görünüm: ifade, yaş, grafik ayarları ----------
// Oyuncunun o anki hâli portreye yansır
const lookX = (x = {}) => { const s = G.S; return { ...x, age: s.age, cap: !!s.fl.kaptan, hurt: s.inj > 0, mood: s.inj > 0 || s.en < 28 ? 'tir' : s.mo >= 78 ? 'joy' : s.mo < 30 ? 'ang' : '' }; };
const GKEY = 'toprak-saha-grafik';
function applyGfx() {
  let o = {}; try { o = JSON.parse(localStorage.getItem(GKEY)) || {}; } catch (e) { /* yok */ }
  if (o.calm == null) { try { o.calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { o.calm = false; } }
  GFX.low = !!o.low; GFX.calm = !!o.calm; GFX.cb = !!o.cb;
  const d = document.documentElement.dataset; if (GFX.calm) d.calm = '1'; else delete d.calm; if (GFX.cb) d.cb = '1'; else delete d.cb;
}
function gfxCard() {
  const row = (k, n, d, i) => `<button class="opt sm hv-ayar" data-a="gfx" data-v="${k}">${ic(i, 20)}<span><b>${n}: ${GFX[k] ? tt('açık') : tt('kapalı')}</b><small>${d}</small></span></button>`;
  return row('low', tt('Düşük grafik'), tt('Eski telefonlar ve pil için: seyirci, duman ve tekrarlar sadeleşir'), 'bolt') + row('calm', tt('Hareketi azalt'), tt('Geçişler ve sallanan öğeler durur'), 'eye') + row('cb', tt('Renk körü paleti'), tt('Yeşil ve kırmızı yerine mavi ve turuncu'), 'target');
}
// Sayaç animasyonu: para akar, güç artınca parlar
let lastMoney = null, lastOvr = null;
function polish() {
  app.querySelectorAll('.at b').forEach(b => { const v = parseFloat(b.textContent); b.dataset.t = v >= 80 ? 5 : v >= 65 ? 4 : v >= 50 ? 3 : v >= 35 ? 2 : 1; });   // özellik sayısı rengi
  const s = G.S; if (!s || V.scr !== 'hub') { lastMoney = lastOvr = null; return; }
  const p = $('.top .pill'), m = s.mgr && !G.isBiz() ? s.mgr.bud : s.money;
  if (p && lastMoney != null && m !== lastMoney && !GFX.calm) {
    const a = lastMoney, t0 = performance.now(), node = p.lastChild;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 650); if (!node.isConnected) return; node.textContent = G.fmtS(a + (m - a) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    step(); p.classList.add(m > a ? 'up' : 'dn');
  }
  lastMoney = m;
  if (!s.mgr) { const o = G.OVR(), e = $('.hero .ovr b'); if (e && lastOvr != null && o > lastOvr && !GFX.calm) e.classList.add('glow'); lastOvr = o; }
}

// ---------- yaşam sahnesi: aldıkların tek karede ----------
function lifeSvg() {
  const s = G.S, has = id => G.has(id), lvl = has('yali') ? 4 : has('villa') ? 3 : has('ev') ? 2 : has('daire') ? 1 : 0, water = has('tekne') || lvl === 4;
  const win = (x, y, on = 1) => `<rect x="${x}" y="${y}" width="6" height="7" fill="${on ? '#ffd678' : '#15120f'}" opacity="${on ? .9 : .6}"/>`;
  const home = [
    `<path d="M70 104V78l22-16 22 16v26z" fill="#4a4640"/><path d="M64 80 92 58l28 22-4 4-24-18-24 18z" fill="#6b4a2c"/><rect x="87" y="88" width="10" height="16" fill="#231e19"/>${win(76, 84)}${win(102, 84, 0)}<path d="M120 76h34" stroke="#a79b8e" stroke-width="1"/><rect x="128" y="77" width="5" height="8" fill="#f2f2f2"/><rect x="138" y="77" width="6" height="6" fill="#ff6a2b"/>`,
    `<rect x="66" y="34" width="54" height="70" fill="#3a3530"/><rect x="62" y="30" width="62" height="5" fill="#2a2622"/>${[40, 54, 68, 82].map((y, r) => [72, 84, 96, 108].map((x, c) => win(x, y, (r * 3 + c) % 4 === 1 || (r === 1 && c === 2) ? 1 : 0)).join('')).join('')}<rect x="88" y="94" width="10" height="10" fill="#15120f"/>`,
    `<path d="M58 104V66l34-18 34 18v38z" fill="#4a4640"/><path d="M52 68 92 44l40 24-3 5-37-21-37 21z" fill="#8a3b2a"/>${win(68, 74)}${win(84, 74)}${win(104, 74, 0)}${win(68, 90, 0)}${win(104, 90)}<rect x="86" y="88" width="11" height="16" fill="#231e19"/><circle cx="142" cy="80" r="12" fill="#2c4a30"/><rect x="140" y="88" width="4" height="16" fill="#3a2a1e"/>`,
    `<rect x="46" y="62" width="92" height="42" fill="#e9e2d3"/><rect x="40" y="56" width="104" height="7" fill="#c9c0ae"/><rect x="62" y="44" width="52" height="14" fill="#e9e2d3"/><rect x="56" y="70" width="34" height="22" fill="#1c3a57"/><rect x="100" y="70" width="28" height="34" fill="#231e19"/>${win(68, 47)}${win(100, 47)}<rect x="150" y="100" width="60" height="8" rx="3" fill="#2a7fb8"/><path d="M222 104V74" stroke="#3a2a1e" stroke-width="3"/><path d="M222 74q-14-8-20 2M222 74q14-8 20 2M222 74q-6-14-16-10M222 74q6-14 16-10" stroke="#2c4a30" stroke-width="3" fill="none"/>`,
    `<rect x="40" y="52" width="110" height="52" fill="#e9e2d3"/><path d="M34 54 95 30l61 24z" fill="#8a3b2a"/>${[52, 70, 88, 106, 124].map(x => `<rect x="${x}" y="58" width="5" height="46" fill="#c9c0ae"/>`).join('')}${win(60, 64)}${win(78, 64)}${win(96, 64)}${win(114, 64)}${win(132, 64)}${win(60, 84, 0)}${win(132, 84)}<rect x="92" y="84" width="12" height="20" fill="#231e19"/><rect x="30" y="104" width="130" height="5" fill="#6b4a2c"/>`,
  ][lvl];
  const car = has('spor') ? `<g transform="translate(${lvl >= 3 ? 250 : 160} 96)"><path d="M0 8q2-7 14-8l12-5h16l10 6q12 1 12 7v3H0z" fill="#d81e2c"/><path d="M27-3h13l7 5H22z" fill="#14110e"/><circle cx="14" cy="11" r="5" fill="#14110e"/><circle cx="50" cy="11" r="5" fill="#14110e"/></g>` : has('araba') ? `<g transform="translate(160 92)"><path d="M0 12V4l8-1 6-8h22l8 9 8 1v7z" fill="#58a6ff"/><path d="M16-3h9v6H12zM27-3h8l5 6H27z" fill="#14110e"/><circle cx="12" cy="13" r="5" fill="#14110e"/><circle cx="42" cy="13" r="5" fill="#14110e"/></g>` : '';
  const boat = has('tekne') ? `<g transform="translate(286 104)"><path d="M0 0h54l-9 11H8z" fill="#f2f2f2"/><path d="M26 0V-34" stroke="#a79b8e" stroke-width="2"/><path d="M28-32 46-4H28z" fill="#ff6a2b"/><path d="M24-28 10-4h14z" fill="#f2f2f2"/></g>` : '';
  const jet = has('jet') ? `<g transform="translate(250 22)"><path d="M0 6 38 2l10 3-10 3L0 8z" fill="#e9e2d3"/><path d="M22 4 14-6h6l12 9zM6 6 2 0h4l6 6z" fill="#c9c0ae"/><path d="M-34 7H0" stroke="#fff" stroke-width="1.5" opacity=".35"/></g>` : '';
  const shop = has('kofte') || has('halisaha') ? `<g transform="translate(4 70)"><rect x="0" y="6" width="34" height="28" fill="#3a3530"/><path d="M-2 6h38l-3-8H1z" fill="${has('kofte') ? '#d81e2c' : '#2fbf71'}"/><path d="M5-2v8M13-2v8M21-2v8M29-2v8" stroke="#f2f2f2" stroke-width="3"/><rect x="6" y="14" width="10" height="20" fill="#15120f"/>${win(21, 16)}</g>` : '';
  const acad = has('akademi') ? `<g transform="translate(${lvl >= 3 ? (has('kofte') || has('halisaha') ? 300 : 2) : water ? 176 : 300} ${lvl >= 3 && water && (has('kofte') || has('halisaha')) ? 60 : 82})"><rect x="0" y="6" width="52" height="16" fill="#22803f"/><path d="M4 22V10h14v12M34 22V10h14v12" fill="none" stroke="#f2f2f2" stroke-width="1.6"/><path d="M26 6V-10" stroke="#a79b8e" stroke-width="1.6"/><path d="M26-10h12v7H26z" fill="#ffd23f"/></g>` : '';
  const muz = has('muze') ? `<g transform="translate(${lvl >= 3 ? 196 : 232} 70)"><path d="M0 12 20 0l20 12z" fill="#c9c0ae"/><rect x="2" y="12" width="36" height="22" fill="#e9e2d3"/><path d="M8 14v20M16 14v20M24 14v20M32 14v20" stroke="#a79b8e" stroke-width="2.5"/></g>` : '';
  return `<svg class="lifes" viewBox="0 0 360 130" role="img" aria-label="${tt('Yaşamın')}"><defs><linearGradient id="lfs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2430"/><stop offset="1" stop-color="#4a3040"/></linearGradient></defs><rect width="360" height="130" fill="url(#lfs)"/><circle cx="318" cy="24" r="9" fill="#e9e2d3" opacity=".8"/>${[30, 70, 130, 180, 215, 290].map((x, i) => `<rect x="${x}" y="${10 + (i * 13) % 34}" width="1.6" height="1.6" fill="#fff" opacity=".6"/>`).join('')}
    ${jet}<rect y="104" width="360" height="26" fill="#231e19"/>${water ? '<rect x="236" y="106" width="124" height="24" fill="#1c3a57"/><path d="M244 114h20M280 120h26M320 113h22" stroke="#58a6ff" stroke-width="1.5" opacity=".5"/>' : ''}
    ${shop}${muz}${acad}${home}${car}${boat}</svg>`;
}
const HOMEN = () => [tt('Aile evi'), tt('Kiralık daire'), tt('Kendi evin'), tt('Sapanca villası'), tt('Boğaz yalısı')];
function lifeCard() {
  const s = G.S, lvl = G.has('yali') ? 4 : G.has('villa') ? 3 : G.has('ev') ? 2 : G.has('daire') ? 1 : 0, n = s.assets.length + (s.col || []).length;
  return `<section class="card hv-para lifec">${tag(tt('Yaşamın'), 'ye')}${lifeSvg()}<div class="kv">${ic('home', 16)}<span>${HOMEN()[lvl]}</span><b>${tt`${n} varlık`}</b></div></section>`;
}

// ---------- şehir silueti: ülkeye göre genel bir görünüm (gerçek yapı kopyası değil) ----------
function citySvg(cc, c1 = '#ff6a2b') {
  const B = (x, w, h, f = '#2a2520') => `<rect x="${x}" y="${78 - h}" width="${w}" height="${h}" fill="${f}"/>`, sp = (x, h, w = 6) => `<path d="M${x - w / 2} ${78}V${78 - h + 10}l${w / 2}-10 ${w / 2} 10V78z" fill="#15120f"/>`;
  const M = {
    TR: `${B(20, 40, 22)}<path d="M26 56a14 14 0 0 1 28 0z" fill="#2a2520"/>${sp(14, 52, 5)}${sp(66, 52, 5)}${B(90, 30, 18)}<path d="M150 78V30h5v48zM250 78V30h5v48z" fill="#15120f"/><path d="M110 60Q152 22 202 52T300 60" fill="none" stroke="#15120f" stroke-width="2.5"/><path d="M100 60h210v4H100z" fill="#15120f"/>${B(310, 36, 26)}`,
    EN: `${B(24, 14, 58, '#15120f')}<path d="M24 20l7-10 7 10z" fill="#15120f"/><circle cx="31" cy="30" r="4" fill="#ffd678"/>${[60, 78, 96, 114].map(x => B(x, 16, 24) + `<path d="M${x} 54l8-7 8 7z" fill="#2a2520"/>`).join('')}<path d="M160 78V40h10v38zM230 78V40h10v38z" fill="#15120f"/><path d="M150 60h100v5H150z" fill="#15120f"/><path d="M170 44q30 18 60 0" fill="none" stroke="#15120f" stroke-width="2"/>${B(270, 60, 30)}`,
    ES: `${B(120, 70, 26)}${sp(128, 62)}${sp(146, 70)}${sp(164, 70)}${sp(182, 62)}${B(20, 60, 20)}${B(230, 80, 22)}<circle cx="310" cy="24" r="10" fill="#ffb347" opacity=".8"/>`,
    DE: `<path d="M168 78V14h4v64z" fill="#15120f"/><circle cx="170" cy="30" r="9" fill="#15120f"/>${B(40, 80, 26)}${[46, 62, 78, 94, 110].map(x => `<rect x="${x}" y="54" width="5" height="24" fill="#15120f"/>`).join('')}<rect x="38" y="48" width="84" height="6" fill="#15120f"/>${B(220, 90, 30)}`,
    IT: `<path d="M120 54a26 26 0 0 1 52 0z" fill="#2a2520"/>${B(118, 56, 24)}<rect x="60" y="20" width="12" height="58" fill="#15120f"/>${[200, 222, 244, 266, 288].map(x => `<path d="M${x} 78V60a9 9 0 0 1 18 0v18z" fill="none" stroke="#15120f" stroke-width="4"/>`).join('')}<rect x="196" y="48" width="114" height="5" fill="#15120f"/>`,
    FR: `<path d="M170 78 186 12l16 66h-7l-9-40-9 40z" fill="#15120f"/><path d="M176 52h20M172 66h28" stroke="#15120f" stroke-width="3"/>${[30, 70, 110, 230, 270].map(x => B(x, 34, 22) + `<path d="M${x} 56l4-8h26l4 8z" fill="#15120f"/>`).join('')}`,
    NL: `<path d="M60 78 68 38h10l8 40z" fill="#15120f"/><path d="M73 40 48 18M73 40 98 18M73 40 52 62M73 40 96 60" stroke="#15120f" stroke-width="3"/>${[150, 172, 194, 216, 238, 260].map((x, i) => B(x, 20, 26 + (i % 3) * 5) + `<path d="M${x} ${52 - (i % 3) * 5}l10-9 10 9z" fill="#2a2520"/>`).join('')}`,
    PT: `<path d="M0 78Q90 40 180 66T360 54V78z" fill="#2a2520"/><rect x="250" y="26" width="18" height="40" fill="#15120f"/><path d="M246 26h4v-5h4v5h6v-5h4v5h6v-5h4v5" fill="none" stroke="#15120f" stroke-width="3"/><rect x="70" y="50" width="30" height="12" rx="2" fill="#ffd23f"/><path d="M40 62h100" stroke="#15120f" stroke-width="2"/>`,
    SA: `${B(60, 18, 60, '#15120f')}${B(90, 24, 46)}${B(130, 14, 68, '#15120f')}${B(160, 30, 36)}<path d="M0 78q60-14 120-4t120-6 120 4v6z" fill="#3a2a1e"/><path d="M270 78V44" stroke="#15120f" stroke-width="3"/><path d="M270 44q-16-8-22 4M270 44q16-8 22 4M270 44q-6-16-18-10M270 44q6-16 18-10" stroke="#15120f" stroke-width="3" fill="none"/>`,
  };
  return `<svg class="citys" viewBox="0 0 360 84" aria-hidden="true"><defs><linearGradient id="cts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2430"/><stop offset="1" stop-color="${c1}" stop-opacity=".55"/></linearGradient></defs><rect width="360" height="84" fill="url(#cts)"/>${M[cc] || M.DE}<rect y="78" width="360" height="6" fill="#15120f"/></svg>`;
}
const cityOf = id => { const lid = G.leagueOf(id); return lid ? LMAP[lid].c : 'DE'; };

// ---------- imza töreni: masa, forma, resmî açıklama kartı ----------
async function signFlow(o) {
  const s = G.S, c = G.club(o.id), cc = cityOf(o.id);
  const scene = `<div class="sgn" style="--c1:${c.c1};--c2:${c.c2}">${citySvg(cc, c.c1)}<div class="sgn-r"><div class="sgn-p">${persona('baskan')}</div><div class="sgn-c">${crest(o.id, 54)}${shirtSvg(c.c1, c.c2, s.num, 62)}</div><div class="sgn-p">${avatar(s.look, c.c1, c.c2, lookX({ mood: 'joy', hurt: false }))}</div></div><div class="sgn-d"></div></div>`;
  const j = await dialog({ art: scene, k: tt('Resmî açıklama'), t: tt`${c.n} ailesine hoş geldin`, body: `<div class="tgrid"><div>${ic('cal', 16)}<small>${tt('Sözleşme')}</small><b>${tt`${o.len} sezon`}</b></div><div>${ic('shirt', 16)}<small>${tt('Rol')}</small><b>${ROLE[o.role]}</b></div><div>${ic('coin', 16)}<small>${tt('Haftalık ücret')}</small><b>${o.wage ? G.fmtS(o.wage) : tt('Amatör')}</b></div><div>${ic('globe', 16)}<small>${tt('Ülke')}</small><b>${COUNTRIES[cc] || 'Türkiye'}</b></div></div>`, opts: [{ t: tt('Formayı giy'), i: 'shirt' }, { t: tt('Açıklama kartını paylaş'), i: 'phone', c: 'ghost' }], auto: 0, cls: 'ev' });
  if (j === 1) await shareCard({ c1: c.c1, tag: tt('RESMÎ'), big: String(s.num), bigL: POS[s.pos].n.toLocaleUpperCase(LC), title: s.name.toLocaleUpperCase(LC).split(' ').slice(0, 2), sub: `${c.n} · ${tt`${o.len} sezon`}`, stats: [[G.OVR(), tt('Güç')], [s.age, tt('Yaş')], [G.tot().g, tt('Gol')]], text: tt`Toprak Saha: ${s.name} artık ${c.n} oyuncusu.` });
}
// Röportaj: sponsor panosu önünde, mikrofonlar uzanmış
function ivArt() {
  const s = G.S, c = G.club(s.clubId);
  return `<div class="art t-fame ivb" style="--c1:${c.c1};--c2:${c.c2}"><div class="ivt">${Array.from({ length: 18 }, (_, i) => `<i>${i % 2 ? crest(s.clubId, 18) : ''}</i>`).join('')}</div><div class="art-av">${avatar(s.look, c.c1, c.c2, lookX())}</div><svg class="ivm" viewBox="0 0 120 50" aria-hidden="true"><path d="M20 50 34 22M60 50V20M100 50 86 22" stroke="#15120f" stroke-width="5" stroke-linecap="round"/><rect x="26" y="6" width="16" height="20" rx="7" fill="#d81e2c" transform="rotate(-25 34 16)"/><rect x="52" y="2" width="16" height="22" rx="7" fill="#ffd23f"/><rect x="78" y="6" width="16" height="20" rx="7" fill="#58a6ff" transform="rotate(25 86 16)"/></svg><span class="art-n">${esc(s.name)}</span></div>`;
}

// ---------- kariyer yolu: oynadığın kulüpler bir çizgide ----------
function careerPath() {
  const s = G.S, mv = s.moves || []; if (s.mgr) return '';
  const first = mv.length ? mv[0].from : s.clubId, y0 = s.hist.length ? s.hist[0].y : G.seasonLabel();
  const st = [{ id: first, y: y0 }, ...mv.map(m => ({ id: m.to, y: m.y, loan: m.loan, fee: m.fee }))].filter(x => G.club(x.id));
  if (st.length < 2) return '';
  return `<section class="card">${tag(tt('Kariyer yolu'))}<div class="cpath">${st.map((x, i) => `<button class="cps ${i === st.length - 1 ? 'on' : ''}" data-a="club" data-v="${x.id}">${crest(x.id, 38)}<b>${esc(G.club(x.id).n)}</b><small>${x.y}${x.loan ? ' · ' + tt('Kiralık') : x.fee ? ' · ' + G.fmtS(x.fee) : ''}</small></button>`).join('<i></i>')}</div></section>`;
}

// ---------- menajer portreleri ----------
const AGLOOK = { 'Kemal Aksoy': [{ skin: 2, hair: 1, hc: 0, beard: 1 }, {}], 'Selin Karaca': [{ skin: 1, hair: 9, hc: 1 }, { glasses: 1 }], 'Viktor Lang': [{ skin: 0, hair: 5, hc: 3 }, { glasses: 1 }], 'Deniz Arman': [{ skin: 1, hair: 8, hc: 0 }, {}], 'Amcan': [{ skin: 2, hair: 0, hc: 3, beard: 2 }, {}] };
const agentAv = n => { const a = AGLOOK[n]; return a ? avatar(a[0], '#2a2f45', '#f2f2f2', { ...a[1], pat: 'duz', age: n === 'Amcan' ? 50 : 0 }) : persona('menajer'); };

// ---------- gol klibi: tekrarı video olarak kaydet ve paylaş ----------
const clipType = () => { try { if (!window.MediaRecorder) return ''; return ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || ''; } catch (e) { return ''; } };
async function recordClip(src, o) {
  const type = clipType(); if (!type || !src.captureStream) { toast(tt('Bu tarayıcı video kaydını desteklemiyor'), 'alert'); return; }
  const cv = document.createElement('canvas'); cv.width = 720; cv.height = 720; const g = cv.getContext('2d'), F = (w, sz) => `${w} ${sz}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
  const frame = () => {
    g.fillStyle = '#0f0d0b'; g.fillRect(0, 0, 720, 720);
    g.save(); g.translate(360, 110); g.rotate(-.1); g.fillStyle = o.c1; g.fillRect(-520, -150, 1040, 300); g.fillStyle = 'rgba(0,0,0,.14)'; for (let x = -520; x < 520; x += 56) g.fillRect(x, -150, 28, 300); g.restore();
    g.fillStyle = '#ffd23f'; g.fillRect(40, 40, 150, 54); g.fillStyle = '#14110e'; g.font = F(900, 38); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.tag, 56, 69);
    g.fillStyle = '#fff'; g.font = F(900, 86); g.fillText(o.title, 40, 176, 640);
    g.drawImage(src, 20, 250, 680, 680 * src.height / src.width);
    g.fillStyle = '#f5efe4'; g.font = F(900, 52); g.fillText(o.sub, 40, 590, 640); g.fillStyle = '#a79b8e'; g.font = '600 30px Barlow, system-ui, sans-serif'; g.fillText(o.sub2, 40, 640, 640);
    g.fillStyle = o.c1; g.font = F(900, 34); g.fillText('TOPRAK SAHA', 40, 690);
  };
  toast(tt('Klip kaydediliyor: 5 saniye'), 'clock');
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: type, videoBitsPerSecond: 2500000 }), parts = []; rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
  const done = new Promise(r => { rec.onstop = r; }); let on = true; const tick = () => { if (!on) return; frame(); requestAnimationFrame(tick); }; tick(); const iv = setInterval(frame, 60);
  rec.start(); await new Promise(r => setTimeout(r, 5000)); on = false; clearInterval(iv); rec.stop(); await done;
  const ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(parts, { type: type.split(';')[0] });
  try { const file = new File([blob], 'toprak-saha-gol.' + ext, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: o.text }); return; } } catch (e) { return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'toprak-saha-gol.' + ext; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast(tt('Klip indirildi'), 'down');
}

// ---------- canlı sahneli diyalog: üstte canvas, altta seçenekler ----------
async function sceneDialog(draw, o) {
  const p = dialog({ ...o, art: '<canvas id="scn" class="tun"></canvas>' });
  const cv = $('#scn'); let on = true;
  if (cv) {
    const g = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 360, H = 170; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t0 = performance.now(), loop = () => { if (!on) return; draw(g, (performance.now() - t0) / 1000, W, H); if (!GFX.calm) setTimeout(loop, GFX.low ? 120 : 40); }; loop();
  }
  const r = await p; on = false; return r;
}
const kitMe = () => { const s = G.S, c = G.club(s.clubId), L = s.look || {}; return { c1: c.c1, c2: c.c2, skin: SKIN[L.skin ?? 1], hair: HAIRC[L.hc ?? 0], boot: G.bootColor() }; };
const lockO = (mood, M) => { const k = kitMe(); return { c1: k.c1, c2: k.c2, mood, me: k, board: M ? [`${M.usG} - ${M.oppG}`, tt`Notun ${dec(M.rt, 1)}`, tt`Anlar ${M.ok}/${M.mom}`] : [] }; };
// Röportaj sıklığı ayarı
const IVM = () => ({ normal: [tt('Normal'), tt('On haftada bir civarı, tek soru')], sik: [tt('Sık'), tt('İki üç haftada bir')], final: [tt('Yalnız finaller'), tt('Kupa kazanınca mikrofon uzanır')] });
const ivCard = () => { const m = G.S.ivm || 'normal', X = IVM()[m]; return `<button class="opt sm hv-ayar" data-a="ivm">${ic('mic', 20)}<span><b>${tt('Röportaj sıklığı')}: ${X[0]}</b><small>${X[1]}</small></span></button>`; };

// Senaryolu başlangıç: deneme yok, doğrudan kulüpte
async function scenStart() {
  G.newScenario({ ...C }); sfx.sign(); await tutFlow();
  const s = G.S, X = SCENS.find(x => x.id === C.sc);
  await dialog({ art: clubArt(s.clubId, tt(LMAP[G.leagueOf(s.clubId)].name)), k: tt('Senaryo'), t: X.n, body: `<p>${X.d}</p><div class="stn st-acik">${ic('target', 16)}<span>${tt('Hedef')}: <b>${X.g}</b></span></div><div class="tgrid"><div>${ic('user', 16)}<small>${tt('Yaş')}</small><b>${s.age}</b></div><div>${ic('chart', 16)}<small>${tt('Güç')}</small><b>${G.OVR()}</b></div></div>`, opts: [{ t: tt('Başla'), i: 'ball' }], auto: 0, cls: 'ev' });
  V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'cev', kv: 'pro' };
  if (!AUTO) { render(); window.scrollTo(0, 0); await tip('hub'); }
}


// ---------- olaylar ----------
const grab = () => { const nm = $('#nm'), nu = $('#nu'), nk = $('#nk'); if (nm) C.name = nm.value; if (nu) C.num = G.clamp(+nu.value || 9, 1, 99); if (nk) C.nick = nk.value.trim(); };
const ACT = {
  dlg: v => { $modal.hidden = true; const r = dres; dres = null; if (r) r(+v); },
  inbox: () => { V.tab = 'kar'; V.kv = 'tr'; render(); window.scrollTo(0, 0); },
  offer: async v => { if (busy) return; const o = G.inbox()[+v]; if (!o) return; busy = true; try { await offerFlow(o); G.save(); } finally { busy = false; render(); } },
  ocmp: () => dialog({ k: tt('Teklif masası'), t: tt('Karşılaştırma'), body: cmpTable(G.inbox()) + `<p class="note">${tt('Sarı: o satırda en iyisi.')}</p>`, opts: [{ t: tt('Kapat') }], auto: 0 }),
  daily: () => { const r = G.dailyClaim(); if (!r) return; G.save(); sfx.pop(); toast(tt`Günlük ödül · ${r.n}. gün: ` + r.out.join(' · '), 'star'); render(); },
  snd: () => { sfx.toggle(); render(); },
  cont: () => { if (G.load()) { V.scr = 'hub'; V.tab = 'ev'; render(); } },
  title: () => { V.scr = 'title'; render(); },
  menu: () => { G.save(); V.scr = 'title'; render(); },
  new: async () => {
    if (G.hasSave()) { const j = await dialog({ k: tt('Dikkat'), t: tt('Mevcut kariyer silinecek'), body: tt('<p>Yeni kariyer başlatırsan kayıtlı kariyerin kalıcı olarak silinir.</p>'), opts: [{ t: tt('Sil ve yeni başla'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }] }); if (j !== 0) return; }
    const m = G.meta();
    C = { name: m.heir ? ' ' + m.heir : '', pos: 'FV', foot: 'Sağ', prov: G.pick(Object.keys(PROV)), origin: 'mahalle', trait: 'hirsli', look: { skin: 1, hair: 0, hc: 0, beard: 0, band: 0 }, num: 9, nick: '', ht: 'orta', build: 'atletik', style: '0', cele: 'kayarak', diff: 'normal', gur: 'DE', w: 'e' };
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
  mcall: (v, el) => { if (!curM || !curM.on || curM.calls <= 0 || curM.stam < 12 || curM.want) return; curM.calls--; curM.stam -= 12; curM.want = 1; el.innerHTML = tt`${ic('ball', 14)} Topu iste (${curM.calls})`; if (!curM.calls) el.disabled = true; },
  mcrowd: (v, el) => { if (!curM || !curM.crowd) return; curM.crowd = 0; curM.crowdOn = 1; el.disabled = true; sfx.goal(); G.fx({ taraf: 1 }); },
  start: async () => {
    if (busy) return;
    grab(); C.style = +C.style; C.name = (C.name || '').trim().replace(/\s+/g, ' ');
    if (C.name.length < 3) { toast(tt('Oyuncuna bir ad ver.'), 'alert'); $('#nm').focus(); return; }
    busy = true;
    try { G.wipe(); if (C.sc && !C.world) await scenStart(); else { G.newCareer({ ...C, wait: true }); sfx.whistle(1); await startFlow(); } }
    finally { busy = false; if (!G.S || !G.S.clubId) { V.scr = 'title'; render(); } }
  },
  club: async v => { if (busy || !$modal.hidden || !G.S || !G.club(v)) return; busy = true; try { await clubFlow(v); } finally { busy = false; } },
  kv: v => { V.kv = v; render(); },
  agent: v => { const r = G.setAgent(+v); if (!r) return; sfx.sign(); toast(r.fee ? tt`Menajer değişti. Tazminat: ${G.fmtS(r.fee)}` : tt('Menajerle el sıkıştınız'), 'pen'); G.save(); render(); },
  inv: v => { const stp = G.nice(Math.max(5000, G.S.money * .2)); if (G.invest(v, stp)) { sfx.coin(); toast(tt`${INV[v][0]}: ${G.fmtS(stp)} yatırıldı`, 'chart'); G.save(); render(); } },
  div: v => { const x = G.divest(v); if (x) { sfx.coin(); toast(tt`${INV[v][0]}: ${G.fmtS(x)} hesabına geçti`, 'coin'); G.save(); render(); } },
  spk: () => { spiker.toggle(); render(); },
  legal: async () => { if (busy) return; busy = true; try { await legalFlow(); } finally { busy = false; } },
  howto: async () => { if (busy) return; busy = true; try { await tip('hub', 1); await tip('mac', 1); await tip('transfer', 1); if (G.S && !G.S.mgr) await tutFlow(true); } finally { busy = false; } },
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
  mresign: async () => {
    if (busy || !G.S.mgr) return; busy = true;
    try {
      const biz = G.isBiz(), role = G.S.mgr.role, v = G.resignValue();
      const j = await dialog({ art: art(bizPers(role), 'right', 'risk'), k: tt('Dikkat'), t: biz ? tt('Bu işi bırakıyor musun?') : tt('İstifa ediyor musun?'), body: `<p>${role === 'school' ? tt`Okulu devredersin; değeri (${G.fmtS(v)}) hesabına geçer.` : role === 'agent' ? tt('Oyuncuların başka ofislere geçer.') : role === 'pundit' ? tt('Programın yayından kalkar.') : role === 'pres' ? tt`Kulübü devredersin; ${G.fmtS(v)} hesabına geçer.` : tt('Sözleşmen biter; kazandığın para sende kalır.')} ${tt('Ardından yeni bir yol seçersin.')}</p>`, opts: [{ t: biz ? tt('Bırak') : tt('İstifa et'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 });
      if (j !== 0) return;
      G.mgrResign();
      if (!(await sideCareerFlow())) (biz ? bizFinish : mgrFinish)();
    } finally { busy = false; if (G.S && V.scr === 'hub') render(); }
  },
  bact: async v => {
    if (busy || !G.isBiz()) return; const r = G.bizAct(v); if (!r) return;
    busy = true; try { sfx.pop(); const a = G.BACTS[G.S.mgr.role].find(x => x[0] === v); if (r[0] === '@mac') await kidsMatchFlow(); else if (r[0] === '@yorum') await punditFlow(); else await dialog({ art: art(bizPers(G.S.mgr.role), a[3], 'club'), t: a[1], body: `<p>${esc(r[0])}</p>${chips(r[1])}`, opts: [{ t: tt('Devam') }], auto: 0, cls: 'ev' }); } finally { busy = false; }
    G.save(); render();
  },
  xi: v => { const i = +v; if (!G.S.mgr) return; if (V.xs == null || V.xs === i) { V.xs = V.xs === i ? null : i; render(); return; } if (G.mgrSwap(V.xs, i)) { V.xs = null; sfx.pop(); G.save(); } else V.xs = i; render(); },
  ctab2: v => { V.tab = 'kar'; V.ct = v; V.xs = null; render(); window.scrollTo(0, 0); },
  ctab: v => { V.ct = v; V.xs = null; render(); },
  mform: v => { G.mgrForm(v); V.xs = null; G.save(); render(); },
  mint: v => { G.mgrInt(v); G.save(); render(); },
  tf: v => { V.tf = v; render(); },
  plr: async v => { if (busy || !$modal.hidden || !G.S || !G.S.mgr) return; busy = true; try { await plFlow(+v); } finally { busy = false; render(); } },
  tgt: async v => { if (busy || !$modal.hidden || !G.S || !G.S.mgr) return; busy = true; try { await tgtFlow(+v); } finally { busy = false; render(); } },
  toff: v => { const [i, k] = v.split(':').map(Number), r = G.offerAct(i, k); if (r === 'ok') { sfx.coin(); toast(tt('Satış tamamlandı.'), 'coin'); } else if (r === 'up') toast(tt('Kulüp teklifini artırdı.'), 'coin'); else if (r === 'gone') toast(tt('Kulüp masadan kalktı.'), 'alert'); else if (r === 'min') toast(tt('Kadro çok dar; satamazsın.'), 'alert'); G.save(); render(); },
  yup: v => { if (G.youthUp(+v)) { sfx.sign(); toast(tt('A takıma yükseldi.'), 'star'); } G.save(); render(); },
  ycut: v => { G.youthCut(+v); G.save(); render(); },
  mc: async v => {
    if (!MM || !MM.M) return; const M = MM.M;
    if (v === 'p') { MM.pause = !MM.pause; const b = $('#mcp'); if (b) b.innerHTML = ic(MM.pause ? 'right' : 'clock', 18) + `<span>${MM.pause ? tt('Devam') : tt('Durdur')}</span>`; return; }
    if (v === 'sp') { MM.sp = (MM.sp + 1) % SPD.length; const b = $('#mcs'); if (b) b.innerHTML = ic('right', 18) + `<span>${SPD[MM.sp][0]}</span>`; return; }
    if (MM.busy || !$modal.hidden) return;
    MM.busy = 1; const n0 = M.ev.length;
    try { if (v === 'sub') await subFlow(M); else if (v === 'tac') await tacFlow(M); else if (v === 'sh') await shoutFlow(M); }
    finally { for (const e of M.ev.slice(n0)) { const [t, c, i] = evTxt(e, MM.opN); MM.put(e.min, t, c, i); } MM.upd(); MM.busy = 0; }
  },
  xiauto: () => { if (!G.S.mgr) return; G.mgrAutoXI(); V.xs = null; G.save(); render(); toast(tt('Yardımcın ilk 11\'i kurdu.'), 'whistle'); },
  rum: v => { const ch = G.rumorAct(+v); if (!ch) return; sfx.pop(); toast(ch.join(' · '), 'news'); G.save(); render(); },
  mquit: async () => {
    if (busy || !G.S.mgr) return; busy = true;
    try { const j = await dialog({ k: tt('Dikkat'), t: tt('Kenar kariyeri bitsin mi?'), body: tt('<p>Özet ekranına geçilir ve kayıt silinir.</p>'), opts: [{ t: tt('Bitir'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 }); if (j === 0) (G.isBiz() ? bizFinish : mgrFinish)(); } finally { busy = false; }
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
  tab: v => { V.tab = v; render(); window.scrollTo(0, 0); const m = $('main'); if (m && !GFX.calm) m.classList.add('fin'); },
  ivm: () => { const s = G.S; s.ivm = { normal: 'sik', sik: 'final', final: 'normal' }[s.ivm || 'normal']; G.save(); render(); },
  gfx: v => { let o = {}; try { o = JSON.parse(localStorage.getItem(GKEY)) || {}; } catch (e) { /* yok */ } o[v] = !GFX[v]; if (o.calm == null) o.calm = GFX.calm; try { localStorage.setItem(GKEY, JSON.stringify(o)); } catch (e) { /* yok */ } applyGfx(); render(); },
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
  share: async () => {
    if (busy || !$modal.hidden || !G.S || G.S.mgr) return; const ps = POSTS.filter(G.canPost), left = G.slots() - G.S.used; if (left <= 0) return;
    const j = await dialog({ k: tt`${left} hak`, t: tt('Ne paylaşacaksın?'), opts: [...ps.map(p => ({ t: p.n, i: p.i })), { t: tt('Vazgeç'), c: 'ghost' }], grid: true, cls: 'ev' });
    if (j < ps.length) ACT.post(ps[j].id);
  },
  hrep: async v => {
    if (busy || !$modal.hidden) return; const id = +v, p = G.S.feed.find(x => x.id === id); if (!p) return;
    const j = await dialog({ art: art('golge', 'mic', 'risk'), k: '@' + p.n, t: tt('Nasıl cevap vereceksin?'), body: `<p>“${esc(p.t)}”</p>`, opts: [{ t: tt('Kibar cevap'), s: tt('Basın ve taraftar sever; eleştiri azalır'), i: 'heart' }, { t: tt('Sert cevap'), s: tt('Taraftar coşar, takipçi gelir; tartışma büyür'), i: 'alert' }, { t: tt('Esprili cevap'), s: tt('Gülümsetir, eleştiriyi söndürür'), i: 'star' }, { t: tt('Görmezden gel'), s: tt('Hiçbir şey olmamış gibi'), c: 'ghost' }], cls: 'ev' });
    const ch = G.hateReply(id, j); if (ch) { if (ch.length) toast(ch.join(' · '), 'phone'); sfx.pop(); G.save(); render(); }
  },
  post: v => { if (busy || G.S.used >= G.slots()) return; const ch = G.post(v); sfx.pop(); toast(ch.join(' · '), 'phone'); G.save(); render(); },
  perk: v => { if (G.buyPerk(v)) { sfx.up(); toast(tt('Yetenek açıldı'), 'star'); G.save(); render(); } },
  dream: async () => { if (busy) return; busy = true; try { await dreamFlow(); } finally { busy = false; } },
  exp: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([G.exportData()], { type: 'application/json' })); a.download = 'toprak-saha-kayit.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(tt('Kayıt dosyası indirildi'), 'down'); },
  buy: v => { const had = G.has(v), t0 = G.shopTier(); G.buy(v); if (!had && G.has(v)) sfx.coin(); if (t0 < 2 && G.shopTier() >= 2) { sfx.up(); toast(tt('İkinci kademe açıldı: yeni yatırımlar seni bekliyor'), 'star'); } G.save(); render(); },
  upg: v => { const ch = G.buyUp(v); if (!ch) return; sfx.coin(); toast(ch.length ? ch.join(' · ') : tt('Yatırım yapıldı'), 'up'); G.save(); render(); },
  sess: v => { const r = G.session(v); if (!r) return; sfx.up(); toast(r[0] + (r[1].length ? ' ' + r[1].join(' · ') : ''), 'check'); G.save(); render(); },
  dfocus: v => { G.setFocus(v || null); G.save(); render(); },
  slot: v => { G.setSlot(+v); render(); },
  slotdel: async () => {
    if (busy) return; busy = true;
    try { const j = await dialog({ k: tt('Dikkat'), t: tt('Bu yuvadaki kariyer silinsin mi?'), body: `<p>${tt('Kayıt kalıcı olarak silinir. Diğer yuvalara dokunulmaz.')}</p>`, opts: [{ t: tt('Sil'), i: 'alert' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 }); if (j === 0) G.wipeSlot(G.curSlot()); } finally { busy = false; render(); }
  },
  paper: async () => { if (busy) return; busy = true; try { await paperFlow(); } finally { busy = false; } },
  agtalk: async () => { if (busy) return; busy = true; try { await agentFlow(); } finally { busy = false; } },
  prole: v => { if (G.setRole(v || null)) { sfx.pop(); G.save(); render(); } },
  posl: v => { if (G.learnPos(v)) { toast(tt`${POS[v].n} çalışmaları başladı`, 'up'); G.save(); render(); } },
  posw: async v => {
    if (busy) return; const P = G.pos2Info(), k = P.known.find(x => x.p === v); if (!k || P.wait > 0) return;
    busy = true;
    try { const j = await dialog({ k: tt('Mevki değişikliği'), t: tt`${k.n} olarak devam et`, body: `<p>${tt`Bu mevkide gücün ${k.ovr}, şu an ${P.me}. Üç hafta uyum sürecine girersin; oyun rolün sıfırlanır, mevki rakibin ve sezon hedefin yenilenir. Sekiz hafta boyunca yeniden değiştiremezsin.`}</p>`, opts: [{ t: tt('Geç'), i: 'swap' }, { t: tt('Vazgeç'), c: 'ghost' }], auto: 1 }); if (j === 0 && G.switchPos(v)) { sfx.up(); G.save(); } } finally { busy = false; render(); }
  },
  spask: v => { const r = G.spAsk(v); if (!r) return; if (r[1]) sfx.up(); else sfx.bad(); toast(r[0], r[1] ? 'check' : 'x'); G.save(); render(); },
  colb: v => { const ch = G.buyCol(+v); if (!ch) return; sfx.coin(); toast(ch.join(' · '), 'star'); G.save(); render(); },
  cols: v => { const x = G.sellCol(+v); if (!x) return; sfx.coin(); toast(tt`Satıldı: ${G.fmtS(x)}`, 'coin'); G.save(); render(); },
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
window.__ts = { G, run: (f, rl, mode) => runMatch(f, rl, mode), kids: () => kidsMatchFlow(), pundit: () => punditFlow(), doc: r => docFlow(r), biz: k => { G.bizStart(k); V = { scr: 'hub', tab: 'ev', lig: null, lv: 'tb', ck: 'cup', hv: 'para', kv: 'pro' }; render(); }, side: () => sideCareerFlow(), bizStep: () => bizStep(), sign: o => signFlow(o), clip: (cv, o) => recordClip(cv, o), agent: () => agentFlow(), paper: () => paperFlow(), camp: () => campFlow(), replay: (M, f) => replayFlow(M, f), nego: o => negoFlow(o), drawCard, mini: (k, vr, lh) => playMini(k, G.S.rt[G.S.clubId], k, { vr, lh }), chal: () => chalFlow(), heir: w => { heirW = w; ACT.heir(); }, mgr: role => mgrJobFlow(role), retire: () => retireFlow(), aw: r => awardFlow(r), tour: () => tourFlow(), rerender: () => render(), iv: (k, f, M) => ivFlow(k, f, M), club: id => clubFlow(id), start: async (o, auto = true) => { AUTO = auto; try { G.wipe(); G.newCareer({ ...o, wait: true }); await startFlow(); } finally { AUTO = false; render(); } }, auto: async n => { AUTO = true; try { for (let i = 0; i < n && G.S; i++) { if (G.S.mgr) { if (Math.random() < .5) G.mgrAct(G.pick(G.MACTS[G.S.mgr.role])[0]); await nextStep(); continue; } while (G.S.used < G.slots() && Math.random() < .8) { if (Math.random() < .5 && G.S.inj <= 0) await trainFlow(); else G.act(G.pick(['rest', 'aile', 'ark', 'rest'])); } if (Math.random() < .05) G.setStatus(G.pick(['mutlu', 'acik', 'kiralik'])); await nextStep(); } } finally { AUTO = false; busy = false; render(); } } };

// Ana ekrana eklenebilir uygulama: çevrimdışı açılış için hizmet işçisi
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* desteklenmiyor */ });

// Dil değişimi sonrası: oyundan geldiysen kaldığın yere (Ayarlar) dön
applyGfx();
try { if (sessionStorage.getItem(LDON)) { sessionStorage.removeItem(LDON); if (G.load()) { V.scr = 'hub'; V.tab = 'hay'; V.hv = 'ayar'; } } } catch (e) { /* yok */ }
render();
