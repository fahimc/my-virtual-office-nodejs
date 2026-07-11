import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const galleryDir = path.join(publicDir, 'template-gallery');
const imageryDir = path.join(galleryDir, 'generated-imagery');

const templateData = JSON.parse(await readFile(path.join(galleryDir, 'template-data.json'), 'utf8'));
const generatedManifestPath = path.join(imageryDir, 'manifest.json');
const generatedManifest = JSON.parse(await readFile(generatedManifestPath, 'utf8'));

let rewritten = 0;

for (const template of templateData.templates) {
  const templateDir = path.join(imageryDir, template.id);
  await mkdir(templateDir, { recursive: true });

  const heroRecord = generatedManifest.templates?.[template.id]?.images?.find(image => image.kind === 'hero');
  const heroFileName = heroRecord?.file ? path.basename(heroRecord.file) : `hero-${slug(template.id)}.webp`;
  const outputPath = path.join(templateDir, heroFileName);
  const [primary = '#111827', secondary = '#2563eb', accent = '#f97316'] = template.palette || [];
  const heroSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${escapeXml(primary)}"/>
        <stop offset=".55" stop-color="${escapeXml(secondary)}"/>
        <stop offset="1" stop-color="${escapeXml(accent)}"/>
      </linearGradient>
      <radialGradient id="a" cx=".18" cy=".28" r=".52">
        <stop stop-color="#ffffff" stop-opacity=".34"/>
        <stop offset="1" stop-color="${escapeXml(secondary)}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="b" cx=".82" cy=".32" r=".46">
        <stop stop-color="#000000" stop-opacity=".22"/>
        <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="copy-zone" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#000000" stop-opacity=".46"/>
        <stop offset=".46" stop-color="#000000" stop-opacity=".20"/>
        <stop offset=".74" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
      <pattern id="grain" width="42" height="42" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="9" r="1.3" fill="#ffffff" opacity=".08"/>
        <circle cx="31" cy="25" r="1" fill="#000000" opacity=".10"/>
        <circle cx="17" cy="36" r=".8" fill="#ffffff" opacity=".06"/>
      </pattern>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="#000000" flood-opacity=".24"/>
      </filter>
    </defs>
    <rect width="1536" height="1024" fill="url(#base)"/>
    <rect width="1536" height="1024" fill="url(#a)"/>
    <rect width="1536" height="1024" fill="url(#b)"/>
    <rect width="1536" height="1024" fill="url(#grain)" opacity=".7"/>
    <g filter="url(#soft-shadow)" opacity=".86">
      ${motifForTemplate(template, { primary, secondary, accent })}
    </g>
    <path d="M-120 860 C210 710 430 916 740 786 C1044 658 1258 728 1660 578 L1660 1140 L-120 1140 Z" fill="#ffffff" opacity=".12"/>
    <path d="M-80 150 C220 40 380 130 620 88 C910 38 1110 72 1660 -48 L1660 0 L-80 0 Z" fill="#000000" opacity=".12"/>
    <rect width="1536" height="1024" fill="url(#copy-zone)"/>
    <rect width="1536" height="1024" fill="#000000" opacity=".05"/>
  </svg>`);

  await sharp(heroSvg)
    .resize(1536, 1024, { fit: 'cover' })
    .webp({ quality: 86, effort: 5 })
    .toFile(outputPath);

  if (heroRecord) {
    heroRecord.provider = 'local_no_text_composite';
    heroRecord.prompt = `${heroRecord.prompt || ''}\nPOST-PROCESSED HERO POLICY: final hero background contains no readable text, no letters, no numbers, no signage, no logos, and no UI words. Visual detail is positioned away from the primary copy zone.`;
    heroRecord.noTextHero = true;
    heroRecord.sourceImage = 'procedural-tailored-no-text-composite';
  }

  rewritten += 1;
}

generatedManifest.heroPolicy = {
  updatedAt: new Date().toISOString(),
  rule: 'Full-bleed hero backgrounds must not contain text, typography, letters, numbers, logo marks, signage, watermarks, or UI labels because template copy is overlaid in HTML.',
  provider: 'local_no_text_composite'
};

await writeFile(generatedManifestPath, `${JSON.stringify(generatedManifest, null, 2)}\n`);
console.log(`Created ${rewritten} no-text full-bleed hero images.`);

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
}

function motifForTemplate(template, colors) {
  const category = template.category;
  if (category === 'food-drink') return fruitMotif(colors);
  if (category === 'saas') return dashboardMotif(colors);
  if (['trades', 'local-business'].includes(category)) return serviceMotif(colors);
  if (category === 'real-estate') return architectureMotif(colors);
  if (category === 'restaurant') return hospitalityMotif(colors);
  if (category === 'fitness') return motionMotif(colors);
  if (category === 'healthcare') return careMotif(colors);
  if (category === 'beauty') return beautyMotif(colors);
  if (category === 'ecommerce') return commerceMotif(colors);
  if (category === 'portfolio') return galleryMotif(colors);
  return agencyMotif(colors);
}

function fruitMotif({ accent, secondary }) {
  return `<g transform="translate(860 190)">
      <rect x="30" y="150" width="150" height="430" rx="66" fill="#ffffff" opacity=".22"/>
      <rect x="58" y="78" width="94" height="110" rx="38" fill="#111111" opacity=".30"/>
      <rect x="82" y="285" width="48" height="178" rx="24" fill="${escapeXml(accent)}" opacity=".74"/>
      <rect x="230" y="80" width="185" height="520" rx="78" fill="#ffffff" opacity=".28"/>
      <rect x="270" y="0" width="106" height="130" rx="42" fill="#111111" opacity=".28"/>
      <rect x="292" y="250" width="60" height="210" rx="30" fill="${escapeXml(secondary)}" opacity=".72"/>
      <rect x="468" y="125" width="160" height="455" rx="72" fill="#ffffff" opacity=".20"/>
      <rect x="500" y="48" width="96" height="110" rx="40" fill="#111111" opacity=".26"/>
      <rect x="528" y="280" width="56" height="176" rx="28" fill="${escapeXml(accent)}" opacity=".55"/>
      <circle cx="690" cy="420" r="155" fill="${escapeXml(secondary)}" opacity=".34"/>
    </g>`;
}

function dashboardMotif({ primary, secondary, accent }) {
  return `<g transform="translate(760 170)">
      <rect x="0" y="0" width="650" height="500" rx="56" fill="#ffffff" opacity=".17"/>
      <rect x="44" y="58" width="562" height="84" rx="30" fill="#000000" opacity=".18"/>
      <rect x="58" y="184" width="160" height="150" rx="36" fill="${escapeXml(accent)}" opacity=".56"/>
      <rect x="250" y="184" width="310" height="150" rx="36" fill="${escapeXml(secondary)}" opacity=".42"/>
      <rect x="58" y="370" width="502" height="34" rx="17" fill="#ffffff" opacity=".28"/>
      <rect x="58" y="430" width="370" height="34" rx="17" fill="${escapeXml(primary)}" opacity=".38"/>
      <circle cx="560" cy="85" r="22" fill="#ffffff" opacity=".42"/>
      <circle cx="500" cy="85" r="22" fill="#ffffff" opacity=".24"/>
    </g>`;
}

function serviceMotif({ secondary, accent }) {
  return `<g transform="translate(760 230)">
      <path d="M80 470 L330 120 L620 470 Z" fill="#ffffff" opacity=".18"/>
      <path d="M280 470 L520 190 L760 470 Z" fill="${escapeXml(secondary)}" opacity=".28"/>
      <rect x="136" y="430" width="590" height="90" rx="45" fill="${escapeXml(accent)}" opacity=".38"/>
      <rect x="360" y="320" width="120" height="150" rx="12" fill="#000000" opacity=".16"/>
      <path d="M120 470 H780" stroke="#ffffff" stroke-width="30" opacity=".16"/>
    </g>`;
}

function architectureMotif({ secondary, accent }) {
  return `<g transform="translate(720 145)">
      <rect x="60" y="180" width="170" height="560" rx="10" fill="#ffffff" opacity=".18"/>
      <rect x="270" y="80" width="290" height="660" rx="16" fill="${escapeXml(secondary)}" opacity=".28"/>
      <rect x="600" y="240" width="130" height="500" rx="12" fill="${escapeXml(accent)}" opacity=".28"/>
      <path d="M30 740 H800" stroke="#ffffff" stroke-width="38" opacity=".18"/>
      <path d="M100 220 H192 M100 300 H192 M100 380 H192 M312 140 H520 M312 220 H520 M312 300 H520 M640 300 H700 M640 382 H700" stroke="#ffffff" stroke-width="18" opacity=".22"/>
    </g>`;
}

function hospitalityMotif({ secondary, accent }) {
  return `<g transform="translate(805 200)">
      <circle cx="310" cy="340" r="240" fill="${escapeXml(accent)}" opacity=".42"/>
      <circle cx="420" cy="270" r="135" fill="#ffffff" opacity=".20"/>
      <path d="M72 560 C180 410 520 410 660 560" fill="none" stroke="${escapeXml(secondary)}" stroke-width="88" opacity=".34"/>
      <path d="M600 130 V560 M640 130 V560 M600 250 H680" stroke="#ffffff" stroke-width="24" opacity=".24"/>
      <path d="M110 112 C170 180 170 280 112 350" fill="none" stroke="#ffffff" stroke-width="26" opacity=".22"/>
    </g>`;
}

function motionMotif({ secondary, accent }) {
  return `<g transform="translate(700 140)">
      <path d="M80 650 C260 170 520 110 800 60" fill="none" stroke="${escapeXml(accent)}" stroke-width="118" opacity=".42"/>
      <circle cx="430" cy="330" r="145" fill="#ffffff" opacity=".22"/>
      <circle cx="610" cy="540" r="230" fill="${escapeXml(secondary)}" opacity=".32"/>
      <path d="M330 500 L500 260 L610 610 Z" fill="#000000" opacity=".16"/>
    </g>`;
}

function careMotif({ secondary, accent }) {
  return `<g transform="translate(820 210)">
      <circle cx="300" cy="300" r="260" fill="#ffffff" opacity=".20"/>
      <circle cx="450" cy="300" r="170" fill="${escapeXml(secondary)}" opacity=".34"/>
      <rect x="190" y="472" width="430" height="130" rx="65" fill="${escapeXml(accent)}" opacity=".34"/>
      <rect x="340" y="150" width="86" height="310" rx="43" fill="#ffffff" opacity=".22"/>
      <rect x="230" y="262" width="310" height="86" rx="43" fill="#ffffff" opacity=".22"/>
    </g>`;
}

function beautyMotif({ secondary, accent }) {
  return `<g transform="translate(760 170)">
      <circle cx="330" cy="260" r="245" fill="${escapeXml(secondary)}" opacity=".36"/>
      <circle cx="520" cy="420" r="245" fill="#ffffff" opacity=".18"/>
      <path d="M70 590 C260 390 545 415 780 585" fill="none" stroke="${escapeXml(accent)}" stroke-width="78" opacity=".36"/>
      <rect x="520" y="110" width="90" height="390" rx="45" fill="#ffffff" opacity=".20"/>
      <circle cx="565" cy="92" r="72" fill="#ffffff" opacity=".14"/>
    </g>`;
}

function commerceMotif({ secondary, accent }) {
  return `<g transform="translate(790 170)">
      <rect x="60" y="160" width="240" height="380" rx="58" fill="#ffffff" opacity=".20"/>
      <rect x="350" y="90" width="310" height="500" rx="70" fill="${escapeXml(secondary)}" opacity=".32"/>
      <path d="M120 170 C120 60 250 60 250 170" fill="none" stroke="#ffffff" stroke-width="28" opacity=".28"/>
      <path d="M430 104 C430 -20 575 -20 575 104" fill="none" stroke="#ffffff" stroke-width="32" opacity=".24"/>
      <circle cx="230" cy="650" r="100" fill="${escapeXml(accent)}" opacity=".42"/>
      <circle cx="500" cy="680" r="116" fill="#ffffff" opacity=".18"/>
    </g>`;
}

function galleryMotif({ secondary, accent }) {
  return `<g transform="translate(740 150)">
      <rect x="70" y="70" width="270" height="360" rx="34" fill="#ffffff" opacity=".20"/>
      <rect x="390" y="140" width="360" height="450" rx="38" fill="${escapeXml(secondary)}" opacity=".30"/>
      <rect x="180" y="500" width="380" height="270" rx="38" fill="${escapeXml(accent)}" opacity=".26"/>
      <circle cx="220" cy="210" r="74" fill="#000000" opacity=".12"/>
      <path d="M130 370 L220 290 L300 370 Z" fill="#ffffff" opacity=".20"/>
    </g>`;
}

function agencyMotif({ secondary, accent }) {
  return `<g transform="translate(770 160)">
      <circle cx="300" cy="260" r="250" fill="${escapeXml(secondary)}" opacity=".30"/>
      <rect x="120" y="455" width="570" height="190" rx="64" fill="#ffffff" opacity=".18"/>
      <circle cx="530" cy="500" r="170" fill="${escapeXml(accent)}" opacity=".34"/>
      <path d="M140 540 C230 450 330 650 420 540 S610 430 690 540" fill="none" stroke="#ffffff" stroke-width="28" opacity=".20"/>
    </g>`;
}

function escapeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
