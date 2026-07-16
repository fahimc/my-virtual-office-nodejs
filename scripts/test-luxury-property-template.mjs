import assert from 'node:assert/strict';
import {
  isLuxuryPropertyBrief,
  luxuryPropertySectionCatalog,
  renderLuxuryPropertyWebsite
} from '../src/templates/luxuryPropertyTemplate.js';
import {
  premiumTemplateCatalog,
  premiumTemplateConfigForBrief,
  premiumTemplateForBrief
} from '../src/templates/premiumTemplateCatalog.js';
import { DeveloperPlanningService } from '../dist/agency/tools/developer/developerPlanningService.js';

assert.equal(isLuxuryPropertyBrief('Luxury residential property and private acquisition website'), true);
assert.equal(isLuxuryPropertyBrief('Hospitality resort with private villas'), true);
assert.equal(isLuxuryPropertyBrief('B2B payroll SaaS dashboard'), false);

const planningService = new DeveloperPlanningService({}, {}, process.cwd());
assert.equal(planningService.selectTemplate('Luxury residential property developer'), 'luxuryPropertyTemplate');
assert.equal(planningService.selectTemplate('Private members hotel and resort'), 'luxuryPropertyTemplate');
assert.equal(planningService.selectTemplate('B2B payroll SaaS dashboard'), 'saasTemplate');

const requiredSections = [
  'LuxuryMediaHero',
  'AssetPortfolioGrid',
  'LuxuryServiceRows',
  'CinematicStatementSection',
  'PrivateInquiryForm'
];

for (const section of requiredSections) {
  assert.ok(luxuryPropertySectionCatalog[section], `${section} must remain available for reuse`);
}

const html = renderLuxuryPropertyWebsite({
  brand: 'Aurelis',
  headline: 'Exceptional property, represented with discretion.',
  paletteId: 'sage-stone-architecture',
  fontGroupId: 'editorial-property',
  images: Array.from({ length: 8 }, (_, index) => `/property-${index + 1}.jpg`)
});

assert.match(html, /template-full-bleed-hero/);
assert.match(html, /href="#sections"/);
assert.match(html, /data-palette="sage-stone-architecture"/);
assert.match(html, /data-font-group="editorial-property"/);
assert.match(html, /id="luxuryEnquiryForm"/);
assert.doesNotMatch(html, /template section/i);
assert.doesNotMatch(html, />\s*(?:undefined|null)\s*</i);

assert.equal(premiumTemplateCatalog.length, 6);
assert.equal(new Set(premiumTemplateCatalog.map(item => item.id)).size, premiumTemplateCatalog.length);
assert.equal(premiumTemplateForBrief('boutique hotel and private country retreat')?.id, 'luxury-hospitality-retreat');
assert.equal(premiumTemplateForBrief('architecture and interior design studio')?.id, 'luxury-architecture-practice');
assert.equal(premiumTemplateForBrief('independent family office for private wealth')?.id, 'luxury-private-wealth');
assert.equal(premiumTemplateForBrief('integrative wellness and longevity practice')?.id, 'luxury-wellness-sanctuary');
assert.equal(premiumTemplateForBrief('fine jewellery atelier')?.id, 'luxury-jewellery-atelier');

for (const template of premiumTemplateCatalog) {
  assert.equal(template.images.length, 8, `${template.id} must expose a complete curated image set`);
  assert.ok(template.images.every(image => image.includes(`/premium-assets/${template.id}/`)));
  assert.ok(template.paletteId, `${template.id} must define its validated default palette`);
  assert.ok(template.fontGroupId, `${template.id} must define its validated font pairing`);
  const rendered = renderLuxuryPropertyWebsite({
    ...template.luxuryConfig,
    mode: template.luxuryMode,
    brand: template.client,
    headline: template.headline,
    summary: template.subhead,
    heroKicker: template.badge,
    primaryCta: template.cta,
    secondaryCta: template.secondary,
    metrics: template.metrics,
    images: Array.from({ length: 8 }, (_, index) => `/${template.id}-${index + 1}.jpg`)
  });
  const escapedClient = template.client.replaceAll('&', '&amp;');
  assert.match(rendered, new RegExp(escapedClient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(rendered, new RegExp(template.luxuryConfig.assetsHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(rendered, /template-full-bleed-hero/);
  assert.match(rendered, /id="luxuryEnquiryForm"/);
  assert.doesNotMatch(rendered, />\s*(?:undefined|null)\s*</i);
}

const personalized = premiumTemplateConfigForBrief('boutique hospitality resort', 'The Rowan');
assert.equal(personalized?.template.id, 'luxury-hospitality-retreat');
assert.match(personalized?.config.pageTitle || '', /The Rowan/);
assert.doesNotMatch(JSON.stringify(personalized?.config), /Morrow House/);

console.log('Luxury/property routing, premium category presets, and reusable section checks passed.');
