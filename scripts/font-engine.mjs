export const fontCollection = {
  title: 'Modern Website Font Groups for 2025/2026',
  created_at: '2026-07-11',
  validation: {
    source: 'Open Google Fonts families with commercial-use friendly licensing through the Google Fonts catalogue.',
    rules: [
      'Body font must be legible at 16px on mobile.',
      'Heading and body pairing must create either family harmony or intentional contrast.',
      'Display/accent fonts are only assigned to brand or hero roles, never long body copy.',
      'Fallback stacks are included for every role.',
      'Groups avoid more than three families to protect performance.'
    ]
  },
  trends: [
    'Variable and multi-weight families for flexible responsive systems.',
    'Neutral UI sans fonts for product clarity.',
    'Humanist/geometric sans pairings for SaaS and service brands.',
    'Editorial serif headlines for premium, AI, culture, and hospitality brands.',
    'Expressive display faces used sparingly for campaign personality.'
  ],
  groups: [
    group('inter-editorial-serif', 'Inter Editorial Serif', 'clean AI/editorial trust', ['AI products', 'consultants', 'knowledge brands'], 'Instrument Serif', 'Inter', 'Inter', 'Inter'),
    group('space-grotesk-manrope', 'Space Grotesk + Manrope', 'future-facing product clarity', ['SaaS', 'developer tools', 'cybersecurity'], 'Space Grotesk', 'Manrope', 'Space Grotesk', 'IBM Plex Mono'),
    group('dm-sans-newsreader', 'DM Sans + Newsreader', 'warm modern publishing', ['blogs', 'lifestyle', 'service brands'], 'Newsreader', 'DM Sans', 'DM Sans', 'Newsreader'),
    group('plus-jakarta-sans', 'Plus Jakarta Product', 'polished app interface', ['dashboards', 'fintech', 'B2B services'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'IBM Plex Mono'),
    group('outfit-fraunces', 'Outfit + Fraunces', 'friendly premium commerce', ['ecommerce', 'food brands', 'creator shops'], 'Fraunces', 'Outfit', 'Outfit', 'Fraunces'),
    group('instrument-sans-serif', 'Instrument Studio', 'gallery-grade design studio', ['portfolios', 'architecture', 'agencies'], 'Instrument Serif', 'Instrument Sans', 'Instrument Sans', 'Instrument Serif'),
    group('bricolage-grotesque', 'Bricolage Grotesque', 'playful creative utility', ['kids apps', 'creator tools', 'education'], 'Bricolage Grotesque', 'DM Sans', 'Bricolage Grotesque', 'Bricolage Grotesque'),
    group('archivo-lora', 'Archivo + Lora', 'confident editorial service', ['local services', 'healthcare', 'nonprofits'], 'Archivo', 'Source Sans 3', 'Archivo', 'Lora'),
    group('playfair-source-sans', 'Playfair Display + Source Sans 3', 'classic premium hospitality', ['restaurants', 'beauty', 'hotels', 'boutiques'], 'Playfair Display', 'Source Sans 3', 'Source Sans 3', 'Playfair Display'),
    group('urbanist-libre', 'Urbanist + Libre Baskerville', 'modern heritage', ['real estate', 'architecture', 'consultants'], 'Libre Baskerville', 'Urbanist', 'Urbanist', 'Libre Baskerville'),
    group('syne-inter', 'Syne + Inter', 'bold campaign system', ['launch pages', 'music', 'events', 'fitness'], 'Syne', 'Inter', 'Inter', 'Syne'),
    group('ibm-plex-system', 'IBM Plex Superfamily', 'technical institutional clarity', ['data products', 'research', 'government', 'fintech'], 'IBM Plex Sans', 'IBM Plex Sans', 'IBM Plex Sans', 'IBM Plex Mono')
  ]
};

export const enrichedFontGroups = fontCollection.groups.map(validateFontGroup);

export function recommendedFontGroupForTemplate(template) {
  const category = String(template.category || '').toLowerCase();
  const text = `${template.title || ''} ${template.badge || ''} ${template.client || ''}`.toLowerCase();
  if (category === 'saas' || text.includes('data')) return 'space-grotesk-manrope';
  if (text.includes('ai')) return 'inter-editorial-serif';
  if (category === 'restaurant' || category === 'beauty') return 'playfair-source-sans';
  if (category === 'food-drink' || category === 'ecommerce') return 'outfit-fraunces';
  if (category === 'portfolio' || category === 'agency') return 'instrument-sans-serif';
  if (category === 'fitness' || text.includes('spaceage')) return 'syne-inter';
  if (category === 'real-estate') return 'urbanist-libre';
  if (category === 'healthcare' || category === 'trades' || category === 'local-business') return 'archivo-lora';
  return 'plus-jakarta-sans';
}

export function fontImportBlock() {
  const families = new Set();
  for (const groupItem of enrichedFontGroups) {
    for (const family of [groupItem.fonts.heading, groupItem.fonts.body, groupItem.fonts.brand, groupItem.fonts.accent]) {
      families.add(family);
    }
  }
  const familyParams = [...families].sort().map(family => `family=${encodeURIComponent(family).replaceAll('%20', '+')}:wght@400;500;600;700;800;900`).join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`;
}

export function fontStyleBlock() {
  return `${enrichedFontGroups.map(groupItem => `[data-font-group="${groupItem.id}"]{--template-font-heading:${fontStack(groupItem.fonts.heading)};--template-font-body:${fontStack(groupItem.fonts.body)};--template-font-brand:${fontStack(groupItem.fonts.brand)};--template-font-accent:${fontStack(groupItem.fonts.accent)}}`).join('\n')}
body{font-family:var(--template-font-body,Inter,ui-sans-serif,system-ui,sans-serif)}
h1,h2,h3,.card-title,.font-black{font-family:var(--template-font-heading,Inter,ui-sans-serif,system-ui,sans-serif);letter-spacing:0}
.navbar-start .btn,.badge,.stat-value{font-family:var(--template-font-brand,var(--template-font-heading))}
code,kbd,pre,.mockup-code{font-family:var(--template-font-accent,ui-monospace,SFMono-Regular,Menlo,monospace)}`;
}

function group(id, name, style, bestFor, heading, body, brand, accent) {
  return {
    id,
    name,
    style,
    best_for: bestFor,
    fonts: { heading, body, brand, accent },
    fallback: {
      heading: fallbackFor(heading),
      body: fallbackFor(body),
      brand: fallbackFor(brand),
      accent: fallbackFor(accent)
    }
  };
}

function validateFontGroup(fontGroup) {
  const families = new Set(Object.values(fontGroup.fonts));
  const hasReadableBody = !/Serif|Display|Fraunces|Newsreader|Lora|Baskerville|Syne|Bricolage/.test(fontGroup.fonts.body);
  const warnings = [];
  if (!hasReadableBody) warnings.push('Body role uses an expressive family; review long-form readability.');
  if (families.size > 3) warnings.push('More than three font families may affect performance.');
  if (!fontGroup.fonts.heading || !fontGroup.fonts.body || !fontGroup.fonts.brand) warnings.push('Missing required font role.');
  return {
    ...fontGroup,
    validation: {
      passed: warnings.length === 0,
      readableBody: hasReadableBody,
      familyCount: families.size,
      variableFriendly: true,
      warnings
    }
  };
}

function fallbackFor(fontName) {
  if (/Mono/i.test(fontName)) return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  if (/Serif|Fraunces|Newsreader|Lora|Baskerville|Playfair/i.test(fontName)) return 'Georgia, Cambria, Times New Roman, serif';
  return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
}

function fontStack(fontName) {
  return `"${fontName}", ${fallbackFor(fontName)}`;
}
