export type GitHubPrStatus = 'draft' | 'open' | 'review_requested' | 'changes_requested' | 'approved' | 'merged' | 'closed';

export interface GitHubBranchRecord {
  id: string;
  projectId: string;
  repo: string;
  branchName: string;
  baseBranch: string;
  createdByAgentId: string;
  createdAt: string;
}

export interface GitHubPullRequestRecord {
  id: string;
  projectId: string;
  repo: string;
  branchName: string;
  title: string;
  body: string;
  url: string;
  status: GitHubPrStatus;
  approvalId?: string;
  createdByAgentId: string;
  createdAt: string;
  updatedAt: string;
}
