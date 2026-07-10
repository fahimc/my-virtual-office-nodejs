import { designTool } from './designToolFactory.js';

export const figmaTool = designTool('design.figma', 'Optional Figma integration.', (_input: { projectId: string }) => ({ configured: Boolean(process.env.FIGMA_TOKEN), status: process.env.FIGMA_TOKEN ? 'ready' : 'stubbed' }));
