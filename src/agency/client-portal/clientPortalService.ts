import type { MemoryStore } from '../memory/memoryStore.js';
import type { AuditLogger } from '../audit/auditLog.js';
import type { ApprovalService } from '../approvals/approvalService.js';
import type { TaskBoardService } from '../tools/taskboard/taskBoardService.js';
import type { ClientPortalProjectState } from '../schemas/clientPortal.schema.js';
import type { CustomerIdentity } from './clientPortalPermissions.js';
import { assertCustomerProjectAccess, customerProjects } from './clientPortalPermissions.js';
import { buildCustomerTimeline, buildProjectSummary } from './clientPortalState.js';
import { UpdateFeedService } from '../updates/updateFeedService.js';
import { PreviewVersionService } from '../previews/previewVersionService.js';
import { ClientApprovalService } from '../approvals/clientApprovalService.js';
import { FeedbackStore } from '../feedback/feedbackStore.js';
import { VisualFeedbackTool } from '../feedback/visualFeedbackTool.js';
import { CustomerFileUploadService } from '../files/customerFileUploadService.js';
import { LocalStorageProvider } from '../files/localStorageProvider.js';
import { MinioStorageProvider, minioConfigured } from '../files/minioStorageProvider.js';
import { ClientMessageService } from '../messages/clientMessageService.js';
import { ArtifactLibraryService } from '../files/artifactLibraryService.js';
import { designDirectionView } from '../design-client/designDirectionViewer.js';

export class ClientPortalService {
  readonly updates: UpdateFeedService;
  readonly previewVersions: PreviewVersionService;
  readonly approvals: ClientApprovalService;
  readonly feedbackStore: FeedbackStore;
  readonly visualFeedback: VisualFeedbackTool;
  readonly files: CustomerFileUploadService;
  readonly messages: ClientMessageService;
  readonly artifacts: ArtifactLibraryService;

  constructor(
    private readonly store: MemoryStore,
    private readonly approvalService: ApprovalService,
    taskBoard: TaskBoardService,
    private readonly audit: AuditLogger,
    workspaceRoot: string
  ) {
    this.updates = new UpdateFeedService(store);
    this.previewVersions = new PreviewVersionService(store);
    this.approvals = new ClientApprovalService(store, approvalService);
    this.feedbackStore = new FeedbackStore(store);
    this.visualFeedback = new VisualFeedbackTool(this.feedbackStore, taskBoard);
    this.files = new CustomerFileUploadService(store, minioConfigured() ? new MinioStorageProvider() : new LocalStorageProvider(workspaceRoot));
    this.messages = new ClientMessageService(store);
    this.artifacts = new ArtifactLibraryService(store);
  }

  async listProjects(identity: CustomerIdentity) {
    const data = await this.store.read();
    const projects = customerProjects(data, identity).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return Promise.all(projects.map(project => this.summaryFor(project.id, identity)));
  }

  async summaryFor(projectId: string, identity: CustomerIdentity) {
    const data = await this.store.read();
    assertCustomerProjectAccess(data, identity, projectId);
    const project = data.projects.find(item => item.id === projectId)!;
    await this.previewVersions.ensureForProject(project);
    await this.ensurePortalApprovals(projectId);
    const fresh = await this.store.read();
    return buildProjectSummary(fresh, project);
  }

  async projectState(projectId: string, identity: CustomerIdentity): Promise<ClientPortalProjectState> {
    const data = await this.store.read();
    assertCustomerProjectAccess(data, identity, projectId);
    const project = data.projects.find(item => item.id === projectId)!;
    const customer = data.customers.find(item => item.id === project.customerId);
    if (!customer) throw new Error(`Customer not found: ${project.customerId}`);
    const preview = await this.previewVersions.ensureForProject(project);
    await this.ensurePortalApprovals(projectId);
    const updates = await this.updates.ensureBaseline(project);
    const fresh = await this.store.read();
    const summary = buildProjectSummary(fresh, project);
    const approvals = await this.approvals.list(projectId);
    const previews = await this.previewVersions.list(projectId);
    return {
      project,
      customer,
      summary,
      timeline: buildCustomerTimeline(project, Boolean(designDirectionView(fresh, projectId).direction), Boolean(preview), approvals.some(item => item.status === 'pending')),
      latestUpdate: updates[0],
      updates,
      design: designDirectionView(fresh, projectId),
      previews,
      currentPreview: previews[0],
      approvals,
      feedback: await this.feedbackStore.list(projectId),
      files: await this.files.list(projectId),
      messages: await this.messages.list(projectId)
    };
  }

  async ensurePortalApprovals(projectId: string) {
    const data = await this.store.read();
    const project = data.projects.find(item => item.id === projectId);
    if (!project) return;
    const preview = await this.previewVersions.ensureForProject(project);
    const design = designDirectionView(data, projectId);
    const selected = design.selected as { selectedDirectionId?: string } | undefined;
    const internalPending = data.approvals.filter(item => item.projectId === projectId && item.status === 'pending');
    if (selected?.selectedDirectionId && !data.clientApprovals.some(item => item.projectId === projectId && item.type === 'design_direction')) {
      await this.approvals.ensure({
        projectId,
        customerId: project.customerId,
        type: 'design_direction',
        title: 'Approve design direction',
        description: 'Review the selected creative direction, palette, typography, layout style, and rationale.',
        designVersionId: selected.selectedDirectionId,
        snapshot: { design }
      });
    }
    const previewPending = internalPending.find(item => item.type === 'preview');
    const hasPreviewApproval = preview
      ? data.clientApprovals.some(item => item.projectId === projectId && item.type === 'preview' && item.previewVersionId === preview.id && item.status !== 'cancelled')
      : false;
    if (preview && !hasPreviewApproval && (previewPending || project.status === 'awaiting_approval')) {
      await this.approvals.ensure({
        projectId,
        customerId: project.customerId,
        type: 'preview',
        title: `Approve preview version ${preview.versionNumber}`,
        description: 'Review this preview version. Approve it or request changes with visual feedback.',
        previewVersionId: preview.id,
        relatedInternalApprovalId: previewPending?.id,
        snapshot: { previewUrl: preview.previewUrl, versionNumber: preview.versionNumber, screenshots: preview.screenshots }
      });
    }
  }

  async auditCustomerAction(input: { projectId: string; customerId: string; action: string; summary: string; approvalId?: string }) {
    await this.audit.log({
      projectId: input.projectId,
      customerId: input.customerId,
      agentId: 'client-portal',
      action: input.action,
      inputSummary: input.summary,
      status: 'completed',
      approvalId: input.approvalId
    });
  }
}
