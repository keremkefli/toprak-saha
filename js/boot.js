// Toprak Saha — açılış: İngilizce seçiliyse sözlük oyundan önce yüklenir (bkz. js/i18n.js)
let en = false;
try { en = localStorage.getItem('toprak-saha-dil') === 'en'; } catch (e) { /* depolama kapalı */ }
document.documentElement.lang = en ? 'en' : 'tr';
(en ? import('./en.js').catch(() => { document.documentElement.lang = 'tr'; }) : Promise.resolve()).then(() => import('./ui.js'));
