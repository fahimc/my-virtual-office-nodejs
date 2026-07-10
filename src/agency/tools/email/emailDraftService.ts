import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { EmailDraft } from '../../schemas/email.schema.js';

export class EmailDraftService {
  constructor(private readonly store: MemoryStore) {}

  async createDraft(input: Omit<EmailDraft, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<EmailDraft> {
    const timestamp = nowIso();
    const draft: EmailDraft = {
      id: createId('email-draft'),
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input
    };
    await this.store.update(data => {
      data.emailDrafts.push(draft);
    });
    return draft;
  }

  async updateDraft(id: string, patch: Partial<EmailDraft>): Promise<EmailDraft> {
    let result: EmailDraft | undefined;
    await this.store.update(data => {
      const draft = data.emailDrafts.find(item => item.id === id);
      if (!draft) throw new Error(`Email draft not found: ${id}`);
      Object.assign(draft, patch, { updatedAt: nowIso() });
      result = draft;
    });
    return result!;
  }

  async getDraft(id: string): Promise<EmailDraft | undefined> {
    const data = await this.store.read();
    return data.emailDrafts.find(item => item.id === id);
  }

  async list(projectId?: string): Promise<EmailDraft[]> {
    const data = await this.store.read();
    return data.emailDrafts.filter(item => !projectId || item.projectId === projectId);
  }
}
