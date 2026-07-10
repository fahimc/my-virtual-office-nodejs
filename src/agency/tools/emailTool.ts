import type { ToolDefinition } from './toolRegistry.js';

export const emailTool: ToolDefinition<{ to: string; subject: string; body: string; projectId?: string; agentId?: string }, { queued: boolean }> = {
  name: 'email.send_external',
  description: 'Send an external client email. Requires explicit approval.',
  inputSchema: '{ to: string, subject: string, body: string }',
  outputSchema: '{ queued: boolean }',
  permissionLevel: 'external',
  approvalRequired: true,
  approvalType: 'external_email',
  async execute() {
    return { queued: true };
  }
};
