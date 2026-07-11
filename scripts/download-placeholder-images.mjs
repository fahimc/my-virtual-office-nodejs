import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const categorySearches = {
  'food-drink': ['fresh fruit drink', 'fruit market', 'juice bottle', 'citrus'],
  ecommerce: ['product studio', 'fashion product', 'shopping', 'retail display'],
  saas: ['computer', 'laptop', 'desk', 'technology', 'data', 'workspace'],
  agency: ['office', 'workspace', 'meeting', 'desk', 'studio', 'business'],
  portfolio: ['camera', 'artist studio', 'gallery', 'creative work'],
  'local-business': ['business', 'shop', 'education', 'store', 'service', 'workplace'],
  restaurant: ['restaurant', 'cafe', 'coffee', 'dining', 'food', 'chef'],
  healthcare: ['clinic', 'wellness', 'medical office', 'health', 'doctor', 'hospital', 'medicine', 'care'],
  fitness: ['gym training', 'fitness studio', 'running', 'workout'],
  beauty: ['beauty salon', 'spa', 'skincare', 'cosmetics'],
  'real-estate': ['modern house', 'interior design', 'architecture', 'apartment'],
  trades: ['tools', 'construction', 'workshop', 'electrician']
};

const root = path.resolve('public/placeholders');
const perCategory = Number(process.env.PLACEHOLDER_IMAGES_PER_CATEGORY || 12);
const minWidth = Number(process.env.PLACEHOLDER_MIN_WIDTH || 1400);
const minHeight = Number(process.env.PLACEHOLDER_MIN_HEIGHT || 850);
const maxOutputWidth = Number(process.env.PLACEHOLDER_MAX_OUTPUT_WIDTH || 2400);
const maxOutputHeight = Number(process.env.PLACEHOLDER_MAX_OUTPUT_HEIGHT || 1800);
const outputQuality = Number(process.env.PLACEHOLDER_OUTPUT_QUALITY || 84);
const maxCandidatesPerSearch = Number(process.env.PLACEHOLDER_MAX_CANDIDATES || 40);
const userAgent = 'my-virtual-office-nodejs/1.0 (CC0 hero image downloader; contact local dev)';

await fs.mkdir(root, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'WordPress Photo Directory',
  licenseFilter: 'CC0',
  note: 'Original high-resolution CC0 images downloaded from WordPress Photo Directory search pages. Validate final client production imagery against the project brief before launch.',
  qualityRules: {
    minWidth,
    minHeight,
    maxOutputWidth,
    maxOutputHeight,
    outputQuality,
    preferredHeroAspectRatio: '1.25-2.4',
    rejectBrokenFiles: true
  },
  categories: {}
};

const qualityReport = {
  generatedAt: manifest.generatedAt,
  totals: {
    downloaded: 0,
    accepted: 0,
    rejected: 0
  },
  categories: {}
};

for (const [category, searches] of Object.entries(categorySearches)) {
  const dir = path.join(root, category);
  await rmWithRetry(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  manifest.categories[category] = [];
  qualityReport.categories[category] = { accepted: [], rejected: [] };

  const candidates = await collectCandidates(searches);
  for (let offset = 0; offset < candidates.length && manifest.categories[category].length < perCategory; offset += 6) {
    const batch = candidates.slice(offset, offset + 6);
    const results = await Promise.all(batch.map((item, batchIndex) => processCandidate(category, dir, item, offset + batchIndex)));
    for (const result of results) {
      if (!result.accepted) {
        qualityReport.totals.rejected += 1;
        qualityReport.categories[category].rejected.push(result.record);
        process.stdout.write('x');
        continue;
      }
      if (manifest.categories[category].length >= perCategory) {
        continue;
      }
      const index = String(manifest.categories[category].length + 1).padStart(3, '0');
      const fileName = `${category}-${index}.webp`;
      const finalPath = path.join(dir, fileName);
      await fs.writeFile(finalPath, result.buffer);
      const record = {
        ...result.record,
        file: `/placeholders/${category}/${fileName}`
      };
      manifest.categories[category].push(record);
      qualityReport.totals.accepted += 1;
      qualityReport.categories[category].accepted.push(record);
      process.stdout.write('.');
    }
  }

  process.stdout.write(` ${category}:${manifest.categories[category].length}/${perCategory}\n`);
}

await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(root, 'quality-report.json'), JSON.stringify(qualityReport, null, 2));
console.log(`Accepted ${qualityReport.totals.accepted} high-resolution CC0 images. Rejected ${qualityReport.totals.rejected}.`);

async function collectCandidates(searches) {
  const seen = new Set();
  const candidates = [];
  for (const searchTerm of searches) {
    const results = await searchWordPressPhotos(searchTerm);
    for (const item of results) {
      if (seen.has(item.originalImageUrl)) continue;
      seen.add(item.originalImageUrl);
      candidates.push({ ...item, searchTerm });
    }
  }
  return candidates;
}

async function processCandidate(category, dir, item, sequence) {
  try {
    const downloadResult = await fetchImageBuffer(item.originalImageUrl);
    qualityReport.totals.downloaded += 1;
    const optimized = await optimizeImage(downloadResult.buffer);
    const quality = optimized.quality;
    const verdict = scoreQuality(quality);
    const record = {
      file: '',
      title: item.title || '',
      creator: '',
      license: 'CC0',
      source: 'WordPress Photo Directory',
      originalUrl: item.pageUrl || item.searchUrl,
      imageUrl: item.originalImageUrl,
      searchTerm: item.searchTerm,
      width: quality.width,
      height: quality.height,
      originalWidth: quality.originalWidth,
      originalHeight: quality.originalHeight,
      aspectRatio: quality.aspectRatio,
      fileSizeBytes: quality.fileSizeBytes,
      qualityScore: verdict.score,
      heroCandidate: verdict.heroCandidate,
      qualityNotes: verdict.notes
    };
    if (!verdict.accepted) {
      return { accepted: false, record };
    }
    return { accepted: true, record, buffer: optimized.buffer };
  } catch (error) {
    return {
      accepted: false,
      record: {
        source: item.originalImageUrl,
        searchTerm: item.searchTerm,
        error: error.message
      }
    };
  }
}

async function rmWithRetry(targetPath, options, attempts = 8) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await fs.rm(targetPath, options);
      return;
    } catch (error) {
      if (!['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(error.code) || attempt === attempts) throw error;
      await wait(120 * attempt);
    }
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWordPressPhotos(query) {
  const slug = encodeURIComponent(query.replace(/\s+/g, '-'));
  const url = `https://wordpress.org/photos/search/${slug}/`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`WordPress Photo Directory search failed: ${response.status}`);
  const html = await response.text();
  const items = [];
  const seen = new Set();
  const imagePattern = /https:\/\/pd\.w\.org\/[^"' <>)]+?(?:-\d+x\d+)?\.(?:jpe?g|png|webp)/gi;
  const pagePattern = /https:\/\/wordpress\.org\/photos\/photo\/[^"' <>)]+/gi;
  const pages = [...html.matchAll(pagePattern)].map(match => match[0]);

  for (const match of html.matchAll(imagePattern)) {
    const thumbnail = match[0]?.replace(/&amp;/g, '&');
    const originalImageUrl = toOriginalImageUrl(thumbnail);
    if (!originalImageUrl || seen.has(originalImageUrl)) continue;
    seen.add(originalImageUrl);
    if (items.length >= maxCandidatesPerSearch) break;
    items.push({
      thumbnail,
      originalImageUrl,
      title: '',
      pageUrl: pages[items.length] || url,
      searchUrl: url
    });
  }
  return items;
}

function toOriginalImageUrl(url) {
  return String(url || '').replace(/-\d+x\d+(\.(?:jpe?g|png|webp))(?:\?.*)?$/i, '$1');
}

async function fetchImageBuffer(url) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok || !response.body) throw new Error(`download failed: ${response.status}`);
  return {
    contentType: response.headers.get('content-type') || '',
    buffer: Buffer.from(await response.arrayBuffer())
  };
}

async function optimizeImage(buffer) {
  const original = await sharp(buffer).metadata();
  if (!original.width || !original.height) throw new Error('unable to read source image dimensions');
  const output = await sharp(buffer)
    .rotate()
    .resize({
      width: maxOutputWidth,
      height: maxOutputHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: outputQuality, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const optimized = output.info;
  return {
    buffer: output.data,
    quality: {
      type: 'webp',
      width: optimized.width,
      height: optimized.height,
      originalWidth: original.width,
      originalHeight: original.height,
      aspectRatio: Number((optimized.width / optimized.height).toFixed(2)),
      fileSizeBytes: output.data.byteLength
    }
  };
}

function scoreQuality(image) {
  const notes = [];
  let score = 100;
  if (image.width < minWidth) {
    score -= 35;
    notes.push(`width below ${minWidth}px`);
  }
  if (image.height < minHeight) {
    score -= 35;
    notes.push(`height below ${minHeight}px`);
  }
  if (image.fileSizeBytes < 120_000) {
    score -= 15;
    notes.push('file size suggests over-compression or tiny image');
  }
  if (image.aspectRatio < 0.72 || image.aspectRatio > 2.8) {
    score -= 12;
    notes.push('extreme aspect ratio');
  }
  const heroCandidate = image.width >= minWidth && image.height >= minHeight && image.aspectRatio >= 1.05 && image.aspectRatio <= 2.5;
  if (!heroCandidate) notes.push('better for cards/crops than full hero background');
  return {
    accepted: image.width >= minWidth && image.height >= minHeight,
    heroCandidate,
    score: Math.max(0, score),
    notes
  };
}
