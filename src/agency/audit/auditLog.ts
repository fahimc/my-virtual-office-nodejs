import type { AuditLog } from '../schemas/audit.schema.js';
import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';

export class AuditLogger {
  constructor(private readonly store: MemoryStore) {}

  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const audit: AuditLog = { id: createId('audit'), createdAt: nowIso(), ...entry };
    await this.store.update(data => {
      data.audits.push(audit);
      data.audits = data.audits.slice(-1000);
    });
    return audit;
  }
}
