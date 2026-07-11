export interface BrandGuidelinesColor {
  name: string;
  hex: string;
  usage: string;
  contrastOnWhite: number;
  contrastOnDark: number;
  recommendedText: 'dark' | 'light';
}

export interface BrandGuidelinesTypographyRule {
  role: string;
  family: string;
  weight: string;
  sizeGuidance: string;
  usage: string;
}

export interface BrandGuidelines {
  projectId: string;
  customerId: string;
  brandName: string;
  businessType: string;
  brandIdea: string;
  creativeDirection: string;
  personality: string[];
  logoUsage: {
    primaryLockup: string;
    clearSpace: string;
    minimumSize: string;
    donts: string[];
  };
  colors: BrandGuidelinesColor[];
  typography: BrandGuidelinesTypographyRule[];
  imageryStyle: string[];
  voiceAndTone: {
    summary: string;
    do: string[];
    avoid: string[];
  };
  layoutSystem: {
    container: string;
    grid: string;
    spacing: string;
    radius: string;
  };
  componentRules: Array<{ component: string; guidance: string }>;
  accessibility: {
    contrastStandard: string;
    rules: string[];
  };
  usageDos: string[];
  usageDonts: string[];
  htmlUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}
