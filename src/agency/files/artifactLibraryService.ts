import type { MemoryStore } from '../memory/memoryStore.js';

export class ArtifactLibraryService {
  constructor(private readonly store: MemoryStore) {}

  async listCustomerSafe(projectId: string) {
    const data = await this.store.read();
    return data.artifacts
      .filter(item => item.projectId === projectId)
      .filter(item => !['audit', 'internal'].includes(item.type))
      .map(item => ({ id: item.id, type: item.type, title: item.title, url: item.url, createdAt: item.createdAt }));
  }
}
