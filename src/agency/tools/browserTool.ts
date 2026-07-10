import type { ToolDefinition } from './toolRegistry.js';

export const browserTool: ToolDefinition<{ query: string }, { summary: string }> = {
  name: 'browser.research',
  description: 'Research a topic in a browser/search provider. Stubbed until a browser provider is configured.',
  inputSchema: '{ query: string }',
  outputSchema: '{ summary: string }',
  permissionLevel: 'safe',
  approvalRequired: false,
  async execute(input) {
    return { summary: `Research stub for: ${input.query}` };
  }
};
