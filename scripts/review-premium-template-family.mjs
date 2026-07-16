import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { premiumTemplateCatalog } from '../src/templates/premiumTemplateCatalog.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const credits = JSON.parse(await readFile(path.join(publicDir, 'template-gallery', 'premium-assets', 'credits.json'), 'utf8'));
assert.equal(credits.assets.length, premiumTemplateCatalog.length * 8, 'Every premium template must have eight curated, credited assets');

for (const template of premiumTemplateCatalog) {
  const filePath = path.join(publicDir, 'template-gallery', 'templates', template.id, 'index.html');
  const html = await readFile(filePath, 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const images = [...html.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map(match => match[1]);

  assert.match(html, /class="template-full-bleed-hero lux-hero/);
  assert.match(html, /data-palette="[^"]+"/);
  assert.match(html, /data-font-group="[^"]+"/);
  assert.ok(html.includes(template.headline), `${template.id} must use its category headline`);
  assert.ok(html.includes(template.luxuryConfig.assetsHeading), `${template.id} must use its category portfolio heading`);
  assert.ok(html.includes(template.luxuryConfig.servicesHeading), `${template.id} must use its category service heading`);
  if (template.luxuryConfig.contactHeading) {
    assert.ok(html.includes(template.luxuryConfig.contactHeading), `${template.id} must use its category enquiry heading`);
  }
  assert.equal(new Set(ids).size, ids.length, `${template.id} must not contain duplicate element IDs`);
  assert.ok(images.length >= 7, `${template.id} must contain the complete editorial image sequence`);
  assert.doesNotMatch(html, /template section|page structure|generated preview route|lorem ipsum|>\s*(?:undefined|null)\s*</i);

  assert.ok(
    images.every(source => source.includes(`/template-gallery/premium-assets/${template.id}/`)),
    `${template.id} must use only its curated category image set`
  );
  assert.ok(new Set(images).size >= 7, `${template.id} must use a distinct editorial image sequence`);
  for (const source of new Set(images)) {
    if (!source.startsWith('/')) continue;
    const pathname = source.split('?')[0];
    await access(path.join(publicDir, pathname.replace(/^\/+/, '')));
  }
}

console.log(`Reviewed ${premiumTemplateCatalog.length} premium editorial templates: content, imagery, structure, and assets passed.`);
