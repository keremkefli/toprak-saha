// Toprak Saha — dil katmanı
// Kaynak dil Türkçe: metinler kodda Türkçe durur ve tt`...` ya da tt('...') ile işaretlenir.
// Türkçe seçiliyken tt hiçbir şeyi değiştirmez. İngilizce seçiliyken js/en.js sözlüğüne bakılır
// (anahtar: Türkçe metin, değer: İngilizce karşılık); karşılığı olmayan metin Türkçe kalır.
//
// Anahtar nasıl çıkar: şablonun sabit kısmı HTML etiketlerinden ayrılır, her metin parçası ayrı anahtardır.
// Değişkenler sırayla {0}, {1} olur: `Hafta ${w}/${n}` → "Hafta {0}/{1}". Karşılıkta sıra değişebilir, değişken atılabilir.
// Çoğul: {0|goal|goals} → 0. değişken 1 ise ilki, değilse ikincisi yazılır (sayı ayrıca {0} ile basılır).
// Sıra sayısı: {0#} → 1st, 2nd, 3rd, 4th.
// <b>, <i>, <em>, <strong>, <u>, <s>, <br> içeren cümle tek anahtar olarak da verilebilir: "Bugün <b>{0}</b> maçı var."
// Aynı Türkçe sözcüğün iki ayrı karşılığı gerekiyorsa bağlam verilir: tt('Orta', 'boy') → sözlükte "Orta@@boy".
// Metin konumundaki değişkenin değeri sözlükte aynen varsa o da çevrilir (ülke, kupa, tur adları gibi kayıtta Türkçe duran adlar).
// Kayıtta Türkçe duran bileşik adlar için sözlükte kalıplar (p) bulunur: "Sakarya İl Kupası", "2026/27 · Türkiye Kupası", "3. hafta".

const DKEY = 'toprak-saha-dil';
export const LANGS = [['tr', 'Türkçe', 'TR'], ['en', 'English', 'EN']];
const SRC = (typeof globalThis !== 'undefined' && globalThis.__TS_EN) || null;   // js/boot.js İngilizce seçiliyse sözlüğü önce yükler
let l = 'tr';
try { if (localStorage.getItem(DKEY) === 'en' && SRC) l = 'en'; } catch (e) { /* depolama kapalı */ }
export const lang = l;
export const LC = lang === 'en' ? 'en' : 'tr';            // büyük/küçük harf çevirimi
export const NLOC = lang === 'en' ? 'en-US' : 'tr-TR';    // sayı biçimi
export const DSEP = lang === 'en' ? '.' : ',';            // ondalık ayırıcı
// Dil sayfa açılırken bir kez okunur (veri tabloları yüklenirken çevrilir); değişince sayfa yenilenir
export function setLang(k) { try { localStorage.setItem(DKEY, k === 'en' ? 'en' : 'tr'); } catch (e) { /* yok */ } }

// Değişken yer tutucuları: özel kullanım alanından iki im arasına sıra numarası
const M0 = '\uE000', M1 = '\uE001';
const RTAG = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^<>]*>/g;
const RINL = /^<\/?(?:b|i|em|strong|u|s|br)\s*\/?>$/;
const RATTR = /\b(title|placeholder|aria-label|alt)="([^"<>]*)"/g;
const RMARK = /\uE000(\d+)\uE001/g, RPLAN = /\uE000(\d+)(?:(#)|\|([^|\uE001]*)\|([^\uE001]*))?\uE001/g;
const RLET = /[\p{L}%]/u;
const hasText = s => RLET.test(s.replace(RMARK, ''));
const trim3 = s => /^(\s*)([\s\S]*?)(\s*)$/.exec(s);

// Sabit kısmı parçalara ayırır. t: 0 metin, 1 etiket, 2 satır içi etiket
function toks(s) {
  const out = []; let p = 0, m; RTAG.lastIndex = 0;
  while ((m = RTAG.exec(s))) { if (m.index > p) out.push({ t: 0, s: s.slice(p, m.index) }); out.push({ t: RINL.test(m[0]) ? 2 : 1, s: m[0] }); p = RTAG.lastIndex; }
  if (p < s.length) out.push({ t: 0, s: s.slice(p) });
  return out;
}
function mkKey(core) {
  const ids = [];
  const key = core.replace(RMARK, (m, d) => { let i = ids.indexOf(+d); if (i < 0) i = ids.push(+d) - 1; return '{' + i + '}'; }).replace(/\s+/g, ' ');
  return { key, ids };
}
const back = (en, ids) => en.replace(/\{(\d+)(?:(#)|\|([^|}]*)\|([^}]*))?\}/g, (m, d, o, a, b) => (ids[d] == null ? m : M0 + ids[d] + (o ? '#' : a == null ? '' : '|' + a + '|' + b) + M1));
function trText(s, look, strict) {
  const m = trim3(s), core = m[2];
  if (!core || !hasText(core)) return strict ? null : s;
  const { key, ids } = mkKey(core), en = look(key);
  return en == null ? (strict ? null : s) : m[1] + back(en, ids) + m[3];
}
const trAttr = (tag, look) => tag.replace(RATTR, (m, n, val) => { if (!hasText(val)) return m; const { key, ids } = mkKey(val.trim()), en = look(key); return en == null ? m : n + '="' + back(en, ids).replace(/"/g, '&quot;') + '"'; });
// Etiket dışı ardışık parçalar bir "bölüm"dür; içinde satır içi etiket varsa önce bütün olarak aranır
function spans(T) {
  const out = [];
  for (let i = 0; i < T.length;) {
    if (T[i].t === 1) { out.push({ tag: T[i].s }); i++; continue; }
    let j = i, nt = 0, inl = 0;
    while (j < T.length && T[j].t !== 1) { if (T[j].t === 2) inl++; else if (hasText(T[j].s)) nt++; j++; }
    out.push({ parts: T.slice(i, j), nt, inl }); i = j;
  }
  return out;
}
function trans(s, look) {
  let out = '';
  for (const sp of spans(toks(s))) {
    if (sp.tag) { out += trAttr(sp.tag, look); continue; }
    if (sp.inl && sp.nt) { const r = trText(sp.parts.map(x => x.s).join(''), look, true); if (r != null) { out += r; continue; } }
    for (const p of sp.parts) out += p.t === 0 ? trText(p.s, look) : p.s;
  }
  return out;
}
const join = strs => { let s = strs[0]; for (let i = 1; i < strs.length; i++) s += M0 + (i - 1) + M1 + strs[i]; return s; };

// Araçlar için: bir şablonun (ya da düz metnin) sözlük anahtarlarını listeler. big: satır içi etiketli bütün cümle
export function units(strs) {
  const s = join(typeof strs === 'string' ? [strs] : strs), T = toks(s), out = [];
  const txt = T.some(k => k.t === 0 && k.s.includes(M0));
  for (const sp of spans(T)) {
    if (sp.tag) { sp.tag.replace(RATTR, (m, n, val) => { if (hasText(val)) out.push({ k: mkKey(val.trim()).key, attr: 1 }); return m; }); continue; }
    if (sp.inl && sp.nt > 1) out.push({ k: mkKey(sp.parts.map(x => x.s).join('').trim()).key, big: 1 });
    for (const p of sp.parts) if (p.t === 0 && hasText(p.s)) out.push({ k: mkKey(p.s.trim()).key, part: sp.inl && sp.nt > 1 ? 1 : 0 });
  }
  return { keys: out, html: T.some(k => k.t !== 0), txt };
}

const DM = new Map(SRC ? Object.entries(SRC.d) : []), VM = new Map(SRC ? Object.entries(SRC.v) : []);
const PAT = SRC && SRC.p ? SRC.p.map(([r, t]) => [new RegExp(r, 'u'), t]) : [];
const look = k => DM.get(k) ?? VM.get(k);
const UNESC = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' }, ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
// Tek parça: tam eşleşme ya da kalıp. Kalıpta yakalanan gruplar da çevrilir.
function piece(v, dep = 0) {
  const r = look(v); if (r != null) return r;
  if (dep < 3) for (const [re, t] of PAT) { const m = re.exec(v); if (m) return t.replace(/\{(\d)\}/g, (x, i) => (m[i] == null ? '' : piece(m[i], dep + 1) ?? m[i])); }
  return null;
}
// Kısa değer: bütün olarak, olmazsa ' · ' ile ayrılmış parçalar hâlinde aranır
function word(v) {
  let r = piece(v);
  if (r == null && v.includes(' · ')) { let hit = false; const ps = v.split(' · ').map(x => { const y = x ? piece(x) : null; if (y != null) hit = true; return y ?? x; }); if (hit) r = ps.join(' · '); }
  return r;
}
// Değişken değeri: kısa ve sözlükte (ya da kalıplarda) varsa çevrilir
function val(v) {
  if (typeof v !== 'string') return String(v);
  if (!v || v.length > 80 || v.includes('<')) return v;
  let r = word(v);
  if (r == null && v.includes('&')) { r = word(v.replace(/&(?:amp|lt|gt|quot);/g, c => UNESC[c])); if (r != null) r = r.replace(/[&<>"]/g, c => ESC[c]); }
  return r ?? v;
}
function compile(strs) {
  const s = join(strs), txt = new Set();
  for (const k of toks(s)) if (k.t === 0) k.s.replace(RMARK, (m, d) => (txt.add(+d), m));
  const r = trans(s, look), plan = []; let p = 0, m; RPLAN.lastIndex = 0;
  while ((m = RPLAN.exec(r))) { plan.push(r.slice(p, m.index), m[2] ? [+m[1]] : m[3] == null ? +m[1] : [+m[1], m[3], m[4]]); p = RPLAN.lastIndex; }
  plan.push(r.slice(p));
  return { plan, txt };
}
const one = v => Math.abs(parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'))) === 1;
const ord = v => { const n = Math.abs(parseInt(v, 10)); if (isNaN(n)) return String(v); const t = n % 100; return v + (t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };
const CT = new WeakMap(), CS = new Map();

// tt`şablon ${x}` ya da tt('düz metin') ya da tt('sözcük', 'bağlam')
export function tt(a, ...v) {
  if (typeof a === 'string') {
    if (lang === 'tr') return a;
    if (v.length && typeof v[0] === 'string') { const m = trim3(a), en = DM.get(m[2] + '@@' + v[0]); if (en != null) return m[1] + en + m[3]; }
    let r = CS.get(a);
    if (r === undefined) {
      r = compile([a]).plan[0];
      if (r === a && a.length <= 80 && !a.includes('<')) { const m = trim3(a), w = m[2] ? word(m[2]) : null; if (w != null) r = m[1] + w + m[3]; }
      CS.set(a, r);
    }
    return r;
  }
  if (!a || !a.raw) return a;
  if (lang === 'tr') { let s = a[0]; for (let i = 0; i < v.length; i++) s += String(v[i]) + a[i + 1]; return s; }
  let c = CT.get(a); if (!c) { c = compile(a); CT.set(a, c); }
  let s = '';
  for (const x of c.plan) s += typeof x === 'string' ? x : typeof x === 'number' ? (c.txt.has(x) ? val(v[x]) : String(v[x])) : x.length === 1 ? ord(v[x[0]]) : (one(v[x[0]]) ? x[1] : x[2]);
  return s;
}
