export type VisualFeedbackType =
  | 'design_change'
  | 'copy_change'
  | 'bug'
  | 'mobile_issue'
  | 'content_missing'
  | 'image_change'
  | 'layout_issue'
  | 'general_comment';

export type VisualFeedbackStatus =
  | 'new'
  | 'triaged'
  | 'converted_to_task'
  | 'in_progress'
  | 'fixed'
  | 'rejected'
  | 'needs_clarification'
  | 'approved';

export interface VisualFeedback {
  id: string;
  projectId: string;
  previewVersionId: string;
  customerId: string;
  pageUrl: string;
  viewport: {
    width: number;
    height: number;
  };
  clickPosition: {
    x: number;
    y: number;
  };
  domSelector?: string;
  screenshotUrl?: string;
  comment: string;
  type: VisualFeedbackType;
  status: VisualFeedbackStatus;
  linkedTaskId?: string;
  assignedAgentId?: string;
  comments?: Array<{ id: string; senderType: 'customer' | 'agency' | 'agent' | 'system'; body: string; createdAt: string }>;
  createdAt: string;
  resolvedAt?: string;
}
