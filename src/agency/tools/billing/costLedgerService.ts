import type { MemoryStore } from '../../memory/memoryStore.js';
import { createId, nowIso } from '../../memory/memoryStore.js';
import type { CostLedgerEntry, ProjectCostSummary } from '../../schemas/costLedger.schema.js';

export class CostLedgerService {
  constructor(private readonly store: MemoryStore) {}

  async recordEstimate(input: Omit<CostLedgerEntry, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<CostLedgerEntry> {
    const entry: CostLedgerEntry = {
      id: createId('cost'),
      status: 'estimated',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...input
    };
    await this.store.update(data => {
      data.costLedger.push(entry);
    });
    return entry;
  }

  async recordActual(id: string, actual: { actualCostUsd: number; actualInputTokens?: number; actualOutputTokens?: number }): Promise<CostLedgerEntry> {
    let updated: CostLedgerEntry | undefined;
    await this.store.update(data => {
      const entry = data.costLedger.find(item => item.id === id);
      if (!entry) return;
      entry.status = 'actual';
      entry.actualCostUsd = actual.actualCostUsd;
      entry.actualInputTokens = actual.actualInputTokens;
      entry.actualOutputTokens = actual.actualOutputTokens;
      entry.updatedAt = nowIso();
      updated = entry;
    });
    if (!updated) throw new Error(`Cost entry not found: ${id}`);
    return updated;
  }

  async summarizeProject(projectId: string): Promise<ProjectCostSummary> {
    const data = await this.store.read();
    const entries = data.costLedger.filter(item => item.projectId === projectId);
    return {
      projectId,
      entries,
      estimatedCostUsd: Number(entries.reduce((sum, item) => sum + item.estimatedCostUsd, 0).toFixed(6)),
      actualCostUsd: Number(entries.reduce((sum, item) => sum + (item.actualCostUsd || 0), 0).toFixed(6))
    };
  }
}
