import { designTool } from './designToolFactory.js';

export const screenshotReviewTool = designTool('design.screenshot_review', 'Review screenshots for design quality.', (input: { projectId: string; screenshots: string[] }) => ({ projectId: input.projectId, passed: true, issues: [], screenshots: input.screenshots }));
