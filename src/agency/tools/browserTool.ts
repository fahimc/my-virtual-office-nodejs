import type { ToolDefinition } from './toolRegistry.js';
import { research } from './browser/researchService.js';

export const browserTool: ToolDefinition<{ query: string }, { summary: string }> = {
  name: 'browser.research',
  description: 'Research a topic using public web fetch/search fallbacks.',
  inputSchema: '{ query: string }',
  outputSchema: '{ summary: string }',
  permissionLevel: 'safe',
  approvalRequired: false,
  async execute(input) {
    const result = await research({ query: input.query });
    return { summary: `${result.summary}\nSources: ${result.citations.join(', ') || 'none'}` };
  }
};
