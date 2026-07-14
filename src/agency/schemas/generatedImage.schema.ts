export type ImageGenerationTier = 'draft' | 'standard' | 'premium' | 'final_high_end';

export type ImageGenerationUse =
  | 'quick_preview'
  | 'blog_thumbnail'
  | 'placeholder_hero'
  | 'background'
  | 'icon'
  | 'section_image'
  | 'final_homepage_hero'
  | 'service_illustration'
  | 'about_page_image'
  | 'portfolio_image'
  | 'content_image'
  | 'premium_hero'
  | 'product_mockup'
  | 'ad'
  | 'image_with_text'
  | 'complex_composition'
  | 'campaign_visual'
  | 'client_approved_final_hero';

export interface ImageGenerationProfile {
  tier: ImageGenerationTier;
  model: 'gpt-image-1-mini' | 'gpt-image-2';
  quality: 'low' | 'medium' | 'high';
  useFor: ImageGenerationUse[];
}

export interface GeneratedImageAsset {
  id: string;
  projectId: string;
  customerId?: string;
  title: string;
  intendedUse: ImageGenerationUse;
  tier: ImageGenerationTier;
  model: string;
  quality: 'low' | 'medium' | 'high';
  prompt: string;
  revisedPrompt?: string;
  size: string;
  status: 'planned' | 'generated' | 'mocked' | 'failed';
  filePath?: string;
  url?: string;
  provider: 'openai' | 'local_mock';
  estimatedCostUsd: number;
  actualCostUsd?: number;
  costEntryId?: string;
  notes: string[];
  generationLeaseOwner?: string;
  generationLeaseUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteImageryPlan {
  projectId: string;
  hero: GeneratedImageAsset;
  pageImages: GeneratedImageAsset[];
  sectionImages: GeneratedImageAsset[];
  totalEstimatedCostUsd: number;
  createdAt: string;
}
