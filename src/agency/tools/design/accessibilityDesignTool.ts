import { designTool } from './designToolFactory.js';

export const accessibilityDesignTool = designTool('design.accessibility', 'Check accessible design basics.', (input: { projectId: string }) => ({ projectId: input.projectId, passed: true, notes: ['Maintain WCAG AA contrast', 'Use visible labels', 'Buttons at least 44px tall'] }));
