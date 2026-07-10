import { ApprovalService } from '../../approvals/approvalService.js';
import type { EmailDraft } from '../../schemas/email.schema.js';
import { EmailDraftService } from './emailDraftService.js';

export class EmailApprovalService {
  constructor(
    private readonly approvals: ApprovalService,
    private readonly drafts: EmailDraftService
  ) {}

  async requestSendApproval(draft: EmailDraft) {
    if (!draft.projectId) throw new Error('Email approval requires projectId');
    const approval = await this.approvals.request({
      projectId: draft.projectId,
      type: 'send_email',
      title: `Send email: ${draft.subject}`,
      description: `Approve sending an external email to ${draft.to.join(', ')}.`,
      requestedByAgentId: draft.createdByAgentId,
      payload: { draftId: draft.id, to: draft.to, subject: draft.subject, body: draft.body }
    });
    await this.drafts.updateDraft(draft.id, { status: 'approval_requested', approvalId: approval.id });
    return approval;
  }
}
