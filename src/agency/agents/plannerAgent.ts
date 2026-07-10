import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';

export const plannerAgent: AgentDefinition<{ structuredBrief: StructuredBrief }, { tasks: string[]; summary: string }> = {
  id: 'planner',
  name: 'Planner Agent',
  role: 'Project Planner',
  description: 'Creates the project task plan and assigns work to downstream agents.',
  allowedTools: [],
  memoryScope: 'project',
  inputSchema: '{ structuredBrief: StructuredBrief }',
  outputSchema: '{ tasks: string[], summary: string }',
  taskType: 'planning',
  systemPrompt: 'Create concise website build plans with useful task sequencing.',
  async execute(input, context) {
    const summary = await agentText(this, JSON.stringify(input.structuredBrief), context);
    return {
      summary,
      tasks: ['Define page structure', 'Create design direction', 'Write copy', 'Build responsive preview', 'Run QA']
    };
  }
};
