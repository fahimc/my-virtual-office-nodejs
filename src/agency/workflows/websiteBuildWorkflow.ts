import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { ProjectMemory } from '../memory/projectMemory.js';
import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';
import { ApprovalService } from '../approvals/approvalService.js';
import type { CompanyOS } from '../company/companyOS.js';
import type { DesignWorkflow } from './designWorkflow.js';

export class WebsiteBuildWorkflow {
  private readonly approvalService: ApprovalService;

  constructor(
    private readonly store: MemoryStore,
    private readonly projectMemory: ProjectMemory,
    private readonly agentRuntime: AgentRuntime,
    private readonly workflowRuntime: WorkflowRuntime,
    private readonly companyOS?: CompanyOS,
    private readonly designWorkflow?: DesignWorkflow
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
      const latestRun = await this.workflowRuntime.get(workflowRunId);
      const state = latestRun?.state || run.state;
      const plan = state.plan as { tasks: string[]; summary: string } | undefined || await this.agentRuntime.execute('planner', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { tasks: string[]; summary: string };
      if (!state.plan) {
        await this.saveArtifact(project.id, 'plan', 'Project plan', plan, 'planner');
        await this.createTaskPlan(project.id, run.id, plan.tasks);
        await this.workflowRuntime.emit(run, 'plan.created', plan);
      }

      await this.projectMemory.update(project.id, { status: 'design' });
      await this.workflowRuntime.emit(run, 'design.started', {});
      const design = state.design as { direction: string; sections: string[] } | undefined || await this.agentRuntime.execute('design', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { direction: string; sections: string[] };
      if (!state.design) {
        await this.saveArtifact(project.id, 'design', 'Design direction', design, 'design');
        await this.completeCompanyTask(project.id, 'design', { design });
        await this.workflowRuntime.emit(run, 'design.completed', design);
      }
      if (!state.designOptionsApproved) {
        const customer = (await this.store.read()).customers.find(item => item.id === project.customerId);
        if (!customer) throw new Error(`Customer not found for project ${project.id}`);
        const designGate = this.designWorkflow
          ? await this.designWorkflow.start(project, customer, run.id)
          : { directions: this.createDesignOptions(project.structuredBrief.businessSummary, design), approval: await this.approvalService.request({
            projectId: project.id,
            type: 'design_options',
            title: 'Choose a design direction',
            description: 'Review these design options before the agency starts copy and build work.',
            requestedByAgentId: 'design',
            payload: { workflowRunId: run.id, designOptions: this.createDesignOptions(project.structuredBrief.businessSummary, design) }
          }) };
        await this.projectMemory.update(project.id, { status: 'awaiting_approval' });
        await this.workflowRuntime.patch(run.id, {
          status: 'waiting_for_user',
          currentStep: 'design_options_approval',
          state: { ...state, plan, design, designOptions: designGate.directions, approvalId: designGate.approval.id }
        });
        return;
      }

      await this.projectMemory.update(project.id, { status: 'copy' });
      await this.workflowRuntime.emit(run, 'copy.started', {});
      const copy = await this.agentRuntime.execute('copy', { structuredBrief: project.structuredBrief, designDirection: design.direction }, { projectId: project.id, workflowRunId: run.id }) as { copy: string };
      await this.saveArtifact(project.id, 'copy', 'Website copy', copy, 'copy');
      await this.completeCompanyTask(project.id, 'copy', { copy });
      await this.workflowRuntime.emit(run, 'copy.completed', copy);

      let qaPassed = false;
      let qaResult: { passed: boolean; issues: string[]; summary: string } | undefined;
      for (let attempt = 1; attempt <= 2 && !qaPassed; attempt += 1) {
        await this.projectMemory.update(project.id, { status: 'build' });
        await this.workflowRuntime.emit(run, 'build.started', { attempt });
        const codingTask = await this.claimCompanyTask(project.id, 'coding', 'builder');
        const codexRun = this.companyOS
          ? await this.companyOS.codex.run({
            projectId: project.id,
            repoPath: this.companyOS.config.defaultRepoPath,
            taskTitle: `Build website preview attempt ${attempt}`,
            taskPrompt: `Implement the approved website using the design handoff when present.\n\nPlan: ${plan.summary}\n\nDesign: ${design.direction}\n\nCopy: ${copy.copy}`,
            agentId: 'builder'
          })
          : undefined;
        if (this.companyOS && codexRun) {
          await this.companyOS.githubBranches.create({
            projectId: project.id,
            repo: 'my-virtual-office-nodejs',
            branchName: codexRun.task.branchName,
            baseBranch: this.companyOS.config.defaultBaseBranch,
            createdByAgentId: 'builder'
          });
          await this.companyOS.githubPullRequests.create({
            projectId: project.id,
            repo: 'my-virtual-office-nodejs',
            branchName: codexRun.task.branchName,
            title: codexRun.task.taskTitle,
            body: codexRun.result.summary,
            createdByAgentId: 'builder'
          });
          if (codingTask) await this.companyOS.taskBoard.completeTask(codingTask.id, { codexTaskId: codexRun.task.id, result: codexRun.result });
        }
        const build = await this.agentRuntime.execute('builder', { plan: plan.summary, design: design.direction, copy: copy.copy }, { projectId: project.id, workflowRunId: run.id }) as { files: unknown[]; summary: string };
        await this.saveArtifact(project.id, 'code', `Build attempt ${attempt}`, build, 'builder');
        await this.workflowRuntime.emit(run, 'build.completed', build);

        await this.projectMemory.update(project.id, { status: 'qa' });
        await this.workflowRuntime.emit(run, 'qa.started', { attempt });
        qaResult = await this.agentRuntime.execute('qa', { previewSummary: build.summary, attempt }, { projectId: project.id, workflowRunId: run.id }) as { passed: boolean; issues: string[]; summary: string };
        await this.saveArtifact(project.id, 'qa_report', `QA attempt ${attempt}`, qaResult, 'qa');
        qaPassed = qaResult.passed;
        if (qaPassed) {
          await this.completeCompanyTask(project.id, 'qa', qaResult as unknown as Record<string, unknown>);
        } else if (this.companyOS) {
          await this.companyOS.taskBoard.createTask({
            projectId: project.id,
            title: `Fix QA issues from attempt ${attempt}`,
            description: qaResult.issues.join('\n') || qaResult.summary,
            type: 'coding',
            priority: 'high',
            assignedAgentId: 'builder',
            createdByAgentId: 'qa',
            input: { qaResult }
          });
        }
        await this.workflowRuntime.emit(run, qaPassed ? 'qa.passed' : 'qa.failed', qaResult);
      }
      if (!qaPassed) throw new Error('QA failed after maximum retry count');

      await this.projectMemory.update(project.id, { status: 'preview' });
      const delivery = await this.agentRuntime.execute('delivery', { projectId: project.id, qaSummary: qaResult?.summary || '' }, { projectId: project.id, workflowRunId: run.id }) as { previewUrl: string; summary: string };
      await this.saveArtifact(project.id, 'preview', 'Preview build', delivery, 'delivery', delivery.previewUrl);
      if (this.designWorkflow) await this.designWorkflow.postBuildReview(project.id, delivery.previewUrl);
      await this.projectMemory.update(project.id, { previewUrl: delivery.previewUrl, status: 'awaiting_approval' });
      await this.completeCompanyTask(project.id, 'preview', delivery as unknown as Record<string, unknown>);
      if (this.companyOS) {
        await this.companyOS.notifications.notify({
          projectId: project.id,
          type: 'preview_ready',
          title: 'Preview ready for approval',
          message: 'The delivery agent created a preview and requested approval.'
        });
      }
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

  private async createTaskPlan(projectId: string, workflowRunId: string, plannedTasks: string[]) {
    if (!this.companyOS) return;
    const existing = await this.companyOS.taskBoard.listTasks(projectId);
    if (existing.some(task => task.type === 'coding')) return;
    const templates = [
      { type: 'planning' as const, title: 'Create project plan', agent: 'planner' },
      { type: 'design' as const, title: 'Create design direction', agent: 'design' },
      { type: 'copy' as const, title: 'Write website copy', agent: 'copy' },
      { type: 'coding' as const, title: 'Implement website preview with Codex', agent: 'builder' },
      { type: 'qa' as const, title: 'Review build, PR, screenshots, and content', agent: 'qa' },
      { type: 'preview' as const, title: 'Create client preview', agent: 'delivery' },
      { type: 'deployment' as const, title: 'Prepare live deployment approval', agent: 'delivery', approvalRequired: true },
      { type: 'email' as const, title: 'Draft client completion email', agent: 'client-success', approvalRequired: true }
    ];
    for (const template of templates) {
      await this.companyOS.taskBoard.createTask({
        projectId,
        title: template.title,
        description: plannedTasks.join('\n') || template.title,
        type: template.type,
        assignedAgentId: template.agent,
        createdByAgentId: 'planner',
        input: { workflowRunId },
        approvalRequired: Boolean(template.approvalRequired)
      });
    }
  }

  private async claimCompanyTask(projectId: string, type: 'coding' | 'qa' | 'design' | 'copy' | 'preview', agentId: string) {
    if (!this.companyOS) return undefined;
    const task = (await this.companyOS.taskBoard.listTasks(projectId)).find(item => item.type === type && item.status !== 'done');
    if (!task) return undefined;
    return this.companyOS.taskBoard.claimTask(task.id, agentId);
  }

  private async completeCompanyTask(projectId: string, type: 'design' | 'copy' | 'qa' | 'preview', output: Record<string, unknown>) {
    if (!this.companyOS) return;
    const task = (await this.companyOS.taskBoard.listTasks(projectId)).find(item => item.type === type && item.status !== 'done');
    if (task) await this.companyOS.taskBoard.completeTask(task.id, output);
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

  private createDesignOptions(businessSummary: string, design: { direction: string; sections: string[] }) {
    return [
      {
        id: 'trust-first',
        name: 'Trust First',
        summary: 'A calm, credibility-led direction with clear service proof and direct lead capture.',
        palette: ['deep navy', 'white', 'soft blue', 'success green'],
        bestFor: 'Service businesses that need confidence and clarity quickly.',
        sections: design.sections
      },
      {
        id: 'premium-editorial',
        name: 'Premium Editorial',
        summary: 'A more spacious, polished layout with stronger storytelling and case-study style sections.',
        palette: ['charcoal', 'warm white', 'muted gold', 'slate'],
        bestFor: 'Brands that want to feel established, premium, and selective.',
        sections: ['Hero story', ...design.sections.filter(section => section !== 'Hero')]
      },
      {
        id: 'conversion-studio',
        name: 'Conversion Studio',
        summary: 'A sharper sales-led layout focused on offer clarity, benefits, proof, and booking/contact actions.',
        palette: ['graphite', 'white', 'electric blue', 'coral accent'],
        bestFor: 'Projects where leads and measurable conversion matter most.',
        sections: ['Hero offer', 'Benefits', 'Services', 'Proof', 'Process', 'Contact']
      }
    ].map(option => ({ ...option, businessFit: businessSummary.slice(0, 140) }));
  }

  private async saveArtifact(projectId: string, type: 'plan' | 'design' | 'design_options' | 'copy' | 'code' | 'qa_report' | 'preview', title: string, metadata: Record<string, unknown>, createdByAgentId: string, url?: string) {
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
