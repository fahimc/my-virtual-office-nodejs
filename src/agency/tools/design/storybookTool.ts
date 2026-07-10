import { designTool } from './designToolFactory.js';

export const storybookTool = designTool('design.storybook', 'Create/update component stories when Storybook exists.', (_input: { projectId: string }) => ({ updated: false, recommendation: 'No Storybook project detected; use component spec for now.' }));
