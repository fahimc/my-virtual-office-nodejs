import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';

export class NotificationService {
  constructor(private readonly store: MemoryStore) {}

  async notify(input: { projectId?: string; type: string; title: string; message: string }) {
    const notification = { id: createId('notification'), read: false, createdAt: nowIso(), ...input };
    await this.store.update(data => { data.notifications.push(notification); });
    return notification;
  }

  async list(projectId?: string) {
    const data = await this.store.read();
    return data.notifications.filter(item => !projectId || item.projectId === projectId).slice(-100).reverse();
  }
}
