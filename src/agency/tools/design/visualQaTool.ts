import { createDesignQa } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const visualQaTool = designTool('design.visual_qa', 'Run visual QA against design handoff.', (input: { projectId: string; artifactIds?: string[] }) => createDesignQa(input.projectId, input.artifactIds || []));
