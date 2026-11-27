// Toprak Saha — hizmet işçisi: önce ağ (güncel sürüm), ağ yoksa önbellek (çevrimdışı açılış)
const CACHE = 'toprak-saha-15';
const SHELL = ['./', 'index.html', 'css/fonts.css', 'css/style.css', 'js/en.js', 'js/boot.js', 'js/i18n.js', 'js/ui.js', 'js/core.js', 'js/data.js', 'js/kadin.js', 'js/events.js', 'js/mini.js', 'js/scene.js', 'js/art.js', 'js/sfx.js', 'manifest.webmanifest', 'icon-192.png', 'img/backer.png', 'snd/tribun1.mp3', 'snd/tribun2.mp3', 'snd/tribun3.mp3', 'snd/gol.mp3', 'fonts/barlow-latin-1.woff2', 'fonts/barlow-latin-3.woff2', 'fonts/barlow-latin-5.woff2', 'fonts/barlow-latin-7.woff2', 'fonts/barlow-latin-ext-0.woff2', 'fonts/barlow-latin-ext-2.woff2', 'fonts/barlow-latin-ext-4.woff2', 'fonts/barlow-latin-ext-6.woff2', 'fonts/bigshouldersdisplay-latin-9.woff2', 'fonts/bigshouldersdisplay-latin-ext-8.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
