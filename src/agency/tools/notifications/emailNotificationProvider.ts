export class EmailNotificationProvider {
  async send(input: { to?: string; title: string; message: string }) {
    if (!input.to) return { delivered: false, channel: 'email', reason: 'missing recipient', ...input };
    if (!process.env.SMTP_HOST) return { delivered: false, channel: 'email', reason: 'SMTP_HOST is not configured', ...input };

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'AI Agency <no-reply@localhost>',
      to: input.to,
      subject: input.title,
      text: input.message,
      html: `<p>${escapeHtml(input.message).replace(/\n/g, '<br>')}</p>`
    });
    return { delivered: true, channel: 'email', messageId: result.messageId, ...input };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
