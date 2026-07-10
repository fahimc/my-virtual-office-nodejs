import type { AgentDefinition, AgentExecutionContext, AgentStatus } from '../agents/agentTypes.js';
import { AuditLogger } from '../audit/auditLog.js';
import { ModelRouter } from '../models/modelRouter.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export interface AgentPresenceUpdate {
  agentId: string;
  status: AgentStatus;
  summary: string;
  updatedAt: string;
}

export class AgentRuntime {
  private readonly agents = new Map<string, AgentDefinition>();
  private readonly auditLog: AuditLogger;
  private readonly presence = new Map<string, AgentPresenceUpdate>();

  constructor(
    private readonly store: MemoryStore,
    private readonly modelRouter = new ModelRouter()
  ) {
    this.auditLog = new AuditLogger(store);
  }

  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
    this.presence.set(agent.id, { agentId: agent.id, status: 'idle', summary: `${agent.name} is available.`, updatedAt: new Date().toISOString() });
  }

  get(agentId: string): AgentDefinition {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not registered: ${agentId}`);
    return agent;
  }

  list(): AgentDefinition[] {
    return [...this.agents.values()];
  }

  getPresence(): AgentPresenceUpdate[] {
    return [...this.presence.values()];
  }

  async execute<TInput, TOutput>(agentId: string, input: TInput, context: { projectId?: string; workflowRunId?: string } = {}): Promise<TOutput> {
    const agent = this.get(agentId) as AgentDefinition<TInput, TOutput>;
    const executionContext: AgentExecutionContext = {
      modelRouter: this.modelRouter,
      auditLog: this.auditLog,
      projectId: context.projectId,
      workflowRunId: context.workflowRunId,
      status: async (id, status, summary) => {
        this.presence.set(id, { agentId: id, status, summary, updatedAt: new Date().toISOString() });
      }
    };
    return agent.execute(input, executionContext);
  }
}
