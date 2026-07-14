import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { Artifact } from '../schemas/artifact.schema.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { buildAgentPresence } from './agentPresence.js';
import { buildProjectTimeline } from './projectTimeline.js';
import { buildTaskBoardState } from './taskBoardState.js';
import { buildApprovalPanelState } from './approvalPanelState.js';
import { buildDesignPanelState } from './designPanelState.js';
import { buildMoodboardState } from './moodboardState.js';
import { buildDesignApprovalState } from './designApprovalState.js';
import { buildPrototypePreviewState } from './prototypePreviewState.js';
import { buildDeveloperStudioState } from './developerStudioState.js';
import { getAgencyBuildInfo } from '../appVersion.js';
import { workflowPhaseForStep } from '../runtime/workflowStage.js';

export async function buildOfficeState(store: MemoryStore, agentRuntime: AgentRuntime, projectId?: string) {
  const data = await store.read();
  const project = projectId ? data.projects.find(item => item.id === projectId) : data.projects.at(-1);
  const rawArtifacts = project ? data.artifacts.filter(item => item.projectId === project.id) : [];
  const artifacts = summarizeArtifacts(rawArtifacts);
  const approvals = project ? data.approvals.filter(item => item.projectId === project.id) : [];
  const projectWorkflows = project
    ? data.workflows.filter(item => item.projectId === project.id && item.workflowName === 'websiteBuildWorkflow').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    : [];
  const workflow = project?.currentWorkflowRunId
    ? data.workflows.find(item => item.id === project.currentWorkflowRunId) || projectWorkflows[0]
    : projectWorkflows[0] || data.workflows.at(-1);
  const designPanel = buildDesignPanelState(data, project?.id);
  const selectedDirection = Boolean(designPanel.selectedDirection);
  const hasDesignHandoff = Boolean(designPanel.handoff);
  const diagnostics = buildDiagnostics({ data, project, workflow, approvals, selectedDirection, hasDesignHandoff, rawArtifactCount: rawArtifacts.length, artifactCount: artifacts.length });
  return {
    project,
    workflow,
    agents: buildAgentPresence(agentRuntime.getPresence()),
    timeline: buildProjectTimeline(project, artifacts, { workflow, approvals, hasSelectedDirection: selectedDirection, hasDesignHandoff }),
    artifacts,
    artifactStats: {
      total: artifacts.length,
      displayed: artifacts.length,
      rawTotal: rawArtifacts.length
    },
    approvals,
    approvalCenter: buildApprovalPanelState(approvals),
    designStudio: {
      ...designPanel,
      moodboard: buildMoodboardState(designPanel.creativeDirections),
      approvals: buildDesignApprovalState(approvals),
      prototypePreview: buildPrototypePreviewState(designPanel.prototype)
    },
    developerStudio: buildDeveloperStudioState(data, project?.id),
    taskBoard: buildTaskBoardState(project ? data.companyTasks.filter(task => task.projectId === project.id) : []),
    company: {
      codexTasks: project ? data.codexTasks.filter(task => task.projectId === project.id) : data.codexTasks,
      githubPullRequests: project ? data.githubPullRequests.filter(item => item.projectId === project.id) : data.githubPullRequests,
      emailDrafts: project ? data.emailDrafts.filter(item => item.projectId === project.id) : data.emailDrafts,
      generatedImages: project ? data.generatedImages.filter(item => item.projectId === project.id) : data.generatedImages,
      costLedger: project ? data.costLedger.filter(item => item.projectId === project.id) : data.costLedger,
      notifications: project ? data.notifications.filter(item => item.projectId === project.id) : data.notifications
    },
    activity: data.tasks.slice(-20).map(task => ({
      title: task.title,
      status: task.status,
      agentId: task.agentId,
      updatedAt: task.updatedAt
    })),
    waitingForUser: workflow?.status === 'waiting_for_user',
    resumeRequired: workflow?.status === 'failed' || workflow?.status === 'paused' || workflow?.currentStep === 'failed',
    diagnostics
  };
}

function buildDiagnostics(input: {
  data: Awaited<ReturnType<MemoryStore['read']>>;
  project: Awaited<ReturnType<MemoryStore['read']>>['projects'][number] | undefined;
  workflow: Awaited<ReturnType<MemoryStore['read']>>['workflows'][number] | undefined;
  approvals: Awaited<ReturnType<MemoryStore['read']>>['approvals'];
  selectedDirection: boolean;
  hasDesignHandoff: boolean;
  rawArtifactCount: number;
  artifactCount: number;
}) {
  const warnings: string[] = [];
  const approvedDesign = input.approvals.some(item => item.type === 'design_options' && item.status === 'approved') || input.selectedDirection;
  const pendingDesignApprovals = input.approvals.filter(item => item.type === 'design_options' && item.status === 'pending');
  if (input.project?.currentWorkflowRunId && !input.data.workflows.some(item => item.id === input.project?.currentWorkflowRunId)) {
    warnings.push('Project referenced a missing workflow; the latest project workflow was selected.');
  }
  if (approvedDesign && input.project?.status === 'planning') warnings.push('Approved design cannot remain in planning.');
  if (approvedDesign && input.workflow?.currentStep === 'design_options_approval') warnings.push('Approved design is still recorded at the approval gate.');
  if (approvedDesign && pendingDesignApprovals.length) warnings.push(`${pendingDesignApprovals.length} duplicate design approval gate(s) remain open.`);
  if (input.hasDesignHandoff && !input.selectedDirection) warnings.push('A design handoff exists without a selected creative direction.');
  if (input.project && !input.workflow) warnings.push('No website build workflow is attached to this project.');
  if (input.rawArtifactCount > input.artifactCount) warnings.push(`${input.rawArtifactCount - input.artifactCount} duplicate resource record(s) were compacted from this view.`);
  const dispatchError = typeof input.workflow?.state?.lastDispatchError === 'string' ? input.workflow.state.lastDispatchError : '';
  if (dispatchError) warnings.push(`Workflow worker dispatch failed: ${dispatchError}`);
  const leaseUntilMs = typeof input.workflow?.state?.executionLeaseUntil === 'string'
    ? Date.parse(input.workflow.state.executionLeaseUntil)
    : 0;
  const dispatchAcceptedMs = typeof input.workflow?.state?.lastDispatchAcceptedAt === 'string'
    ? Date.parse(input.workflow.state.lastDispatchAcceptedAt)
    : 0;
  if (
    input.workflow?.status === 'running' &&
    Number.isFinite(dispatchAcceptedMs) &&
    dispatchAcceptedMs > 0 &&
    Date.now() - dispatchAcceptedMs > 90_000 &&
    (!Number.isFinite(leaseUntilMs) || leaseUntilMs <= Date.now())
  ) {
    warnings.push('The workflow is running without an active worker lease; status polling will request recovery.');
  }
  const build = getAgencyBuildInfo();
  return {
    app: build,
    projectId: input.project?.id || '',
    projectStatus: input.project?.status || 'none',
    projectUpdatedAt: input.project?.updatedAt,
    requestedWorkflowRunId: input.project?.currentWorkflowRunId || '',
    workflowRunId: input.workflow?.id || '',
    workflowName: input.workflow?.workflowName || '',
    workflowStatus: input.workflow?.status || 'missing',
    currentStep: input.workflow?.currentStep || 'missing',
    phase: input.workflow ? workflowPhaseForStep(input.workflow.currentStep) : 'missing',
    lastCheckpoint: typeof input.workflow?.state?.lastCheckpoint === 'string' ? input.workflow.state.lastCheckpoint : input.workflow?.currentStep || 'missing',
    lastCheckpointAt: typeof input.workflow?.state?.lastCheckpointAt === 'string' ? input.workflow.state.lastCheckpointAt : input.workflow?.updatedAt,
    workflowUpdatedAt: input.workflow?.updatedAt,
    executionLeaseOwner: typeof input.workflow?.state?.executionLeaseOwner === 'string' ? input.workflow.state.executionLeaseOwner : '',
    executionLeaseUntil: typeof input.workflow?.state?.executionLeaseUntil === 'string' ? input.workflow.state.executionLeaseUntil : '',
    lastDispatchMode: typeof input.workflow?.state?.lastDispatchMode === 'string' ? input.workflow.state.lastDispatchMode : '',
    lastDispatchEndpoint: typeof input.workflow?.state?.lastDispatchEndpoint === 'string' ? input.workflow.state.lastDispatchEndpoint : '',
    lastDispatchJobId: typeof input.workflow?.state?.lastDispatchJobId === 'string' ? input.workflow.state.lastDispatchJobId : '',
    lastDispatchStatus: typeof input.workflow?.state?.lastDispatchStatus === 'number' ? input.workflow.state.lastDispatchStatus : undefined,
    lastDispatchRequestedAt: typeof input.workflow?.state?.lastDispatchRequestedAt === 'string' ? input.workflow.state.lastDispatchRequestedAt : '',
    lastDispatchAcceptedAt: typeof input.workflow?.state?.lastDispatchAcceptedAt === 'string' ? input.workflow.state.lastDispatchAcceptedAt : '',
    lastDispatchError: dispatchError,
    resumeCount: Number(input.workflow?.state?.resumeCount || 0),
    lastResumeFromStep: typeof input.workflow?.state?.lastResumeFromStep === 'string' ? input.workflow.state.lastResumeFromStep : '',
    lastResumeCheckpoint: typeof input.workflow?.state?.lastResumeCheckpoint === 'string' ? input.workflow.state.lastResumeCheckpoint : '',
    resumeRequestedAt: typeof input.workflow?.state?.resumeRequestedAt === 'string' ? input.workflow.state.resumeRequestedAt : '',
    lastResumeError: typeof input.workflow?.state?.lastResumeError === 'string' ? input.workflow.state.lastResumeError : '',
    debugTrace: Array.isArray(input.workflow?.state?.debugTrace) ? input.workflow.state.debugTrace.slice(-24) : [],
    testMode: input.workflow?.state?.testMode === true,
    designApproved: approvedDesign,
    selectedDirection: input.selectedDirection,
    designHandoffReady: input.hasDesignHandoff,
    pendingApprovals: input.approvals.filter(item => item.status === 'pending').map(item => item.type),
    approvalRecords: input.approvals.slice(-10).map(item => ({ id: item.id, type: item.type, status: item.status, resolvedAt: item.resolvedAt })),
    artifactCount: input.artifactCount,
    rawArtifactCount: input.rawArtifactCount,
    integrity: warnings.length ? 'warning' : 'ok',
    warnings
  };
}

function summarizeArtifacts(artifacts: Artifact[]): Artifact[] {
  const byKey = new Map<string, Artifact>();
  for (const artifact of artifacts) {
    const key = artifactResourceKey(artifact);
    const existing = byKey.get(key);
    if (!existing || Date.parse(artifact.createdAt || '') >= Date.parse(existing.createdAt || '')) {
      byKey.set(key, artifact);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => Date.parse(a.createdAt || '') - Date.parse(b.createdAt || ''))
    .slice(-80);
}

function artifactResourceKey(artifact: Artifact): string {
  if (artifact.type === 'generated_image') {
    const intendedUse = typeof artifact.metadata?.intendedUse === 'string' ? artifact.metadata.intendedUse : '';
    return `${artifact.type}:${intendedUse}:${artifact.title}`;
  }
  if (artifact.path?.startsWith('project/design/')) return `${artifact.type}:${artifact.path}`;
  return `${artifact.type}:${artifact.title}`;
}
