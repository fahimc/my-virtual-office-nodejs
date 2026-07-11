import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';

export class CustomerNotificationService {
  constructor(private readonly store: MemoryStore) {}

  async notify(input: { projectId: string; type: string; title: string; message: string }) {
    const notification = {
      id: createId('notification'),
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.notifications.push(notification);
    });
    return notification;
  }
}
