import express, { type Request, type Response, type Router } from 'express';
import type { CreateAgencySystemOptions } from '../createAgencySystem.js';
import { getAgencySystem } from './agencySystemSingleton.js';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

export function createCompanyRouter(options: CreateAgencySystemOptions): Router {
  const router = express.Router();
  const system = getAgencySystem(options);
  const route = (handler: AsyncHandler) => async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  router.post('/tasks/create', route(async (req, res) => {
    const task = await system.companyOS.taskBoard.createTask(req.body);
    res.json({ task });
  }));
  router.get('/tasks', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json({ tasks: await system.companyOS.taskBoard.listTasks(projectId) });
  }));
  router.post('/tasks/:id/update', route(async (req, res) => {
    res.json({ task: await system.companyOS.taskBoard.updateTask(req.params.id, req.body) });
  }));
  router.post('/tasks/:id/claim', route(async (req, res) => {
    res.json({ task: await system.companyOS.taskBoard.claimTask(req.params.id, String(req.body.agentId || 'ops')) });
  }));
  router.post('/tasks/:id/complete', route(async (req, res) => {
    res.json({ task: await system.companyOS.taskBoard.completeTask(req.params.id, req.body.output || {}, req.body.artifacts || []) });
  }));

  router.post('/email/search', route(async (req, res) => {
    res.json({ messages: await system.companyOS.emailProvider.search(String(req.body.query || '')) });
  }));
  router.post('/email/draft', route(async (req, res) => {
    const draft = await system.companyOS.emailDrafts.createDraft({
      projectId: req.body.projectId,
      customerId: req.body.customerId,
      to: req.body.to || [],
      subject: req.body.subject || '',
      body: req.body.body || '',
      createdByAgentId: req.body.agentId || 'client-success'
    });
    const approval = await system.companyOS.emailApprovals.requestSendApproval(draft);
    res.json({ draft, approval });
  }));
  router.post('/email/:draftId/approve-send', route(async (req, res) => {
    const draft = await system.companyOS.emailDrafts.updateDraft(req.params.draftId, { status: 'approved' });
    const result = await system.toolRegistry.execute('email.company', { action: 'send_approved_draft', draftId: draft.id, projectId: draft.projectId, agentId: req.body.agentId || 'client-success' });
    res.json({ draft, result });
  }));

  router.post('/codex/run', route(async (req, res) => {
    const result = await system.companyOS.codex.run({
      projectId: req.body.projectId,
      repoPath: req.body.repoPath || system.companyOS.config.defaultRepoPath,
      branchName: req.body.branchName,
      taskTitle: req.body.taskTitle || 'Agency coding task',
      taskPrompt: req.body.taskPrompt || '',
      agentId: req.body.agentId || 'builder'
    });
    res.json(result);
  }));
  router.get('/codex/:taskId/status', route(async (req, res) => {
    res.json({ task: await system.companyOS.codex.status(req.params.taskId) });
  }));
  router.post('/codex/:taskId/cancel', route(async (req, res) => {
    res.json({ task: await system.companyOS.codex.cancel(req.params.taskId) });
  }));

  router.post('/github/branch', route(async (req, res) => {
    res.json({ branch: await system.companyOS.githubBranches.create({
      projectId: req.body.projectId,
      repo: req.body.repo || 'my-virtual-office-nodejs',
      branchName: req.body.branchName,
      baseBranch: req.body.baseBranch || system.companyOS.config.defaultBaseBranch,
      createdByAgentId: req.body.agentId || 'builder'
    }) });
  }));
  router.post('/github/pr', route(async (req, res) => {
    res.json({ pullRequest: await system.companyOS.githubPullRequests.create({
      projectId: req.body.projectId,
      repo: req.body.repo || 'my-virtual-office-nodejs',
      branchName: req.body.branchName,
      title: req.body.title || 'Agency build update',
      body: req.body.body || '',
      createdByAgentId: req.body.agentId || 'builder'
    }) });
  }));
  router.get('/github/pr/:id/status', route(async (req, res) => {
    res.json({ pullRequest: await system.companyOS.githubPullRequests.get(req.params.id) });
  }));
  router.post('/github/pr/:id/request-review', route(async (req, res) => {
    res.json({ pullRequest: await system.companyOS.githubPullRequests.update(req.params.id, { status: 'review_requested' }) });
  }));
  router.post('/github/pr/:id/approve-merge', route(async (req, res) => {
    const pr = await system.companyOS.githubPullRequests.get(req.params.id);
    if (!pr) return void res.status(404).json({ error: 'PR not found' });
    const approval = await system.approvalService.request({
      projectId: pr.projectId,
      type: 'merge_pull_request',
      title: `Approve merge: ${pr.title}`,
      description: 'Merging to the base branch requires explicit approval.',
      requestedByAgentId: req.body.agentId || 'delivery',
      payload: { prId: pr.id, url: pr.url }
    });
    res.json({ approval });
  }));

  router.post('/preview/create', route(async (req, res) => {
    const preview = await system.companyOS.previews.create({
      projectId: req.body.projectId,
      url: req.body.url || `http://localhost:3000/previews/${req.body.projectId}`,
      provider: req.body.provider || 'local',
      screenshotPaths: [],
      createdByAgentId: req.body.agentId || 'delivery'
    });
    res.json({ preview });
  }));
  router.get('/preview/:id', route(async (req, res) => {
    res.json({ preview: await system.companyOS.previews.get(req.params.id) });
  }));
  router.post('/deployment/prepare', route(async (req, res) => {
    const deployment = await system.toolRegistry.execute('deployment.company', { action: 'prepare', projectId: req.body.projectId, provider: req.body.provider || 'netlify', agentId: req.body.agentId || 'delivery' });
    const approval = await system.companyOS.deploymentApprovals.request(req.body.projectId, req.body.agentId || 'delivery', { deployment });
    res.json({ deployment, approval });
  }));
  router.post('/deployment/approve', route(async (req, res) => {
    res.redirect(307, '/api/agency/deployment/approve');
  }));

  router.get('/approvals', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json({ approvals: await system.companyOS.approvalStore.list(projectId) });
  }));
  router.post('/approvals/:id/approve', route(async (req, res) => {
    res.json({ approval: await system.approvalWorkflow.approve(req.params.id) });
  }));
  router.post('/approvals/:id/reject', route(async (req, res) => {
    res.json({ approval: await system.approvalService.resolve(req.params.id, 'rejected', req.body || {}) });
  }));
  router.post('/approvals/:id/request-changes', route(async (req, res) => {
    res.json({ approval: await system.approvalService.resolve(req.params.id, 'changes_requested', req.body || {}) });
  }));

  router.get('/audit', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json({ audit: await system.companyOS.auditStore.list(projectId) });
  }));
  router.post('/workflow/resume', route(async (req, res) => {
    await system.resumeService.resume(String(req.body.workflowRunId || ''));
    res.json({ resumed: true });
  }));
  router.get('/workflow/:id/status', route(async (req, res) => {
    const workflow = await system.workflowRuntime.get(req.params.id);
    res.json({ workflow, companyState: await system.companyState(workflow?.projectId) });
  }));
  router.get('/state', route(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    res.json(await system.companyState(projectId));
  }));

  return router;
}
