import express, { type Request, type Response, type Router } from 'express';
import type { CreateAgencySystemOptions } from '../createAgencySystem.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
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
    const build = await system.websiteBuildWorkflow.start(project.id);
    await queueWebsiteBuild(build.workflowRunId);
    res.json({ project, workflowRunId: build.workflowRunId, officeState: await system.officeState(project.id) });
  }));

  router.post('/workflow/start', route(async (req, res) => {
    const projectId = String(req.body.projectId || '');
    if (!projectId) return void res.status(400).json({ error: 'projectId is required' });
    const build = await system.websiteBuildWorkflow.start(projectId);
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
    const workflow = await system.workflowRuntime.get(req.params.id);
    if (!workflow) return void res.status(404).json({ error: 'workflow not found' });
    res.json({ workflow, officeState: await system.officeState(workflow.projectId) });
  }));

  router.get('/project/:id', route(async (req, res) => {
    const project = await system.projectMemory.get(req.params.id);
    if (!project) return void res.status(404).json({ error: 'project not found' });
    res.json({ project, officeState: await system.officeState(project.id) });
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
    const approval = await system.approvalWorkflow.approve(req.params.id);
    let workflowRunIdForClient = '';
    if (approval.type === 'design_options') {
      const workflowRunId = String(approval.payload.workflowRunId || '');
      const selectedDesignOption = req.body.selectedDesignOption || (approval.payload.designOptions as unknown[] | undefined)?.[0];
      let run = workflowRunId ? await system.workflowRuntime.get(workflowRunId) : undefined;
      if (!run) {
        const existing = (await system.store.read()).workflows.find(item => item.projectId === approval.projectId && item.workflowName === 'websiteBuildWorkflow');
        workflowRunIdForClient = existing?.id || (await system.websiteBuildWorkflow.start(approval.projectId)).workflowRunId;
        run = await system.workflowRuntime.get(workflowRunIdForClient);
      } else {
        workflowRunIdForClient = run.id;
      }
      if (run) {
        await system.workflowRuntime.patch(run.id, {
          status: 'running',
          currentStep: 'design_options_approved',
          state: {
            ...run.state,
            designOptionsApproved: true,
            selectedDesignOption
          }
        });
      }
      if (selectedDesignOption && workflowRunIdForClient) {
        await system.jobQueue.enqueue('designWorkflow.completeAfterApproval', { projectId: approval.projectId, selectedDesignOption, approvalId: approval.id, workflowRunId: workflowRunIdForClient }, async payload => {
          await system.designWorkflow.completeAfterApproval(payload.projectId, payload.selectedDesignOption, payload.approvalId);
          if (payload.workflowRunId) await queueWebsiteBuild(payload.workflowRunId);
        });
      }
    } else if (approval.type === 'preview') {
      await system.websiteBuildWorkflow.prepareDeployment(approval.projectId);
      const run = (await system.store.read()).workflows.find(item => item.projectId === approval.projectId)?.id;
      if (run) await system.workflowRuntime.emit({ id: run, projectId: approval.projectId, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'approval_approved', state: {}, createdAt: '', updatedAt: '' }, 'approval.approved', { approvalId: approval.id });
    }
    res.json({ approval, workflowRunId: workflowRunIdForClient, officeState: await system.officeState(approval.projectId) });
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
    if (!existingHandoff || !existingSelection || req.body.force === true) {
      await system.jobQueue.enqueue('designWorkflow.selectDirection', {
        projectId: req.params.projectId,
        direction,
        approvalId: req.body.approvalId,
        workflowRunId: project?.currentWorkflowRunId
      }, async payload => {
        await system.designWorkflow.completeAfterApproval(payload.projectId, payload.direction, payload.approvalId);
        if (payload.workflowRunId) await queueWebsiteBuild(payload.workflowRunId);
      });
    }
    res.json({ queued: true, officeState: await system.officeState(req.params.projectId) });
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
    req.params.id = pending.id;
    const approval = await system.approvalWorkflow.approve(pending.id);
    const selected = req.body.selectedDirection || (pending.payload.designOptions as unknown[] | undefined)?.[0];
    if (selected) await system.designWorkflow.completeAfterApproval(req.params.projectId, selected, approval.id);
    res.json({ approval, officeState: await system.officeState(req.params.projectId) });
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
