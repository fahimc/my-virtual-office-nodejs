import type { CompanyTaskType } from './taskBoardTypes.js';

const defaultAgentByTaskType: Record<CompanyTaskType, string> = {
  intake: 'reception',
  brief: 'brief',
  planning: 'planner',
  design: 'design',
  copy: 'copy',
  coding: 'builder',
  qa: 'qa',
  preview: 'delivery',
  deployment: 'delivery',
  email: 'client-success',
  research: 'planner',
  admin: 'ops',
  finance: 'finance',
  support: 'client-success'
};

export class TaskAssignmentService {
  assignForType(type: CompanyTaskType): string {
    return defaultAgentByTaskType[type];
  }
}
