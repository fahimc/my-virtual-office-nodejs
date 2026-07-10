import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const builderAgent: AgentDefinition<{ plan: string; design: string; copy: string }, { files: Array<{ path: string; purpose: string }>; summary: string }> = {
  id: 'builder',
  name: 'Builder Agent',
  role: 'Frontend Builder',
  description: 'Generates or updates site files using the approved design handoff, existing component systems, reusable sections, and Codex coding tasks.',
  allowedTools: ['file.write'],
  memoryScope: 'project',
  inputSchema: '{ plan: string, design: string, copy: string }',
  outputSchema: '{ files: Array<{ path: string, purpose: string }>, summary: string }',
  taskType: 'coding',
  systemPrompt: 'Inspect the existing UI/component system before implementation. Prefer existing components, internal design systems, approved templates, and reusable sections before custom code. Apply Designer Agent tokens and handoff decisions. Do not install or mix UI libraries without approval. Do not deploy live.',
  async execute(input, context) {
    return {
      summary: await agentText(this, JSON.stringify(input), context),
      files: [{ path: 'preview/index.html', purpose: 'Generated preview entry page' }]
    };
  }
};
