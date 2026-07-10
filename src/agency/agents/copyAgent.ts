import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';

export const copyAgent: AgentDefinition<{ structuredBrief: StructuredBrief; designDirection: string }, { copy: string }> = {
  id: 'copy',
  name: 'Copy Agent',
  role: 'Website Copywriter',
  description: 'Writes page copy aligned with the business, audience, and design direction.',
  allowedTools: [],
  memoryScope: 'project',
  inputSchema: '{ structuredBrief: StructuredBrief, designDirection: string }',
  outputSchema: '{ copy: string }',
  taskType: 'copywriting',
  systemPrompt: 'Write concise conversion-focused website copy. Keep claims grounded.',
  async execute(input, context) {
    return { copy: await agentText(this, JSON.stringify(input), context) };
  }
};
