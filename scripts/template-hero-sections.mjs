export const heroPatterns = {
  propertySearchOverlay: {
    label: 'Property search overlay',
    atoms: ['glass search panel', 'filter chips', 'image-led hero', 'metrics strip']
  },
  cinematicStatement: {
    label: 'Cinematic statement',
    atoms: ['full-bleed media', 'centered headline', 'gradient overlay', 'floating CTA']
  },
  centeredCarousel: {
    label: 'Centered carousel',
    atoms: ['centered headline', 'highlight words', 'card carousel', 'proof avatars']
  },
  kineticPersona: {
    label: 'Kinetic persona/product',
    atoms: ['dark stage', 'central figure', 'timeline rail', 'floating preview card']
  },
  travelChips: {
    label: 'Travel chips',
    atoms: ['full-bleed landscape', 'headline pill highlight', 'facility chips', 'concierge CTA']
  },
  interiorSplitPanel: {
    label: 'Interior split panel',
    atoms: ['split media/panel', 'warm accent block', 'editorial CTA', 'room feature list']
  },
  architectureStrip: {
    label: 'Architecture strip',
    atoms: ['oversized typography', 'wide image strip', 'caption panel', 'minimal navigation']
  }
};

export function renderHeroSection(template, images) {
  const pattern = template.heroPattern || patternForTemplate(template);

  if (pattern === 'property-search-overlay') return propertySearchOverlay(template, images);
  if (pattern === 'cinematic-statement') return cinematicStatement(template, images);
  if (pattern === 'centered-carousel') return centeredCarousel(template, images);
  if (pattern === 'kinetic-persona') return kineticPersona(template, images);
  if (pattern === 'travel-chips') return travelChips(template, images);
  if (pattern === 'interior-split-panel') return interiorSplitPanel(template, images);
  if (pattern === 'architecture-strip') return architectureStrip(template, images);
  if (pattern === 'product-bottle-stage') return productBottleStage(template, images);
  if (pattern === 'dashboard-browser') return dashboardBrowser(template, images);
  if (pattern === 'service-proof-panel') return serviceProofPanel(template, images);
  if (pattern === 'editorial-gallery') return editorialGallery(template, images);
  if (pattern === 'data-story-map') return dataStoryMap(template, images);
  if (pattern === 'museum-editorial') return museumEditorial(template, images);
  if (pattern === 'human-cause-timeline') return humanCauseTimeline(template, images);

  return defaultMediaHero(template, images);
}

export function renderFullBleedHero(template, images) {
  const pattern = template.heroPattern || patternForTemplate(template);
  const layout = fullBleedLayoutForPattern(pattern);
  const image = images[0];
  const imageTwo = images[1] || image;
  const contentAlign = layout === 'center'
    ? 'mx-auto text-center items-center'
    : layout === 'bottom'
      ? 'justify-end'
      : 'justify-center';
  const contentWidth = layout === 'center' ? 'max-w-5xl' : 'max-w-3xl';
  const overlay = layout === 'center'
    ? 'bg-[linear-gradient(180deg,rgba(0,0,0,.52),rgba(0,0,0,.68)),radial-gradient(circle_at_50%_35%,rgba(255,255,255,.18),transparent_28rem)]'
    : layout === 'bottom'
      ? 'bg-[linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.80)),linear-gradient(90deg,rgba(0,0,0,.45),transparent)]'
      : 'bg-[linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.44),rgba(0,0,0,.16)),linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.58))]';

  return `<section class="template-full-bleed-hero relative min-h-[calc(100svh-4rem)] overflow-hidden bg-neutral text-white">
    <img src="${image}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 ${overlay}"></div>
    <div class="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/45 to-transparent"></div>
    ${layout === 'split' ? `<figure class="pointer-events-none absolute bottom-8 right-[max(1.5rem,6vw)] hidden w-[min(34rem,34vw)] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur lg:block"><img src="${imageTwo}" alt="" class="h-[24rem] w-full rounded-[1.45rem] object-cover"></figure>` : ''}
    <div class="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-[min(1320px,calc(100%-2rem))] flex-col ${contentAlign} py-16 md:py-24">
      <div class="${contentWidth} template-hero-copy">
        <span class="badge badge-primary badge-lg mb-5 shadow-lg">${escapeHtml(template.badge)}</span>
        <h1 class="text-balance text-4xl font-black leading-[.94] tracking-normal text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.55)] sm:text-5xl md:text-7xl xl:text-8xl">${escapeHtml(template.headline)}</h1>
        <p class="${layout === 'center' ? 'mx-auto' : ''} mt-6 max-w-2xl text-lg leading-relaxed text-white/88 drop-shadow-[0_2px_12px_rgba(0,0,0,.55)] md:text-2xl">${escapeHtml(template.subhead)}</p>
        <div class="${layout === 'center' ? 'justify-center' : ''} mt-7 flex flex-wrap gap-3">
          <a class="btn btn-primary rounded-full shadow-xl" href="#contact">${escapeHtml(template.cta)}</a>
          <a class="btn rounded-full border-white/55 bg-white/12 text-white shadow-xl backdrop-blur hover:bg-white hover:text-neutral" href="#sections">${escapeHtml(template.secondary)}</a>
        </div>
        <div class="${layout === 'center' ? 'mx-auto' : ''} mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-box border border-white/24 bg-black/30 shadow-2xl backdrop-blur-md">
          ${template.metrics.map(([value, label]) => `<div class="border-r border-white/20 p-4 last:border-r-0"><div class="text-2xl font-black text-white md:text-4xl">${escapeHtml(value)}</div><div class="mt-1 text-xs text-white/76 md:text-sm">${escapeHtml(label)}</div></div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

export function patternForTemplate(template) {
  if (template.awardPattern === 'museum-editorial') return 'museum-editorial';
  if (template.awardPattern === 'cinematic-luxury') return 'cinematic-statement';
  if (template.awardPattern === 'data-story') return 'data-story-map';
  if (template.awardPattern === 'kinetic-agency') return 'kinetic-persona';
  if (template.awardPattern === 'immersive-product') return 'product-bottle-stage';
  if (template.awardPattern === 'human-cause') return 'human-cause-timeline';
  if (template.category === 'food-drink') return 'product-bottle-stage';
  if (template.category === 'saas') return 'dashboard-browser';
  if (['trades', 'healthcare', 'local-business'].includes(template.category)) return 'service-proof-panel';
  if (['restaurant', 'fitness'].includes(template.category)) return 'cinematic-statement';
  if (['portfolio', 'ecommerce', 'beauty', 'real-estate'].includes(template.category)) return 'editorial-gallery';
  return 'default-media';
}

function fullBleedLayoutForPattern(pattern) {
  if (['cinematic-statement', 'travel-chips', 'centered-carousel'].includes(pattern)) return 'center';
  if (['museum-editorial', 'human-cause-timeline', 'architecture-strip'].includes(pattern)) return 'bottom';
  if (['dashboard-browser', 'data-story-map', 'kinetic-persona'].includes(pattern)) return 'split';
  return 'left';
}

function propertySearchOverlay(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-base-200 shadow-2xl md:min-h-[560px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-85 agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-b from-base-100/15 via-base-100/10 to-base-100"></div>
    <div class="relative z-10 flex min-h-[430px] flex-col justify-between p-4 md:min-h-[560px] md:p-7">
      ${miniNav(template, 'bg-base-100/90 text-base-content')}
      <div class="mx-auto w-full max-w-4xl rounded-box border border-base-300 bg-base-100/95 p-3 shadow-2xl backdrop-blur md:p-4">
        <div class="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
          ${['Location', 'Budget', 'Property type'].map((label, index) => `<label class="input input-bordered flex items-center gap-2 bg-base-100"><span class="text-xs font-bold uppercase text-base-content/50">${label}</span><span class="truncate">${escapeHtml(index === 0 ? template.client : template.sections[index] || 'Any')}</span></label>`).join('')}
          <a class="btn btn-neutral rounded-field" href="#contact">${escapeHtml(template.cta)}</a>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">${chipList(['Low deposit', 'Family homes', 'Near transport', 'Energy rated', 'Book viewing'])}</div>
      </div>
      ${metricStrip(template, 'bg-base-100/95 text-base-content')}
    </div>
  </div>`;
}

function cinematicStatement(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral text-neutral-content shadow-2xl md:min-h-[560px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-65 agency-slow-zoom">
    <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.64)),radial-gradient(circle_at_70%_30%,rgba(255,255,255,.18),transparent_22rem)]"></div>
    <div class="relative z-10 flex min-h-[430px] flex-col justify-between p-5 md:min-h-[560px] md:p-8">
      ${miniNav(template, 'bg-white/12 text-white border-white/15')}
      <div class="mx-auto max-w-3xl text-center">
        <p class="mb-5 text-sm font-bold uppercase tracking-[.28em] text-white/70">${escapeHtml(template.badge)}</p>
        <h3 class="text-4xl font-black leading-none md:text-6xl">${highlightMiddle(template.headline)}</h3>
        <p class="mx-auto mt-5 max-w-2xl text-white/76">${escapeHtml(template.subhead)}</p>
      </div>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-wrap gap-2">${chipList(template.sections.slice(0, 5), 'border-white/25 bg-white/12 text-white')}</div>
        <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </div>
    </div>
  </div>`;
}

function centeredCarousel(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-neutral via-primary to-secondary p-5 text-neutral-content shadow-2xl md:min-h-[560px] md:p-8">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_26rem)]"></div>
    <div class="relative z-10 flex min-h-[390px] flex-col justify-between md:min-h-[500px]">
      ${miniNav(template, 'bg-white/10 text-white border-white/10')}
      <div class="mx-auto max-w-4xl text-center">
        <h3 class="text-4xl font-black leading-tight md:text-6xl">${highlightLastWords(template.headline)}</h3>
        <p class="mx-auto mt-5 max-w-2xl text-white/70">${escapeHtml(template.subhead)}</p>
        <a class="btn btn-accent mt-6 rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </div>
      <div class="mt-8 grid grid-cols-3 gap-3 overflow-hidden pb-1 md:grid-cols-5 md:gap-4">
        ${images.slice(0, 5).map((image, index) => `<figure class="${index > 2 ? 'hidden md:block' : ''} h-36 overflow-hidden rounded-[1.6rem] border border-white/20 shadow-2xl ${index === 2 ? 'md:scale-105' : 'opacity-80'} md:h-48"><img src="${image}" alt="" class="h-full w-full object-cover"></figure>`).join('')}
      </div>
    </div>
  </div>`;
}

function kineticPersona(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral text-neutral-content shadow-2xl md:min-h-[560px]">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,color-mix(in_srgb,var(--color-secondary)_38%,transparent),transparent_18rem),radial-gradient(circle_at_38%_42%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_14rem)]"></div>
    <img src="${images[0]}" alt="" class="absolute left-1/2 top-12 h-[68%] w-[38%] -translate-x-1/2 rounded-[2rem] object-cover opacity-80 mix-blend-screen saturate-150">
    <div class="relative z-10 flex min-h-[430px] flex-col justify-between p-5 md:min-h-[560px] md:p-8">
      ${miniNav(template, 'bg-white/10 text-white border-white/10')}
      <div class="grid gap-5 md:grid-cols-[.9fr_1.1fr_.75fr]">
        <div class="self-center">
          <span class="text-xs font-bold uppercase tracking-[.35em] text-accent">${escapeHtml(template.badge)}</span>
          <h3 class="mt-4 text-5xl font-black leading-none md:text-7xl">${escapeHtml(template.client)}</h3>
          <p class="mt-4 max-w-xs text-white/65">${escapeHtml(template.subhead)}</p>
        </div>
        <div></div>
        <div class="self-end rounded-box border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p class="text-sm text-white/70">Launch preview</p>
          <div class="mt-3 aspect-video overflow-hidden rounded-box"><img src="${images[1]}" alt="" class="h-full w-full object-cover"></div>
        </div>
      </div>
      <div class="grid gap-3 md:grid-cols-3">${template.metrics.map(([value, label]) => `<div class="border-t border-white/20 pt-3"><b class="text-2xl">${escapeHtml(value)}</b><p class="text-sm text-white/60">${escapeHtml(label)}</p></div>`).join('')}</div>
    </div>
  </div>`;
}

function travelChips(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral text-white shadow-2xl md:min-h-[560px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70"></div>
    <div class="relative z-10 flex min-h-[430px] flex-col justify-between p-5 md:min-h-[560px] md:p-8">
      ${miniNav(template, 'bg-white/12 text-white border-white/15')}
      <div class="mx-auto max-w-4xl text-center">
        <h3 class="text-4xl font-black leading-none md:text-7xl">${headlinePill(template.headline)}</h3>
      </div>
      <div class="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p class="mb-3 text-sm font-bold uppercase tracking-[.25em] text-white/70">Facilities available</p>
          <div class="flex max-w-xl flex-wrap gap-2">${chipList(template.sections.slice(0, 6), 'border-white/20 bg-black/20 text-white backdrop-blur')}</div>
        </div>
        <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </div>
    </div>
  </div>`;
}

function interiorSplitPanel(template, images) {
  return `<div class="grid min-h-[430px] overflow-hidden rounded-[2rem] bg-base-100 shadow-2xl md:min-h-[560px] md:grid-cols-[1.15fr_.85fr]">
    <figure class="relative min-h-[260px] overflow-hidden"><img src="${images[0]}" alt="" class="h-full w-full object-cover agency-slow-zoom"><div class="absolute bottom-6 left-6 max-w-xs rounded-box border border-white/20 bg-black/35 p-4 text-white backdrop-blur"><b>${escapeHtml(template.client)}</b><p class="mt-1 text-sm text-white/70">${escapeHtml(template.badge)}</p></div></figure>
    <div class="flex flex-col justify-between bg-accent p-6 text-accent-content md:p-8">
      ${miniNav(template, 'bg-white/20 text-accent-content border-current/10')}
      <div>
        <p class="text-sm font-bold uppercase tracking-[.25em] opacity-70">${escapeHtml(template.badge)}</p>
        <h3 class="mt-4 text-4xl font-black leading-none md:text-6xl">${escapeHtml(template.headline)}</h3>
        <p class="mt-5 max-w-md opacity-75">${escapeHtml(template.subhead)}</p>
      </div>
      <div class="flex flex-wrap gap-3"><a class="btn btn-neutral rounded-full" href="#contact">${escapeHtml(template.cta)}</a><a class="btn btn-outline rounded-full" href="#sections">${escapeHtml(template.secondary)}</a></div>
    </div>
  </div>`;
}

function architectureStrip(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-base-100 p-5 shadow-2xl md:min-h-[560px] md:p-8">
    <div class="grid min-h-[390px] gap-5 md:min-h-[500px] md:grid-rows-[auto_1fr_auto]">
      ${miniNav(template, 'bg-base-200 text-base-content')}
      <div class="grid items-end gap-5 md:grid-cols-[.9fr_1.1fr]">
        <h3 class="text-5xl font-black leading-[.9] md:text-7xl">${escapeHtml(template.headline)}</h3>
        <p class="max-w-sm justify-self-end text-base-content/65">${escapeHtml(template.subhead)}</p>
      </div>
      <figure class="relative h-40 overflow-hidden rounded-box md:h-56"><img src="${images[0]}" alt="" class="h-full w-full object-cover"><figcaption class="absolute bottom-4 right-4 rounded-field bg-base-100/90 px-4 py-2 text-sm font-bold shadow">${escapeHtml(template.cta)}</figcaption></figure>
    </div>
  </div>`;
}

function productBottleStage(template, images) {
  return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-neutral shadow-2xl md:min-h-[560px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/70"></div>
    <div class="relative z-10 flex min-h-[420px] flex-col justify-between p-5 text-white md:min-h-[560px] md:p-8">
      ${miniNav(template, 'bg-white/12 text-white border-white/15')}
      <div class="max-w-3xl">
        <span class="badge badge-primary badge-lg">${escapeHtml(template.badge)}</span>
        <h3 class="mt-5 text-5xl font-black leading-none md:text-7xl">${escapeHtml(template.headline)}</h3>
        <p class="mt-5 max-w-xl text-lg text-white/76">${escapeHtml(template.subhead)}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        ${metricStrip(template, 'border-white/20 bg-white/12 text-white backdrop-blur')}
        <a class="btn btn-primary rounded-full" href="#contact">${escapeHtml(template.cta)}</a>
      </div>
    </div>
  </div>`;
}

function dashboardBrowser(template, images) {
  return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-neutral p-4 text-neutral-content shadow-2xl md:min-h-[560px] md:p-5">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-45 agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-br from-neutral/95 via-neutral/82 to-neutral/55"></div>
    <div class="relative z-10 mockup-browser border border-white/15 bg-base-100 text-base-content shadow-2xl">
      <div class="mockup-browser-toolbar"><div class="input input-bordered w-full">${escapeHtml(template.client.toLowerCase().replaceAll(' ', ''))}.app/dashboard</div></div>
      <div class="grid gap-4 bg-base-200 p-5 md:grid-cols-3">
        <figure class="overflow-hidden rounded-box shadow-xl md:col-span-2"><img src="${images[0]}" alt="" class="h-64 w-full object-cover md:h-80"></figure>
        <div class="stats stats-vertical shadow md:col-span-1">${template.metrics.map(([value, label]) => `<div class="stat"><div class="stat-value text-2xl">${escapeHtml(value)}</div><div class="stat-desc">${escapeHtml(label)}</div></div>`).join('')}</div>
        <div class="card bg-primary text-primary-content shadow-xl md:col-span-3"><div class="card-body flex-row items-center justify-between"><strong>${escapeHtml(template.headline)}</strong><a class="btn btn-neutral rounded-full" href="#contact">${escapeHtml(template.cta)}</a></div></div>
      </div>
    </div>
  </div>`;
}

function serviceProofPanel(template, images) {
  return `<div class="relative min-h-[420px] rounded-[2rem] bg-base-200 p-4 shadow-2xl md:min-h-[520px] md:p-6">
    <div class="grid h-full min-h-[370px] gap-4 md:min-h-[470px] md:grid-cols-2">
      <div class="card bg-base-100 shadow-xl"><div class="card-body"><span class="badge badge-primary">Fast response</span><h3 class="text-3xl font-black">${escapeHtml(template.cta)}</h3><p>${escapeHtml(template.subhead)}</p><button class="btn btn-primary rounded-full">${escapeHtml(template.cta)}</button></div></div>
      <figure class="hidden overflow-hidden rounded-box shadow-xl md:block"><img src="${images[0]}" alt="" class="h-full w-full object-cover"></figure>
      <div class="stats stats-vertical shadow md:col-span-2 md:stats-horizontal">${template.metrics.map(([value, label]) => `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-desc">${escapeHtml(label)}</div></div>`).join('')}</div>
    </div>
  </div>`;
}

function editorialGallery(template, images) {
  return `<div class="relative grid h-[420px] grid-cols-6 grid-rows-6 gap-3 rounded-[2rem] bg-base-200 p-4 shadow-2xl md:h-[560px]">
    ${images.slice(0, 5).map((image, index) => `<figure class="${galleryHeroCell(index)} overflow-hidden rounded-box shadow-xl"><img src="${image}" alt="" class="h-full w-full object-cover transition duration-300 hover:scale-105"></figure>`).join('')}
    <div class="absolute bottom-6 left-6 right-6 rounded-box border border-base-300 bg-base-100/90 p-5 shadow-xl backdrop-blur">
      <strong class="text-2xl">${escapeHtml(template.title)}</strong>
      <p class="mt-2 text-base-content/70">${escapeHtml(template.secondary)} with a polished visual path.</p>
    </div>
  </div>`;
}

function dataStoryMap(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-base-200 p-5 shadow-2xl md:min-h-[560px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-25 agency-slow-zoom">
    <div class="absolute inset-0 bg-base-200/80"></div>
    <div class="relative z-10 grid min-h-[390px] gap-4 md:min-h-[520px] md:grid-cols-[1.1fr_.9fr]">
      <figure class="relative overflow-hidden rounded-box shadow-2xl"><img src="${images[0]}" alt="" class="h-full min-h-[300px] w-full object-cover"><figcaption class="absolute bottom-5 left-5 right-5 rounded-box border border-white/20 bg-black/40 p-4 text-white backdrop-blur"><b>${escapeHtml(template.title)}</b><p class="mt-1 text-sm text-white/70">${escapeHtml(template.subhead)}</p></figcaption></figure>
      <div class="grid gap-4">${template.metrics.map(([value, label], index) => `<div class="card bg-base-100 shadow-xl"><div class="card-body"><span class="text-4xl font-black">${escapeHtml(value)}</span><p>${escapeHtml(label)}</p><progress class="progress progress-primary" value="${70 - index * 12}" max="100"></progress></div></div>`).join('')}</div>
    </div>
  </div>`;
}

function museumEditorial(template, images) {
  return `<div class="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-neutral p-4 text-neutral-content shadow-2xl md:min-h-[560px]">
    <div class="absolute inset-0 grid grid-cols-12 gap-px opacity-20">${Array.from({ length: 48 }, () => '<span class="border border-white/20"></span>').join('')}</div>
    <figure class="absolute right-6 top-8 h-[72%] w-[58%] overflow-hidden rounded-box border border-white/20 shadow-2xl"><img src="${images[0]}" alt="" class="h-full w-full object-cover grayscale contrast-125"></figure>
    <div class="relative z-10 flex min-h-[390px] flex-col justify-between md:min-h-[520px]">
      <div class="max-w-sm"><span class="badge badge-primary">Current exhibition</span><p class="mt-4 text-sm text-neutral-content/70">Archive notes, room sequence, curator context, and ticket path.</p></div>
      <div class="max-w-xl rounded-box border border-white/15 bg-neutral/70 p-5 backdrop-blur"><strong class="text-4xl font-black">01 / ${escapeHtml(template.client)}</strong><p class="mt-2 text-neutral-content/75">A restrained editorial system for art, archive, and cultural institutions.</p></div>
    </div>
  </div>`;
}

function humanCauseTimeline(template, images) {
  return `<div class="relative min-h-[430px] rounded-[2rem] bg-base-200 p-5 shadow-2xl md:min-h-[560px]">
    <div class="grid min-h-[390px] gap-4 md:min-h-[520px] md:grid-cols-[.85fr_1.15fr]">
      <figure class="relative overflow-hidden rounded-box bg-neutral text-neutral-content shadow-xl"><img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-75 agency-slow-zoom"><div class="absolute inset-0 bg-gradient-to-t from-neutral/85 to-transparent"></div><figcaption class="relative z-10 flex h-full min-h-[300px] flex-col justify-end p-6"><span class="badge badge-warning">${escapeHtml(template.badge)}</span><h3 class="mt-4 text-4xl font-black">${escapeHtml(template.headline)}</h3></figcaption></figure>
      <div class="relative rounded-box bg-base-100 p-6 shadow-xl">
        <div class="absolute left-10 top-8 bottom-8 w-px bg-primary"></div>
        ${['Story opened', 'Evidence reviewed', 'People mobilised', 'Action taken'].map((item, index) => `<div class="relative z-10 ml-10 mb-8 rounded-box border border-base-300 bg-base-100 p-4 shadow"><span class="badge badge-primary">${index + 1}</span><strong class="ml-3">${escapeHtml(item)}</strong></div>`).join('')}
      </div>
    </div>
  </div>`;
}

function defaultMediaHero(template, images) {
  return `<div class="relative min-h-[420px] overflow-hidden rounded-[2rem] shadow-2xl md:min-h-[520px]">
    <img src="${images[0]}" alt="" class="absolute inset-0 h-full w-full object-cover agency-slow-zoom">
    <div class="absolute inset-0 bg-gradient-to-t from-neutral/80 to-transparent"></div>
    <div class="absolute bottom-6 left-6 right-6 rounded-box border border-white/20 bg-base-100/90 p-6 backdrop-blur">
      <strong class="text-2xl">${escapeHtml(template.title)}</strong>
      <p class="mt-2 text-base-content/70">${escapeHtml(template.secondary)} with a clear conversion path.</p>
    </div>
  </div>`;
}

function miniNav(template, tone) {
  return `<div class="flex items-center justify-between rounded-full border px-3 py-2 text-sm ${tone}">
    <b>${escapeHtml(template.client)}</b>
    <div class="hidden gap-3 md:flex">${template.sections.slice(0, 3).map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>
    <span class="badge badge-primary">${escapeHtml(template.cta)}</span>
  </div>`;
}

function metricStrip(template, tone) {
  return `<div class="grid grid-cols-3 overflow-hidden rounded-box border border-base-300 shadow-xl ${tone}">
    ${template.metrics.map(([value, label]) => `<div class="border-r border-base-300 p-4 last:border-r-0"><b class="text-2xl">${escapeHtml(value)}</b><p class="text-xs opacity-65">${escapeHtml(label)}</p></div>`).join('')}
  </div>`;
}

function chipList(items, tone = 'border-base-300 bg-base-100 text-base-content') {
  return items.map(item => `<span class="badge badge-lg rounded-full border ${tone}">${escapeHtml(item)}</span>`).join('');
}

function highlightMiddle(text) {
  const words = String(text || '').split(/\s+/);
  const mid = Math.max(1, Math.floor(words.length / 2));
  return words.map((word, index) => index === mid ? `<span class="text-primary">${escapeHtml(word)}</span>` : escapeHtml(word)).join(' ');
}

function highlightLastWords(text) {
  const words = String(text || '').split(/\s+/);
  return words.map((word, index) => index >= words.length - 3 ? `<span class="text-accent">${escapeHtml(word)}</span>` : escapeHtml(word)).join(' ');
}

function headlinePill(text) {
  const words = String(text || '').split(/\s+/);
  return words.map((word, index) => index === Math.floor(words.length / 2) ? `<span class="rounded-full bg-white px-3 text-neutral">${escapeHtml(word)}</span>` : escapeHtml(word)).join(' ');
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
