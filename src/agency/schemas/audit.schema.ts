export interface AuditLog {
  id: string;
  timestamp?: string;
  projectId?: string;
  customerId?: string;
  workflowRunId?: string;
  agentId?: string;
  taskId?: string;
  action: string;
  toolName?: string;
  permissionLevel?: 'safe' | 'read' | 'write' | 'external' | 'dangerous' | 'admin';
  inputSummary: string;
  outputSummary?: string;
  status: 'started' | 'completed' | 'failed' | 'approval_required';
  error?: string;
  approvalId?: string;
  createdAt: string;
}
