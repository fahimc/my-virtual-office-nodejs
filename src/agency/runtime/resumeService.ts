import type { WorkflowRuntime } from './workflowRuntime.js';

export class ResumeService {
  constructor(private readonly workflowRuntime: WorkflowRuntime) {}

  async resume(workflowRunId: string): Promise<void> {
    const run = await this.workflowRuntime.get(workflowRunId);
    if (!run) throw new Error(`Workflow run not found: ${workflowRunId}`);
    if (run.status !== 'paused' && run.status !== 'failed') return;
    await this.workflowRuntime.patch(workflowRunId, {
      status: 'running',
      error: undefined,
      state: { ...run.state, resumeRequestedAt: new Date().toISOString() }
    });
  }
}
