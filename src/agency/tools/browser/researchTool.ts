import type { ToolDefinition } from '../toolTypes.js';

export const researchTool: ToolDefinition<{ query: string; url?: string }, { summary: string; citations: string[] }> = {
  name: 'browser.research_company',
  description: 'Research customer business, competitors, and inspiration with cited summaries. Stubbed until a browser provider is configured.',
  inputSchema: '{ query: string, url?: string }',
  outputSchema: '{ summary: string, citations: string[] }',
  permissionLevel: 'read',
  approvalRequired: false,
  async execute(input) {
    return { summary: `Research stub for ${input.url || input.query}`, citations: [] };
  }
};
