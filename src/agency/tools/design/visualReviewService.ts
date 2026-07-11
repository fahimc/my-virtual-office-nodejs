import { createId, nowIso } from '../../memory/memoryStore.js';
import type { VisualReviewReport } from '../../schemas/visualReview.schema.js';

export interface CreateVisualReviewInput {
  projectId: string;
  previewUrl: string;
  screenshots?: VisualReviewReport['screenshots'];
  codexDesignerNotes?: string[];
}

export class VisualReviewService {
  createReport(input: CreateVisualReviewInput): VisualReviewReport {
    const screenshots = input.screenshots || [];
    const notes = input.codexDesignerNotes || [];
    const issues = [
      {
        id: createId('visual-issue'),
        severity: screenshots.length ? 'medium' as const : 'high' as const,
        area: 'responsive' as const,
        title: screenshots.length ? 'Designer screenshot review required before preview approval' : 'No screenshots were captured for visual QA',
        description: screenshots.length
          ? 'The Designer Agent should inspect desktop, tablet, and mobile screenshots and compare them against the design handoff before the client sees the preview.'
          : 'Post-build design QA cannot be trusted without browser screenshots across breakpoints.',
        recommendation: screenshots.length
          ? 'Route screenshots to the Designer Agent review prompt, record issues, create design-fix tasks, and only pass visual QA after obvious layout and polish issues are resolved.'
          : 'Capture desktop, tablet, and mobile screenshots with the browser tool before creating preview approval.'
      },
      ...notes.map((note, index) => ({
        id: createId(`visual-note-${index + 1}`),
        severity: 'medium' as const,
        area: 'layout' as const,
        title: `Designer review note ${index + 1}`,
        description: note,
        recommendation: 'Convert this note into a focused design-fix task for Builder Agent/Codex.'
      }))
    ];

    return {
      id: createId('visual-review'),
      projectId: input.projectId,
      previewUrl: input.previewUrl,
      reviewedByAgentId: 'design',
      screenshots,
      issues,
      recommendedDesignOptions: [
        {
          name: 'Polished editorial system',
          summary: 'Use larger image moments, stronger spacing rhythm, and fewer generic cards to make the site feel agency-designed.',
          bestFor: 'Brand-led websites where first impression and visual trust matter.',
          changes: ['Increase hero media quality', 'Reduce card density', 'Use a stronger section rhythm', 'Add better visual proof blocks']
        },
        {
          name: 'Conversion product system',
          summary: 'Prioritise clearer buying or enquiry decisions with sharper product/service cards and stronger CTA hierarchy.',
          bestFor: 'Commerce, SaaS, local services, and lead-generation websites.',
          changes: ['Clarify primary CTA', 'Group secondary actions', 'Improve product/service scanning', 'Add visible trust points near CTAs']
        }
      ],
      passed: screenshots.length > 0 && issues.length === 0,
      summary: screenshots.length
        ? 'Screenshot-led visual QA has been recorded and should be resolved before preview approval.'
        : 'Visual QA failed because screenshots were not available.',
      createdAt: nowIso()
    };
  }
}
