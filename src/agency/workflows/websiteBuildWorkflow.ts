import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { ProjectMemory } from '../memory/projectMemory.js';
import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';
import { ApprovalService } from '../approvals/approvalService.js';
import type { CompanyOS } from '../company/companyOS.js';
import type { DesignWorkflow } from './designWorkflow.js';
import type { DesignHandoff } from '../schemas/designHandoff.schema.js';
import type { ImplementationPlan } from '../schemas/implementationPlan.schema.js';
import type { Project } from '../schemas/project.schema.js';
import type { CreativeDirection } from '../schemas/creativeDirection.schema.js';
import { projectStatusRank, workflowPhaseForStep, workflowPhaseRank } from '../runtime/workflowStage.js';

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

  async start(projectId: string, options: { testMode?: boolean } = {}): Promise<{ workflowRunId: string }> {
    const project = await this.projectMemory.get(projectId);
    if (!project?.structuredBrief) throw new Error(`Project missing structured brief: ${projectId}`);
    const run = await this.workflowRuntime.create('websiteBuildWorkflow', { projectId, qaAttempt: 0, testMode: options.testMode === true }, projectId);
    await this.projectMemory.update(projectId, { currentWorkflowRunId: run.id, status: 'planning' });
    return { workflowRunId: run.id };
  }

  async runUntilPreview(workflowRunId: string): Promise<void> {
    const leaseOwner = createId('worker');
    if (!await this.workflowRuntime.acquireLease(workflowRunId, leaseOwner)) return;
    const run = await this.workflowRuntime.get(workflowRunId);
    if (!run?.projectId) {
      await this.workflowRuntime.releaseLease(workflowRunId, leaseOwner).catch(() => undefined);
      throw new Error(`Workflow run missing project: ${workflowRunId}`);
    }
    const project = await this.projectMemory.get(run.projectId);
    if (!project?.structuredBrief) {
      await this.workflowRuntime.releaseLease(workflowRunId, leaseOwner).catch(() => undefined);
      throw new Error(`Project missing structured brief: ${run.projectId}`);
    }
    const stopLeaseHeartbeat = this.workflowRuntime.startLeaseHeartbeat(workflowRunId, leaseOwner);
    try {
      if (await this.stopIfPreviewExists(run.id, project.id)) return;
      let latestRun = await this.workflowRuntime.get(workflowRunId);
      let state: Record<string, unknown> = await this.recoverWorkflowState(project.id, latestRun?.state || run.state);

      let plan = state.plan as { tasks: string[]; summary: string } | undefined;
      if (!plan) {
        await this.checkpoint(run.id, 'planning', {}, 'running', leaseOwner);
        await this.moveProjectToStage(run.id, project.id, 'planning');
        plan = await this.agentRuntime.execute('planner', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { tasks: string[]; summary: string };
        await this.saveArtifact(project.id, 'plan', 'Project plan', plan, 'planner');
        await this.createTaskPlan(project.id, run.id, plan.tasks);
        await this.workflowRuntime.emit(run, 'plan.created', plan);
        latestRun = await this.checkpoint(run.id, 'planning', { plan, planCompleted: true }, 'running', leaseOwner);
        state = latestRun.state;
      }

      let design = state.design as { direction: string; sections: string[] } | undefined;
      if (!design) {
        if (!await this.moveProjectToStage(run.id, project.id, 'design')) return;
        await this.checkpoint(run.id, 'design_discovery', {}, 'running', leaseOwner);
        await this.workflowRuntime.emit(run, 'design.started', {});
        design = await this.agentRuntime.execute('design', { structuredBrief: project.structuredBrief }, { projectId: project.id, workflowRunId: run.id }) as { direction: string; sections: string[] };
        await this.saveArtifact(project.id, 'design', 'Design direction', design, 'design');
        await this.completeCompanyTask(project.id, 'design', { design });
        await this.workflowRuntime.emit(run, 'design.completed', design);
        latestRun = await this.checkpoint(run.id, 'design_discovery', { design, designDiscoveryCompleted: true }, 'running', leaseOwner);
        state = latestRun.state;
      }

      let designEvidence = await this.getDesignEvidence(project.id, state);
      if (!state.designOptionsApproved && !designEvidence.approved) {
        if (designEvidence.pendingApproval && designEvidence.directions.length) {
          await this.projectMemory.update(project.id, { status: 'awaiting_approval' });
          await this.checkpoint(run.id, 'design_options_approval', {
            plan,
            design,
            designOptions: designEvidence.directions,
            approvalId: designEvidence.pendingApproval.id
          }, 'waiting_for_user', leaseOwner);
          return;
        }
        const data = await this.store.read();
        const customer = data.customers.find(item => item.id === project.customerId);
        if (!customer) throw new Error(`Customer not found for project ${project.id}`);
        const designGate = designEvidence.directions.length
          ? {
              directions: designEvidence.directions,
              approval: await this.approvalService.request({
                projectId: project.id,
                type: 'design_options',
                title: 'Choose a creative direction',
                description: 'Review the agency-grade creative directions before production design and build handoff.',
                requestedByAgentId: 'design',
                payload: { workflowRunId: run.id, designOptions: designEvidence.directions }
              })
            }
          : this.designWorkflow
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
        await this.checkpoint(run.id, 'design_options_approval', {
          plan,
          design,
          designOptions: designGate.directions,
          approvalId: designGate.approval.id
        }, 'waiting_for_user', leaseOwner);
        return;
      }

      let selectedDesignOption = designEvidence.selectedDirection;
      if (!selectedDesignOption) throw new Error('The approved creative direction could not be recovered');
      await this.checkpoint(run.id, 'design_options_approved', {
        plan,
        design,
        designOptionsApproved: true,
        selectedDesignOption
      }, 'running', leaseOwner);

      let designHandoff = designEvidence.handoff;
      if (!designHandoff) {
        if (!this.designWorkflow) throw new Error('Design workflow is unavailable for builder handoff');
        if (!await this.moveProjectToStage(run.id, project.id, 'design')) return;
        await this.checkpoint(run.id, 'design_production', { selectedDesignOption }, 'running', leaseOwner);
        await this.designWorkflow.completeAfterApproval(
          project.id,
          selectedDesignOption,
          typeof state.approvalId === 'string' ? state.approvalId : designEvidence.approvedApproval?.id,
          run.id,
          leaseOwner,
          state.testMode === true
        );
        designHandoff = await this.getDesignHandoff(project.id);
        if (!designHandoff) throw new Error('Design production finished without creating a builder handoff');
      }
      latestRun = await this.checkpoint(run.id, 'design_handoff_ready', {
        designOptionsApproved: true,
        designHandoffCompleted: true,
        selectedDesignOption
      }, 'running', leaseOwner);
      state = latestRun.state;

      const implementationPlan = this.companyOS
        ? await this.companyOS.developerPlanning.createImplementationPlan(project, designHandoff, run.id)
        : undefined;

      let copy = state.copy as { copy: string } | undefined;
      if (!copy) {
        if (!await this.moveProjectToStage(run.id, project.id, 'copy')) return;
        await this.checkpoint(run.id, 'copy', {}, 'running', leaseOwner);
        await this.workflowRuntime.emit(run, 'copy.started', {});
        copy = await this.agentRuntime.execute('copy', { structuredBrief: project.structuredBrief, designDirection: design.direction }, { projectId: project.id, workflowRunId: run.id }) as { copy: string };
        await this.saveArtifact(project.id, 'copy', 'Website copy', copy, 'copy');
        await this.completeCompanyTask(project.id, 'copy', { copy });
        await this.workflowRuntime.emit(run, 'copy.completed', copy);
        latestRun = await this.checkpoint(run.id, 'copy', { copy, copyCompleted: true }, 'running', leaseOwner);
        state = latestRun.state;
      }

      let qaPassed = state.qaPassed === true;
      let qaResult = state.qaResult as { passed: boolean; issues: string[]; summary: string } | undefined;
      const completedQaAttempts = Number(state.qaAttempt || 0);
      for (let attempt = Math.max(1, completedQaAttempts + 1); attempt <= 2 && !qaPassed; attempt += 1) {
        if (!await this.moveProjectToStage(run.id, project.id, 'build')) return;
        await this.checkpoint(run.id, `build_attempt_${attempt}`, { buildAttempt: attempt }, 'running', leaseOwner);
        await this.workflowRuntime.emit(run, 'build.started', { attempt });
        const codingTask = await this.claimCompanyTask(project.id, 'coding', 'builder');
        const codexRun = this.companyOS
          ? await this.companyOS.codex.run({
            projectId: project.id,
            repoPath: this.companyOS.config.defaultRepoPath,
            taskTitle: `Build website preview attempt ${attempt}`,
            taskMode: attempt === 1 ? 'build_page_from_template' : 'fix_qa_design_issues',
            implementationPlan,
            taskPrompt: this.createCodexBuildPrompt({ plan, design, copy, designHandoff, implementationPlan, attempt }),
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
        await this.checkpoint(run.id, `build_attempt_${attempt}`, { lastBuild: build, buildAttempt: attempt }, 'running', leaseOwner);

        if (!await this.moveProjectToStage(run.id, project.id, 'qa')) return;
        await this.checkpoint(run.id, `qa_attempt_${attempt}`, { qaAttempt: attempt }, 'running', leaseOwner);
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
        latestRun = await this.checkpoint(run.id, `qa_attempt_${attempt}`, { qaAttempt: attempt, qaResult, qaPassed }, 'running', leaseOwner);
        state = latestRun.state;
      }
      if (!qaPassed) throw new Error('QA failed after maximum retry count');

      if (!await this.moveProjectToStage(run.id, project.id, 'preview')) return;
      await this.checkpoint(run.id, 'preview', {}, 'running', leaseOwner);
      const delivery = await this.agentRuntime.execute('delivery', { projectId: project.id, qaSummary: qaResult?.summary || '' }, { projectId: project.id, workflowRunId: run.id }) as { previewUrl: string; summary: string };
      await this.saveArtifact(project.id, 'preview', 'Preview build', delivery, 'delivery', delivery.previewUrl);
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
      await this.checkpoint(run.id, 'preview_approval', { approvalId: approval.id, previewUrl: delivery.previewUrl }, 'waiting_for_user', leaseOwner);
      await this.workflowRuntime.emit(run, 'preview.created', delivery);
      await this.workflowRuntime.emit(run, 'approval.requested', { approval });
      if (this.designWorkflow) {
        await this.designWorkflow.postBuildReview(project.id, delivery.previewUrl).catch(error => {
          console.error(`[websiteBuildWorkflow] post-build design review failed: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    } catch (error) {
      if (await this.stopIfPreviewExists(run.id, run.projectId).catch(() => false)) return;
      const message = error instanceof Error ? error.message : String(error);
      await Promise.allSettled([
        this.projectMemory.update(run.projectId, { status: 'failed' }),
        this.workflowRuntime.patch(run.id, {
          status: 'failed',
          error: message,
          currentStep: 'failed'
        }),
        this.workflowRuntime.emit(run, 'workflow.failed', { error: message })
      ]);
    } finally {
      await stopLeaseHeartbeat().catch(() => undefined);
      await this.workflowRuntime.releaseLease(workflowRunId, leaseOwner).catch(() => undefined);
    }
  }

  private async checkpoint(
    workflowRunId: string,
    targetStep: string,
    statePatch: Record<string, unknown>,
    status: 'running' | 'waiting_for_user',
    leaseOwner: string
  ) {
    if (!await this.workflowRuntime.renewLease(workflowRunId, leaseOwner)) {
      throw new Error(`Workflow execution lease lost: ${workflowRunId}`);
    }
    const current = await this.workflowRuntime.get(workflowRunId);
    if (!current) throw new Error(`Workflow run not found: ${workflowRunId}`);
    const currentRank = workflowPhaseRank(workflowPhaseForStep(current.currentStep));
    const targetRank = workflowPhaseRank(workflowPhaseForStep(targetStep));
    const advances = targetRank >= currentRank || current.status === 'failed' || current.status === 'paused';
    const result = await this.workflowRuntime.patch(workflowRunId, {
      status: advances ? status : current.status,
      currentStep: advances ? targetStep : current.currentStep,
      error: advances ? undefined : current.error,
      state: {
        ...current.state,
        ...statePatch,
        lastCheckpoint: advances ? targetStep : current.currentStep,
        lastCheckpointAt: nowIso()
      }
    });
    if (!await this.workflowRuntime.renewLease(workflowRunId, leaseOwner)) {
      throw new Error(`Workflow execution lease lost: ${workflowRunId}`);
    }
    return result;
  }

  private async recoverWorkflowState(projectId: string, state: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data = await this.store.read();
    const latestArtifact = (type: string) => data.artifacts
      .filter(item => item.projectId === projectId && item.type === type)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .at(-1);
    const qaArtifact = latestArtifact('qa_report');
    const selectedRecord = data.design.selectedDirections.filter(item => item.projectId === projectId).at(-1);
    const selectedDirection = selectedRecord
      ? data.design.creativeDirections.find(item => item.projectId === projectId && item.id === selectedRecord.selectedDirectionId)
      : undefined;
    const approvedDesign = data.approvals.some(item => item.projectId === projectId && item.type === 'design_options' && item.status === 'approved');
    return {
      ...state,
      plan: state.plan || latestArtifact('plan')?.metadata,
      design: state.design || latestArtifact('design')?.metadata,
      copy: state.copy || latestArtifact('copy')?.metadata,
      qaResult: state.qaResult || qaArtifact?.metadata,
      qaPassed: state.qaPassed === true || qaArtifact?.metadata?.passed === true,
      designOptionsApproved: state.designOptionsApproved === true || approvedDesign || Boolean(selectedDirection),
      selectedDesignOption: state.selectedDesignOption || selectedDirection
    };
  }

  private async getDesignEvidence(projectId: string, state: Record<string, unknown>) {
    const data = await this.store.read();
    const directions = data.design.creativeDirections.filter(item => item.projectId === projectId);
    const selectedRecord = data.design.selectedDirections.filter(item => item.projectId === projectId).at(-1);
    const pendingApproval = data.approvals
      .filter(item => item.projectId === projectId && item.type === 'design_options' && item.status === 'pending')
      .at(-1);
    const approvedApproval = data.approvals
      .filter(item => item.projectId === projectId && item.type === 'design_options' && item.status === 'approved')
      .at(-1);
    const resolution = approvedApproval?.payload?.resolution as Record<string, unknown> | undefined;
    const selectedDirection = state.selectedDesignOption as CreativeDirection | undefined
      || (selectedRecord ? directions.find(item => item.id === selectedRecord.selectedDirectionId) : undefined)
      || resolution?.selectedDesignOption as CreativeDirection | undefined;
    const handoff = data.design.handoffs.filter(item => item.projectId === projectId).at(-1);
    return {
      directions,
      pendingApproval,
      approvedApproval,
      selectedDirection,
      handoff,
      approved: state.designOptionsApproved === true || Boolean(approvedApproval || selectedRecord || handoff)
    };
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

  private async moveProjectToStage(workflowRunId: string, projectId: string, status: Project['status']) {
    if (await this.stopIfPreviewExists(workflowRunId, projectId)) return false;
    const current = await this.projectMemory.get(projectId);
    if (current && projectStatusRank(current.status) > projectStatusRank(status)) return true;
    await this.projectMemory.update(projectId, { status });
    return true;
  }

  private async stopIfPreviewExists(workflowRunId: string, projectId: string) {
    const current = await this.projectMemory.get(projectId);
    if (!current?.previewUrl) return false;
    await this.projectMemory.update(projectId, { status: 'awaiting_approval' });
    await this.workflowRuntime.patch(workflowRunId, {
      status: 'waiting_for_user',
      currentStep: 'preview_approval',
      state: {
        ...(await this.workflowRuntime.get(workflowRunId))?.state,
        previewUrl: current.previewUrl
      }
    });
    return true;
  }

  private async getDesignHandoff(projectId: string): Promise<DesignHandoff | undefined> {
    const data = await this.store.read();
    return data.design.handoffs.filter(item => item.projectId === projectId).at(-1);
  }

  private async getSelectedDirection(projectId: string) {
    const data = await this.store.read();
    const selected = data.design.selectedDirections.filter(item => item.projectId === projectId).at(-1);
    return selected
      ? data.design.creativeDirections.find(item => item.projectId === projectId && item.id === selected.selectedDirectionId)
      : undefined;
  }

  private createCodexBuildPrompt(input: {
    plan: { tasks: string[]; summary: string };
    design: { direction: string; sections: string[] };
    copy: { copy: string };
    designHandoff?: DesignHandoff;
    implementationPlan?: ImplementationPlan;
    attempt: number;
  }) {
    const { plan, design, copy, designHandoff, implementationPlan, attempt } = input;
    return [
      `Implementation attempt: ${attempt}.`,
      'Build the approved website from reusable components and sections.',
      'Start by inspecting package.json, existing UI/component folders, design-system folders, templates, and section components.',
      implementationPlan ? `Use template: ${implementationPlan.templateSelected}. Reason: ${implementationPlan.templateReason}` : 'No implementation plan was available; inspect first and choose the smallest reusable strategy.',
      implementationPlan ? `Components to create: ${implementationPlan.componentsToCreate.join(', ')}` : '',
      implementationPlan ? `Sections to create: ${implementationPlan.sectionsToCreate.join(', ')}` : '',
      designHandoff ? `Designer handoff summary: ${designHandoff.handoffSummary}` : 'Designer handoff missing; use approved design direction and structured brief conservatively.',
      designHandoff ? `Design tokens: ${JSON.stringify(designHandoff.designTokens.exportedTailwindTheme || designHandoff.designTokens.exportedCssVariables || {})}` : '',
      designHandoff ? `Accessibility requirements: ${designHandoff.accessibilityRequirements.join('; ')}` : '',
      designHandoff ? `Implementation notes: ${designHandoff.implementationNotes.join('; ')}` : '',
      `Project plan: ${plan.summary}`,
      `Design direction: ${design.direction}`,
      `Copy: ${copy.copy}`,
      'Do not deploy live. Do not merge to main. Do not install a component library without approval.'
    ].filter(Boolean).join('\n\n');
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
    const selectedDesignOption = await this.getSelectedDirection(projectId);
    const designHandoff = await this.getDesignHandoff(projectId);
    const run = await this.workflowRuntime.create('websiteBuildWorkflow', {
      projectId,
      feedback,
      changeRequest: true,
      designOptionsApproved: Boolean(selectedDesignOption || designHandoff),
      selectedDesignOption
    }, projectId);
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
      const existingArtifact = data.artifacts
        .filter(item => item.projectId === projectId && item.type === type && item.title === title)
        .at(-1);
      data.artifacts = data.artifacts.filter(item => !(item.projectId === projectId && item.type === type && item.title === title));
      data.artifacts.push({
        id: existingArtifact?.id || createId('artifact'),
        projectId,
        type,
        title,
        url,
        metadata,
        createdByAgentId,
        createdAt: existingArtifact?.createdAt || nowIso()
      });
      const existingTask = data.tasks
        .filter(item => item.projectId === projectId && item.agentId === createdByAgentId && item.title === title)
        .at(-1);
      data.tasks = data.tasks.filter(item => !(item.projectId === projectId && item.agentId === createdByAgentId && item.title === title));
      data.tasks.push({
        id: existingTask?.id || createId('task'),
        projectId,
        agentId: createdByAgentId,
        title,
        description: `${createdByAgentId} completed ${title}`,
        status: 'completed',
        input: {},
        output: metadata,
        createdAt: existingTask?.createdAt || nowIso(),
        updatedAt: nowIso()
      });
    });
  }
}
