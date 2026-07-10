import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const deliveryAgent: AgentDefinition<{ projectId: string; qaSummary: string }, { previewUrl: string; summary: string }> = {
  id: 'delivery',
  name: 'Delivery Agent',
  role: 'Preview and Delivery Coordinator',
  description: 'Creates preview, packages artifacts, and requests approvals. Does not deploy live without approval.',
  allowedTools: ['deployment.publish'],
  memoryScope: 'project',
  inputSchema: '{ projectId: string, qaSummary: string }',
  outputSchema: '{ previewUrl: string, summary: string }',
  taskType: 'deployment_reasoning',
  systemPrompt: 'Prepare client-friendly delivery summaries and preview approvals.',
  async execute(input, context) {
    return {
      previewUrl: `/previews/${input.projectId}/`,
      summary: await agentText(this, JSON.stringify(input), context)
    };
  }
};
