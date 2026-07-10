import type { Sitemap } from '../../schemas/sitemap.schema.js';
import { createWireframe } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const wireframeTool = designTool('design.wireframe', 'Create low-fidelity wireframe data.', (sitemap: Sitemap) => createWireframe(sitemap));
