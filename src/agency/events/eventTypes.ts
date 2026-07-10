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
  | 'design.discovery.started'
  | 'design.discovery.completed'
  | 'design.brand_audit.started'
  | 'design.brand_audit.completed'
  | 'design.competitor_research.started'
  | 'design.competitor_research.completed'
  | 'design.creative_directions.created'
  | 'design.direction.selected'
  | 'design.sitemap.created'
  | 'design.wireframes.created'
  | 'design.tokens.created'
  | 'design.component_spec.created'
  | 'design.prototype.started'
  | 'design.prototype.created'
  | 'design.mobile_rules.created'
  | 'design.qa.started'
  | 'design.qa.failed'
  | 'design.qa.passed'
  | 'design.approval.requested'
  | 'design.approved'
  | 'design.changes_requested'
  | 'design.handoff.created'
  | 'design.handoff.sent_to_builder'
  | 'design.post_build_review.started'
  | 'design.post_build_review.failed'
  | 'design.post_build_review.passed'
  | 'design.fix_task.created'
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
