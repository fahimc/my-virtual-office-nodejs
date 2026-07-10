export type CodexTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface CodexTask {
  id: string;
  projectId: string;
  repoPath: string;
  branchName: string;
  taskTitle: string;
  taskPrompt: string;
  allowedCommands: string[];
  disallowedCommands: string[];
  maxRuntimeMs: number;
  status: CodexTaskStatus;
  resultSummary?: string;
  changedFiles: string[];
  testResults: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodexResult {
  status: 'completed' | 'failed' | 'needs_review';
  summary: string;
  changedFiles: string[];
  commandsRun: string[];
  testsRun: string[];
  buildResult: string;
  diffSummary: string;
  needsHumanReview: boolean;
  error?: string;
}

export interface CodexRunInput {
  projectId: string;
  repoPath: string;
  taskTitle: string;
  taskPrompt: string;
  branchName?: string;
  agentId?: string;
}

export function createCodexBranchName(projectId: string, title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'task';
  return `agency/${projectId.slice(0, 12)}/${slug}`;
}
