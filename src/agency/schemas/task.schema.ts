export type AgentTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'blocked';

export interface AgentTask {
  id: string;
  projectId: string;
  agentId: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
