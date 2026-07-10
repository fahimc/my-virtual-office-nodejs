import { AuditLogger } from '../audit/auditLog.js';
import { ApprovalService } from '../approvals/approvalService.js';
import type { ToolDefinition, ToolExecutionContext } from '../tools/toolTypes.js';
import { PermissionPolicy } from './permissionPolicy.js';
import { BudgetPolicy } from './budgetPolicy.js';

export class ToolExecutionRuntime {
  constructor(
    private readonly approvalService: ApprovalService,
    private readonly auditLog: AuditLogger,
    private readonly permissionPolicy = new PermissionPolicy(),
    private readonly budgetPolicy = new BudgetPolicy()
  ) {}

  async execute<TInput extends ToolExecutionContext & { estimatedCostUsd?: number }, TOutput>(
    tool: ToolDefinition<TInput, TOutput>,
    input: TInput
  ): Promise<TOutput> {
    this.permissionPolicy.assertToolAllowed(tool, input.agentId);
    this.budgetPolicy.assertWithinBudget(input);
    await this.auditLog.log({
      projectId: input.projectId,
      customerId: input.customerId,
      workflowRunId: input.workflowRunId,
      agentId: input.agentId,
      taskId: input.taskId,
      toolName: tool.name,
      permissionLevel: tool.permissionLevel,
      action: 'company.tool.execute',
      inputSummary: JSON.stringify(input).slice(0, 500),
      status: 'started'
    });
    if (tool.approvalRequired && tool.approvalType && input.projectId) {
      await this.approvalService.assertApproved(input.projectId, tool.approvalType, { ...(input as Record<string, unknown>), toolName: tool.name });
    }
    try {
      const output = await tool.execute(input, input);
      await this.auditLog.log({
        projectId: input.projectId,
        customerId: input.customerId,
        workflowRunId: input.workflowRunId,
        agentId: input.agentId,
        taskId: input.taskId,
        toolName: tool.name,
        permissionLevel: tool.permissionLevel,
        action: 'company.tool.execute',
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: JSON.stringify(output).slice(0, 500),
        status: 'completed'
      });
      return output;
    } catch (error) {
      await this.auditLog.log({
        projectId: input.projectId,
        customerId: input.customerId,
        workflowRunId: input.workflowRunId,
        agentId: input.agentId,
        taskId: input.taskId,
        toolName: tool.name,
        permissionLevel: tool.permissionLevel,
        action: 'company.tool.execute',
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: error instanceof Error ? error.message : String(error),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
