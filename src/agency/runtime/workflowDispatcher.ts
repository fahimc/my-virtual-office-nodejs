export interface WorkflowDispatchResult {
  mode: 'netlify-background';
  endpoint: string;
  responseStatus: number;
  acceptedAt: string;
}

export async function dispatchWebsiteBuildInBackground(workflowRunId: string): Promise<WorkflowDispatchResult | undefined> {
  if (!isNetlifyProductionRuntime()) return undefined;
  const baseUrl = process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL || process.env.URL;
  if (!baseUrl) throw new Error('Netlify background workflow URL is unavailable');
  const endpoint = new URL('/.netlify/functions/agency-workflow', baseUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ workflowRunId })
  });
  if (response.status !== 202 && !response.ok) {
    throw new Error(`Netlify background workflow dispatch failed: ${response.status} ${await response.text()}`);
  }
  return {
    mode: 'netlify-background',
    endpoint: endpoint.pathname,
    responseStatus: response.status,
    acceptedAt: new Date().toISOString()
  };
}

function isNetlifyProductionRuntime(): boolean {
  return (process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME))
    && process.env.NETLIFY_DEV !== 'true'
    && process.env.CONTEXT !== 'dev';
}
