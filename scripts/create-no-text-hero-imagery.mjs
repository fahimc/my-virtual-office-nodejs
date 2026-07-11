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
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="1536" height="1024" fill="url(#base)"/>
    <rect width="1536" height="1024" fill="url(#a)"/>
    <rect width="1536" height="1024" fill="url(#b)"/>
    <g filter="url(#soft)" opacity=".72">
      ${motifForTemplate(template, { primary, secondary, accent })}
    </g>
    <path d="M-120 860 C210 710 430 916 740 786 C1044 658 1258 728 1660 578 L1660 1140 L-120 1140 Z" fill="#ffffff" opacity=".12"/>
    <path d="M-80 150 C220 40 380 130 620 88 C910 38 1110 72 1660 -48 L1660 0 L-80 0 Z" fill="#000000" opacity=".12"/>
    <rect width="1536" height="1024" fill="#000000" opacity=".08"/>
  </svg>`);

  await sharp(heroSvg)
    .resize(1536, 1024, { fit: 'cover' })
    .webp({ quality: 86, effort: 5 })
    .toFile(outputPath);

  if (heroRecord) {
    heroRecord.provider = 'local_no_text_composite';
    heroRecord.prompt = `${heroRecord.prompt || ''}\nPOST-PROCESSED HERO POLICY: final hero background contains no readable text, no letters, no numbers, no signage, no logos, and no UI words.`;
    heroRecord.noTextHero = true;
    heroRecord.sourceImage = 'procedural-no-text-vector-composite';
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
  return `<circle cx="1050" cy="430" r="250" fill="${escapeXml(accent)}" opacity=".68"/>
    <circle cx="1220" cy="610" r="180" fill="${escapeXml(secondary)}" opacity=".58"/>
    <circle cx="800" cy="630" r="120" fill="#ffffff" opacity=".22"/>
    <path d="M900 300 C1020 220 1180 250 1280 360 C1140 352 1010 400 900 300 Z" fill="#ffffff" opacity=".20"/>`;
}

function dashboardMotif({ primary, secondary, accent }) {
  return `<rect x="790" y="210" width="520" height="350" rx="44" fill="#ffffff" opacity=".16"/>
    <rect x="860" y="290" width="140" height="90" rx="28" fill="${escapeXml(accent)}" opacity=".46"/>
    <rect x="1030" y="290" width="210" height="90" rx="28" fill="${escapeXml(secondary)}" opacity=".40"/>
    <rect x="860" y="420" width="380" height="42" rx="21" fill="#ffffff" opacity=".26"/>
    <rect x="860" y="492" width="290" height="42" rx="21" fill="${escapeXml(primary)}" opacity=".34"/>`;
}

function serviceMotif({ secondary, accent }) {
  return `<path d="M720 770 L1080 260 L1340 770 Z" fill="#ffffff" opacity=".16"/>
    <path d="M960 770 L1260 360 L1500 770 Z" fill="${escapeXml(secondary)}" opacity=".22"/>
    <rect x="820" y="650" width="560" height="90" rx="45" fill="${escapeXml(accent)}" opacity=".28"/>`;
}

function architectureMotif({ secondary, accent }) {
  return `<rect x="780" y="250" width="180" height="520" rx="12" fill="#ffffff" opacity=".16"/>
    <rect x="990" y="180" width="280" height="590" rx="16" fill="${escapeXml(secondary)}" opacity=".24"/>
    <rect x="1300" y="330" width="110" height="440" rx="12" fill="${escapeXml(accent)}" opacity=".22"/>
    <path d="M680 780 L1460 780" stroke="#ffffff" stroke-width="38" opacity=".18"/>`;
}

function hospitalityMotif({ secondary, accent }) {
  return `<circle cx="1030" cy="520" r="260" fill="${escapeXml(accent)}" opacity=".42"/>
    <circle cx="1170" cy="438" r="160" fill="#ffffff" opacity=".18"/>
    <path d="M820 720 C940 600 1220 600 1360 720" fill="none" stroke="${escapeXml(secondary)}" stroke-width="90" opacity=".26"/>`;
}

function motionMotif({ secondary, accent }) {
  return `<path d="M740 720 C900 320 1140 240 1390 170" fill="none" stroke="${escapeXml(accent)}" stroke-width="120" opacity=".35"/>
    <circle cx="1040" cy="440" r="150" fill="#ffffff" opacity=".18"/>
    <circle cx="1220" cy="620" r="210" fill="${escapeXml(secondary)}" opacity=".28"/>`;
}

function careMotif({ secondary, accent }) {
  return `<circle cx="1040" cy="460" r="280" fill="#ffffff" opacity=".20"/>
    <circle cx="1170" cy="460" r="180" fill="${escapeXml(secondary)}" opacity=".32"/>
    <rect x="910" y="610" width="420" height="120" rx="60" fill="${escapeXml(accent)}" opacity=".28"/>`;
}

function beautyMotif({ secondary, accent }) {
  return `<circle cx="1010" cy="420" r="260" fill="${escapeXml(secondary)}" opacity=".34"/>
    <circle cx="1190" cy="560" r="240" fill="#ffffff" opacity=".20"/>
    <path d="M770 690 C980 520 1210 540 1450 700" fill="none" stroke="${escapeXml(accent)}" stroke-width="80" opacity=".30"/>`;
}

function commerceMotif({ secondary, accent }) {
  return `<rect x="830" y="260" width="240" height="360" rx="54" fill="#ffffff" opacity=".18"/>
    <rect x="1120" y="210" width="300" height="450" rx="64" fill="${escapeXml(secondary)}" opacity=".28"/>
    <circle cx="980" cy="700" r="100" fill="${escapeXml(accent)}" opacity=".40"/>
    <circle cx="1240" cy="735" r="110" fill="#ffffff" opacity=".18"/>`;
}

function galleryMotif({ secondary, accent }) {
  return `<rect x="770" y="190" width="260" height="330" rx="30" fill="#ffffff" opacity=".18"/>
    <rect x="1070" y="260" width="360" height="430" rx="34" fill="${escapeXml(secondary)}" opacity=".26"/>
    <rect x="880" y="560" width="360" height="260" rx="34" fill="${escapeXml(accent)}" opacity=".22"/>`;
}

function agencyMotif({ secondary, accent }) {
  return `<circle cx="1010" cy="420" r="260" fill="${escapeXml(secondary)}" opacity=".26"/>
    <rect x="850" y="540" width="540" height="180" rx="58" fill="#ffffff" opacity=".16"/>
    <circle cx="1240" cy="610" r="170" fill="${escapeXml(accent)}" opacity=".30"/>`;
}

function escapeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
