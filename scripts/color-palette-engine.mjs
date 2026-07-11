export const paletteCollection = {
  title: '20 Modern Website Colour Palettes for 2025/2026',
  created_at: '2026-07-11',
  science: {
    contrastStandard: 'WCAG 2.x contrast ratio',
    normalTextAA: 4.5,
    largeTextAA: 3,
    method: 'Relative luminance with automatic foreground checks for primary, secondary, accent, surface, and background roles.'
  },
  sources: [
    'Pantone Cloud Dancer and Mocha Mousse trend direction',
    'WGSN and Coloro Transformative Teal 2026 direction',
    'Contemporary high-contrast web, editorial, and product interface palette patterns'
  ],
  palettes: [
    {
      id: 'cloud-dancer-minimal',
      name: 'Cloud Dancer Minimal',
      style: 'calm premium minimalism',
      best_for: ['consultants', 'AI tools', 'wellness', 'portfolio sites'],
      colors: {
        background: '#F8F7F2',
        surface: '#FFFFFF',
        primary: '#1D3557',
        secondary: '#9FB3C8',
        accent: '#E5B567',
        text: '#172033',
        muted: '#6B7280',
        border: '#E8E2D8',
        on_primary: '#FFFFFF',
        on_secondary: '#111111',
        on_accent: '#111111'
      },
      gradient: ['#F8F7F2', '#EEF4F8']
    },
    {
      id: 'mocha-mousse-studio',
      name: 'Mocha Mousse Studio',
      style: 'warm editorial luxury',
      best_for: ['restaurants', 'boutiques', 'creative studios', 'beauty brands'],
      colors: {
        background: '#F5EFE8',
        surface: '#FFF7EF',
        primary: '#6F4E37',
        secondary: '#C9A27E',
        accent: '#2F7D6D',
        text: '#2B211C',
        muted: '#6F584B',
        border: '#E1D2C3',
        on_primary: '#FFFFFF',
        on_secondary: '#111111',
        on_accent: '#FFFFFF'
      },
      gradient: ['#FFF7EF', '#E7D1BD']
    },
    {
      id: 'transformative-teal-saas',
      name: 'Transformative Teal SaaS',
      style: 'clean trustworthy tech',
      best_for: ['SaaS', 'fintech', 'dashboards', 'B2B services'],
      colors: {
        background: '#F2FBF8',
        surface: '#FFFFFF',
        primary: '#006B68',
        secondary: '#7AD7C7',
        accent: '#FFB000',
        text: '#0A2526',
        muted: '#607273',
        border: '#D7EDEA',
        on_primary: '#FFFFFF',
        on_secondary: '#111111',
        on_accent: '#111111'
      },
      gradient: ['#006B68', '#7AD7C7']
    },
    {
      id: 'future-dusk-ai',
      name: 'Future Dusk AI',
      style: 'moody futuristic dark mode',
      best_for: ['AI products', 'developer tools', 'cybersecurity', 'gaming'],
      colors: {
        background: '#111827',
        surface: '#1F2340',
        primary: '#4C4FA3',
        secondary: '#7C3AED',
        accent: '#C4F1F9',
        text: '#F8FAFC',
        muted: '#A6ADBB',
        border: '#303858',
        on_primary: '#FFFFFF',
        on_secondary: '#FFFFFF',
        on_accent: '#111111'
      },
      gradient: ['#111827', '#4C4FA3', '#7C3AED']
    },
    {
      id: 'dopamine-pop',
      name: 'Dopamine Pop',
      style: 'playful saturated web',
      best_for: ['kids apps', 'creator tools', 'games', 'youth brands'],
      colors: {
        background: '#FFF7FD',
        surface: '#FFFFFF',
        primary: '#FF3EA5',
        secondary: '#00D1FF',
        accent: '#FFE45E',
        text: '#18181B',
        muted: '#6F6B7A',
        border: '#F4C9EA',
        on_primary: '#111111',
        on_secondary: '#111111',
        on_accent: '#111111'
      },
      gradient: ['#FF3EA5', '#00D1FF', '#FFE45E']
    },
    modernPalette('cerulean-coast', 'Cerulean Coast', 'fresh optimistic blue', ['travel', 'health', 'education', 'local services'], '#F1FAFF', '#FFFFFF', '#006DAA', '#7DD3FC', '#F97316', '#082F49', '#64748B', '#D8EEF8'),
    modernPalette('botanical-lime', 'Botanical Lime', 'natural growth energy', ['food brands', 'wellness', 'sustainability', 'gardening'], '#F6FBEF', '#FFFFFF', '#386641', '#A7C957', '#FFB703', '#132A13', '#61705F', '#DDE8CC'),
    modernPalette('ink-coral-editorial', 'Ink Coral Editorial', 'sharp magazine contrast', ['fashion', 'portfolios', 'agencies', 'campaigns'], '#FAF7F2', '#FFFFFF', '#111827', '#FB7185', '#2563EB', '#111827', '#6B7280', '#E8E1D8'),
    modernPalette('plum-library', 'Plum Library', 'expressive premium purple', ['luxury', 'education', 'creative studios', 'events'], '#F7F2F7', '#FFFFFF', '#4A214E', '#A78BFA', '#D6A85D', '#231426', '#756477', '#E7DCE8'),
    modernPalette('sunlit-clay', 'Sunlit Clay', 'earthy handcrafted warmth', ['restaurants', 'makers', 'interiors', 'hospitality'], '#FFF6EC', '#FFFFFF', '#A44A3F', '#E9A66A', '#2F7D6D', '#2D1B16', '#7B6259', '#E9D5C6'),
    modernPalette('silver-fintech', 'Silver Fintech', 'precise regulated trust', ['fintech', 'legal', 'insurance', 'B2B SaaS'], '#F4F7FA', '#FFFFFF', '#1F3A5F', '#91A4B7', '#14B8A6', '#0F172A', '#566879', '#D8E1EA'),
    modernPalette('electric-night', 'Electric Night', 'high contrast performance', ['fitness', 'music', 'events', 'launch pages'], '#09090B', '#18181B', '#EAB308', '#EF4444', '#22D3EE', '#FAFAFA', '#A1A1AA', '#27272A'),
    modernPalette('rose-quartz-care', 'Rose Quartz Care', 'soft healthcare warmth', ['clinics', 'beauty', 'therapy', 'wellness'], '#FFF7F7', '#FFFFFF', '#9F1239', '#FDA4AF', '#2DD4BF', '#2A1118', '#7C6269', '#F4DCE1'),
    modernPalette('graphite-lime-agency', 'Graphite Lime Agency', 'confident creative tech', ['agencies', 'AI tools', 'startups', 'developer products'], '#101214', '#1B1F22', '#D9F99D', '#38BDF8', '#F472B6', '#F8FAFC', '#A3A3A3', '#2B3035'),
    modernPalette('butter-blue-commerce', 'Butter Blue Commerce', 'friendly retail clarity', ['ecommerce', 'food', 'kids brands', 'creator shops'], '#FFFBEB', '#FFFFFF', '#1D4ED8', '#FDE68A', '#F97316', '#1E293B', '#6B7280', '#EFE4C1'),
    modernPalette('sage-stone-architecture', 'Sage Stone Architecture', 'quiet spatial restraint', ['architecture', 'real estate', 'interiors', 'consultants'], '#F5F5F0', '#FFFFFF', '#4D6659', '#C7D2C4', '#B08968', '#1F2933', '#5C655E', '#DADDD4'),
    modernPalette('ruby-cream-hospitality', 'Ruby Cream Hospitality', 'rich dining atmosphere', ['restaurants', 'hotels', 'bars', 'venues'], '#FFF8ED', '#FFFFFF', '#7F1D1D', '#FCA5A5', '#D97706', '#2A1515', '#7A5C58', '#EBD8C7'),
    withColorOverrides(
      modernPalette('arctic-mint-product', 'Arctic Mint Product', 'clean hardware launch', ['product drops', 'devices', 'SaaS', 'health tech'], '#F4FFFD', '#FFFFFF', '#0F766E', '#99F6E4', '#6D28D9', '#102A2A', '#64748B', '#D6F2ED'),
      { on_accent: '#FFFFFF' }
    ),
    modernPalette('black-white-vermilion', 'Black White Vermilion', 'museum-grade statement', ['art', 'fashion', 'portfolios', 'campaigns'], '#FAFAFA', '#FFFFFF', '#0A0A0A', '#E5E5E5', '#DC2626', '#0A0A0A', '#666666', '#E5E5E5'),
    modernPalette('ocean-mango-local', 'Ocean Mango Local', 'approachable service energy', ['trades', 'travel', 'local business', 'education'], '#F2FAFB', '#FFFFFF', '#0369A1', '#67E8F9', '#F59E0B', '#0C2D3A', '#60747A', '#D6EDEF')
  ]
};

export const enrichedPalettes = paletteCollection.palettes.map(analyzePalette);

export function recommendedPaletteForTemplate(template) {
  const category = String(template.category || '').toLowerCase();
  const text = `${template.title || ''} ${template.badge || ''} ${template.client || ''}`.toLowerCase();
  if (category === 'saas' || text.includes('ai') || text.includes('data')) return 'transformative-teal-saas';
  if (category === 'restaurant' || category === 'beauty') return 'mocha-mousse-studio';
  if (category === 'fitness' || text.includes('spaceage')) return 'electric-night';
  if (category === 'food-drink' || category === 'ecommerce') return 'dopamine-pop';
  if (category === 'healthcare') return 'rose-quartz-care';
  if (category === 'real-estate') return 'sage-stone-architecture';
  if (category === 'portfolio') return 'cloud-dancer-minimal';
  if (category === 'agency') return 'graphite-lime-agency';
  return 'cloud-dancer-minimal';
}

export function cssVariablesForPalette(palette) {
  const colors = palette.colors;
  return [
    ['--color-base-100', colors.background],
    ['--color-base-200', palette.gradient?.[1] || colors.border],
    ['--color-base-300', colors.border],
    ['--color-base-content', colors.text],
    ['--color-primary', colors.primary],
    ['--color-primary-content', colors.on_primary],
    ['--color-secondary', colors.secondary],
    ['--color-secondary-content', colors.on_secondary],
    ['--color-accent', colors.accent],
    ['--color-accent-content', colors.on_accent],
    ['--color-neutral', colors.text],
    ['--color-neutral-content', colors.background],
    ['--color-info', colors.secondary],
    ['--color-info-content', colors.on_secondary],
    ['--color-success', colors.accent],
    ['--color-success-content', colors.on_accent],
    ['--color-warning', colors.accent],
    ['--color-warning-content', colors.on_accent],
    ['--color-error', '#DC2626'],
    ['--color-error-content', '#FFFFFF']
  ].map(([key, value]) => `${key}:${value}`).join(';');
}

export function paletteStyleBlock() {
  return enrichedPalettes.map(palette => `[data-palette="${palette.id}"]{${cssVariablesForPalette(palette)}}`).join('\n');
}

export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function analyzePalette(palette) {
  const colors = palette.colors;
  const contrast = {
    text_on_background: contrastRatio(colors.text, colors.background),
    text_on_surface: contrastRatio(colors.text, colors.surface),
    muted_on_background: contrastRatio(colors.muted, colors.background),
    on_primary: contrastRatio(colors.on_primary, colors.primary),
    on_secondary: contrastRatio(colors.on_secondary, colors.secondary),
    on_accent: contrastRatio(colors.on_accent, colors.accent)
  };
  const warnings = Object.entries(contrast)
    .filter(([, ratio]) => ratio < 4.5)
    .map(([pair, ratio]) => `${pair} contrast ${ratio}:1 is below WCAG AA normal text target`);
  return {
    ...palette,
    contrast,
    accessibility: {
      normalTextAA: warnings.length === 0,
      largeTextAA: Object.values(contrast).every(ratio => ratio >= 3),
      warnings
    }
  };
}

function modernPalette(id, name, style, bestFor, background, surface, primary, secondary, accent, text, muted, border) {
  return {
    id,
    name,
    style,
    best_for: bestFor,
    colors: {
      background,
      surface,
      primary,
      secondary,
      accent,
      text,
      muted,
      border,
      on_primary: readableOn(primary),
      on_secondary: readableOn(secondary),
      on_accent: readableOn(accent)
    },
    gradient: [background, mixHex(background, secondary, 0.18)]
  };
}

function withColorOverrides(palette, colors) {
  return {
    ...palette,
    colors: {
      ...palette.colors,
      ...colors
    }
  };
}

function readableOn(hex) {
  return contrastRatio('#FFFFFF', hex) >= contrastRatio('#111111', hex) ? '#FFFFFF' : '#111111';
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  const clean = String(hex).replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean;
  return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
}

function mixHex(a, b, amount) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const mixed = ar.map((channel, index) => Math.round(channel * (1 - amount) + br[index] * amount));
  return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`;
}
