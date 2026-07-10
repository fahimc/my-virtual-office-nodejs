import type { ApprovalType } from '../schemas/approval.schema.js';

export const approvalRequiredToolActions = new Set<ApprovalType>([
  'deployment',
  'external_email',
  'domain_change',
  'paid_infrastructure',
  'delete_project_files',
  'billing_change',
  'irreversible_deployment'
]);
