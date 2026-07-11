import type { ClientApprovalService } from '../approvals/clientApprovalService.js';

export class DesignApprovalService {
  constructor(private readonly approvals: ClientApprovalService) {}

  requestDesignDirectionApproval(input: { projectId: string; customerId: string; designVersionId?: string; snapshot?: Record<string, unknown> }) {
    return this.approvals.ensure({
      projectId: input.projectId,
      customerId: input.customerId,
      type: 'design_direction',
      title: 'Approve design direction',
      description: 'Review the proposed creative direction before the agency moves into build handoff.',
      designVersionId: input.designVersionId,
      snapshot: input.snapshot
    });
  }
}
