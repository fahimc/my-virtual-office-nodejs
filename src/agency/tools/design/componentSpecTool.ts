import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import type { Sitemap } from '../../schemas/sitemap.schema.js';
import { createComponentSpec } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const componentSpecTool = designTool('design.component_spec', 'Define reusable section and component specs.', (input: { brief: DesignBrief; sitemap: Sitemap }) => createComponentSpec(input.brief, input.sitemap));
