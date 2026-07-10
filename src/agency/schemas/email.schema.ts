export type EmailDraftStatus = 'draft' | 'approval_requested' | 'approved' | 'sent' | 'rejected' | 'failed';

export interface EmailDraft {
  id: string;
  projectId?: string;
  customerId?: string;
  threadId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  status: EmailDraftStatus;
  createdByAgentId: string;
  approvalId?: string;
  providerMessageId?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export interface EmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  receivedAt: string;
}
