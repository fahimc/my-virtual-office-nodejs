import type { AuditLog } from '../schemas/audit.schema.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export class AuditStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId?: string): Promise<AuditLog[]> {
    const data = await this.store.read();
    return data.audits.filter(item => !projectId || item.projectId === projectId).slice(-250).reverse();
  }
}
