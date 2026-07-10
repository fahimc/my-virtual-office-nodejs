import { createId, nowIso, type MemoryStore } from '../../memory/memoryStore.js';
import type { ToolDefinition } from '../toolTypes.js';

export function createCompanyDeploymentTool(store: MemoryStore): ToolDefinition<{ action: 'prepare' | 'deploy_live'; projectId: string; provider?: 'netlify' | 'vercel' | 'coolify' | 'static' | 'local'; agentId?: string }, unknown> {
  return {
    name: 'deployment.company',
    description: 'Prepare deployment targets and deploy live only after approval.',
    inputSchema: 'Deployment company action',
    outputSchema: 'Deployment action result',
    permissionLevel: 'dangerous',
    approvalRequired: false,
    async execute(input) {
      const timestamp = nowIso();
      if (input.action === 'prepare') {
        const deployment = {
          id: createId('deployment'),
          projectId: input.projectId,
          provider: input.provider || 'netlify',
          target: input.provider || 'netlify',
          status: 'prepared' as const,
          createdByAgentId: input.agentId || 'delivery',
          createdAt: timestamp,
          updatedAt: timestamp
        };
        await store.update(data => { data.deployments.push(deployment); });
        return deployment;
      }
      throw new Error('Live deployment must use the deployment approval endpoint.');
    }
  };
}
