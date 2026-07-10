import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import { designTool } from './designToolFactory.js';

export const moodboardTool = designTool('design.moodboard', 'Create moodboard data from creative directions.', (directions: CreativeDirection[]) => ({
  styleKeywords: directions.flatMap(direction => direction.brandPersonality),
  colourInspiration: directions.flatMap(direction => direction.palette),
  typographyDirection: directions.map(direction => direction.typography),
  layoutReferences: directions.map(direction => direction.layoutStyle),
  imageryStyle: directions.map(direction => direction.imageryStyle),
  uiTreatment: directions.map(direction => direction.cardStyle)
}));
