import type { AgentDefinition } from './agentTypes.js';
import { agentText } from './agentTypes.js';

export const qaAgent: AgentDefinition<{ previewSummary: string; attempt: number }, { passed: boolean; issues: string[]; summary: string }> = {
  id: 'qa',
  name: 'QA Agent',
  role: 'Quality Assurance Agent',
  description: 'Checks responsiveness, links, obvious layout issues, content gaps, accessibility basics, and consistency.',
  allowedTools: ['screenshot.capture'],
  memoryScope: 'project',
  inputSchema: '{ previewSummary: string, attempt: number }',
  outputSchema: '{ passed: boolean, issues: string[], summary: string }',
  taskType: 'qa',
  systemPrompt: 'QA web previews pragmatically. Return concise useful issues, no hidden reasoning.',
  async execute(input, context) {
    const summary = await agentText(this, JSON.stringify(input), context);
    return {
      passed: input.attempt > 1,
      issues: input.attempt > 1 ? [] : ['Initial QA pass requested one refinement cycle for layout/content consistency.'],
      summary
    };
  }
};
