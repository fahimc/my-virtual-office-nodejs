import type { ToolDefinition } from '../toolTypes.js';
import type { EmailDraft } from '../../schemas/email.schema.js';
import { EmailDraftService } from './emailDraftService.js';
import type { EmailProvider } from './gmailProvider.js';

export function createCompanyEmailTool(drafts: EmailDraftService, provider: EmailProvider): ToolDefinition<
  Partial<EmailDraft> & { action: 'search' | 'read_thread' | 'create_draft' | 'update_draft' | 'send_approved_draft'; query?: string; draftId?: string; threadId?: string; agentId?: string },
  unknown
> {
  return {
    name: 'email.company',
    description: 'Search email, read threads, create/update drafts, and send approved drafts.',
    inputSchema: 'Email company action',
    outputSchema: 'Email action result',
    permissionLevel: 'external',
    approvalRequired: false,
    async execute(input) {
      if (input.action === 'search') return provider.search(input.query || '');
      if (input.action === 'read_thread') return provider.readThread(input.threadId || '');
      if (input.action === 'create_draft') {
        return drafts.createDraft({
          projectId: input.projectId,
          customerId: input.customerId,
          to: input.to || [],
          subject: input.subject || '',
          body: input.body || '',
          createdByAgentId: input.createdByAgentId || input.agentId || 'client-success'
        });
      }
      if (input.action === 'update_draft' && input.draftId) return drafts.updateDraft(input.draftId, input);
      if (input.action === 'send_approved_draft' && input.draftId) {
        const draft = await drafts.getDraft(input.draftId);
        if (!draft || draft.status !== 'approved') throw new Error('Draft is not approved for sending');
        const sent = await provider.sendDraft(draft);
        return drafts.updateDraft(draft.id, { status: 'sent', providerMessageId: sent.providerMessageId, sentAt: new Date().toISOString() });
      }
      throw new Error(`Unsupported email action: ${input.action}`);
    }
  };
}
