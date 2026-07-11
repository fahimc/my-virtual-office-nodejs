import type { StructuredBrief } from '../schemas/brief.schema.js';
import type { AgentDefinition } from './agentTypes.js';

export const briefAgent: AgentDefinition<{ originalBrief: string }, StructuredBrief> = {
  id: 'brief',
  name: 'Brief Agent',
  role: 'Brief Structuring Agent',
  description: 'Turns messy client input into a structured project specification and flags genuine blockers.',
  allowedTools: [],
  memoryScope: 'project',
  inputSchema: '{ originalBrief: string }',
  outputSchema: 'StructuredBrief',
  taskType: 'brief_structuring',
  systemPrompt: 'Create practical structured briefs for web agency projects. Make reasonable assumptions and avoid unnecessary follow-up.',
  async execute(input, context) {
    await context.status(this.id, 'working', 'Brief Agent is structuring the client brief.');
    const fallback = structureBriefHeuristically(input.originalBrief);
    const structured = await context.modelRouter.generateStructuredObject<StructuredBrief>({
      taskType: 'brief_structuring',
      system: `${this.systemPrompt}\nReturn strict JSON matching the StructuredBrief interface.`,
      prompt: input.originalBrief,
      fallback
    });
    await context.auditLog.log({
      projectId: context.projectId,
      agentId: this.id,
      action: 'brief.structured',
      inputSummary: input.originalBrief.slice(0, 500),
      outputSummary: JSON.stringify(structured).slice(0, 500),
      status: 'completed'
    });
    await context.status(this.id, 'completed', 'Brief Agent created a structured project specification.');
    return structured;
  }
};

export function structureBriefHeuristically(originalBrief: string): StructuredBrief {
  const lower = originalBrief.toLowerCase();
  const projectName = extractProjectName(originalBrief);
  const isAgency = /(digital agency|marketing agency|web design|branding|ai automation|seo|digital marketing|professional marketing website|lead generation)/i.test(originalBrief);
  const isEcommerce = !isAgency && /(ecommerce|e-commerce|online shop|checkout|basket|cart|add to basket|mixed case|product catalogue|product catalog|subscription box)/i.test(originalBrief);
  const isFoodDrink = /(fruit|drink|juice|cafe|restaurant|bakery|menu|flavour|flavor|bottle)/i.test(originalBrief);
  const pages = extractPages(originalBrief, isEcommerce, isAgency);
  const features = [
    isEcommerce ? 'Product catalogue and ecommerce checkout' : isAgency ? 'Lead capture and consultation enquiry workflow' : lower.includes('booking') ? 'Booking/contact workflow' : 'Lead capture form',
    isAgency ? 'Service pages for web design, branding, AI automation, and digital marketing' : undefined,
    isAgency && /(case stud|portfolio|work|results)/i.test(originalBrief) ? 'Case studies and portfolio proof' : undefined,
    lower.includes('wholesale') ? 'Wholesale enquiry workflow' : lower.includes('stockist') ? 'Stockist finder or list' : 'Contact form routing',
    lower.includes('email') || lower.includes('subscribe') ? 'Email signup integration' : undefined,
    lower.includes('review') ? 'Reviews and trust signals' : undefined,
    lower.includes('account') ? 'Customer account area' : undefined
  ].filter((item): item is string => Boolean(item));
  return {
    businessSummary: summarizeBrief(originalBrief, projectName),
    targetAudience: isAgency
      ? 'Founders, small business owners, and marketing decision makers looking for websites, brand systems, automation, and growth support'
      : lower.includes('wholesale') || lower.includes('b2b') ? 'Retail customers, families, health-conscious buyers, and wholesale decision makers' : 'Prospective customers',
    pagesNeeded: pages,
    featuresNeeded: features,
    stylePreferences: [
      lower.includes('premium') ? 'premium' : undefined,
      isFoodDrink && !isAgency ? 'vibrant' : 'professional',
      lower.includes('colourful') || lower.includes('colorful') ? 'colourful' : undefined,
      lower.includes('mobile') ? 'mobile-first' : undefined,
      lower.includes('trust') ? 'trustworthy' : undefined,
      'modern'
    ].filter((item): item is string => Boolean(item)),
    contentRequirements: isEcommerce
      ? ['Homepage hero', 'Product cards', 'Benefits', 'Reviews', 'Wholesale CTA', 'Email signup', 'FAQ']
      : isAgency
        ? ['Homepage hero', 'Service descriptions', 'Case studies or proof', 'Process', 'Lead capture CTA', 'FAQ']
      : ['Hero message', 'Service descriptions', 'Trust signals', 'Call to action'],
    assetsRequired: ['Logo', 'Brand colors', 'Images or image direction'],
    technicalRequirements: [
      'Responsive layout',
      'Accessible markup',
      'Fast static preview',
      ...(isEcommerce ? ['Ecommerce-ready product structure', 'Secure checkout plan'] : [])
    ],
    assumptions: ['Single-language site', 'Client will provide final brand assets if not already available'],
    missingInformation: lower.length < 80 ? ['More detail on business goals and audience'] : [],
    estimatedComplexity: isEcommerce || isAgency || lower.includes('crm') || lower.includes('booking') ? 'medium' : 'small'
  };
}

function extractProjectName(text: string): string {
  const explicit = text.match(/project name\s*\n+\s*\*\*?([^*\n]+)\*\*?/i) || text.match(/project name\s*[:\-]\s*([^\n]+)/i);
  if (explicit?.[1]) return cleanMarkdown(explicit[1]);
  const brand = text.match(/\bfor\s+([A-Z][A-Za-z0-9&' ]{2,40})\b/) || text.match(/\b([A-Z][A-Za-z0-9&' ]{2,40})\s+is\s+a\b/);
  return cleanMarkdown(brand?.[1] || 'New website project');
}

function summarizeBrief(text: string, projectName: string): string {
  const overview = text.match(/business overview\s*\n+([\s\S]*?)(?:\n---|\n##|\n#|$)/i)?.[1];
  const summary = cleanMarkdown(overview || text).replace(/\s+/g, ' ').trim();
  return `${projectName}: ${summary.slice(0, 260) || 'Website project'}`;
}

function extractPages(text: string, isEcommerce: boolean, isAgency = false): string[] {
  const lower = text.toLowerCase();
  if (isAgency) {
    return [
      'Home',
      'Services',
      lower.includes('web design') ? 'Web Design' : undefined,
      lower.includes('branding') ? 'Branding' : undefined,
      lower.includes('automation') || lower.includes('ai') ? 'AI Automation' : undefined,
      lower.includes('marketing') ? 'Digital Marketing' : undefined,
      lower.includes('case') || lower.includes('portfolio') || lower.includes('work') ? 'Case Studies' : 'Work',
      'About',
      lower.includes('process') ? 'Process' : undefined,
      lower.includes('pricing') ? 'Pricing' : undefined,
      lower.includes('blog') ? 'Blog' : undefined,
      lower.includes('faq') || lower.includes('frequently asked') ? 'FAQ' : undefined,
      'Contact'
    ].filter((item): item is string => Boolean(item));
  }
  const candidates = [
    'Home',
    isEcommerce ? 'Shop' : 'Services',
    lower.includes('product') ? 'Product Detail' : undefined,
    lower.includes('mixed case') ? 'Build a Mixed Case' : undefined,
    'About',
    lower.includes('ingredient') || lower.includes('nutrition') ? 'Ingredients and Nutrition' : undefined,
    lower.includes('wholesale') ? 'Wholesale' : undefined,
    lower.includes('stockist') ? 'Stockists' : undefined,
    lower.includes('faq') || lower.includes('frequently asked') ? 'FAQ' : undefined,
    'Contact'
  ].filter((item): item is string => Boolean(item));
  return [...new Set(candidates)].slice(0, 12);
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/[#*_`>]/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
