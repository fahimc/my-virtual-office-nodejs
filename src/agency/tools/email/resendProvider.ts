import type { EmailDraft, EmailMessageSummary } from '../../schemas/email.schema.js';
import type { EmailProvider } from './gmailProvider.js';

export class ResendProvider implements EmailProvider {
  async search(_query: string): Promise<EmailMessageSummary[]> {
    return [];
  }

  async readThread(_threadId: string): Promise<EmailMessageSummary[]> {
    return [];
  }

  async createDraft(draft: EmailDraft): Promise<{ providerDraftId: string }> {
    return { providerDraftId: `resend-draft-${draft.id}` };
  }

  async updateDraft(draft: EmailDraft): Promise<{ providerDraftId: string }> {
    return { providerDraftId: `resend-draft-${draft.id}` };
  }

  async sendDraft(draft: EmailDraft): Promise<{ providerMessageId: string }> {
    return { providerMessageId: `resend-message-${draft.id}` };
  }
}
