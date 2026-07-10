import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import { createCompetitorResearch } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const competitorResearchTool = designTool('design.competitor_research', 'Research competitor patterns and differentiation opportunities.', (brief: DesignBrief) => createCompetitorResearch(brief));
