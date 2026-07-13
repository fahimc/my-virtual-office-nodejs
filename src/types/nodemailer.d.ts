declare module 'nodemailer' {
  const nodemailer: {
    createTransport(config: unknown): {
      sendMail(message: unknown): Promise<{ messageId?: string }>;
    };
  };

  export default nodemailer;
}
