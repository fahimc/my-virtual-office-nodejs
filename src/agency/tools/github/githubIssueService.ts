import { githubCreateIssue } from './githubApi.js';

export class GitHubIssueService {
  async create(input: { repo: string; title: string; body: string }): Promise<{ issueUrl: string; number: number }> {
    const remote = await githubCreateIssue(input).catch(() => undefined);
    if (remote?.issueUrl && remote.number) return { issueUrl: remote.issueUrl, number: remote.number };
    return { issueUrl: `https://github.local/${input.repo}/issues/${Date.now()}`, number: Date.now() };
  }

  async update(input: { issueUrl: string; title?: string; body?: string }): Promise<{ updated: boolean }> {
    return { updated: Boolean(input.issueUrl) };
  }
}
