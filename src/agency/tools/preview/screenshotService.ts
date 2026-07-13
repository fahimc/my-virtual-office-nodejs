import { HeadlessScreenshotService, type ScreenshotViewport } from '../../previews/headlessScreenshotService.js';

export class ScreenshotService {
  private readonly screenshots = new HeadlessScreenshotService();

  async capture(url: string): Promise<{ screenshotPaths: string[]; summary: string }> {
    const viewports: ScreenshotViewport[] = ['desktop', 'tablet', 'mobile'];
    const results = await Promise.all(viewports.map(viewport => this.screenshots.capture({ url, viewport })));
    const paths = results.flatMap(result => result.publicUrl ? [result.publicUrl] : []);
    const failures = results.filter(result => !result.captured).map(result => `${result.viewport}: ${result.error}`);
    return {
      screenshotPaths: paths,
      summary: paths.length
        ? `Captured ${paths.length} responsive screenshot${paths.length === 1 ? '' : 's'} for ${url}.`
        : `Screenshot capture could not run for ${url}. ${failures.join(' ')}`
    };
  }
}
