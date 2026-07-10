export type AgencyEventType =
  | 'customer.new'
  | 'customer.returning'
  | 'customer.details_submitted'
  | 'brief.received'
  | 'brief.structured'
  | 'brief.approved'
  | 'project.created'
  | 'plan.created'
  | 'design.started'
  | 'design.completed'
  | 'copy.started'
  | 'copy.completed'
  | 'build.started'
  | 'build.completed'
  | 'qa.started'
  | 'qa.failed'
  | 'qa.passed'
  | 'preview.created'
  | 'approval.requested'
  | 'approval.approved'
  | 'changes.requested'
  | 'deployment.started'
  | 'deployment.completed'
  | 'project.completed'
  | 'workflow.paused'
  | 'workflow.failed'
  | 'workflow.resumed';

export interface AgencyEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: AgencyEventType;
  workflowRunId?: string;
  projectId?: string;
  customerId?: string;
  agentId?: string;
  payload: TPayload;
  createdAt: string;
}

export type AgencyEventHandler<TPayload = Record<string, unknown>> = (event: AgencyEvent<TPayload>) => void | Promise<void>;
