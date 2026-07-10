export class GitHubWebhookHandler {
  async handle(event: string, payload: Record<string, unknown>): Promise<{ handled: boolean }> {
    return { handled: Boolean(event && payload) };
  }
}
