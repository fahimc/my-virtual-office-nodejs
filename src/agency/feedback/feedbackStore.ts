import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { VisualFeedback, VisualFeedbackType } from '../schemas/visualFeedback.schema.js';

export class FeedbackStore {
  constructor(private readonly store: MemoryStore) {}

  async list(projectId: string): Promise<VisualFeedback[]> {
    const data = await this.store.read();
    return data.visualFeedback
      .filter(item => item.projectId === projectId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async create(input: {
    projectId: string;
    previewVersionId: string;
    customerId: string;
    pageUrl: string;
    viewport: { width: number; height: number };
    clickPosition: { x: number; y: number };
    domSelector?: string;
    screenshotUrl?: string;
    comment: string;
    type: VisualFeedbackType;
  }): Promise<VisualFeedback> {
    const item: VisualFeedback = {
      id: createId('feedback'),
      projectId: input.projectId,
      previewVersionId: input.previewVersionId,
      customerId: input.customerId,
      pageUrl: input.pageUrl,
      viewport: input.viewport,
      clickPosition: input.clickPosition,
      domSelector: input.domSelector,
      screenshotUrl: input.screenshotUrl,
      comment: sanitizeComment(input.comment),
      type: input.type,
      status: 'new',
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.visualFeedback.push(item);
    });
    return item;
  }

  async update(id: string, patch: Partial<VisualFeedback>): Promise<VisualFeedback> {
    let result: VisualFeedback | undefined;
    await this.store.update(data => {
      const item = data.visualFeedback.find(feedback => feedback.id === id);
      if (!item) throw new Error(`Feedback not found: ${id}`);
      Object.assign(item, patch);
      result = item;
    });
    return result!;
  }
}

function sanitizeComment(comment: string): string {
  return comment.replace(/[<>]/g, '').trim().slice(0, 2000);
}
