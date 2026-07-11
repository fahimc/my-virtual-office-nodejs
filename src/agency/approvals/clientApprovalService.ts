import { createHash } from 'node:crypto';
import type { ApprovalService } from './approvalService.js';
import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { ClientApproval, ClientApprovalStatus, ClientApprovalType } from '../schemas/clientApproval.schema.js';

export class ClientApprovalService {
  constructor(
    private readonly store: MemoryStore,
    private readonly approvalService: ApprovalService
  ) {}

  async list(projectId: string): Promise<ClientApproval[]> {
    const data = await this.store.read();
    return data.clientApprovals
      .filter(item => item.projectId === projectId)
      .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || Date.parse(b.requestedAt) - Date.parse(a.requestedAt));
  }

  async ensure(input: {
    projectId: string;
    customerId: string;
    type: ClientApprovalType;
    title: string;
    description: string;
    artifactIds?: string[];
    previewVersionId?: string;
    designVersionId?: string;
    relatedInternalApprovalId?: string;
    snapshot?: Record<string, unknown>;
  }): Promise<ClientApproval> {
    const data = await this.store.read();
    const existing = data.clientApprovals.find(item =>
      item.projectId === input.projectId &&
      item.type === input.type &&
      item.status === 'pending' &&
      item.previewVersionId === input.previewVersionId &&
      item.designVersionId === input.designVersionId
    );
    if (existing) return existing;
    const approval: ClientApproval = {
      id: createId('client-approval'),
      projectId: input.projectId,
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      description: input.description,
      artifactIds: input.artifactIds || [],
      previewVersionId: input.previewVersionId,
      designVersionId: input.designVersionId,
      relatedInternalApprovalId: input.relatedInternalApprovalId,
      status: 'pending',
      requestedAt: nowIso(),
      approvedSnapshot: input.snapshot
    };
    await this.store.update(next => {
      next.clientApprovals.push(approval);
    });
    return approval;
  }

  async resolve(id: string, status: Extract<ClientApprovalStatus, 'approved' | 'rejected' | 'changes_requested'>, input: {
    resolvedBy: string;
    decisionNote?: string;
    ipAddress?: string;
    userAgent?: string;
    snapshot?: Record<string, unknown>;
  }): Promise<ClientApproval> {
    let resolved: ClientApproval | undefined;
    await this.store.update(data => {
      const approval = data.clientApprovals.find(item => item.id === id);
      if (!approval) throw new Error(`Client approval not found: ${id}`);
      approval.status = status;
      approval.resolvedAt = nowIso();
      approval.resolvedBy = input.resolvedBy;
      approval.decisionNote = input.decisionNote;
      approval.userAgent = input.userAgent;
      approval.ipAddressHash = input.ipAddress ? hashIp(input.ipAddress) : undefined;
      approval.approvedSnapshot = {
        ...(approval.approvedSnapshot || {}),
        ...(input.snapshot || {}),
        resolvedAt: approval.resolvedAt,
        decisionNote: input.decisionNote
      };
      resolved = approval;
    });
    if (resolved?.relatedInternalApprovalId) {
      await this.approvalService.resolve(
        resolved.relatedInternalApprovalId,
        status === 'approved' ? 'approved' : status === 'changes_requested' ? 'changes_requested' : 'rejected',
        { resolvedBy: input.resolvedBy, decisionReason: input.decisionNote }
      ).catch(() => undefined);
    }
    return resolved!;
  }
}

function hashIp(ipAddress: string): string {
  return createHash('sha256').update(ipAddress).digest('hex').slice(0, 24);
}
