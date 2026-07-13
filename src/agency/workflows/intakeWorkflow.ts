import type { Customer, CustomerCreateInput } from '../schemas/customer.schema.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
import type { CustomerMemory } from '../memory/customerMemory.js';
import type { ProjectMemory } from '../memory/projectMemory.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { AgentRuntime } from '../runtime/agentRuntime.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';

export class IntakeWorkflow {
  constructor(
    private readonly store: MemoryStore,
    private readonly customerMemory: CustomerMemory,
    private readonly projectMemory: ProjectMemory,
    private readonly agentRuntime: AgentRuntime,
    private readonly workflowRuntime: WorkflowRuntime
  ) {}

  async start(): Promise<{ workflowRunId: string; step: string; question: string }> {
    const run = await this.workflowRuntime.create('intakeWorkflow', {
      stage: 'ask_customer_type',
      waitingForUser: true
    });
    await this.workflowRuntime.patch(run.id, { status: 'waiting_for_user', currentStep: 'ask_customer_type' });
    return {
      workflowRunId: run.id,
      step: 'ask_customer_type',
      question: 'Welcome to the agency. Are you a new customer or a returning customer?'
    };
  }

  async lookupCustomer(email: string, returning: boolean) {
    const customer = await this.customerMemory.findByEmail(email);
    const projects = customer ? await this.customerMemory.projectsForCustomer(customer.id) : [];
    return { customer, projects, eventType: returning && customer ? 'customer.returning' : 'customer.new' };
  }

  async createCustomer(input: CustomerCreateInput) {
    const customer = await this.customerMemory.create(input);
    await this.store.update(data => {
      data.tasks.push({
        id: createId('task'),
        projectId: 'intake',
        agentId: 'reception',
        title: 'Customer details submitted',
        description: `Saved customer details for ${customer.email}`,
        status: 'completed',
        input,
        output: customer,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    });
    return customer;
  }

  async structureBrief(customerId: string, originalBrief: string, workflowRunId?: string, customer?: Customer): Promise<{ structuredBrief: StructuredBrief; workflowRunId: string }> {
    await this.ensureCustomerRecord(customer);
    const run = workflowRunId
      ? await this.workflowRuntime.get(workflowRunId) || await this.createRecoveredRun(customerId, originalBrief, undefined, workflowRunId)
      : await this.workflowRuntime.create('intakeWorkflow', {}, undefined);
    await this.workflowRuntime.patch(run.id, {
      status: 'running',
      currentStep: 'brief_structuring',
      state: { ...run.state, customerId, originalBrief }
    });
    await this.workflowRuntime.emit(run, 'brief.received', { customerId, originalBrief });
    const structuredBrief = await this.agentRuntime.execute<{ originalBrief: string }, StructuredBrief>('brief', { originalBrief }, { workflowRunId: run.id });
    await this.workflowRuntime.patch(run.id, {
      status: 'waiting_for_user',
      currentStep: 'brief_approval',
      state: { ...run.state, customerId, originalBrief, structuredBrief, waitingForUser: true }
    });
    await this.workflowRuntime.emit(run, 'brief.structured', { customerId, structuredBrief });
    return { structuredBrief, workflowRunId: run.id };
  }

  async approveBrief(workflowRunId: string, structuredBrief?: StructuredBrief, recovery?: { customerId?: string; originalBrief?: string; customer?: Customer }) {
    await this.ensureCustomerRecord(recovery?.customer);
    const run = await this.workflowRuntime.get(workflowRunId) || await this.createRecoveredRun(
      String(recovery?.customerId || ''),
      String(recovery?.originalBrief || ''),
      structuredBrief,
      workflowRunId
    );
    const customerId = String(run.state.customerId || '');
    const originalBrief = String(run.state.originalBrief || '');
    const approvedBrief = structuredBrief || run.state.structuredBrief as StructuredBrief;
    const project = await this.projectMemory.create(customerId, originalBrief, approvedBrief);
    await this.projectMemory.update(project.id, { currentWorkflowRunId: run.id });
    await this.workflowRuntime.patch(run.id, {
      projectId: project.id,
      status: 'completed',
      currentStep: 'brief_approved',
      state: { ...run.state, structuredBrief: approvedBrief, projectId: project.id }
    });
    await this.workflowRuntime.emit({ ...run, projectId: project.id }, 'brief.approved', { structuredBrief: approvedBrief });
    await this.workflowRuntime.emit({ ...run, projectId: project.id }, 'project.created', { project });
    return project;
  }

  private async createRecoveredRun(customerId: string, originalBrief: string, structuredBrief?: StructuredBrief, previousWorkflowRunId?: string) {
    const run = await this.workflowRuntime.create('intakeWorkflow', {
      stage: structuredBrief ? 'brief_approval_recovered' : 'brief_submit_recovered',
      waitingForUser: Boolean(structuredBrief),
      customerId,
      originalBrief,
      structuredBrief,
      recoveredFromWorkflowRunId: previousWorkflowRunId
    });
    await this.workflowRuntime.patch(run.id, {
      status: structuredBrief ? 'waiting_for_user' : 'running',
      currentStep: structuredBrief ? 'brief_approval' : 'brief_structuring',
      state: {
        ...run.state,
        customerId,
        originalBrief,
        structuredBrief
      }
    });
    return run;
  }

  private async ensureCustomerRecord(customer?: Customer): Promise<void> {
    if (!customer?.id || !customer.email) return;
    await this.store.update(data => {
      const existing = data.customers.find(item => item.id === customer.id || item.email.toLowerCase() === customer.email.toLowerCase());
      if (existing) {
        Object.assign(existing, customer, { updatedAt: nowIso() });
        return;
      }
      data.customers.push({
        ...customer,
        email: customer.email.toLowerCase(),
        createdAt: customer.createdAt || nowIso(),
        updatedAt: nowIso()
      });
    });
  }
}
