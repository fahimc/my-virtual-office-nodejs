import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { ProjectMemory } from '../memory/projectMemory.js';
import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';
import { ApprovalService } from '../approvals/approvalService.js';

export class WebsiteBuildWorkflow {
  private readonly approvalService: ApprovalService;

  constructor(
    private readonly store: MemoryStore,
    private readonly projectMemory: ProjectMemory,
    private readonly agentRuntime: AgentRuntime,
    private readonly workflowRuntime: WorkflowRuntime
  ) {
    this.approvalService = new ApprovalService(store);
  }

  async start(projectId: string): Promise<{ workflowRunId: string }> {
    const project = await this.projectMemory.get(projectId);
    if (!project?.structuredBrief) throw new Error(`Project missing structured brief: ${projectId}`);
    const run = await this.workflowRuntime.create('websiteBuildWorkflow', { projectId, qaAttempt: 0 }, projectId);
    await this.projectMemory.update(projectId, { currentWorkflowRunId: run.id, status: 'planning' });
    return { workflowRunId: run.id };
  }

  async runUntilPreview(workflowRunId: string): Promise<void> {
    const run = await this.workflowRuntime.get(workflowRunId);
    if (!run?.projectId) throw new Error(`Workflow run missing project: ${workflowRunId}`);
    const project = await this.projectMemory.get(run.projectId);
    if (!project?.structuredBrief) throw new Error(`Project missing structured brief: ${run.projectId}`);
    try {
      await this.workflowRuntime.patch(run.id, { status: 'running', currentStep: 'planning' });
      const plan = await this.agentRuntime.execute('planner', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { tasks: string[]; summary: string };
      await this.saveArtifact(project.id, 'plan', 'Project plan', plan, 'planner');
      await this.workflowRuntime.emit(run, 'plan.created', plan);

      await this.projectMemory.update(project.id, { status: 'design' });
      await this.workflowRuntime.emit(run, 'design.started', {});
      const design = await this.agentRuntime.execute('design', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { direction: string; sections: string[] };
      await this.saveArtifact(project.id, 'design', 'Design direction', design, 'design');
      await this.workflowRuntime.emit(run, 'design.completed', design);

      await this.projectMemory.update(project.id, { status: 'copy' });
      await this.workflowRuntime.emit(run, 'copy.started', {});
      const copy = await this.agentRuntime.execute('copy', { structuredBrief: project.structuredBrief, designDirection: design.direction }, { projectId: project.id, workflowRunId: run.id }) as { copy: string };
      await this.saveArtifact(project.id, 'copy', 'Website copy', copy, 'copy');
      await this.workflowRuntime.emit(run, 'copy.completed', copy);

      let qaPassed = false;
      let qaResult: { passed: boolean; issues: string[]; summary: string } | undefined;
      for (let attempt = 1; attempt <= 2 && !qaPassed; attempt += 1) {
        await this.projectMemory.update(project.id, { status: 'build' });
        await this.workflowRuntime.emit(run, 'build.started', { attempt });
        const build = await this.agentRuntime.execute('builder', { plan: plan.summary, design: design.direction, copy: copy.copy }, { projectId: project.id, workflowRunId: run.id }) as { files: unknown[]; summary: string };
        await this.saveArtifact(project.id, 'code', `Build attempt ${attempt}`, build, 'builder');
        await this.workflowRuntime.emit(run, 'build.completed', build);

        await this.projectMemory.update(project.id, { status: 'qa' });
        await this.workflowRuntime.emit(run, 'qa.started', { attempt });
        qaResult = await this.agentRuntime.execute('qa', { previewSummary: build.summary, attempt }, { projectId: project.id, workflowRunId: run.id }) as { passed: boolean; issues: string[]; summary: string };
        await this.saveArtifact(project.id, 'qa_report', `QA attempt ${attempt}`, qaResult, 'qa');
        qaPassed = qaResult.passed;
        await this.workflowRuntime.emit(run, qaPassed ? 'qa.passed' : 'qa.failed', qaResult);
      }
      if (!qaPassed) throw new Error('QA failed after maximum retry count');

      await this.projectMemory.update(project.id, { status: 'preview' });
      const delivery = await this.agentRuntime.execute('delivery', { projectId: project.id, qaSummary: qaResult?.summary || '' }, { projectId: project.id, workflowRunId: run.id }) as { previewUrl: string; summary: string };
      await this.saveArtifact(project.id, 'preview', 'Preview build', delivery, 'delivery', delivery.previewUrl);
      await this.projectMemory.update(project.id, { previewUrl: delivery.previewUrl, status: 'awaiting_approval' });
      const approval = await this.approvalService.request({
        projectId: project.id,
        type: 'preview',
        title: 'Preview ready for approval',
        description: 'Review the generated preview. Approve it or request changes.',
        requestedByAgentId: 'delivery',
        payload: { previewUrl: delivery.previewUrl }
      });
      await this.workflowRuntime.patch(run.id, {
        status: 'waiting_for_user',
        currentStep: 'preview_approval',
        state: { ...run.state, approvalId: approval.id, previewUrl: delivery.previewUrl }
      });
      await this.workflowRuntime.emit(run, 'preview.created', delivery);
      await this.workflowRuntime.emit(run, 'approval.requested', { approval });
    } catch (error) {
      await this.projectMemory.update(run.projectId, { status: 'failed' });
      await this.workflowRuntime.patch(run.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        currentStep: 'failed'
      });
      await this.workflowRuntime.emit(run, 'workflow.failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async handleChanges(projectId: string, feedback: string): Promise<{ workflowRunId: string }> {
    const project = await this.projectMemory.get(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    await this.projectMemory.update(projectId, { status: 'changes_requested' });
    const run = await this.workflowRuntime.create('websiteBuildWorkflow', { projectId, feedback, changeRequest: true }, projectId);
    await this.projectMemory.update(projectId, { currentWorkflowRunId: run.id });
    await this.workflowRuntime.emit(run, 'changes.requested', { feedback });
    return { workflowRunId: run.id };
  }

  async prepareDeployment(projectId: string): Promise<void> {
    const project = await this.projectMemory.get(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    await this.projectMemory.update(projectId, { status: 'deployment_pending' });
    await this.approvalService.request({
      projectId,
      type: 'deployment',
      title: 'Deployment approval required',
      description: 'Publishing live requires explicit deployment approval.',
      requestedByAgentId: 'delivery',
      payload: { previewUrl: project.previewUrl }
    });
  }

  private async saveArtifact(projectId: string, type: 'plan' | 'design' | 'copy' | 'code' | 'qa_report' | 'preview', title: string, metadata: Record<string, unknown>, createdByAgentId: string, url?: string) {
    await this.store.update(data => {
      data.artifacts.push({
        id: createId('artifact'),
        projectId,
        type,
        title,
        url,
        metadata,
        createdByAgentId,
        createdAt: nowIso()
      });
      data.tasks.push({
        id: createId('task'),
        projectId,
        agentId: createdByAgentId,
        title,
        description: `${createdByAgentId} completed ${title}`,
        status: 'completed',
        input: {},
        output: metadata,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    });
  }
}
