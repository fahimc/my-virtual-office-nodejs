const DEFAULT_THEME = {
  ink: '#151611',
  inkSoft: '#292a24',
  paper: '#f2efe7',
  paperAlt: '#e8e3d8',
  stone: '#cbc3b4',
  gold: '#a89262',
  white: '#ffffff'
};

export const luxuryPropertySectionCatalog = {
  LuxuryEditorialNavbar: {
    purpose: 'Transparent editorial navigation that becomes a readable surface on scroll.',
    daisyUi: ['navbar', 'btn', 'dropdown']
  },
  LuxuryMediaHero: {
    purpose: 'Full-bleed property or campaign media with protected overlay copy and conversion actions.',
    daisyUi: ['hero', 'badge', 'btn', 'stats']
  },
  EditorialStatementSection: {
    purpose: 'Large positioning statement paired with concise supporting copy.',
    daisyUi: ['badge']
  },
  AssetPortfolioGrid: {
    purpose: 'Reusable asymmetric portfolio for properties, products, destinations, or case studies.',
    daisyUi: ['badge']
  },
  LuxuryServiceRows: {
    purpose: 'Numbered service comparison with concise descriptions and strong scan order.',
    daisyUi: ['badge']
  },
  CinematicStatementSection: {
    purpose: 'Full-width image statement for a brand principle, campaign idea, or project point of view.',
    daisyUi: []
  },
  ImagePrinciplesSplit: {
    purpose: 'Image-led split section with reusable values or decision principles.',
    daisyUi: ['badge']
  },
  AudienceEditorialGrid: {
    purpose: 'Repeated audience, collection, or use-case items without nested cards.',
    daisyUi: ['badge']
  },
  ProcessTimeline: {
    purpose: 'Structured project, acquisition, or concierge process timeline.',
    daisyUi: ['steps']
  },
  PrivateAccessCta: {
    purpose: 'Client-safe private-access or high-intent enquiry gate.',
    daisyUi: ['btn']
  },
  PrivateInquiryForm: {
    purpose: 'Accessible enquiry form for viewings, consultations, or private client requests.',
    daisyUi: ['input', 'select', 'textarea', 'btn']
  }
};

export function isLuxuryPropertyBrief(value) {
  return /\b(property|properties|real[ -]?estate|estate agent|realtor|residence|residential|home developer|house builder|architecture|interior design|hotel|hospitality|resort|private asset|family office|luxury|premium concierge|yacht|aviation|jewellery|jewelry|private members?)\b/i.test(String(value || ''));
}

export function renderLuxuryPropertyWebsite(input = {}) {
  const data = normalizeData(input);
  const theme = normalizeTheme(input.theme);
  const title = data.pageTitle || `${data.brand} - ${data.mode === 'property' ? 'Private Property' : 'Private Collection'}`;

  return `<!doctype html>
<html lang="en"${data.paletteId ? ` data-palette="${escapeHtml(data.paletteId)}"` : ''}${data.fontGroupId ? ` data-font-group="${escapeHtml(data.fontGroupId)}"` : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(data.metaDescription)}">
  <meta name="theme-color" content="${theme.ink}">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${escapeHtml(data.cssHref)}">
  <style>${luxuryPropertyStyles(theme)}</style>
  ${data.extraHead}
</head>
<body data-theme="agency-preview" class="lux-page bg-base-100 text-base-content">
  ${renderLuxuryEditorialNavbar(data)}
  <main>
    ${renderLuxuryMediaHero(data)}
    ${data.designControlsHtml}
    ${renderEditorialStatementSection(data)}
    ${renderAssetPortfolioGrid(data)}
    ${renderLuxuryServiceRows(data)}
    ${renderCinematicStatementSection(data)}
    ${renderImagePrinciplesSplit(data)}
    ${renderAudienceEditorialGrid(data)}
    ${renderProcessTimeline(data)}
    ${renderPrivateAccessCta(data)}
    ${renderPrivateInquiryForm(data)}
  </main>
  ${renderLuxuryFooter(data)}
  <script>${luxuryPropertyScript()}</script>
  ${data.extraScript}
</body>
</html>`;
}

export function renderLuxuryEditorialNavbar(data) {
  return `<header class="navbar lux-navbar" id="luxuryHeader">
    <div class="navbar-start">
      <a class="btn btn-ghost lux-brand" href="#top" aria-label="${escapeHtml(data.brand)} home">${escapeHtml(data.brand)}<sup>${escapeHtml(data.brandSuffix)}</sup></a>
    </div>
    <nav class="navbar-center lux-desktop-nav" aria-label="Primary navigation">
      ${data.navItems.map(item => `<a href="#${slug(item.target)}">${escapeHtml(item.label)}</a>`).join('')}
    </nav>
    <div class="navbar-end gap-2">
      <a class="lux-enquire" href="#contact">${escapeHtml(data.primaryCta)}</a>
      <details class="dropdown dropdown-end lux-mobile-nav">
        <summary class="btn btn-circle btn-ghost lux-menu-button" aria-label="Open navigation"><span class="lux-menu-icon" aria-hidden="true"></span></summary>
        <ul class="menu dropdown-content z-[60] mt-3 w-64 border border-base-300 bg-base-100 p-3 text-base-content shadow-2xl">
          ${data.navItems.map(item => `<li><a href="#${slug(item.target)}">${escapeHtml(item.label)}</a></li>`).join('')}
          <li><a href="#contact">${escapeHtml(data.primaryCta)}</a></li>
        </ul>
      </details>
    </div>
  </header>`;
}

export function renderLuxuryMediaHero(data) {
  const hero = imageAt(data, 0);
  return `<section id="top" class="template-full-bleed-hero lux-hero relative overflow-hidden bg-neutral text-white">
    <img src="${escapeHtml(hero)}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.74),rgba(0,0,0,.34),rgba(0,0,0,.10)),linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.70))]"></div>
    <div class="lux-shell lux-hero-content relative z-10">
      <div class="lux-hero-main reveal">
        <span class="badge badge-outline lux-light-badge">${escapeHtml(data.heroKicker)}</span>
        <h1>${escapeHtml(data.headline)}</h1>
        <p>${escapeHtml(data.subhead)}</p>
        <div class="flex flex-wrap gap-3">
          <a class="btn btn-primary" href="#contact">${escapeHtml(data.primaryCta)}</a>
          <a class="btn btn-outline lux-light-button" href="#sections">${escapeHtml(data.secondaryCta)}</a>
        </div>
        <div class="lux-hero-metrics">
          ${data.metrics.map(([value, label]) => `<div class="border-r border-white/20 last:border-r-0"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
        </div>
      </div>
      <div class="lux-hero-foot"><span>${escapeHtml(data.locationLine)}</span><a href="#practice">${escapeHtml(data.heroFootLink)}</a></div>
    </div>
  </section>
  <div class="lux-ticker" aria-label="Services"><div>${[...data.tickerItems, ...data.tickerItems].map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div></div>`;
}

export function renderEditorialStatementSection(data) {
  return `<section class="lux-section lux-intro" id="practice">
    <div class="lux-shell lux-intro-grid">
      <div class="lux-eyebrow reveal">${escapeHtml(data.introEyebrow)}</div>
      <div>
        <h2 class="lux-statement reveal">${escapeHtml(data.introStatement)}</h2>
        <div class="lux-intro-copy">
          ${data.introCopy.map(copy => `<p class="reveal">${escapeHtml(copy)}</p>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

export function renderAssetPortfolioGrid(data) {
  return `<section class="lux-section lux-assets" id="sections">
    <div class="lux-shell">
      <div class="lux-section-head">
        <div><div class="lux-eyebrow reveal">${escapeHtml(data.assetsEyebrow)}</div><h2 class="lux-title reveal">${escapeHtml(data.assetsHeading)}</h2></div>
        <p class="reveal">${escapeHtml(data.assetsIntro)}</p>
      </div>
      <div class="lux-asset-grid">
        ${data.assets.map((asset, index) => `<article class="lux-asset reveal ${index === 0 ? 'lux-asset-featured' : ''}">
          <img src="${escapeHtml(imageAt(data, index + 1))}" alt="${escapeHtml(asset.alt)}" loading="lazy">
          <div class="lux-asset-overlay"><div><span>${escapeHtml(asset.meta)}</span><h3>${escapeHtml(asset.title)}</h3></div><a class="btn btn-circle btn-outline lux-light-button" href="#contact" aria-label="Enquire about ${escapeHtml(asset.title)}">&nearr;</a></div>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

export function renderLuxuryServiceRows(data) {
  return `<section class="lux-section lux-services" id="services">
    <div class="lux-shell">
      <div class="lux-services-head"><div class="lux-eyebrow reveal">${escapeHtml(data.servicesEyebrow)}</div><div><h2 class="lux-title reveal">${escapeHtml(data.servicesHeading)}</h2><p class="reveal">${escapeHtml(data.servicesIntro)}</p></div></div>
      <div class="lux-service-list">
        ${data.services.map((service, index) => `<article class="lux-service-row reveal"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p><a class="btn btn-circle btn-ghost" href="#contact" aria-label="Enquire about ${escapeHtml(service.title)}">&nearr;</a></article>`).join('')}
      </div>
    </div>
  </section>`;
}

export function renderCinematicStatementSection(data) {
  return `<section class="lux-cinema" aria-label="Brand point of view">
    <img src="${escapeHtml(imageAt(data, 4))}" alt="" loading="lazy">
    <div class="lux-cinema-scrim"></div>
    <div class="lux-shell lux-cinema-content"><blockquote class="reveal">${escapeHtml(data.cinematicStatement)}</blockquote><div class="reveal"><div class="lux-eyebrow">${escapeHtml(data.cinematicEyebrow)}</div><p>${escapeHtml(data.cinematicCopy)}</p></div></div>
  </section>`;
}

export function renderImagePrinciplesSplit(data) {
  return `<section class="lux-section lux-practice">
    <div class="lux-shell lux-practice-grid">
      <figure class="reveal"><img src="${escapeHtml(imageAt(data, 5))}" alt="${escapeHtml(data.practiceImageAlt)}" loading="lazy"></figure>
      <div><div class="lux-eyebrow reveal">${escapeHtml(data.principlesEyebrow)}</div><h2 class="lux-title reveal">${escapeHtml(data.principlesHeading)}</h2><p class="lux-lead reveal">${escapeHtml(data.principlesIntro)}</p>
        <div class="lux-principles">${data.principles.map(item => `<div class="reveal"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></div>`).join('')}</div>
      </div>
    </div>
  </section>`;
}

export function renderAudienceEditorialGrid(data) {
  return `<section class="lux-section lux-audiences" id="audience">
    <div class="lux-shell"><div class="lux-eyebrow reveal">${escapeHtml(data.audienceEyebrow)}</div><h2 class="lux-title reveal">${escapeHtml(data.audienceHeading)}</h2>
      <div class="lux-audience-grid">${data.audiences.map((item, index) => `<article class="reveal"><div><span>${String(index + 1).padStart(2, '0')}</span><span>&nearr;</span></div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div></article>`).join('')}</div>
    </div>
  </section>`;
}

export function renderProcessTimeline(data) {
  return `<section class="lux-section lux-process" id="process">
    <div class="lux-shell"><div class="lux-section-head"><div><div class="lux-eyebrow reveal">${escapeHtml(data.processEyebrow)}</div><h2 class="lux-title reveal">${escapeHtml(data.processHeading)}</h2></div><p class="reveal">${escapeHtml(data.processIntro)}</p></div>
      <ol class="lux-timeline">${data.processSteps.map((step, index) => `<li class="reveal"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`).join('')}</ol>
    </div>
  </section>`;
}

export function renderPrivateAccessCta(data) {
  return `<section class="lux-private">
    <img src="${escapeHtml(imageAt(data, 6))}" alt="" loading="lazy">
    <div class="lux-private-scrim"></div>
    <div class="reveal"><div class="lux-eyebrow">${escapeHtml(data.privateEyebrow)}</div><h2>${escapeHtml(data.privateHeading)}</h2><p>${escapeHtml(data.privateCopy)}</p><a class="btn btn-outline lux-light-button" href="#contact">${escapeHtml(data.primaryCta)} <span aria-hidden="true">&rarr;</span></a></div>
  </section>`;
}

export function renderPrivateInquiryForm(data) {
  return `<section class="lux-section lux-contact" id="contact">
    <div class="lux-shell lux-contact-grid">
      <div><div class="lux-eyebrow reveal">${escapeHtml(data.contactEyebrow)}</div><h2 class="lux-title reveal">${escapeHtml(data.contactHeading)}</h2><p class="lux-lead reveal">${escapeHtml(data.contactIntro)}</p><div class="lux-contact-meta"><span>${escapeHtml(data.contactResponse)}</span><span>${escapeHtml(data.locationLine)}</span></div></div>
      <form class="lux-form reveal" id="luxuryEnquiryForm">
        <label><span>Name</span><input class="input input-bordered" name="name" autocomplete="name" required></label>
        <label><span>Email</span><input class="input input-bordered" name="email" type="email" autocomplete="email" required></label>
        <label><span>${escapeHtml(data.formInterestLabel)}</span><select class="select select-bordered" name="interest">${data.services.map(item => `<option>${escapeHtml(item.title)}</option>`).join('')}<option>${escapeHtml(data.formOtherOption)}</option></select></label>
        <label><span>${escapeHtml(data.formMessageLabel)}</span><textarea class="textarea textarea-bordered" name="message" rows="5"></textarea></label>
        <div class="lux-form-foot"><p>${escapeHtml(data.formPrivacyNote)}</p><button class="btn btn-neutral" type="submit">${escapeHtml(data.formSubmitLabel)} <span aria-hidden="true">&rarr;</span></button></div>
        <p class="alert alert-success lux-form-success" id="luxuryFormSuccess" role="status">${escapeHtml(data.formSuccessMessage)}</p>
      </form>
    </div>
  </section>`;
}

export function renderLuxuryFooter(data) {
  return `<footer class="footer lux-footer"><div class="lux-shell lux-footer-grid"><div class="lux-footer-brand">${escapeHtml(data.brand)}</div><nav aria-label="Footer navigation">${data.navItems.map(item => `<a href="#${slug(item.target)}">${escapeHtml(item.label)}</a>`).join('')}</nav><div><span>&copy; ${new Date().getFullYear()} ${escapeHtml(data.brand)}</span><span>${escapeHtml(data.footerLine)}</span></div></div></footer>`;
}

function normalizeData(input) {
  const mode = input.mode === 'luxury' ? 'luxury' : 'property';
  const brand = cleanText(input.brand || (mode === 'property' ? 'Aurelis Property' : 'Aurelis Private'));
  const summary = cleanText(input.summary || (mode === 'property'
    ? 'Independent property representation for exceptional homes, discreet opportunities, and considered decisions.'
    : 'A private client experience shaped around distinction, discretion, and long-term value.'));
  const images = Array.isArray(input.images) ? input.images.map(image => typeof image === 'string' ? image : image?.file || image?.url).filter(Boolean) : [];
  const property = mode === 'property';

  return {
    mode,
    brand,
    brandSuffix: cleanText(input.brandSuffix || (property ? 'Property' : 'Private')),
    pageTitle: cleanText(input.pageTitle || ''),
    cssHref: input.cssHref || '/daisyui.css?v=luxury-property-1',
    extraHead: String(input.extraHead || ''),
    extraScript: String(input.extraScript || ''),
    designControlsHtml: String(input.designControlsHtml || ''),
    paletteId: input.paletteId ? slug(input.paletteId) : '',
    fontGroupId: input.fontGroupId ? slug(input.fontGroupId) : '',
    metaDescription: cleanText(input.metaDescription || summary).slice(0, 180),
    navItems: input.navItems || [
      { label: 'Practice', target: 'practice' },
      { label: property ? 'Properties' : 'Collection', target: 'sections' },
      { label: 'Services', target: 'services' },
      { label: 'Process', target: 'process' }
    ],
    heroKicker: cleanText(input.heroKicker || (property ? 'Private property advisory' : 'Private client practice')),
    headline: cleanText(input.headline || (property ? 'Exceptional property, represented with discretion.' : 'A considered expression of modern luxury.')),
    subhead: summary,
    primaryCta: cleanText(input.primaryCta || (property ? 'Request a private viewing' : 'Begin a private enquiry')),
    secondaryCta: cleanText(input.secondaryCta || (property ? 'Explore selected properties' : 'Explore the collection')),
    locationLine: cleanText(input.locationLine || (property ? 'United Kingdom and international' : 'Available by private appointment')),
    heroFootLink: cleanText(input.heroFootLink || (property ? 'Discover the practice' : 'Discover our approach')),
    metrics: input.metrics || (property
      ? [['Private', 'off-market search'], ['Global', 'trusted network'], ['1:1', 'principal advice']]
      : [['Private', 'client service'], ['Selective', 'commissions'], ['1:1', 'concierge']]),
    tickerItems: input.tickerItems || (property
      ? ['Private acquisition', 'Residential sales', 'Property advisory', 'Development', 'International search']
      : ['Brand stewardship', 'Private commissions', 'Concierge service', 'Digital presentation', 'Long-term value']),
    introEyebrow: cleanText(input.introEyebrow || (property ? 'The practice' : 'Our perspective')),
    introStatement: cleanText(input.introStatement || (property
      ? 'A private property practice for clients who value access, judgement, and precise representation.'
      : 'Luxury is built through proportion, material, service, and the confidence to remove what is unnecessary.')),
    introCopy: input.introCopy || [summary, property
      ? 'Every mandate is handled with senior attention, clear commercial advice, and a carefully managed route from first conversation to completion.'
      : 'The experience is designed around a limited number of relationships, ensuring clarity, continuity, and attention at every stage.'],
    assetsEyebrow: cleanText(input.assetsEyebrow || (property ? 'Selected property' : 'Selected work')),
    assetsHeading: cleanText(input.assetsHeading || (property ? 'Places of consequence.' : 'Objects and experiences of consequence.')),
    assetsIntro: cleanText(input.assetsIntro || (property
      ? 'A curated view of the locations and property types we represent. Specific opportunities are shared privately where relevant.'
      : 'A selective view of the commissions and categories we support. Further details are shared in confidence.')),
    assets: input.assets || (property ? [
      { meta: 'Residential - Private sale', title: 'Exceptional residences', alt: 'Exceptional private residence' },
      { meta: 'International - By request', title: 'Destination homes', alt: 'Luxury destination property' },
      { meta: 'Hospitality - Investment', title: 'Distinctive places', alt: 'Distinctive hospitality property' }
    ] : [
      { meta: 'Signature - Private commission', title: 'Defining pieces', alt: 'Luxury private commission' },
      { meta: 'Hospitality - Experience', title: 'Remarkable settings', alt: 'Luxury hospitality setting' },
      { meta: 'Global - Concierge', title: 'Private access', alt: 'Private luxury experience' }
    ]),
    servicesEyebrow: cleanText(input.servicesEyebrow || (property ? 'Property services' : 'Private services')),
    servicesHeading: cleanText(input.servicesHeading || (property ? 'One relationship. Complete alignment.' : 'Considered service from first idea to final detail.')),
    servicesIntro: cleanText(input.servicesIntro || (property
      ? 'An integrated service for property decisions where conventional agency is not enough.'
      : 'A discreet, senior-led approach to complex commissions and high-touch client experiences.')),
    services: input.services || (property ? [
      { title: 'Private acquisition', description: 'Search, discreet approaches, assessment, negotiation, and coordination conducted solely around the buyer mandate.' },
      { title: 'Sales representation', description: 'Positioning, presentation, qualified introductions, and controlled negotiation for distinctive property.' },
      { title: 'Development and design', description: 'A clear brief and coordinated specialist team to protect the commercial and creative intent.' },
      { title: 'Long-term stewardship', description: 'Ongoing oversight, portfolio reviews, and trusted introductions after completion.' }
    ] : [
      { title: 'Brand stewardship', description: 'A precise visual and verbal system that protects the character of the brand across every touchpoint.' },
      { title: 'Digital presentation', description: 'Editorial websites and content experiences designed to make quality visible without overstatement.' },
      { title: 'Private commissions', description: 'A structured route from brief to delivery for one-off objects, launches, and experiences.' },
      { title: 'Concierge continuity', description: 'One trusted relationship coordinating specialists, decisions, and final details.' }
    ]),
    cinematicStatement: cleanText(input.cinematicStatement || (property ? 'The finest properties are not simply found. They are understood.' : 'Luxury is not abundance. It is precision.')),
    cinematicEyebrow: cleanText(input.cinematicEyebrow || 'Point of view'),
    cinematicCopy: cleanText(input.cinematicCopy || (property
      ? 'Context, proportion, provenance, and potential matter as much as presentation. Our role is to make each of those qualities clear.'
      : 'The strongest outcomes are defined by craft, restraint, context, and an uncompromising standard of execution.')),
    practiceImageAlt: cleanText(input.practiceImageAlt || (property ? 'Refined residential interior' : 'Refined luxury detail')),
    principlesEyebrow: cleanText(input.principlesEyebrow || 'Independent by design'),
    principlesHeading: cleanText(input.principlesHeading || (property ? 'Quietly connected. Entirely client-side.' : 'Selective, attentive, and built around the client.')),
    principlesIntro: cleanText(input.principlesIntro || (property
      ? 'A broad trusted network and a deliberately focused client list allow clear judgement without inventory-led pressure.'
      : 'Senior attention and a carefully chosen specialist network keep the work coherent from strategy through delivery.')),
    principles: input.principles || [
      { title: 'Discretion', description: 'Privacy is designed into every conversation and process.' },
      { title: 'Independence', description: 'Advice is shaped by the mandate, not by available stock.' },
      { title: 'Judgement', description: 'Commercial rigour is balanced with cultural intelligence.' },
      { title: 'Continuity', description: 'One trusted relationship remains accountable throughout.' }
    ],
    audienceEyebrow: cleanText(input.audienceEyebrow || (property ? 'Who we advise' : 'Who we serve')),
    audienceHeading: cleanText(input.audienceHeading || (property ? 'Built around principals, not listings.' : 'Built around lasting relationships, not transactions.')),
    audiences: input.audiences || (property ? [
      { title: 'Private clients', description: 'Individuals and families seeking exceptional property with privacy, perspective, and one point of accountability.' },
      { title: 'Family offices', description: 'Independent search and asset-level support for complex requirements across locations and jurisdictions.' },
      { title: 'Trusted advisers', description: 'A discreet specialist partner to lawyers, bankers, trustees, and wealth advisers serving shared clients.' }
    ] : [
      { title: 'Founders', description: 'Leaders building brands and experiences where every detail contributes to perceived value.' },
      { title: 'Private clients', description: 'Individuals seeking discreet guidance, selective access, and a highly personal standard of service.' },
      { title: 'Trusted partners', description: 'Advisers and specialists who need a reliable creative and delivery partner for shared clients.' }
    ]),
    processEyebrow: cleanText(input.processEyebrow || 'The process'),
    processHeading: cleanText(input.processHeading || 'Measured. Personal. Decisive when required.'),
    processIntro: cleanText(input.processIntro || 'Each mandate is shaped around the client while preserving a clear rhythm: alignment, informed decisions, disciplined delivery, and continuity.'),
    processSteps: input.processSteps || [
      { title: 'Private consultation', description: 'We establish the ambition, context, priorities, and level of discretion required.' },
      { title: 'Mandate definition', description: 'The brief, commercial parameters, decision criteria, and communication rhythm are agreed.' },
      { title: 'Research and origination', description: 'Relevant opportunities, specialists, and evidence are assembled and assessed.' },
      { title: 'Execution', description: 'Decisions, negotiation, design, and delivery are coordinated with clear accountability.' },
      { title: 'Stewardship', description: 'Where useful, the relationship continues through launch, operation, and future strategy.' }
    ],
    privateEyebrow: cleanText(input.privateEyebrow || (property ? 'Private view' : 'Private access')),
    privateHeading: cleanText(input.privateHeading || (property ? 'Selected opportunities, shared in confidence.' : 'A more personal view, available by request.')),
    privateCopy: cleanText(input.privateCopy || (property
      ? 'Current off-market property and confidential mandates are shared directly with qualified clients.'
      : 'Selected commissions, detailed case studies, and private availability are shared directly where relevant.')),
    contactEyebrow: cleanText(input.contactEyebrow || 'Private enquiry'),
    contactHeading: cleanText(input.contactHeading || 'Begin with a conversation.'),
    contactIntro: cleanText(input.contactIntro || 'Share only what is useful at this stage. A senior member of the team will respond personally and discreetly.'),
    contactResponse: cleanText(input.contactResponse || 'Personal response within one business day'),
    formInterestLabel: cleanText(input.formInterestLabel || 'Area of interest'),
    formOtherOption: cleanText(input.formOtherOption || 'Other private enquiry'),
    formMessageLabel: cleanText(input.formMessageLabel || 'How may we assist?'),
    formPrivacyNote: cleanText(input.formPrivacyNote || 'Your details will be used only to respond to this enquiry.'),
    formSubmitLabel: cleanText(input.formSubmitLabel || 'Send enquiry'),
    formSuccessMessage: cleanText(input.formSuccessMessage || 'Thank you. Your enquiry has been received.'),
    footerLine: cleanText(input.footerLine || (property ? 'Discretion - Independence - Judgement' : 'Craft - Service - Continuity')),
    images
  };
}

function normalizeTheme(input = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_THEME).map(([key, fallback]) => [key, safeColor(input?.[key], fallback)]));
}

function luxuryPropertyStyles(theme) {
  return `
    :root{--lux-ink:${theme.ink};--lux-ink-soft:${theme.inkSoft};--lux-paper:${theme.paper};--lux-paper-alt:${theme.paperAlt};--lux-stone:${theme.stone};--lux-gold:${theme.gold};--lux-white:${theme.white};--lux-line:color-mix(in srgb,var(--lux-ink) 18%,transparent);--lux-light-line:color-mix(in srgb,var(--lux-paper) 28%,transparent);--lux-serif:"Instrument Serif",Georgia,serif;--lux-sans:"DM Sans",Arial,sans-serif;--lux-pad:clamp(1.25rem,4vw,4.25rem);--radius-box:.5rem;--radius-field:999rem;--color-base-100:${theme.paper};--color-base-200:${theme.paperAlt};--color-base-300:${theme.stone};--color-base-content:${theme.ink};--color-primary:${theme.gold};--color-primary-content:${theme.ink};--color-neutral:${theme.ink};--color-neutral-content:${theme.paper}}
    *{box-sizing:border-box}html{scroll-behavior:smooth}.lux-page{margin:0;background:var(--lux-paper);color:var(--lux-ink);font-family:var(--template-font-body,var(--lux-sans));font-weight:300;overflow-x:hidden}.lux-page a{color:inherit;text-decoration:none}.lux-page img{display:block;width:100%}.lux-shell{width:min(100%,100rem);margin:0 auto}.lux-section{padding:8rem var(--lux-pad)}.lux-eyebrow{display:flex;align-items:center;gap:.75rem;font-size:.7rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase}.lux-eyebrow:before{content:"";width:2.1rem;height:1px;background:currentColor;opacity:.6}.lux-title,.lux-statement{font-family:var(--template-font-heading,var(--lux-serif));font-weight:400;letter-spacing:0}.lux-title{max-width:15ch;margin:1.25rem 0 2rem;font-size:5rem;line-height:.98}.lux-lead{max-width:42rem;font-size:1.2rem;line-height:1.6;color:color-mix(in srgb,var(--lux-ink) 72%,transparent)}.lux-navbar{position:fixed;inset:0 0 auto;z-index:50;min-height:5.25rem;padding:.75rem var(--lux-pad);color:var(--lux-paper);transition:background .35s,color .35s,min-height .35s;border-bottom:1px solid transparent}.lux-navbar.is-scrolled{min-height:4.25rem;background:color-mix(in srgb,var(--lux-paper) 90%,transparent);color:var(--lux-ink);backdrop-filter:blur(1rem);border-bottom-color:var(--lux-line)}.lux-brand{font-family:var(--template-font-brand,var(--template-font-heading,var(--lux-serif)));font-size:1.8rem;font-weight:400}.lux-brand sup{margin-left:.35rem;font-family:var(--template-font-body,var(--lux-sans));font-size:.45rem;letter-spacing:.12em;text-transform:uppercase}.lux-desktop-nav{display:flex;gap:2rem}.lux-desktop-nav a,.lux-enquire{font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase}.lux-desktop-nav a{padding:.6rem 0;border-bottom:1px solid transparent}.lux-desktop-nav a:hover,.lux-enquire{border-bottom-color:currentColor}.lux-mobile-nav{display:none}.lux-hero{min-height:88svh}.lux-hero>img{object-position:center;animation:luxZoom 18s ease-in-out infinite alternate}.lux-hero-content{display:grid;min-height:88svh;grid-template-rows:1fr auto;padding:8rem var(--lux-pad) 2rem}.lux-hero-main{align-self:end;max-width:67rem;padding-bottom:3rem}.lux-light-badge{margin-bottom:1.5rem;border-color:color-mix(in srgb,var(--lux-paper) 55%,transparent);color:var(--lux-paper);background:color-mix(in srgb,var(--lux-ink) 25%,transparent)}.lux-hero h1{max-width:12ch;margin:0;font-family:var(--template-font-heading,var(--lux-serif));font-size:7rem;font-weight:400;line-height:.9;letter-spacing:0}.lux-hero-main>p{max-width:38rem;margin:1.75rem 0;color:color-mix(in srgb,var(--lux-paper) 82%,transparent);font-size:1rem;line-height:1.7}.lux-light-button{border-color:color-mix(in srgb,var(--lux-paper) 62%,transparent)!important;color:var(--lux-paper)!important;background:color-mix(in srgb,var(--lux-ink) 20%,transparent)!important}.lux-light-button:hover{background:var(--lux-paper)!important;color:var(--lux-ink)!important}.lux-hero-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-width:42rem;margin-top:2rem;border:1px solid color-mix(in srgb,var(--lux-paper) 25%,transparent);background:color-mix(in srgb,var(--lux-ink) 34%,transparent);backdrop-filter:blur(.75rem)}.lux-hero-metrics>div{padding:1rem}.lux-hero-metrics strong,.lux-hero-metrics span{display:block}.lux-hero-metrics strong{font-family:var(--template-font-heading,var(--lux-serif));font-size:1.8rem;font-weight:400}.lux-hero-metrics span{margin-top:.2rem;font-size:.7rem;color:color-mix(in srgb,var(--lux-paper) 70%,transparent)}.lux-hero-foot{display:flex;justify-content:space-between;gap:2rem;padding-top:1.1rem;border-top:1px solid var(--lux-light-line);font-size:.62rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase}.lux-ticker{overflow:hidden;background:var(--lux-ink);color:var(--lux-paper);border-top:1px solid var(--lux-light-line);border-bottom:1px solid var(--lux-light-line)}.lux-ticker>div{display:flex;width:max-content;animation:luxTicker 32s linear infinite}.lux-ticker span{display:flex;align-items:center;gap:2rem;padding:1.25rem 2rem;font-size:.65rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}.lux-ticker span:after{content:"+";color:var(--lux-gold)}.lux-intro-grid{display:grid;grid-template-columns:.7fr 1.5fr;gap:7rem;align-items:start}.lux-statement{max-width:18ch;margin:0;font-size:5rem;line-height:1.02}.lux-intro-copy{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:2.75rem}.lux-intro-copy p,.lux-section-head>p,.lux-services-head p,.lux-service-row p,.lux-cinema-content p,.lux-principles span,.lux-audience-grid p,.lux-timeline p,.lux-private p,.lux-form-foot p{font-size:.88rem;line-height:1.7;color:color-mix(in srgb,var(--lux-ink) 65%,transparent)}.lux-assets,.lux-process{background:var(--lux-ink);color:var(--lux-paper)}.lux-section-head{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:end;margin-bottom:3.75rem}.lux-section-head>p{max-width:31rem;justify-self:end}.lux-assets .lux-section-head>p,.lux-process .lux-section-head>p,.lux-process .lux-timeline p{color:color-mix(in srgb,var(--lux-paper) 62%,transparent)}.lux-asset-grid{display:grid;grid-template-columns:1.15fr .85fr;grid-template-rows:repeat(2,18rem);gap:1rem}.lux-asset{position:relative;min-height:18rem;overflow:hidden;background:var(--lux-ink-soft)}.lux-asset-featured{grid-row:span 2}.lux-asset img{height:100%;object-fit:cover;transition:transform .8s ease,filter .5s}.lux-asset:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.76))}.lux-asset:hover img{transform:scale(1.04);filter:saturate(.82)}.lux-asset-overlay{position:absolute;z-index:2;inset:auto 0 0;display:grid;grid-template-columns:1fr auto;gap:1.5rem;align-items:end;padding:1.75rem}.lux-asset-overlay span{font-size:.62rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase}.lux-asset-overlay h3{margin:.35rem 0 0;font-family:var(--template-font-heading,var(--lux-serif));font-size:2.6rem;font-weight:400;line-height:1}.lux-services{background:var(--lux-paper-alt)}.lux-services-head{display:grid;grid-template-columns:.7fr 1.3fr;gap:4rem;margin-bottom:4rem}.lux-service-list{border-top:1px solid var(--lux-line)}.lux-service-row{display:grid;grid-template-columns:4.5rem 1fr 1fr 3rem;gap:1.75rem;align-items:center;padding:1.75rem 0;border-bottom:1px solid var(--lux-line);transition:padding .35s,background .35s}.lux-service-row:hover{padding-left:1rem;padding-right:1rem;background:color-mix(in srgb,var(--lux-paper) 42%,transparent)}.lux-service-row>span{font-family:var(--template-font-heading,var(--lux-serif));font-size:1.5rem;color:color-mix(in srgb,var(--lux-ink) 50%,transparent)}.lux-service-row h3{margin:0;font-family:var(--template-font-heading,var(--lux-serif));font-size:2.8rem;font-weight:400;line-height:1}.lux-cinema{position:relative;display:grid;min-height:78svh;align-items:end;overflow:hidden;color:var(--lux-paper);background:var(--lux-ink)}.lux-cinema>img,.lux-private>img{position:absolute;inset:0;height:100%;object-fit:cover}.lux-cinema-scrim,.lux-private-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.74))}.lux-cinema-content{position:relative;z-index:2;display:grid;grid-template-columns:1.35fr .65fr;gap:4rem;align-items:end;padding:7rem var(--lux-pad)}.lux-cinema blockquote{max-width:13ch;margin:0;font-family:var(--template-font-heading,var(--lux-serif));font-size:6rem;font-weight:400;line-height:.92}.lux-cinema-content>div{padding-left:1.75rem;border-left:1px solid var(--lux-light-line)}.lux-cinema-content p{color:color-mix(in srgb,var(--lux-paper) 72%,transparent)}.lux-practice-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:6rem;align-items:center}.lux-practice figure{aspect-ratio:4/5;margin:0;overflow:hidden}.lux-practice figure img{height:100%;object-fit:cover}.lux-principles{display:grid;grid-template-columns:1fr 1fr;margin-top:2.5rem;border-top:1px solid var(--lux-line)}.lux-principles>div{padding:1.15rem 0;border-bottom:1px solid var(--lux-line)}.lux-principles>div:nth-child(odd){padding-right:1rem}.lux-principles>div:nth-child(even){padding-left:1rem}.lux-principles strong,.lux-principles span{display:block}.lux-principles strong{margin-bottom:.3rem;font-family:var(--template-font-heading,var(--lux-serif));font-size:1.6rem;font-weight:400}.lux-audiences{background:var(--lux-stone)}.lux-audience-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:3.5rem;border-top:1px solid var(--lux-line);border-left:1px solid var(--lux-line)}.lux-audience-grid article{display:flex;min-height:23rem;flex-direction:column;justify-content:space-between;padding:1.75rem;border-right:1px solid var(--lux-line);border-bottom:1px solid var(--lux-line);transition:background .35s,color .35s,transform .35s}.lux-audience-grid article:hover{z-index:2;background:var(--lux-ink);color:var(--lux-paper);transform:translateY(-.5rem)}.lux-audience-grid article>div:first-child{display:flex;justify-content:space-between;font-size:.68rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase}.lux-audience-grid h3{margin:0;font-family:var(--template-font-heading,var(--lux-serif));font-size:2.8rem;font-weight:400;line-height:1}.lux-audience-grid article:hover p{color:color-mix(in srgb,var(--lux-paper) 68%,transparent)}.lux-timeline{margin:0;padding:0;border-top:1px solid var(--lux-light-line);list-style:none}.lux-timeline li{display:grid;grid-template-columns:5rem 1fr .8fr;gap:2rem;align-items:start;padding:2.2rem 0;border-bottom:1px solid var(--lux-light-line)}.lux-timeline li>span{display:grid;width:2.4rem;height:2.4rem;place-items:center;border:1px solid var(--lux-light-line);border-radius:50%;font-size:.7rem}.lux-timeline h3{margin:0;font-family:var(--template-font-heading,var(--lux-serif));font-size:2.8rem;font-weight:400;line-height:1}.lux-private{position:relative;display:grid;min-height:70svh;place-items:center;overflow:hidden;color:var(--lux-paper);text-align:center}.lux-private>div:last-child{position:relative;z-index:2;max-width:47rem;padding:4rem var(--lux-pad)}.lux-private .lux-eyebrow{justify-content:center}.lux-private h2{margin:1.2rem 0;font-family:var(--template-font-heading,var(--lux-serif));font-size:5rem;font-weight:400;line-height:.95}.lux-private p{max-width:36rem;margin:0 auto 2rem;color:color-mix(in srgb,var(--lux-paper) 72%,transparent)}.lux-contact-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:6rem}.lux-contact-meta{display:grid;gap:.75rem;margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--lux-line);font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase}.lux-form{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem}.lux-form label{display:grid;gap:.55rem}.lux-form label>span{font-size:.68rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase}.lux-form label:nth-child(4){grid-column:1/-1}.lux-form .input,.lux-form .select,.lux-form .textarea{width:100%;border-radius:0;background:transparent;border-width:0 0 1px;border-color:var(--lux-line);box-shadow:none}.lux-form-foot{grid-column:1/-1;display:flex;justify-content:space-between;gap:2rem;align-items:center}.lux-form-foot p{max-width:25rem}.lux-form-success{display:none;grid-column:1/-1}.lux-form-success.is-visible{display:flex}.lux-footer{display:block;padding:5rem var(--lux-pad) 2rem;background:var(--lux-ink);color:var(--lux-paper)}.lux-footer-grid{display:grid;grid-template-columns:1fr auto;gap:4rem}.lux-footer-brand{font-family:var(--template-font-brand,var(--template-font-heading,var(--lux-serif)));font-size:6rem;line-height:1}.lux-footer nav{display:grid;grid-template-columns:1fr 1fr;gap:.75rem 2rem;font-size:.72rem;text-transform:uppercase}.lux-footer-grid>div:last-child{grid-column:1/-1;display:flex;justify-content:space-between;padding-top:1.2rem;border-top:1px solid var(--lux-light-line);font-size:.64rem;letter-spacing:.12em;text-transform:uppercase}.reveal{opacity:0;transform:translateY(1.5rem);transition:opacity .7s ease,transform .7s ease}.reveal.is-visible{opacity:1;transform:none}@keyframes luxZoom{to{transform:scale(1.08)}}@keyframes luxTicker{to{transform:translateX(-50%)}}
    .lux-menu-button{color:inherit!important;border:1px solid color-mix(in srgb,currentColor 35%,transparent)!important;background:color-mix(in srgb,var(--lux-ink) 12%,transparent)!important}.lux-menu-icon{position:relative;display:block;width:1rem;height:.7rem;border-top:1px solid currentColor;border-bottom:1px solid currentColor}.lux-menu-icon:after{content:"";position:absolute;top:50%;left:0;width:100%;border-top:1px solid currentColor;transform:translateY(-50%)}
    .lux-page,.lux-page *{letter-spacing:0!important}
    @media(max-width:64rem){.lux-title{font-size:4rem}.lux-hero h1{font-size:5.5rem}.lux-statement{font-size:4rem}.lux-cinema blockquote{font-size:4.7rem}.lux-desktop-nav{display:none}.lux-mobile-nav{display:block}.lux-enquire{display:none}.lux-intro-grid,.lux-services-head,.lux-practice-grid,.lux-contact-grid{grid-template-columns:1fr;gap:3rem}.lux-asset-grid{grid-template-columns:1fr 1fr}.lux-asset-featured{grid-column:1/-1;grid-row:auto}.lux-section-head{grid-template-columns:1fr}.lux-section-head>p{justify-self:start}.lux-service-row{grid-template-columns:3.5rem 1fr 3rem}.lux-service-row p{grid-column:2/-1}.lux-cinema-content{grid-template-columns:1fr}.lux-cinema-content>div{max-width:32rem}.lux-timeline li{grid-template-columns:4rem 1fr}.lux-timeline p{grid-column:2}}
    @media(max-width:44rem){.lux-section{padding:5.5rem var(--lux-pad)}.lux-navbar{min-height:4.25rem;padding:.5rem 1rem}.lux-brand{font-size:1.45rem}.lux-hero,.lux-hero-content{min-height:82svh}.lux-hero-content{padding:6.5rem 1.25rem 1.25rem}.lux-hero-main{padding-bottom:1.5rem}.lux-hero h1{font-size:3.6rem;line-height:.94}.lux-hero-main>p{font-size:.92rem}.lux-hero-metrics{margin-top:1.5rem}.lux-hero-metrics>div{padding:.75rem .55rem}.lux-hero-metrics strong{font-size:1.3rem}.lux-hero-foot{gap:1rem;font-size:.53rem}.lux-title,.lux-statement,.lux-private h2{font-size:3.35rem}.lux-intro-copy{grid-template-columns:1fr}.lux-asset-grid{display:grid;grid-template-columns:1fr;grid-template-rows:auto}.lux-asset,.lux-asset-featured{min-height:24rem}.lux-asset-overlay h3{font-size:2.1rem}.lux-service-row{grid-template-columns:2.6rem 1fr 2.6rem;gap:.75rem}.lux-service-row h3{font-size:2.2rem}.lux-cinema{min-height:68svh}.lux-cinema-content{padding:5rem 1.25rem}.lux-cinema blockquote{font-size:3.5rem}.lux-cinema-content>div{padding-left:0;border-left:0}.lux-principles,.lux-audience-grid{grid-template-columns:1fr}.lux-principles>div:nth-child(n){padding:1rem 0}.lux-audience-grid article{min-height:18rem}.lux-timeline li{grid-template-columns:3rem 1fr;gap:1rem}.lux-timeline h3{font-size:2.2rem}.lux-private{min-height:62svh}.lux-form{grid-template-columns:1fr}.lux-form label:nth-child(n),.lux-form-foot,.lux-form-success{grid-column:1}.lux-form-foot{display:grid}.lux-footer-grid{grid-template-columns:1fr}.lux-footer-brand{font-size:4rem}.lux-footer nav{grid-template-columns:1fr}.lux-footer-grid>div:last-child{display:grid;gap:.6rem}.lux-ticker span{padding:1rem 1.25rem}.lux-light-button,.lux-hero-main .btn{min-height:2.8rem}}
    .lux-page h1,.lux-page h2,.lux-page h3,.lux-page p,.lux-page blockquote{overflow-wrap:anywhere}.lux-page .lux-hero h1{overflow-wrap:normal;word-break:normal}.lux-page .btn,.lux-page .input,.lux-page .select,.lux-page .textarea{max-width:100%}
    @media(max-width:64rem){.lux-page main>aside{position:static!important}.lux-intro-grid,.lux-section-head,.lux-services-head,.lux-practice-grid,.lux-contact-grid,.lux-cinema-content{grid-template-columns:minmax(0,1fr)}.lux-service-row{grid-template-columns:3.5rem minmax(0,1fr) 3rem}.lux-timeline li{grid-template-columns:4rem minmax(0,1fr)}}
    @media(max-width:44rem){.lux-hero h1{font-size:3.35rem}.lux-asset-grid,.lux-intro-copy,.lux-principles,.lux-audience-grid,.lux-form,.lux-footer-grid{grid-template-columns:minmax(0,1fr)}.lux-service-row{grid-template-columns:3rem minmax(0,1fr) 3rem;gap:.5rem}.lux-timeline li{grid-template-columns:3rem minmax(0,1fr)}.lux-private{grid-template-columns:minmax(0,1fr)}.lux-private>div:last-child{width:100%}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}.lux-hero>img,.lux-ticker>div{animation:none!important}}
  `;
}

function luxuryPropertyScript() {
  return `(() => {
    const header = document.getElementById('luxuryHeader');
    const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 }) : null;
    document.querySelectorAll('.reveal').forEach(element => observer ? observer.observe(element) : element.classList.add('is-visible'));
    const form = document.getElementById('luxuryEnquiryForm');
    form?.addEventListener('submit', event => {
      event.preventDefault();
      document.getElementById('luxuryFormSuccess')?.classList.add('is-visible');
      form.reset();
    });
  })();`;
}

function imageAt(data, index) {
  return data.images[index % Math.max(data.images.length, 1)] || '/placeholders/real-estate/real-estate-001.jpg';
}

function safeColor(value, fallback) {
  const text = String(value || '').trim();
  return /^(#[0-9a-f]{3,8}|rgb\([\d\s,.%]+\)|rgba\([\d\s,.%]+\))$/i.test(text) ? text : fallback;
}

function cleanText(value) {
  return String(value || '').replace(/[#*_`]+/g, '').replace(/\s+/g, ' ').trim();
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
