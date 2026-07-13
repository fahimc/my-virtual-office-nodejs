import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { GitHubBranchRecord } from '../../schemas/github.schema.js';
import { githubCreateBranch } from './githubApi.js';

export class GitHubBranchService {
  constructor(private readonly store: MemoryStore) {}

  async create(input: Omit<GitHubBranchRecord, 'id' | 'createdAt'>): Promise<GitHubBranchRecord> {
    await githubCreateBranch(input.repo, input.branchName, input.baseBranch).catch(() => undefined);
    const branch: GitHubBranchRecord = { id: createId('github-branch'), createdAt: nowIso(), ...input };
    await this.store.update(data => {
      data.githubBranches.push(branch);
    });
    return branch;
  }
}
