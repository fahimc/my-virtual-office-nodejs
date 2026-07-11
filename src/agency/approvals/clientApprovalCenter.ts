import type { ClientApprovalService } from './clientApprovalService.js';

export class ClientApprovalCenter {
  constructor(private readonly approvals: ClientApprovalService) {}

  async pendingCount(projectId: string): Promise<number> {
    return (await this.approvals.list(projectId)).filter(item => item.status === 'pending').length;
  }
}
