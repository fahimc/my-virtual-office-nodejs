import type { ToolDefinition } from '../toolTypes.js';
import { research } from './researchService.js';

export const researchTool: ToolDefinition<{ query: string; url?: string }, { summary: string; citations: string[] }> = {
  name: 'browser.research_company',
  description: 'Research customer business, competitors, and inspiration with cited summaries.',
  inputSchema: '{ query: string, url?: string }',
  outputSchema: '{ summary: string, citations: string[] }',
  permissionLevel: 'read',
  approvalRequired: false,
  async execute(input) {
    return research(input);
  }
};
