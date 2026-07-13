import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type ScreenshotViewport = 'desktop' | 'tablet' | 'mobile';

export interface ScreenshotCaptureResult {
  viewport: ScreenshotViewport;
  absolutePath?: string;
  publicUrl?: string;
  captured: boolean;
  error?: string;
}

const viewports: Record<ScreenshotViewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 }
};

export class HeadlessScreenshotService {
  constructor(private readonly workspaceRoot: string = process.cwd()) {}

  async capture(input: { projectId?: string; url: string; viewport?: ScreenshotViewport; baseUrl?: string }): Promise<ScreenshotCaptureResult> {
    const viewport = input.viewport || 'desktop';
    const browserPath = await findBrowserExecutable();
    if (!browserPath) {
      return { viewport, captured: false, error: 'No Chrome or Edge executable was found for headless screenshot capture.' };
    }

    const targetUrl = resolveTargetUrl(input.url, input.baseUrl);
    const projectId = safeSegment(input.projectId || 'general');
    const directory = path.join(this.workspaceRoot, 'public', 'generated-screenshots', projectId);
    const fileName = `${viewport}-${Date.now()}.png`;
    const absolutePath = path.join(directory, fileName);
    await fs.mkdir(directory, { recursive: true });

    const { width, height } = viewports[viewport];
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      `--screenshot=${absolutePath}`,
      targetUrl
    ];

    const result = await runBrowser(browserPath, args, 35000);
    if (result.error) {
      await fs.rm(absolutePath, { force: true }).catch(() => undefined);
      return { viewport, captured: false, error: result.error };
    }

    const stat = await fs.stat(absolutePath).catch(() => undefined);
    if (!stat?.size) {
      return { viewport, captured: false, error: 'Browser finished without writing a screenshot.' };
    }

    const publicUrl = `/generated-screenshots/${projectId}/${fileName}`;
    return { viewport, absolutePath, publicUrl, captured: true };
  }
}

export function fallbackScreenshotSvg(viewport: ScreenshotViewport = 'desktop'): string {
  const { width, height } = viewports[viewport];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc"/><rect x="${width * 0.07}" y="${height * 0.08}" width="${width * 0.86}" height="${height * 0.78}" rx="28" fill="#111827"/><rect x="${width * 0.12}" y="${height * 0.15}" width="${width * 0.36}" height="${height * 0.07}" rx="16" fill="#e5e7eb" opacity=".9"/><rect x="${width * 0.12}" y="${height * 0.28}" width="${width * 0.55}" height="${height * 0.025}" rx="10" fill="#cbd5e1" opacity=".75"/><rect x="${width * 0.12}" y="${height * 0.33}" width="${width * 0.45}" height="${height * 0.025}" rx="10" fill="#cbd5e1" opacity=".55"/><rect x="${width * 0.12}" y="${height * 0.44}" width="${width * 0.2}" height="${height * 0.075}" rx="22" fill="#3157d5"/><rect x="${width * 0.36}" y="${height * 0.44}" width="${width * 0.2}" height="${height * 0.075}" rx="22" fill="#ffffff" opacity=".16"/><rect x="${width * 0.64}" y="${height * 0.15}" width="${width * 0.2}" height="${height * 0.46}" rx="30" fill="#ffffff" opacity=".12"/><circle cx="${width * 0.78}" cy="${height * 0.31}" r="${Math.min(width, height) * 0.08}" fill="#ffffff" opacity=".16"/></svg>`;
}

function resolveTargetUrl(url: string, baseUrl?: string): string {
  try {
    return new URL(url, baseUrl || 'http://localhost:3000').toString();
  } catch {
    return 'http://localhost:3000/';
  }
}

async function findBrowserExecutable(): Promise<string | undefined> {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.EDGE_PATH,
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    os.platform() === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    os.platform() === 'linux' ? '/usr/bin/google-chrome' : undefined,
    os.platform() === 'linux' ? '/usr/bin/chromium-browser' : undefined,
    os.platform() === 'linux' ? '/usr/bin/chromium' : undefined
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return undefined;
}

function runBrowser(command: string, args: string[], timeoutMs: number): Promise<{ error?: string }> {
  return new Promise(resolve => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ error: `Screenshot browser timed out after ${timeoutMs}ms.` });
    }, timeoutMs);

    child.stderr.on('data', chunk => {
      stderr += String(chunk).slice(0, 1000);
    });
    child.on('error', error => {
      clearTimeout(timer);
      resolve({ error: error.message });
    });
    child.on('exit', code => {
      clearTimeout(timer);
      resolve(code === 0 ? {} : { error: stderr || `Browser exited with code ${code}.` });
    });
  });
}

async function exists(filePath: string): Promise<boolean> {
  return Boolean(filePath) && Boolean(await fs.stat(filePath).catch(() => undefined));
}

function safeSegment(value: string): string {
  return value.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}
