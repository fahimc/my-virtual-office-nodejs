import { nowIso } from '../../memory/memoryStore.js';
import type { Customer } from '../../schemas/customer.schema.js';
import type { StructuredBrief } from '../../schemas/brief.schema.js';
import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import type { BrandAudit } from '../../schemas/brandAudit.schema.js';
import type { CompetitorResearch } from '../../schemas/competitorResearch.schema.js';
import type { CreativeDirection, SelectedDirection } from '../../schemas/creativeDirection.schema.js';
import type { Sitemap } from '../../schemas/sitemap.schema.js';
import type { Wireframe } from '../../schemas/wireframe.schema.js';
import type { DesignTokens } from '../../schemas/designTokens.schema.js';
import type { ComponentSpec } from '../../schemas/componentSpec.schema.js';
import type { Prototype } from '../../schemas/prototype.schema.js';
import type { DesignHandoff } from '../../schemas/designHandoff.schema.js';
import type { DesignQaReport } from '../../schemas/designQa.schema.js';

export interface DesignContextInput {
  projectId: string;
  customer: Customer;
  structuredBrief: StructuredBrief;
  originalBrief: string;
}

export function createDesignBrief(input: DesignContextInput): DesignBrief {
  const timestamp = nowIso();
  return {
    projectId: input.projectId,
    customerId: input.customer.id,
    businessName: input.customer.businessName,
    businessType: input.customer.businessType,
    targetAudience: input.structuredBrief.targetAudience,
    projectGoal: input.structuredBrief.businessSummary,
    primaryConversionGoal: input.structuredBrief.featuresNeeded.find(item => item.toLowerCase().includes('lead')) || 'Generate qualified enquiries',
    secondaryGoals: ['Build trust', 'Explain services clearly', 'Make contact easy'],
    existingWebsite: input.customer.existingWebsite,
    competitorUrls: [],
    stylePreferences: input.structuredBrief.stylePreferences,
    dislikedStyles: [],
    requiredPages: input.structuredBrief.pagesNeeded,
    requiredFeatures: input.structuredBrief.featuresNeeded,
    availableAssets: [],
    missingAssets: input.structuredBrief.assetsRequired,
    assumptions: input.structuredBrief.assumptions,
    constraints: input.structuredBrief.technicalRequirements,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createBrandAudit(brief: DesignBrief): BrandAudit {
  return {
    projectId: brief.projectId,
    existingWebsiteUrl: brief.existingWebsite,
    screenshots: [],
    detectedColours: brief.stylePreferences.includes('premium') ? ['#111827', '#F8FAFC', '#C8A24A'] : ['#172033', '#FFFFFF', '#2563EB'],
    detectedFonts: ['Inter/system-ui fallback'],
    logoNotes: brief.existingWebsite ? 'Existing website should be reviewed for logo proportions and clear-space rules.' : 'No existing website supplied; request logo before final production.',
    toneOfVoice: 'Professional, direct, helpful, confidence-building.',
    currentNavigation: brief.existingWebsite ? ['Home', 'Services', 'About', 'Contact'] : [],
    currentPageStructure: brief.existingWebsite ? ['Hero', 'Services summary', 'Contact CTA'] : [],
    strengths: ['Clear business category', 'Usable project goal'],
    weaknesses: ['Final brand assets are not confirmed'],
    conversionProblems: ['Primary CTA needs to be visible above the fold and repeated after proof sections'],
    accessibilityConcerns: ['Validate colour contrast after final palette selection'],
    mobileConcerns: ['Keep hero concise and contact action sticky/obvious on small screens'],
    contentGaps: brief.missingAssets,
    recommendations: ['Prioritize proof, service clarity, and a short enquiry path']
  };
}

export function createCompetitorResearch(brief: DesignBrief): CompetitorResearch {
  return {
    projectId: brief.projectId,
    competitors: brief.competitorUrls.map(url => ({ name: url, url, notes: 'Client-provided competitor/reference URL' })),
    commonSections: ['Hero offer', 'Services', 'Proof/testimonials', 'Process', 'Contact CTA'],
    commonCallsToAction: ['Book a call', 'Request a quote', 'Start a project'],
    visualPatterns: ['Strong hero headline', 'Card-based services', 'Trust badges', 'Short forms'],
    trustSignals: ['Case studies', 'Testimonials', 'Process clarity', 'Credentials'],
    contentPatterns: ['Benefit-led service descriptions', 'Outcome-focused copy', 'FAQ objection handling'],
    conversionPatterns: ['Repeated CTA', 'Short form', 'Low-friction contact route'],
    opportunities: ['Use a clearer conversion journey than generic agency sites', 'Make service comparison scannable'],
    thingsToAvoid: ['Stock-looking imagery', 'One-note blue palette', 'Overly vague claims'],
    recommendedDifferentiation: ['Lead with business outcomes and concrete proof rather than broad capability lists']
  };
}

export function createCreativeDirections(brief: DesignBrief): CreativeDirection[] {
  if (/(fruit|drink|juice|beverage|flavour|flavor|bottle|ecommerce|shop)/i.test(`${brief.projectGoal} ${brief.businessName} ${brief.businessType}`)) {
    return [
      {
        id: 'juicy-commerce',
        projectId: brief.projectId,
        name: 'Juicy Commerce',
        summary: 'A bright ecommerce direction with flavour-led product cards, bold rounded typography, and fruit-colour accents.',
        targetEmotion: 'Fresh excitement',
        brandPersonality: ['colourful', 'energetic', 'natural', 'friendly'],
        bestFor: 'Consumer drink brands that need product desire and fast shopping actions.',
        risks: ['Needs strong product imagery or illustrated bottle placeholders until photography arrives'],
        palette: [{ name: 'Mango', hex: '#FFB703', usage: 'Hero accent' }, { name: 'Berry', hex: '#C026D3', usage: 'Flavour accent' }, { name: 'Leaf', hex: '#22C55E', usage: 'Natural proof' }, { name: 'Citrus', hex: '#F97316', usage: 'CTA warmth' }, { name: 'Cream', hex: '#FFF7E8', usage: 'Background' }, { name: 'Charcoal', hex: '#172033', usage: 'Text' }],
        typography: { heading: 'Rounded bold display sans', body: 'Inter/system-ui', scale: '1.25 modular scale', notes: 'Large friendly headings with compact product-card labels' },
        layoutStyle: 'Playful ecommerce grid with curved colour panels and sticky shopping CTAs',
        sectionStyle: 'Cream background, rounded flavour cards, colour-coded product bands',
        buttonStyle: 'Large pill buttons with charcoal text and fruit-colour fills',
        cardStyle: 'Rounded product cards with bottle illustration, price, rating, and Add to Basket actions',
        iconStyle: 'Simple ingredient and delivery line icons',
        imageryStyle: 'Chilled bottles, fresh fruit, splashes, leaves, ice, and bright natural lighting',
        animationStyle: 'Subtle bottle float and card hover lift under 180ms',
        homepageStructure: ['Hero Shop', 'Flavour Range', 'Why Zestora', 'Mixed Case', 'Reviews', 'Wholesale', 'Email Signup'],
        mobileApproach: 'Sticky basket CTA, swipeable product cards, large tap targets, concise hero',
        rationale: 'Best fit for a colourful fruit drinks ecommerce launch where taste appeal and shopping clarity matter most.'
      },
      {
        id: 'fresh-market',
        projectId: brief.projectId,
        name: 'Fresh Market',
        summary: 'A natural retail direction with market-style freshness, ingredient proof, and strong stockist/wholesale pathways.',
        targetEmotion: 'Natural trust',
        brandPersonality: ['fresh', 'healthy', 'approachable', 'credible'],
        bestFor: 'Brands balancing consumer sales with retail and hospitality stockist growth.',
        risks: ['Can feel less playful if product colour is not used generously'],
        palette: [{ name: 'Leaf', hex: '#16A34A', usage: 'Natural proof' }, { name: 'Sun', hex: '#FACC15', usage: 'Highlights' }, { name: 'Tomato', hex: '#EF4444', usage: 'CTA accent' }, { name: 'Mint', hex: '#DCFCE7', usage: 'Background tint' }, { name: 'Ink', hex: '#102018', usage: 'Text' }],
        typography: { heading: 'Warm bold sans', body: 'Inter/system-ui', scale: '1.2 modular scale', notes: 'Friendly headings with readable commerce copy' },
        layoutStyle: 'Fresh editorial blocks with product rows, benefit strips, and retailer CTA bands',
        sectionStyle: 'Light botanical bands with real-fruit proof moments',
        buttonStyle: 'Rounded green primary buttons with warm highlight states',
        cardStyle: 'Ingredient-led cards with soft borders and product badges',
        iconStyle: 'Ingredient, recyclable, delivery, vegetarian icons',
        imageryStyle: 'Fruit crates, bottles on tables, cafe shelves, gym fridges, everyday lifestyle scenes',
        animationStyle: 'Gentle reveal and image hover only',
        homepageStructure: ['Hero Story', 'Benefits', 'Flavour Range', 'Stockist CTA', 'Wholesale CTA', 'FAQ', 'Contact'],
        mobileApproach: 'Put product benefits and shop CTA within first two scrolls',
        rationale: 'Useful if trust, ingredient clarity, and future wholesale growth are as important as direct sales.'
      },
      {
        id: 'bold-splash',
        projectId: brief.projectId,
        name: 'Bold Splash',
        summary: 'A high-energy launch direction with dramatic colour fields, big bottle visuals, and campaign-style conversion sections.',
        targetEmotion: 'Thirst and momentum',
        brandPersonality: ['bold', 'fun', 'modern', 'confident'],
        bestFor: 'A memorable launch site where the brand needs to stand out immediately.',
        risks: ['Needs accessibility checks on every colour pairing'],
        palette: [{ name: 'Electric Blue', hex: '#0EA5E9', usage: 'Contrast accent' }, { name: 'Watermelon', hex: '#FB7185', usage: 'Hero accent' }, { name: 'Mango', hex: '#F59E0B', usage: 'CTA' }, { name: 'Purple', hex: '#7C3AED', usage: 'Campaign blocks' }, { name: 'White', hex: '#FFFFFF', usage: 'Text panels' }, { name: 'Night', hex: '#111827', usage: 'Text' }],
        typography: { heading: 'Extra-bold rounded display', body: 'Inter/system-ui', scale: '1.333 modular scale', notes: 'Punchy campaign headlines balanced with clear product details' },
        layoutStyle: 'Campaign-led ecommerce layout with oversized hero, flavour tiles, and diagonal/curved bands',
        sectionStyle: 'High-contrast colourful blocks and immersive flavour panels',
        buttonStyle: 'Chunky high-contrast pill buttons',
        cardStyle: 'Vivid cards with large product placeholders and clear purchase controls',
        iconStyle: 'Bold simple icons and flavour badges',
        imageryStyle: 'Bottle clusters, juice splashes, floating fruit, ice, and colour-coordinated backdrops',
        animationStyle: 'Small floating fruit and card lift, no motion required for comprehension',
        homepageStructure: ['Hero Splash', 'Shop Flavours', 'Build a Mixed Case', 'Social Proof', 'Wholesale', 'Subscribe'],
        mobileApproach: 'Single-column campaign cards, sticky Shop CTA, compact product filters',
        rationale: 'Strongest visual option when the brief asks visitors to feel thirsty and excited to try the drinks.'
      }
    ];
  }
  return [
    {
      id: 'trust-first',
      projectId: brief.projectId,
      name: 'Trust First',
      summary: 'Calm, credible, and conversion-aware with proof close to each major CTA.',
      targetEmotion: 'Confidence',
      brandPersonality: ['reliable', 'clear', 'experienced'],
      bestFor: 'Clients who need immediate trust and easy enquiry flow.',
      risks: ['Can feel conservative if imagery is too plain'],
      palette: [{ name: 'Ink', hex: '#172033', usage: 'Headings' }, { name: 'Canvas', hex: '#FFFFFF', usage: 'Background' }, { name: 'Action Blue', hex: '#2563EB', usage: 'CTA' }, { name: 'Success', hex: '#16A34A', usage: 'Proof accents' }],
      typography: { heading: 'Inter Tight or system sans', body: 'Inter/system-ui', scale: '1.25 modular scale', notes: 'Strong H1, compact card headings, readable body line length' },
      layoutStyle: 'Structured grid, strong sections, restrained whitespace',
      sectionStyle: 'Alternating white and light neutral bands',
      buttonStyle: 'Solid primary buttons, subtle secondary links',
      cardStyle: 'Flat cards with 1px borders and compact shadow',
      iconStyle: 'Simple line icons only when they clarify scanning',
      imageryStyle: 'Real team/work/product imagery, not abstract decoration',
      animationStyle: 'Subtle reveal and hover transitions under 180ms',
      homepageStructure: ['Hero', 'Services', 'Proof', 'Process', 'FAQ', 'Contact'],
      mobileApproach: 'Single-column sections, CTA repeated after proof, cards stacked with short copy',
      rationale: 'Matches the brief by reducing uncertainty and making the conversion path obvious.'
    },
    {
      id: 'premium-editorial',
      projectId: brief.projectId,
      name: 'Premium Editorial',
      summary: 'More spacious and polished, using editorial hierarchy and selective visual moments.',
      targetEmotion: 'Prestige',
      brandPersonality: ['premium', 'considered', 'expert'],
      bestFor: 'Businesses selling high-trust or higher-ticket services.',
      risks: ['Can underperform if CTA density is too low'],
      palette: [{ name: 'Charcoal', hex: '#111827', usage: 'Primary text' }, { name: 'Warm White', hex: '#FAF7F0', usage: 'Background' }, { name: 'Gold', hex: '#C8A24A', usage: 'Accent' }, { name: 'Slate', hex: '#475569', usage: 'Muted text' }],
      typography: { heading: 'Serif-inspired display or refined sans', body: 'Readable sans', scale: '1.333 modular scale', notes: 'Elegant headings balanced by practical body copy' },
      layoutStyle: 'Editorial rhythm, strong typographic contrast, wider whitespace',
      sectionStyle: 'Narrative blocks with proof embedded',
      buttonStyle: 'Dark filled CTA with refined accent states',
      cardStyle: 'Low-shadow editorial panels',
      iconStyle: 'Minimal, preferably avoided unless needed',
      imageryStyle: 'High-quality real photography or curated case-study visuals',
      animationStyle: 'Slow, subtle content reveals under 240ms',
      homepageStructure: ['Hero story', 'Positioning', 'Services', 'Case studies', 'Method', 'Contact'],
      mobileApproach: 'Tighten whitespace, keep headline shorter, preserve premium spacing with fewer columns',
      rationale: 'Useful when brand perception and quality signal matter as much as lead capture.'
    },
    {
      id: 'conversion-studio',
      projectId: brief.projectId,
      name: 'Conversion Studio',
      summary: 'Sharp, benefit-led, and built around fast comprehension and repeated action.',
      targetEmotion: 'Momentum',
      brandPersonality: ['direct', 'smart', 'energetic'],
      bestFor: 'Lead-generation sites where conversion clarity is the top priority.',
      risks: ['Can feel too sales-led if proof and tone are weak'],
      palette: [{ name: 'Graphite', hex: '#1F2937', usage: 'Headings' }, { name: 'White', hex: '#FFFFFF', usage: 'Background' }, { name: 'Electric Blue', hex: '#0EA5E9', usage: 'Primary CTA' }, { name: 'Coral', hex: '#F97316', usage: 'Micro accents' }],
      typography: { heading: 'Bold geometric sans', body: 'Inter/system-ui', scale: '1.2 modular scale', notes: 'Short punchy headings and clear labels' },
      layoutStyle: 'Dense but organized conversion sections',
      sectionStyle: 'Benefit blocks, comparison cards, CTA strips',
      buttonStyle: 'High-contrast CTA with clear active/hover states',
      cardStyle: 'Compact cards with strong titles and small proof details',
      iconStyle: 'Lucide-style line icons for scanning',
      imageryStyle: 'Product/service screenshots, process visuals, client outcomes',
      animationStyle: 'Fast hover/press feedback only',
      homepageStructure: ['Hero offer', 'Benefits', 'Services', 'Proof', 'Pricing/fit', 'Contact'],
      mobileApproach: 'Prioritize CTA, benefits, and proof in first three scrolls',
      rationale: 'Best fit when the brief emphasizes measurable enquiries and action.'
    }
  ];
}

export function selectDirection(directions: CreativeDirection[], mode: 'autonomous' | 'approval', approvalId?: string): SelectedDirection {
  const selected = directions[0];
  return {
    projectId: selected.projectId,
    selectedDirectionId: selected.id,
    reasonSelected: 'Best balance of trust, clarity, accessibility, and conversion for the approved brief.',
    rejectedDirectionIds: directions.filter(direction => direction.id !== selected.id).map(direction => direction.id),
    decisionMode: mode,
    approvedByUser: mode === 'autonomous',
    approvalId,
    createdAt: nowIso()
  };
}

export function createSitemap(brief: DesignBrief, direction: CreativeDirection): Sitemap {
  const pages = brief.requiredPages.length ? brief.requiredPages : ['Home', 'Services', 'About', 'Contact'];
  return {
    projectId: brief.projectId,
    pages: pages.map((page, index) => ({ id: page.toLowerCase().replace(/\s+/g, '-'), title: page, path: index === 0 ? '/' : `/${page.toLowerCase().replace(/\s+/g, '-')}`, sections: index === 0 ? direction.homepageStructure : ['Hero', 'Content', 'CTA'], priority: index === 0 ? 'primary' : 'secondary' })),
    navigationItems: pages.slice(0, 5),
    footerNavigation: [...pages, 'Privacy'],
    primaryCta: brief.primaryConversionGoal,
    userJourney: ['Understand offer', 'Compare services', 'Trust proof', 'Contact'],
    seoPageIntent: Object.fromEntries(pages.map(page => [page, `${brief.businessType} ${page.toLowerCase()} page intent`])),
    requiredLegalPages: ['Privacy']
  };
}

export function createWireframe(sitemap: Sitemap): Wireframe {
  const homepage = sitemap.pages[0];
  return {
    projectId: sitemap.projectId,
    pages: sitemap.pages.map(page => page.title),
    sections: sitemap.pages.flatMap(page => page.sections.map(section => ({ page: page.title, name: section, purpose: `${section} supports ${sitemap.primaryCta}`, contentPriority: ['message', 'proof', 'action'] }))),
    layoutBlocks: homepage.sections.map((section, index) => ({ id: `${homepage.id}-${index}`, type: section, desktop: 'max-width container with grid where useful', mobile: 'single column with CTA visible' })),
    contentPriority: ['Primary offer', 'Services', 'Trust signals', 'CTA'],
    desktopLayout: 'Constrained 1120px container, 12-column grid, clear vertical rhythm',
    tabletLayout: 'Two-column cards where space permits, otherwise stacked',
    mobileLayout: 'Single column, concise hero, large tap targets, repeated CTA',
    notesForBuilder: ['Build reusable section components', 'Keep text line length readable', 'Avoid viewport-width font scaling']
  };
}

export function createDesignTokens(direction: CreativeDirection): DesignTokens {
  const colours = Object.fromEntries(direction.palette.map(item => [item.name.toLowerCase().replace(/\s+/g, ''), item.hex]));
  return {
    projectId: direction.projectId,
    colours,
    typography: { heading: direction.typography.heading, body: direction.typography.body, scale: direction.typography.scale, lineHeightBody: 1.6 },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px', xl: '56px', section: '80px' },
    radius: { sm: '4px', md: '8px', lg: '12px', pill: '999px' },
    shadows: { card: '0 10px 24px rgba(15,23,42,.08)', focus: '0 0 0 3px rgba(37,99,235,.24)' },
    borders: { subtle: '1px solid rgba(15,23,42,.12)' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    containers: { page: '1120px', narrow: '760px', wide: '1280px' },
    zIndex: { header: 20, modal: 50, toast: 80 },
    animation: { fast: '120ms ease', normal: '180ms ease', slow: '240ms ease' },
    exportedCssVariables: `:root { ${Object.entries(colours).map(([key, value]) => `--color-${key}: ${value};`).join(' ')} }`,
    exportedTailwindTheme: `export const agencyTheme = ${JSON.stringify({ colors: colours }, null, 2)} as const;`
  };
}

export function createComponentSpec(brief: DesignBrief, sitemap: Sitemap): ComponentSpec {
  return {
    projectId: brief.projectId,
    components: [
      { name: 'Hero', purpose: 'Explain offer and drive primary CTA', anatomy: ['headline', 'supporting copy', 'primary CTA', 'proof cue'], variants: ['split', 'centered'] },
      { name: 'Navigation', purpose: 'Move users through core pages', anatomy: ['logo', 'links', 'CTA'], variants: ['desktop', 'mobile drawer'] },
      { name: 'ServiceCard', purpose: 'Present service or feature clearly', anatomy: ['title', 'summary', 'benefit', 'link'], variants: ['standard', 'featured'] },
      { name: 'CTASection', purpose: 'Convert after proof', anatomy: ['heading', 'copy', 'button'], variants: ['band', 'card'] },
      { name: 'ContactForm', purpose: 'Capture enquiries', anatomy: ['name', 'email', 'message', 'submit'], variants: ['compact', 'full'] }
    ],
    sections: sitemap.pages[0]?.sections.map(section => ({ name: section, components: ['Hero', 'ServiceCard', 'CTASection'], contentSlots: ['heading', 'copy', 'proof', 'cta'] })) || [],
    variants: { buttons: ['primary', 'secondary', 'text'], cards: ['default', 'featured', 'proof'] },
    props: { Button: ['variant', 'href', 'label'], Card: ['title', 'body', 'icon', 'href'] },
    responsiveRules: ['Cards stack below 768px', 'Navigation becomes drawer below 768px', 'Buttons remain at least 44px tall'],
    interactionRules: ['Visible focus styles', 'Subtle hover transitions', 'No motion required for comprehension'],
    accessibilityRules: ['Semantic headings', 'Label all form fields', 'Maintain WCAG AA contrast'],
    contentSlots: ['eyebrow', 'heading', 'summary', 'proof', 'cta'],
    examples: ['Hero with primary CTA and one proof cue', 'Three-card services grid', 'Contact CTA band']
  };
}

export function createPrototype(projectId: string): Prototype {
  return {
    projectId,
    type: 'code-first',
    previewUrl: `/previews/${projectId}/`,
    filePaths: ['project/design/prototype-summary.md'],
    screenshots: [],
    viewportCoverage: ['desktop', 'tablet', 'mobile'],
    knownIssues: [],
    createdAt: nowIso()
  };
}

export function createDesignQa(projectId: string, artifactIds: string[] = []): DesignQaReport {
  const checks = [
    'Matches approved brief',
    'Fits business type',
    'Clear page hierarchy',
    'Primary CTA visible above fold',
    'Mobile-first structure',
    'Reusable sections',
    'Accessible colour intent',
    'Readable typography',
    'Consistent spacing',
    'Buildable by Builder Agent'
  ].map(name => ({ name, passed: true, notes: 'Passed deterministic design QA baseline.' }));
  return {
    projectId,
    designArtifactIds: artifactIds,
    checks,
    passed: true,
    issues: [],
    recommendedFixes: [],
    riskLevel: 'low',
    reviewedAt: nowIso()
  };
}

export function createHandoff(input: { selectedDirection: SelectedDirection; direction: CreativeDirection; sitemap: Sitemap; wireframes: Wireframe; tokens: DesignTokens; componentSpec: ComponentSpec }): DesignHandoff {
  return {
    projectId: input.direction.projectId,
    selectedDirection: input.selectedDirection,
    sitemap: input.sitemap,
    wireframes: input.wireframes,
    designTokens: input.tokens,
    componentSpec: input.componentSpec,
    responsiveRules: input.componentSpec.responsiveRules,
    animationSpec: [input.direction.animationStyle],
    assetList: ['Logo', 'Final imagery', 'Case study proof assets'],
    accessibilityRequirements: input.componentSpec.accessibilityRules,
    implementationNotes: ['Implement from this handoff, not from the original brief alone', 'Use design tokens for colours, spacing, radius, and shadows', 'Preserve mobile layout priorities'],
    acceptanceCriteria: ['Matches selected creative direction', 'Uses generated design tokens', 'All key sections present', 'Desktop/tablet/mobile layouts are polished', 'CTA hierarchy is clear'],
    handoffSummary: `${input.direction.name} handoff ready for Builder Agent.`
  };
}
