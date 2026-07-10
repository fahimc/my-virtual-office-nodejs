export class GitHubProjectService {
  async syncTask(input: { taskId: string; repo: string }): Promise<{ synced: boolean; projectItemUrl?: string }> {
    return { synced: false, projectItemUrl: `https://github.local/${input.repo}/projects` };
  }
}
