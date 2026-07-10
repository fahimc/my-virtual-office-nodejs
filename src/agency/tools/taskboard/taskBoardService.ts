import type { CompanyTaskCreateInput } from './taskBoardTypes.js';
import { TaskBoardStore } from './taskBoardStore.js';

export class TaskBoardService {
  constructor(private readonly store: TaskBoardStore) {}

  createTask(input: CompanyTaskCreateInput) {
    return this.store.create(input);
  }

  listTasks(projectId?: string) {
    return this.store.list(projectId);
  }

  updateTask(id: string, patch: Parameters<TaskBoardStore['update']>[1]) {
    return this.store.update(id, patch);
  }

  async claimTask(id: string, assignedAgentId: string) {
    return this.store.update(id, { assignedAgentId, status: 'in_progress' });
  }

  async completeTask(id: string, output: Record<string, unknown> = {}, artifacts: string[] = []) {
    return this.store.update(id, { output, artifacts, status: 'done' });
  }
}
