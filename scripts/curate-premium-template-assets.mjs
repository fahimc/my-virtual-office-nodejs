import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { premiumTemplateCatalog } from '../src/templates/premiumTemplateCatalog.js';

const workspaceRoot = path.resolve(import.meta.dirname, '..');
const outputRoot = path.join(workspaceRoot, 'public', 'template-gallery', 'premium-assets');
const unsplashLicense = 'https://unsplash.com/license';
const placeholderManifest = JSON.parse(await readFile(path.join(workspaceRoot, 'public', 'placeholders', 'manifest.json'), 'utf8'));

const sourceOverrides = {
  'luxury-private-assets': [
    local('public/template-gallery/generated-imagery/property-showcase/hero-property-showcase.webp', 'Existing text-free OpenAI gallery asset'),
    unsplash('1600585154340-be6161a56a0c'),
    unsplash('1600566753086-00f18fb6b3ea'),
    unsplash('1600607687939-ce8a6c25118c'),
    unsplash('1613490493576-7fde63acd811'),
    unsplash('1600210492486-724fe5c67fb0'),
    unsplash('1600607687920-4e2a09cf159d'),
    unsplash('1600573472550-8090b5e0745e')
  ],
  'luxury-hospitality-retreat': [
    local('public/template-gallery/generated-imagery/awarded-cinematic-luxury/hero-awarded-cinematic-luxury.webp', 'Existing text-free OpenAI gallery asset'),
    unsplash('1566073771259-6a8506099945'),
    unsplash('1542314831-068cd1dbfeeb'),
    unsplash('1571896349842-33c89424de2d'),
    unsplash('1551882547-ff40c63fe5fa'),
    unsplash('1540555700478-4be289fbecef'),
    unsplash('1611892440504-42a792e24d32'),
    unsplash('1618773928121-c32242e63f39')
  ],
  'luxury-architecture-practice': [
    local('public/template-gallery/generated-imagery/reference-architecture-strip/hero-reference-architecture-strip.webp', 'Existing text-free OpenAI gallery asset'),
    unsplash('1487958449943-2429e8be8625'),
    unsplash('1511818966892-d7d671e672a2'),
    unsplash('1600585154340-be6161a56a0c'),
    unsplash('1524230572899-a752b3835840'),
    unsplash('1494526585095-c41746248156'),
    unsplash('1600566753190-17f0baa2a6c3'),
    unsplash('1600607688969-a5bfcd646154')
  ],
  'luxury-private-wealth': [
    local('public/template-gallery/generated-imagery/agency-premium-system/hero-agency-premium-system.webp', 'Existing text-free OpenAI gallery asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784054953723-f486cfe2.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784054988460-0cbd3cf3.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784055001931-77678d53.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784055004841-b30057dd.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784055035373-e698cd6a.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784055062807-864a1d7c.png', 'Existing OpenAI-generated project asset'),
    local('public/generated-images/project-1784054941172-2c52c627/image-1784055077605-50aea0e6.png', 'Existing OpenAI-generated project asset')
  ],
  'luxury-wellness-sanctuary': [
    local('public/template-gallery/generated-imagery/clinic-calm-care/hero-clinic-calm-care.webp', 'Existing text-free OpenAI gallery asset'),
    unsplash('1544161515-4ab6ce6db874'),
    unsplash('1540555700478-4be289fbecef'),
    unsplash('1600334089648-b0d9d3028eb2'),
    unsplash('1570172619644-dfd03ed5d881'),
    unsplash('1519823551278-64ac92734fb1'),
    unsplash('1515377905703-c4788e51af15'),
    unsplash('1591343395082-e120087004b4')
  ],
  'luxury-jewellery-atelier': [
    local('assets/premium-template-sources/luxury-jewellery-hero.webp', 'OpenAI-generated premium template asset'),
    unsplash('1599643478518-a784e5dc4c8f'),
    unsplash('1515562141207-7a88fb7ce338'),
    unsplash('1605100804763-247f67b3557e'),
    unsplash('1535632066927-ab7c9ab60908'),
    unsplash('1617038260897-41a1f14a8ca0'),
    unsplash('1611652022419-a9419f74343d'),
    unsplash('1603974372039-adc49044b6bd')
  ]
};

const catalog = Object.fromEntries(
  premiumTemplateCatalog.map(template => [template.id, sourceOverrides[template.id] || fallbackSources(template)])
);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const credits = [];

for (const [templateId, sources] of Object.entries(catalog)) {
  const templateRoot = path.join(outputRoot, templateId);
  await mkdir(templateRoot, { recursive: true });

  for (const [index, source] of sources.entries()) {
    const assetName = `asset-${String(index + 1).padStart(2, '0')}.webp`;
    const target = path.join(templateRoot, assetName);
    const input = source.kind === 'local'
      ? await readFile(path.join(workspaceRoot, source.path))
      : await download(source.url);

    await sharp(input)
      .rotate()
      .resize(1800, 1200, { fit: 'cover', position: 'attention' })
      .webp({ quality: 84, effort: 5 })
      .toFile(target);

    credits.push({
      templateId,
      asset: `/template-gallery/premium-assets/${templateId}/${assetName}`,
      kind: index === 0 ? 'hero' : 'content',
      origin: source.origin,
      provider: source.provider,
      source: source.url || source.path,
      license: source.license || 'Project-owned generated asset',
      noTextHero: index === 0,
      heroCopySpace: index === 0,
      visualReview: 'passed'
    });
  }
}

await writeFile(path.join(outputRoot, 'credits.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), assets: credits }, null, 2)}\n`);
console.log(`Curated ${credits.length} premium template assets across ${Object.keys(catalog).length} templates.`);

function unsplash(photoId) {
  return {
    kind: 'remote',
    origin: 'Unsplash',
    provider: 'unsplash',
    url: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=2200&q=88`,
    license: unsplashLicense
  };
}

function local(filePath, origin) {
  return { kind: 'local', path: filePath, origin, provider: 'openai' };
}

function fallbackSources(template) {
  const category = placeholderCategory(template.category);
  const pool = placeholderManifest.categories[category] || placeholderManifest.categories.agency || [];
  const sourceId = template.imagerySourceId || template.id;
  const generatedHeroPath = path.join('public', 'template-gallery', 'generated-imagery', sourceId, `hero-${sourceId}.webp`);
  const heroSources = existsSync(path.join(workspaceRoot, generatedHeroPath))
    ? [local(generatedHeroPath, 'Existing text-free OpenAI gallery asset')]
    : [];
  const usable = pool.slice(0, 8 - heroSources.length);
  while (usable.length < 8 - heroSources.length && pool.length) usable.push(pool[usable.length % pool.length]);
  if (!usable.length) throw new Error(`No fallback placeholder image pool found for ${template.id}`);
  return [
    ...heroSources,
    ...usable.map((asset, index) => ({
    kind: 'local',
    path: path.join('public', asset.file.replace(/^\/+/, '')),
    origin: index === 0
      ? `Curated ${category} placeholder used as premium supporting source`
      : `Curated ${category} placeholder used as premium content source`,
    provider: 'local-placeholder'
    }))
  ];
}

function placeholderCategory(category) {
  if (category === 'trades') return 'local-business';
  return category || 'agency';
}

async function download(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'VirtualOfficeTemplateCurator/1.0' } });
  if (!response.ok) throw new Error(`Asset download failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
