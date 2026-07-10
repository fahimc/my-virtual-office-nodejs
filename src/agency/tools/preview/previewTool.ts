import type { ToolDefinition } from '../toolTypes.js';
import { PreviewService } from './previewService.js';

export function createPreviewTool(previews: PreviewService): ToolDefinition<{ projectId: string; url?: string; agentId?: string }, unknown> {
  return {
    name: 'preview.create',
    description: 'Create a local or hosted preview and attach it to the project.',
    inputSchema: '{ projectId: string, url?: string }',
    outputSchema: 'PreviewRecord',
    permissionLevel: 'write',
    approvalRequired: false,
    execute(input) {
      return previews.create({
        projectId: input.projectId,
        url: input.url || `/previews/${input.projectId}/`,
        provider: 'local',
        screenshotPaths: [],
        createdByAgentId: input.agentId || 'delivery'
      });
    }
  };
}
