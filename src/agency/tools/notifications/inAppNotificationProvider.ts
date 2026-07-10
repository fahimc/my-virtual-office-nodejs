export class InAppNotificationProvider {
  async send(input: { title: string; message: string }) {
    return { delivered: true, channel: 'in_app', ...input };
  }
}
