const fs = require('fs');
const path = require('path');

const root = process.cwd();
const productDir = path.join(root, 'public/images/products');
const categoryDir = path.join(root, 'public/images/categories');
const editorialDir = path.join(root, 'public/images/editorial');
const brandDir = path.join(root, 'public/brands');
for (const dir of [productDir, categoryDir, editorialDir, brandDir]) fs.mkdirSync(dir, { recursive: true });

const palettes = [
  ['#FBE9ED', '#FFF9F5', '#9A6B82', '#C3A067'],
  ['#F8EEF2', '#FFFDFC', '#B7748D', '#D8B36B'],
  ['#F7F1EA', '#FFFFFF', '#8E6A5C', '#C3A067'],
  ['#F1E7EC', '#FFF8FA', '#704B61', '#D1A95C'],
  ['#FCE7DF', '#FFFDFC', '#C26D75', '#C3A067'],
  ['#EDF5F0', '#FFFDFC', '#769982', '#C3A067'],
  ['#EEF1F8', '#FFFDFC', '#6B789A', '#C3A067'],
  ['#F8ECE4', '#FFFDFC', '#A66C55', '#C3A067'],
];

function svgWrap(width, height, inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <defs>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="30" stdDeviation="22" flood-color="#241F22" flood-opacity="0.20"/></filter>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="24"/></filter>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity="0.88"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.18"/></linearGradient>
  </defs>${inner}
</svg>`;
}

function bg(w, h, p) {
  return `<rect width="${w}" height="${h}" fill="${p[1]}"/>
  <rect width="${w}" height="${h}" fill="${p[0]}" opacity="0.72"/>
  <circle cx="${w * 0.78}" cy="${h * 0.18}" r="${w * 0.22}" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="${w * 0.2}" cy="${h * 0.84}" r="${w * 0.2}" fill="${p[2]}" opacity="0.08"/>
  <path d="M0 ${h * 0.76} C ${w * 0.2} ${h * 0.62}, ${w * 0.38} ${h * 0.86}, ${w * 0.58} ${h * 0.72} C ${w * 0.78} ${h * 0.58}, ${w * 0.9} ${h * 0.68}, ${w} ${h * 0.56} L ${w} ${h} L 0 ${h}Z" fill="#FFFFFF" opacity="0.42"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.74}" rx="${w * 0.24}" ry="${h * 0.04}" fill="#241F22" opacity="0.13"/>`;
}

function leaf(x, y, rotate, scale = 1, color = '#7F9B74') {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" opacity="0.8"><path d="M0 0 C 36 -26 70 -20 90 10 C 52 18 22 14 0 0Z" fill="${color}"/><path d="M5 2 C 34 0 56 5 82 10" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3"/></g>`;
}

function pearls() {
  return `<circle cx="84" cy="112" r="10" fill="#fff" opacity="0.82"/><circle cx="104" cy="132" r="7" fill="#fff" opacity="0.76"/><circle cx="330" cy="404" r="9" fill="#fff" opacity="0.7"/><circle cx="360" cy="380" r="5" fill="#fff" opacity="0.68"/>`;
}

function dropper(p) {
  return `<g filter="url(#shadow)" transform="translate(0 4)">
    <rect x="188" y="96" width="44" height="92" rx="18" fill="#FFFFFF"/>
    <rect x="168" y="164" width="84" height="46" rx="12" fill="${p[2]}"/>
    <rect x="166" y="202" width="88" height="206" rx="32" fill="#FFFFFF"/>
    <rect x="181" y="222" width="58" height="132" rx="22" fill="${p[0]}"/>
    <rect x="194" y="282" width="32" height="8" rx="4" fill="${p[3]}" opacity="0.9"/>
    <rect x="196" y="305" width="28" height="5" rx="2.5" fill="${p[2]}" opacity="0.32"/>
    <path d="M239 222 C 225 250 226 322 239 354" stroke="url(#shine)" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
  </g>`;
}
function jar(p) {
  return `<g filter="url(#shadow)">
    <ellipse cx="210" cy="206" rx="86" ry="26" fill="${p[2]}"/>
    <rect x="130" y="174" width="160" height="58" rx="22" fill="${p[2]}"/>
    <path d="M112 226 C 126 196 294 196 308 226 L286 382 C 276 420 144 420 134 382Z" fill="#FFFFFF"/>
    <ellipse cx="210" cy="226" rx="98" ry="34" fill="#FFFDFC"/>
    <path d="M142 256 C 172 276 242 276 278 256 L270 352 C 254 378 166 378 150 352Z" fill="${p[0]}" opacity="0.95"/>
    <rect x="166" y="314" width="88" height="8" rx="4" fill="${p[3]}" opacity="0.82"/>
    <path d="M286 245 C 270 280 270 350 278 382" stroke="url(#shine)" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
  </g>`;
}
function tube(p) {
  return `<g filter="url(#shadow)" transform="rotate(-7 210 260)">
    <rect x="142" y="126" width="136" height="286" rx="34" fill="#FFFFFF"/>
    <rect x="160" y="160" width="100" height="142" rx="26" fill="${p[0]}"/>
    <rect x="166" y="318" width="88" height="16" rx="8" fill="${p[3]}"/>
    <rect x="158" y="402" width="104" height="36" rx="12" fill="${p[2]}"/>
    <path d="M254 152 C 238 210 238 300 252 386" stroke="url(#shine)" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
  </g>`;
}
function lipstick(p) {
  return `<g filter="url(#shadow)">
    <rect x="170" y="228" width="82" height="180" rx="16" fill="#241F22"/>
    <rect x="180" y="218" width="62" height="182" rx="14" fill="${p[2]}"/>
    <rect x="185" y="196" width="52" height="44" rx="12" fill="${p[3]}"/>
    <path d="M192 196 L211 116 L230 196 Z" fill="#B84C66"/>
    <path d="M215 132 C 228 156 230 180 226 196" stroke="url(#shine)" stroke-width="5" stroke-linecap="round"/>
    <rect x="132" y="308" width="58" height="126" rx="18" fill="#FFFFFF" opacity="0.88"/>
  </g>`;
}
function mascara(p) {
  return `<g filter="url(#shadow)" transform="rotate(8 210 260)">
    <rect x="178" y="150" width="64" height="260" rx="25" fill="#241F22"/>
    <rect x="188" y="172" width="44" height="196" rx="20" fill="${p[2]}"/>
    <rect x="168" y="118" width="84" height="44" rx="16" fill="#FFFFFF"/>
    <g transform="translate(230 124) rotate(-16)"><rect x="0" y="0" width="12" height="190" rx="6" fill="#241F22"/><g stroke="#241F22" stroke-width="3">${Array.from({length:9}, (_,i)=>`<line x1="12" y1="${20+i*13}" x2="38" y2="${10+i*13}"/>`).join('')}</g></g>
  </g>`;
}
function compact(p) {
  return `<g filter="url(#shadow)">
    <circle cx="210" cy="268" r="112" fill="#FFFFFF"/>
    <circle cx="210" cy="268" r="84" fill="${p[0]}"/>
    <path d="M130 250 A84 84 0 0 1 290 250" fill="${p[2]}" opacity="0.88"/>
    <circle cx="210" cy="268" r="112" fill="none" stroke="${p[3]}" stroke-width="10" opacity="0.86"/>
    <rect x="154" y="390" width="112" height="30" rx="14" fill="#FFFFFF"/>
  </g>`;
}
function bottle(p) {
  return `<g filter="url(#shadow)">
    <rect x="184" y="94" width="52" height="68" rx="18" fill="#FFFFFF"/>
    <rect x="166" y="148" width="88" height="38" rx="13" fill="${p[2]}"/>
    <path d="M150 182 C 150 156 270 156 270 182 L286 392 C 286 424 134 424 134 392Z" fill="#FFFFFF"/>
    <path d="M166 222 C 190 204 236 204 260 222 L268 354 C 246 380 174 380 152 354Z" fill="${p[0]}"/>
    <rect x="182" y="298" width="56" height="8" rx="4" fill="${p[3]}"/>
    <path d="M260 202 C 246 248 250 328 266 382" stroke="url(#shine)" stroke-width="9" stroke-linecap="round" opacity="0.6"/>
  </g>`;
}
function fragrance(p) {
  return `<g filter="url(#shadow)">
    <rect x="186" y="108" width="48" height="56" rx="12" fill="${p[3]}"/>
    <rect x="170" y="154" width="80" height="40" rx="14" fill="#FFFFFF"/>
    <rect x="138" y="190" width="144" height="214" rx="42" fill="#FFFFFF"/>
    <rect x="164" y="224" width="92" height="126" rx="28" fill="${p[0]}"/>
    <circle cx="210" cy="288" r="30" fill="${p[2]}" opacity="0.38"/>
    <path d="M264 216 C 248 256 250 330 264 376" stroke="url(#shine)" stroke-width="9" stroke-linecap="round" opacity="0.6"/>
  </g>`;
}
function setPack(p) {
  return `<g filter="url(#shadow)">
    <g transform="translate(-34 10) scale(.82)">${dropper(p)}</g>
    <g transform="translate(92 44) scale(.72)">${tube(p)}</g>
    <g transform="translate(-40 120) scale(.62)">${jar(p)}</g>
  </g>`;
}

const shapes = [dropper, jar, tube, lipstick, mascara, compact, bottle, fragrance, setPack];
for (let i = 1; i <= 44; i++) {
  const id = `p${String(i).padStart(3, '0')}`;
  const p = palettes[(i - 1) % palettes.length];
  const shape = shapes[(i - 1) % shapes.length];
  const inner = `${bg(420, 520, p)}${pearls()}${leaf(54, 420, -35, .72)}${leaf(324, 118, 150, .54, '#9CA978')}${shape(p)}<text x="210" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="${p[2]}" opacity="0.82">GLAMO NEPAL</text>`;
  fs.writeFileSync(path.join(productDir, `${id}.svg`), svgWrap(420, 520, inner, `GLAMO product packshot ${id}`));
}

const categories = [
  ['skincare', dropper, '#F8EEF2'], ['makeup', lipstick, '#FBE9ED'], ['haircare', bottle, '#EDF5F0'], ['bodycare', tube, '#F7F1EA'], ['fragrance', fragrance, '#EEF1F8'], ['tools', compact, '#FFF3E6'],
];
for (const [name, shape, tint] of categories) {
  const p = palettes[Math.abs(name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % palettes.length];
  const inner = `<rect width="520" height="520" fill="${tint}"/><circle cx="400" cy="120" r="120" fill="#fff" opacity=".55"/><circle cx="130" cy="400" r="100" fill="${p[2]}" opacity=".09"/><ellipse cx="260" cy="382" rx="128" ry="22" fill="#241F22" opacity=".11"/>${leaf(58, 385, -28, .8)}<g transform="translate(50 20) scale(.95)">${shape(p)}</g>`;
  fs.writeFileSync(path.join(categoryDir, `${name}.svg`), svgWrap(520, 520, inner, `GLAMO ${name} category visual`));
}

function editorial(name, title, pIndex) {
  const p = palettes[pIndex % palettes.length];
  const inner = `<rect width="1300" height="900" fill="${p[1]}"/><rect width="1300" height="900" fill="${p[0]}" opacity=".76"/><circle cx="1040" cy="160" r="210" fill="#fff" opacity=".55"/><circle cx="220" cy="710" r="170" fill="${p[2]}" opacity=".08"/><path d="M0 700 C 210 560 410 760 640 620 C 870 480 1030 620 1300 500 L1300 900 L0 900Z" fill="#fff" opacity=".48"/>${leaf(80, 640, -24, 1.1)}${leaf(960, 220, 154, .8)}<g transform="translate(430 150) scale(1.08)">${setPack(p)}</g><g transform="translate(720 230) scale(.86)">${fragrance(p)}</g><g transform="translate(230 280) scale(.78)">${compact(p)}</g><text x="96" y="150" font-family="Georgia, serif" font-size="78" font-weight="700" fill="#241F22">${title}</text><text x="100" y="205" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" fill="${p[2]}">GLAMO NEPAL BEAUTY EDIT</text>`;
  fs.writeFileSync(path.join(editorialDir, `${name}.svg`), svgWrap(1300, 900, inner, title));
}
editorial('hero-editorial', 'Reveal your natural glow', 0);
editorial('new-year-editorial', 'New Year beauty edit', 4);
editorial('shop-collage', 'Shop the glow edit', 1);
editorial('newsletter-vanity', 'Your beauty shelf', 2);

const collectionNames = ['new-arrivals', 'best-sellers', 'made-in-nepal', 'festival-ready', 'under-npr-1000', 'sensitive-skin', 'bridal-beauty', 'low-stock'];
collectionNames.forEach((name, index) => editorial(`collection-${name}`, name.replace(/-/g, ' '), index));

for (let i = 1; i <= 8; i++) {
  const p = palettes[(i + 2) % palettes.length];
  const inner = `<rect width="520" height="390" fill="${p[1]}"/><rect width="520" height="390" fill="${p[0]}" opacity=".68"/><circle cx="410" cy="84" r="96" fill="#fff" opacity=".58"/><circle cx="90" cy="320" r="76" fill="${p[2]}" opacity=".08"/><g transform="translate(50 -30) scale(.82)">${shapes[(i + 1) % shapes.length](p)}</g><g transform="translate(205 18) scale(.62)">${shapes[(i + 4) % shapes.length](p)}</g><text x="44" y="72" font-family="Georgia, serif" font-size="46" font-weight="700" fill="#241F22">GLAMO</text><text x="48" y="104" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="4" fill="${p[2]}">BRAND EDIT</text>`;
  fs.writeFileSync(path.join(brandDir, `brand-${i}.svg`), svgWrap(520, 390, inner, `GLAMO brand visual ${i}`));
}
