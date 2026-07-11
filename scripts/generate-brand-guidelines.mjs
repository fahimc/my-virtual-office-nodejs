import { readFile, writeFile } from 'node:fs/promises';
import { createBrandGuidelinesFiles } from '../dist/agency/tools/design/brandGuidelinesTool.js';
import { createId, nowIso } from '../dist/agency/memory/memoryStore.js';

const storePath = 'data/agency-store.json';
const args = new Set(process.argv.slice(2));
const projectIdArg = process.argv.find(arg => arg.startsWith('--projectId='));
const projectId = projectIdArg?.split('=').slice(1).join('=');

if (args.has('--agency')) {
  const result = await createBrandGuidelinesFiles(createAgencyBrandGuidelinesInput());
  console.log(`Generated agency brand guide: ${result.htmlUrl}`);
  console.log(`Generated agency brand PDF: ${result.pdfUrl}`);
  process.exit(0);
}

const data = JSON.parse(await readFile(storePath, 'utf8'));
const projects = projectId ? [projectId] : [...new Set((data.design?.handoffs || []).map(item => item.projectId))];
let generated = 0;

for (const id of projects) {
  const designBrief = data.design?.briefs?.find(item => item.projectId === id);
  const selected = data.design?.selectedDirections?.find(item => item.projectId === id);
  const direction = data.design?.creativeDirections?.find(item => item.projectId === id && item.id === selected?.selectedDirectionId)
    || data.design?.creativeDirections?.find(item => item.projectId === id);
  const tokens = data.design?.tokens?.find(item => item.projectId === id);
  const componentSpec = data.design?.componentSpecs?.find(item => item.projectId === id);
  const handoff = data.design?.handoffs?.find(item => item.projectId === id);
  if (!designBrief || !direction || !tokens || !componentSpec || !handoff) {
    console.warn(`Skipping ${id}: missing design artifacts.`);
    continue;
  }
  const result = await createBrandGuidelinesFiles({ designBrief, direction, tokens, componentSpec, handoff });
  upsertArtifact(data, {
    projectId: id,
    type: 'brand_guidelines',
    title: 'Brand guidelines HTML',
    path: 'project/design/brand-guidelines.html',
    url: result.htmlUrl,
    metadata: { guidelines: result.guidelines }
  });
  upsertArtifact(data, {
    projectId: id,
    type: 'brand_guidelines_pdf',
    title: 'Brand guidelines PDF',
    path: 'project/design/brand-guidelines.pdf',
    url: result.pdfUrl,
    metadata: { guidelines: result.guidelines }
  });
  generated += 1;
  console.log(`Generated brand guidelines for ${id}: ${result.pdfUrl}`);
}

await writeFile(storePath, JSON.stringify(data, null, 2));
console.log(`Generated ${generated} project brand guide set(s).`);

function upsertArtifact(data, artifact) {
  data.artifacts ||= [];
  const existing = data.artifacts.find(item => item.projectId === artifact.projectId && item.type === artifact.type);
  if (existing) {
    Object.assign(existing, artifact, { createdByAgentId: 'design', createdAt: existing.createdAt || nowIso() });
  } else {
    data.artifacts.push({
      id: createId('artifact'),
      ...artifact,
      createdByAgentId: 'design',
      createdAt: nowIso()
    });
  }
}

function createAgencyBrandGuidelinesInput() {
  const projectId = 'virtual-office-ai-agency';
  const direction = {
    id: 'agency-os-command',
    projectId,
    name: 'Agency OS Command',
    summary: 'A premium operating-system identity for an autonomous AI web agency.',
    targetEmotion: 'Calm control',
    brandPersonality: ['precise', 'inventive', 'trustworthy', 'fast'],
    bestFor: 'Client-facing AI agency dashboards, proposals, and delivery portals.',
    risks: ['Needs disciplined spacing so the interface does not feel like a game UI'],
    palette: [
      { name: 'Command Ink', hex: '#111827', usage: 'Primary text and premium dark sections' },
      { name: 'Signal Cyan', hex: '#16C7D4', usage: 'Live-system accents and active states' },
      { name: 'Studio Gold', hex: '#F7C948', usage: 'Approval gates, key milestones, highlight rules' },
      { name: 'Operator Violet', hex: '#7C3AED', usage: 'Designer and Codex activity accents' },
      { name: 'Cloud White', hex: '#F8FAFC', usage: 'Document background and large content surfaces' },
      { name: 'Success Green', hex: '#22C55E', usage: 'Passed QA, completed workflow, positive proof' }
    ],
    typography: {
      heading: 'Inter Tight / Space Grotesk style display sans',
      body: 'Inter / system-ui',
      scale: '1.25 modular scale',
      notes: 'Confident compact headings with very readable operational copy.'
    },
    layoutStyle: 'Dense but polished operating-system layouts with strong sections and calm information hierarchy',
    sectionStyle: 'Dark command surfaces, white document panels, and high-contrast status bands',
    buttonStyle: 'DaisyUI-token buttons with clear primary, approval, and secondary states',
    cardStyle: 'Thin-bordered cards with compact metadata and strong section headings',
    iconStyle: 'Lucide-style line icons only when they improve scanning',
    imageryStyle: 'Office operations, design systems, previews, dashboards, human handoff moments, no embedded text in generated images',
    animationStyle: 'Subtle workflow motion and status transitions under 180ms',
    homepageStructure: ['Hero', 'Agent OS', 'Design Studio', 'Build Pipeline', 'Approval Center', 'Delivery'],
    mobileApproach: 'Prioritize status, approvals, resources, and preview links before decorative office details',
    rationale: 'The agency brand should feel like a serious operating system with enough visual imagination to make the virtual office memorable.'
  };
  const designBrief = {
    projectId,
    customerId: 'internal-agency',
    businessName: 'Virtual Office AI Agency',
    businessType: 'AI web agency operating system',
    targetAudience: 'Founders, small businesses, and teams who need websites designed, built, reviewed, and delivered by autonomous agents.',
    projectGoal: 'Present a professional AI agency that combines client intake, design studio work, coding automation, approvals, previews, and delivery.',
    primaryConversionGoal: 'Start a website brief',
    secondaryGoals: ['Build trust in autonomous delivery', 'Show visible workflow progress', 'Make approvals feel controlled'],
    existingWebsite: '',
    competitorUrls: [],
    stylePreferences: ['premium', 'operational', 'clear', 'high-contrast'],
    dislikedStyles: ['toy-like UI', 'generic SaaS gradients', 'raw template copy'],
    requiredPages: ['Home', 'Services', 'Process', 'Case Studies', 'Contact'],
    requiredFeatures: ['Client intake', 'Task board', 'Design Studio', 'Preview approval', 'Deployment approval'],
    availableAssets: [],
    missingAssets: ['Final logo mark', 'Founder/team imagery'],
    assumptions: ['The agency should feel professional rather than game-like.'],
    constraints: ['Use DaisyUI/Tailwind tokens and reusable components.'],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  const tokens = {
    projectId,
    colours: Object.fromEntries(direction.palette.map(item => [item.name.toLowerCase().replace(/\s+/g, ''), item.hex])),
    typography: { heading: direction.typography.heading, body: direction.typography.body, scale: direction.typography.scale, lineHeightBody: 1.6 },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px', xl: '56px', section: '88px' },
    radius: { sm: '4px', md: '8px', lg: '16px', pill: '999px' },
    shadows: { card: '0 18px 50px rgba(15,23,42,.12)', focus: '0 0 0 3px rgba(22,199,212,.24)' },
    borders: { subtle: '1px solid rgba(15,23,42,.14)' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    containers: { page: '1180px', narrow: '780px', wide: '1360px' },
    zIndex: { header: 20, modal: 50, toast: 80 },
    animation: { fast: '120ms ease', normal: '180ms ease', slow: '260ms ease' },
    exportedCssVariables: ':root { --color-command-ink: #111827; --color-signal-cyan: #16C7D4; }',
    exportedTailwindTheme: 'export const agencyTheme = { colors: { commandInk: "#111827", signalCyan: "#16C7D4" } } as const;'
  };
  const componentSpec = {
    projectId,
    components: [
      { name: 'CommandHero', purpose: 'Show the agency promise and primary brief CTA', anatomy: ['headline', 'proof', 'cta', 'status preview'], variants: ['dark', 'image-backed'] },
      { name: 'AgentStatusCard', purpose: 'Summarize what an agent is doing', anatomy: ['agent', 'role', 'current tool', 'status'], variants: ['working', 'waiting', 'blocked'] },
      { name: 'ApprovalPanel', purpose: 'Make risky decisions explicit', anatomy: ['action', 'risk', 'preview', 'approve', 'request changes'], variants: ['email', 'preview', 'deployment'] },
      { name: 'ResourcePanel', purpose: 'Expose artifacts without cluttering the office', anatomy: ['filters', 'cards', 'preview links'], variants: ['compact', 'expanded'] },
      { name: 'TimelineRail', purpose: 'Show intake to delivery progress', anatomy: ['steps', 'status', 'current milestone'], variants: ['horizontal', 'vertical'] }
    ],
    sections: direction.homepageStructure.map(section => ({ name: section, components: ['CommandHero', 'AgentStatusCard', 'ApprovalPanel'], contentSlots: ['heading', 'proof', 'cta'] })),
    variants: { buttons: ['primary', 'approval', 'secondary'], cards: ['status', 'artifact', 'approval'] },
    props: { Button: ['variant', 'label', 'href'], Card: ['title', 'meta', 'status'] },
    responsiveRules: ['Move resources into an expandable panel on mobile', 'Keep approval actions sticky when reviewing previews'],
    interactionRules: ['Keyboard focus must be visible', 'Status changes animate subtly', 'No raw chain-of-thought shown'],
    accessibilityRules: ['WCAG AA contrast', '44px minimum tap targets', 'Readable document exports'],
    contentSlots: ['eyebrow', 'heading', 'summary', 'proof', 'cta'],
    examples: ['Design Studio card', 'Approval Center panel', 'Agent activity feed']
  };
  const handoff = {
    projectId,
    selectedDirection: {
      projectId,
      selectedDirectionId: direction.id,
      reasonSelected: 'Best match for a serious autonomous agency operating-system brand.',
      rejectedDirectionIds: [],
      decisionMode: 'autonomous',
      approvedByUser: true,
      createdAt: nowIso()
    },
    sitemap: { projectId, pages: [], navigationItems: [], footerNavigation: [], primaryCta: 'Start a website brief', userJourney: [], seoPageIntent: {}, requiredLegalPages: [] },
    wireframes: { projectId, pages: [], sections: [], layoutBlocks: [], contentPriority: [], desktopLayout: '', tabletLayout: '', mobileLayout: '', notesForBuilder: [] },
    designTokens: tokens,
    componentSpec,
    responsiveRules: componentSpec.responsiveRules,
    animationSpec: [direction.animationStyle],
    assetList: ['Generated office imagery', 'Workflow screenshots', 'Brand guidelines PDF'],
    accessibilityRequirements: componentSpec.accessibilityRules,
    implementationNotes: ['Use DaisyUI tokens', 'Keep copy client-facing', 'Avoid game-language in agency surfaces'],
    acceptanceCriteria: ['Professional agency feel', 'Strong approvals', 'Readable mobile UI'],
    handoffSummary: 'Virtual Office AI Agency brand handoff ready.'
  };
  return { designBrief, direction, tokens, componentSpec, handoff };
}
