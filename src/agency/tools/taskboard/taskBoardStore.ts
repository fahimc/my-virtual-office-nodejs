import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { CompanyTask, CompanyTaskCreateInput, CompanyTaskStatus } from './taskBoardTypes.js';

export class TaskBoardStore {
  constructor(private readonly store: MemoryStore) {}

  async create(input: CompanyTaskCreateInput): Promise<CompanyTask> {
    const timestamp = nowIso();
    const task: CompanyTask = {
      id: createId('company-task'),
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.assignedAgentId ? 'assigned' : 'ready',
      priority: input.priority || 'normal',
      assignedAgentId: input.assignedAgentId,
      dependencies: input.dependencies || [],
      createdByAgentId: input.createdByAgentId,
      sourceEventId: input.sourceEventId,
      input: input.input || {},
      artifacts: [],
      approvalRequired: Boolean(input.approvalRequired),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.store.update(data => {
      data.companyTasks.push(task);
    });
    return task;
  }

  async list(projectId?: string): Promise<CompanyTask[]> {
    const data = await this.store.read();
    return data.companyTasks.filter(task => !projectId || task.projectId === projectId);
  }

  async get(id: string): Promise<CompanyTask | undefined> {
    const data = await this.store.read();
    return data.companyTasks.find(task => task.id === id);
  }

  async update(id: string, patch: Partial<CompanyTask>): Promise<CompanyTask> {
    let result: CompanyTask | undefined;
    await this.store.update(data => {
      const task = data.companyTasks.find(item => item.id === id);
      if (!task) throw new Error(`Company task not found: ${id}`);
      Object.assign(task, patch, { updatedAt: nowIso() });
      if (patch.status === 'done' || patch.status === 'approved') task.completedAt = task.completedAt || nowIso();
      result = task;
    });
    return result!;
  }

  async byStatus(projectId: string, status: CompanyTaskStatus): Promise<CompanyTask[]> {
    return (await this.list(projectId)).filter(task => task.status === status);
  }
}
