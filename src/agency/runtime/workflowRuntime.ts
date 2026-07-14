import { EventBus } from '../events/eventBus.js';
import type { AgencyEventType } from '../events/eventTypes.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';
import { appendWorkflowTrace } from './workflowStage.js';

const DEFAULT_EXECUTION_LEASE_TTL_MS = 60_000;
const DEFAULT_EXECUTION_HEARTBEAT_MS = 20_000;

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
      state: {
        ...state,
        debugTrace: appendWorkflowTrace(state, { step: 'created', status: 'running', at: timestamp })
      },
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
      const timestamp = nowIso();
      const nextStep = patch.currentStep || run.currentStep;
      const nextStatus = patch.status || run.status;
      const nextState = {
        ...run.state,
        ...(patch.state || {})
      };
      nextState.debugTrace = appendWorkflowTrace(nextState, { step: nextStep, status: nextStatus, at: timestamp });
      Object.assign(run, patch, { state: nextState, updatedAt: timestamp });
      result = run;
    });
    return result!;
  }

  async acquireLease(workflowRunId: string, owner: string, ttlMs = DEFAULT_EXECUTION_LEASE_TTL_MS): Promise<boolean> {
    const committed = await this.store.update(data => {
      const run = data.workflows.find(item => item.id === workflowRunId);
      if (!run) throw new Error(`Workflow run not found: ${workflowRunId}`);
      const leaseOwner = typeof run.state.executionLeaseOwner === 'string' ? run.state.executionLeaseOwner : '';
      const leaseUntil = typeof run.state.executionLeaseUntil === 'string' ? Date.parse(run.state.executionLeaseUntil) : 0;
      if (leaseOwner && leaseOwner !== owner && Number.isFinite(leaseUntil) && leaseUntil > Date.now()) return;
      run.state = {
        ...run.state,
        executionLeaseOwner: owner,
        executionLeaseUntil: new Date(Date.now() + ttlMs).toISOString()
      };
      run.updatedAt = nowIso();
    });
    const run = committed.workflows.find(item => item.id === workflowRunId);
    return run?.state.executionLeaseOwner === owner;
  }

  async renewLease(workflowRunId: string, owner: string, ttlMs = DEFAULT_EXECUTION_LEASE_TTL_MS): Promise<boolean> {
    const committed = await this.store.update(data => {
      const run = data.workflows.find(item => item.id === workflowRunId);
      if (!run || run.state.executionLeaseOwner !== owner) return;
      run.state = {
        ...run.state,
        executionLeaseUntil: new Date(Date.now() + ttlMs).toISOString()
      };
      run.updatedAt = nowIso();
    });
    const run = committed.workflows.find(item => item.id === workflowRunId);
    return run?.state.executionLeaseOwner === owner;
  }

  async releaseLease(workflowRunId: string, owner: string): Promise<void> {
    await this.store.update(data => {
      const run = data.workflows.find(item => item.id === workflowRunId);
      if (!run || run.state.executionLeaseOwner !== owner) return;
      const { executionLeaseOwner: _owner, executionLeaseUntil: _until, ...state } = run.state;
      run.state = state;
      run.updatedAt = nowIso();
    });
  }

  startLeaseHeartbeat(
    workflowRunId: string,
    owner: string,
    intervalMs = DEFAULT_EXECUTION_HEARTBEAT_MS,
    ttlMs = DEFAULT_EXECUTION_LEASE_TTL_MS
  ): () => Promise<void> {
    let pending = Promise.resolve();
    const renew = () => {
      pending = pending
        .then(async () => { await this.renewLease(workflowRunId, owner, ttlMs); })
        .catch(() => undefined);
    };
    const timer = setInterval(renew, intervalMs);
    timer.unref?.();
    return async () => {
      clearInterval(timer);
      await pending;
    };
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
