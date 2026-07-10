import type { ApprovalType } from '../schemas/approval.schema.js';

export type ToolPermissionLevel = 'safe' | 'read' | 'write' | 'external' | 'dangerous' | 'admin';

export interface ToolExecutionContext {
  projectId?: string;
  customerId?: string;
  workflowRunId?: string;
  taskId?: string;
  agentId?: string;
  approvalId?: string;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  permissionLevel: ToolPermissionLevel;
  approvalType?: ApprovalType;
  approvalRequired: boolean;
  execute(input: TInput, context?: ToolExecutionContext): Promise<TOutput>;
}

export interface ToolExecutionRecord {
  toolName: string;
  permissionLevel: ToolPermissionLevel;
  approvalRequired: boolean;
  approvalType?: ApprovalType;
}
