import type { AgentDefinition } from './agentTypes.js';

export const opsAgent: AgentDefinition<{ issue: string }, { summary: string; retryRecommended: boolean }> = {
  id: 'ops',
  name: 'Ops Agent',
  role: 'Operations Recovery Manager',
  description: 'Detects stuck workflows, retries safe failures, summarizes issues, and prepares human intervention tasks.',
  allowedTools: ['taskboard.company', 'notifications.in_app'],
  memoryScope: 'global',
  inputSchema: '{ issue: string }',
  outputSchema: '{ summary: string, retryRecommended: boolean }',
  taskType: 'summarisation',
  systemPrompt: 'Summarize operational failures without exposing hidden reasoning. Recommend safe retries only.',
  async execute(input, context) {
    await context.status(this.id, 'working', 'Ops Agent is reviewing workflow recovery state.');
    await context.auditLog.log({
      projectId: context.projectId,
      workflowRunId: context.workflowRunId,
      agentId: this.id,
      action: 'ops.recovery_summary',
      inputSummary: input.issue,
      outputSummary: 'Recovery summary prepared.',
      status: 'completed'
    });
    await context.status(this.id, 'completed', 'Ops Agent prepared a recovery summary.');
    return { summary: `Workflow issue reviewed: ${input.issue}`, retryRecommended: true };
  }
};
