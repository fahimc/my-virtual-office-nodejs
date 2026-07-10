import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import { createCreativeDirections } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const creativeDirectionTool = designTool('design.creative_direction', 'Create 2-3 structured creative directions.', (brief: DesignBrief) => createCreativeDirections(brief));
