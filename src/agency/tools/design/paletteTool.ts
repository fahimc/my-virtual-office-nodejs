import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import { designTool } from './designToolFactory.js';

export const paletteTool = designTool('design.palette', 'Create accessible palette and contrast notes.', (direction: CreativeDirection) => ({
  palette: direction.palette,
  contrastNotes: ['Primary CTA must maintain AA contrast', 'Avoid accent colour for body text', 'Use ink/canvas for long-form readability']
}));
