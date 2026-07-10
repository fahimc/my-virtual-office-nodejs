import type { ApprovalRequest } from '../schemas/approval.schema.js';

export function buildDesignApprovalState(approvals: ApprovalRequest[]) {
  return approvals.filter(approval => approval.type === 'design_options' && approval.status === 'pending');
}
