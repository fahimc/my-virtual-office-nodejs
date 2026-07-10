export interface StructuredBrief {
  businessSummary: string;
  targetAudience: string;
  pagesNeeded: string[];
  featuresNeeded: string[];
  stylePreferences: string[];
  contentRequirements: string[];
  assetsRequired: string[];
  technicalRequirements: string[];
  assumptions: string[];
  missingInformation: string[];
  estimatedComplexity: 'small' | 'medium' | 'large';
}

export interface BriefSubmission {
  customerId: string;
  originalBrief: string;
}
