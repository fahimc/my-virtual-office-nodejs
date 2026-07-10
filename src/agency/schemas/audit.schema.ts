export interface AuditLog {
  id: string;
  projectId?: string;
  agentId?: string;
  action: string;
  toolName?: string;
  inputSummary: string;
  outputSummary?: string;
  status: 'started' | 'completed' | 'failed' | 'approval_required';
  createdAt: string;
}
