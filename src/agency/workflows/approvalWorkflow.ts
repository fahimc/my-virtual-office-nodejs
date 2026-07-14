import { ApprovalService } from '../approvals/approvalService.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export class ApprovalWorkflow {
  private readonly approvals: ApprovalService;

  constructor(store: MemoryStore) {
    this.approvals = new ApprovalService(store);
  }

  approve(approvalId: string, payload: Record<string, unknown> = {}) {
    return this.approvals.resolve(approvalId, 'approved', payload);
  }

  requestChanges(approvalId: string, feedback: string) {
    return this.approvals.resolve(approvalId, 'changes_requested', { feedback });
  }
}
