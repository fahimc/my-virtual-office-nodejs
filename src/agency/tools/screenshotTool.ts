import type { ToolDefinition } from './toolRegistry.js';
import { HeadlessScreenshotService } from '../previews/headlessScreenshotService.js';

export const screenshotTool: ToolDefinition<{ url: string }, { screenshotPath: string; note: string }> = {
  name: 'screenshot.capture',
  description: 'Capture screenshots for QA using local headless Chrome/Edge when available.',
  inputSchema: '{ url: string }',
  outputSchema: '{ screenshotPath: string, note: string }',
  permissionLevel: 'safe',
  approvalRequired: false,
  async execute(input) {
    const result = await new HeadlessScreenshotService().capture({ url: input.url, viewport: 'desktop' });
    return {
      screenshotPath: result.publicUrl || '',
      note: result.captured ? `Captured screenshot for ${input.url}` : `Screenshot capture unavailable: ${result.error}`
    };
  }
};
