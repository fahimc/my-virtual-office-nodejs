import type { ApprovalRequest, ApprovalStatus } from '../schemas/approval.schema.js';
import { nowIso, type MemoryStore } from '../memory/memoryStore.js';

export class ApprovalStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId?: string, status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    const data = await this.store.read();
    return data.approvals.filter(item =>
      (!projectId || item.projectId === projectId) &&
      (!status || item.status === status)
    );
  }

  async update(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    let result: ApprovalRequest | undefined;
    await this.store.update(data => {
      const approval = data.approvals.find(item => item.id === id);
      if (!approval) throw new Error(`Approval not found: ${id}`);
      Object.assign(approval, patch, patch.status && patch.status !== 'pending' ? { resolvedAt: nowIso() } : {});
      result = approval;
    });
    return result!;
  }
}
