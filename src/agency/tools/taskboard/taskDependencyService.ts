import type { CompanyTask } from './taskBoardTypes.js';

export class TaskDependencyService {
  readyTasks(tasks: CompanyTask[]): CompanyTask[] {
    const completed = new Set(tasks.filter(task => task.status === 'done' || task.status === 'approved').map(task => task.id));
    return tasks.filter(task => task.status === 'ready' && task.dependencies.every(id => completed.has(id)));
  }
}
