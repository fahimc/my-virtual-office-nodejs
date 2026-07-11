import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { ClientMessage, ClientMessageSenderType } from '../schemas/clientMessage.schema.js';

export class ClientMessageStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId: string): Promise<ClientMessage[]> {
    const data = await this.store.read();
    return data.clientMessages
      .filter(item => item.projectId === projectId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async create(input: {
    projectId: string;
    customerId: string;
    senderType: ClientMessageSenderType;
    senderAgentId?: string;
    subject: string;
    body: string;
    relatedApprovalId?: string;
    relatedPreviewVersionId?: string;
    relatedFeedbackId?: string;
  }): Promise<ClientMessage> {
    const message: ClientMessage = {
      id: createId('client-message'),
      projectId: input.projectId,
      customerId: input.customerId,
      senderType: input.senderType,
      senderAgentId: input.senderAgentId,
      subject: clean(input.subject).slice(0, 160),
      body: clean(input.body).slice(0, 5000),
      relatedApprovalId: input.relatedApprovalId,
      relatedPreviewVersionId: input.relatedPreviewVersionId,
      relatedFeedbackId: input.relatedFeedbackId,
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.clientMessages.push(message);
    });
    return message;
  }
}

function clean(value: string): string {
  return String(value || '').replace(/[<>]/g, '').trim();
}
