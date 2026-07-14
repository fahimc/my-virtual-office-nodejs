import express, { type Request, type Response, type Router } from 'express';
import type { CreateAgencySystemOptions } from '../createAgencySystem.js';
import type { ApprovalRequest } from '../schemas/approval.schema.js';
import type { CreativeDirection } from '../schemas/creativeDirection.schema.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
import type { Project } from '../schemas/project.schema.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';
import { nowIso } from '../memory/memoryStore.js';
import { getAgencySystem } from './agencySystemSingleton.js';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

export function createAgencyRouter(options: CreateAgencySystemOptions): Router {
  const router = express.Router();
  const system = getAgencySystem(options);

  const route = (handler: AsyncHandler) => async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const queueWebsiteBuild = async (workflowRunId: string) => {
    await system.jobQueue.enqueue('websiteBuildWorkflow.runUntilPreview', { workflowRunId }, payload =>
      system.websiteBuildWorkflow.runUntilPreview(payload.workflowRunId)
    );
  };

  const ensureCanonicalWorkflow = async (projectId: string, requestedWorkflowId?: string) => {
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === projectId);
    if (!project) return undefined;
    const candidates = data.workflows
      .filter(item => item.projectId === projectId && item.workflowName === 'websiteBuildWorkflow')
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    let workflow: WorkflowRun | undefined = candidates.find(item => item.id === requestedWorkflowId)
      || candidates.find(item => item.id === project.currentWorkflowRunId)
      || candidates[0];
    if (!workflow && project.structuredBrief) {
      const created = await system.websiteBuildWorkflow.start(projectId);
      workflow = await system.workflowRuntime.get(created.workflowRunId);
    }
    if (workflow && project.currentWorkflowRunId !== workflow.id) {
      await system.projectMemory.update(projectId, { currentWorkflowRunId: workflow.id });
    }
    return workflow;
  };

  const upsertProjectSnapshot = async (snapshot: unknown): Promise<Project | undefined> => {
    if (!snapshot || typeof snapshot !== 'object') return undefined;
    const project = snapshot as Partial<Project>;
    if (!project.id || !project.customerId || !project.title || !project.originalBrief) return undefined;
    const timestamp = nowIso();
    const recovered: Project = {
      id: project.id,
      customerId: project.customerId,
      status: project.status || 'awaiting_approval',
      title: project.title,
      originalBrief: project.originalBrief,
      structuredBrief: project.structuredBrief,
      currentWorkflowRunId: project.currentWorkflowRunId,
      previewUrl: project.previewUrl,
      liveUrl: project.liveUrl,
      createdAt: project.createdAt || timestamp,
      updatedAt: timestamp
    };
    await system.store.update(data => {
      const existing = data.projects.find(item => item.id === recovered.id);
      if (existing) Object.assign(existing, recovered);
      else data.projects.push(recovered);
    });
    return recovered;
  };

  const recoverApprovedDesignApproval = async (req: Request): Promise<ApprovalRequest> => {
    const selectedDesignOption = normalizeDesignOption(req.body.selectedDesignOption);
    const project = await upsertProjectSnapshot(req.body.project);
    const approvalSnapshot = req.body.approval && typeof req.body.approval === 'object'
      ? req.body.approval as Partial<ApprovalRequest>
      : undefined;
    const workflowRunId = String(req.body.workflowRunId || approvalSnapshot?.payload?.workflowRunId || '');
    const data = await system.store.read();
    const workflow = workflowRunId
      ? data.workflows.find(item => item.id === workflowRunId)
      : undefined;
    const projectId = String(req.body.projectId || approvalSnapshot?.projectId || project?.id || selectedDesignOption?.projectId || workflow?.projectId || '');
    if (!projectId || !selectedDesignOption) throw new Error(`Approval not found: ${req.params.id}`);
    const workflowForProject = workflow || data.workflows.find(item =>
      item.projectId === projectId &&
      item.workflowName === 'websiteBuildWorkflow' &&
      item.currentStep === 'design_options_approval'
    );
    const workflowDesignOptions = Array.isArray(workflowForProject?.state?.designOptions)
      ? workflowForProject.state.designOptions
      : [];
    const timestamp = nowIso();
    const approval: ApprovalRequest = {
      id: req.params.id,
      projectId,
      type: 'design_options',
      title: approvalSnapshot?.title || 'Choose a creative direction',
      description: approvalSnapshot?.description || 'Recovered design direction approval.',
      status: 'approved',
      requestedByAgentId: approvalSnapshot?.requestedByAgentId || 'design',
      riskLevel: approvalSnapshot?.riskLevel || 'low',
      payload: {
        ...(approvalSnapshot?.payload || {}),
        workflowRunId: workflowRunId || workflowForProject?.id,
        designOptions: Array.isArray(approvalSnapshot?.payload?.designOptions)
          ? approvalSnapshot.payload.designOptions.map(option => normalizeDesignOption(option, projectId))
          : workflowDesignOptions.length
            ? workflowDesignOptions.map(option => normalizeDesignOption(option, projectId))
            : [normalizeDesignOption(selectedDesignOption, projectId)],
        resolution: { recovered: true, resolvedBy: 'user', selectedDesignOption }
      },
      createdAt: approvalSnapshot?.createdAt || timestamp,
      resolvedAt: timestamp,
      resolvedBy: 'user',
      decisionReason: 'Recovered approval from client state after a stateless serverless request.'
    };
    await system.store.update(data => {
      const existing = data.approvals.find(item => item.id === approval.id);
      if (existing) Object.assign(existing, approval);
      else data.approvals.push(approval);
    });
    return approval;
  };

  const normalizeDesignOption = (input: unknown, projectId = 'project-design-recovery'): CreativeDirection | undefined => {
    if (!input || typeof input !== 'object') return undefined;
    const option = input as Partial<CreativeDirection>;
    const id = String(option.id || 'trust-first');
    const name = String(option.name || id.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()));
    const summary = String(option.summary || 'A polished, client-ready website direction with clear hierarchy and conversion-focused sections.');
    const paletteSource = Array.isArray(option.palette) && option.palette.length
      ? option.palette
      : [
        { name: 'Ink', hex: '#172033', usage: 'Headings' },
        { name: 'Canvas', hex: '#FFFFFF', usage: 'Background' },
        { name: 'Action Blue', hex: '#2563EB', usage: 'CTA' },
        { name: 'Accent', hex: '#C8A24A', usage: 'Highlights' }
      ];
    return {
      id,
      projectId: option.projectId || projectId,
      name,
      summary,
      targetEmotion: option.targetEmotion || 'Confidence',
      brandPersonality: option.brandPersonality || ['professional', 'clear', 'polished'],
      bestFor: option.bestFor || 'Client-facing website projects',
      risks: option.risks || [],
      palette: paletteSource.map((color, index) => ({
        name: color.name || `Colour ${index + 1}`,
        hex: color.hex || '#172033',
        usage: color.usage || (index === 0 ? 'Headings' : index === 1 ? 'Background' : index === 2 ? 'CTA' : 'Accent')
      })),
      typography: option.typography || { heading: 'Inter Tight or refined display', body: 'Inter/system-ui', scale: '1.25 modular scale', notes: 'Clear hierarchy and readable body copy' },
      layoutStyle: option.layoutStyle || 'Responsive agency landing page with strong hero and proof sections',
      sectionStyle: option.sectionStyle || 'Reusable content bands with polished spacing',
      buttonStyle: option.buttonStyle || 'High-contrast rounded CTA buttons',
      cardStyle: option.cardStyle || 'Bordered cards with restrained shadow',
      iconStyle: option.iconStyle || 'Simple line icons where useful',
      imageryStyle: option.imageryStyle || 'High-quality client-relevant photography or generated imagery',
      animationStyle: option.animationStyle || 'Subtle reveal and hover transitions',
      homepageStructure: option.homepageStructure || ['Hero', 'Services', 'Proof', 'Process', 'FAQ', 'Contact'],
      mobileApproach: option.mobileApproach || 'Single-column sections, clear CTA, no horizontal scrolling',
      rationale: option.rationale || 'This direction balances brand clarity, trust, and conversion readiness.'
    };
  };

  const reconcileApprovedDesignGates = async (projectId?: string) => {
    if (!projectId) return;
    const timestamp = nowIso();
    await system.store.update(data => {
      const designWasApproved =
        data.approvals.some(item => item.projectId === projectId && item.type === 'design_options' && item.status === 'approved') ||
        data.workflows.some(item => item.projectId === projectId && Boolean(item.state?.designOptionsApproved)) ||
        data.design.selectedDirections.some(item => item.projectId === projectId);
      if (!designWasApproved) return;
      data.approvals
        .filter(item => item.projectId === projectId && item.type === 'design_options' && item.status === 'pending')
        .forEach(item => {
          item.status = 'approved';
          item.resolvedAt = item.resolvedAt || timestamp;
          item.resolvedBy = item.resolvedBy || 'system';
          item.decisionReason = item.decisionReason || 'Closed duplicate design approval after direction was already approved.';
          item.payload = {
            ...item.payload,
            resolution: {
              ...(item.payload?.resolution || {}),
              duplicateClosed: true
            }
          };
      });
    });
  };

  const continueApprovedDesignWorkflow = async (workflowId: string) => {
    let workflow = await system.workflowRuntime.get(workflowId);
    if (!workflow?.projectId || workflow.workflowName !== 'websiteBuildWorkflow') {
      return workflow;
    }
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === workflow?.projectId);
    if (!project || project.previewUrl) {
      return workflow;
    }
    const approvedGate = data.approvals
      .filter(item => item.projectId === workflow?.projectId && item.type === 'design_options' && item.status === 'approved')
      .at(-1);
    const resolution = approvedGate?.payload?.resolution as Record<string, unknown> | undefined;
    const selectedRecord = data.design.selectedDirections.filter(item => item.projectId === workflow?.projectId).at(-1);
    const selectedFromMemory = selectedRecord
      ? data.design.creativeDirections.find(item => item.projectId === workflow?.projectId && item.id === selectedRecord.selectedDirectionId)
      : undefined;
    const selectedDesignOption = normalizeDesignOption(
      workflow.state.selectedDesignOption || resolution?.selectedDesignOption || selectedFromMemory,
      workflow.projectId
    );
    const approved = Boolean(workflow.state.designOptionsApproved || approvedGate || selectedRecord);
    if (approved && selectedDesignOption && workflow.currentStep === 'design_options_approval') {
      await system.workflowRuntime.patch(workflow.id, {
        status: 'running',
        currentStep: 'design_options_approved',
        state: {
          ...workflow.state,
          designOptionsApproved: true,
          selectedDesignOption,
          approvalId: workflow.state.approvalId || approvedGate?.id,
          lastCheckpoint: 'design_options_approved',
          lastCheckpointAt: nowIso()
        }
      });
      await system.projectMemory.update(workflow.projectId, { status: 'design' });
    }
    workflow = await system.workflowRuntime.get(workflow.id);
    return workflow;
  };

  const resumeStaleBuildWorkflow = async (workflowId: string) => {
    let workflow = await system.workflowRuntime.get(workflowId);
    if (!workflow?.projectId || workflow.workflowName !== 'websiteBuildWorkflow') return workflow;
    if (!shouldResumeBuildStep(workflow.currentStep) || workflow.status !== 'running') return workflow;
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === workflow?.projectId);
    if (!project || project.previewUrl || project.status === 'awaiting_approval' || project.status === 'failed') return workflow;
    const lastResumeAt = typeof workflow.state?.lastBuildResumeAt === 'string' ? Date.parse(workflow.state.lastBuildResumeAt) : 0;
    if (Number.isFinite(lastResumeAt) && Date.now() - lastResumeAt < 20_000) return workflow;
    await system.workflowRuntime.patch(workflow.id, {
      state: {
        ...workflow.state,
        lastBuildResumeAt: nowIso()
      }
    });
    await queueWebsiteBuild(workflow.id);
    workflow = await system.workflowRuntime.get(workflow.id);
    return workflow;
  };

  const shouldResumeBuildStep = (step?: string) => Boolean(step && (
    step === 'created' ||
    step === 'planning' ||
    step === 'design_options_approved' ||
    step === 'design_production' ||
    step === 'direction_selected' ||
    step === 'sitemap' ||
    step === 'wireframes' ||
    step === 'tokens' ||
    step === 'component_spec' ||
    step === 'prototype' ||
    step === 'imagery_generation' ||
    step === 'design_qa' ||
    step === 'brand_guidelines' ||
    step === 'handoff' ||
    step === 'design_handoff_ready' ||
    step === 'copy' ||
    step === 'preview' ||
    /^build_attempt_\d+$/.test(step) ||
    /^qa_attempt_\d+$/.test(step)
  ));

  router.post('/intake/start', route(async (_req, res) => {
    res.json(await system.intakeWorkflow.start());
  }));

  router.post('/customer/lookup', route(async (req, res) => {
    const email = String(req.body.email || '').trim();
    if (!email) return void res.status(400).json({ error: 'email is required' });
    res.json(await system.intakeWorkflow.lookupCustomer(email, Boolean(req.body.returning)));
  }));

  router.post('/customer/create', route(async (req, res) => {
    const customer = await system.intakeWorkflow.createCustomer(req.body);
    res.json({ customer });
  }));

  router.post('/brief/submit', route(async (req, res) => {
    const customerId = String(req.body.customerId || '');
    const originalBrief = String(req.body.originalBrief || '').trim();
    if (!customerId || !originalBrief) return void res.status(400).json({ error: 'customerId and originalBrief are required' });
    res.json(await system.intakeWorkflow.structureBrief(customerId, originalBrief, req.body.workflowRunId, req.body.customer));
  }));

  router.post('/brief/approve', route(async (req, res) => {
    const workflowRunId = String(req.body.workflowRunId || '');
    if (!workflowRunId) return void res.status(400).json({ error: 'workflowRunId is required' });
    const project = await system.intakeWorkflow.approveBrief(workflowRunId, req.body.structuredBrief as StructuredBrief | undefined, {
      customerId: String(req.body.customerId || ''),
      originalBrief: String(req.body.originalBrief || ''),
      customer: req.body.customer
    });
    const build = await system.websiteBuildWorkflow.start(project.id, { testMode: req.body.testMode === true });
    await queueWebsiteBuild(build.workflowRunId);
    res.json({ project, workflowRunId: build.workflowRunId, officeState: await system.officeState(project.id) });
  }));

  router.post('/workflow/start', route(async (req, res) => {
    const projectId = String(req.body.projectId || '');
    if (!projectId) return void res.status(400).json({ error: 'projectId is required' });
    const build = await system.websiteBuildWorkflow.start(projectId, { testMode: req.body.testMode === true });
    await queueWebsiteBuild(build.workflowRunId);
    res.json({ ...build, officeState: await system.officeState(projectId) });
  }));

  router.post('/workflow/resume', route(async (req, res) => {
    const workflowRunId = String(req.body.workflowRunId || '');
    if (!workflowRunId) return void res.status(400).json({ error: 'workflowRunId is required' });
    await system.resumeService.resume(workflowRunId);
    const run = await system.workflowRuntime.get(workflowRunId);
    if (run?.workflowName === 'websiteBuildWorkflow') await queueWebsiteBuild(workflowRunId);
    res.json({ workflow: run, officeState: await system.officeState(run?.projectId) });
  }));

  router.get('/workflow/:id/status', route(async (req, res) => {
    let workflow = await system.workflowRuntime.get(req.params.id);
    const recoveryProjectId = String(req.query.projectId || '');
    if (!workflow && recoveryProjectId) {
      workflow = await ensureCanonicalWorkflow(recoveryProjectId, req.params.id);
    }
    if (!workflow) return void res.status(404).json({ error: 'workflow not found', requestedWorkflowRunId: req.params.id, projectId: recoveryProjectId || undefined });
    if (workflow.projectId && workflow.currentStep === 'design_options_approval') {
      const data = await system.store.read();
      const approvedDesignGate = data.approvals.find(item => item.projectId === workflow?.projectId && item.type === 'design_options' && item.status === 'approved');
      const selectedDesignOption = normalizeDesignOption(
        workflow.state.selectedDesignOption || (approvedDesignGate?.payload?.designOptions as unknown[] | undefined)?.[0],
        workflow.projectId
      );
      if (approvedDesignGate && selectedDesignOption) {
        await system.workflowRuntime.patch(workflow.id, {
          status: 'running',
          currentStep: 'design_options_approved',
          state: {
            ...workflow.state,
            designOptionsApproved: true,
            selectedDesignOption
          }
        });
        await queueWebsiteBuild(workflow.id);
        workflow = await system.workflowRuntime.get(req.params.id);
      }
    }
    if (!workflow) return void res.status(404).json({ error: 'workflow not found' });
    await reconcileApprovedDesignGates(workflow.projectId);
    workflow = await continueApprovedDesignWorkflow(workflow.id) || workflow;
    workflow = await resumeStaleBuildWorkflow(workflow.id) || workflow;
    res.json({ workflow, canonicalWorkflowRunId: workflow.id, officeState: await system.officeState(workflow.projectId) });
  }));

  router.get('/project/:id', route(async (req, res) => {
    const project = await system.projectMemory.get(req.params.id);
    if (!project) return void res.status(404).json({ error: 'project not found' });
    await reconcileApprovedDesignGates(project.id);
    let workflow = await ensureCanonicalWorkflow(project.id, project.currentWorkflowRunId);
    if (workflow) {
      workflow = await continueApprovedDesignWorkflow(workflow.id) || workflow;
      workflow = await resumeStaleBuildWorkflow(workflow.id) || workflow;
    }
    const freshProject = await system.projectMemory.get(project.id) || project;
    res.json({ project: freshProject, workflow, canonicalWorkflowRunId: workflow?.id, officeState: await system.officeState(project.id) });
  }));

  router.get('/project/:id/timeline', route(async (req, res) => {
    const state = await system.officeState(req.params.id);
    res.json({ timeline: state.timeline });
  }));

  router.get('/project/:id/artifacts', route(async (req, res) => {
    const state = await system.officeState(req.params.id);
    res.json({ artifacts: state.artifacts });
  }));

  router.get('/artifact/:id', route(async (req, res) => {
    const data = await system.store.read();
    const artifact = data.artifacts.find(item => item.id === req.params.id);
    if (!artifact) return void res.status(404).send('Artifact not found');
    const safeTitle = escapeHtml(artifact.title);
    const body = escapeHtml(JSON.stringify(artifact.metadata, null, 2));
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; background: #0b1020; color: #f8fafc; font-family: Inter, system-ui, sans-serif; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    p { margin: 0 0 18px; color: #aab8d0; }
    pre { white-space: pre-wrap; overflow: auto; border: 1px solid #334260; border-radius: 8px; background: #10192b; padding: 18px; line-height: 1.45; }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>${escapeHtml(artifact.type)}${artifact.path ? ` - ${escapeHtml(artifact.path)}` : ''}</p>
    <pre>${body}</pre>
  </main>
</body>
</html>`);
  }));

  router.post('/approval/:id/approve', route(async (req, res) => {
    const approvalBeforeResolution = (await system.store.read()).approvals.find(item => item.id === req.params.id);
    const selectedForResolution = normalizeDesignOption(
      req.body.selectedDesignOption || (approvalBeforeResolution?.payload?.designOptions as unknown[] | undefined)?.[0],
      approvalBeforeResolution?.projectId
    );
    let approval: ApprovalRequest;
    try {
      approval = await system.approvalWorkflow.approve(req.params.id, {
        resolvedBy: 'user',
        decisionReason: selectedForResolution ? `Approved creative direction: ${selectedForResolution.name}` : 'Approved by user',
        selectedDesignOption: selectedForResolution
      });
    } catch (error) {
      approval = await recoverApprovedDesignApproval(req);
    }
    let workflowRunIdForClient = '';
    if (approval.type === 'design_options') {
      const workflowRunId = String(approval.payload.workflowRunId || '');
      const selectedDesignOption = selectedForResolution
        || normalizeDesignOption((approval.payload.resolution as Record<string, unknown> | undefined)?.selectedDesignOption, approval.projectId)
        || normalizeDesignOption((approval.payload.designOptions as unknown[] | undefined)?.[0], approval.projectId);
      const run = await ensureCanonicalWorkflow(approval.projectId, workflowRunId);
      workflowRunIdForClient = run?.id || '';
      if (run) {
        await system.workflowRuntime.patch(run.id, {
          status: 'running',
          currentStep: 'design_options_approved',
          state: {
            ...run.state,
            designOptionsApproved: true,
            selectedDesignOption,
            approvalId: approval.id,
            lastCheckpoint: 'design_options_approved',
            lastCheckpointAt: nowIso()
          }
        });
      }
      await system.projectMemory.update(approval.projectId, { status: 'design' });
      if (selectedDesignOption && workflowRunIdForClient) await queueWebsiteBuild(workflowRunIdForClient);
      await reconcileApprovedDesignGates(approval.projectId);
    } else if (approval.type === 'preview') {
      await system.websiteBuildWorkflow.prepareDeployment(approval.projectId);
      const run = (await system.store.read()).workflows.find(item => item.projectId === approval.projectId)?.id;
      if (run) await system.workflowRuntime.emit({ id: run, projectId: approval.projectId, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'approval_approved', state: {}, createdAt: '', updatedAt: '' }, 'approval.approved', { approvalId: approval.id });
    }
    res.json({ approval, workflowRunId: workflowRunIdForClient, canonicalWorkflowRunId: workflowRunIdForClient, officeState: await system.officeState(approval.projectId) });
  }));

  router.post('/approval/:id/request-changes', route(async (req, res) => {
    const feedback = String(req.body.feedback || '').trim();
    if (!feedback) return void res.status(400).json({ error: 'feedback is required' });
    const approval = await system.approvalWorkflow.requestChanges(req.params.id, feedback);
    const build = await system.websiteBuildWorkflow.handleChanges(approval.projectId, feedback);
    await queueWebsiteBuild(build.workflowRunId);
    res.json({ approval, workflowRunId: build.workflowRunId, officeState: await system.officeState(approval.projectId) });
  }));

  router.post('/deployment/approve', route(async (req, res) => {
    const projectId = String(req.body.projectId || '');
    const target = String(req.body.target || 'netlify');
    if (!projectId) return void res.status(400).json({ error: 'projectId is required' });
    const data = await system.store.read();
    const approval = data.approvals.find(item => item.projectId === projectId && item.type === 'deployment' && item.status === 'pending');
    if (!approval) return void res.status(409).json({ error: 'No pending deployment approval found' });
    await system.approvalWorkflow.approve(approval.id);
    const run = data.workflows.find(item => item.projectId === projectId);
    if (run) await system.workflowRuntime.emit(run, 'deployment.started', { target });
    const deployed = await system.toolRegistry.execute<{ projectId: string; target: string; agentId: string }, { deployed: boolean; previewUrl?: string }>(
      'deployment.publish',
      { projectId, target, agentId: 'delivery' }
    );
    const liveUrl = deployed.previewUrl || `https://live.example.com/${projectId}`;
    await system.deploymentWorkflow.complete(projectId, liveUrl);
    const latest = await system.store.read();
    const project = latest.projects.find(item => item.id === projectId);
    const customer = project ? latest.customers.find(item => item.id === project.customerId) : undefined;
    if (customer) {
      const draft = await system.companyOS.emailDrafts.createDraft({
        projectId,
        customerId: customer.id,
        to: [customer.email],
        subject: `Your website project is ready`,
        body: `Hi ${customer.name},\n\nYour website has been approved and deployed.\n\nLive URL: ${liveUrl}\n\nBest,\nClient Success`,
        createdByAgentId: 'client-success'
      });
      await system.companyOS.emailApprovals.requestSendApproval(draft);
    }
    res.json({ deployed, liveUrl, officeState: await system.officeState(projectId), companyState: await system.companyState(projectId) });
  }));

  router.post('/design/start', route(async (req, res) => {
    const projectId = String(req.body.projectId || '');
    const project = await system.projectMemory.get(projectId);
    if (!project) return void res.status(404).json({ error: 'project not found' });
    const data = await system.store.read();
    const customer = data.customers.find(item => item.id === project.customerId);
    if (!customer) return void res.status(404).json({ error: 'customer not found' });
    const workflowRunId = project.currentWorkflowRunId || (await system.workflowRuntime.create('designWorkflow', { projectId }, projectId)).id;
    const result = await system.designWorkflow.start(project, customer, workflowRunId);
    res.json({ result, officeState: await system.officeState(projectId) });
  }));

  router.get('/design/:projectId/status', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ designStudio: state.designStudio });
  }));

  router.get('/design/:projectId/artifacts', route(async (req, res) => {
    const data = await system.store.read();
    res.json({ artifacts: data.artifacts.filter(item => item.projectId === req.params.projectId && item.path?.startsWith('project/design/')) });
  }));

  router.post('/design/:projectId/creative-directions', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ creativeDirections: state.designStudio.creativeDirections });
  }));

  router.post('/design/:projectId/select-direction', route(async (req, res) => {
    const data = await system.store.read();
    const directionId = String(req.body.directionId || req.body.selectedDirectionId || '');
    const direction = req.body.direction
      || req.body.selectedDirection
      || data.design.creativeDirections.find(item => item.projectId === req.params.projectId && item.id === directionId)
      || data.design.creativeDirections.find(item => item.projectId === req.params.projectId);
    if (!direction) return void res.status(400).json({ error: 'direction is required' });
    const project = data.projects.find(item => item.id === req.params.projectId);
    const existingHandoff = data.design.handoffs.find(item => item.projectId === req.params.projectId);
    const existingSelection = data.design.selectedDirections.find(item => item.projectId === req.params.projectId && item.selectedDirectionId === direction.id);
    const workflow = await ensureCanonicalWorkflow(req.params.projectId, project?.currentWorkflowRunId);
    if (workflow) {
      await system.workflowRuntime.patch(workflow.id, {
        status: 'running',
        currentStep: existingHandoff && existingSelection && req.body.force !== true ? 'design_handoff_ready' : 'design_options_approved',
        state: {
          ...workflow.state,
          designOptionsApproved: true,
          selectedDesignOption: direction,
          approvalId: req.body.approvalId || workflow.state.approvalId,
          lastCheckpoint: existingHandoff && existingSelection && req.body.force !== true ? 'design_handoff_ready' : 'design_options_approved',
          lastCheckpointAt: nowIso()
        }
      });
      await system.projectMemory.update(req.params.projectId, { status: existingHandoff ? 'copy' : 'design' });
      await queueWebsiteBuild(workflow.id);
    }
    res.json({ queued: true, workflowRunId: workflow?.id, canonicalWorkflowRunId: workflow?.id, officeState: await system.officeState(req.params.projectId) });
  }));

  router.post('/design/:projectId/wireframes', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ wireframes: state.designStudio.wireframes });
  }));

  router.post('/design/:projectId/tokens', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ tokens: state.designStudio.tokens });
  }));

  router.post('/design/:projectId/prototype', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ prototype: state.designStudio.prototype });
  }));

  router.post('/design/:projectId/imagery', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    const designBrief = state.designStudio.designBrief;
    const direction = req.body.direction || state.designStudio.creativeDirections?.[0];
    if (!designBrief || !direction) return void res.status(409).json({ error: 'Design brief and creative direction are required before imagery generation' });
    const plan = await system.companyOS.imagery.generateWebsiteImagery({
      projectId: req.params.projectId,
      customerId: designBrief.customerId,
      designBrief,
      direction,
      mode: req.body.mode || 'standard',
      count: Number(req.body.count || 5)
    });
    res.json({ imageryPlan: plan, officeState: await system.officeState(req.params.projectId), companyState: await system.companyState(req.params.projectId) });
  }));

  router.get('/design/:projectId/imagery', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ imageryPlan: state.designStudio.imageryPlan, generatedImages: state.designStudio.generatedImages, finance: state.designStudio.finance });
  }));

  router.post('/design/:projectId/qa', route(async (req, res) => {
    const report = await system.designWorkflow.postBuildReview(req.params.projectId, req.body.previewUrl);
    res.json({ report });
  }));

  router.post('/design/:projectId/approve', route(async (req, res) => {
    const pending = (await system.store.read()).approvals.find(item => item.projectId === req.params.projectId && item.type === 'design_options' && item.status === 'pending');
    if (!pending) return void res.status(404).json({ error: 'No pending design approval' });
    const selected = normalizeDesignOption(req.body.selectedDirection || (pending.payload.designOptions as unknown[] | undefined)?.[0], req.params.projectId);
    if (!selected) return void res.status(400).json({ error: 'selectedDirection is required' });
    const approval = await system.approvalWorkflow.approve(pending.id, { resolvedBy: 'user', selectedDesignOption: selected });
    const workflow = await ensureCanonicalWorkflow(req.params.projectId, String(pending.payload.workflowRunId || ''));
    if (workflow) {
      await system.workflowRuntime.patch(workflow.id, {
        status: 'running',
        currentStep: 'design_options_approved',
        state: {
          ...workflow.state,
          designOptionsApproved: true,
          selectedDesignOption: selected,
          approvalId: approval.id,
          lastCheckpoint: 'design_options_approved',
          lastCheckpointAt: nowIso()
        }
      });
      await system.projectMemory.update(req.params.projectId, { status: 'design' });
      await queueWebsiteBuild(workflow.id);
    }
    res.json({ approval, workflowRunId: workflow?.id, canonicalWorkflowRunId: workflow?.id, officeState: await system.officeState(req.params.projectId) });
  }));

  router.post('/design/:projectId/request-changes', route(async (req, res) => {
    const task = await system.companyOS.taskBoard.createTask({
      projectId: req.params.projectId,
      title: 'Design changes requested',
      description: String(req.body.feedback || 'Design changes requested'),
      type: 'design_fix',
      priority: 'high',
      assignedAgentId: 'design',
      createdByAgentId: 'client-success',
      input: req.body || {}
    });
    res.json({ task });
  }));

  router.get('/design/:projectId/handoff', route(async (req, res) => {
    const state = await system.officeState(req.params.projectId);
    res.json({ handoff: state.designStudio.handoff });
  }));

  router.post('/design/:projectId/post-build-review', route(async (req, res) => {
    const report = await system.designWorkflow.postBuildReview(req.params.projectId, req.body.previewUrl);
    res.json({ report, officeState: await system.officeState(req.params.projectId) });
  }));

  router.get('/finance/:projectId/costs', route(async (req, res) => {
    res.json(await system.companyOS.costs.summarizeProject(req.params.projectId));
  }));

  router.get('/office-state', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json(await system.officeState(projectId));
  }));

  return router;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
