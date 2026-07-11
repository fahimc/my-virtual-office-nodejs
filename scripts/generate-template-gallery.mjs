import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  }
];

await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, 'templates'), { recursive: true });

const referenceManifest = templates.map(template => ({
  id: template.id,
  title: template.title,
  source: template.awardInspired
    ? 'Award-site research inspiration only - no winning site code, layouts, or assets copied'
    : 'Dribbble search reference only - no images copied or stored',
  awardInspired: Boolean(template.awardInspired),
  pattern: template.awardPattern || 'industry-template',
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
await writeFile(path.join(outDir, 'index.html'), renderGallery());

console.log(`Generated ${templates.length} DaisyUI templates at /template-gallery/`);

function renderGallery() {
  const cards = templates.map(template => {
    const image = imageFor(template, 0);
    return `<article class="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
      <figure class="h-56"><img src="${image}" alt="" class="h-full w-full object-cover"></figure>
      <div class="card-body">
        <div class="flex flex-wrap gap-2"><span class="badge badge-primary">${template.badge}</span><span class="badge badge-outline">${template.theme}</span>${template.awardInspired ? '<span class="badge badge-secondary">award-inspired</span>' : ''}</div>
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
        ${renderHeroVisual(template, images)}
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
  </main>`);
}

function renderHeroVisual(template, images) {
  if (template.awardPattern === 'museum-editorial') {
    return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral p-4 text-neutral-content shadow-2xl md:min-h-[560px]">
      <div class="absolute inset-0 grid grid-cols-12 gap-px opacity-20">${Array.from({ length: 48 }, () => '<span class="border border-white/20"></span>').join('')}</div>
      <figure class="absolute right-6 top-8 h-[72%] w-[58%] overflow-hidden rounded-box border border-white/20 shadow-2xl"><img src="${images[0]}" alt="" class="h-full w-full object-cover grayscale contrast-125"></figure>
      <div class="relative z-10 flex min-h-[390px] flex-col justify-between md:min-h-[520px]">
        <div class="max-w-sm"><span class="badge badge-primary">Current exhibition</span><p class="mt-4 text-sm text-neutral-content/70">Archive notes, room sequence, curator context, and ticket path.</p></div>
        <div class="max-w-xl rounded-box border border-white/15 bg-neutral/70 p-5 backdrop-blur"><strong class="text-4xl font-black">01 / ${escapeHtml(template.client)}</strong><p class="mt-2 text-neutral-content/75">A restrained editorial system for art, archive, and cultural institutions.</p></div>
      </div>
    </div>`;
  }

  if (template.awardPattern === 'cinematic-luxury') {
    return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#120f0a] p-5 text-[#f8f1df] shadow-2xl md:min-h-[560px]">
      <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-45 agency-slow-zoom">
      <div class="absolute inset-0 bg-[linear-gradient(90deg,#120f0a_0%,rgba(18,15,10,.82)_34%,rgba(18,15,10,.2)_100%)]"></div>
      <div class="relative z-10 flex min-h-[390px] flex-col justify-end md:min-h-[520px]">
        <div class="max-w-lg border-l border-[#d6b46a] pl-6"><span class="text-sm uppercase tracking-[.35em] text-[#d6b46a]">Private release</span><h3 class="mt-4 text-5xl font-black leading-none">Quiet detail. High intent.</h3><p class="mt-4 text-[#f8f1df]/70">Dark editorial framing, sparse proof, and a concierge-first conversion path.</p></div>
      </div>
    </div>`;
  }

  if (template.awardPattern === 'data-story') {
    return `<div class="relative min-h-[430px] rounded-[2rem] bg-base-200 p-5 shadow-2xl md:min-h-[560px]">
      <div class="grid min-h-[390px] gap-4 md:min-h-[520px] md:grid-cols-[1.1fr_.9fr]">
        <div class="card bg-base-100 shadow-xl"><div class="card-body"><span class="badge badge-primary">Live signal map</span><div class="mt-4 grid flex-1 grid-cols-7 gap-2">${Array.from({ length: 49 }, (_, index) => `<span class="aspect-square rounded ${index % 5 === 0 ? 'bg-primary' : index % 7 === 0 ? 'bg-accent' : 'bg-base-300'}"></span>`).join('')}</div></div></div>
        <div class="grid gap-4">${template.metrics.map(([value, label], index) => `<div class="card bg-base-100 shadow-xl"><div class="card-body"><span class="text-4xl font-black">${escapeHtml(value)}</span><p>${escapeHtml(label)}</p><progress class="progress progress-primary" value="${70 - index * 12}" max="100"></progress></div></div>`).join('')}</div>
      </div>
    </div>`;
  }

  if (template.awardPattern === 'kinetic-agency') {
    return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral text-neutral-content shadow-2xl md:min-h-[560px]">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,.55),transparent_30rem),radial-gradient(circle_at_80%_70%,rgba(34,211,238,.45),transparent_28rem)]"></div>
      <div class="relative z-10 flex min-h-[390px] flex-col justify-between p-5 md:min-h-[520px] md:p-8">
        <div class="flex flex-wrap gap-3">${template.sections.slice(0, 5).map(item => `<span class="badge badge-outline badge-lg text-neutral-content">${escapeHtml(item)}</span>`).join('')}</div>
        <div class="grid gap-3 text-5xl font-black uppercase leading-none md:text-7xl">${['Strategy', 'Design', 'Launch'].map((word, index) => `<div class="${index % 2 ? 'translate-x-8 text-primary' : 'text-secondary'}">${word}</div>`).join('')}</div>
        <div class="marquee-row text-lg font-bold opacity-80">Sprint system / launch proof / brand motion / conversion loops</div>
      </div>
    </div>`;
  }

  if (template.awardPattern === 'immersive-product') {
    return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-neutral via-secondary to-warning p-5 text-white shadow-2xl md:min-h-[560px]">
      <div class="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"></div>
      <div class="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"></div>
      <div class="relative z-10 grid min-h-[390px] place-items-center md:min-h-[520px]">
        <div class="relative h-72 w-72 rounded-[3rem] bg-white/15 p-8 shadow-2xl backdrop-blur"><div class="h-full rounded-[2rem] bg-white/80 shadow-inner"></div><span class="absolute -right-8 top-8 badge badge-primary">Feature 01</span><span class="absolute -left-10 bottom-12 badge badge-secondary">Material story</span><span class="absolute right-8 -bottom-4 badge badge-accent">Early access</span></div>
      </div>
    </div>`;
  }

  if (template.awardPattern === 'human-cause') {
    return `<div class="relative min-h-[430px] rounded-[2rem] bg-base-200 p-5 shadow-2xl md:min-h-[560px]">
      <div class="grid min-h-[390px] gap-4 md:min-h-[520px] md:grid-cols-[.85fr_1.15fr]">
        <div class="card bg-neutral text-neutral-content shadow-xl"><div class="card-body justify-end"><span class="badge badge-warning">Human story</span><h3 class="text-4xl font-black">Evidence, care, and action in one page.</h3></div></div>
        <div class="relative rounded-box bg-base-100 p-6 shadow-xl">
          <div class="absolute left-10 top-8 bottom-8 w-px bg-primary"></div>
          ${['Story opened', 'Evidence reviewed', 'People mobilised', 'Action taken'].map((item, index) => `<div class="relative z-10 ml-10 mb-8 rounded-box border border-base-300 bg-base-100 p-4 shadow"><span class="badge badge-primary">${index + 1}</span><strong class="ml-3">${escapeHtml(item)}</strong></div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  if (template.category === 'food-drink') {
    return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-warning via-primary to-accent p-6 shadow-2xl md:min-h-[520px]">
      <div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/25 blur-sm"></div>
      <div class="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-secondary/30 blur-xl"></div>
      <div class="relative grid h-full min-h-[360px] place-items-center md:min-h-[470px]">
        <div class="flex items-end justify-center gap-4 rotate-[-4deg]">
          ${template.palette.map((color, index) => `<div class="relative w-20 rounded-[1.6rem] border-4 border-white/70 bg-white/40 shadow-2xl backdrop-blur" style="height:${230 + index * 28}px"><div class="absolute left-1/2 top-[-34px] h-12 w-9 -translate-x-1/2 rounded-t-xl bg-neutral"></div><div class="absolute inset-x-3 bottom-4 rounded-2xl bg-white/85 p-3 text-center text-sm font-black text-neutral">${escapeHtml(['Mango', 'Berry', 'Leaf'][index] || template.client)}</div><div class="absolute inset-x-4 top-14 h-24 rounded-full" style="background:${color}"></div></div>`).join('')}
        </div>
      </div>
      <div class="absolute bottom-6 left-6 right-6 rounded-box border border-white/30 bg-base-100/90 p-5 shadow-xl backdrop-blur">
        <strong class="text-2xl">${escapeHtml(template.title)}</strong>
        <p class="mt-2 text-base-content/70">Bright product blocks, flavour comparison, and fast shopping actions.</p>
      </div>
    </div>`;
  }

  if (template.category === 'saas') {
    return `<div class="relative min-h-[420px] rounded-[2rem] bg-neutral p-4 text-neutral-content shadow-2xl md:min-h-[520px] md:p-5">
      <div class="mockup-browser border border-white/15 bg-base-100 text-base-content shadow-2xl">
        <div class="mockup-browser-toolbar"><div class="input input-bordered w-full">northstar.app/dashboard</div></div>
        <div class="grid gap-4 bg-base-200 p-5 md:grid-cols-3">
          <div class="stats stats-vertical shadow md:col-span-1">${template.metrics.map(([value, label]) => `<div class="stat"><div class="stat-value text-2xl">${escapeHtml(value)}</div><div class="stat-desc">${escapeHtml(label)}</div></div>`).join('')}</div>
          <div class="card bg-base-100 shadow-xl md:col-span-2"><div class="card-body"><div class="mb-3 h-4 w-32 rounded bg-primary"></div><div class="grid gap-3">${[64, 88, 52, 78].map(width => `<div class="h-5 rounded bg-base-300" style="width:${width}%"></div>`).join('')}</div><div class="mt-5 grid grid-cols-4 gap-2">${[1, 2, 3, 4].map(() => `<div class="h-20 rounded-box bg-primary/20"></div>`).join('')}</div></div></div>
          <div class="card bg-primary text-primary-content shadow-xl md:col-span-3"><div class="card-body flex-row items-center justify-between"><strong>Automation health</strong><span class="badge badge-neutral">Live</span></div></div>
        </div>
      </div>
    </div>`;
  }

  if (template.category === 'trades' || template.category === 'healthcare' || template.category === 'local-business') {
    return `<div class="relative min-h-[420px] rounded-[2rem] bg-base-200 p-4 shadow-2xl md:min-h-[520px] md:p-6">
      <div class="grid h-full min-h-[370px] gap-4 md:min-h-[470px] md:grid-cols-2">
        <div class="card bg-base-100 shadow-xl"><div class="card-body"><span class="badge badge-primary">Fast response</span><h3 class="text-3xl font-black">${escapeHtml(template.cta)}</h3><p>${escapeHtml(template.subhead)}</p><button class="btn btn-primary rounded-full">${escapeHtml(template.cta)}</button></div></div>
        <figure class="hidden overflow-hidden rounded-box shadow-xl md:block"><img src="${images[0]}" alt="" class="h-full w-full object-cover"></figure>
        <div class="stats stats-vertical shadow md:col-span-2 md:stats-horizontal">${template.metrics.map(([value, label]) => `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-desc">${escapeHtml(label)}</div></div>`).join('')}</div>
      </div>
    </div>`;
  }

  if (template.category === 'restaurant' || template.category === 'fitness') {
    return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-neutral p-4 text-neutral-content shadow-2xl md:min-h-[520px] md:p-5">
      <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-55 agency-slow-zoom">
      <div class="absolute inset-0 bg-gradient-to-t from-neutral via-neutral/70 to-neutral/20"></div>
      <div class="relative flex min-h-[370px] flex-col justify-end gap-4 md:min-h-[470px]">
        <div class="menu rounded-box bg-base-100/95 p-5 text-base-content shadow-2xl backdrop-blur">
          <div class="mb-3 flex items-center justify-between"><strong class="text-2xl">${escapeHtml(template.client)}</strong><span class="badge badge-primary">${escapeHtml(template.badge)}</span></div>
          {items}
        </div>
      </div>
    </div>`.replace('{items}', template.sections.slice(0, 4).map((item, index) => `<div class="flex items-center justify-between border-t border-base-300 py-3"><span>${escapeHtml(item)}</span><b>${index === 0 ? template.cta : 'Explore'}</b></div>`).join(''));
  }

  if (template.category === 'portfolio' || template.category === 'ecommerce' || template.category === 'beauty' || template.category === 'real-estate') {
    return `<div class="relative grid h-[420px] grid-cols-6 grid-rows-6 gap-3 rounded-[2rem] bg-base-200 p-4 shadow-2xl md:h-[560px]">
      ${images.slice(0, 5).map((image, index) => `<figure class="${galleryHeroCell(index)} overflow-hidden rounded-box shadow-xl"><img src="${image}" alt="" class="h-full w-full object-cover transition duration-300 hover:scale-105"></figure>`).join('')}
      <div class="absolute bottom-6 left-6 right-6 rounded-box border border-base-300 bg-base-100/90 p-5 shadow-xl backdrop-blur">
        <strong class="text-2xl">${escapeHtml(template.title)}</strong>
        <p class="mt-2 text-base-content/70">${escapeHtml(template.secondary)} with a polished visual path.</p>
      </div>
    </div>`;
  }

  return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] shadow-2xl md:min-h-[520px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-t from-neutral/80 to-transparent"></div>
    <div class="absolute bottom-6 left-6 right-6 rounded-box border border-white/20 bg-base-100/90 p-6 backdrop-blur">
      <strong class="text-2xl">${escapeHtml(template.title)}</strong>
      <p class="mt-2 text-base-content/70">${escapeHtml(template.secondary)} with a clear conversion path.</p>
    </div>
  </div>`;
}

function galleryHeroCell(index) {
  return [
    'col-span-4 row-span-4',
    'col-span-2 row-span-3',
    'col-span-2 row-span-3',
    'col-span-3 row-span-2',
    'col-span-3 row-span-2'
  ][index] || 'col-span-2 row-span-2';
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

function htmlShell(title, theme, body) {
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/daisyui.css?v=template-gallery-1">
  <style>
    @keyframes agencyRiseIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes agencySlowZoom { from { transform:scale(1.02); } to { transform:scale(1.12); } }
    .agency-rise-in { animation:agencyRiseIn .7s ease both; animation-delay:var(--delay,0ms); }
    .agency-slow-zoom { animation:agencySlowZoom 18s ease-in-out infinite alternate; }
    @media (prefers-reduced-motion: reduce) { *, *:before, *:after { animation:none !important; transition:none !important; } }
  </style>
</head>
<body>${body}</body>
</html>`;
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
