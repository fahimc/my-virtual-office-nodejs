import type { ApprovalType } from '../schemas/approval.schema.js';
import type { ToolPermissionLevel } from './toolTypes.js';

export const dangerousApprovalByAction: Record<string, ApprovalType> = {
  'email.send_external': 'send_email',
  'github.merge_pr': 'merge_pull_request',
  'deployment.deploy_live': 'deploy_live',
  'deployment.publish': 'deploy_live',
  'domain.buy': 'buy_domain',
  'dns.change': 'change_dns',
  'infra.create_paid': 'create_paid_resource',
  'file.delete_project_files': 'delete_files',
  'billing.change': 'change_billing',
  'content.publish_client': 'publish_client_content',
  'data.access_sensitive': 'access_sensitive_data'
};

export function permissionRequiresApproval(permissionLevel: ToolPermissionLevel): boolean {
  return permissionLevel === 'dangerous' || permissionLevel === 'admin';
}
