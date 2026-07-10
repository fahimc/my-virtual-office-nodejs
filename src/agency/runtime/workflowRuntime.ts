import { EventBus } from '../events/eventBus.js';
import type { AgencyEventType } from '../events/eventTypes.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';

export class WorkflowRuntime {
  constructor(
    private readonly store: MemoryStore,
    private readonly eventBus: EventBus
  ) {}

  async create(workflowName: string, state: Record<string, unknown>, projectId?: string): Promise<WorkflowRun> {
    const timestamp = nowIso();
    const run: WorkflowRun = {
      id: createId('workflow'),
      projectId,
      workflowName,
      status: 'running',
      currentStep: 'created',
      state,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.store.update(data => {
      data.workflows.push(run);
    });
    return run;
  }

  async get(workflowRunId: string): Promise<WorkflowRun | undefined> {
    const data = await this.store.read();
    return data.workflows.find(run => run.id === workflowRunId);
  }

  async patch(workflowRunId: string, patch: Partial<WorkflowRun>): Promise<WorkflowRun> {
    let result: WorkflowRun | undefined;
    await this.store.update(data => {
      const run = data.workflows.find(item => item.id === workflowRunId);
      if (!run) throw new Error(`Workflow run not found: ${workflowRunId}`);
      Object.assign(run, patch, { updatedAt: nowIso() });
      result = run;
    });
    return result!;
  }

  async emit(run: WorkflowRun, type: AgencyEventType, payload: Record<string, unknown>): Promise<void> {
    await this.eventBus.emit({
      type,
      workflowRunId: run.id,
      projectId: run.projectId,
      payload
    });
  }
}
