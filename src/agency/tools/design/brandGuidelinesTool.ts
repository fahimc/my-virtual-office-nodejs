import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { nowIso } from '../../memory/memoryStore.js';
import type { BrandGuidelines, BrandGuidelinesColor } from '../../schemas/brandGuidelines.schema.js';
import type { ComponentSpec } from '../../schemas/componentSpec.schema.js';
import type { CreativeDirection } from '../../schemas/creativeDirection.schema.js';
import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import type { DesignHandoff } from '../../schemas/designHandoff.schema.js';
import type { DesignTokens } from '../../schemas/designTokens.schema.js';

const execFile = promisify(execFileCallback);

export interface BrandGuidelinesInput {
  designBrief: DesignBrief;
  direction: CreativeDirection;
  tokens: DesignTokens;
  componentSpec: ComponentSpec;
  handoff: DesignHandoff;
}

export interface BrandGuidelinesOutput {
  guidelines: BrandGuidelines;
  htmlPath: string;
  htmlUrl: string;
  pdfPath: string;
  pdfUrl: string;
}

export async function createBrandGuidelinesFiles(input: BrandGuidelinesInput): Promise<BrandGuidelinesOutput> {
  const guidelines = createBrandGuidelines(input);
  const publicDir = path.join(process.cwd(), 'public');
  const relativeDir = path.join('generated', 'brand-guidelines', guidelines.projectId);
  const outputDir = path.join(publicDir, relativeDir);
  await mkdir(outputDir, { recursive: true });

  const htmlPath = path.join(outputDir, 'brand-guidelines.html');
  const pdfPath = path.join(outputDir, 'brand-guidelines.pdf');
  const htmlUrl = `/${relativeDir.replaceAll(path.sep, '/')}/brand-guidelines.html`;
  const pdfUrl = `/${relativeDir.replaceAll(path.sep, '/')}/brand-guidelines.pdf`;
  guidelines.htmlUrl = htmlUrl;
  guidelines.pdfUrl = pdfUrl;

  await writeFile(htmlPath, renderBrandGuidelinesHtml(guidelines), 'utf8');
  await renderPdfFromHtml(htmlPath, pdfPath, guidelines);

  return { guidelines, htmlPath, htmlUrl, pdfPath, pdfUrl };
}

export function createBrandGuidelines(input: BrandGuidelinesInput): BrandGuidelines {
  const headingFamily = String(input.tokens.typography.heading || input.direction.typography.heading);
  const bodyFamily = String(input.tokens.typography.body || input.direction.typography.body);
  const colors = input.direction.palette.map(color => enrichColor(color));
  return {
    projectId: input.designBrief.projectId,
    customerId: input.designBrief.customerId,
    brandName: input.designBrief.businessName,
    businessType: input.designBrief.businessType,
    brandIdea: createBrandIdea(input),
    creativeDirection: input.direction.name,
    personality: input.direction.brandPersonality,
    logoUsage: {
      primaryLockup: 'Use the primary wordmark on light surfaces. Keep the mark simple and avoid placing it on busy imagery without a solid or blurred backing.',
      clearSpace: 'Keep clear space around the logo at least equal to the height of the first capital letter.',
      minimumSize: 'Do not use the primary logo below 120px wide on digital surfaces.',
      donts: ['Do not stretch or distort the logo', 'Do not recolour it outside the approved palette', 'Do not place it over low-contrast image areas']
    },
    colors,
    typography: [
      { role: 'Headings', family: headingFamily, weight: '700-900', sizeGuidance: 'Use the approved modular scale; keep mobile headings compact and readable.', usage: 'Hero, section headings, campaign statements' },
      { role: 'Body', family: bodyFamily, weight: '400-500', sizeGuidance: '16-18px body copy with 1.5-1.7 line height.', usage: 'Paragraphs, product copy, service explanations' },
      { role: 'Interface', family: bodyFamily, weight: '600-700', sizeGuidance: '14-16px labels with clear tap targets.', usage: 'Buttons, navigation, badges, forms' }
    ],
    imageryStyle: [
      input.direction.imageryStyle,
      'Avoid images with embedded text because the website applies live text overlays.',
      'Leave negative space for headlines and CTAs in hero images.',
      'Use real or generated category-specific imagery before abstract decoration.'
    ],
    voiceAndTone: {
      summary: 'Clear, confident, specific, and conversion-focused without sounding generic.',
      do: ['Lead with concrete customer value', 'Use plain language', 'Keep calls to action action-oriented', 'Support claims with proof'],
      avoid: ['Internal production labels', 'Template wording', 'Vague premium/modern filler', 'Overpromising unsupported outcomes']
    },
    layoutSystem: {
      container: input.tokens.containers.page || '1120px',
      grid: 'Use reusable sections with a 12-column desktop grid and single-column mobile flow.',
      spacing: input.tokens.spacing.section || '80px section rhythm',
      radius: input.tokens.radius.lg || '12px'
    },
    componentRules: input.componentSpec.components.map(component => ({
      component: component.name,
      guidance: `${component.purpose}. Anatomy: ${component.anatomy.join(', ')}. Variants: ${component.variants.join(', ')}.`
    })),
    accessibility: {
      contrastStandard: 'Target WCAG AA contrast. Body text should be at least 4.5:1; large display text should be at least 3:1.',
      rules: [
        'Check every foreground/background token pair before publishing.',
        'Buttons must remain at least 44px tall on touch devices.',
        'Do not rely on colour alone to communicate state.',
        'Use live HTML text over images, never text baked into generated hero imagery.'
      ]
    },
    usageDos: [
      'Use the approved palette through CSS variables and DaisyUI/Tailwind tokens.',
      'Repeat the primary CTA after proof-heavy sections.',
      'Keep imagery, typography, and buttons consistent across page templates.'
    ],
    usageDonts: [
      'Do not mix a second UI library without approval.',
      'Do not create one-off colours outside the token set.',
      'Do not use placeholder or production-process labels in client-facing pages.'
    ],
    createdAt: nowIso()
  };
}

function enrichColor(color: { name: string; hex: string; usage: string }): BrandGuidelinesColor {
  const contrastOnWhite = contrastRatio(color.hex, '#FFFFFF');
  const contrastOnDark = contrastRatio(color.hex, '#111827');
  return {
    ...color,
    contrastOnWhite,
    contrastOnDark,
    recommendedText: contrastRatio(color.hex, '#111827') >= contrastRatio(color.hex, '#FFFFFF') ? 'dark' : 'light'
  };
}

function createBrandIdea(input: BrandGuidelinesInput): string {
  const summary = input.direction.summary.trim();
  if (summary) return summary;
  const goal = input.designBrief.projectGoal.replace(/\s+/g, ' ').trim();
  return goal.length > 170 ? `${goal.slice(0, 167).trim()}...` : goal;
}

function renderBrandGuidelinesHtml(guidelines: BrandGuidelines): string {
  const primary = guidelines.colors[0]?.hex || '#111827';
  const secondary = guidelines.colors[1]?.hex || '#E5E7EB';
  const accent = guidelines.colors[2]?.hex || '#2563EB';
  const light = guidelines.colors.find(color => color.recommendedText === 'dark')?.hex || '#F8F7F2';
  const dark = guidelines.colors.find(color => color.recommendedText === 'light')?.hex || '#111827';
  const colorRows = guidelines.colors.map((color, index) => renderColorRow(color, index)).join('');
  const colorTiles = guidelines.colors.slice(0, 5).map(color => `<span style="background:${escapeAttr(color.hex)}"></span>`).join('');
  const typeCards = guidelines.typography.map(rule => `
    <article class="type-card">
      <p class="label">${escapeHtml(rule.role)}</p>
      <h3>${escapeHtml(rule.family)}</h3>
      <p>${escapeHtml(rule.weight)} - ${escapeHtml(rule.sizeGuidance)}</p>
      <p class="small">${escapeHtml(rule.usage)}</p>
    </article>`).join('');
  const componentCards = guidelines.componentRules.slice(0, 6).map(rule => `
    <article class="component-card">
      <p class="label">${escapeHtml(rule.component)}</p>
      <p>${escapeHtml(rule.guidance)}</p>
    </article>`).join('');
  const title = `${guidelines.brandName} Brand Guidelines`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root {
      --primary:${primary};
      --secondary:${secondary};
      --accent:${accent};
      --light:${light};
      --dark:${dark};
      --ink:#111827;
      --muted:#667085;
      --paper:#f3f1ea;
      --line:rgba(17,24,39,.14);
      --white:#ffffff;
    }
    * { box-sizing: border-box; }
    html { background: var(--paper); }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .book { width: 210mm; margin: 0 auto; }
    .sheet {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      overflow: hidden;
      background: var(--white);
      page-break-after: always;
      padding: 20mm;
    }
    .sheet:last-child { page-break-after: auto; }
    .sheet--cover {
      color: #fff;
      background:
        radial-gradient(circle at 82% 18%, rgba(255,255,255,.3), transparent 27%),
        linear-gradient(135deg, rgba(0,0,0,.14), rgba(0,0,0,.42)),
        linear-gradient(135deg, var(--primary), var(--accent));
      display: grid;
      align-content: space-between;
    }
    .cover-mark { display: flex; align-items: center; gap: 12px; font-weight: 900; letter-spacing: .02em; }
    .mark-box {
      width: 42px; height: 42px; border: 2px solid rgba(255,255,255,.75); border-radius: 14px;
      display: grid; place-items: center; font-weight: 950;
    }
    .cover-kicker {
      width: max-content;
      border: 1px solid rgba(255,255,255,.32);
      border-radius: 999px;
      padding: 9px 14px;
      background: rgba(255,255,255,.14);
      font-size: 12px;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    h1, h2, h3, p { margin: 0; }
    h1 {
      max-width: 150mm;
      margin-top: 24mm;
      font-size: 58pt;
      line-height: .9;
      letter-spacing: -.02em;
    }
    h2 {
      max-width: 145mm;
      font-size: 33pt;
      line-height: .95;
      letter-spacing: -.015em;
    }
    h3 { font-size: 15pt; line-height: 1.1; letter-spacing: -.01em; }
    .cover-copy { max-width: 128mm; margin-top: 10mm; color: rgba(255,255,255,.86); font-size: 13pt; }
    .cover-meta { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 14mm; color: rgba(255,255,255,.78); font-size: 9pt; }
    .palette-strip { display: flex; gap: 5px; }
    .palette-strip span { width: 30px; height: 54px; border-radius: 999px; border: 1px solid rgba(255,255,255,.42); }
    .page-title { display: flex; justify-content: space-between; gap: 18mm; align-items: start; margin-bottom: 16mm; }
    .folio { color: var(--muted); font-size: 9pt; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
    .intro { max-width: 112mm; color: var(--muted); font-size: 11pt; margin-top: 5mm; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 8mm;
      background: #fff;
      box-shadow: 0 18px 45px rgba(17,24,39,.07);
    }
    .panel--dark { background: var(--dark); color: #fff; border: 0; }
    .panel--tint { background: linear-gradient(135deg, rgba(255,255,255,.9), color-mix(in srgb, var(--secondary) 18%, white)); }
    .label {
      color: var(--accent);
      font-size: 8pt;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 5mm;
    }
    .body-copy { color: var(--muted); font-size: 10.5pt; }
    .large-statement { font-size: 27pt; line-height: 1; letter-spacing: -.02em; font-weight: 900; }
    .wordmark-demo {
      display: grid;
      place-items: center;
      min-height: 56mm;
      border: 1px dashed rgba(17,24,39,.22);
      border-radius: 18px;
      background: linear-gradient(135deg, #fff, color-mix(in srgb, var(--light) 64%, white));
      font-size: 34pt;
      font-weight: 950;
      letter-spacing: -.04em;
    }
    .clearspace-demo { margin-top: 7mm; padding: 8mm; border-radius: 14px; background: #f8fafc; color: var(--muted); font-size: 9pt; }
    .dont-card { padding: 5mm; border-radius: 12px; background: #fff1f2; color: #7f1d1d; font-size: 9pt; font-weight: 700; }
    .color-table { display: grid; gap: 4mm; }
    .color-row {
      display: grid;
      grid-template-columns: 28mm 1fr 30mm;
      gap: 6mm;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 15px;
      padding: 4mm;
      background: #fff;
    }
    .chip { height: 22mm; border-radius: 12px; border: 1px solid rgba(17,24,39,.18); }
    .color-name { font-weight: 900; font-size: 12pt; }
    .color-meta { color: var(--muted); font-size: 8.5pt; }
    .contrast-badge { text-align: center; border-radius: 999px; padding: 3mm 2mm; font-weight: 900; font-size: 8pt; background: #f8fafc; }
    .type-card { min-height: 43mm; }
    .type-card h3 { font-size: 17pt; }
    .small { color: var(--muted); font-size: 8.5pt; margin-top: 4mm; }
    .specimen {
      margin-top: 12mm;
      padding: 10mm;
      border-radius: 18px;
      background: var(--dark);
      color: #fff;
    }
    .specimen strong { display: block; font-size: 31pt; line-height: .95; letter-spacing: -.02em; margin-bottom: 4mm; }
    .list { display: grid; gap: 4mm; padding: 0; list-style: none; margin: 0; }
    .list li { position: relative; padding-left: 7mm; color: var(--muted); font-size: 9.5pt; }
    .list li:before { content: ""; position: absolute; left: 0; top: .55em; width: 3mm; height: 3mm; border-radius: 50%; background: var(--accent); }
    .component-card { border-left: 4px solid var(--accent); padding: 5mm; border-radius: 12px; background: #f8fafc; }
    .component-card p:last-child { color: var(--muted); font-size: 8.5pt; }
    .footer-note { position: absolute; left: 20mm; right: 20mm; bottom: 13mm; display: flex; justify-content: space-between; color: #98a2b3; font-size: 8pt; }
    @media screen {
      .book { padding: 24px 0; }
      .sheet { margin: 0 auto 28px; box-shadow: 0 24px 80px rgba(15,23,42,.18); }
    }
    @media screen and (max-width: 840px) {
      .book { width: 100%; padding: 0; }
      .sheet { width: 100%; min-height: auto; padding: 30px 24px 70px; border-bottom: 8px solid var(--paper); box-shadow: none; }
      .sheet--cover { min-height: 720px; }
      h1 { font-size: 56px; }
      h2 { font-size: 38px; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .color-row { grid-template-columns: 80px 1fr; }
      .contrast-badge { grid-column: 2; text-align: left; }
      .footer-note { position: static; margin-top: 36px; }
    }
  </style>
</head>
<body>
  <main class="book">
    <section class="sheet sheet--cover">
      <div class="cover-mark"><span class="mark-box">${escapeHtml(initials(guidelines.brandName))}</span><span>${escapeHtml(guidelines.brandName)}</span></div>
      <div>
        <div class="cover-kicker">Brand identity guidelines</div>
        <h1>${escapeHtml(guidelines.brandName)}</h1>
        <p class="cover-copy">${escapeHtml(guidelines.creativeDirection)} - ${escapeHtml(guidelines.brandIdea)}</p>
      </div>
      <div class="cover-meta">
        <p>Prepared by the AI Agency design studio<br>${escapeHtml(new Date(guidelines.createdAt).toLocaleDateString('en-GB'))}</p>
        <div class="palette-strip">${colorTiles}</div>
      </div>
    </section>

    <section class="sheet">
      ${pageHeader('01', 'Brand foundation', 'The strategic decisions that keep the brand recognizable across the website, sales material, and client communications.')}
      <div class="grid-2">
        <article class="panel panel--dark"><p class="label">Creative direction</p><p class="large-statement">${escapeHtml(guidelines.creativeDirection)}</p></article>
        <article class="panel panel--tint"><p class="label">Personality</p><p class="large-statement">${escapeHtml(guidelines.personality.slice(0, 4).join(', '))}</p></article>
      </div>
      <div class="grid-2" style="margin-top:7mm">
        <article class="panel"><p class="label">Voice and tone</p><p class="body-copy">${escapeHtml(guidelines.voiceAndTone.summary)}</p></article>
        <article class="panel"><p class="label">Layout principle</p><p class="body-copy">${escapeHtml(guidelines.layoutSystem.grid)}</p></article>
      </div>
      ${footer(guidelines.brandName, 'Foundation')}
    </section>

    <section class="sheet">
      ${pageHeader('02', 'Logo and clear space', 'Rules for using the primary wordmark consistently without crowding, distortion, or low-contrast placement.')}
      <div class="wordmark-demo">${escapeHtml(guidelines.brandName)}</div>
      <div class="grid-2" style="margin-top:8mm">
        <article class="panel"><p class="label">Primary lockup</p><p class="body-copy">${escapeHtml(guidelines.logoUsage.primaryLockup)}</p></article>
        <article class="panel"><p class="label">Clear space</p><p class="body-copy">${escapeHtml(guidelines.logoUsage.clearSpace)} Minimum digital width: ${escapeHtml(guidelines.logoUsage.minimumSize)}</p></article>
      </div>
      <div class="grid-3" style="margin-top:8mm">${guidelines.logoUsage.donts.map(item => `<div class="dont-card">${escapeHtml(item)}</div>`).join('')}</div>
      ${footer(guidelines.brandName, 'Logo')}
    </section>

    <section class="sheet">
      ${pageHeader('03', 'Colour system', 'A practical palette with contrast notes so the site can stay expressive and readable.')}
      <div class="color-table">${colorRows}</div>
      ${footer(guidelines.brandName, 'Colour')}
    </section>

    <section class="sheet">
      ${pageHeader('04', 'Typography system', 'A simple hierarchy for headlines, body copy, buttons, labels, forms, and reusable components.')}
      <div class="grid-3">${typeCards}</div>
      <div class="specimen"><strong>${escapeHtml(sampleHeadline(guidelines))}</strong><p>${escapeHtml(guidelines.brandIdea)}</p></div>
      ${footer(guidelines.brandName, 'Typography')}
    </section>

    <section class="sheet">
      ${pageHeader('05', 'Imagery and voice', 'Image direction and copy rules to avoid generic production language and keep the site client-facing.')}
      <div class="grid-2">
        <article class="panel"><p class="label">Imagery rules</p>${renderList(guidelines.imageryStyle)}</article>
        <article class="panel"><p class="label">Copy should do this</p>${renderList(guidelines.voiceAndTone.do)}</article>
      </div>
      <div class="panel" style="margin-top:8mm"><p class="label">Copy should avoid</p>${renderList(guidelines.voiceAndTone.avoid)}</div>
      ${footer(guidelines.brandName, 'Imagery')}
    </section>

    <section class="sheet">
      ${pageHeader('06', 'Components and accessibility', 'Implementation guidance for the Builder Agent and QA checks before the client sees a preview.')}
      <div class="grid-2">${componentCards}</div>
      <div class="grid-2" style="margin-top:8mm">
        <article class="panel panel--dark"><p class="label">Contrast standard</p><p class="body-copy" style="color:rgba(255,255,255,.82)">${escapeHtml(guidelines.accessibility.contrastStandard)}</p></article>
        <article class="panel"><p class="label">Accessibility rules</p>${renderList(guidelines.accessibility.rules)}</article>
      </div>
      ${footer(guidelines.brandName, 'Components')}
    </section>

    <section class="sheet">
      ${pageHeader('07', 'Production checklist', 'A compact handoff checklist for designers, builders, and reviewers.')}
      <div class="grid-2">
        <article class="panel"><p class="label">Use this</p>${renderList(guidelines.usageDos)}</article>
        <article class="panel"><p class="label">Avoid this</p>${renderList(guidelines.usageDonts)}</article>
      </div>
      <div class="panel panel--tint" style="margin-top:9mm">
        <p class="label">Builder handoff</p>
        <p class="large-statement">Use these guidelines as the client-facing source of truth for design tokens, imagery, copy tone, and component polish.</p>
      </div>
      ${footer(guidelines.brandName, 'Checklist')}
    </section>
  </main>
</body>
</html>`;
}

async function renderPdfFromHtml(htmlPath: string, pdfPath: string, guidelines: BrandGuidelines): Promise<void> {
  const browser = await findBrowserExecutable();
  if (!browser) {
    await writeFile(pdfPath, renderFallbackPdf(guidelines));
    return;
  }
  const fileUrl = pathToFileURL(htmlPath).href;
  const attempts = [
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--print-to-pdf-no-header', `--print-to-pdf=${pdfPath}`, fileUrl],
    ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--print-to-pdf-no-header', `--print-to-pdf=${pdfPath}`, fileUrl]
  ];
  for (const args of attempts) {
    try {
      await execFile(browser, args, { timeout: 45000, windowsHide: true });
      return;
    } catch {
      // Try the next headless mode before falling back.
    }
  }
  await writeFile(pdfPath, renderFallbackPdf(guidelines));
}

async function findBrowserExecutable(): Promise<string | undefined> {
  const candidates = [
    process.env.BRAND_GUIDELINES_BROWSER,
    path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Keep looking.
    }
  }
  return undefined;
}

function renderColorRow(color: BrandGuidelinesColor, index: number): string {
  return `<article class="color-row">
    <div class="chip" style="background:${escapeAttr(color.hex)}"></div>
    <div>
      <p class="color-name">${String(index + 1).padStart(2, '0')} ${escapeHtml(color.name)}</p>
      <p class="color-meta">${escapeHtml(color.hex)} - ${escapeHtml(color.usage)}</p>
    </div>
    <div class="contrast-badge">${color.contrastOnWhite.toFixed(2)} / ${color.contrastOnDark.toFixed(2)}</div>
  </article>`;
}

function pageHeader(folio: string, title: string, intro: string): string {
  return `<header class="page-title"><div><p class="folio">${folio}</p><h2>${escapeHtml(title)}</h2><p class="intro">${escapeHtml(intro)}</p></div></header>`;
}

function footer(brandName: string, section: string): string {
  return `<footer class="footer-note"><span>${escapeHtml(brandName)} brand guidelines</span><span>${escapeHtml(section)}</span></footer>`;
}

function renderList(items: string[]): string {
  return `<ul class="list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function sampleHeadline(guidelines: BrandGuidelines): string {
  if (/drink|fruit|juice|beverage|flavour|flavor/i.test(`${guidelines.businessType} ${guidelines.brandIdea}`)) return 'Fresh flavour, clear action.';
  if (/agency|studio|consult/i.test(guidelines.businessType)) return 'A sharper system for better client work.';
  if (/software|saas|ai|tech/i.test(guidelines.businessType)) return 'Complex work, made calm.';
  return 'Distinct, useful, and built to convert.';
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'B';
}

function renderFallbackPdf(guidelines: BrandGuidelines): Buffer {
  const page = [
    '0.95 0.95 0.92 rg 0 0 612 792 re f',
    pdfText(56, 706, 34, 'F2', guidelines.brandName),
    pdfText(56, 662, 18, 'F1', 'Brand identity guidelines'),
    ...wrappedPdfText(56, 620, 12, 72, `${guidelines.creativeDirection}: ${guidelines.brandIdea}`),
    pdfText(56, 512, 18, 'F2', 'Colour system'),
    ...guidelines.colors.slice(0, 6).flatMap((color, index) => {
      const y = 472 - index * 44;
      const [r, g, b] = hexRgb(color.hex);
      return [`${r} ${g} ${b} rg 56 ${y - 18} 24 24 re f`, '0 0 0 rg', pdfText(92, y, 10, 'F1', `${color.name} ${color.hex} - ${color.usage}`)];
    })
  ].join('\n');
  return buildSimplePdf([page]);
}

function buildSimplePdf(pageContents: string[]): Buffer {
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers = pageContents.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map(num => `${num} 0 R`).join(' ')}] /Count ${pageContents.length} >>`);
  for (const [index, content] of pageContents.entries()) {
    const pageNum = 3 + index * 2;
    const contentNum = pageNum + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentNum} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
  }
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function pdfText(x: number, y: number, size: number, font: 'F1' | 'F2', text: string): string {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`;
}

function wrappedPdfText(x: number, y: number, size: number, maxChars: number, text: string): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 8).map((line, index) => pdfText(x, y - index * (size + 7), size, 'F1', line));
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexRgb(hex).map(channel => {
    const value = channel;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(char => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function escapePdf(value: string): string {
  return value.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '');
}
