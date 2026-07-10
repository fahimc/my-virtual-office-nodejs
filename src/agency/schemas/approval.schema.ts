export type ApprovalType =
  | 'preview'
  | 'deployment'
  | 'external_email'
  | 'domain_change'
  | 'paid_infrastructure'
  | 'delete_project_files'
  | 'billing_change'
  | 'irreversible_deployment'
  | 'send_email'
  | 'merge_pull_request'
  | 'deploy_live'
  | 'buy_domain'
  | 'change_dns'
  | 'create_paid_resource'
  | 'delete_files'
  | 'change_billing'
  | 'publish_client_content'
  | 'access_sensitive_data';

export type ApprovalRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'cancelled';

export interface ApprovalRequest {
  id: string;
  projectId: string;
  type: ApprovalType;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedByAgentId: string;
  riskLevel?: ApprovalRiskLevel;
  payload: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  decisionReason?: string;
}
