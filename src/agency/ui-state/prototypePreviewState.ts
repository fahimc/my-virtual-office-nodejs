import type { Prototype } from '../schemas/prototype.schema.js';

export function buildPrototypePreviewState(prototype?: Prototype) {
  return prototype ? {
    type: prototype.type,
    previewUrl: prototype.previewUrl,
    screenshots: prototype.screenshots,
    viewportCoverage: prototype.viewportCoverage,
    knownIssues: prototype.knownIssues
  } : undefined;
}
