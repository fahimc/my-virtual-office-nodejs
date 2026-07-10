import { taskBoardColumns, type CompanyTask } from '../tools/taskboard/taskBoardTypes.js';

export function buildTaskBoardState(tasks: CompanyTask[]) {
  return taskBoardColumns.map(status => ({
    status,
    tasks: tasks.filter(task => task.status === status)
  }));
}
