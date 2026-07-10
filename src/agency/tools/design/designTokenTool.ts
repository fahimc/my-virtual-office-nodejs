import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import { createDesignTokens } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const designTokenTool = designTool('design.tokens', 'Create design tokens and Tailwind theme export.', (direction: CreativeDirection) => createDesignTokens(direction));
