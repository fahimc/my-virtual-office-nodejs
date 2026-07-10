import type { CreativeDirection, SelectedDirection } from '../../schemas/creativeDirection.schema.js';
import type { Sitemap } from '../../schemas/sitemap.schema.js';
import type { Wireframe } from '../../schemas/wireframe.schema.js';
import type { DesignTokens } from '../../schemas/designTokens.schema.js';
import type { ComponentSpec } from '../../schemas/componentSpec.schema.js';
import { createHandoff } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const designHandoffTool = designTool('design.handoff', 'Create final Builder Agent handoff package.', (input: { selectedDirection: SelectedDirection; direction: CreativeDirection; sitemap: Sitemap; wireframes: Wireframe; tokens: DesignTokens; componentSpec: ComponentSpec }) => createHandoff(input));
