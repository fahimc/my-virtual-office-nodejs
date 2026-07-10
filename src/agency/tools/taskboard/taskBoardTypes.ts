export type CompanyTaskStatus =
  | 'backlog'
  | 'ready'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'changes_needed'
  | 'approved'
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

export type CompanyTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CompanyTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: CompanyTaskType;
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
  type: CompanyTaskType;
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
  'changes_needed',
  'approved',
  'done',
  'failed'
];
