import type { ApprovalRequest } from '../schemas/approval.schema.js';

export function buildApprovalPanelState(approvals: ApprovalRequest[]) {
  return approvals
    .filter(approval => approval.status === 'pending')
    .map(approval => ({
      id: approval.id,
      type: approval.type,
      title: approval.title,
      description: approval.description,
      riskLevel: approval.riskLevel || 'medium',
      payload: approval.payload,
      requestedByAgentId: approval.requestedByAgentId,
      createdAt: approval.createdAt
    }));
}
