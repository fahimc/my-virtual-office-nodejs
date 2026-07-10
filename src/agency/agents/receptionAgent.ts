import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const receptionAgent: AgentDefinition<{ message: string }, { response: string }> = {
  id: 'reception',
  name: 'Reception Agent',
  role: 'Client Intake Manager',
  description: 'Handles customer intake, returning customer lookup, email capture, and routing into structured forms.',
  allowedTools: ['crm.lookup_customer'],
  memoryScope: 'customer',
  inputSchema: '{ message: string }',
  outputSchema: '{ response: string }',
  taskType: 'intake',
  systemPrompt: 'You are a professional AI agency reception agent. Use forms for structured details. Do not pretend to build websites.',
  async execute(input, context) {
    return { response: await agentText(this, input.message, context) };
  }
};
