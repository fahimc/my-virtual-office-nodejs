import path from 'node:path';
import { getAgencySystem } from '../../dist/agency/api/agencySystemSingleton.js';

const APP_DIR = process.env.LAMBDA_TASK_ROOT || process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.join('/tmp', 'my-virtual-office-nodejs-data');

export default async function agencyImagery(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    projectId?: unknown;
    directionId?: unknown;
    mode?: unknown;
    count?: unknown;
    force?: unknown;
  };
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) throw new Error('projectId is required');

  const system = getAgencySystem({ dataDir: DATA_DIR, workspaceRoot: APP_DIR });
  const data = await system.store.read();
  const designBrief = data.design.briefs.filter(item => item.projectId === projectId).at(-1);
  const selected = data.design.selectedDirections.filter(item => item.projectId === projectId).at(-1);
  const directions = data.design.creativeDirections.filter(item => item.projectId === projectId);
  const requestedDirectionId = typeof body.directionId === 'string' ? body.directionId : selected?.selectedDirectionId;
  const direction = directions.find(item => item.id === requestedDirectionId) || directions[0];
  if (!designBrief || !direction) throw new Error(`Design brief and creative direction are required for ${projectId}`);

  const mode = body.mode === 'draft' || body.mode === 'premium' ? body.mode : 'standard';
  const count = Math.max(3, Math.min(Number(body.count || 5), 8));
  console.log(`[agency-imagery] starting ${projectId} with ${direction.id}`);
  const plan = await system.companyOS.imagery.generateWebsiteImagery({
    projectId,
    customerId: designBrief.customerId,
    designBrief,
    direction,
    mode,
    count,
    provider: 'openai',
    force: body.force === true
  });
  console.log(`[agency-imagery] finished ${projectId} with ${plan.status} via ${plan.provider}`);
}

export const config = {
  background: true,
  method: 'POST'
};
