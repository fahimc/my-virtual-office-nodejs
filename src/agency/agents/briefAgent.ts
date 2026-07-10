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
  return {
    businessSummary: originalBrief.slice(0, 220) || 'New website project',
    targetAudience: lower.includes('b2b') ? 'B2B buyers and decision makers' : 'Prospective customers',
    pagesNeeded: ['Home', 'Services', 'About', 'Contact'],
    featuresNeeded: [
      lower.includes('booking') ? 'Booking/contact workflow' : 'Lead capture form',
      lower.includes('crm') ? 'CRM integration plan' : 'Contact form routing'
    ],
    stylePreferences: lower.includes('premium') ? ['premium', 'clean', 'trustworthy'] : ['professional', 'clear', 'modern'],
    contentRequirements: ['Hero message', 'Service descriptions', 'Trust signals', 'Call to action'],
    assetsRequired: ['Logo', 'Brand colors', 'Images or image direction'],
    technicalRequirements: ['Responsive layout', 'Accessible markup', 'Fast static preview'],
    assumptions: ['Single-language site', 'Client will provide final brand assets if not already available'],
    missingInformation: lower.length < 80 ? ['More detail on business goals and audience'] : [],
    estimatedComplexity: lower.includes('crm') || lower.includes('booking') ? 'medium' : 'small'
  };
}
