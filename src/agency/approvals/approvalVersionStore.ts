import type { MemoryStore } from '../memory/memoryStore.js';
import type { ClientApproval } from '../schemas/clientApproval.schema.js';

export class ApprovalVersionStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId: string): Promise<ClientApproval[]> {
    const data = await this.store.read();
    return data.clientApprovals
      .filter(item => item.projectId === projectId)
      .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt));
  }

  async find(id: string): Promise<ClientApproval | undefined> {
    const data = await this.store.read();
    return data.clientApprovals.find(item => item.id === id);
  }
}
