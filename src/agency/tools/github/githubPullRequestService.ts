import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { GitHubPullRequestRecord } from '../../schemas/github.schema.js';

export class GitHubPullRequestService {
  constructor(private readonly store: MemoryStore) {}

  async create(input: Omit<GitHubPullRequestRecord, 'id' | 'status' | 'url' | 'createdAt' | 'updatedAt'> & { url?: string }): Promise<GitHubPullRequestRecord> {
    const timestamp = nowIso();
    const pr: GitHubPullRequestRecord = {
      id: createId('github-pr'),
      status: 'open',
      url: input.url || `https://github.local/${input.repo}/pull/${Date.now()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input
    };
    await this.store.update(data => {
      data.githubPullRequests.push(pr);
    });
    return pr;
  }

  async update(id: string, patch: Partial<GitHubPullRequestRecord>): Promise<GitHubPullRequestRecord> {
    let result: GitHubPullRequestRecord | undefined;
    await this.store.update(data => {
      const pr = data.githubPullRequests.find(item => item.id === id);
      if (!pr) throw new Error(`GitHub PR not found: ${id}`);
      Object.assign(pr, patch, { updatedAt: nowIso() });
      result = pr;
    });
    return result!;
  }

  async get(id: string): Promise<GitHubPullRequestRecord | undefined> {
    const data = await this.store.read();
    return data.githubPullRequests.find(pr => pr.id === id);
  }
}
