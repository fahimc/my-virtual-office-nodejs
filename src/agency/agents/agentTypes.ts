import type { ModelTaskType } from '../models/modelConfig.js';
import type { ModelRouter } from '../models/modelRouter.js';
import type { AuditLogger } from '../audit/auditLog.js';

export type AgentStatus = 'idle' | 'working' | 'waiting' | 'blocked' | 'completed' | 'failed';

export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  role: string;
  description: string;
  allowedTools: string[];
  memoryScope: 'customer' | 'project' | 'global';
  inputSchema: string;
  outputSchema: string;
  systemPrompt: string;
  taskType: ModelTaskType;
  execute(input: TInput, context: AgentExecutionContext): Promise<TOutput>;
}

export interface AgentExecutionContext {
  modelRouter: ModelRouter;
  auditLog: AuditLogger;
  projectId?: string;
  workflowRunId?: string;
  status(agentId: string, status: AgentStatus, summary: string): Promise<void>;
}

export async function agentText(
  agent: AgentDefinition,
  prompt: string,
  context: AgentExecutionContext
): Promise<string> {
  await context.status(agent.id, 'working', `${agent.name} is preparing ${agent.taskType.replaceAll('_', ' ')} output.`);
  await context.auditLog.log({
    projectId: context.projectId,
    agentId: agent.id,
    action: 'agent.execute',
    inputSummary: prompt.slice(0, 500),
    status: 'started'
  });
  const output = await context.modelRouter.generateText({
    taskType: agent.taskType,
    system: agent.systemPrompt,
    prompt
  });
  await context.auditLog.log({
    projectId: context.projectId,
    agentId: agent.id,
    action: 'agent.execute',
    inputSummary: prompt.slice(0, 500),
    outputSummary: output.slice(0, 500),
    status: 'completed'
  });
  await context.status(agent.id, 'completed', `${agent.name} completed ${agent.role}.`);
  return output;
}
