import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import { designTool } from './designToolFactory.js';

export const typographyTool = designTool('design.typography', 'Create typography system.', (direction: CreativeDirection) => direction.typography);
