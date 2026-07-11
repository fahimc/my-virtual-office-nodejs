export type CompanyTaskStatus =
  | 'not_started'
  | 'backlog'
  | 'ready'
  | 'assigned'
  | 'in_progress'
  | 'researching'
  | 'drafting'
  | 'reviewing'
  | 'needs_revision'
  | 'blocked'
  | 'review'
  | 'changes_needed'
  | 'approved'
  | 'handed_off'
  | 'completed'
  | 'done'
  | 'failed'
  | 'cancelled';

export type CompanyTaskType =
  | 'intake'
  | 'brief'
  | 'planning'
  | 'design'
  | 'copy'
  | 'coding'
  | 'qa'
  | 'preview'
  | 'deployment'
  | 'email'
  | 'research'
  | 'admin'
  | 'finance'
  | 'support';
export type CustomerFeedbackTaskType =
  | 'copy_fix'
  | 'bug_fix'
  | 'responsive_fix'
  | 'content_task'
  | 'asset_task'
  | 'frontend_fix';
export type DesignTaskType =
  | 'design_discovery'
  | 'brand_audit'
  | 'competitor_research'
  | 'creative_direction'
  | 'sitemap'
  | 'wireframe'
  | 'design_tokens'
  | 'component_system'
  | 'prototype'
  | 'imagery_generation'
  | 'mobile_design'
  | 'design_qa'
  | 'brand_guidelines'
  | 'design_approval'
  | 'builder_handoff'
  | 'post_build_design_qa'
  | 'design_fix';

export type DeveloperTaskType =
  | 'design_system_inspection'
  | 'component_library_inspection'
  | 'template_selection'
  | 'design_token_mapping'
  | 'component_creation'
  | 'component_adaptation'
  | 'section_template_creation'
  | 'template_customisation'
  | 'storybook_update'
  | 'accessibility_component_pass'
  | 'responsive_component_pass';

export type AnyCompanyTaskType = CompanyTaskType | DesignTaskType | DeveloperTaskType | CustomerFeedbackTaskType;

export type CompanyTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CompanyTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: AnyCompanyTaskType;
  status: CompanyTaskStatus;
  priority: CompanyTaskPriority;
  assignedAgentId?: string;
  dependencies: string[];
  createdByAgentId: string;
  sourceEventId?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  artifacts: string[];
  approvalRequired: boolean;
  approvalId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CompanyTaskCreateInput {
  projectId: string;
  title: string;
  description: string;
  type: AnyCompanyTaskType;
  priority?: CompanyTaskPriority;
  assignedAgentId?: string;
  dependencies?: string[];
  createdByAgentId: string;
  sourceEventId?: string;
  input?: Record<string, unknown>;
  approvalRequired?: boolean;
}

export const taskBoardColumns: CompanyTaskStatus[] = [
  'backlog',
  'ready',
  'assigned',
  'in_progress',
  'blocked',
  'review',
  'reviewing',
  'needs_revision',
  'changes_needed',
  'approved',
  'handed_off',
  'done',
  'completed',
  'failed'
];
