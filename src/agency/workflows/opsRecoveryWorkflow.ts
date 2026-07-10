import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { ResumeService } from '../runtime/resumeService.js';

export class OpsRecoveryWorkflow {
  constructor(
    private readonly agents: AgentRuntime,
    private readonly resumeService: ResumeService
  ) {}

  async resume(workflowRunId: string, issue: string) {
    await this.agents.execute('ops', { issue }, { workflowRunId });
    await this.resumeService.resume(workflowRunId);
  }
}
