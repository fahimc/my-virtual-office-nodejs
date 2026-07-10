import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';

export class ArtifactStore {
  constructor(private readonly store: MemoryStore) {}

  async attach(input: { projectId: string; type: string; title: string; url?: string; metadata?: Record<string, unknown>; createdByAgentId: string }) {
    const artifact = {
      id: createId('artifact'),
      projectId: input.projectId,
      type: input.type as never,
      title: input.title,
      url: input.url,
      metadata: input.metadata || {},
      createdByAgentId: input.createdByAgentId,
      createdAt: nowIso()
    };
    await this.store.update(data => { data.artifacts.push(artifact); });
    return artifact;
  }
}
