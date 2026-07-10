import type { ApprovalType } from '../schemas/approval.schema.js';
import { ApprovalService } from '../approvals/approvalService.js';
import { AuditLogger } from '../audit/auditLog.js';

export type ToolPermissionLevel = 'safe' | 'write' | 'external' | 'dangerous';

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  permissionLevel: ToolPermissionLevel;
  approvalType?: ApprovalType;
  approvalRequired: boolean;
  execute(input: TInput): Promise<TOutput>;
}

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

  async execute<TInput, TOutput>(name: string, input: TInput & { projectId?: string; agentId?: string }): Promise<TOutput> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not registered: ${name}`);
    await this.auditLog.log({
      projectId: input.projectId,
      agentId: input.agentId,
      action: 'tool.execute',
      toolName: tool.name,
      inputSummary: JSON.stringify(input).slice(0, 500),
      status: 'started'
    });
    if (tool.approvalRequired && tool.approvalType && input.projectId) {
      await this.approvalService.assertApproved(input.projectId, tool.approvalType, { ...input, toolName: tool.name });
    }
    try {
      const output = await tool.execute(input) as TOutput;
      await this.auditLog.log({
        projectId: input.projectId,
        agentId: input.agentId,
        action: 'tool.execute',
        toolName: tool.name,
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: JSON.stringify(output).slice(0, 500),
        status: 'completed'
      });
      return output;
    } catch (error) {
      await this.auditLog.log({
        projectId: input.projectId,
        agentId: input.agentId,
        action: 'tool.execute',
        toolName: tool.name,
        inputSummary: JSON.stringify(input).slice(0, 500),
        outputSummary: error instanceof Error ? error.message : String(error),
        status: 'failed'
      });
      throw error;
    }
  }
}
