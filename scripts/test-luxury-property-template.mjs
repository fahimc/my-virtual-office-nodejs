import assert from 'node:assert/strict';
import {
  isLuxuryPropertyBrief,
  luxuryPropertySectionCatalog,
  renderLuxuryPropertyWebsite
} from '../src/templates/luxuryPropertyTemplate.js';
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

console.log('Luxury/property template routing and reusable section checks passed.');
