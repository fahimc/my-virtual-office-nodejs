import type { AgentPresenceUpdate } from '../runtime/agentRuntime.js';

export function buildAgentPresence(updates: AgentPresenceUpdate[]) {
  return updates.map(update => ({
    id: update.agentId,
    agentId: update.agentId,
    name: update.name || update.agentId,
    role: update.role || update.agentId,
    status: update.status,
    summary: update.summary,
    updatedAt: update.updatedAt
  }));
}
