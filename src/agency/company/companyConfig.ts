export interface CompanyConfig {
  defaultRepoPath: string;
  defaultBaseBranch: string;
  previewProvider: 'local' | 'netlify' | 'vercel' | 'coolify' | 'static';
  deploymentProvider: 'netlify' | 'vercel' | 'coolify' | 'static' | 'local';
}

export function companyConfigFromEnv(workspaceRoot: string): CompanyConfig {
  return {
    defaultRepoPath: process.env.AGENCY_REPO_PATH || workspaceRoot,
    defaultBaseBranch: process.env.AGENCY_BASE_BRANCH || 'main',
    previewProvider: (process.env.AGENCY_PREVIEW_PROVIDER || 'local') as CompanyConfig['previewProvider'],
    deploymentProvider: (process.env.AGENCY_DEPLOYMENT_PROVIDER || 'netlify') as CompanyConfig['deploymentProvider']
  };
}
