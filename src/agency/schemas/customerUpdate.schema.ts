export type CustomerUpdateType =
  | 'progress'
  | 'design_ready'
  | 'preview_ready'
  | 'approval_needed'
  | 'changes_received'
  | 'launch_ready'
  | 'launched'
  | 'issue'
  | 'file_uploaded'
  | 'message';

export interface UpdateFeedItem {
  id: string;
  projectId: string;
  customerId: string;
  title: string;
  message: string;
  type: CustomerUpdateType;
  sourceInternalEvents: string[];
  visibleToCustomer: boolean;
  createdByAgentId: string;
  createdAt: string;
  readAt?: string;
}
