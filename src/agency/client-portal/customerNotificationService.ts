import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import { EmailNotificationProvider } from '../tools/notifications/emailNotificationProvider.js';
import { InAppNotificationProvider } from '../tools/notifications/inAppNotificationProvider.js';

export class CustomerNotificationService {
  private readonly email = new EmailNotificationProvider();
  private readonly inApp = new InAppNotificationProvider();

  constructor(private readonly store: MemoryStore) {}

  async notify(input: { projectId: string; type: string; title: string; message: string }) {
    const data = await this.store.read();
    const project = data.projects.find(item => item.id === input.projectId);
    const customer = project ? data.customers.find(item => item.id === project.customerId) : undefined;
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
    const deliveries = [
      await this.inApp.send({ title: input.title, message: input.message }),
      await this.email.send({ to: customer?.email, title: input.title, message: input.message }).catch(error => ({
        delivered: false,
        channel: 'email',
        reason: error instanceof Error ? error.message : String(error),
        title: input.title,
        message: input.message,
        to: customer?.email
      }))
    ];
    return { ...notification, deliveries };
  }
}
