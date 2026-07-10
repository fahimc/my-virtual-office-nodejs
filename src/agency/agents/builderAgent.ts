import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const builderAgent: AgentDefinition<{ plan: string; design: string; copy: string }, { files: Array<{ path: string; purpose: string }>; summary: string }> = {
  id: 'builder',
  name: 'Builder Agent',
  role: 'Frontend Builder',
  description: 'Generates or updates site files using the existing component system where possible.',
  allowedTools: ['file.write'],
  memoryScope: 'project',
  inputSchema: '{ plan: string, design: string, copy: string }',
  outputSchema: '{ files: Array<{ path: string, purpose: string }>, summary: string }',
  taskType: 'coding',
  systemPrompt: 'Create modular responsive website implementation plans. Do not deploy live.',
  async execute(input, context) {
    return {
      summary: await agentText(this, JSON.stringify(input), context),
      files: [{ path: 'preview/index.html', purpose: 'Generated preview entry page' }]
    };
  }
};
