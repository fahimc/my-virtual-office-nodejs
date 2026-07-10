export interface Sitemap {
  projectId: string;
  pages: Array<{ id: string; title: string; path: string; sections: string[]; priority: 'primary' | 'secondary' | 'utility' }>;
  navigationItems: string[];
  footerNavigation: string[];
  primaryCta: string;
  userJourney: string[];
  seoPageIntent: Record<string, string>;
  requiredLegalPages: string[];
}
