export interface VisualReviewIssue {
  id: string;
  severity: 'low' | 'medium' | 'high';
  area: 'layout' | 'hierarchy' | 'typography' | 'spacing' | 'imagery' | 'colour' | 'accessibility' | 'content' | 'responsive';
  title: string;
  description: string;
  recommendation: string;
}

export interface VisualDesignOption {
  name: string;
  summary: string;
  bestFor: string;
  changes: string[];
}

export interface VisualReviewReport {
  id: string;
  projectId: string;
  previewUrl: string;
  reviewedByAgentId: 'design';
  screenshots: Array<{
    viewport: 'desktop' | 'tablet' | 'mobile';
    path: string;
    width: number;
    height: number;
  }>;
  issues: VisualReviewIssue[];
  recommendedDesignOptions: VisualDesignOption[];
  passed: boolean;
  summary: string;
  createdAt: string;
}
