export class PushNotificationProvider {
  async send(input: { title: string; message: string }) {
    return { delivered: false, channel: 'push', reason: 'push provider not configured', ...input };
  }
}
