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
    headline: 'Clear care pathways for people who need answers.',
    subhead: 'A calm, accessible healthcare website for appointments, services, patient information, and trust.',
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
  }
];

await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, 'templates'), { recursive: true });

const referenceManifest = templates.map(template => ({
  id: template.id,
  title: template.title,
  source: 'Dribbble search reference only - no images copied or stored',
  searches: template.inspiration.map(term => `https://dribbble.com/search/${encodeURIComponent(term)}`)
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
        <div class="flex flex-wrap gap-2"><span class="badge badge-primary">${template.badge}</span><span class="badge badge-outline">${template.theme}</span></div>
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
          <p class="py-6 text-lg text-base-content/70">Original DaisyUI websites generated from design-reference themes. Dribbble is used only as a search/reference source; no Dribbble images are copied or stored.</p>
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
    ['Can this be adapted to another brand?', 'Yes. The layout uses DaisyUI components and design tokens, so colour, copy, imagery, and section order can be swapped cleanly.'],
    ['Is this mobile friendly?', 'Yes. Sections are mobile-first and expand into larger grid layouts on desktop.'],
    ['Can agents build from this?', 'Yes. The template is structured into reusable sections and component classes the Builder Agent can reuse.']
  ];

  return htmlShell(template.title, template.theme, `<main class="overflow-hidden">
    <header class="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/85 px-4 backdrop-blur">
      <div class="navbar-start"><a class="btn btn-ghost text-xl font-black" href="/template-gallery/">${escapeHtml(template.client)}</a></div>
      <nav class="navbar-end hidden gap-4 md:flex">
        ${template.sections.slice(0, 4).map(item => `<a class="link link-hover" href="#${slug(item)}">${escapeHtml(item)}</a>`).join('')}
        <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </nav>
    </header>
    <section class="hero min-h-[calc(100vh-4rem)] bg-base-100">
      <div class="hero-content grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
        <div>
          <span class="badge badge-primary badge-lg mb-5">${escapeHtml(template.badge)}</span>
          <h1 class="text-5xl font-black leading-none md:text-7xl xl:text-8xl">${escapeHtml(template.headline)}</h1>
          <p class="py-6 text-xl leading-relaxed text-base-content/70">${escapeHtml(template.subhead)}</p>
          <div class="join">
            <a class="btn btn-primary join-item rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
            <a class="btn btn-outline join-item rounded-full" href="#sections">${escapeHtml(template.secondary)}</a>
          </div>
          <div class="stats stats-vertical mt-8 shadow lg:stats-horizontal">
            ${template.metrics.map(([value, label]) => `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-desc">${escapeHtml(label)}</div></div>`).join('')}
          </div>
        </div>
        <div class="relative min-h-[560px] overflow-hidden rounded-[2rem] shadow-2xl">
          <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
          <div class="absolute inset-0 bg-gradient-to-t from-neutral/80 to-transparent"></div>
          <div class="absolute bottom-6 left-6 right-6 rounded-box border border-white/20 bg-base-100/90 p-6 backdrop-blur">
            <strong class="text-2xl">${escapeHtml(template.title)}</strong>
            <p class="mt-2 text-base-content/70">Built with DaisyUI cards, buttons, stats, forms, badges, and responsive section patterns.</p>
          </div>
        </div>
      </div>
    </section>
    <section id="sections" class="bg-base-200 py-20">
      <div class="mx-auto w-[min(1180px,calc(100%-2rem))]">
        <div class="mb-8 max-w-3xl">
          <span class="badge badge-secondary badge-lg mb-4">Section system</span>
          <h2 class="text-4xl font-black md:text-6xl">Reusable sections with a finished visual direction.</h2>
        </div>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          ${features.map((item, index) => `<article id="${slug(item)}" class="card bg-base-100 shadow-xl border border-base-300 agency-rise-in" style="--delay:${index * 80}ms"><div class="card-body"><div class="badge badge-primary">${index + 1}</div><h3 class="card-title">${escapeHtml(item)}</h3><p>Composable DaisyUI section ready for brand, copy, and conversion adaptation.</p></div></article>`).join('')}
        </div>
      </div>
    </section>
    <section class="py-20">
      <div class="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <span class="badge badge-accent badge-lg mb-4">Visual system</span>
          <h2 class="text-4xl font-black md:text-6xl">Image rhythm, proof, and action in one flow.</h2>
          <p class="mt-5 text-lg text-base-content/70">The layout uses a brand palette, repeated cards, gallery moments, and clear calls to action so the page feels deliberate rather than assembled from loose blocks.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          ${images.slice(1, 5).map((image, index) => `<figure class="overflow-hidden rounded-box shadow-xl ${index === 0 ? 'sm:row-span-2' : ''}"><img src="${image}" alt="" class="h-full min-h-56 w-full object-cover transition duration-300 hover:scale-105"></figure>`).join('')}
        </div>
      </div>
    </section>
    <section class="bg-base-200 py-20">
      <div class="mx-auto w-[min(980px,calc(100%-2rem))]">
        <span class="badge badge-primary badge-lg mb-4">Review notes</span>
        <h2 class="mb-8 text-4xl font-black md:text-6xl">Built for agency review.</h2>
        <div class="space-y-3">${faqs.map(([question, answer]) => `<div class="collapse collapse-arrow bg-base-100 border border-base-300"><input type="checkbox"><div class="collapse-title text-xl font-bold">${question}</div><div class="collapse-content"><p>${answer}</p></div></div>`).join('')}</div>
      </div>
    </section>
    <section id="contact" class="hero bg-neutral py-20 text-neutral-content">
      <div class="hero-content text-center">
        <div class="max-w-3xl">
          <h2 class="text-4xl font-black md:text-6xl">Ready to adapt this direction?</h2>
          <p class="py-6 text-lg text-neutral-content/75">Use this as a starting point for Designer Agent handoff, Builder Agent implementation, and preview approval.</p>
          <a class="btn btn-primary rounded-full" href="/template-gallery/">Back to gallery</a>
        </div>
      </div>
    </section>
  </main>`);
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
