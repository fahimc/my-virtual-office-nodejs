export interface BrandAudit {
  projectId: string;
  existingWebsiteUrl?: string;
  screenshots: string[];
  detectedColours: string[];
  detectedFonts: string[];
  logoNotes: string;
  toneOfVoice: string;
  currentNavigation: string[];
  currentPageStructure: string[];
  strengths: string[];
  weaknesses: string[];
  conversionProblems: string[];
  accessibilityConcerns: string[];
  mobileConcerns: string[];
  contentGaps: string[];
  recommendations: string[];
}
