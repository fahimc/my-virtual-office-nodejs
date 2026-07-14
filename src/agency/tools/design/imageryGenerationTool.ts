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
  provider?: 'auto' | 'mock';
}

const TEXT_FREE_IMAGE_RULES = [
  'The final image must contain zero written language.',
  'No readable text, no fake text, no pseudo text, no placeholder copy, no letter-like marks, no number-like marks, no glyphs, no logos, no watermarks.',
  'Do not create a website screenshot, landing page mockup, UI screen, dashboard, design board, poster, magazine layout, presentation slide, infographic, title card, or brand-guideline page.',
  'Do not include signs, captions, badges, buttons, labels, packaging labels, menus, charts, diagrams, book covers, paper documents, whiteboards, sticky notes, clothing logos, wall graphics, or monitor text.',
  'If devices appear, every screen must be blank, dark, blurred, turned away, or out of focus with no interface and no typography.',
  'If paper, boards, packaging, walls, or clothing appear, they must be plain, unmarked, or abstract with no symbols.',
  'Use real-world subject matter, photography, texture, materials, light, people, environment, and composition instead of embedded words.'
];

export class ImageryGenerationService {
  constructor(
    private readonly store: MemoryStore,
    private readonly costs: CostLedgerService,
    private readonly budgetPolicy: BudgetPolicy,
    private readonly workspaceRoot: string
  ) {}

  async generateWebsiteImagery(input: ImageryGenerationInput): Promise<WebsiteImageryPlan> {
    const existing = (await this.store.read()).imageryPlans.filter(item => item.projectId === input.projectId).at(-1);
    if (existing) return existing;
    const specs = this.createImageSpecs(input);
    const assets: GeneratedImageAsset[] = [];
    const generationOwner = createId('imagery-worker');
    for (const spec of specs) {
      assets.push(await this.getOrGenerateAsset(input, spec, generationOwner));
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

  private async getOrGenerateAsset(
    input: ImageryGenerationInput,
    spec: { title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string },
    generationOwner: string
  ): Promise<GeneratedImageAsset> {
    const profile = imageGenerationProfiles[spec.tier];
    const estimate = estimateImageGenerationCost({ model: profile.model, quality: profile.quality, prompt: spec.prompt });
    for (let attempt = 0; attempt < 180; attempt += 1) {
      let asset: GeneratedImageAsset | undefined;
      let claimed = false;
      await this.store.update(data => {
        asset = data.generatedImages.find(item =>
          item.projectId === input.projectId &&
          item.title === spec.title &&
          item.intendedUse === spec.intendedUse
        );
        if (asset && (asset.status === 'generated' || asset.status === 'mocked')) return;
        const leaseUntil = asset?.generationLeaseUntil ? Date.parse(asset.generationLeaseUntil) : 0;
        if (asset?.generationLeaseOwner && asset.generationLeaseOwner !== generationOwner && Number.isFinite(leaseUntil) && leaseUntil > Date.now()) return;
        const timestamp = nowIso();
        const planned: GeneratedImageAsset = {
          id: asset?.id || createId('image'),
          projectId: input.projectId,
          customerId: input.customerId,
          title: spec.title,
          intendedUse: spec.intendedUse,
          tier: spec.tier,
          model: profile.model,
          quality: profile.quality,
          prompt: spec.prompt,
          size: spec.size,
          status: 'planned',
          provider: 'local_mock',
          estimatedCostUsd: estimate.estimatedCostUsd,
          notes: ['Generation claimed by the active design workflow.'],
          generationLeaseOwner: generationOwner,
          generationLeaseUntil: new Date(Date.now() + 120_000).toISOString(),
          createdAt: asset?.createdAt || timestamp,
          updatedAt: timestamp
        };
        const index = asset ? data.generatedImages.findIndex(item => item.id === asset?.id) : -1;
        if (index >= 0) data.generatedImages[index] = planned;
        else data.generatedImages.push(planned);
        asset = planned;
        claimed = true;
      });
      if (asset && (asset.status === 'generated' || asset.status === 'mocked')) return asset;
      if (claimed && asset) {
        try {
          const generated = await this.generateAsset(input, spec, asset.id);
          await this.store.update(data => {
            const index = data.generatedImages.findIndex(item => item.id === generated.id);
            if (index >= 0) data.generatedImages[index] = generated;
            else data.generatedImages.push(generated);
          });
          return generated;
        } catch (error) {
          await this.store.update(data => {
            const item = data.generatedImages.find(candidate => candidate.id === asset?.id);
            if (!item) return;
            item.status = 'failed';
            item.notes = [...item.notes, error instanceof Error ? error.message : String(error)];
            item.generationLeaseOwner = undefined;
            item.generationLeaseUntil = undefined;
            item.updatedAt = nowIso();
          });
          throw error;
        }
      }
      await wait(500);
    }
    throw new Error(`Timed out waiting for imagery generation claim: ${spec.title}`);
  }

  private createImageSpecs(input: ImageryGenerationInput): Array<{ title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string }> {
    const business = `${input.designBrief.businessName} ${input.designBrief.businessType}`.trim();
    const visualLanguage = [
      input.direction.name,
      input.direction.summary,
      `Palette: ${input.direction.palette.map(item => `${item.name} ${item.hex}`).join(', ')}`,
      `Imagery style: ${input.direction.imageryStyle}`,
      `Mood: ${input.direction.targetEmotion}`
    ].join('\n');
    const usePremiumHero = input.mode === 'premium';
    const requestedCount = Math.max(3, Math.min(input.count || 5, 8));
    const specs: Array<{ title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string }> = [
      {
        title: 'Homepage hero image',
        intendedUse: usePremiumHero ? 'premium_hero' : 'final_homepage_hero',
        tier: usePremiumHero ? 'premium' : 'standard',
        size: '1536x1024',
        prompt: this.createAssetPrompt(input, {
          title: 'Homepage hero image',
          intendedUse: usePremiumHero ? 'premium_hero' : 'final_homepage_hero',
          business,
          visualLanguage,
          composition: 'wide editorial composition with a calm low-detail region for live HTML headline and buttons',
          purpose: `support the project goal: ${input.designBrief.projectGoal}`
        })
      }
    ];
    const sectionIdeas = [
      ['Services section image', 'service_illustration', 'show the core service or product experience through people, objects, space, materials, and atmosphere'],
      ['About page image', 'about_page_image', 'show the team, process, craft, or customer experience with warm credibility'],
      ['Proof section image', 'content_image', 'show quality, process, trust, or results through real-world visual evidence'],
      ['Background texture image', 'background', 'create a subtle atmospheric texture or environment detail for content sections'],
      ['CTA section image', 'section_image', 'create an energetic support visual for a conversion section'],
      ['Content image', 'content_image', 'create a flexible editorial interior-page support image'],
      ['Blog thumbnail image', 'blog_thumbnail', 'create a clean editorial thumbnail-style source image']
    ] as const;
    for (const [title, intendedUse, instruction] of sectionIdeas.slice(0, requestedCount - 1)) {
      specs.push({
        title,
        intendedUse,
        tier: intendedUse === 'background' || intendedUse === 'blog_thumbnail' ? 'draft' : 'standard',
        size: '1024x1024',
        prompt: this.createAssetPrompt(input, {
          title,
          intendedUse,
          business,
          visualLanguage,
          composition: 'polished editorial crop with natural negative space and no embedded layout elements',
          purpose: `${instruction}. Audience: ${input.designBrief.targetAudience}.`
        })
      });
    }
    return specs;
  }

  private createAssetPrompt(
    input: ImageryGenerationInput,
    spec: {
      title: string;
      intendedUse: ImageGenerationUse;
      business: string;
      visualLanguage: string;
      composition: string;
      purpose: string;
    }
  ): string {
    const subject = this.imageSubjectFor(input, spec);
    return [
      'Use case: photorealistic-natural',
      'Asset type: text-free website source image. This is an image asset only, not a webpage, not a UI mockup, not a brand board.',
      `Client context: ${spec.business || 'client business'}.`,
      `Business type: ${input.designBrief.businessType}.`,
      `Target audience: ${input.designBrief.targetAudience}.`,
      `Visual direction:\n${spec.visualLanguage}`,
      `Scene/backdrop: ${subject}`,
      `Primary request: ${spec.purpose}.`,
      `Composition/framing: ${spec.composition}. Keep important subjects away from the quiet overlay area.`,
      'Lighting/mood: premium commercial photography, cinematic but natural, high-quality depth, no stock-photo cliche.',
      'Color palette: follow the design direction palette through light, wardrobe, surfaces, props, or environment tones. Do not use text to communicate brand ideas.',
      `Constraints: ${TEXT_FREE_IMAGE_RULES.join(' ')}`,
      'Quality gate: before finalizing, inspect the image for any letter-like, number-like, glyph-like, logo-like, or watermark-like marks. If any exist, replace them with blank surfaces, realistic texture, soft blur, or non-symbolic objects.'
    ].join('\n');
  }

  private imageSubjectFor(input: ImageryGenerationInput, spec: { title: string; intendedUse: ImageGenerationUse }): string {
    const context = `${input.designBrief.businessName} ${input.designBrief.businessType} ${input.designBrief.projectGoal} ${input.direction.imageryStyle}`.toLowerCase();
    const isHero = spec.title.toLowerCase().includes('hero');
    if (/(fruit|drink|juice|beverage|smoothie|food|restaurant|cafe|catering)/.test(context)) {
      if (isHero) return 'fresh product photography with fruit, drinks, condensation, ice, botanicals, glass, liquid movement, and a clean empty area for live overlay copy';
      if (spec.intendedUse === 'about_page_image') return 'hands preparing ingredients, bottles, fruit, clean counters, natural light, and people in the background with no labels or packaging text';
      if (spec.intendedUse === 'background') return 'macro fruit skin, chilled glass, ice, liquid, mist, and soft color gradients with no packaging or labels';
      return 'category-specific beverage ingredients, serving moments, shelves without labels, lifestyle context, and polished product details';
    }
    if (/(agency|marketing|branding|web design|digital|automation|consultancy|consultant|professional service)/.test(context)) {
      if (isHero) return 'premium digital studio environment with people collaborating, architectural light, blank or dark device screens, unmarked notebooks, textured walls, and a calm open area for live overlay copy';
      if (spec.intendedUse === 'service_illustration') return 'modular creative workspace details, hands arranging unmarked cards, blank devices, material swatches, and studio tools without letters or symbols';
      if (spec.intendedUse === 'about_page_image') return 'authentic agency team collaboration in a modern studio, laptops angled away or blank, plain walls, no posters, no whiteboard writing, no screen UI';
      if (spec.intendedUse === 'background') return 'abstract studio atmosphere with soft light, glass, paper texture, shadows, and color washes, with no writing or symbols';
      return 'client meeting and strategy atmosphere shown through people, blank screens, plain surfaces, architecture, and confident editorial lighting';
    }
    if (/(saas|software|platform|dashboard|analytics|app|tech|ai|cybersecurity)/.test(context)) {
      if (isHero) return 'modern technology workspace with abstract hardware, atmospheric glass, servers or device silhouettes, blank screens, and a quiet area for live overlay copy';
      if (spec.intendedUse === 'background') return 'abstract technology texture, light trails, glass, soft grids without symbols, and premium dark or light gradients';
      return 'technology product environment with blank screens, abstract data-like light, people using devices, and no visible UI, charts, numbers, or text';
    }
    if (/(plumber|electrician|builder|repair|trade|construction|heating|roof|cleaner|local service)/.test(context)) {
      if (isHero) return 'trustworthy local service scene with clean tools, vehicle-free environment, uniform details without logos, home or workshop context, and quiet space for live overlay copy';
      if (spec.intendedUse === 'background') return 'macro materials, tools, clean surfaces, light, and practical detail with no labels or brand marks';
      return 'skilled hands, tools, finished work, customer interaction, tidy job site details, and no signage, labels, or documents';
    }
    if (/(property|real estate|estate agent|interior|architecture|home|housing)/.test(context)) {
      if (isHero) return 'aspirational interior or exterior architecture photography with natural light, strong composition, and quiet space for live overlay copy';
      return 'architectural details, rooms, materials, and lifestyle moments without signs, plaques, documents, or visible screen text';
    }
    if (/(portfolio|creator|photographer|artist|designer|personal brand)/.test(context)) {
      if (isHero) return 'editorial creative studio portrait or workspace with art materials, blank surfaces, natural light, and quiet space for live overlay copy';
      return 'creative process details, studio materials, camera or laptop with blank screen, and polished editorial atmosphere';
    }
    return 'premium business environment with real people, tactile materials, blank screens, plain surfaces, architectural light, and a quiet area for live overlay copy';
  }

  private async generateAsset(
    input: ImageryGenerationInput,
    spec: { title: string; intendedUse: ImageGenerationUse; tier: ImageGenerationTier; prompt: string; size: string },
    id = createId('image')
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
    const generated = input.provider !== 'mock' && process.env.OPENAI_API_KEY
      ? await this.callOpenAiImageGeneration({ prompt: spec.prompt, model: profile.model, quality: profile.quality, size: spec.size, id, projectId: input.projectId })
          .catch(async error => {
            const fallback = await this.writeMockImage({ id, projectId: input.projectId, title: spec.title, direction: input.direction.name, prompt: spec.prompt });
            return {
              ...fallback,
              notes: [
                'Reused generated local reference imagery so the design workflow could continue.',
                `OpenAI image generation failed and local reference imagery was used instead: ${error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180)}`
              ]
            };
          })
      : await this.writeMockImage({ id, projectId: input.projectId, title: spec.title, direction: input.direction.name, prompt: spec.prompt });
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
      generationLeaseOwner: undefined,
      generationLeaseUntil: undefined,
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
        n: 1
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

  private async writeMockImage(input: { id: string; projectId: string; title: string; direction: string; prompt: string }) {
    const reference = await this.copyGeneratedReferenceImage(input);
    if (reference) return reference;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset=".52" stop-color="#1f3b57"/><stop offset="1" stop-color="#16c7d4"/></linearGradient></defs>
  <rect width="1536" height="1024" fill="url(#g)"/>
  <rect x="840" y="170" width="420" height="300" rx="34" fill="#ffffff" opacity=".18"/>
  <rect x="900" y="240" width="430" height="320" rx="34" fill="#ffffff" opacity=".12"/>
  <rect x="770" y="540" width="500" height="250" rx="42" fill="#0f172a" opacity=".32"/>
  <circle cx="1180" cy="230" r="140" fill="#ffffff" opacity=".13"/>
  <circle cx="410" cy="740" r="230" fill="#ffffff" opacity=".08"/>
</svg>`;
    const file = await this.writeGeneratedFile(input.projectId, `${input.id}.svg`, Buffer.from(svg));
    return {
      provider: 'local_mock' as const,
      filePath: file.filePath,
      url: file.url,
      revisedPrompt: undefined,
      notes: ['OPENAI_API_KEY is not configured; saved a local non-text fallback image so the design workflow can continue without spend.']
    };
  }

  private async copyGeneratedReferenceImage(input: { id: string; projectId: string; title: string; prompt: string }) {
    const prompt = input.prompt.toLowerCase();
    const category = /(agency|marketing|branding|automation|professional service|web design)/.test(prompt)
      ? 'agency-premium-system'
      : /(saas|software|platform|dashboard|b2b)/.test(prompt)
        ? 'saas-command-center'
        : /(trade|plumber|electrician|builder|repair)/.test(prompt)
          ? 'local-trades-proof'
          : /(fruit|drink|juice|beverage)/.test(prompt)
            ? 'fruit-commerce-splash'
            : 'agency-premium-system';
    const preferred = input.title.toLowerCase().includes('hero') ? 'hero' : 'section';
    const candidates = [
      path.join(this.workspaceRoot, 'public', 'template-gallery', 'generated-imagery', category, `${preferred}-${category}.webp`),
      path.join(this.workspaceRoot, 'public', 'template-gallery', 'generated-imagery', category, `hero-${category}.webp`),
      path.join(this.workspaceRoot, 'public', 'template-gallery', 'generated-imagery', 'awarded-kinetic-agency', 'hero-awarded-kinetic-agency.webp')
    ];
    for (const candidate of candidates) {
      try {
        const buffer = await fs.readFile(candidate);
        const file = await this.writeGeneratedFile(input.projectId, `${input.id}.webp`, buffer);
        return {
          provider: 'local_mock' as const,
          filePath: file.filePath,
          url: file.url,
          revisedPrompt: undefined,
          notes: [`OPENAI_API_KEY is not configured; reused generated ${category} reference imagery for this industry.`]
        };
      } catch {
        // Try the next available generated reference image.
      }
    }
    return undefined;
  }

  private async writeGeneratedFile(projectId: string, fileName: string, buffer: Buffer) {
    const url = `/generated-images/${projectId}/${fileName}`;
    if (process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore({ name: process.env.AGENCY_BLOB_STORE || 'agency-data', consistency: 'strong' });
      const blobKey = `generated-images/${projectId}/${fileName}`;
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(arrayBuffer).set(buffer);
      await store.set(blobKey, arrayBuffer, { metadata: { contentType: contentTypeFor(fileName), projectId } });
      return {
        filePath: blobKey,
        url
      };
    }
    const relativeDir = path.join('public', 'generated-images', projectId);
    const absoluteDir = path.join(this.workspaceRoot, relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    const absolutePath = path.join(absoluteDir, fileName);
    await fs.writeFile(absolutePath, buffer);
    return {
      filePath: path.join(relativeDir, fileName).replaceAll('\\', '/'),
      url
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

function contentTypeFor(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
