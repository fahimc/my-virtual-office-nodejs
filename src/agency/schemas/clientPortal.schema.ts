import type { Customer } from './customer.schema.js';
import type { Project } from './project.schema.js';
import type { UpdateFeedItem } from './customerUpdate.schema.js';
import type { VisualFeedback } from './visualFeedback.schema.js';
import type { PreviewVersion } from './previewVersion.schema.js';
import type { ClientApproval } from './clientApproval.schema.js';
import type { CustomerFile } from './customerFile.schema.js';
import type { ClientMessage } from './clientMessage.schema.js';

export type CustomerTimelineStage =
  | 'Brief received'
  | 'Design direction'
  | 'Website build'
  | 'Internal review'
  | 'Preview ready'
  | 'Changes'
  | 'Final approval'
  | 'Launch';

export interface CustomerTimelineItem {
  label: CustomerTimelineStage;
  status: 'complete' | 'current' | 'upcoming' | 'blocked';
  description: string;
}

export interface ClientPortalProjectSummary {
  projectId: string;
  customerId: string;
  title: string;
  currentStage: CustomerTimelineStage;
  nextAction: string;
  previewStatus: string;
  designStatus: string;
  approvalStatus: string;
  updatedAt: string;
}

export interface ClientPortalProjectState {
  project: Project;
  customer: Customer;
  summary: ClientPortalProjectSummary;
  timeline: CustomerTimelineItem[];
  latestUpdate?: UpdateFeedItem;
  updates: UpdateFeedItem[];
  design: Record<string, unknown>;
  previews: PreviewVersion[];
  currentPreview?: PreviewVersion;
  approvals: ClientApproval[];
  feedback: VisualFeedback[];
  files: CustomerFile[];
  messages: ClientMessage[];
}
