export type ClientMessageSenderType = 'customer' | 'agency' | 'agent' | 'system';

export interface ClientMessage {
  id: string;
  projectId: string;
  customerId: string;
  senderType: ClientMessageSenderType;
  senderAgentId?: string;
  subject: string;
  body: string;
  relatedApprovalId?: string;
  relatedPreviewVersionId?: string;
  relatedFeedbackId?: string;
  createdAt: string;
  readAt?: string;
}
