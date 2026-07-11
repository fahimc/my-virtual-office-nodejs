import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { UpdateFeedItem, CustomerUpdateType } from '../schemas/customerUpdate.schema.js';

export class UpdateFeedStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId: string): Promise<UpdateFeedItem[]> {
    const data = await this.store.read();
    return data.customerUpdates
      .filter(item => item.projectId === projectId && item.visibleToCustomer)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async publish(input: {
    projectId: string;
    customerId: string;
    title: string;
    message: string;
    type: CustomerUpdateType;
    sourceInternalEvents?: string[];
    createdByAgentId?: string;
  }): Promise<UpdateFeedItem> {
    const item: UpdateFeedItem = {
      id: createId('update'),
      projectId: input.projectId,
      customerId: input.customerId,
      title: input.title,
      message: input.message,
      type: input.type,
      sourceInternalEvents: input.sourceInternalEvents || [],
      visibleToCustomer: true,
      createdByAgentId: input.createdByAgentId || 'client-success',
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.customerUpdates.push(item);
    });
    return item;
  }
}
