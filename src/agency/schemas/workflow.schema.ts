export type WorkflowStatus = 'running' | 'waiting_for_user' | 'paused' | 'failed' | 'completed';

export interface WorkflowRun {
  id: string;
  projectId?: string;
  workflowName: string;
  status: WorkflowStatus;
  currentStep: string;
  state: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
