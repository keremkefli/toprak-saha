// Toprak Saha — çizim seti: ikonlar, oyuncu portresi, karakterler, armalar, grafikler (hepsi SVG, dosya gerektirmez)

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
  smile: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  coin: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2',
  train: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
  bed: 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  briefcase: 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  plus: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v8M8 12h8',
  ball: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7.5l4 3-1.5 4.5h-5L8 10.5zM12 2v5.5M16 10.5l5.3-1.7M14.5 15l3.3 4.6M9.5 15l-3.3 4.6M8 10.5 2.7 8.8',
  chart: 'M3 3v18h18M7 15l4-5 3 3 5-7',
  swap: 'M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  news: 'M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  shirt: 'M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z',
  whistle: 'M14 14a5 5 0 1 1-5-5h12v3h-4M9 14h.01',
  vol: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mute: 'M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  cart: 'M6 6h15l-1.5 9h-12zM6 6 5 2H2M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  car: 'M5 17h14v-5l-2-5H7l-2 5zM5 17v2M19 17v2M7.5 14h.01M16.5 14h.01',
  crown: 'M3 18h18M3 18 5 7l4.5 4L12 5l2.5 6L19 7l2 11',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  right: 'M5 12h14M13 5l7 7-7 7',
  cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
};

export function ic(n, s = 20, cls = '') {
  return `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.ball}"/></svg>`;
}

// ---------- portre ----------
export const SKIN = ['#f3cfa6', '#e0ac7e', '#c08a5c', '#8d5a3b'];
export const HAIRC = ['#1b1612', '#4a2f1c', '#9a6a32', '#d8d2c8'];
const HAIR = [
  c => `<path d="M28.5 42C25 22 38 12 50 12s25 10 21.5 30c-2-9-7-15-21.5-15S30.5 33 28.5 42z" fill="${c}"/>`,
  c => `<path d="M29.5 38C28 23 39 15 50 15s22 8 20.5 23c-2-8-8-12-20.5-12s-18.5 4-20.5 12z" fill="${c}" opacity=".75"/>`,
  c => `<path d="M28 43C23 21 38 9 54 11c14 0 22 13 18 31-2-9-6-14-13-15-9 4-21 2-27 7-2 2-3 5-4 9z" fill="${c}"/>`,
  c => `<g fill="${c}"><ellipse cx="50" cy="25" rx="19" ry="10"/><circle cx="34" cy="24" r="9"/><circle cx="46" cy="17" r="10"/><circle cx="59" cy="18" r="10"/><circle cx="68" cy="27" r="8"/><circle cx="30" cy="35" r="6"/><circle cx="71" cy="36" r="5.5"/></g>`,
  c => `<path d="M26 62C20 24 36 10 50 10s30 14 24 52c-1-14-4-27-9-32-8 1-22 0-29-6-5 6-9 22-10 38z" fill="${c}"/>`,
  () => '',
  c => `<path d="M30 37C29 24 39 17 50 17s21 7 20 20c-2-7-8-10-20-10s-18 3-20 10z" fill="${c}" opacity=".45"/><path d="M43 30 45 8c3-3 7-3 10 0l2 22c-4-3-10-3-14 0z" fill="${c}"/>`,
  c => `<circle cx="50" cy="9" r="7.5" fill="${c}"/><path d="M28.5 42C25 22 38 12 50 12s25 10 21.5 30c-2-9-7-15-21.5-15S30.5 33 28.5 42z" fill="${c}"/>`,
];
export const HAIRS = HAIR.length;

export function avatar(look = {}, c1 = '#3a3f47', c2 = '#f2f2f2', x = {}) {
  const sk = SKIN[look.skin ?? 1], hc = HAIRC[look.hc ?? 0], hair = HAIR[look.hair ?? 0] || HAIR[0], bd = x.beard ? 2 : look.beard || 0;
  return `<svg class="av" viewBox="0 0 100 110" aria-hidden="true">
    <path d="M8 110C8 88 24 79 40 77h20c16 2 32 11 32 33z" fill="${c1}"/>
    <path d="M24 110 35 80l9-3-12 33z" fill="${c2}" opacity=".9"/>
    <path d="M39 77 50 90l11-13" fill="none" stroke="${c2}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="42" y="58" width="16" height="22" rx="6" fill="${sk}"/><rect x="42" y="64" width="16" height="9" fill="#000" opacity=".13"/>
    <circle cx="29" cy="45" r="4.5" fill="${sk}"/><circle cx="71" cy="45" r="4.5" fill="${sk}"/>
    <ellipse cx="50" cy="42" rx="21" ry="25" fill="${sk}"/>
    <path d="M50 17c12 0 21 11 21 25s-9 25-21 25z" fill="#000" opacity=".07"/>
    ${bd ? `<path d="M30 46c1 16 9 23 20 23s19-7 20-23c-3 8-6 11-10 12-6-3-14-3-20 0-4-1-7-4-10-12z" fill="${hc}" opacity="${bd === 1 ? .3 : .9}"/>` : ''}
    ${hair(hc)}
    ${look.band ? '<path d="M29.6 33q20.4-9.5 40.8 0v5.5q-20.4-9.5-40.8 0z" fill="#f2f2f2"/>' : ''}
    ${x.num ? `<text x="64" y="104" text-anchor="middle" font-family="'Big Shoulders Display','Arial Narrow',sans-serif" font-weight="900" font-size="17" fill="${c2}" stroke="rgba(0,0,0,.35)" stroke-width="1.5" paint-order="stroke">${x.num}</text>` : ''}
    <path d="M38 37.5q4-2.5 8 0M54 37.5q4-2.5 8 0" stroke="#000" opacity=".55" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${x.glasses ? '<path d="M34 40h13v8H34zM53 40h13v8H53z" fill="#101010"/><path d="M47 43h6" stroke="#101010" stroke-width="2"/>' : '<circle cx="42" cy="43.5" r="2.3" fill="#191512"/><circle cx="58" cy="43.5" r="2.3" fill="#191512"/>'}
    <path d="M50 46v6l-2.5 1.5" stroke="#000" opacity=".25" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M43.5 57.5q6.5 4 13 0" stroke="#5a2a22" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Olay kartlarında konuşan kişiler
export const PERS = {
  hoca: { n: 'Hocan', l: { skin: 1, hair: 1, hc: 3 }, c1: '#23272e', c2: '#ff6a2b', beard: 1 },
  anne: { n: 'Annen', l: { skin: 1, hair: 4, hc: 1 }, c1: '#7b3f5c', c2: '#f2d9c4' },
  baba: { n: 'Baban', l: { skin: 2, hair: 0, hc: 3 }, c1: '#3c4a3e', c2: '#d9d2c2', beard: 1 },
  ark: { n: 'Arkadaşın', l: { skin: 2, hair: 2, hc: 0 }, c1: '#2f5f8f', c2: '#f2f2f2' },
  takim: { n: 'Takım arkadaşın', l: { skin: 3, hair: 1, hc: 0 }, club: 1 },
  baskan: { n: 'Başkan', l: { skin: 1, hair: 5, hc: 3 }, c1: '#1f1f24', c2: '#c9a227' },
  menajer: { n: 'Menajer', l: { skin: 1, hair: 2, hc: 1 }, c1: '#2a2f45', c2: '#f2f2f2', glasses: 1 },
  basin: { n: 'Muhabir', l: { skin: 2, hair: 0, hc: 1 }, c1: '#5b6470', c2: '#f2f2f2' },
  scout: { n: 'Scout', l: { skin: 0, hair: 5, hc: 3 }, c1: '#3b4b3a', c2: '#d9d2c2', glasses: 1 },
  doktor: { n: 'Doktor', l: { skin: 0, hair: 4, hc: 0 }, c1: '#eef3f5', c2: '#4aa3df' },
  par: { n: 'Sevgilin', l: { skin: 1, hair: 4, hc: 2 }, c1: '#c24d6a', c2: '#f2f2f2' },
  golge: { n: 'Tanımadığın biri', l: { skin: 2, hair: 0, hc: 0 }, c1: '#111', c2: '#3a3a3a', glasses: 1, beard: 1 },
  taraftar: { n: 'Taraftar', l: { skin: 2, hair: 3, hc: 0 }, club: 1 },
  fed: { n: 'Federasyon', l: { skin: 0, hair: 0, hc: 3 }, c1: '#1c2b4a', c2: '#f2f2f2' },
  sponsor: { n: 'Marka temsilcisi', l: { skin: 3, hair: 1, hc: 0 }, c1: '#ece9e2', c2: '#161616' },
  asker: { n: 'Askerlik şubesi', l: { skin: 1, hair: 1, hc: 0 }, c1: '#4b5a3a', c2: '#2f3a24' },
  rakip: { n: 'Rakibin', l: { skin: 0, hair: 2, hc: 2 }, c1: '#8a1f2b', c2: '#f2f2f2' },
};
export function persona(k, club) {
  const p = PERS[k] || PERS.ark;
  return avatar(p.l, p.club && club ? club.c1 : p.c1 || '#444', p.club && club ? club.c2 : p.c2 || '#fff', p);
}

// ---------- arma ----------
function hsh(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function initials(n) {
  const w = n.replace(/[0-9.]/g, '').trim().split(/[\s-]+/).filter(x => x.length > 1 && !['FK', 'SK', 'SF', 'SC', 'CP', 'FC', 'Al'].includes(x));
  if (!w.length) return n.slice(0, 2).toLocaleUpperCase('tr');
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toLocaleUpperCase('tr');
}
const SHAPE = ['M20 2 36 7v13c0 9-7 15-16 18C11 35 4 29 4 20V7z', 'M20 3a17 17 0 1 0 0 34 17 17 0 0 0 0-34z', 'M20 2 35 9v15L20 38 5 24V9z'];
const PAT = [
  c => `<path d="M-2 25 42 9v8L-2 33z" fill="${c}"/>`,
  c => `<path d="M11 0h6v40h-6zM23 0h6v40h-6z" fill="${c}"/>`,
  c => `<path d="M20 0h20v40H20z" fill="${c}"/>`,
  c => `<path d="M2 13 20 25l18-12v7L20 32 2 20z" fill="${c}"/>`,
  c => `<path d="M0 13h40v5H0zM0 24h40v5H0z" fill="${c}"/>`,
];
export function crestSvg(n, c1, c2, s = 36) {
  const h = hsh(n), sh = h % 3, d = SHAPE[sh], esc = initials(n).replace(/[&<>"]/g, '');
  return `<svg class="crest" width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><defs><clipPath id="cs${sh}"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="${c1}"/><g clip-path="url(#cs${sh})">${PAT[(h >>> 3) % PAT.length](c2)}</g>
    <path d="${d}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>
    ${s >= 28 ? `<text x="20" y="24.5" text-anchor="middle" font-family="'Big Shoulders Display','Arial Narrow',sans-serif" font-weight="900" font-size="13" fill="#fff" stroke="rgba(0,0,0,.8)" stroke-width="2.6" paint-order="stroke">${esc}</text>` : ''}</svg>`;
}

// ---------- grafikler ----------
// Özellik radarı: vals = [{l, v}] (0-99)
export function radar(vals, s = 190) {
  const n = vals.length, c = s / 2, R = s / 2 - 26;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; };
  const ring = f => vals.map((_, i) => pt(i, R * f).map(x => x.toFixed(1)).join(',')).join(' ');
  const poly = vals.map((v, i) => pt(i, R * Math.max(.06, v.v / 99)).map(x => x.toFixed(1)).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 ${s} ${s}" aria-hidden="true">
    ${[1, .66, .33].map(f => `<polygon points="${ring(f)}" fill="none" stroke="currentColor" opacity=".16"/>`).join('')}
    ${vals.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" opacity=".12"/>`; }).join('')}
    <polygon points="${poly}" class="rp"/>
    ${vals.map((v, i) => { const [x, y] = pt(i, R + 15); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="rl">${v.l}</text>`; }).join('')}
  </svg>`;
}

// Halka gösterge: 0-100 değer, ortada ikon
export function ring(v, icon, cls = '') {
  const r = 20, C = 2 * Math.PI * r, f = Math.max(0, Math.min(100, v)) / 100;
  return `<svg class="ring ${cls}" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
    <circle cx="26" cy="26" r="${r}" class="rb"/><circle cx="26" cy="26" r="${r}" class="rf" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 26 26)"/>
    <g transform="translate(16 16) scale(.833)" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[icon] || P.ball}"/></g></svg>`;
}

// Avrupa kupası amblemleri (özgün çizim). cl: yıldız halkası, el: kupa ve dalga
const starP = (cx, cy, R, rot = -90) => { let d = ''; for (let i = 0; i < 10; i++) { const a = (rot + i * 36) * Math.PI / 180, q = i % 2 ? R * .42 : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q).toFixed(1) + ' ' + (cy + Math.sin(a) * q).toFixed(1); } return d + 'z'; };
export function euLogo(k, s = 40) {
  if (k === 'cl') {
    let ring = '';
    for (let i = 0; i < 8; i++) { const a = (i * 45 - 90) * Math.PI / 180; ring += `<path d="${starP(50 + Math.cos(a) * 31, 50 + Math.sin(a) * 31, 6.5, i * 45 - 90)}" fill="#fff"/>`; }
    return `<svg class="eul" width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="gcl" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="#3f74ff"/><stop offset="1" stop-color="#061045"/></radialGradient></defs>
      <circle cx="50" cy="50" r="48" fill="url(#gcl)" stroke="#a9c1ff" stroke-width="2"/><circle cx="50" cy="50" r="21.5" fill="none" stroke="#a9c1ff" stroke-width="1.2" opacity=".65"/>${ring}<path d="${starP(50, 51, 16)}" fill="#fff"/></svg>`;
  }
  return `<svg class="eul" width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="gel" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="#ff9a3d"/><stop offset="1" stop-color="#8f2c00"/></radialGradient></defs>
    <circle cx="50" cy="50" r="48" fill="url(#gel)" stroke="#ffd2a6" stroke-width="2"/>
    <path d="M16 60a36 36 0 0 0 68 0M22 70a32 32 0 0 0 56 0" fill="none" stroke="#ffd2a6" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
    <path d="M35 24h30v9c0 13-6 22-15 22s-15-9-15-22z" fill="#fff"/><path d="M35 28c-11-1-11 15 3 17M65 28c11-1 11 15-3 17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M46.5 54h7v9h-7zM37 70l3-7h20l3 7z" fill="#fff"/><path d="${starP(50, 37, 6)}" fill="#c2410c"/></svg>`;
}
