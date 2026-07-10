export class ScreenshotService {
  async capture(url: string): Promise<{ screenshotPaths: string[]; summary: string }> {
    return { screenshotPaths: [], summary: `Screenshot capture stub for ${url}` };
  }
}
