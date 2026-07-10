import type { ApprovalRiskLevel, ApprovalType } from '../schemas/approval.schema.js';

const riskByType: Record<ApprovalType, ApprovalRiskLevel> = {
  preview: 'low',
  design_options: 'low',
  deployment: 'high',
  external_email: 'medium',
  domain_change: 'critical',
  paid_infrastructure: 'high',
  delete_project_files: 'critical',
  billing_change: 'critical',
  irreversible_deployment: 'critical',
  send_email: 'medium',
  merge_pull_request: 'high',
  deploy_live: 'high',
  buy_domain: 'critical',
  change_dns: 'critical',
  create_paid_resource: 'high',
  delete_files: 'critical',
  change_billing: 'critical',
  publish_client_content: 'medium',
  access_sensitive_data: 'high'
};

export function approvalRiskFor(type: ApprovalType): ApprovalRiskLevel {
  return riskByType[type] || 'medium';
}

export function approvalTypeRequiresExplicitUserDecision(type: ApprovalType): boolean {
  return approvalRiskFor(type) !== 'low';
}
