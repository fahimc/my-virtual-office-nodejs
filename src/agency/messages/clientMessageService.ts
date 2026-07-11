import { ClientMessageStore } from './clientMessageStore.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export class ClientMessageService {
  readonly store: ClientMessageStore;

  constructor(memory: MemoryStore) {
    this.store = new ClientMessageStore(memory);
  }

  list(projectId: string) {
    return this.store.list(projectId);
  }

  createCustomerMessage(input: { projectId: string; customerId: string; subject: string; body: string }) {
    return this.store.create({ ...input, senderType: 'customer' });
  }

  createAgencyMessage(input: { projectId: string; customerId: string; subject: string; body: string; senderAgentId?: string }) {
    return this.store.create({ ...input, senderType: input.senderAgentId ? 'agent' : 'agency' });
  }
}
