import type { PreviewScreenshotSet } from '../schemas/previewVersion.schema.js';

export class PreviewScreenshotService {
  async capture(projectId: string, previewUrl: string): Promise<PreviewScreenshotSet> {
    const encoded = encodeURIComponent(previewUrl);
    return {
      desktop: `/api/agency/previews/capture-screenshots?projectId=${encodeURIComponent(projectId)}&viewport=desktop&url=${encoded}`,
      tablet: `/api/agency/previews/capture-screenshots?projectId=${encodeURIComponent(projectId)}&viewport=tablet&url=${encoded}`,
      mobile: `/api/agency/previews/capture-screenshots?projectId=${encodeURIComponent(projectId)}&viewport=mobile&url=${encoded}`
    };
  }
}
