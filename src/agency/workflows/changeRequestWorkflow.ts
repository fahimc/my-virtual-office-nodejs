import type { CompanyOS } from '../company/companyOS.js';

export class ChangeRequestWorkflow {
  constructor(private readonly companyOS: CompanyOS) {}

  createChangeTask(projectId: string, feedback: string) {
    return this.companyOS.taskBoard.createTask({
      projectId,
      title: 'Client requested changes',
      description: feedback,
      type: 'coding',
      priority: 'high',
      assignedAgentId: 'builder',
      createdByAgentId: 'client-success',
      input: { feedback }
    });
  }
}
