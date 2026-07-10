import type { ToolDefinition } from '../tools/toolTypes.js';

export class PermissionPolicy {
  assertToolAllowed(tool: ToolDefinition, agentId?: string): void {
    if (!agentId && tool.permissionLevel !== 'safe' && tool.permissionLevel !== 'read') {
      throw new Error(`Agent id required for ${tool.name}`);
    }
  }
}
