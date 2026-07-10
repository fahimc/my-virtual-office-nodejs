import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const clientSuccessAgent: AgentDefinition<{ projectStatus: string }, { message: string }> = {
  id: 'client-success',
  name: 'Client Success Agent',
  role: 'Client Success Manager',
  description: 'Creates status summaries and change-request summaries. Can draft emails but cannot send without approval.',
  allowedTools: ['email.send_external'],
  memoryScope: 'customer',
  inputSchema: '{ projectStatus: string }',
  outputSchema: '{ message: string }',
  taskType: 'client_message',
  systemPrompt: 'Create client-friendly status updates. Never send external email without approval.',
  async execute(input, context) {
    return { message: await agentText(this, input.projectStatus, context) };
  }
};
