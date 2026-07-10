import { ApprovalService } from '../../approvals/approvalService.js';

export class DeploymentApprovalService {
  constructor(private readonly approvals: ApprovalService) {}

  request(projectId: string, requestedByAgentId = 'delivery', payload: Record<string, unknown> = {}) {
    return this.approvals.request({
      projectId,
      type: 'deploy_live',
      title: 'Approve live deployment',
      description: 'Publishing the client website live requires explicit approval.',
      requestedByAgentId,
      payload
    });
  }
}
