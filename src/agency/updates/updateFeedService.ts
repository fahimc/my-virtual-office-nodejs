import type { MemoryStore } from '../memory/memoryStore.js';
import type { Project } from '../schemas/project.schema.js';
import type { UpdateFeedItem } from '../schemas/customerUpdate.schema.js';
import { customerUpdateForProjectStatus } from './customerUpdateFormatter.js';
import { internalEventToCustomerUpdate } from './internalEventToCustomerUpdate.js';
import { UpdateFeedStore } from './updateFeedStore.js';

export class UpdateFeedService {
  readonly store: UpdateFeedStore;

  constructor(private readonly memory: MemoryStore) {
    this.store = new UpdateFeedStore(memory);
  }

  list(projectId: string): Promise<UpdateFeedItem[]> {
    return this.store.list(projectId);
  }

  async ensureBaseline(project: Project): Promise<UpdateFeedItem[]> {
    const existing = await this.store.list(project.id);
    if (existing.length) return existing;
    const draft = customerUpdateForProjectStatus(project);
    await this.store.publish({
      projectId: project.id,
      customerId: project.customerId,
      title: 'Brief received',
      message: 'Your project brief is in the agency system. The team will prepare design and preview decisions in the portal.',
      type: 'progress',
      sourceInternalEvents: ['brief.approved']
    });
    await this.store.publish({
      projectId: project.id,
      customerId: project.customerId,
      ...draft,
      sourceInternalEvents: ['project.status']
    });
    return this.store.list(project.id);
  }

  publishFromInternalEvent(project: Project, eventName: string): Promise<UpdateFeedItem> {
    const draft = internalEventToCustomerUpdate(eventName);
    return this.store.publish({
      projectId: project.id,
      customerId: project.customerId,
      ...draft,
      sourceInternalEvents: [eventName]
    });
  }
}
