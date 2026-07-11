import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const galleryDir = path.join(root, 'public', 'template-gallery');
const imageryDir = path.join(galleryDir, 'generated-imagery');
const templateDataPath = path.join(galleryDir, 'template-data.json');

await loadEnvFile(path.join(root, '.env'));

const budgetGbp = Number(process.env.TEMPLATE_IMAGE_BUDGET_GBP || 1);
const gbpToUsd = Number(process.env.TEMPLATE_IMAGE_GBP_TO_USD || 1.34);
const budgetUsd = budgetGbp * gbpToUsd;
const model = process.env.TEMPLATE_IMAGE_MODEL || 'gpt-image-1-mini';
const quality = process.env.TEMPLATE_IMAGE_QUALITY || 'low';
const size = process.env.TEMPLATE_IMAGE_SIZE || '1536x1024';
const imagesPerTemplate = Math.max(1, Math.min(Number(process.env.TEMPLATE_IMAGES_PER_TEMPLATE || 3), 4));
const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

const pricing = {
  source: 'OpenAI API pricing',
  sourceUrl: 'https://developers.openai.com/api/docs/pricing',
  model,
  textInputPer1MTokensUsd: model === 'gpt-image-2' ? 5 : 2,
  imageOutputPer1MTokensUsd: model === 'gpt-image-2' ? 30 : 8
};

const outputTokensByQuality = {
  low: 900,
  medium: 2600,
  high: 5200
};

await mkdir(imageryDir, { recursive: true });

const templateData = JSON.parse(await readFile(templateDataPath, 'utf8'));
const manifest = {
  generatedAt: new Date().toISOString(),
  provider: hasOpenAiKey ? 'openai' : 'local_mock',
  budget: {
    capGbp: budgetGbp,
    gbpToUsd,
    capUsd: Number(budgetUsd.toFixed(4)),
    estimatedSpendUsd: 0,
    estimatedSpendGbp: 0
  },
  pricing,
  model,
  quality,
  size,
  imagesPerTemplate,
  templates: {},
  skipped: [],
  notes: [
    hasOpenAiKey
      ? 'Images were generated with the OpenAI image API until the estimated GBP budget cap was reached.'
      : 'OPENAI_API_KEY was not set, so local mock SVG imagery was generated and no API spend occurred.'
  ]
};

let estimatedSpendUsd = 0;

for (const template of templateData.templates) {
  const templateDir = path.join(imageryDir, template.id);
  await mkdir(templateDir, { recursive: true });
  manifest.templates[template.id] = {
    id: template.id,
    category: template.category,
    title: template.title,
    images: [],
    estimatedSpendUsd: 0,
    estimatedSpendGbp: 0
  };

  const specs = imageSpecs(template).slice(0, imagesPerTemplate);
  for (const spec of specs) {
    const estimate = estimateCost(spec.prompt);
    if (estimatedSpendUsd + estimate.estimatedCostUsd > budgetUsd) {
      manifest.skipped.push({
        templateId: template.id,
        title: spec.title,
        reason: 'Budget cap would be exceeded',
        estimatedCostUsd: estimate.estimatedCostUsd
      });
      continue;
    }
    const fileBase = `${slug(spec.kind)}-${slug(template.id)}`;
    const result = hasOpenAiKey
      ? await generateOpenAiImage({ prompt: spec.prompt, fileBase, templateDir })
      : await generateMockImage({ template, spec, fileBase, templateDir });
    estimatedSpendUsd += estimate.estimatedCostUsd;
    const record = {
      title: spec.title,
      kind: spec.kind,
      file: `/template-gallery/generated-imagery/${template.id}/${result.fileName}`,
      provider: result.provider,
      prompt: spec.prompt,
      model,
      quality,
      size,
      estimatedInputTokens: estimate.estimatedInputTokens,
      estimatedOutputTokens: estimate.estimatedOutputTokens,
      estimatedCostUsd: estimate.estimatedCostUsd,
      estimatedCostGbp: Number((estimate.estimatedCostUsd / gbpToUsd).toFixed(6))
    };
    manifest.templates[template.id].images.push(record);
    manifest.templates[template.id].estimatedSpendUsd = Number((manifest.templates[template.id].estimatedSpendUsd + record.estimatedCostUsd).toFixed(6));
    manifest.templates[template.id].estimatedSpendGbp = Number((manifest.templates[template.id].estimatedSpendUsd / gbpToUsd).toFixed(6));
    process.stdout.write('.');
  }
  process.stdout.write(` ${template.id}:${manifest.templates[template.id].images.length}\n`);
}

manifest.budget.estimatedSpendUsd = Number(estimatedSpendUsd.toFixed(6));
manifest.budget.estimatedSpendGbp = Number((estimatedSpendUsd / gbpToUsd).toFixed(6));

await writeFile(path.join(imageryDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Template imagery ready. Estimated spend: $${manifest.budget.estimatedSpendUsd} / £${manifest.budget.estimatedSpendGbp}. Provider: ${manifest.provider}.`);

function imageSpecs(template) {
  const brand = `${template.client} ${template.category}`.trim();
  const palette = template.palette?.join(', ') || 'brand palette from design system';
  const common = [
    `Client: ${template.client}`,
    `Template: ${template.title}`,
    `Industry/category: ${template.category}`,
    `Headline: ${template.headline}`,
    `Style references: ${(template.inspiration || []).join(', ')}`,
    `Palette cues: ${palette}`,
    [
      'High-end commercial website imagery with clean negative space for HTML UI overlays.',
      'Absolute hard rule: the image must contain no text of any kind.',
      'No typography, no letters, no words, no numbers, no signage, no interface labels, no logo marks, no watermark, no poster text, no brand names, no decorative background type.',
      'Use only objects, environments, people, abstract light, product forms, texture, and atmosphere.'
    ].join(' ')
  ].join('\n');
  return [
    {
      kind: 'hero',
      title: 'Hero image',
      prompt: `${common}\nCreate a premium homepage hero background for ${brand}. Make it visually distinctive and suitable for a DaisyUI web template.`
    },
    {
      kind: 'section',
      title: 'Section image',
      prompt: `${common}\nCreate a supporting section image for these website sections: ${(template.sections || []).join(', ')}. It should work inside cards or editorial blocks.`
    },
    {
      kind: 'background',
      title: 'Background image',
      prompt: `${common}\nCreate a subtle atmospheric background/content image that can sit behind proof, CTA, or feature sections without hurting text readability.`
    },
    {
      kind: 'content',
      title: 'Content image',
      prompt: `${common}\nCreate an interior page content image that feels polished, useful, and specific to the client category.`
    }
  ];
}

function estimateCost(prompt) {
  const estimatedInputTokens = Math.max(80, Math.ceil(prompt.length / 4));
  const estimatedOutputTokens = outputTokensByQuality[quality] || outputTokensByQuality.low;
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCostUsd: Number((((estimatedInputTokens / 1_000_000) * pricing.textInputPer1MTokensUsd) + ((estimatedOutputTokens / 1_000_000) * pricing.imageOutputPer1MTokensUsd)).toFixed(6))
  };
}

async function generateOpenAiImage(input) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      quality,
      size,
      n: 1
    })
  });
  if (!response.ok) throw new Error(`OpenAI image generation failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
  const json = await response.json();
  const fileName = `${input.fileBase}.webp`;
  const b64 = json.data?.[0]?.b64_json;
  if (b64) {
    await writeOptimizedWebp(path.join(input.templateDir, fileName), Buffer.from(b64, 'base64'));
    return { provider: 'openai', fileName };
  }
  const url = json.data?.[0]?.url;
  if (url) {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) throw new Error(`OpenAI image URL download failed: ${imageResponse.status}`);
    await writeOptimizedWebp(path.join(input.templateDir, fileName), Buffer.from(await imageResponse.arrayBuffer()));
    return { provider: 'openai', fileName };
  }
  throw new Error('OpenAI image response did not include b64_json or url');
}

async function writeOptimizedWebp(filePath, buffer) {
  const webp = await sharp(buffer)
    .rotate()
    .resize({ width: 1536, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();
  await writeFile(filePath, webp);
}

async function generateMockImage(input) {
  const [a = '#111827', b = '#2563eb', c = '#f59e0b'] = input.template.palette || [];
  const fileName = `${input.fileBase}.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${escapeXml(a)}"/><stop offset=".52" stop-color="${escapeXml(b)}"/><stop offset="1" stop-color="${escapeXml(c)}"/></linearGradient>
    <radialGradient id="r" cx=".72" cy=".28" r=".54"><stop stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1536" height="1024" fill="url(#g)"/>
  <rect width="1536" height="1024" fill="url(#r)"/>
  <circle cx="1170" cy="250" r="170" fill="#fff" opacity=".15"/>
  <circle cx="350" cy="760" r="260" fill="#000" opacity=".13"/>
  <path d="M0 820 C260 710 430 900 710 780 C990 660 1130 730 1536 610 L1536 1024 L0 1024 Z" fill="#fff" opacity=".16"/>
  <rect x="92" y="118" width="520" height="28" rx="14" fill="#fff" opacity=".38"/>
  <rect x="92" y="172" width="760" height="54" rx="27" fill="#fff" opacity=".18"/>
  <rect x="92" y="254" width="430" height="22" rx="11" fill="#fff" opacity=".24"/>
  <g opacity=".20">
    <circle cx="980" cy="660" r="86" fill="#fff"/>
    <circle cx="1100" cy="710" r="54" fill="#fff"/>
    <circle cx="1210" cy="620" r="122" fill="#fff"/>
  </g>
</svg>`;
  await writeFile(path.join(input.templateDir, fileName), svg);
  return { provider: 'local_mock', fileName };
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
}

function escapeXml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      const raw = trimmed.slice(index + 1).trim();
      if (!key || process.env[key]) continue;
      process.env[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env is optional for local development.
  }
}
