export const AGENCY_APP_VERSION = '1.1.6';

export function getAgencyBuildInfo() {
  const serverless = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY === 'true');
  return {
    version: AGENCY_APP_VERSION,
    commit: String(process.env.COMMIT_REF || process.env.GITHUB_SHA || (serverless ? 'netlify' : 'local')).slice(0, 8),
    deployId: String(process.env.DEPLOY_ID || process.env.BUILD_ID || (serverless ? 'managed' : 'local')),
    context: String(process.env.CONTEXT || process.env.NODE_ENV || (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'production' : 'development')),
    runtime: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'netlify-function' : 'node',
    storage: serverless ? 'netlify-blobs' : 'local-json'
  };
}
