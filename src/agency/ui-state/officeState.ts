import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { buildAgentPresence } from './agentPresence.js';
import { buildProjectTimeline } from './projectTimeline.js';

export async function buildOfficeState(store: MemoryStore, agentRuntime: AgentRuntime, projectId?: string) {
  const data = await store.read();
  const project = projectId ? data.projects.find(item => item.id === projectId) : data.projects.at(-1);
  const artifacts = project ? data.artifacts.filter(item => item.projectId === project.id) : [];
  const approvals = project ? data.approvals.filter(item => item.projectId === project.id) : [];
  const workflow = project?.currentWorkflowRunId ? data.workflows.find(item => item.id === project.currentWorkflowRunId) : data.workflows.at(-1);
  return {
    project,
    workflow,
    agents: buildAgentPresence(agentRuntime.getPresence()),
    timeline: buildProjectTimeline(project, artifacts),
    artifacts,
    approvals,
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
