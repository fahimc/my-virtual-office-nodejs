export type PreviewVersionStatus = 'building' | 'internal_review' | 'published' | 'changes_requested' | 'approved' | 'failed' | 'archived';

export interface PreviewScreenshotSet {
  desktop?: string;
  tablet?: string;
  mobile?: string;
}

export interface PreviewVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  previewUrl: string;
  sourceBranch?: string;
  buildId?: string;
  deploymentProvider: 'local' | 'docker' | 'coolify' | 'caddy' | 'static_export' | 'netlify' | 'vercel';
  screenshots: PreviewScreenshotSet;
  status: PreviewVersionStatus;
  changelog: string[];
  accessToken?: string;
  createdAt: string;
  approvedAt?: string;
}
