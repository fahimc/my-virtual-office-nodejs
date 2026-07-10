import type { ProjectMemory } from '../memory/projectMemory.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';

export class DeploymentWorkflow {
  constructor(
    private readonly projectMemory: ProjectMemory,
    private readonly workflowRuntime: WorkflowRuntime
  ) {}

  async complete(projectId: string, liveUrl: string): Promise<void> {
    const project = await this.projectMemory.update(projectId, { status: 'completed', liveUrl });
    if (project.currentWorkflowRunId) {
      const run = await this.workflowRuntime.get(project.currentWorkflowRunId);
      if (run) {
        await this.workflowRuntime.patch(run.id, { status: 'completed', currentStep: 'deployment_completed' });
        await this.workflowRuntime.emit(run, 'deployment.completed', { liveUrl });
        await this.workflowRuntime.emit(run, 'project.completed', { projectId });
      }
    }
  }
}
