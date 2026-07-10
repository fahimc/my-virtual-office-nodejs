import { createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const categories = [
  ['food-drink', 'fruit'],
  ['ecommerce', 'product'],
  ['saas', 'computer'],
  ['agency', 'office'],
  ['portfolio', 'camera'],
  ['local-business', 'business'],
  ['restaurant', 'restaurant'],
  ['healthcare', 'health'],
  ['fitness', 'fitness'],
  ['beauty', 'beauty'],
  ['real-estate', 'house'],
  ['trades', 'tools']
];

const root = path.resolve('public/placeholders');
const perCategory = Number(process.env.PLACEHOLDER_IMAGES_PER_CATEGORY || 20);
const licenseFilter = 'cc0';
const userAgent = 'my-virtual-office-nodejs/1.0 (placeholder image downloader)';

await fs.mkdir(root, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'Openverse API',
  licenseFilter,
  note: 'Downloaded thumbnails only. Review manifest entries before using final production assets.',
  categories: {}
};

for (const [category, query] of categories) {
  const dir = path.join(root, category);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  manifest.categories[category] = [];

  const results = await searchWordPressPhotos(query);
  for (const item of results) {
    if (manifest.categories[category].length >= perCategory) break;
    const imageUrl = item.thumbnail;
    if (!imageUrl) continue;
    const index = String(manifest.categories[category].length + 1).padStart(3, '0');
    const fileName = `${category}-${index}${path.extname(new URL(imageUrl).pathname) || '.jpg'}`;
    const outputPath = path.join(dir, fileName);
    try {
      await download(imageUrl, outputPath);
      manifest.categories[category].push({
        file: `/placeholders/${category}/${fileName}`,
        title: item.title || '',
        creator: '',
        license: 'CC0',
        source: 'WordPress Photo Directory',
        originalUrl: item.pageUrl || '',
        imageUrl
      });
      process.stdout.write('.');
    } catch (error) {
      process.stderr.write(`\nSkipped ${imageUrl}: ${error.message}\n`);
    }
  }
  process.stdout.write(` ${category}:${manifest.categories[category].length}\n`);
}

await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Downloaded ${Object.values(manifest.categories).reduce((sum, items) => sum + items.length, 0)} placeholder images.`);

async function searchWordPressPhotos(query) {
  const slug = encodeURIComponent(query.replace(/\s+/g, '-'));
  const url = `https://wordpress.org/photos/search/${slug}/`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`WordPress Photo Directory search failed: ${response.status}`);
  const html = await response.text();
  const items = [];
  const seen = new Set();
  const imagePattern = /https:\/\/pd\.w\.org\/[^"' <>)]+/g;
  for (const match of html.matchAll(imagePattern)) {
    const thumbnail = match[0]?.replace(/&amp;/g, '&');
    if (!thumbnail || !/-\d+x\d+\.(jpe?g|png|webp)$/i.test(thumbnail)) continue;
    const key = thumbnail.replace(/-\d+x\d+\.(jpe?g|png|webp)$/i, '.$1');
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ thumbnail, title: '', pageUrl: url });
  }
  return items;
}

async function download(url, outputPath) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok || !response.body) throw new Error(`download failed: ${response.status}`);
  await pipeline(response.body, createWriteStream(outputPath));
}
