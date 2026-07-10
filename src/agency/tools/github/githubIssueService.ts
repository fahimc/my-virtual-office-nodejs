export class GitHubIssueService {
  async create(input: { repo: string; title: string; body: string }): Promise<{ issueUrl: string; number: number }> {
    return { issueUrl: `https://github.local/${input.repo}/issues/${Date.now()}`, number: Date.now() };
  }

  async update(input: { issueUrl: string; title?: string; body?: string }): Promise<{ updated: boolean }> {
    return { updated: Boolean(input.issueUrl) };
  }
}
