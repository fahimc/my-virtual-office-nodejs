import path from 'node:path';
import { getAgencySystem } from '../../dist/agency/api/agencySystemSingleton.js';

const APP_DIR = process.env.LAMBDA_TASK_ROOT || process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.join('/tmp', 'my-virtual-office-nodejs-data');

export default async function agencyWorkflow(request: Request) {
  const body = await request.json().catch(() => ({})) as { workflowRunId?: unknown };
  const workflowRunId = typeof body.workflowRunId === 'string' ? body.workflowRunId.trim() : '';
  if (!workflowRunId) throw new Error('workflowRunId is required');
  const system = getAgencySystem({ dataDir: DATA_DIR, workspaceRoot: APP_DIR });
  const run = await system.workflowRuntime.get(workflowRunId);
  if (!run || run.workflowName !== 'websiteBuildWorkflow') {
    throw new Error(`Website build workflow not found: ${workflowRunId}`);
  }
  console.log(`[agency-workflow] starting ${workflowRunId} at ${run.currentStep}`);
  await system.websiteBuildWorkflow.runUntilPreview(workflowRunId);
  const completed = await system.workflowRuntime.get(workflowRunId);
  console.log(`[agency-workflow] finished ${workflowRunId} at ${completed?.currentStep || 'missing'} (${completed?.status || 'missing'})`);
}

export const config = {
  background: true,
  method: 'POST'
};
