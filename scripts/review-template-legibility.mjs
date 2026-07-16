import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, '..', 'public', 'template-gallery', 'templates');
const imageryManifest = JSON.parse(await readFile(path.join(__dirname, '..', 'public', 'template-gallery', 'generated-imagery', 'manifest.json'), 'utf8'));

const templateIds = (await readdir(templatesDir))
  .filter(async name => (await stat(path.join(templatesDir, name))).isDirectory());

const results = [];

for (const id of await Promise.all(templateIds)) {
  const html = await readFile(path.join(templatesDir, id, 'index.html'), 'utf8');
  const firstSection = html.match(/<section[\s\S]*?<\/section>/i)?.[0] || '';
  const firstHeroStart = html.indexOf('<section');
  const firstRoundedBox = html.indexOf('rounded-[2rem]');
  const sourceId = firstSection.match(/\/template-gallery\/generated-imagery\/([^/]+)\//)?.[1] || id;
  const heroRecord = imageryManifest.templates?.[sourceId]?.images?.find(image => image.kind === 'hero');
  const checks = {
    firstSectionIsFullBleed: firstSection.includes('template-full-bleed-hero'),
    hasGeneratedHeroImage: firstSection.includes('/template-gallery/generated-imagery/'),
    heroImageMarkedNoText: Boolean(heroRecord?.noTextHero),
    heroImageHasCopySpace: Boolean(heroRecord?.heroCopySpace),
    heroImageIsOpenAiGenerated: heroRecord?.provider === 'openai',
    heroImagePolicyPresent: /no text|must not contain text/i.test(imageryManifest.heroPolicy?.rule || ''),
    hasContrastScrim: /rgba\(0,0,0,\.(?:4|5|6|7|8)/.test(firstSection),
    hasWhiteOverlayCopy: firstSection.includes('text-white'),
    hasPrimaryCta: firstSection.includes('btn btn-primary'),
    hasSecondaryCta: firstSection.includes(templateSecondaryMarker()),
    hasMetricStrip: (firstSection.match(/border-r border-white\/20/g) || []).length >= 2,
    boxedHeroNotFirst: firstRoundedBox === -1 || firstRoundedBox > firstHeroStart
  };
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  results.push({ id, failed });
}

const failedTemplates = results.filter(result => result.failed.length);

if (failedTemplates.length) {
  console.table(failedTemplates);
  throw new Error(`${failedTemplates.length} template hero legibility reviews failed`);
}

console.table(results.map(result => ({ template: result.id, status: 'passed' })));
console.log(`Template legibility review passed for ${results.length} templates.`);

function templateSecondaryMarker() {
  return 'href="#sections"';
}
