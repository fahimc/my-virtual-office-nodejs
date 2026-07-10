import type { ApprovalService } from '../approvals/approvalService.js';

export class PreviewApprovalWorkflow {
  constructor(private readonly approvals: ApprovalService) {}

  request(projectId: string, previewUrl: string, requestedByAgentId = 'delivery') {
    return this.approvals.request({
      projectId,
      type: 'preview',
      title: 'Preview approval requested',
      description: 'Review the preview and approve or request changes.',
      requestedByAgentId,
      payload: { previewUrl }
    });
  }
}
