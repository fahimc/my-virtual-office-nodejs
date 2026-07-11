import type { ImageGenerationProfile, ImageGenerationTier } from '../../schemas/generatedImage.schema.js';

export const openAiImageGenerationPricing = {
  source: 'OpenAI API pricing',
  sourceUrl: 'https://developers.openai.com/api/docs/pricing',
  unit: '1M tokens',
  updatedAt: '2026-07-11',
  standard: {
    'gpt-image-2': {
      imageInputPer1MTokensUsd: 8,
      cachedImageInputPer1MTokensUsd: 2,
      imageOutputPer1MTokensUsd: 30,
      textInputPer1MTokensUsd: 5,
      cachedTextInputPer1MTokensUsd: 1.25
    },
    'gpt-image-1-mini': {
      imageInputPer1MTokensUsd: 2.5,
      cachedImageInputPer1MTokensUsd: 0.25,
      imageOutputPer1MTokensUsd: 8,
      textInputPer1MTokensUsd: 2,
      cachedTextInputPer1MTokensUsd: 0.2
    }
  },
  batch: {
    'gpt-image-2': {
      imageInputPer1MTokensUsd: 4,
      cachedImageInputPer1MTokensUsd: 1,
      imageOutputPer1MTokensUsd: 15,
      textInputPer1MTokensUsd: 2.5,
      cachedTextInputPer1MTokensUsd: 0.625
    },
    'gpt-image-1-mini': {
      imageInputPer1MTokensUsd: 1.25,
      cachedImageInputPer1MTokensUsd: 0.13,
      imageOutputPer1MTokensUsd: 4,
      textInputPer1MTokensUsd: 1,
      cachedTextInputPer1MTokensUsd: 0.1
    }
  }
} as const;

export const imageGenerationProfiles: Record<ImageGenerationTier, ImageGenerationProfile> = {
  draft: {
    tier: 'draft',
    model: 'gpt-image-1-mini',
    quality: 'low',
    useFor: ['quick_preview', 'blog_thumbnail', 'placeholder_hero', 'background', 'icon', 'section_image']
  },
  standard: {
    tier: 'standard',
    model: 'gpt-image-1-mini',
    quality: 'medium',
    useFor: ['final_homepage_hero', 'service_illustration', 'about_page_image', 'portfolio_image', 'content_image']
  },
  premium: {
    tier: 'premium',
    model: 'gpt-image-2',
    quality: 'medium',
    useFor: ['premium_hero', 'product_mockup', 'ad', 'image_with_text', 'complex_composition']
  },
  final_high_end: {
    tier: 'final_high_end',
    model: 'gpt-image-2',
    quality: 'high',
    useFor: ['campaign_visual', 'client_approved_final_hero']
  }
};

const outputTokenEstimateByQuality = {
  low: 900,
  medium: 2600,
  high: 5200
} as const;

export function estimateImageGenerationCost(input: {
  model: 'gpt-image-1-mini' | 'gpt-image-2';
  quality: 'low' | 'medium' | 'high';
  prompt: string;
  quantity?: number;
  batch?: boolean;
}) {
  const rateTable = input.batch ? openAiImageGenerationPricing.batch : openAiImageGenerationPricing.standard;
  const rates = rateTable[input.model];
  const quantity = input.quantity || 1;
  const estimatedInputTokens = Math.max(80, Math.ceil(input.prompt.length / 4));
  const estimatedOutputTokens = outputTokenEstimateByQuality[input.quality] * quantity;
  const estimatedCostUsd =
    (estimatedInputTokens / 1_000_000) * rates.textInputPer1MTokensUsd +
    (estimatedOutputTokens / 1_000_000) * rates.imageOutputPer1MTokensUsd;
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    pricingSource: openAiImageGenerationPricing.source,
    pricingSourceUrl: openAiImageGenerationPricing.sourceUrl
  };
}
