import type { WorkflowRuntime } from './workflowRuntime.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';

export class ResumeService {
  constructor(private readonly workflowRuntime: WorkflowRuntime) {}

  async resume(workflowRunId: string): Promise<void> {
    const run = await this.workflowRuntime.get(workflowRunId);
    if (!run) throw new Error(`Workflow run not found: ${workflowRunId}`);
    if (run.status !== 'paused' && run.status !== 'failed' && run.currentStep !== 'failed') return;
    const resumeStep = resolveResumeStep(run);
    const {
      executionLeaseOwner: _executionLeaseOwner,
      executionLeaseUntil: _executionLeaseUntil,
      ...resumableState
    } = run.state;
    await this.workflowRuntime.patch(workflowRunId, {
      status: 'running',
      currentStep: resumeStep,
      error: undefined,
      state: {
        ...resumableState,
        executionLeaseOwner: undefined,
        executionLeaseUntil: undefined,
        resumeRequestedAt: new Date().toISOString(),
        resumeCount: Number(run.state.resumeCount || 0) + 1,
        lastResumeFromStep: run.currentStep,
        lastResumeCheckpoint: resumeStep,
        lastResumeError: run.error || ''
      }
    });
  }
}

function resolveResumeStep(run: WorkflowRun): string {
  const checkpoint = typeof run.state.lastCheckpoint === 'string' ? run.state.lastCheckpoint.trim() : '';
  if (checkpoint && checkpoint !== 'failed') return checkpoint;
  const trace = Array.isArray(run.state.debugTrace) ? run.state.debugTrace : [];
  for (let index = trace.length - 1; index >= 0; index -= 1) {
    const entry = trace[index];
    if (!entry || typeof entry !== 'object') continue;
    const step = typeof (entry as { step?: unknown }).step === 'string'
      ? String((entry as { step: string }).step).trim()
      : '';
    if (step && step !== 'failed') return step;
  }
  return run.currentStep !== 'failed' ? run.currentStep : 'created';
}
