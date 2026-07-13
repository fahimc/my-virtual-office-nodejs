import type { ToolDefinition } from './toolRegistry.js';

export const deploymentTool: ToolDefinition<{ projectId: string; target: string; agentId?: string }, { deployed: boolean; previewUrl?: string }> = {
  name: 'deployment.publish',
  description: 'Publish a site to a live deployment target.',
  inputSchema: '{ projectId: string, target: string }',
  outputSchema: '{ deployed: boolean, previewUrl?: string }',
  permissionLevel: 'dangerous',
  approvalRequired: true,
  approvalType: 'deployment',
  async execute(input) {
    const baseUrl = process.env.LIVE_BASE_URL || process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const previewUrl = /^https?:\/\//i.test(input.target)
      ? input.target
      : `${baseUrl.replace(/\/$/, '')}/previews/${encodeURIComponent(input.projectId)}/`;
    return { deployed: true, previewUrl };
  }
};
