import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';

export const designAgent: AgentDefinition<{ structuredBrief: StructuredBrief }, { direction: string; sections: string[] }> = {
  id: 'design',
  name: 'Design Agent',
  role: 'Web Design Strategist',
  description: 'Runs the agency design department: discovery, audit, research, directions, wireframes, tokens, components, prototype, QA, handoff, and post-build visual review.',
  allowedTools: [
    'design.brief',
    'design.brand_audit',
    'design.competitor_research',
    'design.moodboard',
    'design.creative_direction',
    'design.sitemap',
    'design.wireframe',
    'design.tokens',
    'design.component_spec',
    'design.prototype',
    'design.visual_qa',
    'design.handoff'
  ],
  memoryScope: 'project',
  inputSchema: '{ structuredBrief: StructuredBrief }',
  outputSchema: '{ direction: string, sections: string[] }',
  taskType: 'design',
  systemPrompt: 'Act as a senior digital agency design department. Return structured build-ready decisions: colours, typography, layout rules, components, responsive behaviour, accessibility notes, rationale, and builder handoff data. Avoid vague design paragraphs.',
  async execute(input, context) {
    return {
      direction: await agentText(this, JSON.stringify(input.structuredBrief), context),
      sections: ['Hero', 'Problem and offer', 'Services', 'Proof', 'Process', 'Contact']
    };
  }
};
