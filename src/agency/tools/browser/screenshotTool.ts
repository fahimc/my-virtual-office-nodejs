import type { ToolDefinition } from '../toolTypes.js';
import { HeadlessScreenshotService } from '../../previews/headlessScreenshotService.js';

export const companyScreenshotTool: ToolDefinition<{ url: string; viewport?: 'mobile' | 'tablet' | 'desktop' }, { screenshotPaths: string[]; summary: string }> = {
  name: 'screenshot.company_capture',
  description: 'Capture responsive screenshots for QA using the local headless Chrome/Edge adapter.',
  inputSchema: '{ url: string, viewport?: string }',
  outputSchema: '{ screenshotPaths: string[], summary: string }',
  permissionLevel: 'read',
  approvalRequired: false,
  async execute(input) {
    const result = await new HeadlessScreenshotService().capture({ url: input.url, viewport: input.viewport || 'desktop' });
    return {
      screenshotPaths: result.publicUrl ? [result.publicUrl] : [],
      summary: result.captured
        ? `Captured ${result.viewport} screenshot for ${input.url}.`
        : `Screenshot capture could not run for ${input.url}: ${result.error}`
    };
  }
};
