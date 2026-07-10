import type { ToolDefinition } from './toolRegistry.js';

export const screenshotTool: ToolDefinition<{ url: string }, { screenshotPath: string; note: string }> = {
  name: 'screenshot.capture',
  description: 'Capture screenshots for QA. Stubbed until Playwright is configured in this runtime.',
  inputSchema: '{ url: string }',
  outputSchema: '{ screenshotPath: string, note: string }',
  permissionLevel: 'safe',
  approvalRequired: false,
  async execute(input) {
    return { screenshotPath: '', note: `Screenshot stub for ${input.url}` };
  }
};
