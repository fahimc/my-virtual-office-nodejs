import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { PreviewRecord } from '../../schemas/deployment.schema.js';

export class PreviewService {
  constructor(private readonly store: MemoryStore) {}

  async create(input: Omit<PreviewRecord, 'id' | 'createdAt'>): Promise<PreviewRecord> {
    const preview: PreviewRecord = { id: createId('preview'), createdAt: nowIso(), ...input };
    await this.store.update(data => {
      data.previews.push(preview);
    });
    return preview;
  }

  async get(id: string): Promise<PreviewRecord | undefined> {
    const data = await this.store.read();
    return data.previews.find(preview => preview.id === id);
  }
}
