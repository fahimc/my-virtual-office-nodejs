import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';

export const designAgent: AgentDefinition<{ structuredBrief: StructuredBrief }, { direction: string; sections: string[] }> = {
  id: 'design',
  name: 'Design Agent',
  role: 'Web Design Strategist',
  description: 'Creates layout direction, visual style, section structure, and component plan.',
  allowedTools: [],
  memoryScope: 'project',
  inputSchema: '{ structuredBrief: StructuredBrief }',
  outputSchema: '{ direction: string, sections: string[] }',
  taskType: 'design',
  systemPrompt: 'Create practical, professional web design direction. Avoid decorative fluff.',
  async execute(input, context) {
    return {
      direction: await agentText(this, JSON.stringify(input.structuredBrief), context),
      sections: ['Hero', 'Problem and offer', 'Services', 'Proof', 'Process', 'Contact']
    };
  }
};
