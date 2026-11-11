// Toprak Saha — hizmet işçisi: önce ağ (güncel sürüm), ağ yoksa önbellek (çevrimdışı açılış)
const CACHE = 'toprak-saha-1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/ui.js', 'js/core.js', 'js/data.js', 'js/events.js', 'js/mini.js', 'js/art.js', 'js/sfx.js', 'manifest.webmanifest', 'icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
