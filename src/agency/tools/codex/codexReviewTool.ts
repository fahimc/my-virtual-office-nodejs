import type { ToolDefinition } from '../toolTypes.js';

export const codexReviewTool: ToolDefinition<{ projectId: string; prompt: string }, { status: string; findings: string[] }> = {
  name: 'codex.review',
  description: 'Use Codex-style review prompt to inspect code changes. Stubbed until review execution is enabled.',
  inputSchema: '{ projectId: string, prompt: string }',
  outputSchema: '{ status: string, findings: string[] }',
  permissionLevel: 'read',
  approvalRequired: false,
  async execute(input) {
    return { status: 'needs_human_review', findings: [`Review prepared for ${input.projectId}`] };
  }
};
