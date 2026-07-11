import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHeroSection } from './template-hero-sections.mjs';
import { enrichedPalettes, paletteCollection, paletteStyleBlock, recommendedPaletteForTemplate } from './color-palette-engine.mjs';
import { enrichedFontGroups, fontCollection, fontImportBlock, fontStyleBlock, recommendedFontGroupForTemplate } from './font-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const outDir = path.join(publicDir, 'template-gallery');
const manifest = JSON.parse(await readFile(path.join(publicDir, 'placeholders', 'manifest.json'), 'utf8'));

const templates = [
  {
    id: 'fruit-commerce-splash',
    category: 'food-drink',
    theme: 'agency-preview',
    title: 'Fruit Commerce Splash',
    client: 'Zestora',
    badge: 'Product launch',
    headline: 'Fruit drinks that look as fresh as they taste.',
    subhead: 'A bright commerce homepage for bottled drinks, flavour packs, subscriptions, and wholesale enquiries.',
    cta: 'Shop flavours',
    secondary: 'Build a case',
    palette: ['#ffb703', '#fb7185', '#22c55e'],
    metrics: [['6', 'launch flavours'], ['24h', 'dispatch'], ['4.8', 'early rating']],
    sections: ['Hero', 'Product cards', 'Mixed case builder', 'Wholesale CTA', 'FAQ'],
    inspiration: ['bold product cards', 'oversized editorial typography', 'bright ecommerce landing page']
  },
  {
    id: 'saas-command-center',
    category: 'saas',
    theme: 'winter',
    title: 'SaaS Command Center',
    client: 'Northstar OS',
    badge: 'B2B SaaS',
    headline: 'Run the whole operation from one calm dashboard.',
    subhead: 'A product-led website for workflow software, analytics, automation, and team visibility.',
    cta: 'Book demo',
    secondary: 'View platform',
    palette: ['#2563eb', '#14b8a6', '#111827'],
    metrics: [['38%', 'less admin'], ['12k', 'tasks routed'], ['99.9%', 'uptime']],
    sections: ['Hero', 'Feature grid', 'Dashboard preview', 'Integrations', 'Pricing'],
    inspiration: ['glass dashboard cards', 'clean SaaS hero', 'product UI depth']
  },
  {
    id: 'local-trades-proof',
    category: 'trades',
    theme: 'corporate',
    title: 'Local Trades Proof',
    client: 'Ashford Heating',
    badge: 'Local service',
    headline: 'Fast repairs, tidy installs, and quotes without the runaround.',
    subhead: 'A trust-first lead generation site for plumbers, electricians, builders, and repair teams.',
    cta: 'Request a quote',
    secondary: 'See services',
    palette: ['#f97316', '#0f172a', '#38bdf8'],
    metrics: [['24/7', 'emergency cover'], ['900+', 'jobs completed'], ['4.9', 'local rating']],
    sections: ['Emergency hero', 'Service cards', 'Reviews', 'Areas covered', 'Contact form'],
    inspiration: ['high trust service cards', 'strong contact CTA', 'local proof blocks']
  },
  {
    id: 'beauty-booking-editorial',
    category: 'beauty',
    theme: 'cupcake',
    title: 'Beauty Booking Editorial',
    client: 'Luna Studio',
    badge: 'Beauty & salon',
    headline: 'Soft-touch treatments with a polished booking flow.',
    subhead: 'A premium salon site for services, portfolios, treatment menus, gift cards, and bookings.',
    cta: 'Book treatment',
    secondary: 'View menu',
    palette: ['#f9a8d4', '#7c2d12', '#ffffff'],
    metrics: [['18', 'treatments'], ['5k+', 'clients'], ['4.9', 'rating']],
    sections: ['Editorial hero', 'Treatment cards', 'Gallery', 'Specialists', 'Booking CTA'],
    inspiration: ['soft editorial layout', 'luxury service cards', 'large beauty imagery']
  },
  {
    id: 'clinic-calm-care',
    category: 'healthcare',
    theme: 'emerald',
    title: 'Clinic Calm Care',
    client: 'Harbour Clinic',
    badge: 'Healthcare',
    headline: 'Clear care pathways, without the confusion.',
    subhead: 'A calm healthcare website for appointments, services, patient information, and trust.',
    cta: 'Book appointment',
    secondary: 'Find a service',
    palette: ['#10b981', '#2563eb', '#ecfeff'],
    metrics: [['12', 'specialists'], ['same day', 'triage'], ['AA', 'contrast target']],
    sections: ['Care hero', 'Service finder', 'Clinician cards', 'Patient info', 'Accessible forms'],
    inspiration: ['calm healthcare web design', 'clear appointment flow', 'accessible service cards']
  },
  {
    id: 'restaurant-night-menu',
    category: 'restaurant',
    theme: 'sunset',
    title: 'Restaurant Night Menu',
    client: 'Ember Table',
    badge: 'Restaurant',
    headline: 'Seasonal plates, warm rooms, and a table worth booking.',
    subhead: 'An atmospheric hospitality site for menus, bookings, private dining, and venue storytelling.',
    cta: 'Reserve table',
    secondary: 'View menu',
    palette: ['#ea580c', '#451a03', '#fde68a'],
    metrics: [['32', 'seasonal dishes'], ['2', 'private rooms'], ['4.8', 'guest score']],
    sections: ['Image-led hero', 'Menu highlights', 'Private dining', 'Reviews', 'Booking'],
    inspiration: ['warm restaurant landing page', 'menu card design', 'immersive hospitality photography']
  },
  {
    id: 'property-showcase',
    category: 'real-estate',
    theme: 'winter',
    title: 'Property Showcase',
    client: 'Aster Homes',
    badge: 'Real estate',
    headline: 'Homes presented with the polish buyers expect.',
    subhead: 'A real-estate template for featured listings, valuation requests, neighbourhood guides, and viewings.',
    cta: 'Book valuation',
    secondary: 'Browse homes',
    palette: ['#0f172a', '#bfdbfe', '#f8fafc'],
    metrics: [['48h', 'listing prep'], ['120+', 'homes sold'], ['97%', 'asking achieved']],
    sections: ['Hero listing', 'Property cards', 'Valuation CTA', 'Area guides', 'Agent profile'],
    inspiration: ['image-led property website', 'premium listing cards', 'clean estate agency layout']
  },
  {
    id: 'portfolio-creator-grid',
    category: 'portfolio',
    theme: 'lemonade',
    title: 'Portfolio Creator Grid',
    client: 'Maya Finch',
    badge: 'Portfolio',
    headline: 'A sharp portfolio that makes the work impossible to miss.',
    subhead: 'A creator portfolio for photography, design, case studies, creative services, and enquiries.',
    cta: 'View work',
    secondary: 'Start a brief',
    palette: ['#111827', '#facc15', '#ffffff'],
    metrics: [['42', 'projects'], ['9', 'awards'], ['3', 'specialisms']],
    sections: ['Editorial hero', 'Project gallery', 'Services', 'Testimonials', 'Contact'],
    inspiration: ['portfolio masonry grid', 'creator landing page', 'bold personal brand']
  },
  {
    id: 'agency-premium-system',
    category: 'agency',
    theme: 'corporate',
    title: 'Agency Premium System',
    client: 'Signal & Co',
    badge: 'Agency',
    headline: 'Strategy, design, and launches without the agency fog.',
    subhead: 'A polished agency site for positioning, service packages, case studies, process, and lead capture.',
    cta: 'Start project',
    secondary: 'See work',
    palette: ['#4338ca', '#14b8a6', '#111827'],
    metrics: [['28', 'launches'], ['6wk', 'average sprint'], ['3x', 'lead lift']],
    sections: ['Hero', 'Capabilities', 'Case studies', 'Process', 'Proposal CTA'],
    inspiration: ['premium agency website', 'case study cards', 'service design system']
  },
  {
    id: 'fitness-membership-flow',
    category: 'fitness',
    theme: 'night',
    title: 'Fitness Membership Flow',
    client: 'Forge Fit',
    badge: 'Fitness',
    headline: 'Training plans, class energy, and membership conversion in one place.',
    subhead: 'A fitness site for classes, trainers, transformation proof, memberships, and trial passes.',
    cta: 'Claim trial',
    secondary: 'View classes',
    palette: ['#facc15', '#ef4444', '#111827'],
    metrics: [['36', 'classes weekly'], ['8', 'coaches'], ['30d', 'trial plan']],
    sections: ['Action hero', 'Class cards', 'Trainer roster', 'Results', 'Membership CTA'],
    inspiration: ['high contrast fitness landing page', 'movement photography', 'membership pricing cards']
  },
  {
    id: 'fashion-shop-editorial',
    category: 'ecommerce',
    theme: 'cupcake',
    title: 'Fashion Shop Editorial',
    client: 'Vale Supply',
    badge: 'Ecommerce',
    headline: 'A collection launch with editorial pace and shop clarity.',
    subhead: 'A boutique ecommerce template for collections, lookbooks, product cards, and seasonal campaigns.',
    cta: 'Shop collection',
    secondary: 'See lookbook',
    palette: ['#111827', '#f9a8d4', '#f8fafc'],
    metrics: [['24', 'new pieces'], ['3', 'drops'], ['48h', 'shipping']],
    sections: ['Campaign hero', 'Collection cards', 'Lookbook gallery', 'Benefits', 'Newsletter'],
    inspiration: ['fashion ecommerce homepage', 'lookbook grid', 'editorial product cards']
  },
  {
    id: 'learning-platform',
    category: 'local-business',
    theme: 'garden',
    title: 'Learning Platform',
    client: 'BrightPath',
    badge: 'Education',
    headline: 'Courses that feel structured, supportive, and easy to start.',
    subhead: 'An education template for programmes, course cards, outcomes, tutors, and enrolment.',
    cta: 'Explore courses',
    secondary: 'Talk to advisor',
    palette: ['#16a34a', '#2563eb', '#fefce8'],
    metrics: [['18', 'courses'], ['92%', 'completion'], ['1:1', 'support']],
    sections: ['Outcome hero', 'Course cards', 'Learning path', 'Tutor proof', 'Enquiry'],
    inspiration: ['education landing page', 'course cards', 'friendly learning journey']
  },
  {
    id: 'awarded-museum-editorial',
    category: 'portfolio',
    theme: 'night',
    awardInspired: true,
    awardPattern: 'museum-editorial',
    title: 'Museum Editorial',
    client: 'Warhol Archive',
    badge: 'Award-inspired art site',
    headline: 'An exhibition homepage with the confidence of a gallery wall.',
    subhead: 'A visual arts template shaped by award-gallery patterns: restrained navigation, dramatic cropping, archival captions, and cinematic object focus.',
    cta: 'Enter exhibition',
    secondary: 'View collection',
    palette: ['#f8fafc', '#ef4444', '#0f172a'],
    metrics: [['48', 'works'], ['7', 'rooms'], ['1960s', 'archive focus']],
    sections: ['Exhibition hero', 'Archive grid', 'Curator notes', 'Visit plan', 'Tickets'],
    inspiration: ['Webby 2026 Architecture Art Design winner Warhol Art', 'Awwwards art portfolio editorial', 'museum website immersive typography']
  },
  {
    id: 'awarded-cinematic-luxury',
    category: 'real-estate',
    theme: 'luxury',
    awardInspired: true,
    awardPattern: 'cinematic-luxury',
    title: 'Cinematic Luxury',
    client: 'Maison Atlas',
    badge: 'Luxury launch',
    headline: 'A quiet luxury launch built around atmosphere, scarcity, and desire.',
    subhead: 'A premium property/product template with dark editorial framing, slow reveal panels, concierge CTAs, and high-touch proof.',
    cta: 'Request private view',
    secondary: 'Explore story',
    palette: ['#120f0a', '#d6b46a', '#f8f1df'],
    metrics: [['12', 'private releases'], ['3', 'signature spaces'], ['1:1', 'concierge']],
    sections: ['Cinematic hero', 'Private release', 'Craft details', 'Concierge proof', 'Request access'],
    inspiration: ['CSS Winner Depo Luxe cinematic luxury', 'Awwwards luxury product storytelling', 'premium editorial interaction design']
  },
  {
    id: 'awarded-data-story',
    category: 'saas',
    theme: 'corporate',
    awardInspired: true,
    awardPattern: 'data-story',
    title: 'Data Story Observatory',
    client: 'TraceLab',
    badge: 'Data narrative',
    headline: 'Turn a complex dataset into a story people can act on.',
    subhead: 'A data-visualisation template with map-like cards, evidence modules, narrative steps, and clear reader takeaways.',
    cta: 'Explore the data',
    secondary: 'Read findings',
    palette: ['#0f766e', '#38bdf8', '#f8fafc'],
    metrics: [['140+', 'data sources'], ['9', 'regions'], ['3min', 'guided read']],
    sections: ['Data hero', 'Signal map', 'Insight cards', 'Method notes', 'Action CTA'],
    inspiration: ['Webby 2026 Best Data Visualization nominees', 'Reuters data quiz pattern', 'Climate TRACE visual narrative']
  },
  {
    id: 'awarded-kinetic-agency',
    category: 'agency',
    theme: 'cyberpunk',
    awardInspired: true,
    awardPattern: 'kinetic-agency',
    title: 'Kinetic Agency',
    client: 'Junction Lab',
    badge: 'Experimental studio',
    headline: 'A studio homepage that moves like a pitch deck and lands like a product.',
    subhead: 'An agency template inspired by motion-heavy award sites: kinetic type, diagonal work strips, capability chips, and bold proof moments.',
    cta: 'Start a sprint',
    secondary: 'See motion reel',
    palette: ['#a855f7', '#22d3ee', '#111827'],
    metrics: [['6wk', 'launch sprint'], ['40+', 'brand systems'], ['3x', 'lead lift']],
    sections: ['Kinetic hero', 'Work strip', 'Capability chips', 'Proof wall', 'Sprint CTA'],
    inspiration: ['Awwwards interaction design gallery', 'FWA experimental interaction patterns', 'Webby Best Home Page agency honorees']
  },
  {
    id: 'awarded-immersive-product',
    category: 'ecommerce',
    theme: 'sunset',
    awardInspired: true,
    awardPattern: 'immersive-product',
    title: 'Immersive Product Drop',
    client: 'Aether One',
    badge: 'Product experience',
    headline: 'A product drop with depth, motion, and a reason to scroll.',
    subhead: 'A launch template for objects, fashion, devices, and limited drops with layered product cards, feature hotspots, and pre-order flow.',
    cta: 'Join the drop',
    secondary: 'Inspect features',
    palette: ['#f97316', '#7c3aed', '#111827'],
    metrics: [['72h', 'early access'], ['5', 'feature layers'], ['1', 'limited drop']],
    sections: ['Drop hero', 'Feature orbit', 'Material story', 'Social proof', 'Preorder'],
    inspiration: ['Webby 2026 Best Home Page honoree Aether 1', 'Awwwards product launch sites', 'FWA immersive product websites']
  },
  {
    id: 'awarded-human-cause',
    category: 'healthcare',
    theme: 'emerald',
    awardInspired: true,
    awardPattern: 'human-cause',
    title: 'Human Cause Story',
    client: 'Ensaaf Foundation',
    badge: 'Cause campaign',
    headline: 'A campaign page that makes the human story impossible to skip.',
    subhead: 'A nonprofit/cause template with emotionally direct hierarchy, timeline evidence, donation prompts, and careful accessibility.',
    cta: 'Support the work',
    secondary: 'Read the story',
    palette: ['#064e3b', '#fbbf24', '#f8fafc'],
    metrics: [['25yr', 'timeline'], ['18k', 'records'], ['4', 'ways to help']],
    sections: ['Story hero', 'Evidence timeline', 'Impact cards', 'Donate', 'Updates'],
    inspiration: ['Webby Best Home Page honoree Ensaaf', 'public service award websites', 'accessible campaign storytelling']
  },
  {
    id: 'reference-property-search-overlay',
    category: 'real-estate',
    theme: 'winter',
    referenceInspired: true,
    heroPattern: 'property-search-overlay',
    title: 'Property Search Overlay',
    client: 'AsterKey',
    badge: 'Property search',
    headline: 'Where affordability meets sustainability.',
    subhead: 'A property platform hero with an immediate search task, glass filters, buyer proof, and listing intent above the fold.',
    cta: 'Search homes',
    secondary: 'View neighbourhoods',
    palette: ['#0f172a', '#e2e8f0', '#111827'],
    metrics: [['1.8k', 'active homes'], ['42', 'green-rated areas'], ['24h', 'viewing response']],
    sections: ['Search', 'Featured homes', 'Neighbourhoods', 'Buyer proof', 'Book viewing'],
    inspiration: ['uploaded reference: property search overlay', 'real estate search hero', 'glass filter interface']
  },
  {
    id: 'reference-mountain-journey',
    category: 'portfolio',
    theme: 'night',
    referenceInspired: true,
    heroPattern: 'travel-chips',
    title: 'Mountain Journey Hero',
    client: 'Gateway',
    badge: 'Travel concierge',
    headline: 'Crafting journeys, not just trips.',
    subhead: 'A full-bleed travel hero with headline emphasis, facility chips, social proof, and a concierge-style action.',
    cta: 'Consult us',
    secondary: 'Explore journeys',
    palette: ['#0f172a', '#f8fafc', '#94a3b8'],
    metrics: [['27', 'routes'], ['4.9', 'guest rating'], ['1:1', 'trip design']],
    sections: ['Tour guide', 'Travel package', 'Accommodation', 'Transport', 'Food', 'Online delivery'],
    inspiration: ['uploaded reference: mountain full-bleed travel hero', 'destination landing page', 'facility chip interface']
  },
  {
    id: 'reference-saas-carousel-growth',
    category: 'saas',
    theme: 'night',
    referenceInspired: true,
    heroPattern: 'centered-carousel',
    title: 'SaaS Carousel Growth',
    client: 'EoS',
    badge: 'Business automation',
    headline: 'More growth, less work. Get your time back.',
    subhead: 'A centered SaaS homepage with highlighted outcome words, a rounded media carousel, and a clean product-led CTA.',
    cta: 'Take control now',
    secondary: 'See workflow',
    palette: ['#1d1738', '#a7f3d0', '#ffffff'],
    metrics: [['31%', 'hours recovered'], ['8', 'workflows live'], ['2wk', 'setup sprint']],
    sections: ['Product', 'Problems', 'Features', 'Resources', 'Pricing'],
    inspiration: ['uploaded reference: centered SaaS carousel hero', 'dark product hero', 'rounded customer card carousel']
  },
  {
    id: 'reference-spaceage-product-stage',
    category: 'ecommerce',
    theme: 'night',
    referenceInspired: true,
    heroPattern: 'kinetic-persona',
    title: 'SpaceAge Product Stage',
    client: 'SpaceAge',
    badge: 'Launch experience',
    headline: 'A launch page with atmosphere, motion, and product focus.',
    subhead: 'A dark cinematic stage for fashion, products, creators, and immersive campaigns with metrics and preview media.',
    cta: 'Watch launch',
    secondary: 'View collection',
    palette: ['#11131d', '#ef4444', '#22d3ee'],
    metrics: [['01', 'hero product'], ['4', 'launch chapters'], ['90s', 'motion reel']],
    sections: ['Launch', 'Collection', 'Story', 'Preview', 'Reserve'],
    inspiration: ['uploaded reference: SpaceAge dark hero', 'cinematic product stage', 'floating preview panel']
  },
  {
    id: 'reference-interior-split-panel',
    category: 'real-estate',
    theme: 'sunset',
    referenceInspired: true,
    heroPattern: 'interior-split-panel',
    title: 'Interior Split Panel',
    client: 'HouseCut',
    badge: 'Interior studio',
    headline: 'A loft apartment arranged around modern comfort.',
    subhead: 'A split hero using an immersive room image and a warm editorial panel for interior designers, venues, and lifestyle brands.',
    cta: 'Plan the room',
    secondary: 'View spaces',
    palette: ['#f97316', '#111827', '#f8fafc'],
    metrics: [['14', 'room concepts'], ['3wk', 'design sprint'], ['1:1', 'consultation']],
    sections: ['Spaces', 'Services', 'Materials', 'Process', 'Consultation'],
    inspiration: ['uploaded reference: interior split orange panel', 'home interior landing page', 'warm editorial hero']
  },
  {
    id: 'reference-architecture-strip',
    category: 'real-estate',
    theme: 'corporate',
    referenceInspired: true,
    heroPattern: 'architecture-strip',
    title: 'Architecture Strip',
    client: 'Formline',
    badge: 'Architecture studio',
    headline: 'Building shapes for the future.',
    subhead: 'A minimal architecture hero with oversized typography, restrained copy, and a panoramic project strip.',
    cta: 'Discuss project',
    secondary: 'View portfolio',
    palette: ['#111827', '#f8fafc', '#cbd5e1'],
    metrics: [['36', 'built projects'], ['11', 'cities'], ['A+', 'energy target']],
    sections: ['Projects', 'Approach', 'Studio', 'Sustainability', 'Contact'],
    inspiration: ['uploaded reference: architecture minimal hero', 'panoramic project strip', 'minimal architecture website']
  }
];

await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, 'templates'), { recursive: true });

const referenceManifest = templates.map(template => ({
  id: template.id,
  title: template.title,
  source: template.referenceInspired
    ? 'Uploaded user reference image set - layout inspiration only; no external code or image assets copied'
    : template.awardInspired
    ? 'Award-site research inspiration only - no winning site code, layouts, or assets copied'
    : 'Dribbble search reference only - no images copied or stored',
  awardInspired: Boolean(template.awardInspired),
  referenceInspired: Boolean(template.referenceInspired),
  pattern: template.heroPattern || template.awardPattern || 'industry-template',
  searches: template.inspiration.map(term => `https://dribbble.com/search/${encodeURIComponent(term)}`),
  researchSources: template.awardInspired ? [
    'https://www.awwwards.com/websites/sites_of_the_day/',
    'https://www.awwwards.com/websites/interaction-design/',
    'https://www.cssdesignawards.com/',
    'https://www.csswinner.com/',
    'https://winners.webbyawards.com/winners/websites-and-mobile-sites'
  ] : []
}));

for (const template of templates) {
  const dir = path.join(outDir, 'templates', template.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), renderTemplate(template));
}

await writeFile(path.join(outDir, 'design-references.json'), `${JSON.stringify(referenceManifest, null, 2)}\n`);
await writeFile(path.join(outDir, 'palettes.json'), `${JSON.stringify({ ...paletteCollection, palettes: enrichedPalettes }, null, 2)}\n`);
await writeFile(path.join(outDir, 'font-groups.json'), `${JSON.stringify({ ...fontCollection, groups: enrichedFontGroups }, null, 2)}\n`);
await writeFile(path.join(outDir, 'index.html'), renderGallery());

console.log(`Generated ${templates.length} DaisyUI templates at /template-gallery/`);

function renderGallery() {
  const cards = templates.map(template => {
    const image = imageFor(template, 0);
    return `<article class="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
      <figure class="h-56"><img src="${image}" alt="" class="h-full w-full object-cover"></figure>
      <div class="card-body">
        <div class="flex flex-wrap gap-2"><span class="badge badge-primary">${template.badge}</span><span class="badge badge-outline">${template.theme}</span>${template.awardInspired ? '<span class="badge badge-secondary">award-inspired</span>' : ''}${template.referenceInspired ? '<span class="badge badge-accent">reference pattern</span>' : ''}</div>
        <h2 class="card-title text-2xl">${escapeHtml(template.title)}</h2>
        <p>${escapeHtml(template.subhead)}</p>
        <div class="flex gap-2">${template.palette.map(color => `<span class="h-6 w-6 rounded-full border border-base-300" style="background:${color}"></span>`).join('')}</div>
        <div class="card-actions justify-end">
          <a class="btn btn-primary rounded-full" href="/template-gallery/templates/${template.id}/">Open template</a>
        </div>
      </div>
    </article>`;
  }).join('');

  return htmlShell('Template Gallery', 'corporate', `<main class="min-h-screen bg-base-200">
    <section class="hero min-h-[54vh] bg-base-100">
      <div class="hero-content text-center max-w-5xl">
        <div>
          <div class="badge badge-primary badge-lg mb-5">DaisyUI template system</div>
          <h1 class="text-5xl md:text-7xl font-black leading-none">Review the agency template library.</h1>
          <p class="py-6 text-lg text-base-content/70">Original DaisyUI websites generated from industry and award-site pattern research. Award sites are used only for high-level inspiration; no external site code, layouts, or assets are copied.</p>
          <div class="join">
            <a class="btn btn-primary join-item rounded-full" href="#templates">Browse templates</a>
            <a class="btn btn-outline join-item rounded-full" href="/template-gallery/design-references.json">View references</a>
            <a class="btn btn-outline join-item rounded-full" href="/template-gallery/palettes.json">View palettes</a>
            <a class="btn btn-outline join-item rounded-full" href="/template-gallery/font-groups.json">View fonts</a>
          </div>
        </div>
      </div>
    </section>
    <section id="templates" class="mx-auto w-[min(1280px,calc(100%-2rem))] py-14">
      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">${cards}</div>
    </section>
  </main>`);
}

function renderTemplate(template) {
  const images = Array.from({ length: 8 }, (_, index) => imageFor(template, index));
  const features = template.sections.slice(0, 4);
  const defaultPaletteId = recommendedPaletteForTemplate(template);
  const defaultFontGroupId = recommendedFontGroupForTemplate(template);
  const faqs = [
    ['Can this be adapted to another brand?', 'Yes. Colour, copy, imagery, and section order can be swapped cleanly while preserving the visual direction.'],
    ['Is this mobile friendly?', 'Yes. Sections are mobile-first and expand into richer grid layouts on desktop.'],
    ['Can this support a real launch?', 'Yes. The page structure is ready for client-specific content, imagery, forms, and final approval.']
  ];

  return htmlShell(template.title, template.theme, `<main class="overflow-hidden">
    <header class="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur">
      <div class="navbar-start"><a class="btn btn-ghost text-xl font-black" href="/template-gallery/">${escapeHtml(template.client)}</a></div>
      <nav class="navbar-end hidden gap-4 md:flex">
        ${template.sections.slice(0, 4).map(item => `<a class="link link-hover" href="#${slug(item)}">${escapeHtml(item)}</a>`).join('')}
        <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </nav>
    </header>
    ${renderDesignControls(defaultPaletteId, defaultFontGroupId)}
    <section class="relative bg-base-100">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,color-mix(in_srgb,var(--color-primary)_22%,transparent),transparent_32rem),radial-gradient(circle_at_85%_20%,color-mix(in_srgb,var(--color-secondary)_16%,transparent),transparent_28rem)]"></div>
      <div class="relative mx-auto grid min-h-[calc(100vh-4rem)] w-[min(1280px,calc(100%-2rem))] items-center gap-10 py-14 lg:grid-cols-[.94fr_1.06fr] lg:py-20">
        <div>
          <span class="badge badge-primary badge-lg mb-5">${escapeHtml(template.badge)}</span>
          <h1 class="max-w-4xl text-4xl font-black leading-[.92] sm:text-5xl md:text-7xl xl:text-8xl">${escapeHtml(template.headline)}</h1>
          <p class="max-w-2xl py-6 text-xl leading-relaxed text-base-content/70">${escapeHtml(template.subhead)}</p>
          <div class="flex flex-wrap gap-3">
            <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
            <a class="btn btn-outline rounded-full" href="#sections">${escapeHtml(template.secondary)}</a>
          </div>
          <div class="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow">
            ${template.metrics.map(([value, label]) => `<div class="border-r border-base-300 p-4 last:border-r-0"><div class="text-2xl font-black md:text-4xl">${escapeHtml(value)}</div><div class="mt-1 text-xs text-base-content/60 md:text-sm">${escapeHtml(label)}</div></div>`).join('')}
          </div>
        </div>
        ${renderHeroSection(template, images)}
      </div>
    </section>
    <section id="sections" class="bg-base-200 py-20">
      <div class="mx-auto w-[min(1180px,calc(100%-2rem))]">
        <div class="mb-8 max-w-3xl">
          <span class="badge badge-secondary badge-lg mb-4">Page structure</span>
          <h2 class="text-4xl font-black md:text-6xl">${escapeHtml(sectionHeading(template))}</h2>
        </div>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          ${features.map((item, index) => `<article id="${slug(item)}" class="card bg-base-100 shadow-xl border border-base-300 agency-rise-in" style="--delay:${index * 80}ms"><div class="card-body"><div class="badge badge-primary">${index + 1}</div><h3 class="card-title">${escapeHtml(item)}</h3><p>${escapeHtml(featureCopy(template, item, index))}</p></div></article>`).join('')}
        </div>
      </div>
    </section>
    <section class="py-20">
      <div class="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <span class="badge badge-accent badge-lg mb-4">Visual proof</span>
          <h2 class="text-4xl font-black md:text-6xl">${escapeHtml(galleryHeading(template))}</h2>
          <p class="mt-5 text-lg text-base-content/70">${escapeHtml(galleryCopy(template))}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          ${images.slice(1, 5).map((image, index) => `<figure class="overflow-hidden rounded-box shadow-xl ${index === 0 ? 'sm:row-span-2' : ''}"><img src="${image}" alt="" class="h-full min-h-56 w-full object-cover transition duration-300 hover:scale-105"></figure>`).join('')}
        </div>
      </div>
    </section>
    <section class="bg-base-200 py-20">
      <div class="mx-auto w-[min(980px,calc(100%-2rem))]">
        <span class="badge badge-primary badge-lg mb-4">Questions</span>
        <h2 class="mb-8 text-4xl font-black md:text-6xl">Useful details before someone takes action.</h2>
        <div class="space-y-3">${faqs.map(([question, answer]) => `<div class="collapse collapse-arrow bg-base-100 border border-base-300"><input type="checkbox"><div class="collapse-title text-xl font-bold">${question}</div><div class="collapse-content"><p>${answer}</p></div></div>`).join('')}</div>
      </div>
    </section>
    <section id="contact" class="hero bg-neutral py-20 text-neutral-content">
      <div class="hero-content text-center">
        <div class="max-w-3xl">
          <h2 class="text-4xl font-black md:text-6xl">Ready to adapt this direction?</h2>
          <p class="py-6 text-lg text-neutral-content/75">${escapeHtml(finalCtaCopy(template))}</p>
          <a class="btn btn-primary rounded-full" href="/template-gallery/">Back to gallery</a>
        </div>
      </div>
    </section>
  </main>`, { paletteId: defaultPaletteId, fontGroupId: defaultFontGroupId });
}

function sectionHeading(template) {
  if (template.category === 'food-drink') return 'A shopping flow that makes flavour, packs, and wholesale easy to understand.';
  if (template.category === 'saas') return 'A product story that moves from value to proof to demo request.';
  if (template.category === 'trades') return 'Trust, services, proof, and contact arranged for local buyers.';
  if (template.category === 'restaurant') return 'Atmosphere, menus, and reservations without burying the booking action.';
  if (template.category === 'healthcare') return 'Care pathways, credibility, and accessible appointment actions.';
  if (template.category === 'fitness') return 'Class energy, proof, and memberships in a sharper conversion flow.';
  return 'A finished section system with a stronger visual point of view.';
}

function featureCopy(template, item, index) {
  const defaults = [
    `Introduces ${item.toLowerCase()} with a clear job in the conversion path.`,
    `Keeps the content specific to ${template.client} with a consistent card and spacing rhythm.`,
    `Supports quick scanning on mobile and richer comparison on desktop.`,
    `Keeps the next action visible without flattening the page into a generic layout.`
  ];
  return defaults[index] || defaults[0];
}

function galleryHeading(template) {
  if (template.category === 'portfolio') return 'A gallery that makes the work carry the page.';
  if (template.category === 'ecommerce') return 'Lookbook moments balanced with product clarity.';
  if (template.category === 'restaurant') return 'Texture, menu rhythm, and booking confidence.';
  if (template.category === 'saas') return 'Product proof that feels useful rather than decorative.';
  return 'Visual proof that supports the offer instead of filling space.';
}

function galleryCopy(template) {
  return `The ${template.title} direction uses category-specific image rhythm, proof cards, and action blocks so the page has a recognisable design idea before final brand content is added.`;
}

function finalCtaCopy(template) {
  return `Use this ${template.badge.toLowerCase()} direction as a starting point for a client-specific brief, visual QA pass, and final preview approval.`;
}

function renderPaletteSwitcher(defaultPaletteId) {
  const selected = enrichedPalettes.find(palette => palette.id === defaultPaletteId) || enrichedPalettes[0];
  return `<aside class="sticky top-[4.1rem] z-20 border-b border-base-300 bg-base-100/92 px-4 py-3 shadow-sm backdrop-blur">
    <div class="mx-auto flex w-[min(1280px,calc(100%-1rem))] flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.2em] text-base-content/55">Palette engine</p>
        <p id="palette-summary" class="text-sm text-base-content/70">${escapeHtml(selected.name)} - ${escapeHtml(selected.style)}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div id="palette-swatches" class="flex gap-1">${renderPaletteSwatches(selected)}</div>
        <select id="palette-select" class="select select-bordered select-sm w-64" aria-label="Choose website colour palette">
          ${enrichedPalettes.map(palette => `<option value="${palette.id}" ${palette.id === defaultPaletteId ? 'selected' : ''}>${escapeHtml(palette.name)}</option>`).join('')}
        </select>
        <span id="palette-contrast" class="badge badge-outline">${selected.accessibility.normalTextAA ? 'AA contrast' : 'Review contrast'}</span>
      </div>
    </div>
  </aside>`;
}

function renderDesignControls(defaultPaletteId, defaultFontGroupId) {
  const selectedPalette = enrichedPalettes.find(palette => palette.id === defaultPaletteId) || enrichedPalettes[0];
  const selectedFontGroup = enrichedFontGroups.find(groupItem => groupItem.id === defaultFontGroupId) || enrichedFontGroups[0];
  return `<aside class="sticky top-[4.1rem] z-20 border-b border-base-300 bg-base-100/92 px-4 py-3 shadow-sm backdrop-blur">
    <div class="mx-auto grid w-[min(1280px,calc(100%-1rem))] gap-3 lg:grid-cols-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.2em] text-base-content/55">Palette engine</p>
          <p id="palette-summary" class="text-sm text-base-content/70">${escapeHtml(selectedPalette.name)} - ${escapeHtml(selectedPalette.style)}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div id="palette-swatches" class="flex gap-1">${renderPaletteSwatches(selectedPalette)}</div>
          <select id="palette-select" class="select select-bordered select-sm w-64" aria-label="Choose website colour palette">
            ${enrichedPalettes.map(palette => `<option value="${palette.id}" ${palette.id === defaultPaletteId ? 'selected' : ''}>${escapeHtml(palette.name)}</option>`).join('')}
          </select>
          <span id="palette-contrast" class="badge badge-outline">${selectedPalette.accessibility.normalTextAA ? 'AA contrast' : 'Review contrast'}</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.2em] text-base-content/55">Font engine</p>
          <p id="font-summary" class="text-sm text-base-content/70">${escapeHtml(selectedFontGroup.name)} - ${escapeHtml(selectedFontGroup.style)}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div id="font-preview" class="rounded-field border border-base-300 bg-base-100 px-3 py-1 text-sm shadow-sm"><span style="font-family:var(--template-font-heading)">Aa</span> <span style="font-family:var(--template-font-body)">Aa</span></div>
          <select id="font-select" class="select select-bordered select-sm w-64" aria-label="Choose website font group">
            ${enrichedFontGroups.map(groupItem => `<option value="${groupItem.id}" ${groupItem.id === defaultFontGroupId ? 'selected' : ''}>${escapeHtml(groupItem.name)}</option>`).join('')}
          </select>
          <span id="font-validation" class="badge badge-outline">${selectedFontGroup.validation.passed ? 'Validated' : 'Review'}</span>
        </div>
      </div>
    </div>
  </aside>`;
}

function renderPaletteSwatches(palette) {
  const colors = palette.colors;
  return [colors.background, colors.primary, colors.secondary, colors.accent, colors.text]
    .map(color => `<span class="h-6 w-6 rounded-full border border-base-300 shadow-sm" style="background:${color}"></span>`)
    .join('');
}

function htmlShell(title, theme, body, options = {}) {
  const paletteId = options.paletteId || '';
  const fontGroupId = options.fontGroupId || '';
  return `<!doctype html>
<html lang="en" data-theme="${theme}"${paletteId ? ` data-palette="${paletteId}"` : ''}${fontGroupId ? ` data-font-group="${fontGroupId}"` : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/daisyui.css?v=template-gallery-1">
  ${fontImportBlock()}
  <style>
    ${paletteStyleBlock()}
    ${fontStyleBlock()}
    @keyframes agencyRiseIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes agencySlowZoom { from { transform:scale(1.02); } to { transform:scale(1.12); } }
    .agency-rise-in { animation:agencyRiseIn .7s ease both; animation-delay:var(--delay,0ms); }
    .agency-slow-zoom { animation:agencySlowZoom 18s ease-in-out infinite alternate; }
    @media (prefers-reduced-motion: reduce) { *, *:before, *:after { animation:none !important; transition:none !important; } }
  </style>
</head>
<body>${body}${paletteId ? designControlsScript() : ''}</body>
</html>`;
}

function designControlsScript() {
  return `<script type="application/json" id="palette-data">${escapeScriptJson(JSON.stringify(enrichedPalettes))}</script>
<script type="application/json" id="font-data">${escapeScriptJson(JSON.stringify(enrichedFontGroups))}</script>
<script>
(() => {
  const palettes = JSON.parse(document.getElementById('palette-data').textContent);
  const fontGroups = JSON.parse(document.getElementById('font-data').textContent);
  const select = document.getElementById('palette-select');
  const summary = document.getElementById('palette-summary');
  const contrast = document.getElementById('palette-contrast');
  const swatches = document.getElementById('palette-swatches');
  const fontSelect = document.getElementById('font-select');
  const fontSummary = document.getElementById('font-summary');
  const fontValidation = document.getElementById('font-validation');
  const stored = localStorage.getItem('template-gallery-palette');
  const storedFont = localStorage.getItem('template-gallery-font-group');

  function swatchHtml(palette) {
    return [palette.colors.background, palette.colors.primary, palette.colors.secondary, palette.colors.accent, palette.colors.text]
      .map(color => '<span class="h-6 w-6 rounded-full border border-base-300 shadow-sm" style="background:' + color + '"></span>')
      .join('');
  }

  function applyPalette(id, persist = true) {
    const palette = palettes.find(item => item.id === id) || palettes[0];
    document.documentElement.dataset.palette = palette.id;
    select.value = palette.id;
    summary.textContent = palette.name + ' - ' + palette.style;
    contrast.textContent = palette.accessibility.normalTextAA ? 'AA contrast' : 'Review contrast';
    contrast.className = palette.accessibility.normalTextAA ? 'badge badge-success' : 'badge badge-warning';
    swatches.innerHTML = swatchHtml(palette);
    if (persist) localStorage.setItem('template-gallery-palette', palette.id);
  }

  function applyFontGroup(id, persist = true) {
    const fontGroup = fontGroups.find(item => item.id === id) || fontGroups[0];
    document.documentElement.dataset.fontGroup = fontGroup.id;
    fontSelect.value = fontGroup.id;
    fontSummary.textContent = fontGroup.name + ' - ' + fontGroup.style;
    fontValidation.textContent = fontGroup.validation.passed ? 'Validated' : 'Review';
    fontValidation.className = fontGroup.validation.passed ? 'badge badge-success' : 'badge badge-warning';
    if (persist) localStorage.setItem('template-gallery-font-group', fontGroup.id);
  }

  if (stored && palettes.some(item => item.id === stored)) applyPalette(stored, false);
  if (storedFont && fontGroups.some(item => item.id === storedFont)) applyFontGroup(storedFont, false);
  select.addEventListener('change', event => applyPalette(event.target.value));
  fontSelect.addEventListener('change', event => applyFontGroup(event.target.value));
})();
</script>`;
}

function escapeScriptJson(value) {
  return String(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function imageFor(template, index) {
  const pool = manifest.categories[template.category] || manifest.categories.agency || [];
  return pool[index % pool.length]?.file || '/placeholders/agency/agency-001.jpg';
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
