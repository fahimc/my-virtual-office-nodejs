export type DeploymentStatus = 'prepared' | 'approval_requested' | 'deploying' | 'completed' | 'failed' | 'cancelled';

export interface PreviewRecord {
  id: string;
  projectId: string;
  url: string;
  provider: 'local' | 'netlify' | 'vercel' | 'coolify' | 'static';
  screenshotPaths: string[];
  createdByAgentId: string;
  createdAt: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  provider: 'netlify' | 'vercel' | 'coolify' | 'static' | 'local';
  target: string;
  status: DeploymentStatus;
  approvalId?: string;
  liveUrl?: string;
  createdByAgentId: string;
  createdAt: string;
  updatedAt: string;
}
