import express, { type Request, type Response, type Router } from 'express';
import type { CreateAgencySystemOptions } from '../createAgencySystem.js';
import { getAgencySystem } from '../api/agencySystemSingleton.js';
import { ClientPortalService } from './clientPortalService.js';
import { CustomerSessionService } from './customerSessionService.js';
import { CustomerNotificationService } from './customerNotificationService.js';
import { FeedbackTaskConverter } from '../feedback/feedbackTaskConverter.js';
import { fallbackScreenshotSvg, HeadlessScreenshotService, type ScreenshotViewport } from '../previews/headlessScreenshotService.js';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

export function createClientPortalRouter(options: CreateAgencySystemOptions): Router {
  const router = express.Router();
  const system = getAgencySystem(options);
  const portal = new ClientPortalService(system.store, system.approvalService, system.companyOS.taskBoard, system.auditLog, options.workspaceRoot);
  const sessions = new CustomerSessionService();

  const route = (handler: AsyncHandler) => async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(error instanceof Error && /not allowed|not found/i.test(error.message) ? 404 : 500).json({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const identity = async (req: Request, projectId?: string) => sessions.resolve(req, await system.store.read(), projectId);

  router.get('/projects', route(async (req, res) => {
    res.json({ projects: await portal.listProjects(await identity(req)) });
  }));

  router.get('/projects/:projectId', route(async (req, res) => {
    res.json(await portal.projectState(req.params.projectId, await identity(req, req.params.projectId)));
  }));

  router.get('/projects/:projectId/timeline', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ timeline: state.timeline });
  }));

  router.get('/projects/:projectId/updates', route(async (req, res) => {
    await identity(req, req.params.projectId);
    res.json({ updates: await portal.updates.list(req.params.projectId) });
  }));

  router.get('/projects/:projectId/design', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ design: state.design, approvals: state.approvals.filter(item => item.type === 'design_direction') });
  }));

  router.get('/projects/:projectId/preview', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ currentPreview: state.currentPreview, previews: state.previews, approvals: state.approvals.filter(item => item.type === 'preview') });
  }));

  router.get('/projects/:projectId/preview/:previewVersionId', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    const preview = state.previews.find(item => item.id === req.params.previewVersionId);
    if (!preview) return void res.status(404).json({ error: 'Preview version not found' });
    res.json({ preview });
  }));

  router.get('/projects/:projectId/approvals', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ approvals: state.approvals });
  }));

  router.get('/projects/:projectId/files', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ files: state.files, artifacts: await portal.artifacts.listCustomerSafe(req.params.projectId) });
  }));

  router.get('/projects/:projectId/messages', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ messages: state.messages });
  }));

  router.get('/projects/:projectId/feedback', route(async (req, res) => {
    const state = await portal.projectState(req.params.projectId, await identity(req, req.params.projectId));
    res.json({ feedback: state.feedback });
  }));

  router.post('/projects/:projectId/feedback', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const current = await portal.previewVersions.current(req.params.projectId);
    if (!current && !req.body.previewVersionId) return void res.status(409).json({ error: 'No preview version is available for feedback' });
    const feedback = await portal.visualFeedback.createAndConvert({
      projectId: req.params.projectId,
      previewVersionId: String(req.body.previewVersionId || current?.id),
      customerId: user.customerId,
      pageUrl: String(req.body.pageUrl || current?.previewUrl || ''),
      viewport: {
        width: Number(req.body.viewport?.width || req.body.viewportWidth || 0),
        height: Number(req.body.viewport?.height || req.body.viewportHeight || 0)
      },
      clickPosition: {
        x: Number(req.body.clickPosition?.x || req.body.clickX || 0),
        y: Number(req.body.clickPosition?.y || req.body.clickY || 0)
      },
      domSelector: typeof req.body.domSelector === 'string' ? req.body.domSelector : undefined,
      screenshotUrl: typeof req.body.screenshotUrl === 'string' ? req.body.screenshotUrl : undefined,
      comment: String(req.body.comment || ''),
      type: req.body.type || 'general_comment'
    });
    await portal.updates.store.publish({
      projectId: req.params.projectId,
      customerId: user.customerId,
      title: 'Feedback received',
      message: 'Your feedback has been received and converted into an internal agency task.',
      type: 'changes_received',
      sourceInternalEvents: ['client_portal.feedback.created', 'client_portal.feedback.converted_to_task']
    });
    await portal.auditCustomerAction({ projectId: req.params.projectId, customerId: user.customerId, action: 'client_portal.feedback.created', summary: feedback.comment });
    res.json({ feedback });
  }));

  router.post('/projects/:projectId/feedback/:feedbackId/comment', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const existing = (await portal.feedbackStore.list(req.params.projectId)).find(item => item.id === req.params.feedbackId);
    if (!existing) return void res.status(404).json({ error: 'Feedback not found' });
    const feedback = await portal.feedbackStore.update(existing.id, {
      comments: [
        ...(existing.comments || []),
        { id: `comment-${Date.now()}`, senderType: 'customer', body: String(req.body.comment || '').replace(/[<>]/g, ''), createdAt: new Date().toISOString() }
      ]
    });
    await portal.auditCustomerAction({ projectId: req.params.projectId, customerId: user.customerId, action: 'client_portal.feedback.comment', summary: req.body.comment || '' });
    res.json({ feedback });
  }));

  router.post('/projects/:projectId/approvals/:approvalId/approve', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const approval = await portal.approvals.resolve(req.params.approvalId, 'approved', {
      resolvedBy: user.customerId,
      decisionNote: req.body.note,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      snapshot: req.body.snapshot
    });
    if (approval.previewVersionId) await portal.previewVersions.markApproved(approval.previewVersionId).catch(() => undefined);
    await portal.auditCustomerAction({ projectId: req.params.projectId, customerId: user.customerId, action: `client_portal.${approval.type}.approved`, summary: approval.title, approvalId: approval.id });
    res.json({ approval });
  }));

  router.post('/projects/:projectId/approvals/:approvalId/request-changes', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const approval = await portal.approvals.resolve(req.params.approvalId, 'changes_requested', {
      resolvedBy: user.customerId,
      decisionNote: req.body.note,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      snapshot: req.body.snapshot
    });
    await portal.updates.store.publish({
      projectId: req.params.projectId,
      customerId: user.customerId,
      title: 'Changes requested',
      message: 'Your requested changes were recorded and will be routed to the agency team.',
      type: 'changes_received',
      sourceInternalEvents: ['client_portal.approval.changes_requested']
    });
    await portal.auditCustomerAction({ projectId: req.params.projectId, customerId: user.customerId, action: `client_portal.${approval.type}.changes_requested`, summary: approval.decisionNote || approval.title, approvalId: approval.id });
    res.json({ approval });
  }));

  router.post('/projects/:projectId/approvals/:approvalId/reject', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const approval = await portal.approvals.resolve(req.params.approvalId, 'rejected', {
      resolvedBy: user.customerId,
      decisionNote: req.body.note,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    await portal.auditCustomerAction({ projectId: req.params.projectId, customerId: user.customerId, action: `client_portal.${approval.type}.rejected`, summary: approval.decisionNote || approval.title, approvalId: approval.id });
    res.json({ approval });
  }));

  router.post('/projects/:projectId/files/upload', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const file = await portal.files.upload({
      projectId: req.params.projectId,
      customerId: user.customerId,
      originalFilename: String(req.body.originalFilename || req.body.filename || 'upload.bin'),
      mimeType: String(req.body.mimeType || 'application/octet-stream'),
      contentBase64: String(req.body.contentBase64 || ''),
      category: req.body.category,
      uploadedBy: 'customer'
    });
    await portal.updates.store.publish({
      projectId: req.params.projectId,
      customerId: user.customerId,
      title: 'File uploaded',
      message: `${file.originalFilename} was uploaded to the project file area.`,
      type: 'file_uploaded',
      sourceInternalEvents: ['client_portal.file.uploaded']
    });
    res.json({ file });
  }));

  router.delete('/projects/:projectId/files/:fileId', route(async (req, res) => {
    await identity(req, req.params.projectId);
    await portal.files.delete(req.params.projectId, req.params.fileId);
    res.json({ deleted: true });
  }));

  router.post('/projects/:projectId/messages', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const message = await portal.messages.createCustomerMessage({
      projectId: req.params.projectId,
      customerId: user.customerId,
      subject: String(req.body.subject || 'Portal message'),
      body: String(req.body.body || '')
    });
    await portal.updates.store.publish({
      projectId: req.params.projectId,
      customerId: user.customerId,
      title: 'Message received',
      message: 'Your message was sent to the agency team.',
      type: 'message',
      sourceInternalEvents: ['client_portal.message.sent']
    });
    res.json({ message });
  }));

  router.post('/projects/:projectId/preview/:previewVersionId/visual-feedback', route(async (req, res) => {
    const user = await identity(req, req.params.projectId);
    const preview = (await portal.previewVersions.list(req.params.projectId)).find(item => item.id === req.params.previewVersionId);
    if (!preview) return void res.status(404).json({ error: 'Preview version not found' });
    const feedback = await portal.visualFeedback.createAndConvert({
      projectId: req.params.projectId,
      previewVersionId: preview.id,
      customerId: user.customerId,
      pageUrl: String(req.body.pageUrl || preview.previewUrl),
      viewport: {
        width: Number(req.body.viewport?.width || req.body.viewportWidth || 0),
        height: Number(req.body.viewport?.height || req.body.viewportHeight || 0)
      },
      clickPosition: {
        x: Number(req.body.clickPosition?.x || req.body.clickX || 0),
        y: Number(req.body.clickPosition?.y || req.body.clickY || 0)
      },
      domSelector: typeof req.body.domSelector === 'string' ? req.body.domSelector : undefined,
      screenshotUrl: typeof req.body.screenshotUrl === 'string' ? req.body.screenshotUrl : undefined,
      comment: String(req.body.comment || ''),
      type: req.body.type || 'general_comment'
    });
    res.json({ feedback });
  }));

  return router;
}

export function createAgencyClientPortalRouter(options: CreateAgencySystemOptions): Router {
  const router = express.Router();
  const system = getAgencySystem(options);
  const portal = new ClientPortalService(system.store, system.approvalService, system.companyOS.taskBoard, system.auditLog, options.workspaceRoot);
  const notifications = new CustomerNotificationService(system.store);

  const route = (handler: AsyncHandler) => async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  router.post('/publish-update', route(async (req, res) => {
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === req.body.projectId);
    if (!project) return void res.status(404).json({ error: 'Project not found' });
    const update = await portal.updates.store.publish({
      projectId: project.id,
      customerId: project.customerId,
      title: String(req.body.title || 'Project update'),
      message: String(req.body.message || ''),
      type: req.body.type || 'progress',
      sourceInternalEvents: req.body.sourceInternalEvents || ['client_portal.update.published']
    });
    res.json({ update });
  }));

  router.post('/publish-design', route(async (req, res) => {
    const identity = new CustomerSessionService().resolve(req, await system.store.read(), req.body.projectId);
    const state = await portal.projectState(String(req.body.projectId), identity);
    const approval = await portal.approvals.ensure({
      projectId: state.project.id,
      customerId: state.customer.id,
      type: 'design_direction',
      title: 'Approve design direction',
      description: 'Review the agency design direction in the portal.',
      designVersionId: String((state.design.selected as { selectedDirectionId?: string } | undefined)?.selectedDirectionId || ''),
      snapshot: state.design
    });
    res.json({ design: state.design, approval });
  }));

  router.post('/publish-preview', route(async (req, res) => {
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === req.body.projectId);
    if (!project) return void res.status(404).json({ error: 'Project not found' });
    const preview = await portal.previewVersions.create({
      projectId: project.id,
      previewUrl: String(req.body.previewUrl || project.previewUrl || `/previews/${project.id}/`),
      sourceBranch: req.body.sourceBranch,
      buildId: req.body.buildId,
      changelog: req.body.changelog || ['Preview published to the client portal.']
    });
    const approval = await portal.approvals.ensure({
      projectId: project.id,
      customerId: project.customerId,
      type: 'preview',
      title: `Approve preview version ${preview.versionNumber}`,
      description: 'Review this customer preview version.',
      previewVersionId: preview.id,
      snapshot: preview as unknown as Record<string, unknown>
    });
    res.json({ preview, approval });
  }));

  router.post('/create-approval', route(async (req, res) => {
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === req.body.projectId);
    if (!project) return void res.status(404).json({ error: 'Project not found' });
    const approval = await portal.approvals.ensure({
      projectId: project.id,
      customerId: project.customerId,
      type: req.body.type || 'final_delivery',
      title: String(req.body.title || 'Approval needed'),
      description: String(req.body.description || 'Please review this approval request.'),
      artifactIds: req.body.artifactIds || [],
      previewVersionId: req.body.previewVersionId,
      designVersionId: req.body.designVersionId,
      snapshot: req.body.snapshot
    });
    res.json({ approval });
  }));

  router.post('/notify-customer', route(async (req, res) => {
    res.json({ notification: await notifications.notify({
      projectId: String(req.body.projectId || ''),
      type: String(req.body.type || 'portal'),
      title: String(req.body.title || 'Portal update'),
      message: String(req.body.message || '')
    }) });
  }));

  router.post('/create-access-link', route(async (req, res) => {
    const data = await system.store.read();
    const project = data.projects.find(item => item.id === req.body.projectId);
    if (!project) return void res.status(404).json({ error: 'Project not found' });
    const token = new CustomerSessionService().createToken(project.customerId);
    const portalPath = `/portal/projects/${encodeURIComponent(project.id)}?portalToken=${encodeURIComponent(token)}`;
    res.json({ projectId: project.id, customerId: project.customerId, portalPath, token });
  }));

  router.post('/convert-feedback-to-task', route(async (req, res) => {
    const feedback = (await portal.feedbackStore.list(String(req.body.projectId))).find(item => item.id === req.body.feedbackId);
    if (!feedback) return void res.status(404).json({ error: 'Feedback not found' });
    const task = await new FeedbackTaskConverter(system.companyOS.taskBoard).convert(feedback);
    const converted = await portal.feedbackStore.update(feedback.id, {
      status: 'converted_to_task',
      linkedTaskId: task.id,
      assignedAgentId: task.assignedAgentId
    });
    res.json({ feedback: converted, task });
  }));

  return router;
}

export function createAgencyPreviewRouter(options: CreateAgencySystemOptions): Router {
  const router = express.Router();
  const system = getAgencySystem(options);
  const portal = new ClientPortalService(system.store, system.approvalService, system.companyOS.taskBoard, system.auditLog, options.workspaceRoot);
  const screenshots = new HeadlessScreenshotService(options.workspaceRoot);

  router.post('/create-version', async (req, res) => {
    try {
      const version = await portal.previewVersions.create({
        projectId: String(req.body.projectId),
        previewUrl: String(req.body.previewUrl || `/previews/${req.body.projectId}/`),
        sourceBranch: req.body.sourceBranch,
        buildId: req.body.buildId,
        changelog: req.body.changelog
      });
      res.json({ version });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get('/capture-screenshots', async (req, res) => {
    const viewport = parseViewport(req.query.viewport);
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const previewUrl = await previewUrlForScreenshot(system, projectId, typeof req.query.url === 'string' ? req.query.url : '/');
    const result = await screenshots.capture({
      projectId,
      url: previewUrl,
      viewport,
      baseUrl: requestBaseUrl(req)
    });
    if (result.absolutePath) return void res.type('png').sendFile(result.absolutePath);
    res.type('svg').send(fallbackScreenshotSvg(viewport));
  });

  router.post('/capture-screenshots', (req, res) => {
    const projectId = encodeURIComponent(String(req.body.projectId || 'general'));
    const url = encodeURIComponent(String(req.body.url || req.body.previewUrl || '/'));
    res.json({ screenshots: {
      desktop: `/api/agency/previews/capture-screenshots?projectId=${projectId}&viewport=desktop&url=${url}`,
      tablet: `/api/agency/previews/capture-screenshots?projectId=${projectId}&viewport=tablet&url=${url}`,
      mobile: `/api/agency/previews/capture-screenshots?projectId=${projectId}&viewport=mobile&url=${url}`
    } });
  });

  return router;
}

function parseViewport(value: unknown): ScreenshotViewport {
  return value === 'mobile' || value === 'tablet' || value === 'desktop' ? value : 'desktop';
}

function requestBaseUrl(req: Request): string {
  const proto = firstForwarded(req.headers['x-forwarded-proto']) || req.protocol || 'http';
  const host = firstForwarded(req.headers['x-forwarded-host']) || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function firstForwarded(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.split(',')[0]?.trim();
}

async function previewUrlForScreenshot(system: ReturnType<typeof getAgencySystem>, projectId: string | undefined, url: string): Promise<string> {
  if (!projectId || process.env.PREVIEW_REQUIRE_TOKEN !== 'true') return url;
  const data = await system.store.read();
  const latest = data.previewVersions
    .filter(item => item.projectId === projectId && item.accessToken)
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  if (!latest?.accessToken) return url;
  const parsed = new URL(url, 'http://localhost:3000');
  if (!parsed.searchParams.has('previewToken')) parsed.searchParams.set('previewToken', latest.accessToken);
  return /^https?:\/\//i.test(url) ? parsed.toString() : parsed.pathname + parsed.search + parsed.hash;
}
