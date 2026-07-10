import type { ToolDefinition } from '../toolTypes.js';

export const companyScreenshotTool: ToolDefinition<{ url: string; viewport?: 'mobile' | 'tablet' | 'desktop' }, { screenshotPaths: string[]; summary: string }> = {
  name: 'screenshot.company_capture',
  description: 'Capture responsive screenshots for QA. Stubbed until Playwright integration is configured.',
  inputSchema: '{ url: string, viewport?: string }',
  outputSchema: '{ screenshotPaths: string[], summary: string }',
  permissionLevel: 'read',
  approvalRequired: false,
  async execute(input) {
    return { screenshotPaths: [], summary: `Screenshot stub for ${input.url} at ${input.viewport || 'desktop'}` };
  }
};
