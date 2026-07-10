import type { AgentDefinition } from './agentTypes.js';

export const financeAgent: AgentDefinition<{ projectId: string }, { summary: string }> = {
  id: 'finance',
  name: 'Finance Agent',
  role: 'Finance and Billing Coordinator',
  description: 'Prepares quotes, invoice drafts, and payment status summaries. Cannot change billing without approval.',
  allowedTools: ['billing.quote', 'billing.invoice'],
  memoryScope: 'project',
  inputSchema: '{ projectId: string }',
  outputSchema: '{ summary: string }',
  taskType: 'summarisation',
  systemPrompt: 'Prepare billing summaries and respect approval gates for billing changes.',
  async execute(input, context) {
    await context.status(this.id, 'working', 'Finance Agent is checking billing context.');
    await context.status(this.id, 'completed', 'Finance Agent prepared a billing summary.');
    return { summary: `Billing context prepared for ${input.projectId}.` };
  }
};
