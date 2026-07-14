import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MemoryStore } from '../dist/agency/memory/memoryStore.js';
import { BudgetPolicy } from '../dist/agency/runtime/budgetPolicy.js';
import { CostLedgerService } from '../dist/agency/tools/billing/costLedgerService.js';
import { ImageryGenerationService } from '../dist/agency/tools/design/imageryGenerationTool.js';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agency-imagery-test-'));
const originalFetch = globalThis.fetch;
let apiKey;
let fetchCount = 0;

const secrets = {
  async getSecret(name) {
    return name === 'OPENAI_API_KEY' ? apiKey : undefined;
  }
};

const designBrief = {
  projectId: 'project-imagery-test',
  customerId: 'customer-imagery-test',
  businessName: 'Northstar Studio',
  businessType: 'digital agency',
  targetAudience: 'growing service businesses',
  projectGoal: 'create a premium conversion-focused agency website',
  primaryConversionGoal: 'book a strategy call',
  secondaryGoals: ['show services', 'build trust'],
  competitorUrls: [],
  stylePreferences: ['editorial', 'modern'],
  dislikedStyles: ['generic stock photography'],
  requiredPages: ['Home', 'Services', 'About', 'Contact'],
  requiredFeatures: ['contact form'],
  availableAssets: [],
  missingAssets: ['photography'],
  assumptions: [],
  constraints: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const direction = {
  id: 'direction-imagery-test',
  projectId: designBrief.projectId,
  name: 'Editorial Confidence',
  summary: 'A premium editorial system with calm hierarchy and strong proof.',
  targetEmotion: 'confident',
  brandPersonality: ['clear', 'expert'],
  bestFor: 'professional services',
  risks: [],
  palette: [
    { name: 'Ink', hex: '#111827', usage: 'text' },
    { name: 'Cloud', hex: '#F8F7F2', usage: 'background' }
  ],
  typography: { heading: 'Manrope', body: 'Inter', scale: 'responsive', notes: 'clear hierarchy' },
  layoutStyle: 'editorial grid',
  sectionStyle: 'full-width sections',
  buttonStyle: 'high contrast',
  cardStyle: 'restrained',
  iconStyle: 'simple line icons',
  imageryStyle: 'authentic studio photography with architectural light',
  animationStyle: 'subtle reveal',
  homepageStructure: ['Hero', 'Services', 'Proof', 'Contact'],
  mobileApproach: 'mobile first',
  rationale: 'Supports credibility and conversion.'
};

try {
  delete process.env.NETLIFY;
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  delete process.env.AGENCY_REQUIRE_OPENAI_IMAGES;
  const store = new MemoryStore(path.join(tempDir, 'store.json'));
  const service = new ImageryGenerationService(
    store,
    new CostLedgerService(store),
    new BudgetPolicy(),
    tempDir,
    secrets
  );
  const input = {
    projectId: designBrief.projectId,
    customerId: designBrief.customerId,
    designBrief,
    direction,
    mode: 'standard',
    count: 3
  };

  const mockPlan = await service.generateWebsiteImagery({ ...input, provider: 'mock' });
  assert.equal(mockPlan.status, 'mocked');
  assert.equal(mockPlan.provider, 'local_mock');
  assert.equal(mockPlan.hero.provider, 'local_mock');

  apiKey = 'test-api-key';
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({
      data: [{ b64_json: Buffer.from(`generated-image-${fetchCount}`).toString('base64') }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const openAiPlan = await service.generateWebsiteImagery({ ...input, provider: 'auto' });
  assert.equal(openAiPlan.status, 'generated');
  assert.equal(openAiPlan.provider, 'openai');
  assert.equal(openAiPlan.hero.provider, 'openai');
  assert.equal(fetchCount, 3, 'all stale fallback images should be regenerated');
  await access(path.join(tempDir, openAiPlan.hero.filePath));

  const cachedPlan = await service.generateWebsiteImagery({ ...input, provider: 'auto' });
  assert.equal(cachedPlan.provider, 'openai');
  assert.equal(fetchCount, 3, 'a valid OpenAI plan should be reused');

  const failedProjectId = 'project-imagery-failure';
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'invalid generation request' } }), {
    status: 400,
    headers: { 'content-type': 'application/json' }
  });
  await assert.rejects(
    service.generateWebsiteImagery({ ...input, projectId: failedProjectId, designBrief: { ...designBrief, projectId: failedProjectId }, provider: 'openai' }),
    /OpenAI image generation failed: 400/
  );
  const failedData = await store.read();
  assert.equal(failedData.imageryPlans.some(item => item.projectId === failedProjectId), false);
  assert.equal(failedData.generatedImages.find(item => item.projectId === failedProjectId)?.status, 'failed');
  assert.match(failedData.generatedImages.find(item => item.projectId === failedProjectId)?.notes.at(-1) || '', /OpenAI image generation failed/);

  console.log('OpenAI imagery provider and stale-plan regression: passed');
} finally {
  globalThis.fetch = originalFetch;
  await rm(tempDir, { recursive: true, force: true });
}
