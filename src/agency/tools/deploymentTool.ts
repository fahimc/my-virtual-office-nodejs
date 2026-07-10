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
    return { deployed: true, previewUrl: `https://preview.example.com/${input.projectId}` };
  }
};
