import type { StructuredBrief } from './brief.schema.js';

export type ProjectStatus =
  | 'intake'
  | 'briefing'
  | 'planning'
  | 'design'
  | 'copy'
  | 'build'
  | 'qa'
  | 'preview'
  | 'awaiting_approval'
  | 'changes_requested'
  | 'deployment_pending'
  | 'completed'
  | 'paused'
  | 'failed';

export interface Project {
  id: string;
  customerId: string;
  status: ProjectStatus;
  title: string;
  originalBrief: string;
  structuredBrief?: StructuredBrief;
  currentWorkflowRunId?: string;
  previewUrl?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
}
