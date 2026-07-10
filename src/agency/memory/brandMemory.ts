import { nowIso, type MemoryStore } from './memoryStore.js';

export class BrandMemory {
  constructor(private readonly store: MemoryStore) {}

  async remember(input: { customerId: string; projectId?: string; key: string; value: unknown }) {
    const item = { ...input, updatedAt: nowIso() };
    await this.store.update(data => {
      data.design.brandMemory = data.design.brandMemory.filter(existing =>
        !(existing.customerId === input.customerId && existing.key === input.key)
      );
      data.design.brandMemory.push(item);
    });
    return item;
  }

  async forCustomer(customerId: string) {
    const data = await this.store.read();
    return data.design.brandMemory.filter(item => item.customerId === customerId);
  }
}
