export interface DesignBrief {
  projectId: string;
  customerId: string;
  businessName: string;
  businessType: string;
  targetAudience: string;
  projectGoal: string;
  primaryConversionGoal: string;
  secondaryGoals: string[];
  existingWebsite?: string;
  competitorUrls: string[];
  stylePreferences: string[];
  dislikedStyles: string[];
  requiredPages: string[];
  requiredFeatures: string[];
  availableAssets: string[];
  missingAssets: string[];
  assumptions: string[];
  constraints: string[];
  createdAt: string;
  updatedAt: string;
}
