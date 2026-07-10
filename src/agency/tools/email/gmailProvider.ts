import type { EmailDraft, EmailMessageSummary } from '../../schemas/email.schema.js';

export interface EmailProvider {
  search(query: string): Promise<EmailMessageSummary[]>;
  readThread(threadId: string): Promise<EmailMessageSummary[]>;
  createDraft(draft: EmailDraft): Promise<{ providerDraftId: string }>;
  updateDraft(draft: EmailDraft): Promise<{ providerDraftId: string }>;
  sendDraft(draft: EmailDraft): Promise<{ providerMessageId: string }>;
}

export class GmailProvider implements EmailProvider {
  async search(_query: string): Promise<EmailMessageSummary[]> {
    return [];
  }

  async readThread(_threadId: string): Promise<EmailMessageSummary[]> {
    return [];
  }

  async createDraft(draft: EmailDraft): Promise<{ providerDraftId: string }> {
    return { providerDraftId: `gmail-draft-${draft.id}` };
  }

  async updateDraft(draft: EmailDraft): Promise<{ providerDraftId: string }> {
    return { providerDraftId: `gmail-draft-${draft.id}` };
  }

  async sendDraft(draft: EmailDraft): Promise<{ providerMessageId: string }> {
    return { providerMessageId: `gmail-message-${draft.id}` };
  }
}
