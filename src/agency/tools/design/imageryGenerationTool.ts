import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { MemoryStore } from '../../memory/memoryStore.js';
import { createId, nowIso } from '../../memory/memoryStore.js';
import type { BudgetPolicy } from '../../runtime/budgetPolicy.js';
import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import type { GeneratedImageAsset, ImageGenerationTier, ImageGenerationUse, WebsiteImageryPlan } from '../../schemas/generatedImage.schema.js';
import type { ToolDefinition } from '../toolTypes.js';
import type { CostLedgerService } from '../billing/costLedgerService.js';
import { estimateImageGenerationCost, imageGenerationProfiles } from './imageGenerationConfig.js';

export interface ImageryGenerationInput {
  projectId: string;
  customerId?: string;
  designBrief: DesignBrief;
  direction: CreativeDirection;
  mode?: 'draft' | 'standard' | 'premium';
  count?: number;
}

export class ImageryGenerationService {
  constructor(
    private readonly store: MemoryStore,
    private readonly costs: CostLedgerService,
    private readonly budgetPolicy: BudgetPolicy,
    private readonly workspaceRoot: string
  ) {}

  async generateWebsiteImagery(input: ImageryGenerationInput): Promise<WebsiteImageryPlan> {
    const specs = this.createImageSpecs(input);
    const assets: GeneratedImageAsset[] = [];
    for (const spec of specs) {
      assets.push(await this.generateAsset(input, spec));
    }
    const plan: WebsiteImageryPlan = {
      projectId: input.projectId,
      hero: assets[0],
      pageImages: assets.filter(asset => asset.intendedUse === 'about_page_image' || asset.intendedUse === 'content_image'),
      sectionImages: assets.filter(asset => ['section_image', 'service_illustration', 'background', 'blog_thumbnail'].includes(asset.intendedUse)),
      totalEstimatedCostUsd: Number(assets.reduce((sum, asset) => sum + asset.estimatedCostUsd, 0).toFixed(6)),
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.generatedImages = data.generatedImages.filter(item => item.projectId !== input.projectId);
      data.generatedImages.push(...assets);
      data.imageryPlans = data.imageryPlans.filter(item => item.projectId !== input.projectId);
      data.imageryPlans.push(plan);
    });
    return plan;
  }

  private createImageSpecs(input: ImageryGenerationInput): Array<{ title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string }> {
    const business = `${input.designBrief.businessName} ${input.designBrief.businessType}`.trim();
    const visualLanguage = [
      input.direction.name,
      input.direction.summary,
      `Palette: ${input.direction.palette.map(item => `${item.name} ${item.hex}`).join(', ')}`,
      `Imagery style: ${input.direction.imageryStyle}`,
      `Mood: ${input.direction.targetEmotion}`,
      'Professional commercial website image, no watermarks, no fake UI text unless explicitly requested.'
    ].join('\n');
    const usePremiumHero = input.mode === 'premium';
    const requestedCount = Math.max(3, Math.min(input.count || 5, 8));
    const specs: Array<{ title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string }> = [
      {
        title: 'Homepage hero image',
        intendedUse: usePremiumHero ? 'premium_hero' : 'final_homepage_hero',
        tier: usePremiumHero ? 'premium' : 'standard',
        size: '1536x1024',
        prompt: `${visualLanguage}\nCreate the main homepage hero image for ${business}. It should support this project goal: ${input.designBrief.projectGoal}. Leave clean negative space for headline and CTA overlay.`
      }
    ];
    const sectionIdeas = [
      ['Services section image', 'service_illustration', 'Show the core service/product experience in a polished editorial way.'],
      ['About page image', 'about_page_image', 'Show the brand story, team, making process, or customer experience with warm credibility.'],
      ['Proof section image', 'content_image', 'Show proof, quality, process, trust, or results without using readable text.'],
      ['Background texture image', 'background', 'Create a subtle background image or atmospheric detail suitable behind content blocks.'],
      ['CTA section image', 'section_image', 'Create an energetic conversion-focused support image for a call-to-action section.'],
      ['Content image', 'content_image', 'Create a flexible interior page image that can be reused on services or blog pages.'],
      ['Blog thumbnail image', 'blog_thumbnail', 'Create a clean editorial thumbnail for future content marketing.']
    ] as const;
    for (const [title, intendedUse, instruction] of sectionIdeas.slice(0, requestedCount - 1)) {
      specs.push({
        title,
        intendedUse,
        tier: intendedUse === 'background' || intendedUse === 'blog_thumbnail' ? 'draft' : 'standard',
        size: '1024x1024',
        prompt: `${visualLanguage}\n${instruction}\nBrand/business context: ${business}. Audience: ${input.designBrief.targetAudience}.`
      });
    }
    return specs;
  }

  private async generateAsset(
    input: ImageryGenerationInput,
    spec: { title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string }
  ): Promise<GeneratedImageAsset> {
    const profile = imageGenerationProfiles[spec.tier];
    const estimate = estimateImageGenerationCost({ model: profile.model, quality: profile.quality, prompt: spec.prompt });
    this.budgetPolicy.assertWithinBudget({ projectId: input.projectId, estimatedCostUsd: estimate.estimatedCostUsd });
    const costEntry = await this.costs.recordEstimate({
      projectId: input.projectId,
      customerId: input.customerId,
      agentId: 'finance',
      department: 'design',
      toolName: 'design.openai_image_generation',
      action: `generate.${spec.intendedUse}`,
      model: profile.model,
      pricingSource: estimate.pricingSource,
      pricingSourceUrl: estimate.pricingSourceUrl,
      quantity: 1,
      unit: 'image',
      estimatedInputTokens: estimate.estimatedInputTokens,
      estimatedOutputTokens: estimate.estimatedOutputTokens,
      estimatedCostUsd: estimate.estimatedCostUsd,
      metadata: {
        tier: spec.tier,
        quality: profile.quality,
        size: spec.size,
        pricingNote: 'Estimated from OpenAI per-token image generation pricing; replace with API usage when returned by provider.'
      }
    });
    const id = createId('image');
    const generated = process.env.OPENAI_API_KEY
      ? await this.callOpenAiImageGeneration({ prompt: spec.prompt, model: profile.model, quality: profile.quality, size: spec.size, id, projectId: input.projectId })
      : await this.writeMockImage({ id, projectId: input.projectId, title: spec.title, direction: input.direction.name });
    return {
      id,
      projectId: input.projectId,
      customerId: input.customerId,
      title: spec.title,
      intendedUse: spec.intendedUse,
      tier: spec.tier,
      model: profile.model,
      quality: profile.quality,
      prompt: spec.prompt,
      revisedPrompt: generated.revisedPrompt,
      size: spec.size,
      status: generated.provider === 'openai' ? 'generated' : 'mocked',
      filePath: generated.filePath,
      url: generated.url,
      provider: generated.provider,
      estimatedCostUsd: estimate.estimatedCostUsd,
      costEntryId: costEntry.id,
      notes: generated.notes,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  private async callOpenAiImageGeneration(input: { prompt: string; model: string; quality: string; size: string; id: string; projectId: string }) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: input.model,
        prompt: input.prompt,
        quality: input.quality,
        size: input.size,
        n: 1,
        response_format: 'b64_json'
      })
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI image generation failed: ${response.status} ${message.slice(0, 500)}`);
    }
    const json = await response.json() as { data?: Array<{ b64_json?: string; revised_prompt?: string; url?: string }> };
    const first = json.data?.[0];
    if (!first) throw new Error('OpenAI image generation returned no image data');
    if (first.b64_json) {
      const buffer = Buffer.from(first.b64_json, 'base64');
      const file = await this.writeGeneratedFile(input.projectId, `${input.id}.png`, buffer);
      return { provider: 'openai' as const, filePath: file.filePath, url: file.url, revisedPrompt: first.revised_prompt, notes: ['Generated with OpenAI image generation API.'] };
    }
    if (first.url) {
      return { provider: 'openai' as const, url: first.url, revisedPrompt: first.revised_prompt, notes: ['Generated with OpenAI image generation API; remote URL returned by provider.'] };
    }
    throw new Error('OpenAI image generation returned an unsupported image payload');
  }

  private async writeMockImage(input: { id: string; projectId: string; title: string; direction: string }) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset=".48" stop-color="#2563eb"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
  <rect width="1536" height="1024" fill="url(#g)"/>
  <circle cx="1180" cy="230" r="180" fill="#ffffff" opacity=".14"/>
  <circle cx="340" cy="760" r="260" fill="#ffffff" opacity=".10"/>
  <text x="96" y="150" fill="#fff" font-family="Arial, sans-serif" font-size="54" font-weight="700">${escapeXml(input.title)}</text>
  <text x="96" y="220" fill="#fff" opacity=".76" font-family="Arial, sans-serif" font-size="30">${escapeXml(input.direction)}</text>
</svg>`;
    const file = await this.writeGeneratedFile(input.projectId, `${input.id}.svg`, Buffer.from(svg));
    return {
      provider: 'local_mock' as const,
      filePath: file.filePath,
      url: file.url,
      revisedPrompt: undefined,
      notes: ['OPENAI_API_KEY is not configured; saved a local mock image so the design workflow can continue without spend.']
    };
  }

  private async writeGeneratedFile(projectId: string, fileName: string, buffer: Buffer) {
    const relativeDir = path.join('public', 'generated-images', projectId);
    const absoluteDir = path.join(this.workspaceRoot, relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    const absolutePath = path.join(absoluteDir, fileName);
    await fs.writeFile(absolutePath, buffer);
    return {
      filePath: path.join(relativeDir, fileName).replaceAll('\\', '/'),
      url: `/generated-images/${projectId}/${fileName}`
    };
  }
}

export function createImageryGenerationTool(service: ImageryGenerationService): ToolDefinition<ImageryGenerationInput, WebsiteImageryPlan> {
  return {
    name: 'design.openai_image_generation',
    description: 'Generate or plan website imagery for hero, page, and section assets using OpenAI image models with Finance cost tracking.',
    inputSchema: 'ImageryGenerationInput',
    outputSchema: 'WebsiteImageryPlan',
    permissionLevel: 'external',
    approvalRequired: false,
    async execute(input) {
      return service.generateWebsiteImagery(input);
    }
  };
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
