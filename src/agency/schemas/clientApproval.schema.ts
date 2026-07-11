export type ClientApprovalType =
  | 'design_direction'
  | 'design_concept'
  | 'preview'
  | 'change_request'
  | 'launch'
  | 'email'
  | 'domain'
  | 'hosting'
  | 'final_delivery';

export type ClientApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'expired' | 'cancelled';

export interface ClientApproval {
  id: string;
  projectId: string;
  customerId: string;
  type: ClientApprovalType;
  title: string;
  description: string;
  versionId?: string;
  artifactIds: string[];
  previewVersionId?: string;
  designVersionId?: string;
  relatedInternalApprovalId?: string;
  status: ClientApprovalStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  decisionNote?: string;
  ipAddressHash?: string;
  userAgent?: string;
  approvedSnapshot?: Record<string, unknown>;
}
