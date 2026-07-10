import { createPrototype } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const prototypeTool = designTool('design.prototype', 'Create code-first prototype spec.', (input: { projectId: string }) => createPrototype(input.projectId));
