import type { AgentPresenceUpdate } from '../runtime/agentRuntime.js';

export function buildAgentPresence(updates: AgentPresenceUpdate[]) {
  return updates.map(update => ({
    id: update.agentId,
    status: update.status,
    summary: update.summary,
    updatedAt: update.updatedAt
  }));
}
