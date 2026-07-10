import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { ToolDefinition } from '../toolTypes.js';
import { defaultCodexConfig } from './codexConfig.js';
import { createCodexBranchName, type CodexResult, type CodexRunInput, type CodexTask } from './codexTaskAdapter.js';
import { CodexExecRunner } from './codexExecRunner.js';

export class CodexToolService {
  constructor(
    private readonly store: MemoryStore,
    private readonly runner = new CodexExecRunner()
  ) {}

  async run(input: CodexRunInput): Promise<{ task: CodexTask; result: CodexResult }> {
    const timestamp = nowIso();
    const task: CodexTask = {
      id: createId('codex-task'),
      projectId: input.projectId,
      repoPath: input.repoPath,
      branchName: input.branchName || createCodexBranchName(input.projectId, input.taskTitle),
      taskTitle: input.taskTitle,
      taskPrompt: this.withAgencyInstructions(input),
      taskMode: input.taskMode,
      implementationPlanId: input.implementationPlan?.id,
      allowedCommands: defaultCodexConfig.allowedCommands,
      disallowedCommands: defaultCodexConfig.disallowedCommands,
      maxRuntimeMs: defaultCodexConfig.defaultRuntimeMs,
      status: 'running',
      changedFiles: [],
      testResults: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.store.update(data => {
      data.codexTasks.push(task);
    });
    const result = await this.runner.run(task);
    await this.store.update(data => {
      const saved = data.codexTasks.find(item => item.id === task.id);
      if (!saved) return;
      saved.status = result.status === 'failed' ? 'failed' : 'completed';
      saved.resultSummary = result.summary;
      saved.changedFiles = result.changedFiles;
      saved.testResults = [...result.testsRun, result.buildResult].filter(Boolean);
      saved.error = result.error;
      saved.updatedAt = nowIso();
    });
    return { task: { ...task, status: result.status === 'failed' ? 'failed' : 'completed' }, result };
  }

  async status(taskId: string): Promise<CodexTask | undefined> {
    const data = await this.store.read();
    return data.codexTasks.find(task => task.id === taskId);
  }

  async cancel(taskId: string): Promise<CodexTask> {
    let result: CodexTask | undefined;
    await this.store.update(data => {
      const task = data.codexTasks.find(item => item.id === taskId);
      if (!task) throw new Error(`Codex task not found: ${taskId}`);
      task.status = 'cancelled';
      task.updatedAt = nowIso();
      result = task;
    });
    return result!;
  }

  private withAgencyInstructions(input: CodexRunInput): string {
    const plan = input.implementationPlan;
    return [
      'Follow project AGENTS.md instructions when present.',
      'Create or use a feature branch. Never push to main. Never deploy live. Never delete important files without approval.',
      `Codex task mode: ${input.taskMode || 'build_page_from_template'}.`,
      'Before creating new UI, inspect existing components, sections, templates, design-system files, and package dependencies.',
      'Do not create duplicate components when a suitable one already exists.',
      'Do not install a new component library without explicit approval.',
      'Do not mix UI libraries unless the implementation plan explicitly requires it.',
      'Use the Designer Agent handoff and design tokens as the source of truth. Do not bypass or invent around them.',
      'Prefer reusable primitives and section components over one large page file.',
      plan ? [
        'Implementation plan:',
        `- Design system detected: ${plan.designSystemDetected}`,
        `- Component library detected: ${plan.componentLibraryDetected.join(', ')}`,
        `- Styling system detected: ${plan.stylingSystemDetected}`,
        `- Template selected: ${plan.templateSelected}`,
        `- Template reason: ${plan.templateReason}`,
        `- Reusable components found: ${plan.reusableComponentsFound.join(', ') || 'none'}`,
        `- Components to create: ${plan.componentsToCreate.join(', ')}`,
        `- Components to modify: ${plan.componentsToModify.join(', ') || 'none'}`,
        `- Sections to create: ${plan.sectionsToCreate.join(', ')}`,
        `- Design tokens to apply: ${plan.designTokensToApply.join(', ')}`,
        `- Accessibility strategy: ${plan.accessibilityStrategy}`,
        `- Responsive strategy: ${plan.responsiveStrategy}`,
        `- Files to avoid: ${plan.filesToAvoid.join(', ')}`
      ].join('\n') : '',
      input.taskPrompt
    ].join('\n\n');
  }
}

export function createCodexTool(service: CodexToolService): ToolDefinition<CodexRunInput & { agentId?: string }, { task: CodexTask; result: CodexResult }> {
  return {
    name: 'codex.run_coding_task',
    description: 'Run a focused coding task through Codex in a controlled repo directory.',
    inputSchema: 'CodexRunInput',
    outputSchema: 'CodexResult',
    permissionLevel: 'write',
    approvalRequired: false,
    execute: input => service.run(input)
  };
}
