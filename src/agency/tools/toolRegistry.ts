import { ApprovalService } from '../approvals/approvalService.js';
import { AuditLogger } from '../audit/auditLog.js';
import type { ToolDefinition, ToolExecutionContext } from './toolTypes.js';

export type { ToolDefinition, ToolPermissionLevel } from './toolTypes.js';

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  constructor(
    private readonly approvalService: ApprovalService,
    private readonly auditLog: AuditLogger
  ) {}

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  async execute<TInput, TOutput>(name: string, input: TInput & ToolExecutionContext): Promise<TOutput> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not registered: ${name}`);
    await this.auditLog.log({
      projectId: input.projectId,
      workflowRunId: input.workflowRunId,
      agentId: input.agentId,
      taskId: input.taskId,
      action: 'tool.execute',
      toolName: tool.name,
      permissionLevel: tool.permissionLevel,
      inputSummary: JSON.stringify(input).slice(0, 500),
      status: 'started'
    });
    if (tool.approvalRequired && tool.approvalType && input.projectId) {
      await this.approvalService.assertApproved(input.projectId, tool.approvalType, { ...(input as Record<string, unknown>), toolName: tool.name });
    }
    try {
      const output = await tool.execute(input, input) as TOutput;
      await this.auditLog.log({
        projectId: input.projectId,
        workflowRunId: input.workflowRunId,
        agentId: input.agentId,
        taskId: input.taskId,
        action: 'tool.execute',
        toolName: tool.name,
        permissionLevel: tool.permissionLevel,
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: JSON.stringify(output).slice(0, 500),
        status: 'completed'
      });
      return output;
    } catch (error) {
      await this.auditLog.log({
        projectId: input.projectId,
        workflowRunId: input.workflowRunId,
        agentId: input.agentId,
        taskId: input.taskId,
        action: 'tool.execute',
        toolName: tool.name,
        permissionLevel: tool.permissionLevel,
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: error instanceof Error ? error.message : String(error),
        status: 'failed'
      });
      throw error;
    }
  }
}
