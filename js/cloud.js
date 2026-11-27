// Toprak Saha — isteğe bağlı bulut kaydı. Hesap yok, e-posta yok: kariyer, cihazda üretilen rastgele bir kodla eşleşir.
// Sunucuya kodun kendisi değil SHA-256 özeti gider. Oyuncu bulut kaydını açmadıkça hiçbir istek yapılmaz.
const CFG = { url: 'https://fmtderhzomfduzufompo.supabase.co', key: 'sb_publishable_z5Do0XlU1OX1UKdD7nfS5Q_RwCB4Qab' };   // Supabase (Frankfurt) adresi ve herkese açık publishable anahtar; boşsa özellik gizlenir
export const cloudOn = () => !!(CFG.url && CFG.key);
export const cloudHost = () => { try { return new URL(CFG.url).host; } catch (e) { return ''; } };

const LK = 'toprak-saha-bulut', OK = 'toprak-saha-bulut-onay';
const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford alfabesi: I, L, O, U yok (karışmasın)

// 12 karakter × 5 bit = 60 bit rastgelelik: tahmin edilemez
export function newCode() {
  const b = crypto.getRandomValues(new Uint8Array(12)); let s = '';
  for (const x of b) s += AB[x & 31];
  return `TS-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
// Elle yazılan kodu düzelt: küçük harf, boşluk, tire, O/0 ve I/L/1 karışıklığı
export function normCode(c) {
  let s = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (s.length === 14 && s.startsWith('TS')) s = s.slice(2);
  return s.length === 12 && [...s].every(ch => AB.includes(ch)) ? `TS-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}` : null;
}
async function idOf(code) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('toprak-saha:' + code));
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function rpc(fn, body) {
  const h = { apikey: CFG.key, 'Content-Type': 'application/json' };
  if (!CFG.key.startsWith('sb_')) h.Authorization = `Bearer ${CFG.key}`;   // eski tip anon anahtar JWT'dir; yeni publishable anahtar yalnızca apikey başlığıyla gider
  const r = await fetch(`${CFG.url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, { method: 'POST', headers: h, body: JSON.stringify(body), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!r.ok) throw new Error('http ' + r.status);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

// Yuva başına bulut bilgisi: { code, ver, auto, at, uid, cf? } — yalnızca bu cihazda
function all() { try { return JSON.parse(localStorage.getItem(LK)) || {}; } catch (e) { return {}; } }
export const cloudGet = slot => all()[slot] || null;
export function cloudSet(slot, v) { try { const a = all(); if (v) a[slot] = v; else delete a[slot]; localStorage.setItem(LK, JSON.stringify(a)); } catch (e) { /* depolama kapalı */ } }
export const consent = () => { try { return localStorage.getItem(OK) === '1'; } catch (e) { return false; } };
export const setConsent = () => { try { localStorage.setItem(OK, '1'); } catch (e) { /* yok */ } };

// Yükle: { ok: true, ver } ya da { ok: false, ver } (bulutta aynı ya da daha yeni sürüm var)
export async function cloudPut(code, data, ver) { return rpc('ts_put', { p_id: await idOf(code), p_data: data, p_ver: ver }); }
// Getir: { data, ver, at } ya da null
export async function cloudFetch(code) { return rpc('ts_get', { p_id: await idOf(code) }); }
export async function cloudDel(code) { return rpc('ts_del', { p_id: await idOf(code) }); }

