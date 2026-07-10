export type ApprovalType =
  | 'preview'
  | 'deployment'
  | 'external_email'
  | 'domain_change'
  | 'paid_infrastructure'
  | 'delete_project_files'
  | 'billing_change'
  | 'irreversible_deployment';

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'cancelled';

export interface ApprovalRequest {
  id: string;
  projectId: string;
  type: ApprovalType;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedByAgentId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
}
