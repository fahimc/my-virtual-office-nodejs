export const AGENCY_APP_VERSION = '1.1.4';

export function getAgencyBuildInfo() {
  return {
    version: AGENCY_APP_VERSION,
    commit: String(process.env.COMMIT_REF || process.env.GITHUB_SHA || 'local').slice(0, 8),
    deployId: String(process.env.DEPLOY_ID || process.env.BUILD_ID || 'local'),
    context: String(process.env.CONTEXT || process.env.NODE_ENV || (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'production' : 'development')),
    runtime: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'netlify-function' : 'node',
    storage: process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY === 'true' ? 'netlify-blobs' : 'local-json'
  };
}
