import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import { createSitemap } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const sitemapTool = designTool('design.sitemap', 'Create sitemap and conversion journey.', (input: { brief: DesignBrief; direction: CreativeDirection }) => createSitemap(input.brief, input.direction));
