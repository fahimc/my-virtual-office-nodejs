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
    res.json(await system.intakeWorkflow.structureBrief(customerId, originalBrief, req.body.workflowRunId));
  }));

  router.post('/brief/approve', route(async (req, res) => {
    const workflowRunId = String(req.body.workflowRunId || '');
    if (!workflowRunId) return void res.status(400).json({ error: 'workflowRunId is required' });
    const project = await system.intakeWorkflow.approveBrief(workflowRunId, req.body.structuredBrief as StructuredBrief | undefined);
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

  router.post('/approval/:id/approve', route(async (req, res) => {
    const approval = await system.approvalWorkflow.approve(req.params.id);
    if (approval.type === 'preview') {
      await system.websiteBuildWorkflow.prepareDeployment(approval.projectId);
      const run = (await system.store.read()).workflows.find(item => item.projectId === approval.projectId)?.id;
      if (run) await system.workflowRuntime.emit({ id: run, projectId: approval.projectId, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'approval_approved', state: {}, createdAt: '', updatedAt: '' }, 'approval.approved', { approvalId: approval.id });
    }
    res.json({ approval, officeState: await system.officeState(approval.projectId) });
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

  router.get('/office-state', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json(await system.officeState(projectId));
  }));

  return router;
}
