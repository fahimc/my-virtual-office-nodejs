import type { ApprovalRequest, ApprovalType } from '../schemas/approval.schema.js';
import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import { AuditLogger } from '../audit/auditLog.js';
import { approvalRiskFor } from './approvalPolicy.js';

export class ApprovalRequiredError extends Error {
  constructor(public readonly approval: ApprovalRequest) {
    super(`Approval required: ${approval.title}`);
  }
}

export class ApprovalService {
  private readonly audit: AuditLogger;

  constructor(private readonly store: MemoryStore) {
    this.audit = new AuditLogger(store);
  }

  async request(input: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt' | 'resolvedAt'>): Promise<ApprovalRequest> {
    const approval: ApprovalRequest = {
      id: createId('approval'),
      status: 'pending',
      createdAt: nowIso(),
      riskLevel: approvalRiskFor(input.type),
      ...input
    };
    await this.store.update(data => {
      data.approvals.push(approval);
    });
    await this.audit.log({
      projectId: approval.projectId,
      agentId: approval.requestedByAgentId,
      action: `approval.requested.${approval.type}`,
      inputSummary: approval.title,
      status: 'approval_required'
    });
    return approval;
  }

  async assertApproved(projectId: string, type: ApprovalType, payload: Record<string, unknown>): Promise<void> {
    const data = await this.store.read();
    const approval = data.approvals.find(item => item.projectId === projectId && item.type === type && item.status === 'approved');
    if (!approval) {
      throw new ApprovalRequiredError(await this.request({
        projectId,
        type,
        title: `Approval required for ${type.replaceAll('_', ' ')}`,
        description: 'This action can affect external systems or irreversible state.',
        requestedByAgentId: String(payload.agentId || 'system'),
        payload
      }));
    }
  }

  async resolve(id: string, status: 'approved' | 'changes_requested' | 'rejected', payload: Record<string, unknown> = {}): Promise<ApprovalRequest> {
    let result: ApprovalRequest | undefined;
    await this.store.update(data => {
      const approval = data.approvals.find(item => item.id === id);
      if (!approval) throw new Error(`Approval not found: ${id}`);
      approval.status = status;
      approval.resolvedAt = nowIso();
      approval.resolvedBy = String(payload.resolvedBy || 'user');
      approval.decisionReason = typeof payload.decisionReason === 'string' ? payload.decisionReason : undefined;
      approval.payload = { ...approval.payload, resolution: payload };
      result = approval;
    });
    return result!;
  }
}
