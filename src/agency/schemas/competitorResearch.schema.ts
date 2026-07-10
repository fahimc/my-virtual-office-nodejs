export interface CompetitorResearch {
  projectId: string;
  competitors: Array<{ name: string; url?: string; notes: string }>;
  commonSections: string[];
  commonCallsToAction: string[];
  visualPatterns: string[];
  trustSignals: string[];
  contentPatterns: string[];
  conversionPatterns: string[];
  opportunities: string[];
  thingsToAvoid: string[];
  recommendedDifferentiation: string[];
}
