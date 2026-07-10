export class EmailNotificationProvider {
  async send(input: { to?: string; title: string; message: string }) {
    return { delivered: false, channel: 'email', reason: 'email provider not configured', ...input };
  }
}
