import { designTool } from './designToolFactory.js';
import { createDesignBrief, type DesignContextInput } from './designArtifactFactory.js';

export const designBriefTool = designTool('design.brief', 'Create a structured design brief from project/customer memory.', (input: DesignContextInput) => createDesignBrief(input));
