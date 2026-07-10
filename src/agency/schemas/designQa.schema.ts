export interface DesignQaReport {
  projectId: string;
  designArtifactIds: string[];
  checks: Array<{ name: string; passed: boolean; notes: string }>;
  passed: boolean;
  issues: string[];
  recommendedFixes: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reviewedAt: string;
}
