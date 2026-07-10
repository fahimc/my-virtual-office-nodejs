import { nowIso, type MemoryStore } from './memoryStore.js';

export class VisualPreferenceMemory {
  constructor(private readonly store: MemoryStore) {}

  async add(input: { customerId: string; preference: string; sourceProjectId?: string; approved: boolean }) {
    const item = { ...input, updatedAt: nowIso() };
    await this.store.update(data => {
      data.design.visualPreferenceMemory.push(item);
    });
    return item;
  }
}
