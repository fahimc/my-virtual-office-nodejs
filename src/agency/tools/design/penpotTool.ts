import { designTool } from './designToolFactory.js';

export const penpotTool = designTool('design.penpot', 'Optional Penpot integration.', (_input: { projectId: string }) => ({ configured: Boolean(process.env.PENPOT_TOKEN), status: process.env.PENPOT_TOKEN ? 'ready' : 'stubbed' }));
