import type { CompanyOS } from '../company/companyOS.js';

export class EmailWorkflow {
  constructor(private readonly companyOS: CompanyOS) {}

  async draftCompletionEmail(input: { projectId: string; customerId?: string; to: string[]; subject: string; body: string }) {
    const draft = await this.companyOS.emailDrafts.createDraft({
      ...input,
      createdByAgentId: 'client-success'
    });
    const approval = await this.companyOS.emailApprovals.requestSendApproval(draft);
    await this.companyOS.notifications.notify({
      projectId: input.projectId,
      type: 'email_draft_ready',
      title: 'Email draft ready for approval',
      message: `Client Success drafted "${input.subject}".`
    });
    return { draft, approval };
  }
}
