import type { ApprovalType } from './approval.schema.js';

export interface ToolSchema {
  name: string;
  description: string;
  permissionLevel: 'safe' | 'read' | 'write' | 'external' | 'dangerous' | 'admin';
  approvalRequired: boolean;
  approvalType?: ApprovalType;
  inputSchema: string;
  outputSchema: string;
}
