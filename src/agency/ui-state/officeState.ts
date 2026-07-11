import type { AgentRuntime } from '../runtime/agentRuntime.js';
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

export async function buildOfficeState(store: MemoryStore, agentRuntime: AgentRuntime, projectId?: string) {
  const data = await store.read();
  const project = projectId ? data.projects.find(item => item.id === projectId) : data.projects.at(-1);
  const artifacts = project ? data.artifacts.filter(item => item.projectId === project.id) : [];
  const approvals = project ? data.approvals.filter(item => item.projectId === project.id) : [];
  const workflow = project?.currentWorkflowRunId ? data.workflows.find(item => item.id === project.currentWorkflowRunId) : data.workflows.at(-1);
  const designPanel = buildDesignPanelState(data, project?.id);
  return {
    project,
    workflow,
    agents: buildAgentPresence(agentRuntime.getPresence()),
    timeline: buildProjectTimeline(project, artifacts),
    artifacts,
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
    resumeRequired: workflow?.status === 'failed' || workflow?.status === 'paused'
  };
}
