import type { CompanyTask } from './taskBoardTypes.js';

export class GitHubProjectSync {
  async syncTask(task: CompanyTask): Promise<{ synced: boolean; issueUrl?: string }> {
    return { synced: false, issueUrl: undefined };
  }
}
